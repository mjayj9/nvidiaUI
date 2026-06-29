import { useState, useRef } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { chatWithNvidiaObject, NimMetrics } from "../lib/nim";
import { NIM_MODELS } from "../models";
import { Swords, Eye, Award, RefreshCw, BarChart2, Loader2, Award as TrophyIcon } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { cn } from "../lib/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArenaModelState {
  modelId: string;
  name: string;
  response: string;
  isGenerating: boolean;
  metrics: NimMetrics | null;
  error: string | null;
}

interface LeaderboardRecord {
  modelId: string;
  name: string;
  wins: number;
  losses: number;
  ties: number;
}

export default function TournamentArena() {
  const { apiKey } = useWorkspace();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [modelA, setModelA] = useState<ArenaModelState | null>(null);
  const [modelB, setModelB] = useState<ArenaModelState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState<"A" | "B" | "tie" | null>(null);

  const abortControllerARef = useRef<AbortController | null>(null);
  const abortControllerBRef = useRef<AbortController | null>(null);

  // Load leaderboard from localStorage
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nim_arena_leaderboard");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const textModels = NIM_MODELS.filter((m) => m.type === "TEXT");

  const handleStop = () => {
    if (abortControllerARef.current) abortControllerARef.current.abort();
    if (abortControllerBRef.current) abortControllerBRef.current.abort();
    
    if (modelA?.isGenerating) {
      setModelA((prev) => prev ? { ...prev, isGenerating: false, error: "Aborted" } : null);
    }
    if (modelB?.isGenerating) {
      setModelB((prev) => prev ? { ...prev, isGenerating: false, error: "Aborted" } : null);
    }
    setIsGenerating(false);
  };

  const handleNewMatch = () => {
    handleStop();
    setPrompt("");
    setModelA(null);
    setModelB(null);
    setHasVoted(false);
    setVoteChoice(null);
  };

  const handleStartFight = async () => {
    if (!prompt.trim()) {
      toast("질문을 입력해 주세요.", "error");
      return;
    }
    if (!apiKey) {
      toast("설정(Settings)에서 NVIDIA API Key를 먼저 등록해 주세요.", "error");
      return;
    }
    if (textModels.length < 2) {
      toast("비교할 모델이 최소 2개 필요합니다.", "error");
      return;
    }

    setIsGenerating(true);
    setHasVoted(false);
    setVoteChoice(null);

    // Randomly pick two distinct models
    const idxA = Math.floor(Math.random() * textModels.length);
    let idxB = Math.floor(Math.random() * textModels.length);
    while (idxA === idxB) {
      idxB = Math.floor(Math.random() * textModels.length);
    }

    const modelInfoA = textModels[idxA];
    const modelInfoB = textModels[idxB];

    const stateA: ArenaModelState = {
      modelId: modelInfoA.id,
      name: modelInfoA.name,
      response: "",
      isGenerating: true,
      metrics: null,
      error: null,
    };

    const stateB: ArenaModelState = {
      modelId: modelInfoB.id,
      name: modelInfoB.name,
      response: "",
      isGenerating: true,
      metrics: null,
      error: null,
    };

    setModelA(stateA);
    setModelB(stateB);

    const controllerA = new AbortController();
    const controllerB = new AbortController();
    abortControllerARef.current = controllerA;
    abortControllerBRef.current = controllerB;

    const promiseA = chatWithNvidiaObject(
      apiKey,
      modelInfoA.id,
      [{ role: "user", content: prompt }],
      (chunk) => {
        setModelA((prev) => prev ? { ...prev, response: prev.response + chunk } : null);
      },
      {
        abortSignal: controllerA.signal,
        onMetrics: (metrics) => {
          setModelA((prev) => prev ? { ...prev, metrics, isGenerating: false } : null);
        },
      }
    ).catch((err) => {
      if (err.name !== "AbortError") {
        setModelA((prev) => prev ? { ...prev, error: err.message || String(err), isGenerating: false } : null);
      }
    });

    const promiseB = chatWithNvidiaObject(
      apiKey,
      modelInfoB.id,
      [{ role: "user", content: prompt }],
      (chunk) => {
        setModelB((prev) => prev ? { ...prev, response: prev.response + chunk } : null);
      },
      {
        abortSignal: controllerB.signal,
        onMetrics: (metrics) => {
          setModelB((prev) => prev ? { ...prev, metrics, isGenerating: false } : null);
        },
      }
    ).catch((err) => {
      if (err.name !== "AbortError") {
        setModelB((prev) => prev ? { ...prev, error: err.message || String(err), isGenerating: false } : null);
      }
    });

    Promise.all([promiseA, promiseB]).finally(() => {
      setIsGenerating(false);
    });
  };

  const handleVote = (choice: "A" | "B" | "tie") => {
    if (!modelA || !modelB || hasVoted) return;

    setHasVoted(true);
    setVoteChoice(choice);

    // Update leaderboard stats
    setLeaderboard((prev) => {
      let nextLeaderboard = [...prev];

      const getOrAddRecord = (modelId: string, name: string) => {
        let record = nextLeaderboard.find((r) => r.modelId === modelId);
        if (!record) {
          record = { modelId, name, wins: 0, losses: 0, ties: 0 };
          nextLeaderboard.push(record);
        }
        return record;
      };

      const recordA = getOrAddRecord(modelA.modelId, modelA.name);
      const recordB = getOrAddRecord(modelB.modelId, modelB.name);

      if (choice === "A") {
        recordA.wins++;
        recordB.losses++;
      } else if (choice === "B") {
        recordB.wins++;
        recordA.losses++;
      } else {
        recordA.ties++;
        recordB.ties++;
      }

      localStorage.setItem("nim_arena_leaderboard", JSON.stringify(nextLeaderboard));
      return nextLeaderboard;
    });

    toast("투표해 주셔서 감사합니다! 모델들의 실명이 공개되었습니다.", "success");
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const totalA = a.wins + a.losses + a.ties;
    const totalB = b.wins + b.losses + b.ties;
    const winRateA = totalA > 0 ? a.wins / totalA : 0;
    const winRateB = totalB > 0 ? b.wins / totalB : 0;
    return winRateB - winRateA || b.wins - a.wins;
  });

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="p-6 border-b border-neutral-900 shrink-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#76b900]" />
            <h1 className="text-lg font-bold text-white tracking-tight">Model Tournament Arena</h1>
            <span className="px-2 py-0.5 text-[9px] font-bold text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/25 rounded uppercase">Developer Console</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            두 개의 임의 모델이 제공하는 블라인드 답변을 읽고 최선의 품질을 선택해 리더보드를 기록합니다.
          </p>
        </div>

        {modelA && (
          <button
            onClick={handleNewMatch}
            className="px-4 py-2 border border-neutral-800 bg-[#0d0d0d] hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Match
          </button>
        )}
      </header>

      {/* Main split: Arena vs Leaderboard */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-neutral-900">
        
        {/* Arena Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!modelA || !modelB ? (
            // Empty State / Setup
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
              <div className="w-16 h-16 bg-[#76b900]/10 border border-[#76b900]/25 rounded-2xl flex items-center justify-center mb-4 text-[#76b900]">
                <Swords className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">블라인드 매치 준비 완료</h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1.5 leading-relaxed">
                질문을 입력하고 매치를 시작하면 두 개의 익명 모델이 실시간 답변 경쟁을 시작합니다.
              </p>
              
              <div className="mt-6 w-full max-w-md bg-neutral-900/30 border border-neutral-850 p-4 rounded-xl flex items-center gap-3 text-left">
                <Eye className="w-5 h-5 text-[#76b900] shrink-0" />
                <div className="text-xs">
                  <div className="text-white font-bold">블라인드 평가 원칙</div>
                  <div className="text-neutral-400 mt-0.5 leading-relaxed">답변의 속도와 분량, 논리적 구조를 객관적으로 평가해 본 뒤 하단에서 투표를 행사하세요.</div>
                </div>
              </div>
            </div>
          ) : (
            // Duel Active State
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-neutral-900">
              
              {/* Model A Column */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className={cn(
                  "p-4 border-b border-neutral-900 flex justify-between items-center select-none bg-neutral-950",
                  hasVoted && voteChoice === "A" && "bg-green-950/20 border-green-900/50"
                )}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Candidate Node</span>
                    <span className="text-sm font-bold text-white">Model A</span>
                  </div>
                  {hasVoted && (
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
                      {modelA.name}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 select-text prose prose-invert prose-xs leading-relaxed max-w-none scrollbar-thin bg-neutral-950/20">
                  {modelA.error ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                      {modelA.error}
                    </div>
                  ) : modelA.response ? (
                    <Markdown remarkPlugins={[remarkGfm]}>{modelA.response}</Markdown>
                  ) : modelA.isGenerating ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-xs italic font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#76b900]" />
                      Generating response...
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-600 italic">Waiting...</span>
                  )}
                </div>

                {hasVoted && modelA.metrics && (
                  <div className="p-4 border-t border-neutral-900 bg-[#090909] font-mono text-[10px] grid grid-cols-2 gap-2 text-neutral-400">
                    <div>TTFT: <span className="text-white font-bold">{modelA.metrics.ttft} ms</span></div>
                    <div>TPS: <span className="text-white font-bold">{modelA.metrics.tps}</span></div>
                    <div className="col-span-2">Total Time: <span className="text-white font-bold">{(modelA.metrics.totalTime / 1000).toFixed(2)} s</span></div>
                  </div>
                )}
              </div>

              {/* Model B Column */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className={cn(
                  "p-4 border-b border-neutral-900 flex justify-between items-center select-none bg-neutral-950",
                  hasVoted && voteChoice === "B" && "bg-green-950/20 border-green-900/50"
                )}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Candidate Node</span>
                    <span className="text-sm font-bold text-white">Model B</span>
                  </div>
                  {hasVoted && (
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
                      {modelB.name}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 select-text prose prose-invert prose-xs leading-relaxed max-w-none scrollbar-thin bg-neutral-950/20">
                  {modelB.error ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                      {modelB.error}
                    </div>
                  ) : modelB.response ? (
                    <Markdown remarkPlugins={[remarkGfm]}>{modelB.response}</Markdown>
                  ) : modelB.isGenerating ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-xs italic font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#76b900]" />
                      Generating response...
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-600 italic">Waiting...</span>
                  )}
                </div>

                {hasVoted && modelB.metrics && (
                  <div className="p-4 border-t border-neutral-900 bg-[#090909] font-mono text-[10px] grid grid-cols-2 gap-2 text-neutral-400">
                    <div>TTFT: <span className="text-white font-bold">{modelB.metrics.ttft} ms</span></div>
                    <div>TPS: <span className="text-white font-bold">{modelB.metrics.tps}</span></div>
                    <div className="col-span-2">Total Time: <span className="text-white font-bold">{(modelB.metrics.totalTime / 1000).toFixed(2)} s</span></div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Leaderboard Panel */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col overflow-hidden bg-neutral-900/10">
          <div className="p-4 border-b border-neutral-900 bg-neutral-950 flex items-center gap-2 select-none">
            <BarChart2 className="w-4 h-4 text-[#76b900]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Arena Leaderboard</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {sortedLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-600 italic">
                전적이 기록되지 않았습니다.<br />아레나 배틀을 개시하세요!
              </div>
            ) : (
              sortedLeaderboard.map((item, idx) => {
                const total = item.wins + item.losses + item.ties;
                const winRate = total > 0 ? ((item.wins / total) * 100).toFixed(0) : "0";
                
                return (
                  <div key={item.modelId} className="bg-neutral-950 border border-neutral-850 p-3 rounded-xl space-y-1.5 flex items-center justify-between gap-3 relative overflow-hidden group">
                    {idx === 0 && <div className="absolute top-0 right-0 w-8 h-8 bg-[#76b900]/10 rounded-bl-full flex items-center justify-center text-[#76b900]" title="1st Place"><TrophyIcon className="w-3.5 h-3.5 -mt-1 -mr-1" /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-neutral-200 truncate flex items-center gap-1">
                        <span className="text-neutral-500 font-mono text-[10px]">#{idx + 1}</span>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        W:{item.wins} L:{item.losses} T:{item.ties} ({total} games)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-[#76b900]">{winRate}%</div>
                      <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold font-mono">Win Rate</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Footer / Controls */}
      <footer className="p-5 border-t border-neutral-900 bg-neutral-950 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {modelA && modelB && !modelA.isGenerating && !modelB.isGenerating && !hasVoted ? (
            // Voting Controls
            <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom duration-300">
              <span className="text-xs font-bold text-[#76b900] uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" /> Select the winner response:
              </span>
              <div className="flex gap-4 w-full max-w-lg">
                <button
                  onClick={() => handleVote("A")}
                  className="flex-1 py-3 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-[#76b900]/10 hover:scale-[1.01] transition-all"
                >
                  Model A is Better
                </button>
                <button
                  onClick={() => handleVote("tie")}
                  className="px-6 py-3 border border-neutral-800 hover:bg-neutral-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  It's a Tie
                </button>
                <button
                  onClick={() => handleVote("B")}
                  className="flex-1 py-3 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-[#76b900]/10 hover:scale-[1.01] transition-all"
                >
                  Model B is Better
                </button>
              </div>
            </div>
          ) : (
            // Standard Prompt Input or Match complete reset
            <div className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="블라인드로 비교 대결을 펼칠 질문을 작성해 주세요..."
                disabled={isGenerating || hasVoted}
                rows={2}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#76b900] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              {hasVoted ? (
                <button
                  onClick={handleNewMatch}
                  className="px-6 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Next Match</span>
                </button>
              ) : (
                <button
                  onClick={handleStartFight}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-6 bg-[#76b900] hover:bg-[#66a000] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-wider">Fighting...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Fight!</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
