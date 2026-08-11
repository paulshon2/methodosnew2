// MethodOS Universal Engine Registry (UER) v0.2 — methodos in-app instance.
// Source ingests: SRC-CHARMAZ-2014 (Constructivist GT) · SRC-KRIP-2018 (Content Analysis)
// Schema: UER v0.1 — engine = 방법독립 정규 기능 단위, locator = 실측 PDF 페이지
// 본 모듈은 method-detail.tsx와 project-stage.tsx에 UER 패널을 주입하기 위한 데이터·헬퍼.

export type PromotionStatus = "Candidate" | "Validated" | "Universal" | "Deprecated";
export type UniversalityTier = "Tier0" | "Tier1" | "Tier2";
export type HITL = "none" | "optional" | "required";

export interface SourceLocator {
  source_id: string;
  chapter: string;
  page_range: string;       // PDF 북마크 기준 실측
  procedure_summary: string;
  language?: string;
}

export interface MethodBinding {
  method_id: string;        // methodos registry method.id
  method_name_ko: string;
  original_procedure_term: string;
  source_locator: SourceLocator;
  mapping_rationale: string;
  fidelity_note?: string;
}

export interface UniversalEngine {
  engine_uid: string;
  canonical_name: string;
  korean_name: string;
  function_statement: string;
  mechanism: string;
  purpose: string;
  engine_family: string;
  universality_tier: UniversalityTier;
  promotion_status: PromotionStatus;
  human_in_the_loop: HITL;
  upstream_engines?: string[];
  downstream_engines?: string[];
  incompatibility_note?: string;
  bindings: MethodBinding[];
}

// ───────────────────────────────────────────────────────────────────────────────
// 0. 등록된 원전 마스터
export const UER_SOURCES = {
  "SRC-CHARMAZ-2014": {
    title: "Constructing Grounded Theory (2nd ed.)",
    author: "Kathy Charmaz",
    edition_year: 2014,
    publisher: "",
    total_pages_pdf: 648,
  },
  "SRC-KRIP-2018": {
    title: "Content Analysis: An Introduction to Its Methodology (4th ed.)",
    author: "Klaus Krippendorff",
    edition_year: 2018,
    publisher: "",
    total_pages_pdf: 468,
  },
} as const;

// ───────────────────────────────────────────────────────────────────────────────
// 1. Universal Engines (Charmaz + Krippendorff 누적)
export const UER_ENGINES: Record<string, UniversalEngine> = {
  "UENG-CLASSIFY-01": {
    engine_uid: "UENG-CLASSIFY-01",
    canonical_name: "Classification Engine",
    korean_name: "분류 엔진",
    function_statement: "의미 단위를 상호배타적·포괄적 범주체계로 체계적으로 분류한다.",
    mechanism: "단위와 코드북을 입력받아 범주 귀속을 판정하고 범주체계를 산출한다.",
    purpose: "자료를 분석 가능한 구조로 환원한다.",
    engine_family: "Data Structuring(Classification)",
    universality_tier: "Tier1",
    promotion_status: "Universal",
    human_in_the_loop: "optional",
    downstream_engines: ["UENG-FREQ-01", "UENG-RELIABILITY-01", "UENG-CONSOLIDATE-01"],
    bindings: [
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Recording/Coding (코딩)",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.7 Recording/Coding",
          page_range: "PDF p.143–177",
          procedure_summary: "코드북에 따라 단위를 범주에 귀속시키고 코더간 신뢰도를 위해 범주를 정련한다.",
          language: "en",
        },
        mapping_rationale: "코드북 기반 단위→범주 귀속 = 분류 기능.",
      },
      {
        method_id: "QL-006",
        method_name_ko: "구성주의 QL-008",
        original_procedure_term: "Initial Coding (초기코딩 · gerund/line-by-line)",
        source_locator: {
          source_id: "SRC-CHARMAZ-2014",
          chapter: "Ch.5 The Logic of GT Coding & Initial Coding",
          page_range: "PDF p.204–246 (핵심 p.215 논리, p.221 gerund, p.227–228 단어/행별, p.233 사건)",
          procedure_summary: "행·단어·사건 단위로 분절하여 잠정 gerund 코드 부여, data↔code 비교로 정련.",
          language: "en",
        },
        mapping_rationale: "단위에 코드 귀속 = 분류 기능. 구성주의 강조점(gerund·구성)은 binding 속성에 기록.",
        fidelity_note: "code_form=gerund, constructivist=true",
      },
    ],
  },
  "UENG-CONSOLIDATE-01": {
    engine_uid: "UENG-CONSOLIDATE-01",
    canonical_name: "Category Consolidation Engine",
    korean_name: "범주 통합·승격 엔진",
    function_statement: "빈번하고 유의미한 초기 분류를 선별·통합하여 상위 범주로 승격한다.",
    mechanism: "선별적 통합(초기코드 → 초점코드/범주).",
    purpose: "분석의 응축과 추상수준 상향.",
    engine_family: "Data Structuring(Classification)",
    universality_tier: "Tier1",
    promotion_status: "Validated",  // GT(Charmaz) + CA(Krippendorff) — 2개 방법군
    human_in_the_loop: "optional",
    upstream_engines: ["UENG-CLASSIFY-01", "UENG-COMPARE-01"],
    downstream_engines: ["UENG-THEORIZE-01"],
    bindings: [
      {
        method_id: "QL-006",
        method_name_ko: "구성주의 QL-008",
        original_procedure_term: "Focused Coding (초점코딩)",
        source_locator: {
          source_id: "SRC-CHARMAZ-2014",
          chapter: "Ch.6 Focused Coding and Beyond",
          page_range: "PDF p.247–264 (핵심 p.250 실제, p.260 분석수준 상향)",
          procedure_summary: "분석적으로 유의미한 초기코드를 선택해 다량의 자료를 범주로 절단·종합한다.",
          language: "en",
        },
        mapping_rationale: "초기 분류 이후의 선별·승격 기능.",
        fidelity_note: "construction_timing=emergent (귀납적 승격)",
      },
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Category System Construction & Revision",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.7 Recording/Coding",
          page_range: "PDF p.143– (코딩 스킴 구성·정련)",
          procedure_summary: "신뢰도 요건을 충족하도록 범주체계를 구성·정련하여 단위를 일관되게 조직.",
          language: "en",
        },
        mapping_rationale: "후보 구분을 정합적 범주체계로 조직·정련 = CONSOLIDATE.",
        fidelity_note: "construction_timing=a_priori (코드북 사전구성)",
      },
    ],
  },
  "UENG-COMPARE-01": {
    engine_uid: "UENG-COMPARE-01",
    canonical_name: "Constant Comparison Engine",
    korean_name: "지속적 비교 엔진",
    function_statement: "data-data, data-code, code-category, category-category를 지속 비교한다.",
    mechanism: "비교(차이·유사 식별). 코딩·표집·포화의 횡단 기반 기능.",
    purpose: "분석의 일관성·정합성 점검 및 추상화 추동.",
    engine_family: "Data Structuring(Classification)",
    universality_tier: "Tier1",
    promotion_status: "Candidate",
    human_in_the_loop: "optional",
    downstream_engines: ["UENG-CLASSIFY-01", "UENG-CONSOLIDATE-01", "UENG-SATURATE-01"],
    bindings: [
      {
        method_id: "QL-006",
        method_name_ko: "구성주의 QL-008",
        original_procedure_term: "Constant Comparative Method",
        source_locator: {
          source_id: "SRC-CHARMAZ-2014",
          chapter: "Ch.5 / Ch.8",
          page_range: "PDF p.215 (data↔code), p.359 (category↔category)",
          procedure_summary: "코딩 전 과정에서 자료·코드·범주를 반복 대조하여 분석을 정련.",
          language: "en",
        },
        mapping_rationale: "GT 횡단 핵심 메커니즘. 분류·표집·포화의 공통 상위 기능.",
      },
    ],
  },
  "UENG-MEMO-01": {
    engine_uid: "UENG-MEMO-01",
    canonical_name: "Analytic Memo Engine",
    korean_name: "분석 메모 엔진",
    function_statement: "코드·범주에 대한 분석적 사고를 기록·전개하여 범주를 정교화하고 분석경로를 추적한다.",
    mechanism: "분석적 주석·전개 + 감사추적(audit trail).",
    purpose: "초점코드→개념범주 상향, 추론과정의 가시화·추적.",
    engine_family: "Evidence/Traceability",
    universality_tier: "Tier1",
    promotion_status: "Candidate",
    human_in_the_loop: "required",
    upstream_engines: ["UENG-CLASSIFY-01", "UENG-CONSOLIDATE-01"],
    downstream_engines: ["UENG-THEORIZE-01", "UENG-SATURATE-01"],
    bindings: [
      {
        method_id: "QL-006",
        method_name_ko: "구성주의 QL-008",
        original_procedure_term: "Memo-writing",
        source_locator: {
          source_id: "SRC-CHARMAZ-2014",
          chapter: "Ch.7 Memo-writing",
          page_range: "PDF p.283–328 (방법 p.287, 작성법 p.293, 초점코드→개념범주 상향 p.322)",
          procedure_summary: "코딩과 글쓰기 사이의 핵심 중간단계로 코드를 분석적으로 전개·추적.",
          language: "en",
        },
        mapping_rationale: "분석 전개 + 추적 = Evidence/Traceability 계열.",
      },
    ],
  },
  "UENG-SAMPLE-01": {
    engine_uid: "UENG-SAMPLE-01",
    canonical_name: "Representative Sampling Engine",
    korean_name: "대표성 표집 엔진",
    function_statement: "대표성·표집편향 최소화를 위해 모집단에서 분석 단위를 추출한다.",
    mechanism: "표집(대표성 기준).",
    purpose: "대표성 확보·표집편향 최소화",
    engine_family: "Sampling",
    universality_tier: "Tier1",
    promotion_status: "Candidate",
    human_in_the_loop: "optional",
    downstream_engines: ["UENG-CLASSIFY-01"],
    bindings: [
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Sampling",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.6 Sampling",
          page_range: "PDF p.130– (모집단→텍스트 표집 확장, bias 최소화)",
          procedure_summary: "텍스트 모집단을 다룰 수 있는 규모로 한정하되 편향을 최소화하는 표집계획을 정한다.",
          language: "en",
        },
        mapping_rationale: "표집이되 목적이 대표성 → SAMPLE-01.",
      },
    ],
  },
  "UENG-SAMPLE-02": {
    engine_uid: "UENG-SAMPLE-02",
    canonical_name: "Theoretical Sampling Engine",
    korean_name: "이론적 표집 엔진",
    function_statement: "출현한 이론적 범주의 속성을 정교화하기 위해 추가 자료를 선택한다.",
    mechanism: "표집(이론적 발전 기준 — 대표성 아님).",
    purpose: "이론(범주) 발전·정교화",
    engine_family: "Sampling",
    universality_tier: "Tier2",
    promotion_status: "Validated",
    human_in_the_loop: "required",
    upstream_engines: ["UENG-CLASSIFY-01", "UENG-CONSOLIDATE-01"],
    downstream_engines: ["UENG-SATURATE-01"],
    bindings: [
      {
        method_id: "QL-006",
        method_name_ko: "구성주의 QL-008",
        original_procedure_term: "Theoretical Sampling",
        source_locator: {
          source_id: "SRC-CHARMAZ-2014",
          chapter: "Ch.8 Theoretical Sampling, Saturation, and Sorting",
          page_range: "PDF p.336 (대표성 표집과 구분), p.340 (논리), p.341 (귀추적 추론)",
          procedure_summary: "출현 범주를 채우기 위해 자료를 선택하는 귀추(abduction) 기반 반복 과정.",
          language: "en",
        },
        mapping_rationale: "표집이되 목적이 대표성 아닌 이론발전 → SAMPLE-02 (목적 분리).",
      },
    ],
  },
  "UENG-UNITIZE-01": {
    engine_uid: "UENG-UNITIZE-01",
    canonical_name: "Analysis Unit Segmentation Engine",
    korean_name: "분석단위 분절 엔진",
    function_statement: "텍스트를 분석에 적합한 단위(샘플링·기록·맥락)로 분절한다.",
    mechanism: "단위 정의·경계 적용.",
    purpose: "일관된 코딩의 토대 확보.",
    engine_family: "Unitizing",
    universality_tier: "Tier0",
    promotion_status: "Candidate",
    human_in_the_loop: "optional",
    downstream_engines: ["UENG-CLASSIFY-01"],
    bindings: [
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Unitizing (sampling/recording/context units)",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.5 Unitizing",
          page_range: "PDF p.117– (3종 단위 + 정의 5방식)",
          procedure_summary: "샘플링·기록·맥락 단위를 정의하고 생산적·신뢰성 있게 분절한다.",
          language: "en",
        },
        mapping_rationale: "단위화를 독립 형식 절차로 규정한 것은 CA. GT 초기코딩도 단위 위에서 작동.",
      },
    ],
  },
  "UENG-INFER-01": {
    engine_uid: "UENG-INFER-01",
    canonical_name: "Abductive Inference Engine",
    korean_name: "귀추 추론 엔진",
    function_statement: "분석구성체를 조작화하여 텍스트로부터 그 맥락에 관한 추론을 정당화한다.",
    mechanism: "귀추(abduction) — 텍스트→맥락.",
    purpose: "텍스트로부터 맥락에 관한 추론 산출",
    engine_family: "Inference/Modeling",
    universality_tier: "Tier2",
    promotion_status: "Candidate",
    human_in_the_loop: "required",
    upstream_engines: ["UENG-CLASSIFY-01", "UENG-FREQ-01"],
    downstream_engines: ["UENG-VALIDITY-01"],
    bindings: [
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Analytical Constructs",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.9 Analytical Constructs",
          page_range: "PDF p.193– (구성체 조작화, 귀추추론 정당화)",
          procedure_summary: "분석가가 텍스트 맥락에 대해 아는/가정하는 바를 구성체로 조작화하여 추론을 정당화.",
          language: "en",
        },
        mapping_rationale: "TX-002의 정의적 기능 = 텍스트→맥락 추론. GT의 이론구성과 목적 분리.",
        fidelity_note: "Charmaz도 abduction(p.341) 사용하나 목적은 '이론 발전'.",
      },
    ],
  },
  "UENG-RELIABILITY-01": {
    engine_uid: "UENG-RELIABILITY-01",
    canonical_name: "Inter-coder Reliability Engine",
    korean_name: "코더간 신뢰도 엔진",
    function_statement: "관찰자·코더 간 일치를 정량 평가한다.",
    mechanism: "일치도 측정 (stability/replicability/accuracy, α).",
    purpose: "코딩의 재현가능성·신뢰도 정량화.",
    engine_family: "Reliability/Agreement",
    universality_tier: "Tier2",
    promotion_status: "Candidate",
    human_in_the_loop: "optional",
    incompatibility_note: "구성주의 GT(Charmaz)는 코더간 신뢰도 개념을 거부(코드=연구자 구성물). → CA·후기실증 코딩 계열 한정.",
    bindings: [
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Reliability (Krippendorff's α)",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.12 Reliability",
          page_range: "PDF p.292– (3종 신뢰도, 일치계수 α)",
          procedure_summary: "stability/replicability/accuracy로 신뢰도 구분, α로 정량 평가.",
          language: "en",
        },
        mapping_rationale: "코더간 일치 정량화 = 신뢰도 엔진.",
      },
    ],
  },
  "UENG-VALIDITY-01": {
    engine_uid: "UENG-VALIDITY-01",
    canonical_name: "Validity Assessment Engine",
    korean_name: "타당도 평가 엔진",
    function_statement: "결과의 타당성을 validation 유형론에 따라 평가·정당화한다.",
    mechanism: "타당성 평가.",
    purpose: "결과 정당화.",
    engine_family: "Validity",
    universality_tier: "Tier2",
    promotion_status: "Candidate",
    human_in_the_loop: "required",
    upstream_engines: ["UENG-INFER-01"],
    bindings: [
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Validity",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.13 Validity",
          page_range: "PDF p.376– (validation 유형론, 정량평가)",
          procedure_summary: "validation 유형론에 따라 결과 타당성을 평가.",
          language: "en",
        },
        mapping_rationale: "결과 정당화 기능.",
      },
    ],
  },
  "UENG-SATURATE-01": {
    engine_uid: "UENG-SATURATE-01",
    canonical_name: "Saturation Assessment Engine",
    korean_name: "포화 판정 엔진",
    function_statement: "새로운 속성이 더 출현하지 않을 때까지 표집·분석 반복 여부를 판정한다.",
    mechanism: "종료조건(stopping-rule) 판정.",
    purpose: "범주의 이론적 충분성 판정.",
    engine_family: "Reliability/Agreement",
    universality_tier: "Tier1",
    promotion_status: "Candidate",
    human_in_the_loop: "required",
    upstream_engines: ["UENG-SAMPLE-02", "UENG-COMPARE-01"],
    bindings: [
      {
        method_id: "QL-006",
        method_name_ko: "구성주의 QL-008",
        original_procedure_term: "Theoretical Saturation",
        source_locator: {
          source_id: "SRC-CHARMAZ-2014",
          chapter: "Ch.8 Theoretical Sampling, Saturation, and Sorting",
          page_range: "PDF p.359 (Saturating Theoretical Categories)",
          procedure_summary: "이론적 표집으로 범주-범주 비교, 속성이 더 드러나지 않을 때 충분성 도달 판정.",
          language: "en",
        },
        mapping_rationale: "범주 충분성의 종료조건 판정 → 독립 기능.",
      },
    ],
  },
  "UENG-THEORIZE-01": {
    engine_uid: "UENG-THEORIZE-01",
    canonical_name: "Theoretical Integration Engine",
    korean_name: "이론 통합 엔진",
    function_statement: "범주 간 관계를 통합적 이론틀로 연결한다.",
    mechanism: "관계 통합(해석적·귀추적).",
    purpose: "범주 → 실체이론(substantive theory) 통합.",
    engine_family: "Inference/Modeling",
    universality_tier: "Tier2",
    promotion_status: "Candidate",
    human_in_the_loop: "required",
    upstream_engines: ["UENG-CONSOLIDATE-01", "UENG-MEMO-01"],
    bindings: [
      {
        method_id: "QL-006",
        method_name_ko: "구성주의 QL-008",
        original_procedure_term: "Theoretical Coding",
        source_locator: {
          source_id: "SRC-CHARMAZ-2014",
          chapter: "Ch.6 (Theoretical Coding), Ch.9 (Reconstructing Theorizing)",
          page_range: "PDF p.265 (이론적 코딩), p.377– (이론화 재구성)",
          procedure_summary: "초점코드/범주 간 관계를 정교화하여 분석을 일관된 이론으로 통합하되 '적용'과 '출현' 사이 긴장을 유지.",
          language: "en",
        },
        mapping_rationale: "범주 간 관계 통합 = 이론구성. 해석성 高 → HITL required.",
        fidelity_note: "Strauss·Corbin식 패러다임 모형(인과/맥락/중재/중심/전략/결과)은 Charmaz가 비판적으로 보는 'framework 적용'에 해당.",
      },
    ],
  },
  "UENG-FREQ-01": {
    engine_uid: "UENG-FREQ-01",
    canonical_name: "Frequency & Distribution Engine",
    korean_name: "빈도·분포 엔진",
    function_statement: "코딩된 단위에서 범주별 빈도·분포·교차표를 산출한다.",
    mechanism: "빈도 집계 및 분포 표현.",
    purpose: "패턴의 정량화.",
    engine_family: "Frequency/Distribution",
    universality_tier: "Tier0",
    promotion_status: "Candidate",
    human_in_the_loop: "none",
    upstream_engines: ["UENG-CLASSIFY-01"],
    downstream_engines: ["UENG-INFER-01"],
    bindings: [
      {
        method_id: "TX-002",
        method_name_ko: "TX-002",
        original_procedure_term: "Analytical & Representational Techniques",
        source_locator: {
          source_id: "SRC-KRIP-2018",
          chapter: "Ch.10 Analytical/Representational Techniques",
          page_range: "PDF p.211–",
          procedure_summary: "코딩 결과에서 빈도·교차분석·시각화 등을 통해 패턴을 정량화.",
          language: "en",
        },
        mapping_rationale: "빈도/분포 산출 = FREQ.",
      },
    ],
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// 2. Method → 이 방법이 실현하는 엔진(전체) 목록 (overview용)
export const UER_METHOD_ENGINES: Record<string, string[]> = {
  "TX-002": [
    "UENG-UNITIZE-01",
    "UENG-SAMPLE-01",
    "UENG-CLASSIFY-01",
    "UENG-CONSOLIDATE-01",
    "UENG-RELIABILITY-01",
    "UENG-FREQ-01",
    "UENG-INFER-01",
    "UENG-VALIDITY-01",
  ],
  "QL-006": [
    "UENG-CLASSIFY-01",
    "UENG-CONSOLIDATE-01",
    "UENG-MEMO-01",
    "UENG-SAMPLE-02",
    "UENG-COMPARE-01",
    "UENG-SATURATE-01",
    "UENG-THEORIZE-01",
  ],
};

// ───────────────────────────────────────────────────────────────────────────────
// 3. Stage → 이 단계가 실현하는 엔진(들) (project-stage용)
//    레지스트리 stage.id 기준. 한 단계가 여러 엔진을 합성할 수 있음.
export interface StageEngineRealization {
  engine_uid: string;
  role: "primary" | "support";
  note?: string;
}
export const UER_STAGE_ENGINES: Record<string, StageEngineRealization[]> = {
  // Content Analysis (Krippendorff 2018)
  "TX-002.s1": [
    { engine_uid: "UENG-INFER-01", role: "support", note: "추론 대상(맥락)을 미리 정의 — INFER-01의 전제." },
  ],
  "TX-002.s2": [
    { engine_uid: "UENG-UNITIZE-01", role: "primary" },
  ],
  "TX-002.s3": [
    { engine_uid: "UENG-SAMPLE-01", role: "primary" },
  ],
  "TX-002.s4": [
    { engine_uid: "UENG-CONSOLIDATE-01", role: "primary", note: "코드북(범주체계) 구성·정련." },
    { engine_uid: "UENG-CLASSIFY-01", role: "support", note: "단위→범주 귀속 코딩 실행." },
  ],
  "TX-002.s5": [
    { engine_uid: "UENG-RELIABILITY-01", role: "primary" },
  ],
  "TX-002.s6": [
    { engine_uid: "UENG-FREQ-01", role: "primary" },
    { engine_uid: "UENG-INFER-01", role: "support", note: "패턴→맥락 추론." },
    { engine_uid: "UENG-VALIDITY-01", role: "support" },
  ],
  // Constructivist GT (Charmaz 2014)
  "QL-006.initial-coding": [
    { engine_uid: "UENG-CLASSIFY-01", role: "primary", note: "gerund 코드 = 분류 기능(구성주의 binding)." },
    { engine_uid: "UENG-COMPARE-01", role: "support", note: "data↔code 비교." },
  ],
  "QL-006.focused-coding": [
    { engine_uid: "UENG-CONSOLIDATE-01", role: "primary" },
    { engine_uid: "UENG-COMPARE-01", role: "support" },
  ],
  "QL-006.memo-writing": [
    { engine_uid: "UENG-MEMO-01", role: "primary" },
  ],
  "QL-006.theoretical-sampling": [
    { engine_uid: "UENG-SAMPLE-02", role: "primary" },
    { engine_uid: "UENG-SATURATE-01", role: "support", note: "표집 종료 시점은 포화 판정으로 결정." },
  ],
  "QL-006.construct-theory": [
    { engine_uid: "UENG-THEORIZE-01", role: "primary" },
    { engine_uid: "UENG-MEMO-01", role: "support", note: "메모 통합으로 이론구성을 정련." },
  ],
};

// ───────────────────────────────────────────────────────────────────────────────
// 4. 헬퍼
export function uerEngineByUid(uid: string): UniversalEngine | undefined {
  return UER_ENGINES[uid];
}

export function uerForMethod(methodId: string): UniversalEngine[] {
  const uids = UER_METHOD_ENGINES[methodId] || [];
  return uids.map((u) => UER_ENGINES[u]).filter(Boolean);
}

export function uerForStage(stageId: string): { engine: UniversalEngine; role: "primary" | "support"; note?: string }[] {
  const realizations = UER_STAGE_ENGINES[stageId] || [];
  return realizations
    .map((r) => ({ engine: UER_ENGINES[r.engine_uid], role: r.role, note: r.note }))
    .filter((x) => !!x.engine);
}

export function bindingForMethod(engine: UniversalEngine, methodId: string): MethodBinding | undefined {
  return engine.bindings.find((b) => b.method_id === methodId);
}

export function hasUERSupport(methodId: string): boolean {
  return !!UER_METHOD_ENGINES[methodId];
}

// Promotion status → 한글 라벨
export const PROMOTION_LABEL: Record<PromotionStatus, string> = {
  Candidate: "후보(1개 방법)",
  Validated: "검증됨(2+ 방법군)",
  Universal: "보편(3+ 방법군)",
  Deprecated: "폐기",
};
export const PROMOTION_COLOR: Record<PromotionStatus, string> = {
  Candidate: "#6b7280",
  Validated: "#0F6E56",
  Universal: "#534AB7",
  Deprecated: "#999",
};
