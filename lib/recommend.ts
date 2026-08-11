// 추천 엔진 (원칙3) — recommend.js TS 이식.
import type { Method, Goal } from "@/lib/types";

const W = { aim: 0.45, causality: 0.18, primary: 0.12, capacity: 0.13, time: 0.07, budget: 0.05 };

export interface Intake {
  aims: string[]; needs_causality: boolean; has_primary_data: boolean | null;
  sample: number | null; team: number | null; time_pref: string; budget_pref: string;
}
export interface RecRow {
  id: string; name: string; name_ko?: string | null; family: string;
  match: number; reasons: string[]; counter_reasons: string[];
}

let GOALS: Goal[] = [];
export function setGoals(g: Goal[]) { GOALS = g || []; }
const label = (g: string) => GOALS.find((o) => o.id === g)?.label || g;
const pct = (v: number) => Math.round(v * 100) + "%";

function scoreMethod(m: Method, intake: Intake): RecRow {
  const fit = m.recommendation?.fit || {};
  const flags = m.recommendation?.flags || {};
  const reasons: string[] = [], counters: string[] = [];
  let s = 0;
  const aims = intake.aims?.length ? intake.aims : [];
  let aimFit = 0, bestGoal: string | null = null;
  aims.forEach((g) => { const v = fit[g] || 0; if (v > aimFit) { aimFit = v; bestGoal = g; } });
  if (aims.length > 1) {
    const covered = aims.filter((g) => (fit[g] || 0) >= 0.5).length;
    aimFit = Math.min(1, aimFit + 0.05 * Math.max(0, covered - 1));
  }
  s += W.aim * aimFit;
  if (aimFit >= 0.8 && bestGoal) reasons.push(`연구목적 '${label(bestGoal)}'에 강하게 부합 (${pct(aimFit)})`);
  else if (aims.length && aimFit <= 0.3) counters.push(`선택한 연구목적에 약함 (${pct(aimFit)})`);

  let cau = 1;
  if (intake.needs_causality) {
    cau = flags.supports_causality ? 1 : 0;
    if (flags.supports_causality) reasons.push("인과추론을 지원");
    else counters.push("인과추론을 지원하지 않음 (관찰/기술/종합 계열)");
  }
  s += W.causality * cau;

  let prim = 1;
  if (flags.needs_primary_data && intake.has_primary_data === false) { prim = 0.2; counters.push("1차 자료 수집이 필요한데 미보유"); }
  else if (!flags.needs_primary_data) { prim = 1; if (aims.includes("synthesize_literature")) reasons.push("기존 문헌만으로 수행 가능"); }
  s += W.primary * prim;

  let cap = 1;
  const minS = flags.min_sample, minT = flags.min_team;
  if (minS && intake.sample != null && Number(intake.sample) < Number(minS)) { cap -= 0.5; counters.push(`표본 부족 (권장 ≥ ${minS})`); }
  else if (minS) reasons.push(`표본 요건 충족 (권장 ≥ ${minS})`);
  if (minT && intake.team != null && Number(intake.team) < Number(minT)) { cap -= 0.3; counters.push(`인력 부족 (권장 ≥ ${minT}명)`); }
  s += W.capacity * Math.max(0, cap);

  let time = 1;
  if (intake.time_pref === "low") { time = flags.low_time_ok ? 1 : 0.5; if (flags.low_time_ok) reasons.push("단기 수행에 적합"); }
  s += W.time * time;

  let bud = 1;
  if (intake.budget_pref === "low") { bud = flags.low_budget_ok ? 1 : 0.7; if (flags.low_budget_ok) reasons.push("저비용 수행 가능"); }
  s += W.budget * bud;

  if (Object.keys(fit).length === 0) counters.push("추천 프로파일 데이터 부족 (수동 검토 권장)");
  return { id: m.id, name: m.name, name_ko: m.name_ko, family: m.family, match: Math.round(s * 100), reasons, counter_reasons: counters };
}

export function recommend(methods: Method[], intake: Intake): RecRow[] {
  return methods.map((m) => scoreMethod(m, intake)).sort((a, b) => b.match - a.match);
}
