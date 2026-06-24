import { Download, ImageIcon, Loader2, Play, RefreshCw, Sparkles, X, ZoomIn } from "lucide-react";
import { useState } from "react";
import { modelRegistry } from "../lib/modelRegistry";

interface ImageGeneratorProps {
  apiKey: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  seed: number;
}

export default function ImageGenerator({ apiKey }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [activeModel, setActiveModel] = useState("black-forest-labs/FLUX.1-schnell");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [seed, setSeed] = useState<number>(0);
  const [numImages, setNumImages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const imageModels = modelRegistry.filter((m) => m.capabilities.includes("image-generation"));

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    if (!apiKey) {
      alert("Please configure your NVIDIA API Key in Settings.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          prompt: prompt,
          negative_prompt: negativePrompt,
          aspect_ratio: aspectRatio,
          seed: seed || Math.floor(Math.random() * 1000000),
          num_images: numImages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      
      const newImages: GeneratedImage[] = data.images.map((img: any) => ({
        id: Math.random().toString(36).substring(7),
        url: img.url,
        prompt: prompt,
        model: activeModel,
        seed: img.seed || seed,
      }));

      setGallery((prev) => [...newImages, ...prev]);
    } catch (e: any) {
      console.error(e);
      alert(`Image Generation Failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = img.url;
    a.download = `generation_${img.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReusePrompt = (img: GeneratedImage) => {
    setPrompt(img.prompt);
    setActiveModel(img.model);
    setSeed(img.seed);
    setSelectedImage(null);
  };

  return (
    <div className="flex-1 flex bg-neutral-950 text-neutral-100 overflow-hidden h-full">
      {/* Left panel: Generation configurations */}
      <div className="w-80 border-r border-[#76b900]/15 bg-[#070707]/60 backdrop-blur-md flex flex-col shrink-0">
        <div className="p-4 border-b border-[#76b900]/25 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#76b900] drop-shadow-[0_0_6px_rgba(118,185,0,0.4)]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">
            Image Generator
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          {/* Prompt */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cyberpunk cityscape with neon signs and flying cars..."
              className="w-full bg-[#090909]/95 border border-neutral-850 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:border-[#76b900] outline-none resize-none min-h-[90px] transition-all"
              rows={3}
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Negative Prompt (Optional)</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, distorted, low quality, bad hands..."
              className="w-full bg-[#090909]/95 border border-neutral-850 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:border-[#76b900] outline-none resize-none min-h-[60px] transition-all"
              rows={2}
            />
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Generator Model</label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full bg-[#090909]/95 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer focus:border-[#76b900] transition-all"
            >
              {imageModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-neutral-950">
                  {m.fullName || m.id}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-1.5">
              {["1:1", "16:9", "9:16", "4:3"].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 rounded-lg border text-[10px] font-bold transition-all duration-300 ${
                    aspectRatio === ratio
                      ? "bg-[#76b900]/10 border-[#76b900] text-white shadow-[0_0_8px_rgba(118,185,0,0.15)]"
                      : "bg-[#090909]/80 border-neutral-850 text-neutral-500 hover:border-neutral-750 hover:text-neutral-300"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Seed */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Seed</label>
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                className="text-neutral-500 hover:text-[#76b900] transition"
                title="Randomize Seed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              className="w-full bg-[#090909]/95 border border-neutral-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#76b900] transition-all"
            />
            <span className="text-[9px] text-neutral-600 font-medium">Set 0 for a fully randomized seed.</span>
          </div>

          {/* Number of Images */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Count</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumImages(num)}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all duration-300 ${
                    numImages === num
                      ? "bg-[#76b900]/10 border-[#76b900] text-white shadow-[0_0_8px_rgba(118,185,0,0.15)]"
                      : "bg-[#090909]/80 border-neutral-850 text-neutral-500 hover:border-neutral-750 hover:text-neutral-300"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-4 border-t border-neutral-900/60 bg-neutral-950/40 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading || !apiKey}
            className="w-full py-3.5 bg-[#76b900] hover:bg-[#66a000] disabled:bg-neutral-850 disabled:text-neutral-500 text-black font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(118,185,0,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rendering canvas...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Generate Graphics
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right panel: Images gallery grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#050505]/20 scrollbar-thin">
        {gallery.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 gap-4 py-20">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900/40 border border-[#76b900]/20 flex items-center justify-center text-neutral-400 shadow-[0_0_20px_rgba(118,185,0,0.05)]">
              <ImageIcon className="w-8 h-8 text-neutral-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base tracking-wide">VISUAL STUDIO GALLERY</h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-2 leading-relaxed">
                Describe an idea in the prompt inputs on the left to invoke FLUX/Stable Diffusion networks. Your generated graphics will render here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gallery.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-xl overflow-hidden border border-neutral-850 bg-neutral-950 shadow-md transition-all duration-300 hover:border-[#76b900]/40 hover:-translate-y-1 hover:shadow-[0_4px_25px_rgba(118,185,0,0.15)]"
              >
                <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-350 flex flex-col justify-end p-4">
                  <p className="text-[11px] text-white font-semibold line-clamp-2 mb-3">
                    {img.prompt}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedImage(img)}
                      className="flex-1 py-1.5 bg-neutral-900/90 border border-neutral-800 hover:border-[#76b900]/50 hover:bg-[#76b900]/10 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-300 cursor-pointer"
                    >
                      <ZoomIn className="w-3 h-3" />
                      Zoom
                    </button>
                    <button
                      onClick={() => handleDownload(img)}
                      className="p-1.5 bg-neutral-900/90 border border-neutral-800 hover:border-[#76b900]/50 hover:bg-[#76b900]/10 text-white rounded-lg transition-all duration-300 cursor-pointer"
                      title="Download PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="max-w-4xl w-full bg-neutral-950 border border-[#76b900]/25 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(118,185,0,0.18)] flex flex-col md:flex-row max-h-[85vh]">
            <div className="md:w-3/5 bg-black flex items-center justify-center p-2 border-r border-[#76b900]/10">
              <img src={selectedImage.url} alt={selectedImage.prompt} className="max-h-[75vh] w-auto object-contain" />
            </div>
            
            <div className="md:w-2/5 p-6 flex flex-col justify-between bg-[#080808]/90 backdrop-blur-md">
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Image Metadata</span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-neutral-500 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">Prompt</span>
                  <p className="text-xs text-neutral-300 leading-relaxed mt-1.5 font-medium bg-neutral-900/60 p-3 rounded-xl border border-neutral-850 select-all">
                    {selectedImage.prompt}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">NIM Model</span>
                    <span className="text-xs text-[#76b900] truncate block font-bold mt-1">
                      {selectedImage.model.replace("black-forest-labs/", "")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">Seed</span>
                    <span className="text-xs text-blue-400 font-mono font-bold block mt-1">
                      {selectedImage.seed}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 shrink-0">
                <button
                  onClick={() => handleReusePrompt(selectedImage)}
                  className="flex-1 py-3 bg-neutral-900 border border-neutral-850 hover:border-[#76b900]/50 hover:bg-[#76b900]/5 text-white rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer"
                >
                  Reuse Prompt
                </button>
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="py-3 px-5 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-xl text-xs transition-all duration-300 shadow-[0_4px_15px_rgba(118,185,0,0.2)] cursor-pointer"
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
