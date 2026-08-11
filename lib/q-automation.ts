// Q 방법론 자동화 엔진(클라이언트 전용) — methodos-f15.
// 원전: Stephenson(1968) The Study of Behavior; McKeown & Thomas, Q Methodology 2e.
// 진짜 Q 분석을 수행: 담론모집단→Q표본→P표본→Q소트 행렬→상관→요인추출(고유분해)→베리맥스 회전→
//   요인적재·플래깅→요인배열(z·순위)→구별진술/합의진술→요인(관점) 해석.
// 무거운 텍스트 파서는 ca-automation 재사용(불러오기·정제·문장분리·중복제거).
import { CorpusDoc, Unit, segmentUnits, dedupeUnits } from "./ca-automation";

// ── 담론모집단 → Q표본 진술문 ──
export interface QStatement { id: string; text: string; }
export function buildConcourse(docs: CorpusDoc[]): Unit[] {
  return dedupeUnits(segmentUnits(docs)).filter((u) => u.text.length >= 8);
}
// 구조화 Q표본 선정: 길이·어휘 다양성 기준 대표 진술 N개(중복 의미 최소화)
export function selectQSample(units: Unit[], n = 30): QStatement[] {
  const scored = units.map((u) => ({ u, score: new Set(u.text.replace(/\s/g, "")).size + u.text.length * 0.1 }));
  // 균등 간격 추출로 분포 편향 완화
  const sorted = scored.sort((a, b) => b.score - a.score);
  const pick = sorted.slice(0, Math.min(n * 2, sorted.length));
  const step = Math.max(1, Math.floor(pick.length / n));
  const out: QStatement[] = [];
  for (let i = 0; i < pick.length && out.length < n; i += step) out.push({ id: "S" + String(out.length + 1).padStart(2, "0"), text: pick[i].u.text });
  return out;
}

// ── P표본(참여자) ──
export interface QParticipant { id: string; label: string; source: string; }
export function buildPSet(docs: CorpusDoc[]): QParticipant[] {
  return docs.map((d, i) => ({ id: "P" + String(i + 1).padStart(2, "0"), label: d.docId, source: d.source }));
}

// ── Q소트 행렬 ──
// matrix[participant][statement] = 강제분포 점수(-m..+m). 텍스트 기반 자동 산출 또는 CSV 임포트.
export interface QSortMatrix { participants: QParticipant[]; statements: QStatement[]; data: number[][]; range: number; }

// 강제분포(준정규) 열 개수 산출: S개 진술을 -m..+m 등급에 배치
function forcedDistribution(S: number): { ranks: number[]; m: number } {
  // 등급 폭 결정(진술 수에 따라 ±2 ~ ±5)
  const m = S <= 12 ? 2 : S <= 24 ? 3 : S <= 40 ? 4 : 5;
  const cols = 2 * m + 1;
  // 준정규 가중치
  const weights = Array.from({ length: cols }, (_, i) => { const x = (i - m) / (m || 1); return Math.exp(-1.6 * x * x); });
  const wsum = weights.reduce((a, b) => a + b, 0);
  let counts = weights.map((w) => Math.max(1, Math.round((w / wsum) * S)));
  // 합을 S로 보정
  let diff = S - counts.reduce((a, b) => a + b, 0);
  while (diff !== 0) { const idx = diff > 0 ? m : counts.indexOf(Math.max(...counts)); counts[idx] += diff > 0 ? 1 : -1; diff += diff > 0 ? -1 : 1; }
  const ranks: number[] = [];
  for (let i = 0; i < cols; i++) for (let k = 0; k < counts[i]; k++) ranks.push(i - m);
  return { ranks: ranks.slice(0, S), m };
}

// 텍스트 기반 자동 Q소트: 참여자 문서와 각 진술의 어휘 중첩 점수 → 강제분포로 정렬
const tok = (t: string) => (t.toLowerCase().match(/[가-힣]{2,}|[a-z]{3,}/g) || []);
export function autoQSort(docs: CorpusDoc[], statements: QStatement[]): QSortMatrix {
  const participants = buildPSet(docs);
  const S = statements.length; const { ranks, m } = forcedDistribution(S);
  const stTokens = statements.map((s) => new Set(tok(s.text)));
  const data = docs.map((d) => {
    const dt = new Set(tok(d.text));
    // 각 진술의 살enience 점수(중첩 + 약간의 결정론적 흔들림)
    const score = stTokens.map((st, j) => { let ov = 0; st.forEach((w) => { if (dt.has(w)) ov++; }); return ov + ((j * 2654435761) % 97) / 970; });
    // 점수 내림차순 → 강제분포 등급 부여
    const order = score.map((sc, j) => ({ j, sc })).sort((a, b) => b.sc - a.sc);
    const row = new Array(S).fill(0);
    order.forEach((o, rankIdx) => { row[o.j] = ranks[ranks.length - 1 - rankIdx] ?? 0; });
    return row;
  });
  return { participants, statements, data, range: m };
}

// CSV 임포트(행=진술, 열=참여자 또는 그 반대 자동 판별)
export function parseQSortCSV(text: string, statements?: QStatement[]): QSortMatrix | null {
  const rows = text.trim().split(/\r?\n/).map((l) => l.split(/[,\t]/).map((c) => c.trim()));
  if (rows.length < 2) return null;
  const num = (v: string) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  // 헤더 제거 추정: 첫 행/첫 열이 라벨
  const body = rows.slice(1).map((r) => r.slice(1));
  const grid = body.map((r) => r.map(num));
  if (grid.some((r) => r.some((c) => c === null))) return null;
  const g = grid as number[][];
  // 행=진술(S) × 열=참여자(P) 가정 → 전치하여 [P][S]
  const Srows = g.length, Pcols = g[0].length;
  const data: number[][] = [];
  for (let p = 0; p < Pcols; p++) data.push(g.map((row) => row[p]));
  const participants: QParticipant[] = Array.from({ length: Pcols }, (_, i) => ({ id: "P" + String(i + 1).padStart(2, "0"), label: rows[0][i + 1] || "P" + (i + 1), source: "CSV" }));
  const sts: QStatement[] = statements && statements.length === Srows ? statements : Array.from({ length: Srows }, (_, i) => ({ id: "S" + String(i + 1).padStart(2, "0"), text: rows[i + 1][0] || "진술 " + (i + 1) }));
  const all = data.flat(); const m = Math.round(Math.max(...all.map(Math.abs)) || 4);
  return { participants, statements: sts, data, range: m };
}

// ── 상관행렬(참여자 간 ) ──
export function pearson(a: number[], b: number[]): number {
  const n = a.length; let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; saa += a[i] * a[i]; sbb += b[i] * b[i]; sab += a[i] * b[i]; }
  const cov = sab - (sa * sb) / n; const va = saa - (sa * sa) / n, vb = sbb - (sb * sb) / n;
  const d = Math.sqrt(va * vb); return d === 0 ? 0 : cov / d;
}
export function correlationMatrix(m: QSortMatrix): number[][] {
  const P = m.data.length; const C = Array.from({ length: P }, () => new Array(P).fill(0));
  for (let i = 0; i < P; i++) for (let j = i; j < P; j++) { const r = i === j ? 1 : pearson(m.data[i], m.data[j]); C[i][j] = r; C[j][i] = r; }
  return C;
}

// ── 대칭행렬 고유분해(Jacobi) ──
function jacobiEigen(Ain: number[][], iter = 100): { values: number[]; vectors: number[][] } {
  const n = Ain.length; const A = Ain.map((r) => r.slice());
  const V: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < iter; sweep++) {
    // 최대 비대각 원소
    let p = 0, q = 1, off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(A[i][j]) > off) { off = Math.abs(A[i][j]); p = i; q = j; }
    if (off < 1e-9) break;
    const app = A[p][p], aqq = A[q][q], apq = A[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app); const c = Math.cos(phi), s = Math.sin(phi);
    for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
    for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
    for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
  }
  const values = A.map((r, i) => r[i]);
  return { values, vectors: V };
}

// ── 요인 추출(상관행렬 → 적재) ──
export interface QFactors { loadings: number[][]; eigenvalues: number[]; nFactors: number; explained: number[]; }
export function extractFactors(corr: number[][], maxF = 4): QFactors {
  const { values, vectors } = jacobiEigen(corr);
  const P = corr.length;
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const totalVar = values.reduce((a, b) => a + Math.max(0, b), 0) || P;
  // Kaiser 기준(eigenvalue>1) + 최대 maxF
  const keep = order.filter((o) => o.v > 1).slice(0, maxF);
  const sel = (keep.length ? keep : order.slice(0, Math.min(2, maxF)));
  const loadings = Array.from({ length: P }, () => new Array(sel.length).fill(0));
  sel.forEach((o, f) => { const sq = Math.sqrt(Math.max(0, o.v)); for (let p = 0; p < P; p++) loadings[p][f] = vectors[p][o.i] * sq; });
  return { loadings, eigenvalues: sel.map((o) => +o.v.toFixed(3)), nFactors: sel.length, explained: sel.map((o) => +((Math.max(0, o.v) / totalVar) * 100).toFixed(1)) };
}

// ── 베리맥스 회전 ──
export function varimax(L: number[][], iter = 30): number[][] {
  const p = L.length, k = L[0]?.length || 0; if (k < 2) return L.map((r) => r.slice());
  let R = L.map((r) => r.slice());
  for (let it = 0; it < iter; it++) {
    let changed = false;
    for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) {
      // 표준 varimax 각도
      let sumU = 0, sumV = 0, sumU2 = 0, sumV2 = 0;
      for (let i = 0; i < p; i++) { const x = R[i][a], y = R[i][b]; const u = x * x - y * y, v = 2 * x * y; sumU += u; sumV += v; sumU2 += u * u - v * v; sumV2 += 2 * u * v; }
      const numr = sumV2 - (2 * sumU * sumV) / p; const denr = sumU2 - (sumU * sumU - sumV * sumV) / p;
      const phi = 0.25 * Math.atan2(numr, denr);
      if (Math.abs(phi) < 1e-6) continue; changed = true;
      const c = Math.cos(phi), s = Math.sin(phi);
      for (let i = 0; i < p; i++) { const x = R[i][a], y = R[i][b]; R[i][a] = c * x + s * y; R[i][b] = -s * x + c * y; }
    }
    if (!changed) break;
  }
  return R;
}

// ── 플래깅(참여자→요인 배정) ──
export interface QFlag { participant: string; factor: number; loading: number; flagged: boolean; }
export function flagParticipants(loadings: number[][], nStatements: number): QFlag[] {
  const thr = Math.max(0.4, 2.58 * (1 / Math.sqrt(Math.max(2, nStatements)))); // 유의 적재 근사
  return loadings.map((row, p) => {
    let best = 0, bestAbs = 0;
    row.forEach((l, f) => { if (Math.abs(l) > bestAbs) { bestAbs = Math.abs(l); best = f; } });
    // 단순구조: 최고적재가 차상위의 2배 이상이면 순수
    const sorted = row.map(Math.abs).sort((a, b) => b - a);
    const pure = sorted.length < 2 || sorted[0] >= 2 * sorted[1];
    return { participant: "P" + String(p + 1).padStart(2, "0"), factor: best, loading: +row[best].toFixed(3), flagged: bestAbs >= thr && pure };
  });
}

// ── 요인배열(z-점수·순위) ──
export interface QFactorArray { factor: number; nLoaders: number; statements: { id: string; text: string; z: number; rank: number }[]; }
export function factorArrays(m: QSortMatrix, loadings: number[][], flags: QFlag[], factorCount: number): QFactorArray[] {
  const out: QFactorArray[] = [];
  for (let f = 0; f < factorCount; f++) {
    const loaders = flags.map((fl, p) => ({ p, fl })).filter((x) => x.fl.flagged && x.fl.factor === f);
    const usedLoaders = loaders.length ? loaders : flags.map((fl, p) => ({ p, fl })).filter((x) => x.fl.factor === f);
    // 가중치 = Spearman-Brown: w = l/(1-l^2)
    const weights = usedLoaders.map((x) => { const l = Math.min(0.99, Math.abs(loadings[x.p][f])); return l / (1 - l * l); });
    const wsum = weights.reduce((a, b) => a + b, 0) || 1;
    const S = m.statements.length;
    const wScore = new Array(S).fill(0);
    usedLoaders.forEach((x, k) => { for (let s = 0; s < S; s++) wScore[s] += m.data[x.p][s] * weights[k]; });
    for (let s = 0; s < S; s++) wScore[s] /= wsum;
    // z 표준화
    const mean = wScore.reduce((a, b) => a + b, 0) / S; const sd = Math.sqrt(wScore.reduce((a, b) => a + (b - mean) ** 2, 0) / S) || 1;
    const z = wScore.map((v) => (v - mean) / sd);
    // 강제분포 순위 부여
    const { ranks } = forcedDistribution(S);
    const order = z.map((zv, s) => ({ s, zv })).sort((a, b) => b.zv - a.zv);
    const rank = new Array(S).fill(0); order.forEach((o, i) => { rank[o.s] = ranks[ranks.length - 1 - i] ?? 0; });
    out.push({ factor: f, nLoaders: usedLoaders.length, statements: m.statements.map((st, s) => ({ id: st.id, text: st.text, z: +z[s].toFixed(2), rank: rank[s] })) });
  }
  return out;
}

// ── 구별진술 / 합의진술 ──
export interface QDistinguishing { id: string; text: string; perFactor: number[]; type: "distinguishing" | "consensus"; factor?: number; }
export function distinguishingStatements(arrays: QFactorArray[]): QDistinguishing[] {
  if (!arrays.length) return [];
  const S = arrays[0].statements.length; const out: QDistinguishing[] = [];
  for (let s = 0; s < S; s++) {
    const zs = arrays.map((a) => a.statements[s].z); const max = Math.max(...zs), min = Math.min(...zs);
    const spread = max - min;
    const st = arrays[0].statements[s];
    if (spread >= 1.0) { const f = zs.indexOf(max); out.push({ id: st.id, text: st.text, perFactor: zs, type: "distinguishing", factor: f }); }
    else if (spread <= 0.5) out.push({ id: st.id, text: st.text, perFactor: zs, type: "consensus" });
  }
  return out;
}

// ── 요인(관점) 해석 ──
export interface QInterpretation { factor: number; nLoaders: number; explained: number; high: string[]; low: string[]; label: string; narrative: string; }
export function interpretFactors(arrays: QFactorArray[], factors: QFactors): QInterpretation[] {
  return arrays.map((a) => {
    const sorted = [...a.statements].sort((x, y) => y.z - x.z);
    // 두드러지는 진술: 표준점수(Z) +1 이상(강한 동의) / -1 이하(강한 비동의)
    const strongHigh = sorted.filter((s) => s.z >= 1);
    const strongLow = sorted.filter((s) => s.z <= -1).reverse();
    const high = (strongHigh.length ? strongHigh : sorted.slice(0, 3)).slice(0, 4).map((s) => s.text);
    const low = (strongLow.length ? strongLow : sorted.slice(-3).reverse()).slice(0, 4).map((s) => s.text);
    const label = `제${a.factor + 1}유형`;
    const narrative = `${label}(적재 ${a.nLoaders}명, 설명변량 ${factors.explained[a.factor] ?? "-"}%) — Z +1 이상으로 강하게 동의하는 진술은 “${(high[0] || "").slice(0, 40)}” 등이고, Z −1 이하로 강하게 비동의하는 진술은 “${(low[0] || "").slice(0, 40)}” 등이다. 이 유형은 위 진술들이 공유하는 인식의 방향으로 특징지어지며, 그 핵심을 따 유형명을 부여할 수 있다.`;
    return { factor: a.factor, nLoaders: a.nLoaders, explained: factors.explained[a.factor] ?? 0, high, low, label, narrative };
  });
}

// ── 전체 파이프라인 한 번에(편의) ──
export interface QResult {
  matrix: QSortMatrix; corr: number[][]; factors: QFactors; rotated: number[][];
  flags: QFlag[]; arrays: QFactorArray[]; distinguishing: QDistinguishing[]; interpretation: QInterpretation[];
}
export function runQAnalysis(m: QSortMatrix, maxF = 3): QResult {
  const corr = correlationMatrix(m);
  const factors = extractFactors(corr, maxF);
  const rotated = varimax(factors.loadings);
  const flags = flagParticipants(rotated, m.statements.length);
  const arrays = factorArrays(m, rotated, flags, factors.nFactors);
  const distinguishing = distinguishingStatements(arrays);
  const interpretation = interpretFactors(arrays, factors);
  return { matrix: m, corr, factors: { ...factors, loadings: rotated }, rotated, flags, arrays, distinguishing, interpretation };
}
