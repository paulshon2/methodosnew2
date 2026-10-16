/** Methodos 43기법 목록 — public/methodos/catalog.json (엔진의 기법 목록·옵션·예제를 묶은 것) */
export interface MSlot { id: string; label: string; description: string; types: string[]; min: number; max: number | null }
export interface MOption { id: string; label: string; type: string; default?: any; step?: number; help?: string; choices?: { value: any; label: string }[] }
export interface MEntry {
  code: string; name: string; english: string; level: string; group: string; menuPath: string; question: string; tagline: string; whenToUse: string; minCases: number;
  box: { k: string; v: string }[]; slots: MSlot[]; options: MOption[]; example: { csv: string; slots: Record<string, string[]>; options: Record<string, any> }; effectSizes: string[];
}
export interface MCatalog { version: string; items: MEntry[] }
export interface MVerification { version: string; engine: string; items: Record<string, { exampleCells: number; exampleMatched: number; cases: number; casesMatched: number; casesEngineError: number; maxRelDiff: number; note?: string }> }

let cache: Promise<MCatalog> | null = null;
export function loadMethodosCatalog(): Promise<MCatalog> {
  if (!cache) cache = fetch("/methodos/catalog.json").then((r) => { if (!r.ok) throw new Error(`카탈로그를 불러오지 못했습니다 (${r.status})`); return r.json(); });
  return cache;
}
let vcache: Promise<MVerification | null> | null = null;
export function loadMethodosVerification(): Promise<MVerification | null> {
  if (!vcache) vcache = fetch("/methodos/verification.json").then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return vcache;
}
export async function loadExampleCsv(entry: MEntry): Promise<string> {
  const r = await fetch(`/methodos/${entry.example.csv}`);
  if (!r.ok) throw new Error("예제 자료를 불러오지 못했습니다.");
  return r.text();
}
