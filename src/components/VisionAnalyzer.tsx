import { Check, Clipboard, Download, Eye, ImageIcon, Loader2, Play, Trash2, UploadCloud, X, Send, RefreshCw, Square, Zap, Clock, Cpu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { modelRegistry } from "../lib/modelRegistry";
import { useWorkspace } from "../context/WorkspaceContext";
import { chatWithNvidiaObject, NimMetrics } from "../lib/nim";
import { cn } from "../lib/utils";

interface ImageFile {
  id: string;
  file: File;
  base64: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; //Attached base64 list (sent on the first turn)
  metrics?: NimMetrics | null;
}

export default function VisionAnalyzer() {
  const { apiKey, isDevMode } = useWorkspace();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [prompt, setPrompt] = useState("");
  
  const vlmModels = modelRegistry.filter((m) => m.capabilities.includes("vision"));
  const [activeModel, setActiveModel] = useState(() => vlmModels[0]?.id || "meta/llama-3.2-11b-vision-instruct");
  const [analysisType, setAnalysisType] = useState("description");
  
  const [dragActive, setDragActive] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Conversational Chat History States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [lastMetrics, setLastMetrics] = useState<NimMetrics | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const analysisModes = [
    { id: "description", label: "General Description", prompt: "Explain in detail what is happening in this image. Describe the colors, layouts, text, and overall context." },
    { id: "ocr", label: "OCR Text Extraction", prompt: "Extract all text visible in this image. Maintain the spatial layout of the text blocks as closely as possible." },
    { id: "table", label: "Table Extraction", prompt: "Detect any tables in this image. Extract all rows, columns, and headers, and format them as a markdown table and a valid JSON structure." },
    { id: "ui", label: "UI Evaluation", prompt: "Evaluate the user interface of this screen. Analyze layout alignment, spacing, color contrast, and usability issues, and suggest improvements." },
    { id: "chart", label: "Chart Analysis", prompt: "Analyze the chart/graph. Identify the data values, axes, trends, and compile a structured summary of the findings." },
    { id: "errors", label: "Screen Error Finder", prompt: "Inspect this screen capture for any system errors, validation alerts, layout breakages, or crash warnings, and explain what is wrong." }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

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
    if (images.length === 0 || isGenerating) return;
    if (!apiKey) {
      alert("Please configure your NVIDIA API Key in Settings.");
      return;
    }

    const activeMode = analysisModes.find((m) => m.id === analysisType);
    const userPrompt = prompt.trim() || activeMode?.prompt || "";
    const systemPrompt = "You are a professional multi-modal computer vision intelligence assistant. Provide thorough, clear, and highly accurate analysis.";

    setIsGenerating(true);
    setStreamingContent("");
    setLastMetrics(null);
    const controller = new AbortController();
    setAbortController(controller);

    const base64List = images.map((img) => img.base64);

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: userPrompt,
      images: base64List,
    };

    setMessages([userMsg]);
    setPrompt(""); // Reset input override

    const firstContent: any[] = [{ type: "text", text: userPrompt }];
    base64List.forEach((base64) => {
      firstContent.push({
        type: "image_url",
        image_url: { url: base64 },
      });
    });

    const apiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: firstContent },
    ];

    let finalContent = "";
    try {
      await chatWithNvidiaObject(
        apiKey,
        activeModel,
        apiMessages as any,
        (chunk) => {
          finalContent += chunk;
          setStreamingContent(finalContent);
        },
        {
          temperature: 0.1,
          maxTokens: 4096,
          abortSignal: controller.signal,
          onMetrics: (metrics) => setLastMetrics(metrics),
        }
      );

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: finalContent,
        metrics: lastMetrics,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      if (e.name !== "AbortError") {
        const errContainer: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: "system",
          content: `🚨 **Vision Analysis Error:**\n\n${e.message}`,
        };
        setMessages((prev) => [...prev, errContainer]);
      }
    } finally {
      setIsGenerating(false);
      setStreamingContent("");
      setLastMetrics(null);
      setAbortController(null);
    }
  };

  const sendFollowUp = async () => {
    if (!followUpInput.trim() || isGenerating || messages.length === 0) return;
    if (!apiKey) {
      alert("Please configure your NVIDIA API Key in Settings.");
      return;
    }

    const nextUserPrompt = followUpInput.trim();
    setFollowUpInput("");
    setIsGenerating(true);
    setStreamingContent("");
    setLastMetrics(null);
    const controller = new AbortController();
    setAbortController(controller);

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: nextUserPrompt,
    };

    setMessages((prev) => [...prev, userMsg]);

    const apiMessages: any[] = [
      { role: "system", content: "You are a professional multi-modal computer vision intelligence assistant. Provide thorough, clear, and highly accurate analysis." }
    ];

    messages.forEach((msg, idx) => {
      if (idx === 0) {
        const content: any[] = [{ type: "text", text: msg.content }];
        if (msg.images) {
          msg.images.forEach((base64) => {
            content.push({
              type: "image_url",
              image_url: { url: base64 },
            });
          });
        }
        apiMessages.push({ role: msg.role, content });
      } else {
        apiMessages.push({ role: msg.role, content: msg.content });
      }
    });

    apiMessages.push({ role: "user", content: nextUserPrompt });

    let finalContent = "";
    try {
      await chatWithNvidiaObject(
        apiKey,
        activeModel,
        apiMessages,
        (chunk) => {
          finalContent += chunk;
          setStreamingContent(finalContent);
        },
        {
          temperature: 0.2,
          maxTokens: 4096,
          abortSignal: controller.signal,
          onMetrics: (metrics) => setLastMetrics(metrics),
        }
      );

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: finalContent,
        metrics: lastMetrics,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      if (e.name !== "AbortError") {
        const errContainer: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: "system",
          content: `🚨 **Follow-up Analysis Error:**\n\n${e.message}`,
        };
        setMessages((prev) => [...prev, errContainer]);
      }
    } finally {
      setIsGenerating(false);
      setStreamingContent("");
      setLastMetrics(null);
      setAbortController(null);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const resetChat = () => {
    stopGeneration();
    setMessages([]);
    setFollowUpInput("");
    setImages([]);
    setPrompt("");
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadJson = (text: string) => {
    try {
      const jsonMatch = text.match(/```json([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : JSON.stringify({ analysis: text }, null, 2);
      
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

      {/* Main Workspace: Config Bar (Left) & Conversational Chat (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Images & Inputs (fixed w-96 for more chat space) */}
        <div className="w-96 border-r border-[#76b900]/15 flex flex-col h-full bg-[#070707]/60 backdrop-blur-md shrink-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
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
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 group">
                      <img src={img.base64} alt={img.file.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/85 text-neutral-400 hover:text-red-400 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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
          <div className="p-5 border-t border-neutral-900/60 bg-neutral-950/40 shrink-0">
            <button
              onClick={runAnalysis}
              disabled={images.length === 0 || isGenerating || !apiKey}
              className="w-full py-3.5 bg-[#76b900] hover:bg-[#66a000] disabled:bg-neutral-850 disabled:text-neutral-500 text-black font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(118,185,0,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              {isGenerating && messages.length <= 1 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compiling visual data...
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

        {/* Right Side: Conversational Chat Screen */}
        <div className="flex-1 flex flex-col h-full bg-[#050505]/20 overflow-hidden relative">
          
          {/* Scrollable conversation history */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
            {messages.length === 0 && !isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 gap-4">
                <ImageIcon className="w-12 h-12 opacity-15 text-neutral-400" />
                <p className="text-xs tracking-wider uppercase font-semibold text-neutral-600">Awaiting Visual Assets</p>
                <p className="text-[11px] text-neutral-500 max-w-xs mt-[-10px]">
                  Upload images and run the VLM to perform deep structural analysis. You can keep chatting with the VLM afterwards!
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((m, idx) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-4 p-5 rounded-2xl w-full group transition-all duration-200 border",
                      m.role === "user"
                        ? "bg-neutral-900/60 border-neutral-850 max-w-[85%] ml-auto"
                        : m.role === "system"
                          ? "bg-red-950/10 border-red-500/20 text-red-400 max-w-full"
                          : "bg-transparent border-transparent max-w-full"
                    )}
                  >
                    {m.role !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 mt-0.5 border border-green-500/30">
                        {m.role === "system" ? "!" : <Eye className="w-4 h-4" />}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* Attached images for the first user message */}
                      {idx === 0 && m.images && m.images.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mb-4">
                          {m.images.map((base64, i) => (
                            <div key={i} className="relative w-32 aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                              <img src={base64} alt={`attached_${i}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Markdown Body */}
                      <div className="prose prose-invert prose-xs leading-relaxed max-w-none markdown-body text-sm md:text-[15px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>

                      {/* Controls & Metrics for assistant responses */}
                      {m.role === "assistant" && (
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 border-t border-neutral-900/60 pt-4">
                          {/* Copy & Extract buttons */}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => copyToClipboard(m.content, idx)}
                              className="text-[10px] font-semibold text-neutral-500 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedIndex === idx ? <Check className="w-3 h-3 text-[#76b900]" /> : <Clipboard className="w-3 h-3" />}
                              Copy Output
                            </button>
                            {(analysisType === "table" || m.content.includes("```json")) && (
                              <button
                                onClick={() => downloadJson(m.content)}
                                className="text-[10px] font-semibold text-neutral-500 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                JSON Extract
                              </button>
                            )}
                          </div>

                          {/* Telemetry metrics */}
                          {m.metrics && isDevMode && (
                            <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono bg-neutral-900/40 px-2.5 py-1 rounded-md border border-neutral-800/80">
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-[#76b900]" />
                                <span>TTFT: <strong className="text-neutral-300">{m.metrics.ttft}ms</strong></span>
                              </div>
                              <span className="opacity-30">|</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-400" />
                                <span>Latency: <strong className="text-neutral-300">{m.metrics.totalTime}ms</strong></span>
                              </div>
                              <span className="opacity-30">|</span>
                              <div className="flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-purple-400" />
                                <span>Speed: <strong className="text-neutral-300">{m.metrics.tps} t/s</strong></span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Streaming Response */}
                {streamingContent && (
                  <div className="flex gap-4 p-5 rounded-2xl w-full bg-transparent border border-transparent max-w-full">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 mt-0.5 border border-green-500/30">
                      <Eye className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose prose-invert prose-xs leading-relaxed max-w-none markdown-body text-sm md:text-[15px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                      </div>
                      {lastMetrics && isDevMode && (
                        <div className="flex items-center gap-3 mt-4 text-[10px] text-neutral-500 font-mono bg-neutral-900/40 w-max px-2.5 py-1 rounded-md border border-neutral-800/80">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-[#76b900] animate-pulse" />
                            <span>TTFT: <strong className="text-neutral-300">{lastMetrics.ttft}ms</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input box at the bottom */}
          {messages.length > 0 && (
            <div className="p-4 border-t border-neutral-900/80 bg-neutral-950/40 shrink-0 w-full">
              <div className="max-w-3xl mx-auto flex flex-col gap-2 relative">
                {isGenerating && (
                  <div className="flex justify-center mb-1">
                    <button
                      onClick={stopGeneration}
                      className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white px-4 py-1.5 rounded-full text-xs font-semibold border border-neutral-800 transition cursor-pointer"
                    >
                      <Square className="w-3 h-3 text-red-500 fill-current" />
                      Stop Generating
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 bg-[#080808]/90 border border-neutral-850 rounded-xl p-2 focus-within:border-[#76b900]/40 transition">
                  <button
                    onClick={resetChat}
                    className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                    title="Reset Conversation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <textarea
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendFollowUp();
                      }
                    }}
                    placeholder="Type a follow-up question about the analyzed images..."
                    disabled={isGenerating}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-neutral-100 placeholder-neutral-600 resize-none min-h-[36px] max-h-[120px] scrollbar-thin py-1"
                    rows={1}
                  />
                  <button
                    onClick={sendFollowUp}
                    disabled={!followUpInput.trim() || isGenerating}
                    className="p-2 bg-[#76b900] disabled:bg-neutral-850 disabled:text-neutral-600 text-black font-bold rounded-lg hover:bg-[#66a000] hover:scale-105 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
