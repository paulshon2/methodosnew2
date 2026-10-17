/** 자료 준비 — 분석 실행 앞에서 쓰는 가벼운 변환(사례 선택·역코딩·재부호화·중심화·표준화·로그·문항 평균). 모두 브라우저 안에서 한다. */
import { parseCSV, mean, sd, type Table } from "./core";

export type PrepOp =
  | { kind: "select"; variable: string; op: "=" | "≠" | ">" | "≥" | "<" | "≤"; value: string }
  | { kind: "reverse"; variable: string; min: number; max: number; name?: string }
  | { kind: "recode"; variable: string; map: string; name?: string }
  | { kind: "center"; variable: string; name?: string }
  | { kind: "standardize"; variable: string; name?: string }
  | { kind: "log"; variable: string; name?: string }
  | { kind: "itemMean"; variables: string[]; name: string };

const esc = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function tableToCsv(t: Table): string {
  const lines = [t.headers.map(esc).join(",")];
  for (let i = 0; i < t.n; i++) lines.push(t.headers.map((h) => esc(t.cols[h][i])).join(","));
  return lines.join("\n");
}
const numOf = (v: unknown) => (typeof v === "number" ? v : v === null || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null);

function addCol(t: Table, name: string, vals: (number | string | null)[]) { if (!t.headers.includes(name)) t.headers.push(name); t.cols[name] = vals; }

/** 변환 한 단계를 적용하고, 새 CSV 와 한 줄 기록을 돌려준다. */
export function applyPrep(csv: string, op: PrepOp): { csv: string; log: string } {
  const t = parseCSV(csv);
  const need = (v: string) => { if (!t.cols[v]) throw new Error(`변수 「${v}」 이(가) 자료에 없습니다.`); };
  if (op.kind === "select") {
    need(op.variable); const col = t.cols[op.variable]; const target = op.value.trim(); const tn = Number(target);
    const keep = col.map((v) => {
      if (v === null) return false;
      const numeric = typeof v === "number" && Number.isFinite(tn) && target !== "";
      const a: any = numeric ? v : String(v), b: any = numeric ? tn : target;
      switch (op.op) { case "=": return a === b; case "≠": return a !== b; case ">": return a > b; case "≥": return a >= b; case "<": return a < b; default: return a <= b; }
    });
    const n = keep.filter(Boolean).length; if (!n) throw new Error("조건에 맞는 사례가 없습니다.");
    const out: Table = { headers: t.headers.slice(), cols: {}, n };
    for (const h of t.headers) out.cols[h] = t.cols[h].filter((_, i) => keep[i]);
    return { csv: tableToCsv(out), log: `사례 선택: ${op.variable} ${op.op} ${op.value} → ${n}/${t.n}사례` };
  }
  if (op.kind === "itemMean") {
    op.variables.forEach(need); if (op.variables.length < 2) throw new Error("문항을 둘 이상 고르세요.");
    const vals = Array.from({ length: t.n }, (_, i) => { const xs = op.variables.map((v) => numOf(t.cols[v][i])); return xs.every((x) => x !== null) ? mean(xs as number[]) : null; });
    addCol(t, op.name, vals); return { csv: tableToCsv(t), log: `문항 평균: ${op.variables.join("·")} → ${op.name}` };
  }
  need(op.variable); const col = t.cols[op.variable].map(numOf);
  if (op.kind === "reverse") { const name = op.name || `${op.variable}_역`; addCol(t, name, col.map((x) => (x === null ? null : op.min + op.max - x))); return { csv: tableToCsv(t), log: `역코딩: ${op.variable} (${op.min}~${op.max}) → ${name}` }; }
  if (op.kind === "recode") {
    const pairs = new Map<string, string>(); for (const part of op.map.split(/[;\n]+/)) { const [a, b] = part.split("="); if (a !== undefined && b !== undefined) pairs.set(a.trim(), b.trim()); }
    if (!pairs.size) throw new Error("재부호화 규칙을 `1=3; 2=2` 꼴로 적어 주세요.");
    const name = op.name || `${op.variable}_재`; addCol(t, name, t.cols[op.variable].map((v) => { if (v === null) return null; const m = pairs.get(String(v)); const r = m === undefined ? String(v) : m; return Number.isFinite(Number(r)) && r !== "" ? Number(r) : r; }));
    return { csv: tableToCsv(t), log: `재부호화: ${op.variable} (${[...pairs].map(([a, b]) => `${a}→${b}`).join(", ")}) → ${name}` };
  }
  const xs = col.filter((x): x is number => x !== null); if (xs.length < 2) throw new Error("수치 값이 모자랍니다.");
  if (op.kind === "center") { const m = mean(xs); const name = op.name || `${op.variable}_중심`; addCol(t, name, col.map((x) => (x === null ? null : x - m))); return { csv: tableToCsv(t), log: `평균 중심화: ${op.variable} → ${name}` }; }
  if (op.kind === "standardize") { const m = mean(xs), s = sd(xs) || 1; const name = op.name || `${op.variable}_z`; addCol(t, name, col.map((x) => (x === null ? null : (x - m) / s))); return { csv: tableToCsv(t), log: `표준화(z): ${op.variable} → ${name}` }; }
  const name = op.name || `${op.variable}_로그`; if (xs.some((x) => x <= 0)) throw new Error("로그는 0보다 큰 값에만 쓸 수 있습니다.");
  addCol(t, name, col.map((x) => (x === null ? null : Math.log(x)))); return { csv: tableToCsv(t), log: `자연로그: ${op.variable} → ${name}` };
}
