/**
 * 연구방법 가상학습 · 프로젝트 예비학습용
 * 표준 표본수 안내 + 100행 이상 연습/실전 형태 마이크로데이터 생성
 */
export type SampleTable = { columns: string[]; rows: (string | number)[][] };

export type SampleSizeGuide = {
  title: string;
  standardN: string;
  rationale: string;
  practiceNote: string;
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 방법 계열별 실전 표준 표본수 서술 */
export function sampleSizeGuideFor(methodIdOrLabel: string, familyHint?: string): SampleSizeGuide {
  const s = `${methodIdOrLabel} ${familyHint || ""}`.toLowerCase();
  const title = "자료수집 단계 · 표준 표본수(실전 기준)";

  if (/qual|질적|인터뷰|면담|근거이론|phenomen|현상|ethnograph|문화기술|gt-|ql-|narrative|내러티브|초점집단|focus.?group|델파이|delphi/.test(s)) {
    return {
      title,
      standardN: "심층면담 15–40명(이론적 포화 기준) · 초점집단 4–8회(회당 6–10명) · 델파이 패널 15–30명",
      rationale:
        "질적 연구는 ‘일반화 표본수’보다 포화·정보량이 기준입니다. 면담 15–25명에서 주제가 반복되면 포화를 검토하고, 다현장·다집단이면 40명까지 늘리기도 합니다.",
      practiceNote: "아래 표는 학습용 마이크로데이터(100행+)입니다. 실제 면담 전사·코딩은 소수 사례라도 깊이 있게 진행합니다.",
    };
  }
  if (/실험|experiment|rct|ab.?test|컨조인트|conjoint|eye.?track|생체|lab/.test(s)) {
    return {
      title,
      standardN: "집단당 30명 이상 · 전체 보통 80–200명(검정력·효과크기에 따라 조정)",
      rationale: "실험·A/B는 집단별 최소 표본과 검정력(power)이 핵심입니다. 중간 효과 가정 시 집단당 30–50명이 흔합니다.",
      practiceNote: "아래 100행+ 표는 실험 조건·점수 구조를 익히기 위한 가상 응답입니다.",
    };
  }
  if (/역사|사료|문헌|콘텐츠분석|content|문헌고찰|meta.?synth|scoping|계통|systematic/.test(s)) {
    return {
      title,
      standardN: "문헌·사료 단위 보통 30–200건(포함기준·포화) · 계량 내용분석은 기사/게시 200–1,000건+",
      rationale: "문서·게시물이 ‘표본’입니다. 포함·제외 기준과 검색식이 n을 결정합니다.",
      practiceNote: "아래 표는 문헌/콘텐츠 코딩 연습용 100건+ 가상 목록입니다.",
    };
  }
  if (/관찰|observation|현장|비디오|로그|디지털트레이스|web.?scrap/.test(s)) {
    return {
      title,
      standardN: "관찰 세션 20–60회 또는 로그 이벤트 1,000건+ · 이용자 단위면 100명+",
      rationale: "관찰·로그는 ‘사람 수’와 ‘사건 수’를 구분합니다. 이용자 비교면 100명+, 이벤트 분석이면 수천 건이 흔합니다.",
      practiceNote: "아래 100행+는 관찰/로그 행 단위 연습 자료입니다.",
    };
  }
  if (/혼합|mixed|mmr|수렴|설명적|탐색적 순차/.test(s)) {
    return {
      title,
      standardN: "양적 팔 200–400명 + 질적 팔 15–30명(설계에 따라)",
      rationale: "혼합연구는 각 팔의 표준을 각각 충족해야 합니다. 양적 일반화와 질적 포화를 동시에 적습니다.",
      practiceNote: "아래 표는 양적 팔 기준 100행+ 가상 응답입니다(질적 팔은 별도 전사 연습).",
    };
  }
  // 기본: 조사·설문·양적
  return {
    title,
    standardN: "기술통계·교차표 100–200명+ · 집단비교·상관 200–400명 · 회귀·세그먼트 400–1,000명+ · 전국 여론조사는 통상 1,000명 전후",
    rationale:
      "양적 설문은 오차·셀 빈도·검정력이 표본수를 정합니다. 유입경로·성·연령으로 나누어 볼수록 n이 커져야 합니다. 파일럿은 20–50명, 본조사는 목적에 맞는 표준 n을 따릅니다.",
    practiceNote: "이전 미니표(3–6행)는 서식 익힘용입니다. 아래 아코디언의 100행+ 표가 자료수집 단계 학습용 표준 규모입니다.",
  };
}

const POOLS: Record<string, string[]> = {
  집단: ["A", "B", "C", "대조", "실험"],
  성별: ["남", "여", "기타"],
  학년: ["1", "2", "3", "4"],
  유입경로: ["인스타그램", "지인추천", "네이버지도", "전단지", "유튜브", "검색광고", "재방문"],
  추천: ["예", "아니오"],
  추천의향: ["예", "아니오"],
  거주: ["서울", "경기", "부산", "대구", "광주", "대전"],
  직업: ["상용직", "자영업", "학생", "기타"],
  채널: ["온라인", "오프라인", "혼용"],
  코드: ["개방코딩", "축코딩", "선택코딩"],
  테마: ["신뢰", "편의", "가격", "품질", "관계"],
  문헌유형: ["논문", "보고서", "뉴스", "정책문서"],
};

function looksLikert(col: string) {
  return /만족|점수|의도|태도|likert|구매|신뢰|효능|스트레스|NPS|평가|동의/i.test(col);
}
function looksId(col: string) {
  return /^(id|응답자|respondent|사례|case|no\.?|번호)$/i.test(col.trim()) || /^id$/i.test(col);
}
function looksCat(col: string) {
  return /집단|성별|학년|유입|경로|추천|거주|직업|채널|코드|테마|문헌|유형|stratum|group/i.test(col);
}

function pickPool(col: string): string[] | null {
  for (const [k, v] of Object.entries(POOLS)) {
    if (col.includes(k) || new RegExp(k, "i").test(col)) return v;
  }
  if (/group/i.test(col)) return POOLS.집단;
  return null;
}

/** seed 표를 n행 이상으로 확장(방법 개념에 맞게 열 유형 유지) */
export function expandTableToN(
  table: SampleTable | undefined | null,
  n: number,
  seedKey: string,
): SampleTable | null {
  if (!table?.columns?.length) return null;
  const cols = table.columns.map(String);
  const seedRows = (table.rows || []).map((r) => r.map((c) => String(c)));
  const rnd = mulberry32(hashSeed(seedKey) || 1);
  const out: string[][] = [];

  for (let i = 0; i < n; i++) {
    if (i < seedRows.length) {
      // seed 행도 id만 정규화
      const row = [...seedRows[i]];
      while (row.length < cols.length) row.push("");
      cols.forEach((c, j) => {
        if (looksId(c)) row[j] = `R${String(i + 1).padStart(3, "0")}`;
      });
      out.push(row.slice(0, cols.length));
      continue;
    }
    const base = seedRows.length ? seedRows[Math.floor(rnd() * seedRows.length)] : cols.map(() => "");
    const row = cols.map((c, j) => {
      if (looksId(c)) return `R${String(i + 1).padStart(3, "0")}`;
      const pool = pickPool(c);
      if (pool) return pool[Math.floor(rnd() * pool.length)];
      if (looksLikert(c) || /NPS/i.test(c)) {
        if (/NPS|0.?10|추천.?가능/i.test(c)) return String(Math.min(10, Math.max(0, Math.round(rnd() * 10))));
        return String(1 + Math.floor(rnd() * 5));
      }
      if (/duration|소요|분/i.test(c)) return String(8 + Math.floor(rnd() * 12));
      if (/weight|가중/i.test(c)) return (0.85 + rnd() * 0.4).toFixed(2);
      if (/연령|age|D02/i.test(c)) return String(1 + Math.floor(rnd() * 5));
      if (looksCat(c)) return base[j] || `C${1 + Math.floor(rnd() * 4)}`;
      // 숫자 복사+잡음
      const raw = base[j] ?? "";
      const num = parseFloat(raw);
      if (Number.isFinite(num) && /^-?\d+(\.\d+)?$/.test(raw.trim())) {
        const v = Math.round(num + (rnd() - 0.5) * 2);
        return String(Math.max(0, v));
      }
      if (raw) return raw;
      return String(1 + Math.floor(rnd() * 5));
    });
    out.push(row);
  }
  return { columns: cols, rows: out };
}

/** 방법 기본 스키마(예시 표가 없을 때) */
export function defaultSchemaForMethod(methodId: string, label: string): SampleTable {
  const s = `${methodId} ${label}`.toLowerCase();
  if (/질적|인터뷰|gt-|ql-|phenomen|근거|내러티브/.test(s)) {
    return {
      columns: ["사례ID", "참여자", "면담회차", "핵심코드", "메모"],
      rows: [
        ["C01", "P01", "1", "신뢰", "첫 면담 요약"],
        ["C02", "P02", "1", "편의", "접근성 언급"],
      ],
    };
  }
  if (/문헌|사료|content|역사/.test(s)) {
    return {
      columns: ["문헌ID", "문헌유형", "연도", "테마", "채택"],
      rows: [
        ["D001", "논문", "2024", "품질", "채택"],
        ["D002", "보고서", "2023", "가격", "보류"],
      ],
    };
  }
  return {
    columns: ["id", "집단", "만족", "추천", "메모"],
    rows: [
      ["R001", "A", "4", "예", "긍정"],
      ["R002", "B", "3", "아니오", "보통"],
      ["R003", "A", "5", "예", "매우긍정"],
    ],
  };
}

export function buildMethodPracticeDataset(opts: {
  methodId: string;
  methodLabel: string;
  exampleLabel?: string;
  table?: SampleTable | null;
  n?: number;
}): { guide: SampleSizeGuide; table: SampleTable; n: number } {
  const n = Math.max(100, opts.n || 100);
  const seed =
    opts.table?.columns?.length
      ? opts.table
      : defaultSchemaForMethod(opts.methodId, opts.methodLabel);
  const table =
    expandTableToN(seed, n, `${opts.methodId}|${opts.exampleLabel || ""}|${opts.methodLabel}`) || seed;
  return {
    guide: sampleSizeGuideFor(opts.methodId, opts.methodLabel),
    table,
    n: table.rows.length,
  };
}

function parseMetricN(rows: string[][] | undefined, keys: RegExp[]): number | null {
  if (!rows) return null;
  for (const r of rows) {
    const k = String(r[0] || "");
    const v = String(r[1] || "").replace(/,/g, "");
    if (keys.some((re) => re.test(k))) {
      const m = v.match(/(\d{2,5})/);
      if (m) return parseInt(m[1], 10);
    }
  }
  return null;
}

/** 아키타입 주제·태스크에서 완료 n / 응답률 추출 후 마이크로데이터 생성 */
export function buildArchetypeMicrodata(opts: {
  methodName: string;
  family?: string;
  topicTitle: string;
  analysisKey?: string;
  mode?: string;
  procedureRows?: string[][];
  deliverableHeaders?: string[];
  deliverableRows?: string[][];
}): {
  guide: SampleSizeGuide;
  completedN: number;
  responseRate: string;
  previewN: number;
  table: SampleTable;
  metrics: { label: string; value: string }[];
} {
  const guide = sampleSizeGuideFor(opts.methodName, opts.family || opts.analysisKey);
  let completedN =
    parseMetricN(opts.procedureRows, [/완료\s*n/i, /^n$/i, /완료/]) ||
    parseMetricN(opts.procedureRows, [/목표\s*표본/, /예상\s*완료/, /표본수/]) ||
    120;
  completedN = Math.max(100, completedN);
  // UI·용량: 최대 120행 미리보기(완료 n은 지표로 표시)
  const previewN = Math.min(120, Math.max(100, completedN > 500 ? 120 : completedN));

  let responseRate = "—";
  for (const r of opts.procedureRows || []) {
    if (/응답률|RR/i.test(String(r[0] || ""))) {
      responseRate = String(r[1] || "—");
      break;
    }
  }
  if (responseRate === "—") responseRate = `${70 + (hashSeed(opts.topicTitle) % 20)}%`;

  // 열 구성: deliverable 예시 + 설문형 보강
  let columns = (opts.deliverableHeaders || []).map(String);
  if (columns.length < 2) {
    columns = ["id", "Q01", "Q02", "Q03", "D01", "D02", "weight", "stratum"];
  } else {
    // 값예시 표(변수/유형/값/라벨)면 변수명만 추출
    if (/변수|variable/i.test(columns[0]) && columns.length >= 3) {
      columns = (opts.deliverableRows || []).map((r) => String(r[0])).filter(Boolean);
      if (columns.length < 2) columns = ["id", "Q01", "D02", "weight"];
    }
  }
  if (!columns.some((c) => looksId(c))) columns = ["id", ...columns];

  const seedRows = (opts.deliverableRows || [])
    .filter((r) => r.length && !/변수|유형/i.test(String(r[0])))
    .slice(0, 8)
    .map((r) => {
      // variable catalog rows → fabricate values
      if (r.length >= 3 && /문자|숫자|연속|명목|Likert/i.test(String(r[1] || ""))) {
        return columns.map((c) => {
          if (looksId(c)) return "R0001";
          if (c === r[0]) return String(r[2] || "1");
          return "1";
        });
      }
      return columns.map((_, j) => String(r[j] ?? ""));
    });

  const seed: SampleTable = {
    columns,
    rows: seedRows.length
      ? seedRows
      : [
          columns.map((c, j) => (looksId(c) ? "R001" : j === 1 ? "4" : "1")),
          columns.map((c, j) => (looksId(c) ? "R002" : j === 1 ? "3" : "2")),
        ],
  };

  const table =
    expandTableToN(
      seed,
      previewN,
      `${opts.methodName}|${opts.topicTitle}|${opts.analysisKey || ""}|${completedN}`,
    ) || seed;

  const avgDur = (8 + (hashSeed(opts.topicTitle) % 9) + 0.4).toFixed(1);
  return {
    guide,
    completedN,
    responseRate,
    previewN: table.rows.length,
    table,
    metrics: [
      { label: "완료 n(본조사)", value: String(completedN) },
      { label: "응답률", value: responseRate },
      { label: "미리보기 행 수", value: `${table.rows.length}행(학습용 마이크로데이터)` },
      { label: "평균 소요(가상)", value: `${avgDur}분` },
      { label: "조사방식", value: opts.mode || "CAWI/혼합" },
    ],
  };
}

export function tableToCsv(table: SampleTable): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return [table.columns.join(","), ...table.rows.map((r) => r.map((c) => esc(String(c))).join(","))].join("\n");
}
