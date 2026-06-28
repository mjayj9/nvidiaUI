import { useState } from "react";
import { modelRegistry } from "../lib/modelRegistry";
import { Cpu, Search, Check, Copy, Tag, ExternalLink } from "lucide-react";

export default function ModelRegistry() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter models
  const filteredModels = modelRegistry.filter((m) => {
    const matchesSearch =
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.fullName && m.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.displayName && m.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag =
      selectedTag === "all" ||
      m.capabilities.includes(selectedTag as any) ||
      (selectedTag === "text" && m.capabilities.includes("chat")) ||
      (selectedTag === "vision" && m.capabilities.includes("vision"));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex-1 bg-[#050505] p-6 md:p-8 overflow-y-auto text-neutral-100 scrollbar-thin border-t border-neutral-900">
      {/* Header title */}
      <div className="mb-6 relative border-b border-neutral-900 pb-5">
        <div className="flex items-center gap-2.5 mb-2.5">
          <Cpu className="w-5 h-5 text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.3)]" />
          <span className="text-xs uppercase tracking-widest text-[#76b900] font-bold">NIM Catalog</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">NIM Model Registry</h1>
        <p className="text-xs text-neutral-400 mt-2.5 max-w-3xl leading-relaxed">
          NVIDIA Inference Microservices(NIM) 통합 카탈로그입니다. LLM, 비전 런타임, 오디오/비디오 및 보안 모델에 대한 스펙, 토큰 사양 및 엔드포인트 세부 정보를 확인하십시오.
        </p>
      </div>

      {/* Filter and search control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-[#080808]/60 p-4 rounded-xl border border-neutral-900">
        <div className="relative flex items-center bg-[#0a0a0a] border border-neutral-850 rounded-xl px-3 py-2 text-xs w-full sm:max-w-md">
          <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search 77 NIMs by name, ID or developer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-neutral-250 outline-none w-full placeholder-neutral-600"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          {[
            { id: "all", label: "All Models" },
            { id: "chat", label: "Text/Chat" },
            { id: "vision", label: "Vision/VLM" },
            { id: "reasoning", label: "Reasoning" },
            { id: "embedding", label: "Embedding" }
          ].map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                selectedTag === tag.id
                  ? "bg-[#76b900] text-black border-[#76b900] font-extrabold"
                  : "bg-[#0b0b0b] border-neutral-850 text-neutral-450 hover:text-white"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((m) => (
          <div
            key={m.id}
            className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-5 hover:border-[#76b900]/30 hover:bg-[#0c0c0c] transition duration-300 flex flex-col justify-between min-h-[190px] relative group"
          >
            <div>
              <div className="flex justify-between items-start gap-3 border-b border-neutral-900/40 pb-2.5 mb-3.5">
                <span className="text-[9px] font-bold text-neutral-550 uppercase tracking-wider bg-neutral-950 px-2 py-0.5 rounded border border-neutral-900">
                  {m.provider}
                </span>
                <button
                  onClick={() => handleCopy(m.id, m.id)}
                  className="text-neutral-550 hover:text-white transition cursor-pointer"
                  title="Copy NIM ID"
                >
                  {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <h3 className="text-xs font-bold text-white leading-snug group-hover:text-[#76b900] transition-colors truncate">
                {m.displayName || m.fullName || m.id.split("/").pop()}
              </h3>
              <p className="text-[10px] text-neutral-500 mt-2 font-mono truncate">
                {m.id}
              </p>
              <p className="text-[10px] text-neutral-450 mt-3.5 leading-relaxed line-clamp-3">
                {m.description || `${m.displayName || m.id} is a high-performance NVIDIA NIM inference model optimized for enterprise AI pipelines.`}
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-neutral-900/60 flex flex-wrap gap-1.5">
              {m.capabilities.map((c) => (
                <span
                  key={c}
                  className="text-[8px] font-extrabold uppercase tracking-widest text-[#76b900] bg-[#76b900]/5 px-1.5 py-0.5 rounded flex items-center gap-1"
                >
                  <Tag className="w-2 h-2 shrink-0" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
