/**
 * Pure TS matrix helpers — no DOM / window.
 * Shared by browser and Node (stats-core).
 */

export type Matrix = number[][];

export function zeros(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function identity(n: number): Matrix {
  const I = zeros(n, n);
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}

export function clone(A: Matrix): Matrix {
  return A.map((r) => r.slice());
}

export function transpose(A: Matrix): Matrix {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  const T = zeros(n, m);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) T[j][i] = A[i][j];
  return T;
}

export function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length;
  const k = A[0]?.length ?? 0;
  const n = B[0]?.length ?? 0;
  if (k !== B.length) throw new Error(`matMul shape: ${m}×${k} · ${B.length}×${n}`);
  const C = zeros(m, n);
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      const aip = A[i][p];
      if (aip === 0) continue;
      for (let j = 0; j < n; j++) C[i][j] += aip * B[p][j];
    }
  }
  return C;
}

export function matVec(A: Matrix, x: number[]): number[] {
  return A.map((row) => row.reduce((s, aij, j) => s + aij * x[j], 0));
}

export function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function norm2(x: number[]): number {
  return Math.sqrt(dot(x, x));
}

export function meanCol(X: Matrix): number[] {
  const n = X.length;
  const p = X[0]?.length ?? 0;
  const m = Array(p).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) m[j] += X[i][j];
  return m.map((v) => v / (n || 1));
}

/** Center columns in place; returns column means. */
export function centerColumns(X: Matrix): number[] {
  const means = meanCol(X);
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < means.length; j++) X[i][j] -= means[j];
  }
  return means;
}
