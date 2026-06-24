export type ModelType =
  | "text"
  | "coding"
  | "image"
  | "reasoning"
  | "tool-calling"
  | "physics"
  | "biology"
  | "audio"
  | "video";

export interface NIMModel {
  id: string;
  name: string;
  brand: string;
  type: "TEXT" | "VISION" | "SPECIAL";
  hasThinking: boolean;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Attachment {
  url: string;
  type: string;
  name: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  model?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemPrompt?: string;
  creativityLevel?: "Low" | "Medium" | "High";
  thinkingEnabled?: boolean;
  maxTokens?: number;
  responseFormat?: string;
  toolsJson?: string;
  temperature?: number;
  topP?: number;
  reasoningEffort?: "low" | "medium" | "high";
  reasoningBudget?: number;
  seed?: number;
  stop?: string;
  isStream?: boolean;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
