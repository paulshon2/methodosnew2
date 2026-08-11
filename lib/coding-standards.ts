/**
 * MethodOS 질적코딩 통합 표준 프로토콜 (v48)
 * ─────────────────────────────────────────────────────────
 * 다음 표준 프로토콜을 코딩 메뉴/AI 변환기 전반에서 참조한다.
 *
 *  · INTEGRATED_PROTOCOL     — 20단계 통합 표준 프로토콜 (Project → Report)
 *  · EXECUTION_MODES         — Discovery · Codebook · Hybrid 3가지 실행모드
 *  · DATA_CLEANING_PROTOCOL  — 19단계 데이터 클린징 표준 프로토콜
 *  · CODEBOOK_FIELDS         — MethodOS AI Codebook 필드(23개)
 *  · CODEBOOK_TEMPLATES      — 즉시 로드 가능한 코드북 4개 유형(생성형AI/간호/학교폭력/공공서비스)
 *  · MODE_EASY               — 각 실행모드의 쉬운 설명·예시
 */

/* ============================================================
 * 1) 통합 표준 프로토콜 (20단계)
 *    ── 자료수집 → 데이터 정리 → 코딩 → 재코딩 → 범주화 → 테마 → 이론 → 보고
 * ============================================================ */
export type ProtocolStep = {
  step: number;
  section: string;      // 상위 구분
  substep: string;      // 세부단계
  action: string;       // 수행내용
  aiRole: string;       // AI 역할
  output: string;       // 산출물
};

export const INTEGRATED_PROTOCOL: ProtocolStep[] = [
  { step: 1, section: "Project", substep: "연구 프로젝트 생성", action: "연구제목·연구질문·목적·방법론 설정", aiRole: "프로젝트 초기화", output: "Project" },
  { step: 2, section: "Data Collection", substep: "데이터 수집", action: "인터뷰·관찰·문서·SNS·설문·영상·음성 자료 수집", aiRole: "파일 인식", output: "Raw Data" },
  { step: 3, section: "Data Preparation", substep: "데이터 정리", action: "폴더 구성·파일명 규칙·Case 생성", aiRole: "자동 분류", output: "Organized Data" },
  { step: 4, section: "Data Cleaning", substep: "데이터 클린징", action: "OCR·STT 보정, 인코딩, HTML 제거, 개인정보 제거, 중복 제거, 맞춤법, 문장분리", aiRole: "자동 정제", output: "Clean Data" },
  { step: 5, section: "Metadata", substep: "메타데이터 생성", action: "참여자번호·성별·연령·날짜·장소·자료유형", aiRole: "Attribute 생성", output: "Metadata" },
  { step: 6, section: "Familiarization", substep: "데이터 숙지", action: "반복 읽기·Memo 작성", aiRole: "AI 요약·Memo 제안", output: "Initial Memo" },
  { step: 7, section: "Meaning Unit", substep: "분석단위 결정", action: "단어·문장·문단·사건·인터뷰 전체", aiRole: "자동 분절", output: "Meaning Units" },
  { step: 8, section: "Execution Mode", substep: "실행모드 선택", action: "Discovery / Codebook / Hybrid 중 선택", aiRole: "분석모드 설정", output: "Analysis Mode" },
  { step: 9, section: "Coding Method", substep: "코딩기법 선택", action: "Descriptive·In Vivo·Process·Emotion 등 다중 선택", aiRole: "기법 적용", output: "Coding Strategy" },
  { step: 10, section: "First Cycle Coding", substep: "1차 코딩", action: "선택 방법으로 자료에 코드 적용", aiRole: "자동 코딩", output: "Initial Codes" },
  { step: 11, section: "Grammar Coding", substep: "문법적 코딩", action: "Attribute·Magnitude·Subcoding·Simultaneous", aiRole: "보조코딩", output: "Enhanced Codes" },
  { step: 12, section: "Elemental Coding", substep: "요소적 코딩", action: "Descriptive·In Vivo·Process·Initial", aiRole: "의미추출", output: "Basic Codes" },
  { step: 13, section: "Affective Coding", substep: "정서 코딩", action: "Emotion·Values·Evaluation·Versus", aiRole: "감정분석", output: "Emotional Codes" },
  { step: 14, section: "Literary Coding", substep: "언어·문학 코딩", action: "Narrative·Dramaturgical·Motif·Verbal Exchange", aiRole: "서사분석", output: "Narrative Codes" },
  { step: 15, section: "Exploratory Coding", substep: "탐색적 코딩", action: "Holistic·Provisional·Hypothesis", aiRole: "탐색분석", output: "Exploratory Codes" },
  { step: 16, section: "Procedural Coding", substep: "절차적 코딩", action: "Protocol·Domain·Causation·OCM", aiRole: "규칙기반 분석", output: "Procedural Codes" },
  { step: 17, section: "Themeing", substep: "주제화", action: "Themeing the Data", aiRole: "Theme 생성", output: "Themes" },
  { step: 18, section: "Second Cycle", substep: "재코딩", action: "Pattern·Focused·Axial·Theoretical·Elaborative·Longitudinal·Code Mapping", aiRole: "코드 통합", output: "Categories" },
  { step: 19, section: "Theory Building", substep: "이론화", action: "Category → Theme → Theory", aiRole: "이론 제안", output: "Theory" },
  { step: 20, section: "Reporting", substep: "보고서 생성", action: "표·그래프·네트워크·결과기술", aiRole: "자동 보고서", output: "Final Report" },
];

/* ============================================================
 * 2) 실행모드 — Discovery · Codebook · Hybrid
 * ============================================================ */
export type ExecutionMode = "discovery" | "codebook" | "hybrid";

export const EXECUTION_MODES: {
  id: ExecutionMode;
  label: string;       // KO
  labelEn: string;     // EN
  concept: string;     // 개념(쉬운 한 문장)
  start: string;       // 시작점
  codebookState: string;
  aiRole: string;
  humanRole: string;
  iteration: string;
  fitResearch: string;
  output: string;
  bestFor: string[];
}[] = [
  {
    id: "discovery",
    label: "Discovery 모드",
    labelEn: "Discovery Mode",
    concept: "데이터를 읽으며 AI가 새로운 코드를 계속 만들어냅니다.",
    start: "원시 데이터(코드북 없음)",
    codebookState: "AI가 계속 생성 · Dynamic Codebook",
    aiRole: "새로운 코드 발견 · 명명 · 정의 제안",
    humanRole: "코드 승인·수정·병합",
    iteration: "매우 높음",
    fitResearch: "QL-008(Grounded Theory), 현상학, 탐색적 연구",
    output: "Dynamic Codebook",
    bestFor: [
      "선행 코드북이 없는 새로운 주제",
      "인터뷰 자유응답 · 오픈 서베이",
      "이론적 감수성을 기르는 초기 분석",
    ],
  },
  {
    id: "codebook",
    label: "Codebook 모드",
    labelEn: "Codebook Mode",
    concept: "미리 정의한 코드북(코드+정의+포함/제외)으로 자동 분류합니다.",
    start: "기존 코드북(승인 완료)",
    codebookState: "고정 · 새 코드 생성 없음",
    aiRole: "코드북 코드 중 하나로 자동 분류",
    humanRole: "코드북 작성·검증·조율",
    iteration: "낮음",
    fitResearch: "TX-002(Content Analysis), 평가연구, 정책분석",
    output: "Classification Result",
    bestFor: [
      "선행연구 코드북을 그대로 적용해야 하는 재현연구",
      "여러 코더 간 신뢰도(IRR)가 중요한 대규모 자료",
      "규칙·표준·매뉴얼이 이미 존재하는 조직/정책 자료",
    ],
  },
  {
    id: "hybrid",
    label: "Hybrid 모드",
    labelEn: "Hybrid Mode",
    concept: "기존 코드북으로 분류하면서, 필요할 때 AI가 신규 코드를 제안합니다.",
    start: "기존 코드북 + 원시 데이터",
    codebookState: "지속적 확장 · Adaptive Codebook",
    aiRole: "코드북 분류 + 필요 시 신규 코드 제안",
    humanRole: "신규 코드 승인·거절·병합",
    iteration: "중간~높음",
    fitResearch: "대부분의 현대 질적연구",
    output: "Adaptive Codebook",
    bestFor: [
      "선행 코드북은 있지만 새로운 현상이 나타날 수 있는 자료",
      "종단·다사례 연구에서 코드북을 점진적으로 확장",
      "혼합연구(질적·양적) 통합 분석",
    ],
  },
];

/* Discovery/Codebook/Hybrid — 초보자용 쉬운 설명·구체 예시 */
export const MODE_EASY: Record<ExecutionMode, {
  oneLine: string;
  analogy: string;       // 비유
  scenario: string;      // 시나리오 한 문단
  worked: {              // 한 문장 → 코드 흐름 예시
    interview: string;
    codebookBefore: string;
    aiAction: string;
    codebookAfter: string;
  };
}> = {
  discovery: {
    oneLine: "코드북 없이 시작 → AI가 자료를 읽으며 코드를 발견하고 이름 붙임.",
    analogy: "빈 도화지에 그림을 그리는 것과 같습니다. AI가 자료의 특징을 스케치하면 연구자가 색을 정합니다.",
    scenario: "AI 예술가에 관한 대학생 인터뷰 데이터가 있고, 아직 선행연구 코드가 없다고 가정합니다. Discovery 모드에서 AI는 '창작적 대체감(Creative Replacement)', '정체성 상실(Identity Loss)', '창작 불안(Creative Anxiety)' 같은 새로운 코드를 계속 만들어냅니다. 연구자는 승인·수정·병합하며 자료 안에서 발견한 이론적 개념을 축적합니다.",
    worked: {
      interview: "\"AI가 제 그림을 대신 그리니까 창작한다는 느낌이 안 들어요.\"",
      codebookBefore: "(비어 있음)",
      aiAction: "AI가 \"Creative Replacement\", \"Identity Loss\", \"Psychological Displacement\" 3개 코드를 신규 생성",
      codebookAfter: "Creative Replacement / Identity Loss / Psychological Displacement — 정의·예시·포함기준 자동 초안",
    },
  },
  codebook: {
    oneLine: "미리 만든 코드북 → AI는 그 안에서만 분류(새 코드 생성 안 함).",
    analogy: "숫자별 색이 정해진 컬러링북과 같습니다. AI는 자료가 어느 번호(코드)에 해당하는지만 결정합니다.",
    scenario: "생성형 AI 인식 연구에서 Creativity·Efficiency·Employment·Ethics·Copyright 5개 코드로 이미 검증된 코드북이 있습니다. Codebook 모드에서 AI는 새 코드를 만들지 않고, 각 문장을 5개 코드 중 하나(또는 다중)로만 분류합니다. 여러 코더 간 재현성이 중요할 때 사용합니다.",
    worked: {
      interview: "\"AI 덕분에 보고서를 5분 만에 만들었는데, 앞으로 디자이너는 줄어들 것 같아요.\"",
      codebookBefore: "Creativity / Efficiency / Employment / Ethics / Copyright",
      aiAction: "\"보고서 5분\" → Efficiency, \"디자이너 감소\" → Employment 로 분류. 새로운 코드는 만들지 않음.",
      codebookAfter: "동일(코드북 불변) — Efficiency 카운트 +1, Employment 카운트 +1",
    },
  },
  hybrid: {
    oneLine: "코드북으로 분류하다가, 안 들어맞으면 AI가 신규 코드를 제안하고 사람이 승인하면 코드북이 확장됩니다.",
    analogy: "메뉴판이 있는 카페 같지만 손님(자료)이 원하는 게 없으면 요리사(AI)가 새 메뉴를 제안하고 매니저(연구자)가 승인하는 상황입니다.",
    scenario: "생성형 AI 교육 연구에서 Learning·Creativity·Efficiency·Ethics 4개 코드로 시작합니다. 어떤 문장에서 \"스스로 생각하는 능력이 떨어진다\"는 응답이 나오면 기존 코드로 설명이 어렵고, AI가 \"Critical Thinking Decline\"이라는 새 코드를 제안합니다. 연구자가 승인하면 코드북이 5개로 확장되고, 이후 유사 문장도 같은 코드로 분류됩니다.",
    worked: {
      interview: "\"AI 때문에 숙제는 빨라졌지만, 스스로 생각하는 능력이 떨어지는 것 같아요.\"",
      codebookBefore: "Learning / Creativity / Efficiency / Ethics",
      aiAction: "\"숙제 빨라짐\" → Efficiency 분류. \"생각하는 능력 감소\"는 기존 코드로 설명 어려움 → AI가 신규 코드 \"Critical Thinking Decline\" 제안",
      codebookAfter: "Learning / Creativity / Efficiency / Ethics / Critical Thinking Decline(신규·연구자 승인 필요)",
    },
  },
};

/* ============================================================
 * 3) 데이터 클린징(Data Cleaning) 표준 프로토콜 — 19단계
 * ============================================================ */
export type CleaningStep = {
  id: string;
  label: string;        // KO
  labelEn: string;
  what: string;         // 수행내용
  why: string;          // 왜 필요한가
  autoLevel: "auto" | "auto+review" | "manual";
};

export const DATA_CLEANING_PROTOCOL: CleaningStep[] = [
  { id: "encoding", label: "인코딩 통일", labelEn: "Encoding", what: "모든 텍스트를 UTF-8로 통일합니다.", why: "깨진 글자·시스템 간 호환문제 방지.", autoLevel: "auto" },
  { id: "lang_detect", label: "언어 자동 감지", labelEn: "Language Detection", what: "한국어·영어 등 주요 언어를 자동 감지해 메타로 표시합니다.", why: "다국어 자료의 클린징·번역·코딩 경로 분기.", autoLevel: "auto" },
  { id: "translation", label: "다국어 번역 표기", labelEn: "Translation", what: "비한국어 문장에 [EN]/[KO] 등 언어 태그를 달아 분석 경로를 명확히 합니다.", why: "혼용 코퍼스에서 의미 단위를 안정적으로 유지.", autoLevel: "auto+review" },
  { id: "ocr", label: "OCR 오류 수정", labelEn: "OCR Correction", what: "스캔 문서에서 잘못 인식된 글자를 수정합니다.", why: "종이 자료(설문·기록물)의 오탈자 방지.", autoLevel: "auto+review" },
  { id: "stt", label: "STT 오류 수정", labelEn: "STT Correction", what: "음성 전사 자동 오류(음성→텍스트)를 수정합니다.", why: "인터뷰 전사 정확도 확보.", autoLevel: "auto+review" },
  { id: "html", label: "HTML 태그 제거", labelEn: "HTML Removal", what: "<p>, <div> 등 태그를 삭제합니다.", why: "웹 크롤링·SNS 원본에서 노이즈 제거.", autoLevel: "auto" },
  { id: "markdown", label: "Markdown 제거", labelEn: "Markdown Removal", what: "**bold**, # header 등 기호를 정리합니다.", why: "코딩 단위 텍스트만 남기기 위함.", autoLevel: "auto" },
  { id: "noise_filter", label: "노이즈·채움말 제거", labelEn: "Noise Filtering", what: "의미 없는 감탄사·채움말(음, 어, uh, um 등)을 제거합니다.", why: "코딩 단위의 신호 대 잡음비 향상.", autoLevel: "auto" },
  { id: "toxic", label: "욕설·비속어 식별", labelEn: "Toxic Filter", what: "욕설·비속어를 [독성표현]으로 표시하거나 마스킹합니다.", why: "윤리 검토·코더 보호·분석 단위 안정화.", autoLevel: "auto+review" },
  { id: "emoji", label: "Emoji 처리", labelEn: "Emoji Handling", what: "이모지를 감정 태그로 치환하거나 제거합니다.", why: "감정 코딩에서 참고 정보로 활용 또는 노이즈 제거.", autoLevel: "auto+review" },
  { id: "url", label: "URL 제거", labelEn: "URL Removal", what: "http:// 로 시작하는 링크를 [URL]로 치환하거나 삭제합니다.", why: "개인정보 유출·노이즈 방지.", autoLevel: "auto" },
  { id: "email", label: "Email 익명화", labelEn: "Email Anonymization", what: "이메일 주소를 [이메일]로 치환합니다.", why: "개인정보 보호(비식별화).", autoLevel: "auto" },
  { id: "phone", label: "전화번호 익명화", labelEn: "Phone Anonymization", what: "전화번호를 [전화]로 치환합니다.", why: "개인정보 보호(비식별화).", autoLevel: "auto" },
  { id: "ner", label: "개체명 인식", labelEn: "Named Entity Recognition", what: "사람·기관·장소 패턴을 인식해 태그합니다.", why: "속성 코딩·사례 비교의 메타데이터 확보.", autoLevel: "auto+review" },
  { id: "pii", label: "개인정보 비식별화", labelEn: "PII Removal", what: "주민번호·이름 등을 [P##]로 치환합니다.", why: "IRB·개인정보보호법 준수.", autoLevel: "auto+review" },
  { id: "coref", label: "대명사 지시 연결", labelEn: "Coreference Resolution", what: "그/그녀/그것 등 대명사가 가리키는 대상을 문맥상 연결 표기합니다.", why: "화자·행위 주체 혼동 감소.", autoLevel: "auto+review" },
  { id: "lemma", label: "표제어 변환", labelEn: "Lemmatization", what: "활용형·복수형을 표제어에 가깝게 정규화합니다.", why: "동일 의미의 코드 분산 방지.", autoLevel: "auto" },
  { id: "pos", label: "품사 분석", labelEn: "POS Tagging", what: "명사·동사 중심 키워드를 추출해 코딩 단서를 남깁니다.", why: "서술·프로세스 코딩의 단서 강화.", autoLevel: "auto" },
  { id: "dedup_exact", label: "중복 제거(완전)", labelEn: "Exact Deduplication", what: "완전히 동일한 행/문장을 제거합니다.", why: "SNS·설문 자유응답의 스팸/봇 응답 제거.", autoLevel: "auto" },
  { id: "dedup_semantic", label: "의미 중복 통합", labelEn: "Semantic Duplicate Detection", what: "의미가 같은 문장을 통합·정리합니다.", why: "복붙·동의 반복 응답 정리.", autoLevel: "auto+review" },
  { id: "dedup_near", label: "유사문장 제거", labelEn: "Near Deduplication", what: "거의 같은 문장(유사도 임계값 이상)을 정리합니다.", why: "복붙 응답·중복 게시글 정리.", autoLevel: "auto+review" },
  { id: "spelling", label: "맞춤법 교정", labelEn: "Spelling Correction", what: "일반적인 오탈자를 자동 교정합니다.", why: "표기 편차로 인한 코드 분산 방지.", autoLevel: "auto+review" },
  { id: "spacing", label: "띄어쓰기 교정", labelEn: "Spacing", what: "붙어있는 문장을 자연스러운 띄어쓰기로 정리.", why: "SNS 축약형·구어체 정리.", autoLevel: "auto+review" },
  { id: "sentence_split", label: "문장 자동 분리", labelEn: "Sentence Boundary Detection", what: "문장 경계를 자동 인식해 한 줄에 한 문장이 오도록 분리.", why: "분석단위=문장 코딩의 기본.", autoLevel: "auto" },
  { id: "speaker", label: "화자 자동 구분", labelEn: "Speaker Diarization", what: "대화 자료에서 화자별로 발화를 분리합니다.", why: "인터뷰·초점집단의 화자 태깅.", autoLevel: "auto+review" },
  { id: "case_gen", label: "Case 생성", labelEn: "Case Generation", what: "참여자·인터뷰별로 별도 Case로 분리합니다.", why: "사례간 비교 분석의 기본.", autoLevel: "auto" },
  { id: "mu_gen", label: "Meaning Unit 생성", labelEn: "Meaning Unit Generation", what: "의미 단위(하나의 완결된 생각)로 자료를 잘라냅니다.", why: "현상학·해석적 분석의 기본 단위.", autoLevel: "auto+review" },
  { id: "meta_gen", label: "Metadata 생성", labelEn: "Metadata Generation", what: "참여자번호·성별·연령·수집일 등 메타정보를 자동 부여.", why: "속성 코딩·사례간 비교의 기반.", autoLevel: "auto" },
];

/* ============================================================
 * 4) MethodOS AI Codebook — 필드 정의(23개)
 * ============================================================ */
export type CodebookEntry = {
  id: string;                    // Code ID (예: C001)
  name: string;                  // Code Name
  definition: string;            // Definition — 1-2 문장
  purpose?: string;              // Purpose — 이 코드로 무엇을 파악하는가
  inclusion: string;             // Inclusion Criteria — 코딩해야 할 조건
  exclusion: string;             // Exclusion Criteria — 코딩하지 않는 조건
  decisionRules?: string;        // Decision Rules — 판단 규칙(전문가용)
  codingUnit?: string;           // Coding Unit (예: sentence)
  recordingUnit?: string;        // Recording Unit
  contextUnit?: string;          // Context Unit
  keywords: string[];            // Keywords
  synonyms?: string[];           // Synonyms
  parent?: string;               // Parent Category
  children?: string[];           // Child Categories
  example: string;               // Example — 대표 예문
  counterExample?: string;       // Counter Example
  borderline?: string;           // Borderline Cases
  priority?: string;             // Priority Rule
  aiEmbedding?: number[];        // 의미벡터(옵션)
  confidenceThreshold?: number;  // 신뢰도 임계값(0-1)
  version: string;               // v1.0 등
  createdBy: "Researcher" | "AI";
  status: "Draft" | "Approved" | "Deprecated";
  memo?: string;
  /** v54 — 1차/2차 사이클·방법 연동 */
  cycle?: 1 | 2;
  methodId?: string;
  applicationCriteria?: string;
  notes?: string;
  sourceContext?: string;
  linkage?: string;                 // 2차: 1차 코드 연결
  validation?: string;              // 2차: 검증 기준
  theoreticalAlignment?: string;    // 2차: 이론적 정렬
};

export const CODEBOOK_FIELDS: { key: keyof CodebookEntry; label: string; help: string; required?: boolean }[] = [
  { key: "id", label: "Code ID", help: "코드 고유번호(예: C001)", required: true },
  { key: "name", label: "Code Name", help: "짧고 분석 가능한 명사/명사구", required: true },
  { key: "definition", label: "Definition · 정의", help: "언제 이 코드를 쓰는가(1–2문장)", required: true },
  { key: "purpose", label: "Purpose · 목적", help: "이 코드로 무엇을 파악하는가" },
  { key: "inclusion", label: "Inclusion · 포함기준", help: "코드를 적용해야 할 조건·전형 표현", required: true },
  { key: "exclusion", label: "Exclusion · 제외기준", help: "코드를 적용하지 않아야 할 조건·경계 사례", required: true },
  { key: "decisionRules", label: "Decision Rules · 판단규칙", help: "충돌 시 어느 코드를 우선하는가" },
  { key: "codingUnit", label: "Coding Unit · 코딩단위", help: "sentence / paragraph / episode" },
  { key: "recordingUnit", label: "Recording Unit · 기록단위", help: "실제 기록할 최소 조각" },
  { key: "contextUnit", label: "Context Unit · 문맥단위", help: "판단에 참조할 앞뒤 맥락" },
  { key: "keywords", label: "Keywords · 핵심키워드", help: "쉼표로 구분한 핵심 어휘", required: true },
  { key: "synonyms", label: "Synonyms · 동의어", help: "의미가 같은 다른 표현" },
  { key: "parent", label: "Parent Category · 상위범주", help: "상위 개념" },
  { key: "children", label: "Child Categories · 하위범주", help: "쉼표로 구분한 하위 개념" },
  { key: "example", label: "Example · 적용예", help: "대표 예문(1개 이상)", required: true },
  { key: "counterExample", label: "Counter Example · 반례", help: "혼동되기 쉽지만 이 코드는 아닌 예" },
  { key: "borderline", label: "Borderline · 애매한 사례", help: "판단 경계에 있는 사례" },
  { key: "priority", label: "Priority Rule · 우선순위", help: "다른 코드와 충돌 시 어떤 것을 우선" },
  { key: "confidenceThreshold", label: "Confidence Threshold · 신뢰도 임계값", help: "자동분류 최소 신뢰도(0-1)" },
  { key: "version", label: "Version · 버전", help: "v1.0, v1.1 …", required: true },
  { key: "createdBy", label: "Created By · 생성자", help: "Researcher / AI", required: true },
  { key: "status", label: "Status · 상태", help: "Draft / Approved / Deprecated", required: true },
  { key: "memo", label: "Memo · 참고사항", help: "코더 참고 메모" },
];

/* ============================================================
 * 5) 코드북 템플릿 — 즉시 로드 가능한 4개 유형
 *    (근거: 요약표의 예시 5개 중 대표적인 것들)
 * ============================================================ */
export type CodebookTemplate = {
  id: string;
  label: string;
  subject: string;      // 연구주제
  scenario: string;     // 어떤 자료에 적합한가
  mode: ExecutionMode;  // 이 코드북의 권장 실행모드
  entries: CodebookEntry[];
};

export const CODEBOOK_TEMPLATES: CodebookTemplate[] = [
  {
    id: "genai_perception",
    label: "생성형 AI 인식 연구(대학생)",
    subject: "생성형 AI에 대한 대학생의 인식",
    scenario: "AI 인식 조사·인터뷰·SNS 텍스트에서 사용. 승인된 5개 코드로 자동 분류(Codebook 모드).",
    mode: "codebook",
    entries: [
      {
        id: "C001", name: "Creativity",
        definition: "AI의 창의성 또는 창작 능력에 관한 진술.",
        inclusion: "그림·음악·글쓰기·디자인·창작 언급",
        exclusion: "단순 생산성 향상(→ Efficiency), 저작권(→ Copyright)",
        keywords: ["창의성", "그림", "디자인", "예술", "창작"],
        example: "\"AI가 그림을 정말 잘 그린다.\"",
        counterExample: "\"AI 덕분에 일이 빨라졌다.\" → Efficiency",
        borderline: "\"AI가 새로운 아이디어를 준다\" → 창의적 활용이면 Creativity",
        parent: "AI Perception",
        children: ["Image", "Music", "Writing", "Design"],
        version: "v1.0", createdBy: "Researcher", status: "Approved",
      },
      {
        id: "C002", name: "Efficiency",
        definition: "AI가 업무를 더 빠르게 하거나 생산성을 높였다는 진술.",
        inclusion: "시간절약·자동화·빠르다·생산성·효율·도움",
        exclusion: "창의성 언급(→ Creativity), 일자리 감소(→ Employment)",
        keywords: ["효율", "빠르다", "자동", "시간절약", "생산성"],
        example: "\"보고서를 5분 만에 만들었다.\"",
        counterExample: "\"AI가 예술을 만든다\" → Creativity",
        parent: "AI Benefit",
        version: "v1.0", createdBy: "Researcher", status: "Approved",
      },
      {
        id: "C003", name: "Employment",
        definition: "AI로 인해 현재 또는 미래의 일자리에 대해 불안이나 위협을 느끼는 진술.",
        inclusion: "실업·대체·직업 상실·취업 어려움·고용시장 악화",
        exclusion: "단순 업무 효율(→ Efficiency), 임금 불만(→ 별도)",
        decisionRules: "직업 감소 의미가 있으면 Employment > Efficiency 우선",
        keywords: ["일자리", "해고", "대체", "실업", "고용", "취업"],
        example: "\"AI 때문에 디자이너가 필요 없어질 것 같다.\"",
        counterExample: "\"AI 덕분에 일이 빨라졌다.\" → Efficiency",
        borderline: "\"AI가 일을 대신해준다.\" → 감소 뉘앙스면 Employment, 아니면 Efficiency",
        parent: "AI Risk",
        children: ["Current Job Loss", "Future Employment Anxiety", "Automation Fear"],
        priority: "Employment > Efficiency",
        version: "v1.0", createdBy: "Researcher", status: "Approved",
      },
      {
        id: "C004", name: "Ethics",
        definition: "AI의 윤리적 문제(편향·차별·공정성·책임)를 언급한 진술.",
        inclusion: "편향·차별·공정성·책임·도덕성·윤리·신뢰성",
        exclusion: "저작권(→ Copyright), 성능(→ Performance)",
        keywords: ["윤리", "편향", "공정", "차별", "책임"],
        example: "\"AI는 편향된 답을 준다.\"",
        counterExample: "\"AI가 화가의 그림을 무단으로 학습했다.\" → Copyright",
        borderline: "\"AI가 위험하다\" → 윤리 이유면 Ethics, 보안 이유면 Security",
        parent: "AI Risk",
        version: "v1.0", createdBy: "Researcher", status: "Approved",
      },
      {
        id: "C005", name: "Copyright",
        definition: "저작권 침해 또는 무단학습에 대한 진술.",
        inclusion: "표절·저작권·무단학습·원작자·라이선스",
        exclusion: "일반 윤리 언급(→ Ethics)",
        keywords: ["저작권", "표절", "무단학습", "원작자", "라이선스"],
        example: "\"화가들의 그림을 무단으로 학습했다.\"",
        parent: "AI Risk",
        children: ["Image Copyright", "Text Copyright", "Music Copyright"],
        version: "v1.0", createdBy: "Researcher", status: "Approved",
      },
    ],
  },
  {
    id: "nursing_experience",
    label: "병원 간호 경험 연구(신규 간호사)",
    subject: "신규 간호사의 직무 경험",
    scenario: "신규 간호사 인터뷰. 5개 표준 코드로 분류(Codebook 모드).",
    mode: "codebook",
    entries: [
      { id: "N001", name: "Stress", definition: "긴장·피곤·압박 등 스트레스 경험 진술.", inclusion: "긴장·피곤·압박·눈치", exclusion: "신체 질환", keywords: ["스트레스", "눈치", "긴장", "피곤"], example: "\"선배 눈치가 너무 보여서 힘들어요.\"", parent: "직무 경험", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "N002", name: "Burnout", definition: "지속적 소진 상태(퇴사 욕구 포함).", inclusion: "그만두고 싶다·번아웃·소진", exclusion: "일시적 피곤(→ Stress)", keywords: ["소진", "그만두고 싶다", "번아웃"], example: "\"퇴사하고 싶다는 생각이 듭니다.\"", counterExample: "\"오늘은 좀 피곤하네요.\" → Stress", parent: "직무 경험", priority: "Burnout > Stress", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "N003", name: "Patient Care", definition: "환자 돌봄·처치 관련 진술.", inclusion: "간호·처치·투약", exclusion: "행정 업무", keywords: ["간호", "처치", "환자", "돌봄"], example: "\"환자 설명을 계속 해야 해서 정신없어요.\"", parent: "업무", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "N004", name: "Teamwork", definition: "의사·선배·동료와의 협업 관련 진술.", inclusion: "협업·팀·선배·의사", exclusion: "가족 관계", keywords: ["협업", "팀", "선배", "동료"], example: "\"선배 간호사와 함께 처치했어요.\"", parent: "관계", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "N005", name: "Communication", definition: "환자·보호자·동료와의 의사소통 관련 진술.", inclusion: "설명·전달·상담", exclusion: "감정 표현(→ Stress)", keywords: ["설명", "전달", "의사소통"], example: "\"환자 설명을 계속 해야 해요.\"", parent: "업무", version: "v1.0", createdBy: "Researcher", status: "Approved" },
    ],
  },
  {
    id: "school_violence",
    label: "학교폭력 피해 경험 연구",
    subject: "학교폭력 피해 청소년의 경험",
    scenario: "청소년 인터뷰·설문 자유응답. 6개 표준 코드로 분류(Codebook 모드).",
    mode: "codebook",
    entries: [
      { id: "V001", name: "Physical Violence", definition: "신체적 폭력을 당했다는 진술.", inclusion: "때림·밀침·상해", exclusion: "언어폭력(→ Verbal)", keywords: ["때리다", "폭행", "밀치다"], example: "\"복도에서 밀쳤어요.\"", parent: "폭력 유형", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "V002", name: "Verbal Violence", definition: "언어적 폭력·욕설·비방.", inclusion: "욕·비하·조롱", exclusion: "온라인 발언(→ Cyber)", keywords: ["욕", "비하", "조롱"], example: "\"수업 시간에 외모를 놀렸어요.\"", parent: "폭력 유형", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "V003", name: "Cyber Bullying", definition: "온라인/모바일에서의 폭력·따돌림.", inclusion: "단톡·SNS·댓글", exclusion: "오프라인 폭력", keywords: ["단톡", "SNS", "카톡", "댓글"], example: "\"단톡방에서 욕을 했다.\"", parent: "폭력 유형", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "V004", name: "Social Isolation", definition: "따돌림·무시로 인한 사회적 고립.", inclusion: "왕따·무시·배제", exclusion: "본인 선택 고립", keywords: ["따돌림", "무시", "혼자"], example: "\"학교에서는 아무도 말을 하지 않았다.\"", parent: "폭력 유형", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "V005", name: "Teacher Support", definition: "교사가 도움을 준 경험.", inclusion: "담임·상담교사", exclusion: "부모(→ Parent)", keywords: ["담임", "교사", "상담"], example: "\"담임선생님이 상담해 주셨다.\"", parent: "지원", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "V006", name: "Parent Support", definition: "부모가 도움을 준 경험.", inclusion: "부모·보호자", exclusion: "교사(→ Teacher)", keywords: ["부모", "엄마", "아빠"], example: "\"엄마가 학교에 와서 도와줬어요.\"", parent: "지원", version: "v1.0", createdBy: "Researcher", status: "Approved" },
    ],
  },
  {
    id: "public_service",
    label: "공공서비스 만족도 연구(주민센터)",
    subject: "주민센터 서비스 만족도",
    scenario: "설문 자유응답·인터뷰. 6개 표준 코드로 분류(Codebook 모드).",
    mode: "codebook",
    entries: [
      { id: "P001", name: "Accessibility", definition: "접근성(위치·시간·경로) 관련 진술.", inclusion: "위치·시간·이동", exclusion: "대기시간(→ Waiting)", keywords: ["위치", "가깝다", "멀다", "시간"], example: "\"집에서 가까워서 좋았어요.\"", parent: "서비스", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "P002", name: "Waiting Time", definition: "대기시간에 대한 진술.", inclusion: "기다림·대기·줄", exclusion: "접근성(→ Accessibility)", keywords: ["기다림", "대기", "줄"], example: "\"기다리는 시간이 너무 길었다.\"", parent: "서비스", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "P003", name: "Staff Kindness", definition: "직원의 태도·친절 관련 진술.", inclusion: "친절·불친절·태도", exclusion: "행정절차(→ Procedure)", keywords: ["친절", "직원", "태도"], example: "\"직원은 친절했다.\"", parent: "서비스", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "P004", name: "Administrative Procedure", definition: "행정 절차의 복잡도·간편성.", inclusion: "서류·절차·단계", exclusion: "친절도(→ Staff Kindness)", keywords: ["서류", "절차", "복잡"], example: "\"서류가 너무 많아요.\"", parent: "서비스", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "P005", name: "Complaint", definition: "민원 제기 관련 진술.", inclusion: "불만·민원", exclusion: "개선요청(→ Recommendation)", keywords: ["불만", "민원", "항의"], example: "\"민원을 넣었는데 답이 없어요.\"", parent: "피드백", version: "v1.0", createdBy: "Researcher", status: "Approved" },
      { id: "P006", name: "Recommendation", definition: "개선 요청·제안.", inclusion: "제안·개선·요청", exclusion: "불만(→ Complaint)", keywords: ["제안", "개선", "요청"], example: "\"인터넷 예약을 만들면 좋겠다.\"", parent: "피드백", version: "v1.0", createdBy: "Researcher", status: "Approved" },
    ],
  },
];

/* ============================================================
 * 6) 코드북 CSV/JSON 변환 유틸
 * ============================================================ */
export function codebookToCsv(entries: CodebookEntry[]): string {
  const header = [
    "id", "name", "definition", "inclusion", "exclusion",
    "keywords", "synonyms", "parent", "children",
    "example", "counterExample", "borderline",
    "priority", "confidenceThreshold", "version", "createdBy", "status",
  ];
  const esc = (v: any) => {
    const s = Array.isArray(v) ? v.join(" | ") : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = entries.map((e) => header.map((h) => esc((e as any)[h])).join(","));
  return "\ufeff" + [header.join(","), ...rows].join("\n");
}

export function codebookFromCsv(csv: string): CodebookEntry[] {
  const clean = csv.replace(/^\ufeff/, "").trim();
  const lines = clean.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const parseCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const items: CodebookEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: any = {};
    header.forEach((h, j) => { row[h] = cells[j] ?? ""; });
    if (!row.name && !row.id) continue;
    items.push({
      id: row.id || `C${String(i).padStart(3, "0")}`,
      name: row.name || "",
      definition: row.definition || "",
      inclusion: row.inclusion || "",
      exclusion: row.exclusion || "",
      keywords: (row.keywords || "").split(/\s*[|,]\s*/).filter(Boolean),
      synonyms: (row.synonyms || "").split(/\s*[|,]\s*/).filter(Boolean),
      parent: row.parent || "",
      children: (row.children || "").split(/\s*[|,]\s*/).filter(Boolean),
      example: row.example || "",
      counterExample: row.counterexample || row["counter example"] || "",
      borderline: row.borderline || "",
      priority: row.priority || "",
      confidenceThreshold: Number(row.confidencethreshold) || undefined,
      version: row.version || "v1.0",
      createdBy: (row.createdby === "AI" ? "AI" : "Researcher"),
      status: (row.status === "Approved" || row.status === "Deprecated") ? row.status : "Draft",
    });
  }
  return items;
}

/* ============================================================
 * 7) 실행 상태(Progress) 리포터 — 변환기·클린징·파이프라인 공용
 * ============================================================ */
export type ProgressEvent = { phase: string; percent: number; note?: string };
export type ProgressReporter = (e: ProgressEvent) => void;
