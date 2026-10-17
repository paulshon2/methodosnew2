/* 분석 시각화 부품 1 — 포레스트 · 점·수염 · 막대 · 불릿 · 반원 게이지 · 분포 곡선 · 히트맵 */
import { useState } from "react";
import { AXIS, C, Empty, GRID, INK, INK2, MUTE, BAD, OK, WARN, POS, NEG, cdfNorm, extent, fmt, isNum, lin, niceTicks, pdfChi2, pdfF, pdfNorm, pdfT, qChi2, qF, qNorm, qT, spread, tickFmt, tw, useBox, wrap, t3, clip } from "./core.jsx";

const bandColor = (b) => (b === "ok" ? OK : b === "warn" ? WARN : b === "bad" ? BAD : b);
function logTicks(lo, hi) {
  const cand = [0.01, 0.02, 0.05, 0.1, 0.125, 0.2, 0.25, 0.5, 1, 2, 4, 5, 8, 10, 20, 50, 100, 200, 500, 1000, 5000, 1e4];
  const out = cand.filter((v) => Math.log(v) >= lo - 1e-9 && Math.log(v) <= hi + 1e-9);
  return out.length >= 2 ? out : [Math.exp(lo), Math.exp(hi)];
}

// ───────────────────────── 포레스트 ─────────────────────────
/** rows: {label, est, lo, hi, w?(0~1 정사각형 크기), pooled?, color?, bold?, note?, group?} */
export function Forest({ rows, ref0 = 0, log = false, xLabel, vfmt = (v) => fmt(v, 2), showVals = true, domain, rowH = 30, marks = [] }) {
  const [box, W] = useBox(240, 640);
  const rs = rows.filter((r) => isNum(r.est));
  if (!rs.length) return <Empty />;
  const T = (v) => (log ? Math.log(v) : v);
  const compact = W < 470;   // 좁은 칸: 값 글자를 오른쪽 열 대신 이름 아래 줄에 둔다
  if (compact) showVals = false;
  const lab = rs.map((r) => wrap(r.label, Math.min(W * 0.34, 190), 12, 2));
  const lw = Math.min(Math.round(W * (compact ? 0.3 : 0.36)), Math.max(60, ...lab.map((l) => Math.max(...l.map((s) => tw(s, 12)))))) + 4;
  const vt = (r) => `${vfmt(r.est)}${isNum(r.lo) && isNum(r.hi) ? ` [${vfmt(r.lo)}, ${vfmt(r.hi)}]` : ""}`;
  const vw = showVals ? Math.min(210, Math.max(...rs.map((r) => tw(vt(r), 11.5)))) + 8 : 0;
  const P = { l: lw + 14, r: vw + 10, t: 6, b: 40 }, rh = rs.map((r, i) => Math.max(rowH, lab[i].length * 14 + 10 + (compact ? 14 : 0)));
  const ys = []; rh.reduce((a, h) => { ys.push(a + h / 2); return a + h; }, P.t);
  const H = P.t + P.b + rh.reduce((a, h) => a + h, 0);
  const all = rs.flatMap((r) => [r.est, r.lo, r.hi]).filter(isNum).map(T).concat(isNum(ref0) ? [T(ref0)] : []).concat(marks.map((m) => T(m.x)));
  const [d0, d1] = domain ? [T(domain[0]), T(domain[1])] : extent(all, 0.07);
  const X = lin(d0, d1, P.l, W - P.r);
  const ticks = log ? logTicks(d0, d1).map((v) => ({ v, x: X(Math.log(v)) })) : niceTicks(d0, d1, Math.max(3, Math.floor((W - P.l - P.r) / 80))).map((v) => ({ v, x: X(v) }));
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {ticks.map((t) => <g key={t.v}><line x1={t.x} x2={t.x} y1={P.t} y2={H - P.b + 4} stroke={GRID} /><text x={t.x} y={H - P.b + 18} textAnchor="middle" fontSize={11} className="dv-mute">{tickFmt(t.v)}</text></g>)}
        {xLabel && <text x={(P.l + W - P.r) / 2} y={H - 6} textAnchor="middle" fontSize={11.5}>{xLabel}</text>}
        {isNum(ref0) && <line x1={X(T(ref0))} x2={X(T(ref0))} y1={P.t} y2={H - P.b + 4} stroke={AXIS} strokeDasharray="4 3" />}
        {marks.map((m, i) => <g key={i}><line x1={X(T(m.x))} x2={X(T(m.x))} y1={P.t} y2={H - P.b + 4} stroke={m.color || WARN} strokeDasharray="4 3" /><text x={X(T(m.x))} y={H - P.b + 30} textAnchor="middle" fontSize={10.5} fill={m.color || WARN}>{m.label}</text></g>)}
        {rs.map((r, i) => {
          const y = ys[i], c = r.color || C(r.group ?? 0), has = isNum(r.lo) && isNum(r.hi);
          const sz = r.w != null ? 4 + Math.sqrt(Math.max(0, r.w)) * 9 : 5;
          return (
            <g key={i}>
              {i % 2 === 0 && <rect x={0} y={y - rh[i] / 2} width={W} height={rh[i]} fill={INK} opacity={0.03} rx={6} />}
              <text x={0} y={y - (lab[i].length - 1) * 6.5 - (compact ? 7 : 0)} fontSize={12} className={r.bold || r.pooled ? "dv-strong" : ""} dominantBaseline="central">
                {lab[i].map((s, k) => <tspan key={k} x={0} dy={k ? 14 : 0}>{s}</tspan>)}
              </text>
              {compact && <text x={0} y={y + (lab[i].length - 1) * 7 + 8} fontSize={10.5} className="dv-mute" dominantBaseline="central" style={{ fontVariantNumeric: "tabular-nums" }}>{vt(r)}{r.note ? ` · ${r.note}` : ""}</text>}
              {has && !r.pooled && <><line x1={X(T(r.lo))} x2={X(T(r.hi))} y1={y} y2={y} stroke={c} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} /><line x1={X(T(r.lo))} x2={X(T(r.lo))} y1={y - 4} y2={y + 4} stroke={c} strokeWidth={1.6} /><line x1={X(T(r.hi))} x2={X(T(r.hi))} y1={y - 4} y2={y + 4} stroke={c} strokeWidth={1.6} /></>}
              {r.pooled && has
                ? <polygon points={`${X(T(r.lo))},${y} ${X(T(r.est))},${y - 9} ${X(T(r.hi))},${y} ${X(T(r.est))},${y + 9}`} fill={c} fillOpacity={0.88} stroke={c}><title>{r.label}</title></polygon>
                : r.w != null ? <rect x={X(T(r.est)) - sz / 2} y={y - sz / 2} width={sz} height={sz} rx={2} fill={c}><title>{`${r.label}: ${vt(r)}`}</title></rect>
                  : <circle cx={X(T(r.est))} cy={y} r={sz} fill={c} stroke="var(--dv-card)" strokeWidth={1.6}><title>{`${r.label}: ${vt(r)}`}</title></circle>}
              {showVals && <text x={W - P.r + 10} y={y} fontSize={11.5} dominantBaseline="central" style={{ fontVariantNumeric: "tabular-nums" }}>{vt(r)}{r.note ? ` · ${r.note}` : ""}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ───────────────────────── 점·수염(범주별 평균 ± 구간) ─────────────────────────
/** items: {label, mean, lo?, hi?, n?, color?} — 세로. connect 로 순서 있는 점을 잇는다. */
export function Means({ items, yLabel, ref0, fmtv = (v) => fmt(v, 2), connect = false, height = 270, zero = false }) {
  const [box, W] = useBox(240, 640);
  const rs = items.filter((r) => isNum(r.mean));
  if (!rs.length) return <Empty />;
  const P = { l: 52, r: 16, t: 22, b: 50 }, H = height;
  const [y0, y1] = extent(rs.flatMap((r) => [r.mean, r.lo, r.hi]), 0.14, zero ? [0] : isNum(ref0) ? [ref0] : undefined);
  const Y = lin(y0, y1, H - P.b, P.t), step = (W - P.l - P.r) / rs.length, X = (i) => P.l + step * (i + 0.5);
  const bw = Math.min(70, step * 0.5);
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {niceTicks(y0, y1, 5).map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke={GRID} /><text x={P.l - 8} y={Y(t)} textAnchor="end" fontSize={11} dominantBaseline="central" className="dv-mute">{tickFmt(t)}</text></g>)}
        {yLabel && <text x={12} y={(P.t + H - P.b) / 2} fontSize={11.5} transform={`rotate(-90 12 ${(P.t + H - P.b) / 2})`} textAnchor="middle">{yLabel}</text>}
        {isNum(ref0) && <line x1={P.l} x2={W - P.r} y1={Y(ref0)} y2={Y(ref0)} stroke={AXIS} strokeDasharray="4 3" />}
        {connect && <polyline fill="none" stroke={C(0)} strokeWidth={2} strokeOpacity={0.5} points={rs.map((r, i) => `${X(i)},${Y(r.mean)}`).join(" ")} />}
        {rs.map((r, i) => {
          const c = r.color || C(i), has = isNum(r.lo) && isNum(r.hi);
          return (
            <g key={i}>
              <rect x={X(i) - bw / 2} y={P.t} width={bw} height={H - P.b - P.t} rx={10} fill={c} opacity={0.05} />
              {has && <><line x1={X(i)} x2={X(i)} y1={Y(r.lo)} y2={Y(r.hi)} stroke={c} strokeWidth={3} strokeLinecap="round" opacity={0.8} /><line x1={X(i) - 7} x2={X(i) + 7} y1={Y(r.lo)} y2={Y(r.lo)} stroke={c} strokeWidth={2} /><line x1={X(i) - 7} x2={X(i) + 7} y1={Y(r.hi)} y2={Y(r.hi)} stroke={c} strokeWidth={2} /></>}
              <circle cx={X(i)} cy={Y(r.mean)} r={7} fill={c} stroke="var(--dv-card)" strokeWidth={2}><title>{`${r.label}: ${fmtv(r.mean)}${has ? ` [${fmtv(r.lo)}, ${fmtv(r.hi)}]` : ""}`}</title></circle>
              <text x={X(i) + 12} y={Y(r.mean) - 11} fontSize={12} className="dv-strong">{fmtv(r.mean)}</text>
              <text x={X(i)} y={H - P.b + 18} textAnchor="middle" fontSize={12} className="dv-strong">{clip(r.label, 12)}</text>
              {r.n != null && <text x={X(i)} y={H - P.b + 33} textAnchor="middle" fontSize={11} className="dv-mute">n = {Math.round(r.n)}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ───────────────────────── 막대 ─────────────────────────
/** items: {label, value, color?, note?} — 가로. 음수는 왼쪽으로. marks: [{value,label}] 기준선 */
export function Bars({ items, fmtv = (v) => fmt(v, 2), marks = [], max, min, rowH = 30, colorBySign = false, unit = "" }) {
  const [box, W] = useBox(240, 640);
  const rs = items.filter((r) => isNum(r.value));
  if (!rs.length) return <Empty />;
  const lab = rs.map((r) => wrap(r.label, Math.min(W * 0.34, 180), 12, 2));
  const lw = Math.min(Math.round(W * 0.36), Math.max(50, ...lab.map((l) => Math.max(...l.map((s) => tw(s, 12)))))) + 6;
  const vw = Math.max(...rs.map((r) => tw(fmtv(r.value) + unit + (r.note ? " · " + r.note : ""), 11.5))) + 12;
  const P = { l: lw + 12, r: vw + 4, t: 8, b: marks.length ? 30 : 22 };
  const lo = min ?? Math.min(0, ...rs.map((r) => r.value), ...marks.map((m) => m.value)), hi = max ?? Math.max(0, ...rs.map((r) => r.value), ...marks.map((m) => m.value));
  const X = lin(lo, hi === lo ? lo + 1 : hi, P.l, W - P.r), H = P.t + P.b + rs.length * rowH;
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {niceTicks(lo, hi, 4).map((t) => <g key={t}><line x1={X(t)} x2={X(t)} y1={P.t} y2={H - P.b + 2} stroke={GRID} /><text x={X(t)} y={H - P.b + 15} textAnchor="middle" fontSize={11} className="dv-mute">{tickFmt(t)}</text></g>)}
        {lo < 0 && <line x1={X(0)} x2={X(0)} y1={P.t} y2={H - P.b + 2} stroke={AXIS} />}
        {marks.map((m, i) => <g key={i}><line x1={X(m.value)} x2={X(m.value)} y1={P.t} y2={H - P.b + 2} stroke={m.color || WARN} strokeDasharray="4 3" strokeWidth={1.4} /><text x={X(m.value)} y={H - 2} textAnchor="middle" fontSize={10.5} fill={m.color || WARN}>{m.label}</text></g>)}
        {rs.map((r, i) => {
          const y = P.t + i * rowH + rowH / 2, c = r.color || (colorBySign ? (r.value < 0 ? NEG : POS) : C(0)), x0 = X(0), x1 = X(r.value);
          return (
            <g key={i} className="dv-hov">
              <text x={0} y={y - (lab[i].length - 1) * 6.5} fontSize={12} dominantBaseline="central">{lab[i].map((s, k) => <tspan key={k} x={0} dy={k ? 13 : 0}>{s}</tspan>)}</text>
              <rect x={Math.min(x0, x1)} y={y - 8} width={Math.max(1.5, Math.abs(x1 - x0))} height={16} rx={5} fill={c} opacity={0.9}><title>{`${r.label}: ${fmtv(r.value)}${unit}`}</title></rect>
              <text x={r.value < 0 ? Math.min(x0, x1) - 6 : Math.max(x0, x1) + 7} y={y} fontSize={11.5} dominantBaseline="central" textAnchor={r.value < 0 ? "end" : "start"} className="dv-strong" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtv(r.value)}{unit}{r.note ? <tspan className="dv-mute"> · {r.note}</tspan> : null}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ───────────────────────── 불릿(기준선 띠가 있는 값) ─────────────────────────
/** items: {label, value, lo?, hi?, min, max, bands:[{to,color,label}], target?, fmt?, note?} */
export function Bullets({ items, rowH = 46 }) {
  const [box, W] = useBox(240, 640);
  const rs = items.filter((r) => isNum(r.value));
  if (!rs.length) return <Empty />;
  const lw = Math.min(Math.round(W * 0.28), Math.max(60, ...rs.map((r) => tw(r.label, 12)))) + 6;
  const vw = Math.max(...rs.map((r) => tw((r.fmt || ((v) => fmt(v, 3)))(r.value), 13))) + 18;
  const P = { l: lw + 10, r: vw + 4, t: 6, b: 6 }, H = P.t + P.b + rs.length * rowH;
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {rs.map((r, i) => {
          const y = P.t + i * rowH + rowH / 2, X = lin(r.min, r.max, P.l, W - P.r), f = r.fmt || ((v) => fmt(v, 3));
          let prev = r.min;
          return (
            <g key={i}>
              <text x={0} y={y - 4} fontSize={12} className="dv-strong" dominantBaseline="central">{r.label}</text>
              {r.note && <text x={0} y={y + 11} fontSize={10.5} className="dv-mute" dominantBaseline="central">{clip(r.note, 22)}</text>}
              {(r.bands || []).map((b, k) => { const x0 = X(prev), x1 = X(Math.min(b.to, r.max)); prev = b.to; return <rect key={k} x={x0} y={y - 9} width={Math.max(0, x1 - x0)} height={18} fill={bandColor(b.color)} opacity={0.22} rx={k === 0 ? 5 : 0}><title>{b.label}</title></rect>; })}
              {(r.bands || []).length === 0 && <rect x={P.l} y={y - 9} width={W - P.r - P.l} height={18} fill={INK} opacity={0.06} rx={5} />}
              {(r.bands || []).map((b, k) => <text key={k} x={(X(k ? r.bands[k - 1].to : r.min) + X(Math.min(b.to, r.max))) / 2} y={y - 14} fontSize={9.5} textAnchor="middle" className="dv-mute">{b.label}</text>)}
              {isNum(r.lo) && isNum(r.hi) && <line x1={X(Math.max(r.min, r.lo))} x2={X(Math.min(r.max, r.hi))} y1={y} y2={y} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.22} />}
              <rect x={X(Math.min(Math.max(r.value, r.min), r.max)) - 3.5} y={y - 12} width={7} height={24} rx={3.5} fill={INK}><title>{`${r.label}: ${f(r.value)}`}</title></rect>
              {isNum(r.target) && <line x1={X(r.target)} x2={X(r.target)} y1={y - 12} y2={y + 12} stroke={BAD} strokeWidth={2} strokeDasharray="3 2" />}
              <text x={W - P.r + 12} y={y} fontSize={13} className="dv-strong" dominantBaseline="central" style={{ fontVariantNumeric: "tabular-nums" }}>{f(r.value)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ───────────────────────── 반원 게이지 ─────────────────────────
export function Arc({ value, min = 0, max = 1, label, sub, bands, fmtv = (v) => fmt(v, 3), color }) {
  const W = 260, H = 160, cx = W / 2, cy = 128, R = 98, a0 = Math.PI, th = 16;
  if (!isNum(value)) return <Empty />;
  const f = (v) => a0 + (Math.min(Math.max(v, min), max) - min) / (max - min || 1) * Math.PI;
  const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arc = (r, a, b) => { const [x0, y0] = pt(r, a), [x1, y1] = pt(r, b); return `M${x0} ${y0}A${r} ${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${x1} ${y1}`; };
  const [nx, ny] = pt(R, f(value));
  let prev = min; const segs = (bands || []).map((b) => { const s = { from: prev, to: Math.min(b.to, max), c: bandColor(b.color), label: b.label }; prev = b.to; return s; });
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        <path d={arc(R, a0, a0 + Math.PI)} stroke={INK} strokeOpacity={0.08} strokeWidth={th} fill="none" strokeLinecap="round" />
        {segs.map((s, i) => <path key={i} d={arc(R, f(s.from), f(s.to))} stroke={s.c} strokeOpacity={0.3} strokeWidth={th} fill="none"><title>{s.label}</title></path>)}
        <path d={arc(R, a0, f(value))} stroke={color || C(0)} strokeWidth={th} fill="none" strokeLinecap="round" />
        <circle cx={nx} cy={ny} r={9} fill="var(--dv-card)" stroke={color || C(0)} strokeWidth={3} />
        <text x={cx} y={cy - 22} textAnchor="middle" fontSize={30} className="dv-strong" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtv(value)}</text>
        {label && <text x={cx} y={cy - 2} textAnchor="middle" fontSize={12.5}>{label}</text>}
        {sub && <text x={cx} y={cy + 17} textAnchor="middle" fontSize={11.5} className="dv-mute">{sub}</text>}
        <text x={cx - R} y={cy + 17} textAnchor="middle" fontSize={10.5} className="dv-mute">{min}</text>
        <text x={cx + R} y={cy + 17} textAnchor="middle" fontSize={10.5} className="dv-mute">{max}</text>
      </svg>
    </div>
  );
}

// ───────────────────────── 검정 분포 곡선 ─────────────────────────
/** kind: t | F | chi2 | z. stat 위치와 그보다 극단인 꼬리(p)를 색으로 칠한다. 점선은 α=.05 기각값. */
export function Dist({ kind, df1, df2, stat, p, tails = kind === "t" || kind === "z" ? "two" : "right", height = 210, xLabel }) {
  const [box, W] = useBox(240, 640);
  if (!isNum(stat)) return <Empty />;
  const pdf = kind === "t" ? (x) => pdfT(x, df1) : kind === "F" ? (x) => pdfF(x, df1, df2) : kind === "chi2" ? (x) => pdfChi2(x, df1) : (x) => pdfNorm(x);
  const crit = kind === "t" ? qT(0.975, df1) : kind === "F" ? qF(0.95, df1, df2) : kind === "chi2" ? qChi2(0.95, df1) : qNorm(0.975);
  const sym = kind === "t" || kind === "z";
  const reach = Math.max(Math.abs(stat) * 1.12, crit * 1.5, sym ? 3.6 : 4);
  const x0 = sym ? -reach : 0, x1 = reach;
  const P = { l: 14, r: 14, t: 16, b: 34 }, H = height, N = 220;
  const xs = Array.from({ length: N + 1 }, (_, i) => x0 + ((x1 - x0) * i) / N);
  let ys = xs.map(pdf);
  if (!sym) ys = ys.map((v) => (Number.isFinite(v) ? v : 0));
  const yMax = Math.min(Math.max(...ys.filter(Number.isFinite)), kind === "chi2" && df1 <= 2 ? 0.5 : Infinity) * 1.08 || 1;
  const X = lin(x0, x1, P.l, W - P.r), Y = lin(0, yMax, H - P.b, P.t);
  const path = (a, b) => { const pts = xs.map((x, i) => [x, ys[i]]).filter(([x]) => x >= a && x <= b); return pts.length ? "M" + pts.map(([x, y]) => `${X(x).toFixed(1)} ${Y(Math.min(y, yMax)).toFixed(1)}`).join("L") : ""; };
  const area = (a, b) => { const d = path(a, b); if (!d) return ""; return d + `L${X(Math.min(b, x1)).toFixed(1)} ${Y(0)}L${X(Math.max(a, x0)).toFixed(1)} ${Y(0)}Z`; };
  const s = sym ? Math.abs(stat) : stat;
  const ticks = niceTicks(x0, x1, 7);
  const name = kind === "t" ? `t(${fmt(df1, 1)})` : kind === "F" ? `F(${fmt(df1, 0)}, ${fmt(df2, 1)})` : kind === "chi2" ? `χ²(${fmt(df1, 0)})` : "z";
  const markX = X(Math.min(Math.max(stat, x0), x1)), outside = stat > x1 || stat < x0;
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {ticks.map((t) => <g key={t}><line x1={X(t)} x2={X(t)} y1={H - P.b} y2={H - P.b + 4} stroke={AXIS} /><text x={X(t)} y={H - P.b + 17} textAnchor="middle" fontSize={11} className="dv-mute">{tickFmt(t)}</text></g>)}
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke={AXIS} />
        <path d={area(x0, x1)} fill={C(0)} opacity={0.12} />
        {(tails === "two" || tails === "right") && <path d={area(s, x1)} fill={C(1)} opacity={0.5} />}
        {tails === "two" && <path d={area(x0, -s)} fill={C(1)} opacity={0.5} />}
        {tails === "left" && <path d={area(x0, stat)} fill={C(1)} opacity={0.5} />}
        <path d={path(x0, x1)} fill="none" stroke={C(0)} strokeWidth={2.4} strokeLinejoin="round" />
        {sym ? [-crit, crit].map((c, i) => <line key={i} x1={X(c)} x2={X(c)} y1={Y(pdf(c))} y2={H - P.b} stroke={MUTE} strokeDasharray="3 3" />) : <line x1={X(crit)} x2={X(crit)} y1={Y(Math.min(pdf(crit), yMax))} y2={H - P.b} stroke={MUTE} strokeDasharray="3 3" />}
        <text x={sym ? X(crit) + 4 : X(crit) + 4} y={Y(Math.min(pdf(crit), yMax)) - 4} fontSize={10.5} className="dv-mute">{t3("기각값(α=.05)", "α=.05 critical", "α=.05 临界值")} {fmt(crit, 2)}</text>
        <line x1={markX} x2={markX} y1={P.t} y2={H - P.b} stroke={C(1)} strokeWidth={2.4} />
        <path d={outside ? `M${markX} ${P.t + 8}l${stat > x1 ? -9 : 9} -5v10z` : ""} fill={C(1)} />
        <text x={markX + (markX > W * 0.7 ? -8 : 8)} y={P.t + 11} textAnchor={markX > W * 0.7 ? "end" : "start"} fontSize={12.5} className="dv-strong">{name} = {fmt(stat, 2)}</text>
        {isNum(p) && <text x={markX + (markX > W * 0.7 ? -8 : 8)} y={P.t + 27} textAnchor={markX > W * 0.7 ? "end" : "start"} fontSize={12} fill={C(1)}>{p < 0.001 ? "p < .001" : "p = " + p.toFixed(3).replace(/^0/, "")}</text>}
        {xLabel && <text x={W / 2} y={H - 3} textAnchor="middle" fontSize={11} className="dv-mute">{xLabel}</text>}
      </svg>
    </div>
  );
}

// ───────────────────────── 히트맵 ─────────────────────────
/** values: 숫자 행렬. diverge 면 0 을 가운데로(양: 청록, 음: 장밋빛). text 로 칸 안 글자를 따로 줄 수 있다. */
export function Heat({ rows, cols, values, text, domain, diverge = false, flags, stars, cellH = 30, minCell = 44, rotate }) {
  const [box, W] = useBox(240, 640);
  if (!rows.length || !cols.length) return <Empty />;
  const flat = values.flat().filter(isNum);
  const [a, b] = domain || (diverge ? [-Math.max(...flat.map(Math.abs), 1e-9), Math.max(...flat.map(Math.abs), 1e-9)] : [Math.min(...flat), Math.max(...flat)]);
  const lw = Math.min(Math.round(W * 0.3), Math.max(...rows.map((r) => tw(r, 12)))) + 10;
  const cw = Math.max(minCell, Math.min(84, (W - lw - 6) / cols.length));
  const vert = rotate ?? cols.some((c) => tw(c, 11) > cw - 4);
  const headH = vert ? Math.min(110, Math.max(...cols.map((c) => tw(c, 11))) + 10) : 26;
  const H = headH + rows.length * cellH + 6, Wd = lw + cols.length * cw + 2;
  const fillOf = (v) => {
    if (!isNum(v)) return [INK, 0.03];
    if (diverge) { const t = Math.max(-1, Math.min(1, v / Math.max(Math.abs(a), Math.abs(b), 1e-9))); return [t >= 0 ? POS : NEG, 0.1 + Math.abs(t) * 0.75]; }
    const t = b > a ? Math.max(0, Math.min(1, (v - a) / (b - a))) : 0; return [C(0), 0.08 + t * 0.78];
  };
  return (
    <div ref={box} style={{ overflowX: "auto" }}>
      <svg data-dv viewBox={`0 0 ${Wd} ${H}`} width={Wd} height={H} role="img">
        {cols.map((c, j) => vert
          ? <text key={j} x={lw + j * cw + cw / 2} y={headH - 6} fontSize={11} transform={`rotate(-40 ${lw + j * cw + cw / 2} ${headH - 6})`} className="dv-mute">{c}</text>
          : <text key={j} x={lw + j * cw + cw / 2} y={headH - 8} fontSize={11} textAnchor="middle" className="dv-mute">{clip(c, 10)}</text>)}
        {rows.map((r, i) => (
          <g key={i}>
            <text x={lw - 8} y={headH + i * cellH + cellH / 2} textAnchor="end" fontSize={12} dominantBaseline="central">{clip(r, 20)}</text>
            {cols.map((_, j) => {
              const v = values[i]?.[j], [c, o] = fillOf(v), flag = flags?.has?.(`${i},${j}`);
              return (
                <g key={j} className="dv-hov">
                  <rect x={lw + j * cw + 1} y={headH + i * cellH + 1} width={cw - 2} height={cellH - 2} rx={6} fill={c} fillOpacity={o} stroke={flag ? INK : "none"} strokeWidth={flag ? 1.6 : 0}><title>{`${r} × ${cols[j]}: ${text?.[i]?.[j] ?? fmt(v)}`}</title></rect>
                  <text x={lw + j * cw + cw / 2} y={headH + i * cellH + cellH / 2} textAnchor="middle" dominantBaseline="central" fontSize={11.5} className={flag ? "dv-strong" : ""} style={{ fontVariantNumeric: "tabular-nums", fill: "var(--dv-ink)" }}>{text?.[i]?.[j] ?? (isNum(v) ? fmt(v, 2) : "")}{stars?.[i]?.[j] || ""}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
