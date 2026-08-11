import type { SsTechnique } from "./ss-stats-guide";

export interface GlossItem {
  term: string;
  def: string;
}

/** 용어 풀 — 초보자가 바로 이해하도록 쉬운 예시 포함 (중복 키 없음) */
export const SS_TERM_POOL: Record<string, GlossItem> = {
  "빈도(Frequency)": {
    term: "빈도(Frequency)",
    def: "그 답이 몇 번 나왔는지 ‘횟수’입니다. 예: 설문 10명 중 남성이 5명이면 빈도=5.",
  },
  "비율(%)": {
    term: "비율(%)",
    def: "전체 중 몇 %인지입니다. 예: 5/10=50%. ‘전체 대비 비중’을 볼 때 씁니다.",
  },
  "누적%(Cumulative %)": {
    term: "누적%(Cumulative %)",
    def: "위에서부터 비율을 더해 간 값입니다. 예: 초졸 10%+중졸 20%=누적 30%(중졸 이하).",
  },
  "교차표(Crosstab)": {
    term: "교차표(Crosstab)",
    def: "두 질문을 겹친 표입니다. 예: 성별×지역 → ‘남·수도권’ 칸에 몇 명인지 봅니다.",
  },
  "행·열 %": {
    term: "행·열 %",
    def: "행%=그 행(예: 남성) 안에서의 비율, 열%=그 열(예: 수도권) 안에서의 비율입니다.",
  },
  "관측빈도": {
    term: "관측빈도",
    def: "실제로 센 칸의 사람 수입니다. 기대빈도와 비교해 ‘예상보다 많은지’를 봅니다.",
  },
  "산술평균(Mean)": {
    term: "산술평균(Mean)",
    def: "모두 더해 개수로 나눈 값. 예: (4+5+3)/3=4. 아주 큰/작은 값에 잘 끌립니다.",
  },
  "조화평균": {
    term: "조화평균(Harmonic mean)",
    def: "비율·속도처럼 ‘역수’가 중요한 값의 평균입니다. 예: 왕복 평균 속력 계산.",
  },
  "기하평균": {
    term: "기하평균(Geometric mean)",
    def: "성장률·배수처럼 곱으로 변하는 값의 평균입니다. 예: 해마다 1.1배·1.2배일 때.",
  },
  "중앙값(Median)": {
    term: "중앙값(Median)",
    def: "줄 세웠을 때 가운데 값. 소득처럼 한쪽으로 치우친 자료에 평균보다 유리합니다.",
  },
  "최빈값(Mode)": {
    term: "최빈값(Mode)",
    def: "가장 많이 나온 값. 예: 혈액형 A가 가장 많으면 최빈값=A.",
  },
  "범위(Range)": {
    term: "범위(Range)",
    def: "최댓값−최솟값. 예: 점수 90−68=22. 퍼짐의 가장 단순한 지표입니다.",
  },
  "사분위범위(IQR)": {
    term: "사분위범위(IQR)",
    def: "중간 50%의 폭(Q3−Q1). 이상치에 덜 민감해 ‘전형적인 퍼짐’을 봅니다.",
  },
  "분산(Variance)": {
    term: "분산(Variance)",
    def: "평균에서 떨어진 정도를 제곱해 평균 낸 값. 단위가 제곱이라 해석은 SD가 더 쉽습니다.",
  },
  "표준편차(SD)": {
    term: "표준편차(SD)",
    def: "평균에서 얼마나 퍼졌는지. SD가 크면 응답이 제각각입니다. 예: 만족도 SD=1.2.",
  },
  "변동계수(CV)": {
    term: "변동계수(CV)",
    def: "SD÷평균. 단위가 다른 변수(키 vs 몸무게)의 상대 산포를 비교할 때 씁니다.",
  },
  "사분위수(Q1·Q2·Q3)": {
    term: "사분위수(Q1·Q2·Q3)",
    def: "전체를 4등분한 위치. Q1=하위 25%, Q2=중앙값, Q3=상위 25% 경계입니다.",
  },
  "백분위수(Percentile)": {
    term: "백분위수(Percentile)",
    def: "전체를 100등분한 위치. 예: 90백분위=상위 10%가 시작되는 점수.",
  },
  "Z점수(Z-score)": {
    term: "Z점수(Z-score)",
    def: "Z=(값−평균)/SD. +1이면 평균보다 SD 하나만큼 위. 서로 다른 척도를 비교할 때 씁니다.",
  },
  "왜도(Skewness)": {
    term: "왜도(Skewness)",
    def: "분포가 한쪽으로 기운 정도. |2| 넘으면(엄격) 평균만 믿지 말고 중앙값도 보세요.",
  },
  "첨도(Kurtosis)": {
    term: "첨도(Kurtosis)",
    def: "봉우리가 뾰족한지·꼬리가 두꺼운지. 꼬리가 두꺼우면 극단값이 많을 수 있습니다.",
  },
  "표본크기(N)": {
    term: "표본크기(N)·유효 N",
    def: "분석에 들어간 사람(관측) 수. 결측을 빼면 유효 N(Valid N)이 줄어듭니다.",
  },
  "결측치(Missing)": {
    term: "결측치(Missing %)",
    def: "답이 비어 있는 칸의 비율. 예: 10명 중 1명 빈칸 → 결측 10%. 처리 규칙을 미리 정하세요.",
  },
  "표준오차(SE)": {
    term: "표준오차(SE Mean)",
    def: "표본평균이 얼마나 흔들리는지. SE=SD/√N. N이 클수록 SE는 작아집니다.",
  },
  "신뢰구간(CI)": {
    term: "95% 신뢰구간(CI)",
    def: "모수가 있을 법한 구간. 예: 95% CI 70~75점이면 ‘진짜 평균이 이 안에 있을 가능성’을 말합니다.",
  },
  "Descriptive 종합": {
    term: "Descriptive 종합",
    def: "빈도·평균·산포·분포 표를 한 세트로 모아 보고하는 단계입니다. 표·그래프 번호를 맞춥니다.",
  },
  "Shapiro-Wilk": {
    term: "Shapiro-Wilk / K-S",
    def: "정규성 검정 이름. p>.05이면 ‘정규 가정 OK’로 자주 해석합니다(표본이 작으면 Shapiro).",
  },
  "Q-Q plot": {
    term: "Q-Q plot",
    def: "내 자료 분위수 vs 정규분포 분위수 그림. 점들이 직선에 가까우면 정규에 가깝습니다.",
  },
  "왜도·첨도 기준": {
    term: "왜도·첨도 기준(±2/±3)",
    def: "|왜도·첨도|가 ±2 안이면 엄격히, ±3 안이면 관대히 ‘정규에 가깝다’고 보는 경험 규칙입니다.",
  },
  "Levene": {
    term: "Levene / Bartlett",
    def: "등분산 검정. p>.05이면 집단 간 퍼짐이 비슷하다고 봅니다. 깨지면 Welch t 등을 검토합니다.",
  },
  "등분산성": {
    term: "등분산성(Homogeneity)",
    def: "비교 집단의 퍼짐(SD)이 비슷한지. t·ANOVA 전에 자주 확인합니다.",
  },
  "잔차 vs 적합값": {
    term: "잔차 vs 적합값(Residual vs fitted)",
    def: "예측값(가로)과 남은 오차(세로) 산점도. 무패턴(고른 구름)이면 등분산에 유리합니다.",
  },
  "Boxplot": {
    term: "Boxplot / Z(±3)",
    def: "상자그림 바깥 점이나 |Z|>3인 값을 극단값 후보로 봅니다. 입력 오류인지 먼저 확인하세요.",
  },
  "Mahalanobis": {
    term: "Mahalanobis 거리",
    def: "여러 변수를 동시에 봤을 때 ‘얼마나 튀는지’. χ² 임계값을 넘으면 다변량 이상치 후보입니다.",
  },
  "Cook's D": {
    term: "Cook's Distance",
    def: "회귀에서 ‘이 한 명이 결과를 얼마나 흔드는지’. 크면 영향점으로 따로 검토합니다.",
  },
  "상관행렬": {
    term: "상관행렬(Correlation Matrix)",
    def: "변수 쌍마다 상관(r, −1~+1)을 표로 모은 것. |r|>.8~.9이면 다중공선성 의심입니다.",
  },
  "VIF": {
    term: "VIF / Tolerance",
    def: "회귀에서 설명력이 겹치는 정도. VIF>10 또는 공차(Tol)<.1이면 변수 겹침을 의심합니다.",
  },
  "Cronbach's α": {
    term: "Cronbach's α",
    def: "설문 문항이 같은 개념을 재는지. 보통 α>.7이면 ‘양호’로 봅니다.",
  },
  "ITC": {
    term: "문항-총점 상관(ITC)",
    def: "한 문항과 나머지 총점의 상관. .3 미만이면 그 문항이 척도와 안 맞을 수 있습니다.",
  },
  "EFA": {
    term: "EFA(탐색적 요인분석)",
    def: "문항이 몇 개 ‘잠재 개념’으로 묶이는지 탐색합니다. 적재량·요인 수를 봅니다.",
  },
  "CFA": {
    term: "CFA(확인적 요인분석)",
    def: "미리 정한 요인 구조가 자료에 맞는지 검증합니다. CFI·RMSEA 등 적합도 지수를 봅니다.",
  },
  "Durbin-Watson": {
    term: "Durbin-Watson(DW)",
    def: "잔차가 이웃끼리 닮아 있는지(자기상관). DW≈2이면 독립에 가깝다고 봅니다.",
  },
  "Mauchly": {
    term: "Mauchly 구형성",
    def: "반복측정에서 시점 쌍의 분산이 비슷한지. p>.05면 구형성 OK, 깨지면 자유도 보정.",
  },
  "t-검정": {
    term: "t-검정(t-test)",
    def: "두 집단 평균 차이가 ‘우연’인지 묻습니다. 예: 남녀 만족도 평균 비교.",
  },
  "t·df": {
    term: "t값 · 자유도(df)",
    def: "t는 차이 크기(표준화), df는 분포의 ‘여유’. 표에 t(df)=2.31처럼 적습니다.",
  },
  "Cohen's d": {
    term: "Cohen's d",
    def: "평균 차이의 효과 크기. 대략 |d|≈0.2 작음, 0.5 중간, 0.8 큼으로 읽습니다.",
  },
  "ANOVA": {
    term: "One-way ANOVA",
    def: "집단 3개 이상 평균을 한 번에 비교. F가 크고 p가 작으면 ‘어딘가 다르다’는 신호입니다.",
  },
  "F·η²": {
    term: "F값 · η²(에타제곱)",
    def: "F는 집단 간/내 분산 비. η²는 집단 차이가 전체 변동의 몇 %를 설명하는지(효과 크기).",
  },
  "Tukey": {
    term: "Tukey / Bonferroni",
    def: "ANOVA 후 ‘어느 쌍이 다른지’ 보는 사후검정. 여러 번 비교할 때 오류를 보정합니다.",
  },
  "회귀": {
    term: "회귀(Regression)",
    def: "X로 Y를 예측·설명. 예: 교육년수 → 소득만족. β·R²·SE를 함께 봅니다.",
  },
  "β·R²": {
    term: "β · R² · SE",
    def: "β=X가 1 늘 때 Y 변화, R²=설명력(%), SE=계수 추정의 흔들림입니다.",
  },
  "카이제곱": {
    term: "카이제곱(χ²)",
    def: "범주×범주 연관성. 예: 흡연×질병. χ²·df·p와 함께 Cramér's V(효과 크기)를 봅니다.",
  },
  "Cramér's V": {
    term: "Cramér's V",
    def: "카이제곱의 효과 크기(0~1). 연관이 ‘얼마나 센지’를 숫자로 말합니다.",
  },
  "ANCOVA": {
    term: "ANCOVA",
    def: "공변량(예: 사전점수)을 통제한 뒤 집단 평균을 비교. 수정평균(Adjusted Mean)을 봅니다.",
  },
  "기울기 동질성": {
    term: "기울기 동질성",
    def: "공변량과 종속변수의 관계가 집단마다 비슷한지. 깨지면 ANCOVA 해석이 어려워집니다.",
  },
  "MANOVA": {
    term: "MANOVA",
    def: "종속변수가 여러 개일 때 집단 차이를 한 번에 봅니다. Wilks' Λ·Pillai 등을 봅니다.",
  },
  "Wilks' Λ": {
    term: "Wilks' Λ · Pillai",
    def: "다변량 검정 통계량. 유의하면 후속으로 단변량 ANOVA를 계획합니다.",
  },
  "로지스틱": {
    term: "이진 로지스틱(Binary Logistic)",
    def: "예/아니오 결과를 예측. OR(승산비)·Wald·p로 ‘몇 배 더 가능성’을 말합니다.",
  },
  "OR·Wald": {
    term: "OR · Wald",
    def: "OR=2이면 그 조건에서 발생 가능성이 약 두 배. Wald로 계수가 0인지 검정합니다.",
  },
  "SEM": {
    term: "SEM(구조방정식)",
    def: "잠재변수와 경로를 한 모형으로 검증. 측정모형→구조모형 순으로 적합도를 봅니다.",
  },
  "CFI·RMSEA": {
    term: "CFI · RMSEA · SRMR",
    def: "모형 적합도 지수. 흔히 CFI≥.95, RMSEA≤.06, SRMR≤.08이면 ‘괜찮은 적합’으로 봅니다.",
  },
  "HLM": {
    term: "HLM / Mixed(다층모형)",
    def: "학교·반처럼 중첩된 자료. ‘같은 집단끼리 닮음’을 반영해 분석합니다.",
  },
  "ICC": {
    term: "ICC(급내상관)",
    def: "같은 집단(반·학교) 안 사람들이 얼마나 비슷한지. ICC가 크면 다층모형이 더 필요합니다.",
  },
  "Inferential 종합": {
    term: "Inferential 종합",
    def: "검정·효과크기·CI를 한데 모아 보고하고, 인과·표본·가정 한계를 적는 단계입니다.",
  },
  "유의확률(p)": {
    term: "유의확률(p)",
    def: "‘효과가 없다’는 가정 하에서 이런 결과가 나올 법한 정도. 작을수록 우연만으로 설명하기 어렵습니다.",
  },
  "효과크기": {
    term: "효과크기",
    def: "차이가 ‘얼마나 큰지’. p만 보지 말고 d, η², OR, V 등을 함께 보고합니다.",
  },
};

type TermKey = keyof typeof SS_TERM_POOL;

/** 33단계(기초 1–11 · 가정 12–22 · 추론 23–33)별 용어 키 — 중복 없이 해당 단계에만 배정 */
export const SS_STAGE33_TERM_KEYS: TermKey[][] = [
  // 1 빈도
  ["빈도(Frequency)", "비율(%)", "누적%(Cumulative %)", "유의확률(p)"],
  // 2 교차표
  ["교차표(Crosstab)", "행·열 %", "관측빈도", "카이제곱"],
  // 3 산술·특수평균
  ["산술평균(Mean)", "조화평균", "기하평균", "표준오차(SE)"],
  // 4 중앙·최빈
  ["중앙값(Median)", "최빈값(Mode)", "사분위수(Q1·Q2·Q3)"],
  // 5 산포
  ["범위(Range)", "사분위범위(IQR)", "분산(Variance)", "표준편차(SD)", "변동계수(CV)"],
  // 6 사분위·백분위
  ["사분위수(Q1·Q2·Q3)", "백분위수(Percentile)", "사분위범위(IQR)"],
  // 7 Z
  ["Z점수(Z-score)", "산술평균(Mean)", "표준편차(SD)"],
  // 8 왜도·첨도
  ["왜도(Skewness)", "첨도(Kurtosis)", "왜도·첨도 기준"],
  // 9 N·결측
  ["표본크기(N)", "결측치(Missing)"],
  // 10 SE·CI
  ["표준오차(SE)", "신뢰구간(CI)", "산술평균(Mean)"],
  // 11 기초 종합
  ["Descriptive 종합", "빈도(Frequency)", "산술평균(Mean)", "표준편차(SD)"],
  // 12 정규성 검정
  ["Shapiro-Wilk", "Q-Q plot", "유의확률(p)"],
  // 13 왜도·첨도 재확인
  ["왜도·첨도 기준", "왜도(Skewness)", "첨도(Kurtosis)"],
  // 14 등분산
  ["Levene", "등분산성", "유의확률(p)"],
  // 15 잔차 산점
  ["잔차 vs 적합값", "등분산성"],
  // 16 단변량 이상치
  ["Boxplot", "Z점수(Z-score)"],
  // 17 다변량 이상치
  ["Mahalanobis", "Cook's D"],
  // 18 상관행렬
  ["상관행렬", "VIF"],
  // 19 VIF
  ["VIF", "상관행렬"],
  // 20 Cronbach
  ["Cronbach's α", "ITC"],
  // 21 EFA/CFA
  ["EFA", "CFA", "CFI·RMSEA"],
  // 22 DW·Mauchly
  ["Durbin-Watson", "Mauchly"],
  // 23 t-검정
  ["t-검정", "t·df", "Cohen's d", "유의확률(p)", "효과크기"],
  // 24 ANOVA
  ["ANOVA", "F·η²", "등분산성", "효과크기"],
  // 25 사후
  ["Tukey", "ANOVA", "효과크기"],
  // 26 회귀
  ["회귀", "β·R²", "Cook's D", "잔차 vs 적합값"],
  // 27 카이제곱
  ["카이제곱", "Cramér's V", "교차표(Crosstab)", "효과크기"],
  // 28 ANCOVA
  ["ANCOVA", "기울기 동질성", "F·η²"],
  // 29 MANOVA
  ["MANOVA", "Wilks' Λ"],
  // 30 로지스틱
  ["로지스틱", "OR·Wald", "유의확률(p)"],
  // 31 SEM
  ["SEM", "CFI·RMSEA", "CFA"],
  // 32 HLM
  ["HLM", "ICC"],
  // 33 추론 종합
  ["Inferential 종합", "효과크기", "신뢰구간(CI)", "유의확률(p)"],
];

function keysToItems(keys: TermKey[]): GlossItem[] {
  const seen = new Set<string>();
  const out: GlossItem[] = [];
  for (const k of keys) {
    const item = SS_TERM_POOL[k];
    if (!item) continue;
    const id = item.term.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

/** 33단계 번호(1–33) → 용어 주석 */
export function getStage33Glossary(stageNo: number): GlossItem[] {
  const idx = stageNo - 1;
  if (idx < 0 || idx >= SS_STAGE33_TERM_KEYS.length) return [];
  return keysToItems(SS_STAGE33_TERM_KEYS[idx]);
}

/** perf-registry용 { term, easy } */
export function getStage33GlossaryEasy(stageNo: number): { term: string; easy: string }[] {
  return getStage33Glossary(stageNo).map((g) => ({ term: g.term, easy: g.def }));
}

/**
 * 워크벤치 기법(15+13+9) → 용어 주석.
 * 사용자 제공 매핑(중분류·세부단계·기법·지표)을 기법별로 중복 없이 적용.
 */
export function getSsTechniqueGlossary(phaseId: string, tech: SsTechnique): GlossItem[] {
  const name = `${tech.name} ${tech.id} ${tech.category || ""}`;
  let keys: TermKey[] = [];

  if (phaseId === "descriptive") {
    if (/빈도분석|빈도·비율|빈도-비율/.test(name)) {
      keys = ["빈도(Frequency)", "비율(%)", "누적%(Cumulative %)"];
    } else if (/교차표|Crosstab/.test(name)) {
      keys = ["교차표(Crosstab)", "행·열 %", "관측빈도"];
    } else if (/산술|조화|기하|평균-산술/.test(name)) {
      keys = ["산술평균(Mean)", "조화평균", "기하평균"];
    } else if (/중앙값|Median/.test(name)) {
      keys = ["중앙값(Median)", "최빈값(Mode)"];
    } else if (/최빈값|Mode/.test(name)) {
      keys = ["최빈값(Mode)", "중앙값(Median)"];
    } else if (/범위|IQR|사분위범위/.test(name) && !/백분위|사분위수/.test(name)) {
      keys = ["범위(Range)", "사분위범위(IQR)", "표준편차(SD)", "변동계수(CV)"];
    } else if (/분산|표준편차|Variance|SD/.test(name) && !/표준점수|Z-score|표준오차/.test(name)) {
      keys = ["분산(Variance)", "표준편차(SD)", "범위(Range)", "변동계수(CV)"];
    } else if (/변동계수|CV/.test(name)) {
      keys = ["변동계수(CV)", "표준편차(SD)", "사분위범위(IQR)"];
    } else if (/백분위|사분위수|Percentile|Quartile/.test(name)) {
      keys = ["사분위수(Q1·Q2·Q3)", "백분위수(Percentile)"];
    } else if (/표준점수|Z-score|Z점수/.test(name)) {
      keys = ["Z점수(Z-score)", "산술평균(Mean)", "표준편차(SD)"];
    } else if (/왜도|Skewness/.test(name)) {
      keys = ["왜도(Skewness)", "첨도(Kurtosis)", "왜도·첨도 기준"];
    } else if (/첨도|Kurtosis/.test(name)) {
      keys = ["첨도(Kurtosis)", "왜도(Skewness)", "왜도·첨도 기준"];
    } else if (/표본크기|결측|N·결측|N-결측/.test(name)) {
      keys = ["표본크기(N)", "결측치(Missing)"];
    } else if (/표준오차|SE/.test(name) && !/표준편차|표준점수/.test(name)) {
      keys = ["표준오차(SE)", "신뢰구간(CI)"];
    } else if (/신뢰구간|CI/.test(name)) {
      keys = ["신뢰구간(CI)", "표준오차(SE)", "산술평균(Mean)"];
    } else {
      keys = ["빈도(Frequency)", "산술평균(Mean)", "표준편차(SD)"];
    }
  } else if (phaseId === "diagnostic") {
    if (/정규성검정|Shapiro|K-S|Q-Q Plot/.test(name) && !/왜도·첨도 확인|±2/.test(name)) {
      keys = ["Shapiro-Wilk", "Q-Q plot", "유의확률(p)"];
    } else if (/왜도·첨도 확인|±2|±3/.test(name)) {
      keys = ["왜도·첨도 기준", "왜도(Skewness)", "첨도(Kurtosis)"];
    } else if (/등분산검정|Levene|Bartlett/.test(name)) {
      keys = ["Levene", "등분산성", "유의확률(p)"];
    } else if (/잔차|적합값|그래프 확인/.test(name)) {
      keys = ["잔차 vs 적합값", "등분산성"];
    } else if (/단변량|Boxplot/.test(name)) {
      keys = ["Boxplot", "Z점수(Z-score)"];
    } else if (/다변량|Mahalanobis|Cook/.test(name)) {
      keys = ["Mahalanobis", "Cook's D"];
    } else if (/상관계수|Correlation/.test(name)) {
      keys = ["상관행렬", "VIF"];
    } else if (/VIF|공차|Tolerance/.test(name)) {
      keys = ["VIF", "상관행렬"];
    } else if (/Cronbach|내적일관성/.test(name)) {
      keys = ["Cronbach's α", "ITC"];
    } else if (/문항-총점|Item-Total|ITC/.test(name)) {
      keys = ["ITC", "Cronbach's α"];
    } else if (/요인구조|EFA|CFA/.test(name)) {
      keys = ["EFA", "CFA", "CFI·RMSEA"];
    } else if (/Durbin|잔차 독립/.test(name)) {
      keys = ["Durbin-Watson", "Mauchly"];
    } else if (/Mauchly|구형성/.test(name)) {
      keys = ["Mauchly", "Durbin-Watson"];
    } else {
      keys = ["Shapiro-Wilk", "등분산성", "Boxplot"];
    }
  } else {
    // inferential
    if (/t-검정|t검정|^t-/.test(name)) {
      keys = ["t-검정", "t·df", "Cohen's d", "유의확률(p)", "효과크기"];
    } else if (/^ANOVA$|ANOVA /.test(name) || tech.name === "ANOVA") {
      keys = ["ANOVA", "F·η²", "Tukey", "효과크기"];
    } else if (/회귀분석|^회귀$/.test(name) && !/로지스틱/.test(name)) {
      keys = ["회귀", "β·R²", "잔차 vs 적합값", "Cook's D"];
    } else if (/카이|chi|χ²/.test(name)) {
      keys = ["카이제곱", "Cramér's V", "교차표(Crosstab)", "효과크기"];
    } else if (/ANCOVA/.test(name)) {
      keys = ["ANCOVA", "기울기 동질성", "F·η²"];
    } else if (/MANOVA/.test(name)) {
      keys = ["MANOVA", "Wilks' Λ"];
    } else if (/로지스틱/.test(name)) {
      keys = ["로지스틱", "OR·Wald", "유의확률(p)"];
    } else if (/SEM|구조방정식/.test(name)) {
      keys = ["SEM", "CFI·RMSEA", "CFA"];
    } else if (/HLM|다층/.test(name)) {
      keys = ["HLM", "ICC"];
    } else {
      keys = ["유의확률(p)", "효과크기", "신뢰구간(CI)"];
    }
  }

  return keysToItems(keys);
}

/** 페이즈 전환 시 보여줄 대표 용어(기법 미선택) */
export function getSsPhaseGlossary(phaseId: string): GlossItem[] {
  if (phaseId === "descriptive") {
    return keysToItems([
      "빈도(Frequency)", "비율(%)", "교차표(Crosstab)", "산술평균(Mean)",
      "중앙값(Median)", "표준편차(SD)", "Z점수(Z-score)", "신뢰구간(CI)",
    ]);
  }
  if (phaseId === "diagnostic") {
    return keysToItems([
      "Shapiro-Wilk", "등분산성", "Boxplot", "VIF", "Cronbach's α", "Durbin-Watson",
    ]);
  }
  return keysToItems([
    "t-검정", "ANOVA", "회귀", "카이제곱", "SEM", "효과크기", "유의확률(p)",
  ]);
}
