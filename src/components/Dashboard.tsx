import { useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import SessionSettingsSidebar from "./SessionSettingsSidebar";
import DashboardOverview from "./DashboardOverview";
import DocumentSearch from "./DocumentSearch";
import VisionAnalyzer from "./VisionAnalyzer";
import ImageGenerator from "./ImageGenerator";
import SpeechHub from "./SpeechHub";
import VideoStudio from "./VideoStudio";
import SafetyGuard from "./SafetyGuard";
import ActivityLogs from "./ActivityLogs";
import SettingsPanel from "./SettingsPanel";
import CompareLab from "./CompareLab";
import TournamentArena from "./TournamentArena";
import { getChatSessions, forkSession } from "../lib/api";
import { Loader2, Menu } from "lucide-react";
import { WorkspaceProvider, useWorkspace } from "../context/WorkspaceContext";
import { ToastProvider } from "../context/ToastContext";

interface DashboardProps {
  user: FirebaseUser;
}

function DashboardContent({ user }: DashboardProps) {
  const {
    model,
    sessions,
    activeSessionId,
    activeTab,
    setActiveTab,
    setActiveSessionId,
    updateSessionsList,
  } = useWorkspace();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSessionSettingsOpen, setIsSessionSettingsOpen] = useState(false);

  const getSessionModel = (sessionId: string) => {
    let sessionModel = sessions.find((s) => s.id === sessionId)?.model || model;
    if (sessionModel === "meta/llama3-70b-instruct" || sessionModel === "llama-3.1-70b-instruct") {
      sessionModel = "meta/llama-3.1-70b-instruct";
    }
    return sessionModel;
  };

  const handleForkSession = async (messageTimestamp: number) => {
    if (!activeSessionId) return;
    try {
      const newSessionId = await forkSession(
        activeSessionId,
        messageTimestamp,
        getSessionModel(activeSessionId),
      );
      const loadedSessions = await getChatSessions(user.uid);
      updateSessionsList(loadedSessions);
      setActiveSessionId(newSessionId);
    } catch (e) {
      console.error("Fork failed", e);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab === "chat" && !activeSessionId && sessions.length > 0) {
                setActiveSessionId(sessions[0].id);
              }
            }}
          />
        );
      case "chat":
        return activeSessionId ? (
          <ChatArea
            sessionId={activeSessionId}
            userId={user.uid}
            onToggleSessionSettings={() =>
              setIsSessionSettingsOpen(!isSessionSettingsOpen)
            }
            onToggleHistory={() => setIsSidebarOpen(!isSidebarOpen)}
            onForkSession={handleForkSession}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950">
            <Loader2 className="w-6 h-6 animate-spin text-[#76b900]" />
            <p className="text-xs text-neutral-500 mt-2">Opening chat session...</p>
          </div>
        );
      case "rag":
        return <DocumentSearch />;
      case "vision":
        return <VisionAnalyzer />;
      case "image-gen":
        return <ImageGenerator />;
      case "speech":
        return <SpeechHub />;
      case "video":
        return <VideoStudio />;
      case "safety":
        return <SafetyGuard />;
      case "logs":
        return <ActivityLogs />;
      case "compare-lab":
        return <CompareLab />;
      case "tournament-arena":
        return <TournamentArena />;
      case "settings":
        return <SettingsPanel />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 text-xs">
            Workspace tab not found.
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Toggle */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-20 p-2 text-neutral-400 hover:text-white bg-neutral-900 rounded-md border border-neutral-800 shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Navigation & History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex transition-all duration-300 w-full overflow-hidden">
        {renderTabContent()}

        {/* Floating Parameter settings drawer for Chat session */}
        {activeTab === "chat" && (
          <SessionSettingsSidebar
            session={sessions.find((s) => s.id === activeSessionId) || null}
            isOpen={isSessionSettingsOpen}
            onClose={() => setIsSessionSettingsOpen(false)}
            onUpdate={(id, updates) => {
              updateSessionsList(
                sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
              );
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <WorkspaceProvider user={user}>
      <ToastProvider>
        <DashboardContent user={user} />
      </ToastProvider>
    </WorkspaceProvider>
  );
}
