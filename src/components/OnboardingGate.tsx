import { useState } from "react";
import { Cpu, Sparkles, CheckCircle2, ChevronRight, Key, Loader2, Star, Shield, ArrowRight, BookOpen } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useToast } from "../context/ToastContext";
import { validateNvidiaApiKey } from "../lib/apiKeyValidation";

interface OnboardingGateProps {
  onComplete: () => void;
}

export default function OnboardingGate({ onComplete }: OnboardingGateProps) {
  const { isDevMode, setIsDevMode, generalPreset, setGeneralPreset, updateApiKey } = useWorkspace();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedMode, setSelectedMode] = useState<"general" | "developer">("general");

  // Step 1 states: Terms
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [keyNoticeAccepted, setKeyNoticeAccepted] = useState(false);
  const [trackingAccepted, setTrackingAccepted] = useState(false);

  // Expanded explanations
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Step 3 states: API Key & Preset Setup
  const [inputKey, setInputKey] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<"idle" | "success" | "failed">("idle");
  const [keyTestMessage, setKeyTestMessage] = useState("");
  const [activePreset, setActivePreset] = useState<string>("balanced");

  const toggleExpand = (section: string) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const handleAllAgree = () => {
    const nextVal = !(termsAccepted && privacyAccepted && keyNoticeAccepted && trackingAccepted);
    setTermsAccepted(nextVal);
    setPrivacyAccepted(nextVal);
    setKeyNoticeAccepted(nextVal);
    setTrackingAccepted(nextVal);
  };

  const handleTestKey = async () => {
    if (!inputKey.trim()) {
      toast("API Key를 입력해 주세요.", "error");
      return;
    }
    setIsTestingKey(true);
    setKeyTestStatus("idle");
    setKeyTestMessage("");

    try {
      const result = await validateNvidiaApiKey(inputKey.trim());
      if (result.success) {
        setKeyTestStatus("success");
        setKeyTestMessage(result.message);
        toast("API Key 검증 성공!", "success");
      } else {
        setKeyTestStatus("failed");
        setKeyTestMessage(result.message);
        toast("API Key 검증에 실패했습니다.", "error");
      }
    } catch (e: any) {
      setKeyTestStatus("failed");
      setKeyTestMessage(e.message || "오류가 발생했습니다.");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleFinishOnboarding = () => {
    // 1. Sync states to localStorage
    localStorage.setItem("nim_onboarding_completed", "true");
    localStorage.setItem("nim_user_mode", selectedMode);
    localStorage.setItem("nim_terms_v1_accepted", String(termsAccepted));
    localStorage.setItem("nim_privacy_v1_accepted", String(privacyAccepted));
    localStorage.setItem("nim_tracking_accepted", String(trackingAccepted));

    // 2. Context updates
    setIsDevMode(selectedMode === "developer");
    if (selectedMode === "general") {
      setGeneralPreset(activePreset);
    }
    if (inputKey.trim()) {
      updateApiKey(inputKey.trim());
    }

    toast("온보딩 프로세스가 완료되었습니다!", "success");
    onComplete();
  };

  const presets = [
    { id: "fast", label: "⚡ 빠름", desc: "짧은 질문, 요약, 빠른 초안 작성에 적합", model: "meta/llama-3.1-8b-instruct" },
    { id: "balanced", label: "⚖️ 균형", desc: "대부분의 일상 및 일반 챗봇 작업에 권장", model: "meta/llama-3.1-70b-instruct" },
    { id: "accurate", label: "🧠 정확함", desc: "복잡한 추론, 소프트웨어 코드 디버깅, 긴 보고서 분석용", model: "nvidia/llama-3.3-nemotron-super-49b-v1.5" },
    { id: "creative", label: "🎨 창의적", desc: "자유로운 소설 작성, 디자인 아이디어, 프롬프트 생성용", model: "meta/llama-3.3-70b-instruct" },
    { id: "eco", label: "🌱 저비용", desc: "가벼운 테스트 및 효율 지향적인 반복 자동화용", model: "meta/llama-3.1-8b-instruct" }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-50 px-4 py-8 relative overflow-y-auto">
      {/* Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#76b900]/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="max-w-2xl w-full p-8 md:p-10 bg-neutral-900/80 rounded-2xl border border-neutral-800 shadow-2xl relative z-10 backdrop-blur-md flex flex-col justify-between min-h-[500px]">
        
        {/* Header */}
        <div className="mb-8 border-b border-neutral-800 pb-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-6 h-6 text-[#76b900] drop-shadow-[0_0_8px_rgba(118,185,0,0.4)] animate-pulse" />
              <span className="text-sm font-extrabold tracking-widest text-[#76b900] uppercase">NVIDIA NIM HUB</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(s => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-8 bg-[#76b900]"
                      : s < step
                        ? "w-2 bg-[#76b900]/40"
                        : "w-2 bg-neutral-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Wizard Content */}
        <div className="flex-1 min-h-0 flex flex-col justify-center">
          
          {/* Step 1: Terms Agreement */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#76b900]" />
                  개인정보 및 서비스 약관 동의
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  NVIDIA NIM 멀티모달 워크벤치를 안전하고 편리하게 이용하기 위해 약관을 확인하고 동의해 주세요.
                </p>
              </div>

              {/* Master Checkbox */}
              <div
                onClick={handleAllAgree}
                className="flex items-center gap-3 p-4 bg-[#76b900]/5 border border-[#76b900]/20 rounded-xl cursor-pointer hover:bg-[#76b900]/10 transition"
              >
                <input
                  type="checkbox"
                  checked={termsAccepted && privacyAccepted && keyNoticeAccepted && trackingAccepted}
                  onChange={() => {}}
                  className="w-4 h-4 accent-[#76b900] cursor-pointer"
                />
                <span className="text-xs font-extrabold text-white">전체 약관에 동의합니다. (선택 동의 포함)</span>
              </div>

              {/* Accordion list of terms */}
              <div className="space-y-3">
                {/* Term 1 */}
                <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-950/40">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#76b900] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">서비스 이용약관 동의 (필수)</span>
                    </label>
                    <button
                      onClick={() => toggleExpand("terms")}
                      className="text-[10px] text-neutral-500 hover:text-white transition cursor-pointer"
                    >
                      {expandedSection === "terms" ? "접기" : "자세히"}
                    </button>
                  </div>
                  {expandedSection === "terms" && (
                    <p className="text-[10px] text-neutral-450 mt-2.5 leading-relaxed bg-[#0d0d0d] p-3 rounded-lg border border-neutral-850">
                      NVIDIA NIM UI 서비스 이용약관에 동의합니다. 이 서비스는 NVIDIA NIM API를 활용하여 다양한 인공지능 추론 모델을 테스트, 비교, 분석할 수 있는 테스트 아키텍처 환경을 제공합니다.
                    </p>
                  )}
                </div>

                {/* Term 2 */}
                <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-950/40">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#76b900] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">개인정보 수집 및 처리 동의 (필수)</span>
                    </label>
                    <button
                      onClick={() => toggleExpand("privacy")}
                      className="text-[10px] text-neutral-500 hover:text-white transition cursor-pointer"
                    >
                      {expandedSection === "privacy" ? "접기" : "자세히"}
                    </button>
                  </div>
                  {expandedSection === "privacy" && (
                    <p className="text-[10px] text-neutral-450 mt-2.5 leading-relaxed bg-[#0d0d0d] p-3 rounded-lg border border-neutral-850">
                      본 앱은 사용자 세션 상태 및 설정 저장을 위해 최소한의 이메일 및 UID 정보를 수집하며, 사용자가 직접 올린 임베딩 RAG 문서 데이터 및 대화 히스토리는 본인 인증 계정에 한해서만 안전하게 관리 및 조회될 수 있도록 Firestore 규칙으로 보호됩니다.
                    </p>
                  )}
                </div>

                {/* Term 3 */}
                <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-950/40">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyNoticeAccepted}
                        onChange={(e) => setKeyNoticeAccepted(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#76b900] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">NVIDIA API Key 보안 처리 수락 (필수)</span>
                    </label>
                    <button
                      onClick={() => toggleExpand("keyNotice")}
                      className="text-[10px] text-neutral-500 hover:text-white transition cursor-pointer"
                    >
                      {expandedSection === "keyNotice" ? "접기" : "자세히"}
                    </button>
                  </div>
                  {expandedSection === "keyNotice" && (
                    <p className="text-[10px] text-neutral-450 mt-2.5 leading-relaxed bg-[#0d0d0d] p-3 rounded-lg border border-neutral-850 font-mono">
                      경고: 입력하신 NVIDIA API Key(nvapi-...)는 오직 사용자의 지시에 따라 NVIDIA 추론 엔드포인트(integrate.api.nvidia.com)에 AI 요청을 직접 대행 송출하는 목적으로만 연동됩니다. 타 서버에 키를 유출하거나 전송하는 악성 스크립트는 포함되어 있지 않으며 브라우저 로컬 저장소 및 Firestore 사용자 세팅 정보 내에 비가시적으로 보관됩니다. 민감한 문서나 개인정보 파일을 RAG로 업로드할 때는 주의하십시오.
                    </p>
                  )}
                </div>

                {/* Term 4 */}
                <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-950/40">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trackingAccepted}
                        onChange={(e) => setTrackingAccepted(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#76b900] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">로컬 활동 로그 및 텔레메트리 보관 (선택)</span>
                    </label>
                    <button
                      onClick={() => toggleExpand("tracking")}
                      className="text-[10px] text-neutral-500 hover:text-white transition cursor-pointer"
                    >
                      {expandedSection === "tracking" ? "접기" : "자세히"}
                    </button>
                  </div>
                  {expandedSection === "tracking" && (
                    <p className="text-[10px] text-neutral-450 mt-2.5 leading-relaxed bg-[#0d0d0d] p-3 rounded-lg border border-neutral-850">
                      모델 비교 연구 및 디버깅을 돕기 위해, API 호출 시 측정된 지연 속도(TTFT), 초당 토큰 응답량(TPS) 및 비용 분석 지표 데이터를 로컬 브라우저에 로그 형태로 기록하는 활동 모니터링 옵션을 수락합니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Choose Mode */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-white">사용 목적을 알려주세요</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  모드에 따라 화면 구성이 최적화됩니다. 대시보드 진입 후 언제든 자유롭게 전환 가능합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* Use AI */}
                <div
                  onClick={() => setSelectedMode("general")}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] select-none hover:scale-[1.01] ${
                    selectedMode === "general"
                      ? "bg-[#76b900]/5 border-[#76b900] shadow-[0_0_20px_rgba(118,185,0,0.1)]"
                      : "bg-[#0b0b0b] border-neutral-850 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-[#76b900]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    {selectedMode === "general" && (
                      <span className="text-[9px] font-bold text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30 px-2 py-0.5 rounded uppercase">Selected</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-white">일반 사용자 모드 (Use AI)</h3>
                    <p className="text-[10px] text-neutral-450 mt-2.5 leading-relaxed">
                      복잡한 AI 모델 사양 대신 빠름, 균형, 정확함 등 목적 중심의 프리셋으로 스마트한 채팅, RAG 문서 질문, 영상 분석, 비디오/이미지 생성을 즉시 이용합니다.
                    </p>
                  </div>
                </div>

                {/* Build with NIM */}
                <div
                  onClick={() => setSelectedMode("developer")}
                  className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] select-none hover:scale-[1.01] ${
                    selectedMode === "developer"
                      ? "bg-[#76b900]/5 border-[#76b900] shadow-[0_0_20px_rgba(118,185,0,0.1)]"
                      : "bg-[#0b0b0b] border-neutral-850 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-[#76b900]">
                      <Cpu className="w-5 h-5" />
                    </div>
                    {selectedMode === "developer" && (
                      <span className="text-[9px] font-bold text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30 px-2 py-0.5 rounded uppercase">Selected</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-white">개발자 모드 (Build with NIM)</h3>
                    <p className="text-[10px] text-neutral-450 mt-2.5 leading-relaxed">
                      77개 NIM에 대한 스펙 탐색(Model Registry), 실시간 성능 메트릭 벤치마킹 랩, 호출 API 로그 감시(Inspector), 로컬 Docker 배포 툴킷을 완비한 개발 최적화 모드입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Setup (Custom for Mode) */}
          {step === 3 && (
            <div className="space-y-6">
              {selectedMode === "general" ? (
                // Use AI setup
                <>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-[#76b900]" />
                      NVIDIA API Key 연결
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1">
                      실제 응답을 처리하려면 NGC 개발자 API Key가 필요합니다. 없더라도 임시 데모 모드 체험이 가능합니다.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* API Key Inputs */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="password"
                          placeholder="nvapi-..."
                          value={inputKey}
                          onChange={(e) => setInputKey(e.target.value)}
                          className="w-full bg-[#070707] border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#76b900]/50 outline-none transition"
                        />
                      </div>
                      <button
                        onClick={handleTestKey}
                        disabled={isTestingKey || !inputKey.trim()}
                        className="px-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                      >
                        {isTestingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        연결 테스트
                      </button>
                    </div>

                    {keyTestStatus === "success" && (
                      <p className="text-[10px] text-green-400 font-semibold">{keyTestMessage}</p>
                    )}
                    {keyTestStatus === "failed" && (
                      <p className="text-[10px] text-red-400 font-semibold">인증 실패: {keyTestMessage}</p>
                    )}

                    {/* Presets picker */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">AI 모델 프리셋 설정</span>
                      <div className="grid grid-cols-5 gap-2">
                        {presets.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setActivePreset(p.id)}
                            className={`p-2 rounded-lg border text-[10px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                              activePreset === p.id
                                ? "bg-[#76b900] text-black border-[#76b900]"
                                : "bg-[#0b0b0b] border-neutral-850 text-neutral-450 hover:text-white"
                            }`}
                          >
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="p-3.5 bg-[#0b0b0b] border border-neutral-850 rounded-xl">
                        <div className="flex items-center justify-between text-[9px] font-bold">
                          <span className="text-white">프리셋 적합도 및 모델 매핑</span>
                          <span className="text-neutral-500 font-mono text-[8px]">{presets.find(p => p.id === activePreset)?.model}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                          {presets.find(p => p.id === activePreset)?.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Developer Mode setup: Optional API Key
                <>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-[#76b900]" />
                      NVIDIA API Key 입력 (선택)
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1">
                      NVIDIA API Key를 입력하여 실시간 성능 벤치마킹을 실행하세요. 나중에 설정 패널에서 언제든 입력 및 수정할 수 있습니다.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="nvapi-... (생략 가능)"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        className="w-full bg-[#070707] border border-neutral-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#76b900]/50 outline-none transition"
                      />
                      <button
                        onClick={handleTestKey}
                        disabled={isTestingKey || !inputKey.trim()}
                        className="px-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                      >
                        {isTestingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        연결 테스트
                      </button>
                    </div>

                    {keyTestStatus === "success" && (
                      <p className="text-[10px] text-green-400 font-semibold">{keyTestMessage}</p>
                    )}
                    {keyTestStatus === "failed" && (
                      <p className="text-[10px] text-red-400 font-semibold">인증 실패: {keyTestMessage}</p>
                    )}

                    <div className="p-4 bg-[#0a0a0a] border border-neutral-900 rounded-2xl flex items-start gap-3 mt-4">
                      <div className="p-2 rounded-xl bg-neutral-950 text-[#76b900] border border-neutral-850">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">NIM 미션 컨트롤 활성화</h4>
                        <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                          진입 즉시 Model Registry 및 Compare Lab 등의 개발 최적화 메뉴를 이용하실 수 있습니다. 로컬 컨테이너 배포 스크립트 작성에 최적화된 도구를 확인하세요.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Finished & Instructions Guide */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#76b900]/10 border border-[#76b900]/30 rounded-2xl flex items-center justify-center text-[#76b900] mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white">모든 준비가 완료되었습니다!</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  NVIDIA NIM 플레이그라운드 워크스페이스에 진입할 준비가 끝났습니다.
                </p>
              </div>

              <div className="p-5 bg-[#0b0b0b] border border-neutral-850 rounded-2xl space-y-4">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">핵심 기능 및 활용 요약</span>
                
                {selectedMode === "general" ? (
                  // General Use Guide
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[#76b900] text-[10px] font-bold shrink-0">1</div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white">AI 대화 및 분석</h4>
                        <p className="text-[9px] text-neutral-450 leading-relaxed mt-0.5">선택한 성능 프리셋으로 막힘없이 대화하고 아이디어를 생산합니다.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[#76b900] text-[10px] font-bold shrink-0">2</div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white">문서 검색 (RAG)</h4>
                        <p className="text-[9px] text-neutral-450 leading-relaxed mt-0.5">PDF나 텍스트 문서를 연동해 문서 기반의 인용 출처가 달린 정밀 답변을 확인합니다.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[#76b900] text-[10px] font-bold shrink-0">3</div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white">음성/영상 멀티모달 허브</h4>
                        <p className="text-[9px] text-neutral-450 leading-relaxed mt-0.5">오디오 TTS/ASR 녹음 및 비디오 편집실 기능을 활용해 미디어를 최적화합니다.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center text-[#76b900] text-[10px] font-bold shrink-0">4</div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white">내 작업함 갤러리</h4>
                        <p className="text-[9px] text-neutral-450 leading-relaxed mt-0.5">언제든 클릭 한 번으로 대화 스냅샷을 저장하고 마크다운 형식으로 다운로드합니다.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Developer Mode Guide
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[9px] text-neutral-400">
                    <div className="flex gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#76b900] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-bold block mb-0.5">Model Registry</strong>
                        77개 NIM 카탈로그 및 상세 API 스펙, NGC 복제 명령어 툴킷을 확인합니다.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#76b900] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-bold block mb-0.5">Compare Lab</strong>
                         sequential 벤치마킹을 실행해 평균 TTFT, TPS,비용 요율을 시각화 분석합니다.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#76b900] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-bold block mb-0.5">Request Inspector</strong>
                        인터셉터 로거로 API 헤더 및 리스폰스 패킷의 스트리밍을 실시간 모니터링합니다.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#76b900] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-bold block mb-0.5">Docker Deployment</strong>
                         self-hosted NIM 구동용 Docker Compose 빌더 및 헬스 체크 기능을 실행합니다.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-5 border-t border-neutral-800 flex justify-between items-center shrink-0">
          <div>
            {step > 1 ? (
              <button
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 text-neutral-450 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                이전 단계
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!(termsAccepted && privacyAccepted && keyNoticeAccepted)}
                className="px-5 py-2.5 bg-[#76b900] hover:bg-[#66a000] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold rounded-xl transition duration-300 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                약관 동의 완료
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => {
                  if (selectedMode === "developer") {
                    // Developer mode bypass step 3, go to 4 directly
                    setStep(4);
                  } else {
                    setStep(3);
                  }
                }}
                className="px-5 py-2.5 bg-[#76b900] hover:bg-[#66a000] text-black font-extrabold rounded-xl transition duration-300 flex items-center gap-1 cursor-pointer"
              >
                모드 선택 완료
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2.5 bg-[#76b900] hover:bg-[#66a000] text-black font-extrabold rounded-xl transition duration-300 flex items-center gap-1 cursor-pointer"
              >
                설정 완료
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleFinishOnboarding}
                className="px-6 py-3 bg-[#76b900] hover:bg-[#66a000] text-black font-extrabold rounded-xl transition duration-300 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(118,185,0,0.3)] hover:scale-[1.01]"
              >
                워크스페이스 시작하기
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
