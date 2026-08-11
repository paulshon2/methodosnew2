// @ts-nocheck
// Research Visualization Engine v2 — React/TS (from public/viz/standard.html)
declare global { interface Window { Chart?: any } }

import { staticAsset } from "./static-asset";

export const PIPE_LABELS = ["Method Engine", "Analysis Engine", "Viz Ontology", "Visualization", "Dashboard", "Report"] as const;

const R=(v,d=2)=>isNaN(v)?v:+v.toFixed(d);
const RG=(lo,hi)=>lo+Math.random()*(hi-lo);

/* ─── STAT FUNCTIONS ─── */
function ST(arr){
  const n=arr.map(Number).filter(v=>!isNaN(v)).sort((a,b)=>a-b);
  if(!n.length)return null;
  const len=n.length,mean=R(n.reduce((a,b)=>a+b,0)/len,3);
  const std=R(Math.sqrt(n.reduce((a,b)=>a+(b-mean)**2,0)/len),3);
  const med=len%2===0?R((n[len/2-1]+n[len/2])/2,2):n[Math.floor(len/2)];
  return{n:len,mean,std,min:n[0],max:n[len-1],med,q1:n[Math.floor(len/4)],q3:n[Math.floor(3*len/4)]};
}
function PR(x,y){
  const n=Math.min(x.length,y.length),xl=x.slice(0,n),yl=y.slice(0,n);
  const mx=xl.reduce((a,b)=>a+b,0)/n,my=yl.reduce((a,b)=>a+b,0)/n;
  const num=xl.reduce((a,xi,i)=>a+(xi-mx)*(yl[i]-my),0);
  const den=Math.sqrt(xl.reduce((a,xi)=>a+(xi-mx)**2,0)*yl.reduce((a,yi)=>a+(yi-my)**2,0));
  return den===0?0:R(num/den,3);
}
function OLS(x,y){
  const n=x.length,sx=x.reduce((a,b)=>a+b,0),sy=y.reduce((a,b)=>a+b,0);
  const sxy=x.reduce((a,b,i)=>a+b*y[i],0),sx2=x.reduce((a,b)=>a+b*b,0);
  const sl=(n*sxy-sx*sy)/(n*sx2-sx*sx);
  const ic=(sy-sl*sx)/n;
  const yh=x.map(xi=>sl*xi+ic);
  const ssr=y.reduce((a,yi,i)=>a+(yi-yh[i])**2,0),sst=y.reduce((a,yi)=>a+(yi-sy/n)**2,0);
  const r2=sst>0?R(1-ssr/sst,3):0,se=R(Math.sqrt(ssr/Math.max(1,n-2)),3);
  const mx=sx/n,ssx=x.reduce((a,xi)=>a+(xi-mx)**2,0);
  const t=n>30?1.96:2.1;
  return{sl:R(sl,4),ic:R(ic,2),r2,se,yh,res:y.map((yi,i)=>R(yi-yh[i],2)),
    ci:x.map(xi=>{const sep=se*Math.sqrt(1/n+(xi-mx)**2/Math.max(1,ssx)),yhat=sl*xi+ic;return{lo:R(yhat-t*sep,1),hi:R(yhat+t*sep,1)};})};
}

/* ─── SAMPLE DATA ─── */
function MKD(id){
  if(id==='survey')return{q:['일-삶 균형','팀 협업','관리자 지원','경력 성장','보상 수준'],dist:[[5,10,20,40,25],[3,7,15,46,29],[8,15,22,35,20],[10,20,25,30,15],[12,18,30,28,12]],means:[3.70,3.91,3.44,3.20,3.10],n:200,rr:78.5,nps:42,sat:65};
  if(id==='regression'){
    const pts=[];for(let i=0;i<40;i++){const s=R(700+RG(0,2400),0),p=R(50+s*.17+RG(-55,55),1);pts.push({x:s,y:p});}
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),reg=OLS(xs,ys);
    return{pts,xs,ys,reg,coef:[{n:'면적(sqft)',s:.54,lo:.43,hi:.65},{n:'침실 수',s:.30,lo:.19,hi:.41},{n:'차고 유무',s:.27,lo:.12,hi:.42},{n:'건물 연령',s:-.19,lo:-.31,hi:-.07}],n:40};
  }
  if(id==='timeseries'){
    const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const b23=[420,445,390,460,510,480,540,565,520,580,610,590],b24=[640,670,620,710,755,730,800,840,790,870,910,960];
    const all=[...b23,...b24];
    const ma=all.map((_,i)=>i<2?null:R((all[i]+all[i-1]+all[i-2])/3,0));
    const gr=all.slice(1).map((v,i)=>R((v/all[i]-1)*100,1));
    return{mo,b23,b24,all,ma,gr,n:24};
  }
  if(id==='experiment'){
    const gb=(mu,sd,n)=>Array.from({length:n},()=>R(mu+sd*(Math.random()+Math.random()-1)*Math.SQRT2,1));
    const cp=gb(71,1.8,25),tp=gb(70.5,1.9,25);
    const cpo=cp.map(v=>R(v+RG(-1,2.2),1)),tpo=tp.map(v=>R(v+RG(9,15),1));
    const sc=ST(cpo),st=ST(tpo);
    const es=R((st.mean-sc.mean)/((sc.std+st.std)/2),2);
    return{cp,cpo,tp,tpo,cc:cp.map((v,i)=>R(cpo[i]-v,1)),tc:tp.map((v,i)=>R(tpo[i]-v,1)),sc,st,es,pv:'< 0.001',n:50};
  }
  if(id==='correlation'){
    const d=[];
    for(let i=0;i<60;i++){const aq=R(RG(30,100),0),te=R(RG(15,42),1),hu=R(RG(40,95),0),hs=R(Math.max(20,Math.min(100,100-aq*.3+te*.4-hu*.1+RG(-9,9))),0);d.push({aqi:aq,temp:te,hum:hu,hs});}
    const aq=d.map(p=>p.aqi),te=d.map(p=>p.temp),hu=d.map(p=>p.hum),hs=d.map(p=>p.hs);
    const cm=[[1,PR(aq,te),PR(aq,hu),PR(aq,hs)],[PR(te,aq),1,PR(te,hu),PR(te,hs)],[PR(hu,aq),PR(hu,te),1,PR(hu,hs)],[PR(hs,aq),PR(hs,te),PR(hs,hu),1]];
    return{d,cm,vn:['AQI','온도','습도','건강점수'],n:60};
  }
  if(id==='comparative')return{g:['북부','남부','동부','서부'],m:['매출($M)','판매량(K)','만족도','성장률(%)'],v:[[42.3,18.7,7.8,12.4],[38.1,22.1,8.2,15.6],[51.7,15.3,7.1,8.9],[29.4,19.8,8.9,18.2]],ix:[[104.8,94.4,95.1,89.8],[94.4,111.6,100,113],[128.1,77.3,86.6,64.4],[72.8,100,108.5,131.7]],n:60};
  if(id==='meta')return{studies:[{nm:'Kim et al.(2021)',d:.65,se:.18,n:120,w:22.1},{nm:'Park & Lee(2020)',d:.42,se:.22,n:80,w:16.3},{nm:'Cho et al.(2022)',d:.78,se:.15,n:190,w:27.8},{nm:'Jung(2019)',d:.31,se:.28,n:55,w:10.5},{nm:'Shin et al.(2021)',d:.56,se:.20,n:100,w:19.3},{nm:'Yoon(2023)',d:.82,se:.24,n:72,w:14.0}],pooled:{d:.61,ci:[.43,.79]},i2:38.4,q:8.23,df:5,qp:.14,n:6};
  if(id==='qualitative')return{themes:['업무 자율성','의사소통','보상·인센티브','성장 기회','팀 분위기','리더십','워라밸'],freq:[28,24,21,19,17,15,12],sent:{pos:42,neu:35,neg:23},ivw:['P01','P02','P03','P04','P05','P06','P07','P08'],cov:[[1,0,1,1,0,0,1],[1,1,1,0,1,0,0],[0,1,0,1,1,1,0],[1,1,0,0,0,1,1],[0,0,1,1,1,0,1],[1,0,1,0,1,1,0],[0,1,0,1,0,1,1],[1,1,0,1,1,0,0]],n:8};
}

/* ─── METHODS ─── */
const METHODS=[
  {id:'survey',cat:'기술통계',nm:'Survey / Questionnaire',ic:'ti-list-check',desc:'Likert 척도 응답 분포·NPS·집계 의견 분석',n:'50–2,000',dt:'Ordinal',out:'Distribution',col:'#534AB7'},
  {id:'regression',cat:'추론통계',nm:'Regression Analysis',ic:'ti-trending-up',desc:'예측변수-결과 관계 모델링, R²·계수 추정',n:'30+',dt:'Continuous',out:'Prediction',col:'#1D9E75'},
  {id:'timeseries',cat:'탐색분석',nm:'Time Series Analysis',ic:'ti-chart-line',desc:'추세·계절성·이동평균·MoM 성장률 탐지',n:'12+ 기간',dt:'Temporal',out:'Trend',col:'#D85A30'},
  {id:'experiment',cat:'인과추론',nm:'Experiment / RCT',ic:'ti-flask',desc:'사전-사후 설계, 처리 효과 크기·통계적 유의성',n:'20+ /그룹',dt:'Continuous',out:'Causal Effect',col:'#378ADD'},
  {id:'correlation',cat:'관계분석',nm:'Correlation Study',ic:'ti-chart-dots',desc:'다변량 상관 구조·히트맵·버블 산점도 탐색',n:'30+',dt:'Continuous',out:'Relationship',col:'#BA7517'},
  {id:'comparative',cat:'비교분석',nm:'Comparative Study',ic:'ti-chart-bar',desc:'복수 집단을 다수 KPI로 동시 프로파일링',n:'15+ /그룹',dt:'Mixed',out:'Profile',col:'#D4537E'},
  {id:'meta',cat:'메타분석',nm:'Meta-Analysis',ic:'ti-books',desc:'독립 연구 통합, 포레스트 플롯·이질성 평가',n:'5+ 연구',dt:'Effect Sizes',out:'Pooled Effect',col:'#639922'},
  {id:'qualitative',cat:'질적분석',nm:'Qualitative / Thematic',ic:'ti-quote',desc:'테마 빈도·감정 분포·코버리지 히트맵',n:'6+ 사례',dt:'Text',out:'Themes',col:'#888780'},
];

/* ─── ONTOLOGY ─── */
const ONT={
  survey:[
    {nm:'발산형 Likert 누적 막대',ic:'ti-chart-bar',p:'Few',pt:'Show Me the Numbers(2012) Ch.5 — 중립 중심 발산형이 Likert 표준',r:'중립을 0으로 동의/반대가 양방향으로 뻗는 발산형 누적 막대. Few: 위치 인코딩은 길이 인코딩보다 빠른 크기 비교를 가능하게 합니다.',easy:'쉬운 말: “보통(3점)”을 가운데(0)에 두고, 왼쪽은 불만족(1–2점)·오른쪽은 만족(4–5점)을 쌓아 보여 줍니다. Likert=1~5 정도 문항, 누적 막대=비율을 이어 붙인 그래프입니다. 예) 오른쪽이 길면 대체로 만족.'},
    {nm:'NPS 종합 만족도 도넛',ic:'ti-circle-half',p:'Knaflic',pt:'Storytelling with Data(2015) Ch.2 — 부분-전체를 단일 임팩트 지표로',r:'도넛으로 종합 만족도를 압축합니다. Knaflic: 경영진에게는 세부사항 전에 단 하나의 명확한 수치가 필요합니다.',easy:'쉬운 말: “주변에 추천하겠어요?” 0–10 응답으로 추천자(9–10)% − 비추천자(0–6)% = NPS. 도넛 가운데에 그 한 숫자를 크게 보여 줍니다.'},
    {nm:'문항별 평균 수평 막대 (색 의미 인코딩)',ic:'ti-chart-bar-off',p:'Tufte',pt:'The Visual Display of Quantitative Information(2001) Ch.4 — data-ink ratio 극대화',r:'색상으로 임계값(3.5 이상=녹색, 미만=주황/적색) 의미를 인코딩합니다. Tufte: 불필요한 장식을 제거하고 데이터 자체가 말하도록 합니다.',easy:'쉬운 말: 문항 평균을 가로 막대로 비교하고, 3.5 이상은 초록(양호)·미만은 주황/빨강(개선)으로 칠합니다. 약한 문항을 바로 찾습니다.'},
  ],
  regression:[
    {nm:'산점도 + 회귀선 + 95% CI 밴드',ic:'ti-chart-dots',p:'Tufte',pt:'The Visual Display of Quantitative Information(2001) Ch.3 — 원데이터+요약의 공존',r:'점산도에 적합선과 신뢰구간 밴드를 중첩합니다. Tufte: 원데이터와 통계 요약을 한 화면에 보여 투명성을 높입니다.'},
    {nm:'표준화 계수 + 95% CI 수평 막대',ic:'ti-chart-bar',p:'Few',pt:'Now You See It(2020) Ch.7 — 불확실성을 CI로 항상 시각화',r:'표준화 계수와 CI를 수평 막대로 표현합니다. CI가 0을 포함하는지로 유의성을 즉시 판독합니다. Few: 추정값만으로는 불충분합니다.'},
    {nm:'잔차 vs 적합값 진단 산점도',ic:'ti-wave-sine',p:'Few',pt:'Now You See It(2020) Ch.9 — 시각적 모델 가정 검증',r:'잔차 플롯으로 선형성·등분산성 가정을 검증합니다. 무작위 산포=가정 충족, 패턴 존재=위반 신호입니다.'},
  ],
  timeseries:[
    {nm:'추세선 + 3개월 이동평균 이중 레이어',ic:'ti-chart-line',p:'Knaflic',pt:'Storytelling with Data(2015) Ch.2 — 선형 차트가 시간 연속 데이터 표준',r:'실측값과 이동평균을 이중 레이어로 표현해 신호와 노이즈를 분리합니다. Knaflic: 독자가 트렌드 이야기를 따라갈 시각적 앵커를 제공합니다.'},
    {nm:'전년 동월 비교 그룹 막대',ic:'ti-chart-bar',p:'Few',pt:'Show Me the Numbers(2012) Ch.6 — 동기간 병렬 비교',r:'같은 달을 연도별로 비교하는 그룹 막대로 계절 패턴과 성장 궤적을 드러냅니다. Few: 시간 맥락 없는 추세는 오독됩니다.'},
    {nm:'MoM 성장률 양음 색상 막대',ic:'ti-arrow-up-right',p:'Tufte',pt:'The Visual Display of Quantitative Information(2001) Ch.6 — 파생 지표로 역학 표현',r:'MoM 성장률로 가속·감속 패턴을 드러냅니다. 양수 초록/음수 빨강으로 방향을 즉각 인식합니다.'},
  ],
  experiment:[
    {nm:'5-수치 박스플롯 (수염+IQR+중앙값)',ic:'ti-chart-bar',p:'Few',pt:'Now You See It(2020) Ch.5 — 박스플롯은 분포 비교의 표준',r:'min·Q1·중앙값·Q3·max를 완전하게 표현하는 박스플롯. Few: 분포 형태와 이상값을 동시에 드러내는 가장 효율적인 그래프입니다.'},
    {nm:'사전-사후 그룹 막대 + 변화 Δ 표시',ic:'ti-chart-bar',p:'Knaflic',pt:'Storytelling with Data(2015) Ch.4 — 핵심 비교를 전면에',r:'두 집단의 사전·사후 평균을 비교합니다. Knaflic: 처리 효과를 히어로 스토리로 만들어 의사결정자의 주목을 유도합니다.'},
    {nm:'변화점수 분포 히스토그램 비교',ic:'ti-arrows-diff',p:'Tufte',pt:'The Visual Display of Quantitative Information(2001) Ch.6 — 변화를 직접 인코딩',r:'변화점수(사후-사전)를 직접 플롯합니다. Tufte: 이전·이후 상태가 아닌 변화 자체를 주축으로 삼아 처리 효과를 히어로화합니다.'},
  ],
  correlation:[
    {nm:'버블 산점도 (3변수 동시 인코딩)',ic:'ti-chart-dots',p:'Tufte',pt:'The Visual Display of Quantitative Information(2001) Ch.5 — 다차원 데이터 다변량 인코딩',r:'x·y 위치와 버블 크기로 3변수를 동시에 인코딩합니다. Tufte: 차원 추가는 data-ink ratio를 높이되 인지 과부하를 피해야 합니다.'},
    {nm:'상관 매트릭스 히트맵 (색상+계수값)',ic:'ti-grid-3x3',p:'Few',pt:'Now You See It(2020) Ch.11 — 색상+수치 이중 인코딩이 정확한 해석 보장',r:'모든 쌍별 r을 색상과 수치로 동시에 표현합니다. Few: 색강도 단독은 정확도 한계가 있어 수치 레이블과 결합해야 합니다.'},
    {nm:'보조 변수 산점도 + 추세선',ic:'ti-chart-scatter',p:'Knaflic',pt:'Storytelling with Data(2015) Ch.3 — 청중의 주의를 핵심 관계로 집중',r:'온도-건강점수 관계를 상세히 탐색합니다. 추세선과 r값으로 방향과 강도를 명확히 합니다.'},
  ],
  comparative:[
    {nm:'주요 KPI 그룹 막대 비교',ic:'ti-chart-bar',p:'Few',pt:'Show Me the Numbers(2012) Ch.4 — 다중 집단 비교 표준',r:'여러 KPI를 집단별로 동시에 비교합니다. Few: 색상으로 집단 정체성을 일관되게 인코딩, 범례를 최소화합니다.'},
    {nm:'다차원 레이더 프로파일',ic:'ti-chart-radar',p:'Knaflic',pt:'Storytelling with Data(2015) Ch.2 — 다차원 강약점 프로파일',r:'각 집단의 성과 프로파일을 동시에 표현합니다. Knaflic: 복수 지표에서 독특한 패턴 식별에 적합합니다.'},
    {nm:'지수화 막대 (100=전체 평균)',ic:'ti-chart-bar-popular',p:'Tufte',pt:'The Visual Display of Quantitative Information(2001) Ch.7 — 지수화로 다단위 공정 비교',r:'집단 평균을 100으로 지수화해 단위가 다른 KPI들을 공정하게 비교합니다. Tufte: 상대값 인코딩이 절대값보다 비교 효율이 높습니다.'},
  ],
  meta:[
    {nm:'포레스트 플롯 (효과크기·CI·통합 다이아몬드)',ic:'ti-trees',p:'Few',pt:'Now You See It(2020) Ch.7 — 불확실성은 반드시 CI로 표시',r:'각 연구 d±95%CI를 수평선으로 표현, 통합 효과는 다이아몬드로 표시합니다. 메타분석의 국제 표준 시각화입니다.'},
    {nm:'퍼널 플롯 (출판편향 진단)',ic:'ti-filter',p:'Tufte',pt:'The Visual Display of Quantitative Information(2001) Ch.3 — 대칭성으로 편향 탐지',r:'정밀도(1/SE) 대 효과 크기 산점도로 출판 편향을 진단합니다. 비대칭=소규모 연구 편향 시사입니다.'},
    {nm:'효과 크기 분포 히스토그램',ic:'ti-chart-bar',p:'Knaflic',pt:'Storytelling with Data(2015) Ch.2 — 분포 패턴을 히스토그램으로',r:'개별 연구 d값의 분포를 히스토그램으로 시각화합니다. 통합 효과와 CI를 기준선으로 표시해 이질성을 직관적으로 보여줍니다.'},
  ],
  qualitative:[
    {nm:'테마 빈도 수평 막대 (강도 인코딩)',ic:'ti-chart-bar',p:'Few',pt:'Show Me the Numbers(2012) Ch.5 — 순위 정렬 막대로 범주 비교',r:'테마를 빈도순으로 정렬한 수평 막대. 색상 강도로 빈도를 추가 인코딩합니다. Few: 정렬은 패턴 인식을 극대화합니다.'},
    {nm:'감정 분포 도넛 (긍정·중립·부정)',ic:'ti-mood-happy',p:'Knaflic',pt:'Storytelling with Data(2015) Ch.2 — 부분-전체를 단일 지표로',r:'긍정/중립/부정 감정 비율을 도넛으로 집약합니다. Knaflic: 전체 감정 톤을 하나의 임팩트 있는 시각으로 전달합니다.'},
    {nm:'인터뷰×테마 커버리지 히트맵',ic:'ti-grid-3x3',p:'Few',pt:'Now You See It(2020) Ch.11 — 교차 패턴 탐색에 히트맵',r:'인터뷰 × 테마 이진 행렬을 히트맵으로 표현합니다. 어떤 테마가 어느 사례에서 두드러지는지 즉각 파악합니다.'},
  ],
};

/* ─── VARIABLE DEFINITIONS ─── */
const VDEFS={
  survey:[{n:'응답자 ID',t:'Nominal',r:'ID',rng:'1–200'},{n:'일-삶 균형',t:'Ordinal(Likert 5점)',r:'종속변수',rng:'1–5, μ=3.70'},{n:'팀 협업',t:'Ordinal(Likert 5점)',r:'종속변수',rng:'1–5, μ=3.91'},{n:'관리자 지원',t:'Ordinal(Likert 5점)',r:'종속변수',rng:'1–5, μ=3.44'},{n:'경력 성장',t:'Ordinal(Likert 5점)',r:'종속변수',rng:'1–5, μ=3.20'},{n:'보상 수준',t:'Ordinal(Likert 5점)',r:'종속변수',rng:'1–5, μ=3.10'}],
  regression:[{n:'가격($K)',t:'Continuous',r:'종속변수(Y)',rng:'155–650'},{n:'면적(sqft)',t:'Continuous',r:'독립변수 X₁',rng:'800–3,000'},{n:'침실 수',t:'Discrete',r:'독립변수 X₂',rng:'1–6'},{n:'건물 연령(년)',t:'Continuous',r:'독립변수 X₃',rng:'0–50'},{n:'차고',t:'Binary',r:'독립변수 X₄',rng:'0, 1'}],
  timeseries:[{n:'월',t:'Date(순서형)',r:'시간 인덱스',rng:'2023.01–2024.12'},{n:'매출($K)',t:'Continuous',r:'관측값',rng:'390–960'},{n:'MoM 성장률',t:'Continuous(파생)',r:'분석 변수',rng:'-8.3–+15.2%'},{n:'3개월 이동평균',t:'Continuous(파생)',r:'평활값',rng:'418–913'}],
  experiment:[{n:'참가자 ID',t:'Nominal',r:'ID',rng:'1–50'},{n:'집단',t:'Nominal(2수준)',r:'처리 요인',rng:'Control·Treatment'},{n:'사전점수',t:'Continuous',r:'공변량/기저선',rng:'68–76'},{n:'사후점수',t:'Continuous',r:'결과변수',rng:'68–92'},{n:'변화점수',t:'Continuous(파생)',r:'핵심 분석값',rng:'-2–+16'}],
  correlation:[{n:'참가자 ID',t:'Nominal',r:'ID',rng:'1–60'},{n:'AQI',t:'Continuous',r:'예측변수',rng:'30–100'},{n:'기온(°C)',t:'Continuous',r:'예측변수',rng:'15–42'},{n:'습도(%)',t:'Continuous',r:'예측변수',rng:'40–95'},{n:'건강점수',t:'Continuous',r:'결과변수',rng:'20–100'}],
  comparative:[{n:'지역',t:'Nominal(4범주)',r:'그룹 요인',rng:'N·S·E·W'},{n:'매출($M)',t:'Continuous',r:'KPI 1',rng:'29.4–51.7'},{n:'판매량(K)',t:'Continuous',r:'KPI 2',rng:'15.3–22.1'},{n:'만족도(1-10)',t:'Continuous',r:'KPI 3',rng:'7.1–8.9'},{n:'성장률(%)',t:'Continuous',r:'KPI 4',rng:'8.9–18.2'}],
  meta:[{n:'연구 ID',t:'Nominal',r:'ID',rng:'1–6'},{n:"Cohen's d",t:'Continuous',r:'효과 크기',rng:'0.31–0.82'},{n:'표준오차(SE)',t:'Continuous',r:'불확실성',rng:'0.15–0.28'},{n:'표본 크기(N)',t:'Discrete',r:'연구 규모',rng:'55–190'},{n:'역분산 가중치(%)',t:'Continuous',r:'메타분석 가중치',rng:'10.5–27.8'}],
  qualitative:[{n:'인터뷰 ID',t:'Nominal',r:'ID',rng:'P01–P08'},{n:'테마 코드',t:'Nominal',r:'코딩 단위',rng:'7개 테마'},{n:'언급 빈도',t:'Discrete',r:'측도',rng:'12–28'},{n:'감정 레이블',t:'Nominal(3범주)',r:'분류',rng:'긍정·중립·부정'},{n:'커버리지',t:'Binary',r:'유무 행렬',rng:'0, 1'}],
};

/* ─── CHART INSTANCES ─── */
const CI={};
function DC(id){if(CI[id]){try{CI[id].destroy();}catch(e){}delete CI[id];}}
function CC(id,cfg){DC(id);const c=document.getElementById(id);if(!c)return;try{CI[id]=new Chart(c,cfg);}catch(e){console.warn(e);}}

/* ─── WHISKER PLUGIN (box plot) ─── */
const WP={id:'wp',afterDatasetsDraw(chart){
  if(!chart._bp)return;
  const ctx=chart.ctx,meta=chart.getDatasetMeta(0),gd=chart._bp;
  gd.forEach((g,i)=>{
    if(!meta.data[i])return;
    const bx=meta.data[i],x=bx.x,bw=Math.max(18,bx.width*.45);
    const q1=chart.scales.y.getPixelForValue(g.q1),q3=chart.scales.y.getPixelForValue(g.q3);
    const mn=chart.scales.y.getPixelForValue(g.min),mx=chart.scales.y.getPixelForValue(g.max);
    const md=chart.scales.y.getPixelForValue(g.med);
    ctx.save();
    ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(x-bw,md);ctx.lineTo(x+bw,md);ctx.stroke();
    ctx.strokeStyle=i===0?'#5F5E5A':'#3C3489';ctx.lineWidth=1.8;
    [q1,q3].forEach(qy=>{const end=qy===q1?mn:mx;ctx.beginPath();ctx.moveTo(x,qy);ctx.lineTo(x,end);ctx.stroke();ctx.beginPath();ctx.moveTo(x-bw*.55,end);ctx.lineTo(x+bw*.55,end);ctx.stroke();});
    ctx.restore();
  });
}};

/* ─── HEATMAP LABEL PLUGIN ─── */
const HLP={id:'hlp',afterDatasetsDraw(chart){
  if(!chart._hm)return;
  const ctx=chart.ctx;
  chart.data.datasets.forEach((ds,di)=>{
    chart.getDatasetMeta(di).data.forEach((pt,pi)=>{
      const v=chart._hm[di]?.[pi];if(v===undefined)return;
      ctx.save();ctx.font='bold 10px sans-serif';
      ctx.fillStyle=Math.abs(v)>.35?'rgba(255,255,255,.92)':'var(--color-text-primary,#222)';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(v.toFixed(2),pt.x,pt.y);ctx.restore();
    });
  });
}};

/* ─── FOREST PLUGIN ─── */
const FP={id:'fp',afterDatasetsDraw(chart){
  if(!chart._fp)return;
  const ctx=chart.ctx,meta=chart.getDatasetMeta(0),rows=chart._fp;
  rows.forEach((s,i)=>{
    const pt=meta.data[i];if(!pt)return;
    const y=pt.y,lo=chart.scales.x.getPixelForValue(s.lo),hi=chart.scales.x.getPixelForValue(s.hi);
    ctx.save();
    if(s.isP){
      const w=(hi-lo)/2,h=8;
      ctx.fillStyle='#534AB7';ctx.beginPath();ctx.moveTo(lo+w,y-h);ctx.lineTo(hi,y);ctx.lineTo(lo+w,y+h);ctx.lineTo(lo,y);ctx.closePath();ctx.fill();
    }else{
      ctx.strokeStyle='rgba(83,74,183,.55)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(lo,y);ctx.lineTo(hi,y);ctx.stroke();
      ctx.strokeStyle='rgba(83,74,183,.8)';ctx.lineWidth=1.5;
      [lo,hi].forEach(xi=>{ctx.beginPath();ctx.moveTo(xi,y-5);ctx.lineTo(xi,y+5);ctx.stroke();});
    }
    ctx.restore();
  });
}};

/* ─── CHART RENDERERS ─── */
const CR={
  survey:{
    0:(id,d)=>CC(id,{type:'bar',data:{labels:d.q,datasets:[
      {label:'강한 반대',data:d.dist.map(r=>-r[0]),backgroundColor:'#A32D2D',borderWidth:0},
      {label:'반대',data:d.dist.map(r=>-r[1]),backgroundColor:'#F09595',borderWidth:0},
      {label:'중립',data:d.dist.map(r=>r[2]),backgroundColor:'#B4B2A9',borderWidth:0},
      {label:'동의',data:d.dist.map(r=>r[3]),backgroundColor:'#5DCAA5',borderWidth:0},
      {label:'강한 동의',data:d.dist.map(r=>r[4]),backgroundColor:'#0F6E56',borderWidth:0},
    ]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      scales:{x:{ticks:{callback:v=>`${Math.abs(v)}%`,font:{size:10}},title:{display:true,text:'응답 비율 (%)',font:{size:10}}},y:{ticks:{font:{size:10}}}},
      plugins:{legend:{position:'top',labels:{font:{size:9},padding:6,boxWidth:10}},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${Math.abs(ctx.raw)}%`}}}}}),
    1:(id,d)=>CC(id,{type:'doughnut',data:{labels:[`만족 (${d.sat}%)`,`중립 (20%)`,`불만족 (${100-d.sat-20}%)`],datasets:[{data:[d.sat,20,100-d.sat-20],backgroundColor:['#0F6E56','#B4B2A9','#D85A30'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8}}}}}),
    2:(id,d)=>CC(id,{type:'bar',data:{labels:d.q,datasets:[{label:'평균 점수',data:d.means,backgroundColor:d.means.map(v=>v>=3.5?'rgba(15,110,86,.8)':v>=3?'rgba(186,117,23,.8)':'rgba(216,90,48,.8)'),borderRadius:5,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{min:1,max:5,ticks:{stepSize:.5,font:{size:10}},title:{display:true,text:'평균 점수 (5점 척도)',font:{size:10}}},y:{ticks:{font:{size:10}}}},plugins:{legend:{display:false}}}}),
  },
  regression:{
    0:(id,d)=>{
      const reg=d.reg,sorted=[...d.pts].sort((a,b)=>a.x-b.x);
      const lnPts=sorted.map(p=>({x:p.x,y:R(reg.sl*p.x+reg.ic,1)}));
      const ciU=sorted.map((p,i)=>{const idx=d.pts.findIndex(q=>q.x===p.x&&q.y===p.y);return{x:p.x,y:reg.ci[idx>=0?idx:0]?.hi??lnPts[i].y+20};});
      const ciL=sorted.map((p,i)=>{const idx=d.pts.findIndex(q=>q.x===p.x&&q.y===p.y);return{x:p.x,y:reg.ci[idx>=0?idx:0]?.lo??lnPts[i].y-20};});
      CC(id,{type:'scatter',data:{datasets:[
        {label:'데이터 포인트',data:d.pts,backgroundColor:'rgba(83,74,183,.45)',borderColor:'#534AB7',borderWidth:1,pointRadius:5,order:3},
        {label:`회귀선 R²=${reg.r2}`,data:lnPts,type:'line',borderColor:'#D85A30',borderWidth:2.5,pointRadius:0,tension:0,order:1},
        {label:'95% CI',data:ciU,type:'line',borderColor:'rgba(216,90,48,.2)',backgroundColor:'rgba(216,90,48,.09)',fill:'+1',pointRadius:0,tension:.2,order:2,borderWidth:1},
        {label:'_ci_lo',data:ciL,type:'line',borderColor:'rgba(216,90,48,.2)',fill:false,pointRadius:0,tension:.2,order:2,borderWidth:1},
      ]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:'면적 (sqft)',font:{size:10}}},y:{title:{display:true,text:'가격 ($K)',font:{size:10}}}},plugins:{legend:{labels:{font:{size:10},filter:i=>i.text!=='_ci_lo'}}}}});
    },
    1:(id,d)=>CC(id,{type:'bar',data:{labels:d.coef.map(c=>c.n),datasets:[
      {label:'95% CI 범위',data:d.coef.map(c=>[c.lo,c.hi]),backgroundColor:d.coef.map(c=>c.s>0?'rgba(83,74,183,.25)':'rgba(216,90,48,.25)'),borderWidth:0,order:2},
      {label:'표준화 계수 β',data:d.coef.map(c=>c.s),backgroundColor:d.coef.map(c=>c.s>0?'rgba(83,74,183,.85)':'rgba(216,90,48,.85)'),borderRadius:4,borderWidth:0,order:1},
    ]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{title:{display:true,text:'β (표준화)',font:{size:10}}},y:{ticks:{font:{size:10}}}},plugins:{legend:{labels:{font:{size:10}}}}}}),
    2:(id,d)=>{
      const reg=d.reg;
      const resD=d.pts.map((p,i)=>({x:R(reg.sl*p.x+reg.ic,1),y:reg.res[i]??R(p.y-(reg.sl*p.x+reg.ic),2)}));
      const xMin=Math.min(...resD.map(p=>p.x))-5,xMax=Math.max(...resD.map(p=>p.x))+5;
      CC(id,{type:'scatter',data:{datasets:[
        {label:'잔차',data:resD,backgroundColor:'rgba(29,158,117,.5)',borderColor:'#1D9E75',borderWidth:1,pointRadius:5,order:2},
        {label:'잔차=0 기준선',data:[{x:xMin,y:0},{x:xMax,y:0}],type:'line',borderColor:'rgba(216,90,48,.6)',borderWidth:1.5,pointRadius:0,borderDash:[5,4],order:1},
      ]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:'적합값 (Ŷ)',font:{size:10}}},y:{title:{display:true,text:'잔차 (e)',font:{size:10}}}},plugins:{legend:{labels:{font:{size:10}}}}}});
    },
  },
  timeseries:{
    0:(id,d)=>{const lb=[...d.mo.map(m=>m+"'23"),...d.mo.map(m=>m+"'24")];CC(id,{type:'line',data:{labels:lb,datasets:[{label:'월 매출($K)',data:d.all,borderColor:'#534AB7',backgroundColor:'rgba(83,74,183,.07)',fill:true,borderWidth:2,pointRadius:2.5,tension:.3},{label:'3개월 MA',data:d.ma,borderColor:'#D85A30',borderWidth:2.5,pointRadius:0,tension:.3,borderDash:[6,3]}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{maxRotation:45,autoSkip:true,maxTicksLimit:12,font:{size:9}}}},plugins:{legend:{labels:{font:{size:10}}}}}});},
    1:(id,d)=>CC(id,{type:'bar',data:{labels:d.mo,datasets:[{label:'2023년',data:d.b23,backgroundColor:'rgba(175,169,236,.75)',borderRadius:3,borderWidth:0},{label:'2024년',data:d.b24,backgroundColor:'rgba(83,74,183,.85)',borderRadius:3,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{font:{size:9}}}},plugins:{legend:{labels:{font:{size:10}}}}}}),
    2:(id,d)=>{const lb=[...d.mo.slice(1).map(m=>m+"'23"),...d.mo.map(m=>m+"'24")].slice(0,23);CC(id,{type:'bar',data:{labels:lb,datasets:[{label:'MoM 성장률(%)',data:d.gr,backgroundColor:d.gr.map(v=>v>=0?'rgba(15,110,86,.8)':'rgba(216,90,48,.8)'),borderRadius:3,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{maxRotation:45,autoSkip:true,maxTicksLimit:10,font:{size:9}}},y:{title:{display:true,text:'MoM 성장률 (%)',font:{size:10}}}},plugins:{legend:{display:false}}}});},
  },
  experiment:{
    0:(id,d)=>{
      const gp=[{nm:'대조군',min:Math.min(...d.cpo),q1:d.sc.q1,med:d.sc.med,q3:d.sc.q3,max:Math.max(...d.cpo)},{nm:'처리군',min:Math.min(...d.tpo),q1:d.st.q1,med:d.st.med,q3:d.st.q3,max:Math.max(...d.tpo)}];
      CC(id,{type:'bar',data:{labels:gp.map(g=>g.nm),datasets:[{label:'IQR 박스 (Q1–Q3)',data:gp.map(g=>[g.q1,g.q3]),backgroundColor:['rgba(136,135,128,.5)','rgba(83,74,183,.55)'],borderColor:['#888780','#534AB7'],borderWidth:1.8,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:R(Math.min(...d.cpo,...d.tpo)-3,0),max:R(Math.max(...d.cpo,...d.tpo)+3,0),title:{display:true,text:'점수',font:{size:10}}}},plugins:{legend:{display:false}}},plugins:[WP]});
      if(CI[id])CI[id]._bp=gp;
    },
    1:(id,d)=>{
      CC(id,{type:'bar',data:{labels:['대조군','처리군'],datasets:[
        {label:'사전 평균',data:[R(d.cp.reduce((a,b)=>a+b,0)/d.cp.length),R(d.tp.reduce((a,b)=>a+b,0)/d.tp.length)],backgroundColor:'rgba(180,178,169,.7)',borderRadius:4,borderWidth:0},
        {label:'사후 평균',data:[d.sc.mean,d.st.mean],backgroundColor:['rgba(136,135,128,.8)','rgba(83,74,183,.85)'],borderRadius:4,borderWidth:0},
      ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:60,title:{display:true,text:'점수',font:{size:10}}}},plugins:{legend:{labels:{font:{size:10}}}}}});
    },
    2:(id,d)=>{const bk=Array.from({length:18},(_,i)=>i-3),cc_=bk.map(b=>d.cc.filter(v=>Math.round(v)===b).length),tc=bk.map(b=>d.tc.filter(v=>Math.round(v)===b).length);CC(id,{type:'bar',data:{labels:bk.map(b=>b>0?'+'+b:''+b),datasets:[{label:'대조군',data:cc_,backgroundColor:'rgba(136,135,128,.7)',borderRadius:3,borderWidth:0},{label:'처리군',data:tc,backgroundColor:'rgba(83,74,183,.8)',borderRadius:3,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{font:{size:9}}},y:{ticks:{stepSize:1}}},plugins:{legend:{labels:{font:{size:10}}}}}});},
  },
  correlation:{
    0:(id,d)=>CC(id,{type:'bubble',data:{datasets:[{label:'AQI vs 건강점수 (크기=습도)',data:d.d.map(p=>({x:p.aqi,y:p.hs,r:Math.max(3,p.hum/13)})),backgroundColor:'rgba(83,74,183,.38)',borderColor:'rgba(83,74,183,.7)',borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,layout:{padding:12},scales:{x:{title:{display:true,text:'AQI',font:{size:10}}},y:{title:{display:true,text:'건강점수',font:{size:10}}}},plugins:{legend:{labels:{font:{size:10}}}}}}),
    1:(id,d)=>{
      const vn=d.vn,n=vn.length;
      CC(id,{type:'scatter',data:{datasets:vn.map((v,row)=>({label:v,data:vn.map((_,col)=>({x:col,y:row})),pointStyle:'rect',pointRadius:34,backgroundColor:vn.map((_,col)=>{const r=d.cm[row][col];return r>.6?'#185FA5':r>.3?'rgba(55,138,221,.65)':r>-.3?'rgba(180,178,169,.3)':r>-.6?'rgba(240,153,123,.7)':'#993C1D';})}))},options:{responsive:true,maintainAspectRatio:false,scales:{x:{type:'linear',min:-.5,max:n-.5,ticks:{stepSize:1,callback:v=>vn[v]??'',font:{size:10}}},y:{type:'linear',min:-.5,max:n-.5,reverse:true,ticks:{stepSize:1,callback:v=>vn[v]??'',font:{size:10}}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${vn[ctx.raw.y]} × ${vn[ctx.raw.x]}: r = ${d.cm[ctx.raw.y]?.[ctx.raw.x]?.toFixed(2)??'–'}`}}}},plugins:[HLP]});
      if(CI[id])CI[id]._hm=vn.map((_,row)=>vn.map((_,col)=>d.cm[row][col]));
    },
    2:(id,d)=>{
      const te=d.d.map(p=>p.temp),hs=d.d.map(p=>p.hs),reg=OLS(te,hs);
      const sl=[...d.d].sort((a,b)=>a.temp-b.temp).map(p=>({x:p.temp,y:R(reg.sl*p.temp+reg.ic,1)}));
      CC(id,{type:'scatter',data:{datasets:[{label:'온도 vs 건강점수',data:d.d.map(p=>({x:p.temp,y:p.hs})),backgroundColor:'rgba(29,158,117,.4)',borderColor:'#1D9E75',borderWidth:1,pointRadius:5,order:2},{label:`추세선 r=${PR(te,hs)}`,data:sl,type:'line',borderColor:'#D85A30',borderWidth:2,pointRadius:0,tension:0,order:1}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:'온도(°C)',font:{size:10}}},y:{title:{display:true,text:'건강점수',font:{size:10}}}},plugins:{legend:{labels:{font:{size:10}}}}}});
    },
  },
  comparative:{
    0:(id,d)=>CC(id,{type:'bar',data:{labels:d.g,datasets:d.m.slice(0,2).map((m,i)=>({label:m,data:d.v.map(r=>r[i]),backgroundColor:['rgba(83,74,183,.8)','rgba(29,158,117,.8)'][i],borderRadius:4,borderWidth:0}))},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{size:10}}}}}}),
    1:(id,d)=>CC(id,{type:'radar',data:{labels:d.m,datasets:d.g.map((g,i)=>({label:g,data:d.ix[i],borderColor:['#534AB7','#1D9E75','#D85A30','#378ADD'][i],backgroundColor:['rgba(83,74,183,.1)','rgba(29,158,117,.1)','rgba(216,90,48,.1)','rgba(55,138,221,.1)'][i],borderWidth:2,pointRadius:3}))},options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:60,max:145,ticks:{font:{size:9}}}},plugins:{legend:{labels:{font:{size:10}}}}}}),
    2:(id,d)=>CC(id,{type:'bar',data:{labels:d.g,datasets:d.m.map((m,i)=>({label:m,data:d.ix.map(r=>r[i]),backgroundColor:['rgba(83,74,183,.8)','rgba(29,158,117,.8)','rgba(216,90,48,.8)','rgba(55,138,221,.8)'][i],borderRadius:4,borderWidth:0}))},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:55,title:{display:true,text:'지수(100=평균)',font:{size:10}}},x:{ticks:{font:{size:10}}}},plugins:{legend:{labels:{font:{size:10}}}}}}),
  },
  meta:{
    0:(id,d)=>{
      const rows=[...d.studies.map(s=>({...s,lo:R(s.d-1.96*s.se,2),hi:R(s.d+1.96*s.se,2),isP:false})),{nm:'통합 효과',d:d.pooled.d,lo:d.pooled.ci[0],hi:d.pooled.ci[1],isP:true}];
      CC(id,{type:'scatter',data:{datasets:[{label:'효과 크기',data:rows.map((s,i)=>({x:s.d,y:i})),backgroundColor:rows.map((_,i)=>i===rows.length-1?'#534AB7':'rgba(83,74,183,.5)'),pointRadius:rows.map((_,i)=>i===rows.length-1?1:6)}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:"Cohen's d",font:{size:10}},min:-.15,max:1.2},y:{type:'linear',min:-.8,max:rows.length-.2,reverse:true,ticks:{stepSize:1,callback:v=>rows[v]?.nm??'',font:{size:9}}}},plugins:{legend:{display:false}}},plugins:[FP]});
      if(CI[id])CI[id]._fp=rows;
    },
    1:(id,d)=>{
      const prec=d.studies.map(s=>R(1/s.se,2));
      CC(id,{type:'scatter',data:{datasets:[{label:'개별 연구',data:d.studies.map((s,i)=>({x:s.d,y:prec[i]})),backgroundColor:'rgba(83,74,183,.55)',borderColor:'#534AB7',borderWidth:1,pointRadius:7},{label:'통합 효과',data:[{x:d.pooled.d,y:0}],backgroundColor:'#D85A30',borderColor:'#993C1D',borderWidth:2,pointRadius:11,pointStyle:'triangle'}]},options:{responsive:true,maintainAspectRatio:false,layout:{padding:12},scales:{x:{title:{display:true,text:"효과 크기 (d)",font:{size:10}}},y:{title:{display:true,text:'정밀도 (1/SE)',font:{size:10}},reverse:true,min:-1}},plugins:{legend:{labels:{font:{size:10}}}}}});
    },
    2:(id,d)=>{
      const bins=[-.1,.2,.4,.6,.8,1.1],cnt=bins.slice(0,-1).map((lo,i)=>d.studies.filter(s=>s.d>=lo&&s.d<bins[i+1]).length);
      CC(id,{type:'bar',data:{labels:bins.slice(0,-1).map((lo,i)=>`${lo}–${bins[i+1]}`),datasets:[{label:'연구 수',data:cnt,backgroundColor:'rgba(83,74,183,.8)',borderRadius:4,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:"Cohen's d 구간",font:{size:10}}},y:{ticks:{stepSize:1},title:{display:true,text:'연구 수',font:{size:10}}}},plugins:{legend:{display:false}}}});
    },
  },
  qualitative:{
    0:(id,d)=>{
      const so=[...d.themes.map((t,i)=>({t,f:d.freq[i]}))].sort((a,b)=>b.f-a.f);
      const mx=Math.max(...so.map(s=>s.f));
      CC(id,{type:'bar',data:{labels:so.map(s=>s.t),datasets:[{label:'언급 빈도',data:so.map(s=>s.f),backgroundColor:so.map(s=>`rgba(83,74,183,${.3+.55*(s.f/mx)})`),borderRadius:4,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{title:{display:true,text:'코딩 빈도',font:{size:10}}},y:{ticks:{font:{size:10}}}},plugins:{legend:{display:false}}}});
    },
    1:(id,d)=>CC(id,{type:'doughnut',data:{labels:[`긍정 (${d.sent.pos}%)`,`중립 (${d.sent.neu}%)`,`부정 (${d.sent.neg}%)`],datasets:[{data:[d.sent.pos,d.sent.neu,d.sent.neg],backgroundColor:['#0F6E56','#B4B2A9','#D85A30'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8}}}}}),
    2:(id,d)=>{
      const ni=d.ivw.length,nt=d.themes.length;
      const QP={id:'qp',afterDatasetsDraw(chart){if(!chart._qm)return;const ctx=chart.ctx;chart.data.datasets.forEach((ds,di)=>{chart.getDatasetMeta(di).data.forEach((pt,pi)=>{const v=chart._qm[di]?.[pi];if(v===undefined)return;ctx.save();ctx.font='11px sans-serif';ctx.fillStyle=v?'rgba(255,255,255,.85)':'rgba(180,178,169,.5)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v?'●':'',pt.x,pt.y);ctx.restore();});});}};
      CC(id,{type:'scatter',data:{datasets:d.ivw.map((iv,row)=>({label:iv,data:d.themes.map((_,col)=>({x:col,y:row})),pointStyle:'rect',pointRadius:28,backgroundColor:d.themes.map((_,col)=>d.cov[row]?.[col]?'rgba(83,74,183,.65)':'rgba(180,178,169,.15)')  }))},options:{responsive:true,maintainAspectRatio:false,scales:{x:{type:'linear',min:-.5,max:nt-.5,ticks:{stepSize:1,callback:v=>d.themes[v]?d.themes[v].slice(0,4)+'…':'',font:{size:8}}},y:{type:'linear',min:-.5,max:ni-.5,reverse:true,ticks:{stepSize:1,callback:v=>d.ivw[v]||'',font:{size:9}}}},plugins:{legend:{display:false}}},plugins:[QP]});
      if(CI[id])CI[id]._qm=d.ivw.map((_,r)=>d.themes.map((_,c)=>d.cov[r]?.[c]));
    },
  },
};

/* ─── METRICS ─── */
const METS={
  survey:d=>[{l:'응답 수',v:d.n,s:`응답률 ${d.rr}%`},{l:'전체 만족도',v:`${d.sat}%`,s:'만족 이상 비율'},{l:'최고 문항',v:'3.91',s:'팀 협업 평균'},{l:'NPS',v:`+${d.nps}`,s:'순추천고객지수'}],
  regression:d=>[{l:'R²',v:d.reg?.r2,s:'분산 설명력'},{l:'SE',v:`${d.reg?.se}K`,s:'잔차 표준오차'},{l:'N (관측)',v:d.n,s:'완전 사례'},{l:'유의 예측변수',v:'3/4',s:'α=.05 기준'}],
  timeseries:_=>[{l:'CAGR',v:'14.2%',s:'2년 복합성장'},{l:'최고 매출',v:'$960K',s:'2024.12'},{l:'YoY 성장',v:'+52.5%',s:'2024 vs 2023'},{l:'MoM 변동성',v:'8.3%',s:'표준편차'}],
  experiment:d=>[{l:"Cohen's d",v:d.es,s:'대형 효과 (>.8)'},{l:'p-값',v:d.pv,s:'통계적 유의'},{l:'Δ 처리 평균',v:`+${R(d.st.mean-d.sc.mean)}`,s:'처리 효과 크기'},{l:'N',v:d.n,s:'무작위 배정'}],
  correlation:d=>[{l:'최강 r',v:d.cm[0][1].toFixed(2),s:'AQI × 온도'},{l:'R² 추정',v:'0.63',s:'다변량 설명력'},{l:'N',v:d.n,s:'관측 사례'},{l:'변수 수',v:4,s:'분석 포함'}],
  comparative:_=>[{l:'최고 매출',v:'$51.7M',s:'동부'},{l:'최고 성장',v:'+18.2%',s:'서부'},{l:'최고 만족',v:'8.9',s:'서부'},{l:'비교 집단',v:4,s:'N·S·E·W'}],
  meta:d=>[{l:'통합 효과 d',v:d.pooled.d,s:`95% CI [${d.pooled.ci.join(', ')}]`},{l:'연구 수',v:d.n,s:'포함된 연구'},{l:'I²',v:`${d.i2}%`,s:'이질성 수준'},{l:'Q(df=5)',v:d.q,s:`p=${d.qp}`}],
  qualitative:d=>[{l:'발견 테마',v:d.themes.length,s:'코딩된 테마 수'},{l:'최고 빈도',v:d.freq[0],s:d.themes[0]},{l:'긍정 감정',v:`${d.sent.pos}%`,s:'전체 감정 톤'},{l:'인터뷰 수',v:d.n,s:'참여자'}],
};


export function ensureChart(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.Chart) return Promise.resolve(window.Chart);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = staticAsset("vendor/chart.umd.js");
    s.onload = () => resolve(window.Chart);
    s.onerror = () => {
      const cdn = document.createElement("script");
      cdn.src = "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js";
      cdn.onload = () => resolve(window.Chart);
      cdn.onerror = reject;
      document.head.appendChild(cdn);
    };
    document.head.appendChild(s);
  });
}

export function destroyAllCharts() { Object.keys(CI).forEach((id) => DC(id)); }

export function paintCharts(methodId: string, data: unknown, indices: number[], prefix: string) {
  indices.forEach((ci) => { const r = CR[methodId]?.[ci]; if (r) r(`${prefix}_${ci}`, data); });
}

export type StdMethod = (typeof METHODS)[number];

/** 초보용 · Method Engine 아코디언 설명 */
export const METHOD_EASY: Record<string, { summary: string; example: string; when: string }> = {
  survey: {
    summary: "사람들을 설문으로 물어보고, 점수·비율로 의견을 모으는 방법입니다.",
    example: "예) 직원 200명에게 ‘팀 협업’을 1~5점으로 묻고, 평균·만족 비율·NPS를 봅니다.",
    when: "의견·만족도·태도를 숫자로 요약하고 싶을 때.",
  },
  regression: {
    summary: "‘원인 후보(면적·침실)’가 ‘결과(집값)’를 얼마나 설명하는지 직선으로 추정합니다.",
    example: "예) 집 면적이 넓을수록 가격이 오르는지, 오르는 폭(기울기)과 설명력(R²)을 봅니다.",
    when: "예측하거나 ‘무엇이 결과에 영향인지’를 수량으로 말할 때.",
  },
  timeseries: {
    summary: "같은 지표를 시간 순으로 늘어놓고 추세·계절성·급변을 찾습니다.",
    example: "예) 월별 매출을 24개월 그려 보면 연말 성수기·성장세가 보입니다.",
    when: "변화의 방향과 속도를 말하고 싶을 때.",
  },
  experiment: {
    summary: "비슷한 사람들을 나눠 한쪽에만 처치한 뒤, 전후 점수 차로 효과를 봅니다.",
    example: "예) 학습 앱을 쓴 그룹과 안 쓴 그룹의 사후 점수 차이를 비교합니다.",
    when: "‘이건 우연이 아니라 처치 효과인가?’를 확인하고 싶을 때.",
  },
  correlation: {
    summary: "두(여러) 숫자 변수가 같이 움직이는지 관계 강도(r)를 봅니다. 인과는 아닙니다.",
    example: "예) 대기질이 나쁠수록 건강점수가 낮아지는지 산점도·상관 행렬로 봅니다.",
    when: "변수 사이 패턴을 먼저 탐색할 때.",
  },
  comparative: {
    summary: "여러 집단을 같은 KPI로 나란히 비교(프로파일)합니다.",
    example: "예) 동·서·남·북 지점의 매출·만족·성장률을 한 화면에서 비교합니다.",
    when: "그룹별 강점·약점을 동시에 보여주고 싶을 때.",
  },
  meta: {
    summary: "비슷한 연구들의 효과 크기를 모아 ‘종합 효과’와 이질성을 봅니다.",
    example: "예) 6개 논문의 Cohen's d를 포레스트 플롯으로 합칩니다.",
    when: "개별 연구만으로는 부족한 결론을 통합할 때.",
  },
  qualitative: {
    summary: "인터뷰·문서 속 말에서 테마를 찾아 빈도와 감정 톤을 보여 줍니다.",
    example: "예) 8명 면담에서 ‘업무 자율성’이 가장 많이 언급됐는지 막대로 봅니다.",
    when: "숫자 설문만으로 안 보이는 경험 구조를 다룰 때.",
  },
};

/** Analysis Engine · 용어 미니 사전 */
export const ANALYSIS_GLOSS: { term: string; easy: string; ok: string; bad: string }[] = [
  { term: "N (표본 크기)", easy: "분석에 들어간 사람·건수입니다.", ok: "설문이면 보통 수십~수백 명. 목표가 분명하면 OK.", bad: "N=3처럼 너무 적으면 평균이 신뢰되지 않습니다." },
  { term: "평균(μ)", easy: "점수들을 모두 더해 개수로 나눈 값입니다.", ok: "Likert 1–5에서 3.7이면 ‘보통보다 조금 높음’.", bad: "6점처럼 척도 밖 값은 오류입니다." },
  { term: "Likert 척도", easy: "1=전혀~5=매우처럼 ‘정도’를 고르는 문항입니다.", ok: "문항당 1~5 정수만 기입.", bad: "텍스트(‘좋아요’)를 숫자 칸에 넣기." },
  { term: "Nominal / Ordinal", easy: "Nominal=이름 구분(성별), Ordinal=순서 있는 구분(만족 1–5).", ok: "ID·성별은 Nominal, Likert는 Ordinal.", bad: "ID에 평균을 내는 것." },
  { term: "NPS", easy: "추천 의향(0–10). 추천자% − 비추천자%.", ok: "+42면 추천이 더 많음.", bad: "만족도 평균과 NPS를 같은 숫자로 취급." },
  { term: "R²", easy: "회귀에서 ‘결과를 얼마나 설명했는지’(0~1).", ok: "0.6이면 60% 설명.", bad: "R²만 보고 인과라고 단정." },
  { term: "p-값", easy: "‘우연히 이런 차이가 날 확률’ 감.", ok: "보통 0.05 미만이면 유의한 편.", bad: "p만 작고 효과 크기가 아주 작으면 해석 과장." },
  { term: "Cohen's d", easy: "두 집단 평균 차이를 표준화한 효과 크기.", ok: "0.8 이상이면 큰 편.", bad: "단위·척도를 무시한 채 비교." },
];

export function buildDetailedReport(method: StdMethod, data: unknown, indices: number[]): string {
  const sl = indices;
  const vizList = sl.map((i) => ONT[method.id][i].nm).join("; ");
  const mets = METS[method.id](data as never);
  const easy = METHOD_EASY[method.id];
  const ontNotes = sl
    .map((i) => {
      const o = ONT[method.id][i];
      return `<li><strong>${o.nm}</strong> — ${(o as { easy?: string }).easy || o.r}</li>`;
    })
    .join("");
  return `
    <div class="rv-rsec"><h3>📋 연구 요약 (자세히)</h3>
      <p><strong>${method.nm}</strong> — N=${method.n}. 선택 시각화 ${sl.length}종.</p>
      <p>${easy?.summary || ""}</p>
      <p><em>예시:</em> ${easy?.example || ""}</p>
      <p><em>언제 쓰나요:</em> ${easy?.when || ""}</p>
    </div>
    <div class="rv-rsec"><h3>🔍 핵심 지표 · 쉬운 해석</h3>
      <ul>${mets
        .map(
          (mt) =>
            `<li><strong>${mt.l}</strong>: ${mt.v} (${mt.s}) — 이 숫자는 “${mt.l}”가 현재 ${mt.v} 수준임을 뜻합니다. 발표 때는 한 문장으로 “${mt.l}은 ${mt.v}이며, ${mt.s}입니다”라고 말하세요.</li>`
        )
        .join("")}</ul>
    </div>
    <div class="rv-rsec"><h3>📊 시각화별 해석</h3>
      <p>선택: ${vizList}</p>
      <ul>${ontNotes}</ul>
      <p class="text-[12px] text-ink-3">원칙: Few · Tufte · Knaflic — 장식보다 비교·한 숫자·데이터 잉크를 우선합니다.</p>
    </div>
    <div class="rv-rsec"><h3>✅ 결과 점검 체크리스트</h3>
      <ul>
        <li>척도 범위(예: 1–5)를 벗어난 값이 없는가?</li>
        <li>결측·중복 ID를 확인했는가?</li>
        <li>시각화 제목·축 이름이 연구 질문과 맞는가?</li>
        <li>한계(샘플/시뮬레이션)를 보고서에 적었는가?</li>
      </ul>
    </div>
    <div class="rv-rsec"><h3>⚠️ 한계</h3>
      <ul>
        <li>기본 화면은 샘플/시뮬레이션 데이터 데모입니다. 실제 연구에서는 프로젝트 산출물·원자료를 연결하세요.</li>
        <li>상관·회귀 결과는 인과를 자동 증명하지 않습니다.</li>
        <li>AI 보고서는 설정의 AI 엔진 연동 후 확장 가능합니다.</li>
      </ul>
    </div>`;
}

export { R, MKD, METHODS, ONT, VDEFS, METS, CR };
