export interface LocalLogEntry {
  id: string;
  timestamp: string;
  type: string;
  model: string;
  details: string;
  status: "success" | "failed";
}

function redactSensitiveData(text: string): string {
  if (!text) return text;
  // Redact nvidia api keys: nvapi- followed by alpha-numeric characters, underscores, and dashes
  return text.replace(/nvapi-[a-zA-Z0-9_-]+/g, "nvapi-••••••••");
}

export function logActivity(type: string, model: string, details: string, status: "success" | "failed" = "success") {
  if (typeof window === "undefined") return;

  try {
    const saved = localStorage.getItem("nim_activity_logs");
    const logs: LocalLogEntry[] = saved ? JSON.parse(saved) : [];
    
    const newEntry: LocalLogEntry = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(4),
      timestamp: new Date().toISOString(),
      type: redactSensitiveData(type),
      model: redactSensitiveData(model),
      details: redactSensitiveData(details),
      status
    };
    
    // Cap at 150 items to keep localStorage light
    const updated = [newEntry, ...logs].slice(0, 150);
    localStorage.setItem("nim_activity_logs", JSON.stringify(updated));
    
    // Broadcast event so any open ActivityLogs UI updates immediately
    window.dispatchEvent(new Event("nim_activity_logged"));
  } catch (e) {
    console.error("Failed to write to activity logs", e);
  }
}
