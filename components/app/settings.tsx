"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { PROVIDERS, provById } from "@/lib/engine";
import { applyTheme, DEFAULT_THEME } from "./shell";
import { supabaseConfigured } from "@/lib/supabase";
import { SAAS_VERSION, DESKTOP_PARITY_VERSION } from "@/lib/app-version";

// 각 테마의 실제 배경색 견본. 지금 테마와 무관하게 그 테마의 색을 보여 줘야 하므로 값을 직접 쓴다.
const THEMES: [string, string, string][] = [["glass", "글래스", "#0a0f1d"], ["light", "라이트", "#ffffff"], ["midnight", "미드나잇", "#141a2e"], ["charcoal", "차콜", "#232323"], ["black", "블랙", "#0c0c0e"]];

export default function SettingsView({ nav }: { nav: (r: string) => void }) {
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const reset = useStore((s) => s.reset);
  const [keys, setKeys] = useState<Record<string, string>>(settings.keys || {});
  const [sel, setSel] = useState<string>(`${settings.provider || "google"}::${settings.model || "gemini-2.5-flash"}`);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || "");
  const [msg, setMsg] = useState("");

  const allModels = PROVIDERS.flatMap((p) => p.models.map(([id, label, free]) => ({ pid: p.id, pname: p.name, id, label, free })));
  const [selPid, selMid] = sel.split("::");
  const selP = provById(selPid)!; const selM = selP.models.find((x) => x[0] === selMid);

  const save = () => {
    setSetting("keys", keys); setSetting("provider", selPid); setSetting("model", selMid);
    setSetting("baseUrl", baseUrl); setSetting("aiTier", selP.free ? "free" : "paid");
    setMsg("설정이 저장되었습니다"); setTimeout(() => setMsg(""), 2000);
  };
  const platform = typeof window !== "undefined" && (window as any).researchOS?.platform;

  return (
    <div>
      <div className="mb-5"><h1 className="text-[22px] font-semibold">⚙️ 설정</h1>
        <p className="mt-1 text-[13px] text-ink-2">자동화 모드 · AI 공급자(무료/유료) · 화면 테마. (Clerk 인증 {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "연결됨" : "로컬 모드"} · Supabase {supabaseConfigured ? "연결됨" : "로컬 모드"})</p></div>

      <div className="card mb-4">
        <h3 className="text-[15px] font-semibold mb-1">프로그램 버전</h3>
        <p className="text-[13px] text-ink-2">SaaS <strong>v{SAAS_VERSION}</strong> · Windows 설치판(methodos-f22) <strong>v{DESKTOP_PARITY_VERSION}</strong> 기능 동기화</p>
        <p className="text-[11px] text-ink-3 mt-1">데이터 시각화: React VizPlot + 표준 엔진 v2 (HTML iframe 제거)</p>
      </div>

      <div className="card mb-4">
        <h3 className="text-[15px] font-semibold mb-1">테마 (화면 모드)</h3>
        <p className="text-[12px] text-ink-3 mb-2.5">기본값은 글래스입니다. 인쇄하거나 밝은 곳에서 볼 때는 라이트를 쓰세요. 선택은 자동 저장됩니다.</p>
        <div className="flex gap-2.5 flex-wrap">
          {THEMES.map(([id, label, color]) => (
            <div key={id} onClick={() => { setSetting("theme", id); applyTheme(id); }} className="flex items-center gap-2.5 rounded-md px-4 py-3 cursor-pointer min-w-[120px]"
              style={{ border: (settings.theme || DEFAULT_THEME) === id ? "1.5px solid var(--brand)" : "1.5px solid var(--color-border-tertiary)", background: (settings.theme || DEFAULT_THEME) === id ? "var(--brand-soft)" : "transparent" }}>
              <span className="rounded-full" style={{ width: 16, height: 16, background: color, border: "1px solid rgba(128,128,128,.4)" }} /><span>{label}</span></div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3.5 mb-4">
        {[["Mode A", "규칙기반 엔진", "체크리스트·결정표·규칙트리. 결정적·오프라인·무료.", false],
          ["Mode B", "AI 엔진", "무료/유료 API 기반. 유연하지만 확률적.", false],
          ["Mode C · 기본", "하이브리드 엔진", "규칙 게이트 → AI 추론 → 규칙 검증.", true]].map(([tag, t, d, hi]) => (
          <div key={t as string} className="card" style={hi ? { borderColor: "var(--brand)" } : {}}>
            <span className={`pill ${hi ? "pill-ok" : "pill-brand"}`}>{tag}</span>
            <h3 className="text-[15px] font-semibold my-1">{t}</h3><p className="text-[12px] text-ink-2">{d}</p></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="card">
          <h3 className="text-[15px] font-semibold mb-1">AI 모델 설정</h3>
          <p className="text-[12px] text-ink-3 mb-1.5">AI/하이브리드 모드를 쓰려면 공급자 API 키가 필요합니다. 무료 공급자도 키 발급이 필요합니다.</p>
          <label className="fld">프로바이더별 API Key</label>
          <div className="grid sm:grid-cols-2 gap-x-3.5 gap-y-2.5">
            {PROVIDERS.filter((p) => p.id !== "ollama").map((p) => (
              <div key={p.id}>
                <label className="fld flex justify-between items-center mt-1.5 mb-1">
                  <span>{p.name} <span className={`pill ${p.free ? "pill-ok" : "pill-danger"} text-[9px]`}>{p.free ? "무료" : "유료"}</span></span>
                  <a className="text-[11px]" style={{ color: "var(--brand)" }} href={p.keyUrl} target="_blank" rel="noopener">키 발급 ↗</a></label>
                <input type="password" className="inp" placeholder={`${p.name} API Key`} value={keys[p.id] || ""} onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))} /></div>
            ))}
          </div>
          <label className="fld">모델 선택</label>
          <select className="inp" value={sel} onChange={(e) => setSel(e.target.value)}>
            {allModels.map((m) => <option key={m.pid + m.id} value={`${m.pid}::${m.id}`}>{m.label} — {m.pname} {m.free ? "(무료)" : "(유료)"}</option>)}</select>
          <div className="xfield mt-2.5"><div className="text-[11px] font-semibold mb-1">
            <span className={`pill ${selM?.[2] ? "pill-ok" : "pill-danger"} text-[9px]`}>{selM?.[2] ? "무료" : "유료"}</span> {selP.name} · {selM?.[1]}</div>
            <div className="text-[12px]">API 키 발급: <a style={{ color: "var(--brand)" }} href={selP.keyUrl} target="_blank" rel="noopener">{selP.console} ↗</a></div></div>
          <label className="fld">로컬(Ollama) Base URL (선택)</label>
          <input className="inp" placeholder="http://localhost:11434" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          <div className="flex gap-2 mt-3.5"><button className="btn btn-primary" onClick={save}>설정 저장</button>
            <button className="btn" onClick={() => { if (confirm("모든 로컬 데이터를 삭제할까요?")) { reset(); nav("dashboard"); } }} style={{ color: "var(--danger)" }}>초기화</button>
            {msg && <span className="pill pill-ok self-center">{msg}</span>}</div>
          <p className="text-[11px] text-ink-3 mt-2">키 미입력 시 AI 모드는 시뮬레이션으로 폴백합니다. 런타임: <strong>{platform ? "Electron · " + platform : "웹 / PWA"}</strong></p>
        </div>

        <div className="card">
          <h3 className="text-[15px] font-semibold mb-1">API 키 발급 링크 모음</h3>
          <p className="text-[12px] text-ink-3 mb-2.5">각 제공사의 공식 페이지에서 API 키를 발급받으세요.</p>
          {PROVIDERS.map((p) => (
            <a key={p.id} href={p.keyUrl} target="_blank" rel="noopener" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 mb-1.5 text-[12.5px]" style={{ border: "0.5px solid var(--color-border-tertiary)" }}>
              <span className="rounded-full shrink-0" style={{ width: 9, height: 9, background: p.free ? "var(--ok)" : "var(--danger)" }} />
              <span className="flex-1"><strong>{p.console}</strong><br /><span className="text-[11px] text-ink-3">{p.name} · {p.free ? "무료 등급 있음" : "유료"}</span></span><span className="text-ink-3">↗</span></a>
          ))}
        </div>
      </div>
    </div>
  );
}
