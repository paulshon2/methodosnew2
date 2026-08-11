// 용어 풀이 (수정: 모든 영어 단어 + 어려운 한글에 ? 마크 + 호버 뜻)
// 1) GLOSS = 전문 jargon(다어절 영어 + 어려운 한국어) → 정확한 쉬운 뜻
// 2) EN_KO = 일반 영어 단어 → 한국어 뜻 (catch-all)
// 3) 그 외 영어 단어 → ? + 일반 안내 툴팁 (모든 영어가 ? 표시되도록)

export const GLOSS: Record<string, string> = {
  // 패러다임·철학(영/한)
  "post-positivist": "후기실증주의 — 완벽하진 않아도 객관적으로 검증하려는 입장", "post-positivism": "후기실증주의",
  "positivist": "실증주의 — 객관적 사실·법칙을 찾는 입장", "interpretive": "해석주의 — 사람이 부여하는 의미를 이해",
  "interpretivist": "해석주의", "constructivist": "구성주의 — 지식은 사람이 만들어간다고 봄", "subjectivist": "주관주의",
  "pragmatist": "실용주의 — 문제 해결에 도움되면 무엇이든", "pragmatism": "실용주의", "critical-realist": "비판적 실재론",
  "relativist": "상대주의 — 진리는 맥락에 따라 다름", "pluralist": "다원주의", "epistemology": "인식론 — ‘어떻게 아는가’의 관점",
  "ontology": "존재론 — ‘무엇이 존재하는가’의 관점", "paradigm": "패러다임 — 연구를 보는 큰 틀", "deductive": "연역 — 이론→가설 검증",
  "inductive": "귀납 — 자료→패턴·이론", "abductive": "가추 — 가장 그럴듯한 설명 추론", "associational": "연관(인과 아님)",
  "evaluative bibliometrics": "평가적 계량서지학 — 인용 수치로 성과 평가", "bibliometric": "계량서지 — 논문·인용 수치 분석",
  "qualitative": "질적 — 말·이야기 등 비수치", "quantitative": "양적 — 숫자 측정·분석", "empirical": "실증적 — 실제 자료 근거",
  // 통계
  "p-value": "p값 — 결과가 우연일 확률(작을수록 유의)", "p값": "p값 — 결과가 우연일 확률", "ANOVA": "분산분석 — 셋 이상 평균 차이 검정",
  "anova": "분산분석", "t-test": "t검정 — 두 집단 평균 차이", "confidence interval": "신뢰구간 — 참값이 들어있을 범위",
  "effect size": "효과크기 — 효과가 얼마나 큰지", "odds ratio": "오즈비 — 두 집단 사건 오즈의 비", "hazard ratio": "위험비(시간)",
  "logistic regression": "로지스틱 회귀 — 예/아니오 예측 회귀", "loglinear": "로그선형 — 다범주 표 연관 분석",
  "null hypothesis": "영가설 — ‘차이 없음’ 기본 가설", "cross-validation": "교차검증", "confusion matrix": "혼동행렬",
  "VIF": "분산팽창지수 — 변수 중복 진단", "perplexity": "혼란도 — 모형 예측 불확실성", "coherence": "응집도 — 토픽 단어 일관성",
  "ATT": "평균처치효과", "PICO": "PICO — 대상·개입·비교·결과", "PICOC": "PICOC — PICO + 맥락", "PICOc": "PICOC — PICO + 맥락",
  // 텍스트·네트워크
  "TF-IDF": "TF-IDF — 단어 중요도 가중", "LDA": "LDA — 문서의 숨은 주제 찾기", "n-gram": "n그램 — 연속 n단어", "n그램": "연속 n단어",
  "BM25": "BM25 — 검색 순위 함수", "keyness": "키워드성 — 비교 대비 두드러짐", "concordance": "용례색인 — 단어 쓰임 예",
  "centrality": "중심성 — 연결망 중요도", "WSD": "중의성 해소 — 문맥으로 뜻 고르기", "POS tagging": "품사 태깅",
  "ROC": "ROC — 분류 성능 곡선", "AUC": "AUC — 분류 성능(클수록 좋음)", "F1": "F1 — 정밀도·재현율 균형",
  "ECDF": "누적분포 — 값 이하 비율", "OHLC": "시가·고가·저가·종가", "KPI": "핵심성과지표", "Plotly": "플롯리 — 인터랙티브 그래프 도구",
  "Q-sort": "Q소트 — 진술문 동의순 배열", "factor analysis": "요인분석 — 비슷한 것끼리 묶기",
  // 방법·보고
  "RCT": "무작위대조시험", "DID": "이중차분 — 전후·집단 겹쳐 효과 추정", "grounded theory": "근거이론 — 자료에서 이론 생성",
  "phenomenology": "현상학 — 경험의 본질 탐구", "ethnography": "문화기술지 — 현장 문화 기술", "CONSORT": "CONSORT — 임상시험 보고 지침",
  "STROBE": "STROBE — 관찰연구 보고 지침", "PRISMA": "PRISMA — 체계적 문헌고찰 보고 지침", "APA": "APA — 논문 작성 형식",
  "EBM": "근거기반의학 — 근거로 임상 결정", "PCC": "PCC — 인구·개념·맥락(스코핑)", "ROB": "비뚤림 위험(Risk of Bias)", "rob": "비뚤림 위험",
  // 어려운 한국어
  "멱등": "멱등 — 여러 번 실행해도 결과가 같음", "횡단": "횡단 — 한 시점에서 조사", "종단": "종단 — 여러 시점 추적",
  "코호트": "코호트 — 같은 특성의 추적 집단", "표집": "표집 — 표본을 뽑는 절차", "모집단": "모집단 — 알고 싶은 전체 대상",
  "신뢰구간": "신뢰구간 — 참값이 들어있을 범위", "영가설": "영가설 — ‘차이 없음’ 기본 가설", "효과크기": "효과크기 — 효과의 크기",
  "매개": "매개 — 원인과 결과를 잇는 중간 변수", "조절": "조절 — 효과의 강도를 바꾸는 변수", "공선성": "공선성 — 변수끼리 너무 비슷",
  "잔차": "잔차 — 예측과 실제의 차이", "등분산": "등분산 — 집단 간 퍼짐 정도가 같음", "정규성": "정규성 — 종 모양 분포",
  "표준오차": "표준오차 — 추정의 흔들림 정도", "사분위": "사분위 — 자료를 4등분한 위치", "중심극한정리": "중심극한정리 — 표본 커지면 평균분포가 정규에 근접",
  "측정수준": "측정수준 — 명목·서열·구간·비율", "공변량": "공변량 — 통제하는 부수 변수", "요인분석": "요인분석 — 비슷한 것끼리 요인으로",
  "군집": "군집 — 비슷한 것끼리의 묶음", "이질처치시점": "처치 시점이 단위마다 다른 상황", "평행추세": "처치 없었다면 두 집단 추세가 평행했을 것이라는 가정",
  "반사실": "반사실 — 만약 처치가 없었다면", "기각": "기각 — 가설을 받아들이지 않음", "사후검정": "사후검정 — 어느 집단이 다른지 추가 확인",
  "다중공선성": "다중공선성 — 설명변수끼리 너무 비슷", "비뚤림": "비뚤림 — 한쪽으로 치우친 오류(편향)", "포화": "포화 — 새 정보가 더 안 나오는 상태",
  "삼각검증": "삼각검증 — 여러 자료·방법으로 교차 확인", "신빙성": "신빙성 — 믿을 만한 정도",
  // QL-008·질적 핵심 (초보 예시)
  "패러다임모형": "패러다임모형 — 원인·조건·전략·결과를 한 그림으로 연결. 예: ‘야근(원인)→피로(현상)→휴식 요청(전략)’",
  "패러다임 모형": "패러다임모형 — 범주 관계를 원인·조건·전략·결과로 묶은 틀",
  "유형분석": "유형분석 — 비슷한 사례를 몇 가지 유형으로 나누기. 예: A형/B형 대응 패턴",
  "가설적 정형화": "가설적 정형화 — ‘만약 ~이면 ~하다’처럼 잠정 명제로 쓰기. 예: 지지가 있으면 이탈이 줄어든다",
  "가설적 정식화": "가설적 정식화 — 관계를 잠정 가설 문장으로 정리",
  "이야기윤곽": "이야기윤곽 — 핵심 범주로 이어지는 한 줄 줄거리. 예: ‘적응→갈등→재구성’",
  "핵심범주": "핵심범주 — 다른 범주를 묶는 가장 중요한 주제. 예: ‘자기관리 협상’",
  "조건부행렬": "조건부행렬 — 조건이 바뀌면 결과가 어떻게 달라지는지 표로 정리",
  "상황모형": "상황모형 — 맥락·조건이 작용하는 전체 그림",
  "이론적 표집": "이론적 표집 — 이론을 키우기 위해 다음에 누구를·무엇을 더 볼지 고르기",
  "이론적 포화": "이론적 포화 — 새 자료를 봐도 새 범주가 거의 안 나오는 상태",
  "자료수집": "자료수집 — 연구에 쓸 원자료를 모으거나 불러오는 일",
  "자료가공": "자료가공 — 분석을 위해 자료를 정리·정제하는 일",
  "산출물": "산출물 — 단계나 연구가 끝난 뒤 남는 결과물",
  "공통절차": "공통절차 — 비슷한 방법 계열이 공유하는 수집→결과 뼈대",
  "프로세스요약": "프로세스요약 — 방법별 수집·분석·결과완성을 한눈에 보는 안내",
  "조사방식": "조사방식(Mode) — 설문을 전달·회수하는 경로(웹·우편·전화·대면)",
  "유니모드": "유니모드 — 혼합모드에서도 문항 자극(어간·범주)을 같게 맞추는 설계",
  "쇼카드": "쇼카드 — 대면면접에서 응답 범주를 보여주는 카드",
  "IVR": "IVR — 자동응답전화로 문항을 듣고 버튼으로 답하는 조사",
  "면접원 개입도": "면접원 개입도 — 면접원이 문항을 읽고 답을 받는 정도",
  "First-Cycle Coding": "1차 코딩 — 원자료에 처음 코드를 붙여 단위로 나누기",
  "Pattern Coding": "패턴 코딩 — 1차 코드를 상위 테마로 묶는 2차 코딩",
  "Attribute Coding": "속성 코딩 — 참여자·현장·자료형식 등 메타데이터 기록",
  "In Vivo Coding": "인비보 코딩 — 참여자 표현을 그대로 코드로 사용",
  "Process Coding": "과정 코딩 — 행동을 -ing 형태로 코드화",
  "CAQDAS": "CAQDAS — 질적자료 분석 소프트웨어(코드·메모 관리)",
  "출처 표준 프로토콜": "출처 표준 프로토콜 — 방법별로 정해 둔 표준 작성·분석 절차 문서",

  "표집설계": "표집설계 — 누구를·몇 명을·어떻게 뽑을지 정하는 계획",
  "심층면접": "심층면접 — 길게·깊이 물어 경험을 듣는 면담. 예: 60분 생애사 인터뷰",
  "속성": "속성 — 범주의 특징. 예: ‘강도(약~강)’",
  "차원": "차원 — 속성이 움직이는 범위. 예: 빈도 낮음↔높음",
  "속성·차원": "속성·차원 — 범주의 특징과 그 변화 폭을 함께 적기",
  "인과적 조건": "인과적 조건 — 현상을 일으키는 직접 원인. 예: 업무 과중",
  "중심현상": "중심현상 — 연구에서 다루는 핵심 사건·경험. 예: 번아웃",
  "맥락적 조건": "맥락적 조건 — 배경 상황. 예: 조직 문화·시기",
  "중재적 조건": "중재적 조건 — 효과를 바꾸거나 완충하는 조건. 예: 동료 지지",
  "작용/상호작용": "작용/상호작용 — 사람이 취하는 대응·전략. 예: 도움 요청",
  "작용/상호작용 전략": "작용/상호작용 전략 — 현상 앞에서 하는 행동·대화 방식. 예: 일정 조정",
  "상호작용 전략": "상호작용 전략 — 현상 앞에서 하는 행동·대화 방식",
  "결과": "결과 — 전략 뒤에 나타난 변화. 예: 이직 고려 감소",
  "범주별 속성 차원": "범주별 속성·차원 — 각 범주의 특징과 변화 폭. 예: 강도(약↔강)",
  "개방코딩": "개방코딩 — 자료에 자유로운 이름표를 붙이며 범주 후보 찾기. 예: ‘알람으로 약’→자기관리",
  "축코딩": "축코딩 — 범주 사이 관계를 연결. 예: 야근→피로→휴식요청",
  "선택코딩": "선택코딩 — 핵심 범주를 골라 이야기로 묶기",
  "과정분석": "과정분석 — 시간에 따라 어떻게 변했는지 단계로 추적",
  "개방 코딩": "개방코딩 — 자료에 자유로운 이름표를 붙이며 범주 후보 찾기",
  "축 코딩": "축코딩 — 범주 사이 관계를 연결(원인→조건→결과)",
  "선택 코딩": "선택코딩 — 핵심 범주를 골라 이야기로 묶기",
  "현상학적": "현상학적 — 사람이 ‘어떻게 경험했는지’의 본질을 탐구",
  "해석학": "해석학 — 텍스트·경험을 이해·해석하는 방법",
  "변증법": "변증법 — 대립하는 관점이 맞물려 더 깊은 이해로 가는 사고",
  "계몽": "계몽 — 이성과 과학으로 세계를 밝히려는 기획(비판 대상이 되기도 함)",
  "규율권력": "규율권력 — 감시·규범으로 몸을·행동을 길들이는 권력",
  "담화": "담화 — 말·글·제도가 만드는 의미의 흐름",
  "민족지": "민족지 — 현장에 들어가 문화·일상을 두껍게 기술",
  "자문화기술지": "자문화기술지 — 연구자 자신의 경험을 자료로 쓰는 방법",
  "서사": "서사 — 경험에 의미를 부여한 이야기 단위",
  "생애사": "생애사 — 한 사람의 삶을 시간·이야기로 재구성",
  "포커스그룹": "포커스그룹 — 소집단 토론으로 의견을 모으는 면담",
  "참여관찰": "참여관찰 — 현장에 들어가 보고·기록하며 배우기",
  "삼각측정": "삼각검증 — 여러 자료·방법으로 교차 확인",
  "횡단연구": "횡단연구 — 한 시점에서 여러 사람을 조사",
  "패널분석": "패널분석 — 같은 대상을 여러 시점에 걸쳐 추적",
  "혼합연구": "혼합연구 — 양적·질적 방법을 함께 쓰는 설계",
  "문헌고찰": "문헌고찰 — 관련 연구를 찾아 정리·평가하는 작업",
  "메타분석": "메타분석 — 여러 연구 수치를 통계적으로 합쳐 종합",
  "체계적 고찰": "체계적 고찰 — 검색·선별·평가를 미리 정해 문헌을 종합",
  "준실험": "준실험 — 완전 무작위는 아니지만 인과에 가깝게 설계",
  "이중차분": "이중차분 — 전후 차이에서 비교집단 변화를 빼 효과 추정",
  "회귀": "회귀 — 원인 변수로 결과 변수를 설명·예측",
  "확인적 요인분석": "확인적 요인분석 — 미리 정한 요인 구조를 자료로 검증",
  "구조방정식": "구조방정식 — 여러 관계를 동시에 추정하는 모형",
  "잠재계층": "잠재계층 — 사람 안의 숨은 유형을 확률로 찾기",
  "코호트연구": "코호트연구 — 같은 특성 집단을 시간 따라 추적",
  "델파이": "델파이 — 전문가에게 여러 번 물어 합의를 모으는 방법",
  "비용편익": "비용편익 — 비용과 이익을 같은 단위로 비교",
  "영향평가": "영향평가 — 프로그램이 실제로 바꾼 효과를 추정",
  "과정추적": "과정추적 — 사건 사슬을 따라 인과 경로를 검증",
  "Q방법론": "Q방법론 — 진술문을 배열해 주관적 관점의 유형을 찾기",
  "AI 변환기": "AI 변환기 — 원문·표를 코딩·분석·해석용 형식으로 바꿔 주는 도우미. 예: 전사 → 코드 후보",
  "기입란": "기입란 — 연구자가 직접 적는 칸. 예시를 보고 내 연구에 맞게 수정",
  "불러오기": "불러오기 — 엑셀·CSV·텍스트 파일을 열어 입력란에 넣기",
  "감사추적": "감사추적 — 원문→변환→확정 이력을 남겨 재현 가능하게 함",
  "단위화": "단위화 — 코딩할 덩어리로 자르기. 예: 문장 1개=1단위",
  "Q소트": "Q소트 — 진술문을 동의 정도에 따라 배열하는 분류",
  "요인적재": "요인적재 — 어떤 사람이 어떤 관점(요인)에 얼마나 가까운지",
  "표준화잔차": "표준화잔차 — 교차표에서 ‘예상보다 얼마나 많고 적은지’",
  "paradigm model": "패러다임모형 — 원인·조건·전략·결과를 한 틀로 연결",
  "axial coding": "축코딩 — 범주 관계를 축으로 연결",
  "open coding": "개방코딩 — 자유 이름표로 범주 후보 찾기",
  "selective coding": "선택코딩 — 핵심 범주로 이야기 구성",
  "theoretical sampling": "이론적 표집 — 이론 발전을 위한 다음 표본 선택",
  "theoretical saturation": "이론적 포화 — 새 범주가 거의 안 나오는 상태",
  "causal conditions": "인과적 조건 — 현상을 일으키는 직접 원인",
  "central phenomenon": "중심현상 — 연구의 핵심 사건·경험",
  "contextual conditions": "맥락적 조건 — 배경 상황",
  "intervening conditions": "중재적 조건 — 효과를 바꾸거나 완충하는 조건",
  "consequences": "결과 — 전략 뒤의 변화",
  "property": "속성 — 범주의 특징",
  "dimension": "차원 — 속성의 변화 폭",
  "후기실증주의": "후기실증주의 — 객관적으로 검증하되 측정 오차도 인정. 예: 설문으로 가설 확인",
  "실증주의": "실증주의 — 관찰·측정 가능한 사실을 중심으로 설명",
  "구성주의": "구성주의 — 지식·의미는 사람이 만들어간다고 봄",
  "해석주의": "해석주의 — 행위자의 주관적 의미를 이해",
  "변혁적": "변혁적 — 불평등·권력을 드러내고 변화를 돕는 태도",
  "실용주의": "실용주의 — 문제 해결에 도움되면 양·질 방법을 섞어 씀",
  "비판적 실재론": "비판적 실재론 — 겉 사건 뒤에 구조·메커니즘이 있다고 봄",
  "포스트모더니즘": "포스트모더니즘 — 단일 진리보다 담론·권력·재현의 다양성 강조",
  "연역": "연역 — 이론→가설→자료로 맞는지 확인",
  "귀납": "귀납 — 자료→패턴→이론",
  "귀추": "귀추 — 가장 그럴듯한 설명을 가설로 세우고 다듬기",
  "혼합방법": "혼합방법 — 양적·질적을 한 연구에서 의도적으로 결합",
  "내적타당도": "내적타당도 — 변화가 정말 처치 때문인지",
  "외적타당도": "외적타당도 — 다른 사람·상황에도 적용 가능한지",
  "코더간 신뢰도": "코더간 신뢰도 — 두 코더가 같은 코드로 맞춘 정도",
  "IRB": "IRB — 기관윤리심의(연구 전 승인·면제 확인)",
};

// 일반 영어 단어 → 한국어 뜻 (catch-all)
export const EN_KO: Record<string, string> = {
  research: "연구", analysis: "분석", analyses: "분석(들)", data: "자료/데이터", dataset: "데이터셋", question: "질문", questions: "질문(들)",
  design: "설계", report: "보고서", reporting: "보고", model: "모형", models: "모형(들)", corpus: "말뭉치(코퍼스)", plan: "계획",
  interpretation: "해석", evidence: "근거", context: "맥락", contexts: "맥락(들)", scope: "범위", frame: "틀/프레임", framing: "프레이밍(틀짓기)",
  realist: "실재론(적)", synthesis: "종합", synthesize: "종합하다", review: "검토/리뷰", reviews: "리뷰(들)", concept: "개념", concepts: "개념(들)",
  text: "텍스트/본문", texts: "텍스트(들)", unit: "단위", units: "단위(들)", comparison: "비교", estimate: "추정(치)", estimates: "추정치(들)",
  estimand: "추정 대상", argument: "논증", problem: "문제", sample: "표본", sampling: "표집", included: "포함된", theory: "이론",
  field: "현장/분야", map: "지도/매핑", bias: "편향", study: "연구", studies: "연구(들)", variable: "변수", variables: "변수(들)",
  structure: "구조", network: "연결망(네트워크)", protocol: "프로토콜(계획서)", exploration: "탐색", code: "코드", codes: "코드(들)", coded: "코딩된",
  codebook: "코드북", indicator: "지표", indicators: "지표(들)", critical: "비판적/핵심", define: "정의하다", validity: "타당도",
  reliability: "신뢰도", decision: "의사결정", appraisal: "평가(감정)", population: "모집단/인구", group: "집단", groups: "집단(들)",
  extraction: "추출", extract: "추출하다", pooled: "통합(합산)된", test: "검정", tests: "검정(들)", target: "대상/표적", outcome: "결과(변수)",
  outcomes: "결과(들)", source: "출처/원천", sources: "출처(들)", overlap: "중복", construct: "구성개념", constructs: "구성개념(들)",
  effect: "효과", effects: "효과(들)", criteria: "기준(들)", criterion: "기준", transcript: "전사본(녹취록)", dialogue: "대화",
  citation: "인용", baseline: "기준선/기저", search: "검색", set: "집합/세트", bibliography: "참고문헌", raw: "원자료(가공 전)",
  recording: "녹음/기록", purpose: "목적", growth: "성장", assess: "평가하다", credibility: "신뢰성", matrix: "행렬(매트릭스)",
  focus: "초점", focused: "초점이 좁은", approach: "접근(법)", descriptive: "기술(記述)적", memo: "메모", memos: "메모(들)",
  central: "중심의/핵심", panel: "패널", quality: "품질/질", database: "데이터베이스", databases: "데이터베이스(들)", literature: "문헌",
  relevant: "관련된", questionnaire: "설문지", collection: "수집", performance: "성과/성능", applicability: "적용가능성", strategy: "전략",
  selection: "선별/선택", regression: "회귀", narrative: "서사(내러티브)", fulltexts: "전문(全文)들", fulltext: "전문(全文)",
  authenticity: "진정성", critique: "비평", metric: "지표(측도)", translation: "번역/전환", translations: "번역(전환)들",
  computational: "전산적(계산적)", program: "프로그램", site: "현장/사이트", type: "유형", types: "유형(들)", clean: "정제하다",
  time: "시간", setting: "상황/세팅", exposure: "노출", inference: "추론", interest: "관심/이해", method: "방법", methods: "방법(들)",
  meaning: "의미", representativeness: "대표성", reading: "읽기/판독", line: "줄/행", relation: "관계", relations: "관계(들)",
  diagnostics: "진단", diagnostic: "진단", monitor: "모니터링", index: "색인/지수", covariate: "공변량", covariates: "공변량(들)",
  sensitivity: "민감도", specificity: "특이도", policy: "정책", deadline: "기한", screening: "선별", key: "핵심/키", gap: "공백/간극",
  gaps: "공백(들)", charting: "차트화(정리)", audience: "독자/청중", scheme: "체계/도식", resampling: "재표집", occasion: "시점",
  occasions: "시점(들)", size: "크기", sizes: "크기(들)", interval: "구간/간격", moderation: "조절(효과)", typology: "유형론",
  impact: "영향", impacts: "영향(들)", chain: "사슬/연쇄", power: "검정력/힘", need: "요구", needs: "요구(들)", process: "과정/프로세스",
  user: "사용자", users: "사용자(들)", external: "외적/외부", internal: "내적/내부", narrator: "화자", narrators: "화자(들)",
  archive: "기록보관소", note: "노트", notes: "노트(들)", epiphany: "통찰의 순간", recall: "회상", account: "서술/계정",
  accounts: "서술(들)", condition: "조건", conditions: "조건(들)", immanent: "내재적", dialectic: "변증법", engagement: "관여/참여",
  case: "사례", cases: "사례(들)", followup: "추적관찰", monitoring: "모니터링", baseline2: "기저", spec: "명세", specify: "명시(지정)하다",
  identify: "식별하다", evaluate: "평가하다", examine: "검토(검사)하다", compare: "비교하다", measure: "측정(척도)", report2: "보고",
  comprehensive: "포괄적", transparent: "투명한", structured: "구조화된", answerable: "답할 수 있는", reproducible: "재현 가능한",
  intervention: "개입(처치)", databasebased: "데이터 기반", causal: "인과", policydecision: "정책 결정", growthdynamics: "성장·동태",
  vs: "대(對) — ~와 비교", via: "~을 통해", per: "~당", json: "JSON(데이터 형식)", csv: "CSV(엑셀형 표)", pdf: "PDF 문서",
  md: "마크다운(간단 서식 문서)", svg: "SVG(벡터 그림)", id: "식별자(아이디)", html: "HTML(웹 문서)", url: "URL(주소)",
  api: "API(프로그램 연결 창구)", ai: "AI(인공지능)", llm: "거대언어모형(LLM)", rag: "검색증강생성(RAG)", nlp: "자연어처리",
  rr: "위험비(RR)", npv: "음성예측도", ppv: "양성예측도", obs: "관찰(observation)", anova: "분산분석", aic: "AIC(모형 선택 기준)",
  growth2: "성장", units2: "단위", family: "계열(패밀리) — 비슷한 방법의 묶음", evaluative: "평가적인",
  bibliometric: "계량서지(논문·인용 수치 분석)", appraisal2: "감정/평가", evidence2: "근거",
};

const STOP_EN = new Set("a an the and or but of to in on at by for with from as is are be was were been being this that these those it its their his her our your my we you they he she them us him do does did done has have had having about over under up off only also just more most some any all each both than then too very can could should would may might must will shall not no nor so such own same other another what when where why how which who whom whose if while because however thus therefore eg ie etc s e g i".split(/\s+/));

const KEYS = Object.keys(GLOSS).sort((a, b) => b.length - a.length);
const isEnglishKey = (k: string) => /^[A-Za-z0-9.\- ]+$/.test(k);
function escRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
const GLOSS_ALT = KEYS.map((k) => (isEnglishKey(k) ? `\\b${escRe(k)}\\b` : escRe(k))).join("|");
const ENG = "[A-Za-z][A-Za-z0-9'._\\-]*";
const BIG = new RegExp(`(${GLOSS_ALT})|(${ENG})`, "g");
const lookup = (m: string) => GLOSS[m] || GLOSS[Object.keys(GLOSS).find((k) => k.toLowerCase() === m.toLowerCase()) || ""] || "";
const GENERIC = "영어 단어 — ‘쉬운 설명 모드’와 ‘용어 풀이’를 참고하세요";

function wrap(term: string, def: string) {
  const t = def.replace(/"/g, "&quot;");
  return `<span class="gloss" title="${t}">${term}<sup class="gloss-q" title="${t}">?</sup></span>`;
}


/** Name/title fields must NEVER be auto-linked or rewritten by glossary tooling. */
export const GLOSS_DENY_FIELDS = new Set([
  "name", "name_ko", "name_en", "label", "title", "methodName", "methodEn", "canonicalName",
]);

/** Body-only fields where glossary auto-link is allowed. */
export const GLOSS_ALLOW_FIELDS = new Set([
  "definition", "why", "how", "protocol", "overview", "purpose", "procedure", "easy",
  "body", "explain", "feedback", "hint", "intro", "beginnerIntro", "mechanism", "summary",
]);

export function glossifyHTML(text: string, options?: { field?: string }): string {
  if (!text) return "";
  if (options?.field && GLOSS_DENY_FIELDS.has(options.field)) {
    return String(text).replace(/[<>]/g, (c) => ({ "<": "&lt;", ">": "&gt;" }[c] as string));
  }
  const safe = String(text).replace(/[<>]/g, (c) => ({ "<": "&lt;", ">": "&gt;" }[c] as string));
  return safe.replace(BIG, (full, g1, g2) => {
    if (g1 !== undefined) return wrap(g1, lookup(g1) || GENERIC);   // 전문용어(영/한)
    const w = g2 as string;
    if (!w) return full;
    const lw = w.toLowerCase().replace(/['._\-]+$/, "");
    if (lw.length < 2 || STOP_EN.has(lw) || /^\d+$/.test(lw)) return w; // 문법어·숫자 제외
    return wrap(w, EN_KO[lw] || GENERIC);                            // 일반 영어
  });
}

// ?마크 없는 평문 HTML (escape + **굵게**). 용어 강조 없이 깔끔하게.
export function plainHTML(text: string): string {
  if (!text) return "";
  return String(text).replace(/[<>]/g, (c) => ({ "<": "&lt;", ">": "&gt;" }[c] as string))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// 방법별 ‘용어 풀이’ 표용: 본문에서 뜻이 등록된 용어만 수집
export function detectTerms(text: string): { term: string; def: string }[] {
  if (!text) return [];
  const found = new Map<string, { term: string; def: string }>();
  let mm: RegExpExecArray | null; const re = new RegExp(BIG.source, "g");
  while ((mm = re.exec(text))) {
    const m = mm[1] || mm[2]; if (!m) continue;
    const lw = m.toLowerCase().replace(/['._\-]+$/, "");
    if (STOP_EN.has(lw) || lw.length < 2) continue;
    const def = mm[1] ? lookup(m) : EN_KO[lw];
    if (def && !found.has(lw)) found.set(lw, { term: m, def });
  }
  return [...found.values()];
}
