// Straussian Grounded Theory — methodos-f17 개편, f18에서 재현검증·쉬운예시 연동 확장.
// 근거: 첨부 「QL-008_수행내용_산출물_자동화수준분석표.xlsx」(11영역/50세부Task/117수행No,
//   수행내용 124분절+산출물 146분절=270개 세부 항목) + 「QL-008_11개영역_전체_절차적용_재현결과.xlsx」
//   (세부Task별 AI 재현 → 원문 대조 판정 등급만 코딩화: 일치/부분일치/해당없음).
// 각 항목의 자동화 구분(수동화/반자동화/자동화)·구분 근거·자동화 수준 달성 절차(순서별 Task)를
// 11단계 메뉴 → 세부Task → 세부 항목(Task 카드) 구조로 코딩화한다(TX-002·GN-029과 공용 러너).
// 개요/전체프로세스 페이지(GtOverview)는 기존 디자인 포맷을 그대로 두고 내용만 11단계로 유지한다.

import type { CaStageView } from "@/lib/content-analysis-spec";

export function isStraussianGT(methodId: string): boolean {
  return methodId === "QL-008";
}

// ── 프로젝트 페이지(세부Task 워크벤치)용 — {gt,ca,q}-perf-registry.json 지연 로드(공용) ──
export type GtAuto = "수동화" | "반자동화" | "자동화";
export type GtMode = "user" | "rule" | "ai";
export type GtIOMode = "chain" | "fresh" | "merge";
export type PerfMethod = "gt" | "ca" | "q";

export interface GtEntry {
  id: string;
  kind: "수행내용" | "산출물";
  seg: string;
  content: string;
  auto: GtAuto;
  reason: string;
  procedure: string[];
  behavior: string;
  modes: GtMode[];
  io: GtIOMode;
  easyTitle?: string;
  easyContent?: string;
  easyWhyNeed?: string;
  easyReason?: string;
  procedureEasy?: string[];
  prebuiltExamples?: { label: string; text: string; table?: { columns: string[]; rows: string[][] } }[];
  contentRaw?: string;
  segLabel?: string;
}
export interface GtItem { perfNo: string; entries: GtEntry[]; label?: string; }
export interface GtTask {
  taskNo: string; name: string; items: GtItem[];
  verify?: string | null;
  example?: string | null;
  whyTask?: string | null;
  nameKo?: string;
}
export interface GtStage {
  stageNo: number; title: string; fullName: string; tasks: GtTask[];
  easyIntro?: string; whyStage?: string; inEasy?: string; outEasy?: string;
  stageLabel?: string;
}

const _perfCache: Partial<Record<PerfMethod, GtStage[] | null>> = {};
const _perfPromise: Partial<Record<PerfMethod, Promise<GtStage[] | null>>> = {};
export function loadPerfRegistry(method: PerfMethod): Promise<GtStage[] | null> {
  const cached = _perfCache[method];
  if (cached) return Promise.resolve(cached);
  const pending = _perfPromise[method];
  if (pending) return pending;
  const p = fetch(`${method}-perf-registry.json`)   // 상대경로 — 정적 export sub-path 호환
    .then((r) => (r.ok ? r.json() : null))
    .then((d: unknown) => {
      const stages = Array.isArray(d) ? (d as GtStage[]) : null;
      _perfCache[method] = stages;
      return stages;
    })
    .catch(() => null);
  _perfPromise[method] = p;
  return p;
}

/** f11: legacy ca|gt|q 또는 methods/{slug}/perf-registry.json */
export async function loadPerfRegistryResolved(legacy?: PerfMethod | null, slug?: string | null): Promise<GtStage[] | null> {
  if (legacy) return loadPerfRegistry(legacy);
  if (slug) {
    const { loadPerfRegistryBySlug } = await import("@/lib/method-catalog");
    return loadPerfRegistryBySlug(slug);
  }
  return null;
}
export const loadGtPerfRegistry = () => loadPerfRegistry("gt");

// 재현검증 배지 메타(등급별 색)
export const VERIFY_META: Record<string, { color: string; soft: string; desc: string }> = {
  일치: { color: "#16a34a", soft: "rgba(22,163,74,.10)", desc: "AI 재현 결과가 실제 논문 절차의 산출 구조와 일치함이 검증된 절차" },
  부분일치: { color: "#d97706", soft: "rgba(217,119,6,.10)", desc: "개념은 동일하나 실제 논문이 더 단순화·달리 구조화한 절차" },
  해당없음: { color: "#6b7280", soft: "rgba(107,114,128,.10)", desc: "실제 논문에 별도 명시가 없어 방법론 일반원칙으로 재현되는 절차" },
};

export const AUTO_META: Record<GtAuto, { label: string; color: string; soft: string; tag: string }> = {
  수동화: { label: "수동화", color: "#dc2626", soft: "rgba(220,38,38,.10)", tag: "연구자 직접 수행(대면·윤리·창의적 판단)" },
  반자동화: { label: "반자동화", color: "#7c3aed", soft: "rgba(124,58,237,.10)", tag: "AI·도구가 초안/후보 생성 → 연구자 검증·확정" },
  자동화: { label: "자동화", color: "#16a34a", soft: "rgba(22,163,74,.10)", tag: "규칙기반 엔진이 인간 개입 없이 처리" },
};

// 11단계 개요/전체 프로세스 콘텐츠 — 엔진을 언급하지 않는 초보자용 단계 설명.
// 예시 도메인: '만성질환과 더불어 살아가기'(Corbin & Strauss 계열 QL-008 예시를 그대로 확장 사용)
export const GT_STAGE_VIEWS: CaStageView[] = [
  {
    registryStageId: "QL-008.s1", uiStage: 1,
    title: "연구설계 및 방법론 선정 (Research Design & Methodology Selection)",
    oneLine: "연구질문을 다듬고, 왜 QL-008(질적방법)을 선택하는지 이론적 근거를 갖춥니다.",
    stepRole: ["연구주제·연구질문 정립(선행연구 검토→연구공백 식별)", "질적연구 방법론들을 비교검토하고 QL-008 채택 사유를 논증", "QL-008의 계보(Glaser·Strauss&Corbin·Charmaz)와 핵심개념을 정리", "예비조사(파일럿)로 질문지·절차를 점검하고 전체 연구절차 모형을 설계"],
    inFunction: "연구 관심사·선행연구", outFunction: "연구질문·방법론 선정 사유서·전체 연구절차 모형",
    why: "QL-008은 '과정·어떻게'를 묻는 탐색적 질문에 적합하므로, 방법론 적합성을 먼저 논증해야 이후 설계가 흔들리지 않습니다.",
    exampleText: "예시(만성질환 관리 연구): 연구질문을 '만성질환자는 일상적 자기관리를 어떻게 협상해 나가는가?'로 정하고, 설문·통계로는 포착하기 어려운 과정적 경험이라는 점에서 QL-008(Strauss & Corbin 패러다임모형)을 채택합니다.",
    table: { title: "연구설계 산출물(예시)", columns: ["세부Task", "산출물", "자동화 수준"], rows: [["1.1 연구주제·연구질문 정립", "연구질문(RQ) 초안", "반자동화"], ["1.2 방법론 비교검토", "방법론 선정 사유서", "반자동화"], ["1.4 예비조사", "질문지 수정본", "반자동화"]] },
    figure: { type: "flow", inputs: ["연구 관심사", "선행연구"], outputs: ["연구질문", "연구절차 모형"], step: "연구설계" },
    moreExamples: [
      { label: "예시 2 · 방법론 비교표", text: "현상학(경험의 본질 기술)·QL-020(단일 사례 심층)와 비교한 뒤 “과정과 이론 생성이 목적”이므로 QL-008을 채택한다고 논증합니다.", table: { columns: ["방법론", "목적"], rows: [["현상학", "경험의 본질 기술"], ["QL-008", "과정·이론 생성"]] } },
      { label: "예시 3 · 예비조사 기록", text: "환자 2명에게 예비 인터뷰를 해 보니 “하루 일과” 질문이 너무 넓어 “증상이 심한 날의 일과”로 질문을 다듬은 기록을 남깁니다." },
    ],
    beginnerTip: "연구질문은 '무엇이 어떻게 일어나는가'처럼 과정형으로 쓰면 QL-008에 잘 맞아요.",
  },
  {
    registryStageId: "QL-008.s2", uiStage: 2,
    title: "연구참여자 선정 및 표집설계 (Sampling Design & Participant Selection)",
    oneLine: "누구를, 어떤 기준으로, 언제까지 표집할지(개념적 포화까지)를 설계합니다.",
    stepRole: ["표집방법(이론적 표집)과 모집단을 정의", "참여자를 모집하고 연구참여 동의를 확보", "자료수집을 이어갈지 멈출지 판단하는 개념적 포화 기준을 설정"],
    inFunction: "연구질문·모집단 특성", outFunction: "표집 기준·참여자 명단·동의서·포화 판단 기준",
    why: "QL-008은 고정된 표본수가 아니라 '개념이 더 채워지는 방향'으로 표집을 이어가야 하므로, 기준을 먼저 세워둬야 합니다.",
    exampleText: "예시: 진단 후 1년 이상 경과한 성인 환자를 우선 표집하고, 인터뷰가 진행될수록 '불확실성'이 두드러진 참여자를 추가로 표집합니다.",
    table: { title: "표집설계 산출물(예시)", columns: ["세부Task", "산출물", "자동화 수준"], rows: [["2.1 표집방법·모집단 정의", "표집 기준서", "반자동화"], ["2.2 참여자 모집·동의", "동의서", "수동화"], ["2.3 포화 판단 기준", "포화 판정 기준표", "반자동화"]] },
    figure: { type: "funnel", inputs: ["모집단"], outputs: ["표집 참여자"], step: "표집설계" },
    moreExamples: [
      { label: "예시 2 · 포화 판단 기준서", text: "“최근 2회 인터뷰에서 새로운 하위범주가 나오지 않으면 포화로 본다”는 기준을 미리 문서로 정해 둡니다." },
      { label: "예시 3 · 참여자 명단표", text: "진단 1년 이상 환자를 우선 표집하고, 진행되면서 급성 악화 경험자를 추가해 표집 경과를 표로 기록합니다.", table: { columns: ["차수", "표집 기준", "인원"], rows: [["1차", "진단 1년 이상", "6"], ["2차", "급성 악화 경험", "3"]] } },
    ],
    beginnerTip: "동의서·윤리 절차는 연구자가 직접 수행해야 하는 대표적인 '수동화' 영역이에요.",
  },
  {
    registryStageId: "QL-008.s3", uiStage: 3,
    title: "심층면접 설계 및 자료수집 (In-depth Interview & Data Collection)",
    oneLine: "인터뷰 질문지를 만들고 본조사·보완조사를 수행해 전사자료를 확보합니다.",
    stepRole: ["개방형·반구조화 인터뷰 질문지 설계", "본조사 심층면접 수행", "녹취록(전사) 작성 및 원자료 정리", "필요 시 보완(2차) 면접으로 자료를 추가 수집"],
    inFunction: "표집 참여자·질문지", outFunction: "면접 전사록·원자료",
    why: "질 좋은 원자료가 있어야 이후 코딩·이론화가 가능하므로, 전사·정리 품질이 전체 분석의 기초가 됩니다.",
    exampleText: "예시: '증상이 심해질 때 하루 일과를 어떻게 조정하시나요?' 같은 개방형 질문으로 면접을 진행하고, 녹음을 전사한 뒤 참여자ID·날짜를 정리합니다.",
    table: { title: "자료수집 산출물(예시)", columns: ["세부Task", "산출물", "자동화 수준"], rows: [["3.1 인터뷰 질문지 설계", "면접 가이드", "반자동화"], ["3.3 전사·원자료 정리", "전사록(익명화)", "자동화"], ["3.4 보완 면접", "추가 전사록", "수동화"]] },
    figure: { type: "flow", inputs: ["질문지", "참여자"], outputs: ["전사록"], step: "자료수집" },
    moreExamples: [
      { label: "예시 2 · 익명화 처리", text: "전사록의 “김OO 환자”를 “P03”으로 자동 치환하고, 원본은 잠금 폴더에 별도 보관합니다." },
      { label: "예시 3 · 보완면접 메모", text: "1차 분석에서 “가족의 반응” 개념이 얕게 나와, 해당 참여자 3명에게 보완 면접을 추가 요청한 경과를 기록합니다.", table: { columns: ["참여자", "보완 사유"], rows: [["P02", "가족 반응 부족"], ["P05", "초기 경험 미흡"]] } },
    ],
    beginnerTip: "전사·익명화처럼 정형화된 반복작업은 규칙기반으로 완전 자동화할 수 있어요.",
  },
  {
    registryStageId: "QL-008.s4", uiStage: 4,
    title: "개방코딩 (Open Coding)",
    oneLine: "전사자료를 분절하고, 반복되는 의미에 개념·하위범주 이름을 붙입니다.",
    stepRole: ["분석단위 설정 및 자료 분절", "개념(Concept) 추출 및 명명", "지속적 비교를 통한 하위범주화", "상위범주 도출 및 패러다임 요소 배정", "이론적 민감성 확보 활동(메모·성찰)", "지속적 비교 및 개방적 표집"],
    inFunction: "전사록", outFunction: "개념·하위범주·상위범주 목록",
    why: "텍스트를 '개념'으로 바꾸는 QL-008의 첫 분석 관문으로, 이후 축코딩·선택코딩의 재료가 됩니다.",
    exampleText: "예시: '알람을 맞춰 약을 챙긴다'는 진술들을 모아 '복약 관리'라는 개념으로 묶고, 이를 '일상 통제하기' 상위범주에 배정합니다.",
    table: { title: "개방코딩 산출물(예시)", columns: ["범주", "하위범주", "대표 사건", "N"], rows: [["일상 통제하기", "복약 관리", "알람을 맞춰 약을 챙긴다", "18"], ["불확실성 견디기", "정보 탐색", "인터넷으로 증상을 찾아본다", "11"]] },
    figure: { type: "matrix", inputs: ["전사록"], outputs: ["개념·범주"], step: "개방코딩" },
    moreExamples: [
      { label: "예시 2 · 지속적 비교", text: "“식단을 조절하려고 저염식을 준비한다”와 “약통을 요일별로 나눈다”를 비교해 둘 다 ‘일상 통제하기’ 범주에 속함을 확인합니다." },
      { label: "예시 3 · 개방코딩표", text: "전사록에서 나온 사건들을 개념→하위범주→상위범주로 계층화한 표를 만듭니다.", table: { columns: ["개념", "하위범주", "상위범주"], rows: [["알람 맞춰 복약", "복약 관리", "일상 통제하기"], ["인터넷 정보 검색", "정보 탐색", "불확실성 견디기"]] } },
    ],
    beginnerTip: "개념 이름은 참여자의 표현(in-vivo code)을 살리면 생생해져요.",
  },
  {
    registryStageId: "QL-008.s5", uiStage: 5,
    title: "축코딩 — 패러다임모형 구성 (Axial Coding & Paradigm Model)",
    oneLine: "범주들을 인과적 조건-중심현상-맥락-중재조건-전략-결과의 틀로 재배치합니다.",
    stepRole: ["패러다임 분석틀 설계", "인과적 조건·중심현상·맥락적 조건·중재적 조건 분석", "작용/상호작용 전략과 결과 분석", "범주별 속성-차원 분석 및 패러다임 모형 통합 도식화"],
    inFunction: "개방코딩 범주", outFunction: "패러다임모형(조건-행위-결과) 도식",
    why: "흩어진 범주들 사이의 관계를 구조화해야 '왜, 어떻게'라는 과정적 설명이 가능해집니다.",
    exampleText: "예시: '증상 악화·불확실성'(조건) → '복약 관리·정보 탐색'(전략) → '통제감 회복'(결과)의 패러다임 관계로 범주를 배열합니다.",
    table: { title: "패러다임 관계(예시)", columns: ["조건", "행위/상호작용", "결과"], rows: [["증상 악화·불확실성", "복약 관리·정보 탐색", "통제감 회복"], ["가족 부담 우려", "혼자 견디기·선택적 알림", "관계 긴장 또는 지지"]] },
    figure: { type: "network", inputs: ["범주"], outputs: ["패러다임모형"], step: "축코딩" },
    moreExamples: [
      { label: "예시 2 · 관계 근거 인용", text: "“가족이 걱정할까 봐 증상이 심할 때만 말한다”는 문장을 근거로 ‘가족 지지’(중재적 조건)와 ‘선택적 알리기’(전략)의 관계를 채택합니다." },
      { label: "예시 3 · 패러다임 6요소표", text: "인과적 조건·중심현상·맥락·중재조건·전략·결과 6칸에 범주를 배치한 표를 완성합니다.", table: { columns: ["슬롯", "배치 범주"], rows: [["중심현상", "일상 무너짐과 되찾기"], ["전략", "복약 관리·정보 탐색"]] } },
    ],
    beginnerTip: "'A가 많다'를 'A 때문이다'로 성급히 단정하지 말고 조건-행위-결과의 흐름으로 검토하세요.",
  },
  {
    registryStageId: "QL-008.s6", uiStage: 6,
    title: "선택코딩 — 이야기윤곽 및 핵심범주 (Selective Coding, Storyline & Core Category)",
    oneLine: "전체 이야기를 한 문단(story line)으로 요약하고, 모든 범주를 통합하는 핵심범주를 정합니다.",
    stepRole: ["이야기윤곽(Story Line) 작성", "핵심범주(Core Category) 도출"],
    inFunction: "패러다임모형·전체 범주", outFunction: "핵심범주·이야기윤곽 서사",
    why: "핵심범주는 QL-008의 '중심 줄거리'로, 모든 하위범주가 이를 중심으로 설명될 수 있어야 이론이 완성됩니다.",
    exampleText: "예시: 핵심범주를 '일상을 되찾기 위한 협상(negotiating a livable life)'으로 정하고, 통제·불확실성·관계 범주가 그 둘레로 어떻게 연결되는지 서술합니다.",
    table: { title: "선택코딩 산출물(예시)", columns: ["항목", "내용"], rows: [["핵심범주", "일상을 되찾기 위한 협상"], ["이야기윤곽", "조건→전략→결과로 이어지는 서사 요약"]] },
    figure: { type: "network", inputs: ["패러다임모형"], outputs: ["핵심범주"], step: "선택코딩" },
    moreExamples: [
      { label: "예시 2 · 연결 중심성 후보", text: "범주들의 연결 관계 수를 세어 ‘일상 통제하기’가 가장 많은 범주와 연결되어 있어 핵심범주 후보 1순위로 제시합니다." },
      { label: "예시 3 · 이야기윤곽 초안", text: "“진단으로 무너진 일상을 정보와 루틴으로 되찾아 가는 과정”이라는 5문장 스토리라인 초안을 작성합니다.", table: { columns: ["항목", "내용"], rows: [["핵심범주", "일상을 되찾기 위한 협상"], ["스토리라인", "혼란→적응→안정화"]] } },
    ],
    beginnerTip: "핵심범주 명명은 연구자의 창의적 해석이 필요한 대표적 '수동화' 영역이에요.",
  },
  {
    registryStageId: "QL-008.s7", uiStage: 7,
    title: "유형분석 및 가설적 정형화 (Typology & Hypothetical Formalization)",
    oneLine: "참여자를 유형으로 나누고, 유형별 특성을 비교하는 확장 분석입니다.",
    stepRole: ["가설적 정형화(Hypothetical Formalization)", "유형 매트릭스 설계 및 명명", "참여자별 유형 배정", "유형별 특성 비교 및 서술"],
    inFunction: "핵심범주·참여자별 코딩", outFunction: "유형 매트릭스·참여자별 유형·유형 비교표",
    why: "동일한 핵심범주 안에서도 참여자 간 대응방식이 다를 수 있어, 유형화하면 이론의 설명력이 풍부해집니다.",
    exampleText: "예시: '적극적 관리형' vs '수동적 순응형' 두 유형으로 나누고, 각 유형의 복약 관리·정보 탐색 양상을 비교 서술합니다.",
    table: { title: "유형분석 산출물(예시)", columns: ["유형", "특징", "인원"], rows: [["적극적 관리형", "정보 탐색 활발·자기조절 강함", "9"], ["수동적 순응형", "의료진 지시 의존", "6"]] },
    figure: { type: "matrix", inputs: ["핵심범주"], outputs: ["유형 매트릭스"], step: "유형분석(선택)" },
    moreExamples: [
      { label: "예시 2 · 유형 배정표", text: "참여자 15명을 ‘적극 관리형’과 ‘수동 순응형’ 두 유형에 배정하고 각 유형의 인원을 표로 정리합니다.", table: { columns: ["유형", "인원"], rows: [["적극 관리형", "9"], ["수동 순응형", "6"]] } },
      { label: "예시 3 · 유형별 비교 서술", text: "적극 관리형은 정보 탐색이 활발하고, 수동 순응형은 의료진 지시에 의존하는 경향을 비교해 서술합니다." },
    ],
    beginnerTip: "이 단계는 선택적 확장절차이므로, 유형 구분이 뚜렷할 때만 수행하면 됩니다.",
  },
  {
    registryStageId: "QL-008.s8", uiStage: 8,
    title: "과정분석 및 상황모형 (Process Analysis & Conditional Matrix)",
    oneLine: "시간에 따른 변화 과정을 추적하고, 거시·미시 조건을 담은 상황모형을 구축합니다.",
    stepRole: ["시간적 변화과정(과정코딩) 추적", "과정모형 도식화", "상황경로(Path) 단계 정의", "거시/미시 조건 재구분 및 상황모형 구축", "이론적 통합 및 가설적 관계진술"],
    inFunction: "핵심범주·시계열 자료", outFunction: "과정모형·상황모형·가설적 관계진술",
    why: "QL-008은 '시간에 따라 어떻게 변하는가'까지 설명해야 정적 분류를 넘어선 과정이론이 됩니다.",
    exampleText: "예시: 진단 초기(혼란)→적응 시도(정보탐색)→안정화(루틴 확립)의 3단계 변화과정을 도식화하고, 사회·의료 접근성 같은 거시조건을 상황모형에 배치합니다.",
    table: { title: "과정·상황모형 산출물(예시)", columns: ["단계", "특징"], rows: [["혼란기", "정보 부족·불안"], ["적응 시도기", "정보 탐색·시행착오"], ["안정화기", "루틴 확립·통제감 회복"]] },
    figure: { type: "flow", inputs: ["핵심범주"], outputs: ["과정모형"], step: "과정분석" },
    moreExamples: [
      { label: "예시 2 · 상황모형 배치", text: "개인(미시)~의료제도(거시) 조건을 동심원에 배치해, 어떤 조건이 개인 경험에 가까운지 시각적으로 보여줍니다." },
      { label: "예시 3 · 3단계 변화표", text: "혼란기→적응 시도기→안정화기로 이어지는 3단계 변화 과정을 표로 정리합니다.", table: { columns: ["단계", "특징"], rows: [["혼란기", "정보 부족·불안"], ["안정화기", "루틴 확립"]] } },
    ],
    beginnerTip: "단계 이름은 참여자들의 경험을 관통하는 동사형 표현이 좋아요(예: '적응 시도하기').",
  },
  {
    registryStageId: "QL-008.s9", uiStage: 9,
    title: "이론적 표집 및 이론적 포화 (Theoretical Sampling & Saturation)",
    oneLine: "분석 중에도 계속 새로운 자료를 표집하고, 더 새로운 개념이 없으면 포화로 판단합니다.",
    stepRole: ["단계별 이론적 표집전략 적용(개념이 덜 채워진 방향으로 추가 표집)", "이론적 포화(Theoretical Saturation) 판단"],
    inFunction: "진행 중인 코딩 결과", outFunction: "추가 표집 계획·포화 판정",
    why: "QL-008은 고정된 절차가 아니라 개방코딩~선택코딩과 동시에 순환하며 표집·포화를 관리해야 합니다.",
    exampleText: "예시: '불확실성' 개념이 덜 채워졌다면 증상이 급변한 참여자를 추가 표집하고, 더 이상 새로운 속성·차원이 나오지 않으면 포화로 판정합니다.",
    table: { title: "포화 판단(예시)", columns: ["범주", "새 개념", "판정"], rows: [["일상 통제하기", "0", "포화"], ["관계 조율하기", "2", "표집 추가"]] },
    figure: { type: "bar", inputs: ["코딩 결과"], outputs: ["포화 판정"], step: "이론적 표집·포화" },
    moreExamples: [
      { label: "예시 2 · 추가 표집 결정", text: "‘불확실성’ 개념이 덜 채워져 증상이 급변한 참여자 2명을 추가 표집하기로 결정하고 사유를 기록합니다." },
      { label: "예시 3 · 배치별 신규개념 추적", text: "인터뷰 배치마다 새로 나온 개념 수를 세어, 2회 연속 0개면 포화로 판정합니다.", table: { columns: ["배치", "신규 개념 수"], rows: [["4차", "2"], ["5차", "0"], ["6차", "0"]] } },
    ],
    beginnerTip: "포화는 '완벽'이 아니라 '새로움이 멈춤'이라는 뜻이에요.",
  },
  {
    registryStageId: "QL-008.s10", uiStage: 10,
    title: "타당성 및 신뢰도 (Rigor & Trustworthiness)",
    oneLine: "분석 결과가 믿을 만한지 적용가능성·일관성·중립성·윤리·삼각검증으로 점검합니다.",
    stepRole: ["적용가능성(Applicability/Fit) 검증", "일관성(Consistency/Auditability) 검증", "중립성(Neutrality/Confirmability) 검증", "연구윤리 준수 점검", "삼각검증(Triangulation, 다중자료·다중분석자)"],
    inFunction: "코딩·범주·이론", outFunction: "타당성·신뢰도 점검 보고서",
    why: "질적연구의 엄정성은 통계적 유의도가 아니라 이 다섯 기준으로 평가되므로, 명시적 점검이 필요합니다.",
    exampleText: "예시: 감사가능성(audit trail)을 위해 코딩 메모·의사결정 이력을 정리하고, 다른 분석자와의 교차코딩으로 일관성을 검증합니다.",
    table: { title: "타당성 점검(예시)", columns: ["기준", "방법", "결과"], rows: [["일관성", "교차코딩 일치율", "88%"], ["중립성", "성찰일지·감사가능성", "확보"]] },
    figure: { type: "bar", inputs: ["코딩·이론"], outputs: ["타당성 보고서"], step: "타당성·신뢰도" },
    moreExamples: [
      { label: "예시 2 · 삼각검증", text: "면접 외에 관찰노트와 진료 기록을 함께 참고하는 자료 삼각화로 결과를 교차 확인합니다." },
      { label: "예시 3 · 점검표", text: "일관성·중립성 등 5개 기준의 점검 방법과 결과를 표로 정리해 보고서에 첨부합니다.", table: { columns: ["기준", "결과"], rows: [["일관성", "교차코딩 일치 88%"], ["중립성", "성찰일지 확보"]] } },
    ],
    beginnerTip: "감사가능성(audit trail)은 코딩 의사결정을 기록해두면 자동으로 확보돼요.",
  },
  {
    registryStageId: "QL-008.s11", uiStage: 11,
    title: "연구결과 통합·해석 및 시사점 (Integration, Interpretation & Implications)",
    oneLine: "전체 결과를 통합·해석하고, 이론적·실무적 시사점과 한계·후속연구를 제시합니다.",
    stepRole: ["연구결과 통합 요약", "연구결과 해석", "이론적 함의 도출", "실무적·정책적 시사점 도출", "연구의 한계 및 후속연구 제언"],
    inFunction: "핵심범주·패러다임모형·타당성 보고서", outFunction: "통합 결과·이론적/실무적 시사점·한계 및 제언",
    why: "QL-008의 최종 산출물은 하나의 실체이론이며, 이를 학문적·실무적 언어로 옮겨야 연구가 완성됩니다.",
    exampleText: "예시: '일상을 되찾기 위한 협상' 이론을 바탕으로, 임상현장에는 초기 적응기 정보지원 프로그램을 제안하고, 후속연구로 종단적 추적조사를 제언합니다.",
    table: { title: "결론 산출물(예시)", columns: ["항목", "내용"], rows: [["이론적 함의", "자기관리 협상 과정 이론화"], ["실무적 시사점", "초기 적응기 정보지원 프로그램"], ["후속연구", "종단적 추적조사"]] },
    figure: { type: "flow", inputs: ["핵심범주", "타당성 보고서"], outputs: ["결론·시사점"], step: "통합·해석" },
    moreExamples: [
      { label: "예시 2 · 이론적 함의", text: "기존 자기관리 이론에 ‘협상’ 개념을 더해 “자기관리는 순응이 아니라 협상 과정”이라는 관점을 제시합니다." },
      { label: "예시 3 · 결론 요약표", text: "이론적 함의·실무적 시사점·후속연구 제언을 한 표로 정리해 마무리합니다.", table: { columns: ["항목", "내용"], rows: [["실무 시사점", "초기 적응기 정보지원 프로그램"], ["후속연구", "종단적 추적조사"]] } },
    ],
    beginnerTip: "한계는 감추기보다 명확히 적을수록 연구의 신뢰도가 높아져요.",
  },
];

export function gtStageView(registryStageId: string): CaStageView | undefined {
  return GT_STAGE_VIEWS.find((s) => s.registryStageId === registryStageId);
}
