import { Activity, Database, Eye, Home, Image as ImageIcon, LogOut, MessageSquare, Mic, Plus, Server, ShieldAlert, Trash2, Video, X, GitCompare, Trophy } from "lucide-react";
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

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "chat", label: "Chat & Writing", icon: MessageSquare },
    { id: "rag", label: "Document Search (RAG)", icon: Database },
    { id: "vision", label: "VLM Image Analysis", icon: Eye },
    { id: "image-gen", label: "Image Generation", icon: ImageIcon },
    { id: "speech", label: "Speech & Audio Hub", icon: Mic },
    { id: "video", label: "Video Studio", icon: Video },
    ...(isDevMode ? [
      { id: "compare-lab", label: "Model Compare Lab", icon: GitCompare },
      { id: "tournament-arena", label: "Tournament Arena", icon: Trophy },
      { id: "safety", label: "Safety Guard", icon: ShieldAlert },
      { id: "logs", label: "Activity Logs", icon: Activity }
    ] : []),
    { id: "settings", label: "Settings", icon: Server },
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
          <span className="text-sm font-bold text-white tracking-wider">NVIDIA NIM Workspace</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1.5 text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Developer Mode Switch */}
      <div className="px-4 py-3 border-b border-neutral-900/60 flex items-center justify-between bg-neutral-950/40 select-none">
        <span className={cn(
          "text-[10px] font-bold tracking-widest uppercase transition-colors duration-300",
          isDevMode ? "text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.4)]" : "text-neutral-500"
        )}>
          {isDevMode ? "Developer Mode ON" : "Developer Mode OFF"}
        </span>
        <button
          onClick={() => setIsDevMode(!isDevMode)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-neutral-800 transition-colors duration-300 focus:outline-none items-center",
            isDevMode ? "bg-[#76b900]/25 border-[#76b900]/40" : "bg-neutral-900"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full transition-transform duration-300 shadow",
              isDevMode ? "translate-x-4.5 bg-[#76b900]" : "translate-x-0.5 bg-neutral-500"
            )}
          />
        </button>
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
                    New Conversation
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
          Sign out
        </button>
      </div>
    </div>
  );
}

