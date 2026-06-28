import { ArrowRight, Bot, Cpu, Database, Eye, Image as ImageIcon, MessageSquare, Mic, ShieldAlert, Sparkles, Video, FolderHeart, Activity, Award, Server } from "lucide-react";
import { modelRegistry } from "../lib/modelRegistry";
import { useWorkspace } from "../context/WorkspaceContext";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardOverview({
  onNavigate,
}: DashboardOverviewProps) {
  const { apiKey, model: selectedModel, isDevMode } = useWorkspace();
  const isConnected = !!apiKey;
  const totalModels = modelRegistry.length;

  // General Mode Goals
  const generalGoals = [
    {
      id: "rag",
      title: "문서 요약 및 질문하기 (Ask My Docs)",
      desc: "PDF나 텍스트 보고서를 올리고 핵심 내용을 요약하거나 원하는 답변을 바로 검색하세요.",
      icon: Database,
      color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400",
    },
    {
      id: "vision",
      title: "이미지에서 정보 찾기 (Analyze Images)",
      desc: "이미지, 문서 캡처, 차트를 첨부하여 텍스트를 추출하거나 UI 상태 평가 등의 비전 분석을 실행하세요.",
      icon: Eye,
      color: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-400",
    },
    {
      id: "speech-video",
      title: "회의 음성 받아쓰기 (Transcribe Audio)",
      desc: "회의록 음성 파일을 업로드해 텍스트 대본으로 변환하고 일목요연한 대화 요약본을 만드세요.",
      icon: Mic,
      color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400",
    },
    {
      id: "image-gen",
      title: "발표 자료용 이미지 생성 (Create AI Art)",
      desc: "간단한 한글 묘사만으로 기획서나 발표 슬라이드에 삽입할 멋진 이미지를 제작하세요.",
      icon: ImageIcon,
      color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400",
    },
    {
      id: "speech-video",
      title: "영상이 진짜인지 위조인지 판별 (Fake Video Checker)",
      desc: "동영상 파일을 업로드해 딥페이크 위조 여부와 비디오 내부 물리 정보 피드백을 검증하세요.",
      icon: Video,
      color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400",
    },
    {
      id: "chat",
      title: "AI에게 자유롭게 질문하기 (Ask AI Chat)",
      desc: "일상적인 질문부터 작문, 번역, 이메일 초안 작성까지 AI 챗봇과 편하게 대화하며 업무 속도를 높이세요.",
      icon: MessageSquare,
      color: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-[#76b900]",
    },
  ];

  // Developer Mode Features
  const devFeatures = [
    {
      id: "chat",
      title: "Chat Playground",
      desc: "Test LLMs, system prompts, stream metrics, and modify generation parameters (temperature, top_p, etc.).",
      icon: MessageSquare,
      color: "from-green-500/10 to-emerald-550/10 border-neutral-850 hover:border-[#76b900]/40 text-[#76b900]",
    },
    {
      id: "model-registry",
      title: "Model Registry",
      desc: "Explore details, tokens, domains, and capabilities of the 77 registered NVIDIA NIMs.",
      icon: Cpu,
      color: "from-indigo-500/10 to-blue-550/10 border-neutral-850 hover:border-blue-500/40 text-blue-400",
    },
    {
      id: "compare-lab",
      title: "Compare Lab",
      desc: "Benchmark latency (TTFT, TPS) and output quality of up to 3 LLM models side-by-side with repeat runs.",
      icon: GitCompare,
      color: "from-orange-500/10 to-amber-550/10 border-neutral-850 hover:border-orange-500/40 text-orange-400",
    },
    {
      id: "tournament-arena",
      title: "Tournament Arena",
      desc: "Host blind A/B duels to vote on responses, automatically updating the local ELO leaderboard.",
      icon: Trophy,
      color: "from-yellow-550/10 to-amber-600/10 border-neutral-850 hover:border-yellow-500/40 text-yellow-500",
    },
    {
      id: "request-inspector",
      title: "Request Inspector",
      desc: "Real-time logging of HTTP payloads: inspect request body, response chunks, headers, and status codes.",
      icon: Activity,
      color: "from-rose-500/10 to-pink-550/10 border-neutral-850 hover:border-rose-500/40 text-rose-400",
    },
    {
      id: "eval-set",
      title: "Prompt & Eval Set",
      desc: "Grade model accuracy at scale with loaded evaluation prompts, score rubrics, and regression metrics.",
      icon: Award,
      color: "from-purple-500/10 to-indigo-550/10 border-neutral-850 hover:border-purple-500/40 text-purple-400",
    },
    {
      id: "safety",
      title: "Safety Pipeline",
      desc: "Monitor guardrail policies, PII anonymization, and prompt classifications through NeMo pipelines.",
      icon: ShieldAlert,
      color: "from-red-500/10 to-orange-550/10 border-neutral-850 hover:border-red-500/40 text-red-400",
    },
    {
      id: "deployment",
      title: "Deployment Wizard",
      desc: "Self-hosted NIM connection setups, health probes, Docker CLI generators, and Compose templates.",
      icon: Server,
      color: "from-cyan-500/10 to-teal-550/10 border-neutral-850 hover:border-cyan-500/40 text-cyan-400",
    },
  ];

  if (!isDevMode) {
    // ----------------------------------------------------
    // GENERAL USER MODE: Use AI Home
    // ----------------------------------------------------
    return (
      <div className="flex-grow overflow-y-auto bg-neutral-950 p-6 md:p-8 text-neutral-100 scrollbar-thin">
        {/* Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-neutral-900 bg-gradient-to-r from-neutral-900 via-[#0d0d0d] to-[#76b900]/10 p-6 md:p-10 mb-8 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#76b900]/5 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#76b900]/15 text-[#76b900] text-xs font-semibold w-max mb-4 border border-[#76b900]/30">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              NVIDIA AI 어시스턴트 활성화됨
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              무엇을 도와드릴까요?
            </h1>
            <p className="text-neutral-400 text-xs md:text-sm leading-relaxed mb-6">
              복잡한 비즈니스 요약, 디자인 이미지 기획, 회의록 대본 번역 등 원하시는 목적에 맞춰 구성된 전용 AI 기능을 선택하여 즉시 업무를 해결하세요. API Key 연결 없이도 데모 결과 예시로 미리 체험해 볼 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("chat")}
                className="px-4 py-2 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-lg text-xs transition shadow-lg flex items-center gap-1.5 group cursor-pointer"
              >
                AI 비서와 채팅 시작
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate("saved-works")}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-white font-semibold rounded-lg text-xs border border-neutral-850 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FolderHeart className="w-4 h-4 text-rose-400" />
                내 보관함 보기
              </button>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
          <span className="w-1.5 h-3.5 bg-[#76b900] rounded-full"></span>
          해결하고자 하는 작업을 고르세요
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {generalGoals.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                onClick={() => onNavigate(feat.id)}
                className="group cursor-pointer bg-[#0a0a0a] border border-neutral-900 rounded-xl p-5 flex flex-col justify-between min-h-[160px] hover:border-[#76b900]/30 hover:bg-[#0c0c0c] transition-all duration-300"
              >
                <div>
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${feat.color} flex items-center justify-center border border-neutral-850 mb-3.5 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-[#76b900] transition-colors leading-tight">
                    {feat.title}
                  </h3>
                  <p className="text-[10px] text-neutral-450 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-neutral-550 group-hover:text-white transition-colors">
                  바로 시작하기
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // DEVELOPER MODE: Build with NIM Home (Mission Control)
  // ----------------------------------------------------
  return (
    <div className="flex-grow overflow-y-auto bg-neutral-950 p-6 md:p-8 text-neutral-100 scrollbar-thin">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-900 bg-gradient-to-r from-neutral-900 via-[#0a0a0a] to-[#76b900]/5 p-6 md:p-10 mb-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#76b900]/10 rounded-full filter blur-3xl -mr-20 -mt-20 animate-pulse"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#76b900]/15 text-[#76b900] text-[10px] font-bold w-max mb-4 border border-[#76b900]/30 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-[#76b900]" />
            NIM Mission Control Center
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            Build with <span className="text-[#76b900]">NVIDIA NIM</span>
          </h1>
          <p className="text-neutral-400 text-xs md:text-sm leading-relaxed mb-6">
            NVIDIA NGC 컨테이너 인프라 및 추론 마이크로서비스 관제 센터입니다. 실시간 API 페이로드 트래킹, 벤치마크 테스트, ELO 기반 모델 아레나 배틀, 배포 자동화 Docker 템플릿 구성을 손쉽게 관리할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("chat")}
              className="px-4 py-2.5 bg-[#76b900] hover:bg-[#66a000] text-black font-extrabold rounded-lg text-xs tracking-wider uppercase transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Open Playgrounds
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("deployment")}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-semibold rounded-lg text-xs border border-neutral-850 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-neutral-400" />
              Configure Local NIM
            </button>
          </div>
        </div>
      </div>

      {/* Stats metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-neutral-550 text-[9px] font-bold uppercase tracking-widest">NIM API Endpoint</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`}></span>
              <span className="text-xs font-bold text-white">{isConnected ? "ONLINE" : "OFFLINE"}</span>
            </div>
          </div>
          <Server className="w-6 h-6 text-neutral-600" />
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-neutral-550 text-[9px] font-bold uppercase tracking-widest">NIM Registry Registry</span>
            <div className="text-xs font-bold text-white mt-1">{totalModels} Models Configured</div>
          </div>
          <Cpu className="w-6 h-6 text-neutral-600" />
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-neutral-550 text-[9px] font-bold uppercase tracking-widest">Selected Core LLM</span>
            <div className="text-xs font-bold text-[#76b900] truncate max-w-[130px] mt-1">
              {modelRegistry.find((m) => m.id === selectedModel)?.name || selectedModel.split("/").pop()}
            </div>
          </div>
          <Bot className="w-6 h-6 text-[#76b900]/80" />
        </div>

        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-neutral-550 text-[9px] font-bold uppercase tracking-widest">Telemetry Tracker</span>
            <div className="text-xs font-bold text-white mt-1">Request Inspector Active</div>
          </div>
          <Activity className="w-6 h-6 text-neutral-600" />
        </div>
      </div>

      {/* Dev Features Grid */}
      <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
        <span className="w-1.5 h-3.5 bg-[#76b900] rounded-full"></span>
        NIM Microservice Developer Operations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {devFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              onClick={() => onNavigate(feat.id)}
              className={`group cursor-pointer bg-[#0a0a0a] border rounded-xl p-4 flex flex-col justify-between min-h-[145px] transition duration-300 ${feat.color}`}
            >
              <div>
                <Icon className="w-5 h-5 mb-3 group-hover:scale-105 transition-transform" />
                <h3 className="text-xs font-bold text-white group-hover:text-[#76b900] transition-colors leading-tight">
                  {feat.title}
                </h3>
                <p className="text-[9px] text-neutral-500 mt-1.5 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[8px] font-bold text-neutral-600 group-hover:text-white transition-colors">
                Launch Module
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

