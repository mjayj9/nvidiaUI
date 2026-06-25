import { Check, Clipboard, Download, Eye, ImageIcon, Loader2, Play, Trash2, UploadCloud, X } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { modelRegistry } from "../lib/modelRegistry";

interface VisionAnalyzerProps {
  apiKey: string;
}

interface ImageFile {
  id: string;
  file: File;
  base64: string;
}

export default function VisionAnalyzer({ apiKey }: VisionAnalyzerProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [prompt, setPrompt] = useState("");
  const [activeModel, setActiveModel] = useState("qwen/qwen3.5-397b-a17b");
  const [analysisType, setAnalysisType] = useState("description");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vlmModels = modelRegistry.filter((m) => m.capabilities.includes("vision"));

  const analysisModes = [
    { id: "description", label: "General Description", prompt: "Explain in detail what is happening in this image. Describe the colors, layouts, text, and overall context." },
    { id: "ocr", label: "OCR Text Extraction", prompt: "Extract all text visible in this image. Maintain the spatial layout of the text blocks as closely as possible." },
    { id: "table", label: "Table Extraction", prompt: "Detect any tables in this image. Extract all rows, columns, and headers, and format them as a markdown table and a valid JSON structure." },
    { id: "ui", label: "UI Evaluation", prompt: "Evaluate the user interface of this screen. Analyze layout alignment, spacing, color contrast, and usability issues, and suggest improvements." },
    { id: "chart", label: "Chart Analysis", prompt: "Analyze the chart/graph. Identify the data values, axes, trends, and compile a structured summary of the findings." },
    { id: "errors", label: "Screen Error Finder", prompt: "Inspect this screen capture for any system errors, validation alerts, layout breakages, or crash warnings, and explain what is wrong." }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImg: ImageFile = {
          id: Math.random().toString(36).substring(7),
          file,
          base64: reader.result as string,
        };
        setImages((prev) => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const runAnalysis = async () => {
    if (images.length === 0 || isLoading) return;
    if (!apiKey) {
      alert("Please configure your NVIDIA API Key in Settings.");
      return;
    }

    setIsLoading(true);
    setResult("");

    const activeMode = analysisModes.find((m) => m.id === analysisType);
    const systemPrompt = "You are a professional multi-modal computer vision intelligence assistant. Provide thorough, clear, and highly accurate analysis.";
    const userPrompt = prompt.trim() || activeMode?.prompt || "";

    try {
      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: activeModel,
          prompt: userPrompt,
          systemPrompt,
          images: images.map((img) => img.base64),
        }),
      });

      let contentText = "";
      if (response.status === 404) {
        console.warn("Express backend vision analyzer proxy returned 404. Falling back to direct browser-to-NVIDIA API call.");
        
        const content: any[] = [{ type: "text", text: userPrompt }];
        images.forEach((img) => {
          content.push({
            type: "image_url",
            image_url: { url: img.base64 },
          });
        });

        const directRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: activeModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content },
            ],
          }),
        });

        if (!directRes.ok) {
          const errText = await directRes.text();
          throw new Error(`Direct NVIDIA API failed: ${errText}`);
        }

        const directText = await directRes.text();
        try {
          const directData = JSON.parse(directText);
          contentText = directData.choices?.[0]?.message?.content || "";
        } catch (err) {
          throw new Error(`Invalid JSON response from direct API: ${directText.slice(0, 100)}`);
        }
      } else if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      } else {
        const resText = await response.text();
        try {
          const data = JSON.parse(resText);
          contentText = data.content;
        } catch (err) {
          throw new Error(`Invalid JSON response from server: ${resText.slice(0, 100)}`);
        }
      }
      setResult(contentText);
    } catch (e: any) {
      console.error(e);
      setResult(`🚨 **Vision Analysis Error:**\n\n${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    try {
      // Find JSON block inside result
      const jsonMatch = result.match(/```json([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : JSON.stringify({ analysis: result }, null, 2);
      
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis_${analysisType}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to compile structured JSON file.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden h-full">
      {/* Top Header */}
      <header className="h-16 border-b border-[#76b900]/25 flex items-center justify-between px-6 shrink-0 bg-neutral-950/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.5)]" />
          <span className="text-sm font-semibold text-white tracking-wide">VLM Image Analyzer</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 font-medium">Model:</span>
          <select
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="text-xs font-semibold bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-1.5 text-white outline-none cursor-pointer hover:border-[#76b900]/45 focus:border-[#76b900] transition"
          >
            {vlmModels.map((m) => (
              <option key={m.id} value={m.id} className="bg-neutral-950">
                {m.fullName || m.id}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Workspace: Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Images & Inputs */}
        <div className="w-1/2 border-r border-[#76b900]/15 flex flex-col h-full bg-[#070707]/60 backdrop-blur-md">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Analysis Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Analysis Mode</label>
              <div className="grid grid-cols-2 gap-2.5">
                {analysisModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setAnalysisType(mode.id)}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all duration-300 ${
                      analysisType === mode.id
                        ? "bg-[#76b900]/10 border-[#76b900] text-white font-bold shadow-[0_0_15px_rgba(118,185,0,0.15)]"
                        : "bg-neutral-900/30 border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Images upload slot */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Upload Assets</label>
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                      <img src={img.base64} alt={img.file.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/85 text-neutral-400 hover:text-red-400 hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-xl border border-dashed border-neutral-800 hover:border-[#76b900]/40 bg-neutral-900/20 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-neutral-500 hover:text-[#76b900]" />
                    </div>
                  )}
                </div>
              )}

              {images.length === 0 && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    dragActive
                      ? "border-[#76b900] bg-[#76b900]/5 text-white shadow-[0_0_20px_rgba(118,185,0,0.15)]"
                      : "border-neutral-800 hover:border-[#76b900]/40 bg-neutral-900/10 text-neutral-400 hover:text-white"
                  }`}
                >
                  <UploadCloud className="w-9 h-9 mx-auto mb-2 text-neutral-500 group-hover:text-[#76b900] transition-colors" />
                  <p className="text-xs font-semibold">Drag & drop screens/photos or click to upload</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Supports PNG, JPG, WEBP (Max 5MB)</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            {/* Custom Prompt Override */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Custom Prompt Override (Optional)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={analysisModes.find((m) => m.id === analysisType)?.prompt}
                className="w-full bg-[#090909]/90 border border-neutral-850 rounded-xl p-3 text-xs text-white focus:border-[#76b900] outline-none resize-none min-h-[90px] transition-all"
                rows={3}
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="p-6 border-t border-neutral-900/60 bg-neutral-950/40 shrink-0">
            <button
              onClick={runAnalysis}
              disabled={images.length === 0 || isLoading || !apiKey}
              className="w-full py-3.5 bg-[#76b900] hover:bg-[#66a000] disabled:bg-neutral-850 disabled:text-neutral-500 text-black font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(118,185,0,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing visual layers...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run NIM Vision Analysis
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Render Result */}
        <div className="w-1/2 flex flex-col h-full bg-[#050505]/20">
          {/* Output Controls */}
          {result && (
            <div className="h-12 px-6 border-b border-[#76b900]/10 flex justify-end items-center gap-4 shrink-0 bg-neutral-950/20 backdrop-blur-md">
              <button
                onClick={copyToClipboard}
                className="text-xs font-semibold text-neutral-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#76b900]" /> : <Clipboard className="w-3.5 h-3.5" />}
                Copy Output
              </button>
              {(analysisType === "table" || analysisType === "ocr" || result.includes("```json")) && (
                <button
                  onClick={downloadJson}
                  className="text-xs font-semibold text-neutral-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON Extract
                </button>
              )}
            </div>
          )}

          {/* Markdown Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 prose prose-invert max-w-none text-sm md:text-base leading-relaxed scrollbar-thin">
            {!result && !isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 gap-4">
                <ImageIcon className="w-12 h-12 opacity-15 text-neutral-400" />
                <p className="text-xs tracking-wider uppercase font-semibold text-neutral-600">Awaiting Visual Assets</p>
                <p className="text-[11px] text-neutral-500 max-w-xs mt-[-10px]">Upload images and run the VLM to perform deep structural analysis.</p>
              </div>
            ) : isLoading && !result ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.4)]" />
                <p className="text-xs font-mono tracking-widest text-[#76b900]">COMPILING VISUAL LAYERS...</p>
              </div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
