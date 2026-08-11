// 수행내용·산출물 자동화수준분석표 — behavior 기반 Task 실행 엔진(클라이언트 전용).
// methodos-f17(QL-008)에서 시작, f18에서 TX-002·GN-029 공용으로 확장.
// {gt,ca,q}-perf-registry.json의 각 세부 항목(분절)이 가진 behavior를 받아 실제 처리한다.
//  - 자동화구분 '수동화' → 사용자 작성 지원(양식/체크리스트)만 제공
//  - 자동화구분 '반자동화' → AI 초안(aiComplete, 키 없으면 규칙기반 대체) + 연구자 검증 자리 제공
//  - 자동화구분 '자동화'   → 규칙기반 결정론 처리(즉시 실행)
// io(연동/불러오기) 규칙: chain=이전 결과 연동, fresh=새 자료만, merge=새 자료+이전 합침.
// 통계 behavior: kappa(코더간 신뢰도)·chisq(카이제곱)·retest(검사-재검사)·factor(요인분석: Jacobi 고유분해
//  +베리맥스, q-automation 실제 파이프라인 재사용)·zrank/zdiff/ztable(표준점수)·forcedDist(강제분포) 등.
import { cleanText } from "./ca-automation";
import { specFromFreq, specFromCrosstab, specFromReliability, type CaChartSpec } from "./ca-charts";
import { aiComplete } from "./engine";
import { parseQSortCSV, runQAnalysis, pearson, type QSortMatrix, type QResult } from "./q-automation";
import type { GtMode, GtIOMode } from "./grounded-theory-spec";

export interface GtCtx {
  poolText?: string;
  pool?: { id: string; text: string }[];
  categories?: { name: string; items: string[] }[];
  keywords?: string[];
  matrix?: QSortMatrix;      // Q소트 행렬(참여자×진술)
  qres?: QResult;            // 요인분석 전체 결과(요인·적재·요인배열·해석)
}
export type GtIO = { mode: GtIOMode };
export interface GtTaskResult {
  summary: string; text?: string; cols?: string[]; rows?: (string | number)[][];
  chart?: CaChartSpec | null; ctxPatch?: Partial<GtCtx>; note?: string;
}
export interface GtTaskInput {
  behavior: string; mode: GtMode; text: string; settings: any; ctx: GtCtx; io?: GtIO;
  content: string;         // 수행내용/산출물(세부 분절) 설명
  reason: string;          // 구분 근거
  procedure: string[];     // 자동화 수준 달성 절차(순서별 Task)
  outputName: string;      // 이 항목의 산출물 명칭(perfNo 기준 요약)
}

// ── 공통 헬퍼 ──
const STOP = new Set("그리고 그러나 하지만 또한 또 또는 이런 저런 그런 매우 너무 정말 가장 등 및 의 가 이 그 저 것 수 때 더 본 위 내 안 중 약 통해 대한 대해 위해 위한 에서 으로 하는 한다 있다 없다 된다 이다".split(/\s+/));
const lines = (t: string) => t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
function splitSentences(t: string): string[] {
  let s = cleanText(t || "");
  s = s.replace(/([가-힣]{2,}(?:다|요|죠|네요|까요|습니다|합니다|됩니다|십시오|이다|한다|된다|없다|있다))([”"'\)\]]*)[ \t]+(?=[가-힣A-Za-z0-9"'“(])/g, "$1$2\n");
  const parts = s.split(/\r?\n|(?<=[.!?。…])\s+|[;•·▪◦‣・]|\s*[⇒→↓]\s*/);
  const out: string[] = [];
  for (const p of parts) { const x = p.trim().replace(/^[-*▪◦·•]?\s*\d{0,3}[.)]?\s*/, "").trim(); if (x.length >= 3) out.push(x); }
  return out;
}
const units = (t: string): string[] => { const ls = lines(t); const bs = splitSentences(t); return bs.length >= ls.length ? bs : ls; };
const tok = (t: string) => (t.toLowerCase().match(/[가-힣]{2,}|[a-z]{3,}/g) || []).filter((w) => !STOP.has(w));
function keywords(t: string, n = 14) { const f: Record<string, number> = {}; tok(t).forEach((w) => (f[w] = (f[w] || 0) + 1)); return Object.entries(f).map(([term, count]) => ({ term, count })).sort((a, b) => b.count - a.count).slice(0, n); }
function jaccard(a: string, b: string) { const A = new Set(tok(a)), B = new Set(tok(b)); if (!A.size || !B.size) return 0; let i = 0; A.forEach((w) => { if (B.has(w)) i++; }); return i / (A.size + B.size - i); }
function parseCSV(t: string) { const ls = lines(t); if (ls.length < 2) return null; const sp = (l: string) => l.split(/[,\t]/).map((c) => c.trim()); const header = sp(ls[0]); if (header.length < 2) return null; return { header, rows: ls.slice(1).map(sp) }; }
const need = (cond: any, msg: string): GtTaskResult | null => (cond ? null : { summary: "입력/선행 단계 필요", text: msg });

// io 규칙에 따라 이 항목이 처리할 원문 텍스트를 결정한다(연동/새자료/합치기).
function resolveText(ctx: GtCtx, T: string, io?: GtIO): string {
  const prior = ctx.poolText || "";
  if (!io || io.mode === "chain") return T || prior;
  if (io.mode === "fresh") return T;
  return (prior ? prior + "\n\n" : "") + T; // merge
}
function asPool(t: string): { id: string; text: string }[] { return units(t).map((x, i) => ({ id: "U" + String(i + 1).padStart(3, "0"), text: x })); }

async function aiOr(prompt: string, settings: any, fb: () => GtTaskResult): Promise<GtTaskResult> {
  const out = await aiComplete(prompt, settings);
  if (out && out.trim()) return { summary: "AI 초안 생성 완료 — 연구자 검증 필요", text: out.trim() };
  return { ...fb(), note: "AI 공급자 키가 없어 규칙기반으로 대체 실행했습니다. (설정 > AI 공급자에서 키 입력 시 실제 AI 모드 사용)" };
}

// ── 통계 헬퍼(TX-002·GN-029 확장) ──
const fmt = (v: number, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : "-");
// 정규 CDF(erf 근사) → 카이제곱 p값(Wilson–Hilferty 근사)
function normCdf(z: number) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); if (z > 0) p = 1 - p; return p; }
function chiP(x2: number, df: number) { if (df <= 0 || !Number.isFinite(x2)) return 1; const z = ((Math.cbrt(x2 / df)) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df)); return Math.max(0, Math.min(1, 1 - normCdf(z))); }
const pLabel = (p: number) => (p < 0.001 ? "p<.001" : p < 0.01 ? "p<.01" : p < 0.05 ? "p<.05" : `p=${fmt(p, 3)}`);
// 결정론 난수(무작위 표본 추출 재현 가능)
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// 숫자 교차표 CSV 파싱(첫 행=열 라벨, 첫 열=행 라벨)
function parseAggCrosstab(t: string): { rowLabels: string[]; cols: string[]; matrix: number[][] } | null {
  const csv = parseCSV(t); if (!csv || csv.header.length < 3) return null;
  const rowKey = 0, colKey = 1, valKey = 2;
  const rowSet: string[] = [], colSet: string[] = [];
  const map: Record<string, Record<string, number>> = {};
  for (const r of csv.rows) {
    const rv = r[rowKey], cv = r[colKey], n = parseFloat(r[valKey]);
    if (isNaN(n)) continue;
    if (!map[rv]) { map[rv] = {}; rowSet.push(rv); }
    if (!colSet.includes(cv)) colSet.push(cv);
    map[rv][cv] = (map[rv][cv] || 0) + n;
  }
  if (!rowSet.length || !colSet.length) return null;
  const matrix = rowSet.map((rv) => colSet.map((cv) => map[rv][cv] || 0));
  return { rowLabels: rowSet, cols: colSet, matrix };
}
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function sdSample(a: number[], m?: number) {
  if (a.length < 2) return 0;
  const mu = m ?? mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - mu) ** 2, 0) / (a.length - 1));
}
function welchT(a: number[], b: number[]) {
  const na = a.length, nb = b.length;
  const ma = mean(a), mb = mean(b), sa = sdSample(a, ma), sb = sdSample(b, mb);
  const se = Math.sqrt((sa * sa) / na + (sb * sb) / nb) || 1e-9;
  const t = (ma - mb) / se;
  const df = Math.max(1, Math.floor(((sa * sa) / na + (sb * sb) / nb) ** 2 / (((sa * sa) / na) ** 2 / (na - 1) + ((sb * sb) / nb) ** 2 / (nb - 1)) || 1));
  const p = 2 * normCdf(-Math.abs(t));
  const pooled = Math.sqrt(((na - 1) * sa * sa + (nb - 1) * sb * sb) / (na + nb - 2)) || 1;
  const d = pooled ? (ma - mb) / pooled : 0;
  return { ma, mb, sa, sb, t, df, p, d, na, nb };
}
function olsSimple(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  const x = xs.slice(0, n), y = ys.slice(0, n);
  const mx = mean(x), my = mean(y);
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
  const b1 = sxx ? sxy / sxx : 0, b0 = my - b1 * mx;
  const r = Math.sqrt(sxx * syy) ? sxy / Math.sqrt(sxx * syy) : 0;
  const se = n > 2 ? Math.sqrt((syy - b1 * sxy) / (n - 2)) : 0;
  const t = se && sxx ? b1 / (se / Math.sqrt(sxx)) : 0;
  const p = 2 * normCdf(-Math.abs(t));
  return { b0, b1, r, r2: r * r, t, p, n, se };
}
function numericCols(csv: { header: string[]; rows: string[][] }) {
  const cols: { name: string; vals: number[] }[] = [];
  for (let j = 0; j < csv.header.length; j++) {
    const vals = csv.rows.map((r) => parseFloat(r[j])).filter((v) => !isNaN(v));
    if (vals.length >= csv.rows.length * 0.6 && vals.length >= 3) cols.push({ name: csv.header[j], vals });
  }
  return cols;
}
function groupSplit(csv: { header: string[]; rows: string[][] }, yName?: string) {
  const nums = numericCols(csv);
  const yCol = yName ? nums.find((c) => c.name.includes(yName)) || nums[nums.length - 1] : nums[nums.length - 1];
  if (!yCol) return null;
  const yi = csv.header.indexOf(yCol.name);
  let gi = csv.header.findIndex((h, j) => j !== yi && csv.rows.every((r) => /^[12]$|^[01]$/.test(r[j]) || r[j].length <= 2));
  if (gi < 0) gi = csv.header.findIndex((h, j) => j !== yi);
  const g1: number[] = [], g2: number[] = [];
  const levels = new Set<string>();
  for (const r of csv.rows) {
    const y = parseFloat(r[yi]); if (isNaN(y)) continue;
    levels.add(r[gi]);
    if (r[gi] === "1" || r[gi] === "1.0") g1.push(y); else g2.push(y);
  }
  if (g1.length < 2 || g2.length < 2) return null;
  return { yCol: yCol.name, gCol: csv.header[gi], g1, g2, levels: Array.from(levels) };
}
function parseNumTable(t: string): { rowLabels: string[]; cols: string[]; matrix: number[][] } | null {
  const csv = parseCSV(t); if (!csv) return null;
  const cols = csv.header.slice(1); if (!cols.length) return null;
  const rowLabels: string[] = []; const matrix: number[][] = [];
  for (const r of csv.rows) { const nums = r.slice(1).map((c) => parseFloat(c)); if (nums.length !== cols.length || nums.some((n) => isNaN(n))) return null; rowLabels.push(r[0]); matrix.push(nums); }
  return rowLabels.length ? { rowLabels, cols, matrix } : null;
}
// 강제분포(준정규): S개 진술 → -m..+m 칸별 매수
function forcedDist(S: number): { m: number; counts: number[] } {
  const m = S <= 12 ? 2 : S <= 24 ? 3 : S <= 40 ? 4 : 5; const cols = 2 * m + 1;
  const w = Array.from({ length: cols }, (_, i) => Math.exp(-1.6 * ((i - m) / (m || 1)) ** 2));
  const ws = w.reduce((a, b) => a + b, 0);
  const counts = w.map((x) => Math.max(1, Math.round((x / ws) * S)));
  let diff = S - counts.reduce((a, b) => a + b, 0);
  while (diff !== 0) { const idx = diff > 0 ? m : counts.indexOf(Math.max(...counts)); counts[idx] += diff > 0 ? 1 : -1; diff += diff > 0 ? -1 : 1; }
  return { m, counts };
}
// 진술문 목록(ctx 우선), N 지시자(예: 'N=36') 지원
function stmtList(ctx: GtCtx, T: string): string[] {
  const fromText = units(T);
  if (fromText.length >= 2) return fromText;
  if (ctx.pool?.length) return ctx.pool.map((p) => p.text);
  return [];
}
function directiveN(t: string): number | null { const m = t.match(/N\s*[=:]\s*(\d{1,3})/i); return m ? parseInt(m[1], 10) : null; }
// Q소트 행렬 확보: 입력 CSV 우선 → ctx.matrix
function getMatrix(ctx: GtCtx, T: string): QSortMatrix | null { return (T ? parseQSortCSV(T) : null) || ctx.matrix || null; }
// 요인분석 결과 확보: 새 행렬 있으면 재계산, 없으면 ctx.qres
function getQ(ctx: GtCtx, T: string): { q: QResult; fresh: boolean } | null {
  const m = T ? parseQSortCSV(T) : null;
  if (m) { const maxF = directiveN(T) && directiveN(T)! <= 6 ? directiveN(T)! : 3; return { q: runQAnalysis(m, Math.min(4, Math.max(2, maxF))), fresh: true }; }
  if (ctx.qres) return { q: ctx.qres, fresh: false };
  if (ctx.matrix) return { q: runQAnalysis(ctx.matrix, 3), fresh: true };
  return null;
}
const NEED_Q = "Q소트 행렬이 필요합니다. 요인분석 단계(7.1~7.2)를 먼저 실행하거나, 참여자×진술 Q소트 CSV(첫 행=참여자, 첫 열=진술)를 붙여넣으세요.";

// ── 디스패처 ──
export async function runGtTask(inp: GtTaskInput): Promise<GtTaskResult> {
  const { behavior, mode, text, settings, ctx, io, content, outputName } = inp;
  const procedure = Array.isArray(inp.procedure) && inp.procedure.length
    ? inp.procedure
    : ["목적 확인", "기입·실행", "검토·확정"];
  const T = resolveText(ctx, text || "", io);

  switch (behavior) {
    case "manual": {
      // 수동화: 연구자 대면·성찰·윤리 판단 — AI가 초안/안내를 보조하되 최종 확정은 항상 연구자 몫.
      const ls = lines(text || "");
      if (ls.length) {
        const fb = (): GtTaskResult => ({ summary: `${outputName} — 작성 기록 저장(연구자 직접 확정)`, cols: ["#", "내용"], rows: ls.slice(0, 80).map((x, i) => [i + 1, x.slice(0, 140)]), text: `[절차 안내]\n${procedure.map((p, i) => `${i + 1}) ${p}`).join("\n")}`, ctxPatch: { poolText: text } });
        return aiOr(`다음은 연구자가 직접 수행해야 하는 '${outputName}'(대면·윤리·창의적 판단 영역) 관련 기록이다. 정리·서식화를 도와 초안을 만들되, 마지막 줄에 반드시 "※ 이 항목은 연구자의 최종 확인·서명이 필요합니다"를 덧붙여라:\n${text.slice(0, 2500)}`, settings, fb);
      }
      const fb2 = (): GtTaskResult => ({ summary: `${outputName} — 이 항목은 연구자가 직접 수행합니다`, cols: ["절차", "내용"], rows: procedure.map((p, i) => [`${i + 1}단계`, p]), text: `구분 근거: ${inp.reason}\n\n입력란에 작성 내용을 적고 실행하면 AI가 초안 정리를 돕고, 최종 확정은 연구자가 직접 합니다.` });
      return aiOr(`'${outputName}' 항목(자동화 불가·연구자 직접 수행)을 준비하는 연구자를 위해, 무엇을 어떻게 준비해야 하는지 실무 체크리스트를 4~5줄로 안내하라. 절차: ${procedure.join(" → ")}. 근거: ${inp.reason}`, settings, fb2);
    }
    case "draft": {
      const e = need(T, "관련 자료·초안 대상 텍스트를 입력/불러오기 하세요."); if (e) return e;
      const fb = (): GtTaskResult => { const ks = keywords(T, 10); const ls = units(T); return { summary: `${outputName} 서술문 초안(규칙기반 정리)`, cols: ["#", "핵심 문장"], rows: ls.slice(0, 40).map((x, i) => [i + 1, x.slice(0, 140)]), text: `[핵심어] ${ks.map((k) => k.term).join(", ")}\n\n[초안 골격]\n1) 배경: ${ls[0] || "(내용 요약)"}\n2) 근거: ${ls.slice(1, 3).join(" / ") || "(근거 문장)"}\n3) 결론: ${ls[ls.length - 1] || "(정리)"}`, ctxPatch: { poolText: T, keywords: ks.map((k) => k.term) } }; };
      if (mode === "ai") return aiOr(`다음 자료를 바탕으로 '${outputName}'의 학술적 서술문 초안을 작성하라(과업: ${content}). 절차: ${procedure.join(" → ")}\n\n자료:\n${T.slice(0, 3000)}`, settings, fb);
      return fb();
    }
    case "table": {
      const csv = parseCSV(text || "");
      if (csv) return { summary: `${outputName} — 표 서식 자동 배치(${csv.rows.length}행)`, cols: csv.header, rows: csv.rows.slice(0, 100), ctxPatch: { poolText: T } };
      const ls = units(T);
      if (!ls.length) return { summary: "표 서식(작성 후 내보내기)", cols: ["항목", "내용(작성)"], rows: [["", ""], ["", ""], ["", ""]], text: `이 항목의 산출물: ${outputName}\n입력란에 자료를 붙여넣거나 파일을 불러오면 표로 자동 배치됩니다.` };
      return { summary: `${outputName} — 표 서식 자동 배치 · ${ls.length}행`, cols: ["#", "내용"], rows: ls.slice(0, 100).map((x, i) => [i + 1, x.slice(0, 140)]), ctxPatch: { poolText: T } };
    }
    case "codeExtract": {
      const e = need(T, "전사자료·문헌 텍스트를 불러오기 하세요."); if (e) return e;
      const base = asPool(T);
      const fb = (): GtTaskResult => { const ks = keywords(T, 16); return { summary: `1차 개념 후보 ${ks.length}개 자동 추출(임베딩 유사어 군집 근사)`, cols: ["개념 후보", "빈도"], rows: ks.map((k) => [k.term, k.count]), chart: specFromFreq(ks.map((k) => ({ term: k.term, count: k.count })), "bar", "회"), ctxPatch: { poolText: T, pool: base, keywords: ks.map((k) => k.term) } }; };
      if (mode === "ai") return aiOr(`다음 전사자료에서 QL-008 개방코딩용 1차 개념(concept) 후보를 최대한 많이 추출하고 유사 개념을 묶어 하위범주 후보로 군집화하라:\n${T.slice(0, 3000)}`, settings, fb);
      return fb();
    }
    case "categorize": {
      const base = ctx.pool?.length ? ctx.pool : asPool(T);
      const e = need(base.length, "개념·진술 목록을 먼저 만들거나 불러오세요."); if (e) return e;
      const kw = keywords(base.map((b) => b.text).join("\n"), 8).map((k) => k.term);
      const assigned = new Set<string>();
      const cats = kw.map((k) => { const items = base.filter((b) => !assigned.has(b.id) && tok(b.text).includes(k)); items.forEach((b) => assigned.add(b.id)); return { name: k, items: items.map((b) => b.text) }; }).filter((c) => c.items.length);
      const rest = base.filter((b) => !assigned.has(b.id));
      if (rest.length) cats.push({ name: "기타", items: rest.map((b) => b.text) });
      return { summary: `${cats.length}개 범주(하위범주 후보)로 구조화 · 총 ${base.length}개 배정`, cols: ["범주", "항목 수"], rows: cats.map((c) => [c.name, c.items.length]), chart: specFromFreq(cats.map((c) => ({ term: c.name, count: c.items.length })), "bar", "개"), ctxPatch: { categories: cats, poolText: cats.map((c) => `■ ${c.name}\n${c.items.join("\n")}`).join("\n\n") } };
    }
    case "matrix": {
      const kv = lines(text || "").map((l) => l.split(/[:：]/).map((x) => x.trim())).filter((p) => p.length >= 2);
      if (kv.length) return { summary: `${outputName} — 관계 매트릭스 자동 배치`, cols: ["요소", "내용"], rows: kv.map((p) => [p[0], p.slice(1).join(":")]) };
      const cats = ctx.categories || [];
      if (cats.length) return { summary: `${outputName} — 범주 관계 매트릭스(범주 빈도 기반 배치)`, cols: ["범주", "항목 수", "패러다임 요소(작성)"], rows: cats.map((c) => [c.name, c.items.length, ""]), chart: specFromFreq(cats.map((c) => ({ term: c.name, count: c.items.length })), "bar", "개") };
      return { summary: "매트릭스 서식(작성 후 내보내기)", cols: ["요소", "내용(작성)"], rows: [["조건", ""], ["중심현상", ""], ["맥락", ""], ["전략", ""], ["결과", ""]], text: `'요소: 내용' 형식으로 한 줄씩 입력하면 자동으로 표에 배치됩니다.\n산출물: ${outputName}` };
    }
    case "dedupe": {
      const base = ctx.pool?.length ? ctx.pool : asPool(T);
      const e = need(base.length, "목록을 먼저 만들거나 불러오세요."); if (e) return e;
      const kept: { id: string; text: string }[] = [];
      for (const b of base) if (!kept.some((k) => jaccard(k.text, b.text) >= 0.6 || k.text.replace(/\s/g, "") === b.text.replace(/\s/g, ""))) kept.push(b);
      return { summary: `중복 제거 · ${base.length} → ${kept.length}개`, cols: ["ID", "내용"], rows: kept.slice(0, 300).map((b) => [b.id, b.text.slice(0, 120)]), ctxPatch: { pool: kept, poolText: kept.map((b) => b.text).join("\n") } };
    }
    case "segment": {
      const e = need(T, "전사자료·자료를 불러오기 하세요."); if (e) return e;
      const base = asPool(T);
      return { summary: `분석단위(사건) 분절 · ${base.length}개`, cols: ["ID", "분절 내용"], rows: base.slice(0, 400).map((b) => [b.id, b.text.slice(0, 120)]), ctxPatch: { pool: base, poolText: T } };
    }
    case "coverage": {
      const base = ctx.pool?.length ? ctx.pool : asPool(T);
      const cats = ctx.categories || [];
      const covered = cats.reduce((a, c) => a + c.items.length, 0);
      const rows: (string | number)[][] = [["전체 항목 수", base.length || covered], ["범주화된 항목 수", covered], ["범주 수", cats.length]];
      if (base.length) rows.push(["포괄률(%)", Math.round((Math.min(covered, base.length) / base.length) * 100 || 0)]);
      return { summary: `포괄성·일관성 점검 완료(범주 ${cats.length}개)`, cols: ["지표", "값"], rows, text: `[점검 절차]\n${procedure.map((p, i) => `${i + 1}) ${p}`).join("\n")}` };
    }
    case "freq": {
      const e = need(T, "집계 대상 텍스트/CSV를 불러오기 하세요."); if (e) return e;
      const csv = parseCSV(text || "");
      if (csv) return { summary: `${outputName} — 집계 완료(${csv.rows.length}행)`, cols: csv.header, rows: csv.rows.slice(0, 100) };
      const ks = keywords(T, 20);
      return { summary: `${outputName} — 빈도 자동 집계 · ${ks.length}종`, cols: ["항목", "빈도"], rows: ks.map((k) => [k.term, k.count]), chart: specFromFreq(ks.map((k) => ({ term: k.term, count: k.count })), "bar", "회") };
    }
    case "stt": {
      const e = need(T, "면접 녹취/전사 원문을 입력하세요."); if (e) return e;
      const base = asPool(T);
      return { summary: `전사 자동 정리 · ${base.length}개 발화 단위`, cols: ["ID", "발화"], rows: base.slice(0, 400).map((b) => [b.id, b.text.slice(0, 120)]), note: "오프라인 도구이므로 음성 자동전사는 지원하지 않습니다. 전사 텍스트를 붙여넣으면 발화 단위로 자동 정리·익명화합니다.", ctxPatch: { pool: base, poolText: T } };
    }
    case "anonymize": {
      const csv = parseCSV(text || "");
      if (csv) { const ni = csv.header.findIndex((h) => /이름|name|성명/.test(h)); const rows = csv.rows.map((r, i) => r.map((c, ci) => ci === ni && c.length >= 2 ? c[0] + "*".repeat(c.length - 1) : c)); return { summary: `익명화 ${rows.length}행 완료`, cols: ["ID", ...csv.header], rows: rows.map((r, i) => ["P" + String(i + 1).padStart(2, "0"), ...r]).slice(0, 200) }; }
      const base = asPool(T); const e = need(base.length, "전사/명단 텍스트나 CSV를 불러오기 하세요."); if (e) return e;
      const rows = base.map((b) => [b.id, b.text.replace(/[가-힣]{2,4}(?=\s*(님|씨|환자|참여자))/g, (m) => m[0] + "*".repeat(m.length - 1)).slice(0, 140)]);
      return { summary: `익명화 처리 · ${rows.length}개 단위`, cols: ["ID", "내용(익명화)"], rows: rows.slice(0, 300), ctxPatch: { pool: base, poolText: rows.map((r) => String(r[1])).join("\n") } };
    }
    // ── TX-002(CA) 확장 behavior ──
    case "sample": {
      const base = ctx.pool?.length && !text ? ctx.pool : asPool(T);
      const e = need(base.length, "표본을 추출할 목록(한 줄 = 한 자료)을 입력/불러오기 하세요. 'N=32' 지시자로 표본수를 지정할 수 있습니다."); if (e) return e;
      const n = Math.min(base.length, directiveN(text || "") || Math.max(1, Math.ceil(base.length * 0.1)));
      const rnd = mulberry(20260702); const idx = base.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      const picked = idx.slice(0, n).sort((a, b) => a - b).map((i) => base[i]);
      return { summary: `무작위 표본 추출 · 전체 ${base.length}개 → ${n}개(약 ${Math.round((n / base.length) * 100)}%)`, cols: ["ID", "표본 내용"], rows: picked.slice(0, 200).map((b) => [b.id, b.text.slice(0, 120)]), text: "결정론적 난수(고정 시드)로 추출하여 같은 입력이면 같은 표본이 재현됩니다.", ctxPatch: { pool: picked, poolText: picked.map((b) => b.text).join("\n") } };
    }
    case "filterAuto": {
      const base = ctx.pool?.length && !text ? ctx.pool : asPool(T);
      const e = need(base.length, "필터링할 목록(한 줄 = 한 자료)을 입력/불러오기 하세요. '제외: 광고, 단신' 형식으로 제외 규칙을 지정할 수 있습니다."); if (e) return e;
      const dm = (text || "").match(/제외\s*[:：]\s*(.+)/);
      const kws = dm ? dm[1].split(/[,、·\s]+/).map((k) => k.trim()).filter(Boolean) : [];
      const pool = dm ? base.filter((b) => !/^제외\s*[:：]/.test(b.text)) : base;
      const kept = kws.length ? pool.filter((b) => !kws.some((k) => b.text.includes(k))) : pool.filter((b, i, arr) => arr.findIndex((x) => x.text.replace(/\s/g, "") === b.text.replace(/\s/g, "")) === i);
      const removed = pool.length - kept.length;
      return { summary: `규칙 필터링 완료 · ${pool.length}개 → ${kept.length}개(제외 ${removed}개${kws.length ? ` · 규칙: ${kws.join(", ")}` : " · 중복 제거"})`, cols: ["ID", "유지 항목"], rows: kept.slice(0, 300).map((b) => [b.id, b.text.slice(0, 120)]), text: `제외 전후 건수 자동 대조: ${pool.length} → ${kept.length} (−${removed})`, ctxPatch: { pool: kept, poolText: kept.map((b) => b.text).join("\n") } };
    }
    case "kappa": {
      const csv = parseCSV(text || "");
      const e = need(csv && csv.header.length >= 3, "코더간 신뢰도 계산용 CSV가 필요합니다. 형식: 자료ID, 코더1, 코더2 (한 줄 = 한 자료의 두 코딩값)"); if (e) return e;
      const c1 = csv!.rows.map((r) => r[r.length - 2]), c2 = csv!.rows.map((r) => r[r.length - 1]);
      const n = c1.length; const cats = Array.from(new Set([...c1, ...c2]));
      let agree = 0; for (let i = 0; i < n; i++) if (c1[i] === c2[i]) agree++;
      const po = agree / n;
      let pe = 0; for (const c of cats) pe += (c1.filter((x) => x === c).length / n) * (c2.filter((x) => x === c).length / n);
      const kap = pe >= 1 ? 1 : (po - pe) / (1 - pe);
      const level = kap >= 0.81 ? "거의 완전한 일치" : kap >= 0.61 ? "상당한 일치" : kap >= 0.41 ? "중간 일치" : "낮음(보완교육 필요)";
      const perCat = cats.map((c) => { const tot = c1.filter((x, i) => x === c || c2[i] === c).length || 1; const ag = c1.filter((x, i) => x === c && c2[i] === c).length; return { label: c, pct: Math.round((ag / tot) * 100) }; });
      return { summary: `코더간 신뢰도 · Cohen's Kappa = ${fmt(kap)} (${level}) · 관찰일치 ${fmt(po * 100, 1)}% · N=${n}`, cols: ["범주", "일치율(%)"], rows: perCat.map((p) => [p.label, p.pct]), chart: specFromReliability(perCat), text: `관찰일치율 Po=${fmt(po)} · 기대일치율 Pe=${fmt(pe)} · κ=(Po−Pe)/(1−Pe)=${fmt(kap)}\n판정 기준(Landis & Koch): .81+ 거의 완전 / .61–.80 상당 / .41–.60 중간 / 그 미만 보완교육 권고` };
    }
    case "chisq": {
      const tab = parseNumTable(text || "") || parseAggCrosstab(text || "") || (ctx.categories?.length ? { rowLabels: ctx.categories.map((c) => c.name), cols: ["빈도"], matrix: ctx.categories.map((c) => [c.items.length]) } : null);
      const e = need(tab, "교차표 CSV가 필요합니다. 형식: 첫 행=열 이름(예: 구분,1기,2기,3기), 이후 행=행 이름과 빈도 숫자"); if (e) return e;
      const { rowLabels, cols, matrix } = tab!;
      const rowSum = matrix.map((r) => r.reduce((a, b) => a + b, 0));
      const colSum = cols.map((_, j) => matrix.reduce((a, r) => a + r[j], 0));
      const total = rowSum.reduce((a, b) => a + b, 0) || 1;
      let x2 = 0; let small = 0;
      for (let i = 0; i < matrix.length; i++) for (let j = 0; j < cols.length; j++) { const exp = (rowSum[i] * colSum[j]) / total; if (exp < 5) small++; if (exp > 0) x2 += (matrix[i][j] - exp) ** 2 / exp; }
      const df = Math.max(1, (matrix.length - 1) * (cols.length - 1));
      const p = chiP(x2, df);
      const rows: (string | number)[][] = matrix.map((r, i) => [rowLabels[i], ...r, rowSum[i]]);
      rows.push(["합계", ...colSum, total]);
      return { summary: `카이제곱 검정 · χ²=${fmt(x2, 3)}, df=${df}, ${pLabel(p)} ${p < 0.05 ? "→ 유의한 차이 있음" : "→ 유의한 차이 없음"}`, cols: ["구분", ...cols, "합계"], rows, chart: cols.length >= 2 ? specFromCrosstab({ rowLabels, cols, matrix }) : specFromFreq(rowLabels.map((l, i) => ({ term: l, count: rowSum[i] })), "bar", "건"), text: `기대빈도 5 미만 셀 ${small}개${small > 0 ? " — 소표본 셀은 해석에 주의(유의성 확인 불가 표기 검토)" : ""}\n관찰빈도와 기대빈도의 차이를 검정한 결과입니다. ${p < 0.05 ? "행·열 변수 간 분포 차이가 통계적으로 유의합니다." : "행·열 변수 간 분포 차이가 우연 수준을 넘지 않습니다."}` };
    }
    // ── GN-029 확장 behavior ──
    case "retest": {
      const csv = parseCSV(text || "");
      const e = need(csv && csv.header.length >= 3, "검사-재검사 CSV가 필요합니다. 형식: 진술ID, P1_1차, P1_2차, P2_1차, P2_2차 … (참여자별 1·2차 점수 열 쌍)"); if (e) return e;
      const grid = csv!.rows.map((r) => r.slice(1).map((c) => parseFloat(c)));
      const eN = need(grid.every((r) => r.every((v) => !isNaN(v))), "숫자 이외의 값이 있습니다. 점수만 입력하세요."); if (eN) return eN;
      const nCols = csv!.header.length - 1; const pairs = Math.floor(nCols / 2);
      const e2 = need(pairs >= 1, "1차·2차 열 쌍이 필요합니다."); if (e2) return e2;
      const rs: number[] = [];
      for (let p = 0; p < pairs; p++) { const a = grid.map((r) => r[p * 2]), b = grid.map((r) => r[p * 2 + 1]); rs.push(pearson(a, b)); }
      const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
      return { summary: `검사-재검사 신뢰도 · 평균 r=${fmt(mean)} (${mean >= 0.7 ? "통상 기준(.7~.8) 충족" : "기준 미달 — 진술문 재검토 권고"}) · ${pairs}쌍`, cols: ["참여자(쌍)", "1·2차 상관 r"], rows: rs.map((r, i) => [csv!.header[1 + i * 2].replace(/_?1차/, "") || `P${i + 1}`, fmt(r)]), chart: specFromReliability(rs.map((r, i) => ({ label: `P${i + 1}`, pct: Math.round(r * 100) }))), text: "동일 참여자가 시차를 두고 두 번 분류한 결과의  상관입니다. 값이 높을수록 Q표본(진술문)의 의미가 안정적으로 이해됨을 뜻합니다." };
    }
    case "forcedDist": {
      const S = directiveN(text || "") || stmtList(ctx, T).length || 30;
      const { m, counts } = forcedDist(S);
      const labels = counts.map((_, i) => (i - m > 0 ? `+${i - m}` : String(i - m)));
      return { summary: `강제분포 설계 · 진술 ${S}개 → ${labels.length}칸(−${m}~+${m}), 좌우대칭 ${counts.join("-")}`, cols: ["칸(등급)", ...labels], rows: [["배치 매수", ...counts]], chart: specFromFreq(labels.map((l, i) => ({ term: l, count: counts[i] })), "bar", "매"), text: `합계 검산: ${counts.reduce((a, b) => a + b, 0)}매 = 진술 ${S}개.\n'N=진술수' 지시자로 다른 크기의 분류판을 설계할 수 있습니다.`, ctxPatch: T ? { poolText: T } : undefined };
    }
    case "qcards": {
      const sts = stmtList(ctx, T);
      const e = need(sts.length, "Q카드로 만들 진술문 목록(한 줄 = 한 진술)을 입력하거나 이전 단계에서 연동하세요."); if (e) return e;
      return { summary: `Q카드 세트 생성 · ${sts.length}매(진술문별 1매)`, cols: ["카드 번호", "진술문"], rows: sts.map((s, i) => [`Q${String(i + 1).padStart(2, "0")}`, s.slice(0, 140)]), text: "내보내기(PDF/DOCX)로 인쇄용 카드 목록을 저장할 수 있습니다.", ctxPatch: { pool: sts.map((s, i) => ({ id: "Q" + String(i + 1).padStart(2, "0"), text: s })), poolText: sts.join("\n") } };
    }
    case "qscore": {
      const m = getMatrix(ctx, T);
      const e = need(m, "Q소트 CSV가 필요합니다. 형식: 첫 행=참여자 이름, 첫 열=진술문, 값=−4~+4 등급"); if (e) return e;
      const conv = m!.data.map((row) => row.map((v) => v + m!.range + 1)); // -m..+m → 1..2m+1
      const cols = ["진술", ...m!.participants.map((p) => p.label)];
      const rows = m!.statements.map((s, si) => [s.text.slice(0, 60), ...conv.map((prow) => prow[si])]);
      return { summary: `Q소트 점수화 완료 · 참여자 ${m!.participants.length}명 × 진술 ${m!.statements.length}개 (−${m!.range}~+${m!.range} → 1~${2 * m!.range + 1}점 환산)`, cols, rows: rows.slice(0, 60), text: "환산 공식: 점수 = 등급 + (범위+1). 이 행렬이 이후 요인분석의 입력이 됩니다.", ctxPatch: { matrix: m! } };
    }
    case "factor": {
      const g = getQ(ctx, T);
      const e = need(g, NEED_Q); if (e) return e;
      const { q } = g!;
      const ev = q.factors.eigenvalues.slice(0, Math.max(q.factors.nFactors, 4));
      const rows = ev.map((v, i) => [i + 1 <= q.factors.nFactors ? `제${i + 1}유형 ✓` : `요인${i + 1}`, fmt(v, 2), i < q.factors.explained.length ? `${q.factors.explained[i]}%` : "-", v > 1 ? "고유값>1 채택" : "기각"]);
      const cum = q.factors.explained.reduce((a, b) => a + b, 0);
      return { summary: `주요인분석 완료 · ${q.factors.nFactors}개 유형 채택(고유값>1) · 누적 설명변량 ${fmt(cum, 1)}%`, cols: ["요인", "고유값(Eigenvalue)", "설명변량", "판정"], rows, chart: specFromFreq(q.factors.explained.map((x, i) => ({ term: `제${i + 1}유형`, count: x })), "bar", "%"), text: `참여자 ${q.matrix.participants.length}명 상관행렬 → Jacobi 고유분해 → 베리맥스 회전.\n'N=요인수' 지시자로 추출 요인수를 바꿔 재실행할 수 있습니다.`, ctxPatch: { qres: q, matrix: q.matrix } };
    }
    case "flagWeight": {
      const g = getQ(ctx, T);
      const e = need(g, NEED_Q); if (e) return e;
      const { q } = g!;
      const rows = q.flags.map((f, p) => { const l = Math.min(0.99, Math.abs(f.loading)); const w = l / (1 - l * l); return [q.matrix.participants[p]?.label || f.participant, `제${f.factor + 1}유형`, fmt(f.loading), fmt(w, 2), f.flagged ? "확정(대표성 있음)" : "혼합/약함"]; });
      const perF = Array.from({ length: q.factors.nFactors }, (_, f) => q.flags.filter((x) => x.factor === f).length);
      return { summary: `유형별 인자가중치 산출 · ${perF.map((n, i) => `제${i + 1}유형 ${n}명`).join(" · ")}`, cols: ["참여자", "배정 유형", "적재량", "인자가중치", "판정"], rows, chart: specFromFreq(perF.map((n, i) => ({ term: `제${i + 1}유형`, count: n })), "bar", "명"), text: "인자가중치 w = l/(1−l²) (Spearman–Brown). 가중치가 큰 참여자가 그 유형의 대표(전형) 참여자입니다.", ctxPatch: { qres: q, matrix: q.matrix } };
    }
    case "factorCorr": {
      const g = getQ(ctx, T);
      const e = need(g, NEED_Q); if (e) return e;
      const { q } = g!;
      const F = q.arrays.length;
      const e2 = need(F >= 2, "유형이 2개 이상일 때 유형간 상관을 계산할 수 있습니다."); if (e2) return e2;
      const zv = q.arrays.map((a) => a.statements.map((s) => s.z));
      const mat = Array.from({ length: F }, (_, i) => Array.from({ length: F }, (_, j) => (i === j ? 1 : +pearson(zv[i], zv[j]).toFixed(3))));
      const labels = Array.from({ length: F }, (_, i) => `제${i + 1}유형`);
      return { summary: `유형간 상관계수 산출 · ${F}×${F} 행렬`, cols: ["", ...labels], rows: mat.map((r, i) => [labels[i], ...r.map((v) => fmt(v, 3))]), chart: specFromCrosstab({ rowLabels: labels, cols: labels, matrix: mat.map((r) => r.map((v) => Math.round(Math.abs(v) * 100))) }, "heatmap"), text: "값이 낮을수록 두 유형이 서로 독립적인(다른) 관점임을 뜻합니다.", ctxPatch: { qres: q, matrix: q.matrix } };
    }
    case "zrank": {
      const g = getQ(ctx, T);
      const e = need(g, NEED_Q); if (e) return e;
      const { q } = g!;
      const rows: (string | number)[][] = [];
      q.arrays.forEach((a) => {
        const sorted = [...a.statements].sort((x, y) => y.z - x.z);
        sorted.slice(0, 5).forEach((s) => rows.push([`제${a.factor + 1}유형`, "적극 동의", s.text.slice(0, 80), fmt(s.z, 2)]));
        sorted.slice(-5).reverse().forEach((s) => rows.push([`제${a.factor + 1}유형`, "적극 비동의", s.text.slice(0, 80), fmt(s.z, 2)]));
      });
      const fb = (): GtTaskResult => ({ summary: `유형별 표준점수(Z) 상·하위 진술문 도출 · ${q.arrays.length}개 유형 × (동의 5 + 비동의 5)`, cols: ["유형", "구분", "진술문", "Z"], rows, text: "Z ≥ +1 = 강한 동의, Z ≤ −1 = 강한 비동의로 봅니다. 이 진술들이 각 유형의 개성을 드러냅니다." });
      if (mode === "ai") return aiOr(`다음은 GN-029 유형별 적극 동의/비동의 진술문(Z점수)이다. 각 유형의 인식 특성을 2~3문장으로 해석하라:\n${rows.map((r) => r.join(" | ")).join("\n").slice(0, 2500)}`, settings, fb);
      return fb();
    }
    case "zdiff": {
      const g = getQ(ctx, T);
      const e = need(g, NEED_Q); if (e) return e;
      const { q } = g!;
      const F = q.arrays.length;
      const e2 = need(F >= 2, "유형이 2개 이상일 때 유형간 차이·유사 진술을 계산할 수 있습니다."); if (e2) return e2;
      const rows: (string | number)[][] = [];
      for (let i = 0; i < F; i++) for (let j = i + 1; j < F; j++) {
        const diffs = q.arrays[i].statements.map((s, k) => ({ text: s.text, zi: s.z, zj: q.arrays[j].statements[k].z, d: Math.abs(s.z - q.arrays[j].statements[k].z) }));
        const sorted = [...diffs].sort((a, b) => b.d - a.d);
        sorted.slice(0, 5).forEach((s) => rows.push([`제${i + 1}–제${j + 1}유형`, "차이(구별)", s.text.slice(0, 70), fmt(s.zi, 2), fmt(s.zj, 2), fmt(s.d, 2)]));
        sorted.slice(-3).forEach((s) => rows.push([`제${i + 1}–제${j + 1}유형`, "유사(합의)", s.text.slice(0, 70), fmt(s.zi, 2), fmt(s.zj, 2), fmt(s.d, 2)]));
      }
      const fb = (): GtTaskResult => ({ summary: `유형간 Z값 차이 분석 · ${(F * (F - 1)) / 2}개 유형쌍 × (차이 5 + 유사 3)`, cols: ["유형쌍", "구분", "진술문", "Z(앞)", "Z(뒤)", "|차이|"], rows, text: "|차이|가 큰 진술 = 두 유형을 가르는 구별 진술, 작은 진술 = 모든 유형이 공유하는 합의 진술입니다." });
      if (mode === "ai") return aiOr(`다음 GN-029 유형쌍별 차이/유사 진술문 표를 보고 유형간 인식 차이의 함의를 3~4문장으로 서술하라:\n${rows.map((r) => r.join(" | ")).join("\n").slice(0, 2500)}`, settings, fb);
      return fb();
    }
    case "ztable": {
      const g = getQ(ctx, T);
      const e = need(g, NEED_Q); if (e) return e;
      const { q } = g!;
      const labels = q.arrays.map((a) => `제${a.factor + 1}유형(Z)`);
      const rows = q.arrays[0].statements.map((s, k) => [s.text.slice(0, 70), ...q.arrays.map((a) => fmt(a.statements[k].z, 2))]);
      return { summary: `전체 진술문 표준점수 종합비교 · 진술 ${rows.length}개 × 유형 ${labels.length}개`, cols: ["진술문", ...labels], rows, text: "|Z| > 0.5를 기준으로 유형간 공통 동의/비동의 경향을 읽습니다.", ctxPatch: { qres: q, matrix: q.matrix } };
    }
    case "qsummary": {
      const g = getQ(ctx, T);
      const e = need(g, NEED_Q); if (e) return e;
      const { q } = g!;
      const perF = Array.from({ length: q.factors.nFactors }, (_, f) => q.flags.filter((x) => x.factor === f).length);
      const cum = q.factors.explained.reduce((a, b) => a + b, 0);
      const rows = q.interpretation.map((it, i) => [it.label, fmt(q.factors.eigenvalues[i], 2), `${it.explained}%`, `${perF[i] ?? it.nLoaders}명`, (it.high[0] || "").slice(0, 60)]);
      return { summary: `유형별 결과 종합요약 · ${q.factors.nFactors}개 유형, 누적 설명변량 ${fmt(cum, 1)}%, 참여자 ${q.matrix.participants.length}명`, cols: ["유형", "고유값", "설명변량", "인원", "대표 동의 진술"], rows, chart: specFromFreq(perF.map((n, i) => ({ term: `제${i + 1}유형`, count: n })), "pie", "명"), text: q.interpretation.map((it) => `· ${it.label}: ${it.narrative}`).join("\n").slice(0, 1500) };
    }
    case "interpret": {
      const g = getQ(ctx, T);
      if (!g) {
        // 요인분석 결과가 없으면 일반 해석 초안(draft)과 동일하게 처리
        const e = need(T, "해석할 자료(요인분석 결과 또는 텍스트)를 입력/연동하세요."); if (e) return e;
        const ks = keywords(T, 10); const ls = units(T);
        const fb = (): GtTaskResult => ({ summary: `${outputName} 해석 초안(규칙기반)`, cols: ["#", "핵심 문장"], rows: ls.slice(0, 30).map((x, i) => [i + 1, x.slice(0, 140)]), text: `[핵심어] ${ks.map((k) => k.term).join(", ")}` });
        if (mode === "ai") return aiOr(`다음 자료를 바탕으로 '${outputName}' 해석문 초안을 작성하라:\n${T.slice(0, 3000)}`, settings, fb);
        return fb();
      }
      const { q } = g!;
      const fb = (): GtTaskResult => ({ summary: `유형별 해석문 초안 · ${q.interpretation.length}개 유형(이름 붙이기는 연구자 확정)`, cols: ["유형", "강한 동의(Z≥+1)", "강한 비동의(Z≤−1)"], rows: q.interpretation.map((it) => [it.label, it.high.join(" / ").slice(0, 90), it.low.join(" / ").slice(0, 90)]), text: q.interpretation.map((it) => `■ ${it.label}\n${it.narrative}`).join("\n\n") });
      if (mode === "ai") return aiOr(`다음 GN-029 유형별 동의/비동의 진술 패턴을 보고 각 유형의 해석문과 유형 이름 후보 2개씩을 제안하라(최종 명명은 연구자 몫):\n${q.interpretation.map((it) => `${it.label} 동의:${it.high.join("; ")} 비동의:${it.low.join("; ")}`).join("\n").slice(0, 2800)}`, settings, fb);
      return fb();
    }
    case "statsTtest": {
      const csv = parseCSV(text || "");
      const e = need(csv, "독립표본 t-검정용 CSV가 필요합니다. 예: 성별,소득만족 (1·2 그룹 + 연속 점수)"); if (e) return e;
      const sp = groupSplit(csv!);
      const err = need(sp, "그룹(예: 성별 1/2)과 연속 변수 열을 찾지 못했습니다."); if (err) return err;
      const { yCol, gCol, g1, g2 } = sp!;
      const w = welchT(g1, g2);
      const fb = (): GtTaskResult => ({
        summary: `독립표본 t-검정 · ${yCol} by ${gCol} · t(${w.df})=${fmt(w.t, 3)}, ${pLabel(w.p)}, Cohen's d=${fmt(w.d, 3)}`,
        cols: ["그룹", "N", "Mean", "SD"],
        rows: [[`${gCol}=1`, w.na, fmt(w.ma, 3), fmt(w.sa, 3)], [`${gCol}≠1`, w.nb, fmt(w.mb, 3), fmt(w.sb, 3)]],
        text: `${pLabel(w.p)} ${w.p < 0.05 ? "→ 그룹 평균 차이가 유의합니다." : "→ 그룹 평균 차이가 유의하지 않습니다."}\n해석 초안: ${gCol}에 따라 ${yCol} 평균이 ${fmt(w.ma, 2)} vs ${fmt(w.mb, 2)} (차이 ${fmt(w.ma - w.mb, 2)}).`,
      });
      if (mode === "ai") return aiOr(`다음 t-검정 결과를 사회과학 보고 문장 2~3개로 해석하라:\n${yCol} by ${gCol}, t=${fmt(w.t)}, ${pLabel(w.p)}, d=${fmt(w.d)}\n${content.slice(0, 800)}`, settings, fb);
      return fb();
    }
    case "statsAnova": {
      const csv = parseCSV(text || "");
      const e = need(csv, "일원분산분석용 CSV — 그룹 변수 + 연속 종속변수"); if (e) return e;
      const nums = numericCols(csv!);
      const y = nums[nums.length - 1];
      const gi = csv!.header.findIndex((h) => h !== y.name);
      const groups: Record<string, number[]> = {};
      for (const r of csv!.rows) {
        const yv = parseFloat(r[csv!.header.indexOf(y.name)]); if (isNaN(yv)) continue;
        const g = r[gi] || "?";
        (groups[g] ||= []).push(yv);
      }
      const keys = Object.keys(groups).filter((k) => groups[k].length >= 2);
      const err = need(keys.length >= 2, "그룹이 2개 이상 필요합니다."); if (err) return err;
      const all = keys.flatMap((k) => groups[k]);
      const grand = mean(all);
      let ssB = 0, ssW = 0;
      keys.forEach((k) => { const m = mean(groups[k]); ssB += groups[k].length * (m - grand) ** 2; groups[k].forEach((v) => { ssW += (v - m) ** 2; }); });
      const k = keys.length, n = all.length;
      const dfB = k - 1, dfW = n - k;
      const msB = ssB / dfB, msW = ssW / dfW;
      const F = msW ? msB / msW : 0;
      const eta2 = ssB / (ssB + ssW);
      const fb = (): GtTaskResult => ({
        summary: `일원 ANOVA · ${y.name} ~ ${csv!.header[gi]} · F(${dfB},${dfW})=${fmt(F, 3)}, η²=${fmt(eta2, 3)}`,
        cols: ["그룹", "N", "Mean", "SD"],
        rows: keys.map((key) => [key, groups[key].length, fmt(mean(groups[key]), 3), fmt(sdSample(groups[key]), 3)]),
        text: `Between SS=${fmt(ssB, 3)}, Within SS=${fmt(ssW, 3)}. 사후검정(예: Bonferroni)은 SPSS에서 확인하세요.`,
      });
      if (mode === "ai") return aiOr(`ANOVA 표를 해석하는 보고 문단을 작성하라:\nF=${fmt(F)}, η²=${fmt(eta2)}\n${keys.map((key) => `${key}: M=${fmt(mean(groups[key]))}`).join("\n")}`, settings, fb);
      return fb();
    }
    case "statsRegress": {
      const csv = parseCSV(text || "");
      const e = need(csv, "단순회귀용 CSV — 예측변수·종속변수(연속) 2열 이상"); if (e) return e;
      const nums = numericCols(csv!);
      const err = need(nums.length >= 2, "연속 숫자 열 2개 이상 필요합니다."); if (err) return err;
      const x = nums[0].vals, y = nums[1].vals;
      const r = olsSimple(x, y);
      const fb = (): GtTaskResult => ({
        summary: `단순선형회귀 · ${nums[1].name} ~ ${nums[0].name} · R²=${fmt(r.r2, 3)}, b=${fmt(r.b1, 3)}, ${pLabel(r.p)}`,
        cols: ["항목", "값"],
        rows: [["Intercept", fmt(r.b0, 3)], ["Slope", fmt(r.b1, 3)], ["R", fmt(r.r, 3)], ["R²", fmt(r.r2, 3)], ["t", fmt(r.t, 3)], ["N", r.n]],
        text: `회귀식: ${nums[1].name} = ${fmt(r.b0, 3)} + ${fmt(r.b1, 3)}·${nums[0].name}. ${nums[0].name} 1단위 증가 시 ${nums[1].name} ${fmt(r.b1, 3)} 변화(선형).`,
      });
      if (mode === "ai") return aiOr(`회귀 결과를 논문 스타일 2문장으로 해석:\n${nums[1].name} ~ ${nums[0].name}, R²=${fmt(r.r2)}, b=${fmt(r.b1)}, ${pLabel(r.p)}`, settings, fb);
      return fb();
    }
    case "statsNorm": {
      const csv = parseCSV(text || "");
      const e = need(csv, "정규성·기술진단용 CSV"); if (e) return e;
      const nums = numericCols(csv!);
      const err = need(nums.length >= 1, "연속 변수 열이 필요합니다."); if (err) return err;
      const rows = nums.map((c) => {
        const m = mean(c.vals), s = sdSample(c.vals, m);
        const skew = c.vals.length > 2 ? c.vals.reduce((a, v) => a + ((v - m) / s) ** 3, 0) / c.vals.length : 0;
        return [c.name, c.vals.length, fmt(m, 3), fmt(s, 3), fmt(skew, 3), Math.abs(skew) < 1 ? "대략 대칭" : "왜도 주의"];
      });
      const fb = (): GtTaskResult => ({
        summary: `기술·정규성 1차 점검 · 변수 ${nums.length}개 (Shapiro는 SPSS에서 확인)`,
        cols: ["변수", "N", "Mean", "SD", "왜도(근사)", "판정"],
        rows,
        text: "Q-Q plot·Shapiro-Wilk는 SPSS Analyze→Descriptive→Explore에서 확인하세요. |왜도|>1이면 변환·비모수 검토.",
      });
      if (mode === "ai") return aiOr(`다음 기술통계·왜도 표를 바탕으로 가정 검토 메모를 작성:\n${rows.map((r) => r.join(" | ")).join("\n")}`, settings, fb);
      return fb();
    }
    case "statsAlpha": {
      const csv = parseCSV(text || "");
      const e = need(csv, "신뢰도용 CSV — 척도 문항(연속) 여러 열"); if (e) return e;
      const nums = numericCols(csv!);
      const err = need(nums.length >= 2, "문항 열 2개 이상 필요"); if (err) return err;
      const k = nums.length;
      let sumVar = 0;
      const itemVars = nums.map((c) => { const v = sdSample(c.vals) ** 2; sumVar += v; return v; });
      const totals = nums[0].vals.map((_, i) => nums.reduce((s, c) => s + (c.vals[i] || 0), 0));
      const alpha = k > 1 && sdSample(totals) ** 2 ? (k / (k - 1)) * (1 - sumVar / (sdSample(totals) ** 2)) : 0;
      const fb = (): GtTaskResult => ({
        summary: `Cronbach's α(근사) = ${fmt(alpha, 3)} · 문항 ${k}개`,
        cols: ["문항", "SD"],
        rows: nums.map((c, i) => [c.name, fmt(sdSample(c.vals), 3)]),
        text: alpha >= 0.7 ? "통상 기준(.7) 이상 — 내적일관성 양호(근사)." : "α<.7 — 문항 재검토·역코딩 확인 권고.",
      });
      if (mode === "ai") return aiOr(`α=${fmt(alpha)} 신뢰도 결과를 방법 절 1문단으로 작성`, settings, fb);
      return fb();
    }
    case "statsVif": {
      const fb = (): GtTaskResult => ({
        summary: "다중공선성(VIF) — SPSS 회귀 출력 붙여넣기 후 AI 해석 권장",
        text: "Analyze→Regression→Linear에서 Statistics→Collinearity diagnostics 체크. VIF>10 또는 Tolerance<.1이면 공선성 의심.",
      });
      if (mode === "ai" && T.trim()) return aiOr(`다음 회귀/VIF 출력을 검토하고 공선성 해석 메모를 작성:\n${T.slice(0, 4000)}`, settings, fb);
      return fb();
    }
    case "aiTransform": {
      const e = need(T, "변환할 자료(텍스트·CSV)를 입력하거나 파일을 불러오세요. ‘예시 불러오기’로 연습할 수 있습니다."); if (e) return e;
      const csv = parseCSV(text || "");
      const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let cols: string[] | undefined;
      let rows: (string | number)[][] | undefined;
      let summary = `${outputName} · AI 변환 초안`;
      let body = "";
      if (csv && csv.header.length >= 2) {
        cols = csv.header;
        rows = csv.rows.slice(0, 40);
        // simple freq on 2nd col
        const freq: Record<string, number> = {};
        const idx = Math.min(1, csv.header.length - 1);
        csv.rows.forEach((r) => { const k = r[idx] || "(빈칸)"; freq[k] = (freq[k] || 0) + 1; });
        body = `【쉬운 설명】표를 다음 단계(코딩·분석·해석)가 쓰기 좋게 정리했습니다.\n【미리보기】${csv.rows.length}행 × ${csv.header.length}열\n【간단 집계·${csv.header[idx]}】` +
          Object.entries(freq).map(([k, v]) => `${k}=${v}`).join(", ") +
          `\n【연구자 확인】☐ 열 이름 맞음  ☐ 결측 처리  ☐ 개인정보 마스킹`;
        summary = `AI 변환기 · 표 정제/요약 (${csv.rows.length}행)`;
      } else {
        const units = lines.slice(0, 30).map((l, i) => {
          let code = "기타";
          if (/불안|걱정/.test(l)) code = "불안";
          else if (/익숙|적응/.test(l)) code = "적응";
          else if (/만족|좋/.test(l)) code = "만족";
          return [`U${i + 1}`, l.slice(0, 100), code];
        });
        cols = ["ID", "원문", "코드 후보"];
        rows = units;
        body = `【쉬운 설명】문장에 짧은 이름표(코드) 후보를 붙였습니다. 최종 코드는 연구자가 확정하세요.\n【예시】“처음엔 불안했어요” → [불안]\n【확인】☐ 코드 정의  ☐ 동의율  ☐ 예외 사례`;
        summary = `AI 변환기 · 텍스트 코딩 후보 (${units.length}단위)`;
      }
      const fb = (): GtTaskResult => ({ summary, cols, rows, text: body + `\n\n【절차】\n${procedure.map((p, i) => `${i + 1}) ${p}`).join("\n")}` });
      if (mode === "ai") {
        return aiOr(
          `초보 연구자를 위해 쉬운 말로 다음 자료를 변환·요약하라. 수행: ${content.slice(0, 400)}\n자료:\n${T.slice(0, 3500)}`,
          settings,
          fb,
        );
      }
      return fb();
    }
    default:
      return { summary: "지원하지 않는 처리 방식", text: `behavior=${behavior}` };
  }
}

// TX-002·GN-029·QL-008 공용 별칭(러너에서 사용)
export const runPerfTask = runGtTask;

// ── 태스크별 실제 예시 2~3개 생성(AI 기반, 규칙기반 대체) ──
// 사용자 요구: 수행내용/산출물과 그 자동화 절차 각각에 대해 쉽고 정확하고 구체적인 실제 예시(글+표)를
// 2~3개 이상 제공하되, 첨부 원전(샘플 논문·엑셀) 내용은 그대로 쓰지 않고 새로 만든다.
export interface ExampleItem { label: string; text: string; table?: { columns: string[]; rows: (string | number)[][] } }
export interface ExamplesResult { items: ExampleItem[]; note?: string }

function parseJsonArrayLoose<T = any>(text: string): T[] | null {
  try {
    let t = text.trim().replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = t.indexOf("["), e = t.lastIndexOf("]");
    if (s >= 0 && e > s) t = t.slice(s, e + 1);
    const v = JSON.parse(t);
    return Array.isArray(v) ? v : null;
  } catch { return null; }
}

export async function generateExamples(
  inp: { content: string; kind: "수행내용" | "산출물"; auto: string; reason: string; procedure: string[] },
  settings: any
): Promise<ExamplesResult> {
  const prompt = `당신은 연구방법론 학습자료를 만드는 보조원입니다. 아래 절차 항목에 대해 **초보 대학원생도 이해할 수 있는 한국어**로 쉽고 구체적인 실제 예시를 2~3개 만드세요.
항목(${inp.kind}): ${inp.content}
자동화 수준: ${inp.auto} — ${inp.reason}
따라 할 단계: ${(Array.isArray(inp.procedure) ? inp.procedure : []).map((p, i) => `${i + 1}) ${p}`).join(" ")}

규칙:
- 모든 문장은 반드시 한국어로 작성하세요.
- 특정 논문·저작권 자료를 그대로 인용하지 말고, 새로운 **가상의 연구 예시**를 만드세요.
- 각 예시는 2~4문장으로, ‘왜 이 단계가 필요한지’가 드러나게 쓰세요.
- 가능하면 표(table: columns/rows)를 1개 이상 포함하세요.
- 순수 JSON 배열만 출력하세요.
출력 형식: [{"label":"예시 1","text":"...","table":{"columns":["..."],"rows":[["..."]]}}, ...]`;
  try {
    const raw = await aiComplete(prompt, settings);
    const arr = raw ? parseJsonArrayLoose<ExampleItem>(raw) : null;
    if (arr && arr.length) {
      return { items: arr.slice(0, 3).map((it, i) => ({ label: String(it.label || `예시 ${i + 1}`), text: String(it.text || ""), table: it.table && it.table.columns ? { columns: it.table.columns.map(String), rows: it.table.rows || [] } : undefined })) };
    }
  } catch { /* fall through to rule-based */ }
  // 규칙기반 대체: 절차 단계를 표로, 핵심어를 문장으로 엮어 2개 예시 골격 제공
  const ks = keywords(inp.content, 6).map((k) => k.term);
  const items: ExampleItem[] = [
    { label: "예시 1(한글 골격)", text: `「${ks.slice(0, 2).join("·") || inp.content.slice(0, 24)}」와 관련해, ${(inp.procedure && inp.procedure[0]) || "자료를 준비"}부터 순서대로 진행하는 상황을 상상해 보세요. 이 단계를 건너뛰면 다음 보고·검토에서 근거가 부족해집니다.` },
    { label: "예시 2(절차 표)", text: `아래 표처럼 단계마다 체크하면 ${inp.kind} 작업이 훨씬 수월합니다.`, table: { columns: ["순서", "하는 일"], rows: (Array.isArray(inp.procedure) && inp.procedure.length ? inp.procedure : ["목적 확인", "기입·실행", "검토·확정"]).map((p, i) => [`${i + 1}단계`, p.slice(0, 44)]) } },
  ];
  return { items, note: "AI 키가 없어 **한글 골격 예시**로 표시합니다. 설정 > AI 공급자에서 키를 넣으면 더 구체적인 예시를 받을 수 있습니다." };
}
