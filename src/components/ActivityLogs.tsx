import { Activity, Clock, Cpu, FileText, Info, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  model: string;
  details: string;
  status: "success" | "failed";
}

export default function ActivityLogs() {
  const { language } = useWorkspace();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchLogs();

    if (typeof window !== "undefined") {
      window.addEventListener("nim_activity_logged", fetchLogs);
      return () => {
        window.removeEventListener("nim_activity_logged", fetchLogs);
      };
    }
  }, []);

  const fetchLogs = () => {
    setIsLoading(true);
    let localList: LogEntry[] = [];
    
    try {
      const saved = localStorage.getItem("nim_activity_logs");
      if (saved) {
        localList = JSON.parse(saved);
      }
    } catch (err) {
      console.error("Failed to parse local activity logs", err);
    }

    try {
      const savedSafety = localStorage.getItem("nim_local_safety_logs");
      if (savedSafety) {
        const parsedSafety = JSON.parse(savedSafety);
        if (Array.isArray(parsedSafety)) {
          const mappedSafety: LogEntry[] = parsedSafety.map((log: any) => ({
            id: log.id,
            timestamp: log.timestamp,
            type: log.safetyRisk === "Blocked" ? "Safety Block" : "Safety Check",
            model: "Llama-3.1-Nemotron",
            details: log.maskedInput ? `Scrubbed prompt: "${log.maskedInput}"` : "Safety audit check completed",
            status: log.safetyRisk === "Blocked" ? "failed" : "success",
          }));
          localList = [...localList, ...mappedSafety];
        }
      }
    } catch (err) {
      console.error("Failed to parse local safety logs", err);
    }

    fetch("/api/safety/logs")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const mappedLogs: LogEntry[] = data.map((log: any) => ({
            id: log.id,
            timestamp: log.timestamp,
            type: log.safetyRisk === "Blocked" ? "Safety Block" : "AI Inference",
            model: "Llama-3.1-Nemotron",
            details: log.maskedInput ? `Scrubbed prompt: "${log.maskedInput}"` : "General request completed",
            status: log.safetyRisk === "Blocked" ? "failed" : "success",
          }));
          const merged = [...localList, ...mappedLogs].sort((a, b) => {
            const timeA = Date.parse(a.timestamp) || 0;
            const timeB = Date.parse(b.timestamp) || 0;
            return timeB - timeA;
          });
          setLogs(merged);
        } else {
          setLogs(localList.sort((a, b) => {
            const timeA = Date.parse(a.timestamp) || 0;
            const timeB = Date.parse(b.timestamp) || 0;
            return timeB - timeA;
          }));
        }
      })
      .catch((e) => {
        console.warn("Backend logs unavailable, falling back to local logs.");
        setLogs(localList.sort((a, b) => {
          const timeA = Date.parse(a.timestamp) || 0;
          const timeB = Date.parse(b.timestamp) || 0;
          return timeB - timeA;
        }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === "all") return true;
    if (filterType === "success") return log.status === "success";
    if (filterType === "failed") return log.status === "failed";
    if (filterType === "safety") {
      return log.type.toLowerCase().includes("safety") || log.type.toLowerCase().includes("block");
    }
    return log.type.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden h-full">
      {/* Top Header */}
      <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-6 shrink-0 bg-neutral-950 z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#76b900]" />
          <span className="text-sm font-semibold text-white">
            {language === "ko" ? "활동 감사 로그 (Activity Logs)" : "Activity Audit Logs"}
          </span>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="text-xs font-semibold px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-lg border border-neutral-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {language === "ko" ? "로그 새로고침" : "Refresh Log"}
        </button>
      </header>

      {/* Workspace panel */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full scrollbar-thin space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            {language === "ko" ? "시간 순서별 이벤트 기록" : "Chronological Events"}
          </span>
          <div className="flex gap-2 text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer hover:border-neutral-700 transition"
            >
              <option value="all">{language === "ko" ? "전체 이벤트" : "All Events"}</option>
              <option value="success">{language === "ko" ? "성공 상태만" : "Success Status Only"}</option>
              <option value="failed">{language === "ko" ? "실패/차단 상태만" : "Failed Status Only"}</option>
              <option value="safety">{language === "ko" ? "보안 경고만" : "Safety Alerts Only"}</option>
            </select>
          </div>
        </div>

        {/* Audit list container */}
        <div className="space-y-3.5">
          {isLoading && logs.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#76b900]" />
              {language === "ko" ? "데이터베이스 로그 수집 중..." : "Compiling database entries..."}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">
              {language === "ko" ? "기록된 활동 감사 로그가 없습니다." : "No matching activity events recorded."}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border bg-neutral-900/35 border-neutral-800 flex items-start gap-4 transition-all hover:bg-neutral-900/50`}
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-500 shrink-0">
                  <Clock className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {log.type}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full font-mono ${
                        log.status === "success"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-medium">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-neutral-500 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      {log.model}
                    </span>
                    <span className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
