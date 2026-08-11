/**
 * 200개 연구방법 → 파이프라인 단계별 정밀 프로필
 * (템플릿 차트 엔진 8종을 재사용하되, 방법별로 온톨로지·해석·변수 안내를 다르게 적용)
 */
import type { VizTemplateId, CatalogMethodRow } from "./research-viz-catalog";

export type OntItem = {
  nm: string;
  ic: string;
  p: string;
  pt: string;
  r: string;
  easy?: string;
  detail?: string;
};

const PREFIX_TPL: Record<string, VizTemplateId> = {
  QL: "qualitative",
  TX: "qualitative",
  SV: "survey",
  CI: "experiment",
  EP: "comparative",
  HC: "comparative",
  EV: "meta",
  MM: "survey",
  QT: "regression",
  EM: "meta",
  GN: "correlation",
};

/** methodId·키워드 기반 정밀 템플릿 */
export function preciseTemplateFor(m: CatalogMethodRow): VizTemplateId {
  const id = (m.methodId || "").toUpperCase();
  const name = `${m.name_ko || ""} ${m.family || ""} ${m.macro || ""}`.toLowerCase();
  const prefix = id.split("-")[0];

  if (/메타분석|meta-analysis|forest|pooled|체계적.*리뷰|systematic review|scoping|umbrella|근거합성/.test(name) || /^EV-00[1256789]|EV-01[12]|EM-/.test(id))
    return "meta";
  if (/실험|준실험|인과|rct|cohort|clinical trial|field experiment|counterfactual|doe|실험계획/.test(name) || prefix === "CI")
    return "experiment";
  if (/설문|survey|likert|nps|문항|마케팅리서치|여론|questionnaire|mail and internet/.test(name) || prefix === "SV")
    return "survey";
  if (/시계열|종단|longitudinal|panel|time series|system dynamics|예측.*모형|forecast/.test(name) && /QT-011|QT-022|GN-016|GN-015/.test(id))
    return "timeseries";
  if (/질적|현상학|민족지|근거이론|서사|담화|면접|포커스|코딩|해석|netnograph|ethnograph|grounded|phenomen|narrative|discourse|interview|focus group|action research|case study|q방법|q-technique|q methodology/.test(name) || prefix === "QL" || prefix === "TX")
    return "qualitative";
  if (/비교|평가|정책|kpi|ahp|델파이|비용편익|program evaluation|impact evaluation|historical|oral history|archival|process tracing/.test(name) || prefix === "EP" || prefix === "HC")
    return "comparative";
  if (/회귀|regression|sem|구조방정식|로지스틱|매개|조절|요인분석|cfa|efa|베이지안|다변량|판별|군집|cluster|mds|잠재/.test(name) || prefix === "QT")
    return "regression";
  if (/상관|correlation|산점|관계|히트맵/.test(name))
    return "correlation";

  return PREFIX_TPL[prefix] || "correlation";
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** 같은 템플릿이라도 방법별로 추천 그래프 순서·강조를 다르게 */
export function rotateOntology(base: OntItem[], methodId: string): OntItem[] {
  if (!base?.length) return [];
  const n = base.length;
  const start = hashId(methodId) % n;
  const rotated = [...base.slice(start), ...base.slice(0, start)];
  return rotated;
}

/** 방법 이름을 넣어 온톨로지 문구를 방법 특화 */
export function personalizeOntology(items: OntItem[], methodName: string, methodId: string): OntItem[] {
  return items.map((it, i) => {
    const focus =
      i === 0
        ? "핵심 결과 그래프"
        : i === 1
          ? "진단·보조 그래프"
          : "요약·의사결정 그래프";
    return {
      ...it,
      nm: `${it.nm}`,
      r: `${methodName}(${methodId})의 ${focus}로 권장합니다. ${it.r}`,
      easy:
        (it.easy || it.r) +
        ` — 본 연구방법(${methodName})에서는 이 그래프를 ${focus}로 두고, 축·범례·표본(N)을 연구질문에 맞게 다시 적어 쓰세요.`,
      detail: buildDetailInterpretation(it, methodName, methodId, focus),
    };
  });
}

function buildDetailInterpretation(it: OntItem, methodName: string, methodId: string, focus: string): string {
  const terms: string[] = [];
  const blob = `${it.nm} ${it.r} ${it.easy || ""}`;
  if (/Likert|리커트|5점/i.test(blob))
    terms.push("「리커트 척도」: 전혀~매우처럼 같은 간격의 선택지로 태도를 숫자로 바꿉니다. 문항마다 선택지 문구가 같아야 비교가 공정합니다.");
  if (/NPS/i.test(blob))
    terms.push("「NPS」: 추천 의향(0–10)에서 추천자% − 비추천자%입니다. 만족도 평균과 같은 숫자가 아닙니다.");
  if (/R²|회귀|OLS|잔차/i.test(blob))
    terms.push("「R²」: 결과가 예측변수로 얼마나 설명되는지(0~1)입니다. 높아도 인과의 증거가 아닙니다. 「잔차」는 실제값−예측값입니다.");
  if (/CI|신뢰구간|95%/i.test(blob))
    terms.push("「신뢰구간(CI)」: 추정값이 흔들릴 수 있는 범위를 보여 줍니다. 0을 포함하면 ‘효과가 있다’고 단정하기 어렵습니다.");
  if (/p-?값|유의/i.test(blob))
    terms.push("「p-값」: 우연히 이런 차이가 날 법한 정도의 감입니다. 보통 0.05 미만을 ‘유의한 편’으로 읽지만, 효과 크기와 함께 봐야 합니다.");
  if (/Cohen|효과\s*크기|d\b/i.test(blob))
    terms.push("「Cohen's d」: 두 집단 평균 차이를 표준화한 효과 크기입니다. 대략 0.2/0.5/0.8을 작음/중간/큼으로 참고합니다.");
  if (/상관|r\b|히트맵/i.test(blob))
    terms.push("「상관계수 r」: −1~+1로 같이 움직이는 정도입니다. r만으로 원인을 말할 수 없습니다.");
  if (/테마|코딩|인터뷰|감정/i.test(blob))
    terms.push("「테마」: 질적 자료에서 반복되는 의미 묶음입니다. 빈도 막대는 ‘얼마나 많이 말했는지’이지 ‘얼마나 중요한지’의 절대 증거가 아닙니다.");
  if (/포레스트|메타|I²|퍼널/i.test(blob))
    terms.push("「포레스트 플롯」: 연구별 효과와 신뢰구간, 통합 효과를 한눈에 봅니다. 「I²」는 연구 간 이질성 비율입니다.");
  if (/레이더|지수화|KPI/i.test(blob))
    terms.push("「지수화(100=평균)」: 단위가 다른 지표를 같은 기준으로 비교하기 위한 상대값입니다. 절대 수준과 혼동하지 마세요.");
  if (/박스|사분위|IQR|바이올린|히스토그램/i.test(blob))
    terms.push("「사분위·IQR」: 자료를 4등분한 위치와 가운데 50% 구간입니다. 평균만 보면 놓치는 퍼짐·이상치를 보여 줍니다.");
  if (/시계열|이동평균|MoM|추세/i.test(blob))
    terms.push("「이동평균」: 단기 출렁임을 부드럽게 해 추세를 보이게 합니다. 「MoM」은 전월 대비 변화율입니다.");

  if (!terms.length)
    terms.push("그래프 제목·축 이름·표본(N)·한계를 함께 적으면 독자가 ‘무엇을 비교했는지’를 바로 이해합니다.");

  return [
    `【${focus} · ${methodName}】`,
    `이 그림(${it.nm})은 ${methodId} 절차에서 ${focus}로 쓰는 표준 시각화입니다.`,
    it.easy || it.r,
    "",
    "용어 풀이",
    ...terms.map((t) => `· ${t}`),
    "",
    "읽는 순서(쉽게)",
    "1) 축·범례가 연구질문과 맞는지 확인합니다.",
    "2) 전체 모양(높은/낮은 쪽, 퍼짐, 이상치)을 먼저 봅니다.",
    "3) 숫자 한두 개(평균·r·효과크기 등)로 한 문장 요약을 만듭니다.",
    "4) ‘인과인지 상관인지’, ‘표본이 누구인지’를 한계로 덧붙입니다.",
  ].join("\n");
}

/** Analysis Engine — 전문적이되 쉬운 맞는/틀린 예 */
export const ANALYSIS_GLOSS_PRO: {
  term: string;
  easy: string;
  ok: string;
  bad: string;
  templates?: VizTemplateId[];
}[] = [
  {
    term: "N (표본 크기)",
    easy: "분석에 들어간 사람·사례·관측 수입니다. 결론의 안정성은 N과 표집 방식에 크게 좌우됩니다.",
    ok: "연구질문·효과 크기를 가정해 필요 N을 미리 정하고, 최종 분석 N과 제외 사유를 보고합니다.",
    bad: "N=3처럼 극소표본으로 일반화하거나, 결측을 숨긴 채 N만 크게 적습니다.",
    templates: ["survey", "experiment", "regression", "correlation", "comparative", "meta", "qualitative", "timeseries"],
  },
  {
    term: "측정 수준 (Nominal / Ordinal / Continuous)",
    easy: "Nominal=이름 구분, Ordinal=순서만 있는 구분, Continuous=간격·비율이 의미 있는 숫자입니다.",
    ok: "척도에 맞는 요약(범주→빈도, 서열→중앙값/비율, 연속→평균·SD)과 그래프를 고릅니다.",
    bad: "ID·성별에 평균을 내거나, Likert 순서를 무시하고 등간 가정만 강요합니다.",
  },
  {
    term: "Likert 척도",
    easy: "‘전혀~매우’처럼 동일한 선택지로 태도·인식을 숫자화한 서열 척도입니다.",
    ok: "전 문항 동일 라벨, 역채점 명시, 결측 코드 통일 후 하위척도 합산·신뢰도(α)를 점검합니다.",
    bad: "선택지 문구가 문항마다 다르거나, 텍스트 응답을 숫자 칸에 넣습니다.",
    templates: ["survey"],
  },
  {
    term: "NPS",
    easy: "추천 의향 0–10에서 추천자(9–10)% − 비추천자(0–6)%입니다.",
    ok: "분모·결측 규칙을 밝히고, 만족도 평균과 구분하여 보고합니다.",
    bad: "평균 만족도와 NPS를 같은 지표로 섞어 씁니다.",
    templates: ["survey", "comparative"],
  },
  {
    term: "평균·분산·이상치",
    easy: "평균은 중심, 분산/SD는 퍼짐, 이상치는 멀리 떨어진 값입니다.",
    ok: "분포 그래프(히스토그램·박스)와 함께 평균을 제시하고, 치우침이 크면 중앙값을 병기합니다.",
    bad: "평균만 보고 ‘대부분’이라고 단정합니다.",
  },
  {
    term: "상관계수 r",
    easy: "두 연속 변수가 같이 움직이는 정도(−1~+1). 인과가 아닙니다.",
    ok: "산점도+ r + 표본을 함께 보고, 비선형·이상치 영향을 점검합니다.",
    bad: "r만으로 ‘원인’이라고 말합니다.",
    templates: ["correlation", "regression"],
  },
  {
    term: "R² · 회귀계수",
    easy: "R²는 설명력(0~1), 계수는 ‘다른 변수를 고정할 때’의 평균 변화 방향·크기입니다.",
    ok: "계수·표준오차·CI·진단(잔차)을 함께 제시합니다.",
    bad: "R²만 높다고 인과·예측력을 과장합니다.",
    templates: ["regression", "timeseries"],
  },
  {
    term: "p-값 · 효과 크기",
    easy: "p는 ‘우연 정도’의 감, 효과 크기(d, β 등)는 ‘얼마나 다른지’입니다.",
    ok: "유의성과 효과 크기·CI를 함께 해석하고, 다중비교 시 보정을 명시합니다.",
    bad: "p만 작으면 실질적으로 중요하다고 단정합니다.",
    templates: ["experiment", "regression", "meta", "survey"],
  },
  {
    term: "Cohen's d · 이질성(I²)",
    easy: "d는 표준화 평균차, I²는 메타분석에서 연구 간 이질성 비율입니다.",
    ok: "통합 효과와 CI, I²·예측구간을 함께 보고합니다.",
    bad: "이질성이 큰데도 단일 수치만 강조합니다.",
    templates: ["meta", "experiment"],
  },
  {
    term: "테마 · 코딩 단위",
    easy: "질적 코딩에서 의미 묶음(테마)과 코딩 단위(문장·발화 등)를 분명히 합니다.",
    ok: "코드북·예시 인용·빈도/커버리지를 구분해 제시합니다.",
    bad: "빈도만으로 ‘가장 중요’하다고 단정합니다.",
    templates: ["qualitative"],
  },
];

export function glossForTemplate(tpl: VizTemplateId) {
  return ANALYSIS_GLOSS_PRO.filter((g) => !g.templates || g.templates.includes(tpl));
}

/** 방법별 샘플 기입 템플릿 */
export function draftTemplateFor(tpl: VizTemplateId, methodName: string): string {
  switch (tpl) {
    case "survey":
      return `# ${methodName} · Likert 예시\n문항,점수\n전반만족,4\n추천의향,5\n가격수용,3\n재구매의도,4`;
    case "regression":
      return `# ${methodName} · 회귀 입력 메모\nY=결과, X1=예측1, X2=예측2\n관측수,결측규칙,표준화여부`;
    case "timeseries":
      return `# ${methodName} · 시계열\n기간,값\n2024-01,120\n2024-02,128\n2024-03,131`;
    case "experiment":
      return `# ${methodName} · 사전-사후\n집단,사전,사후\n대조,70,71\n처리,70,82`;
    case "correlation":
      return `# ${methodName} · 다변량\nID,V1,V2,V3\n1,12,8,5\n2,15,9,6`;
    case "comparative":
      return `# ${methodName} · 그룹 KPI\n그룹,KPI1,KPI2,KPI3\nA,42,18,7.8\nB,38,22,8.2`;
    case "meta":
      return `# ${methodName} · 효과크기\n연구,d,SE,N\nKim2021,0.65,0.18,120\nPark2020,0.42,0.22,80`;
    case "qualitative":
      return `# ${methodName} · 테마 빈도\n테마,빈도,감정\n자율성,28,긍정\n소통,24,중립`;
    default:
      return `# ${methodName}\n항목,값`;
  }
}
