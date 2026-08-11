/**
 * SRM Taxonomy — Encyclopedia of Survey Research Methods (Lavrakas, 2008; ).
 * 이 파일의 모든 항목은 SRM 표제어(entries)에 근거한다.
 *
 * 표기 규칙: 각 항목의 srm 필드는 SRM의 표제어(headword)를 가리킨다.
 * 근거 인용시 "SRM" 이라는 이름으로만 지칭한다.
 *
 * 카테고리
 *  - QUESTION_TYPES: 문항 유형(16종)
 *  - SURVEY_MODES: 조사 방식(11종)
 *  - SCALES: 척도(9종)
 *  - SAMPLING: 표집(15종)
 *  - BIASES: 오차/편향(14종)
 *  - VARIABLE_TYPES / RESEARCH_DESIGNS / ANALYSES
 *  - STANDARD_PROTOCOL: 16단계 표준 프로토콜
 *  - ENGINE_CHAIN: 자동 연동 엔진 흐름
 *  - PATTERN_LIBRARY: 유형별 문항 패턴(수십가지)
 */

export type SrmItem = {
  id: string;
  label: string;   // KO
  labelEn: string; // EN
  srm: string;     // SRM 표제어 근거
  desc: string;    // KO 요약
};

/* ────────────────── Question Types (16) ────────────────── */
export const QUESTION_TYPES: SrmItem[] = [
  { id: "closed_ended", label: "폐쇄형", labelEn: "Closed-ended", srm: "Closed-Ended Question", desc: "미리 정한 응답범주 중 선택." },
  { id: "open_ended", label: "개방형", labelEn: "Open-ended", srm: "Open-Ended Question", desc: "응답자가 자유서술로 답함." },
  { id: "rating", label: "평정형", labelEn: "Rating", srm: "Rating", desc: "정도·강도를 눈금으로 평가." },
  { id: "ranking", label: "순위형", labelEn: "Ranking", srm: "Ranking", desc: "여러 대안에 순위를 매김." },
  { id: "likert", label: "평정척도(등간형)", labelEn: "Likert Scale", srm: "Likert Scale", desc: "동의–반대의 5·7점 척도." },
  { id: "semantic_differential", label: "의미분별", labelEn: "Semantic Differential", srm: "Semantic Differential Technique", desc: "양극형용사 쌍 사이의 위치 평가." },
  { id: "forced_choice", label: "강제선택", labelEn: "Forced Choice", srm: "Forced Choice", desc: "‘모름/무응답’ 없이 반드시 선택." },
  { id: "paired_comparison", label: "쌍대비교", labelEn: "Paired Comparison", srm: "Paired Comparison Technique", desc: "두 대안씩 반복 비교로 선호 도출." },
  { id: "guttman", label: "거트만", labelEn: "Guttman Scale", srm: "Guttman Scale", desc: "누적성이 있는 단일차원 척도." },
  { id: "vignette", label: "비네트", labelEn: "Vignette", srm: "Vignette Question", desc: "짧은 상황 시나리오에 대한 응답." },
  { id: "behavioral", label: "행동", labelEn: "Behavioral Question", srm: "Behavioral Question", desc: "실제 행동 빈도·유무를 물음." },
  { id: "knowledge", label: "지식", labelEn: "Knowledge Question", srm: "Knowledge Question", desc: "사실 지식 확인." },
  { id: "demographic", label: "인구통계", labelEn: "Demographic Question", srm: "Demographic Measure", desc: "성·연령·소득 등 기본 특성." },
  { id: "contingency", label: "조건분기", labelEn: "Contingency Question", srm: "Contingency Question", desc: "이전 응답에 따라 물음이 갈림." },
  { id: "recall", label: "회상", labelEn: "Recall Question", srm: "Recall", desc: "과거 사건을 기억해 답함." },
  { id: "branching", label: "분기(스킵)", labelEn: "Branching / Skip", srm: "Branching / Skip Pattern", desc: "응답에 따라 다음 문항 경로 결정." },
];

/* ────────────────── Survey Modes (11) ────────────────── */
export const SURVEY_MODES: SrmItem[] = [
  { id: "face_to_face", label: "대면면접", labelEn: "Face-to-face", srm: "Face-to-Face Interviewing", desc: "면접원이 직접 방문·대면." },
  { id: "telephone", label: "전화조사", labelEn: "Telephone Survey", srm: "Telephone Survey", desc: "전화를 통한 면접." },
  { id: "web", label: "웹조사", labelEn: "Web Survey", srm: "Web Survey", desc: "브라우저 기반 자기기입식." },
  { id: "mail", label: "우편조사", labelEn: "Mail Survey", srm: "Mail Survey", desc: "우편 배부·회수." },
  { id: "email", label: "이메일조사", labelEn: "Email Survey", srm: "Email Survey", desc: "이메일 발송형." },
  { id: "mixed_mode", label: "혼합모드", labelEn: "Mixed-mode", srm: "Mixed-Mode Survey", desc: "복수 조사방식을 병행." },
  { id: "cati", label: "CATI", labelEn: "CATI", srm: "Computer-Assisted Telephone Interviewing (CATI)", desc: "컴퓨터 지원 전화면접." },
  { id: "capi", label: "CAPI", labelEn: "CAPI", srm: "Computer-Assisted Personal Interviewing (CAPI)", desc: "컴퓨터 지원 대면면접." },
  { id: "casi", label: "CASI", labelEn: "CASI", srm: "Computer-Assisted Self-Interviewing (CASI)", desc: "응답자가 컴퓨터에 자기기입." },
  { id: "acasi", label: "ACASI", labelEn: "ACASI", srm: "Audio Computer-Assisted Self-Interviewing (ACASI)", desc: "음성 지원 자기기입." },
  { id: "ivr", label: "IVR", labelEn: "IVR", srm: "Interactive Voice Response (IVR)", desc: "자동응답전화로 문항 청취·응답." },
];

/* ────────────────── Scales (9) ────────────────── */
export const SCALES: SrmItem[] = [
  { id: "likert_scale", label: "평정척도(등간형) 척도", labelEn: "Likert Scale", srm: "Likert Scale", desc: "동의 강도 5·7점." },
  { id: "semantic_diff_scale", label: "의미분별 척도", labelEn: "Semantic Differential", srm: "Semantic Differential Technique", desc: "형용사 양극 사이의 위치." },
  { id: "guttman_scale", label: "거트만 척도", labelEn: "Guttman Scale", srm: "Guttman Scale", desc: "누적적 단일차원 척도." },
  { id: "bipolar", label: "양극 척도", labelEn: "Bipolar Scale", srm: "Bipolar Scale", desc: "0 중심으로 대칭적 양극." },
  { id: "thermometer", label: "감정온도계", labelEn: "Feeling Thermometer", srm: "Feeling Thermometer", desc: "0–100 온도로 호감 표현." },
  { id: "thurstone", label: "서스톤 척도", labelEn: "Thurstone Scale", srm: "Thurstone Scaling", desc: "심판단 기반 등간척도." },
  { id: "vas", label: "시각아날로그", labelEn: "Visual Analog Scale", srm: "Visual Analog Scale", desc: "선분 위의 위치로 응답." },
  { id: "nominal", label: "명목", labelEn: "Nominal", srm: "Level of Measurement", desc: "범주형 표시." },
  { id: "ordinal", label: "서열", labelEn: "Ordinal", srm: "Level of Measurement", desc: "순위가 있는 범주." },
];

/* ────────────────── Sampling (15) ────────────────── */
export const SAMPLING: SrmItem[] = [
  { id: "random", label: "단순무작위", labelEn: "Simple Random Sampling", srm: "Simple Random Sample (SRS)", desc: "모든 단위에 동일 추출확률." },
  { id: "stratified", label: "층화표집", labelEn: "Stratified Sampling", srm: "Stratified Sampling", desc: "층별로 나눈 뒤 표집." },
  { id: "cluster", label: "군집표집", labelEn: "Cluster Sampling", srm: "Cluster Sample", desc: "집락 단위로 추출." },
  { id: "snowball", label: "눈덩이", labelEn: "Snowball Sampling", srm: "Snowball Sampling", desc: "응답자 소개로 확대." },
  { id: "purposive", label: "판단표집", labelEn: "Purposive Sampling", srm: "Purposive Sample", desc: "연구자 판단으로 선정." },
  { id: "quota", label: "할당표집", labelEn: "Quota Sampling", srm: "Quota Sampling", desc: "구성비에 맞춘 비확률표집." },
  { id: "pps", label: "PPS", labelEn: "Probability Proportional to Size", srm: "Probability Proportional to Size (PPS) Sampling", desc: "규모비례확률." },
  { id: "multistage", label: "다단계", labelEn: "Multistage Sampling", srm: "Multistage Sampling", desc: "여러 단계로 나눠 표집." },
  { id: "panel", label: "패널", labelEn: "Panel Survey", srm: "Panel Survey", desc: "동일 표본을 반복 조사." },
  { id: "longitudinal", label: "종단조사", labelEn: "Longitudinal Study", srm: "Longitudinal Studies", desc: "시간에 따른 반복 관측." },
  { id: "cross_sectional", label: "횡단조사", labelEn: "Cross-sectional Study", srm: "Cross-Sectional Survey Design", desc: "한 시점 단면 조사." },
  { id: "systematic", label: "체계적", labelEn: "Systematic Sampling", srm: "Systematic Sampling", desc: "일정 간격으로 추출." },
  { id: "convenience", label: "편의표집", labelEn: "Convenience Sampling", srm: "Convenience Sampling", desc: "접근 용이한 단위 표집." },
  { id: "rdd", label: "RDD", labelEn: "Random Digit Dialing", srm: "Random Digit Dialing (RDD)", desc: "무작위 전화번호 발생." },
  { id: "abs", label: "주소기반", labelEn: "Address-Based Sampling", srm: "Address-Based Sampling (ABS)", desc: "주소목록 기반 확률표집." },
];

/* ────────────────── Biases / Errors (14) ────────────────── */
export const BIASES: SrmItem[] = [
  { id: "response_bias", label: "반응편향", labelEn: "Response Bias", srm: "Response Bias", desc: "응답의 체계적 왜곡." },
  { id: "social_desirability", label: "사회적 바람직성", labelEn: "Social Desirability", srm: "Social Desirability", desc: "바람직해 보이는 답으로 편향." },
  { id: "acquiescence", label: "묵종편향", labelEn: "Acquiescence", srm: "Acquiescence Response Bias", desc: "‘동의’쪽으로 치우침." },
  { id: "recall_bias", label: "회상편향", labelEn: "Recall Bias", srm: "Recall / Memory Effects", desc: "기억 왜곡으로 인한 편향." },
  { id: "primacy", label: "초두효과", labelEn: "Primacy Effect", srm: "Primacy Effect", desc: "앞쪽 대안을 더 선택." },
  { id: "recency", label: "최신효과", labelEn: "Recency Effect", srm: "Recency Effect", desc: "뒤쪽 대안을 더 선택." },
  { id: "nonresponse", label: "무응답", labelEn: "Nonresponse Error", srm: "Nonresponse Error", desc: "응답 거부·부재로 인한 편향." },
  { id: "measurement", label: "측정오차", labelEn: "Measurement Error", srm: "Measurement Error", desc: "관측값과 참값 간 오차." },
  { id: "coverage", label: "포괄오차", labelEn: "Coverage Error", srm: "Coverage Error", desc: "표집틀이 모집단을 못 담음." },
  { id: "sampling_error", label: "표집오차", labelEn: "Sampling Error", srm: "Sampling Error", desc: "표본이라 생기는 확률적 오차." },
  { id: "satisficing", label: "만족화", labelEn: "Satisficing", srm: "Satisficing", desc: "성의 없이 대충 응답." },
  { id: "interviewer_effect", label: "면접원효과", labelEn: "Interviewer Effect", srm: "Interviewer Effects", desc: "면접원 특성이 응답에 영향." },
  { id: "question_order", label: "문항순서효과", labelEn: "Question Order Effect", srm: "Question Order Effects", desc: "문항 배열이 응답에 영향." },
  { id: "mode_effect", label: "모드효과", labelEn: "Mode Effect", srm: "Mode Effects", desc: "조사방식이 응답에 미치는 영향." },
];

/* ────────────────── Variable / Design / Analysis ────────────────── */
export const VARIABLE_TYPES: SrmItem[] = [
  { id: "nominal", label: "명목", labelEn: "Nominal", srm: "Level of Measurement", desc: "범주형." },
  { id: "ordinal", label: "서열", labelEn: "Ordinal", srm: "Level of Measurement", desc: "순위형." },
  { id: "interval", label: "등간", labelEn: "Interval", srm: "Level of Measurement", desc: "간격 동일." },
  { id: "ratio", label: "비율", labelEn: "Ratio", srm: "Level of Measurement", desc: "절대0 존재." },
];

export const RESEARCH_DESIGNS: SrmItem[] = [
  { id: "cross_sectional", label: "횡단설계", labelEn: "Cross-Sectional", srm: "Cross-Sectional Survey Design", desc: "한 시점." },
  { id: "longitudinal", label: "종단설계", labelEn: "Longitudinal", srm: "Longitudinal Studies", desc: "시간에 걸친 반복." },
  { id: "panel_design", label: "패널설계", labelEn: "Panel", srm: "Panel Survey", desc: "동일 표본 반복." },
  { id: "trend", label: "추세설계", labelEn: "Trend", srm: "Trend Study", desc: "동일 모집단에서 반복." },
  { id: "cohort", label: "코호트설계", labelEn: "Cohort", srm: "Cohort Study", desc: "동일 코호트 추적." },
];

export const ANALYSES: SrmItem[] = [
  { id: "descriptive", label: "기술통계", labelEn: "Descriptive", srm: "Descriptive Statistics", desc: "빈도·평균·표준편차." },
  { id: "cronbach", label: "Cronbach α", labelEn: "Cronbach's α", srm: "Reliability", desc: "내적 일관성 신뢰도." },
  { id: "efa", label: "EFA", labelEn: "Exploratory Factor Analysis", srm: "Factor Analysis (Exploratory)", desc: "탐색적 요인분석." },
  { id: "cfa", label: "CFA", labelEn: "Confirmatory Factor Analysis", srm: "Factor Analysis (Confirmatory)", desc: "확인적 요인분석." },
  { id: "sem", label: "SEM", labelEn: "Structural Equation Modeling", srm: "Structural Equation Modeling", desc: "구조방정식." },
  { id: "regression", label: "회귀분석", labelEn: "Regression", srm: "Regression Analysis", desc: "관계·예측 분석." },
  { id: "logistic", label: "로지스틱회귀", labelEn: "Logistic Regression", srm: "Logistic Regression", desc: "이분형 종속." },
  { id: "conjoint", label: "컨조인트", labelEn: "Conjoint Analysis", srm: "Conjoint Analysis", desc: "속성별 효용 추정." },
  { id: "cluster_a", label: "QT-004", labelEn: "Cluster Analysis", srm: "Cluster Analysis", desc: "동질집단 도출." },
  { id: "segmentation", label: "시장세분화", labelEn: "Market Segmentation", srm: "Market Research", desc: "세그먼트 도출·해석." },
];

/* ────────────────── Standard Protocol (16 steps) ────────────────── */
export const STANDARD_PROTOCOL: { id: string; label: string; srm: string; desc: string }[] = [
  { id: "purpose", label: "연구목적", srm: "Research Question", desc: "무엇을 왜 알고자 하는가." },
  { id: "question", label: "연구문제", srm: "Research Question", desc: "구체적으로 답할 물음." },
  { id: "measure_var", label: "측정변수", srm: "Variable", desc: "무엇을 측정할지 규정." },
  { id: "construct", label: "구성개념", srm: "Construct Validity", desc: "이론적 개념 정의." },
  { id: "scale_choice", label: "척도선택", srm: "Scale", desc: "적합한 측정 척도 선택." },
  { id: "item_writing", label: "문항작성", srm: "Question Wording", desc: "문항의 어간·용어 확정." },
  { id: "response_design", label: "응답척도설계", srm: "Response Alternatives", desc: "응답 범주·눈금 설계." },
  { id: "branching_step", label: "Branching", srm: "Branching / Skip Pattern", desc: "조건 분기 설계." },
  { id: "pilot", label: "Pilot Test", srm: "Pretest / Pilot Test", desc: "사전조사로 문제점 발견." },
  { id: "reliability", label: "Reliability", srm: "Reliability", desc: "신뢰도(Cronbach α 등)." },
  { id: "validity", label: "Validity", srm: "Validity", desc: "내용·구성·기준타당도." },
  { id: "sampling_step", label: "Sampling", srm: "Sampling", desc: "표집 설계·실행." },
  { id: "admin", label: "Survey Administration", srm: "Survey Administration", desc: "현장 수행·품질통제." },
  { id: "cleaning", label: "Data Cleaning", srm: "Data Cleaning / Editing", desc: "결측·이상값 처리." },
  { id: "analysis", label: "Statistical Analysis", srm: "Data Analysis", desc: "통계 분석 실행." },
  { id: "reporting", label: "Reporting", srm: "Survey Report", desc: "결과 보고·시각화." },
];

/* Engine chain steps */
export const ENGINE_CHAIN = [
  "Survey Type", "Research Purpose", "Respondent", "Sampling",
  "Question Pattern", "Scale", "Branching", "Quality Check",
  "Pilot Test", "Statistical Recommendation", "Visualization", "Interpretation",
];

/* ────────────────── Auto Chain examples (Type → 분석) ────────────────── */
export const AUTO_CHAINS: { key: string; label: string; chain: string[]; srm: string }[] = [
  {
    key: "satisfaction",
    label: "만족도 조사",
    chain: ["만족도 조사", "Likert", "5점", "Cronbach α", "EFA", "CFA", "SEM"],
    srm: "Likert Scale / Reliability / Factor Analysis / SEM",
  },
  {
    key: "brand_pref",
    label: "브랜드 선호도",
    chain: ["브랜드 선호도", "Ranking", "Paired Comparison", "Conjoint", "Cluster", "Market Segmentation"],
    srm: "Ranking / Paired Comparison / Conjoint / Cluster",
  },
  {
    key: "attitude",
    label: "태도 조사",
    chain: ["태도조사", "Likert", "7점", "EFA", "CFA", "회귀분석"],
    srm: "Likert / Factor Analysis / Regression",
  },
  {
    key: "knowledge_test",
    label: "지식 테스트",
    chain: ["지식조사", "Closed-ended", "정답채점", "Cronbach α(KR-20)", "IRT"],
    srm: "Knowledge Question / Reliability / Item Response Theory",
  },
  {
    key: "behavior",
    label: "행동 빈도 조사",
    chain: ["행동조사", "Behavioral", "빈도", "회상편향점검", "로지스틱회귀"],
    srm: "Behavioral Question / Recall / Logistic Regression",
  },
  {
    key: "segmentation",
    label: "세분화 조사",
    chain: ["세분화조사", "Likert", "인구통계", "QT-004", "QT-025", "Segmentation"],
    srm: "Cluster Analysis / Market Segmentation",
  },
];

/* ────────────────── Question Pattern Library (수십 가지) ────────────────── */
export type QuestionPattern = {
  id: string;
  typeId: string;      // QUESTION_TYPES.id
  label: string;
  stem: string;        // {t} = topic placeholder, {p} = scale points
  responses: string;
  srm: string;
};

export const PATTERN_LIBRARY: QuestionPattern[] = [
  // Likert (7)
  { id: "lk1", typeId: "likert", label: "만족도", stem: "귀하는 '{t}'에 대해 얼마나 만족하십니까?", responses: "1=매우 불만족 … {p}=매우 만족", srm: "Likert Scale" },
  { id: "lk2", typeId: "likert", label: "동의도", stem: "'{t}'에 대해 어느 정도 동의하십니까?", responses: "1=매우 반대 … {p}=매우 동의", srm: "Likert Scale" },
  { id: "lk3", typeId: "likert", label: "중요도", stem: "'{t}'은(는) 귀하에게 얼마나 중요합니까?", responses: "1=전혀 중요하지 않음 … {p}=매우 중요함", srm: "Likert Scale" },
  { id: "lk4", typeId: "likert", label: "빈도", stem: "'{t}'을(를) 얼마나 자주 경험하십니까?", responses: "1=전혀 없음 … {p}=매우 자주", srm: "Likert Scale" },
  { id: "lk5", typeId: "likert", label: "가능성", stem: "'{t}'을(를) 앞으로 이용할 가능성은?", responses: "1=전혀 없음 … {p}=매우 높음", srm: "Likert Scale" },
  { id: "lk6", typeId: "likert", label: "추천의향", stem: "'{t}'을(를) 주변에 추천할 의향이 있으십니까?", responses: "1=전혀 없음 … {p}=매우 있음", srm: "Likert Scale / NPS" },
  { id: "lk7", typeId: "likert", label: "신뢰도", stem: "'{t}'의 신뢰성에 대해 어떻게 평가하십니까?", responses: "1=매우 낮음 … {p}=매우 높음", srm: "Likert Scale" },

  // Closed-ended (4)
  { id: "cl1", typeId: "closed_ended", label: "예/아니오", stem: "'{t}'을(를) 최근 1개월 내 이용한 적이 있습니까?", responses: "예 / 아니오", srm: "Closed-Ended Question" },
  { id: "cl2", typeId: "closed_ended", label: "다중선택", stem: "다음 중 '{t}'과(와) 관련해 해당되는 항목을 모두 고르시오.", responses: "다중선택(체크박스)", srm: "Closed-Ended Question" },
  { id: "cl3", typeId: "closed_ended", label: "단일선택", stem: "'{t}'과(와) 가장 관련된 하나를 고르시오.", responses: "단일선택(라디오)", srm: "Closed-Ended Question" },
  { id: "cl4", typeId: "closed_ended", label: "빈도범주", stem: "지난 한 달간 '{t}' 이용 횟수는?", responses: "0 / 1 / 2–3 / 4회 이상", srm: "Closed-Ended Question" },

  // Open-ended (3)
  { id: "op1", typeId: "open_ended", label: "이유서술", stem: "'{t}'에 대한 귀하의 생각과 그 이유를 자유롭게 서술해 주십시오.", responses: "장문 서술", srm: "Open-Ended Question" },
  { id: "op2", typeId: "open_ended", label: "개선요청", stem: "'{t}'에서 개선이 필요한 점을 자유롭게 적어 주십시오.", responses: "장문 서술", srm: "Open-Ended Question" },
  { id: "op3", typeId: "open_ended", label: "인상단어", stem: "'{t}' 하면 떠오르는 단어를 세 개 적어 주십시오.", responses: "단답 3개", srm: "Open-Ended Question" },

  // Rating (3)
  { id: "rt1", typeId: "rating", label: "0-10 평정", stem: "'{t}'을(를) 0~10점으로 평가해 주십시오.", responses: "0~10", srm: "Rating" },
  { id: "rt2", typeId: "rating", label: "성과 평정", stem: "'{t}'의 최근 성과를 평가해 주십시오.", responses: "1~5", srm: "Rating" },
  { id: "rt3", typeId: "rating", label: "품질 평정", stem: "'{t}'의 전반적 품질을 평가해 주십시오.", responses: "1~7", srm: "Rating" },

  // Ranking (3)
  { id: "rk1", typeId: "ranking", label: "중요도 순위", stem: "다음 항목을 '{t}' 관점에서 중요한 순서대로 나열해 주십시오.", responses: "1(가장 중요) … n", srm: "Ranking" },
  { id: "rk2", typeId: "ranking", label: "선호 순위", stem: "'{t}'에 대해 선호하는 순서로 순위를 매겨 주십시오.", responses: "1 … n", srm: "Ranking" },
  { id: "rk3", typeId: "ranking", label: "Top-3", stem: "'{t}'에서 가장 중요한 세 가지를 순서대로 골라 주십시오.", responses: "Top 3", srm: "Ranking" },

  // Semantic Differential (2)
  { id: "sd1", typeId: "semantic_differential", label: "형용사쌍", stem: "'{t}'에 대한 인상을 아래 양극 형용사 사이에서 표시해 주십시오.", responses: "부정 1—7 긍정 등", srm: "Semantic Differential Technique" },
  { id: "sd2", typeId: "semantic_differential", label: "이미지평가", stem: "'{t}'의 이미지를 형용사쌍(구식-현대적/차가움-따뜻함)으로 평가해 주십시오.", responses: "7단계", srm: "Semantic Differential Technique" },

  // Forced choice (2)
  { id: "fc1", typeId: "forced_choice", label: "양자택일", stem: "'{t}'에 대해 반드시 하나를 선택해 주십시오.", responses: "A / B (모름 없음)", srm: "Forced Choice" },
  { id: "fc2", typeId: "forced_choice", label: "성향선택", stem: "'{t}' 관련해 자신과 더 가까운 진술을 하나 고르십시오.", responses: "진술1 / 진술2", srm: "Forced Choice" },

  // Paired comparison (2)
  { id: "pc1", typeId: "paired_comparison", label: "두 대안 비교", stem: "'{t}'의 두 대안 중 더 선호하는 것을 고르시오.", responses: "A / B (반복)", srm: "Paired Comparison Technique" },
  { id: "pc2", typeId: "paired_comparison", label: "특성 쌍대비교", stem: "'{t}'의 두 속성 중 더 중요한 것을 고르시오.", responses: "속성1 / 속성2", srm: "Paired Comparison Technique" },

  // Guttman (1)
  { id: "gt1", typeId: "guttman", label: "누적 동의", stem: "'{t}' 관련 다음 진술 중 동의하는 것을 모두 고르시오(강도 순 배열).", responses: "누적 체크", srm: "Guttman Scale" },

  // Vignette (2)
  { id: "vg1", typeId: "vignette", label: "상황 시나리오", stem: "다음 상황을 읽고 '{t}'에 대해 어떻게 반응할지 응답해 주십시오.", responses: "선다형/서술형", srm: "Vignette Question" },
  { id: "vg2", typeId: "vignette", label: "윤리 딜레마", stem: "다음 상황에서 '{t}' 결정은 얼마나 정당한가?", responses: "1=매우 부당 … 7=매우 정당", srm: "Vignette Question" },

  // Behavioral (3)
  { id: "bh1", typeId: "behavioral", label: "행동 유무", stem: "지난 한 달간 '{t}'을(를) 한 적이 있습니까?", responses: "예/아니오", srm: "Behavioral Question" },
  { id: "bh2", typeId: "behavioral", label: "행동 빈도", stem: "지난 한 달간 '{t}' 횟수는?", responses: "0/1/2–3/4회 이상", srm: "Behavioral Question" },
  { id: "bh3", typeId: "behavioral", label: "지속시간", stem: "'{t}'에 하루 평균 얼마의 시간을 씁니까?", responses: "분 단위 서술", srm: "Behavioral Question" },

  // Knowledge (2)
  { id: "kn1", typeId: "knowledge", label: "사실 확인", stem: "'{t}'에 대한 다음 진술은 참·거짓 중 어느 것입니까?", responses: "참/거짓/모름", srm: "Knowledge Question" },
  { id: "kn2", typeId: "knowledge", label: "핵심 정의", stem: "'{t}'의 핵심 정의로 가장 옳은 것은?", responses: "선다형", srm: "Knowledge Question" },

  // Demographic (5)
  { id: "dm1", typeId: "demographic", label: "성별", stem: "귀하의 성별은?", responses: "남 / 여 / 기타 / 응답거부", srm: "Demographic Measure" },
  { id: "dm2", typeId: "demographic", label: "연령대", stem: "귀하의 연령대는?", responses: "10대/20대/30대/40대/50대/60대 이상", srm: "Demographic Measure" },
  { id: "dm3", typeId: "demographic", label: "학력", stem: "귀하의 최종 학력은?", responses: "중졸이하/고졸/대재/대졸/대학원 이상", srm: "Demographic Measure" },
  { id: "dm4", typeId: "demographic", label: "소득", stem: "귀하의 월평균 가구소득은?", responses: "구간 6단계", srm: "Demographic Measure" },
  { id: "dm5", typeId: "demographic", label: "지역", stem: "귀하의 거주 지역은?", responses: "시·도 단위", srm: "Demographic Measure" },

  // Contingency (2)
  { id: "cn1", typeId: "contingency", label: "필터 → 상세", stem: "(앞 문항이 ‘예’인 경우) '{t}' 이용 시 주요 목적은 무엇입니까?", responses: "선다형", srm: "Contingency Question" },
  { id: "cn2", typeId: "contingency", label: "필터 → 이유", stem: "(앞 문항이 ‘아니오’인 경우) '{t}'을(를) 이용하지 않은 이유는?", responses: "선다형/서술", srm: "Contingency Question" },

  // Recall (2)
  { id: "rc1", typeId: "recall", label: "최근 경험", stem: "가장 최근에 '{t}'을(를) 이용한 시점은 언제였습니까?", responses: "일/주/월/년", srm: "Recall" },
  { id: "rc2", typeId: "recall", label: "누적 경험", stem: "지금까지 '{t}'을(를) 경험한 총 횟수는?", responses: "0/1–2/3–5/6회 이상", srm: "Recall" },

  // Branching (1)
  { id: "br1", typeId: "branching", label: "분기 문항", stem: "'{t}'을(를) 이용한 적이 있습니까? (예 → Q다음, 아니오 → Q종료)", responses: "예/아니오 + 스킵", srm: "Branching / Skip Pattern" },
];
