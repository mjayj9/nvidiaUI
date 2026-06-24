import { useState, useEffect } from "react";
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
import { ChatSession } from "../types";
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  forkSession,
} from "../lib/api";
import { Loader2, Menu } from "lucide-react";
import { modelRegistry } from "../lib/modelRegistry";

interface DashboardProps {
  user: FirebaseUser;
}

export default function Dashboard({ user }: DashboardProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSessionSettingsOpen, setIsSessionSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("nim_api_key") || "",
  );
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem("nim_model");
    if (saved === "meta/llama3-70b-instruct")
      return "meta/llama-3.1-70b-instruct";

    if (saved && !modelRegistry.some((m) => m.id === saved)) {
      return "llama-3.1-70b-instruct";
    }

    return saved || "llama-3.1-70b-instruct";
  });

  const loadSessions = async () => {
    try {
      const loadedSessions = await getChatSessions(user.uid);
      setSessions(loadedSessions);
      if (loadedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(loadedSessions[0].id);
      } else if (loadedSessions.length === 0) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error loading sessions", error);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user.uid]);

  const handleNewChat = async () => {
    try {
      const newId = await createChatSession(user.uid, "New Chat", model);
      const newSession: ChatSession = {
        id: newId,
        userId: user.uid,
        title: "New Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: model,
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newId);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to create new chat", error);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteChatSession(id);
      setSessions(sessions.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(sessions.find((s) => s.id !== id)?.id || null);
        if (sessions.length <= 1) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  const updateApiKey = (key: string) => {
    localStorage.setItem("nim_api_key", key);
    setApiKey(key);
  };

  const updateModel = (m: string) => {
    localStorage.setItem("nim_model", m);
    setModel(m);
  };

  const handleForkSession = async (messageTimestamp: number) => {
    if (!activeSessionId) return;
    try {
      const newSessionId = await forkSession(
        activeSessionId,
        messageTimestamp,
        getSessionModel(activeSessionId),
      );
      await loadSessions();
      setActiveSessionId(newSessionId);
    } catch (e) {
      console.error("Fork failed", e);
    }
  };

  const getSessionModel = (sessionId: string) => {
    let sessionModel = sessions.find((s) => s.id === sessionId)?.model || model;
    if (sessionModel === "meta/llama3-70b-instruct") {
      sessionModel = "meta/llama-3.1-70b-instruct";
    }
    return sessionModel;
  };

  // Switch workspace content depending on activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            apiKey={apiKey}
            selectedModel={model}
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
            apiKey={apiKey}
            model={getSessionModel(activeSessionId)}
            sessions={sessions}
            onUpdateSessionTitle={(id, title) => {
              setSessions(
                sessions.map((s) => (s.id === id ? { ...s, title } : s)),
              );
            }}
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
        return <DocumentSearch apiKey={apiKey} />;
      case "vision":
        return <VisionAnalyzer apiKey={apiKey} />;
      case "image-gen":
        return <ImageGenerator apiKey={apiKey} />;
      case "speech":
        return <SpeechHub apiKey={apiKey} />;
      case "video":
        return <VideoStudio apiKey={apiKey} />;
      case "safety":
        return <SafetyGuard apiKey={apiKey} />;
      case "logs":
        return <ActivityLogs />;
      case "settings":
        return (
          <SettingsPanel
            apiKey={apiKey}
            onUpdateApiKey={updateApiKey}
            selectedModel={model}
            onUpdateModel={updateModel}
          />
        );
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
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setActiveTab("chat");
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (window.innerWidth < 768 && tab !== "chat") {
            setIsSidebarOpen(false);
          }
        }}
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
              setSessions(
                sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
              );
            }}
          />
        )}
      </main>
    </div>
  );
}

