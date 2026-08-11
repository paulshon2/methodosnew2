"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** 눈금은 1/2/5 × 10ⁿ 규칙. 사람이 암산할 수 있는 간격만 쓴다. */
export function ticks(lo: number, hi: number, n = 5): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return [lo, hi].filter(Number.isFinite);
  const step = Math.pow(10, Math.floor(Math.log10((hi - lo) / n)));
  const err = (hi - lo) / n / step;
  const m = err >= 7.5 ? 10 : err >= 3 ? 5 : err >= 1.5 ? 2 : 1;
  const s = m * step;
  const start = Math.ceil(lo / s) * s;
  const out: number[] = [];
  for (let v = start; v <= hi + 1e-9; v += s) out.push(+v.toFixed(6));
  return out;
}

export type Scale = ((v: number) => number) & { domain: [number, number]; range: [number, number]; invert: (px: number) => number };

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const f = ((v: number) => r0 + ((v - d0) / span) * (r1 - r0)) as Scale;
  f.domain = domain;
  f.range = range;
  f.invert = (px: number) => d0 + ((px - r0) / (r1 - r0 || 1)) * span;
  return f;
}

/** 0 기준선을 포함하도록 도메인을 넓힌다 — 막대는 0에서 시작해야 길이가 값이 된다. */
export function niceDomain(values: number[], zeroBaseline = true, pad = 0.08): [number, number] {
  const v = values.filter(Number.isFinite);
  if (v.length === 0) return [0, 1];
  let lo = Math.min(...v);
  let hi = Math.max(...v);
  if (zeroBaseline) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (lo === hi) {
    const d = Math.abs(lo) || 1;
    return [lo - d * 0.5, hi + d * 0.5];
  }
  const p = (hi - lo) * pad;
  return [zeroBaseline && lo === 0 ? 0 : lo - p, hi + p];
}

export function fmtNum(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (a >= 1e4) return (v / 1e3).toFixed(1) + "k";
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(a < 1 ? Math.max(digits, 2) : digits);
}

/** 컨테이너 폭을 재고 리사이즈를 디바운스한다. */
export function useMeasuredWidth(fallback = 720) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(fallback);
  const set = useCallback((n: number) => setW((prev) => (Math.abs(prev - n) > 4 ? n : prev)), []);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver((entries) => {
      const next = Math.max(280, Math.round(entries[0].contentRect.width));
      clearTimeout(t);
      t = setTimeout(() => set(next), 80);
    });
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [set]);
  return { ref, width: w };
}

export function useTicks(domain: [number, number], n = 5) {
  return useMemo(() => ticks(domain[0], domain[1], n), [domain, n]);
}
