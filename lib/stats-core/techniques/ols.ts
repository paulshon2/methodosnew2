/**
 * E-01 / E-02 — OLS via QR (never normal equations for ill-conditioned X).
 */
import { type Matrix } from "../linalg/matrix";
import { lstsqQR, qrThin, backSubst } from "../linalg/qr";
import { studentTPValue } from "../special";

export type OlsResult = {
  beta: number[];
  residuals: number[];
  fitted: number[];
  r2: number;
  adjR2: number;
  n: number;
  k: number;
  sse: number;
  sst: number;
  /** ‖Xᵀe‖ — must be ≈0 for a correct QR fit */
  xtxeNorm: number;
  /** Σe — ≈0 when intercept is included */
  residualSum: number;
  se: number[];
  tStats: number[];
  pValues: number[];
};

export function designMatrix(X: Matrix, intercept = true): Matrix {
  if (!intercept) return X.map((r) => r.slice());
  return X.map((r) => [1, ...r]);
}

export function olsQR(Xraw: Matrix, y: number[], intercept = true): OlsResult {
  const n = y.length;
  if (Xraw.length !== n) throw new Error("olsQR: X/y length mismatch");
  const X = designMatrix(Xraw, intercept);
  const k = X[0].length;
  const beta = lstsqQR(X, y);

  const fitted = Array(n);
  const residuals = Array(n);
  let ybar = 0;
  for (let i = 0; i < n; i++) ybar += y[i];
  ybar /= n || 1;

  let sse = 0;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    let pred = 0;
    for (let j = 0; j < k; j++) pred += X[i][j] * beta[j];
    fitted[i] = pred;
    const e = y[i] - pred;
    residuals[i] = e;
    sse += e * e;
    sst += (y[i] - ybar) ** 2;
  }

  const r2 = sst > 0 ? 1 - sse / sst : 0;
  const adjR2 = n > k ? 1 - (1 - r2) * ((n - 1) / (n - k)) : r2;
  const sigma2 = n > k ? sse / (n - k) : NaN;

  const xtxe = Array(k).fill(0);
  for (let j = 0; j < k; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += X[i][j] * residuals[i];
    xtxe[j] = s;
  }
  const xtxeNorm = Math.sqrt(xtxe.reduce((a, v) => a + v * v, 0));
  const residualSum = residuals.reduce((a, e) => a + e, 0);

  const se = Array(k).fill(NaN);
  const tStats = Array(k).fill(NaN);
  const pValues = Array(k).fill(NaN);
  if (Number.isFinite(sigma2)) {
    const { R } = qrThin(X);
    for (let j = 0; j < k; j++) {
      const ej = Array(k).fill(0);
      ej[j] = 1;
      // (RᵀR)⁻¹ ej: forward-solve Rᵀ z = ej, then back-solve R v = z
      const z = Array(k).fill(0);
      for (let i = 0; i < k; i++) {
        let s = ej[i];
        for (let p = 0; p < i; p++) s -= R[p][i] * z[p];
        const d = R[i][i];
        if (Math.abs(d) < 1e-15) continue;
        z[i] = s / d;
      }
      const v = backSubst(R, z);
      const varj = sigma2 * v[j];
      se[j] = Math.sqrt(Math.max(0, varj));
      tStats[j] = se[j] > 0 ? beta[j] / se[j] : NaN;
      pValues[j] = Number.isFinite(tStats[j]) ? studentTPValue(tStats[j], n - k) : NaN;
    }
  }

  return {
    beta,
    residuals,
    fitted,
    r2,
    adjR2,
    n,
    k,
    sse,
    sst,
    xtxeNorm,
    residualSum,
    se,
    tStats,
    pValues,
  };
}

export function parseNumericTable(
  headers: string[],
  rows: string[][],
  yCol: string,
  xCols: string[],
): { X: Matrix; y: number[] } {
  const yi = headers.indexOf(yCol);
  const xis = xCols.map((c) => headers.indexOf(c));
  if (yi < 0 || xis.some((i) => i < 0)) throw new Error("column not found");
  const X: Matrix = [];
  const y: number[] = [];
  for (const r of rows) {
    const yv = parseFloat(r[yi]);
    if (!Number.isFinite(yv)) continue;
    const xv: number[] = [];
    let ok = true;
    for (const xi of xis) {
      const v = parseFloat(r[xi]);
      if (!Number.isFinite(v)) {
        ok = false;
        break;
      }
      xv.push(v);
    }
    if (!ok) continue;
    X.push(xv);
    y.push(yv);
  }
  return { X, y };
}
