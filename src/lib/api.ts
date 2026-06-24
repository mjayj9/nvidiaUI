import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, switchToDefaultDatabase } from "./firebase";
import { ChatSession, Message, Attachment } from "../types";

const runWithDbFallback = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error.message || error);
    if (
      error.code === "not-found" ||
      errorStr.includes("not exist") ||
      errorStr.includes("database") ||
      errorStr.includes("not-found")
    ) {
      console.warn("Firestore database not found, falling back to default database...", error);
      switchToDefaultDatabase();
      return await fn();
    }
    throw error;
  }
};

export const uploadFile = async (
  userId: string,
  file: File,
): Promise<string> => {
  if (isGuestUser(userId) || isGuestSessionActive()) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  const fileRef = ref(
    storage,
    `users/${userId}/uploads/${Date.now()}_${file.name}`,
  );
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};

const isGuestUser = (userId: string) => userId === "nvidia-guest-dev";

const isGuestSessionActive = () => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("nim_guest_user");
};

export const getChatSessions = async (
  userId: string,
): Promise<ChatSession[]> => {
  if (isGuestUser(userId) || isGuestSessionActive()) {
    const data = localStorage.getItem("nim_guest_sessions");
    return data ? JSON.parse(data) : [];
  }
  return runWithDbFallback(async () => {
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as ChatSession,
    );
    
    return sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  });
};

export const createChatSession = async (
  userId: string,
  title: string = "New Chat",
  model: string = "meta/llama-3.1-70b-instruct",
): Promise<string> => {
  if (isGuestUser(userId) || isGuestSessionActive()) {
    const sessions = await getChatSessions(userId);
    const newId = "guest_session_" + Math.random().toString(36).substring(7);
    const newSession: ChatSession = {
      id: newId,
      userId,
      title,
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sessions.unshift(newSession);
    localStorage.setItem("nim_guest_sessions", JSON.stringify(sessions));
    return newId;
  }
  return runWithDbFallback(async () => {
    const sessionRef = await addDoc(collection(db, "sessions"), {
      userId,
      title,
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return sessionRef.id;
  });
};

export const updateSessionSettings = async (
  sessionId: string,
  settings: Partial<
    Omit<ChatSession, "id" | "userId" | "createdAt" | "updatedAt">
  >,
): Promise<void> => {
  if (isGuestSessionActive()) {
    const sessions = await getChatSessions("nvidia-guest-dev");
    const updated = sessions.map(s => s.id === sessionId ? { ...s, ...settings, updatedAt: Date.now() } : s);
    localStorage.setItem("nim_guest_sessions", JSON.stringify(updated));
    return;
  }
  return runWithDbFallback(async () => {
    const updateData = {
      ...settings,
      updatedAt: Date.now(),
    };
    await updateDoc(doc(db, "sessions", sessionId), updateData);
  });
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
  if (isGuestSessionActive()) {
    const sessions = await getChatSessions("nvidia-guest-dev");
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem("nim_guest_sessions", JSON.stringify(filtered));
    localStorage.removeItem("nim_guest_messages_" + sessionId);
    return;
  }
  return runWithDbFallback(async () => {
    await deleteDoc(doc(db, "sessions", sessionId));
  });
};

export const saveChatSnapshot = async (
  userId: string,
  title: string,
  modelsUsed: string[],
  messages: Message[]
): Promise<string> => {
  if (isGuestUser(userId) || isGuestSessionActive()) {
    const snapshotId = "guest_snapshot_" + Math.random().toString(36).substring(7);
    const data = localStorage.getItem("nim_guest_snapshots") || "[]";
    const snapshots = JSON.parse(data);
    snapshots.unshift({
      id: snapshotId,
      userId,
      title,
      modelsUsed,
      messages,
      createdAt: Date.now()
    });
    localStorage.setItem("nim_guest_snapshots", JSON.stringify(snapshots));
    return snapshotId;
  }
  return runWithDbFallback(async () => {
    const snapshotRef = await addDoc(collection(db, "chat_history"), {
      userId,
      title,
      modelsUsed,
      messages,
      createdAt: Date.now()
    });
    return snapshotRef.id;
  });
};

export const forkSession = async (
  originalSessionId: string,
  upToMessageTimestamp: number,
  currentModel: string,
): Promise<string> => {
  if (isGuestSessionActive()) {
    const sessions = await getChatSessions("nvidia-guest-dev");
    const oldSession = sessions.find(s => s.id === originalSessionId);
    if (!oldSession) throw new Error("Session not found");

    const newId = "guest_session_" + Math.random().toString(36).substring(7);
    const newSession: ChatSession = {
      ...oldSession,
      id: newId,
      title: `${oldSession.title} (Forked)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sessions.unshift(newSession);
    localStorage.setItem("nim_guest_sessions", JSON.stringify(sessions));

    // Copy messages
    const allMsgs = await getMessages(originalSessionId);
    const filteredMsgs = allMsgs.filter(m => m.timestamp <= upToMessageTimestamp);
    localStorage.setItem("nim_guest_messages_" + newId, JSON.stringify(filteredMsgs));

    return newId;
  }
  return runWithDbFallback(async () => {
    // 1. Get original session to get user ID
    const sessionDoc = await getDoc(doc(db, "sessions", originalSessionId));
    if (!sessionDoc.exists()) throw new Error("Session not found");

    const oldSessionData = sessionDoc.data() as ChatSession;

    // 2. Create new session
    const newSessionRef = await addDoc(collection(db, "sessions"), {
      ...oldSessionData,
      title: `${oldSessionData.title} (Forked)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 3. Copy messages up to the point
    const messagesMsgQ = query(
      collection(db, `sessions/${originalSessionId}/messages`),
      where("timestamp", "<=", upToMessageTimestamp),
      orderBy("timestamp", "asc"),
    );
    const msgSnap = await getDocs(messagesMsgQ);

    for (const messageDoc of msgSnap.docs) {
      await addDoc(
        collection(db, `sessions/${newSessionRef.id}/messages`),
        messageDoc.data(),
      );
    }

    return newSessionRef.id;
  });
};

export const getMessages = async (sessionId: string): Promise<Message[]> => {
  if (isGuestSessionActive()) {
    const data = localStorage.getItem("nim_guest_messages_" + sessionId);
    return data ? JSON.parse(data) : [];
  }
  return runWithDbFallback(async () => {
    const q = query(
      collection(db, `sessions/${sessionId}/messages`),
      orderBy("timestamp", "asc"),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Message,
    );
  });
};

export const addMessage = async (
  sessionId: string,
  role: string,
  content: string,
  attachments?: Attachment[],
  model?: string
): Promise<Message> => {
  if (isGuestSessionActive()) {
    const messages = await getMessages(sessionId);
    const newMsg: Message = {
      id: "guest_msg_" + Math.random().toString(36).substring(7),
      role: role as "user" | "assistant" | "system",
      content,
      timestamp: Date.now(),
      attachments,
      model,
    };
    messages.push(newMsg);
    localStorage.setItem("nim_guest_messages_" + sessionId, JSON.stringify(messages));

    // Update title in sessions list if user's first message
    if (role === "user" && content.length > 0) {
      const sessions = await getChatSessions("nvidia-guest-dev");
      const updated = sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: content.substring(0, 30) + "...",
            updatedAt: Date.now()
          };
        }
        return s;
      });
      localStorage.setItem("nim_guest_sessions", JSON.stringify(updated));
    }
    return newMsg;
  }
  return runWithDbFallback(async () => {
    const messageData: any = {
      role,
      content,
      timestamp: Date.now(),
    };
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }
    if (model) {
      messageData.model = model;
    }

    const messageRef = await addDoc(
      collection(db, `sessions/${sessionId}/messages`),
      messageData,
    );

    // Update session updatedAt
    const updateData: any = { updatedAt: Date.now() };
    if (role === "user" && content.length > 0) {
      updateData.title = content.substring(0, 30) + "...";
    }

    await updateDoc(doc(db, "sessions", sessionId), updateData);

    return {
      id: messageRef.id,
      ...messageData,
    } as Message;
  });
};
