import { AlertCircle, CheckCircle, Download, FileText, Loader2, Play, Video, X } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { modelRegistry } from "../lib/modelRegistry";

interface VideoStudioProps {
  apiKey: string;
}

export default function VideoStudio({ apiKey }: VideoStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<"understanding" | "synthetic">("understanding");

  // Common State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video Understanding State
  const [prompt, setPrompt] = useState("");
  const [activeModel, setActiveModel] = useState("cosmos3-nano-reasoner");
  const [undIsLoading, setUndIsLoading] = useState(false);
  const [undResult, setUndResult] = useState("");
  const videoModels = modelRegistry.filter((m) => m.capabilities.includes("video-understanding"));

  // Synthetic Video Checker State
  const [synIsLoading, setSynIsLoading] = useState(false);
  const [synResult, setSynResult] = useState<{
    isSynthetic: boolean;
    probability: number;
    timeline: { time: string; probability: number }[];
  } | null>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setUndResult("");
      setSynResult(null);
    }
  };

  const handleClear = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setUndResult("");
    setSynResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runVideoUnderstanding = async () => {
    if (!videoFile || undIsLoading) return;
    if (!apiKey) {
      alert("Configure your NVIDIA API Key in settings.");
      return;
    }

    setUndIsLoading(true);
    setUndResult("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];

        const response = await fetch("/api/video/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: activeModel,
            videoData: base64Data,
            fileName: videoFile.name,
            prompt: prompt.trim() || "Analyze the physical properties and action events in this video segment.",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText);
        }

        const data = await response.json();
        setUndResult(data.content);
      };
      reader.readAsDataURL(videoFile);
    } catch (e: any) {
      console.error(e);
      setUndResult(`🚨 **Video Understanding Error:** ${e.message}`);
    } finally {
      setUndIsLoading(false);
    }
  };

  const runSyntheticDetection = async () => {
    if (!videoFile || synIsLoading) return;
    if (!apiKey) {
      alert("Configure your NVIDIA API Key in settings.");
      return;
    }

    setSynIsLoading(true);
    setSynResult(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];

        const response = await fetch("/api/video/detect-synthetic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            videoData: base64Data,
            fileName: videoFile.name,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText);
        }

        const data = await response.json();
        setSynResult(data);
      };
      reader.readAsDataURL(videoFile);
    } catch (e: any) {
      console.error(e);
      alert(`Synthetic Video Detection Failed: ${e.message}`);
    } finally {
      setSynIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!synResult) return;
    const content = JSON.stringify(
      {
        fileName: videoFile?.name,
        timestamp: new Date().toISOString(),
        probability: synResult.probability,
        isSynthetic: synResult.isSynthetic,
        timeline: synResult.timeline,
      },
      null,
      2
    );
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synthetic_report_${videoFile?.name.replace(/\.[^/.]+$/, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden h-full">
      {/* Top Header */}
      <header className="h-16 border-b border-[#76b900]/25 flex items-center justify-between px-6 shrink-0 bg-neutral-950/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.5)]" />
          <span className="text-sm font-semibold text-white tracking-wide">Video Studio</span>
        </div>

        {/* Sub tabs navigation */}
        <div className="flex bg-neutral-900/80 rounded-xl p-1 border border-neutral-850">
          {[
            { id: "understanding", label: "Video Understanding" },
            { id: "synthetic", label: "Synthetic Deepfake Detector" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-[#76b900] text-black shadow-[0_0_12px_rgba(118,185,0,0.3)]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Workspace Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Video Preview & Selector */}
        <div className="w-1/2 border-r border-[#76b900]/15 flex flex-col h-full bg-[#070707]/60 backdrop-blur-md">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {!videoUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-neutral-800 hover:border-[#76b900]/45 bg-neutral-900/10 rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[250px]"
              >
                <Video className="w-12 h-12 text-neutral-500 mb-4" />
                <p className="text-sm font-semibold">Upload an MP4 Video File</p>
                <p className="text-xs text-neutral-500 mt-1">Supports standard MP4 format (Max 30MB)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-black aspect-video flex items-center justify-center shadow-lg">
                  <video src={videoUrl} controls className="w-full h-full object-contain" />
                  <button
                    onClick={handleClear}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/85 text-neutral-400 hover:text-white transition-all z-10 cursor-pointer hover:scale-105"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs bg-[#090909]/95 p-3.5 rounded-xl border border-neutral-850">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-300 truncate font-semibold">{videoFile?.name}</span>
                  </div>
                  <span className="text-neutral-500 font-mono text-[10px] shrink-0 font-medium">
                    {videoFile ? (videoFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                  </span>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleVideoSelect}
              accept="video/mp4"
              className="hidden"
            />

            {/* Video Understanding Controls */}
            {activeSubTab === "understanding" && videoUrl && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Cosmos / Omni Model</label>
                  <select
                    value={activeModel}
                    onChange={(e) => setActiveModel(e.target.value)}
                    className="w-full bg-[#090909]/95 border border-neutral-850 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer focus:border-[#76b900] transition-all"
                  >
                    {videoModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-neutral-950">
                        {m.fullName || m.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Prompt Instructions</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what occurs step by step in this video..."
                    className="w-full bg-[#090909]/95 border border-neutral-850 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:border-[#76b900] outline-none resize-none min-h-[90px] transition-all"
                    rows={3}
                  />
                </div>

                <button
                  onClick={runVideoUnderstanding}
                  disabled={undIsLoading}
                  className="w-full py-3.5 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_4px_15px_rgba(118,185,0,0.2)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  {undIsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Decompiled action matrices...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Decompile Video Action
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Synthetic Video Checker Controls */}
            {activeSubTab === "synthetic" && videoUrl && !synResult && !synIsLoading && (
              <button
                onClick={runSyntheticDetection}
                className="w-full py-3.5 bg-[#76b900] hover:bg-[#66a000] text-black font-bold rounded-xl text-sm transition-all duration-300 shadow-[0_4px_15px_rgba(118,185,0,0.2)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <Play className="w-4 h-4 fill-current" />
                Scan Video Authenticity
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Results Display */}
        <div className="w-1/2 flex flex-col h-full bg-[#050505]/20">
          <div className="flex-1 overflow-y-auto px-8 py-6 prose prose-invert max-w-none text-sm leading-relaxed scrollbar-thin">
            {/* UNDERSTANDING RESPONSE */}
            {activeSubTab === "understanding" && (
              <>
                {!undResult && !undIsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 gap-4">
                    <Video className="w-12 h-12 opacity-15 text-neutral-400" />
                    <p className="text-xs tracking-wider uppercase font-semibold text-neutral-600">Awaiting Video Target</p>
                    <p className="text-[11px] text-neutral-500 max-w-xs mt-[-10px]">Upload a video and send prompts to execute temporal visual action decoding.</p>
                  </div>
                ) : undIsLoading && !undResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.4)]" />
                    <p className="text-xs font-mono tracking-widest text-[#76b900]">DECODING FRAME TIMELINE...</p>
                  </div>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown>{undResult}</ReactMarkdown>
                  </div>
                )}
              </>
            )}

            {/* SYNTHETIC DETECTOR RESPONSE */}
            {activeSubTab === "synthetic" && (
              <>
                {synIsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.4)]" />
                    <p className="text-xs font-mono tracking-widest text-[#76b900]">ANALYZING FRAME TIMELINE LOGS...</p>
                  </div>
                ) : synResult ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                      <h3 className="text-base font-bold text-white tracking-wide">DETECTION REPORT</h3>
                      <button
                        onClick={downloadReport}
                        className="text-xs font-semibold text-neutral-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#76b900]" />
                        Download Report
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-[#090909]/80 p-4 rounded-xl border border-neutral-850 text-center">
                        <span className="text-[10px] text-neutral-500 uppercase block font-semibold tracking-wider">Assessment</span>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {synResult.isSynthetic ? (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <span className="text-sm font-extrabold text-red-500">SYNTHETIC (DEEPFAKE)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-sm font-extrabold text-green-500">NATURAL CAPTURE</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#090909]/80 p-4 rounded-xl border border-neutral-850 text-center">
                        <span className="text-[10px] text-neutral-500 uppercase block font-semibold tracking-wider">Deepfake Risk</span>
                        <span className={`text-xl font-extrabold block mt-2 ${synResult.isSynthetic ? "text-red-400" : "text-green-400"}`}>
                          {synResult.probability.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Timeline Log Graph */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                        Frame Authenticity Timeline Log
                      </span>
                      <div className="bg-[#090909] p-5 rounded-2xl border border-neutral-850 font-mono text-[11px] space-y-3.5 shadow-inner">
                        {synResult.timeline.map((item, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <span className="text-neutral-500 w-12">{item.time}</span>
                            <div className="flex-1 h-3 bg-neutral-900 rounded-lg overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${item.probability > 50 ? "bg-red-500" : "bg-green-500"}`}
                                style={{ width: `${item.probability}%` }}
                              ></div>
                            </div>
                            <span className={`w-12 text-right ${item.probability > 50 ? "text-red-400 font-bold" : "text-neutral-400"}`}>
                              {item.probability.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 gap-4">
                    <Video className="w-12 h-12 opacity-15 text-neutral-400" />
                    <p className="text-xs tracking-wider uppercase font-semibold text-neutral-600">Awaiting Authenticity Scan</p>
                    <p className="text-[11px] text-neutral-500 max-w-xs mt-[-10px]">Upload a video clip on the left and run scanning to trace fake structures.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
