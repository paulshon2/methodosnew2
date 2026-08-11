// 그래프 카탈로그 (수정2) — 연구방법 메뉴처럼 목록→유형 상세→만들기로 안내.
// id 는 시각화 스튜디오(web/viz)의 차트 id 와 일치(미리보기·선택용).
export interface ChartInfo { id: string; name: string; desc: string; useWhen: string; }
export interface ChartCategory { key: string; catKo: string; intro: string; why: string; steps: string[]; charts: ChartInfo[]; }

const STEPS_BASIC = [
  "① 자료 고르기 — 내 연구 결과 또는 연습용 자료를 고릅니다.",
  "② 가로·세로 정하기 — 가로축(이름·날짜·그룹)과 세로축(숫자·값)에 무엇을 놓을지 고릅니다.",
  "③ 이 그래프 종류 누르기 — 그러면 그래프가 바로 그려집니다. 마우스를 올리면 값이 보여요.",
];

export const CHART_CATALOG: ChartCategory[] = [
  { key: "기본", catKo: "기본 그래프 · 10", intro: "가장 많이 쓰는 기본 그래프입니다. 값을 비교하거나(막대), 변화를 보거나(선), 비율을 보는(원형) 데 씁니다.",
    why: "사람이 가장 쉽게 읽는 형태라, 발표·보고서에서 결과를 한눈에 전달할 때 먼저 고려합니다. 막대=비교, 선=변화, 원형=비율이라는 원칙만 지키면 오해가 적습니다.",
    steps: STEPS_BASIC,
    charts: [
      { id: "scatter", name: "산점도", desc: "점으로 두 숫자의 관계를 봅니다.", useWhen: "키와 몸무게처럼 ‘두 값이 같이 변하나?’를 볼 때" },
      { id: "line", name: "선 그래프", desc: "선으로 변화 흐름을 봅니다.", useWhen: "시간에 따라 값이 어떻게 변하는지 볼 때" },
      { id: "bar", name: "막대 그래프", desc: "막대 높이로 값을 비교합니다.", useWhen: "그룹별 개수·평균을 비교할 때" },
      { id: "hbar", name: "가로 막대", desc: "막대를 옆으로 눕힌 비교 그래프.", useWhen: "항목 이름이 길거나 항목이 많을 때" },
      { id: "gbar", name: "묶음 막대", desc: "그룹을 나란히 묶어 비교합니다.", useWhen: "여러 그룹을 항목별로 동시에 비교할 때" },
      { id: "pie", name: "원형(파이)", desc: "전체에서 차지하는 비율을 봅니다.", useWhen: "구성 비율(점유율 등)을 보여줄 때" },
      { id: "donut", name: "도넛", desc: "가운데가 빈 원형 그래프.", useWhen: "비율 + 가운데에 총합을 함께 보일 때" },
      { id: "bubble", name: "버블", desc: "점 크기로 세 번째 값도 함께 봅니다.", useWhen: "두 값의 관계 + 크기(규모)까지 볼 때" },
      { id: "area", name: "영역", desc: "선 아래를 색으로 채운 그래프.", useWhen: "시간에 따른 ‘누적·총량’ 변화를 강조할 때" },
      { id: "dot", name: "점도표", desc: "값을 점으로 한 줄에 표시합니다.", useWhen: "항목별 값을 깔끔하게 비교할 때" },
    ]},
  { key: "통계", catKo: "분포·통계 그래프 · 8", intro: "자료가 어떻게 퍼져 있는지, 어디에 몰려 있는지 보는 그래프입니다.",
    why: "평균만 보면 속기 쉽습니다. 분포 그래프는 자료의 모양·이상치·치우침을 드러내 ‘진짜 모습’을 보게 해줍니다.",
    steps: STEPS_BASIC,
    charts: [
      { id: "histogram", name: "히스토그램", desc: "값을 구간으로 나눠 개수를 막대로.", useWhen: "점수 분포처럼 ‘어디에 많이 몰렸나’ 볼 때" },
      { id: "box", name: "상자 그림", desc: "중앙값·사분위·이상치를 한 상자로.", useWhen: "그룹 간 분포·이상치를 비교할 때" },
      { id: "violin", name: "바이올린", desc: "분포 모양 + 상자그림을 합친 형태.", useWhen: "분포 모양까지 자세히 비교할 때" },
      { id: "hist2d", name: "2D 밀도", desc: "두 값이 몰리는 곳을 색으로.", useWhen: "점이 너무 많아 산점도가 겹칠 때" },
      { id: "splom", name: "산점도 행렬", desc: "여러 변수 쌍을 한 번에 산점도로.", useWhen: "변수 여러 개의 관계를 한눈에 훑을 때" },
      { id: "ecdf", name: "누적분포(ECDF)", desc: "‘이 값 이하가 몇 %인지’ 보는 선.", useWhen: "‘상위 10%는 몇 점?’ 같은 누적 비율을 볼 때" },
      { id: "errbar", name: "오차 막대", desc: "평균과 함께 불확실성(오차)을 표시.", useWhen: "그룹 평균을 ‘오차 범위와 함께’ 비교할 때" },
      { id: "density", name: "밀도 곡선", desc: "분포를 부드러운 곡선으로.", useWhen: "여러 그룹의 분포 모양을 겹쳐 비교할 때" },
    ]},
  { key: "과학", catKo: "관계·고급 그래프 · 8", intro: "변수 사이 관계나 복잡한 다차원 자료를 보는 고급 그래프입니다.",
    why: "변수가 많거나 관계가 복잡할 때, 표로는 안 보이는 패턴(상관 구조·군집·주기)을 드러냅니다.",
    steps: STEPS_BASIC,
    charts: [
      { id: "heatmap", name: "히트맵", desc: "값의 크기를 색의 진하기로.", useWhen: "행·열 표의 값을 색으로 한눈에 볼 때" },
      { id: "corr", name: "상관 히트맵", desc: "변수끼리 상관을 색으로.", useWhen: "어떤 변수들이 서로 관련 있는지 볼 때" },
      { id: "contour", name: "등고선", desc: "밀집도를 등고선으로.", useWhen: "두 값의 밀집 영역을 지도처럼 볼 때" },
      { id: "parcoords", name: "평행 좌표", desc: "여러 숫자 축을 선으로 연결.", useWhen: "여러 지표를 동시에 비교·군집 볼 때" },
      { id: "parcats", name: "평행 범주", desc: "범주들이 어떻게 흘러가는지.", useWhen: "여러 범주 변수의 조합·흐름을 볼 때" },
      { id: "radar", name: "레이더(거미줄)", desc: "여러 항목 점수를 방사형으로.", useWhen: "역량·특성 프로필을 비교할 때" },
      { id: "polar", name: "극좌표 막대", desc: "방향·각도별 값을 원형으로.", useWhen: "방향·시간대별 분포(바람장미 등)를 볼 때" },
      { id: "log", name: "로그축 산점", desc: "값 차이가 클 때 로그로 압축.", useWhen: "1과 100만처럼 격차가 큰 값을 함께 볼 때" },
    ]},
  { key: "재무·시간", catKo: "시간·흐름 그래프 · 7", intro: "시간 흐름이나 단계별 증감, 핵심 수치를 보여주는 그래프입니다.",
    why: "시간·단계가 핵심일 때 변화의 방향과 속도를 직관적으로 전달합니다. 핵심 수치는 큰 숫자로 바로 보여주는 게 효과적입니다.",
    steps: STEPS_BASIC,
    charts: [
      { id: "timeseries", name: "시계열(확대 가능)", desc: "시간에 따른 값 + 구간 확대.", useWhen: "긴 기간의 추세를 보며 일부를 확대할 때" },
      { id: "candle", name: "캔들스틱", desc: "기간별 시가·고가·저가·종가.", useWhen: "주가처럼 등락 폭을 함께 볼 때" },
      { id: "ohlc", name: "OHLC", desc: "캔들과 비슷한 시·고·저·종가 막대.", useWhen: "금융 시계열의 변동을 볼 때" },
      { id: "waterfall", name: "워터폴", desc: "증가·감소가 쌓여 합계로.", useWhen: "수익·비용이 어떻게 합쳐지는지 볼 때" },
      { id: "funnel", name: "깔때기", desc: "단계마다 줄어드는 수를.", useWhen: "검색→선별→포함처럼 단계별 감소를 볼 때" },
      { id: "gauge", name: "게이지", desc: "한 값을 계기판으로.", useWhen: "목표 대비 현재 수준을 한눈에 보일 때" },
      { id: "kpi", name: "핵심 수치(KPI)", desc: "중요한 숫자 + 변화량을 크게.", useWhen: "대표 지표 하나를 강조할 때" },
    ]},
  { key: "계층·흐름", catKo: "비중·구성 그래프 · 4", intro: "전체가 어떤 부분으로 이루어졌는지, 흐름이 어디로 가는지 보는 그래프입니다.",
    why: "전체-부분 관계나 흐름(이동)을 한 그림으로 보여줘, 구성과 경로를 직관적으로 이해시킵니다.",
    steps: STEPS_BASIC,
    charts: [
      { id: "treemap", name: "트리맵", desc: "사각형 크기로 비중을.", useWhen: "항목이 많은 구성 비율을 한눈에 볼 때" },
      { id: "sunburst", name: "선버스트", desc: "계층 구조를 동심원으로.", useWhen: "대분류→소분류 비중을 볼 때" },
      { id: "icicle", name: "아이시클", desc: "계층을 층층 막대로.", useWhen: "분류 단계와 크기를 함께 볼 때" },
      { id: "sankey", name: "생키(흐름도)", desc: "무엇이 어디로 흘러가는지.", useWhen: "이동·전환 경로와 양을 볼 때" },
    ]},
  { key: "지도", catKo: "지도 그래프 · 2", intro: "지역·나라별 값을 지도 위에 보여주는 그래프입니다.",
    why: "지역이 중요한 자료는 지도에 얹어야 ‘어디가 높고 낮은지’가 즉시 보입니다.",
    steps: STEPS_BASIC,
    charts: [
      { id: "choropleth", name: "지역 색칠 지도", desc: "나라·지역을 값에 따라 색칠.", useWhen: "나라/지역별 수치를 비교할 때 (가로축에 나라 이름)" },
      { id: "geobubble", name: "지도 위 버블", desc: "지역에 점 크기로 값을.", useWhen: "도시·지점별 규모를 지도에 표시할 때" },
    ]},
  { key: "3D·ML", catKo: "3D·예측 그래프 · 5", intro: "입체 표현이나 머신러닝·예측 결과를 보여주는 그래프입니다.",
    why: "3차원 관계나 모델 성능(예측력)은 전용 그래프로 봐야 정확히 평가할 수 있습니다.",
    steps: STEPS_BASIC,
    charts: [
      { id: "scatter3d", name: "3D 산점도", desc: "세 값을 입체 점으로.", useWhen: "변수 세 개의 관계를 입체로 볼 때" },
      { id: "surface", name: "표면(3D)", desc: "값을 입체 곡면으로.", useWhen: "두 값에 따른 결과의 ‘지형’을 볼 때" },
      { id: "regression", name: "회귀선(추세선)", desc: "점들 사이 추세 직선을.", useWhen: "두 값의 관계를 직선으로 요약할 때" },
      { id: "cluster", name: "군집 산점도", desc: "그룹별로 색을 다르게.", useWhen: "비슷한 것끼리 묶인 군집을 볼 때" },
      { id: "roc", name: "ROC 곡선", desc: "분류 모델 성능 곡선.", useWhen: "예/아니오 예측 모델이 얼마나 정확한지 볼 때" },
    ]},
];

export const allCharts = (): (ChartInfo & { cat: string; catKo: string })[] =>
  CHART_CATALOG.flatMap((c) => c.charts.map((ch) => ({ ...ch, cat: c.key, catKo: c.catKo })));
export const chartById = (id: string) => {
  for (const c of CHART_CATALOG) { const ch = c.charts.find((x) => x.id === id); if (ch) return { chart: ch, category: c }; }
  return null;
};
