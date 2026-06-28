import { useState } from "react";
import SpeechHub from "./SpeechHub";
import VideoStudio from "./VideoStudio";
import { Mic, Video } from "lucide-react";

export default function SpeechVideoHub() {
  const [activeSubTab, setActiveSubTab] = useState<"speech" | "video">("speech");

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-neutral-950">
      {/* Tab Switch Header */}
      <div className="flex border-b border-neutral-900 bg-[#070707] px-6 py-0 shrink-0 gap-6">
        <button
          onClick={() => setActiveSubTab("speech")}
          className={`flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition border-b-2 cursor-pointer ${
            activeSubTab === "speech"
              ? "text-white border-[#76b900]"
              : "text-neutral-500 border-transparent hover:text-neutral-300"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          음성 도구 (Speech Hub)
        </button>
        <button
          onClick={() => setActiveSubTab("video")}
          className={`flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition border-b-2 cursor-pointer ${
            activeSubTab === "video"
              ? "text-white border-[#76b900]"
              : "text-neutral-500 border-transparent hover:text-neutral-300"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          영상 도구 (Video Studio)
        </button>
      </div>

      {/* Render subcomponents */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeSubTab === "speech" ? <SpeechHub /> : <VideoStudio />}
      </div>
    </div>
  );
}
