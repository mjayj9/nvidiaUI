import { Activity, Clock, Cpu, FileText, Info, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  model: string;
  details: string;
  status: "success" | "failed";
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/safety/logs"); // we can share log lists or map our activity entries
      if (res.ok) {
        const data = await res.json();
        // Translate safety check logs to activity entries for visual variety, or parse general logs
        const mappedLogs: LogEntry[] = data.map((log: any) => ({
          id: log.id,
          timestamp: log.timestamp,
          type: log.safetyRisk === "Blocked" ? "Safety Block" : "AI Inference",
          model: "Llama-3.1-Nemotron",
          details: log.maskedInput ? `Scrubbed prompt: "${log.maskedInput}"` : "General request completed",
          status: log.safetyRisk === "Blocked" ? "failed" : "success",
        }));
        setLogs(mappedLogs);
      }
    } catch (e) {
      console.error("Failed to load logs", e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === "all") return true;
    if (filterType === "success") return log.status === "success";
    if (filterType === "failed") return log.status === "failed";
    return log.type.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden h-full">
      {/* Top Header */}
      <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-6 shrink-0 bg-neutral-950 z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#76b900]" />
          <span className="text-sm font-semibold text-white">Activity Audit Logs</span>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="text-xs font-semibold px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-lg border border-neutral-800 transition flex items-center gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Refresh Log
        </button>
      </header>

      {/* Workspace panel */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full scrollbar-thin space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Chronological Events
          </span>
          <div className="flex gap-2 text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer hover:border-neutral-700 transition"
            >
              <option value="all">All Events</option>
              <option value="success">Success Status Only</option>
              <option value="failed">Failed Status Only</option>
              <option value="safety">Safety Alerts Only</option>
            </select>
          </div>
        </div>

        {/* Audit list container */}
        <div className="space-y-3.5">
          {isLoading && logs.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#76b900]" />
              Compiling database entries...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl">
              No matching activity events recorded.
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
