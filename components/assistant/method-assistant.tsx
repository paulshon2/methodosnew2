"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/store/app-store";
import { aiComplete, provById } from "@/lib/engine";

/* ══════════════════════════════════════════════════════════════════════
   MethodOS · 연구 어시스턴트 (Polyhedron ⇄ Amber CRT)

   상태 기계
     idle / listening   → 정이십면체 와이어프레임이 회전하며 대기·청취
     typing / answering → 다면체가 브라운관 안으로 수렴하며 호박색 CRT 로 변형

   입출력
     🎤 음성 → 브라우저 STT(Web Speech API) → 텍스트
     ⌨️ 텍스트 → 그대로
        └→ lib/engine 의 aiComplete() → 설정에 저장된 공급자·키로 직접 호출
             (기본값 Google Gemini 2.5 Flash) → 💬 텍스트 답변

   ※ 별도의 서버 라우트를 두지 않고, 이 앱이 이미 쓰고 있는 AI 엔진을 그대로 쓴다.
   ══════════════════════════════════════════════════════════════════════ */

type State = "idle" | "listening" | "typing" | "answering";
interface Line { id: number; kind: "q" | "a" | "sys"; text: string }

const SYSTEM = [
  "당신은 연구방법 운영체제 MethodOS 에 내장된 연구방법 어시스턴트입니다.",
  "연구설계·방법론적 아키타입·표본·측정·통계분석·질적 코딩·시각화 전반에 답합니다.",
  "",
  "규칙:",
  "1) 학술적 정확성을 최우선으로 하고, 방법론·통계 용어는 정식 명칭을 씁니다.",
  "2) 절차를 묻는 질문은 번호를 매긴 단계로 답합니다.",
  "3) 확실하지 않은 것은 단정하지 말고 한계를 함께 밝힙니다.",
  "4) 존재하지 않는 문헌·저자·DOI 를 만들어내지 않습니다.",
  "5) 음성으로 읽히는 경우가 있으므로 표·코드블록 대신 문장과 번호 목록을 씁니다.",
  "6) 한국어로, 6~12문장 이내로 간결하게 답합니다.",
].join("\n");

export default function MethodAssistant({
  sidebarWidth = 0,
  contentMaxWidth = 0,
}: { sidebarWidth?: number; contentMaxWidth?: number } = {}) {
  const settings = useStore((s) => s.settings);

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState(1);

  const orbRef = useRef<HTMLCanvasElement | null>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const monRef = useRef<HTMLDivElement | null>(null);
  const scrRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const recRef = useRef<any>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<State>("idle");
  const seq = useRef(0);
  const booted = useRef(false);

  stateRef.current = state;
  const term = state === "typing" || state === "answering";

  const providerLabel = provById(settings?.provider || "google")?.name ?? "Google";
  const modelLabel = settings?.model || "gemini-2.5-flash";

  /* ── 유휴 복귀 ─────────────────────────────────────────── */
  const scheduleIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (stateRef.current === "answering") return;
      if (inputRef.current?.value.trim()) return scheduleIdle();
      setState("idle");
    }, 10_000);
  }, []);
  useEffect(() => {
    if (term && state !== "answering") scheduleIdle();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [term, state, scheduleIdle]);

  const push = useCallback((kind: Line["kind"], text: string) => {
    const id = ++seq.current;
    setLines((p) => [...p, { id, kind, text }]);
    return id;
  }, []);

  useEffect(() => {
    if (term && !booted.current) {
      booted.current = true;
      setLines([
        { id: ++seq.current, kind: "sys", text: "Every method has a next step" },
        { id: ++seq.current, kind: "sys", text: "READY." },
      ]);
    }
  }, [term]);

  useEffect(() => {
    if (scrRef.current) scrRef.current.scrollTop = scrRef.current.scrollHeight;
  }, [lines]);

  /* ── 타자기 출력 ───────────────────────────────────────── */
  const typeOut = useCallback((full: string) => {
    const id = push("a", "");
    let i = 0;
    const step = () => {
      if (i >= full.length) {
        setProgress(1);
        push("sys", "READY.");
        setState("typing");
        return;
      }
      i += 2;
      const slice = full.slice(0, i);
      setLines((p) => p.map((l) => (l.id === id ? { ...l, text: slice } : l)));
      setProgress(Math.min(1, i / full.length));
      setTimeout(step, 16);
    };
    step();
  }, [push]);

  /* ── 질문 → 답변 (설정에 저장된 AI 공급자 직접 호출) ────── */
  const ask = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setState("typing");
    push("q", q);
    setDraft("");
    setProgress(0);
    setState("answering");
    const pending = push("sys", "THINKING...");

    try {
      const text = await aiComplete(`${SYSTEM}\n\n[질문]\n${q}`, {
        ...settings,
        preferErrorText: true,
        maxTokens: 1600,
      });
      setLines((p) => p.filter((l) => l.id !== pending));
      if (!text || !String(text).trim()) {
        push("sys", "?ERROR 빈 응답입니다. 설정에서 모델을 확인하세요.");
        setProgress(1);
        setState("typing");
        return;
      }
      typeOut(String(text));
    } catch (e) {
      setLines((p) => p.filter((l) => l.id !== pending));
      push("sys", `?ERROR ${e instanceof Error ? e.message : "호출 실패"}`);
      setProgress(1);
      setState("typing");
    }
  }, [push, settings, typeOut]);

  /* ── 음성 인식 ─────────────────────────────────────────── */
  const stopListen = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* noop */ }
      recRef.current = null;
    }
    setState((s) => (s === "listening" ? "idle" : s));
  }, []);

  const startListen = useCallback(() => {
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) { setNote("이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome/Edge 권장)"); return; }
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setState("listening");
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setDraft(txt);
      if (e.results[e.results.length - 1].isFinal) { stopListen(); void ask(txt); }
    };
    rec.onerror = (e: any) => { stopListen(); setNote(`MIC ERR: ${e?.error ?? ""}`); };
    rec.onend = () => stopListen();
    recRef.current = rec;
    try { rec.start(); } catch { /* 이미 실행 중 */ }
  }, [ask, stopListen]);

  useEffect(() => () => stopListen(), [stopListen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); stopListen(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [stopListen]);

  /* ── 캔버스 ────────────────────────────────────────────── */
  /* s-renew-12: 마운트 1회 유지 + 논리 해상도 고정.
     CSS scale/opacity 전환과 무관하게 백킹스토어는 레이아웃 크기×DPR 만 쓴다. */
  useEffect(() => mountOrb(orbRef.current, stateRef), []);
  useEffect(() => {
    if (!open) return;
    return mountField(bgRef.current, monRef, stateRef);
  }, [open]);

  return (
    <div
      className={`ma-root${open ? " ma-open" : ""}${term ? " ma-term" : ""}${state === "answering" ? " ma-busy" : ""}`}
      style={{
        ["--ma-sidebar" as any]: `${sidebarWidth}px`,
        ["--ma-maxw" as any]: contentMaxWidth ? `${contentMaxWidth}px` : "100vw",
      }}
    >
      <style>{CSS}</style>

      <div className="ma-orbwrap">
        <button type="button" className="ma-orb" aria-label="연구방법 어시스턴트 열기"
          onClick={() => { setOpen(true); setState("idle"); setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 300); }}>
          <canvas ref={orbRef} />
        </button>
      </div>

      <div className="ma-panel" role="dialog" aria-label="연구방법 어시스턴트">
        <canvas className="ma-bg" ref={bgRef} />

        <div className="ma-hd">
          <span className="ma-badge">{term ? "METHOD-DOS" : "POLYHEDRON"}</span>
          <span className="ma-st">
            {state === "idle" && "대기 중"}
            {state === "listening" && "듣는 중… 말씀하세요"}
            {state === "typing" && "READY."}
            {state === "answering" && "THINKING..."}
          </span>
          <button type="button" className="ma-x" aria-label="닫기"
            onClick={() => { setOpen(false); stopListen(); setState("idle"); }}>×</button>
        </div>

        <div className="ma-body">
          <div className="ma-hint">
            <p className="ma-hint-t">연구방법, 무엇이든 물어보세요</p>
            <p className="ma-hint-s">마이크를 누르고 말하거나, 아래에 바로 입력하세요</p>
          </div>

          <div className="ma-mon" ref={monRef}>
            <div className="ma-bezel">
              <div className="ma-screen">
                <span className="ma-sweep" />
                <div className="ma-scr" ref={scrRef}>
                  {lines.map((l) => (
                    <div key={l.id} className={`ma-ln ma-${l.kind}`}>
                      {l.kind === "q" ? "> " : ""}{l.text}
                      {l.kind === "a" && state === "answering" && <span className="ma-cur" />}
                    </div>
                  ))}
                </div>
                <div className="ma-pbar"><i style={{ width: `${(progress * 100).toFixed(1)}%` }} /></div>
              </div>
              <span className="ma-vent">{Array.from({ length: 6 }).map((_, i) => <i key={i} />)}</span>
            </div>
            <div className="ma-chin">
              <span className="ma-led" />
              <span className="ma-brand">METHODOS-24</span>
              <span className="ma-knob" />
            </div>
          </div>
        </div>

        <div className="ma-ft">
          <div className="ma-deck">
            <button type="button" className="ma-key" aria-label="음성으로 질문"
              aria-pressed={state === "listening"}
              onClick={() => (state === "listening" ? stopListen() : startListen())}>
              <svg viewBox="0 0 9 9" fill="currentColor" aria-hidden>
                <rect x="3" y="1" width="3" height="3" /><rect x="2" y="4" width="1" height="1" />
                <rect x="6" y="4" width="1" height="1" /><rect x="3" y="4" width="3" height="1" />
                <rect x="2" y="5" width="5" height="1" /><rect x="4" y="6" width="1" height="1" />
                <rect x="3" y="7" width="3" height="1" />
              </svg>
            </button>

            <div className="ma-well">
              <span className="ma-prompt">&gt;</span>
              <textarea ref={inputRef} rows={1} value={draft}
                placeholder="표본 크기는 어떻게 정하나요?"
                onFocus={() => state !== "answering" && setState("typing")}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (e.target.value && state !== "answering") setState("typing"); else scheduleIdle();
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(draft); } }}
              />
            </div>

            <button type="button" className="ma-key" aria-label="질문 보내기" onClick={() => void ask(draft)}>
              <svg viewBox="0 0 9 9" fill="currentColor" aria-hidden>
                <rect x="2" y="1" width="1" height="7" /><rect x="3" y="2" width="1" height="5" />
                <rect x="4" y="3" width="1" height="3" /><rect x="5" y="4" width="1" height="1" />
                <rect x="6" y="4" width="1" height="1" />
              </svg>
            </button>
          </div>
        </div>
        <div className="ma-note">{note || `${providerLabel} · ${modelLabel}`}</div>
      </div>
    </div>
  );
}

/* ══════ 오브 : 정이십면체 와이어프레임 ══════
   RDOS 의 '별자리 구체'와 구분 — 규칙적인 다면체 골격만 그린다.
   s-renew-12: 밀집 적도링·헤어라인·좌표 snap 을 제거해 골격이 읽히게 한다.
   백킹스토어는 레이아웃 크기(offset*)×DPR 로만 잡고, CSS scale 과 분리한다. */
function mountOrb(cv: HTMLCanvasElement | null, stateRef: { current: State }) {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const DPR = Math.min(window.devicePixelRatio || 1, 2.5);

  /* 정이십면체 12정점 (황금비) */
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ];
  const inv = 1 / Math.hypot(1, phi);
  const V = raw.map(([x, y, z]) => ({ x: x * inv, y: y * inv, z: z * inv }));

  /* 정점 간 최단거리 = 모서리 30개 */
  const edges: [number, number][] = [];
  const d0 = Math.hypot(V[0].x - V[1].x, V[0].y - V[1].y, V[0].z - V[1].z);
  for (let i = 0; i < V.length; i++)
    for (let j = i + 1; j < V.length; j++) {
      const d = Math.hypot(V[i].x - V[j].x, V[i].y - V[j].y, V[i].z - V[j].z);
      if (Math.abs(d - d0) < 0.04) edges.push([i, j]);
    }

  /* 얇은 궤도 링 — 점선 16분절 (구면 메시처럼 보이지 않게) */
  const RING_N = 48;
  const RING_R = 1.12;

  let W = 0, H = 0, raf = 0, tt = 0, yaw = 0.35;
  const size = () => {
    /* offset* 는 transform(scale) 을 무시하므로 패널 개폐와 무관하게 안정적이다. */
    const host = cv.parentElement;
    const w = host?.offsetWidth || cv.offsetWidth || 176;
    const h = host?.offsetHeight || cv.offsetHeight || 176;
    if (w < 8 || h < 8) return;
    const tw = Math.round(w * DPR);
    const th = Math.round(h * DPR);
    /* 브라우저 캔버스 기본값(300×150)을 ‘이미 준비됨’으로 오인하지 않는다.
       논리 크기와 백킹스토어가 둘 다 맞을 때만 건너뛴다. */
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
    if (!cv.width) { raf = requestAnimationFrame(frame); return; }

    /* 패널이 열려 투명·축소된 동안에도 풀해상도로 계속 그린다.
       (숨기는 동안 멈추면 다시 보일 때 한 프레임 공백이 난다) */
    tt += 0.016;
    const listen = stateRef.current === "listening";
    yaw += listen ? 0.018 : 0.0048;
    const pit = -0.28 + Math.sin(tt * 0.4) * 0.06;
    const roll = Math.sin(tt * 0.18) * 0.12;

    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const R = W * 0.34;          /* 이전 0.29 → 골격이 윤곽 안에서 또렷하게 */
    const F = 3.4;
    const br = listen ? 1.05 + 0.04 * Math.sin(tt * 6.5) : 1 + 0.018 * Math.sin(tt * 1.3);
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

    /* 은은한 후광 — 선이 뭉개져 보이지 않도록 아주 약하게 */
    const halo = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.35);
    halo.addColorStop(0, "rgba(90,150,230,.14)");
    halo.addColorStop(0.55, "rgba(50,110,200,.06)");
    halo.addColorStop(1, "rgba(50,110,200,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
    ctx.fill();

    const P = V.map((v) => pj(v.x, v.y, v.z, br));

    /* 궤도 링 — 뒤쪽만 먼저, 앞쪽은 골격 뒤에 얹지 않고 마지막에 */
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
        /* 점선 리듬 — 짝수 분절만 */
        if ((i % 3) === 2) { drawing = false; continue; }
        if (!drawing) { ctx.moveTo(a.X, a.Y); drawing = true; }
        ctx.lineTo(b.X, b.Y);
      }
      ctx.strokeStyle = back ? "rgba(120,190,255,.14)" : "rgba(150,210,255,.32)";
      ctx.lineWidth = back ? 1 : 1.15;
      ctx.stroke();
    };
    strokeRing(true);

    /* 모서리 — 깊이 정렬 후 뒤→앞. CSS px 단위 굵기(헤어라인 금지). */
    const segs = edges.map(([i, j]) => {
      const a = P[i], b = P[j];
      return { a, b, dep: (a.z + b.z) / 2 };
    }).sort((u, v) => u.dep - v.dep);

    for (const { a, b, dep } of segs) {
      const k = 0.18 + 0.82 * ((dep + 1) / 2);
      ctx.lineWidth = 0.95 + 1.05 * k;
      ctx.strokeStyle = `rgba(155,210,255,${0.12 + 0.78 * k})`;
      ctx.beginPath();
      ctx.moveTo(a.X, a.Y);
      ctx.lineTo(b.X, b.Y);
      ctx.stroke();
    }

    strokeRing(false);

    /* 정점 — 작은 원형 노드 */
    [...P].sort((a, b) => a.z - b.z).forEach((p) => {
      const d = (p.z + 1) / 2;
      const r = 1.1 + 1.5 * d;
      ctx.beginPath();
      ctx.arc(p.X, p.Y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,244,255,${0.35 + 0.65 * Math.pow(d, 1.2)})`;
      ctx.fill();
    });

    /* 중심핵 */
    const pulse = listen ? 4.2 + Math.sin(tt * 7) * 0.8 : 2.8 + Math.sin(tt * 1.5) * 0.45;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 2.4);
    g.addColorStop(0, "rgba(200,230,255,.55)");
    g.addColorStop(0.45, "rgba(160,205,255,.18)");
    g.addColorStop(1, "rgba(160,205,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, pulse * 2.4, 0, Math.PI * 2);
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

/* ══════ 패널 배경 : 노드가 모니터로 수렴하며 소멸 ══════ */
function mountField(
  cv: HTMLCanvasElement | null,
  monRef: { current: HTMLDivElement | null },
  stateRef: { current: State },
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
  /* 패널도 열릴 때 scale(.95) 전환을 거치므로 rect 대신 레이아웃 크기를 쓴다. */
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
    if (!cv.width) { raf = requestAnimationFrame(frame); return; }
    t += 0.016;
    const st = stateRef.current;
    const termMode = st === "typing" || st === "answering";
    m += ((termMode ? 1 : 0) - m) * 0.055;
    const e = ease(Math.max(0, Math.min(1, m)));
    const cx = W / 2, cy = H / 2 - 4;
    const listen = st === "listening", think = st === "answering";
    const speed = think ? 3.2 : listen ? 2 : 1;

    /* 모니터 중심 — 조상 transform 에 흔들리지 않도록 offsetParent 체인으로 누적한다.
       (캔버스는 패널 안에서 inset:0 이므로 패널 기준 좌표가 곧 캔버스 좌표다) */
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
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

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
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      pts.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * (0.4 + 0.6 * fade), 0, 6.29);
        ctx.fillStyle = `rgba(226,240,255,${fade})`; ctx.fill();
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

/* ══════════════════════════ 스타일 ══════════════════════════
   RDOS 는 P1 녹색 인광, MethodOS 는 P3 호박색 인광을 쓴다.       */
const CSS = `
.ma-root{position:fixed;bottom:24px;z-index:1200;
  /* 이 앱의 본문은 남는 폭 안에서 가운데 정렬(mx-auto)이므로,
     오브도 그 컬럼의 오른쪽 끝에 맞춘다. */
  right:max(24px, calc((100vw - var(--ma-sidebar,0px) - var(--ma-maxw,100vw)) / 2 + 24px));
  --ph:#ffb64a;--phDim:#8a5c12;--scr0:#1b1204;--scr1:#070402;
  --panelBg:#0a0e16;--panelFg:#cbd8ee;--bord:rgba(120,175,255,.18);
  --caseA:#2b2e33;--caseB:#181a1e;--caseC:#3b3f45}
.ma-orbwrap{position:relative;width:176px;height:176px;transition:opacity .25s,transform .32s cubic-bezier(.2,1.2,.4,1);
  /* scale 이 캔버스 비트맵에 영향을 주지 않도록 자체 레이어 */
  transform:translateZ(0);will-change:transform,opacity}
.ma-orbwrap:hover{transform:translateZ(0) scale(1.06)}
.ma-root.ma-open .ma-orbwrap{transform:translateZ(0) scale(.3);opacity:0;pointer-events:none}
.ma-orb{position:relative;width:176px;height:176px;border:0;border-radius:50%;padding:0;cursor:pointer;
  background:transparent;animation:ma-bob 5.6s ease-in-out infinite;overflow:hidden}
@keyframes ma-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.ma-orb canvas{position:absolute;inset:0;width:100%;height:100%;display:block;
  /* 마스크를 약하게 — 가장자리만 페이드, 골격 본문은 선명 */
  -webkit-mask-image:radial-gradient(circle at 50% 50%,#000 78%,rgba(0,0,0,.85) 90%,transparent 100%);
  mask-image:radial-gradient(circle at 50% 50%,#000 78%,rgba(0,0,0,.85) 90%,transparent 100%)}
/* 윤곽 — 얇은 원환만 (안쪽 glow 과다 시 와이어가 번져 보임) */
.ma-orb::after{content:"";position:absolute;inset:8%;border-radius:50%;pointer-events:none;z-index:2;
  border:1px solid rgba(130,195,255,.28);
  box-shadow:inset 0 0 14px rgba(60,120,220,.12),0 0 16px rgba(50,110,210,.12)}
.ma-panel{position:absolute;right:0;bottom:0;width:340px;max-width:calc(100vw - 28px);
  height:452px;max-height:calc(100dvh - 48px);border-radius:14px;overflow:hidden;
  background:var(--panelBg);border:1px solid var(--bord);box-shadow:0 26px 64px rgba(0,0,0,.55);
  display:flex;flex-direction:column;opacity:0;visibility:hidden;
  transform:translateY(12px) scale(.95);transform-origin:bottom right;
  transition:opacity .22s,transform .32s cubic-bezier(.2,1,.3,1),border-color .5s}
.ma-root.ma-open .ma-panel{opacity:1;visibility:visible;transform:none}
.ma-bg{position:absolute;inset:0;width:100%;height:100%}
.ma-hd{position:relative;z-index:3;display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--bord)}
.ma-badge{font-family:ui-monospace,Menlo,monospace;font-size:8.5px;letter-spacing:.1em;padding:5px 7px;
  border-radius:4px;border:1px solid var(--bord);color:var(--panelFg);white-space:nowrap;transition:.45s}
.ma-root.ma-term .ma-badge{border-color:var(--phDim);color:var(--ph);text-shadow:0 0 6px var(--ph);background:rgba(0,0,0,.3)}
.ma-st{font-size:11.5px;color:var(--panelFg);opacity:.75;flex:1;transition:.45s}
.ma-root.ma-term .ma-st{color:var(--ph);opacity:1;font-family:ui-monospace,Menlo,monospace;
  font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;text-shadow:0 0 7px var(--ph)}
.ma-x{border:0;background:transparent;cursor:pointer;color:var(--panelFg);opacity:.55;font-size:17px;line-height:1;padding:2px 6px}
.ma-body{position:relative;z-index:3;flex:1;display:flex;align-items:center;justify-content:center;padding:8px;min-height:0}
.ma-hint{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:9px;text-align:center;padding:0 26px;transition:opacity .35s;pointer-events:none}
.ma-root.ma-term .ma-hint{opacity:0}
.ma-hint-t{font-size:13px;color:var(--panelFg);margin:0}
.ma-hint-s{font-size:11px;opacity:.55;line-height:1.65;color:var(--panelFg);margin:0}
.ma-mon{width:288px;max-width:100%;opacity:0;transform:scale(.92);pointer-events:none;
  transition:opacity .3s,transform .4s cubic-bezier(.2,1,.3,1)}
.ma-root.ma-term .ma-mon{opacity:1;transform:none;pointer-events:auto}
.ma-bezel{position:relative;padding:11px 11px 13px;border-radius:12px 12px 9px 9px;
  background:linear-gradient(160deg,var(--caseC),var(--caseA) 34%,var(--caseB));
  box-shadow:0 10px 22px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.1),inset 0 -2px 4px rgba(0,0,0,.5)}
.ma-vent{position:absolute;right:11px;bottom:4px;display:flex;gap:2px}
.ma-vent i{width:2px;height:5px;background:rgba(0,0,0,.45);border-radius:1px}
.ma-screen{position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;border-radius:22px/28px;
  background:radial-gradient(120% 120% at 50% 45%,var(--scr0),var(--scr1) 78%);
  box-shadow:inset 0 0 34px rgba(0,0,0,.9),0 0 0 2px #0d0b08;animation:ma-flick 5.5s steps(1) infinite}
@keyframes ma-flick{0%,94%,100%{filter:brightness(1)}95%{filter:brightness(1.13)}96%{filter:brightness(.94)}97%{filter:brightness(1.06)}}
.ma-root.ma-term .ma-screen{animation:ma-flick 5.5s steps(1) infinite,ma-power .55s ease-out 1}
@keyframes ma-power{0%{transform:scaleY(.006) scaleX(.7);filter:brightness(4)}42%{transform:scaleY(.03) scaleX(1);filter:brightness(3)}100%{transform:none;filter:brightness(1)}}
.ma-screen::before{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;
  background:repeating-linear-gradient(rgba(0,0,0,.42) 0 1px,transparent 1px 3px)}
.ma-screen::after{content:"";position:absolute;inset:0;z-index:5;pointer-events:none;border-radius:inherit;
  background:radial-gradient(115% 115% at 50% 42%,transparent 52%,rgba(0,0,0,.5) 88%,rgba(0,0,0,.75)),
    linear-gradient(122deg,rgba(255,255,255,.09) 0 16%,transparent 34%)}
.ma-sweep{position:absolute;left:0;right:0;height:56px;z-index:3;pointer-events:none;
  background:linear-gradient(rgba(255,255,255,0),rgba(255,255,255,.055),rgba(255,255,255,0));
  animation:ma-roll 6.5s linear infinite}
@keyframes ma-roll{0%{top:-60px}100%{top:100%}}
.ma-scr{position:absolute;inset:0;z-index:2;overflow-y:auto;padding:11px 12px 22px;
  font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px;line-height:1.5;
  color:var(--ph);letter-spacing:.02em;word-break:break-word;
  text-shadow:0 0 4px var(--ph),.6px 0 rgba(255,60,0,.28),-.6px 0 rgba(0,150,255,.24)}
.ma-scr::-webkit-scrollbar{width:0}
.ma-ln{margin-bottom:5px;white-space:pre-wrap}
.ma-sys{color:var(--phDim);text-shadow:0 0 4px var(--phDim);font-size:11px}
.ma-q{opacity:.86}
.ma-a{filter:brightness(1.12)}
.ma-cur{display:inline-block;width:7px;height:11px;background:var(--ph);vertical-align:-1px;
  box-shadow:0 0 8px var(--ph);animation:ma-blink .9s steps(1) infinite}
@keyframes ma-blink{0%,50%{opacity:1}50.01%,100%{opacity:0}}
.ma-pbar{position:absolute;left:11px;right:11px;bottom:9px;height:7px;z-index:3;
  border:1px solid var(--phDim);opacity:0;transition:opacity .25s}
.ma-root.ma-busy .ma-pbar{opacity:1}
.ma-pbar i{display:block;height:100%;transition:width .12s linear;
  background:repeating-linear-gradient(90deg,var(--ph) 0 3px,transparent 3px 5px)}
.ma-chin{display:flex;align-items:center;gap:6px;margin-top:9px;padding:0 2px}
.ma-led{width:6px;height:6px;border-radius:50%;background:#3a1a10;transition:.4s}
.ma-root.ma-term .ma-led{background:var(--ph);box-shadow:0 0 8px var(--ph)}
.ma-brand{font-family:ui-monospace,Menlo,monospace;font-size:7px;color:#6f7378;letter-spacing:.14em}
.ma-knob{margin-left:auto;width:9px;height:9px;border-radius:50%;background:linear-gradient(140deg,#4c4f54,#24262a)}
.ma-ft{position:relative;z-index:3;padding:10px 11px 11px;
  background:linear-gradient(180deg,var(--caseC),var(--caseA) 40%,var(--caseB));
  border-top:1px solid rgba(0,0,0,.6);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
.ma-deck{display:flex;gap:8px;align-items:stretch}
.ma-key{width:40px;flex:none;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(0,0,0,.7);color:#d2d6db;
  background:linear-gradient(180deg,#4e5257,#343840 48%,#26292e);
  box-shadow:0 3px 0 #15171a,0 5px 7px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.22);
  transition:transform .06s,box-shadow .06s,color .35s}
.ma-key:active{transform:translateY(3px);box-shadow:0 0 0 #15171a,inset 0 1px 3px rgba(0,0,0,.6)}
.ma-key svg{width:17px;height:17px;shape-rendering:crispEdges}
.ma-root.ma-term .ma-key{color:var(--ph);filter:drop-shadow(0 0 4px var(--ph))}
.ma-key[aria-pressed="true"]{color:#ff5a5a;filter:drop-shadow(0 0 6px #ff3b3b)}
.ma-well{flex:1;position:relative;display:flex;align-items:flex-start;gap:6px;padding:6px 9px;
  border-radius:3px;overflow:hidden;border:1px solid rgba(0,0,0,.85);
  background:radial-gradient(120% 130% at 50% 40%,var(--scr0),var(--scr1) 85%);
  box-shadow:inset 0 2px 7px rgba(0,0,0,.95),inset 0 0 0 1px var(--phDim)}
.ma-well::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(rgba(0,0,0,.34) 0 1px,transparent 1px 3px)}
.ma-prompt{font-family:ui-monospace,Menlo,monospace;font-size:14px;line-height:1.5;color:var(--ph);
  text-shadow:0 0 6px var(--ph);user-select:none}
.ma-well textarea{flex:1;background:transparent;border:0;outline:none;resize:none;height:26px;max-height:84px;
  padding:1px 0 0;font-family:ui-monospace,Menlo,monospace;font-size:14px;line-height:1.5;
  color:var(--ph);text-shadow:0 0 6px var(--ph);scrollbar-width:none}
.ma-well textarea::-webkit-scrollbar{display:none}
.ma-well textarea::placeholder{color:var(--phDim);text-shadow:none}
.ma-note{position:relative;z-index:3;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;text-align:center;
  color:var(--phDim);padding:4px 12px 6px;min-height:8px;background:var(--caseB)}

@media (max-width:1023px){
  /* 이 앱의 하단 탭바(약 58px) 위로 띄우고, 시트로 열릴 때는 탭바(z-40)보다 위로 */
  .ma-root{right:14px;bottom:calc(58px + env(safe-area-inset-bottom,0px) + 12px)}
  .ma-root.ma-open{z-index:60}
  .ma-orbwrap,.ma-orb{width:124px;height:124px}
  .ma-panel{position:fixed;left:0;right:0;bottom:0;width:100vw;max-width:100vw;
    height:min(78dvh,560px);max-height:78dvh;border-radius:16px 16px 0 0;transform-origin:bottom center;
    transform:translateY(16px);
    padding-bottom:calc(58px + env(safe-area-inset-bottom,0px))}
  .ma-root.ma-open .ma-panel{transform:none}
  .ma-mon{width:min(300px,86vw)}
  .ma-hd{padding:12px 14px}
  .ma-key{width:46px}
  .ma-well textarea,.ma-prompt{font-size:16px}
}
@media (prefers-reduced-motion:reduce){
  .ma-orb,.ma-screen,.ma-sweep,.ma-cur{animation:none!important}
  .ma-panel,.ma-orbwrap,.ma-mon{transition:none!important}
}
`;
