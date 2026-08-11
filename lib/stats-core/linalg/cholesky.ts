/**
 * Cholesky L Lᵀ = A for SPD A. Used by Mahalanobis (A-05) paths.
 */
import { type Matrix, zeros } from "./matrix";

export function cholesky(A: Matrix): Matrix {
  const n = A.length;
  const L = zeros(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = 0;
      for (let k = 0; k < j; k++) s += L[i][k] * L[j][k];
      if (i === j) {
        const v = A[i][i] - s;
        if (v <= 0) throw new Error("cholesky: not SPD");
        L[i][j] = Math.sqrt(v);
      } else {
        L[i][j] = (A[i][j] - s) / L[j][j];
      }
    }
  }
  return L;
}

/** Solve A x = b via Cholesky. */
export function solveChol(A: Matrix, b: number[]): number[] {
  const L = cholesky(A);
  const n = b.length;
  const y = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}
