import { modelRegistry } from "./lib/modelRegistry";

export function getModelType(modelId: string): "TEXT" | "VISION" | "SPECIAL" {
  const model = modelRegistry.find((m) => m.id === modelId);
  if (!model) return "TEXT";

  const caps = model.capabilities;
  
  // 1. SPECIAL models: embedding, ranking, safety filters, biology, transcription/audio utility models
  if (
    caps.includes("specialized") ||
    caps.includes("embedding") ||
    caps.includes("reranking") ||
    caps.includes("pii") ||
    caps.includes("safety") ||
    caps.includes("detection") ||
    caps.includes("asr") ||
    caps.includes("tts") ||
    model.outputType === "vector" ||
    model.outputType === "specialized" ||
    model.outputType === "audio" ||
    model.transport === "openai-embedding" ||
    model.transport === "rerank-http" ||
    model.acceptedInputs.includes("audio")
  ) {
    return "SPECIAL";
  }

  // 2. VISION/MULTIMEDIA models: image gen, video gen, video understanding, vision-language
  if (
    caps.includes("vision") ||
    caps.includes("image-generation") ||
    caps.includes("image-editing") ||
    caps.includes("video-understanding") ||
    caps.includes("video-generation") ||
    model.outputType === "image" ||
    model.outputType === "video" ||
    model.acceptedInputs.includes("image") ||
    model.acceptedInputs.includes("video")
  ) {
    return "VISION";
  }

  // 3. PURE TEXT models: standard chat/reasoning text models
  return "TEXT";
}

export const NIM_MODELS = modelRegistry.map(m => ({
  id: m.id,
  name: m.fullName || m.displayName || m.id,
  brand: m.provider,
  type: getModelType(m.id),
  hasThinking: m.capabilities.includes("reasoning"),
  capabilities: m.capabilities
}));

export function hasThinkingMode(modelId: string): boolean {
  const model = modelRegistry.find((m) => m.id === modelId);
  return model ? model.capabilities.includes("reasoning") : false;
}
