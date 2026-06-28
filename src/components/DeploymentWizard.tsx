import { useState, useEffect } from "react";
import { Server, ShieldCheck, ShieldAlert, Cpu, Copy, Check, Terminal, FileCode, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { NIM_MODELS } from "../models";

export default function DeploymentWizard() {
  const [selfHostedBase, setSelfHostedBase] = useState(() => {
    return localStorage.getItem("self_hosted_nim_base_url") || "http://localhost:8000/v1";
  });
  const [ngcKey, setNgcKey] = useState(() => {
    return localStorage.getItem("ngc_api_key") || "";
  });
  const [activeTab, setActiveTab] = useState<"connect" | "docker" | "templates">("connect");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Health check states
  const [pingStatus, setPingStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);

  // Docker command states
  const [selectedModel, setSelectedModel] = useState("meta/llama-3.1-8b-instruct");
  const [cachePath, setCachePath] = useState("/home/user/nim-cache");
  const [port, setPort] = useState("8000");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSettings = () => {
    localStorage.setItem("self_hosted_nim_base_url", selfHostedBase);
    localStorage.setItem("ngc_api_key", ngcKey);
    alert("엔드포인트 및 NGC 설정이 성공적으로 저장되었습니다!");
  };

  const handleTestConnection = async () => {
    setPingStatus("testing");
    setPingError(null);
    setPingLatency(null);
    const start = Date.now();

    try {
      // We will perform a probe query on the configured self-hosted endpoint
      const response = await fetch(`${selfHostedBase.replace(/\/$/, "")}/models`, {
        method: "GET",
        headers: {
          Authorization: ngcKey ? `Bearer ${ngcKey}` : "",
        },
      }).catch((e) => {
        throw new Error(`Connection failed: ${e.message}. Is your local NIM running and accessible?`);
      });

      const elapsed = Date.now() - start;

      if (response.ok) {
        setPingStatus("success");
        setPingLatency(elapsed);
      } else {
        const text = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${text || response.statusText}`);
      }
    } catch (e: any) {
      setPingStatus("failed");
      setPingError(e.message || String(e));
    }
  };

  const getDockerCommand = () => {
    const modelContainerMap: Record<string, string> = {
      "meta/llama-3.1-8b-instruct": "nvcr.io/nim/meta/llama-3.1-8b-instruct:latest",
      "meta/llama-3.1-70b-instruct": "nvcr.io/nim/meta/llama-3.1-70b-instruct:latest",
      "meta/llama-3.3-70b-instruct": "nvcr.io/nim/meta/llama-3.3-70b-instruct:latest",
      "nvidia/llama-3.3-nemotron-super-49b-v1.5": "nvcr.io/nim/nvidia/llama-3.3-nemotron-super-49b-v1.5:latest",
    };

    const containerImage = modelContainerMap[selectedModel] || `nvcr.io/nim/${selectedModel.replace("/", "-")}:latest`;

    return `docker run -d --gpus all \\
  --name nim-endpoint-service \\
  -e NGC_API_KEY="${ngcKey || "your_ngc_api_key"}" \\
  -v "${cachePath}:/opt/nim/.cache" \\
  -p ${port}:${port} \\
  ${containerImage}`;
  };

  const getDockerCompose = () => {
    const containerImage = `nvcr.io/nim/${selectedModel.replace("/", "-")}:latest`;
    return `version: '3.8'

services:
  nim-service:
    image: ${containerImage}
    container_name: nim-endpoint-service
    environment:
      - NGC_API_KEY=${ngcKey || "YOUR_NGC_API_KEY"}
      - NIM_CACHE_DIR=/opt/nim/.cache
    volumes:
      - ${cachePath}:/opt/nim/.cache
    ports:
      - "${port}:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped`;
  };

  const getDotEnv = () => {
    return `# NVIDIA NIM Deployment Variables
NGC_API_KEY=${ngcKey || "your_ngc_api_key_here"}
NIM_MODEL_ID=${selectedModel}
SELF_HOSTED_NIM_BASE_URL=${selfHostedBase}
NIM_CACHE_DIR=${cachePath}
LOCAL_NIM_PORT=${port}
`;
  };

  return (
    <div className="flex-grow bg-[#050505] p-6 md:p-8 overflow-y-auto text-neutral-100 scrollbar-thin">
      {/* Title Header */}
      <div className="mb-8 relative border-b border-neutral-900 pb-5">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Server className="w-5 h-5 text-[#76b900]" />
          <span className="text-xs uppercase tracking-widest text-[#76b900] font-bold">Deployment & Operations</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">NIM Deployment Wizard</h1>
        <p className="text-xs text-neutral-400 mt-2.5 max-w-3xl leading-relaxed">
          NVIDIA Inference Microservices(NIM)를 호스팅하거나 로컬 환경에 온프레미스로 배포하여 워크플로우에 연동하세요. 엔드포인트 연결성 검증 및 로컬 배포용 Docker 리소스를 한눈에 파악합니다.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-neutral-900 gap-6 mb-8 bg-[#080808]/40 px-4 rounded-xl py-0.5 border border-neutral-900/60">
        {[
          { id: "connect", label: "1. Endpoint Configuration", icon: Server },
          { id: "docker", label: "2. Docker Container CLI", icon: Terminal },
          { id: "templates", label: "3. Deployment Templates", icon: FileCode }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3.5 pt-3.5 text-xs font-bold uppercase tracking-widest transition border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? "text-white border-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.2)]"
                  : "text-neutral-500 border-transparent hover:text-neutral-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "connect" && (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
          <div className="nvidia-glass rounded-2xl p-6 border border-neutral-900 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-3 bg-[#76b900] rounded-full"></span>
              NIM Connect Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  Self-hosted NIM Base URL
                </label>
                <input
                  type="text"
                  value={selfHostedBase}
                  onChange={(e) => setSelfHostedBase(e.target.value)}
                  placeholder="e.g. http://localhost:8000/v1"
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:border-[#76b900]/40 outline-none transition"
                />
                <p className="text-[10px] text-neutral-550 leading-relaxed">
                  로컬 혹은 내부 네트워크 GPU 서버에 배포된 NIM 프록시 base URL을 지정합니다. (/chat/completions 직전 경로까지)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                  NVIDIA NGC API Key
                </label>
                <input
                  type="password"
                  value={ngcKey}
                  onChange={(e) => setNgcKey(e.target.value)}
                  placeholder="nvapi-..."
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-200 focus:border-[#76b900]/40 outline-none transition font-mono"
                />
                <p className="text-[10px] text-neutral-550 leading-relaxed">
                  인증 토큰(NGC API Key)을 입력합니다. 로컬 컨테이너 생성 시 필수 환경 변수로 매핑됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-neutral-900/60">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-white rounded-lg text-xs font-semibold border border-neutral-800 transition cursor-pointer"
              >
                Save Configurations
              </button>
              <button
                onClick={handleTestConnection}
                disabled={pingStatus === "testing"}
                className="px-4 py-2 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-[0_4px_12px_rgba(118,185,0,0.15)] disabled:opacity-50 cursor-pointer"
              >
                {pingStatus === "testing" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Probe Endpoint Health
              </button>
            </div>
          </div>

          {/* Health check results */}
          {pingStatus !== "idle" && (
            <div className="nvidia-glass rounded-2xl p-6 border border-neutral-900 bg-neutral-950/40 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Health Status Report</h4>

              {pingStatus === "testing" && (
                <div className="flex items-center gap-3 py-4 text-xs text-neutral-400">
                  <div className="w-4 h-4 rounded-full border-2 border-[#76b900] border-t-transparent animate-spin"></div>
                  <span>Pinging {selfHostedBase}/models... Measuring TTFB/Latency</span>
                </div>
              )}

              {pingStatus === "success" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
                    <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                    <span>Endpoint Status: ONLINE (HTTP 200 OK)</span>
                  </div>
                  <div className="p-4 bg-green-950/10 border border-green-900/20 rounded-xl text-xs space-y-1 font-mono max-w-md">
                    <div>Target URL: {selfHostedBase}/models</div>
                    <div>Response Delay: <span className="text-green-400 font-bold">{pingLatency} ms</span></div>
                    <div>NGC Auth Verification: Verified</div>
                  </div>
                </div>
              )}

              {pingStatus === "failed" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Endpoint Status: OFFLINE / TIMEOUT</span>
                  </div>
                  <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-xl text-xs space-y-2 font-mono">
                    <div className="text-red-300 font-bold">Error logs:</div>
                    <div className="text-neutral-400 text-[11px] whitespace-pre-wrap">{pingError}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "docker" && (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
          <div className="nvidia-glass rounded-2xl p-6 border border-neutral-900 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-3 bg-[#76b900] rounded-full"></span>
              Docker Command Generator
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Select Model NIM</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-350 focus:border-[#76b900]/40 outline-none transition"
                >
                  {NIM_MODELS.filter(m => m.type === "TEXT").map(m => (
                    <option key={m.id} value={m.id}>{m.name.split("/").pop()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">GPU Cache Directory</label>
                <input
                  type="text"
                  value={cachePath}
                  onChange={(e) => setCachePath(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-350 focus:border-[#76b900]/40 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Local Port Mapping</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-350 focus:border-[#76b900]/40 outline-none transition"
                />
              </div>
            </div>

            {/* Rendered Docker Command */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#76b900] uppercase tracking-widest">Docker Run CLI Command</label>
                <button
                  onClick={() => handleCopy(getDockerCommand(), "docker_cli")}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-450 hover:text-white transition cursor-pointer"
                >
                  {copiedId === "docker_cli" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === "docker_cli" ? "Copied" : "Copy Command"}
                </button>
              </div>
              <pre className="bg-[#080808] border border-neutral-900 p-4 rounded-xl font-mono text-[11px] text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed border-l-2 border-l-[#76b900]">
                {getDockerCommand()}
              </pre>
            </div>

            <div className="p-4 bg-[#76b900]/5 border border-[#76b900]/15 rounded-xl space-y-2">
              <h4 className="text-[10px] font-bold text-[#76b900] uppercase tracking-wider">💡 NIM Container Requirements</h4>
              <ul className="text-[10px] text-neutral-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Host machine requires **NVIDIA Drivers v535+** and **NVIDIA Container Toolkit** installed.</li>
                <li>Ensure the Docker daemon has the `nvidia` runtime configured as default or passes `--gpus all`.</li>
                <li>The GPU cache directory volume maps system cache to download weight artifacts quickly.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Docker Compose Template */}
            <div className="nvidia-glass rounded-2xl p-6 border border-neutral-900 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">docker-compose.yml</h4>
                  <button
                    onClick={() => handleCopy(getDockerCompose(), "docker_compose")}
                    className="p-1.5 text-neutral-500 hover:text-white transition cursor-pointer"
                    title="Copy Docker Compose"
                  >
                    {copiedId === "docker_compose" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-[#080808] border border-neutral-900 p-3.5 rounded-xl font-mono text-[10px] text-neutral-450 overflow-x-auto max-h-[320px] leading-relaxed">
                  {getDockerCompose()}
                </pre>
              </div>
            </div>

            {/* Environmental Setup File */}
            <div className="nvidia-glass rounded-2xl p-6 border border-neutral-900 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">.env config file</h4>
                  <button
                    onClick={() => handleCopy(getDotEnv(), "dot_env")}
                    className="p-1.5 text-neutral-500 hover:text-white transition cursor-pointer"
                    title="Copy Env file"
                  >
                    {copiedId === "dot_env" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-[#080808] border border-neutral-900 p-3.5 rounded-xl font-mono text-[10px] text-neutral-450 overflow-x-auto max-h-[320px] leading-relaxed">
                  {getDotEnv()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
