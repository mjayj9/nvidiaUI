import { useState, useEffect } from "react";
import { FolderHeart, Star, Share2, FileDown, Play, Trash2, Calendar, FileText, Image as ImageIcon, MessageSquare, Mic, Video, Search, GitCompare, Award } from "lucide-react";
import { useToast } from "../context/ToastContext";

interface SavedWorkItem {
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

export default function SavedWorks({
  onNavigate
}: {
  onNavigate: (tab: string) => void;
}) {
  const { toast } = useToast();
  const [works, setWorks] = useState<SavedWorkItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeItem, setActiveItem] = useState<SavedWorkItem | null>(null);

  // Load saved works from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nim_saved_works");
      if (saved) {
        setWorks(JSON.parse(saved));
      } else {
        // Seed default template data if gallery is empty
        const defaultSeeds: SavedWorkItem[] = [
          {
            id: "seed_1",
            type: "image-gen",
            title: "NVIDIA 로고가 장식된 미래형 데이터센터 일러스트",
            content: "futuristic green glowing data center with high tech compute boxes and nvidia logo, cyberpunk, hyper-detailed rendering",
            mediaUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60",
            timestamp: Date.now() - 3600000 * 2,
            isFavorite: true,
            params: {
              prompt: "futuristic green glowing data center with high tech compute boxes and nvidia logo, cyberpunk, hyper-detailed rendering",
              model: "stabilityai/stable-diffusion-xl"
            }
          },
          {
            id: "seed_2",
            type: "rag",
            title: "NVIDIA NIM 오버뷰 PDF 요약 보고서",
            content: "NVIDIA NIM(Inference Microservices)은 사전 훈련된 다양한 모델들을 클라우드 및 로컬 인프라에 즉시 배포할 수 있는 통합 프레임워크 패키지입니다.",
            details: `### NVIDIA NIM (Inference Microservices) 분석 보고서

1. **소개**:
   NIM은 GPU 환경에서 AI 모델 추론 처리량을 극대화하기 위해 기획된 전용 엔지니어링 패키지입니다.

2. **핵심 아키텍처**:
   - Triton Inference Server 내장
   - 모델 가중치(Weights)의 최적화된 TensorRT 런타임 매핑
   - OpenAI 호환 API 규격 포트 제공

3. **이점**:
   배포 복잡도를 혁신적으로 축소하며, 개발자는 API Key 교체와 포트 포워딩 수준만으로 대규모 LLM 서비스를 즉각 오픈할 수 있습니다.`,
            timestamp: Date.now() - 3600000 * 5,
            isFavorite: false,
            params: {
              query: "NVIDIA NIM의 주요 특징과 장점은 무엇인가요?",
              selectedDocName: "NVIDIA-NIM-Technical-Whitepaper.pdf"
            }
          }
        ];
        setWorks(defaultSeeds);
        localStorage.setItem("nim_saved_works", JSON.stringify(defaultSeeds));
      }
    }
  }, []);

  const saveToStorage = (updatedWorks: SavedWorkItem[]) => {
    setWorks(updatedWorks);
    localStorage.setItem("nim_saved_works", JSON.stringify(updatedWorks));
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = works.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
    saveToStorage(updated);
    const item = updated.find((w) => w.id === id);
    toast(item?.isFavorite ? "즐겨찾기에 등록되었습니다." : "즐겨찾기에서 해제되었습니다.", "success");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("해당 작업 기록을 내 작업함에서 삭제하시겠습니까?")) {
      const updated = works.filter((w) => w.id !== id);
      saveToStorage(updated);
      if (activeItem?.id === id) setActiveItem(null);
      toast("삭제되었습니다.", "success");
    }
  };

  const handleShare = (item: SavedWorkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const dummyShareUrl = `${window.location.origin}/share/work/${item.id}`;
    navigator.clipboard.writeText(dummyShareUrl);
    toast("공유 가능한 고유 링크가 클립보드에 복사되었습니다!", "success");
  };

  const handleRerun = (item: SavedWorkItem) => {
    // Write rerun payload to localStorage so target component can read on mount
    localStorage.setItem("nim_rerun_data", JSON.stringify({
      tab: item.type,
      params: item.params
    }));
    // Navigate to target component
    onNavigate(item.type);
    toast("이 작업 결과로 다시 실행을 개시합니다...", "success");
  };

  const handleExportMarkdown = (item: SavedWorkItem) => {
    const mdText = `# ${item.title}\n\n**Category**: ${item.type.toUpperCase()}\n**Date**: ${new Date(item.timestamp).toLocaleString()}\n\n---\n\n## Content\n${item.content}\n\n${item.details ? `## Details\n${item.details}` : ""}`;
    const blob = new Blob([mdText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, "_")}.md`;
    a.click();
    toast("Markdown 파일이 다운로드되었습니다.", "success");
  };

  const handleExportPDF = (item: SavedWorkItem) => {
    // Basic browser printing simulation or PDF instructions
    window.print();
  };

  // Filter lists
  const filteredWorks = works.filter((w) => {
    const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || w.type === selectedCategory;
    const matchesFavorite = !showOnlyFavorites || w.isFavorite;
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "chat": return MessageSquare;
      case "rag": return FileText;
      case "vision": return Search;
      case "image-gen": return ImageIcon;
      case "speech": return Mic;
      case "video": return Video;
      case "compare": return GitCompare;
      case "eval": return Award;
      default: return FileText;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-[#050505] text-neutral-100 overflow-hidden font-sans border-t border-neutral-900">
      {/* List sidebar */}
      <div className="w-full md:w-96 border-r border-neutral-900 flex flex-col h-1/2 md:h-full shrink-0 bg-[#060606]">
        <div className="p-4 border-b border-neutral-900 flex items-center gap-2 bg-[#080808]">
          <FolderHeart className="w-4 h-4 text-[#76b900]" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">내 작업함 (Gallery)</span>
        </div>

        {/* Filter controls */}
        <div className="p-3 border-b border-neutral-900 space-y-2">
          <div className="relative flex items-center bg-[#0a0a0a] border border-neutral-850 rounded-xl px-3 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="내 작업 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-neutral-200 outline-none w-full placeholder-neutral-600"
            />
          </div>

          <div className="flex justify-between items-center gap-2 pt-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#0b0b0b] border border-neutral-850 rounded-lg px-2.5 py-1 text-[10px] text-neutral-400 focus:border-[#76b900]/40 outline-none transition"
            >
              <option value="all">전체 도구 결과</option>
              <option value="chat">AI 채팅</option>
              <option value="rag">문서 질문</option>
              <option value="vision">이미지 분석</option>
              <option value="image-gen">이미지 생성</option>
              <option value="speech">음성 도구</option>
              <option value="video">영상 도구</option>
              <option value="compare">비교 실험실 (Compare)</option>
              <option value="eval">프롬프트 평가 (Eval)</option>
            </select>

            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wide transition flex items-center gap-1 cursor-pointer ${
                showOnlyFavorites
                  ? "bg-[#76b900]/15 border-[#76b900]/40 text-[#76b900]"
                  : "bg-[#0b0b0b] border-neutral-850 text-neutral-550 hover:text-white"
              }`}
            >
              <Star className={`w-3 h-3 ${showOnlyFavorites ? "fill-[#76b900]" : ""}`} />
              즐겨찾기만
            </button>
          </div>
        </div>

        {/* Saved List scroll */}
        <div className="flex-grow overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-900">
          {filteredWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-650 text-xs">
              <FolderHeart className="w-8 h-8 opacity-20 mb-2" />
              <span>저장된 작업물이 없습니다.</span>
            </div>
          ) : (
            filteredWorks.map((item) => {
              const Icon = getIcon(item.type);
              const isActive = activeItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-2 relative group ${
                    isActive
                      ? "bg-[#76b900]/10 border-[#76b900]/30"
                      : "bg-[#0b0b0b] border-neutral-900 hover:border-neutral-800 hover:bg-[#0e0e0e]"
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[8px] font-bold text-neutral-550 uppercase tracking-widest flex items-center gap-1">
                      <Icon className="w-2.5 h-2.5 text-[#76b900] shrink-0" />
                      {item.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className="text-neutral-500 hover:text-amber-400 p-0.5"
                      >
                        <Star className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-neutral-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug truncate pr-4">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-neutral-450 leading-relaxed truncate max-w-[280px]">
                    {item.content}
                  </p>

                  <div className="flex justify-between items-center text-[8px] text-neutral-600 font-semibold mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto bg-[#030303] p-6 scrollbar-thin scrollbar-thumb-neutral-900">
        {activeItem ? (
          <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
            {/* Title header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-900 pb-5 gap-4">
              <div>
                <span className="text-[8px] font-extrabold text-[#76b900] uppercase tracking-widest border border-[#76b900]/30 px-2 py-0.5 rounded bg-[#76b900]/5">
                  {activeItem.type}
                </span>
                <h2 className="text-lg font-bold text-white mt-3 leading-tight">{activeItem.title}</h2>
                <div className="text-[10px] text-neutral-500 font-medium mt-1">
                  Saved on {new Date(activeItem.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => handleRerun(activeItem)}
                  className="px-3.5 py-1.5 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-lg text-[10px] uppercase tracking-widest transition flex items-center gap-1.5 shadow-[0_4px_12px_rgba(118,185,0,0.15)] cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-black" />
                  Rerun Context
                </button>
                <button
                  onClick={(e) => handleShare(activeItem, e)}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest border border-neutral-850 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  Share Link
                </button>
                <button
                  onClick={() => handleExportMarkdown(activeItem)}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest border border-neutral-850 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-3 h-3" />
                  Export .MD
                </button>
              </div>
            </div>

            {/* Media Image display if RAG/Generated image */}
            {activeItem.mediaUrl && (
              <div className="rounded-2xl overflow-hidden border border-neutral-900 max-h-[380px] bg-[#0c0c0c] flex items-center justify-center">
                <img
                  src={activeItem.mediaUrl}
                  alt={activeItem.title}
                  className="max-h-[380px] object-contain hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            )}

            {/* Content Text Block */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Prompt / Query Input</h3>
              <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded-xl text-xs leading-relaxed text-neutral-350 italic">
                "{activeItem.content}"
              </div>
            </div>

            {activeItem.details && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Detailed Response Output</h3>
                <div className="bg-[#080808]/60 border border-neutral-900 p-5 rounded-2xl text-xs leading-relaxed text-neutral-300 whitespace-pre-wrap font-mono">
                  {activeItem.details}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-neutral-500 text-xs">
            <FolderHeart className="w-12 h-12 opacity-15 mb-3" />
            <span>작업 목록에서 결과 카드를 선택하여 상세 요약 및 내보내기 대화상자를 확인해 보세요.</span>
          </div>
        )}
      </div>
    </div>
  );
}
