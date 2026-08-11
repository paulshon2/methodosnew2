"use client";

/* MethodOS renew-18 · 정이십면체 오브 — 선명도·대비 강화 */

export type OrbState = "idle" | "listening" | "typing" | "answering";

export function mountOrb(
  cv: HTMLCanvasElement | null,
  stateRef: { current: OrbState },
  levelRef?: { current: number },
) {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const DPR = Math.min(window.devicePixelRatio || 1, 3);

  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ];
  const inv = 1 / Math.hypot(1, phi);
  const V = raw.map(([x, y, z]) => ({ x: x * inv, y: y * inv, z: z * inv }));

  const edges: [number, number][] = [];
  const d0 = Math.hypot(V[0].x - V[1].x, V[0].y - V[1].y, V[0].z - V[1].z);
  for (let i = 0; i < V.length; i++)
    for (let j = i + 1; j < V.length; j++) {
      const d = Math.hypot(V[i].x - V[j].x, V[i].y - V[j].y, V[i].z - V[j].z);
      if (Math.abs(d - d0) < 0.04) edges.push([i, j]);
    }

  const RING_N = 48;
  const RING_R = 1.12;

  let W = 0, H = 0, raf = 0, tt = 0, yaw = 0.35, smoothLvl = 0;
  const size = () => {
    const host = cv.parentElement;
    const w = host?.offsetWidth || cv.offsetWidth || 192;
    const h = host?.offsetHeight || cv.offsetHeight || 192;
    if (w < 8 || h < 8) return;
    const tw = Math.round(w * DPR);
    const th = Math.round(h * DPR);
    if (Math.round(w) === Math.round(W) && Math.round(h) === Math.round(H) && cv.width === tw && cv.height === th) return;
    W = w; H = h;
    cv.width = tw;
    cv.height = th;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };
  size();
  window.addEventListener("resize", size);
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => size()) : null;
  if (ro) {
    ro.observe(cv);
    if (cv.parentElement) ro.observe(cv.parentElement);
  }

  const frame = () => {
    size();
    if (!cv.width) {
      raf = requestAnimationFrame(frame);
      return;
    }
    tt += 0.016;
    const listen = stateRef.current === "listening";
    const rawLvl = Math.max(0, Math.min(1, levelRef?.current ?? 0));
    smoothLvl += (rawLvl - smoothLvl) * 0.22;
    const active = listen || smoothLvl > 0.04;
    yaw += active ? 0.018 + smoothLvl * 0.012 : 0.0048;
    const pit = -0.28 + Math.sin(tt * 0.4) * 0.06;
    const roll = Math.sin(tt * 0.18) * 0.12;

    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const R = W * 0.36;
    const F = 3.4;
    const br = active ? 1.05 + 0.04 * Math.sin(tt * 6.5) + smoothLvl * 0.06 : 1 + 0.018 * Math.sin(tt * 1.3);
    const cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const cp = Math.cos(pit), sp = Math.sin(pit);
    const cr = Math.cos(roll), sr = Math.sin(roll);

    const pj = (px: number, py: number, pz: number, sc: number) => {
      let x = px * cr - py * sr, y = px * sr + py * cr;
      const x2 = x * cyw - pz * syw;
      let z = x * syw + pz * cyw;
      const y2 = y * cp - z * sp;
      z = y * sp + z * cp;
      const s = (F / (F - z)) * sc;
      return { X: cx + x2 * R * s, Y: cy + y2 * R * s, z };
    };

    const halo = ctx.createRadialGradient(cx, cy, R * 0.12, cx, cy, R * 1.4);
    halo.addColorStop(0, "rgba(120,190,255,.22)");
    halo.addColorStop(0.5, "rgba(70,140,230,.1)");
    halo.addColorStop(1, "rgba(50,110,200,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
    ctx.fill();

    const P = V.map((v) => pj(v.x, v.y, v.z, br));
    const spin = -tt * 0.2;
    const ringPts = Array.from({ length: RING_N + 1 }, (_, i) => {
      const a = (i / RING_N) * Math.PI * 2 + spin;
      return pj(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R, br);
    });
    const strokeRing = (back: boolean) => {
      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i < RING_N; i++) {
        const a = ringPts[i], b = ringPts[i + 1];
        const dep = (a.z + b.z) / 2;
        const isBack = dep < 0;
        if (isBack !== back) { drawing = false; continue; }
        if ((i % 3) === 2) { drawing = false; continue; }
        if (!drawing) { ctx.moveTo(a.X, a.Y); drawing = true; }
        ctx.lineTo(b.X, b.Y);
      }
      ctx.strokeStyle = back ? "rgba(140,210,255,.28)" : "rgba(190,230,255,.55)";
      ctx.lineWidth = back ? 1.15 : 1.45;
      ctx.stroke();
    };
    strokeRing(true);

    const segs = edges.map(([i, j]) => {
      const a = P[i], b = P[j];
      return { a, b, dep: (a.z + b.z) / 2 };
    }).sort((u, v) => u.dep - v.dep);

    for (const { a, b, dep } of segs) {
      const k = 0.22 + 0.78 * ((dep + 1) / 2);
      ctx.lineWidth = 1.15 + 1.25 * k;
      ctx.strokeStyle = `rgba(185,225,255,${0.28 + 0.72 * k})`;
      ctx.beginPath();
      ctx.moveTo(a.X, a.Y);
      ctx.lineTo(b.X, b.Y);
      ctx.stroke();
    }

    strokeRing(false);

    [...P].sort((a, b) => a.z - b.z).forEach((p) => {
      const d = (p.z + 1) / 2;
      const r = 1.35 + 1.85 * d;
      ctx.beginPath();
      ctx.arc(p.X, p.Y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,250,255,${0.5 + 0.5 * Math.pow(d, 1.1)})`;
      ctx.fill();
    });

    const pulse = active ? 4.6 + Math.sin(tt * 7) * 0.9 + smoothLvl * 2.2 : 3.1 + Math.sin(tt * 1.5) * 0.5;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 2.5);
    g.addColorStop(0, "rgba(230,245,255,.72)");
    g.addColorStop(0.4, "rgba(170,215,255,.28)");
    g.addColorStop(1, "rgba(160,205,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, pulse * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    raf = requestAnimationFrame(frame);
  };
  frame();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", size);
    ro?.disconnect();
  };
}

export function mountField(
  cv: HTMLCanvasElement | null,
  monRef: { current: HTMLDivElement | null },
  stateRef: { current: OrbState },
) {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const DPR = window.devicePixelRatio || 1;
  const N = 30;
  const pts = Array.from({ length: N }, (_, i) => ({
    a: (i / N) * Math.PI * 2 + Math.random() * 0.4,
    base: 24 + Math.random() * 62,
    sp: (Math.random() - 0.5) * 0.006,
    sz: 0.9 + Math.random() * 1.4,
    ox: (Math.random() - 0.5) * 20,
    oy: (Math.random() - 0.5) * 15,
    r: 0, x: 0, y: 0, tx: 0, ty: 0,
  }));
  pts.forEach((p) => (p.r = p.base));
  let W = 0, H = 0, raf = 0, t = 0, m = 0;
  const size = () => {
    const w = cv.offsetWidth || 340;
    const h = cv.offsetHeight || 452;
    if (w < 8 || h < 8) return;
    const tw = Math.round(w * DPR);
    const th = Math.round(h * DPR);
    if (Math.round(w) === Math.round(W) && Math.round(h) === Math.round(H) && cv.width === tw && cv.height === th) return;
    W = w; H = h;
    cv.width = tw;
    cv.height = th;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  size();
  window.addEventListener("resize", size);
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => size()) : null;
  ro?.observe(cv);
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  const frame = () => {
    size();
    if (!cv.width) {
      raf = requestAnimationFrame(frame);
      return;
    }
    t += 0.016;
    const st = stateRef.current;
    const termMode = st === "typing" || st === "answering";
    m += ((termMode ? 1 : 0) - m) * 0.055;
    const e = ease(Math.max(0, Math.min(1, m)));
    const cx = W / 2, cy = H / 2 - 4;
    const listen = st === "listening", think = st === "answering";
    const speed = think ? 3.2 : listen ? 2 : 1;

    let mx = cx, my = cy;
    const el = monRef.current;
    if (el && el.offsetWidth > 4) {
      let left = 0, top = 0;
      let node: HTMLElement | null = el;
      const stop = cv.offsetParent as HTMLElement | null;
      while (node && node !== stop) {
        left += node.offsetLeft;
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      mx = left + el.offsetWidth / 2;
      my = top + el.offsetHeight * 0.42;
    }
    pts.forEach((p) => { p.tx = mx + p.ox; p.ty = my + p.oy; });

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8);
    g.addColorStop(0, "rgb(12,22,40)");
    g.addColorStop(1, "rgb(6,9,16)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    pts.forEach((p, i) => {
      let tg = p.base;
      if (listen) tg = p.base * (1.5 + 0.32 * Math.sin(t * 6 + i));
      if (think) tg = p.base * (0.48 + 0.06 * Math.sin(t * 3 + i * 0.5));
      p.r += (tg - p.r) * 0.07;
      p.a += p.sp * speed;
      const ox = cx + Math.cos(p.a) * p.r, oy = cy + Math.sin(p.a) * p.r * 0.72;
      p.x = ox + (p.tx - ox) * e;
      p.y = oy + (p.ty - oy) * e;
    });

    const fade = Math.pow(1 - e, 1.6);
    if (fade > 0.02) {
      ctx.lineWidth = 0.8;
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 58) {
            ctx.strokeStyle = `rgba(120,190,255,${0.3 * (1 - d / 58) * fade})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz * (0.4 + 0.6 * fade), 0, 6.29);
        ctx.fillStyle = `rgba(226,240,255,${fade})`;
        ctx.fill();
      });
    }
    raf = requestAnimationFrame(frame);
  };
  frame();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", size);
    ro?.disconnect();
  };
}
