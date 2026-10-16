export function acfPacf(xin: number[], maxLag = 12): { acf: number[]; pacf: number[] } {
  const m = xin.reduce((a, b) => a + b, 0) / xin.length; const x = xin.map((v) => v - m); const n = x.length; maxLag = Math.min(maxLag, n - 1);
  let c0 = 0; for (const v of x) c0 += v * v; c0 /= n; const acf = [1];
  for (let k = 1; k <= maxLag; k++) { let ck = 0; for (let i = 0; i < n - k; i++) ck += x[i] * x[i + k]; ck /= n; acf.push(c0 > 0 ? ck / c0 : 0); }
  const pacf = [1]; let prev: number[] = [];
  for (let k = 1; k <= maxLag; k++) {
    let phi: number[]; let kk: number;
    if (k === 1) { kk = acf[1]; phi = [kk]; } else {
      let num = acf[k], den = 1; for (let j = 0; j < prev.length; j++) { num -= prev[j] * acf[k - 1 - j]; den -= prev[j] * acf[j + 1]; }
      kk = den !== 0 ? num / den : 0; phi = prev.map((v, j) => v - kk * prev[prev.length - 1 - j]); phi.push(kk);
    }
    pacf.push(kk); prev = phi;
  }
  return { acf, pacf };
}
