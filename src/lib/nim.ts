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

  try {
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

    const endpoint = getApiEndpoint(model, "TEXT");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyObj),
      signal: options?.abortSignal,
    });

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
              const content = data.choices?.[0]?.delta?.content || "";
              if (content) {
                estimatedTokens += Math.max(1, Math.ceil(content.length / 4));
                onUpdate(content);
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
    
    if (options?.onMetrics) {
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const ttft = firstTokenTime ? firstTokenTime - startTime : totalTime;
      const finalTokens = usageTokens > 0 ? usageTokens : estimatedTokens;
      const tps = totalTime > 0 ? (finalTokens / (totalTime / 1000)) : 0;
      options.onMetrics({
        ttft,
        totalTime,
        tokens: finalTokens,
        tps: Number(tps.toFixed(1))
      });
    }

  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Generation aborted by user");
      return;
    }
    console.error("NVIDIA API call failed", error);
    throw error;
  }
};
