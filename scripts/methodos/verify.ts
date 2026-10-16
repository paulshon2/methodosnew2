/**
 * Methodos 웹판(TypeScript) ↔ 파이썬 엔진 대조.
 *   npx --yes tsx scripts/methodos/verify.ts [기법코드 ...]
 * reference/cases.json 의 사례마다 TypeScript 계산을 돌려 엔진의 결과표와 칸마다 견주고,
 * public/methodos/verification.json(화면에 보이는 대조 요약)을 갱신한다.
 */
import fs from "node:fs";
import path from "node:path";
import { parseCSV } from "../../lib/methodos/core";
import { runMethodos } from "../../lib/methodos/run";
import { tols, skipCols, sortCols } from "../../lib/methodos/registry";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REF = path.join(HERE, "reference");
const only = new Set(process.argv.slice(2));
interface Case { id: string; kind: "example" | "multi" | "custom"; code: string; csv: string; slots: Record<string, string[]>; options: Record<string, any>; tables: { id: string; cols: string[]; rows: any[][] }[] | null; engineError: string | null }
const cases: Case[] = JSON.parse(fs.readFileSync(path.join(REF, "cases.json"), "utf8"));
const csvCache = new Map<string, any>();
type Stat = { exampleCells: number; exampleMatched: number; cases: number; casesMatched: number; casesEngineError: number; maxRelDiff: number; note?: string; failures: string[] };
const stats: Record<string, Stat> = {};

for (const c of cases) {
  if (only.size && !only.has(c.code)) continue;
  const S = (stats[c.code] ??= { exampleCells: 0, exampleMatched: 0, cases: 0, casesMatched: 0, casesEngineError: 0, maxRelDiff: 0, failures: [] });
  if (c.kind !== "example") S.cases++;
  if (c.engineError || !c.tables) { if (c.kind !== "example") S.casesEngineError++; continue; }
  let table = csvCache.get(c.csv); if (!table) { table = parseCSV(fs.readFileSync(path.join(REF, "data", c.csv), "utf8")); csvCache.set(c.csv, table); }
  let out: any; const t0 = Date.now();
  try { out = runMethodos(c.code, table, c.slots, c.options); } catch (e: any) { S.failures.push(`${c.id}: 오류 ${String(e.message).slice(0, 80)}`); continue; }
  const ms = Date.now() - t0; let bad = 0, tot = 0; const msgs: string[] = []; let maxRel = 0;
  for (const rt of c.tables) {
    const ot = out.tables.find((t: any) => t.id === rt.id); if (!ot) { bad++; msgs.push(`표 없음 ${rt.id}`); continue; }
    if (ot.rows.length !== rt.rows.length) { bad++; msgs.push(`${rt.id}: 줄 ${ot.rows.length}≠${rt.rows.length}`); }
    const sc = sortCols[c.code]?.[rt.id]; if (sc !== undefined) { const g = (a: any, b: any) => a[sc] - b[sc]; ot.rows.sort(g); rt.rows.sort(g); }
    if (c.code === "M37" && rt.id === "mi_pooled") { // 난수 대체 — 추정은 3·SE 안, 대체내 SE 는 25% 안
      for (let i = 0; i < rt.rows.length; i++) { const a = ot.rows[i], b = rt.rows[i]; tot += 2; if (!(Math.abs(a[1] - b[1]) <= 3 * b[2])) { bad++; msgs.push("MI 추정"); } if (!(Math.abs(a[3] - b[3]) <= 0.25 * b[3])) { bad++; msgs.push("MI 대체내 SE"); } }
      continue;
    }
    for (let i = 0; i < Math.min(ot.rows.length, rt.rows.length); i++) for (let j = 0; j < rt.rows[i].length; j++) {
      const name = rt.cols[j];
      if ((skipCols[c.code] ?? []).includes(name)) continue;
      if (c.code === "M43" && rt.id === "model_summary" && (i === 8 || i === 9)) continue;
      if (c.code === "M43" && rt.id === "coefficients" && rt.rows[i][2] === null && (j === 1 || j === 7)) continue;
      if (c.code === "M27" && rt.id === "irt_fit" && i === 3) continue;
      const a = ot.rows[i][j], b = rt.rows[i][j];
      if (typeof b === "string" && b !== "") { tot++; if (String(a) !== b) { bad++; if (msgs.length < 3) msgs.push(`${rt.id}[${i}][${name}] ${a} ≠ ${b}`); } continue; }
      if (typeof b !== "number") continue; tot++;
      const tv: any = tols[c.code]; const tol = typeof tv === "number" ? tv : (tv?.[rt.id] ?? tv?.["*"] ?? 1e-6);
      const rel = typeof a === "number" ? Math.abs(a - b) / Math.max(1, Math.abs(b)) : Infinity;
      if (rel <= tol) { if (rel > maxRel && rel < 1) maxRel = rel; } else { bad++; if (msgs.length < 3) msgs.push(`${rt.id}[${i}][${name}] ${typeof a === "number" ? a.toPrecision(7) : a} ≠ ${b.toPrecision(7)}`); }
    }
  }
  if (c.kind === "example") { S.exampleCells += tot; S.exampleMatched += tot - bad; } else if (bad === 0) S.casesMatched++;
  if (maxRel > S.maxRelDiff) S.maxRelDiff = maxRel;
  if (bad) S.failures.push(`${c.id} (${ms}ms): ${msgs.join(" | ")}`);
}

const NOTES: Record<string, string> = {
  M13: "부트스트랩은 numpy 와 같은 난수열(PCG64)로 재현",
  M36: "부트스트랩은 numpy 와 같은 난수열로 재현, LP 해가 여럿인 표본은 오차 2e-3 허용",
  M31: "유형 번호와 시작 횟수는 난수라 견주지 않음",
  M37: "난수 대체 — 추정은 3·SE, 대체내 SE 는 25% 안으로 견줌",
  M43: "자료가 정하지 못하는 모수·함수 호출 횟수는 견주지 않음",
  M27: "EM 되풀이 횟수는 견주지 않음",
  M39: "처치·시점을 숫자 목록으로 준 옛 방식은 웹판에 없음",
};
let tot = 0, ok = 0, fails = 0;
console.log("기법  예제칸(일치/전체)  다양한 사례(일치/전체)  엔진오류  최대상대오차");
for (const code of Object.keys(stats).sort()) {
  const S = stats[code]; const usable = S.cases - S.casesEngineError;
  console.log(`${code}  ${S.exampleMatched}/${S.exampleCells}   ${S.casesMatched}/${usable}   ${S.casesEngineError}   ${S.maxRelDiff.toExponential(1)}`);
  for (const f of S.failures) console.log("    ✗ " + f);
  tot += S.exampleCells + usable; ok += S.exampleMatched + S.casesMatched; fails += S.failures.length;
}
console.log(`합계: 일치 ${ok} / ${tot} (예제는 칸, 나머지는 사례 단위) · 실패 ${fails}`);
if (!only.size) {
  const items: Record<string, any> = {};
  for (const code of Object.keys(stats).sort()) { const S = stats[code]; items[code] = { exampleCells: S.exampleCells, exampleMatched: S.exampleMatched, cases: S.cases, casesMatched: S.casesMatched, casesEngineError: S.casesEngineError, maxRelDiff: S.maxRelDiff, ...(NOTES[code] ? { note: NOTES[code] } : {}) }; }
  fs.writeFileSync(path.join(HERE, "..", "..", "public", "methodos", "verification.json"), JSON.stringify({ version: "R19-web", engine: "Methodos Basic R19 (Python 3.11, numpy/scipy)", items }, null, 1));
  console.log("public/methodos/verification.json 갱신");
}
process.exitCode = fails ? 1 : 0;
