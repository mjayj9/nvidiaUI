import { ArrowRight, Bot, Cpu, Database, Eye, Image as ImageIcon, MessageSquare, Mic, ShieldAlert, Sparkles, Video } from "lucide-react";
import { modelRegistry } from "../lib/modelRegistry";

interface DashboardOverviewProps {
  apiKey: string;
  onNavigate: (tab: string) => void;
  selectedModel: string;
}

export default function DashboardOverview({
  apiKey,
  onNavigate,
  selectedModel,
}: DashboardOverviewProps) {
  const isConnected = !!apiKey;
  const totalModels = modelRegistry.length;

  const features = [
    {
      id: "chat",
      title: "Chat & Reasoning",
      desc: "Interact with advanced LLMs, explore logic thinking processes, and write code.",
      icon: MessageSquare,
      color: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-[#76b900]",
    },
    {
      id: "rag",
      title: "Document Search (RAG)",
      desc: "Upload PDFs/TXTs, index their content, and query with citation highlights.",
      icon: Database,
      color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400",
    },
    {
      id: "vision",
      title: "VLM Image Analysis",
      desc: "Evaluate screenshots, chart diagrams, UI rating, and OCR text from multiple images.",
      icon: Eye,
      color: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-400",
    },
    {
      id: "image-gen",
      title: "Image Generation",
      desc: "Create premium graphics and edit canvas images using FLUX and Stable Diffusion.",
      icon: ImageIcon,
      color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400",
    },
    {
      id: "speech",
      title: "Speech & Audio Hub",
      desc: "ASR transcriptions, zero-shot TTS, and professional background noise removal.",
      icon: Mic,
      color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400",
    },
    {
      id: "video",
      title: "Video Studio",
      desc: "Comprehend physical world actions and identify synthetic deepfake videos.",
      icon: Video,
      color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400",
    },
    {
      id: "safety",
      title: "Safety Guard",
      desc: "Sanitize user inputs via PII masking and content safety classification logs.",
      icon: ShieldAlert,
      color: "from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 md:p-8 text-neutral-100 scrollbar-thin">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-850 bg-gradient-to-r from-neutral-900 via-[#0d0d0d] to-[#76b900]/10 p-6 md:p-10 mb-8 shadow-xl nvidia-glow">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#76b900]/10 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#76b900]/15 text-[#76b900] text-xs font-semibold w-max mb-4 border border-[#76b900]/30 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            NVIDIA NIM Multi-Modal Workspace Active
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Accelerate your <span className="text-[#76b900]">AI Workflows</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-6">
            Welcome to the ultimate NIM dashboard. Explore 77 specialized inference models connected through dedicated API pipelines. Switch seamlessly between text chat, RAG, vision, audio processing, and deepfake verification.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate("chat")}
              className="px-5 py-2.5 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-lg text-sm transition shadow-lg flex items-center gap-2 group cursor-pointer"
            >
              Start Chatting
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate("settings")}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-semibold rounded-lg text-sm border border-neutral-800 transition cursor-pointer"
            >
              Configure API Keys
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="nvidia-glass rounded-xl p-5 flex items-center justify-between nvidia-glow">
          <div>
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">NIM API Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`}></span>
              <span className="text-sm font-bold text-white">{isConnected ? "Connected" : "Not Configured"}</span>
            </div>
          </div>
          <Bot className="w-7 h-7 text-neutral-600" />
        </div>

        <div className="nvidia-glass rounded-xl p-5 flex items-center justify-between nvidia-glow">
          <div>
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Active Models</span>
            <div className="text-sm font-bold text-white mt-1">77 NIM Registered</div>
          </div>
          <Cpu className="w-7 h-7 text-neutral-600" />
        </div>

        <div className="nvidia-glass rounded-xl p-5 flex items-center justify-between nvidia-glow">
          <div>
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Current LLM Model</span>
            <div className="text-xs font-bold text-[#76b900] truncate max-w-[150px] mt-1.5">
              {modelRegistry.find((m) => m.id === selectedModel)?.fullName || selectedModel || "None"}
            </div>
          </div>
          <Bot className="w-7 h-7 text-[#76b900]/80" />
        </div>

        <div className="nvidia-glass rounded-xl p-5 flex items-center justify-between nvidia-glow">
          <div>
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Workspace Mode</span>
            <div className="text-sm font-bold text-white mt-1">Multi-Modal Suite</div>
          </div>
          <Sparkles className="w-7 h-7 text-neutral-600" />
        </div>
      </div>

      {/* Main Core Features Title */}
      <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-[#76b900] rounded-full"></span>
        Select a Workspace Tool
      </h2>

      {/* Grid of tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              onClick={() => onNavigate(feat.id)}
              className="group cursor-pointer nvidia-glass rounded-xl p-5 flex flex-col justify-between min-h-[170px] nvidia-glow-hover"
            >
              <div>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${feat.color} flex items-center justify-center border border-neutral-800 mb-3.5 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#76b900] transition-colors">
                  {feat.title}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-neutral-500 group-hover:text-white transition-colors">
                Open Tool
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
