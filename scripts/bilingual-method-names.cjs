/**
 * Build bilingual method titles: 한국어(English)
 * Updates public/method-catalog.json name_ko for all 137 methods.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const catPath = path.join(root, "public", "method-catalog.json");
const regPath = path.join(root, "public", "registry.json");
const cat = JSON.parse(fs.readFileSync(catPath, "utf8"));
const reg = JSON.parse(fs.readFileSync(regPath, "utf8"));
const regById = Object.fromEntries(reg.methods.map((m) => [m.id, m]));

/** Explicit bilingual titles — preferred over heuristics */
const EXPLICIT = {
  ipa_해석적현상학적분석_smith_2e: "해석적 현상학적 분석(Interpretative Phenomenological Analysis, IPA)",
  spss통계: "SPSS 통계(SPSS Statistics)",
  "concept-analysis": "개념분석(Concept Analysis)",
  "disciplinary-power-analysis": "규율권력 분석(Disciplinary Power Analysis)",
  "critical-theory": "비판이론(Critical Theory)",
  공공정책분석: "공공정책분석(Public Policy Analysis)",
  공공프로그램_평가_langbein: "공공프로그램 평가(Public Program Evaluation)",
  관찰기법_구조에서비구조까지: "관찰기법(Observation Methods)",
  교육설계연구: "교육설계연구(Educational Design Research)",
  "causal-comparative-research": "인과비교연구(Causal-Comparative Research)",
  "oral-history": "구술사(Oral History)",
  구조방정식모델링_kline: "구조방정식모델링(Structural Equation Modeling)",
  "constructivist-grounded-theory": "구축적 근거이론(Constructivist Grounded Theory)",
  군집분석: "군집분석(Cluster Analysis)",
  "critical-review": "비판적 문헌평가(Critical Review / EBM)",
  근거이론2세대: "근거이론 2세대(Second Generation Grounded Theory)",
  "straussian-grounded-theory": "스트라우스 근거이론(Straussian Grounded Theory)",
  근거이론질적연구: "근거이론 질적연구(Grounded Theory Qualitative Research)",
  "rapid-review": "신속검토(Rapid Review)",
  "documentary-research": "문헌(기록물) 연구(Documentary Research)",
  "fundamental-statistics": "기초통계(Fundamentals of Statistics)",
  "quantitative-content-analysis": "양적 내용분석(Quantitative Content Analysis)",
  "content-analysis": "내용분석(Content Analysis)",
  netnography: "넷노그래피(Netnography)",
  다변량통계분석: "다변량통계분석(Multivariate Statistical Analysis)",
  다차원척도: "다차원척도(Multidimensional Scaling)",
  "discourse-analysis": "담화분석(Discourse Analysis)",
  대체로무해한계량경제학: "대체로 무해한 계량경제학(Mostly Harmless Econometrics)",
  델파이방법: "델파이방법(Delphi Method)",
  "digital-ethnography": "디지털 민족지학(Digital Ethnography)",
  딥러닝: "딥러닝(Deep Learning)",
  "scientometric-analysis": "계량과학분석(Scientometric Analysis)",
  마스터링메트릭스: "마스터링 메트릭스(Mastering 'Metrics)",
  매개조절분석입문: "매개·조절분석 입문(Introduction to Mediation, Moderation, and Conditional Process Analysis)",
  "meta-ethnography": "메타민족지학(Meta-ethnography)",
  "meta-analysis": "메타분석(Meta-analysis)",
  "traditional-review": "전통적 문헌고찰(Traditional Literature Review)",
  "narrative-review": "서사적 문헌고찰(Narrative Review)",
  문화와조직_hofstede_cultures_and_organizations: "문화와 조직(Cultures and Organizations)",
  민족지_실천원리_hammersley_atkinson_ethnography_3e: "민족지 실천원리(Ethnography: Principles in Practice)",
  민족지_필드노트쓰기_emerson_fretz_shaw_2e: "민족지 필드노트 쓰기(Writing Ethnographic Fieldnotes)",
  autoethnography: "자문화기술지(Autoethnography)",
  민주주의의_유형: "민주주의의 유형(Patterns of Democracy)",
  "counterfactual-causal-inference": "반사실 인과추론(Counterfactual Causal Inference)",
  "categorical-data-analysis": "범주형 자료분석(Categorical Data Analysis)",
  베이지안데이터분석: "베이지안 데이터분석(Bayesian Data Analysis)",
  분석적계층화과정_ahp_saaty_1990: "분석적 계층화 과정(Analytic Hierarchy Process, AHP)",
  비교방법_ragin_2014: "비교방법(The Comparative Method)",
  비교사사분석: "비교사사분석(Comparative Historical Analysis)",
  "cost-benefit-analysis": "비용편익분석(Cost-Benefit Analysis)",
  비즈니스다이내믹스: "비즈니스 다이내믹스(Business Dynamics)",
  "critical-ethnography": "비판민족지학(Critical Ethnography)",
  "critical-discourse-analysis": "비판적 담화분석(Critical Discourse Analysis)",
  비판적참여_실행연구_kemmis_mctaggart_nixon_2014: "비판적 참여 실행연구(Critical Participatory Action Research)",
  "case-study-yin": "사례연구(Case Study Research)",
  "case-study-stake": "사례연구의 예술(The Art of Case Study Research)",
  사회과학_통계방법_agresti_finlay_5e: "사회과학 통계방법(Statistical Methods for the Social Sciences)",
  "social-science-statistics": "사회과학 통계분석(Social Science Statistics)",
  사회과학연구설계: "사회과학 연구설계(Designing Social Inquiry)",
  "social-network-analysis": "사회연결망분석(Social Network Analysis)",
  삶의경험연구_vanmanen: "삶의 경험 연구(Researching Lived Experience)",
  "symbolic-interactionism": "상징적 상호작용론(Symbolic Interactionism)",
  "interaction-order-analysis": "상호작용 질서 분석(Interaction Order Analysis)",
  "life-history": "생애사 방법(Life History Method)",
  "narrative-analysis": "서사 분석(Narrative Analysis)",
  "narrative-inquiry": "서사 탐구(Narrative Inquiry)",
  서술현상학: "서술현상학(Descriptive Phenomenology)",
  "classic-ethnography": "고전 민족지(Classic Ethnography)",
  "husserlian-phenomenology": "후설 순수현상학(Husserlian Pure Phenomenology)",
  "visual-ethnography": "시각민족지학(Visual Ethnography)",
  "market-survey": "시장 설문조사(Market Survey / Marketing Research)",
  "foucauldian-analysis": "푸코적 분석(Foucauldian Analysis)",
  "design-of-experiments": "실험계획법(Design of Experiments)",
  여론_lippmann: "여론(Public Opinion)",
  "historical-sociology": "역사사회학(Historical Sociology)",
  "historical-hermeneutics": "역사 해석학(Historical Hermeneutics)",
  "historical-method": "역사방법(Historical Method)",
  "umbrella-review": "엄브렐러 리뷰(Umbrella Review)",
  "impact-evaluation": "영향평가 실무(Impact Evaluation in Practice)",
  음성언어처리_jurafsky_martin_2e: "음성·언어처리(Speech and Language Processing)",
  "predictive-modeling": "예측 모델링(Predictive Modeling)",
  "applied-linear-models": "선형통계모형(Applied Linear Statistical Models)",
  "medical-statistics": "의학통계(Medical Statistics)",
  "classic-grounded-theory": "고전(글레이저) 근거이론(Classic Glaserian Grounded Theory)",
  인공사회_sugarscape_epstein_axtell: "인공사회(Artificial Societies / Sugarscape)",
  인공지능현대적접근: "인공지능: 현대적 접근(Artificial Intelligence: A Modern Approach)",
  인과추론믹스테이프: "인과추론 믹스테이프(Causal Inference: The Mixtape)",
  "citation-analysis": "인용분석(Citation Analysis)",
  인터뷰_질적연구기술: "인터뷰(InterViews: Learning the Craft of Qualitative Research Interviewing)",
  임상시험의기초: "임상시험의 기초(Fundamentals of Clinical Trials)",
  자연주의적탐구: "자연주의적 탐구(Naturalistic Inquiry)",
  잠재계층_잠재전환분석: "잠재계층·잠재전환 분석(Latent Class / Latent Transition Analysis)",
  잠재변수모델링r: "R 잠재변수모델링(Latent Variable Modeling Using R)",
  적용_로지스틱_회귀: "적용 로지스틱 회귀(Applied Logistic Regression)",
  "information-retrieval": "정보검색(Information Retrieval)",
  정보기반통계의사결정: "정보기반 통계의사결정(Statistics: Informed Decisions Using Data)",
  "sentiment-analysis": "감성분석(Sentiment Analysis)",
  "longitudinal-study": "종단연구(Longitudinal Study)",
  "quasi-experimentation": "준실험(Quasi-Experimentation)",
  지각의_현상학: "지각의 현상학(Phenomenology of Perception)",
  "intellectual-history": "지적사(Intellectual History)",
  "philosophical-hermeneutics": "철학적 해석학(Philosophical Hermeneutics)",
  "qualitative-content-analysis": "질적 내용분석(Qualitative Content Analysis)",
  질적_연구_인터뷰_wengraf: "질적 연구 인터뷰(Qualitative Research Interviewing)",
  질적_탐구_연구설계_creswell_poth: "질적 탐구·연구 설계(Qualitative Inquiry and Research Design)",
  "meta-synthesis": "질적 메타종합(Meta-synthesis)",
  질적인터뷰: "질적 인터뷰(Interviewing as Qualitative Research)",
  참여관찰_민족지기법: "참여관찰(Participant Observation)",
  "ordinary-language-analysis": "일상언어 분석(Ordinary Language Analysis)",
  "systematic-review": "체계적 문헌고찰(Systematic Review)",
  "corpus-linguistics": "코퍼스 언어학(Corpus Linguistics)",
  "cohort-study": "코호트 연구(Cohort Study)",
  탐색적요인분석: "탐색적 요인분석(Exploratory Factor Analysis)",
  텍스트마이닝_r_silge_robinson_2017: "텍스트 마이닝(Text Mining with R)",
  "text-machine-learning": "텍스트 머신러닝(Machine Learning for Text)",
  "keyness-analysis": "키워드성 분석(Keyness Analysis)",
  통계적nlp: "통계적 NLP(Foundations of Statistical Natural Language Processing)",
  통계학습요소_esl_hastie_2e: "통계적 학습의 요소(The Elements of Statistical Learning)",
  "scoping-review": "스코핑 리뷰(Scoping Review)",
  판별분석: "판별분석(Discriminant Analysis)",
  "panel-data-econometrics": "패널 데이터 계량경제학(Panel Data Econometrics)",
  패턴인식_기계학습: "패턴인식과 기계학습(Pattern Recognition and Machine Learning)",
  포커스그룹: "포커스그룹(Focus Groups)",
  "program-evaluation": "프로그램 평가(Program Evaluation)",
  "process-tracing": "프로세스 추적(Process Tracing)",
  "interpretive-interactionism": "해석적 상호작용주의(Interpretive Interactionism)",
  행동연구: "행동연구(Action Research)",
  행동연구로_학교개선: "행동연구로 학교 개선(Guiding School Improvement with Action Research)",
  "q-methodology": "Q 방법론(Q Methodology)",
  현상학적_연구방법: "현상학적 연구방법(Phenomenological Research Methods)",
  "field-experiments": "현장실험(Field Experiments)",
  "mixed-methods-research": "혼합연구방법(Mixed Methods Research)",
  "topic-modeling": "토픽 모델링(Topic Modeling)",
  확인적요인분석: "확인적 요인분석(Confirmatory Factor Analysis)",
  "utilization-focused-evaluation": "활용중심평가(Utilization-Focused Evaluation)",
  "conversation-analysis": "회화분석(Conversation Analysis)",
  "survey-research": "조사연구(Survey Research)",
};

function alreadyBilingual(s) {
  return /[가-힣].*\([A-Za-z]/.test(s || "");
}

function stripAuthorParen(en) {
  if (!en) return "";
  // Keep method name; drop trailing author-only hints that are not the English method title
  return String(en).trim();
}

function looksEnglishTitle(s) {
  if (!s) return false;
  const t = String(s).trim();
  if (!/[A-Za-z]/.test(t)) return false;
  // family/category hints — not titles
  if (/계열|평가|통계|방법|연구|면접|설계|분석\/|ML\/|인과|비교|문화|현상학|실습|보조|이론/.test(t) && !/^[A-Za-z]/.test(t)) return false;
  if (/^(질적|양적|정책|사회|다변량|시스템|전문가|실행|참여|텍스트|여론)/.test(t)) return false;
  return /[A-Za-z]{3,}/.test(t);
}

function pickEnglish(e, rm) {
  if (rm?.name && looksEnglishTitle(rm.name)) return stripAuthorParen(rm.name);
  if (e.name_hint && looksEnglishTitle(e.name_hint)) return stripAuthorParen(e.name_hint);
  return "";
}

function pickKorean(e, rm) {
  const ko = (e.name_ko || rm?.name_ko || "").trim();
  if (ko && /[가-힣]/.test(ko)) {
    // strip existing english paren to rebuild cleanly
    return ko.replace(/\s*\([^)]*[A-Za-z][^)]*\)\s*$/, "").trim() || ko;
  }
  // English-only name_ko like IPA — leave empty so EXPLICIT/english path handles
  return "";
}

function formatTitle(e) {
  if (EXPLICIT[e.methodId]) return EXPLICIT[e.methodId];
  const rm = regById[e.methodId];
  if (alreadyBilingual(e.name_ko)) return e.name_ko;
  const ko = pickKorean(e, rm);
  const en = pickEnglish(e, rm);
  if (ko && en) {
    // avoid 한국어(한국어) or duplicate
    if (en === ko || en.includes(ko)) return ko.includes("(") ? ko : `${ko}(${en})`;
    return `${ko}(${en})`;
  }
  if (ko) return ko;
  if (en) return en;
  return e.name_ko || e.methodId;
}

let updated = 0;
for (const e of cat.methods) {
  const next = formatTitle(e);
  if (e.name_ko !== next) {
    e.name_ko = next;
    updated++;
  }
}

fs.writeFileSync(catPath, JSON.stringify(cat, null, 1) + "\n", "utf8");
console.log(`Updated ${updated}/${cat.methods.length} name_ko entries`);
cat.methods.slice(0, 15).forEach((m) => console.log(" -", m.name_ko));
console.log("...");
cat.methods.slice(-5).forEach((m) => console.log(" -", m.name_ko));
