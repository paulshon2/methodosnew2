"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe, Lock, Unlock, RotateCcw, RefreshCw } from "lucide-react";

type PermItem = { code: string; label: string; id?: string; category?: string; catKo?: string };

function PermRow({
  item,
  state,
  onSet,
}: {
  item: PermItem;
  state: "allow" | "block" | "default";
  onSet: (allowed: boolean | null) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[12px]"
      style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}
    >
      <span className="font-medium min-w-0">
        <span className="block truncate">{item.label}</span>
        <span className="text-[10px] text-ink-3 font-normal">{item.code}</span>
      </span>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onSet(true)}
          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
            state === "allow" ? "bg-emerald-600 text-white" : "border text-emerald-700"
          }`}
          style={state !== "allow" ? { borderColor: "var(--ok)" } : {}}
        >
          허용
        </button>
        <button
          type="button"
          onClick={() => onSet(false)}
          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
            state === "block" ? "bg-red-600 text-white" : "border text-red-700"
          }`}
          style={state !== "block" ? { borderColor: "var(--danger)" } : {}}
        >
          잠김
        </button>
        <button
          type="button"
          onClick={() => onSet(null)}
          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
            state === "default" ? "bg-slate-600 text-white" : "border text-slate-600"
          }`}
          style={state !== "default" ? { borderColor: "var(--color-border-tertiary)" } : {}}
        >
          기본
        </button>
      </div>
    </div>
  );
}

export default function AdminGlobalPermissions() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({});
  const [topMenus, setTopMenus] = useState<PermItem[]>([]);
  const [methods, setMethods] = useState<PermItem[]>([]);
  const [charts, setCharts] = useState<PermItem[]>([]);
  const [methodQ, setMethodQ] = useState("");
  const [sec, setSec] = useState<"top" | "methods" | "viz">("top");
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/global-permissions", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "불러오기 실패");
        return;
      }
      setOverrides(data.overrides || {});
      setTopMenus(data.topMenus || []);
      setMethods(data.methods || []);
      setCharts(data.charts || []);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function setPerm(code: string, allowed: boolean | null) {
    const res = await fetch("/api/admin/global-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission_code: code, allowed }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "권한 저장 실패");
      return;
    }
    setOverrides((o) => {
      const next = { ...o };
      if (allowed === null) delete next[code];
      else next[code] = allowed;
      return next;
    });
  }

  async function bulk(scope: "top" | "methods" | "viz" | "all", allowed: boolean | null) {
    const label = allowed === true ? "전체 허용" : allowed === false ? "전체 잠금" : "전체 기본값 복원";
    const scopeLabel =
      scope === "top" ? "전체 메뉴" : scope === "methods" ? "연구방법" : scope === "viz" ? "데이터 시각화" : "전체(메뉴+연구방법+시각화)";
    if (!window.confirm(`${scopeLabel} 항목을 모든 회원에게 "${label}" 처리합니다. 계속할까요?`)) return;
    setBulkBusy(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/global-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, allowed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "일괄 처리 실패");
      } else {
        setMsg(`${scopeLabel} ${data.count}개 항목을 "${label}" 처리했습니다.`);
        await load();
      }
    } finally {
      setBulkBusy(false);
    }
  }

  const filteredMethods = useMemo(() => {
    const q = methodQ.trim().toLowerCase();
    if (!q) return methods;
    return methods.filter((m) => (m.label + m.code).toLowerCase().includes(q));
  }, [methods, methodQ]);

  const chartsByCat = useMemo(() => {
    const g: Record<string, PermItem[]> = {};
    charts.forEach((c) => {
      const k = c.catKo || c.category || "기타";
      (g[k] = g[k] || []).push(c);
    });
    return g;
  }, [charts]);

  const currentScope = sec;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-primary)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe size={17} className="text-brand" />
          <div>
            <div className="font-bold text-[15px]">전체 메뉴 제어 (전체 사용자 공통)</div>
            <p className="mt-0.5 text-[12px] text-ink-3">
              여기서 잠그면 등급·개별 설정과 무관하게 모든 회원에게 즉시 적용됩니다. 특정 회원만 다시 열거나
              막고 싶다면 아래 회원 목록의 "메뉴 권한"에서 개별로 재설정하세요(개별 설정이 최종 우선합니다).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium"
          style={{
            borderColor: "var(--color-border-tertiary)",
            background: open ? "var(--brand-soft)" : undefined,
            color: open ? "var(--brand-ink)" : undefined,
          }}
        >
          {open ? "닫기" : "열기"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          {msg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              {msg}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["top", "전체 메뉴 (잠김/허용)"],
                  ["methods", `연구방법 (${methods.length})`],
                  ["viz", `데이터 시각화 (${charts.length})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSec(k)}
                  className="rounded-full px-3 py-1 text-[11px] font-medium border"
                  style={
                    sec === k
                      ? { background: "var(--brand-soft)", color: "var(--brand-ink)", borderColor: "transparent" }
                      : { borderColor: "var(--color-border-tertiary)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px]"
              style={{ borderColor: "var(--color-border-tertiary)" }}
            >
              <RefreshCw size={12} /> 새로고침
            </button>
          </div>

          <div
            className="flex flex-wrap gap-1.5 rounded-lg border border-dashed px-3 py-2"
            style={{ borderColor: "var(--color-border-secondary)" }}
          >
            <span className="mr-1 self-center text-[11px] text-ink-3">
              현재 탭({sec === "top" ? "전체 메뉴" : sec === "methods" ? "연구방법" : "데이터 시각화"}) 일괄 처리:
            </span>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulk(currentScope, false)}
              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              <Lock size={11} /> 전체 잠금
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulk(currentScope, true)}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              <Unlock size={11} /> 전체 허용
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulk(currentScope, null)}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              style={{ borderColor: "var(--color-border-tertiary)" }}
            >
              <RotateCcw size={11} /> 기본값 복원
            </button>
          </div>

          {loading ? (
            <div className="text-ink-3 text-[13px]">불러오는 중…</div>
          ) : (
            <>
              {sec === "top" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {topMenus.map((item) => {
                    const v = overrides[item.code];
                    const state = v === true ? "allow" : v === false ? "block" : "default";
                    return <PermRow key={item.code} item={item} state={state} onSet={(a) => setPerm(item.code, a)} />;
                  })}
                </div>
              )}

              {sec === "methods" && (
                <div className="space-y-2">
                  <input
                    className="inp w-full text-[12px]"
                    placeholder="연구방법 검색…"
                    value={methodQ}
                    onChange={(e) => setMethodQ(e.target.value)}
                  />
                  <div className="max-h-[420px] overflow-y-auto grid gap-2 sm:grid-cols-2 pr-1">
                    {filteredMethods.map((item) => {
                      const v = overrides[item.code];
                      const state = v === true ? "allow" : v === false ? "block" : "default";
                      return <PermRow key={item.code} item={item} state={state} onSet={(a) => setPerm(item.code, a)} />;
                    })}
                  </div>
                </div>
              )}

              {sec === "viz" && (
                <div className="max-h-[480px] overflow-y-auto space-y-4 pr-1">
                  {Object.entries(chartsByCat).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                        {cat} · {items.length}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map((item) => {
                          const v = overrides[item.code];
                          const state = v === true ? "allow" : v === false ? "block" : "default";
                          return <PermRow key={item.code} item={item} state={state} onSet={(a) => setPerm(item.code, a)} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
