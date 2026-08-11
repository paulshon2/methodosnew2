"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TOP_LOCK_MENUS } from "@/lib/menu-catalog";
import { isSuperAdminEmail } from "@/lib/admin-config";
import { RefreshCw, Crown, ChevronDown, ChevronRight } from "lucide-react";
import AdminGlobalPermissions from "./admin-global-permissions";

type Member = {
  id: string;
  email: string;
  name: string;
  plan: string;
  role: string;
  approval_status: string;
  created_at?: string;
};

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

const AUTH_ERROR_CODES = new Set([
  "clerk_required",
  "unauthorized",
  "forbidden_not_super_admin",
  "clerk_middleware_missing",
]);

export default function AdminMembers({ preAuthorized = false }: { preAuthorized?: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState("cloud");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [msg, setMsg] = useState("");
  const [openPerms, setOpenPerms] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({});
  const [methods, setMethods] = useState<PermItem[]>([]);
  const [charts, setCharts] = useState<PermItem[]>([]);
  const [methodQ, setMethodQ] = useState("");
  const [sec, setSec] = useState<"top" | "methods" | "viz">("top");
  const [savingPlan, setSavingPlan] = useState<string | null>(null);

  // all-36: 로컬 관리자 로그인 폼 상태 (Clerk 불필요, ADMIN_USERNAME/PASSWORD)
  const [adminId, setAdminId] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/members", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "불러오기 실패");
        setNeedsLogin(res.status === 401 || res.status === 403 || AUTH_ERROR_CODES.has(data.error));
        setMembers([]);
      } else {
        setNeedsLogin(false);
        setMembers(data.members || []);
        setMode(data.mode || "cloud");
      }
    } catch {
      setError("네트워크 오류");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdminLogin = async () => {
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: adminId, password: adminPw }),
      });
      if (res.ok) {
        setAdminPw("");
        await load();
      } else if (res.status === 401) {
        setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        const d = await res.json().catch(() => ({}));
        setLoginError(
          d?.error === "secret_not_configured"
            ? "서버에 ADMIN_API_SECRET이 설정되어 있지 않습니다."
            : "로그인 처리 중 오류가 발생했습니다."
        );
      }
    } catch {
      setLoginError("네트워크 오류로 로그인에 실패했습니다.");
    } finally {
      setLoggingIn(false);
    }
  };

  async function setPlan(userId: string, membershipTier: string, alsoApprove = false) {
    setSavingPlan(userId);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/approve-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: alsoApprove ? "approve" : "set_plan",
          membershipTier,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "등급 저장 실패");
      } else {
        setMsg(`등급이 ${membershipTier}(으)로 저장되었습니다.`);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === userId
              ? {
                  ...m,
                  plan: membershipTier,
                  approval_status: alsoApprove || data.status === "approved" ? "approved" : m.approval_status,
                }
              : m
          )
        );
      }
    } finally {
      setSavingPlan(null);
      await load();
    }
  }

  async function act(userId: string, action: "approve" | "reject", membershipTier = "free") {
    setMsg("");
    const res = await fetch("/api/admin/approve-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, membershipTier }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || "처리 실패");
    else setMsg(action === "approve" ? "승인되었습니다." : "퇴출 처리되었습니다.");
    await load();
  }

  async function openPermissions(userId: string) {
    if (openPerms === userId) {
      setOpenPerms(null);
      return;
    }
    setOpenPerms(userId);
    setSec("top");
    const res = await fetch(`/api/admin/member-permissions?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "권한 불러오기 실패");
      return;
    }
    setOverrides(data.overrides || {});
    setMethods(data.methods || []);
    setCharts(data.charts || []);
  }

  async function setPerm(userId: string, code: string, allowed: boolean | null) {
    const res = await fetch("/api/admin/member-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, permission_code: code, allowed }),
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

  const pending = members.filter((m) => !isSuperAdminEmail(m.email) && m.approval_status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-amber-500" />
            <h1 className="text-xl font-bold">관리자 — 회원 등급·승인·퇴출 관리</h1>
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            총 {members.length}명 · 대기 {pending}명 · {mode}
            <span className="ml-2 text-[11px]">슈퍼관리자 전용: sarangred777@gmail.com</span>
          </p>
          <p className="mt-1 text-[11px] text-ink-3">
            Free: 연구방법 2 + 기본그래프 · Basic: 연구방법 3 + 기본·분포통계 · Scholar: 전체
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px]"
          style={{ borderColor: "var(--color-border-tertiary)" }}
        >
          <RefreshCw size={14} /> 새로고침
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{msg}</div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error === "clerk_required"
            ? "Clerk 로그인(슈퍼관리자)이 필요합니다."
            : error === "forbidden_not_super_admin"
              ? "슈퍼관리자(sarangred777@gmail.com)만 접근할 수 있습니다."
              : error === "unauthorized"
                ? "로그인이 필요합니다. 슈퍼관리자 계정으로 다시 로그인해 주세요."
                : error}
        </div>
      )}

      {!needsLogin && !loading && <AdminGlobalPermissions />}

      {needsLogin && !loading ? (
        <div
          className="max-w-sm rounded-xl border p-5"
          style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-primary)" }}
        >
          <p className="mb-3 text-[13px] text-ink-3">
            Clerk 슈퍼관리자 계정이 아니어도, 관리자 아이디/비밀번호(ADMIN_USERNAME/ADMIN_PASSWORD)로 로그인할 수
            있습니다.
          </p>
          <label className="mb-1 block text-[12.5px] text-ink-3">관리자 아이디</label>
          <input
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            className="inp mb-3 w-full text-[13.5px]"
            placeholder="ADMIN_USERNAME"
            autoComplete="username"
          />
          <label className="mb-1 block text-[12.5px] text-ink-3">비밀번호</label>
          <input
            type="password"
            value={adminPw}
            onChange={(e) => setAdminPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            className="inp mb-3 w-full text-[13.5px]"
            placeholder="ADMIN_PASSWORD"
            autoComplete="current-password"
          />
          {loginError && <p className="mb-3 text-[12.5px] text-red-600">{loginError}</p>}
          <button
            type="button"
            onClick={handleAdminLogin}
            disabled={loggingIn}
            className="w-full rounded-md bg-amber-600 px-3 py-2 text-[13.5px] font-medium text-white transition-all hover:bg-amber-700 disabled:opacity-50"
          >
            {loggingIn ? "로그인 중…" : "관리자 로그인"}
          </button>
        </div>
      ) : loading ? (
        <div className="text-ink-3 text-[13px]">불러오는 중…</div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const isSuper = isSuperAdminEmail(m.email);
            // 방어적 렌더링: API가 어떤 이유로든 잘못된 값을 내려줘도, 슈퍼관리자 이메일이면
            // 화면에서는 항상 승인됨/University/개발자로 표시하고 승인·퇴출·등급변경 UI를 숨긴다.
            const displayStatus = isSuper ? "approved" : m.approval_status;
            const displayPlan = isSuper ? "university" : m.plan || "free";
            const statusLabel =
              displayStatus === "approved" ? "승인됨" : displayStatus === "pending" ? "대기" : "거절됨";
            const open = openPerms === m.id;
            return (
              <div
                key={m.id}
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-primary)" }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[14px]">{m.name || m.email}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          displayStatus === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : displayStatus === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      {(isSuper || m.role === "admin") && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          {isSuper ? "슈퍼관리자 · 개발자" : "개발자"}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-3">
                      {m.email} · {m.created_at ? new Date(m.created_at).toLocaleDateString("ko-KR") : "—"}
                    </div>
                  </div>
                  {isSuper ? (
                    <span
                      className="rounded-md border px-2 py-1.5 text-[12px] text-ink-3"
                      style={{ borderColor: "var(--color-border-tertiary)" }}
                      title="슈퍼관리자는 항상 전체 등급(University)을 사용합니다"
                    >
                      University (고정)
                    </span>
                  ) : (
                    <select
                      className="rounded-md border px-2 py-1.5 text-[12px] bg-transparent capitalize"
                      style={{ borderColor: "var(--color-border-tertiary)" }}
                      value={displayPlan}
                      disabled={savingPlan === m.id}
                      onChange={(e) => setPlan(m.id, e.target.value, m.approval_status !== "approved")}
                      title="회원 등급"
                    >
                      {["free", "basic", "scholar", "university"].map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}
                  {!isSuper && (
                    <button
                      onClick={() => openPermissions(m.id)}
                      className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-[12px] ${open ? "font-semibold" : ""}`}
                      style={{
                        borderColor: "var(--color-border-tertiary)",
                        background: open ? "var(--brand-soft)" : undefined,
                        color: open ? "var(--brand-ink)" : undefined,
                      }}
                    >
                      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      메뉴 권한
                    </button>
                  )}
                  {!isSuper && displayStatus !== "approved" && (
                    <button
                      onClick={() => act(m.id, "approve", m.plan || "free")}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-emerald-700"
                    >
                      승인
                    </button>
                  )}
                  {!isSuper && (
                    <button
                      onClick={() => act(m.id, "reject")}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-700"
                    >
                      퇴출
                    </button>
                  )}
                </div>

                {open && (
                  <div className="mt-4 space-y-3">
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

                    {sec === "top" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {TOP_LOCK_MENUS.map((item) => {
                          const v = overrides[item.code];
                          const state = v === true ? "allow" : v === false ? "block" : "default";
                          return (
                            <PermRow key={item.code} item={item} state={state} onSet={(a) => setPerm(m.id, item.code, a)} />
                          );
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
                            return (
                              <PermRow key={item.code} item={item} state={state} onSet={(a) => setPerm(m.id, item.code, a)} />
                            );
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
                                return (
                                  <PermRow
                                    key={item.code}
                                    item={item}
                                    state={state}
                                    onSet={(a) => setPerm(m.id, item.code, a)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!members.length && !error && <div className="text-[13px] text-ink-3">등록된 회원이 없습니다.</div>}
        </div>
      )}
    </div>
  );
}
