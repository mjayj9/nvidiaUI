export interface SavedWorkItem {
  id: string;
  type: "chat" | "rag" | "vision" | "image-gen" | "speech" | "video" | "compare" | "eval";
  title: string;
  content: string;
  details?: string;
  mediaUrl?: string;
  timestamp: number;
  isFavorite: boolean;
  params: any;
}

function redactSensitiveData(text: string): string {
  if (!text) return text;
  // Redact nvidia api keys: nvapi- followed by alpha-numeric characters, underscores, and dashes
  return text.replace(/nvapi-[a-zA-Z0-9_-]+/g, "nvapi-••••••••");
}

export function saveWorkToGallery(item: Omit<SavedWorkItem, "id" | "timestamp" | "isFavorite">) {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem("nim_saved_works");
    const list: SavedWorkItem[] = saved ? JSON.parse(saved) : [];
    
    const newItem: SavedWorkItem = {
      ...item,
      title: redactSensitiveData(item.title),
      content: redactSensitiveData(item.content),
      details: item.details ? redactSensitiveData(item.details) : undefined,
      id: "work_" + Date.now() + "_" + Math.random().toString(36).substring(4),
      timestamp: Date.now(),
      isFavorite: false
    };
    
    const updated = [newItem, ...list];
    localStorage.setItem("nim_saved_works", JSON.stringify(updated));
    return newItem;
  } catch (e) {
    console.error("Failed to save work to gallery", e);
    throw e;
  }
}
