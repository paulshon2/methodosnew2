// 페이지(목록·개요·11단계·세부단계·세부Task)별 왼쪽 「용어 주석」 시드.
// detectTerms만으로는 제목에 안 보이는 단계 전용 용어(패러다임 슬롯 등)가 빠지므로
// stageGlossary·큐레이션 용어를 명시적으로 합친다.
import { detectTerms, GLOSS } from "@/lib/gloss";

export type GlossTerm = { term: string; def: string };

/** QL-008·질적 핵심 — 초보 예시 포함 (이미지 주석 대응) */
export const CORE_METHOD_TERMS: GlossTerm[] = [
  { term: "연구설계", def: "연구설계 — 연구질문·방법에 맞춰 전체 틀을 잡는 단계. 예: ‘무엇을·누구에게·어떻게’를 먼저 적기" },
  { term: "방법론", def: "방법론 — 질적/양적/혼합 중 어떤 길로 갈지 고르기. 예: 경험 이해→질적" },
  { term: "연구질문", def: "연구질문 — 연구에서 답하려는 핵심 물음. 예: ‘초임 교사는 어떻게 적응하는가?’" },
  { term: "표집설계", def: "표집설계 — 누구를·몇 명을·어떻게 뽑을지 정하는 계획. 예: 병원 외래 환자 15명·눈덩이 표집" },
  { term: "연구참여자", def: "연구참여자 — 인터뷰·관찰의 대상이 되는 사람. 포함·제외 기준을 함께 정함" },
  { term: "심층면접", def: "심층면접 — 길게·깊이 물어 경험을 듣는 면담. 예: 60분 생애사 인터뷰" },
  { term: "자료수집", def: "자료수집 — 인터뷰·관찰·문서 등으로 원자료를 모으기" },
  { term: "개방코딩", def: "개방코딩 — 자료에 자유로운 이름표를 붙이며 범주 후보 찾기. 예: ‘알람으로 약’→자기관리" },
  { term: "축코딩", def: "축코딩 — 범주 사이 관계를 연결(원인→조건→결과). 예: 야근→피로→휴식요청" },
  { term: "선택코딩", def: "선택코딩 — 핵심 범주를 골라 이야기로 묶기" },
  { term: "패러다임모형", def: "패러다임모형 — 원인·조건·전략·결과를 한 그림으로 연결. 예: 야근(원인)→피로(현상)→휴식 요청(전략)" },
  { term: "이야기윤곽", def: "이야기윤곽 — 핵심 범주로 이어지는 한 줄 줄거리. 예: ‘적응→갈등→재구성’" },
  { term: "핵심범주", def: "핵심범주 — 다른 범주를 묶는 가장 중요한 주제. 예: ‘자기관리 협상’" },
  { term: "유형분석", def: "유형분석 — 비슷한 사례를 몇 가지 유형으로 나누기. 예: A형/B형 대응 패턴" },
  { term: "가설적 정형화", def: "가설적 정형화 — ‘만약 ~이면 ~하다’ 잠정 명제로 쓰기. 예: 지지가 있으면 이탈이 줄어든다" },
  { term: "과정분석", def: "과정분석 — 시간에 따라 어떻게 변했는지 단계로 추적" },
  { term: "상황모형", def: "상황모형 — 맥락·조건이 작용하는 전체 그림" },
  { term: "이론적 표집", def: "이론적 표집 — 이론을 키우기 위해 다음에 누구를·무엇을 더 볼지 고르기" },
  { term: "이론적 포화", def: "이론적 포화 — 새 자료를 봐도 새 범주가 거의 안 나오는 상태" },
  { term: "타당성", def: "타당성 — 측정·해석이 정말 그 개념을 다루는지" },
  { term: "신뢰도", def: "신뢰도 — 반복해도 비슷한 결과가 나오는지" },
  { term: "삼각검증", def: "삼각검증 — 여러 자료·방법으로 교차 확인" },
  { term: "결과 통합", def: "결과 통합·해석 — 단계별 분석을 하나의 이야기로 묶고 연구질문에 답하기" },
  { term: "시사점", def: "시사점 — 결과가 현장·정책·후속연구에 주는 함의" },
  { term: "인과적 조건", def: "인과적 조건 — 현상을 일으키는 직접 원인. 예: 업무 과중" },
  { term: "중심현상", def: "중심현상 — 연구에서 다루는 핵심 사건·경험. 예: 번아웃" },
  { term: "맥락적 조건", def: "맥락적 조건 — 배경 상황. 예: 조직 문화·시기" },
  { term: "중재적 조건", def: "중재적 조건 — 효과를 바꾸거나 완충하는 조건. 예: 동료 지지" },
  { term: "작용/상호작용 전략", def: "작용/상호작용 전략 — 현상 앞에서 하는 행동·대화 방식. 예: 일정 조정·도움 요청" },
  { term: "결과", def: "결과 — 전략 뒤에 나타난 변화. 예: 이직 고려 감소" },
  { term: "범주별 속성 차원", def: "범주별 속성·차원 — 각 범주의 특징과 변화 폭. 예: 강도(약↔강)" },
  { term: "속성", def: "속성 — 범주의 특징. 예: ‘강도’" },
  { term: "차원", def: "차원 — 속성이 움직이는 범위. 예: 낮음↔높음" },
  { term: "현상학", def: "현상학 — 사람이 어떻게 경험했는지의 본질을 탐구" },
  { term: "구성주의", def: "구성주의 — 지식은 사람이 만들어간다고 보는 입장" },
  { term: "실용주의", def: "실용주의 — 문제 해결에 도움되면 무엇이든 쓰는 입장" },
  { term: "후기실증주의", def: "후기실증주의 — 완벽하진 않아도 객관적으로 검증하려는 입장" },
  { term: "횡단", def: "횡단 — 한 시점에서 여러 사람을 조사" },
  { term: "종단", def: "종단 — 같은 대상을 여러 시점에 걸쳐 추적" },
  { term: "변증법", def: "변증법 — 대립하는 관점이 맞물려 더 깊은 이해로 가는 사고" },
  { term: "분석유목", def: "분석유목·코딩스킴 — 무엇을 어떤 칸으로 코딩할지 정한 분류표" },
  { term: "코더", def: "코더 — 코드북 규칙에 따라 자료에 코드를 붙이는 사람" },
  { term: "본코딩", def: "본코딩 — 전체 자료에 코드북을 적용해 코딩" },
  { term: "기술통계", def: "기술통계 — 빈도·비율·평균 등 자료를 요약하는 숫자" },
  { term: "교차분석", def: "교차분석 — 두 범주 표를 겹쳐 관련을 보기" },
  { term: "Q모집단", def: "Q모집단(컨코스) — 주제에 대한 의견·진술의 전체 풀" },
  { term: "Q표본", def: "Q표본 — 컨코스에서 고른 대표 진술문 세트" },
  { term: "P표본", def: "P표본 — Q분류를 할 응답자 집단" },
  { term: "Q분류", def: "Q분류 — 진술문을 동의 정도에 따라 강제 배치" },
  { term: "요인분석", def: "요인분석 — 비슷한 응답 패턴을 묶어 유형(요인) 찾기" },
  { term: "조사방식", def: "조사방식(Mode) — 설문을 전달·회수하는 경로(웹·우편·전화·대면)" },
  { term: "유니모드", def: "유니모드 — 혼합모드에서도 문항 자극(어간·범주)을 같게 맞추는 설계" },
  { term: "1차 코딩", def: "1차 코딩 — 원자료에 처음 코드를 붙여 의미 단위로 나누기" },
  { term: "2차 코딩", def: "2차 코딩 — 1차 코드를 패턴·테마로 압축하기" },
  { term: "Pattern Coding", def: "Pattern Coding — 비슷한 1차 코드를 상위 주제로 묶는 2차 코딩" },
  { term: "Attribute Coding", def: "Attribute Coding — 참여자·현장·자료형식 등 속성 기록" },
  { term: "코드북", def: "코드북 — 코드 이름·정의·예시·규칙을 모아 둔 사전" },
  { term: "출처 표준 프로토콜", def: "출처 표준 프로토콜 — 방법별 표준 작성·분석 절차 문서" },
];

export const PARADIGM_SLOT_TERMS: GlossTerm[] = CORE_METHOD_TERMS.filter((t) =>
  ["인과적 조건", "중심현상", "맥락적 조건", "중재적 조건", "작용/상호작용 전략", "결과", "범주별 속성 차원", "축코딩", "패러다임모형"].includes(t.term),
);

const NOISE_EN = new Set([
  "data", "corpus", "text", "texts", "code", "codes", "unit", "units", "note", "notes",
  "id", "api", "ai", "csv", "pdf", "html", "json", "url", "vs", "via", "per", "md", "svg",
]);

export function mergeTerms(...lists: (GlossTerm[] | undefined | null)[]): GlossTerm[] {
  const map = new Map<string, GlossTerm>();
  for (const list of lists) {
    if (!list) continue;
    for (const t of list) {
      if (!t?.term || !t?.def) continue;
      const k = t.term.toLowerCase().trim();
      if (!k) continue;
      if (!map.has(k)) map.set(k, { term: t.term.trim(), def: t.def.trim() });
    }
  }
  return [...map.values()];
}

/** 본문에서 큐레이션·GLOSS 용어만 골라 쉬운 정의로 붙임 (잡음 영어 제외) */
export function termsFromText(text: string): GlossTerm[] {
  if (!text) return [];
  const detected = detectTerms(text).filter((t) => {
    const lw = t.term.toLowerCase();
    if (NOISE_EN.has(lw)) return false;
    // GLOSS에 있는 학술·전문 용어 우선 (EN_KO만인 짧은 일반어 제외)
    const inGloss = !!GLOSS[t.term] || !!Object.keys(GLOSS).find((k) => k.toLowerCase() === lw);
    if (!inGloss && /^[a-z]+$/i.test(t.term) && t.term.length <= 8) return false;
    return true;
  });
  const curated = CORE_METHOD_TERMS.filter((c) => text.includes(c.term));
  return mergeTerms(curated, detected);
}

export function termsFromStageGlossary(
  gloss?: { term: string; easy?: string; def?: string }[] | null,
): GlossTerm[] {
  if (!gloss?.length) return [];
  return gloss.map((g) => ({
    term: g.term,
    def: g.easy || g.def || GLOSS[g.term] || `${g.term} — 이 단계에서 쓰는 학술 용어`,
  }));
}

export function pickCoreMatching(text: string): GlossTerm[] {
  if (!text) return [];
  return CORE_METHOD_TERMS.filter((c) => text.includes(c.term));
}

export function preferAcademic(terms: GlossTerm[]): GlossTerm[] {
  // 학술 용어를 앞에, 잡음 영어를 뒤로/제거
  const academic: GlossTerm[] = [];
  const rest: GlossTerm[] = [];
  for (const t of terms) {
    const lw = t.term.toLowerCase();
    if (NOISE_EN.has(lw)) continue;
    const def = t.def || ""; if (!t.term) continue; if (/[가-힣]/.test(t.term) || def.includes("예:") || def.includes("—")) academic.push(t);
    else rest.push(t);
  }
  return mergeTerms(academic, rest);
}
