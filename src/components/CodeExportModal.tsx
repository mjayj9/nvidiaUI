import { useState } from "react";
import { X, Check, Copy, Code2, Terminal, FileJson } from "lucide-react";
import { ChatSession, Message } from "../types";

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  messages: Message[];
  apiKey: string;
}

export default function CodeExportModal({ isOpen, onClose, session, messages, apiKey }: CodeExportModalProps) {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "nodejs" | "json">("curl");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
  const authKey = apiKey || "YOUR_API_KEY";

  const payload = {
    model: session.model,
    messages: [
      ...(session.systemPrompt ? [{ role: "system", content: session.systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ],
    temperature: session.temperature ?? 1,
    top_p: session.topP ?? 0.95,
    max_tokens: session.maxTokens ?? 1024,
    stream: session.isStream ?? true,
    ...(session.stop ? { stop: [session.stop] } : {}),
    ...(session.seed !== undefined ? { seed: session.seed } : {}),
    ...(session.frequencyPenalty !== undefined ? { frequency_penalty: session.frequencyPenalty } : {}),
    ...(session.presencePenalty !== undefined ? { presence_penalty: session.presencePenalty } : {}),
  };

  const getCode = () => {
    const jsonStr = JSON.stringify(payload, null, 2);

    switch (activeTab) {
      case "curl":
        return `curl -i -X POST ${endpoint} \\
  -H "Authorization: Bearer ${authKey}" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -d '${jsonStr}'`;

      case "python":
        return `import openai

client = openai.OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key="${authKey}"
)

completion = client.chat.completions.create(
  model="${session.model}",
  messages=${JSON.stringify(payload.messages, null, 2).replace(/\n/g, '\n  ')},
  temperature=${payload.temperature},
  top_p=${payload.top_p},
  max_tokens=${payload.max_tokens},
  stream=${payload.stream}
)

for chunk in completion:
  if chunk.choices[0].delta.content is not None:
    print(chunk.choices[0].delta.content, end="")
`;

      case "nodejs":
        return `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '${authKey}',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: '${session.model}',
    messages: ${JSON.stringify(payload.messages, null, 2).replace(/\n/g, '\n    ')},
    temperature: ${payload.temperature},
    top_p: ${payload.top_p},
    max_tokens: ${payload.max_tokens},
    stream: ${payload.stream},
  });

  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();`;

      case "json":
        return jsonStr;
    }
  };

  const code = getCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#050505] border border-[#76b900]/25 rounded-2xl shadow-[0_0_35px_rgba(118,185,0,0.15)] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-neutral-900/60 bg-[#080808]/90 shrink-0">
          <div className="flex items-center gap-3 text-white font-bold tracking-wide">
            <Code2 className="w-5 h-5 text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.4)]" />
            <span className="text-xs uppercase tracking-widest">Developer Code Export</span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex px-5 pt-4 gap-4 border-b border-neutral-900 justify-between items-center bg-[#080808]/40">
            <div className="flex gap-5">
              {[
                { id: "curl", label: "cURL" },
                { id: "python", label: "Python" },
                { id: "nodejs", label: "Node.js" },
                { id: "json", label: "JSON Payload" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all duration-300 border-b-2 cursor-pointer ${
                    activeTab === tab.id
                      ? "text-white border-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.2)]"
                      : "text-neutral-500 border-transparent hover:text-neutral-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const md = messages.map(m => `**${m.role.toUpperCase()}**\n\n${m.content}\n\n`).join("---\n\n");
                const blob = new Blob([md], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `chat-${session.id}.md`;
                a.click();
              }}
              className="pb-3 text-xs font-bold text-[#76b900] hover:text-[#66a000] uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer"
            >
              Export Chat (.md)
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 bg-[#030303] relative">
            <button
              onClick={handleCopy}
              className="absolute top-6 right-6 p-2 bg-[#0c0c0c] border border-neutral-850 hover:border-[#76b900]/40 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all duration-300 flex items-center gap-2 z-10 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-widest">{copied ? "Copied" : "Copy"}</span>
            </button>
            <pre className="font-mono text-xs text-neutral-300 whitespace-pre-wrap outline-none p-5 w-full bg-[#030303] leading-relaxed">
              {code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
