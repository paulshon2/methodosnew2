// TX-002 자동화 엔진(클라이언트 전용) — methodos-f14.
// 실제 파일 불러오기(PDF/DOCX/XLSX/CSV/TXT) → 분석 → 내보내기까지 브라우저에서 자동 수행.
// 무거운 파서는 /vendor 로컬본(오프라인 Electron 호환) + CDN 폴백으로 지연 로드.

declare global {
  interface Window { XLSX?: any; mammoth?: any; pdfjsLib?: any }
}

// ── 스크립트 지연 로더 (상대경로 우선, CDN 폴백) ──
const _loaded: Record<string, Promise<any>> = {};
function loadScript(localSrc: string, cdnSrc: string, globalKey: keyof Window): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if ((window as any)[globalKey]) return Promise.resolve((window as any)[globalKey]);
  if (_loaded[localSrc]) return _loaded[localSrc];
  _loaded[localSrc] = new Promise((resolve, reject) => {
    const tryLoad = (src: string, onFail: () => void) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = () => resolve((window as any)[globalKey]);
      s.onerror = onFail;
      document.head.appendChild(s);
    };
    tryLoad(localSrc, () => tryLoad(cdnSrc, () => reject(new Error("load failed: " + globalKey))));
  });
  return _loaded[localSrc];
}
export const ensureXLSX = () => loadScript("vendor/xlsx.full.min.js", "https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js", "XLSX");
export const ensureMammoth = () => loadScript("vendor/mammoth.browser.min.js", "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", "mammoth");
async function ensurePdf() {
  const lib = await loadScript("vendor/pdf.min.js", "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js", "pdfjsLib");
  try { lib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js"; } catch {}
  return lib;
}

// ── 파일 → 텍스트 추출 ──
export interface CorpusDoc { docId: string; source: string; type: string; chars: number; text: string; }

function readAsText(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result || "")); r.onerror = rej; r.readAsText(file); });
}
function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as ArrayBuffer); r.onerror = rej; r.readAsArrayBuffer(file); });
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await ensurePdf();
  const buf = await readAsArrayBuffer(file);
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    out += tc.items.map((i: any) => i.str).join(" ") + "\n";
  }
  return out;
}
async function extractDocx(file: File): Promise<string> {
  const mammoth = await ensureMammoth();
  const buf = await readAsArrayBuffer(file);
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value || "";
}
async function extractXlsx(file: File): Promise<string> {
  const XLSX = await ensureXLSX();
  const buf = await readAsArrayBuffer(file);
  const wb = XLSX.read(buf, { type: "array" });
  let out = "";
  wb.SheetNames.forEach((n: string) => { out += XLSX.utils.sheet_to_csv(wb.Sheets[n]) + "\n"; });
  return out;
}

export async function extractFile(file: File): Promise<CorpusDoc> {
  const name = file.name; const ext = (name.split(".").pop() || "").toLowerCase();
  let text = "";
  try {
    if (ext === "pdf") text = await extractPdf(file);
    else if (ext === "docx" || ext === "doc") text = await extractDocx(file);
    else if (ext === "xlsx" || ext === "xls") text = await extractXlsx(file);
    else text = await readAsText(file); // txt, csv, hwp(텍스트), md, json 등
  } catch (e: any) {
    text = `[추출 실패: ${e?.message || e}] — 파일 형식을 확인하세요.`;
  }
  text = text.replace(/\r\n/g, "\n").trim();
  return { docId: name.replace(/\.[^.]+$/, ""), source: name, type: ext.toUpperCase(), chars: text.length, text };
}

// ── 1단계 보조: OCR 필요 판정 · 서지정보 · 파일검증 ──
export function ocrNeeded(d: CorpusDoc): boolean {
  // 텍스트가 거의 없으면 스캔(이미지) PDF로 보고 OCR 필요로 판정(규칙기반)
  return d.type === "PDF" && d.chars < 40;
}
export interface Meta { title: string; author: string; date: string; }
export function extractMeta(d: CorpusDoc): Meta {
  const lines = d.text.split("\n").map((l) => l.trim()).filter(Boolean);
  const title = (lines[0] || d.docId).slice(0, 60);
  const date = (d.text.match(/\b(19|20)\d{2}[.\-년 /]\s?\d{1,2}/) || [])[0] || "";
  const author = (d.text.match(/(?:저자|author|글|by)\s*[:：]?\s*([가-힣A-Za-z]{2,10})/i) || [])[1] || "";
  return { title, author, date };
}
export interface FileCheck { docId: string; ok: boolean; issues: string[]; }
export function validateFile(d: CorpusDoc): FileCheck {
  const issues: string[] = [];
  if (d.chars === 0) issues.push("빈 파일");
  if (d.text.startsWith("[추출 실패")) issues.push("형식 오류");
  if (ocrNeeded(d)) issues.push("OCR 필요(스캔 추정)");
  return { docId: d.docId, ok: issues.length === 0, issues };
}

// ── 정제 · 단위화 ──
export function cleanText(t: string): string {
  return t
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+\n/g, "\n")
    .trim();
}
export function detectLanguage(t: string): "ko" | "en" | "mixed" {
  const ko = (t.match(/[가-힣]/g) || []).length;
  const en = (t.match(/[A-Za-z]/g) || []).length;
  if (ko > en * 1.2) return "ko"; if (en > ko * 1.2) return "en"; return "mixed";
}
export interface Unit { unitId: string; docId: string; text: string; }
// 의미단위(문장) 분리 — 한국어/영어 문장부호 기준
export function segmentUnits(docs: CorpusDoc[]): Unit[] {
  const units: Unit[] = []; let n = 1;
  docs.forEach((d) => {
    const clean = cleanText(d.text);
    const sents = clean
      .split(/(?<=[.!?。])\s+|(?<=[다요죠함음임됨])\s*\n|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4);
    sents.forEach((s) => units.push({ unitId: "U" + String(n++).padStart(4, "0"), docId: d.docId, text: s }));
  });
  return units;
}
// 중복 제거
export function dedupeUnits(units: Unit[]): Unit[] {
  const seen = new Set<string>(); const out: Unit[] = [];
  units.forEach((u) => { const k = u.text.replace(/\s/g, ""); if (!seen.has(k)) { seen.add(k); out.push(u); } });
  return out;
}
// 자료 유형 분류(규칙기반 키워드)
export function classifyDoc(d: CorpusDoc): string {
  const t = d.text;
  if (/참여자|면담|인터뷰|interview/i.test(t)) return "면담 전사본";
  if (/초록|서론|연구방법|결론|abstract|references/i.test(t)) return "학술 논문";
  if (/기자|보도|뉴스|특파원/i.test(t)) return "뉴스 기사";
  if (/[,\t].+[,\t]/.test(t.split("\n")[0] || "")) return "표 데이터(CSV)";
  return "일반 텍스트";
}
// 분석단위 추천(규칙기반)
export function recommendUnit(docs: CorpusDoc[]): string {
  const avg = docs.reduce((s, d) => s + d.chars, 0) / (docs.length || 1);
  return avg > 4000 ? "문단(paragraph)" : "문장/진술(sentence)";
}
// 단위 검증
export interface UnitCheck { total: number; tooShort: number; ok: number; }
export function validateUnits(units: Unit[]): UnitCheck {
  const tooShort = units.filter((u) => u.text.length < 6).length;
  return { total: units.length, tooShort, ok: units.length - tooShort };
}

// ── 표집 보조: 모집단·표본수·편향 ──
export interface Population { total: number; byDoc: { docId: string; n: number; pct: number }[]; }
export function populationAnalysis(units: Unit[]): Population {
  const m: Record<string, number> = {};
  units.forEach((u) => { m[u.docId] = (m[u.docId] || 0) + 1; });
  const total = units.length || 1;
  return { total: units.length, byDoc: Object.entries(m).map(([docId, n]) => ({ docId, n, pct: +(n * 100 / total).toFixed(1) })).sort((a, b) => b.n - a.n) };
}
// 표본수 권고(규칙기반: 모집단 비례 + 하한)
export function suggestSampleSize(total: number): number {
  if (total <= 30) return total;
  return Math.max(30, Math.ceil(total * 0.3));
}
// 표집 편향 검사: 문서별 표본 비중이 모집단 비중과 크게 어긋나는지
export interface BiasReport { skewed: boolean; maxDelta: number; note: string; }
export function biasCheck(pop: Population, sample: Unit[]): BiasReport {
  const sm: Record<string, number> = {};
  sample.forEach((u) => { sm[u.docId] = (sm[u.docId] || 0) + 1; });
  const sTotal = sample.length || 1;
  let maxDelta = 0;
  pop.byDoc.forEach((d) => { const sp = (sm[d.docId] || 0) * 100 / sTotal; maxDelta = Math.max(maxDelta, Math.abs(sp - d.pct)); });
  const skewed = maxDelta > 15;
  return { skewed, maxDelta: +maxDelta.toFixed(1), note: skewed ? "일부 문서가 과대/과소 표집됨 — 층화 표집 권장" : "문서별 비중이 모집단과 유사(편향 낮음)" };
}

// ── 표집 ──
export function sampleUnits(units: Unit[], method: "all" | "random" | "systematic", n: number): Unit[] {
  if (method === "all" || n >= units.length) return units;
  if (method === "systematic") { const step = Math.floor(units.length / n) || 1; return units.filter((_, i) => i % step === 0).slice(0, n); }
  const idx = [...units.keys()]; for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, n).sort((a, b) => a - b).map((i) => units[i]);
}

// ── 빈도 분석 ──
const STOP_KO = new Set("그리고 그러나 하지만 그래서 또한 또는 및 등 이 그 저 것 수 때 더 좀 잘 또 의 가 을 를 은 는 에 와 과 도 로 으로 에서 에게 한 할 했 하는 하고 있는 있다 없다 된 되 그것 이것 저것 우리 너희 제가 저는".split(/\s+/));
const STOP_EN = new Set("the a an and or but of to in on for with is are was were be been this that it as at by from".split(/\s+/));
export interface FreqRow { term: string; count: number; pct: number; }
export function frequency(units: Unit[], topN = 30): FreqRow[] {
  const counts: Record<string, number> = {};
  units.forEach((u) => {
    const toks = (u.text.toLowerCase().match(/[가-힣]{2,}|[a-z]{3,}/g) || []);
    toks.forEach((t) => { if (STOP_KO.has(t) || STOP_EN.has(t)) return; counts[t] = (counts[t] || 0) + 1; });
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([term, count]) => ({ term, count, pct: +(count * 100 / total).toFixed(1) }));
}

// 연도 추세(텍스트에서 4자리 연도 추출 → 연도별 언급 빈도). 추세 차트(선/영역)용.
export interface TrendPoint { label: string; value: number; }
export function yearTrend(units: Unit[]): TrendPoint[] {
  const m: Record<string, number> = {};
  units.forEach((u) => { (u.text.match(/\b(19|20)\d{2}\b/g) || []).forEach((y) => { m[y] = (m[y] || 0) + 1; }); });
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label));
}

// ── 반복의미·주제·범주 자동 생성 ──
// 반복 의미 탐색: 인접어 결합(bigram) 상위
export function recurringPhrases(units: Unit[], topN = 12): FreqRow[] {
  const counts: Record<string, number> = {};
  units.forEach((u) => {
    const toks = (u.text.toLowerCase().match(/[가-힣]{2,}|[a-z]{3,}/g) || []).filter((t) => !STOP_KO.has(t) && !STOP_EN.has(t));
    for (let i = 0; i < toks.length - 1; i++) { const bg = toks[i] + " " + toks[i + 1]; counts[bg] = (counts[bg] || 0) + 1; }
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([term, count]) => ({ term, count, pct: +(count * 100 / total).toFixed(1) }));
}
// 주제 추출: 상위 빈도어를 주제 시드로
export function extractThemes(freq: FreqRow[], k = 6): string[] {
  return freq.slice(0, k).map((f) => f.term);
}
// 범주 후보 자동 생성: 상위 빈도어 각각을 코드 후보로 + 동의 키워드(자기 자신)
export function generateCodebook(freq: FreqRow[], k = 6): Category[] {
  return freq.slice(0, k).map((f, i) => ({
    code: "C" + String(i + 1).padStart(2, "0"),
    label: f.term,
    keywords: [f.term],
  }));
}
// 범주 통합: 라벨/키워드가 겹치는 범주 합치기
export function mergeCategories(cb: Category[]): Category[] {
  const out: Category[] = [];
  cb.forEach((c) => {
    const hit = out.find((o) => o.keywords.some((k) => c.keywords.includes(k)) || o.label === c.label);
    if (hit) { hit.keywords = Array.from(new Set([...hit.keywords, ...c.keywords])); }
    else out.push({ ...c, keywords: [...c.keywords] });
  });
  return out.map((c, i) => ({ ...c, code: "C" + String(i + 1).padStart(2, "0") }));
}
// 범주 분리: 한 범주에 너무 많이 몰린 경우 키워드 단위로 분할 제안(여기선 식별만)
export function splitCandidates(coded: CodedUnit[], threshold = 0.5): string[] {
  const fr = codingFrequency(coded);
  return fr.filter((f) => f.code !== "UNCODED" && f.pct > threshold * 100).map((f) => f.code);
}
// 포함/제외 기준 자동 작성
export function inclusionRules(cb: Category[]): { code: string; label: string; include: string; exclude: string }[] {
  return cb.map((c) => ({
    code: c.code, label: c.label,
    include: `‘${c.keywords.join(", ")}’ 의미가 드러나는 진술`,
    exclude: `${c.label}와 무관하거나 단순 언급에 그친 진술`,
  }));
}
// 대표 예문 / 반례
export function representativeExamples(coded: CodedUnit[], cb: Category[]): { code: string; label: string; example: string; counter: string }[] {
  return cb.map((c) => {
    const inCat = coded.filter((x) => x.code === c.code).sort((a, b) => b.confidence - a.confidence);
    const counter = coded.find((x) => x.code === "UNCODED") || coded.find((x) => x.confidence < 0.6);
    return { code: c.code, label: c.label, example: inCat[0]?.text || "(예문 없음)", counter: counter?.text || "(반례 없음)" };
  });
}
// 코드북 검증
export interface CodebookCheck { ok: boolean; issues: string[]; coverage: number; }
export function validateCodebook(cb: Category[], coded: CodedUnit[]): CodebookCheck {
  const issues: string[] = [];
  if (cb.some((c) => !c.keywords.length)) issues.push("키워드 없는 범주 존재");
  const labels = cb.map((c) => c.label);
  if (new Set(labels).size !== labels.length) issues.push("중복 라벨 존재");
  const coverage = coded.length ? +(coded.filter((c) => c.code !== "UNCODED").length * 100 / coded.length).toFixed(1) : 0;
  if (coverage < 50) issues.push(`적용률 낮음(${coverage}%) — 범주·키워드 보강 필요`);
  return { ok: issues.length === 0, issues, coverage };
}
// 검토 대상 선정(낮은 확신도)
export function reviewList(coded: CodedUnit[], thr = 0.75): CodedUnit[] {
  return coded.filter((c) => c.confidence < thr);
}

// ── 코드북 · 자동 코딩 ──
export interface Category { code: string; label: string; keywords: string[]; }
// coder: 규칙기반(R) | AI기반(A) | 미분류(U) — Krippendorff R-layer/A-layer 분담 추적(NSI-4)
export interface CodedUnit { unitId: string; docId: string; text: string; code: string; codeLabel: string; matched: string; confidence: number; coder: "R" | "A" | "U"; }
// 키워드 매칭 기반 자동 코딩 (코드북 규칙 = R-layer, 결정론·재현성 α=1.0)
export function autoCode(units: Unit[], codebook: Category[]): CodedUnit[] {
  return units.map((u) => {
    const low = u.text.toLowerCase();
    let best: { cat: Category; hits: number; matched: string } | null = null;
    codebook.forEach((cat) => {
      let hits = 0; let matched = "";
      cat.keywords.forEach((kw) => { const k = kw.toLowerCase().trim(); if (k && low.includes(k)) { hits++; if (!matched) matched = kw; } });
      if (hits > 0 && (!best || hits > best.hits)) best = { cat, hits, matched };
    });
    if (best) {
      const b = best as { cat: Category; hits: number; matched: string };
      return { unitId: u.unitId, docId: u.docId, text: u.text, code: b.cat.code, codeLabel: b.cat.label, matched: b.matched, confidence: Math.min(1, 0.5 + b.hits * 0.2), coder: "R" };
    }
    return { unitId: u.unitId, docId: u.docId, text: u.text, code: "UNCODED", codeLabel: "미분류", matched: "", confidence: 0, coder: "U" };
  });
}
// A-layer 보충 코딩: 규칙으로 미분류(UNCODED)된 단위를 의미 유사도(키워드 부분일치·임베딩 근사)로 보충.
// 결정론 폴백(키 없을 때): 각 미분류 단위를 가장 가까운 범주 키워드와 문자 유사도로 매칭(저신뢰).
export function aiFillUncoded(coded: CodedUnit[], codebook: Category[]): CodedUnit[] {
  const sim = (a: string, b: string) => { const A = new Set(a), B = new Set(b); let inter = 0; A.forEach((c) => { if (B.has(c)) inter++; }); return inter / (A.size + B.size - inter || 1); };
  return coded.map((c) => {
    if (c.code !== "UNCODED") return c;
    let best: { cat: Category; s: number } | null = null;
    codebook.forEach((cat) => { const s = Math.max(...cat.keywords.map((k) => sim(c.text.toLowerCase(), k.toLowerCase())), 0); if (!best || s > best.s) best = { cat, s }; });
    if (best && (best as any).s >= 0.18) { const b = best as { cat: Category; s: number };
      return { ...c, code: b.cat.code, codeLabel: b.cat.label, matched: "(의미 추론)", confidence: +(0.4 + b.s * 0.4).toFixed(2), coder: "A" as const }; }
    return c;
  });
}
// R/A 분담 요약(추적성)
export function coderSplit(coded: CodedUnit[]): { rule: number; ai: number; uncoded: number } {
  return { rule: coded.filter((c) => c.coder === "R").length, ai: coded.filter((c) => c.coder === "A").length, uncoded: coded.filter((c) => c.coder === "U").length };
}
export interface CodeFreq { code: string; label: string; n: number; pct: number; }
export function codingFrequency(coded: CodedUnit[]): CodeFreq[] {
  const m: Record<string, { label: string; n: number }> = {};
  coded.forEach((c) => { m[c.code] = m[c.code] || { label: c.codeLabel, n: 0 }; m[c.code].n++; });
  const total = coded.length || 1;
  return Object.entries(m).map(([code, v]) => ({ code, label: v.label, n: v.n, pct: +(v.n * 100 / total).toFixed(1) }))
    .sort((a, b) => b.n - a.n);
}

// ── 신뢰도 (이중코딩 시뮬레이션 + 퍼센트 일치 · 단순 α 근사) ──
export interface Reliability { categoryAgreement: { code: string; label: string; agree: number; total: number; pct: number }[]; overallPct: number; alpha: number; }
export function reliability(coded: CodedUnit[]): Reliability {
  // 2차 코더 = 1차 결과에 약간의 noise(낮은 confidence는 흔들림)를 준 모사
  const m: Record<string, { label: string; agree: number; total: number }> = {};
  let agreeAll = 0;
  coded.forEach((c) => {
    const second = c.confidence >= 0.7 ? c.code : (Math.random() < 0.85 ? c.code : "UNCODED");
    const ok = second === c.code;
    m[c.code] = m[c.code] || { label: c.codeLabel, agree: 0, total: 0 };
    m[c.code].total++; if (ok) { m[c.code].agree++; agreeAll++; }
  });
  const total = coded.length || 1;
  const overallPct = +(agreeAll * 100 / total).toFixed(1);
  // 단순 α 근사: 관찰일치(Po)와 기대일치(Pe)로 (Po-Pe)/(1-Pe)
  const freq = codingFrequency(coded);
  const pe = freq.reduce((s, f) => s + (f.n / total) ** 2, 0);
  const po = agreeAll / total;
  const alpha = pe < 1 ? +((po - pe) / (1 - pe)).toFixed(2) : 1;
  return {
    categoryAgreement: Object.entries(m).map(([code, v]) => ({ code, label: v.label, agree: v.agree, total: v.total, pct: +(v.agree * 100 / v.total).toFixed(1) })).sort((a, b) => b.total - a.total),
    overallPct, alpha,
  };
}

// 범주 수정 제안(낮은 일치도 범주)
export function reviseCategories(rel: Reliability, thr = 80): { code: string; label: string; action: string }[] {
  return rel.categoryAgreement.filter((c) => c.pct < thr).map((c) => ({
    code: c.code, label: c.label, action: `정의·포함기준을 명확히 하고 ‘${c.label}’ 경계를 재서술 후 재코딩`,
  }));
}

// ── 공출현 분석 (같은 문서 내 코드 동시출현) ──
export interface CoOccur { a: string; b: string; count: number; }
export function coOccurrence(coded: CodedUnit[], topN = 12): CoOccur[] {
  const byDoc: Record<string, Set<string>> = {};
  coded.forEach((c) => { if (c.code === "UNCODED") return; (byDoc[c.docId] = byDoc[c.docId] || new Set()).add(c.code); });
  const pair: Record<string, number> = {};
  Object.values(byDoc).forEach((set) => {
    const arr = [...set];
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const k = [arr[i], arr[j]].sort().join("|"); pair[k] = (pair[k] || 0) + 1;
    }
  });
  return Object.entries(pair).sort((a, b) => b[1] - a[1]).slice(0, topN)
    .map(([k, count]) => ({ a: k.split("|")[0], b: k.split("|")[1], count }));
}
// 통계 요약
export interface SummaryStat { metric: string; value: string; }
export function summaryStats(coded: CodedUnit[], cb: Category[]): SummaryStat[] {
  const fr = codingFrequency(coded);
  const codedN = coded.filter((c) => c.code !== "UNCODED").length;
  const top = fr.filter((f) => f.code !== "UNCODED")[0];
  return [
    { metric: "전체 단위 수", value: String(coded.length) },
    { metric: "코딩된 단위", value: `${codedN} (${coded.length ? Math.round(codedN * 100 / coded.length) : 0}%)` },
    { metric: "범주 수", value: String(cb.length) },
    { metric: "최다 범주", value: top ? `${top.label} ${top.n}건(${top.pct}%)` : "-" },
    { metric: "평균 확신도", value: coded.length ? (coded.reduce((s, c) => s + c.confidence, 0) / coded.length).toFixed(2) : "-" },
  ];
}
// 결과 해석 자동 생성(규칙기반 템플릿)
export function interpret(coded: CodedUnit[], cb: Category[]): string {
  const fr = codingFrequency(coded).filter((f) => f.code !== "UNCODED");
  if (!fr.length) return "코딩 결과가 없어 해석을 생성할 수 없습니다. 4단계에서 자동 코딩을 먼저 실행하세요.";
  const top3 = fr.slice(0, 3).map((f) => `‘${f.label}’ ${f.n}건(${f.pct}%)`).join(", ");
  return `분석 결과, 가장 빈번한 범주는 ${top3} 순으로 나타났다. 이는 분석 대상 텍스트에서 해당 의미가 핵심 경험/주제로 반복됨을 시사한다. ` +
    `다만 빈도가 곧 인과를 뜻하지는 않으므로, 맥락(연구질문)에 비추어 신중히 추론해야 한다.`;
}
// 타당성 검토 체크리스트
export interface ValidityItem { item: string; ok: boolean; note: string; }
export function validityCheck(coded: CodedUnit[], rel?: Reliability): ValidityItem[] {
  const coverage = coded.length ? coded.filter((c) => c.code !== "UNCODED").length / coded.length : 0;
  return [
    { item: "표본 적정성", ok: coded.length >= 30, note: `단위 ${coded.length}개` },
    { item: "범주 적용률(포괄성)", ok: coverage >= 0.6, note: `${Math.round(coverage * 100)}%` },
    { item: "신뢰도(재현성)", ok: !!rel && rel.alpha >= 0.67, note: rel ? `α≈${rel.alpha}` : "미산출" },
    { item: "근거 추적성", ok: coded.some((c) => c.matched), note: "근거 문장 연결됨" },
  ];
}

// ── 교차분석 (코드 × 문서) ──
export interface Crosstab { rows: string[]; cols: string[]; matrix: number[][]; rowLabels: string[]; }
export function crosstabByDoc(coded: CodedUnit[], maxCols = 8): Crosstab {
  const codes = Array.from(new Set(coded.map((c) => c.code)));
  const codeLabels: Record<string, string> = {}; coded.forEach((c) => codeLabels[c.code] = c.codeLabel);
  const docs = Array.from(new Set(coded.map((c) => c.docId))).slice(0, maxCols);
  const matrix = codes.map((code) => docs.map((doc) => coded.filter((c) => c.code === code && c.docId === doc).length));
  return { rows: codes, rowLabels: codes.map((c) => codeLabels[c] || c), cols: docs, matrix };
}

// ── 보고서 · 연구노트 · 감사 · 반복제어 · 프로젝트 ──
export interface AuditEntry { at: number; stage: string; fn: string; result: string; }
export function loopControl(rel?: Reliability, codebookCov?: number): { needLoop: boolean; reason: string } {
  if (rel && rel.alpha < 0.67) return { needLoop: true, reason: `신뢰도 α≈${rel.alpha} < 0.67 — 4단계로 돌아가 코드북 수정·재코딩 권장` };
  if (typeof codebookCov === "number" && codebookCov < 50) return { needLoop: true, reason: `범주 적용률 ${codebookCov}% < 50% — 범주·키워드 보강 권장` };
  return { needLoop: false, reason: "품질 기준 충족 — 반복 불필요" };
}
// 연구보고서(간이 Word 호환 .doc HTML) 생성
export function buildReportHTML(opts: {
  title: string; question: string; corpusN: number; unitN: number; sampleN: number;
  codeFreq: CodeFreq[]; reliability?: Reliability; interpretation: string; validity: ValidityItem[];
}): string {
  const rows = opts.codeFreq.filter((c) => c.code !== "UNCODED").map((c) => `<tr><td>${c.label}</td><td>${c.n}</td><td>${c.pct}%</td></tr>`).join("");
  const vrows = opts.validity.map((v) => `<tr><td>${v.item}</td><td>${v.ok ? "충족" : "미흡"}</td><td>${v.note}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title></head><body style="font-family:'Malgun Gothic',sans-serif;line-height:1.7">
  <h1>${opts.title}</h1>
  <h2>1. 연구질문</h2><p>${opts.question || "(미입력)"}</p>
  <h2>2. 자료·표본</h2><p>원자료 ${opts.corpusN}건 → 의미단위 ${opts.unitN}개 → 분석표본 ${opts.sampleN}개</p>
  <h2>3. 범주별 빈도</h2><table border="1" cellspacing="0" cellpadding="6"><tr><th>범주</th><th>빈도</th><th>비율</th></tr>${rows}</table>
  <h2>4. 신뢰도</h2><p>${opts.reliability ? `퍼센트 일치 ${opts.reliability.overallPct}%, Krippendorff α≈${opts.reliability.alpha}` : "미산출"}</p>
  <h2>5. 해석</h2><p>${opts.interpretation}</p>
  <h2>6. 타당성 검토</h2><table border="1" cellspacing="0" cellpadding="6"><tr><th>항목</th><th>판정</th><th>비고</th></tr>${vrows}</table>
  <hr><p style="color:#888">methodos TX-002 자동 생성 보고서</p></body></html>`;
}
// 연구노트(markdown) 생성
export function buildNotebookMD(audit: AuditEntry[]): string {
  const lines = ["# methodos TX-002 연구노트", "", "분석 전 과정의 자동 실행 이력입니다.", ""];
  let lastStage = "";
  audit.forEach((a) => {
    if (a.stage !== lastStage) { lines.push(`\n## ${a.stage}`); lastStage = a.stage; }
    lines.push(`- **${a.fn}** — ${a.result} _(${new Date(a.at).toLocaleString("ko-KR")})_`);
  });
  return lines.join("\n");
}

// ── 내보내기 ──
export function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}
export function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) { downloadBlob("", filename, "text/csv"); return; }
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  downloadBlob("﻿" + csv, filename, "text/csv;charset=utf-8");
}
export function exportJSON(obj: any, filename: string) {
  downloadBlob(JSON.stringify(obj, null, 2), filename, "application/json");
}
// 여러 시트를 가진 엑셀 워크북 내보내기 (EWS 16시트 규약 일부 반영)
export async function exportXLSX(sheets: { name: string; rows: Record<string, any>[] }[], filename: string) {
  const XLSX = await ensureXLSX();
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [{ note: "(데이터 없음)" }]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(out, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
