"use client";
/**
 * ProjectSavePanel v50
 * ─────────────────────────────────────────────────
 * · 저장 포맷: .mos (MethodOS Snapshot — JSON 페이로드 + 매직 헤더)
 * · 자동저장: localStorage `methodos.autosave.v1` (디바운스 1.2s)
 * · 내보내기: PDF (프로젝트 요약 · 브라우저 인쇄 대화상자 사용)
 * · 초기화: 완전 초기화(로컬 스토리지 포함), 재로드 후에도 유지
 * · 저장 시 프로젝트명이 "나의 워크스페이스" 옆에 노출됨(currentProjectName 사용)
 */
import { useEffect, useRef, useState } from "react";
import { FolderPlus, FolderOpen, Save, Download, RotateCcw, LogOut } from "lucide-react";
import { useStore } from "@/store/app-store";
import { clerkConfiguredClient } from "@/lib/clerk-client";

const MOS_MAGIC = "MOS1";
const AUTOSAVE_KEY = "methodos.autosave.v1";

type Snapshot = {
  format: "methodos-mos";
  version: 1 | 2;
  name: string;
  savedAt: string;
  currentProjectName?: string;
  projects: Record<string, unknown>;
  stageRuns: Record<string, unknown>;
  caPipelines: Record<string, unknown>;
  cmqProject?: unknown;
  /** v57: 전체 메뉴 분석·결과 */
  menuArtifacts?: unknown;
  settings: Record<string, unknown>;
};

export default function ProjectSavePanel({
  userName,
  userEmail,
  userId: _userId,
  loggedIn,
}: {
  userName?: string;
  userEmail?: string;
  userId?: string;
  loggedIn?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const projects = useStore((s) => s.projects);
  const stageRuns = useStore((s) => s.stageRuns);
  const caPipelines = useStore((s) => s.caPipelines);
  const cmqProject = useStore((s) => s.cmqProject);
  const menuArtifacts = useStore((s) => s.menuArtifacts);
  const settings = useStore((s) => s.settings);
  const currentProjectName = useStore((s) => s.currentProjectName);
  const lastAutoSavedAt = useStore((s) => s.lastAutoSavedAt);
  const autoSaveEnabled = useStore((s) => s.autoSaveEnabled);
  const touchAutoSave = useStore((s) => s.touchAutoSave);
  const setAutoSaveEnabled = useStore((s) => s.setAutoSaveEnabled);
  const reset = useStore((s) => s.reset);
  const createProject = useStore((s) => s.createProject);
  const setCurrentProjectName = useStore((s) => s.setCurrentProjectName);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = clerkConfiguredClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildSnapshot(name: string): Snapshot {
    return {
      format: "methodos-mos",
      version: 2,
      name,
      savedAt: new Date().toISOString(),
      currentProjectName,
      projects,
      stageRuns,
      caPipelines,
      cmqProject,
      menuArtifacts,
      settings: settings as any,
    };
  }

  function download(filename: string, content: string | Blob, mime = "application/octet-stream") {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // v50: 워크스페이스 자동저장 (디바운스)
  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (typeof window === "undefined") return;
        const name = currentProjectName || "자동저장 프로젝트";
        const snap = buildSnapshot(name);
        // 초대형 raw 축약
        if (snap.cmqProject && typeof (snap.cmqProject as any).raw === "string") {
          const cmq = { ...(snap.cmqProject as any) };
          if (cmq.raw.length > 120000) {
            cmq.raw = cmq.raw.slice(0, 120000) + "\n…[자동저장 축약]";
          }
          snap.cmqProject = cmq;
        }
        const payload = MOS_MAGIC + "\n" + JSON.stringify(snap);
        localStorage.setItem(AUTOSAVE_KEY, payload);
        touchAutoSave();
      } catch (e: any) {
        console.warn("[MethodOS] autosave failed", e?.message || e);
      }
    }, 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, stageRuns, caPipelines, cmqProject, menuArtifacts, settings, currentProjectName, autoSaveEnabled]);

  function onSave() {
    const suggested = currentProjectName || Object.values(projects)[0]?.title || `프로젝트 ${new Date().toLocaleDateString("ko-KR")}`;
    const name = (typeof window !== "undefined"
      ? prompt("프로젝트 이름을 입력하세요.\n(저장하면 나의 워크스페이스 옆에 표시됩니다)", suggested)
      : suggested) || suggested;
    const snap = buildSnapshot(name);
    const payload = MOS_MAGIC + "\n" + JSON.stringify(snap, null, 2);
    const safe = name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
    download(`${safe || "methodos"}.mos`, payload, "application/x-methodos");
    setCurrentProjectName(name);
    setStatus(`저장됨: ${name}.mos`);
  }

  function onExport() {
    setBusy(true);
    try {
      const name = currentProjectName || "MethodOS Project";
      const now = new Date().toLocaleString("ko-KR");
      const projList = Object.values(projects || {});
      const runsList = Object.values(stageRuns || {});
      const cmq: any = cmqProject || {};
      const esc = (s: any) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" } as any)[c]);

      const projectRows = projList.map((p: any) =>
        `<tr><td>${esc(p.title)}</td><td>${esc(p.methodName || "-")}</td><td>${esc(p.status || "-")}</td><td>${new Date(p.createdAt).toLocaleDateString("ko-KR")}</td></tr>`
      ).join("");

      const cmqSummary = cmq && (cmq.title || cmq.segments?.length) ? `
        <h2>코딩 프로젝트 · ${esc(cmq.title || "(무제)")}</h2>
        <ul>
          <li>실행모드: ${esc(cmq.executionMode || "-")}</li>
          <li>1차 코딩 방법: ${esc((cmq.firstMethodIds || []).join(", ") || "-")}</li>
          <li>분석단위: ${esc(cmq.unitLevel || "-")}</li>
          <li>세그먼트: ${cmq.segments?.length || 0} · 코드북: ${cmq.codebook?.length || 0} · 범주: ${cmq.categories?.length || 0} · 테마: ${cmq.themes?.length || 0} · 개념: ${cmq.concepts?.length || 0} · 이론: ${cmq.theory?.length || 0}</li>
        </ul>
        ${cmq.themes?.length ? `<h3>테마</h3><ol>${cmq.themes.map((t: any) => `<li>${esc(t.sentence)}</li>`).join("")}</ol>` : ""}
        ${cmq.theory?.length ? `<h3>이론 진술</h3><ol>${cmq.theory.map((t: any) => `<li>${esc(t.statement)}</li>`).join("")}</ol>` : ""}
        ${cmq.interpretation ? `<h3>해석 리포트</h3><pre style="white-space:pre-wrap;font-size:10pt">${esc(cmq.interpretation)}</pre>` : ""}
      ` : "";

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(name)} - MethodOS Report</title>
      <style>
        @page { size: A4; margin: 18mm 15mm; }
        body { font-family: -apple-system, "Malgun Gothic", "Noto Sans KR", sans-serif; color: #111; font-size: 12pt; line-height: 1.5; }
        h1 { font-size: 20pt; margin: 0 0 4pt; }
        h2 { font-size: 14pt; margin: 20pt 0 6pt; border-bottom: 1px solid #999; padding-bottom: 2pt; }
        h3 { font-size: 12pt; margin: 12pt 0 4pt; }
        .meta { color: #555; font-size: 10.5pt; }
        table { border-collapse: collapse; width: 100%; margin: 6pt 0; }
        th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; font-size: 10.5pt; }
        th { background: #f2f2f2; }
        ul, ol { margin: 4pt 0 4pt 18pt; }
        li { margin: 2pt 0; }
        .footer { margin-top: 22pt; padding-top: 8pt; border-top: 1px solid #ccc; font-size: 9.5pt; color: #666; }
      </style></head><body>
        <h1>${esc(name)}</h1>
        <div class="meta">MethodOS 프로젝트 보고서 · 표준 프로토콜 · ${esc(now)}</div>
        <h2>프로젝트 개요</h2>
        <table>
          <thead><tr><th>제목</th><th>연구방법</th><th>상태</th><th>생성일</th></tr></thead>
          <tbody>${projectRows || `<tr><td colspan="4">등록된 프로젝트가 없습니다.</td></tr>`}</tbody>
        </table>
        <h2>실행 이력</h2>
        <p>총 ${runsList.length}건의 단계 실행이 기록되어 있습니다.</p>
        ${cmqSummary}
        <div class="footer">이 문서는 MethodOS에서 자동 생성되었습니다. 표준 프로토콜에 따라 재현가능한 연구 파이프라인의 산출물을 요약합니다.</div>
        <script>
          window.onload = function() { setTimeout(function(){ window.print(); }, 250); };
        </script>
      </body></html>`;

      const w = window.open("", "_blank", "width=900,height=700");
      if (!w) {
        const b = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(b);
        window.open(url, "_blank");
      } else {
        w.document.open();
        w.document.write(html);
        w.document.close();
      }
      setStatus("PDF 내보내기: 인쇄 대화상자에서 'PDF로 저장'을 선택하세요.");
    } catch (err: any) {
      setStatus("내보내기 실패: " + (err?.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  function parseMosFile(txt: string): Snapshot | null {
    let body = txt;
    if (body.startsWith(MOS_MAGIC)) body = body.slice(MOS_MAGIC.length).replace(/^\s*/, "");
    try {
      const j = JSON.parse(body);
      return j as Snapshot;
    } catch {
      return null;
    }
  }

  function applySnapshot(snap: Snapshot, label: string) {
    useStore.setState({
      projects: (snap.projects as any) || {},
      stageRuns: (snap.stageRuns as any) || {},
      caPipelines: (snap.caPipelines as any) || {},
      cmqProject: (snap as any).cmqProject,
      menuArtifacts: (snap as any).menuArtifacts || useStore.getState().menuArtifacts,
      settings: (snap.settings as any) || settings,
      currentProjectName: snap.currentProjectName || snap.name || "",
      workspaceEpoch: (useStore.getState().workspaceEpoch || 0) + 1,
    });
    setStatus(`불러옴: ${label}`);
  }

  function onLoadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const snap = parseMosFile(String(reader.result));
        if (!snap) throw new Error("invalid format");
        applySnapshot(snap, snap.name || file.name);
      } catch {
        setStatus("불러오기 실패 — .mos 또는 JSON 파일을 확인하세요");
      }
    };
    reader.readAsText(file);
  }

  function onRestoreAutosave() {
    try {
      const txt = localStorage.getItem(AUTOSAVE_KEY);
      if (!txt) {
        setStatus("자동저장본이 없습니다");
        return;
      }
      const snap = parseMosFile(txt);
      if (!snap) {
        setStatus("자동저장본 파싱 실패");
        return;
      }
      applySnapshot(snap, `자동저장 · ${snap.savedAt || ""}`);
    } catch {
      setStatus("자동저장 복원 실패");
    }
  }

  function onNew() {
    const name = `프로젝트 ${new Date().toLocaleDateString("ko-KR")}`;
    createProject("custom", "새 프로젝트", name);
    setCurrentProjectName(name);
    setStatus("새 프로젝트 생성");
  }

  function onReset() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "로컬 프로젝트·실행 이력·설정을 모두 초기화합니다.\n이 작업은 되돌릴 수 없습니다. 계속할까요?"
    );
    if (!ok) return;
    try {
      reset();
      setStatus("초기화됨 (재로드 중…)");
      setTimeout(() => {
        try { window.location.reload(); } catch { /* noop */ }
      }, 250);
    } catch {
      setStatus("초기화 중 오류가 발생했습니다");
    }
  }

  async function onLogout() {
    setBusy(true);
    try {
      await fetch("/api/admin/login", { method: "DELETE" }).catch(() => null);
      const clerk = typeof window !== "undefined" ? (window as any).Clerk : null;
      if (clerk?.signOut) {
        await clerk.signOut({ redirectUrl: "/" });
        return;
      }
      window.location.href = configured ? "/login" : "/";
    } catch {
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  const displayName = userName || "로컬 사용자";
  const displayEmail = userEmail || (loggedIn ? "" : "로그인 안 됨");
  const isOnline = !!(loggedIn || (userEmail && userEmail.includes("@")));
  const autoSaveLabel = lastAutoSavedAt
    ? `자동저장 ${new Date(lastAutoSavedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
    : "자동저장 대기";

  return (
    <div className="mt-3 rounded-xl border p-2.5" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <div className="px-1 text-[10px] uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
        <span>나의 워크스페이스</span>
        {currentProjectName && (
          <span
            className="ml-auto rounded px-1.5 py-0.5 text-[10.5px] normal-case tracking-normal"
            style={{ background: "var(--brand-soft)", color: "var(--brand-ink)", maxWidth: 130 }}
            title={currentProjectName}
          >
            <span className="inline-block max-w-[110px] truncate align-bottom">{currentProjectName}</span>
          </span>
        )}
      </div>
      <div className="mt-1.5 px-1 flex items-center gap-1.5 flex-wrap">
        <label className="inline-flex items-center gap-1 text-[10px] text-ink-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!autoSaveEnabled}
            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
          />
          자동저장
        </label>
        <span className="text-[10px] text-emerald-600">{autoSaveEnabled ? autoSaveLabel : "자동저장 끔"}</span>
        <button
          type="button"
          onClick={onRestoreAutosave}
          className="ml-auto text-[10px] underline text-ink-2"
          title="최근 자동저장본 복원"
        >
          복원
        </button>
      </div>
      <button
        onClick={onNew}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium"
      >
        <FolderPlus size={14} /> 새 프로젝트
      </button>
      <div className="mt-2 grid grid-cols-4 gap-1">
        <IconBtn title="불러오기 (.mos / .json)" onClick={() => fileRef.current?.click()}>
          <FolderOpen size={14} />
        </IconBtn>
        <IconBtn title="저장 (.mos)" onClick={onSave}>
          <Save size={14} />
        </IconBtn>
        <IconBtn title="내보내기 (PDF)" onClick={onExport}>
          <Download size={14} />
        </IconBtn>
        <IconBtn title="초기화" onClick={onReset}>
          <RotateCcw size={14} />
        </IconBtn>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".mos,.json,.methodos,.methodos.json,application/json,application/x-methodos"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onLoadFile(f);
          e.target.value = "";
        }}
      />
      {status && <div className="mt-1.5 px-1 text-[10px] text-emerald-600 whitespace-pre-wrap">{status}</div>}
      <div className="mt-2 border-t pt-2 px-1" style={{ borderColor: "var(--color-border-tertiary)" }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: isOnline ? "var(--ok)" : "var(--color-text-tertiary)" }}
            title={isOnline ? "로그인됨" : "로그인 안 됨"}
          />
          <span className="text-[10px] text-ink-3">{isOnline ? "로그인 상태" : "비로그인"}</span>
        </div>
        <div className="truncate text-[12px] font-medium">{displayName}</div>
        {displayEmail && <div className="truncate text-[10px] text-ink-3">{displayEmail}</div>}
        <button
          type="button"
          disabled={busy}
          onClick={onLogout}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[12px] text-ink-2 hover:bg-black/5 disabled:opacity-50"
          style={{ borderColor: "var(--color-border-tertiary)" }}
        >
          <LogOut size={13} /> 로그아웃
        </button>
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex items-center justify-center rounded-md border py-1.5 text-ink-2 hover:bg-black/5"
      style={{ borderColor: "var(--color-border-tertiary)" }}
    >
      {children}
    </button>
  );
}
