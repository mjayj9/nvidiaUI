import { useState, useEffect, useRef } from "react";
import {
  X,
  Key,
  Cpu,
  ExternalLink,
  Tag,
  ChevronDown,
  Check,
  Download,
  Clock,
} from "lucide-react";
import { modelRegistry, ModelRegistryItem } from "../lib/modelRegistry";

interface SettingsModalProps {
  apiKey: string;
  model: string;
  onSave: (apiKey: string, model: string) => void;
  onClose: () => void;
}

export default function SettingsModal({
  apiKey: initialKey,
  model: initialModel,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [key, setKey] = useState(initialKey);
  const [model, setModel] = useState(initialModel);
  const [availableModels] = useState<ModelRegistryItem[]>(modelRegistry);

  const handleSave = () => {
    onSave(key, model);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value);
  };

  const selectedModelInfo =
    availableModels.find((m) => m.id === model) || availableModels[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h3 className="text-lg font-semibold text-white">Settings</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-6 scrollbar-thin">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Key className="w-4 h-4" />
              NVIDIA NIM API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={handleKeyChange}
              placeholder="nvapi-..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
            />
            <p className="text-xs text-neutral-500 flex items-center gap-1">
              Get an API key from{" "}
              <a
                href="https://build.nvidia.com/"
                target="_blank"
                rel="noreferrer"
                className="text-green-500 hover:underline inline-flex items-center gap-0.5"
              >
                build.nvidia.com <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-medium text-neutral-300">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Model Selection
              </div>
            </label>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 hover:border-neutral-600 rounded-lg px-4 py-3 text-white transition outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              {Array.from(new Set(availableModels.map(m => m.provider))).map(provider => (
                <optgroup key={provider} label={provider}>
                  {availableModels.filter(m => m.provider === provider).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName || m.id} {m.capabilities.includes("reasoning") ? "(Thinking)" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {selectedModelInfo && (
                <div className="mt-4 p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-neutral-300">
                        {selectedModelInfo.fullName || selectedModelInfo.id}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                      {selectedModelInfo.outputType === "text" ? "TEXT" : selectedModelInfo.outputType.toUpperCase()}
                    </span>
                  </div>
                  {selectedModelInfo.description && (
                    <p className="mt-2 mb-3 text-xs text-neutral-400 leading-relaxed bg-neutral-900 p-2.5 rounded border border-neutral-800">
                      {selectedModelInfo.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                    The interface will dynamically adapt its features based
                    on this model's capabilities.
                    {selectedModelInfo.capabilities.includes("vision") &&
                      " As a Vision model, image attachments will be enabled."}
                    {selectedModelInfo.capabilities.includes("reasoning") &&
                      " As a Reasoning model, step-by-step thinking logs will be captured."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedModelInfo.capabilities.map(cap => (
                      <span key={cap} className="px-2 py-1 bg-neutral-800 text-xs rounded text-neutral-300">{cap}</span>
                    ))}
                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">{selectedModelInfo.transport}</span>
                  </div>
                </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-neutral-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition shadow-sm"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
