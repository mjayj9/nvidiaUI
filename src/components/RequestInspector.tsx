import { useState, useEffect } from "react";
import { RequestLogger, RequestLogEntry } from "../lib/requestLogger";
import { Search, Code2, Trash2, ChevronRight, ChevronDown, Check, Copy, Activity, Cpu, Sparkles } from "lucide-react";

export default function RequestInspector() {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to logs
    const unsubscribe = RequestLogger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
      if (updatedLogs.length > 0 && !selectedLogId) {
        setSelectedLogId(updatedLogs[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedLogId]);

  const handleCopy = (text: string, copyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(copyId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    RequestLogger.clear();
    setSelectedLogId(null);
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLog = logs.find((l) => l.id === selectedLogId);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#050505] text-neutral-100 overflow-hidden font-sans border-t border-neutral-900">
      {/* Sidebar List */}
      <div className="w-full md:w-96 border-r border-neutral-900 flex flex-col h-1/2 md:h-full shrink-0">
        <div className="p-4 border-b border-neutral-900 flex items-center justify-between gap-3 bg-[#080808]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#76b900]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">Request History</span>
          </div>
          <button
            onClick={handleClear}
            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900/50 rounded-lg transition cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-neutral-900 bg-[#060606]">
          <div className="relative flex items-center bg-[#0a0a0a] border border-neutral-850 rounded-xl px-3 py-2 text-xs focus-within:border-[#76b900]/40 transition">
            <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Filter by model or endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-neutral-200 outline-none w-full placeholder-neutral-600"
            />
          </div>
        </div>

        {/* Request items scroll area */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-900">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-650 text-xs">
              <Code2 className="w-8 h-8 opacity-25 mb-2" />
              <span>No requests captured yet.</span>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isActive = log.id === selectedLogId;
              const hasError = !!log.error || (log.responseStatus && log.responseStatus >= 400);
              const isPending = !log.responseStatus && !log.error;

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isActive
                      ? "bg-[#76b900]/10 border-[#76b900]/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      : "bg-[#0b0b0b] border-neutral-900 hover:border-neutral-800 hover:bg-[#0f0f0f]"
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-mono text-[9px] text-neutral-500 truncate max-w-[80px]">
                      {log.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        hasError
                          ? "bg-red-950/40 text-red-400 border border-red-900/30"
                          : isPending
                          ? "bg-amber-950/40 text-amber-400 border border-amber-900/30 animate-pulse"
                          : "bg-green-950/40 text-green-400 border border-green-900/30"
                      }`}
                    >
                      {isPending ? "Streaming" : log.responseStatus || "OK"}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-white truncate leading-tight">
                    {log.model.split("/").pop()}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-medium">
                    <span className="truncate max-w-[150px] font-mono opacity-85">
                      {log.endpoint}
                    </span>
                    <span>
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full overflow-hidden bg-[#030303]">
        {selectedLog ? (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Header info */}
            <div className="p-5 border-b border-neutral-900 bg-[#060606] shrink-0">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span>NIM Request Payload Inspector</span>
                    <span className="text-[#76b900]">•</span>
                    <span className="font-mono">{selectedLog.id}</span>
                  </div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                    <Cpu className="w-4 h-4 text-[#76b900] shrink-0" />
                    {selectedLog.model}
                  </h2>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(
                          {
                            request: selectedLog.requestBody,
                            response: selectedLog.responseBody || selectedLog.streamingChunks?.join(""),
                            metrics: selectedLog.metrics,
                          },
                          null,
                          2
                        ),
                        "copy_all"
                      )
                    }
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === "copy_all" ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === "copy_all" ? "Copied" : "Copy Payload"}
                  </button>
                </div>
              </div>

              {/* Performance Metrics Row */}
              {selectedLog.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-900/60">
                  <div className="bg-[#0b0b0b] border border-neutral-900 rounded-xl p-2.5">
                    <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Time to First Token</div>
                    <div className="text-xs font-bold text-white font-mono">{selectedLog.metrics.ttft} <span className="text-[9px] text-neutral-500">ms</span></div>
                  </div>
                  <div className="bg-[#0b0b0b] border border-neutral-900 rounded-xl p-2.5">
                    <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Speed</div>
                    <div className="text-xs font-bold text-[#76b900] font-mono">{selectedLog.metrics.tps} <span className="text-[9px] text-neutral-500">t/s</span></div>
                  </div>
                  <div className="bg-[#0b0b0b] border border-neutral-900 rounded-xl p-2.5">
                    <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Latency</div>
                    <div className="text-xs font-bold text-white font-mono">{selectedLog.metrics.totalTime} <span className="text-[9px] text-neutral-500">ms</span></div>
                  </div>
                  <div className="bg-[#0b0b0b] border border-neutral-900 rounded-xl p-2.5">
                    <div className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Tokens Generated</div>
                    <div className="text-xs font-bold text-white font-mono">{selectedLog.metrics.tokens || 0} <span className="text-[9px] text-neutral-500">tkns</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Inspect details contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-neutral-900 min-h-0">
              {/* Error logs if any */}
              {selectedLog.error && (
                <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1">
                    <span>🚨 Exception Error log:</span>
                  </div>
                  <pre className="font-mono text-[10px] bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap border border-red-950/40">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              {/* Collapsible parts */}
              <CollapsibleSection title="Request Headers" defaultOpen={false}>
                <div className="bg-[#080808] border border-neutral-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-neutral-400">
                  {Object.entries(selectedLog.headers).map(([key, val]) => (
                    <div key={key} className="flex border-b border-neutral-900/40 py-1 last:border-b-0">
                      <span className="text-neutral-500 font-bold shrink-0 w-32">{key}:</span>
                      <span className="text-white truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Request Body Payload" defaultOpen={true}>
                <div className="relative group">
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.requestBody, null, 2), "req_body")}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 bg-[#0c0c0c] hover:bg-[#151515] border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition duration-200 cursor-pointer"
                    title="Copy Request Body"
                  >
                    {copiedId === "req_body" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre className="bg-[#080808] border border-neutral-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-neutral-300 overflow-x-auto max-h-[350px]">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Response Text / Output" defaultOpen={true}>
                <div className="relative group">
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedLog.responseBody || selectedLog.streamingChunks?.join("") || "",
                        "res_body"
                      )
                    }
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 bg-[#0c0c0c] hover:bg-[#151515] border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition duration-200 cursor-pointer"
                    title="Copy Response Text"
                  >
                    {copiedId === "res_body" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <div className="bg-[#080808] border border-neutral-900 rounded-xl p-4 font-sans text-xs leading-relaxed text-neutral-300 min-h-[100px] max-h-[350px] overflow-y-auto whitespace-pre-wrap">
                    {selectedLog.responseBody || selectedLog.streamingChunks?.join("") || (
                      <span className="text-neutral-650 italic">No output content received yet.</span>
                    )}
                  </div>
                </div>
              </CollapsibleSection>

              {selectedLog.streamingChunks && selectedLog.streamingChunks.length > 0 && (
                <CollapsibleSection title={`Streaming Chunks History (${selectedLog.streamingChunks.length} chunks)`} defaultOpen={false}>
                  <pre className="bg-[#080808] border border-neutral-900 rounded-xl p-4 font-mono text-[10px] leading-normal text-neutral-500 max-h-[300px] overflow-y-auto space-y-1">
                    {selectedLog.streamingChunks.map((chunk, idx) => (
                      <div key={idx} className="border-b border-neutral-900/40 pb-1 last:border-b-0 flex gap-2">
                        <span className="text-neutral-700 font-bold shrink-0 w-8">#{idx + 1}</span>
                        <span className="text-neutral-400 whitespace-pre-wrap">{JSON.stringify(chunk)}</span>
                      </div>
                    ))}
                  </pre>
                </CollapsibleSection>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-xs">
            <Code2 className="w-12 h-12 opacity-15 mb-3" />
            <span>Select a request log item from the sidebar to inspect payload details.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-900 rounded-xl overflow-hidden bg-[#070707]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-900/40 transition-colors border-b border-neutral-900"
      >
        <span className="text-xs font-bold text-white uppercase tracking-wider">{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
      </button>
      {isOpen && <div className="p-3 bg-[#030303]">{children}</div>}
    </div>
  );
}
