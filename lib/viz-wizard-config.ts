/**
 * 그래프 만들기 ①②③ — 유형별 연습 자료·축 조합·허용 차트 종류
 */
import { CHART_CATALOG } from "@/lib/charts";
import { findChart } from "@/lib/viz-engine";

export type WizardDataExample = {
  id: string;
  title: string;
  hint: string;
  /** csv 붙여넣기 또는 demo_* 키 */
  source: "csv" | "demo_scatter" | "demo_ts" | "demo_cat" | "demo_multi";
  csv?: string;
};

export type WizardCompareExample = {
  id: string;
  title: string;
  x: string;
  y: string;
  g?: string;
  s?: string;
  note: string;
  /** ① 자료 예시 id — ② 적용 시 함께 맞춰 넣음 */
  dataId?: string;
};

type ProfileKind =
  | "xy"
  | "cat-bar"
  | "time"
  | "distribution"
  | "matrix"
  | "flow"
  | "geo"
  | "3d"
  | "indicator"
  | "roc";

const CHART_KIND: Record<string, ProfileKind> = {
  scatter: "xy", bubble: "xy", regression: "xy", cluster: "xy", log: "xy", hist2d: "xy", contour: "xy",
  line: "time", area: "time", timeseries: "time", candle: "time", ohlc: "time",
  bar: "cat-bar", hbar: "cat-bar", gbar: "cat-bar", dot: "cat-bar", waterfall: "cat-bar", funnel: "cat-bar",
  pie: "cat-bar", donut: "cat-bar", polar: "cat-bar", errbar: "cat-bar",
  histogram: "distribution", box: "distribution", violin: "distribution", ecdf: "distribution", density: "distribution",
  splom: "matrix", heatmap: "matrix", corr: "matrix", parcoords: "matrix", parcats: "flow", sankey: "flow",
  radar: "matrix", treemap: "cat-bar", sunburst: "flow", icicle: "flow",
  choropleth: "geo", geobubble: "geo",
  scatter3d: "3d", surface: "3d",
  gauge: "indicator", kpi: "indicator",
  roc: "roc",
};

/** ③에서 선택 가능한 차트 id (같은 유형군 + 밀접 변형) */
const ALLOWED_BY_KIND: Record<ProfileKind, string[]> = {
  xy: ["scatter", "bubble", "regression", "cluster", "log", "hist2d", "contour"],
  "cat-bar": ["bar", "hbar", "gbar", "dot", "pie", "donut", "waterfall", "funnel", "errbar", "polar", "treemap"],
  time: ["line", "area", "timeseries", "candle", "ohlc", "kpi"],
  distribution: ["histogram", "box", "violin", "ecdf", "density", "hist2d"],
  matrix: ["heatmap", "corr", "splom", "parcoords", "radar"],
  flow: ["sankey", "parcats", "sunburst", "icicle", "funnel"],
  geo: ["choropleth", "geobubble"],
  "3d": ["scatter3d", "surface", "regression", "cluster"],
  indicator: ["gauge", "kpi", "donut", "pie"],
  roc: ["roc", "line", "scatter"],
};

function kindForChart(chartId: string): ProfileKind {
  return CHART_KIND[chartId] || "xy";
}

export function allowedChartsFor(chartId: string): { cat: string; id: string; name: string }[] {
  const kind = kindForChart(chartId);
  const ids = new Set(ALLOWED_BY_KIND[kind]);
  if (!ids.has(chartId)) ids.add(chartId);
  const out: { cat: string; id: string; name: string }[] = [];
  for (const cat of CHART_CATALOG) {
    for (const ch of cat.charts) {
      if (ids.has(ch.id)) out.push({ cat: cat.key, id: ch.id, name: ch.name });
    }
  }
  return out;
}

const DATA_XY: WizardDataExample[] = [
  { id: "d1", title: "키·몸무게 (성인)", hint: "두 연속 변수 — 전형적 산점도", source: "csv", csv: "키cm,몸무게kg,성별\n165,58,여\n172,70,남\n158,52,여\n180,82,남\n170,65,남\n163,55,여" },
  { id: "d2", title: "학습시간·시험점수", hint: "공부 시간과 성적 관계", source: "csv", csv: "학습시간h,점수,반\n2,62,A\n4,71,A\n6,78,B\n8,85,B\n10,92,C\n3,68,A" },
  { id: "d3", title: "광고비·매출", hint: "마케팅 투자와 매출", source: "csv", csv: "광고비만원,매출만원,채널\n120,340,검색\n80,210,SNS\n200,520,검색\n150,410,동영상\n90,230,SNS" },
  { id: "d4", title: "연령·혈압", hint: "건강 지표 상관", source: "csv", csv: "나이,수축기혈압,그룹\n28,118,정상\n45,128,주의\n52,135,주의\n34,112,정상\n61,142,고위험\n39,120,정상" },
  { id: "d5", title: "연습용 랜덤 (120점)", hint: "관계 패턴 미리보기", source: "demo_scatter" },
];

const DATA_CAT: WizardDataExample[] = [
  { id: "c1", title: "학과별 지원자 수", hint: "범주 × 개수", source: "csv", csv: "학과,지원자\n경영,84\n심리,62\n교육,51\n공학,97\n디자인,44" },
  { id: "c2", title: "지역별 만족 평균", hint: "그룹 평균 비교", source: "demo_cat" },
  { id: "c3", title: "월별 문의 유형", hint: "범주·값", source: "csv", csv: "유형,건수,평균처리일\n환불,42,3.2\n배송,88,2.1\n품질,35,4.5\n기타,19,2.8" },
  { id: "c4", title: "프로그램별 이수율", hint: "비율·막대", source: "csv", csv: "프로그램,이수율pct\nA,78\nB,65\nC,82\nD,71" },
  { id: "c5", title: "다변량 연습", hint: "여러 숫자 열", source: "demo_multi" },
];

const DATA_TIME: WizardDataExample[] = [
  { id: "t1", title: "일별 방문자 (60일)", hint: "시계열·선 그래프", source: "demo_ts" },
  { id: "t2", title: "분기 매출", hint: "날짜·값", source: "csv", csv: "분기,매출억,목표\n2024Q1,12.4,11\n2024Q2,13.1,12\n2024Q3,14.0,13\n2024Q4,15.2,14" },
  { id: "t3", title: "주간 오류 건수", hint: "시간 흐름", source: "csv", csv: "주,오류,심각도\nW1,12,중\nW2,9,중\nW3,15,고\nW4,7,저\nW5,11,중" },
  { id: "t4", title: "OHLC 포함 시계열", hint: "캔들·OHLC용", source: "demo_ts" },
  { id: "t5", title: "월별 NPS", hint: "KPI·게이지", source: "csv", csv: "월,NPS\n1,32\n2,35\n3,38\n4,42\n5,40" },
];

const DATA_DIST: WizardDataExample[] = [
  { id: "h1", title: "중간고사 점수", hint: "히스토그램·분포", source: "csv", csv: "학생,점수,반\n1,78,A\n2,82,A\n3,65,B\n4,91,A\n5,73,B\n6,88,A\n7,70,B\n8,95,A" },
  { id: "h2", title: "그룹별 반응시간", hint: "박스·바이올린", source: "csv", csv: "그룹,반응ms\nA,420\nA,380\nB,510\nB,490\nA,400\nB,530\nB,505" },
  { id: "h3", title: "다변량 분포", hint: "산점 행렬", source: "demo_multi" },
  { id: "h4", title: "Likert 점수", hint: "누적분포 ECDF", source: "csv", csv: "응답자,만족\n1,4\n2,5\n3,3\n4,4\n5,2\n6,5\n7,4" },
  { id: "h5", title: "두 변수 밀도", hint: "2D 밀도", source: "demo_scatter" },
];

const DATA_MATRIX: WizardDataExample[] = [
  { id: "m1", title: "지표 상관 행렬", hint: "상관 히트맵", source: "demo_multi" },
  { id: "m2", title: "요일×시간 교차", hint: "히트맵", source: "csv", csv: "요일,오전,오후,저녁\n월,12,18,9\n화,14,20,11\n수,10,16,8\n목,15,19,10" },
  { id: "m3", title: "다차원 프로필", hint: "레이더·평행좌표", source: "demo_multi" },
  { id: "m4", title: "변수 4개", hint: "산점 행렬", source: "demo_multi" },
  { id: "m5", title: "그룹별 다지표", hint: "레이더", source: "csv", csv: "그룹,품질,속도,비용,만족\nA,4.2,3.8,3.5,4.0\nB,3.9,4.1,3.7,3.8\nC,4.5,3.2,3.0,4.2" },
];

const DATA_FLOW: WizardDataExample[] = [
  { id: "f1", title: "단계별 전환", hint: "생키·깔때기", source: "csv", csv: "단계,인원\n검색,1200\n클릭,840\n가입,520\n결제,310\n재구매,140" },
  { id: "f2", title: "경로 범주", hint: "평행 범주", source: "csv", csv: "학력,직무,지역\n대졸,연구,서울\n대졸,개발,경기\n석사,연구,서울\n학사,영업,부산\n석사,개발,서울" },
  { id: "f3", title: "계층 비중", hint: "선버스트·아이시클", source: "csv", csv: "분류,값\n연구,40\n교육,25\n행정,20\n기타,15" },
  { id: "f4", title: "출처→목적", hint: "생키", source: "csv", csv: "출처,목적,건수\n국내,수출,30\n국내,내수,70\n수입,내수,45\n수입,재수출,15" },
  { id: "f5", title: "범주 다열", hint: "평행 범주", source: "demo_cat" },
];

const DATA_GEO: WizardDataExample[] = [
  { id: "g1", title: "국가별 GDP", hint: "지역 색칠", source: "csv", csv: "국가,GDP조\nSouth Korea,1.7\nUnited States,25.5\nJapan,4.2\nGermany,4.0\nFrance,2.9" },
  { id: "g2", title: "국가별 인구", hint: "지도 버블", source: "csv", csv: "국가,인구백만,규모\nSouth Korea,51.7,520\nChina,1412,1412\nIndia,1400,1400\nBrazil,214,214" },
  { id: "g3", title: "대륙별 지표", hint: "코로플레스", source: "csv", csv: "국가,지수\nUnited States,82\nCanada,79\nUnited Kingdom,77\nAustralia,80\nMexico,65" },
  { id: "g4", title: "유럽 샘플", hint: "지도", source: "csv", csv: "국가,값\nFrance,72\nGermany,78\nSpain,70\nItaly,68\nNetherlands,81" },
  { id: "g5", title: "아시아 샘플", hint: "버블 지도", source: "csv", csv: "국가,값,규모\nJapan,88,88\nSouth Korea,85,85\nVietnam,62,62\nThailand,70,70" },
];

const DATA_3D: WizardDataExample[] = [
  { id: "3d1", title: "3변수 연습", hint: "3D 산점", source: "demo_multi" },
  { id: "3d2", title: "높이·면적·가격", hint: "입체 관계", source: "csv", csv: "면적,층수,가격억\n84,10,9.2\n102,15,11.5\n55,8,6.1\n120,20,14.0\n72,12,8.0" },
  { id: "3d3", title: "다변량 표면", hint: "표면 그래프", source: "demo_multi" },
  { id: "3d4", title: "군집 3D", hint: "군집 산점", source: "demo_scatter" },
  { id: "3d5", title: "회귀 평면", hint: "회귀·3D", source: "demo_scatter" },
];

const DATA_IND: WizardDataExample[] = [
  { id: "i1", title: "목표 대비 달성", hint: "게이지", source: "csv", csv: "항목,달성률\n목표,78\n" },
  { id: "i2", title: "월별 KPI", hint: "핵심 수치", source: "csv", csv: "월,매출\n1,120\n2,132\n3,128\n4,145\n5,151" },
  { id: "i3", title: "만족 구성", hint: "도넛·파이", source: "csv", csv: "구분,비율\n만족,62\n보통,28\n불만,10" },
  { id: "i4", title: "단일 지표", hint: "게이지", source: "csv", csv: "지표,값\n품질점수,4.3" },
  { id: "i5", title: "시계열 KPI", hint: "KPI delta", source: "demo_ts" },
];

const DATA_ROC: WizardDataExample[] = [
  { id: "r1", title: "분류 모델 (데모)", hint: "ROC 곡선 내장", source: "demo_scatter" },
  { id: "r2", title: "민감도·특이도", hint: "이진 분류", source: "csv", csv: "FPR,TPR\n0,0\n0.1,0.55\n0.2,0.72\n0.5,0.88\n1,1" },
  { id: "r3", title: "점수·라벨", hint: "산점으로 ROC 대체", source: "csv", csv: "score,label\n0.2,0\n0.4,0\n0.55,1\n0.7,1\n0.85,1\n0.9,1" },
  { id: "r4", title: "다변량", hint: "보조 자료", source: "demo_multi" },
  { id: "r5", title: "시간별 적중", hint: "선 그래프", source: "demo_ts" },
];

function dataForKind(kind: ProfileKind): WizardDataExample[] {
  switch (kind) {
    case "cat-bar": return DATA_CAT;
    case "time": return DATA_TIME;
    case "distribution": return DATA_DIST;
    case "matrix": return DATA_MATRIX;
    case "flow": return DATA_FLOW;
    case "geo": return DATA_GEO;
    case "3d": return DATA_3D;
    case "indicator": return DATA_IND;
    case "roc": return DATA_ROC;
    default: return DATA_XY;
  }
}

function compareForKind(kind: ProfileKind, chartId: string): WizardCompareExample[] {
  const base = (rows: Omit<WizardCompareExample, "id">[]): WizardCompareExample[] =>
    rows.map((r, i) => ({ ...r, id: `cmp${i + 1}` }));

  if (kind === "cat-bar") {
    return base([
      { title: "학과 × 지원자", x: "학과", y: "지원자", note: "막대·가로 막대", dataId: "c1" },
      { title: "유형 × 건수", x: "유형", y: "건수", g: "유형", note: "묶음·점도표", dataId: "c3" },
      { title: "프로그램 × 이수율", x: "프로그램", y: "이수율pct", note: "비율 막대", dataId: "c4" },
      { title: "category × count", x: "category", y: "count", note: "데모 범주", dataId: "c2" },
      { title: "다변량 연습", x: "v1", y: "v2", g: "group", note: "다변량", dataId: "c5" },
    ]);
  }
  if (kind === "time") {
    return base([
      { title: "날짜 × 값", x: "date", y: "value", note: "선·영역·시계열", dataId: "t1" },
      { title: "분기 × 매출", x: "분기", y: "매출억", note: "막대·선", dataId: "t2" },
      { title: "주 × 오류", x: "주", y: "오류", g: "심각도", note: "색 구분", dataId: "t3" },
      { title: "일 × OHLC", x: "date", y: "close", note: "캔들·OHLC (open/high/low/close 열 필요)", dataId: "t4" },
      { title: "월 × NPS", x: "월", y: "NPS", note: "KPI·게이지", dataId: "t5" },
    ]);
  }
  if (kind === "distribution") {
    return base([
      { title: "점수 분포", x: "학생", y: "점수", note: "히스토그램 (Y=점수)", dataId: "h1" },
      { title: "그룹 × 반응", x: "그룹", y: "반응ms", g: "그룹", note: "박스·바이올린", dataId: "h2" },
      { title: "만족 ECDF", x: "응답자", y: "만족", note: "누적분포", dataId: "h4" },
      { title: "x × y 밀도", x: "x", y: "y", note: "2D 밀도", dataId: "h5" },
      { title: "다변량", x: "v1", y: "v2", g: "group", note: "밀도·행렬", dataId: "h3" },
    ]);
  }
  if (kind === "geo") {
    return base([
      { title: "국가 × GDP", x: "국가", y: "GDP조", note: "코로플레스", dataId: "g1" },
      { title: "국가 × 인구 (크기)", x: "국가", y: "인구백만", s: "규모", note: "지도 버블", dataId: "g2" },
      { title: "국가 × 지수", x: "국가", y: "지수", note: "색 강도", dataId: "g3" },
      { title: "지역 × 값", x: "국가", y: "값", note: "비교", dataId: "g4" },
      { title: "도시 규모", x: "국가", y: "값", s: "규모", note: "버블", dataId: "g5" },
    ]);
  }
  if (kind === "matrix" || kind === "flow" || kind === "3d") {
    return base([
      { title: "v1 × v2", x: "v1", y: "v2", g: "group", note: "관계·군집", dataId: "m1" },
      { title: "다지표", x: "v1", y: "v2", s: "v3", note: "버블·3D", dataId: kind === "3d" ? "3d1" : "m4" },
      { title: "그룹 프로필", x: "그룹", y: "품질", g: "그룹", note: "레이더", dataId: "m5" },
      { title: "범주 흐름", x: "출처", y: "건수", note: "생키 (2범주 열)", dataId: "f4" },
      { title: "계층", x: "분류", y: "값", note: "트리·선버스트", dataId: "f3" },
    ]);
  }
  if (kind === "indicator") {
    return base([
      { title: "항목 × 달성", x: "항목", y: "달성률", note: "게이지", dataId: "i1" },
      { title: "월 × 매출", x: "월", y: "매출", note: "KPI", dataId: "i2" },
      { title: "구분 × 비율", x: "구분", y: "비율", note: "도넛", dataId: "i3" },
      { title: "단일 값", x: "지표", y: "값", note: "게이지", dataId: "i4" },
      { title: "시계열 KPI", x: "date", y: "value", note: "KPI delta", dataId: "i5" },
    ]);
  }
  if (kind === "roc") {
    return base([
      { title: "FPR × TPR", x: "FPR", y: "TPR", note: "ROC (데모)", dataId: "r2" },
      { title: "score × label", x: "score", y: "label", note: "산점", dataId: "r3" },
      { title: "x × y", x: "x", y: "y", note: "회귀", dataId: "r1" },
      { title: "v1 × v2", x: "v1", y: "v2", note: "분류 탐색", dataId: "r4" },
      { title: "date × value", x: "date", y: "value", note: "시간별 적중", dataId: "r5" },
    ]);
  }
  // xy / scatter default
  return base([
    { title: "키 × 몸무게", x: "키cm", y: "몸무게kg", g: "성별", note: "산점·군집", dataId: "d1" },
    { title: "학습시간 × 점수", x: "학습시간h", y: "점수", g: "반", note: "회귀선", dataId: "d2" },
    { title: "광고비 × 매출", x: "광고비만원", y: "매출만원", s: "매출만원", note: "버블", dataId: "d3" },
    { title: "나이 × 혈압", x: "나이", y: "수축기혈압", g: "그룹", note: "로그·밀도", dataId: "d4" },
    { title: "x × y (연습)", x: "x", y: "y", g: "group", s: "size", note: chartId === "scatter" ? "전형적 산점도" : "XY 관계", dataId: "d5" },
  ]);
}

export function getWizardConfig(chartId: string) {
  const kind = kindForChart(chartId);
  const found = findChart(chartId);
  return {
    kind,
    defaultCat: found?.cat || "기본",
    dataExamples: dataForKind(kind),
    compareExamples: compareForKind(kind, chartId),
    allowedCharts: allowedChartsFor(chartId),
  };
}
