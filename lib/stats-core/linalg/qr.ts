/**
 * Thin QR via modified Gram–Schmidt (column-pivoting optional later).
 * Prefer QR over normal equations for regression (NIST Longley / Filip).
 */
import { type Matrix, zeros, clone, matMul, transpose } from "./matrix";

export type QRResult = { Q: Matrix; R: Matrix };

export function qrThin(A: Matrix): QRResult {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  const Q = zeros(m, n);
  const R = zeros(n, n);
  const V = clone(A);

  for (let j = 0; j < n; j++) {
    const v = V.map((row) => row[j]);
    for (let i = 0; i < j; i++) {
      let rij = 0;
      for (let k = 0; k < m; k++) rij += Q[k][i] * v[k];
      R[i][j] = rij;
      for (let k = 0; k < m; k++) v[k] -= rij * Q[k][i];
    }
    let norm = 0;
    for (let k = 0; k < m; k++) norm += v[k] * v[k];
    norm = Math.sqrt(norm);
    R[j][j] = norm;
    if (norm < 1e-15) {
      for (let k = 0; k < m; k++) Q[k][j] = 0;
    } else {
      for (let k = 0; k < m; k++) Q[k][j] = v[k] / norm;
    }
  }
  return { Q, R };
}

/** Solve R x = b for upper-triangular R (n×n). */
export function backSubst(R: Matrix, b: number[]): number[] {
  const n = b.length;
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= R[i][j] * x[j];
    const d = R[i][i];
    if (Math.abs(d) < 1e-15) throw new Error("backSubst: singular R");
    x[i] = s / d;
  }
  return x;
}

/** Least squares: min ‖A β − y‖ via QR. A is m×n, y length m. */
export function lstsqQR(A: Matrix, y: number[]): number[] {
  const { Q, R } = qrThin(A);
  const n = R.length;
  const qty = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < Q.length; i++) s += Q[i][j] * y[i];
    qty[j] = s;
  }
  return backSubst(R, qty);
}

/** Reconstruct A ≈ Q R (debug / oracle). */
export function reconstruct(Q: Matrix, R: Matrix): Matrix {
  return matMul(Q, R);
}

export function qrResidualNorm(A: Matrix, y: number[], beta: number[]): number {
  let sse = 0;
  for (let i = 0; i < A.length; i++) {
    let pred = 0;
    for (let j = 0; j < beta.length; j++) pred += A[i][j] * beta[j];
    const e = y[i] - pred;
    sse += e * e;
  }
  return Math.sqrt(sse);
}

export { transpose };
