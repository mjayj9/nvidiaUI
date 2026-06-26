import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { ChatSession } from "../types";
import {
  getChatSessions,
  createChatSession as apiCreateChatSession,
  deleteChatSession as apiDeleteChatSession,
  getUserSettings,
  saveUserSettings,
} from "../lib/api";
import { modelRegistry } from "../lib/modelRegistry";

interface WorkspaceContextType {
  apiKey: string;
  model: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeTab: string;
  updateApiKey: (key: string) => void;
  updateModel: (model: string) => void;
  handleNewChat: () => Promise<string | undefined>;
  handleDeleteSession: (id: string) => Promise<void>;
  updateSessionTitle: (id: string, title: string) => void;
  updateSessionsList: (sessions: ChatSession[]) => void;
  setActiveTab: (tab: string) => void;
  setActiveSessionId: (id: string | null) => void;
  isLoadingSettings: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: FirebaseUser;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("nim_api_key") || "",
  );

  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem("nim_model");
    if (saved === "meta/llama3-70b-instruct" || saved === "llama-3.1-70b-instruct")
      return "meta/llama-3.1-70b-instruct";

    if (saved && !modelRegistry.some((m) => m.id === saved)) {
      return "meta/llama-3.1-70b-instruct";
    }

    return saved || "meta/llama-3.1-70b-instruct";
  });

  const loadSessions = useCallback(async () => {
    try {
      const loadedSessions = await getChatSessions(user.uid);
      setSessions(loadedSessions);
      if (loadedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(loadedSessions[0].id);
      }
    } catch (error) {
      console.error("Error loading sessions", error);
    }
  }, [user.uid, activeSessionId]);

  const syncSettingsToFirestore = useCallback((updatedKey?: string, updatedModel?: string) => {
    if (user.uid === "nvidia-guest-dev") return;
    const finalKey = updatedKey !== undefined ? updatedKey : apiKey;
    const finalModel = updatedModel !== undefined ? updatedModel : model;
    const ngcKey = localStorage.getItem("ngc_api_key") || "";
    const selfHostedBase = localStorage.getItem("self_hosted_nim_base_url") || "";

    saveUserSettings(user.uid, {
      apiKey: finalKey,
      ngcKey,
      selfHostedBase,
      selectedModel: finalModel,
    }).catch((err) => console.error("Failed to sync settings to Firestore", err));
  }, [user.uid, apiKey, model]);

  const loadSettingsAndSessions = useCallback(async () => {
    setIsLoadingSettings(true);
    if (user.uid !== "nvidia-guest-dev") {
      try {
        const settings = await getUserSettings(user.uid);
        if (settings) {
          if (settings.apiKey) {
            localStorage.setItem("nim_api_key", settings.apiKey);
            setApiKey(settings.apiKey);
          }
          if (settings.ngcKey) {
            localStorage.setItem("ngc_api_key", settings.ngcKey);
          }
          if (settings.selfHostedBase) {
            localStorage.setItem("self_hosted_nim_base_url", settings.selfHostedBase);
          }
          if (settings.selectedModel) {
            localStorage.setItem("nim_model", settings.selectedModel);
            setModel(settings.selectedModel);
          }
        }
      } catch (error) {
        console.error("Error loading user settings", error);
      }
    }
    await loadSessions();
    setIsLoadingSettings(false);
  }, [user.uid, loadSessions]);

  useEffect(() => {
    loadSettingsAndSessions();
  }, [user.uid]);

  const updateApiKey = useCallback((key: string) => {
    localStorage.setItem("nim_api_key", key);
    setApiKey(key);
    syncSettingsToFirestore(key, model);
  }, [model, syncSettingsToFirestore]);

  const updateModel = useCallback((m: string) => {
    localStorage.setItem("nim_model", m);
    setModel(m);
    syncSettingsToFirestore(apiKey, m);
  }, [apiKey, syncSettingsToFirestore]);

  const handleNewChat = useCallback(async (): Promise<string | undefined> => {
    try {
      const newId = await apiCreateChatSession(user.uid, "New Chat", model);
      const newSession: ChatSession = {
        id: newId,
        userId: user.uid,
        title: "New Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: model,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newId);
      return newId;
    } catch (error) {
      console.error("Failed to create new chat", error);
    }
  }, [user.uid, model]);

  const handleDeleteSession = useCallback(async (id: string) => {
    try {
      await apiDeleteChatSession(id);
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== id);
        if (activeSessionId === id) {
          const nextActive = filtered[0]?.id || null;
          setActiveSessionId(nextActive);
        }
        return filtered;
      });
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  }, [activeSessionId]);

  const updateSessionTitle = useCallback((id: string, title: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  }, []);

  const updateSessionsList = useCallback((updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        apiKey,
        model,
        sessions,
        activeSessionId,
        activeTab,
        updateApiKey,
        updateModel,
        handleNewChat,
        handleDeleteSession,
        updateSessionTitle,
        updateSessionsList,
        setActiveTab,
        setActiveSessionId,
        isLoadingSettings,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
