# 🟢 NVIDIA NIM 멀티모달 워크벤치 (NVIDIA NIM Multimodal Workbench)

NVIDIA NIM 멀티모달 워크벤치는 NVIDIA Inference Microservices(NIM)를 기반으로 구축된 강력한 개발자 및 연구자용 AI 플레이그라운드이자 통합 콘솔입니다. 단일 대시보드에서 77개의 전용 AI 추론 모델을 손쉽게 탐색, 연동, 비교, 관리할 수 있도록 지원합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 통합 모델 레지스트리 및 대시보드
* **77개 NIM 모델 카탈로그**: LLM, VLM, 임베딩, 오디오/음성, 비디오, 세이프티 가드레일 등 다양한 도메인의 NIM 목록을 한눈에 파악할 수 있습니다.
* **Hosted & Self-hosted NIM 연동**: NVIDIA 복합 NGC 엔드포인트 뿐만 아니라 온프레미스(Self-hosted) 환경에 배포된 로컬 NIM 엔드포인트까지 연동하여 관리할 수 있습니다.

### 2. 고성능 개발자용 챗 콘솔 (Chat Area)
* **실시간 성능 텔레메트리**: Time To First Token (TTFT), Tokens Per Second (TPS), 전체 대기 시간(Latency), 토큰 소비량 및 비용 추정치를 실시간으로 시각화합니다.
* **Fork & Branch**: 대화 도중 특정 메시지 시점으로 대화를 복제(Fork)하여 새로운 시나리오로 분기하고 테스트할 수 있습니다.

### 3. 멀티모달 플레이그라운드 (Multimodal Hub)
* **문서 검색 (RAG)**: NVIDIA NIM 임베딩 및 검색 마이크로서비스를 연결해 로컬 PDF 파일을 업로드 및 색인하고 즉시 질문을 던질 수 있습니다.
* **비전 분석기 (Vision Analyzer)**: 이미지 입력과 프롬프트를 함께 전송해 VLM 모델(NeVA 등)을 테스트합니다.
* **이미지 & 비디오 생성기 (Image/Video Generator)**: Stable Diffusion 등의 NIM 이미지 모델을 활용해 고품질 미디어를 생성합니다.
* **오디오 & 음성 허브 (Speech Hub)**: TTS(Text-to-Speech), ASR(Automatic Speech Recognition), 목소리 복제(Voice Cloning) 기술을 직관적인 UI로 실험합니다.

### 4. 세이프티 가드레일 파이프라인 (Safety Guard)
* **NeMo Guardrails & Nemotron-3**: 입력 검증 정책(PII 마스킹, 부적절 언어 차단 등)과 메인 모델 응답, 그리고 출력 검증 정책까지 아우르는 3단계 콘텐츠 세이프티 검사를 투명하게 로깅하고 시각화합니다.

### 5. 코드 및 레시피 내보내기 (Code Export)
* **즉각적인 연동 코드 제공**: 현재 대화 내역 및 파라미터를 cURL, Python (Requests/LangChain/OpenAI SDK), Node.js 코드로 원클릭 변환하여 로컬 프로젝트에 붙여넣을 수 있습니다.

---

## 🛠️ 시작하기 (Quick Start)

### 필수 요구사항 (Prerequisites)
* **Node.js**: v18.0.0 이상 설치 필요
* **NVIDIA NGC API Key**: [NVIDIA Build](https://build.nvidia.com/)에서 발급받은 API 키가 필요합니다.

### 설치 및 로컬 실행 (Installation & Run)
1. **의존성 설치**:
   ```bash
   npm install
   ```

2. **환경 변수 구성**:
   `.env.local` 파일을 루트 폴더에 생성하고 필요한 설정을 작성합니다. (또는 앱 실행 후 설정 패널에서 API 키를 입력할 수 있습니다.)
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

3. **개발 서버 실행**:
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:5173`으로 접속합니다.

4. **프로덕션 빌드 및 배포**:
   ```bash
   # 빌드 수행
   npm run build

   # 프로덕션 서버 실행
   npm run start
   ```

---

## 🔒 보안 정책 (Security Rules)

데이터베이스로 Firebase Firestore를 사용합니다. 보안성 강화를 위해 다음 규칙을 적용하여 자신의 데이터에만 안전하게 접근할 수 있도록 차단되었습니다.
* **사용자 설정 (`/users`)**: 본인 ID(`userId`)로 인증된 유저만 API 키 및 엔드포인트 설정을 수정할 수 있습니다.
* **세션 및 대화 내역 (`/sessions`, `/chat_history`)**: 생성한 소유주만 조회가 가능합니다.

상세 보안 정책은 `firestore.rules` 파일에 정의되어 있습니다.

---

## 📄 라이선스 (License)

이 프로젝트는 NVIDIA AI 파트너십 가이드를 준수하며 자유롭게 실험 및 확장할 수 있는 오픈소스 라이선스를 따릅니다.
