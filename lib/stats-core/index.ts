/**
 * Dispatch table for server/browser shared techniques (skeleton for 47).
 */
import { olsQR, parseNumericTable, type OlsResult } from "./techniques/ols";
import { mediationBootstrap, type MediationResult } from "./techniques/mediation";
import { pcaJacobi, type PcaResult } from "./techniques/pca";
import { erf, betainc, gammainc, lgamma, normalCdf } from "./special";
import type { Matrix } from "./linalg/matrix";

export type StatsComputeRequest = {
  code: string;
  payload: Record<string, unknown>;
};

export type StatsComputeResult = {
  code: string;
  ok: true;
  result: unknown;
  meta?: Record<string, unknown>;
};

export type StatsComputeError = {
  code: string;
  ok: false;
  error: string;
};

export type StatsComputeResponse = StatsComputeResult | StatsComputeError;

/** strictNullChecks가 꺼져 있어 ok 판별만으로는 좁혀지지 않으므로 in 연산자로 꺼낸다. */
export function statsErrorMessage(res: StatsComputeResponse): string {
  return "error" in res ? res.error : "";
}

function asNumMatrix(v: unknown): Matrix {
  if (!Array.isArray(v) || !v.length || !Array.isArray(v[0])) {
    throw new Error("expected number[][] matrix");
  }
  return v.map((row) => (row as unknown[]).map((x) => Number(x)));
}

function asNumVec(v: unknown): number[] {
  if (!Array.isArray(v)) throw new Error("expected number[]");
  return v.map((x) => Number(x));
}

/**
 * Run a technique by code. Pure — safe in browser or Node.
 * onProgress used by long jobs (E-06).
 */
export function runStatsTechnique(
  code: string,
  payload: Record<string, unknown>,
  onProgress?: (p: number) => void,
): StatsComputeResponse {
  try {
    switch (code) {
      case "E-01":
      case "E-02": {
        let X: Matrix;
        let y: number[];
        if (payload.headers && payload.rows && payload.yCol && payload.xCols) {
          const parsed = parseNumericTable(
            payload.headers as string[],
            payload.rows as string[][],
            payload.yCol as string,
            payload.xCols as string[],
          );
          X = parsed.X;
          y = parsed.y;
        } else {
          X = asNumMatrix(payload.X);
          y = asNumVec(payload.y);
        }
        const intercept = payload.intercept !== false;
        const result: OlsResult = olsQR(X, y, intercept);
        return { code, ok: true, result, meta: { n: result.n, k: result.k } };
      }
      case "E-06": {
        const x = asNumVec(payload.x);
        const m = asNumVec(payload.m);
        const y = asNumVec(payload.y);
        const B = Number(payload.B ?? 5000);
        const seed = Number(payload.seed ?? 42);
        const result: MediationResult = mediationBootstrap(x, m, y, B, seed, onProgress);
        return { code, ok: true, result, meta: { B: result.B } };
      }
      case "B-03": {
        const X = asNumMatrix(payload.X);
        const useCorrelation = payload.useCorrelation !== false;
        const result: PcaResult = pcaJacobi(X, useCorrelation);
        return { code, ok: true, result };
      }
      case "special.selftest": {
        // Analytic anchors from verification stack
        const checks = {
          phi0: normalCdf(0),
          betainc11: betainc(0.3, 1, 1),
          erf0: erf(0),
          lgamma5: lgamma(5), // 4! = 24 → ln
          gammaincChi2df2: gammainc(1, 1), // smoke
        };
        return { code, ok: true, result: checks };
      }
      default:
        return { code, ok: false, error: `technique not implemented in stats-core yet: ${code}` };
    }
  } catch (e) {
    return { code, ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export * from "./linalg/matrix";
export * from "./linalg/qr";
export * from "./linalg/cholesky";
export * from "./linalg/jacobi";
export * from "./special";
export * from "./techniques/ols";
export * from "./techniques/mediation";
export * from "./techniques/pca";
export * from "./techniques/assumptions";
export * from "./techniques/effects";
