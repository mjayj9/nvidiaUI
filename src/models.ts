import { modelRegistry, ModelRegistryItem } from "./lib/modelRegistry";

export const NIM_MODELS = modelRegistry.map(m => ({
  id: m.id,
  name: m.fullName || m.displayName || m.id,
  brand: m.provider,
  type: m.capabilities.includes("specialized") ? "SPECIAL" : m.capabilities.includes("vision") ? "VISION" : "TEXT",
  hasThinking: m.capabilities.includes("reasoning")
}));

export function getModelType(modelId: string): "TEXT" | "VISION" | "SPECIAL" {
  const model = modelRegistry.find((m) => m.id === modelId);
  if (!model) return "TEXT";
  if (model.capabilities.includes("specialized")) return "SPECIAL";
  if (model.capabilities.includes("vision")) return "VISION";
  return "TEXT";
}

export function hasThinkingMode(modelId: string): boolean {
  const model = modelRegistry.find((m) => m.id === modelId);
  return model ? model.capabilities.includes("reasoning") : false;
}
