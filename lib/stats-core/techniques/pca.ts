/**
 * B-03 seed — PCA via Jacobi on correlation / covariance matrix.
 */
import { type Matrix, zeros, meanCol } from "../linalg/matrix";
import { jacobiEigen } from "../linalg/jacobi";

export type PcaResult = {
  values: number[];
  vectors: Matrix;
  explained: number[];
  cumulative: number[];
  kmoApprox?: number;
};

export function covariance(X: Matrix): Matrix {
  const n = X.length;
  const p = X[0]?.length ?? 0;
  const means = meanCol(X);
  const C = zeros(p, p);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      const da = X[i][a] - means[a];
      for (let b = a; b < p; b++) {
        C[a][b] += da * (X[i][b] - means[b]);
      }
    }
  }
  const d = Math.max(1, n - 1);
  for (let a = 0; a < p; a++) {
    for (let b = a; b < p; b++) {
      C[a][b] /= d;
      C[b][a] = C[a][b];
    }
  }
  return C;
}

export function correlationFromCov(C: Matrix): Matrix {
  const p = C.length;
  const R = zeros(p, p);
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      const d = Math.sqrt(C[i][i] * C[j][j]);
      R[i][j] = d > 0 ? C[i][j] / d : i === j ? 1 : 0;
    }
  }
  return R;
}

export function pcaJacobi(X: Matrix, useCorrelation = true): PcaResult {
  const C = covariance(X);
  const S = useCorrelation ? correlationFromCov(C) : C;
  const { values, vectors } = jacobiEigen(S);
  const total = values.reduce((a, v) => a + Math.max(0, v), 0) || 1;
  const explained = values.map((v) => Math.max(0, v) / total);
  const cumulative: number[] = [];
  let acc = 0;
  for (const e of explained) {
    acc += e;
    cumulative.push(acc);
  }
  return { values, vectors, explained, cumulative };
}
