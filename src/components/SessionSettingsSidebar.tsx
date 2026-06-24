import { useState, useEffect } from "react";
import { ChatSession } from "../types";
import { updateSessionSettings } from "../lib/api";
import { X } from "lucide-react";

interface SessionSettingsSidebarProps {
  session: ChatSession | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ChatSession>) => void;
}

export default function SessionSettingsSidebar({
  session,
  isOpen,
  onClose,
  onUpdate,
}: SessionSettingsSidebarProps) {
  const [temperature, setTemperature] = useState<number>(1);
  const [topP, setTopP] = useState<number>(0.95);
  const [maxTokens, setMaxTokens] = useState<number>(16384);
  const [reasoningEffort, setReasoningEffort] = useState<"low" | "medium" | "high">("high");
  const [reasoningBudget, setReasoningBudget] = useState<number>(16384);
  const [seed, setSeed] = useState<number>(42);
  const [stop, setStop] = useState<string>("");
  const [isStream, setIsStream] = useState(true);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number>(0);
  const [presencePenalty, setPresencePenalty] = useState<number>(0);

  useEffect(() => {
    if (session) {
      setTemperature(session.temperature ?? 1);
      setTopP(session.topP ?? 0.95);
      setMaxTokens(session.maxTokens ?? 16384);
      setFrequencyPenalty(session.frequencyPenalty ?? 0);
      setPresencePenalty(session.presencePenalty ?? 0);
      // We map creativity level to sliders earlier, but here we just use direct sliders.
    }
  }, [session]);

  const handleUpdate = (updates: any) => {
    if (!session) return;
    updateSessionSettings(session.id, updates).catch(console.error);
    onUpdate(session.id, updates);
  };

  if (!isOpen || !session) return null;

  return (
    <div className="w-80 border-l border-[#76b900]/20 bg-[#070707]/60 backdrop-blur-md h-full flex flex-col shrink-0 text-sm">
      <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-900/60 shrink-0">
        <div className="flex items-center gap-2 text-white font-bold tracking-wide">
          <svg className="w-4 h-4 text-[#76b900] drop-shadow-[0_0_6px_rgba(118,185,0,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-xs uppercase tracking-widest">Parameters</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">System Prompt</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[
              { label: "Coding Agent", value: "You are an expert coding assistant. Provide clean, efficient code." },
              { label: "Creative Writer", value: "You are a creative writer. Use evocative language and vivid imagery." },
              { label: "JSON API", value: "You are a JSON API. Only respond with valid JSON." }
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  handleUpdate({ systemPrompt: preset.value });
                }}
                className="text-[9px] font-bold px-2 py-1 bg-neutral-900 border border-neutral-850 hover:border-[#76b900]/40 text-neutral-300 rounded-lg transition duration-200 cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <textarea
            value={session.systemPrompt || ""}
            onChange={(e) => handleUpdate({ systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant..."
            className="w-full h-24 bg-[#090909]/95 border border-neutral-850 rounded-xl p-3 text-xs text-white focus:border-[#76b900] outline-none resize-none transition-all"
          />
        </div>

        <div className="flex items-center justify-between bg-neutral-900/20 border border-neutral-855 p-3.5 rounded-xl">
          <span className="text-xs font-semibold text-white">Stream Output</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isStream} 
              onChange={(e) => {
                 setIsStream(e.target.checked);
                 handleUpdate({ isStream: e.target.checked });
              }} 
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#76b900] peer-checked:after:bg-black"></div>
          </label>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Reasoning Effort</label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as const).map((effort) => (
              <button
                key={effort}
                onClick={() => {
                  setReasoningEffort(effort);
                  handleUpdate({ reasoningEffort: effort });
                }}
                className={`py-2 rounded-xl border text-[10px] font-bold capitalize transition-all duration-300 cursor-pointer ${
                  reasoningEffort === effort
                    ? "bg-[#76b900]/10 border-[#76b900] text-white shadow-[0_0_8px_rgba(118,185,0,0.15)]"
                    : "bg-[#090909]/80 border-neutral-850 text-neutral-500 hover:border-neutral-750 hover:text-neutral-300"
                }`}
              >
                {effort === "low" ? "none" : effort}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Temperature</label>
            <div className="bg-[#090909] border border-neutral-850 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold">
              {temperature}
            </div>
          </div>
          <div>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={temperature}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTemperature(val);
                handleUpdate({ temperature: val });
              }}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#76b900]"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 mt-1.5 font-medium">
              <span>0.01 (Precise)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Top P</label>
            <div className="bg-[#090909] border border-neutral-850 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold">
              {topP}
            </div>
          </div>
          <div>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={topP}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTopP(val);
                handleUpdate({ topP: val });
              }}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#76b900]"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 mt-1.5 font-medium">
              <span>0.01</span>
              <span>1.0</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Max Tokens</label>
          <input
            type="number"
            value={maxTokens}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setMaxTokens(val);
              handleUpdate({ maxTokens: val });
            }}
            className="w-full bg-[#090909]/95 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#76b900] transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Reasoning Budget</label>
          <input
            type="number"
            value={reasoningBudget}
            onChange={(e) => setReasoningBudget(parseInt(e.target.value))}
            onBlur={() => handleUpdate({ reasoningBudget })}
            className="w-full bg-[#090909]/95 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#76b900] transition-all"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Frequency Penalty</label>
            <div className="bg-[#090909] border border-neutral-850 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold">
              {frequencyPenalty}
            </div>
          </div>
          <div>
            <input
              type="range"
              min="-2.0"
              max="2.0"
              step="0.1"
              value={frequencyPenalty}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFrequencyPenalty(val);
                handleUpdate({ frequencyPenalty: val });
              }}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#76b900]"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 mt-1.5 font-medium">
              <span>-2.0</span>
              <span>0.0</span>
              <span>2.0</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Presence Penalty</label>
            <div className="bg-[#090909] border border-neutral-850 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold">
              {presencePenalty}
            </div>
          </div>
          <div>
            <input
              type="range"
              min="-2.0"
              max="2.0"
              step="0.1"
              value={presencePenalty}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPresencePenalty(val);
                handleUpdate({ presencePenalty: val });
              }}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#76b900]"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 mt-1.5 font-medium">
              <span>-2.0</span>
              <span>0.0</span>
              <span>2.0</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value))}
            onBlur={() => handleUpdate({ seed })}
            className="w-full bg-[#090909]/95 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#76b900] transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Stop Sequences</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {stop.split(',').filter(s => s.trim()).map((s, i) => (
              <div key={i} className="flex items-center gap-1 bg-neutral-900 border border-[#76b900]/30 px-2 py-1 rounded-lg text-xs text-white">
                <span className="text-[10px] font-medium">{s.trim()}</span>
                <button 
                  onClick={() => {
                    const newStop = stop.split(',').filter(x => x.trim() !== s.trim()).join(',');
                    setStop(newStop);
                    handleUpdate({ stop: newStop });
                  }}
                  className="text-neutral-500 hover:text-white p-0.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Comma separated..."
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            onBlur={() => handleUpdate({ stop })}
            className="w-full bg-[#090909]/95 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#76b900] transition-all"
          />
          <span className="text-[9px] text-neutral-600 font-medium">Up to 4 sequences. Enter comma separated values.</span>
        </div>

      </div>
    </div>
  );
}
