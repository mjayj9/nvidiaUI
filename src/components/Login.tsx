import { signInWithGoogle } from "../lib/firebase";
import { Cpu, LogIn, Settings, X, RotateCcw } from "lucide-react";
import { useState } from "react";

interface LoginProps {
  onGuestLogin: () => void;
}

export default function Login({ onGuestLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configText, setConfigText] = useState(() => {
    const saved = localStorage.getItem("nim_custom_firebase_config");
    if (saved) return JSON.stringify(JSON.parse(saved), null, 2);
    return "";
  });

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      console.error(e);
      let errorMsg = "구글 로그인 진행 중 오류가 발생했습니다. 아래의 'Developer Bypass (Guest)' 버튼을 클릭하여 로그인해 주세요.";
      if (e.code === "auth/unauthorized-domain") {
        errorMsg = `현재 접속 중인 도메인(${window.location.hostname})이 Firebase Authentication의 승인된 도메인(Authorized Domains)에 등록되지 않았습니다.

[해결 방법]
1. Firebase 콘솔에 로그인합니다.
2. Authentication -> Settings -> Authorized Domains로 이동합니다.
3. '도메인 추가' 버튼을 눌러 '${window.location.hostname}'을 추가해 주세요.`;
      } else if (e.code === "auth/invalid-api-key" || e.code === "auth/configuration-not-found") {
        errorMsg = `구글 로그인 구성 오류가 발생했습니다.

[원인]
현재 프로젝트 구성에 등록된 API 키가 유효하지 않거나 활성화되지 않았습니다. 우측 상단의 톱니바퀴 아이콘을 클릭하여 올바른 Firebase SDK 구성을 설정했는지 확인해 주세요.`;
      } else if (e.code === "auth/operation-not-allowed") {
        errorMsg = `구글 로그인 제공업체(Sign-in provider)가 Firebase 콘솔에서 활성화되지 않았습니다.
        
[해결 방법]
1. Firebase 콘솔(https://console.firebase.google.com/)에 로그인합니다.
2. Build -> Authentication -> Sign-in method 탭으로 이동합니다.
3. 구글(Google) 로그인 제공업체를 찾아 활성화(Enable)로 설정해 주세요.`;
      }
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = () => {
    try {
      let cleanText = configText.trim();
      if (!cleanText) {
        alert("구성 텍스트를 입력해 주세요.");
        return;
      }

      // JavaScript 객체 선언문에서 중괄호 안쪽만 추출
      if (cleanText.includes("{")) {
        const start = cleanText.indexOf("{");
        const end = cleanText.lastIndexOf("}");
        if (end > start) {
          cleanText = cleanText.substring(start, end + 1);
        }
      }

      // JS 객체 키와 값을 유효한 JSON 형식으로 포맷팅
      cleanText = cleanText
        .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":') // 키값 따옴표 래핑
        .replace(/'([^']*)'/g, '"$1"') // 싱글쿼트를 더블쿼트로 교체
        .replace(/,\s*([}\]])/g, "$1"); // 맨 뒤 콤마 제거

      const parsedConfig = JSON.parse(cleanText);

      // 필수 키값 검증
      if (!parsedConfig.apiKey || !parsedConfig.projectId || !parsedConfig.appId) {
        alert("유효한 Firebase 구성 정보가 아닙니다. apiKey, projectId, appId는 필수 항목입니다.");
        return;
      }

      localStorage.setItem("nim_custom_firebase_config", JSON.stringify(parsedConfig));
      alert("Firebase 프로젝트 구성이 저장되었습니다. 페이지가 새로고침됩니다.");
      window.location.reload();
    } catch (err: any) {
      alert("구성을 파싱하는 중 오류가 발생했습니다. 올바른 JSON 또는 Firebase SDK config 객체 형태인지 확인해 주세요: " + err.message);
    }
  };

  const handleResetConfig = () => {
    if (window.confirm("Firebase 프로젝트 구성을 기본값(focused-rig-vcf5x)으로 초기화하시겠습니까?")) {
      localStorage.removeItem("nim_custom_firebase_config");
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-50 px-4 relative">
      {/* Background neon ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#76b900]/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 p-10 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl relative z-10 backdrop-blur-md nvidia-glow">
        {/* Settings button */}
        <button
          onClick={() => setShowConfig(true)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-500 hover:text-white hover:border-neutral-750 hover:bg-neutral-900 transition duration-300 cursor-pointer"
          title="Firebase 프로젝트 설정"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#76b900]/10 text-[#76b900] flex items-center justify-center rounded-2xl mb-6 border border-[#76b900]/20 animate-pulse">
            <Cpu className="w-8 h-8 drop-shadow-[0_0_8px_rgba(118,185,0,0.5)]" />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            NVIDIA NIM <span className="text-[#76b900]">Playground</span>
          </h2>
          <p className="text-xs text-neutral-400 mb-8 leading-relaxed">
            Sign in to start exploring NVIDIA Inference Microservices.
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign-in */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-neutral-750 text-sm font-semibold rounded-xl text-white bg-neutral-950 hover:bg-neutral-900 focus:outline-none transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-neutral-800/80"></div>
            <span className="flex-shrink mx-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-neutral-800/80"></div>
          </div>

          {/* Developer Bypass (Guest Account) */}
          <button
            onClick={onGuestLogin}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-[#76b900]/30 text-sm font-semibold rounded-xl text-black bg-[#76b900] hover:bg-[#66a000] transition-all shadow-[0_4px_15px_rgba(118,185,0,0.2)] hover:shadow-[0_4px_25px_rgba(118,185,0,0.35)] cursor-pointer hover:scale-[1.01]"
          >
            <LogIn className="w-4 h-4" />
            <span>Developer Bypass (Guest)</span>
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-[10px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Google Auth requires active OAuth authorization. Choose Developer Bypass or configure your own Firebase project above.
          </p>
        </div>
      </div>

      {/* Firebase Config Modal Overlay */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative z-20">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#76b900]" />
                <span className="text-sm font-bold text-white">Firebase Project Settings</span>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-neutral-500 hover:text-white p-1 hover:bg-neutral-800 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-left">
              <p className="text-xs text-neutral-400 leading-relaxed">
                구글 로그인을 활성화하려면 Firebase 콘솔에서 발급받은 웹 앱 SDK 구성 객체(JavaScript)를 아래에 붙여넣어 주세요.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">SDK Configuration Object</label>
                <textarea
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "nvidiaui-5c838.firebaseapp.com",
  projectId: "nvidiaui-5c838",
  storageBucket: "nvidiaui-5c838.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};`}
                  className="w-full bg-[#0d0d0d] border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-300 placeholder-neutral-700 focus:border-[#76b900] focus:outline-none resize-none min-h-[180px] transition-all"
                  rows={8}
                />
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleResetConfig}
                  className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition duration-300 cursor-pointer bg-transparent border-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  기본값으로 초기화
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfig(false)}
                    className="px-4 py-2 bg-neutral-950 border border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-[#76b900] hover:bg-[#66a000] text-black rounded-lg text-xs font-bold transition duration-300 shadow-[0_4px_10px_rgba(118,185,0,0.15)] cursor-pointer"
                  >
                    설정 저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
