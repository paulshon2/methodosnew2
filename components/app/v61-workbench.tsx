"use client";
/**
 * Prompt 6.1 / RWOS-6 하위 워크벤치
 * 상위(개요) → 프로젝트: Stage 목록 → Process/Task → 세부 Task 실행
 */
import { useEffect, useMemo, useState } from "react";
import { Gloss } from "./gloss";
import {
  loadMethodSamples,
  loadV61Bundle,
  type MethodSamplePack,
  type V61Bundle,
  type V61Process,
  type V61Stage,
  type V61Task,
} from "@/lib/method-catalog";
import { useAnnotation } from "./annotations";
import { mergeTerms, preferAcademic, termsFromText, pickCoreMatching, CORE_METHOD_TERMS } from "@/lib/page-glossary";
import { CheckCircle2, ChevronRight, Circle, ClipboardList, Layers } from "lucide-react";
import { useStore } from "@/store/app-store";
import WorkedExamplePanel from "./worked-example-panel";
import { InterstitialDeliverable, ProcessSampleBinding, SamplePackOverview } from "./sample-pack-panel";

function autoTone(a?: string) {
  if (!a) return { label: "반자동화", color: "var(--appr-qual)", soft: "var(--appr-qual-soft)" };
  if (a.includes("수동") || a.includes("Manual")) return { label: "수동화", color: "var(--danger)", soft: "var(--danger-soft)" };
  if (a.includes("완전") || (a.includes("Automatic") && !a.includes("Semi")))
    return { label: "자동화", color: "var(--ok)", soft: "var(--ok-wash)" };
  return { label: "반자동화", color: "var(--appr-qual)", soft: "var(--appr-qual-soft)" };
}

function doneKey(pid: string, stageNo: number, leafId: string) {
  return `v61:${pid}:s${stageNo}:${leafId}`;
}

export default function V61Workbench({
  pid,
  perfSlug,
  label,
  intro,
  nav,
}: {
  pid: string;
  perfSlug: string;
  label: string;
  intro?: string;
  nav: (r: string) => void;
}) {
  const [doc, setDoc] = useState<V61Bundle | null>(null);
  const [samples, setSamples] = useState<MethodSamplePack | null>(null);
  const [stageNo, setStageNo] = useState<number | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [taskKey, setTaskKey] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const { replace } = useAnnotation();
  const recordRun = useStore((s) => s.recordRun);
  const stageRuns = useStore((s) => s.stageRuns);

  useEffect(() => {
    loadV61Bundle(perfSlug).then(setDoc);
    loadMethodSamples(perfSlug).then(setSamples);
  }, [perfSlug]);

  const doneSet = useMemo(() => {
    const s = new Set<string>();
    Object.values(stageRuns).forEach((r) => {
      if (r.projectId === pid && r.outputs?.v61Done) s.add(String(r.stageId));
    });
    return s;
  }, [stageRuns, pid]);

  const stage: V61Stage | undefined = doc?.stages.find((s) => s.no === stageNo);
  const process: V61Process | undefined = stage?.processes?.find((p) => p.id === processId);

  const activeTask: { id: string; task: V61Task; parentLabel: string } | null = useMemo(() => {
    if (!stage || !taskKey) return null;
    if (process) {
      const t = process.tasks.find((x) => `p:${process.id}:t${x.no}` === taskKey);
      if (t) return { id: taskKey, task: t, parentLabel: process.name };
    }
    const t = stage.tasks.find((x) => `s:t${x.no}` === taskKey);
    if (t) return { id: taskKey, task: t, parentLabel: stage.name };
    return null;
  }, [stage, process, taskKey]);

  const orderedTaskRefs = useMemo(() => {
    const refs: Array<{ stageNo: number; processId: string | null; taskKey: string }> = [];
    (doc?.stages || []).forEach((s) => {
      if (s.processes?.length) {
        s.processes.forEach((p) => {
          p.tasks.forEach((t) => refs.push({ stageNo: s.no, processId: p.id, taskKey: `p:${p.id}:t${t.no}` }));
        });
      } else {
        s.tasks.forEach((t) => refs.push({ stageNo: s.no, processId: null, taskKey: `s:t${t.no}` }));
      }
    });
    return refs;
  }, [doc]);

  const nextTaskRef = useMemo(() => {
    if (!stage || !taskKey) return null;
    const idx = orderedTaskRefs.findIndex((x) => x.stageNo === stage.no && x.taskKey === taskKey);
    if (idx < 0 || idx + 1 >= orderedTaskRefs.length) return null;
    return orderedTaskRefs[idx + 1];
  }, [orderedTaskRefs, stage, taskKey]);

  const moveToNextTask = () => {
    if (!nextTaskRef) return;
    setStageNo(nextTaskRef.stageNo);
    setProcessId(nextTaskRef.processId);
    setTaskKey(nextTaskRef.taskKey);
    setNotes("");
  };

  useEffect(() => {
    if (!doc) return;
    const bits: string[] = [doc.purpose || "", doc.mechanism || "", doc.beginnerIntro || ""];
    if (stage) bits.push(stage.name, stage.purpose || "", stage.what || "", stage.why || "");
    if (process) bits.push(process.name, process.purpose || "", process.what || "");
    if (activeTask) bits.push(activeTask.task.name, activeTask.task.description || "");
    const gloss = (doc.glossary || []).map((g) => ({ term: g.term, def: g.def }));
    const blob = bits.filter(Boolean).join(" ");
    replace(preferAcademic(mergeTerms(pickCoreMatching(blob), gloss, CORE_METHOD_TERMS, termsFromText(blob))));
  }, [doc, stage, process, activeTask, replace]);

  if (!doc) return <p className="text-ink-3">워크벤치를 불러오는 중…</p>;

  const totalLeaves = doc.stages.reduce((acc, s) => {
    if (s.processes?.length) return acc + s.processes.reduce((a, p) => a + (p.tasks.length || 1), 0);
    return acc + (s.tasks.length || 1);
  }, 0);
  const doneCount = [...doneSet].filter((k) => k.startsWith(`v61:${pid}:`)).length;

  const markDone = () => {
    if (!stage || !activeTask) return;
    const sid = doneKey(pid, stage.no, activeTask.id);
    recordRun(pid, sid, "ai", { note: notes }, { v61Done: true, summary: activeTask.task.name }, { ok: true });
    setNotes("");
  };

  // ── Level 3: Task detail ──
  if (stage && activeTask) {
    const tone = autoTone(activeTask.task.automation);
    return (
      <div className="text-[14px]">
        <button
          className="btn btn-sm mb-2"
          onClick={() => {
            setTaskKey(null);
          }}
        >
          ← {process ? process.name : stage.name}
        </button>
        <div className="text-[12px] text-ink-3 mb-1 flex items-center gap-1 flex-wrap">
          <span>{label}</span>
          <ChevronRight size={12} />
          <span>
            Stage {stage.no}
          </span>
          {process && (
            <>
              <ChevronRight size={12} />
              <span>{process.id}</span>
            </>
          )}
          <ChevronRight size={12} />
          <span>세부 Task</span>
        </div>
        <h1 className="text-[20px] font-semibold mb-1">
          <Gloss text={activeTask.task.name} />
        </h1>
        <p className="text-[13px] text-ink-2 mb-3">
          상위: <Gloss text={activeTask.parentLabel} />
        </p>
        <span className="pill mb-4" style={{ background: tone.soft, color: tone.color }}>
          {tone.label}
        </span>

        <div className="grid lg:grid-cols-2 gap-3 mb-4">
          <div className="card">
            <h3 className="text-[14px] font-semibold mb-2">수행 내용</h3>
            <Gloss className="text-[13.5px] leading-relaxed block" text={activeTask.task.description || activeTask.task.name} />
            <div className="mt-3 text-[12.5px] space-y-1.5">
              <div>
                <span className="text-ink-3">입력 · </span>
                <Gloss text={activeTask.task.input || stage.input || "선행 산출물"} />
              </div>
              <div>
                <span className="text-ink-3">출력 · </span>
                <Gloss text={activeTask.task.output || stage.output || "단계 산출물"} />
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-[14px] font-semibold mb-2">연구자 메모 · 산출 초안</h3>
            <textarea
              className="inp w-full min-h-[120px]"
              placeholder="이 Task에서 확인한 판단·수치·인용을 적으세요."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button className="btn btn-primary mt-2 w-full" onClick={markDone}>
              이 Task 완료로 표시
            </button>
          </div>
        </div>

        <WorkedExamplePanel
          example={activeTask.task.workedExample}
          methodLabel={label}
          taskName={activeTask.task.name}
          hasNextTask={!!nextTaskRef}
          onNextTask={nextTaskRef ? moveToNextTask : null}
        />
      </div>
    );
  }

  // ── Level 2b: Process detail (Stage 5) ──
  if (stage && process) {
    const binding =
      samples?.processBindings?.find(
        (b) => b.boundProcessId === process.id || b.processNo === process.no
      ) || null;
    return (
      <div className="text-[14px]">
        <button
          className="btn btn-sm mb-2"
          onClick={() => {
            setProcessId(null);
          }}
        >
          ← Stage {stage.no} 목록
        </button>
        <div className="text-[12px] text-ink-3 mb-1">
          {label} · Stage {stage.no} · 프로세스
        </div>
        <h1 className="text-[20px] font-semibold">
          <Gloss text={process.name + (process.nameEn ? `(${process.nameEn})` : "")} />
        </h1>
        <p className="text-[13.5px] text-ink-2 mt-1 mb-4 leading-relaxed">
          <Gloss text={process.purpose || process.what || ""} />
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
          <div className="rounded-md p-3 text-[13px]" style={{ background: "var(--color-background-secondary)" }}>
            <div className="text-[11px] text-ink-3 mb-1">불러오기</div>
            <Gloss text={process.input || ""} />
          </div>
          <div className="rounded-md p-3 text-[13px]" style={{ background: "var(--color-background-secondary)" }}>
            <div className="text-[11px] text-ink-3 mb-1">내보내기</div>
            <Gloss text={process.output || ""} />
          </div>
        </div>
        <ProcessSampleBinding binding={binding} processName={process.name} />
        <InterstitialDeliverable binding={binding} />
        <h3 className="text-[15px] font-semibold mb-2">세부 Task</h3>
        <div className="flex flex-col gap-2">
          {process.tasks.map((t) => {
            const key = `p:${process.id}:t${t.no}`;
            const done = doneSet.has(doneKey(pid, stage.no, key));
            const tone = autoTone(t.automation);
            return (
              <button
                key={key}
                type="button"
                className="card text-left flex items-start gap-3 hover:-translate-y-0.5 transition-transform"
                onClick={() => setTaskKey(key)}
              >
                {done ? <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" /> : <Circle size={18} className="text-ink-3 mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">
                    <Gloss text={t.name} />
                  </div>
                  <div className="text-[12px] text-ink-2 mt-0.5 line-clamp-2">
                    <Gloss text={t.description || ""} />
                  </div>
                  <span className="pill mt-1.5 inline-block" style={{ background: tone.soft, color: tone.color }}>
                    {tone.label}
                  </span>
                </div>
                <ChevronRight size={16} className="text-ink-3 mt-1 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Level 2a: Stage detail ──
  if (stage) {
    const isExec = stage.no === 5 && (stage.processes?.length || 0) > 0;
    return (
      <div className="text-[14px]">
        <button className="btn btn-sm mb-2" onClick={() => setStageNo(null)}>
          ← 6단계 목록
        </button>
        <div className="text-[12px] text-ink-3 mb-1">
          {label} · 하위 항목 · Stage {stage.no}
        </div>
        <h1 className="text-[20px] font-semibold">
          <Gloss text={stage.name + (stage.nameEn ? `(${stage.nameEn})` : "")} />
        </h1>
        <p className="text-[13.5px] text-ink-2 mt-1 mb-3 leading-relaxed">
          <Gloss text={stage.summary || stage.purpose || stage.what || ""} />
        </p>
        {stage.why && (
          <div className="rounded-md p-3 mb-4 text-[13px]" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
            <strong>왜 필요한가 · </strong>
            <Gloss text={stage.why} />
          </div>
        )}
        {isExec ? (
          <>
            <SamplePackOverview pack={samples} />
            <h3 className="text-[15px] font-semibold mb-2 flex items-center gap-1.5">
              <Layers size={16} /> 방법 고유 프로세스
            </h3>
            <div className="flex flex-col gap-2.5">
              {stage.processes.map((p, idx) => {
                const binding =
                  samples?.processBindings?.find((b) => b.boundProcessId === p.id || b.processNo === p.no) || null;
                return (
                  <div key={p.id}>
                    <button
                      type="button"
                      className="card text-left w-full hover:-translate-y-0.5 transition-transform"
                      onClick={() => setProcessId(p.id)}
                    >
                      <div className="text-[11px] text-ink-3">{p.id}</div>
                      <div className="text-[14px] font-semibold mt-0.5">
                        <Gloss text={p.name + (p.nameEn ? `(${p.nameEn})` : "")} />
                      </div>
                      <p className="text-[12px] text-ink-2 mt-1 line-clamp-2">
                        <Gloss text={p.purpose || ""} />
                      </p>
                      <div className="text-[11.5px] mt-2" style={{ color: "var(--brand-ink)" }}>
                        {p.tasks.length}개 세부 Task →
                        {samples ? " · Sample Pack 포함" : ""}
                      </div>
                    </button>
                    {idx < stage.processes.length - 1 ? <InterstitialDeliverable binding={binding} /> : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[15px] font-semibold mb-2 flex items-center gap-1.5">
              <ClipboardList size={16} /> 세부 Task
            </h3>
            <div className="flex flex-col gap-2">
              {stage.tasks.map((t) => {
                const key = `s:t${t.no}`;
                const done = doneSet.has(doneKey(pid, stage.no, key));
                const tone = autoTone(t.automation);
                return (
                  <button
                    key={key}
                    type="button"
                    className="card text-left flex items-start gap-3"
                    onClick={() => setTaskKey(key)}
                  >
                    {done ? <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" /> : <Circle size={18} className="text-ink-3 mt-0.5" />}
                    <div className="flex-1">
                      <div className="font-semibold">
                        <Gloss text={t.name} />
                      </div>
                      <div className="text-[12px] text-ink-2 mt-0.5">
                        <Gloss text={t.description || `${t.input || ""} → ${t.output || ""}`} />
                      </div>
                      <span className="pill mt-1.5 inline-block" style={{ background: tone.soft, color: tone.color }}>
                        {tone.label}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-ink-3" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Level 1: Stage list ──
  return (
    <div className="text-[14px]">
      <button className="btn btn-sm mb-2.5" onClick={() => nav("methods")}>
        ← 방법
      </button>
      <h1 className="text-[22px] font-semibold">{label}</h1>
      <p className="text-[13.5px] text-ink-2 mb-1 leading-relaxed">
        {intro || doc.purpose || "RWOS 6단계 자동화 워크벤치"}
      </p>
      <p className="text-[12.5px] text-ink-3 mb-4">
        하위 항목 · 전체 진행 참고 {doneCount}/{totalLeaves} · Phase→Stage→Process→Task
      </p>

      {doc.phases?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {doc.phases.map((ph) => (
            <span
              key={ph.no}
              className="rounded-md px-2.5 py-1 text-[11.5px] font-medium"
              style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
            >
              Phase {ph.no} · {ph.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {doc.stages.map((s) => {
          const leafN = s.processes?.length
            ? s.processes.reduce((a, p) => a + p.tasks.length, 0)
            : s.tasks.length;
          return (
            <button
              key={s.id}
              type="button"
              className="card text-left flex gap-3 items-start hover:-translate-y-0.5 transition-transform"
              onClick={() => {
                setStageNo(s.no);
                setProcessId(null);
                setTaskKey(null);
              }}
            >
              <span
                className="grid place-items-center rounded-full text-white text-[13px] font-bold shrink-0"
                style={{ width: 32, height: 32, background: "var(--brand)" }}
              >
                {s.no}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">
                  <Gloss text={s.name + (s.nameEn ? `(${s.nameEn})` : "")} />
                </div>
                <p className="text-[12.5px] text-ink-2 mt-0.5 line-clamp-2">
                  <Gloss text={s.summary || s.purpose || ""} />
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="pill">
                    {s.no === 5 && s.processes?.length ? `${s.processes.length} Process` : `${leafN} Task`}
                  </span>
                  <span className="pill">{(autoTone(s.automation).label)}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-3 mt-1 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
