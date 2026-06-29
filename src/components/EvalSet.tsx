import { useState, useEffect } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { chatWithNvidiaObject } from "../lib/nim";
import { NIM_MODELS } from "../models";
import { useToast } from "../context/ToastContext";
import {
  Sparkles,
  Play,
  Upload,
  Download,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  AlertTriangle,
  History,
  TrendingUp,
} from "lucide-react";
import { saveWorkToGallery } from "../lib/savedWorksLogger";
import { logActivity } from "../lib/activityLogger";

interface EvalPrompt {
  id: string;
  prompt: string;
  expected?: string;
  criteria?: string;
}

interface EvalResult {
  promptId: string;
  modelId: string;
  response: string;
  isGenerating: boolean;
  score: {
    relevance: number;
    accuracy: number;
    hallucination: boolean;
    pass: boolean | null;
  };
  notes?: string;
}

interface EvalRunRecord {
  id: string;
  timestamp: number;
  models: string[];
  promptsCount: number;
  averageScore: number;
  passRate: number;
}

const DEFAULT_PROMPTS: EvalPrompt[] = [
  {
    id: "p1",
    prompt: "RAG (Retrieval-Augmented Generation)의 개념을 초등학생도 이해할 수 있게 비유를 들어 설명해 줘.",
    expected: "책을 보고 답을 찾는 도서관 사서 비유 등 포함",
    criteria: "전문 용어 최소화, 친숙한 비유 사용, RAG 3단계(검색, 증강, 생성) 맥락 반영",
  },
  {
    id: "p2",
    prompt: "React에서 AbortController를 이용해 fetch 요청을 취소하는 사용자 정의 훅(useFetch) 코드를 작성해 줘.",
    expected: "useEffect 내 클린업 함수에서 controller.abort() 호출",
    criteria: "코드 가독성, TypeScript 인터페이스 정의, 메모리 누수 방지 로직 여부",
  },
  {
    id: "p3",
    prompt: "방 안에 양초가 5개 켜져 있어. 바람이 불어서 그중 2개를 불어 껐어. 다음 날 아침 방 안에 남아있는 양초는 총 몇 개일까? 논리적으로 추론해 줘.",
    expected: "5개 또는 2개 (꺼진 양초 2개는 녹지 않아 남아 있고, 켜진 3개는 녹아 없어짐)",
    criteria: "고전적 물리 퍼즐의 상식적 유추 및 예외 케이스(녹아 없어짐 vs 물리적 갯수) 설명 수준 평가",
  },
];

export default function EvalSet() {
  const { apiKey, model: contextModel } = useWorkspace();
  const { toast } = useToast();

  const [prompts, setPrompts] = useState<EvalPrompt[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nim_eval_prompts");
      return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
    }
    return DEFAULT_PROMPTS;
  });

  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    const textOnlyIds = NIM_MODELS.filter(m => m.type === "TEXT").map(m => m.id);
    if (contextModel && textOnlyIds.includes(contextModel)) {
      return [contextModel];
    }
    return textOnlyIds[0] ? [textOnlyIds[0]] : [];
  });

  useEffect(() => {
    localStorage.setItem("nim_eval_prompts", JSON.stringify(prompts));
  }, [prompts]);

  const [newPromptText, setNewPromptText] = useState("");
  const [newExpected, setNewExpected] = useState("");
  const [newCriteria, setNewCriteria] = useState("");

  const [results, setResults] = useState<EvalResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // History logs
  const [evalHistory, setEvalHistory] = useState<EvalRunRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nim_eval_history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const textModels = NIM_MODELS.filter((m) => m.type === "TEXT");

  const handleAddPrompt = () => {
    if (!newPromptText.trim()) return;
    const newPrompt: EvalPrompt = {
      id: "p_" + Date.now(),
      prompt: newPromptText.trim(),
      expected: newExpected.trim() || undefined,
      criteria: newCriteria.trim() || undefined,
    };
    setPrompts((prev) => [...prev, newPrompt]);
    setNewPromptText("");
    setNewExpected("");
    setNewCriteria("");
    toast("평가 프롬프트가 추가되었습니다.", "success");
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      if (selectedModels.length <= 1) {
        toast("최소 1개 이상의 모델을 선택해야 합니다.", "error");
        return;
      }
      setSelectedModels((prev) => prev.filter((id) => id !== modelId));
    } else {
      if (selectedModels.length >= 5) {
        toast("동시 평가는 최대 5개 모델까지 가능합니다.", "error");
        return;
      }
      setSelectedModels((prev) => [...prev, modelId]);
    }
  };

  const runBulkEvaluation = async () => {
    if (!apiKey) {
      toast("설정(Settings)에서 NVIDIA API Key를 먼저 입력해 주세요.", "error");
      return;
    }
    if (prompts.length === 0) {
      toast("평가할 프롬프트 세트가 비어 있습니다.", "error");
      return;
    }

    setIsRunning(true);
    // Initialize results matrix
    const initialResults: EvalResult[] = [];
    prompts.forEach((p) => {
      selectedModels.forEach((m) => {
        initialResults.push({
          promptId: p.id,
          modelId: m,
          response: "",
          isGenerating: true,
          score: {
            relevance: 3,
            accuracy: 3,
            hallucination: false,
            pass: null,
          },
        });
      });
    });
    setResults(initialResults);

    // Run prompts sequentially to avoid extreme rate limits
    for (const p of prompts) {
      for (const m of selectedModels) {
        try {
          await chatWithNvidiaObject(
            apiKey,
            m,
            [{ role: "user", content: p.prompt }],
            (chunk) => {
              setResults((prev) =>
                prev.map((r) =>
                  r.promptId === p.id && r.modelId === m
                    ? { ...r, response: r.response + chunk }
                    : r
                )
              );
            }
          );
          setResults((prev) =>
            prev.map((r) =>
              r.promptId === p.id && r.modelId === m
                ? { ...r, isGenerating: false }
                : r
            )
          );
        } catch (e: any) {
          setResults((prev) =>
            prev.map((r) =>
              r.promptId === p.id && r.modelId === m
                ? {
                    ...r,
                    response: `Failed evaluation: ${e.message || String(e)}`,
                    isGenerating: false,
                  }
                : r
            )
          );
        }
      }
    }
    setIsRunning(false);
    logActivity("Prompt & Eval Set", selectedModels.join(", "), `Bulk evaluation run of ${prompts.length} prompts against ${selectedModels.length} models finished.`, "success");
    toast("평가 실행이 완료되었습니다. 채점을 완료해 주세요.", "success");
  };

  const handleUpdateScore = (
    promptId: string,
    modelId: string,
    key: keyof EvalResult["score"],
    value: any
  ) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.promptId === promptId && r.modelId === modelId) {
          return {
            ...r,
            score: {
              ...r.score,
              [key]: value,
            },
          };
        }
        return r;
      })
    );
  };

  const handleSaveRun = () => {
    if (results.length === 0) return;
    const scoredResults = results.filter((r) => r.score.pass !== null);
    if (scoredResults.length === 0) {
      toast("저장하기 전에 최소 하나의 모델 평가에 합격/불합격을 채점해 주세요.", "error");
      return;
    }

    const passes = scoredResults.filter((r) => r.score.pass === true).length;
    const passRate = scoredResults.length > 0 ? (passes / scoredResults.length) * 100 : 0;
    const avgScore =
      scoredResults.reduce((acc, curr) => acc + (curr.score.relevance + curr.score.accuracy) / 2, 0) /
      scoredResults.length;

    const newRecord: EvalRunRecord = {
      id: "run_" + Date.now(),
      timestamp: Date.now(),
      models: selectedModels,
      promptsCount: prompts.length,
      averageScore: Number(avgScore.toFixed(1)),
      passRate: Number(passRate.toFixed(0)),
    };

    const updated = [newRecord, ...evalHistory].slice(0, 30);
    setEvalHistory(updated);
    localStorage.setItem("nim_eval_history", JSON.stringify(updated));
    toast("평가 세션이 Regression 히스토리에 기록되었습니다.", "success");
  };

  return (
    <div className="flex-grow bg-[#050505] p-6 md:p-8 overflow-y-auto text-neutral-100 scrollbar-thin">
      {/* Header title banner */}
      <div className="mb-8 relative border-b border-neutral-900 pb-5">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Award className="w-5 h-5 text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.3)]" />
          <span className="text-xs uppercase tracking-widest text-[#76b900] font-bold">Model Eval Suite</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Prompt & Eval Set Manager</h1>
        <p className="text-xs text-neutral-400 mt-2.5 max-w-3xl leading-relaxed">
          다양한 시나리오 프롬프트 묶음(Eval Sets)을 구축하여 모델별 정밀도, 응답 규격 준수 여부 및 환각률을 벤치마킹합니다. 릴리즈 전 회귀 테스트(Regression Tests) 데이터로 활용할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Side: Prompts Manager & Config */}
        <div className="xl:col-span-1 space-y-6">
          {/* Prompts list */}
          <div className="nvidia-glass rounded-2xl p-5 border border-neutral-900 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex justify-between items-center">
              <span>Test Prompts ({prompts.length})</span>
              <button
                onClick={() => setPrompts(DEFAULT_PROMPTS)}
                className="text-[10px] text-[#76b900] hover:underline bg-transparent border-none cursor-pointer"
              >
                Reset Defaults
              </button>
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {prompts.map((p, idx) => (
                <div key={p.id} className="p-3 bg-[#0a0a0a] border border-neutral-900 rounded-xl relative group">
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-[10px] text-neutral-500 font-bold shrink-0">#{idx + 1}</span>
                    <p className="text-xs text-neutral-300 leading-relaxed font-medium flex-1 pr-6">{p.prompt}</p>
                    <button
                      onClick={() => handleDeletePrompt(p.id)}
                      className="absolute top-2.5 right-2.5 p-1 text-neutral-550 hover:text-red-400 hover:bg-neutral-900/40 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {p.criteria && (
                    <div className="mt-2 text-[9px] text-neutral-500 bg-[#0e0e0e] px-2 py-1 rounded">
                      <span className="font-bold">평가 기준:</span> {p.criteria}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add prompt form */}
            <div className="pt-3 border-t border-neutral-900 space-y-3">
              <textarea
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                placeholder="새 평가 프롬프트 내용을 입력하세요..."
                rows={2}
                className="w-full bg-[#0d0d0d] border border-neutral-850 rounded-xl p-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:border-[#76b900]/40 outline-none transition"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newExpected}
                  onChange={(e) => setNewExpected(e.target.value)}
                  placeholder="예상 답변 키워드 (선택)"
                  className="bg-[#0d0d0d] border border-neutral-850 rounded-xl px-2.5 py-1.5 text-[10px] text-neutral-250 placeholder-neutral-600 focus:border-[#76b900]/40 outline-none transition"
                />
                <input
                  type="text"
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  placeholder="통과 루브릭 기준 (선택)"
                  className="bg-[#0d0d0d] border border-neutral-850 rounded-xl px-2.5 py-1.5 text-[10px] text-neutral-250 placeholder-neutral-600 focus:border-[#76b900]/40 outline-none transition"
                />
              </div>
              <button
                onClick={handleAddPrompt}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:text-white transition rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Prompt
              </button>
            </div>
          </div>

          {/* Model Registry Selection */}
          <div className="nvidia-glass rounded-2xl p-5 border border-neutral-900 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Target Models (Max 5)</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {textModels.map((m) => {
                const isSelected = selectedModels.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleModel(m.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#76b900]/10 border-[#76b900]/30 text-white"
                        : "bg-[#0b0b0b] border-neutral-900 text-neutral-450 hover:bg-[#0f0f0f] hover:border-neutral-800"
                    }`}
                  >
                    <span>{m.name.split("/").pop()}</span>
                    {isSelected ? <CheckCircle className="w-4 h-4 text-[#76b900]" /> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Evaluation Matrix & Scoring */}
        <div className="xl:col-span-2 space-y-6">
          <div className="nvidia-glass rounded-2xl p-6 border border-neutral-900 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-900 pb-5">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-3 bg-[#76b900] rounded-full"></span>
                  Evaluation Matrix Dashboard
                </h3>
                <p className="text-[10px] text-neutral-500 mt-1">프롬프트별로 각 모델의 답변 결과를 수평 비교하고 평점을 매깁니다.</p>
              </div>
              <div className="flex gap-2">
                {results.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        if (results.length === 0) return;
                        const passCount = results.filter(r => r.score.pass === true).length;
                        const scoredCount = results.filter(r => r.score.pass !== null).length;
                        const rate = scoredCount > 0 ? ((passCount / scoredCount) * 100).toFixed(1) : "0.0";
                        const summary = `전체 프롬프트 평가 통과율: ${rate}% (${passCount}/${scoredCount} 통과)`;
                        const detailsMarkdown = `### 프롬프트 벌크 평가 결과 보고서
**통과율:** ${rate}% (${passCount}/${scoredCount} 통과)

| 프롬프트 | 모델명 | 통과 여부 | 점수 | 평가 피드백 |
| :--- | :--- | :--- | :--- | :--- |
${results.map(r => {
  const pText = prompts.find(p => p.id === r.promptId)?.prompt.slice(0, 30) || "프롬프트";
  const passStr = r.score.pass === true ? "✅ PASS" : r.score.pass === false ? "❌ FAIL" : "⚠️ N/A";
  return `| ${pText} | ${r.modelId.split("/").pop()} | ${passStr} | ${r.score.accuracy}/5 | ${r.notes || "피드백 없음"} |`;
}).join("\n")}
`;
                        try {
                          saveWorkToGallery({
                            type: "eval",
                            title: `[평가 보고서] 통과율 ${rate}% (${passCount}/${scoredCount} 완료)`,
                            content: summary,
                            details: detailsMarkdown,
                            params: {
                              resultsCount: results.length,
                              passRate: rate,
                              selectedModels
                            }
                          });
                          toast("평가 보고서가 내 작업함(Gallery)에 보관되었습니다.", "success");
                        } catch (e) {
                          toast("내 작업함 저장에 실패했습니다.", "error");
                        }
                      }}
                      className="px-4 py-2 bg-[#76b900]/10 border border-[#76b900]/30 hover:bg-[#76b900]/20 text-[#76b900] font-semibold rounded-lg text-xs transition cursor-pointer"
                    >
                      내 작업함에 저장
                    </button>
                    <button
                      onClick={handleSaveRun}
                      disabled={isRunning}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-white font-semibold rounded-lg text-xs border border-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      Log to History
                    </button>
                  </>
                )}
                <button
                  onClick={runBulkEvaluation}
                  disabled={isRunning}
                  className="px-4 py-2 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-[0_4px_12px_rgba(118,185,0,0.15)] disabled:opacity-50 cursor-pointer"
                >
                  {isRunning ? <div className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin"></div> : <Play className="w-3.5 h-3.5 fill-black" />}
                  Run Bulk Eval
                </button>
              </div>
            </div>

            {/* Matrix Board */}
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-600 text-xs">
                <Sparkles className="w-10 h-10 opacity-20 mb-3" />
                <span>모델들을 구성하고 상단의 'Run Bulk Eval'을 클릭해 평가 벤치마킹을 실행하세요.</span>
              </div>
            ) : (
              <div className="space-y-8">
                {prompts.map((p, pIdx) => (
                  <div key={p.id} className="border border-neutral-900 rounded-2xl bg-[#080808]/40 p-4 space-y-4">
                    <div className="bg-[#0d0d0d]/80 border border-neutral-900 p-4 rounded-xl">
                      <div className="text-[9px] text-[#76b900] font-bold uppercase tracking-widest mb-1">PROMPT #{pIdx + 1}</div>
                      <p className="text-xs text-white font-semibold leading-relaxed">{p.prompt}</p>
                      {p.expected && (
                        <div className="mt-3 text-[10px] text-neutral-400 bg-[#070707] p-2.5 rounded-lg border border-neutral-900/60 leading-normal">
                          <span className="text-[#76b900] font-bold">기대 키워드/내용:</span> {p.expected}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-250">
                      {selectedModels.map((m) => {
                        const cell = results.find((r) => r.promptId === p.id && r.modelId === m);
                        if (!cell) return null;

                        return (
                          <div key={m} className="bg-[#030303] border border-neutral-900 rounded-xl p-4 flex flex-col justify-between gap-4">
                            <div>
                              <div className="flex justify-between items-center border-b border-neutral-900 pb-2 mb-3">
                                <span className="text-[10px] font-bold text-neutral-450 uppercase">{m.split("/").pop()}</span>
                                <span className="text-[9px] text-neutral-600 font-mono">Response</span>
                              </div>

                              <div className="text-[11px] text-neutral-300 whitespace-pre-wrap leading-relaxed min-h-[80px]">
                                {cell.isGenerating ? (
                                  <div className="flex items-center gap-2 text-neutral-550 animate-pulse">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#76b900]/60 animate-ping"></div>
                                    <span>Model inference running...</span>
                                  </div>
                                ) : (
                                  cell.response || <span className="text-neutral-700 italic">No output.</span>
                                )}
                              </div>
                            </div>

                            {/* Scoring UI block */}
                            {!cell.isGenerating && cell.response && (
                              <div className="pt-3.5 border-t border-neutral-900/80 space-y-3.5 text-[10px]">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  {/* Pass Fail buttons */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUpdateScore(p.id, m, "pass", true)}
                                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold tracking-wider cursor-pointer ${
                                        cell.score.pass === true
                                          ? "bg-green-950/30 border-green-500/40 text-green-400"
                                          : "bg-[#090909] border-neutral-900 text-neutral-500 hover:text-neutral-300"
                                      }`}
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      PASS
                                    </button>
                                    <button
                                      onClick={() => handleUpdateScore(p.id, m, "pass", false)}
                                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold tracking-wider cursor-pointer ${
                                        cell.score.pass === false
                                          ? "bg-red-950/30 border-red-500/40 text-red-400"
                                          : "bg-[#090909] border-neutral-900 text-neutral-500 hover:text-neutral-300"
                                      }`}
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      FAIL
                                    </button>
                                  </div>

                                  {/* Hallucination */}
                                  <label className="flex items-center gap-1.5 text-neutral-450 hover:text-neutral-250 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={cell.score.hallucination}
                                      onChange={(e) => handleUpdateScore(p.id, m, "hallucination", e.target.checked)}
                                      className="rounded border-neutral-800 bg-neutral-900 text-[#76b900] focus:ring-0 focus:ring-offset-0"
                                    />
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>Hallucination check</span>
                                  </label>
                                </div>

                                {/* Rubric values sliders */}
                                <div className="grid grid-cols-2 gap-3.5">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                                      <span>Relevance</span>
                                      <span className="text-white">{cell.score.relevance}/5</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={1}
                                      max={5}
                                      value={cell.score.relevance}
                                      onChange={(e) => handleUpdateScore(p.id, m, "relevance", parseInt(e.target.value))}
                                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#76b900]"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                                      <span>Accuracy</span>
                                      <span className="text-white">{cell.score.accuracy}/5</span>
                                    </div>
                                    <input
                                      type="range"
                                      min={1}
                                      max={5}
                                      value={cell.score.accuracy}
                                      onChange={(e) => handleUpdateScore(p.id, m, "accuracy", parseInt(e.target.value))}
                                      className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-[#76b900]"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regression History Log */}
          {evalHistory.length > 0 && (
            <div className="nvidia-glass rounded-2xl p-5 border border-neutral-900 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-neutral-400" />
                Regression Benchmarks History
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evalHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-[#0a0a0a] border border-neutral-900 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">
                        {h.models.map((m) => m.split("/").pop()).join(" vs ")}
                      </div>
                      <div className="text-[9px] text-neutral-600 mt-1">
                        {new Date(h.timestamp).toLocaleString()} • {h.promptsCount} prompts
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-[#76b900] flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Score: {h.averageScore}/5</span>
                      </div>
                      <div className="text-[9px] text-neutral-500 font-bold mt-0.5">
                        Pass Rate: <span className="text-white">{h.passRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
