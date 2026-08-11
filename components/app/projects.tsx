"use client";
import { useEffect, useState } from "react";
import type { Registry } from "@/lib/types";
import { methodById } from "@/lib/use-registry";
import { useStore } from "@/store/app-store";

export default function Projects({ reg, nav }: { reg: Registry; nav: (r: string) => void }) {
  const projectsMap = useStore((s) => s.projects);
  const stageRuns = useStore((s) => s.stageRuns);
  const deleteProject = useStore((s) => s.deleteProject);
  const createProject = useStore((s) => s.createProject);
  const projects = Object.values(projectsMap).sort((a, b) => b.createdAt - a.createdAt);
  const runsForProject = (pid: string) => Object.values(stageRuns).filter((r) => r.projectId === pid);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ id: string; title: string; methodId: string; methodName: string } | null>(null);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(t);
  }, [undo]);

  const askDelete = (id: string) => setPendingDelete(id);
  const confirmDelete = (p: { id: string; title: string; methodId: string; methodName: string }) => {
    deleteProject(p.id);
    setPendingDelete(null);
    setUndo({ id: p.id, title: p.title, methodId: p.methodId, methodName: p.methodName });
  };

  return (
    <div>
      <h1 className="ty-title mb-1">내 연구 프로젝트</h1>
      <p className="ty-small text-ink-2 mb-4">로컬에 저장된 연구 프로젝트입니다.</p>
      {undo ? (
        <div className="card mb-3 flex flex-wrap items-center gap-2" style={{ background: "var(--warn-wash)" }}>
          <span className="ty-small">「{undo.title}」을(를) 삭제했습니다.</span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              createProject(undo.methodId, undo.methodName, undo.title);
              setUndo(null);
            }}
          >
            되돌리기 (5초)
          </button>
        </div>
      ) : null}
      {projects.length ? (
        <div className="grid sm:grid-cols-2 gap-3.5">
          {projects.map((p) => {
            const m = methodById(reg, p.methodId);
            return (
              <div key={p.id} className="card">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="flex-1 ty-subhead">{p.title}</strong>
                  <button type="button" className="btn btn-sm" onClick={() => nav("project/" + p.id)}>열기</button>
                  {pendingDelete === p.id ? (
                    <>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => confirmDelete(p)}>정말 삭제</button>
                      <button type="button" className="btn btn-sm" onClick={() => setPendingDelete(null)}>취소</button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-sm" style={{ color: "var(--danger)" }} onClick={() => askDelete(p.id)}>삭제</button>
                  )}
                </div>
                <div className="ty-small text-ink-2 mt-1.5">
                  {m ? m.name_ko || m.name : p.methodId} · 단계 {(p.currentStage || 0) + 1}/{m ? m.stage_count : "?"} · {runsForProject(p.id).length}회 실행
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <p className="ty-body mb-3">프로젝트가 없습니다.</p>
          <button type="button" className="btn btn-primary" onClick={() => nav("find")}>방법 찾기로 시작</button>
        </div>
      )}
    </div>
  );
}
