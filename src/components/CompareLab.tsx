import { useState, useRef, useEffect, useCallback } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { chatWithNvidiaObject, NimMetrics } from "../lib/nim";
import { NIM_MODELS } from "../models";
import { Play, Cpu, Trash2, Table, Zap, Clock, Award, Loader2, Star } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { cn } from "../lib/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ModelComparisonState {
  modelId: string;
  name: string;
  response: string;
  isGenerating: boolean;
  metrics: NimMetrics | null;
  error: string | null;
  qualityScore?: number;
  notes?: string;
}

export default function CompareLab() {
  const { apiKey } = useWorkspace();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-8b-instruct"
  ]);

  const [comparisons, setComparisons] = useState<ModelComparisonState[]>([]);
  const [isAnyGenerating, setIsAnyGenerating] = useState(false);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const abortControllersRef = useRef<AbortController[]>([]);

  // Local storage benchmark history
  const [compareHistory, setCompareHistory] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nim_compare_history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Filter only text models
  const textModels = NIM_MODELS.filter((m) => m.type === "TEXT" || m.capabilities.includes("chat"));

  const handleAddModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      toast("이미 선택된 모델입니다.", "error");
      return;
    }
    if (selectedModels.length >= 3) {
      toast("최대 3개 모델까지만 비교 가능합니다.", "error");
      return;
    }
    setSelectedModels((prev) => [...prev, modelId]);
  };

  const handleRemoveModel = (modelId: string) => {
    if (selectedModels.length <= 1) {
      toast("최소 1개 이상의 모델이 필요합니다.", "error");
      return;
    }
    setSelectedModels((prev) => prev.filter((id) => id !== modelId));
  };

  const handleStopAll = () => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current = [];
    setComparisons((prev) =>
      prev.map((c) => (c.isGenerating ? { ...c, isGenerating: false, error: "Aborted by user" } : c))
    );
    setIsAnyGenerating(false);
  };

  const handleRunComparison = async () => {
    if (!prompt.trim()) {
      toast("프롬프트를 입력해 주세요.", "error");
      return;
    }
    if (!apiKey) {
      toast("설정(Settings)에서 NVIDIA API Key를 먼저 입력해 주세요.", "error");
      return;
    }

    handleStopAll();
    setIsAnyGenerating(true);

    const initialComparisons: ModelComparisonState[] = selectedModels.map((modelId) => {
      const modelInfo = textModels.find((m) => m.id === modelId);
      return {
        modelId,
        name: modelInfo?.name || modelId,
        response: "",
        isGenerating: true,
        metrics: null,
        error: null,
        qualityScore: 3,
        notes: "",
      };
    });

    setComparisons(initialComparisons);

    const controllers: AbortController[] = [];
    abortControllersRef.current = controllers;

    const promises = selectedModels.map(async (modelId) => {
      const runsMetrics: NimMetrics[] = [];
      let lastResponse = "";

      for (let run = 1; run <= repeatCount; run++) {
        const controller = new AbortController();
        controllers.push(controller);

        try {
          let currentResponse = "";
          await chatWithNvidiaObject(
            apiKey,
            modelId,
            [{ role: "user", content: prompt }],
            (chunk) => {
              currentResponse += chunk;
              if (run === repeatCount) {
                setComparisons((prev) =>
                  prev.map((c) =>
                    c.modelId === modelId ? { ...c, response: currentResponse } : c
                  )
                );
              }
            },
            {
              abortSignal: controller.signal,
              onMetrics: (metrics) => {
                runsMetrics.push(metrics);
              },
            }
          );
          lastResponse = currentResponse;
        } catch (error: any) {
          if (error.name !== "AbortError") {
            setComparisons((prev) =>
              prev.map((c) =>
                c.modelId === modelId
                  ? { ...c, error: error.message || String(error), isGenerating: false }
                  : c
              )
            );
            break;
          }
        }
      }

      if (runsMetrics.length > 0) {
        const avgTtft = runsMetrics.reduce((acc, curr) => acc + curr.ttft, 0) / runsMetrics.length;
        const avgTotalTime =
          runsMetrics.reduce((acc, curr) => acc + curr.totalTime, 0) / runsMetrics.length;
        const avgTps = runsMetrics.reduce((acc, curr) => acc + curr.tps, 0) / runsMetrics.length;
        const totalTokens = runsMetrics.reduce((acc, curr) => acc + curr.tokens, 0);

        const avgMetrics: NimMetrics = {
          ttft: Math.round(avgTtft),
          totalTime: Math.round(avgTotalTime),
          tps: Number(avgTps.toFixed(1)),
          tokens: Math.round(totalTokens / runsMetrics.length),
        };

        setComparisons((prev) =>
          prev.map((c) =>
            c.modelId === modelId
              ? {
                  ...c,
                  response: lastResponse,
                  metrics: avgMetrics,
                  isGenerating: false,
                }
              : c
          )
        );
      } else {
        setComparisons((prev) =>
          prev.map((c) =>
            c.modelId === modelId ? { ...c, isGenerating: false } : c
          )
        );
      }
    });

    Promise.all(promises).finally(() => {
      setIsAnyGenerating(false);
    });
  };

  const handleUpdateQuality = (modelId: string, score: number) => {
    setComparisons((prev) =>
      prev.map((c) => (c.modelId === modelId ? { ...c, qualityScore: score } : c))
    );
  };

  const handleUpdateNotes = (modelId: string, text: string) => {
    setComparisons((prev) =>
      prev.map((c) => (c.modelId === modelId ? { ...c, notes: text } : c))
    );
  };

  const handleSaveBenchmark = () => {
    if (comparisons.length === 0) return;
    const entry = {
      id: "bench_" + Date.now(),
      timestamp: Date.now(),
      prompt,
      runs: comparisons.map((c) => ({
        modelId: c.modelId,
        name: c.name,
        metrics: c.metrics,
        response: c.response,
        qualityScore: c.qualityScore || 3,
        notes: c.notes || "",
      })),
    };
    const updated = [entry, ...compareHistory].slice(0, 20);
    setCompareHistory(updated);
    localStorage.setItem("nim_compare_history", JSON.stringify(updated));
    toast("벤치마크 결과가 로컬 저장소에 보관되었습니다.", "success");
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(comparisons, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `compare-benchmark-${Date.now()}.json`);
    a.click();
    toast("JSON 파일이 다운로드되었습니다.", "success");
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Model ID,Model Name,TTFT (ms),TPS (tok/s),Total Latency (ms),Tokens,Quality Score,Notes\n";
    comparisons.forEach((c) => {
      csvContent += `"${c.modelId}","${c.name}",${c.metrics?.ttft || 0},${
        c.metrics?.tps || 0
      },${c.metrics?.totalTime || 0},${c.metrics?.tokens || 0},${
        c.qualityScore || 3
      },"${(c.notes || "").replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.setAttribute("href", encodedUri);
    a.setAttribute("download", `compare-benchmark-${Date.now()}.csv`);
    a.click();
    toast("CSV 파일이 다운로드되었습니다.", "success");
  };

  const getBestMetrics = () => {
    let lowestTTFT = Infinity;
    let highestTPS = -1;
    let lowestLatency = Infinity;

    comparisons.forEach((c) => {
      if (c.metrics) {
        if (c.metrics.ttft < lowestTTFT) lowestTTFT = c.metrics.ttft;
        if (c.metrics.tps > highestTPS) highestTPS = c.metrics.tps;
        if (c.metrics.totalTime < lowestLatency) lowestLatency = c.metrics.totalTime;
      }
    });

    return { lowestTTFT, highestTPS, lowestLatency };
  };

  const bestMetrics = getBestMetrics();

  const samplePrompts = [
    {
      title: "코딩 퍼포먼스",
      text: "React에서 abort signal을 사용한 custom fetch hook을 구현하고 예시 코드를 보여줘.",
    },
    {
      title: "논리/추론",
      text: "어떤 방에 초가 5개 켜져 있어. 그중 2개의 초를 껐어. 다음 날 아침에 이 방에 남은 초는 몇 개일까? 논리적으로 설명해줘.",
    },
    {
      title: "창의성 작문",
      text: "NVIDIA NIM을 주제로 테크노 스릴러 공상과학 단편 소설의 시놉시스를 작성해줘.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans border-t border-neutral-900">
      <header className="p-6 border-b border-neutral-900 shrink-0 bg-neutral-950/80 backdrop-blur-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#76b900]" />
            <h1 className="text-sm font-bold text-white tracking-tight uppercase">Model Compare Lab</h1>
            <span className="px-2 py-0.5 text-[8px] font-bold text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/25 rounded uppercase">Developer Console</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">
            동일한 프롬프트에 대해 여러 NVIDIA NIM 모델의 실시간 생성 속도, 비용 및 응답 품질을 비교 벤치마킹합니다.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {comparisons.length > 0 && (
            <>
              <button
                onClick={handleSaveBenchmark}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition cursor-pointer"
              >
                Save Run
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition cursor-pointer"
              >
                JSON Export
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition cursor-pointer"
              >
                CSV Export
              </button>
            </>
          )}
          {isAnyGenerating && (
            <button
              onClick={handleStopAll}
              className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Stop Lab
            </button>
          )}
        </div>
      </header>

      <div className="p-4 bg-neutral-900/40 border-b border-neutral-900 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Selected Models ({selectedModels.length}/3)</span>
          <div className="flex flex-wrap gap-2">
            {selectedModels.map((modelId) => {
              const modelInfo = textModels.find((m) => m.id === modelId);
              return (
                <div
                  key={modelId}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-[#0d0d0d] border border-neutral-850 rounded-lg text-[10px] font-semibold text-neutral-300"
                >
                  <span className="truncate max-w-[150px]">{modelInfo?.name || modelId}</span>
                  <button
                    onClick={() => handleRemoveModel(modelId)}
                    disabled={isAnyGenerating}
                    className="p-0.5 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-900 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Repeat Runs</span>
            <select
              value={repeatCount}
              onChange={(e) => setRepeatCount(parseInt(e.target.value))}
              disabled={isAnyGenerating}
              className="px-2.5 py-1 bg-neutral-950 border border-neutral-850 text-xs font-semibold rounded-lg text-neutral-300 outline-none cursor-pointer focus:border-[#76b900]/40 transition"
            >
              <option value={1}>1 Run (Default)</option>
              <option value={3}>3 Runs (Average)</option>
              <option value={5}>5 Runs (Average)</option>
            </select>
          </div>

          {selectedModels.length < 3 && (
            <div className="relative">
              <select
                disabled={isAnyGenerating}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddModel(e.target.value);
                    e.target.value = ""; // reset
                  }
                }}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 focus:border-[#76b900]/40 text-xs font-semibold rounded-lg text-neutral-300 transition-all outline-none cursor-pointer"
              >
                <option value="">+ Add Model</option>
                {textModels
                  .filter((m) => !selectedModels.includes(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name.split("/").pop()}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative min-h-0">
        {comparisons.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
            <div className="w-16 h-16 bg-[#76b900]/10 border border-[#76b900]/25 rounded-2xl flex items-center justify-center mb-4 text-[#76b900]">
              <Table className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">비교 실험 대기 중</h3>
            <p className="text-xs text-neutral-500 max-w-sm mt-1.5 leading-relaxed">
              상단의 모델을 구성하고 하단에 프롬프트를 입력하여 각 NIM의 추론 성능 벤치마킹을 실행하세요.
            </p>
            <div className="flex flex-wrap gap-3 mt-6 justify-center max-w-xl">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p.text)}
                  className="px-4 py-2 border border-neutral-850 bg-[#0c0c0c] hover:bg-neutral-900 rounded-lg text-xs text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col md:flex-row overflow-y-auto md:overflow-y-hidden divide-y md:divide-y-0 md:divide-x divide-neutral-900 min-h-0">
            {comparisons.map((c) => {
              const hasTTFTWinner = c.metrics && c.metrics.ttft === bestMetrics.lowestTTFT;
              const hasTPSWinner = c.metrics && c.metrics.tps === bestMetrics.highestTPS;
              const hasLatencyWinner = c.metrics && c.metrics.totalTime === bestMetrics.lowestLatency;

              const inputTokens = Math.round(prompt.length / 4);
              const outputTokens = c.metrics?.tokens || 0;
              const estimatedCost = (inputTokens * 0.00015) / 1000 + (outputTokens * 0.00060) / 1000;

              return (
                <div key={c.modelId} className="flex-1 flex flex-col overflow-hidden min-w-[280px]">
                  <div className="p-4 bg-neutral-950 border-b border-neutral-900 flex flex-col gap-1 select-none shrink-0">
                    <span className="text-[9px] font-bold text-neutral-550 uppercase tracking-widest">NIM Node</span>
                    <span className="text-xs font-bold text-white truncate">{c.name}</span>
                    <span className="text-[8px] text-neutral-450 truncate max-w-xs font-mono">{c.modelId}</span>
                  </div>

                  <div className="flex-grow overflow-y-auto p-4 md:p-5 select-text prose prose-invert prose-xs leading-relaxed max-w-none scrollbar-thin bg-neutral-950/20 text-xs">
                    {c.error ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                        {c.error}
                      </div>
                    ) : c.response ? (
                      <Markdown remarkPlugins={[remarkGfm]}>{c.response}</Markdown>
                    ) : c.isGenerating ? (
                      <div className="flex items-center gap-2 text-neutral-500 text-xs italic font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#76b900]" />
                        Streaming response...
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-600 italic">Waiting...</span>
                    )}
                  </div>

                  {!c.isGenerating && c.response && (
                    <div className="p-4 border-t border-neutral-900 bg-[#090909]/40 space-y-2.5 shrink-0">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                        <span>Quality Score</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              onClick={() => handleUpdateQuality(c.modelId, star)}
                              className={`w-3.5 h-3.5 cursor-pointer transition ${
                                star <= (c.qualityScore || 3)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-neutral-700 hover:text-neutral-500"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={c.notes || ""}
                        onChange={(e) => handleUpdateNotes(c.modelId, e.target.value)}
                        placeholder="이 모델의 응답에 대한 평가 메모..."
                        className="w-full bg-[#0a0a0a] border border-neutral-900 rounded-lg px-2.5 py-1.5 text-[10px] text-neutral-350 focus:border-[#76b900]/40 outline-none transition"
                      />
                    </div>
                  )}

                  <div className="p-4 border-t border-neutral-900 bg-[#090909] font-mono text-[9px] space-y-2 select-none shrink-0">
                    <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider block">Performance Metrics</span>
                    
                    {c.metrics ? (
                      <div className="grid grid-cols-2 gap-1.5 text-neutral-400">
                        <div className="p-1.5 bg-neutral-950 rounded border border-neutral-850 flex flex-col">
                          <span className="text-neutral-500 text-[7px] uppercase">TTFT</span>
                          <span className={cn("text-white font-bold flex items-center gap-0.5 mt-0.5", hasTTFTWinner && "text-green-400")}>
                            {c.metrics.ttft} ms
                            {hasTTFTWinner && <Award className="w-2.5 h-2.5 text-green-400 shrink-0" />}
                          </span>
                        </div>
                        <div className="p-1.5 bg-neutral-950 rounded border border-neutral-850 flex flex-col">
                          <span className="text-neutral-500 text-[7px] uppercase">TPS</span>
                          <span className={cn("text-white font-bold flex items-center gap-0.5 mt-0.5", hasTPSWinner && "text-green-400")}>
                            {c.metrics.tps}
                            {hasTPSWinner && <Zap className="w-2.5 h-2.5 text-green-400 shrink-0" />}
                          </span>
                        </div>
                        <div className="p-1.5 bg-neutral-950 rounded border border-neutral-850 flex flex-col">
                          <span className="text-neutral-500 text-[7px] uppercase">Overall Latency</span>
                          <span className={cn("text-white font-bold flex items-center gap-0.5 mt-0.5", hasLatencyWinner && "text-green-400")}>
                            {(c.metrics.totalTime / 1000).toFixed(2)} s
                            {hasLatencyWinner && <Clock className="w-2.5 h-2.5 text-green-400 shrink-0" />}
                          </span>
                        </div>
                        <div className="p-1.5 bg-neutral-950 rounded border border-neutral-850 flex flex-col">
                          <span className="text-neutral-550 text-[7px] uppercase">Estimated Cost</span>
                          <span className="text-[#76b900] font-bold mt-0.5">
                            ${estimatedCost.toFixed(5)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-neutral-655 italic">
                        {c.isGenerating ? "Gathering telemetry..." : "No metrics available"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="p-5 border-t border-neutral-900 bg-neutral-950 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="모델들을 비교할 프롬프트를 입력해 주세요..."
              disabled={isAnyGenerating}
              rows={2}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:border-[#76b900] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              onClick={handleRunComparison}
              disabled={isAnyGenerating || !prompt.trim()}
              className="px-6 bg-[#76b900] hover:bg-[#66a000] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              <Play className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Run Lab</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
