import { Activity, Database, Eye, Home, Image as ImageIcon, LogOut, MessageSquare, Mic, Plus, Server, ShieldAlert, Trash2, Video, X, GitCompare, Trophy, Cpu, Award, FolderHeart } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { signOut } from "../lib/firebase";
import { cn } from "../lib/utils";
import { useWorkspace } from "../context/WorkspaceContext";

export default function Sidebar({
  isOpen,
  setIsOpen,
  user,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: FirebaseUser;
}) {
  const {
    sessions,
    activeSessionId,
    activeTab,
    setActiveTab,
    setActiveSessionId,
    handleNewChat,
    handleDeleteSession,
    isDevMode,
    setIsDevMode,
    language,
    setLanguage,
  } = useWorkspace();

  const onSelectSession = (id: string) => {
    setActiveSessionId(id);
    setActiveTab("chat");
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const onSelectTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === "chat" && !activeSessionId) {
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        handleNewChat();
      }
    }
    if (window.innerWidth < 768 && tab !== "chat") {
      setIsOpen(false);
    }
  };
  const handleSignOut = () => {
    signOut().catch(console.error);
  };

  const navItems = isDevMode
    ? [
        { id: "dashboard", label: language === "ko" ? "대시보드 (Dashboard)" : "Dashboard (Mission Control)", icon: Home },
        { id: "chat", label: language === "ko" ? "챗 플레이그라운드 (Chat)" : "Chat Playground", icon: MessageSquare },
        { id: "model-registry", label: language === "ko" ? "모델 등록소 (Registry)" : "Model Registry", icon: Cpu },
        { id: "compare-lab", label: language === "ko" ? "비교 실험실 (Compare)" : "Compare Lab", icon: GitCompare },
        { id: "tournament-arena", label: language === "ko" ? "토너먼트 아레나 (Arena)" : "Tournament Arena", icon: Trophy },
        { id: "request-inspector", label: language === "ko" ? "요청 검사기 (Inspector)" : "Request Inspector", icon: Activity },
        { id: "eval-set", label: language === "ko" ? "프롬프트 평가 (Eval Set)" : "Prompt & Eval Set", icon: Award },
        { id: "safety", label: language === "ko" ? "보안 가드레일 (Safety)" : "Safety Pipeline", icon: ShieldAlert },
        { id: "logs", label: language === "ko" ? "로그 및 추적 (Logs)" : "Logs / Traces", icon: Activity },
        { id: "deployment", label: language === "ko" ? "배포 마법사 (Deploy)" : "Deployment Wizard", icon: Server },
        { id: "settings", label: language === "ko" ? "설정 (Settings)" : "Settings", icon: Server },
      ]
    : [
        { id: "dashboard", label: language === "ko" ? "홈 (Home)" : "Home", icon: Home },
        { id: "chat", label: language === "ko" ? "AI 채팅 (Chat)" : "AI Chat", icon: MessageSquare },
        { id: "rag", label: language === "ko" ? "문서 질의 (Ask Docs)" : "Ask Documents", icon: Database },
        { id: "vision", label: language === "ko" ? "이미지 분석 (Analyze)" : "Analyze Images", icon: Eye },
        { id: "image-gen", label: language === "ko" ? "이미지 생성 (Create)" : "Create Images", icon: ImageIcon },
        { id: "speech-video", label: language === "ko" ? "음성/영상 도구 (AV Tools)" : "Speech & Video Hub", icon: Mic },
        { id: "saved-works", label: language === "ko" ? "내 작업함 (Gallery)" : "Saved Gallery", icon: FolderHeart },
        { id: "settings", label: language === "ko" ? "설정 (Settings)" : "Settings", icon: Server },
      ];

  if (!isOpen) return null;

  return (
    <div className="w-72 bg-neutral-950 flex flex-col h-full border-r border-neutral-900 z-30 absolute md:relative transition-all shadow-2xl md:shadow-none">
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#76b900] rounded-[4px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xs font-extrabold text-white tracking-widest uppercase">NVIDIA NIM Hub</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1.5 text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switch Panel */}
      <div className="p-3 border-b border-neutral-900 bg-[#080808]/80 select-none shrink-0">
        <div className="relative flex bg-neutral-950 rounded-xl p-1 border border-neutral-900">
          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#76b900] rounded-lg transition-transform duration-300 ease-out",
              isDevMode ? "translate-x-[100%]" : "translate-x-0"
            )}
          />
          
          <button
            onClick={() => setIsDevMode(false)}
            className={cn(
              "relative z-10 w-1/2 text-center py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
              !isDevMode ? "text-black" : "text-neutral-550 hover:text-neutral-350"
            )}
          >
            {language === "ko" ? "AI 서비스 사용" : "Use AI"}
          </button>
          
          <button
            onClick={() => setIsDevMode(true)}
            className={cn(
              "relative z-10 w-1/2 text-center py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
              isDevMode ? "text-black" : "text-neutral-550 hover:text-neutral-350"
            )}
          >
            {language === "ko" ? "NIM 개발 빌드" : "Build with NIM"}
          </button>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="px-4 pb-3 border-b border-neutral-900 bg-[#080808]/80 select-none shrink-0 flex items-center justify-between text-[9px] font-bold text-neutral-500">
        <span>{language === "ko" ? "인터페이스 언어" : "UI LANGUAGE"}:</span>
        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => setLanguage("ko")}
            className={cn(
              "px-1.5 py-0.5 rounded transition cursor-pointer text-[9px]",
              language === "ko" ? "bg-[#76b900]/10 border border-[#76b900]/30 text-[#76b900]" : "text-neutral-550 hover:text-neutral-350"
            )}
          >
            한국어
          </button>
          <span className="text-neutral-850">|</span>
          <button
            onClick={() => setLanguage("en")}
            className={cn(
              "px-1.5 py-0.5 rounded transition cursor-pointer text-[9px]",
              language === "en" ? "bg-[#76b900]/10 border border-[#76b900]/30 text-[#76b900]" : "text-neutral-550 hover:text-neutral-350"
            )}
          >
            English
          </button>
        </div>
      </div>
      {/* Tabs navigation list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-900">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-xs font-semibold transition-all text-left",
                  isActive
                    ? "bg-[#76b900] text-black"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>

              {/* Expand Chat History when activeTab === "chat" */}
              {item.id === "chat" && activeTab === "chat" && (
                <div className="pl-4 pr-1 py-1 space-y-1 animate-in fade-in duration-200 border-l border-neutral-900 ml-5 mt-1">
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 px-2 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded text-[10px] font-semibold transition mb-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {language === "ko" ? "새 대화 시작" : "New Conversation"}
                  </button>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin pr-1">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={cn(
                          "group flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-[11px] transition-colors",
                          activeSessionId === session.id
                            ? "bg-neutral-800 text-white"
                            : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-350"
                        )}
                      >
                        <span className="truncate flex-1 font-medium">{session.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User profile section */}
      <div className="p-4 border-t border-neutral-900 space-y-3 shrink-0">
        <div className="flex items-center gap-3 px-1 mb-2">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-neutral-800"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-750 flex items-center justify-center text-[10px] font-bold text-neutral-300 uppercase">
              {user.email?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 truncate text-left">
            <div className="text-xs font-semibold text-white truncate">{user.displayName || "User"}</div>
            <div className="text-[10px] text-neutral-500 truncate">{user.email}</div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          {language === "ko" ? "로그아웃 (Sign out)" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

