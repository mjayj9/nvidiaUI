import { useState, useRef, useEffect, useCallback } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { chatWithNvidiaObject, NimMetrics } from "../lib/nim";
import { NIM_MODELS } from "../models";
import { Play, Cpu, Trash2, Plus, Table, Zap, Clock, Award, Loader2, Sparkles } from "lucide-react";
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
  const abortControllersRef = useRef<AbortController[]>([]);

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

    handleStopAll(); // Clean previous runs
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
      };
    });

    setComparisons(initialComparisons);

    const controllers: AbortController[] = [];
    abortControllersRef.current = controllers;

    const promises = selectedModels.map(async (modelId, index) => {
      const controller = new AbortController();
      controllers.push(controller);

      try {
        await chatWithNvidiaObject(
          apiKey,
          modelId,
          [{ role: "user", content: prompt }],
          (chunk) => {
            setComparisons((prev) =>
              prev.map((c) => (c.modelId === modelId ? { ...c, response: c.response + chunk } : c))
            );
          },
          {
            abortSignal: controller.signal,
            onMetrics: (metrics) => {
              setComparisons((prev) =>
                prev.map((c) => (c.modelId === modelId ? { ...c, metrics, isGenerating: false } : c))
              );
            },
          }
        );
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setComparisons((prev) =>
            prev.map((c) => (c.modelId === modelId ? { ...c, error: error.message || String(error), isGenerating: false } : c))
          );
        }
      }
    });

    Promise.all(promises).finally(() => {
      setIsAnyGenerating(false);
    });
  };

  // Helper to determine best metrics
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
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="p-6 border-b border-neutral-900 shrink-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#76b900]" />
            <h1 className="text-lg font-bold text-white tracking-tight">Model Compare Lab</h1>
            <span className="px-2 py-0.5 text-[9px] font-bold text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/25 rounded uppercase">Developer Console</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            동일한 프롬프트에 대해 여러 NVIDIA NIM 모델의 실시간 생성 속도, 비용 및 응답 품질을 비교 벤치마킹합니다.
          </p>
        </div>
        {isAnyGenerating && (
          <button
            onClick={handleStopAll}
            className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/30"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Stop Generating
          </button>
        )}
      </header>

      {/* Model Selection Panel */}
      <div className="p-4 bg-neutral-900/40 border-b border-neutral-900 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Selected Models ({selectedModels.length}/3)</span>
          <div className="flex flex-wrap gap-2">
            {selectedModels.map((modelId) => {
              const modelInfo = textModels.find((m) => m.id === modelId);
              return (
                <div
                  key={modelId}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-[#0d0d0d] border border-neutral-800 rounded-lg text-xs font-semibold"
                >
                  <span className="text-neutral-300 truncate max-w-[180px]">{modelInfo?.name || modelId}</span>
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
              className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 focus:border-[#76b900] text-xs font-semibold rounded-lg text-neutral-300 transition-all outline-none cursor-pointer"
            >
              <option value="">+ Add Model to Compare</option>
              {textModels
                .filter((m) => !selectedModels.includes(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative">
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
                  className="px-4 py-2 border border-neutral-800 bg-[#0c0c0c] hover:bg-neutral-900 rounded-lg text-xs text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-y-hidden divide-y md:divide-y-0 md:divide-x divide-neutral-900">
            {comparisons.map((c) => {
              const hasTTFTWinner = c.metrics && c.metrics.ttft === bestMetrics.lowestTTFT;
              const hasTPSWinner = c.metrics && c.metrics.tps === bestMetrics.highestTPS;
              const hasLatencyWinner = c.metrics && c.metrics.totalTime === bestMetrics.lowestLatency;

              return (
                <div key={c.modelId} className="flex-1 flex flex-col overflow-hidden min-w-[280px]">
                  {/* Model header panel */}
                  <div className="p-4 bg-neutral-950 border-b border-neutral-900 flex flex-col gap-1 select-none">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">NIM Node</span>
                    <span className="text-sm font-bold text-white truncate">{c.name}</span>
                    <span className="text-[9px] text-neutral-400 truncate max-w-xs font-mono">{c.modelId}</span>
                  </div>

                  {/* Model response output */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-5 select-text prose prose-invert prose-xs leading-relaxed max-w-none scrollbar-thin bg-neutral-950/20">
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

                  {/* Telemetry panel */}
                  <div className="p-4 border-t border-neutral-900 bg-[#090909] font-mono text-[10px] space-y-2 select-none">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Performance Metrics</span>
                    
                    {c.metrics ? (
                      <div className="grid grid-cols-2 gap-1.5 text-neutral-400">
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-850 flex flex-col">
                          <span className="text-neutral-500 text-[8px] uppercase">TTFT</span>
                          <span className={cn("text-white font-bold flex items-center gap-1 mt-0.5", hasTTFTWinner && "text-green-400")}>
                            {c.metrics.ttft} ms
                            {hasTTFTWinner && <Award className="w-3 h-3 text-green-400 shrink-0" />}
                          </span>
                        </div>
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-850 flex flex-col">
                          <span className="text-neutral-500 text-[8px] uppercase">TPS</span>
                          <span className={cn("text-white font-bold flex items-center gap-1 mt-0.5", hasTPSWinner && "text-green-400")}>
                            {c.metrics.tps}
                            {hasTPSWinner && <Zap className="w-3 h-3 text-green-400 shrink-0" />}
                          </span>
                        </div>
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-850 flex flex-col col-span-2">
                          <span className="text-neutral-500 text-[8px] uppercase">Overall Latency</span>
                          <span className={cn("text-white font-bold flex items-center gap-1 mt-0.5", hasLatencyWinner && "text-green-400")}>
                            {(c.metrics.totalTime / 1000).toFixed(2)} s
                            {hasLatencyWinner && <Clock className="w-3 h-3 text-green-400 shrink-0" />}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-neutral-600 italic">
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

      {/* Footer / Input Area */}
      <footer className="p-5 border-t border-neutral-900 bg-neutral-950 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="모델들을 비교할 프롬프트를 입력해 주세요..."
              disabled={isAnyGenerating}
              rows={2}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#76b900] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
