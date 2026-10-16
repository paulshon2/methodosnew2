/**
 * Methodos 43기법 — 브라우저(또는 Node)에서 바로 도는 진입점.
 * 자료는 이 함수 밖으로 나가지 않는다. 계산식은 Methodos 파이썬 엔진(R19)과 같은 정의를 TypeScript 로 옮긴 것이다.
 */
import { parseCSV, type Table } from "./core";
import { runners } from "./registry";
import type { MResult } from "./types";

export type { MResult, Tbl, Eff, CI } from "./types";
export { parseCSV };
export type { Table };

const first = (v: any) => (Array.isArray(v) ? v[0] : v);
const nums = (v: any): number[] => (Array.isArray(v) ? v : String(v ?? "").split(/[,\s;]+/)).map(Number).filter((x) => Number.isFinite(x));

/** 화면에서 모은 옵션을 계산 함수가 읽는 꼴로 맞춘다. */
export function normalizeOptions(code: string, raw: Record<string, any> = {}): Record<string, any> {
  const o: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) if (v !== "" && v !== null && v !== undefined) o[k] = v;
  if (code === "M34" && o.value_var !== undefined) o.value_var = first(o.value_var);
  if (code === "M39" && o.outcome !== undefined) o.outcome = first(o.outcome);
  if (code === "M38") { if (o.treat !== undefined) o.treat = first(o.treat); if (o.outcome !== undefined) o.outcome = first(o.outcome); }
  if (code === "M36" && o.quantiles !== undefined) o.quantiles = nums(o.quantiles);
  if (code === "M43" && o.start_values !== undefined) o.start_values = nums(o.start_values);
  if ((code === "M28" || code === "M29") && o.structural !== undefined) o.structural = Array.isArray(o.structural) ? o.structural.filter((s: string) => String(s).trim()) : String(o.structural).split(/\r?\n|;/).map((s) => s.trim()).filter(Boolean);
  if (code === "M28" && o.compare_structural !== undefined && !Array.isArray(o.compare_structural)) o.compare_structural = String(o.compare_structural).split(/\r?\n/).filter((s) => s.trim());
  if (["M04", "M13", "M19", "M23", "M24", "M31", "M33", "M35", "M36", "M37", "M42", "M43", "M34", "M22", "M39"].includes(code)) {
    for (const k of ["mu0", "bootstrap_resamples", "event_value", "effect_size", "n_per_group", "power", "alpha", "tails", "groups", "predictors_n", "total_predictors", "df", "max_classes", "n_starts", "n_knots", "m", "prior_mean", "prior_sd", "prior_alpha", "prior_beta", "prior_shape", "prior_rate", "max_iterations", "horizon", "ar_order", "ma_order", "n_factors", "cutoff", "bandwidth", "random_seed"]) {
      if (o[k] !== undefined && typeof o[k] === "string" && o[k].trim() !== "" && Number.isFinite(Number(o[k]))) o[k] = Number(o[k]);
    }
  }
  return o;
}

const FRIENDLY: [RegExp, string][] = [
  [/singular matrix/i, "변수들 사이에 완전한 종속(공선성)이 있거나 값이 모두 같은 변수가 있어 계산할 수 없습니다. 변수를 줄이거나 바꿔 보세요."],
  [/not positive definite/i, "공분산 행렬이 정칙이 아닙니다(변수가 서로 완전히 겹치거나 사례가 모자랍니다). 변수나 사례를 점검해 주세요."],
  [/variable not found/i, "선택한 변수를 자료에서 찾지 못했습니다."],
];
export class MethodosError extends Error {}
function friendly(e: unknown): MethodosError {
  const msg = e instanceof Error ? e.message : String(e);
  for (const [re, text] of FRIENDLY) if (re.test(msg)) return new MethodosError(text);
  if (/Cannot read properties of undefined|undefined/.test(msg)) return new MethodosError("필요한 변수가 모두 배정되지 않았거나 자료 모양이 이 기법과 맞지 않습니다. 변수 배정을 확인해 주세요.");
  return new MethodosError(msg);
}

export function runMethodos(code: string, data: string | Table, slots: Record<string, string[]>, options: Record<string, any> = {}): MResult {
  const fn = runners[code];
  if (!fn) throw new MethodosError(`알 수 없는 기법입니다: ${code}`);
  const table = typeof data === "string" ? parseCSV(data) : data;
  try {
    return fn({ table, slots, options: normalizeOptions(code, options) });
  } catch (e) {
    throw friendly(e);
  }
}
