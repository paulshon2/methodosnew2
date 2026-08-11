/**
 * Execution-location gate — aligns with Excel 「실행위치(브라우저/서버)」.
 * Pure TS; usable from client workbenches and server routes.
 */

export type StatsExecMode = "browser" | "server-sync" | "server-async";

export type StatsRuntimeInput = {
  /** Technique code e.g. E-02, E-06, B-03 */
  techniqueCode: string;
  /** Sample size (rows) */
  n: number;
  /** Number of predictors / variables */
  p: number;
  /** Bootstrap replications (E-06); 0 if N/A */
  bootstrapB?: number;
};

/** Soft ceilings for sync API (OOM / timeout guard). */
export const STATS_LIMITS = {
  maxN: 50_000,
  maxP: 200,
  maxCells: 50_000 * 200,
  /** Beyond this → prefer server-sync even for stage-1/2 */
  largeCells: 200_000,
  largeP: 80,
  /** E-06 with B ≥ this → server-async */
  asyncBootstrapB: 1000,
} as const;

/** Codes that are inherently heavy (stage-3 matrix / resampling). */
const HEAVY_CODES = new Set([
  "A-05",
  "B-01",
  "B-03",
  "C-05",
  "C-06",
  "C-07",
  "C-08",
  "D-02",
  "D-05",
  "D-06",
  "D-07",
  "E-02",
  "E-03",
  "E-04",
  "E-05",
  "E-06",
  "E-07",
  "E-15",
  "G-03",
  "I-03",
  "I-04",
]);

export function chooseStatsExecMode(input: StatsRuntimeInput): StatsExecMode {
  const n = Math.max(0, input.n | 0);
  const p = Math.max(0, input.p | 0);
  const B = Math.max(0, input.bootstrapB ?? 0);
  const code = (input.techniqueCode || "").toUpperCase();
  const cells = n * Math.max(1, p);

  if (code === "E-06" && B >= STATS_LIMITS.asyncBootstrapB) {
    return "server-async";
  }
  if (B >= STATS_LIMITS.asyncBootstrapB * 2) {
    return "server-async";
  }
  if (cells > STATS_LIMITS.largeCells || p > STATS_LIMITS.largeP) {
    return "server-sync";
  }
  if (HEAVY_CODES.has(code) && cells > 50_000) {
    return "server-sync";
  }
  return "browser";
}

export function assertWithinHardLimits(n: number, p: number): void {
  if (n > STATS_LIMITS.maxN) throw new Error(`n exceeds limit ${STATS_LIMITS.maxN}`);
  if (p > STATS_LIMITS.maxP) throw new Error(`p exceeds limit ${STATS_LIMITS.maxP}`);
  if (n * p > STATS_LIMITS.maxCells) throw new Error(`n*p exceeds cell limit`);
}

/** Client helper: estimate n,p from CSV text (header + rows). */
export function estimateCsvShape(csv: string): { n: number; p: number } {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { n: 0, p: 0 };
  const p = lines[0].split(",").length;
  return { n: lines.length - 1, p };
}
