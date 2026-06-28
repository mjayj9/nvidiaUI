import { RequestLogger } from "./requestLogger";

export const NIM_BASE_URL = "/api/nim";

export const getApiEndpoint = (modelId: string, type: "TEXT" | "VISION" | "SPECIAL") => {
  return `/api/nim/chat`;
};

export interface NimMetrics {
  ttft: number; // ms
  totalTime: number; // ms
  tokens: number; // count
  tps: number; // tokens per second
}

export const chatWithNvidiaObject = async (
  apiKey: string,
  model: string,
  messages: { role: string; content: any }[],
  onUpdate: (chunk: string) => void,
  options?: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    systemPrompt?: string;
    responseFormat?: string;
    toolsJson?: string;
    reasoning_effort?: string;
    stop?: string | string[];
    seed?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    abortSignal?: AbortSignal;
    onMetrics?: (metrics: NimMetrics) => void;
  },
) => {
  const startTime = Date.now();
  let firstTokenTime = 0;
  let estimatedTokens = 0;
  let usageTokens = 0;

  const reqId = "req_" + Math.random().toString(36).substring(2, 11);
  const endpoint = getApiEndpoint(model, "TEXT");

  const finalMessages = [...messages];
  if (options?.systemPrompt) {
    finalMessages.unshift({ role: "system", content: options.systemPrompt });
  }

  const bodyObj: any = {
    model,
    messages: finalMessages,
    temperature: options?.temperature ?? 0.5,
    stream: true,
    stream_options: { include_usage: true },
  };

  if (options?.maxTokens) bodyObj.max_tokens = options.maxTokens;
  if (options?.topP) bodyObj.top_p = options.topP;
  if (options?.reasoning_effort) bodyObj.reasoning_effort = options.reasoning_effort;
  if (options?.stop) bodyObj.stop = typeof options.stop === 'string' ? [options.stop] : options.stop;
  if (options?.seed !== undefined) bodyObj.seed = options.seed;
  if (options?.frequencyPenalty !== undefined) bodyObj.frequency_penalty = options.frequencyPenalty;
  if (options?.presencePenalty !== undefined) bodyObj.presence_penalty = options.presencePenalty;

  if (options?.responseFormat === "json_object") {
    bodyObj.response_format = { type: "json_object" };
  }
  if (options?.toolsJson) {
    try {
      const tools = JSON.parse(options.toolsJson);
      if (Array.isArray(tools) && tools.length > 0) {
        bodyObj.tools = tools;
      }
    } catch (e) {
      console.warn("Failed to parse tools JSON", e);
    }
  }

  // Log request initiation
  RequestLogger.logRequest({
    id: reqId,
    timestamp: startTime,
    model,
    endpoint,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": apiKey ? `Bearer ${apiKey.substring(0, 12)}...` : "None"
    },
    requestBody: bodyObj,
    streamingChunks: []
  });

  try {
    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyObj),
      signal: options?.abortSignal,
    });

    if (res.status === 404) {
      console.warn("Express backend chat proxy returned 404. Falling back to direct browser-to-NVIDIA API call.");
      res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(bodyObj),
        signal: options?.abortSignal,
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      let msg = errorText;
      try {
        const json = JSON.parse(errorText);
        if (json.error) msg = json.error;
      } catch (e) {}
      throw new Error(`API Error: ${res.status} ${msg}`);
    }

    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let inThinkingMode = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        if (!firstTokenTime) {
          firstTokenTime = Date.now();
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line === "data: [DONE]") break;
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              const delta = data.choices?.[0]?.delta;
              const content = delta?.content || "";
              const reasoning = delta?.reasoning_content || "";

              if (reasoning) {
                if (!inThinkingMode) {
                  onUpdate("<think>\n");
                  inThinkingMode = true;
                }
                onUpdate(reasoning);
                RequestLogger.updateResponse(reqId, { streamingChunks: [reasoning] });
                estimatedTokens += Math.max(1, Math.ceil(reasoning.length / 4));
              } else if (content) {
                if (inThinkingMode) {
                  onUpdate("\n</think>\n\n");
                  inThinkingMode = false;
                }
                onUpdate(content);
                RequestLogger.updateResponse(reqId, { streamingChunks: [content] });
                estimatedTokens += Math.max(1, Math.ceil(content.length / 4));
              }

              if (data.usage?.completion_tokens) {
                usageTokens = data.usage.completion_tokens;
              }
            } catch (e) {
              console.error("Error parsing JSON stream chunk", e);
            }
          }
        }
      }
    }

    if (inThinkingMode) {
      onUpdate("\n</think>\n\n");
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const ttft = firstTokenTime ? firstTokenTime - startTime : totalTime;
    const finalTokens = usageTokens > 0 ? usageTokens : estimatedTokens;
    const tps = totalTime > 0 ? (finalTokens / (totalTime / 1000)) : 0;
    const finalTps = Number(tps.toFixed(1));

    const metricsObj = {
      ttft,
      totalTime,
      tokens: finalTokens,
      tps: finalTps
    };

    if (options?.onMetrics) {
      options.onMetrics(metricsObj);
    }

    // Log request completion details
    RequestLogger.updateResponse(reqId, {
      responseStatus: res.status,
      tokenUsage: {
        promptTokens: Math.round(JSON.stringify(bodyObj.messages).length / 4),
        completionTokens: finalTokens,
        totalTokens: Math.round(JSON.stringify(bodyObj.messages).length / 4) + finalTokens,
      },
      metrics: {
        ttft,
        totalTime,
        tps: finalTps,
        tokens: finalTokens
      }
    });

  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Generation aborted by user");
      RequestLogger.updateResponse(reqId, {
        responseStatus: 499,
        error: "Generation aborted by user"
      });
      return;
    }
    console.error("NVIDIA API call failed", error);
    RequestLogger.updateResponse(reqId, {
      responseStatus: 500,
      error: error.message || String(error)
    });
    throw error;
  }
};

