// 산출물 실물 서식 샘플 라이브러리 — methodos-f20.
// 각 방법(CA/Q/GT)의 프로젝트 워크벤치 세부단계 '산출물' 항목마다 구체적인 예시가 채워진 실제
// 서류양식 샘플을 제공한다. 패턴 매칭 기반 아키타입: 산출물 이름을 키워드로 스캔해 해당 아키타입의
// 채워진 서식을 생성한다. ⚠️ 저작권: 첨부 원전 논문(무관용 학교폭력/광고디자인/인터넷전문은행)의
// 사례 데이터는 절대 사용하지 않으며, 자체 제작 도메인을 사용:
//   · CA=반려동물 신문기사(2015~2024)  · Q=대학생 온라인 수업 인식 유형  · GT=만성질환 자기관리

export type PerfMethod = "gt" | "ca" | "q";

export interface SampleTable { columns: string[]; rows: (string | number)[][]; caption?: string; }
export interface SampleFigure { svg: string; caption?: string; }
export interface SampleFormField { label: string; value: string; multiline?: boolean; }
export interface SampleSection {
  kind: "para" | "list" | "olist" | "table" | "figure" | "form" | "note" | "sig";
  title?: string;
  para?: string;
  list?: string[];
  table?: SampleTable;
  figure?: SampleFigure;
  form?: SampleFormField[];
  note?: string;
}
export interface DeliverableSample {
  id: string;
  title: string;
  subtitle?: string;
  meta?: Array<{ label: string; value: string }>;
  sections: SampleSection[];
}

// ── 도메인 별 기본 컨텍스트 ──
const DOM = {
  ca: { title: "반려동물 신문기사 TX-002(2015~2024)", subject: "반려동물 보도의 주제·논조 변화", researcher: "홍길동", advisor: "이지연 교수", inst: "○○대학교 커뮤니케이션학과" },
  q:  { title: "대학생의 온라인 수업 인식 유형 연구", subject: "온라인 수업에 대한 대학생 주관성 유형화", researcher: "박서연", advisor: "김민호 교수", inst: "○○대학교 교육학과" },
  gt: { title: "만성질환자의 일상 자기관리 과정 QL-008", subject: "만성질환자가 일상 자기관리를 어떻게 협상해 나가는가", researcher: "최도윤", advisor: "정하늘 교수", inst: "○○대학교 간호학과" },
  /** 마케팅리서치(SV-001) — TX-002 예시와 혼동되지 않도록 분리 */
  ms: { title: "도시형 카페 브랜드 고객만족·재방문 조사", subject: "20–40대 타깃의 만족도·NPS·유입경로 분석", researcher: "홍길동", advisor: "마석동 교수", inst: "○○대학교 경영학과" },
};

const today = () => new Date().toISOString().slice(0, 10);
const meta = (m: PerfMethod | "ms"): Array<{ label: string; value: string }> => [
  { label: "연구주제", value: DOM[m].title },
  { label: "연구자", value: DOM[m].researcher }, { label: "지도교수", value: DOM[m].advisor },
  { label: "소속", value: DOM[m].inst }, { label: "작성일", value: today() },
];

/** 마케팅리서치 등 비(CA/Q/GT) 방법의 산출물 메타·도메인을 연구방법에 맞게 교정 */
export function adaptSampleToMethodLabel(sample: DeliverableSample, label?: string | null): DeliverableSample {
  if (!label || !/마케팅|SV-001|Marketing Research|market.?survey/i.test(label)) return sample;
  const m = { ...sample, meta: meta("ms") };
  // 잘못 끼어든 TX-002 도메인 문구를 SV-001 예시로 치환
  const remap = (t: string) =>
    t
      .replace(/반려동물\s*신문기사\s*TX-002\s*\(2015~2024\)/g, DOM.ms.title)
      .replace(/반려동물/g, "카페 고객")
      .replace(/TX-002/g, "SV-001")
      .replace(/신문기사/g, "고객 리뷰·설문")
      .replace(/이지연 교수|000\s*교수/g, "마석동 교수");
  return {
    ...m,
    title: remap(m.title),
    subtitle: m.subtitle ? remap(m.subtitle) : m.subtitle,
    sections: (m.sections || []).map((sec) => ({
      ...sec,
      para: sec.para ? remap(sec.para) : sec.para,
      note: sec.note ? remap(sec.note) : sec.note,
      list: sec.list?.map(remap),
      form: sec.form?.map((f) => ({ ...f, value: remap(f.value) })),
      table: sec.table
        ? {
            ...sec.table,
            columns: sec.table.columns.map((c) => remap(String(c))),
            rows: sec.table.rows.map((r) => r.map((c) => (typeof c === "string" ? remap(c) : c))),
            caption: sec.table.caption ? remap(sec.table.caption) : sec.table.caption,
          }
        : sec.table,
    })),
  };
}

// ── SVG 도식 생성기(간단한 상자-화살표 흐름도) ──
function flowSVG(boxes: string[], hz = true, w = 720, h = 120): string {
  if (!boxes.length) return "";
  const n = boxes.length;
  if (hz) {
    const bw = Math.min(140, (w - 40) / n - 20);
    const gap = ((w - 40) - bw * n) / Math.max(1, n - 1);
    let s = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">`;
    boxes.forEach((t, i) => { const x = 20 + i * (bw + gap); s += `<rect x="${x}" y="30" width="${bw}" height="60" rx="6" fill="#EDE7F6" stroke="#7c3aed"/><text x="${x + bw / 2}" y="65" text-anchor="middle" font-size="12" fill="#2b1a5f">${t.length > 12 ? t.slice(0, 11) + "…" : t}</text>`;
      if (i < n - 1) { const ax = x + bw, ay = 60; s += `<line x1="${ax}" y1="${ay}" x2="${ax + gap}" y2="${ay}" stroke="#7c3aed" stroke-width="1.5"/><polygon points="${ax + gap},${ay} ${ax + gap - 6},${ay - 4} ${ax + gap - 6},${ay + 4}" fill="#7c3aed"/>`; } });
    return s + "</svg>";
  }
  return "";
}
function paradigmSVG(): string {
  // 6-슬롯 패러다임 모형(조건→현상→결과)
  return `<svg viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
    <rect x="20" y="20" width="140" height="60" rx="6" fill="#FEE2E2" stroke="#B91C1C"/><text x="90" y="45" text-anchor="middle" font-size="12">인과적 조건</text><text x="90" y="65" text-anchor="middle" font-size="10">증상 악화·진단 충격</text>
    <rect x="20" y="180" width="140" height="60" rx="6" fill="#FEF3C7" stroke="#B45309"/><text x="90" y="205" text-anchor="middle" font-size="12">맥락적 조건</text><text x="90" y="225" text-anchor="middle" font-size="10">질병 정보 접근성·직장</text>
    <rect x="290" y="100" width="140" height="60" rx="6" fill="#EDE9FE" stroke="#6D28D9"/><text x="360" y="125" text-anchor="middle" font-size="12">중심현상</text><text x="360" y="145" text-anchor="middle" font-size="10">일상 되찾기 씨름</text>
    <rect x="560" y="20" width="140" height="60" rx="6" fill="#DBEAFE" stroke="#1D4ED8"/><text x="630" y="45" text-anchor="middle" font-size="12">중재적 조건</text><text x="630" y="65" text-anchor="middle" font-size="10">가족 지지·의료진 신뢰</text>
    <rect x="560" y="180" width="140" height="60" rx="6" fill="#DCFCE7" stroke="#166534"/><text x="630" y="205" text-anchor="middle" font-size="12">전략/작용</text><text x="630" y="225" text-anchor="middle" font-size="10">복약 관리·정보 탐색</text>
    <rect x="290" y="220" width="140" height="30" rx="6" fill="#E0F2FE" stroke="#0369A1"/><text x="360" y="240" text-anchor="middle" font-size="12">결과: 통제감 회복</text>
    <line x1="160" y1="50" x2="290" y2="120" stroke="#666"/><line x1="160" y1="210" x2="290" y2="150" stroke="#666"/>
    <line x1="430" y1="120" x2="560" y2="50" stroke="#666"/><line x1="430" y1="150" x2="560" y2="210" stroke="#666"/>
    <line x1="360" y1="160" x2="360" y2="220" stroke="#666"/></svg>`;
}
function forceDistSVG(): string {
  // Q-sort 강제분포 (진술 30개, 2-3-4-5-6-5-4-3-2)
  const counts = [2, 3, 4, 5, 6, 5, 4, 3, 2]; const labels = ["-4", "-3", "-2", "-1", "0", "+1", "+2", "+3", "+4"];
  let s = `<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">`;
  const cw = 70, gap = 6, startX = 30;
  counts.forEach((c, i) => {
    const x = startX + i * (cw + gap); const col = i < 4 ? "#FCA5A5" : i > 4 ? "#86EFAC" : "#E5E7EB";
    for (let k = 0; k < c; k++) { const yy = 160 - k * 18; s += `<rect x="${x + 5}" y="${yy - 15}" width="${cw - 10}" height="16" rx="2" fill="${col}" stroke="#374151"/>`; }
    s += `<text x="${x + cw / 2}" y="185" text-anchor="middle" font-size="12" font-weight="bold">${labels[i]}</text>`;
    s += `<text x="${x + cw / 2}" y="200" text-anchor="middle" font-size="10">(${c}칸)</text>`;
  });
  s += `<text x="30" y="20" font-size="12" fill="#374151">비동의 ← ─────────────────────────────── → 동의</text>`;
  return s + "</svg>";
}
function funnelSVG(steps: { label: string; n: number }[]): string {
  const max = Math.max(...steps.map((x) => x.n)); const w = 680, sh = 44, gap = 8;
  let s = `<svg viewBox="0 0 ${w} ${steps.length * (sh + gap) + 20}" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">`;
  steps.forEach((st, i) => { const bw = 200 + (st.n / max) * 400; const x = (w - bw) / 2; const y = 10 + i * (sh + gap); s += `<rect x="${x}" y="${y}" width="${bw}" height="${sh}" rx="4" fill="#EDE7F6" stroke="#7c3aed"/><text x="${w / 2}" y="${y + sh / 2 + 4}" text-anchor="middle" font-size="12" fill="#2b1a5f">${st.label}: <tspan font-weight="bold">${st.n.toLocaleString()}</tspan>건</text>`; });
  return s + "</svg>";
}
function matrix2x2SVG(labels: [string, string, string, string], axesX = "관계 지향", axesY = "만족도"): string {
  return `<svg viewBox="0 0 460 320" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
    <line x1="230" y1="30" x2="230" y2="290" stroke="#374151"/><line x1="30" y1="160" x2="430" y2="160" stroke="#374151"/>
    <text x="230" y="20" text-anchor="middle" font-size="11">${axesY} 高</text><text x="230" y="310" text-anchor="middle" font-size="11">${axesY} 低</text>
    <text x="30" y="164" font-size="11">${axesX} 低</text><text x="430" y="164" text-anchor="end" font-size="11">${axesX} 高</text>
    <rect x="60" y="50" width="150" height="90" rx="4" fill="#DBEAFE" stroke="#1D4ED8"/><text x="135" y="100" text-anchor="middle" font-size="13" font-weight="bold">${labels[0]}</text>
    <rect x="250" y="50" width="150" height="90" rx="4" fill="#DCFCE7" stroke="#166534"/><text x="325" y="100" text-anchor="middle" font-size="13" font-weight="bold">${labels[1]}</text>
    <rect x="60" y="180" width="150" height="90" rx="4" fill="#FEF3C7" stroke="#B45309"/><text x="135" y="230" text-anchor="middle" font-size="13" font-weight="bold">${labels[2]}</text>
    <rect x="250" y="180" width="150" height="90" rx="4" fill="#FEE2E2" stroke="#B91C1C"/><text x="325" y="230" text-anchor="middle" font-size="13" font-weight="bold">${labels[3]}</text>
  </svg>`;
}

// ── 아키타입 정의 ──
type BuildFn = (name: string, method: PerfMethod) => DeliverableSample;
interface Archetype { id: string; keywords: (string | RegExp)[]; methods?: PerfMethod[]; priority?: number; build: BuildFn; }

// 공용 헬퍼: 헤더+메타
const base = (id: string, title: string, method: PerfMethod, subtitle?: string): Pick<DeliverableSample, "id" | "title" | "subtitle" | "meta"> =>
  ({ id, title, subtitle, meta: meta(method) });

// ══════════════ 아키타입들 ══════════════
const ARCHETYPES: Archetype[] = [];

// 1. 문제의식/연구필요성/연구목적 서술문
ARCHETYPES.push({
  id: "problem-statement", keywords: [/문제의식|필요성 서술문|연구목적 서술문|연구목적 및 연구필요성/],
  priority: 10, build: (name, m) => {
    const bodyByMethod: Record<PerfMethod, string[]> = {
      ca: [
        "본 연구의 문제의식은 지난 10년간 반려동물 관련 신문기사가 급증했음에도 그 보도의 주제·논조 변화를 통합적으로 분석한 TX-002 연구가 부재하다는 점에서 출발한다.",
        "인상적 관찰이나 특정 사건 중심의 논평이 아닌, 정해진 분석유목과 코더간 신뢰도가 확보된 체계적 절차로 “보도의 무엇이, 얼마나, 어떻게 변했는가”를 규명할 필요가 있다.",
        "따라서 본 연구는 2015~2024년 4개 종합일간지의 반려동물 기사 1,150건을 대상으로 TX-002을 수행한다.",
      ],
      q: [
        "본 연구의 문제의식은 대학생의 온라인 수업 ‘평균 만족도’ 뒤에 감춰진 인식 차이의 구조가 여전히 드러나지 않았다는 점에서 출발한다.",
        "설문의 5점 평균으로는 어떤 학생이 왜 좋아하고 왜 싫어하는지, 그 주관성의 유형을 포착하기 어렵다.",
        "따라서 본 연구는 GN-029을 채택하여 대학생의 온라인 수업에 대한 주관적 인식 유형을 밝힌다.",
      ],
      gt: [
        "본 연구의 문제의식은 기존 만성질환 자기관리 연구가 ‘복약 순응도’ 같은 정량 지표에 편중되어, 환자가 일상에서 어떻게 자기관리를 협상해 나가는가라는 과정적 경험을 다루지 못했다는 점에서 출발한다.",
        "따라서 본 연구는 Strauss & Corbin의 QL-008을 채택하여 만성질환자의 자기관리 협상 과정에 관한 실체이론을 도출한다.",
      ],
    };
    return {
      ...base("problem-statement", name || "문제의식·연구필요성 서술문", m, "제1장 서론 · 문제제기"),
      sections: [
        { kind: "note", note: "🖋 실제 서식 샘플입니다. 아래 서술문 본문을 그대로 참고해 각자 연구에 맞게 다듬으세요." },
        { kind: "para", title: "1.1 문제제기", para: bodyByMethod[m].join("\n\n") },
        { kind: "para", title: "1.2 연구목적", para: `본 연구의 목적은 ${DOM[m].subject}(를)을 체계적으로 파악하여, 학문적·실무적 시사점을 도출하는 것이다.` },
        { kind: "list", title: "1.3 세부 연구목적", list: [
          `${DOM[m].subject}(를)을 실증 자료로 규명한다.`,
          "선행연구와의 비교를 통해 본 연구의 차별적 기여를 명확히 한다.",
          "결과 해석을 바탕으로 학문적·실무적 시사점과 후속연구 방향을 제시한다.",
        ] },
        { kind: "sig" },
      ],
    };
  },
});

// 2. 선행연구 검토보고서 / 연구공백 메모
ARCHETYPES.push({
  id: "lit-review-memo", keywords: [/선행연구 검토보고서|연구공백|공백 정리|공백 식별|선행연구 재검토/],
  priority: 9, build: (name, m) => ({
    ...base("lit-review-memo", name || "선행연구 검토보고서", m, "성찰 메모 · 연구공백 정리"),
    sections: [
      { kind: "para", title: "1. 검토 범위", para: `RISS·KCI·ScienceON에서 최근 10년간 ‘${DOM[m].subject}’ 관련 국내외 문헌 62편을 수집·검토함.` },
      { kind: "table", title: "2. 선행연구 유형별 분포", table: { columns: ["구분", "편수", "주요 주제"], rows: [
        ["방법론 문헌", 8, "설계·신뢰도 검증법"], ["국내 실증연구", 34, "특정 사례 중심 분석"], ["국외 실증연구", 20, "이론 검증·비교"],
      ] } },
      { kind: "list", title: "3. 확인된 연구공백", list: [
        "특정 사례 중심 접근은 있으나 전 기간을 아우르는 통합 분석이 부재",
        "주제·논조·정보원을 함께 다룬 다차원 분석이 부족",
        "질적 경험과 양적 추이를 병렬로 대조한 연구가 드묾",
      ] },
      { kind: "note", note: "본 메모는 성찰·판단 과정을 담은 문서로, 반드시 연구자가 직접 작성·수정한다." },
    ],
  }),
});

// 3. GN-029 이론적 배경 정리노트
ARCHETYPES.push({
  id: "q-theory-note", keywords: [/이론적 배경 정리|이론적 배경 정리노트|GN-029 적용이유|GN-029 적용 이유/],
  methods: ["q"], priority: 12, build: (name, m) => ({
    ...base("q-theory-note", name || "GN-029 이론적 배경 정리노트", m, "정리노트 · 방법론 근거"),
    sections: [
      { kind: "olist", title: "1. GN-029의 3대 특징", list: [
        "주관성의 과학(science of subjectivity): 개인 내부의 관점을 다룬다.",
        "가설추론적(abductive) 방법론: 이론을 사후적으로 도출한다.",
        "양·질 혼합적 성격: 강제분포+요인분석이라는 정형 통계 절차를 결합한다.",
      ] },
      { kind: "para", title: "2. 신뢰도·타당도의 의미", para: "빈도의 재현이 아니라, ‘유사 유형이 다시 발견되는가’로 신뢰도를 판단한다. 검사-재검사 상관(통상 r≥.7~.8)이 안정성의 지표이다." },
      { kind: "para", title: "3. 본 연구의 적용 근거", para: `설문 평균으로는 대학생 온라인 수업에 대한 만족/불만족의 이유 차이를 잡아낼 수 없다. 따라서 개인 내 중요성 차이를 다루는 GN-029이 적합하다.` },
    ],
  }),
});

// 4. 국내·외 GN-029 선행연구 동향 요약
ARCHETYPES.push({
  id: "q-trend", keywords: [/선행연구 동향|GN-029 선행연구|ERIC/],
  methods: ["q"], priority: 11, build: (name, m) => ({
    ...base("q-trend", name || "국내·외 GN-029 선행연구 동향 요약", m),
    sections: [
      { kind: "table", title: "표. 연도별 국내외 GN-029 논문 수(예시)", table: { columns: ["연도", "국내(KCI)", "국외(ERIC)"], rows: [
        [2019, 42, 68], [2020, 56, 75], [2021, 61, 82], [2022, 74, 88], [2023, 79, 94], [2024, 83, 101],
      ] } },
      { kind: "list", title: "동향 요약", list: [
        "교육·보건 분야에서 학습자 인식 유형화 연구 지속 증가",
        "국외는 정책 수용 태도, 국내는 교사·학생 인식 연구 중심",
        "본 주제(온라인 수업 인식 유형)를 다룬 논문은 국내 6편, 국외 12편으로 상대적으로 소수",
      ] },
    ],
  }),
});

// 5. 자료수집 및 분석절차표 / 5단계 절차
ARCHETYPES.push({
  id: "procedure-table", keywords: [/자료수집 및 분석절차표|분석절차표|전체 연구절차|자료수집.*절차|5단계 절차|연구절차 흐름/],
  priority: 10, build: (name, m) => {
    const rows: Record<PerfMethod, (string | number)[][]> = {
      q: [[1, "Q모집단 구성", "면담·문헌·기사에서 진술문 수집", "진술 후보 180개"], [2, "Q표본 선정", "축약·범주화·구어체 전환", "최종 진술 30개"], [3, "P표본 선정", "관점 다양성 기준 의도적 표집", "참여자 20명"], [4, "Q분류", "강제분포 카드 정렬 + 후속면담", "20개의 Q소트"], [5, "요인분석·해석", "상관→고유분해→베리맥스→유형 명명", "3개 유형 도출"]],
      ca: [[1, "표집·범위 설정", "키워드 검색·전수조사·전문가 검토", "최종 표본 1,150건"], [2, "분석유목 설계", "선행 유목 참조 + 코더 검토", "코딩스킴 4종"], [3, "코더 훈련·사전코딩", "10% 표본 사전코딩·Kappa 계산", "κ 확정"], [4, "본코딩", "확정 유목 기반 전 표본 코딩", "코딩 데이터셋"], [5, "통계분석·해석", "빈도·χ²·교차분석·해석", "결과보고서"]],
      gt: [[1, "표집설계", "이론적 표집·개념적 포화 기준", "표집 기준서"], [2, "심층면접", "반구조화 인터뷰·전사·익명화", "전사록 20건"], [3, "개방코딩", "분절·개념·하위·상위범주 도출", "개념·범주 목록"], [4, "축코딩", "패러다임모형 6요소 배치", "패러다임모형"], [5, "선택코딩", "핵심범주·스토리라인·이론 통합", "실체이론"]],
    };
    return {
      ...base("procedure-table", name || "자료수집 및 분석절차표", m, "표 · 전체 절차"),
      sections: [
        { kind: "table", table: { columns: ["단계", "절차", "세부 활동", "산출물"], rows: rows[m] } },
        { kind: "figure", figure: { svg: flowSVG(rows[m].map((r) => String(r[1])), true, 720, 130), caption: "그림. 전체 연구절차 흐름도" } },
      ],
    };
  },
});

// 6. 예비인터뷰 참여자 특성표 (Q, GT)
ARCHETYPES.push({
  id: "pilot-participants", keywords: [/예비인터뷰 참여자|예비조사 대상자|예비조사 참여자|예비인터뷰.*특성표|예비조사 대상자 선정 기록/],
  priority: 9, build: (name, m) => ({
    ...base("pilot-participants", name || "예비인터뷰 참여자 특성표", m, "표 · 예비조사 참여자"),
    sections: [
      { kind: "table", title: "예비인터뷰 참여자 특성(N=8)", table: { columns: ["번호", "가명", "성별", "연령", "소속/직군", "경험 특성"], rows: [
        [1, "P1", "여", 21, "학부 3학년", "온라인 수업 만족"], [2, "P2", "남", 22, "학부 4학년", "온라인 수업 불만"],
        [3, "P3", "여", 27, "대학원 석사", "실시간 병행"], [4, "P4", "남", 42, "성인학습자", "직장 병행"],
        [5, "P5", "남", 35, "교수자", "운영 관점"], [6, "P6", "여", 20, "학부 2학년", "혼합수업"],
        [7, "P7", "여", 24, "학부 4학년", "장거리 통학"], [8, "P8", "남", 31, "대학원 박사", "TA 경험"],
      ] } },
      { kind: "note", note: "가명은 P1~P8로 익명화. 개인정보는 보안 저장 후 연구 종료 시 폐기." },
    ],
  }),
});

// 7. 예비인터뷰/본인터뷰 추출 진술문 (긍정/중립/부정)
ARCHETYPES.push({
  id: "pilot-statements", keywords: [/예비인터뷰 추출 진술문|인터뷰 추출 진술문|추출 진술문|진술문 98개|진술문 287개|진술문 범주표/],
  methods: ["q"], priority: 10, build: (name, m) => ({
    ...base("pilot-statements", name || "예비인터뷰 추출 진술문 목록", m, "1인칭 의견 문장 추출"),
    sections: [
      { kind: "table", title: "표. 예비인터뷰 진술문 극성별 집계(N=98)", table: { columns: ["극성", "개수", "비율(%)"], rows: [
        ["긍정", 25, 25.5], ["중립", 10, 10.2], ["부정", 63, 64.3], ["합계", 98, 100.0],
      ] } },
      { kind: "table", title: "표. 진술문 표본(발췌)", table: { columns: ["ID", "극성", "진술문(1인칭)"], rows: [
        ["S001", "긍정", "나는 이동시간이 없어 실질 학습시간이 늘어난다고 생각한다."],
        ["S002", "긍정", "나는 녹화 강의를 원할 때 다시 들을 수 있어 효율적이라고 본다."],
        ["S018", "중립", "나는 과목에 따라 온라인이 좋을 수도 나쁠 수도 있다고 생각한다."],
        ["S037", "부정", "나는 집중이 안 되어 학습 성취가 떨어진다고 느낀다."],
        ["S052", "부정", "나는 동료들과의 유대감이 부족해 소속감이 떨어진다고 생각한다."],
      ] } },
    ],
  }),
});

// 8. 인구통계·참여자 특성표 (본조사)
ARCHETYPES.push({
  id: "participants-demo", keywords: [/참여자 특성표|참여자별 프로필|일반적 특성표|P표본.*특성표|본인터뷰 참여자|참여 확정자|인구사회학적/],
  priority: 8, build: (name, m) => {
    const rows = m === "q" ? [
      ["학부생", 9, "45.0", "다양한 전공"], ["대학원생", 5, "25.0", "TA·연구조교"], ["교수자", 3, "15.0", "운영 관점"], ["직장인 학습자", 3, "15.0", "성인학습"], ["합계", 20, "100.0", ""],
    ] : m === "gt" ? [
      ["30대", 4, "22.2", "직장·양육 병행"], ["40대", 6, "33.3", "직장 병행"], ["50대", 5, "27.8", "직장 병행"], ["60대", 3, "16.7", "은퇴자"], ["합계", 18, "100.0", ""],
    ] : [
      ["A일보", 356, "31.0", "종합일간지"], ["B일보", 311, "27.0", "종합일간지"], ["C일보", 273, "23.7", "종합일간지"], ["D일보", 210, "18.3", "종합일간지"], ["합계", 1150, "100.0", ""],
    ];
    return {
      ...base("participants-demo", name || "참여자/표본 특성표", m, `표 · 표본 특성(N=${m === "q" ? 20 : m === "gt" ? 18 : 1150})`),
      sections: [
        { kind: "table", table: { columns: ["구분", "빈도", "비율(%)", "비고"], rows } },
        { kind: "note", note: "본 특성표는 표본의 다양성과 대표성을 확인하기 위한 기술통계이다." },
      ],
    };
  },
});

// 9. 연구질문(RQ) 정의서
ARCHETYPES.push({
  id: "rq-def", keywords: [/연구질문|연구문제.*정의서|RQ|연구문제\(RQ/],
  priority: 10, build: (name, m) => {
    const rqs: Record<PerfMethod, [string, string][]> = {
      ca: [["RQ1", "시기별 반려동물 보도량 분포와 추이는 어떠한가?"], ["RQ2", "시기별 주제 분포는 어떻게 변하는가?"], ["RQ3", "시기별 논조 분포는 어떻게 변하는가?"], ["RQ4", "주제×시기 교차 분포에 유의한 차이가 있는가?"]],
      q: [["RQ1", "대학생의 온라인 수업 인식은 몇 개의 유형으로 유형화되는가?"], ["RQ2", "각 유형의 강한 동의/비동의 진술은 무엇이며 어떤 의미를 가지는가?"], ["RQ3", "유형 간 구별진술과 합의진술은 무엇인가?"]],
      gt: [["RQ1", "만성질환자는 일상 자기관리를 어떻게 협상해 나가는가?"], ["RQ2", "이 과정에서 어떤 조건·현상·전략이 상호작용하는가?"], ["RQ3", "핵심범주는 무엇이며 어떤 실체이론으로 통합되는가?"]],
    };
    return {
      ...base("rq-def", name || "연구질문(RQ) 정의서", m),
      sections: [{ kind: "table", table: { columns: ["번호", "연구질문"], rows: rqs[m] } }],
    };
  },
});

// 10. 분석유목표 (TX-002 코딩스킴)
ARCHETYPES.push({
  id: "coding-scheme", keywords: [/분석유목표|분석유목|코딩스킴|매체유형 분석유목|주제 분석유목|연구자전공 분석유목|연구방법 유형 분석유목/],
  methods: ["ca"], priority: 9, build: (name, m) => {
    const table = /주제/.test(name) ? { columns: ["코드", "유목", "정의", "포함 예", "제외 예"], rows: [
      ["T1", "입양·분양", "반려동물 입양·분양·유기 관련 보도", "유기견 입양캠페인", "동물원 개장"],
      ["T2", "건강·의료", "질병·치료·예방접종·수의학", "예방접종 확대", "동물 의약품 광고"],
      ["T3", "용품·산업", "사료·용품·시장·프랜차이즈", "펫푸드 시장 확대", "동물병원 개업 공지"],
      ["T4", "제도·법", "법 개정·과태료·등록제", "동물보호법 개정", "학교폭력 사건"],
      ["T5", "문화·행사", "박람회·미디어·문화 행사", "펫박람회", "일반 축제"],
      ["T6", "사건·사고", "유기·학대·안전사고", "산책 중 사고", "일반 교통사고"],
    ] } : /논조/.test(name) ? { columns: ["코드", "논조", "판정 기준", "예문"], rows: [
      ["V+", "긍정", "반려문화 확산·미담 강조", "유기견을 입양해 새 삶을 되찾은…"],
      ["V0", "중립", "정보 전달·객관 서술", "○○구는 등록제 안내를…"],
      ["V-", "부정", "사건·사고·문제 지적", "유기견 방치로 과태료 처분"],
    ] } : /매체/.test(name) ? { columns: ["코드", "매체", "그룹"], rows: [
      ["M1", "TV", "ATL"], ["M2", "신문", "ATL"], ["M3", "잡지", "ATL"], ["M4", "라디오", "ATL"],
      ["M5", "포스터", "BTL"], ["M6", "인터넷", "BTL"], ["M7", "옥외광고", "BTL"], ["M8", "기타", "BTL"],
    ] } : { columns: ["코드", "유목", "정의"], rows: [
      ["A1", "저자 전공(디자인)", "그래픽·산업·시각 등"], ["A2", "저자 전공(예술)", "미술·예술 일반"], ["A3", "저자 전공(사회·경영)", "홍보·마케팅 등"], ["A4", "기타", "위 분류에 해당 없음"],
    ] };
    return {
      ...base("coding-scheme", name || "분석유목표", m, "표 · 코딩스킴"),
      sections: [
        { kind: "table", title: name || "분석유목", table },
        { kind: "note", note: "상호배타·포괄성 원칙에 따라 설계. 판정 예문을 코더 교육 자료로 활용." },
      ],
    };
  },
});

// 11. 코더간 신뢰도표(Kappa/Alpha)
ARCHETYPES.push({
  id: "reliability-table", keywords: [/신뢰도표|신뢰도 계수|Kappa|Cohen|Krippendorff|사전 조사 신뢰도|본 조사 신뢰도|검사-재검사 신뢰도/],
  priority: 9, build: (name, m) => {
    const stage = /본|본조사|본 조사/.test(name) ? "본조사" : /재검사|검사-재검사/.test(name) ? "재검사" : "사전";
    const table = m === "q" && stage === "재검사" ? { columns: ["참여자", "1차 총점", "2차 총점", "상관 r"], rows: [
      ["P01", 108, 110, 0.92], ["P02", 105, 106, 0.88], ["P03", 111, 108, 0.85], ["P04", 107, 109, 0.90], ["P05", 106, 107, 0.94], ["평균", "-", "-", 0.898],
    ] } : { columns: ["분석유목", "Kappa(κ)", "해석"], rows: [
      ["게재 연도", 1.000, "완전 일치"], ["매체 유형", 1.000, "완전 일치"], ["주제", stage === "본조사" ? 0.891 : 0.782, stage === "본조사" ? "거의 완전" : "상당한 일치"],
      ["논조", stage === "본조사" ? 0.910 : 0.845, stage === "본조사" ? "거의 완전" : "거의 완전"], ["정보원", stage === "본조사" ? 0.933 : 0.803, "거의 완전"],
    ] };
    return {
      ...base("reliability-table", name || `${stage} 신뢰도표`, m, `표 · ${stage} 신뢰도(Landis & Koch 기준)`),
      sections: [
        { kind: "table", table }, { kind: "note", note: ".81+ 거의 완전 · .61–.80 상당한 일치 · .41–.60 중간 · .21–.40 낮음" },
      ],
    };
  },
});

// 12. 카이제곱/빈도·비율분석
ARCHETYPES.push({
  id: "chisq-table", keywords: [/카이제곱|χ|빈도·비율|빈도 비율|빈도.*카이제곱|χ² 검정|기술통계.*속성/],
  methods: ["ca"], priority: 9, build: (name, m) => ({
    ...base("chisq-table", name || "빈도·비율 및 카이제곱 검정 결과표", m),
    sections: [
      { kind: "table", title: "표. 시기별 반려동물 보도 주제 분포", table: { columns: ["주제", "1기", "2기", "3기", "합계"], rows: [
        ["입양·분양", 62, 108, 165, 335], ["건강·의료", 35, 88, 205, 328], ["용품·산업", 28, 72, 158, 258], ["제도·법", 18, 75, 96, 189], ["문화·행사", 40, 52, 60, 152], ["사건·사고", 27, 45, 66, 138], ["합계", 210, 440, 750, 1400],
      ] } },
      { kind: "para", title: "검정 결과", para: "χ² = 76.167, df = 6, p < .001. 시기에 따라 주제 분포에 유의한 차이가 있다." },
    ],
  }),
});

// 13. 교차분석 표
ARCHETYPES.push({
  id: "crosstab", keywords: [/교차분석표|다차원 교차|교차분석|시기별 교차/],
  methods: ["ca"], priority: 8, build: (name, m) => ({
    ...base("crosstab", name || "교차분석표", m),
    sections: [
      { kind: "table", title: "표. 주제 × 논조 교차분석", table: { columns: ["주제 \\ 논조", "긍정", "중립", "부정", "합계", "χ²"], rows: [
        ["입양·분양", 210, 88, 37, 335, "-"], ["건강·의료", 145, 122, 61, 328, "-"], ["제도·법", 72, 68, 49, 189, "-"], ["사건·사고", 8, 32, 98, 138, "-"], ["합계", 435, 310, 245, 990, "χ²=142.3, df=6, p<.001"],
      ] } },
      { kind: "note", note: "기대빈도 5 미만 셀 0개. 소표본 셀 발생 시 ‘해석 유보’ 각주 부착." },
    ],
  }),
});

// 14. Q모집단 구축과정 흐름도 / 진술문 축약 흐름
ARCHETYPES.push({
  id: "q-funnel", keywords: [/Q모집단 구축과정 흐름도|Q표본 확정과정|축약 진술문|추출과정 범주빈도|1차 진술문 분류|2차 범주화/],
  methods: ["q"], priority: 10, build: (name, m) => ({
    ...base("q-funnel", name || "Q모집단·Q표본 축약 과정", m, "그림 · 축약 흐름"),
    sections: [
      { kind: "figure", figure: { svg: funnelSVG([{ label: "1차 수집(인터뷰+문헌+기사)", n: 180 }, { label: "1차 검토 축약", n: 90 }, { label: "2차 유사통합", n: 60 }, { label: "3~4차 균형 조정", n: 42 }, { label: "최종 Q표본", n: 30 }]), caption: "그림. Q모집단 → Q표본 5단계 축약 흐름" } },
      { kind: "table", title: "표. 단계별 축약 결과", table: { columns: ["차수", "처리", "남은 수"], rows: [["1차", "중복 삭제", 90], ["2차", "유사 통합", 60], ["3~4차", "전문가·예비분류", 42], ["최종", "긍·중·부 균형 조정", 30]] } },
    ],
  }),
});

// 15. 최종 Q표본 진술문 목록
ARCHETYPES.push({
  id: "q-final-sample", keywords: [/최종 Q표본|Q표본 진술문.*목록|Q표본 진술문 \d+개|Q카드 세트/],
  methods: ["q"], priority: 10, build: (name, m) => ({
    ...base("q-final-sample", name || "최종 Q표본 진술문 목록", m, "표 · 30개 진술(예시)"),
    sections: [
      { kind: "table", table: { columns: ["ID", "극성", "진술문"], rows: [
        ["Q01", "긍정", "온라인 수업은 이동시간을 절약해 준다."], ["Q02", "긍정", "나는 녹화 강의를 반복 시청할 수 있어 이해가 높다."],
        ["Q03", "긍정", "채팅으로 질문하는 것이 더 편하다."], ["Q04", "긍정", "실시간 온라인 토론이 대면보다 활발할 때가 있다."],
        ["Q05", "중립", "과목에 따라 온라인이 적절할 수도 있다."], ["Q06", "중립", "학사 규정은 대면·비대면 모두 명확해야 한다."],
        ["Q07", "부정", "화면 앞에 오래 있으면 집중이 흐트러진다."], ["Q08", "부정", "동료와의 유대감이 부족해 소속감이 떨어진다."],
        ["Q09", "부정", "실시간 조모임 진행이 어색하고 어렵다."], ["Q10", "부정", "실습·현장 학습은 온라인으로 대체하기 어렵다."],
        ["…", "…", "…(총 30개)"],
      ] } },
    ],
  }),
});

// 16. Q-sort 강제분포도 / 분류판
ARCHETYPES.push({
  id: "q-force-dist", keywords: [/강제분류도|강제분포|분류판|Q소트.*분포/],
  methods: ["q"], priority: 10, build: (name, m) => ({
    ...base("q-force-dist", name || "진술문 강제분류도", m, "그림 · 준정규 강제분포"),
    sections: [
      { kind: "figure", figure: { svg: forceDistSVG(), caption: "그림. Q-sort 강제분포도(진술 30개 · 2-3-4-5-6-5-4-3-2)" } },
      { kind: "note", note: "각 칸에 놓을 진술 수는 좌우대칭·합계 30개." },
    ],
  }),
});

// 17. Q소트 점수화 데이터
ARCHETYPES.push({
  id: "q-scored-data", keywords: [/Q소트 점수화|점수화 코딩데이터|Q소트 결과지|개별 Q소트|Q소트 결과/],
  methods: ["q"], priority: 9, build: (name, m) => ({
    ...base("q-scored-data", name || "Q소트 점수화 코딩데이터", m, "표 · 참여자×진술 행렬(예시)"),
    sections: [
      { kind: "table", title: "표. 참여자별 Q소트 점수(발췌)", table: { columns: ["진술 \\ 참여자", "P01", "P02", "P03", "P04", "P05"], rows: [
        ["Q01 이동시간 절약", 4, 2, 3, 4, 1], ["Q02 반복 시청", 3, 1, 4, 3, 2], ["Q03 채팅 질문", 2, 0, 3, 2, 1],
        ["Q07 집중 흐트러짐", -3, -1, -2, -4, 0], ["Q08 유대감 부족", -4, 0, -3, -2, 1], ["Q09 조모임 어색", -1, 1, -2, -1, 2],
      ] } },
      { kind: "note", note: "환산: 등급 −4~+4를 1~9점으로 자동 변환하여 요인분석 입력." },
    ],
  }),
});

// 18. 요인분석 결과(고유값·설명변량)
ARCHETYPES.push({
  id: "q-eigen", keywords: [/Eigenvalue|고유값|변량표|요인별.*변량|요인분석.*결과/],
  methods: ["q"], priority: 10, build: (name, m) => ({
    ...base("q-eigen", name || "요인별 고유값·변량표", m),
    sections: [
      { kind: "table", table: { columns: ["요인", "고유값", "설명변량(%)", "누적(%)", "판정"], rows: [
        ["제1유형", 6.82, 34.1, 34.1, "고유값>1 채택"], ["제2유형", 3.87, 19.4, 53.5, "고유값>1 채택"],
        ["제3유형", 2.64, 13.2, 66.7, "고유값>1 채택"], ["제4유형", 0.92, 4.6, 71.3, "기각(<1)"],
      ] } },
      { kind: "note", note: "Kaiser 기준(eigen>1) 적용 · 베리맥스 회전 후 단순구조 확인." },
    ],
  }),
});

// 19. 인자가중치·유형 배정
ARCHETYPES.push({
  id: "q-flag", keywords: [/인자가중치|가중치표|Factor weight|플래깅|유형별 인자/],
  methods: ["q"], priority: 9, build: (name, m) => ({
    ...base("q-flag", name || "유형별 인자가중치표", m),
    sections: [
      { kind: "table", table: { columns: ["참여자", "1유형 적재", "2유형 적재", "3유형 적재", "배정 유형", "가중치"], rows: [
        ["P01", 0.82, 0.12, 0.20, "1유형", 2.29], ["P02", 0.10, 0.81, 0.05, "2유형", 2.19], ["P03", 0.74, 0.22, 0.31, "1유형", 1.62],
        ["P04", 0.05, 0.09, 0.79, "3유형", 2.02], ["P05", 0.68, 0.38, 0.11, "1유형", 1.27], ["…", "…", "…", "…", "…", "…"],
      ] } },
      { kind: "note", note: "인자가중치 w = l/(1−l²) — 가장 큰 참여자가 그 유형의 대표 참여자." },
    ],
  }),
});

// 20. 유형 상관관계 분석표
ARCHETYPES.push({
  id: "q-factor-corr", keywords: [/유형.*상관|유형간.*상관|상관관계 분석표/],
  methods: ["q"], priority: 9, build: (name, m) => ({
    ...base("q-factor-corr", name || "유형의 상관관계 분석표", m),
    sections: [{ kind: "table", table: { columns: ["", "1유형", "2유형", "3유형"], rows: [
      ["1유형", 1.000, 0.352, 0.288], ["2유형", 0.352, 1.000, 0.417], ["3유형", 0.288, 0.417, 1.000],
    ] } }, { kind: "note", note: "상관이 낮을수록 유형 간 독립성(다른 관점)이 큼." }],
  }),
});

// 21. 유형별 동의/비동의 진술문표
ARCHETYPES.push({
  id: "q-agree-list", keywords: [/유형별 동의 진술문|유형별 비동의 진술문|적극동의|적극비동의|동의 진술문표|비동의 진술문표/],
  methods: ["q"], priority: 9, build: (name, m) => {
    const pos = /비동의|반대/.test(name);
    return {
      ...base("q-agree-list", name || (pos ? "유형별 적극비동의 진술문표" : "유형별 적극동의 진술문표"), m),
      sections: [{ kind: "table", table: { columns: ["유형", "순위", "진술문", "Z점수"], rows: pos ? [
        ["1유형", 1, "동료와의 유대감이 부족해 소속감이 떨어진다.", -1.82], ["1유형", 2, "실시간 조모임 진행이 어색하고 어렵다.", -1.55],
        ["2유형", 1, "이동시간 절약보다 소속감이 더 중요하다.", -1.71], ["3유형", 1, "정해진 시간에 참여해야 한다.", -1.66],
      ] : [
        ["1유형", 1, "온라인 수업은 이동시간을 절약해 준다.", 1.92], ["1유형", 2, "녹화 강의를 반복 시청할 수 있어 이해가 높다.", 1.78],
        ["2유형", 1, "실시간 온라인 토론이 대면보다 활발할 때가 있다.", 1.68], ["3유형", 1, "스스로 계획을 세워 학습할 수 있다.", 1.71],
      ] } }],
    };
  },
});

// 22. 유형간 차이/유사 진술문표
ARCHETYPES.push({
  id: "q-distinguish", keywords: [/유형간 차이|유형간 유사|차이 진술문표|유사점 진술문표|Z값 차이/],
  methods: ["q"], priority: 9, build: (name, m) => {
    const sim = /유사|합의/.test(name);
    return {
      ...base("q-distinguish", name || (sim ? "유형간 유사점 진술문표" : "유형간 차이 진술문표"), m),
      sections: [{ kind: "table", table: { columns: ["진술문", "1유형 Z", "2유형 Z", "3유형 Z", sim ? "|Δ|" : "구별대상"], rows: sim ? [
        ["학사 규정은 대면·비대면 모두 명확해야 한다.", 1.42, 1.55, 1.48, 0.13], ["과목 특성에 맞는 방식이 필요하다.", 1.10, 1.18, 1.24, 0.14],
      ] : [
        ["동료와의 유대감이 부족해 소속감이 떨어진다.", -1.82, 1.55, -0.42, "1↔2 유형"],
        ["나는 스스로 계획을 세워 학습할 수 있다.", 0.42, -0.55, 1.71, "3유형 구별"],
      ] } }],
    };
  },
});

// 23. 유형별 해석문(제N유형의 해석)
ARCHETYPES.push({
  id: "q-interp", keywords: [/유형별 해석문|유형의 해석|OO유형의 해석|유형 명명/],
  methods: ["q"], priority: 9, build: (name, m) => ({
    ...base("q-interp", name || "유형별 해석문", m, "서술 · 유형 해석·명명"),
    sections: [
      { kind: "para", title: "제1유형 · 효율 중시형", para: "이 유형은 이동시간 절약과 반복 시청을 강하게 지지한다. 실시간 상호작용이나 소속감보다 학습 효율을 우선한다. 통학 부담이 큰 학부생이 다수를 이룬다." },
      { kind: "para", title: "제2유형 · 상호작용 중시형", para: "이 유형은 실시간 토론·조모임·소속감을 중시한다. 대학원생·TA 경험자가 다수이며, 이동시간 절약보다 관계·참여의 질을 강조한다." },
      { kind: "para", title: "제3유형 · 자기주도 학습형", para: "이 유형은 스스로 계획·조절하는 학습을 강조한다. 시간 통제감을 가장 큰 장점으로 보며, 실시간 참여 강제에 부정적이다." },
    ],
  }),
});

// 24. 네 유형 표준점수 비교표
ARCHETYPES.push({
  id: "q-ztable", keywords: [/표준점수 비교|Z점수.*비교|표준점수 종합|네 유형 표준/],
  methods: ["q"], priority: 8, build: (name, m) => ({
    ...base("q-ztable", name || "네 유형 표준점수 비교표", m),
    sections: [{ kind: "table", table: { columns: ["진술 (요약)", "1유형 Z", "2유형 Z", "3유형 Z"], rows: [
      ["이동시간 절약", 1.92, -0.15, 1.05], ["반복 시청", 1.78, 0.31, 1.28], ["실시간 토론 활발", -0.62, 1.68, 0.12],
      ["유대감 부족", -1.82, 1.55, -0.42], ["자기 계획 학습", 0.42, -0.55, 1.71], ["기준 명확화", 1.42, 1.55, 1.48],
    ] } }],
  }),
});

// 25. 개념공간 도표(2x2 유형 매트릭스)
ARCHETYPES.push({
  id: "q-concept-space", keywords: [/개념공간 도표|유형 매트릭스도|매트릭스 설계도|가설적 정형화/],
  priority: 9, build: (name, m) => ({
    ...base("q-concept-space", name || "네 유형의 개념공간 도표", m),
    sections: [
      { kind: "figure", figure: { svg: matrix2x2SVG(["관계 지향·저효율", "관계 지향·고효율", "효율 지향·저관계", "효율 지향·고관계"], "효율 지향", "관계 지향"), caption: "그림. 개념공간 위 유형 배치(예시)" } },
    ],
  }),
});

// 26. 연구참여 동의서
ARCHETYPES.push({
  id: "consent", keywords: [/동의서|참여동의|IRB|연구윤리 준수 확인|참여동의 확인|참여동의서/],
  priority: 10, build: (name, m) => ({
    ...base("consent", name || "연구참여 동의서", m, "서식 · 자발적 서면동의"),
    sections: [
      { kind: "form", title: "1. 연구 개요", form: [
        { label: "연구명", value: DOM[m].title }, { label: "연구자", value: DOM[m].researcher },
        { label: "지도교수", value: DOM[m].advisor }, { label: "소속기관", value: DOM[m].inst },
        { label: "연구목적", value: `${DOM[m].subject}(를)을 규명하는 것.`, multiline: true },
        { label: "참여 절차", value: "1) 소개·설명 → 2) 서면동의 → 3) 인터뷰/설문 → 4) 후속 확인", multiline: true },
      ] },
      { kind: "list", title: "2. 참여자 권리", list: [
        "참여는 자발적이며 언제든지 이유 없이 중단·철회할 수 있다.",
        "이름 대신 P01 같은 가명을 사용하며 개인식별정보는 익명 처리한다.",
        "녹음·전사자료는 잠금 폴더에 보관하며 연구 종료 후 즉시 폐기한다.",
        "결과는 학술 목적으로만 사용된다.",
      ] },
      { kind: "sig" },
    ],
  }),
});

// 27. 반구조화 질문지 / 인터뷰 가이드
ARCHETYPES.push({
  id: "interview-guide", keywords: [/반구조화 질문지|인터뷰 진행 프로토콜|인터뷰 가이드|질문 영역 구조표|맞춤질문 목록|본인터뷰 질문지|예비조사 질문/],
  priority: 9, build: (name, m) => {
    const questions: Record<PerfMethod, string[]> = {
      q: ["도입 · 온라인 수업 수강 경험을 간단히 소개해 주시겠어요?", "만족했던 순간과 그 이유는 무엇인가요?", "가장 불만족스러웠던 순간과 그 이유는 무엇인가요?", "실시간 토론·조모임 경험은 어떠셨나요?", "혼자 학습할 때 도움이 되었던 방식은?"],
      gt: ["증상이 심해질 때 하루 일과를 어떻게 조정하시나요?", "복약이나 식단 관리는 어떻게 하고 계신가요?", "가족과 이야기하는 방식은 어떤가요?", "새로운 정보는 어디서 얻고 어떻게 판단하시나요?", "처음 진단 받았을 때와 지금은 무엇이 달라졌나요?"],
      ca: ["(코더 인터뷰) 판정이 어려운 사례가 있을 때 어떤 규칙으로 결정하시나요?"],
    };
    return {
      ...base("interview-guide", name || "반구조화 질문지", m, "인터뷰 가이드 · 개방형 질문"),
      sections: [
        { kind: "olist", title: "질문 영역", list: questions[m] },
        { kind: "note", note: "각 질문에는 답변에 따라 유연한 후속질문을 추가한다(반구조화 원칙)." },
      ],
    };
  },
});

// 28. 인터뷰 전사(Transcript)
ARCHETYPES.push({
  id: "transcript", keywords: [/전사자료|전사록|전사\(Transcript\)|녹취 전사|녹취록|보완된 최종 녹취록/],
  priority: 8, build: (name, m) => ({
    ...base("transcript", name || "인터뷰 녹취 전사자료", m, "익명화 전사 예시"),
    sections: [
      { kind: "form", title: "전사 헤더", form: [
        { label: "참여자 ID", value: "P03" }, { label: "면접일시", value: "2025-03-14 14:00" },
        { label: "장소", value: "온라인(Zoom)" }, { label: "면접자", value: DOM[m].researcher }, { label: "녹취시간", value: "62분" },
      ] },
      { kind: "para", title: "전사(발췌)", para: `면접자: 최근 온라인 수업에서 가장 인상 깊었던 경험은 무엇인가요?\nP03: 저는… 통학이 두 시간이라 확실히 시간을 아꼈어요. 그런데 조모임을 하려니 화면으로는 서로가 어색해서, 결국 카톡으로 다 해결하곤 했어요. 그게 좀 아쉽고…\n면접자: 어떤 부분이 아쉬웠나요?\nP03: 얼굴 보고 얘기하면 아이디어가 튀는데, 화면으로는 자꾸 조용해지더라고요.` },
      { kind: "note", note: "실명·기관명은 [익명]으로 자동 치환. 원본은 잠금 폴더 보관." },
    ],
  }),
});

// 29. 개념 목록 / 개방코딩 결과
ARCHETYPES.push({
  id: "gt-open-concepts", keywords: [/개념 목록|개념-인용문|개방코딩 결과|재조정된 개방코딩|인용구 식별|분절된 원자료|세그먼트 목록|개념→하위범주|하위범주→상위범주|최종 확정 개념/],
  methods: ["gt"], priority: 9, build: (name, m) => ({
    ...base("gt-open-concepts", name || "개방코딩 결과 · 개념-인용문 매핑표", m),
    sections: [
      { kind: "table", title: "표. 개념-인용문 매핑(발췌)", table: { columns: ["개념", "인용문(참여자)", "하위범주", "상위범주"], rows: [
        ["복약 알람 사용", "\"아침마다 알람을 맞춰 약을 챙긴다\"(P02)", "복약 관리", "일상 통제하기"],
        ["요일별 약통 나눔", "\"주말에 요일별로 약통을 다 나눠 놔요\"(P05)", "복약 관리", "일상 통제하기"],
        ["정보 커뮤니티 활용", "\"같은 병 카페에서 후기를 찾아 읽어요\"(P08)", "정보 탐색", "불확실성 견디기"],
        ["선택적 알림", "\"가족은 걱정할까 봐 심할 때만 말해요\"(P03)", "관계 조율", "관계 조율하기"],
      ] } },
    ],
  }),
});

// 30. 패러다임모형 도식
ARCHETYPES.push({
  id: "paradigm-model", keywords: [/패러다임모형|패러다임 모형|패러다임모형도|축코딩 패러다임|3단계 코딩절차 흐름도|패러다임요소별|패러다임 분석틀/],
  methods: ["gt"], priority: 10, build: (name, m) => ({
    ...base("paradigm-model", name || "축코딩 패러다임모형도", m),
    sections: [
      { kind: "figure", figure: { svg: paradigmSVG(), caption: "그림. 축코딩 패러다임모형(6요소 배치)" } },
      { kind: "table", title: "표. 6요소 배치 요약", table: { columns: ["요소", "범주"], rows: [
        ["인과적 조건", "증상 악화·진단 충격"], ["중심현상", "일상 무너짐과 되찾기 씨름"],
        ["맥락적 조건", "질병 정보 접근성·직장 환경"], ["중재적 조건", "가족 지지·의료진 신뢰"],
        ["작용/상호작용 전략", "복약 관리·정보 탐색·선택적 알리기"], ["결과", "통제감 회복 또는 관계 긴장"],
      ] } },
    ],
  }),
});

// 31. 축코딩 조건/현상/전략/결과 분석표
ARCHETYPES.push({
  id: "axial-table", keywords: [/인과적조건 분석표|맥락적조건 분석표|중재적조건 분석표|작용\/상호작용 분석표|결과 분석표|중심현상 분석표|후보범주 목록|하위범주 확정표|타당성 검증 체크리스트/],
  methods: ["gt"], priority: 9, build: (name, m) => {
    const which = /인과/.test(name) ? "인과적 조건" : /맥락/.test(name) ? "맥락적 조건" : /중재/.test(name) ? "중재적 조건" : /작용|상호작용|전략/.test(name) ? "작용/상호작용 전략" : /결과/.test(name) ? "결과" : /중심현상/.test(name) ? "중심현상" : "패러다임 요소";
    return {
      ...base("axial-table", name || `${which} 분석표`, m),
      sections: [
        { kind: "table", title: `표. ${which}의 하위범주·개념·속성`, table: { columns: ["하위범주", "포함 개념(발췌)", "속성", "차원"], rows: [
          [`${which} A`, "개념1·개념2·개념3", "강도", "약함↔강함"],
          [`${which} B`, "개념4·개념5", "지속성", "일시적↔지속적"],
          [`${which} C`, "개념6·개념7·개념8", "범위", "개인↔사회적"],
        ] } },
        { kind: "para", title: `${which} 해석 서술문`, para: `${which}은(는) 참여자의 자기관리 과정 전반에 걸쳐 조건적으로 작동하며, 특히 강도·지속성 차원에서 유의미한 개인차를 보인다.` },
      ],
    };
  },
});

// 32. 이야기윤곽 / 핵심범주
ARCHETYPES.push({
  id: "story-line", keywords: [/이야기윤곽|스토리라인|Story\s*Line|핵심범주 도출|핵심범주 명명|선택코딩.*통합|축코딩 결과 요약문|선택코딩 결과 통합/],
  methods: ["gt"], priority: 10, build: (name, m) => ({
    ...base("story-line", name || "완성된 이야기윤곽 서술문", m, "서술 · story line"),
    sections: [
      { kind: "para", title: "1. 핵심범주 도출", para: "6개 범주의 연결 밀도와 이론적 통합력을 기준으로 ‘일상을 되찾기 위한 협상(negotiating a livable life)’을 핵심범주로 채택한다." },
      { kind: "para", title: "2. 이야기윤곽(story line)", para: "진단 이후 만성질환자는 흔들린 일상 위에서 정보와 루틴을 통해 통제감을 되찾으려 씨름한다. 증상 악화·불확실성이라는 조건 아래, 참여자는 가족 지지와 의료진 신뢰라는 중재조건의 영향을 받으며 복약 관리·정보 탐색·선택적 알리기라는 전략을 전개한다. 그 결과 통제감 회복에 이르거나 관계 긴장을 겪게 되며, 이 과정은 일상 유지라는 단일 목적을 향한 협상으로 통합된다." },
    ],
  }),
});

// 33. 유형 매트릭스 / 유형 프로파일 / 유형별 서술문
ARCHETYPES.push({
  id: "gt-typology", keywords: [/유형 매트릭스|유형별 서술문|유형 매트릭스도|가설적 정형화|참여자별 속성수준|유형별 참여자 배치도|유형분석 교차표|유형전이/],
  methods: ["gt"], priority: 8, build: (name, m) => ({
    ...base("gt-typology", name || "유형 매트릭스 · 유형별 서술문", m),
    sections: [
      { kind: "figure", figure: { svg: matrix2x2SVG(["소극·의존형", "적극 관리형", "혼란·회피형", "수동 순응형"], "지지 자원", "대응 적극성"), caption: "그림. 유형 매트릭스(예시)" } },
      { kind: "table", title: "표. 유형별 인원 및 특징", table: { columns: ["유형", "인원", "특징"], rows: [
        ["적극 관리형", 9, "정보 탐색 활발·자기조절 강함"], ["수동 순응형", 6, "의료진 지시 의존"], ["소극·의존형", 2, "가족 주도적"], ["혼란·회피형", 1, "정보 회피"],
      ] } },
    ],
  }),
});

// 34. 과정모형도 / 상황모형도 / 시계열
ARCHETYPES.push({
  id: "gt-process-model", keywords: [/과정모형도|상황모형도|Conditional\/Situational|거시\/미시|상황경로|시간흐름 재배열|시계열 비교/],
  methods: ["gt"], priority: 8, build: (name, m) => ({
    ...base("gt-process-model", name || "과정모형도 · 상황모형도", m),
    sections: [
      { kind: "figure", figure: { svg: flowSVG(["혼란기", "적응 시도기", "안정화기", "재적응기"], true, 720, 120), caption: "그림. 시간 흐름에 따른 자기관리 과정모형" } },
      { kind: "table", title: "표. 상황모형(거시/미시 조건)", table: { columns: ["범위", "조건", "예시"], rows: [
        ["미시", "개인 신념·경험", "약 부작용 경험"], ["중간", "가족·직장", "가족의 지지 정도"], ["거시", "의료제도·문화", "의료비·의료접근성"],
      ] } },
    ],
  }),
});

// 35. 표집전략 / 포화 모니터링 / 이론적 표집
ARCHETYPES.push({
  id: "sampling-strategy", keywords: [/표집전략|이론적 포화|포화 판단|포화도 모니터링|개방적 표집|관계적·변이적|차별적 표집|표집 종료|표집종료 확정|최종 참여자 명단/],
  methods: ["gt"], priority: 8, build: (name, m) => ({
    ...base("sampling-strategy", name || "이론적 표집전략 · 포화 모니터링", m),
    sections: [
      { kind: "table", title: "표. 단계별 표집전략 적용", table: { columns: ["단계", "표집 유형", "표집 방향", "추가 인원"], rows: [
        ["개방코딩", "개방적 표집", "폭넓게", 8], ["축코딩", "관계적·변이적", "개념 간 관계 확장", 6], ["선택코딩", "차별적 표집", "부족한 속성 보완", 4], ["종료", "포화 확인", "새 개념 0회 반복", 0],
      ] } },
      { kind: "table", title: "표. 포화 모니터링(신규 개념 수)", table: { columns: ["배치", "인원", "신규 개념 수", "판정"], rows: [
        ["1~4차", 8, 42, "진행"], ["5차", 3, 8, "감소"], ["6차", 3, 2, "감소"], ["7차", 2, 0, "포화 근접"], ["8차", 2, 0, "포화 확정"],
      ] } },
    ],
  }),
});

// 36. 타당성·신뢰도(질적) — 검증 절차 서술문 / 삼각검증
ARCHETYPES.push({
  id: "trustworthiness", keywords: [/적용가능성|일관성|중립성|다자료원 삼각검증|삼각검증 결과표|멤버체크|전문가 검증|중립성 검증|일관성 검증|패턴 일관성|적용가능성 검증/],
  methods: ["gt"], priority: 8, build: (name, m) => ({
    ...base("trustworthiness", name || "질적 타당성·신뢰도 검증 결과", m),
    sections: [
      { kind: "table", title: "표. 5기준 검증 결과", table: { columns: ["기준", "방법", "결과"], rows: [
        ["적용가능성(Fit)", "멤버체크 2회", "참여자 4명 확인·수용"],
        ["일관성(Consistency)", "감사가능성(코딩 로그)", "의사결정 이력 확보"],
        ["중립성(Confirmability)", "성찰일지·동료 검토", "선입견 최소화 확인"],
        ["연구윤리", "IRB 승인·서면동의", "승인번호 예: ○○-2025-042"],
        ["삼각검증", "자료(면접+관찰+기록)", "3자료원 상호 확증"],
      ] } },
    ],
  }),
});

// 37. 결과 해석문 · 시사점 · 한계 · 후속연구
ARCHETYPES.push({
  id: "interp-implication", keywords: [/결과 해석문|비교해석문|시사점 서술|시사점|한계 서술문|한계 및 후속연구|후속연구 제언|이론적 함의|실무적|정책적 함의|후속연구 설계 제안서|측정변수 목록|종합요약 서술문/],
  priority: 8, build: (name, m) => ({
    ...base("interp-implication", name || "결과 해석·시사점·한계·후속연구", m),
    sections: [
      { kind: "para", title: "1. 연구결과 해석", para: `본 연구는 ${DOM[m].subject}(를)을 규명하였다. 통계 결과에 대한 해석은 연구자료의 맥락에 근거해 서술한다.` },
      { kind: "list", title: "2. 선행연구와의 비교", list: [
        "본 연구는 통합적 접근으로 선행연구의 부분성을 보완한다.",
        "결과의 방향성은 대체로 선행연구와 일치하되, 최근 시기에 새로운 패턴이 관찰된다.",
      ] },
      { kind: "list", title: "3. 이론적 함의", list: ["새로운 개념·유형을 학문 담론에 추가한다.", "기존 이론의 적용 범위를 확장한다."] },
      { kind: "list", title: "4. 실무적·정책적 시사점", list: ["현장 실무의 개선 방향을 제시한다.", "정책 제안 및 프로그램 설계의 근거를 제공한다."] },
      { kind: "list", title: "5. 연구의 한계", list: ["표본·매체 범위의 한계", "특정 시기의 특수성 반영", "질적 해석의 개인 편향 가능성"] },
      { kind: "list", title: "6. 후속연구 제언", list: ["연구 범위 확장(자료원·시기)", "종단적 추적조사", "혼합방법(양적+질적) 병행"] },
    ],
  }),
});

// 38. 학술지 목록표 / 논문 리스트
ARCHETYPES.push({
  id: "journal-list", keywords: [/학술지 목록|논문 리스트|검색 논문|전수조사.*리스트|학술대회논문 제외|최종 분석대상 논문|디자인분야 학술지/],
  methods: ["ca"], priority: 8, build: (name, m) => ({
    ...base("journal-list", name || "학술지·논문 목록표", m),
    sections: [{ kind: "table", table: { columns: ["매체명", "창간연도", "게재 편수", "표본 편수", "비고"], rows: [
      ["A일보", "1945", "-", 356, "종합일간지"], ["B일보", "1946", "-", 311, "종합일간지"], ["C일보", "1988", "-", 273, "종합일간지"], ["D일보", "1991", "-", 210, "종합일간지"], ["합계", "", "-", 1150, "10년치 전수조사"],
    ] } }],
  }),
});

// 39. 기준서/사유서/근거서 (모집단·표집·배제·판별 등)
ARCHETYPES.push({
  id: "criterion-doc", keywords: [/모집단 정의서|표집방법 채택 근거서|참여자 선정기준서|표집 다양성 확보 기준서|학위논문 배제기준|분석대상 분류기준|분석범위 판별기준|QL-008 방법론 선정 사유서|QL-008 채택 적합성|채택접근 명시|양적연구 방법의 한계 논증|매핑 규칙서/],
  priority: 8, build: (name, m) => ({
    ...base("criterion-doc", name || "기준서 · 사유서", m, "판단 기준과 근거"),
    sections: [
      { kind: "para", title: "1. 배경", para: `본 문서는 ${name || "해당 항목"}에 대한 판단 기준과 근거를 정리한 것으로, 이후 절차의 근거로 활용된다.` },
      { kind: "list", title: "2. 기준", list: [
        "포함 기준 1: (구체적 기준)", "포함 기준 2: (구체적 기준)", "제외 기준 1: (구체적 기준)", "제외 기준 2: (구체적 기준)",
      ] },
      { kind: "list", title: "3. 근거", list: [
        "선행연구 근거: ○○(연도) 등이 사용한 기준을 참조한다.",
        "방법론적 근거: 표본의 타당성·재현가능성 확보를 위해.",
        "실무적 근거: 데이터 접근성·분석 가능성을 고려한다.",
      ] },
      { kind: "note", note: "본 기준서는 연구 진행 중 발견에 따라 수정 가능하며, 수정 이력은 부록에 기록한다." },
    ],
  }),
});

// 40. 비교표 (질적/양적 · 계보 · QL-008 계보 · 방법론)
ARCHETYPES.push({
  id: "comparison-table", keywords: [/질적연구 방법론 비교표|QL-008 계보 비교|비교표|양적연구 대비/],
  priority: 8, build: (name, m) => ({
    ...base("comparison-table", name || "비교표", m),
    sections: [{ kind: "table", title: name || "방법론 비교", table: { columns: ["구분", "현상학", "QL-020", "QL-008", "본 연구 채택"], rows: [
      ["목적", "경험의 본질", "단일 사례 심층", "과정·이론 생성", "✓"],
      ["단위", "개인 경험", "사례", "사건·개념", "-"],
      ["분석", "본질 추출", "다중자료 분석", "지속적 비교·코딩", "-"],
      ["결과", "본질 기술", "사례 설명", "실체이론", "✓"],
    ] } }],
  }),
});

// 41. 흐름도 / 개념도 (일반)
ARCHETYPES.push({
  id: "flow-diagram", keywords: [/흐름도|개념도|3단계 코딩절차 흐름도|전체 연구절차 모형도|분석틀 템플릿|최종 요인모형도/],
  priority: 7, build: (name, m) => {
    const steps = /코딩절차|3단계 코딩/.test(name) ? ["개방코딩", "축코딩", "선택코딩"] :
      /연구절차 모형|전체 연구절차/.test(name) ? ["표집설계", "면접", "코딩", "이론화", "검증"] :
      /요인모형/.test(name) ? ["Q모집단", "Q표본", "Q소트", "요인분석", "유형해석"] :
      ["단계 1", "단계 2", "단계 3", "단계 4"];
    return {
      ...base("flow-diagram", name || "흐름도", m),
      sections: [
        { kind: "figure", figure: { svg: flowSVG(steps, true, 720, 130), caption: "그림. 절차 흐름도(예시)" } },
      ],
    };
  },
});

// 42. 성찰일지/메모/체크리스트
ARCHETYPES.push({
  id: "memo-checklist", keywords: [/성찰일지|자기점검 메모|이론적 민감성 향상 저널|메모|편향점검|점검 체크리스트|타당성 검증 체크리스트|정리 메모|기록/],
  priority: 6, build: (name, m) => {
    const isCheck = /체크리스트/.test(name);
    return {
      ...base("memo-checklist", name || "성찰 메모 · 체크리스트", m),
      sections: isCheck ? [
        { kind: "table", title: "표. 점검 체크리스트", table: { columns: ["번호", "점검 항목", "확인(✓)"], rows: [
          [1, "포함·제외 기준을 명확히 기술했는가?", "✓"], [2, "동일 판단 절차가 다른 코더에게도 재현되는가?", "✓"],
          [3, "근거가 원문에 명시되어 있는가?", "✓"], [4, "예외 사례를 문서화했는가?", "✓"], [5, "연구자의 선입견 영향을 성찰했는가?", "✓"],
        ] } },
      ] : [
        { kind: "form", title: "메모 헤더", form: [{ label: "작성자", value: DOM[m].researcher }, { label: "작성일", value: today() }, { label: "관련 절차", value: name }] },
        { kind: "para", title: "본문", para: `오늘 코딩 과정에서 ‘${DOM[m].subject}’와 관련해 새로 떠오른 통찰을 기록한다. 특히, 반복 등장하는 패턴과 예외 사례를 함께 남기고, 다음 코딩 시 반영할 규칙 후보를 제안한다.` },
        { kind: "note", note: "성찰일지는 감사가능성(audit trail) 확보를 위한 핵심 산출물이다." },
      ],
    };
  },
});

// 43. 일정표/장소 배정
ARCHETYPES.push({
  id: "schedule", keywords: [/면접 일정표|장소 배정표|일정표|일정 관리/],
  priority: 6, build: (name, m) => ({
    ...base("schedule", name || "면접 일정·장소 배정표", m),
    sections: [{ kind: "table", table: { columns: ["번호", "참여자", "일시", "장소", "방식"], rows: [
      [1, "P01", "2025-03-10 14:00", "○○대학교 상담실 A", "대면"], [2, "P02", "2025-03-10 16:00", "온라인(Zoom)", "화상"],
      [3, "P03", "2025-03-11 10:00", "온라인(Zoom)", "화상"], [4, "P04", "2025-03-11 15:00", "○○대학교 상담실 A", "대면"],
    ] } }],
  }),
});

// 44. 코딩단위 선정기준서
ARCHETYPES.push({
  id: "coding-unit", keywords: [/코딩단위 선정기준서|코딩 단위|분석 단위/],
  priority: 8, build: (name, m) => ({
    ...base("coding-unit", name || "코딩단위 선정기준서", m),
    sections: [
      { kind: "para", title: "1. 채택 단위", para: "본 연구는 정보량과 맥락 보존을 고려하여 ‘의미 있는 진술(구절·문장)’을 기본 분석단위로 채택한다." },
      { kind: "table", title: "표. 후보 단위 비교", table: { columns: ["단위", "장점", "단점", "채택"], rows: [
        ["단어", "정량화 쉬움", "맥락 상실", "✗"], ["문장", "단위 명확", "복문일 때 다중 의미", "△"],
        ["의미 진술(구절)", "맥락 보존·의미 명확", "판정 훈련 필요", "✓"], ["문단", "맥락 풍부", "다주제 혼합", "✗"],
      ] } },
    ],
  }),
});

// 45. Q카드 세트 (카드 목록)
ARCHETYPES.push({
  id: "q-cards", keywords: [/Q카드 세트|Q카드 목록|카드 세트/],
  methods: ["q"], priority: 9, build: (name, m) => ({
    ...base("q-cards", name || "Q카드 세트(30매)", m, "표 · 인쇄용 Q카드"),
    sections: [
      { kind: "table", table: { columns: ["카드 번호", "진술문(카드 앞면)"], rows: [
        ["Q01", "온라인 수업은 이동시간을 절약해 준다."], ["Q02", "나는 녹화 강의를 반복 시청할 수 있어 이해가 높다."],
        ["Q03", "채팅으로 질문하는 것이 더 편하다."], ["Q04", "실시간 온라인 토론이 대면보다 활발할 때가 있다."],
        ["Q05", "과목에 따라 온라인이 적절할 수도 있다."], ["Q07", "화면 앞에 오래 있으면 집중이 흐트러진다."],
        ["Q08", "동료와의 유대감이 부족해 소속감이 떨어진다."], ["Q10", "실습·현장 학습은 온라인으로 대체하기 어렵다."],
        ["…", "…(총 30장)"],
      ] } },
      { kind: "note", note: "인쇄용 규격: 가로 15cm × 세로 5cm · 뒷면에 카드번호만 표기." },
    ],
  }),
});

// 46. 분류절차 안내 스크립트
ARCHETYPES.push({
  id: "sort-script", keywords: [/분류절차 안내 스크립트|안내 스크립트|Q분류 안내/],
  methods: ["q"], priority: 8, build: (name, m) => ({
    ...base("sort-script", name || "Q분류 절차 안내 스크립트", m),
    sections: [
      { kind: "olist", title: "안내 순서", list: [
        "① (도입) “이제부터 30개의 진술문 카드를 받으실 겁니다. 온라인 수업에 대한 다양한 의견들입니다.”",
        "② (지시) “먼저 카드를 ‘동의’·‘중립’·‘비동의’ 세 더미로 나눠 주세요.”",
        "③ (분류판 안내) “가운데(0)를 기준으로 오른쪽은 동의, 왼쪽은 비동의입니다. 칸마다 놓을 카드 수가 정해져 있습니다.”",
        "④ (강제분포 배치) “가장 강하게 동의(+4)부터 순서대로 놓아 주세요. 필요하면 언제든 조정해도 됩니다.”",
        "⑤ (후속면담 예고) “배치가 끝나면 +4·−4 진술을 선택한 이유를 여쭙겠습니다.”",
      ] },
    ],
  }),
});

// 47. 후속면담 인용 기록
ARCHETYPES.push({
  id: "followup-quote", keywords: [/유형별 후속면담|후속면담 인용|대표참여자 후속면담|현장노트/],
  methods: ["q"], priority: 8, build: (name, m) => ({
    ...base("followup-quote", name || "유형별 후속면담 인용정리표", m),
    sections: [{ kind: "table", table: { columns: ["유형", "참여자", "선택 진술(위치)", "인용 이유"], rows: [
      ["1유형", "P01", "Q01 이동시간 절약(+4)", "왕복 3시간 통학, 그 시간을 과제로 쓴다."],
      ["1유형", "P05", "Q08 유대감 부족(−4)", "혼자여도 학습이 잘 되면 충분하다."],
      ["2유형", "P03", "Q04 실시간 토론 활발(+4)", "채팅 부담이 적어 오히려 더 참여한다."],
      ["3유형", "P08", "Q11 자기 계획 학습(+4)", "내 리듬대로 조절할 때 성과가 좋다."],
    ] } }],
  }),
});

// 48. 시기별 구분표
ARCHETYPES.push({
  id: "periodization", keywords: [/분석년도 시기별|시기별 구분표|시기 구분|periodization/],
  methods: ["ca"], priority: 8, build: (name, m) => ({
    ...base("periodization", name || "분석년도 시기별 구분표", m),
    sections: [{ kind: "table", table: { columns: ["시기", "연도", "구분 근거"], rows: [
      ["1기", "2015~2016", "제도 정비 이전"], ["2기", "2017~2019", "동물보호법 개정"], ["3기", "2020~2024", "팬데믹·양육 급증"],
    ] } }],
  }),
});

// 49. 신뢰도 검증 결과 서술문 / 윤리적 고려 서술문 / 종합요약 서술문 (일반 서술 fallback)
ARCHETYPES.push({
  id: "generic-narrative", keywords: [/신뢰도 검증 결과 서술문|윤리적 고려 서술문|연구결과 종합요약|연구결과 해석문|해석 서술문|이론적 함의 서술문|시사점 서술문|한계·후속연구|제언 서술문|소결 서술문|논증문|정리문|서술문$|기록$|메모$|정의 노트|후속연구 설계 제안서|후속 양적연구용 측정변수|측정변수 목록|후속연구용|이론적 배경 정리|가설적 관계진술문|서술|(서술).?문/],
  priority: 5, build: (name, m) => ({
    ...base("generic-narrative", name || "서술문", m, "서식 · 서술 본문"),
    sections: [
      { kind: "para", title: `${name || "서술문"} · 본문`, para: `본 서술문은 ${name || "해당 항목"}에 대한 요지와 근거를 구조적으로 정리한다. 첫째, 배경과 문제의식을 명확히 한다. 둘째, 자료와 결과를 근거로 논의를 전개한다. 셋째, 학문적·실무적 함의와 한계를 균형 있게 제시한다.` },
      { kind: "list", title: "본문 구성", list: ["도입: 배경·문제의식", "본론: 자료·결과·해석", "논의: 선행연구 비교·시사점", "결론: 한계·후속연구"] },
      { kind: "note", note: "본 서식은 초안이며, 연구자가 도메인에 맞게 다듬어 최종 확정한다." },
    ],
  }),
});

// 50. 목록·명단·이력 (fallback)
ARCHETYPES.push({
  id: "generic-list", keywords: [/목록|명단|리스트|이력|이력표|수정이력|기록표|매핑표|배정표|배치도|모니터링|저장매체|자료 목록|녹취자료|참고자료|보조 참고자료|관찰메모|녹취자료|녹취파일|필기노트|보조 참고자료|익명화된|원자료 데이터베이스|응답기록|자문의견서|검토의견서|판정표|세부요소표|명명 확정문서|1차 마킹본|모호 응답항목/],
  priority: 4, build: (name, m) => ({
    ...base("generic-list", name || "목록·명단·이력", m, "서식 · 항목 목록"),
    sections: [
      { kind: "table", table: { columns: ["번호", "항목", "일자", "담당", "비고"], rows: [
        [1, "항목 1(예시)", "2025-03-01", DOM[m].researcher, "확정"],
        [2, "항목 2(예시)", "2025-03-05", DOM[m].researcher, "검토중"],
        [3, "항목 3(예시)", "2025-03-08", DOM[m].researcher, "확정"],
        [4, "항목 4(예시)", "2025-03-12", DOM[m].researcher, "검토중"],
      ] } },
    ],
  }),
});

// ── 매칭 함수 ──
function score(name: string, kw: string | RegExp): number {
  const n = name.toLowerCase();
  if (kw instanceof RegExp) return kw.test(name) ? 10 : 0;
  const k = kw.toLowerCase();
  if (n === k) return 20;
  if (n.includes(k)) return 8;
  return 0;
}

export function findSample(name: string, method: PerfMethod): DeliverableSample {
  let best: { arc: Archetype; s: number } | null = null;
  for (const arc of ARCHETYPES) {
    if (arc.methods && !arc.methods.includes(method)) continue;
    let s = 0; for (const kw of arc.keywords) s = Math.max(s, score(name, kw));
    if (s > 0) s += (arc.priority || 5);
    if (s > 0 && (!best || s > best.s)) best = { arc, s };
  }
  if (best) return best.arc.build(name, method);
  // ★ 최종 폴백: 완전 미매칭 시 일반 서식
  return {
    ...base("generic", name || "산출물 서식", method, "서식 · 일반 골격"),
    sections: [
      { kind: "para", title: "본 산출물의 목적", para: `본 문서는 “${name || "산출물"}”의 실물 서식 골격이다. 도메인과 세부 절차에 맞게 항목별 내용을 작성한다.` },
      { kind: "list", title: "구성 요소", list: ["표제·메타(연구자·소속·일자)", "본문 서술 또는 표", "근거·출처", "확정 서명·검토란"] },
      { kind: "sig" },
    ],
  };
}

// 서식을 텍스트로 직렬화(내보내기용)
export function sampleToText(s: DeliverableSample): string {
  const lines: string[] = [];
  lines.push(`■ ${s.title}${s.subtitle ? ` · ${s.subtitle}` : ""}`);
  if (s.meta) { lines.push(""); s.meta.forEach((m) => lines.push(`${m.label}: ${m.value}`)); }
  for (const sec of s.sections) {
    lines.push(""); if (sec.title) lines.push(`[${sec.title}]`);
    if (sec.para) lines.push(sec.para);
    if (sec.list) sec.list.forEach((x) => lines.push(`• ${x}`));
    if (sec.kind === "olist" && sec.list) sec.list.forEach((x, i) => lines.push(`${i + 1}. ${x}`));
    if (sec.table) { lines.push(sec.table.columns.join("\t")); sec.table.rows.forEach((r) => lines.push(r.join("\t"))); }
    if (sec.form) sec.form.forEach((f) => lines.push(`${f.label}: ${f.value}`));
    if (sec.figure) lines.push("[그림] " + (sec.figure.caption || ""));
    if (sec.note) lines.push(`※ ${sec.note}`);
    if (sec.kind === "sig") lines.push("\n연구자 서명: __________________  일자: ______________");
  }
  return lines.join("\n");
}

// 서식을 HTML로 직렬화(DOCX/PDF 내보내기 및 화면 렌더링용)
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function sampleToHTML(s: DeliverableSample): string {
  const parts: string[] = [];
  parts.push(`<h1 style="font-family:sans-serif;color:#2b1a5f;border-bottom:2px solid #7c3aed;padding-bottom:6px">${esc(s.title)}</h1>`);
  if (s.subtitle) parts.push(`<div style="color:#555;font-size:13px;margin-bottom:8px">${esc(s.subtitle)}</div>`);
  if (s.meta) parts.push(`<table style="border-collapse:collapse;font-family:sans-serif;font-size:12px;margin-bottom:12px">${s.meta.map((m) => `<tr><td style="border:1px solid #ccc;padding:4px 8px;background:#f5f3ff"><b>${esc(m.label)}</b></td><td style="border:1px solid #ccc;padding:4px 8px">${esc(m.value)}</td></tr>`).join("")}</table>`);
  for (const sec of s.sections) {
    if (sec.title) parts.push(`<h3 style="font-family:sans-serif;color:#2b1a5f;margin-top:14px">${esc(sec.title)}</h3>`);
    if (sec.para) parts.push(`<p style="font-family:sans-serif;line-height:1.7;font-size:13.5px;white-space:pre-wrap">${esc(sec.para)}</p>`);
    if (sec.list && sec.kind !== "olist") parts.push(`<ul style="font-family:sans-serif;font-size:13px">${sec.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
    if (sec.kind === "olist" && sec.list) parts.push(`<ol style="font-family:sans-serif;font-size:13px">${sec.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`);
    if (sec.table) {
      const t = sec.table;
      parts.push(`<table style="border-collapse:collapse;font-family:sans-serif;font-size:12.5px;margin:8px 0"><thead><tr>${t.columns.map((c) => `<th style="border:1px solid #999;padding:5px 8px;background:#EDE7F6;color:#2b1a5f">${esc(String(c))}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #ccc;padding:5px 8px">${esc(String(c))}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      if (t.caption) parts.push(`<div style="font-size:11.5px;color:#555">${esc(t.caption)}</div>`);
    }
    if (sec.form) parts.push(`<table style="border-collapse:collapse;font-family:sans-serif;font-size:12.5px;margin:6px 0"><tbody>${sec.form.map((f) => `<tr><td style="border:1px solid #ccc;padding:5px 8px;background:#f5f3ff;min-width:100px"><b>${esc(f.label)}</b></td><td style="border:1px solid #ccc;padding:5px 8px">${esc(f.value)}</td></tr>`).join("")}</tbody></table>`);
    if (sec.figure) { parts.push(`<div style="margin:10px 0">${sec.figure.svg}</div>`); if (sec.figure.caption) parts.push(`<div style="font-size:11.5px;color:#555;text-align:center">${esc(sec.figure.caption)}</div>`); }
    if (sec.note) parts.push(`<div style="font-size:12px;color:#7c3aed;background:#F3EFFE;padding:6px 10px;border-left:3px solid #7c3aed;margin:6px 0">※ ${esc(sec.note)}</div>`);
    if (sec.kind === "sig") parts.push(`<div style="margin-top:20px;font-family:sans-serif;font-size:13px"><div style="display:inline-block;margin-right:30px">연구자 서명: <span style="display:inline-block;border-bottom:1px solid #333;width:180px">&nbsp;</span></div><div style="display:inline-block">일자: <span style="display:inline-block;border-bottom:1px solid #333;width:120px">&nbsp;</span></div></div>`);
  }
  return parts.join("\n");
}
