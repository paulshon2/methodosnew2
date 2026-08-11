/**
 * CMQ Taxonomy — 근거: CMQ (The Coding Manual for Qualitative Researchers, Saldaña 4E, 2021).
 * 코드·UI 어디서든 원전 근거명은 "CMQ" 로만 지칭한다.
 *
 * 카테고리
 *  FIRST_CYCLE_FAMILIES : 1차 코딩 계열(문법·요소·정서·언어/문학·탐색·절차·주제화)
 *  FIRST_CYCLE_METHODS  : 1차 코딩 방법 (25+)
 *  SECOND_CYCLE_METHODS : 재코딩(2차) 방법 (7)
 *  CODING_PROTOCOL      : 표준 코딩 프로토콜 (자료수집→Theory)
 *  DATA_SOURCE_TYPES    : 자료원(인터뷰·관찰·문서·SNS·영상·일기·기록물·설문 자유응답)
 *  UNITIZATION_LEVELS   : 분석단위(단어·구·문장·문단·에피소드·의미단위)
 *  METHOD_LINKS         : 각 코딩 방법과 어울리는 연구방법(리서치 디자인) 매핑
 *  VIZ_LINKS            : 각 결과물(코드·범주·테마·개념·이론)과 어울리는 시각화 매핑
 *  GLOSSARY             : 쉬운 설명 + 예시
 *  STAGE_TRANSFORMERS   : 8개 AI 변환기 카드 정의
 *  METHOD_SUPPORT_MATRIX: 분야별 지원 수준(★)
 */

export type CodingMethod = {
  id: string;
  label: string;       // KO
  labelEn: string;
  familyId: string;    // FIRST_CYCLE_FAMILIES.id (2차는 "second_cycle")
  cycle: 1 | 2;
  cmq: string;         // CMQ 원전 챕터/표제어 근거
  easy: string;        // 쉬운 한국어 설명
  example: string;     // 예시 (원자료 → 코드)
  bestFor: string;     // 어떤 자료·연구에 잘 맞는지
};

/* ────────────── 1차 코딩 계열 (CMQ 4E) ────────────── */
export const FIRST_CYCLE_FAMILIES: { id: string; label: string; labelEn: string; cmq: string; desc: string }[] = [
  { id: "grammatical", label: "문법적", labelEn: "Grammatical", cmq: "Grammatical Methods", desc: "코드 자체가 문법적 표시(속성·규모·하위코딩)로 자료의 뼈대를 부여." },
  { id: "elemental", label: "요소적", labelEn: "Elemental", cmq: "Elemental Methods", desc: "가장 기본이 되는 코딩(서술·인비보·프로세스 등)." },
  { id: "affective", label: "정서적", labelEn: "Affective", cmq: "Affective Methods", desc: "감정·가치·판단 등 응답자의 정서를 포착." },
  { id: "literary", label: "언어/문학적", labelEn: "Literary & Language", cmq: "Literary and Language Methods", desc: "언어의 형태·수사·서사 구조를 다루는 코딩." },
  { id: "exploratory", label: "탐색적", labelEn: "Exploratory", cmq: "Exploratory Methods", desc: "초기 개방·잠정적 코딩으로 자료를 열어봄." },
  { id: "procedural", label: "절차적", labelEn: "Procedural", cmq: "Procedural Methods", desc: "정해진 프레임을 자료에 적용." },
  { id: "themeing", label: "주제화", labelEn: "Themeing the Data", cmq: "Themeing the Data", desc: "코드가 아닌 ‘테마’ 형태의 문장으로 자료를 정리." },
  { id: "second_cycle", label: "재코딩(2차)", labelEn: "Second Cycle", cmq: "Second Cycle Coding Methods", desc: "1차 코드를 재조직·통합·이론화하는 단계." },
];

/* ────────────── 1차 코딩 방법 ────────────── */
export const FIRST_CYCLE_METHODS: CodingMethod[] = [
  // Grammatical
  { id: "attribute", label: "속성 코딩", labelEn: "Attribute Coding", familyId: "grammatical", cycle: 1, cmq: "Attribute Coding",
    easy: "자료의 ‘꼬리표’를 다는 코딩. 응답자·시점·장소·자료종류를 코드로 기록.",
    example: "P01 · 여성 · 42세 · 2021-06-10 · 학교현장",
    bestFor: "모든 질적자료의 기본 메타데이터, 사례 비교." },
  { id: "magnitude", label: "규모 코딩", labelEn: "Magnitude Coding", familyId: "grammatical", cycle: 1, cmq: "Magnitude Coding",
    easy: "코드에 크기·강도·빈도의 값을 덧붙임(예: 강·중·약, +/-, 1~5).",
    example: "‘분노’ → 분노[강], ‘동의’ → 동의[+]",
    bestFor: "혼합연구, 강도·빈도 비교." },
  { id: "subcoding", label: "하위 코딩", labelEn: "Subcoding", familyId: "grammatical", cycle: 1, cmq: "Subcoding",
    easy: "상위 코드 밑에 세부 코드를 계층으로 붙임.",
    example: "TEACHER SKILLS → INSTRUCTIONAL → PEDAGOGICAL / TECHNICAL",
    bestFor: "복잡한 개념의 세분화." },
  { id: "simultaneous", label: "동시 코딩", labelEn: "Simultaneous Coding", familyId: "grammatical", cycle: 1, cmq: "Simultaneous Coding",
    easy: "같은 자료 조각에 두 개 이상의 코드를 동시에 부여.",
    example: "한 문단 = ‘분노’ + ‘무력감’ + ‘가족갈등’",
    bestFor: "다층적 의미가 있는 인터뷰·서사." },

  // Elemental
  { id: "descriptive", label: "서술 코딩", labelEn: "Descriptive Coding", familyId: "elemental", cycle: 1, cmq: "Descriptive Coding",
    easy: "자료의 주제(무엇에 관한 이야기인지)를 한 단어·짧은 구로 요약.",
    example: "‘저는 매일 새벽 5시에 일어나 아이 등교를 준비합니다’ → 아침 루틴",
    bestFor: "관찰노트·문서·초심자 연구." },
  { id: "in_vivo", label: "인비보 코딩", labelEn: "In Vivo Coding", familyId: "elemental", cycle: 1, cmq: "In Vivo Coding",
    easy: "응답자의 실제 말을 그대로 따옴표로 묶어 코드로 사용.",
    example: "‘그냥 버티는 거예요’ → “그냥 버티는 거예요”",
    bestFor: "참여자 목소리 중심, 청소년·소수자 연구." },
  { id: "process", label: "프로세스 코딩", labelEn: "Process Coding", familyId: "elemental", cycle: 1, cmq: "Process Coding",
    easy: "진행형(-ing) 동사로 코드를 붙여 ‘행위·과정’을 포착.",
    example: "‘딸을 챙기고 출근한다’ → 챙기기(Caring), 출근하기(Commuting)",
    bestFor: "행위·상호작용·QL-008." },
  { id: "initial", label: "초기 코딩", labelEn: "Initial Coding", familyId: "elemental", cycle: 1, cmq: "Initial (Open) Coding",
    easy: "자료를 열어보며 자유롭게 뜯어보는 개방적 코딩.",
    example: "문장 한 줄씩 다양한 각도에서 코드 여러 개 시도",
    bestFor: "QL-008 첫 단계, 탐색적 연구." },

  // Affective
  { id: "emotion", label: "감정 코딩", labelEn: "Emotion Coding", familyId: "affective", cycle: 1, cmq: "Emotion Coding",
    easy: "응답자가 느낀 감정을 코드로 표시.",
    example: "‘그때 정말 무너졌어요’ → 절망, 상실",
    bestFor: "감정·트라우마·관계 연구." },
  { id: "values", label: "가치 코딩", labelEn: "Values Coding", familyId: "affective", cycle: 1, cmq: "Values Coding",
    easy: "가치(V)·태도(A)·신념(B) 세 층위로 코드를 부여.",
    example: "‘가족은 무조건이에요’ → V:가족중심, A:헌신, B:가족은 안전기지",
    bestFor: "문화·정체성·정책 연구." },
  { id: "versus", label: "대립 코딩", labelEn: "Versus Coding", familyId: "affective", cycle: 1, cmq: "Versus Coding",
    easy: "‘X vs Y’ 형식으로 갈등·긴장을 코드화.",
    example: "학생 vs 교사, 원칙 vs 편의",
    bestFor: "권력·갈등·정책평가." },
  { id: "evaluation", label: "평가 코딩", labelEn: "Evaluation Coding", familyId: "affective", cycle: 1, cmq: "Evaluation Coding",
    easy: "정책·프로그램의 강점(+)·약점(-)·권고(REC)를 코드로.",
    example: "+ 접근성 개선 / − 예산부족 / REC 시범확대",
    bestFor: "프로그램 평가, 정책연구." },

  // Literary / Language
  { id: "dramaturgical", label: "극작 코딩", labelEn: "Dramaturgical Coding", familyId: "literary", cycle: 1, cmq: "Dramaturgical Coding",
    easy: "인물·목표·갈등·전술·태도·부제(subtext)로 코드.",
    example: "OBJ: 승진 / CON: 상사 / TAC: 침묵",
    bestFor: "서사·연극적 자료, 조직 연구." },
  { id: "motif", label: "모티프 코딩", labelEn: "Motif Coding", familyId: "literary", cycle: 1, cmq: "Motif Coding",
    easy: "민담·설화에서 반복되는 모티프를 코드로.",
    example: "귀환(Return), 시련(Trial), 조력자(Helper)",
    bestFor: "서사·HC-001·민속연구." },
  { id: "narrative", label: "서사 코딩", labelEn: "Narrative Coding", familyId: "literary", cycle: 1, cmq: "Narrative Coding",
    easy: "이야기의 구성(배경·인물·플롯·주제)을 코드로.",
    example: "SETTING·CHAR·PLOT·THEME",
    bestFor: "생애사·인터뷰 서사." },
  { id: "verbal_exchange", label: "언어교환 코딩", labelEn: "Verbal Exchange Coding", familyId: "literary", cycle: 1, cmq: "Verbal Exchange Coding",
    easy: "짧은 대화 교환의 유형(잡담·자백·전투 등)을 코드로.",
    example: "잡담(phatic communion), 자백(confession)",
    bestFor: "QL-050·상호작용 연구." },

  // Exploratory
  { id: "holistic", label: "전체적 코딩", labelEn: "Holistic Coding", familyId: "exploratory", cycle: 1, cmq: "Holistic Coding",
    easy: "자료 조각(문단·에피소드) 전체에 하나의 큰 코드를 붙임.",
    example: "이 인터뷰 전체 → ‘돌봄 노동의 이중부담’",
    bestFor: "긴 자료의 사전 분류." },
  { id: "provisional", label: "잠정적 코딩", labelEn: "Provisional Coding", familyId: "exploratory", cycle: 1, cmq: "Provisional Coding",
    easy: "선행연구·이론에서 미리 정한 코드 목록을 자료에 적용.",
    example: "선행연구 코드북 15개를 준비 → 자료에 매칭",
    bestFor: "연역적·이론기반 연구." },
  { id: "hypothesis", label: "가설 코딩", labelEn: "Hypothesis Coding", familyId: "exploratory", cycle: 1, cmq: "Hypothesis Coding",
    easy: "사전 가설에 맞춰 코드를 부여하고 검증.",
    example: "H1: SES↑ → 교육기대↑ 를 코드로 확인",
    bestFor: "혼합연구, 검증형 연구." },

  // Procedural
  { id: "protocol", label: "프로토콜 코딩", labelEn: "Protocol Coding", familyId: "procedural", cycle: 1, cmq: "Protocol Coding",
    easy: "이미 검증된 코드북·매뉴얼을 그대로 적용.",
    example: "표준 매뉴얼 코드 트리 사용",
    bestFor: "정부·기관 표준자료." },
  { id: "domain_taxonomy", label: "영역/분류 코딩", labelEn: "Domain and Taxonomic Coding", familyId: "procedural", cycle: 1, cmq: "Domain and Taxonomic Coding",
    easy: "문화적 지식의 영역·하위분류를 코드로 정리(민족지).",
    example: "‘병원의 부서’ → 진료/원무/원내지원 등",
    bestFor: "민족지, 문화·조직 연구." },
  { id: "causation", label: "인과 코딩", labelEn: "Causation Coding", familyId: "procedural", cycle: 1, cmq: "Causation Coding",
    easy: "원인·매개·결과(CAUSE→MECH→OUTCOME) 형태로 코드.",
    example: "실업 → 자존감 저하 → 사회적 고립",
    bestFor: "정책·과정평가." },
  { id: "occampasing", label: "OCM 코딩", labelEn: "OCM (Outline of Cultural Materials)", familyId: "procedural", cycle: 1, cmq: "OCM Coding",
    easy: "인류학 표준 분류체계(OCM)를 사용해 코드.",
    example: "700·식품, 570·친족 등",
    bestFor: "비교문화·인류학." },

  // Themeing
  { id: "themeing", label: "테마화", labelEn: "Themeing the Data", familyId: "themeing", cycle: 1, cmq: "Themeing the Data",
    easy: "짧은 단어가 아닌 완결된 문장 형태의 ‘테마’로 코드.",
    example: "‘안전은 가족과의 연결에서 온다’",
    bestFor: "현상학·주제분석." },
];

/* ────────────── 2차(재코딩) 방법 ────────────── */
export const SECOND_CYCLE_METHODS: CodingMethod[] = [
  { id: "pattern", label: "패턴 코딩", labelEn: "Pattern Coding", familyId: "second_cycle", cycle: 2, cmq: "Pattern Coding",
    easy: "1차 코드들을 묶어 반복 패턴을 나타내는 상위 코드로 재구성.",
    example: "여러 ‘분노·좌절’ 코드 → 패턴 코드 ‘무력감의 순환’",
    bestFor: "1차 코드가 어느 정도 쌓인 뒤." },
  { id: "focused", label: "포커스 코딩", labelEn: "Focused Coding", familyId: "second_cycle", cycle: 2, cmq: "Focused Coding",
    easy: "초기 코드 중 가장 빈번·중요한 것을 골라 집중.",
    example: "20개 초기코드 → ‘돌봄 부담’ 5개 유지",
    bestFor: "QL-008 2차 단계." },
  { id: "axial", label: "축 코딩", labelEn: "Axial Coding", familyId: "second_cycle", cycle: 2, cmq: "Axial Coding",
    easy: "핵심 축(현상·맥락·조건·전략·결과)을 중심으로 재조직.",
    example: "현상: 소진 / 조건: 야근 / 결과: 이직",
    bestFor: "QL-008(Strauss·Corbin 계열)." },
  { id: "theoretical", label: "이론적 코딩", labelEn: "Theoretical Coding", familyId: "second_cycle", cycle: 2, cmq: "Theoretical Coding",
    easy: "축 코드를 하나의 핵심 범주로 통합해 이론화.",
    example: "핵심 범주 ‘돌봄 정체성의 재구성’ 도출",
    bestFor: "QL-008 최종 단계." },
  { id: "elaborative", label: "정교화 코딩", labelEn: "Elaborative Coding", familyId: "second_cycle", cycle: 2, cmq: "Elaborative Coding",
    easy: "선행 이론을 확장·정교화하는 코드로 재정리.",
    example: "기존 이론에 새 조건(디지털 소외)을 추가",
    bestFor: "이론 확장형 후속연구." },
  { id: "longitudinal", label: "종단 코딩", labelEn: "Longitudinal Coding", familyId: "second_cycle", cycle: 2, cmq: "Longitudinal Coding",
    easy: "여러 시점의 코드를 비교해 변화(증가·감소·안정)를 표시.",
    example: "T1→T2 ‘자기효능감’: 상승, ‘고립감’: 감소",
    bestFor: "종단·패널 질적자료." },
  { id: "code_mapping", label: "코드 매핑/랜드스케이핑", labelEn: "Code Mapping / Landscaping", familyId: "second_cycle", cycle: 2, cmq: "Code Mapping / Landscaping",
    easy: "전체 코드를 시각적 지도로 배치하고 관계를 정리.",
    example: "‘돌봄·가족·소진’ 3그룹의 관계도",
    bestFor: "2차 코딩 마무리·발표자료." },
];

/* ────────────── 표준 코딩 프로토콜 (자료수집→Theory) ────────────── */
export const CODING_PROTOCOL: { id: string; label: string; labelEn: string; cmq: string; desc: string }[] = [
  { id: "collect", label: "자료수집", labelEn: "Data Collection", cmq: "Preparing for the Coding", desc: "인터뷰·관찰·문서·SNS·영상·일기·기록물·설문 자유응답 등을 확보." },
  { id: "prepare", label: "데이터 정리", labelEn: "Data Preparation", cmq: "Data Preparation", desc: "전사·익명화·시점·화자 정리, 분석단위(Unit) 결정." },
  { id: "unitize", label: "분절(Unitization)", labelEn: "Unitization", cmq: "Analytic Units", desc: "문장·문단·에피소드·의미단위로 자료를 잘라 코딩단위 확정." },
  { id: "first_coding", label: "1차 코딩", labelEn: "First Cycle Coding", cmq: "First Cycle Coding Methods", desc: "서술·인비보·프로세스·감정·가치 등 1차 방법 적용." },
  { id: "recoding", label: "재코딩", labelEn: "Second Cycle / Recoding", cmq: "Second Cycle Coding Methods", desc: "코드 정련·통합·삭제·재명명(Recode → Refine 반복)." },
  { id: "category", label: "범주화(Category)", labelEn: "Category Development", cmq: "From Codes to Categories", desc: "유사 코드들을 묶어 상위 범주로 조직." },
  { id: "subcategory", label: "하위범주(Subcategory)", labelEn: "Subcategory", cmq: "Subcategories", desc: "범주 내부의 계층 구조를 만듦." },
  { id: "pattern_a", label: "패턴 분석", labelEn: "Pattern Analysis", cmq: "Pattern Coding", desc: "반복·규칙성·인과·과정 패턴을 도출." },
  { id: "theme", label: "Theme 생성", labelEn: "Theme Generation", cmq: "From Categories to Themes", desc: "의미의 집합으로서의 테마 문장 생성." },
  { id: "concept", label: "Concept 생성", labelEn: "Concept Generation", cmq: "From Themes to Concepts", desc: "테마를 더 추상적인 개념으로 승격." },
  { id: "theory", label: "Theory 생성", labelEn: "Theory Generation", cmq: "From Concepts to Theory", desc: "개념 간 관계를 진술로 정리, 이론적 함의 도출." },
  { id: "report", label: "보고·검증", labelEn: "Report & Verification", cmq: "Writing Up", desc: "코드북·감사추적·구성원검토·삼각검증·보고." },
];

/* ────────────── 자료원 / 분석단위 ────────────── */
export const DATA_SOURCE_TYPES = [
  { id: "interview", label: "인터뷰", cmq: "Interview Data" },
  { id: "observation", label: "관찰노트", cmq: "Observation Data" },
  { id: "document", label: "문서/기록물", cmq: "Documents" },
  { id: "sns", label: "SNS/온라인 텍스트", cmq: "Online Data" },
  { id: "video", label: "영상", cmq: "Video Data" },
  { id: "image", label: "이미지", cmq: "Visual Data" },
  { id: "diary", label: "일기·저널", cmq: "Journals" },
  { id: "open_survey", label: "설문 자유응답", cmq: "Open-ended Responses" },
];

export const UNITIZATION_LEVELS = [
  { id: "word", label: "단어" },
  { id: "phrase", label: "구/절" },
  { id: "sentence", label: "문장" },
  { id: "paragraph", label: "문단" },
  { id: "episode", label: "에피소드" },
  { id: "meaning_unit", label: "의미단위(Meaning Unit)" },
];

/* ────────────── 지원 수준 매트릭스 (CMQ) ────────────── */
export const METHOD_SUPPORT_MATRIX: { area: string; stars: number }[] = [
  { area: "Interview Coding", stars: 5 },
  { area: "Observation Coding", stars: 5 },
  { area: "Ethnography", stars: 5 },
  { area: "Grounded Theory", stars: 5 },
  { area: "Case Study", stars: 5 },
  { area: "Narrative Analysis", stars: 5 },
  { area: "Phenomenology", stars: 5 },
  { area: "Action Research", stars: 5 },
  { area: "Document Analysis", stars: 5 },
  { area: "Content Analysis", stars: 4 },
  { area: "Discourse Analysis", stars: 4 },
  { area: "Video Coding", stars: 4 },
  { area: "Conversation Analysis", stars: 3 },
  { area: "AI Text Coding", stars: 3 },
  { area: "Image Coding", stars: 3 },
];

/* ────────────── 연구방법(design) 매핑 ────────────── */
/** 각 1차 코딩 방법과 잘 맞는 연구방법(끝에 나오는 연구방법 목록과 연동) */
export const METHOD_LINKS: { codingId: string; researchMethods: string[] }[] = [
  { codingId: "in_vivo", researchMethods: ["grounded-theory", "phenomenology", "QL-027"] },
  { codingId: "process", researchMethods: ["grounded-theory", "action-research"] },
  { codingId: "initial", researchMethods: ["grounded-theory"] },
  { codingId: "emotion", researchMethods: ["phenomenology", "QL-027"] },
  { codingId: "values", researchMethods: ["case-study", "ethnography"] },
  { codingId: "versus", researchMethods: ["critical-inquiry", "case-study"] },
  { codingId: "evaluation", researchMethods: ["EP-007"] },
  { codingId: "dramaturgical", researchMethods: ["QL-027", "case-study"] },
  { codingId: "motif", researchMethods: ["QL-027", "ethnography"] },
  { codingId: "narrative", researchMethods: ["QL-027"] },
  { codingId: "verbal_exchange", researchMethods: ["QL-050", "QL-011"] },
  { codingId: "holistic", researchMethods: ["case-study", "ethnography"] },
  { codingId: "provisional", researchMethods: ["TX-002"] },
  { codingId: "hypothesis", researchMethods: ["mixed-methods"] },
  { codingId: "protocol", researchMethods: ["TX-002"] },
  { codingId: "domain_taxonomy", researchMethods: ["ethnography"] },
  { codingId: "causation", researchMethods: ["case-study", "EP-007"] },
  { codingId: "occampasing", researchMethods: ["ethnography"] },
  { codingId: "themeing", researchMethods: ["phenomenology", "thematic-analysis"] },
  { codingId: "descriptive", researchMethods: ["TX-002", "case-study"] },
  { codingId: "attribute", researchMethods: ["case-study", "mixed-methods"] },
  { codingId: "magnitude", researchMethods: ["mixed-methods", "TX-002"] },
];

/* ────────────── 시각화 매핑 ────────────── */
/** 산출물 → 어울리는 그래프(existing viz 카탈로그의 id/키워드) */
export const VIZ_LINKS: { output: string; chartHints: string[]; note: string }[] = [
  { output: "코드 빈도", chartHints: ["bar", "barchart", "column"], note: "코드별 빈도 막대그래프" },
  { output: "코드 네트워크", chartHints: ["network", "graph"], note: "코드·범주 관계 네트워크" },
  { output: "범주 계층", chartHints: ["treemap", "sunburst", "dendrogram"], note: "범주·하위범주 계층 시각화" },
  { output: "테마 지도", chartHints: ["mindmap", "network"], note: "테마·코드 지도" },
  { output: "개념 관계", chartHints: ["sankey", "network"], note: "개념 간 흐름/관계" },
  { output: "이론 모형", chartHints: ["diagram", "flow"], note: "이론적 모형 다이어그램" },
  { output: "종단 변화", chartHints: ["line", "area"], note: "시점별 코드 변화 추세" },
  { output: "워드클라우드", chartHints: ["wordcloud"], note: "인비보/서술코드 어휘 시각화" },
];

/* ────────────── 8개 AI 변환기 카드 ────────────── */
export type TransformerCard = {
  id: string;
  label: string;       // KO
  labelEn: string;
  cmqStep: string;     // CODING_PROTOCOL.id 대응
  cmq: string;         // CMQ 근거
  input: string;       // 어떤 입력을 받는가
  output: string;      // 무엇을 산출하는가
  easy: string;        // 쉬운 설명
};

export const STAGE_TRANSFORMERS: TransformerCard[] = [
  { id: "analyze", label: "분석 변환기", labelEn: "Analysis Transformer", cmqStep: "prepare", cmq: "Preparing for the Coding",
    input: "원자료(텍스트)", output: "자료 개요·톤·주요 화제·잠재 코드 후보",
    easy: "자료를 훑어 무엇을 코딩할지 방향을 잡는 단계." },
  { id: "cleanup", label: "데이터 정리 변환기", labelEn: "Data Cleanup Transformer", cmqStep: "prepare", cmq: "Data Preparation",
    input: "원자료(전사·필드노트 등)", output: "익명화·문장분리·분석단위(문장/문단) 표시",
    easy: "코딩하기 쉽게 자료를 다듬고 잘라줌." },
  { id: "first_code", label: "1차 코딩 변환기", labelEn: "First Cycle Coding Transformer", cmqStep: "first_coding", cmq: "First Cycle Coding Methods",
    input: "정리된 자료 + 1차 코딩 방법 선택", output: "분석단위별 1차 코드 목록",
    easy: "선택한 방법(서술·인비보·프로세스 등)으로 코드를 붙임." },
  { id: "recode", label: "재코딩 변환기", labelEn: "Recoding Transformer", cmqStep: "recoding", cmq: "Second Cycle / Recoding",
    input: "1차 코드", output: "정련·통합·삭제·재명명된 코드 목록",
    easy: "중복을 합치고 이름을 다듬어 코드 세트를 정돈." },
  { id: "categorize", label: "범주화 변환기", labelEn: "Categorization Transformer", cmqStep: "category", cmq: "From Codes to Categories",
    input: "정련된 코드", output: "상위 범주 + 하위범주 계층",
    easy: "코드를 성질별로 묶어 큰 상자·작은 상자로 정리." },
  { id: "pattern", label: "패턴분석 변환기", labelEn: "Pattern Analysis Transformer", cmqStep: "pattern_a", cmq: "Pattern Coding",
    input: "범주·코드", output: "반복·규칙성·과정·인과 패턴 진술",
    easy: "여러 범주에 걸쳐 반복되는 규칙을 찾음." },
  { id: "theme", label: "Theme 생성 변환기", labelEn: "Theme Transformer", cmqStep: "theme", cmq: "From Categories to Themes",
    input: "범주+패턴", output: "완결 문장 형태의 테마 목록",
    easy: "코드·범주가 담고 있는 의미를 문장으로 정리." },
  { id: "concept", label: "Concept 생성 변환기", labelEn: "Concept Transformer", cmqStep: "concept", cmq: "From Themes to Concepts",
    input: "테마", output: "추상 개념(Concept) 목록·정의",
    easy: "테마를 더 추상적인 이름으로 승격." },
  { id: "theory", label: "Theory 생성 변환기", labelEn: "Theory Transformer", cmqStep: "theory", cmq: "From Concepts to Theory",
    input: "개념 관계", output: "개념 간 명제·이론 진술문·모형 스케치",
    easy: "개념끼리 어떻게 이어지는지 이론 문장을 만듦." },
];

/* ────────────── 쉬운 용어 사전 ────────────── */
export const GLOSSARY: { term: string; easy: string; example: string; cmq: string }[] = [
  { term: "코드(Code)", easy: "자료 조각에 붙이는 짧은 이름표.", example: "‘저는 매일 아침 딸 도시락을 쌉니다’ → 코드: 돌봄 루틴", cmq: "Code" },
  { term: "범주(Category)", easy: "성질이 비슷한 코드들을 담는 큰 상자.", example: "‘도시락, 등교, 학원픽업’ → 범주: 자녀 돌봄", cmq: "Category" },
  { term: "테마(Theme)", easy: "자료가 말하는 의미를 한 문장으로 정리한 것.", example: "‘엄마의 하루는 아이의 시간표 위에서 흐른다’", cmq: "Theme" },
  { term: "개념(Concept)", easy: "테마를 더 짧고 추상적인 이름으로 만든 것.", example: "‘시간의 이양(Time Transfer)’", cmq: "Concept" },
  { term: "이론(Theory)", easy: "개념들이 어떻게 연결되는지 설명하는 진술.", example: "‘돌봄 부담이 커질수록 시간의 이양이 발생하며, 이는 자기시간 상실로 이어진다.’", cmq: "Theory" },
  { term: "분석단위", easy: "코드를 붙이는 자료의 최소 조각.", example: "문장, 문단, 에피소드 등", cmq: "Analytic Unit" },
  { term: "코드북(Codebook)", easy: "코드 이름·정의·예시를 모아 놓은 사전.", example: "코드 ‘돌봄 루틴’: 정의·예시·포함/제외", cmq: "Codebook" },
  { term: "감사추적", easy: "코딩 결정의 흔적을 남겨 재검토가 가능하게 함.", example: "메모·버전·수정이력", cmq: "Audit Trail" },
  { term: "삼각검증", easy: "여러 자료·연구자·방법을 비교해 결과를 검증.", example: "다른 코더의 코드와 비교(IRR)", cmq: "Triangulation" },
];
