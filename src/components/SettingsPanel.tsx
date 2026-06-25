import { Activity, Check, CheckCircle2, Cpu, ExternalLink, Key, Loader2, Play, Plus, Server, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { modelRegistry, ModelRegistryItem } from "../lib/modelRegistry";

interface SettingsPanelProps {
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
  selectedModel: string;
  onUpdateModel: (model: string) => void;
}

export default function SettingsPanel({
  apiKey: initialKey,
  onUpdateApiKey,
  selectedModel,
  onUpdateModel,
}: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [ngcKey, setNgcKey] = useState(() => localStorage.getItem("ngc_api_key") || "");
  const [selfHostedBase, setSelfHostedBase] = useState(() => localStorage.getItem("self_hosted_nim_base_url") || "");
  
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [testMessage, setTestMessage] = useState("");

  const [models, setModels] = useState<ModelRegistryItem[]>(modelRegistry);
  const [searchModelQuery, setSearchModelQuery] = useState("");
  const [selectedRegistryModel, setSelectedRegistryModel] = useState<ModelRegistryItem | null>(null);

  // Model creation modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newModel, setNewModel] = useState<Partial<ModelRegistryItem>>({
    id: "",
    fullName: "",
    provider: "custom",
    capabilities: ["chat"],
    transport: "openai-chat",
    deployment: ["hosted"],
    supportsStreaming: true,
    supportsTools: false,
    supportsStructuredOutput: false,
    acceptedInputs: ["text"],
    outputType: "text",
    apiBaseEnv: "NVIDIA_API_BASE_URL",
    enabled: true,
  });

  const saveApiSettings = () => {
    localStorage.setItem("ngc_api_key", ngcKey);
    localStorage.setItem("self_hosted_nim_base_url", selfHostedBase);
    onUpdateApiKey(apiKey);

    // Show saved notification toast
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg z-50 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4";
    toast.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Settings updated successfully`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 350);
    }, 2500);
  };

  const testConnection = async () => {
    if (!apiKey) {
      alert("Configure your API key first before testing connections.");
      return;
    }
    setTestStatus("testing");
    setTestMessage("");

    try {
      const res = await fetch("/api/nim/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (res.ok) {
        setTestStatus("success");
        setTestMessage("API validation successful. Hosted DGX endpoints responsive.");
      } else {
        const text = await res.text();
        throw new Error(`API returned status ${res.status}: ${text.slice(0, 80)}`);
      }
    } catch (e: any) {
      console.error(e);
      setTestStatus("failed");
      setTestMessage(e.message);
    }
  };

  const handleAddModel = () => {
    if (!newModel.id) {
      alert("Please provide a Model ID.");
      return;
    }
    const modelToRegister: ModelRegistryItem = {
      id: newModel.id,
      displayName: newModel.fullName || newModel.id,
      fullName: newModel.fullName || newModel.id,
      provider: newModel.provider || "custom",
      capabilities: newModel.capabilities || ["chat"],
      transport: newModel.transport || "openai-chat",
      deployment: newModel.deployment || ["hosted"],
      supportsStreaming: !!newModel.supportsStreaming,
      supportsTools: !!newModel.supportsTools,
      supportsStructuredOutput: !!newModel.supportsStructuredOutput,
      acceptedInputs: newModel.acceptedInputs || ["text"],
      outputType: newModel.outputType || "text",
      apiBaseEnv: newModel.apiBaseEnv || "NVIDIA_API_BASE_URL",
      apiKeyEnv: newModel.apiKeyEnv || "NVIDIA_API_KEY",
      enabled: true,
      description: "Custom registered NIM endpoint.",
    };

    setModels((prev) => [modelToRegister, ...prev]);
    setIsAddOpen(false);
    
    // In a real app we'd save this to backend, for this playground, adding it to the state list works!
    alert(`Registered model ${modelToRegister.id} to workspace list.`);
  };

  const deleteModel = (id: string) => {
    if (window.confirm(`Delete model ${id} from workspace registry?`)) {
      setModels((prev) => prev.filter((m) => m.id !== id));
      if (selectedRegistryModel?.id === id) {
        setSelectedRegistryModel(null);
      }
    }
  };

  const filteredModels = models.filter(
    (m) =>
      m.id.toLowerCase().includes(searchModelQuery.toLowerCase()) ||
      (m.fullName || "").toLowerCase().includes(searchModelQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchModelQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex bg-neutral-950 text-neutral-100 overflow-hidden h-full">
      {/* Left panel: keys & overrides */}
      <div className="w-1/2 border-r border-neutral-900 flex flex-col h-full bg-neutral-950">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-[#76b900]" />
            NIM Workspace Config
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed -mt-3">
            NVIDIA NIM serves containerized microservices across DGX Cloud or local clusters. Ensure your keys match the environment mappings.
          </p>

          {/* Key 1: NVIDIA_API_KEY */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4" />
              NVIDIA Hosted API Key (DGX Cloud)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="nvapi-..."
              className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition"
            />
            <p className="text-[10px] text-neutral-500">
              DGX Cloud endpoints validate requests using this key. Generate a trial key from{" "}
              <a
                href="https://build.nvidia.com/"
                target="_blank"
                rel="noreferrer"
                className="text-green-500 hover:underline inline-flex items-center gap-0.5"
              >
                build.nvidia.com <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {/* Key 2: NGC Container key */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4" />
              NGC Registry API Key (Container Downloads)
            </label>
            <input
              type="password"
              value={ngcKey}
              onChange={(e) => setNgcKey(e.target.value)}
              placeholder="nvapi-..."
              className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition"
            />
            <p className="text-[10px] text-neutral-500">
              Used when pulling downloadable NIM containers locally on GPU setups.
            </p>
          </div>

          {/* Base URL: Self-Hosted override */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4" />
              Self-Hosted NIM Base URL Override
            </label>
            <input
              type="text"
              value={selfHostedBase}
              onChange={(e) => setSelfHostedBase(e.target.value)}
              placeholder="http://내부-NIM-서버:8000"
              className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition"
            />
            <p className="text-[10px] text-neutral-500">
              Leave blank to fetch hosted DGX endpoints by default. Add URL if proxying local NIM installations.
            </p>
          </div>

          {/* Connection Test */}
          <div className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Test Connections</span>
              <button
                onClick={testConnection}
                disabled={testStatus === "testing"}
                className="text-[10px] font-bold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white rounded transition flex items-center gap-1.5"
              >
                {testStatus === "testing" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                Validate Keys
              </button>
            </div>

            {testStatus === "testing" && (
              <span className="text-xs text-neutral-500 italic block">Auditing DGX endpoints...</span>
            )}
            {testStatus === "success" && (
              <div className="flex items-start gap-2 text-xs text-green-400 font-semibold bg-green-500/10 p-2.5 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{testMessage}</span>
              </div>
            )}
            {testStatus === "failed" && (
              <div className="flex items-start gap-2 text-xs text-red-400 font-semibold bg-red-500/10 p-2.5 border border-red-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Validation failed: {testMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action triggers */}
        <div className="p-6 border-t border-neutral-900 bg-neutral-950 shrink-0 flex gap-3 justify-end">
          <button
            onClick={saveApiSettings}
            className="px-6 py-2.5 bg-[#76b900] hover:bg-[#66a000] text-black font-semibold rounded-lg text-sm transition shadow-lg"
          >
            Save configurations
          </button>
        </div>
      </div>

      {/* Right panel: Registered models explorer */}
      <div className="w-1/2 flex flex-col h-full bg-neutral-900/10">
        <div className="p-4 border-b border-neutral-900 flex justify-between items-center bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#76b900]" />
            <span className="text-sm font-semibold text-white">Model Registry ({models.length})</span>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-[10px] font-bold px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded border border-neutral-800 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add NIM
          </button>
        </div>

        {/* Search registry */}
        <div className="p-4 border-b border-neutral-900">
          <input
            type="text"
            value={searchModelQuery}
            onChange={(e) => setSearchModelQuery(e.target.value)}
            placeholder="Search registered models..."
            className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition"
          />
        </div>

        {/* Models list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin">
          {filteredModels.map((m) => {
            const isSelected = selectedRegistryModel?.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedRegistryModel(isSelected ? null : m)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                  isSelected
                    ? "border-[#76b900]/50 bg-[#76b900]/5"
                    : "border-neutral-900 hover:border-neutral-800 bg-neutral-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 pr-12">
                    <span className="text-xs font-bold text-white block truncate">{m.fullName || m.id}</span>
                    <span className="text-[10px] text-neutral-500 font-mono block uppercase">{m.provider} • ID: {m.id}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModel(m.id);
                    }}
                    className="absolute right-3 top-3 text-neutral-600 hover:text-red-400 transition"
                    title="Delete model specifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-neutral-800/60 space-y-3 font-mono text-[10px] text-neutral-400 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-neutral-600 uppercase block">Transport</span>
                        <span className="text-white">{m.transport}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600 uppercase block">Output Type</span>
                        <span className="text-white">{m.outputType}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600 uppercase block">Deployment</span>
                        <span className="text-white">{m.deployment.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600 uppercase block">Streaming</span>
                        <span className="text-white">{m.supportsStreaming ? "Supported" : "No"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {m.capabilities.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[9px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Model registration overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-850 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <span className="text-sm font-semibold text-white">Register custom NIM</span>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs scrollbar-thin">
              <div className="space-y-1">
                <label className="text-neutral-500 uppercase font-semibold">Model ID</label>
                <input
                  type="text"
                  value={newModel.id}
                  onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                  placeholder="meta/llama-3.2-3b-instruct"
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-500 uppercase font-semibold">Model Display Name</label>
                <input
                  type="text"
                  value={newModel.fullName}
                  onChange={(e) => setNewModel({ ...newModel, fullName: e.target.value })}
                  placeholder="Llama 3.2 3B Instruct"
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-500 uppercase font-semibold block">Provider</label>
                  <input
                    type="text"
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-500 uppercase font-semibold block">Transport</label>
                  <select
                    value={newModel.transport}
                    onChange={(e) => setNewModel({ ...newModel, transport: e.target.value as any })}
                    className="w-full bg-[#0d0d0d] border border-neutral-800 rounded px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="openai-chat">openai-chat</option>
                    <option value="openai-embedding">openai-embedding</option>
                    <option value="rerank-http">rerank-http</option>
                    <option value="openai-image">openai-image</option>
                    <option value="http">http</option>
                    <option value="grpc">grpc</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModel}
                className="px-4 py-2 bg-[#76b900] hover:bg-[#66a000] text-black font-semibold rounded text-xs transition"
              >
                Register Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
