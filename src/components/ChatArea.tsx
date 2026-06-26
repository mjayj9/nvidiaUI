import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User as UserIcon,
  Paperclip,
  X,
  GitFork,
  ImageIcon,
  Dna,
  BrainCircuit,
  Settings2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
  Square,
  Activity,
  Code2,
} from "lucide-react";
import Markdown from "react-markdown";
import { Message, ChatSession, Attachment } from "../types";
import { getMessages, addMessage, uploadFile, updateSessionSettings, saveChatSnapshot } from "../lib/api";
import { chatWithNvidiaObject, NimMetrics } from "../lib/nim";
import { cn } from "../lib/utils";
import { getModelType, hasThinkingMode, NIM_MODELS } from "../models";
import { useWorkspace } from "../context/WorkspaceContext";
import { useToast } from "../context/ToastContext";
import CodeExportModal from "./CodeExportModal";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CodeBlock({ node, inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group rounded-md overflow-hidden bg-[#111] my-2 border border-neutral-800">
        <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a1a] border-b border-neutral-800 text-neutral-400 text-xs font-mono">
          <span>{lang}</span>
          <button onClick={handleCopy} className="hover:text-white transition">
            {copied ? <Check className="w-3.5 h-3.5 text-[#76b900]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={lang}
          PreTag="div"
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.875rem' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return <code className={cn("bg-neutral-800 px-1.5 py-0.5 rounded text-[13px] font-mono text-neutral-300", className)} {...props}>{children}</code>;
}

// Helper component to parse and display <think>...</think> reasoning blocks
function MessageWithReasoning({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract <think> blocks
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);

  if (thinkMatch) {
    const thinkingContent = thinkMatch[1].trim();
    const restContent = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();

    return (
      <div className="flex flex-col gap-3">
        <div className="bg-neutral-800/40 rounded-xl border border-neutral-700/50 overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-neutral-800/60 transition-colors"
          >
            <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
              <BrainCircuit className="w-4 h-4" />
              <span>Thought Process</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            )}
          </button>
          {isExpanded && (
            <div className="px-4 pb-4 pt-1 text-sm text-neutral-400 border-t border-neutral-700/50">
              <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed opacity-80">
                {thinkingContent}
              </div>
            </div>
          )}
        </div>

        {restContent && (
          <div className="markdown-body mt-2">
            <Markdown components={{ code: CodeBlock as any }}>{restContent}</Markdown>
          </div>
        )}
      </div>
    );
  }

  // Handle open <think> tag that is still streaming
  if (content.includes("<think>")) {
    const rawThinking = content.replace("<think>", "").trim();
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-neutral-800/40 rounded-xl border border-neutral-700/50 overflow-hidden">
          <div className="w-full px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
              <BrainCircuit className="w-4 h-4 animate-pulse" />
              <span>Thinking...</span>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="px-4 pb-4 pt-1 text-sm text-neutral-400 border-t border-neutral-700/50">
            <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed opacity-80">
              {rawThinking}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (content.startsWith("ERROR_PAYLOAD:")) {
    const errorMsg = content.replace("ERROR_PAYLOAD:", "").trim();
    
    // Parse common errors to make it human-readable
    let friendlyTitle = "요청 처리 중 오류가 발생했습니다.";
    let friendlyDesc = "NVIDIA API 서버와의 통신 중 예외가 발생했습니다.";
    
    const lowerMsg = errorMsg.toLowerCase();
    if (lowerMsg.includes("401") || lowerMsg.includes("unauthorized") || lowerMsg.includes("invalid api key")) {
      friendlyTitle = "API Key 인증 실패 (401)";
      friendlyDesc = "설정된 NVIDIA API Key가 올바르지 않거나 만료되었습니다. 우측 상단 Settings 메뉴에서 유효한 nvapi-... 키로 수정 후 다시 시도해 주세요.";
    } else if (lowerMsg.includes("402") || lowerMsg.includes("quota") || lowerMsg.includes("limit") || lowerMsg.includes("payment")) {
      friendlyTitle = "API 호출 한도 초과 (402/429)";
      friendlyDesc = "현재 API Key의 크레딧이 부족하거나 NVIDIA 개발자 계정의 분당/일일 호출 한도(Quota)를 초과했습니다. NVIDIA 빌드 페이지에서 계정 상태를 확인해 주세요.";
    } else if (lowerMsg.includes("404") || lowerMsg.includes("not found")) {
      friendlyTitle = "요청 주소를 찾을 수 없음 (404)";
      friendlyDesc = "호출하려는 AI 모델 엔드포인트를 찾을 수 없습니다. 모델 목록에서 다른 모델을 선택해 보시거나 API 연결 상태를 점검해 주세요.";
    } else if (lowerMsg.includes("failed to fetch") || lowerMsg.includes("cors") || lowerMsg.includes("networkerror")) {
      friendlyTitle = "네트워크 통신 오류 (CORS/Network)";
      friendlyDesc = "로컬 컴퓨터나 Render 호스트 서버와의 연결이 원활하지 않습니다. Render에 정적 사이트(Static Site)가 아닌 프록시 백엔드가 포함된 'Web Service'로 올바르게 배포되었는지 확인해 주세요.";
    }

    return (
      <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-neutral-200 mt-2 text-xs flex flex-col gap-2.5 shadow-lg max-w-2xl w-full">
        <div className="flex items-center gap-2 font-bold text-red-400">
          <span className="text-sm">🚨</span> {friendlyTitle}
        </div>
        <p className="text-neutral-400 leading-relaxed text-[11px]">{friendlyDesc}</p>
        
        <details className="mt-1 group border-t border-neutral-800/80 pt-2 cursor-pointer">
          <summary className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider select-none hover:text-neutral-300 transition-colors flex items-center gap-1">
            <span>상세 오류 로그 보기 (Developer Payload)</span>
          </summary>
          <pre className="mt-2 p-3 bg-black/60 rounded-lg text-[10px] font-mono text-red-300/80 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text border border-neutral-900">
            {errorMsg}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="markdown-body">
      <Markdown components={{ code: CodeBlock as any }}>{content}</Markdown>
    </div>
  );
}

interface ChatAreaProps {
  sessionId: string;
  userId: string;
  onToggleSessionSettings?: () => void;
  onToggleHistory?: () => void;
  onForkSession?: (messageTimestamp: number) => void;
}

export default function ChatArea({
  sessionId,
  userId,
  onToggleSessionSettings,
  onToggleHistory,
  onForkSession,
}: ChatAreaProps) {
  const { apiKey, model, sessions, updateSessionTitle } = useWorkspace();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localModel, setLocalModel] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [lastMetrics, setLastMetrics] = useState<NimMetrics | null>(null);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatCapableModels = NIM_MODELS.filter(m => 
    m.capabilities.includes("chat") || m.capabilities.includes("reasoning")
  );

  const currentSession = sessions.find((s) => s.id === sessionId);
  let activeModel = localModel || currentSession?.model || model;
  if (!chatCapableModels.some((m) => m.id === activeModel)) {
    activeModel = chatCapableModels[0]?.id || NIM_MODELS[0].id; // Fallback to first model
  }
  
  const modelType = getModelType(activeModel);
  const isVisionMode = modelType === "VISION";
  const isSpecialMode = modelType === "SPECIAL";
  const isThinkingMode = hasThinkingMode(activeModel);
  const activeModelName = NIM_MODELS.find(m => m.id === activeModel)?.name || activeModel;

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await getMessages(sessionId);
        setMessages(msgs);
        setStreamingContent("");
        setLastMetrics(null);
      } catch (e) {
        console.error("Failed to load messages", e);
      }
    };
    if (sessionId) {
      loadMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isVisionMode || isSpecialMode)
      setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isVisionMode && !isSpecialMode) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (
        (isVisionMode && file.type.startsWith("image/")) ||
        (isSpecialMode && file.name.endsWith(".pdb"))
      ) {
        processFile(file);
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || !apiKey || isGenerating) return;

    const userContent = input.trim();
    setInput("");
    const fileToUpload = selectedFile;
    const currentBase64 = fileBase64;
    setSelectedFile(null);
    setFileBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      let attachments: Attachment[] | undefined = undefined;
      // 1. Upload file if exists
      if (fileToUpload) {
        try {
          const url = await uploadFile(userId, fileToUpload);
          attachments = [
            {
              url,
              type: fileToUpload.type,
              name: fileToUpload.name,
            },
          ];
        } catch (e: any) {
          throw new Error(
            "Failed to upload file to Firebase. Check storage rules.",
          );
        }
      }

      // 2. Add user message locally and to DB
      const userMessage = await addMessage(
        sessionId,
        "user",
        userContent,
        attachments,
      );
      setMessages((prev) => [...prev, userMessage]);

      // Update title locally if it's the first message
      if (messages.length === 0) {
        updateSessionTitle(
          sessionId,
          userContent.substring(0, 30) || "Image Upload",
        );
      }

      // 3. Start generation
      setIsGenerating(true);
      setStreamingContent("");
      setLastMetrics(null);

      const controller = new AbortController();
      setAbortController(controller);

      const apiMessages = [...messages, userMessage].map((m) => {
        if (
          m.attachments &&
          m.attachments.length > 0 &&
          m.attachments[0].type.startsWith("image/")
        ) {
          return {
            role: m.role,
            content: [
              { type: "text", text: m.content || "Image" },
              {
                type: "image_url",
                image_url: {
                  url:
                    m.id === userMessage.id && currentBase64
                      ? currentBase64
                      : m.attachments[0].url,
                },
              },
            ],
          };
        }
        return {
          role: m.role,
          content: m.content,
        };
      });

      // 4. Stream from NIM
      let finalContent = "";
      
      const isThinking = isThinkingMode && currentSession?.thinkingEnabled;
      const extraPayload: any = {};
      if (isThinking) {
        extraPayload.reasoning_effort = currentSession?.reasoningEffort || "high";
      }

      await chatWithNvidiaObject(
        apiKey,
        activeModel,
        apiMessages,
        (chunk) => {
          finalContent += chunk;
          setStreamingContent(finalContent);
        },
        {
          temperature: currentSession?.temperature ?? 1,
          topP: currentSession?.topP ?? 0.95,
          maxTokens: currentSession?.maxTokens ?? 16384,
          systemPrompt: currentSession?.systemPrompt,
          responseFormat: currentSession?.responseFormat,
          toolsJson: currentSession?.toolsJson,
          stop: currentSession?.stop,
          seed: currentSession?.seed,
          frequencyPenalty: currentSession?.frequencyPenalty,
          presencePenalty: currentSession?.presencePenalty,
          abortSignal: controller.signal,
          onMetrics: (metrics) => setLastMetrics(metrics),
          ...extraPayload
        },
      );

      // 5. Operation finished, save assistant message to DB
      if (finalContent) {
        const aiMessage = await addMessage(
          sessionId,
          "assistant",
          finalContent,
          undefined,
          activeModel
        );
        setMessages((prev) => [...prev, aiMessage]);
      }
      setStreamingContent("");
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage =
        error.message || "An error occurred during generation.";

      // Ensure we display raw JSON or text in a red box if possible
      const formattedError = `ERROR_PAYLOAD:\n${errorMessage}`;

      const systemMessage = await addMessage(
        sessionId,
        "system",
        formattedError,
      );
      setMessages((prev) => [...prev, systemMessage]);
      setStreamingContent("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex w-full h-full bg-neutral-900 overflow-hidden relative">
      {/* Container for Chat (left) and optional Split View (right) */}
      <div
        className={cn(
          "flex-1 flex flex-col h-full bg-neutral-900 overflow-hidden relative transition-all duration-300",
          isSpecialMode
            ? "w-1/2 border-r border-neutral-800 shrink-0"
            : "w-full",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {(isVisionMode || isSpecialMode) &&
          isDragging && (
            <div className="absolute inset-0 z-50 bg-green-500/10 border-2 border-green-500 border-dashed m-4 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <div className="bg-neutral-900 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
                {isVisionMode && (
                  <ImageIcon className="w-10 h-10 text-green-500" />
                )}
                {isSpecialMode && (
                  <Dna className="w-10 h-10 text-emerald-500" />
                )}
                <span className="text-white font-medium">
                  Drop{" "}
                  {isVisionMode
                    ? "image"
                    : "structural (.pdb) file"}{" "}
                  here to upload
                </span>
              </div>
            </div>
          )}

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0 absolute top-0 w-full z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#76b900] rounded-[4px] flex items-center justify-center">
                 <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">NVIDIA</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={async () => {
              try {
                const modelsUsed = Array.from(new Set(messages.map(m => m.model || currentSession?.model || "unknown")));
                await saveChatSnapshot(userId, currentSession?.title || "Saved Chat", modelsUsed, messages);
                toast("성공적으로 저장되었습니다", "success");
              } catch (e) {
                console.error("Failed to save chat", e);
                toast("저장에 실패했습니다.", "error");
              }
            }} className="text-sm font-medium text-neutral-400 hover:text-white transition flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Save Chat
            </button>
            <button onClick={onToggleHistory} className="text-sm font-medium text-neutral-400 hover:text-white transition flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              History
            </button>
            <button onClick={onToggleSessionSettings} className="text-sm font-medium text-neutral-400 hover:text-white transition flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Settings
            </button>
            <button onClick={() => setIsCodeExportOpen(true)} className="text-sm text-neutral-400 flex items-center gap-2 cursor-pointer hover:text-white transition">
              <Code2 className="w-4 h-4" />
              Build
            </button>
            <span className="text-sm font-medium text-white flex items-center gap-2 bg-[#222] px-3 py-1.5 rounded-full border border-neutral-700 cursor-pointer">
              <svg className="w-4 h-4 text-[#76b900]" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Playground
            </span>
            <a href="#" className="text-sm text-neutral-400 hover:text-white transition">Model Card</a>
            <select
              value={activeModel}
              onChange={(e) => {
                setLocalModel(e.target.value);
                if (sessionId) {
                  updateSessionSettings(sessionId, { model: e.target.value });
                }
              }}
              className="text-sm font-medium text-white bg-transparent outline-none cursor-pointer hover:text-[#76b900] transition"
            >
              {Array.from(new Set(chatCapableModels.map(m => m.brand))).map(brand => (
                <optgroup key={brand} label={brand} className="bg-neutral-900 text-white">
                  {chatCapableModels.filter(m => m.brand === brand).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-20 pb-6 w-full max-w-4xl mx-auto flex flex-col gap-6 scrollbar-thin scrollbar-thumb-neutral-800">
          
          {lastMetrics && (
            <div className="w-full bg-[#111] border border-neutral-800 rounded-xl p-3 md:p-4 flex flex-col gap-3 md:gap-4 text-xs font-mono text-neutral-400 mb-4 transition-all">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsTelemetryExpanded(!isTelemetryExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#76b900]" />
                  <span className="text-white font-bold">Telemetry Metrics</span>
                  <span className="text-[9px] text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 md:hidden">
                    {isTelemetryExpanded ? "Tap to collapse" : "Tap to expand"}
                  </span>
                </div>
                <button className="text-neutral-500 hover:text-white transition-colors">
                  {isTelemetryExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {isTelemetryExpanded && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-4 md:gap-6">
                      <div className="flex flex-col">
                        <span className="text-neutral-500 uppercase text-[10px]">TTFT</span>
                        <span className="text-white">{lastMetrics.ttft} ms</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 uppercase text-[10px]">TPS</span>
                        <span className="text-white">{lastMetrics.tps}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 uppercase text-[10px]">Latency</span>
                        <span className="text-white">{(lastMetrics.totalTime / 1000).toFixed(2)} s</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 uppercase text-[10px]">Tokens (Out)</span>
                        <span className="text-white">{lastMetrics.tokens}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 uppercase text-[10px]">Est. Cost</span>
                        <span className="text-white">${(((Math.round(JSON.stringify(messages).length / 4) + lastMetrics.tokens) / 1000000) * 0.50).toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex justify-between text-[10px] text-neutral-500 uppercase">
                      <span>Context Window</span>
                      <span>
                        {Math.round(JSON.stringify(messages).length / 4) + lastMetrics.tokens} / {currentSession?.maxTokens || 128000}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500", 
                          (Math.round(JSON.stringify(messages).length / 4) + lastMetrics.tokens) / (currentSession?.maxTokens || 128000) > 0.9 
                            ? "bg-red-500" 
                            : "bg-[#76b900]"
                        )}
                        style={{ width: `${Math.min(100, ((Math.round(JSON.stringify(messages).length / 4) + lastMetrics.tokens) / (currentSession?.maxTokens || 128000)) * 100)}%` }}
                      />
                    </div>
                    {(Math.round(JSON.stringify(messages).length / 4) + lastMetrics.tokens) / (currentSession?.maxTokens || 128000) > 0.9 && (
                      <span className="text-red-400 text-[10px] mt-0.5">Warning: Approaching context window limit.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.length === 0 && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Network nodes background placeholder */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(118,185,0,0.15)_0%,transparent_60%)] animate-pulse"></div>
                <svg className="absolute w-full h-full opacity-30 text-[#76b900] animate-[spin_60s_linear_infinite]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M100 20 L160 50 L160 150 L100 180 L40 150 L40 50 Z" strokeDasharray="4 4" />
                  <circle cx="100" cy="20" r="3" fill="currentColor"/>
                  <circle cx="160" cy="50" r="3" fill="currentColor"/>
                  <circle cx="160" cy="150" r="3" fill="currentColor"/>
                  <circle cx="100" cy="180" r="3" fill="currentColor"/>
                  <circle cx="40" cy="150" r="3" fill="currentColor"/>
                  <circle cx="40" cy="50" r="3" fill="currentColor"/>
                </svg>
                <h3 className="text-2xl font-bold text-white relative z-10 tracking-tight">
                  {activeModelName}
                </h3>
              </div>
              <div className="flex gap-4 mt-8 flex-wrap justify-center max-w-2xl">
                 <button className="px-5 py-3 rounded-lg border border-neutral-700/50 bg-neutral-900/50 text-neutral-300 hover:bg-neutral-800 transition text-sm flex items-center gap-2 group">
                   Which number is larger, 9.11 or 9.8? <span className="text-[#76b900] group-hover:translate-x-1 transition-transform">➔</span>
                 </button>
                 <button className="px-5 py-3 rounded-lg border border-neutral-700/50 bg-neutral-900/50 text-neutral-300 hover:bg-neutral-800 transition text-sm flex items-center gap-2 group">
                   How many 'r's are in 'strawberry'? <span className="text-[#76b900] group-hover:translate-x-1 transition-transform">➔</span>
                 </button>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-4 p-4 rounded-2xl w-full group",
                m.role === "user"
                  ? "bg-neutral-800/80 ml-auto max-w-[85%]"
                  : "bg-transparent mr-auto max-w-full",
                m.role === "system"
                  ? "bg-red-500/10 border border-red-500/20 text-red-400"
                  : "",
              )}
            >
              {m.role !== "user" && (
               <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                  {m.role === "system" ? "!" : <Bot className="w-5 h-5" />}
                </div>
              )}

              <div className="flex-1 min-w-0 prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 max-w-none text-sm md:text-base">
                {m.role === "user" ? (
                  <div className="flex flex-col gap-2">
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2 text-center text-xs text-neutral-500 border border-neutral-800 border-dashed p-4 rounded-xl flex flex-col items-center gap-2 max-w-[200px]">
                        {m.attachments.map((att, i) =>
                          att.type.startsWith("image/") ? (
                            <img
                              key={i}
                              src={att.url}
                              alt={att.name}
                              className="max-w-[150px] max-h-[150px] rounded-lg object-contain"
                            />
                          ) : (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-700 rounded-lg w-full"
                            >
                              <Paperclip className="w-4 h-4 text-neutral-400 shrink-0" />
                              <span className="text-xs text-neutral-300 truncate">
                                {att.name}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <MessageWithReasoning content={m.content} />
                    {m.model && (
                      <div className="self-start text-[10px] text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded border border-neutral-800 mt-2">
                        이 답변을 생성한 모델: {NIM_MODELS.find(x => x.id === m.model)?.name || m.model}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="flex flex-col items-center gap-2 shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-neutral-700 text-neutral-300 flex items-center justify-center">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  {onForkSession && (
                    <button
                      onClick={() => onForkSession(m.timestamp)}
                      className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded transition opacity-0 group-hover:opacity-100"
                      title="Branch calculation from here"
                    >
                      <GitFork className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {streamingContent && (
            <div className="flex gap-4 p-4 rounded-2xl w-full bg-transparent mr-auto max-w-full">
              <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 max-w-none text-sm md:text-base">
                <MessageWithReasoning content={streamingContent} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 pb-8 shrink-0 w-full relative max-w-4xl mx-auto flex flex-col gap-2">
          {isGenerating && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => abortController?.abort()}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-full text-sm font-medium border border-neutral-600 shadow-lg transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop Generating
              </button>
            </div>
          )}

          {/* Top Toolbar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-neutral-300 bg-[#111] hover:bg-[#222] border border-neutral-700/50 rounded-md px-3 py-1.5 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Tools
              </button>
              
              <div className="flex items-center gap-2">
                {isThinkingMode && (
                  <>
                    <span className="text-sm font-medium text-neutral-300">Reasoning</span>
                    <div className="flex bg-[#111] border border-neutral-700/50 rounded-md overflow-hidden p-0.5">
                      <button 
                        onClick={() => sessionId && updateSessionSettings(sessionId, { thinkingEnabled: false })}
                        className={cn("px-3 py-1 text-xs font-medium rounded-sm transition", !currentSession?.thinkingEnabled ? "bg-[#333] text-white" : "text-neutral-500 hover:text-white")}
                      >
                        OFF
                      </button>
                      <button 
                        onClick={() => sessionId && updateSessionSettings(sessionId, { thinkingEnabled: true })}
                        className={cn("px-3 py-1 text-xs font-medium rounded-sm transition", currentSession?.thinkingEnabled ? "bg-[#333] text-white" : "text-neutral-500 hover:text-white")}
                      >
                        ON
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={onToggleSessionSettings}
              className="flex items-center gap-2 text-sm font-medium text-neutral-300 bg-[#111] hover:bg-[#222] border border-neutral-700/50 rounded-md px-3 py-1.5 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Parameters
            </button>
          </div>

          {/* Textbox Area */}
          <div className="relative bg-[#0d0d0d] border border-neutral-700 rounded-xl flex flex-col p-2 pt-3 transition-all focus-within:border-neutral-500">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 mx-2 mb-2 bg-neutral-800/50 rounded-lg w-max border border-neutral-700">
                <Paperclip className="w-4 h-4 text-neutral-400" />
                <span className="text-xs text-neutral-300 max-w-[150px] truncate">
                  {selectedFile.name}
                </span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileBase64(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-neutral-500 hover:text-white p-0.5 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                apiKey
                  ? "I can evaluate text, images, or audio based on your prompt or an example from above."
                  : "Please configure API key in settings..."
              }
              disabled={!apiKey || isGenerating}
              className="w-full bg-transparent resize-none overflow-y-auto px-3 pb-12 outline-none text-sm scrollbar-thin text-neutral-200 placeholder-neutral-500 disabled:opacity-50 min-h-[80px]"
              rows={3}
            />

            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center px-1">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept={
                  isVisionMode
                    ? "image/*"
                    : isSpecialMode
                      ? ".pdb,.fasta"
                      : ".txt"
                }
              />
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                <button 
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedFile) || !apiKey || isGenerating}
                  className="w-8 h-8 rounded-full bg-neutral-600 disabled:opacity-50 flex items-center justify-center text-white hover:bg-neutral-500 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div className="text-center mt-2 text-[10px] text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            GOVERNING TERMS: The trial service is governed by the NVIDIA API Trial Terms of Service; use of this model is governed by the NVIDIA Software and Model Evaluation License.
          </div>
        </div>
      </div>

      {/* Split View Sandbox Placeholder for Biology Models */}
      {isSpecialMode && (
        <div className="flex-1 w-1/2 bg-neutral-950 hidden md:flex flex-col relative h-full">
          <header className="h-14 border-b border-neutral-800 flex items-center px-4 shrink-0 bg-neutral-900/50 backdrop-blur-md absolute top-0 w-full z-10">
            <div className="flex items-center gap-2 text-neutral-400">
              <Dna className="w-4 h-4" />
              <span className="text-sm font-medium">
                Protein / Molecular Structure Viewer
              </span>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center flex-col text-neutral-600 gap-3 pt-14">
            <Dna className="w-12 h-12 opacity-20" />
            <p className="text-sm">
              Upload a .pdb molecular sequence to render live 3D view.
            </p>
          </div>
        </div>
      )}

      {currentSession && (
        <CodeExportModal
          isOpen={isCodeExportOpen}
          onClose={() => setIsCodeExportOpen(false)}
          session={currentSession}
          messages={messages}
          apiKey={apiKey}
        />
      )}
    </div>
  );
}
