/* 분석 시각화(dviz) 공통 부분 — 수학 함수, 눈금, 서식, 반응형 폭, 카드(요점·읽는 법·표로 보기·내보내기). */
import { useEffect, useRef, useState } from "react";
import { getLocale } from "./locale-ko.js";

// ───────────────────────── 언어 ─────────────────────────
export const lang = () => getLocale();
/** 한·영·중 글 고르기. 영어·중국어가 없으면 있는 것으로 대신한다. */
export const t3 = (ko, en, zh) => { const l = getLocale(); return l === "en" ? (en ?? ko) : l === "zh" ? (zh ?? en ?? ko) : ko; };

// ───────────────────────── 서식 ─────────────────────────
export const isNum = (v) => typeof v === "number" && Number.isFinite(v);
export function fmt(v, d = 3) {
  if (!isNum(v)) return "—";
  const a = Math.abs(v);
  if (a !== 0 && a < 1e-3) return v.toExponential(1);
  const p = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : d;
  return v.toFixed(p).replace(/^-0(\.0+)?$/, "0");
}
export const fmt2 = (v) => fmt(v, 2);
export const sgn = (v, d = 3) => (isNum(v) ? (v > 0 ? "+" : v < 0 ? "−" : "") + fmt(Math.abs(v), d) : "—");
export function fp(p) {
  if (!isNum(p)) return "p —";
  if (p < 0.001) return "p < .001";
  return "p = " + p.toFixed(3).replace(/^0/, "");
}
export const pctf = (v, d = 1) => (isNum(v) ? v.toFixed(d) + "%" : "—");
export const star = (p) => (!isNum(p) ? "" : p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : "");
export const clip = (s, n = 26) => (String(s ?? "").length > n ? String(s).slice(0, n - 1) + "…" : String(s ?? ""));

// ───────────────────────── 수학 ─────────────────────────
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function betacf(a, b, x) {
  const FP = 1e-300; let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}
export function betai(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 300; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 300; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
function erf(x) { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
export const cdfNorm = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
export const cdfT = (t, df) => { const p = 0.5 * betai(df / 2, 0.5, df / (df + t * t)); return t > 0 ? 1 - p : p; };
export const cdfF = (f, d1, d2) => (f <= 0 ? 0 : betai(d1 / 2, d2 / 2, (d1 * f) / (d1 * f + d2)));
export const cdfChi2 = (x, k) => gammaP(k / 2, x / 2);
export const pdfNorm = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
export const pdfT = (x, v) => Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)) / Math.sqrt(v * Math.PI) * Math.pow(1 + (x * x) / v, -(v + 1) / 2);
export const pdfChi2 = (x, k) => (x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)));
export const pdfF = (x, d1, d2) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lgamma(d1 / 2) + lgamma(d2 / 2) - lgamma((d1 + d2) / 2))));
function bisect(f, lo, hi) { for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; } return (lo + hi) / 2; }
export const qT = (p, df) => bisect((x) => cdfT(x, df) - p, -1e3, 1e3);
export const qNorm = (p) => bisect((x) => cdfNorm(x) - p, -40, 40);
export const qChi2 = (p, k) => bisect((x) => cdfChi2(x, k) - p, 0, 1e5);
export const qF = (p, d1, d2) => bisect((x) => cdfF(x, d1, d2) - p, 0, 1e6);
/** 신뢰구간 폭 → 표준오차 (정규 가정: 구간 폭 / 3.92) */
export const seFromCI = (lo, hi) => (hi - lo) / 3.92;

// ───────────────────────── 눈금 ─────────────────────────
export function niceTicks(lo, hi, n = 5) {
  if (!(hi > lo)) return [lo];
  const step0 = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0 / mag;
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag, out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toPrecision(12));
  return out;
}
export const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
export function extent(vals, pad = 0.06, include) {
  let v = vals.filter(isNum); if (include != null) v = v.concat(include);
  if (!v.length) return [0, 1];
  let lo = Math.min(...v), hi = Math.max(...v);
  if (lo === hi) { lo -= 1; hi += 1; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
export const tickFmt = (t) => (Math.abs(t) >= 1000 ? t.toFixed(0) : Math.abs(t) >= 10 ? +t.toFixed(1) : +t.toFixed(2)) + "";

// ───────────────────────── 글자 폭 ─────────────────────────
let _ctx; const _tw = new Map();
export function tw(s, px = 11.5, weight = 400) {
  const key = weight + "|" + px + "|" + s, hit = _tw.get(key); if (hit != null) return hit;
  if (_ctx === undefined) { try { _ctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null; } catch { _ctx = null; } }
  let w = 0;
  if (_ctx) { _ctx.font = `${weight} ${px}px 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif`; w = _ctx.measureText(String(s)).width * 1.03; }
  else for (const ch of String(s)) w += ch.charCodeAt(0) > 0x2e80 ? px : px * 0.58;
  if (_tw.size > 5000) _tw.clear(); _tw.set(key, w); return w;
}
export function wrap(s, maxW, px = 11.5, maxLines = 2) {
  const text = String(s ?? "").replace(/\s+/g, " ").trim(); if (!text) return [""];
  if (tw(text, px) <= maxW) return [text];
  const words = text.split(" "), lines = []; let cur = "";
  const pushLong = (w) => { let part = ""; for (const ch of w) { if (tw(part + ch, px) > maxW && part) { lines.push(part); part = ch; } else part += ch; } cur = part; };
  for (const w of words) { const t = cur ? cur + " " + w : w; if (tw(t, px) <= maxW) cur = t; else { if (cur) lines.push(cur); if (tw(w, px) <= maxW) cur = w; else pushLong(w); } }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); let last = keep[maxLines - 1] + "…"; while (tw(last, px) > maxW && last.length > 2) last = last.slice(0, -2) + "…"; keep[maxLines - 1] = last; return keep; }
  return lines;
}
/** 겹치는 세로 라벨을 밀어 편다 */
export function spread(ys, hs, lo, hi, gap = 2) {
  const idx = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]), out = ys.slice(); let prev = lo;
  for (const i of idx) { const top = Math.max(ys[i] - hs[i] / 2, prev); out[i] = top + hs[i] / 2; prev = top + hs[i] + gap; }
  const last = idx[idx.length - 1];
  if (last != null && out[last] + hs[last] / 2 > hi) { let limit = hi; for (let k = idx.length - 1; k >= 0; k--) { const i = idx[k], bottom = Math.min(out[i] + hs[i] / 2, limit); out[i] = bottom - hs[i] / 2; limit = bottom - hs[i] - gap; } }
  return out;
}

// ───────────────────────── 반응형 폭 ─────────────────────────
export function useBox(minW = 300, init = 640) {
  const ref = useRef(null), [w, setW] = useState(init);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const set = () => setW(Math.max(minW, Math.round(el.clientWidth) || init));
    set(); const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect();
  }, [minW, init]);
  return [ref, w];
}

// ───────────────────────── 색 ─────────────────────────
export const C = (i) => `var(--dv-c${(((i % 6) + 6) % 6) + 1})`;
export const INK = "var(--dv-ink)", INK2 = "var(--dv-ink2)", MUTE = "var(--dv-mute)", GRID = "var(--dv-grid)", AXIS = "var(--dv-axis)";
export const POS = "var(--dv-pos)", NEG = "var(--dv-neg)", OK = "var(--dv-ok)", WARN = "var(--dv-warn)", BAD = "var(--dv-bad)", CARD = "var(--dv-card)";

// ───────────────────────── 내보내기(SVG → 파일) ─────────────────────────
async function exportSvg(svg, format, filename, title) {
  const cs0 = getComputedStyle(svg);
  const bg = cs0.getPropertyValue("--dv-card").trim() || "#fff", fg = cs0.getPropertyValue("--dv-ink").trim() || "#000";
  const vb = svg.viewBox?.baseVal, rect = svg.getBoundingClientRect();
  const w = vb && vb.width ? vb.width : rect.width || 800, h = vb && vb.height ? vb.height : rect.height || 500, head = title ? 38 : 0, scale = 2;
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("viewBox", `0 0 ${w} ${h}`); clone.setAttribute("width", String(w)); clone.setAttribute("height", String(h));
  clone.setAttribute("font-family", "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif");
  clone.removeAttribute("class"); clone.removeAttribute("style");
  const o = [svg, ...svg.querySelectorAll("*")], c = [clone, ...clone.querySelectorAll("*")];
  o.forEach((el, i) => {
    const ce = c[i]; if (!ce) return; const st = getComputedStyle(el);
    for (const a of ["fill", "stroke", "stop-color"]) { const v = ce.getAttribute(a); if (v && v.includes("var(")) ce.setAttribute(a, st.getPropertyValue(a)); }
    if (/^(text|tspan)$/i.test(ce.tagName)) { ce.setAttribute("fill", st.getPropertyValue("fill")); const fw = st.getPropertyValue("font-weight"); if (fw && fw !== "400") ce.setAttribute("font-weight", fw); }
    if (ce.hasAttribute("class")) ce.removeAttribute("class");
  });
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("width", String(w)); r.setAttribute("height", String(h)); r.setAttribute("fill", bg); clone.insertBefore(r, clone.firstChild);
  const xml = new XMLSerializer().serializeToString(clone);
  const save = (href) => { const a = document.createElement("a"); a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); };
  if (format === "svg") { const u = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" })); save(u); setTimeout(() => URL.revokeObjectURL(u), 3000); return; }
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("이미지 변환 실패")); i.src = url; });
    const cv = document.createElement("canvas"); cv.width = Math.round(w * scale); cv.height = Math.round((h + head) * scale);
    const cx = cv.getContext("2d"); cx.fillStyle = bg; cx.fillRect(0, 0, cv.width, cv.height);
    if (title) { cx.fillStyle = fg; cx.font = `600 ${15 * scale}px 'Malgun Gothic','Noto Sans KR',sans-serif`; cx.fillText(title, 14 * scale, 25 * scale); }
    cx.drawImage(img, 0, head * scale, w * scale, h * scale);
    await new Promise((res) => cv.toBlob((b) => { if (b) { const u = URL.createObjectURL(b); save(u); setTimeout(() => URL.revokeObjectURL(u), 3000); } res(); }, "image/png"));
  } finally { URL.revokeObjectURL(url); }
}

// ───────────────────────── 카드 ─────────────────────────
/** 그림 한 장의 틀: 제목 · 한 줄 요점 · 그림 · 읽는 법 · 표로 보기 · 내보내기 */
export function DCard({ title, take, children, guide, data, wide, accent }) {
  const ref = useRef(null);
  const [showG, setShowG] = useState(false), [showT, setShowT] = useState(false), [hasSvg, setHasSvg] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => { const id = setTimeout(() => setHasSvg(!!ref.current?.querySelector("svg")), 250); return () => clearTimeout(id); });
  const save = async (fmt) => {
    const svgs = ref.current ? [...ref.current.querySelectorAll("svg[data-dv]")] : [];
    if (!svgs.length) return; const svg = svgs.reduce((m, x) => (x.getBoundingClientRect().width * x.getBoundingClientRect().height > m.getBoundingClientRect().width * m.getBoundingClientRect().height ? x : m), svgs[0]);
    setBusy(true); try { await exportSvg(svg, fmt, `${String(title).replace(/[^\w가-힣]+/g, "_").slice(0, 40)}.${fmt}`, title); } finally { setBusy(false); }
  };
  return (
    <section ref={ref} className={`dv-card${wide ? " dv-wide" : ""}`} style={accent ? { "--dv-accent": accent } : undefined}>
      <header className="dv-head">
        <h5 className="dv-title">{title}</h5>
        {take && <p className="dv-take">{take}</p>}
      </header>
      <div className="dv-body">{children}</div>
      <footer className="dv-foot">
        {guide && <button type="button" className="dv-btn" aria-expanded={showG} onClick={() => setShowG((v) => !v)}>{t3("읽는 법", "How to read", "阅读方法")}</button>}
        {data && <button type="button" className="dv-btn" aria-expanded={showT} onClick={() => setShowT((v) => !v)}>{t3("표로 보기", "Data table", "查看表格")}</button>}
        {hasSvg && <span className="dv-sp" />}
        {hasSvg && <button type="button" className="dv-btn dv-ghost" disabled={busy} onClick={() => save("png")}>PNG</button>}
        {hasSvg && <button type="button" className="dv-btn dv-ghost" disabled={busy} onClick={() => save("svg")}>SVG</button>}
      </footer>
      {showG && guide && <div className="dv-guide">{guide}</div>}
      {showT && data && (
        <div className="dv-tablewrap">
          <table className="dv-table">
            <thead><tr>{data.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{data.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{isNum(v) ? fmt(v) : v == null ? "" : String(v)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** 위쪽 요약 타일 */
export function Tiles({ items }) {
  return (
    <div className="dv-tiles">
      {items.map((t, i) => (
        <div key={i} className={`dv-tile${t.tone ? " dv-" + t.tone : ""}`}>
          <span className="dv-tk">{t.k}</span>
          <strong className="dv-tv">{t.v}</strong>
          {t.sub && <span className="dv-ts">{t.sub}</span>}
        </div>
      ))}
    </div>
  );
}

export function Empty({ text }) { return <p className="dv-empty">{text || t3("표시할 자료가 없습니다", "Nothing to show", "没有可显示的数据")}</p>; }
