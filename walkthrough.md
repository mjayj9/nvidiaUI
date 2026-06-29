# Walkthrough - NIM Playground Model Filters, Logs & Gallery Integrations

NVIDIA NIM 플레이그라운드 전반의 모델 필터링 오류 해결, 프롬프트 대량 평가기 개선, 세션별 로그 추적, 보안 강화(API Key 마스킹), 내 작업함(갤러리) 저장기능 연동, 다국어 번역 및 원격 Git 업로드가 완료되었습니다.

---

## 1. 구현된 주요 변경 사항 (Key Implementations)

### 1.1 한국어 / 영어 다국어 번역 토글 추가 (Multi-language Support)
- **인터페이스 언어 선택 기능**:
  - `WorkspaceContext.tsx` 내에 `language` state (`"ko" | "en"`) 및 `setLanguage` 함수를 선언하고, localStorage(`nim_language`)를 통해 상태를 기억하도록 구현했습니다.
  - 화면 좌측 사이드바(`Sidebar.tsx`) 하단에 한국어(KO)와 영어(EN)를 자유롭게 토글할 수 있는 언어 선택 버튼을 추가했습니다.
  - 사이드바 네비게이션 탭 레이블("대시보드", "챗 플레이그라운드", "문서 질의" 등)과 "새 대화 시작", "로그아웃", 모드 스위치 텍스트 등이 선택한 언어에 맞춰 실시간으로 동적 변경됩니다.
  - 내 작업함(`SavedWorks.tsx`) 내부의 전체 검색창 플레이스홀더, 분류 필터 드롭다운, 정렬 단추, 상세 요약 헤더 및 버튼 텍스트 등을 다국어 대응 완료했습니다.

### 1.2 내 작업함 (Gallery) 연동 및 Rerun 라우팅 수정
- **Rerun 탭 이름 매핑 문제 해결**:
  - 기존에는 갤러리에 저장된 작업 종류(`compare`, `eval`, `speech`, `video`)가 실제 라우팅용 탭 명칭(`compare-lab`, `eval-set`, `speech-video`)과 불일치하여 "다시 실행 (Rerun)" 클릭 시 비어있는 탭으로 이동하거나 로딩에 실패하던 오류가 존재했습니다.
  - `SavedWorks.tsx` 내 `handleRerun` 함수에서 카테고리 형식을 검사하여 유효한 탭 경로로 자동 리다이렉트되도록 매핑 로직을 정교화했습니다.
  - 삭제 확인 대화상자(`confirm`) 및 상태 변경 토스트 알림을 사용자의 인터페이스 언어 설정에 맞춰 번역 표기합니다.

### 1.3 활동 감사 로그 (Activity Audit Logs) 복원 및 로컬 안전 로그 병합
- **로컬 보안 로그 통합**:
  - 로컬 테스트 환경이나 서빙 API가 비활성화된 경우에도 로그가 제대로 보관 및 조회되도록, `SafetyGuard.tsx`에서 생성하는 로컬 안전 검사 필터링 기록(`nim_local_safety_logs`)을 `ActivityLogs.tsx`가 로컬 활동 로그(`nim_activity_logs`)와 실시간으로 함께 파싱하여 통합 출력하게 만들었습니다.
  - 정렬 기준을 전체 시간순으로 재배치하여 사용자가 어떤 모델로 안전 검사 및 추론을 수행했는지 타임라인을 한눈에 확인할 수 있습니다.
  - 드롭다운 필터에서 "보안 경고만 (Safety Alerts Only)" 옵션을 선택할 경우 차단(Blocked)되거나 검사된 보안성 이벤트가 온전히 필터링됩니다.

### 1.4 Firebase Analytics 활성화 및 사용자 카운트 복구
- **액티브 유저 추적 활성화**:
  - `src/lib/firebase.ts`에 Firebase Analytics의 `getAnalytics` 및 `isSupported`를 도입하여, 브라우저 환경에서 SDK가 초기화되도록 로직을 추가했습니다.
  - 이로써, 실제 웹사이트에 접속한 2명의 사용자가 Firebase 콘솔 상에서 `0명`으로 집계되던 추적 누수 오류가 해결되었습니다.

### 1.5 텍스트 전용 모델 필터링 적용
- **대상 파일**: `TournamentArena.tsx` (모델 토너먼트 아레나), `CompareLab.tsx` (모델 비교 실험실), `EvalSet.tsx` (프롬프트 대량 평가기)
- **적용 사항**: `m.type === "TEXT"` 조건을 적용하여 이미지 생성, 비디오 판독, 임베딩, 오디오 및 안전 필터와 같은 비텍스트 멀티모달 모델들이 채팅 벤치마크에 노출되어 오작동 및 싱글 출력 오류를 유발하던 현상을 해결했습니다.

---

## 2. 검증 및 배포 결과 (Verification & Deployment Results)

### 2.1 TypeScript 컴파일 및 프로덕션 빌드 성공
Bypass 옵션과 함께 `npx tsc --noEmit`을 통한 전체 정적 검사 및 `npm run build` 번들 빌드를 수행하여 **오류 및 충돌 없음(0 error)** 상태를 최종 검증했습니다.

### 2.2 Git 원격 반영 완료
로컬 저장소 커밋 후 최종 원격 저장소(`https://github.com/mjayj9/nvidiaUI`) `main` 브랜치에 성공적으로 push 하였습니다.
```bash
To https://github.com/mjayj9/nvidiaUI.git
   8cfe72d..b32a019  main -> main
```
