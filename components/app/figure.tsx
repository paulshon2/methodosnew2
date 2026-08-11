"use client";
import type { ExampleFigure } from "@/lib/types";
import { ON_FILL } from "@/lib/design-tokens";

// 단계 도식 SVG (app.js renderFigure 이식)
export default function Figure({ fig }: { fig?: ExampleFigure | null }) {
  if (!fig || typeof fig !== "object") {
    return <div className="text-[12px] text-ink-3 p-2">도식 예시</div>;
  }
  const ins = fig.inputs?.length ? fig.inputs : ["입력"];
  const outs = fig.outputs?.length ? fig.outputs : ["산출물"];
  const step = (fig.step || "단계").slice(0, 14);
  const c = (v: string) => `var(${v})`;

  if (fig.type === "bar") {
    const vals = [40, 68, 52, 80, 60];
    return <svg viewBox="0 0 320 130" width="100%" height="130">
      {vals.map((v, i) => <rect key={i} x={20 + i * 58} y={110 - v} width="34" height={v} rx="3" fill={c("--brand")} opacity={0.5 + i * 0.1} />)}
      <line x1="14" y1="110" x2="306" y2="110" stroke={c("--color-border-secondary")} />
      <text x="160" y="126" textAnchor="middle" fontSize="10" fill={c("--color-text-tertiary")}>{step} · 막대 결과 예시</text></svg>;
  }
  if (fig.type === "line") {
    const pts = [20, 55, 40, 75, 60, 95, 88].map((y, i) => `${20 + i * 45},${110 - y}`).join(" ");
    return <svg viewBox="0 0 320 130" width="100%" height="130">
      <polyline points={pts} fill="none" stroke={c("--brand")} strokeWidth="2" />
      <line x1="14" y1="110" x2="306" y2="110" stroke={c("--color-border-secondary")} />
      <text x="160" y="126" textAnchor="middle" fontSize="10" fill={c("--color-text-tertiary")}>{step} · 추세 예시</text></svg>;
  }
  if (fig.type === "funnel") {
    const w = [260, 190, 110]; const lbl = ["검색", "선별", "포함"];
    return <svg viewBox="0 0 320 140" width="100%" height="140">{w.map((ww, i) => <g key={i}>
      <rect x={(320 - ww) / 2} y={15 + i * 40} width={ww} height="30" rx="4" fill={c("--brand")} opacity={0.8 - i * 0.2} />
      <text x="160" y={35 + i * 40} textAnchor="middle" fontSize="11" fill={ON_FILL}>{lbl[i]}</text></g>)}</svg>;
  }
  if (fig.type === "matrix") {
    const cells = [];
    for (let r = 0; r < 3; r++) for (let cc = 0; cc < 3; cc++)
      cells.push(<rect key={`${r}-${cc}`} x={20 + cc * 92} y={20 + r * 32} width="88" height="28" fill={r === 0 ? c("--brand-soft") : c("--color-background-secondary")} stroke={c("--color-border-tertiary")} />);
    return <svg viewBox="0 0 300 130" width="100%" height="130">{cells}<text x="150" y="124" textAnchor="middle" fontSize="10" fill={c("--color-text-tertiary")}>{step} · 코딩/범주 표 예시</text></svg>;
  }
  if (fig.type === "network") {
    const nodes = [[60, 60], [160, 30], [160, 95], [250, 60]]; const edges = [[0, 1], [0, 2], [1, 3], [2, 3]];
    return <svg viewBox="0 0 310 130" width="100%" height="130">
      {edges.map(([a, b], i) => <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={c("--color-border-secondary")} />)}
      {nodes.map((n, i) => <circle key={i} cx={n[0]} cy={n[1]} r="11" fill={c("--brand")} />)}
      <text x="155" y="124" textAnchor="middle" fontSize="10" fill={c("--color-text-tertiary")}>{step} · 관계 네트워크 예시</text></svg>;
  }
  // flow
  const h = Math.max(70, 24 + Math.max(ins.length, outs.length) * 40);
  const box = (x: number, y: number, label: string, fill: string, key: string) => (
    <g key={key}><rect x={x} y={y} width="140" height="34" rx="6" fill={fill} stroke={c("--color-border-secondary")} />
      <text x={x + 70} y={y + 22} textAnchor="middle" fontSize="11" fill={c("--color-text-primary")}>{String(label).slice(0, 14)}</text></g>);
  return <svg viewBox={`0 0 520 ${h}`} width="100%" height={h}>
    <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={c("--brand")} /></marker></defs>
    {ins.map((x, i) => box(8, 14 + i * 40, x, c("--color-background-secondary"), "i" + i))}
    <line x1="150" y1="30" x2="188" y2="30" stroke={c("--brand")} strokeWidth="1.5" markerEnd="url(#ah)" />
    {box(190, 14, step, c("--brand-soft"), "step")}
    <line x1="332" y1="30" x2="370" y2="30" stroke={c("--brand")} strokeWidth="1.5" markerEnd="url(#ah)" />
    {outs.map((x, i) => box(372, 14 + i * 40, x, c("--ok-soft"), "o" + i))}
  </svg>;
}
