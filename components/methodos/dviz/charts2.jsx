/* 분석 시각화 부품 2 — 선(구간 띠) · 누적 막대 · 모자이크 · 도넛 · 와플 · 산점도 · 경로 그림 · 폭포 · 깔때기 · 관계망 · 범위 상자 · 파레토 */
import { useState } from "react";
import { AXIS, BAD, C, CARD, Empty, GRID, INK, MUTE, NEG, OK, POS, WARN, extent, fmt, isNum, lin, niceTicks, spread, tickFmt, tw, useBox, wrap, clip, t3 } from "./core.jsx";

// ───────────────────────── 선 ─────────────────────────
/** series: {name,color?,points:[{x,y,lo?,hi?}],dash?,width?,step?,markers?,area?,end?(끝 라벨)}. xCats 가 있으면 x 는 0..n-1 의 범주 위치. */
export function Lines({ series, xCats, xDomain, yDomain, xLabel, yLabel, refY, vlines = [], height = 270, zero = false, xFmt, yFmt = (v) => tickFmt(v), endLabels = true, tip = true }) {
  const [box, W] = useBox(240, 640);
  const [hv, setHv] = useState(null);
  const ss = series.map((s) => ({ ...s, points: (s.points || []).filter((p) => isNum(p.x) && isNum(p.y)) })).filter((s) => s.points.length);
  if (!ss.length) return <Empty />;
  const narrow = W < 480;
  const labW = endLabels && ss.length > 1 && !narrow ? Math.min(140, Math.max(...ss.map((s) => tw(s.name, 11.5))) + 12) : 0;
  const P = { l: 54, r: 16 + labW, t: 14, b: xLabel ? 50 : 36 }, H = height;
  const allX = ss.flatMap((s) => s.points.map((p) => p.x)), allY = ss.flatMap((s) => s.points.flatMap((p) => [p.y, p.lo, p.hi])).filter(isNum);
  const [xa, xb] = xDomain || (xCats ? [-0.35, xCats.length - 1 + 0.35] : extent(allX, 0.03));
  const [ya, yb] = yDomain || extent(allY, 0.1, [...(zero ? [0] : []), ...(isNum(refY) ? [refY] : [])]);
  const X = lin(xa, xb, P.l, W - P.r), Y = lin(ya, yb, H - P.b, P.t);
  const col = (s, i) => s.color || C(i);
  const xs = [...new Set(allX)].sort((a, b) => a - b);
  const xt = xCats ? xCats.map((c, i) => ({ v: i, label: c })) : niceTicks(xa, xb, Math.max(3, Math.floor((W - P.l - P.r) / 90))).map((v) => ({ v, label: xFmt ? xFmt(v) : tickFmt(v) }));
  const pathOf = (pts, step) => pts.map((p, i) => (i ? (step ? `H${X(p.x).toFixed(1)}V${Y(p.y).toFixed(1)}` : `L${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`) : `M${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`)).join("");
  const band = (s) => {
    const pts = s.points.filter((p) => isNum(p.lo) && isNum(p.hi)); if (pts.length < 2) return "";
    const up = pts.map((p, i) => (i ? (s.step ? `H${X(p.x).toFixed(1)}V${Y(p.hi).toFixed(1)}` : `L${X(p.x).toFixed(1)} ${Y(p.hi).toFixed(1)}`) : `M${X(p.x).toFixed(1)} ${Y(p.hi).toFixed(1)}`)).join("");
    const dn = [...pts].reverse().map((p, i) => (s.step ? (i ? `V${Y(p.lo).toFixed(1)}H${X(p.x).toFixed(1)}` : `L${X(p.x).toFixed(1)} ${Y(p.lo).toFixed(1)}`) : `L${X(p.x).toFixed(1)} ${Y(p.lo).toFixed(1)}`)).join("");
    return up + dn + "Z";
  };
  const ends = ss.map((s) => { const p = s.points[s.points.length - 1]; return Y(p.y); });
  const adj = labW ? spread(ends, ss.map(() => 14), P.t, H - P.b, 2) : [];
  const onMove = (e) => {
    if (!tip) return; const r = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W; let best = xs[0], bd = 1e9;
    xs.forEach((x) => { const d = Math.abs(X(x) - px); if (d < bd) { bd = d; best = x; } }); setHv(best);
  };
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" onMouseMove={onMove} onMouseLeave={() => setHv(null)}>
        <defs>{ss.map((s, i) => <linearGradient key={i} id={`dvg${i}${W}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={col(s, i)} stopOpacity=".28" /><stop offset="1" stopColor={col(s, i)} stopOpacity="0.02" /></linearGradient>)}</defs>
        {niceTicks(ya, yb, 5).map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke={GRID} /><text x={P.l - 8} y={Y(t)} textAnchor="end" fontSize={11} dominantBaseline="central" className="dv-mute">{yFmt(t)}</text></g>)}
        {xt.map((t) => <text key={t.v} x={X(t.v)} y={H - P.b + 18} textAnchor="middle" fontSize={11} className="dv-mute">{t.label}</text>)}
        {xLabel && <text x={(P.l + W - P.r) / 2} y={H - 6} textAnchor="middle" fontSize={11.5}>{xLabel}</text>}
        {yLabel && <text x={12} y={(P.t + H - P.b) / 2} fontSize={11.5} transform={`rotate(-90 12 ${(P.t + H - P.b) / 2})`} textAnchor="middle">{yLabel}</text>}
        {isNum(refY) && <line x1={P.l} x2={W - P.r} y1={Y(refY)} y2={Y(refY)} stroke={AXIS} strokeDasharray="4 3" />}
        {vlines.map((v, i) => <g key={i}><line x1={X(v.x)} x2={X(v.x)} y1={P.t} y2={H - P.b} stroke={v.color || WARN} strokeDasharray="4 3" /><text x={X(v.x) + 4} y={P.t + 10} fontSize={10.5} fill={v.color || WARN}>{v.label}</text></g>)}
        {ss.map((s, i) => <g key={i}>
          {band(s) && <path d={band(s)} fill={col(s, i)} opacity={0.16} />}
          {s.area && <path d={pathOf(s.points, s.step) + `L${X(s.points[s.points.length - 1].x)} ${Y(Math.max(ya, 0))}L${X(s.points[0].x)} ${Y(Math.max(ya, 0))}Z`} fill={`url(#dvg${i}${W})`} />}
          <path d={pathOf(s.points, s.step)} fill="none" stroke={col(s, i)} strokeWidth={s.width || 2.6} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />
          {(s.markers ?? s.points.length <= 14) && s.points.map((p, k) => <circle key={k} cx={X(p.x)} cy={Y(p.y)} r={4.2} fill={col(s, i)} stroke={CARD} strokeWidth={1.6}><title>{`${s.name}: ${fmt(p.y)}`}</title></circle>)}
        </g>)}
        {labW > 0 && ss.map((s, i) => <text key={i} x={W - P.r + 10} y={adj[i]} fontSize={11.5} dominantBaseline="central" fill={col(s, i)} style={{ fontWeight: 600 }}>{clip(s.name, 14)}</text>)}
        {hv != null && <g>
          <line x1={X(hv)} x2={X(hv)} y1={P.t} y2={H - P.b} stroke={INK} opacity={0.25} />
          {ss.map((s, i) => { const p = s.points.find((q) => q.x === hv); return p ? <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={5.5} fill={col(s, i)} stroke={CARD} strokeWidth={2} /> : null; })}
          {(() => {
            const rows = ss.map((s, i) => { const p = s.points.find((q) => q.x === hv); return p ? { c: col(s, i), t: `${clip(s.name, 12)} ${fmt(p.y)}` } : null; }).filter(Boolean);
            const head = xCats ? xCats[hv] : xFmt ? xFmt(hv) : fmt(hv), w = Math.max(...rows.map((r) => tw(r.t, 11.5)), tw(String(head), 11.5)) + 28, x0 = X(hv) > W / 2 ? X(hv) - w - 10 : X(hv) + 10;
            return <g><rect x={x0} y={P.t + 2} width={w} height={rows.length * 16 + 24} rx={8} fill={CARD} stroke="var(--dv-edge)" /><text x={x0 + 10} y={P.t + 17} fontSize={11.5} className="dv-strong">{String(head)}</text>
              {rows.map((r, k) => <g key={k}><circle cx={x0 + 14} cy={P.t + 33 + k * 16} r={4} fill={r.c} /><text x={x0 + 24} y={P.t + 33 + k * 16} fontSize={11.5} dominantBaseline="central">{r.t}</text></g>)}</g>;
          })()}
        </g>}
      </svg>
      {endLabels && ss.length > 1 && narrow && <div className="dv-legend">{ss.map((s, i) => <span key={i}><i style={{ background: col(s, i) }} />{s.name}</span>)}</div>}
    </div>
  );
}

// ───────────────────────── 100% 누적 막대 ─────────────────────────
/** rows: {label, parts:[{name,value}]} — 이름이 같은 조각은 같은 색 */
export function Stack100({ rows, rowH = 34, colors, showN = true }) {
  const [box, W] = useBox(240, 640);
  if (!rows.length) return <Empty />;
  const names = [...new Set(rows.flatMap((r) => r.parts.map((p) => p.name)))];
  const col = (n) => (colors && colors[n]) || C(names.indexOf(n));
  const lw = Math.min(Math.round(W * 0.28), Math.max(...rows.map((r) => tw(r.label, 12)))) + 8, P = { l: lw + 8, r: showN ? 46 : 8, t: 6, b: 6 }, H = P.t + P.b + rows.length * rowH;
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {rows.map((r, i) => {
          const tot = r.parts.reduce((s, p) => s + (isNum(p.value) ? Math.max(0, p.value) : 0), 0) || 1; let x = P.l; const y = P.t + i * rowH + 4, h = rowH - 8;
          return (
            <g key={i}>
              <text x={0} y={y + h / 2} fontSize={12} dominantBaseline="central">{clip(r.label, 16)}</text>
              {r.parts.map((p, k) => { const w = (Math.max(0, p.value) / tot) * (W - P.l - P.r), cx = x; x += w; const pc = (Math.max(0, p.value) / tot) * 100;
                return <g key={k}><rect x={cx + 0.5} y={y} width={Math.max(0, w - 1)} height={h} rx={k === 0 || k === r.parts.length - 1 ? 7 : 3} fill={col(p.name)} opacity={0.92}><title>{`${r.label} · ${p.name}: ${fmt(p.value, 0)} (${pc.toFixed(1)}%)`}</title></rect>{w > 34 && <text x={cx + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#fff" style={{ fontWeight: 600 }}>{pc.toFixed(0)}%</text>}</g>; })}
              {showN && <text x={W - P.r + 6} y={y + h / 2} fontSize={11} dominantBaseline="central" className="dv-mute">n={Math.round(tot)}</text>}
            </g>
          );
        })}
      </svg>
      <div className="dv-legend">{names.map((n) => <span key={n}><i style={{ background: col(n) }} />{n}</span>)}</div>
    </div>
  );
}

// ───────────────────────── 모자이크 ─────────────────────────
export function Mosaic({ rows, cols, counts, height = 260, rowTitle, colTitle }) {
  const [box, W] = useBox(240, 640);
  const tot = counts.flat().reduce((s, v) => s + v, 0);
  if (!tot) return <Empty />;
  const P = { l: 6, r: 6, t: 28, b: 8 }, rt = counts.map((r) => r.reduce((s, v) => s + v, 0)), gap = 4;
  const usable = W - P.l - P.r - gap * (rows.length - 1), ph = height - P.t - P.b;
  let x = P.l;
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${height}`} width={W} height={height} role="img">
        {rows.map((r, i) => {
          const w = (rt[i] / tot) * usable, x0 = x; x += w + gap; let y = P.t;
          return (
            <g key={i}>
              <text x={x0 + w / 2} y={16} textAnchor="middle" fontSize={12} className="dv-strong">{clip(r, 10)} <tspan className="dv-mute">({((rt[i] / tot) * 100).toFixed(0)}%)</tspan></text>
              {cols.map((c, j) => { const h = (counts[i][j] / (rt[i] || 1)) * ph, y0 = y; y += h; const pc = (counts[i][j] / (rt[i] || 1)) * 100;
                return <g key={j}><rect x={x0} y={y0 + 1} width={Math.max(0, w)} height={Math.max(0, h - 2)} rx={6} fill={C(j)} opacity={0.88}><title>{`${r} × ${c}: ${counts[i][j]} (${pc.toFixed(1)}%)`}</title></rect>
                  {h > 30 && w > 44 && <text x={x0 + w / 2} y={y0 + h / 2} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#fff" style={{ fontWeight: 600 }}>{pc.toFixed(0)}%<tspan fontSize={10.5} opacity={0.85}> ({counts[i][j]})</tspan></text>}</g>; })}
            </g>
          );
        })}
      </svg>
      <div className="dv-legend">{colTitle && <b style={{ marginRight: 4 }}>{colTitle}:</b>}{cols.map((c, j) => <span key={j}><i style={{ background: C(j) }} />{c}</span>)}</div>
    </div>
  );
}

// ───────────────────────── 도넛 ─────────────────────────
export function Donut({ items, center, sub, size = 190 }) {
  const rs = items.filter((r) => isNum(r.value) && r.value > 0), tot = rs.reduce((s, r) => s + r.value, 0);
  if (!tot) return <Empty />;
  const cx = size / 2, R = size / 2 - 8, r0 = R * 0.62; let a = -Math.PI / 2;
  const arcs = rs.map((r, i) => { const span = (r.value / tot) * Math.PI * 2, a0 = a, a1 = a + span; a = a1; const lg = span > Math.PI ? 1 : 0, p = (rad, ang) => [cx + rad * Math.cos(ang), cx + rad * Math.sin(ang)];
    const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1 - 0.012), [x2, y2] = p(r0, a1 - 0.012), [x3, y3] = p(r0, a0); return { d: `M${x0} ${y0}A${R} ${R} 0 ${lg} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${lg} 0 ${x3} ${y3}Z`, c: r.color || C(i), r }; });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "center" }}>
      <svg data-dv viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img">
        {arcs.map((x, i) => <path key={i} d={x.d} fill={x.c} opacity={0.92}><title>{`${x.r.label}: ${fmt(x.r.value, 1)} (${((x.r.value / tot) * 100).toFixed(1)}%)`}</title></path>)}
        <text x={cx} y={cx - 2} textAnchor="middle" fontSize={22} className="dv-strong" style={{ fontVariantNumeric: "tabular-nums" }}>{center ?? fmt(tot, 0)}</text>
        {sub && <text x={cx} y={cx + 16} textAnchor="middle" fontSize={11} className="dv-mute">{sub}</text>}
      </svg>
      <div style={{ fontSize: 12.5, lineHeight: 1.9 }}>{rs.map((r, i) => <div key={i}><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 7, background: r.color || C(i) }} />{clip(r.label, 18)} <b style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(r.value, 0)}</b> <span style={{ color: "var(--dv-mute)" }}>({((r.value / tot) * 100).toFixed(1)}%)</span></div>)}</div>
    </div>
  );
}

// ───────────────────────── 와플 ─────────────────────────
/** parts: {label,value,color?} — 100칸 중 몫(최대잔여법) */
export function Waffle({ parts, caption }) {
  const rs = parts.filter((p) => isNum(p.value) && p.value > 0), tot = rs.reduce((s, p) => s + p.value, 0);
  if (!tot) return <Empty />;
  const raw = rs.map((p) => (p.value / tot) * 100), base = raw.map(Math.floor); let left = 100 - base.reduce((s, v) => s + v, 0);
  raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { base[i] += 1; left -= 1; } });
  const cells = []; base.forEach((n, i) => { for (let k = 0; k < n; k++) cells.push(i); });
  const S = 17;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "center" }}>
      <svg data-dv viewBox="0 0 176 176" width={176} height={176} role="img">
        {cells.map((c, k) => <rect key={k} x={(k % 10) * S + 2} y={Math.floor(k / 10) * S + 2} width={S - 3} height={S - 3} rx={4} fill={rs[c].color || C(c)} opacity={0.92}><title>{rs[c].label}</title></rect>)}
      </svg>
      <div style={{ fontSize: 12.5, lineHeight: 1.9 }}>{rs.map((p, i) => <div key={i}><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 7, background: p.color || C(i) }} />{clip(p.label, 20)} <b>{fmt(p.value, 0)}</b> <span style={{ color: "var(--dv-mute)" }}>({((p.value / tot) * 100).toFixed(1)}%)</span></div>)}{caption && <div className="dv-note">{caption}</div>}</div>
    </div>
  );
}

// ───────────────────────── 산점도 ─────────────────────────
/** points: {x,y,label?,r?,color?,hi?}; region: {x0,x1,y0,y1,label} 면, refX/refY 점선 */
export function Scatter({ points, xLabel, yLabel, refX, refY, region, height = 300, labelAll = true, xFmt = tickFmt, yFmt = tickFmt, lines = [] }) {
  const [box, W] = useBox(240, 640); const [hv, setHv] = useState(null);
  const ps = points.filter((p) => isNum(p.x) && isNum(p.y));
  if (!ps.length) return <Empty />;
  const P = { l: 54, r: 20, t: 14, b: 46 }, H = height;
  const [xa, xb] = extent([...ps.map((p) => p.x), ...(region ? [region.x0, region.x1] : []), ...(isNum(refX) ? [refX] : [])], 0.1), [ya, yb] = extent([...ps.map((p) => p.y), ...(region ? [region.y0, region.y1] : []), ...(isNum(refY) ? [refY] : [])], 0.1);
  const X = lin(xa, xb, P.l, W - P.r), Y = lin(ya, yb, H - P.b, P.t);
  const lab = labelAll && ps.length <= 14;
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {niceTicks(ya, yb, 5).map((t) => <g key={"y" + t}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke={GRID} /><text x={P.l - 8} y={Y(t)} textAnchor="end" fontSize={11} dominantBaseline="central" className="dv-mute">{yFmt(t)}</text></g>)}
        {niceTicks(xa, xb, 6).map((t) => <g key={"x" + t}><line x1={X(t)} x2={X(t)} y1={P.t} y2={H - P.b} stroke={GRID} /><text x={X(t)} y={H - P.b + 17} textAnchor="middle" fontSize={11} className="dv-mute">{xFmt(t)}</text></g>)}
        {xLabel && <text x={(P.l + W - P.r) / 2} y={H - 6} textAnchor="middle" fontSize={11.5}>{xLabel}</text>}
        {yLabel && <text x={12} y={(P.t + H - P.b) / 2} fontSize={11.5} transform={`rotate(-90 12 ${(P.t + H - P.b) / 2})`} textAnchor="middle">{yLabel}</text>}
        {region && <g><rect x={X(region.x0)} y={Y(region.y1)} width={X(region.x1) - X(region.x0)} height={Y(region.y0) - Y(region.y1)} fill={OK} opacity={0.1} rx={8} />{region.label && <text x={X(region.x0) + 8} y={Y(region.y1) + 15} fontSize={10.5} fill={OK}>{region.label}</text>}</g>}
        {isNum(refX) && <line x1={X(refX)} x2={X(refX)} y1={P.t} y2={H - P.b} stroke={AXIS} strokeDasharray="4 3" />}
        {isNum(refY) && <line x1={P.l} x2={W - P.r} y1={Y(refY)} y2={Y(refY)} stroke={AXIS} strokeDasharray="4 3" />}
        {lines.map((l, i) => <line key={i} x1={X(l.x0)} y1={Y(l.y0)} x2={X(l.x1)} y2={Y(l.y1)} stroke={l.color || MUTE} strokeDasharray={l.dash || "4 3"} />)}
        {ps.map((p, i) => <g key={i} onMouseEnter={() => setHv(i)} onMouseLeave={() => setHv(null)}>
          <circle cx={X(p.x)} cy={Y(p.y)} r={(p.r ?? 6) + (hv === i ? 2 : 0)} fill={p.color || (p.hi ? C(1) : C(0))} opacity={hv == null || hv === i ? 0.85 : 0.35} stroke={CARD} strokeWidth={1.6}><title>{`${p.label ?? ""} (${fmt(p.x)}, ${fmt(p.y)})`}</title></circle>
          {(lab || hv === i) && p.label && <text x={X(p.x) + (p.r ?? 6) + 5} y={Y(p.y)} fontSize={11} dominantBaseline="central" className={hv === i ? "dv-strong" : ""}>{clip(p.label, 14)}</text>}
        </g>)}
      </svg>
    </div>
  );
}

// ───────────────────────── 경로 그림 ─────────────────────────
/** 위에서 아래로 가지 않고 왼쪽→오른쪽 층으로 자동 배치한다. nodes: {id,label,kind:'obs'|'latent'|'item', layer?, order?}  edges: {from,to,label?,value?,sig?,note?} */
export function autoLayout(nodes, edges) {
  const layer = {}; nodes.forEach((n) => { layer[n.id] = n.layer ?? 0; });
  const fixed = new Set(nodes.filter((n) => n.layer != null).map((n) => n.id));
  for (let it = 0; it < nodes.length + 2; it++) edges.forEach((e) => { if (!fixed.has(e.to) && e.from !== e.to) layer[e.to] = Math.max(layer[e.to] ?? 0, (layer[e.from] ?? 0) + 1); });
  const L = Math.max(0, ...Object.values(layer)), cols = Array.from({ length: L + 1 }, () => []);
  nodes.forEach((n) => cols[layer[n.id] ?? 0].push(n));
  return { layer, cols, L };
}
export function PathDiagram({ nodes, edges, height }) {
  const [box, W] = useBox(280, 680);
  if (!nodes.length) return <Empty />;
  const { cols, L } = autoLayout(nodes, edges);
  const maxRows = Math.max(...cols.map((c) => c.length)), H = height || Math.max(230, maxRows * 78 + 40);
  const pos = {}, nw = (n) => Math.min(150, Math.max(64, tw(n.label, 12.5, 600) + 26));
  cols.forEach((col, li) => col.forEach((n, k) => { pos[n.id] = { x: L === 0 ? W / 2 : 80 + (li / L) * (W - 160), y: n.fy != null ? n.fy * (H - 40) + 20 : ((k + 1) / (col.length + 1)) * (H - 10) + 5, w: nw(n), h: n.kind === "item" ? 30 : 38 }; }));
  const clipTo = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, hw = a.w / 2 + 2, hh = a.h / 2 + 2; const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity); return [a.x + dx * t, a.y + dy * t]; };
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {edges.map((e, i) => {
          const a = pos[e.from], b = pos[e.to]; if (!a || !b) return null;
          const [x0, y0] = clipTo(a, b), [x1, y1] = clipTo(b, a), neg = isNum(e.value) && e.value < 0, c = e.color || (neg ? NEG : POS), w = 1.4 + Math.min(1, Math.abs(e.value ?? 0.4)) * 4.4;
          const ang = Math.atan2(y1 - y0, x1 - x0), ah = 7 + w, hx = x1 - Math.cos(ang) * 1, hy = y1 - Math.sin(ang) * 1, sig = e.sig === false;
          const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, txt = e.label ?? (isNum(e.value) ? fmt(e.value, 2) : "");
          return (
            <g key={i} opacity={sig ? 0.45 : 1}>
              <line x1={x0} y1={y0} x2={x1 - Math.cos(ang) * ah * 0.6} y2={y1 - Math.sin(ang) * ah * 0.6} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={sig ? "5 4" : undefined} />
              <polygon points={`${hx},${hy} ${hx - Math.cos(ang - 0.42) * ah},${hy - Math.sin(ang - 0.42) * ah} ${hx - Math.cos(ang + 0.42) * ah},${hy - Math.sin(ang + 0.42) * ah}`} fill={c} />
              {txt && <g><rect x={mx - tw(txt, 11.5, 600) / 2 - 6} y={my - 10} width={tw(txt, 11.5, 600) + 12} height={20} rx={10} fill={CARD} stroke={c} strokeOpacity={0.5} /><text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={11.5} className="dv-strong" style={{ fontVariantNumeric: "tabular-nums" }}>{txt}</text></g>}
            </g>
          );
        })}
        {nodes.map((n, i) => { const p = pos[n.id]; const latent = n.kind === "latent";
          return <g key={n.id}>{latent ? <ellipse cx={p.x} cy={p.y} rx={p.w / 2 + 6} ry={p.h / 2 + 6} fill={C(i)} fillOpacity={0.14} stroke={C(i)} strokeWidth={2} /> : <rect x={p.x - p.w / 2} y={p.y - p.h / 2} width={p.w} height={p.h} rx={n.kind === "item" ? 7 : 11} fill={CARD} stroke={C(i)} strokeWidth={2} />}
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={12.5} className="dv-strong">{clip(n.label, 14)}</text></g>; })}
      </svg>
    </div>
  );
}

// ───────────────────────── 폭포(단계별 증가분) ─────────────────────────
export function Waterfall({ steps, yLabel, fmtv = (v) => fmt(v, 3), height = 260 }) {
  const [box, W] = useBox(240, 640);
  const rs = steps.filter((s) => isNum(s.delta));
  if (!rs.length) return <Empty />;
  const P = { l: 52, r: 16, t: 22, b: 54 }, H = height; let cum = 0;
  const bars = rs.map((s) => { const a = cum; cum += s.delta; return { ...s, a, b: cum }; });
  const hi = Math.max(...bars.map((b) => Math.max(b.a, b.b)), 0.0001);
  const Y = lin(0, hi * 1.12, H - P.b, P.t), step = (W - P.l - P.r) / (bars.length + 1), bw = Math.min(74, step * 0.62);
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {niceTicks(0, hi * 1.12, 5).map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke={GRID} /><text x={P.l - 8} y={Y(t)} textAnchor="end" fontSize={11} dominantBaseline="central" className="dv-mute">{tickFmt(t)}</text></g>)}
        {yLabel && <text x={12} y={(P.t + H - P.b) / 2} fontSize={11.5} transform={`rotate(-90 12 ${(P.t + H - P.b) / 2})`} textAnchor="middle">{yLabel}</text>}
        {bars.map((b, i) => { const x = P.l + step * (i + 0.5) + step * 0.0 - bw / 2 + step * 0.0, up = b.delta >= 0;
          return <g key={i} className="dv-hov">
            <rect x={x} y={Y(Math.max(b.a, b.b))} width={bw} height={Math.max(2, Math.abs(Y(b.a) - Y(b.b)))} rx={6} fill={b.color || (up ? C(0) : NEG)} opacity={0.92}><title>{`${b.label}: ${fmtv(b.delta)} → ${fmtv(b.b)}`}</title></rect>
            {i > 0 && <line x1={x - (step - bw)} x2={x} y1={Y(b.a)} y2={Y(b.a)} stroke={MUTE} strokeDasharray="2 3" />}
            <text x={x + bw / 2} y={Y(Math.max(b.a, b.b)) - 7} textAnchor="middle" fontSize={11.5} className="dv-strong">{up ? "+" : "−"}{fmtv(Math.abs(b.delta))}</text>
            {b.note && <text x={x + bw / 2} y={Y(Math.max(b.a, b.b)) - 21} textAnchor="middle" fontSize={10.5} className="dv-mute">{b.note}</text>}
            {wrap(b.label, step - 6, 11.5, 2).map((s, k) => <text key={k} x={x + bw / 2} y={H - P.b + 17 + k * 13} textAnchor="middle" fontSize={11.5}>{s}</text>)}
          </g>; })}
        {(() => { const i = bars.length, x = P.l + step * (i + 0.5) - bw / 2; return <g><rect x={x} y={Y(cum)} width={bw} height={Math.max(2, Y(0) - Y(cum))} rx={6} fill={INK} opacity={0.82} /><text x={x + bw / 2} y={Y(cum) - 7} textAnchor="middle" fontSize={11.5} className="dv-strong">{fmtv(cum)}</text><text x={x + bw / 2} y={H - P.b + 17} textAnchor="middle" fontSize={11.5}>{t3("합계", "Total", "合计")}</text></g>; })()}
      </svg>
    </div>
  );
}

// ───────────────────────── 깔때기 그림(메타분석) ─────────────────────────
export function Funnel({ points, center, height = 300, xLabel }) {
  const [box, W] = useBox(240, 640);
  const ps = points.filter((p) => isNum(p.x) && isNum(p.y));
  if (!ps.length) return <Empty />;
  const P = { l: 52, r: 18, t: 16, b: 44 }, H = height, maxSE = Math.max(...ps.map((p) => p.y)) * 1.12;
  const xs = ps.map((p) => p.x), half = Math.max(...ps.map((p) => Math.abs(p.x - center)), 1.96 * maxSE) * 1.06, xa = center - half, xb = center + half;
  const X = lin(xa, xb, P.l, W - P.r), Y = lin(0, maxSE, P.t, H - P.b);
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        <path d={`M${X(center)} ${Y(0)}L${X(center - 1.96 * maxSE)} ${Y(maxSE)}L${X(center + 1.96 * maxSE)} ${Y(maxSE)}Z`} fill={C(0)} opacity={0.08} />
        <line x1={X(center)} x2={X(center)} y1={Y(0)} y2={Y(maxSE)} stroke={C(0)} strokeWidth={1.6} strokeDasharray="4 3" />
        <line x1={X(center)} y1={Y(0)} x2={X(center - 1.96 * maxSE)} y2={Y(maxSE)} stroke={C(0)} opacity={0.5} /><line x1={X(center)} y1={Y(0)} x2={X(center + 1.96 * maxSE)} y2={Y(maxSE)} stroke={C(0)} opacity={0.5} />
        {niceTicks(xa, xb, 6).map((t) => <g key={t}><text x={X(t)} y={H - P.b + 17} textAnchor="middle" fontSize={11} className="dv-mute">{tickFmt(t)}</text></g>)}
        {niceTicks(0, maxSE, 5).map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke={GRID} /><text x={P.l - 8} y={Y(t)} textAnchor="end" fontSize={11} dominantBaseline="central" className="dv-mute">{tickFmt(t)}</text></g>)}
        <text x={(P.l + W - P.r) / 2} y={H - 6} textAnchor="middle" fontSize={11.5}>{xLabel || t3("효과크기", "Effect size", "效应量")}</text>
        <text x={12} y={(P.t + H - P.b) / 2} fontSize={11.5} transform={`rotate(-90 12 ${(P.t + H - P.b) / 2})`} textAnchor="middle">{t3("표준오차(작을수록 위)", "Standard error (small = top)", "标准误(越小越靠上)")}</text>
        {ps.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={5.5} fill={Math.abs(p.x - center) > 1.96 * p.y ? C(1) : C(0)} opacity={0.82} stroke={CARD} strokeWidth={1.4}><title>{`${p.label ?? ""}: ${fmt(p.x)} (SE ${fmt(p.y)})`}</title></circle>)}
      </svg>
      <div className="dv-legend"><span><i style={{ background: C(0) }} />{t3("95% 깔때기 안", "inside 95% funnel", "95% 漏斗内")}</span><span><i style={{ background: C(1) }} />{t3("깔때기 밖", "outside", "漏斗外")}</span></div>
    </div>
  );
}

// ───────────────────────── 관계망(원형 배치) ─────────────────────────
export function Network({ nodes, edges, height = 300 }) {
  const [box, W] = useBox(240, 640);
  if (!nodes.length) return <Empty />;
  const H = height, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 56, pos = {};
  nodes.forEach((n, i) => { const a = -Math.PI / 2 + (i / nodes.length) * Math.PI * 2; pos[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a }; });
  const maxW = Math.max(...edges.map((e) => e.w || 1), 1), maxE = Math.max(...edges.map((e) => Math.abs(e.eff || 0)), 1e-9);
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {edges.map((e, i) => { const a = pos[e.a], b = pos[e.b]; if (!a || !b) return null; const c = isNum(e.eff) ? (e.eff >= 0 ? POS : NEG) : C(0);
          return <g key={i} className="dv-hov"><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth={1.5 + ((e.w || 1) / maxW) * 6} opacity={0.35 + 0.5 * Math.abs((e.eff || 0) / maxE)} strokeLinecap="round"><title>{`${e.a}–${e.b}: ${isNum(e.eff) ? fmt(e.eff, 3) : ""}${e.w ? ` (${e.w})` : ""}`}</title></line>
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} textAnchor="middle" fontSize={10.5} className="dv-mute" dominantBaseline="central">{e.w ? e.w : ""}</text></g>; })}
        {nodes.map((n, i) => { const p = pos[n.id], r = 11 + Math.sqrt(n.size || 1) * 2; return <g key={n.id}><circle cx={p.x} cy={p.y} r={r} fill={C(i)} opacity={0.9} stroke={CARD} strokeWidth={2.4} /><text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={12.5} fill="#fff" style={{ fontWeight: 700 }}>{clip(n.label, 4)}</text></g>; })}
      </svg>
      <p className="dv-note">{t3("선의 굵기는 직접 비교에 들어간 연구 수, 선 위의 숫자가 그 수입니다.", "Line width and the number on each line are the studies in the direct comparison.", "线宽及线上的数字为该直接比较中的研究数。")}</p>
    </div>
  );
}

// ───────────────────────── 범위 상자(변수마다 제 눈금) ─────────────────────────
/** items: {label,min,q1,med,q3,max,mean?,ciLo?,ciHi?,n?} */
export function RangeBox({ items, rowH = 64 }) {
  const [box, W] = useBox(240, 640);
  const rs = items.filter((r) => [r.min, r.q1, r.med, r.q3, r.max].every(isNum));
  if (!rs.length) return <Empty />;
  const lw = Math.min(Math.round(W * 0.24), Math.max(...rs.map((r) => tw(r.label, 12.5, 600)))) + 8, P = { l: lw + 10, r: 18, t: 6, b: 4 }, H = P.t + P.b + rs.length * rowH;
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {rs.map((r, i) => {
          const y = P.t + i * rowH + rowH / 2 + 4, X = lin(r.min, r.max, P.l, W - P.r);
          return (
            <g key={i}>
              <text x={0} y={y - 6} fontSize={12.5} className="dv-strong" dominantBaseline="central">{clip(r.label, 12)}</text>
              {r.n != null && <text x={0} y={y + 10} fontSize={10.5} className="dv-mute" dominantBaseline="central">n = {Math.round(r.n)}</text>}
              <line x1={X(r.min)} x2={X(r.max)} y1={y} y2={y} stroke={C(i)} strokeWidth={2} opacity={0.5} />
              <line x1={X(r.min)} x2={X(r.min)} y1={y - 7} y2={y + 7} stroke={C(i)} strokeWidth={2} /><line x1={X(r.max)} x2={X(r.max)} y1={y - 7} y2={y + 7} stroke={C(i)} strokeWidth={2} />
              <rect x={X(r.q1)} y={y - 12} width={Math.max(3, X(r.q3) - X(r.q1))} height={24} rx={7} fill={C(i)} opacity={0.28} stroke={C(i)} strokeWidth={1.6}><title>{`Q1 ${fmt(r.q1)} · Q3 ${fmt(r.q3)}`}</title></rect>
              <line x1={X(r.med)} x2={X(r.med)} y1={y - 12} y2={y + 12} stroke={C(i)} strokeWidth={3.4} strokeLinecap="round"><title>{`${t3("중위수", "Median", "中位数")} ${fmt(r.med)}`}</title></line>
              {isNum(r.mean) && <polygon points={`${X(r.mean)},${y - 8} ${X(r.mean) + 7},${y} ${X(r.mean)},${y + 8} ${X(r.mean) - 7},${y}`} fill={CARD} stroke={INK} strokeWidth={1.8}><title>{`${t3("평균", "Mean", "均值")} ${fmt(r.mean)}`}</title></polygon>}
              <text x={X(r.min)} y={y + 24} fontSize={10.5} textAnchor="middle" className="dv-mute">{fmt(r.min, 2)}</text><text x={X(r.max)} y={y + 24} fontSize={10.5} textAnchor="middle" className="dv-mute">{fmt(r.max, 2)}</text>
              <text x={X(r.med)} y={y - 20} fontSize={10.5} textAnchor="middle" className="dv-strong">{fmt(r.med, 2)}</text>
            </g>
          );
        })}
      </svg>
      <div className="dv-legend"><span><i style={{ background: C(0), opacity: 0.4 }} />Q1–Q3</span><span>┃ {t3("중위수", "median", "中位数")}</span><span>◇ {t3("평균", "mean", "均值")}</span><span>├─┤ {t3("최소–최대", "min–max", "最小–最大")}</span></div>
    </div>
  );
}

// ───────────────────────── 파레토 ─────────────────────────
export function Pareto({ items, height = 250 }) {
  const [box, W] = useBox(240, 640);
  const rs = items.filter((r) => isNum(r.value));
  if (!rs.length) return <Empty />;
  const tot = rs.reduce((s, r) => s + r.value, 0) || 1, P = { l: 46, r: 46, t: 20, b: 52 }, H = height, mx = Math.max(...rs.map((r) => r.value)) * 1.12;
  const step = (W - P.l - P.r) / rs.length, bw = Math.min(64, step * 0.62), Y = lin(0, mx, H - P.b, P.t), Y2 = lin(0, 100, H - P.b, P.t);
  let c = 0; const cum = rs.map((r) => { c += r.value; return (c / tot) * 100; });
  return (
    <div ref={box}>
      <svg data-dv viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img">
        {niceTicks(0, mx, 4).map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke={GRID} /><text x={P.l - 8} y={Y(t)} textAnchor="end" fontSize={11} dominantBaseline="central" className="dv-mute">{tickFmt(t)}</text></g>)}
        {[0, 25, 50, 75, 100].map((t) => <text key={t} x={W - P.r + 8} y={Y2(t)} fontSize={11} dominantBaseline="central" className="dv-mute">{t}%</text>)}
        {rs.map((r, i) => { const x = P.l + step * (i + 0.5);
          return <g key={i} className="dv-hov"><rect x={x - bw / 2} y={Y(r.value)} width={bw} height={Y(0) - Y(r.value)} rx={7} fill={C(0)} opacity={0.88}><title>{`${r.label}: ${fmt(r.value, 0)} (${((r.value / tot) * 100).toFixed(1)}%)`}</title></rect>
            <text x={x} y={Y(r.value) - 6} textAnchor="middle" fontSize={11.5} className="dv-strong">{fmt(r.value, 0)}</text>
            {wrap(r.label, step - 4, 11.5, 2).map((s, k) => <text key={k} x={x} y={H - P.b + 16 + k * 13} textAnchor="middle" fontSize={11.5}>{s}</text>)}</g>; })}
        <polyline fill="none" stroke={C(1)} strokeWidth={2.4} strokeLinejoin="round" points={cum.map((v, i) => `${P.l + step * (i + 0.5)},${Y2(v)}`).join(" ")} />
        {cum.map((v, i) => <circle key={i} cx={P.l + step * (i + 0.5)} cy={Y2(v)} r={4} fill={C(1)} stroke={CARD} strokeWidth={1.6}><title>{`${t3("누적", "Cumulative", "累计")} ${v.toFixed(1)}%`}</title></circle>)}
      </svg>
      <div className="dv-legend"><span><i style={{ background: C(0) }} />{t3("빈도", "Frequency", "频数")}</span><span><i style={{ background: C(1) }} />{t3("누적 백분율", "Cumulative %", "累计百分比")}</span></div>
    </div>
  );
}
