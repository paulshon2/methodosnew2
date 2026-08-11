/**
 * Jacobi eigenvalue decomposition for symmetric matrices (B-03 / PCA seed).
 */
import { type Matrix, zeros, clone, identity } from "./matrix";

export type EigenResult = { values: number[]; vectors: Matrix };

export function jacobiEigen(Ain: Matrix, maxIter = 100, tol = 1e-12): EigenResult {
  const n = Ain.length;
  const A = clone(Ain);
  const V = identity(n);

  for (let iter = 0; iter < maxIter; iter++) {
    let p = 0;
    let q = 1;
    let max = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = Math.abs(A[i][j]);
        if (a > max) {
          max = a;
          p = i;
          q = j;
        }
      }
    }
    if (max < tol) break;

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    for (let i = 0; i < n; i++) {
      if (i === p || i === q) continue;
      const aip = A[i][p];
      const aiq = A[i][q];
      A[i][p] = A[p][i] = c * aip - s * aiq;
      A[i][q] = A[q][i] = s * aip + c * aiq;
    }
    A[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    A[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    A[p][q] = A[q][p] = 0;

    for (let i = 0; i < n; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = s * vip + c * viq;
    }
  }

  const values = Array.from({ length: n }, (_, i) => A[i][i]);
  const order = values.map((v, i) => i).sort((a, b) => values[b] - values[a]);
  const sortedV = zeros(n, n);
  const sortedVals = order.map((i) => values[i]);
  for (let j = 0; j < n; j++) {
    const src = order[j];
    for (let i = 0; i < n; i++) sortedV[i][j] = V[i][src];
  }
  return { values: sortedVals, vectors: sortedV };
}
