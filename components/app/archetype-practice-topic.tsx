"use client";
/** 프로젝트 실습 — 주제의 단계·태스크 + 컴팩트 그림 + 상세 AI 기입란 + 태스크 연동·자료 연동 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Gloss } from "./gloss";
import { aiComplete } from "@/lib/engine";
import { useStore } from "@/store/app-store";
import { AiProgressBar } from "./ai-progress-bar";
import type { ProgressEvent } from "@/lib/coding-standards";
import { buildPracticeAiFields } from "@/lib/practice-ai-fields";
import type { ArchetypeDataMode } from "@/lib/archetype-workflow";
import { exportSimplePdf, exportTableXlsx } from "@/lib/viz-export";
import {
  composePracticeInput,
  flattenPracticeTasks,
  getPracticeTaskSnapshot,
  PRACTICE_WS_EVENT,
  practiceTaskId,
  savePracticeTaskSnapshot,
  type FlatPracticeTask,
} from "@/lib/practice-workflow";
import * as XLSX from "xlsx";
import {
  loadPracticeMethod,
  type ArchetypeFormField,
  type PracticeMethodDoc,
  type PracticeTask,
  type PracticeTopic,
} from "@/lib/archetype-data";
import { ArchetypeMicrodataAccordion } from "./practice-sample-accordion";

function SampleTable({
  headers,
  rows,
}: {
  headers?: string[];
  rows?: string[][];
}) {
  if (!headers?.length || !rows?.length) return null;
  const cols = headers.length;
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border px-2 py-1.5 text-left font-semibold"
                style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {Array.from({ length: cols }, (_, j) => (
                <td key={j} className="border px-2 py-1.5 align-top" style={{ borderColor: "var(--color-border-tertiary)" }}>
                  {r[j] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 스마트 컴팩트 그림 그리드 — 우왁스한 풀폭 스택 방지 */
function FigureGallery({
  title,
  figures,
  compact = false,
}: {
  title?: string;
  figures: { caption: string; src: string }[];
  compact?: boolean;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const valid = (figures || []).filter((f) => f?.src);
  if (!valid.length) return null;

  return (
    <div className="mb-3">
      {title && <div className="text-[12.5px] font-semibold mb-1.5 text-ink-2">{title}</div>}
      <div
        className={
          compact
            ? "grid grid-cols-2 sm:grid-cols-3 gap-2"
            : "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
        }
      >
        {valid.map((f, i) => (
          <figure
            key={i}
            className="rounded-md border overflow-hidden m-0"
            style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}
          >
            <button
              type="button"
              className="block w-full text-left"
              onClick={() => setLightbox(f.src)}
              title="클릭하면 크게 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.src}
                alt={f.caption}
                className="w-full object-contain bg-white"
                style={{ maxHeight: compact ? 120 : 180, margin: "0 auto" }}
              />
            </button>
            <figcaption className="px-2 py-1.5 text-[11px] leading-snug text-ink-2 line-clamp-2">
              {f.caption}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="text-[11px] text-ink-3 mt-1">그림을 클릭하면 원본 크기로 확대됩니다.</p>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setLightbox(null)}
          role="dialog"
        >
          <div className="max-w-[920px] w-full bg-white rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="" className="w-full h-auto max-h-[80vh] object-contain" />
            <button type="button" className="btn btn-sm mt-2" onClick={() => setLightbox(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldCard({
  field,
  value,
  onChange,
}: {
  field: ArchetypeFormField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-md border p-2.5" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
        <label className="text-[12.5px] font-semibold">
          <Gloss text={field.label} />
        </label>
        {field.hint && <span className="text-[11.5px] text-ink-3">{field.hint}</span>}
      </div>
      {field.gloss && (
        <p className="text-[11.5px] mb-1.5 leading-relaxed rounded px-2 py-1" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
          용어: {field.gloss}
        </p>
      )}
      {field.type === "textarea" ? (
        <textarea
          className="inp w-full min-h-[64px] text-[13px]"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="inp w-full text-[13px]"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.example && (
        <p className="text-[11.5px] text-ink-2 mt-1.5 leading-relaxed">
          <strong>쉬운 예시:</strong> {field.example}
          <button
            type="button"
            className="ml-2 underline text-[11px]"
            style={{ color: "var(--brand-ink)" }}
            onClick={() => onChange(field.example || "")}
          >
            예시 넣기
          </button>
        </p>
      )}
    </div>
  );
}

function PracticeAiPanel({
  task,
  topic,
  methodName,
  stageIndex,
  stageLabel,
  archetypeId,
  methodNo,
  topicIndex,
  taskIndex,
  linkPrevTaskId,
}: {
  task: PracticeTask;
  topic: PracticeTopic;
  methodName: string;
  stageIndex: number;
  stageLabel: string;
  archetypeId: number;
  methodNo: number;
  topicIndex: number;
  taskIndex: number;
  linkPrevTaskId?: string | null;
}) {
  const settings = useStore((s) => s.settings);
  const fields = useMemo(() => buildPracticeAiFields(stageIndex, task, topic), [stageIndex, task, topic]);
  const taskId = useMemo(
    () => practiceTaskId(archetypeId, methodNo, topicIndex, stageIndex, taskIndex),
    [archetypeId, methodNo, topicIndex, stageIndex, taskIndex],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<ProgressEvent | null>(null);
  const [output, setOutput] = useState("");
  const [dataMode, setDataMode] = useState<ArchetypeDataMode>("new");
  const [imported, setImported] = useState("");
  const [wsTick, setWsTick] = useState(0);

  useEffect(() => {
    const onWs = (ev: Event) => {
      const d = (ev as CustomEvent<{ archetypeId: number; methodNo: number; topicIndex: number }>).detail;
      if (d?.archetypeId === archetypeId && d?.methodNo === methodNo && d?.topicIndex === topicIndex) {
        setWsTick((n) => n + 1);
      }
    };
    window.addEventListener(PRACTICE_WS_EVENT, onWs);
    return () => window.removeEventListener(PRACTICE_WS_EVENT, onWs);
  }, [archetypeId, methodNo, topicIndex]);

  const prevOutput = useMemo(() => {
    void wsTick;
    if (!linkPrevTaskId) return "";
    return getPracticeTaskSnapshot(archetypeId, methodNo, topicIndex, linkPrevTaskId)?.output || "";
  }, [archetypeId, methodNo, topicIndex, linkPrevTaskId, wsTick]);

  useEffect(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      init[f.key] = "";
    });
    const snap = getPracticeTaskSnapshot(archetypeId, methodNo, topicIndex, taskId);
    if (snap?.values && Object.keys(snap.values).length) {
      setValues({ ...init, ...snap.values });
    } else {
      setValues(init);
    }
    setOutput(snap?.output || "");
    setImported(snap?.imported || "");
    if (snap?.dataMode) setDataMode(snap.dataMode);
  }, [fields, archetypeId, methodNo, topicIndex, taskId]);

  const sampleDigest = useMemo(() => {
    const lines = [
      `태스크: ${task.label}`,
      `절차:`,
      ...task.procedures.map((p) => `- ${p}`),
      `결과물 안내: ${(task.deliverableParas || []).join(" / ")}`,
    ];
    if (task.deliverableTable?.headers?.length) {
      lines.push(`결과물 표 헤더: ${task.deliverableTable.headers.join(" | ")}`);
      lines.push(
        `결과물 표 예시(참고만): ${task.deliverableTable.rows
          .slice(0, 3)
          .map((r) => r.join(" | "))
          .join(" || ")}`
      );
    }
    return lines.join("\n");
  }, [task]);

  const persistSnapshot = (
    nextOutput: string,
    nextValues: Record<string, string>,
    nextImported: string,
    nextMode: ArchetypeDataMode,
  ) => {
    savePracticeTaskSnapshot(
      archetypeId,
      methodNo,
      topicIndex,
      taskId,
      nextOutput,
      nextValues,
      nextImported,
      nextMode,
    );
  };

  const onImportFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let text = "";
    if (ext === "csv") {
      text = await file.text();
    } else if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      text = XLSX.utils.sheet_to_csv(sheet);
    } else return;
    setImported(text);
    persistSnapshot(output, values, text, dataMode);
  };

  const exportFieldFormatXlsx = () => {
    const meta: (string | number)[][] = [
      ["항목", "내용"],
      ["태스크", task.label],
      ["절차 단계", stageLabel],
      ["연구방법", methodName],
      ["주제", topic.title],
      ["taskId", taskId],
    ];
    const formatRows: (string | number)[][] = [
      ["key", "항목명", "입력유형", "기입안내", "placeholder", "쉬운예시", "용어설명", "기입값"],
      ...fields.map((f) => [
        f.key,
        f.label,
        f.type || "text",
        f.hint || "",
        f.placeholder || "",
        f.example || "",
        f.gloss || "",
        values[f.key] || "",
      ]),
    ];
    exportTableXlsx(`practice-format-${taskId}.xlsx`, [
      { name: "항목포맷", aoa: formatRows },
      { name: "메타", aoa: meta },
    ]);
  };

  const exportFieldsXlsx = () => {
    const rows: (string | number)[][] = [
      ["field", "value"],
      ...fields.map((f) => [f.label, values[f.key] || ""]),
    ];
    if (output) rows.push([], ["output", output]);
    exportTableXlsx(`practice-${taskId}.xlsx`, [{ name: "task", aoa: rows }]);
  };

  const exportPdf = () => {
    exportSimplePdf({
      filename: `practice-${taskId}.pdf`,
      title: task.label,
      lines: output ? output.split("\n") : ["(산출물 없음)"],
    });
  };

  const run = async () => {
    setBusy(true);
    setProg({ phase: "준비", percent: 10 });
    const mergedContext = composePracticeInput(dataMode, prevOutput || undefined, values, imported);
    const fieldBlock = fields
      .map((f) => `· ${f.label}: ${values[f.key]?.trim() || "(비어 있음)"}`)
      .join("\n");
    const prompt =
      `당신은 MethodOS 프로젝트 실습 AI 변환기입니다.\n` +
      `참고 샘플의 형식·표 헤더·절차 구조만 따르고, 샘플 문구·수치·고유명을 그대로 복사하지 마세요.\n` +
      `사용자 기입란 내용으로 재작성하세요. 한국어로 답하세요.\n\n` +
      `【방법】${methodName}\n` +
      `【절차 단계】${stageLabel}\n` +
      `【샘플 주제】${topic.title}\n` +
      `【자료 연동 모드】${dataMode}\n` +
      `【참고 샘플(복붙 금지)】\n${sampleDigest}\n\n` +
      `【연동·불러온 자료】\n${mergedContext.slice(0, 2500)}\n\n` +
      `【사용자 상세 기입】\n${fieldBlock}\n\n` +
      `출력 형식:\n1) 이 태스크 산출물(가능하면 표 — 샘플 표 헤더 유지)\n2) 다음 태스크로 넘길 메모 3줄\n3) 가정·한계 2줄\n4) 연구자 확인 체크 3개`;
    try {
      setProg({ phase: "AI 호출", percent: 55 });
      const text = await aiComplete(prompt, settings);
      setProg({ phase: "완료", percent: 100 });
      const finalOut =
        text?.trim() ||
        "※ API 키가 없어 변환하지 못했습니다. 설정에서 키를 넣거나, 위 기입란·샘플 형식으로 직접 작성하세요.";
      setOutput(finalOut);
      persistSnapshot(finalOut, values, imported, dataMode);
    } catch (e) {
      setOutput(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md p-3 mt-3" style={{ background: "var(--color-background-secondary)" }}>
      <div className="text-[13px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>
        🔄 {task.aiTransform?.title || "AI 변환기 — 내 프로젝트로"}
      </div>
      <p className="text-[12.5px] text-ink-2 mb-3 leading-relaxed">
        위 예제·그림을 참고하되 문구를 그대로 복사하지 말고, <strong>아래 상세 기입란</strong>의 내 연구 내용으로 같은 형식의 산출물을 만듭니다.
        이전 태스크 산출은 <strong>자료 연동</strong>으로 다음 태스크 AI에 전달됩니다.
      </p>

      <h3 className="text-[13px] font-semibold mb-2">자료 연동 방식(Data Linkage)</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {(
          [
            ["link", "이전 단계 연동"],
            ["merge", "새 자료 + 연동 합치기"],
            ["new", "새 자료만"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            className="btn btn-sm"
            style={dataMode === mode ? { background: "var(--brand-soft)", borderColor: "var(--brand)" } : undefined}
            onClick={() => {
              setDataMode(mode);
              persistSnapshot(output, values, imported, mode);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {dataMode !== "new" && (
        <p className="text-[12px] text-ink-3 mb-2">
          이전 태스크 산출:{" "}
          {prevOutput ? `${prevOutput.slice(0, 120)}…` : "(저장된 산출 없음 — 이전 태스크에서 AI 변환 실행)"}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <label className="btn btn-sm cursor-pointer">
          파일 불러오기 (CSV/Excel)
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {imported && <span className="text-[12px] text-ink-3">불러온 자료 {imported.length}자</span>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-[13px] font-semibold m-0">항목 기입란({fields.length}개 · 단계 맞춤)</h3>
        <button type="button" className="btn btn-sm" onClick={exportFieldFormatXlsx}>
          항목포맷 엑셀 내보내기
        </button>
      </div>
      <div className="space-y-2.5 mb-3">
        {fields.map((field) => (
          <FieldCard
            key={field.key}
            field={field}
            value={values[field.key] || ""}
            onChange={(v) => setValues({ ...values, [field.key]: v })}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={run}>
          {busy ? "변환 중…" : "AI로 내 프로젝트 산출물 만들기"}
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            const next = { ...values };
            fields.forEach((f) => {
              if (f.example) next[f.key] = f.example.replace(/^예:\s*/, "");
            });
            setValues(next);
          }}
        >
          모든 쉬운 예시 채우기(연습용)
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            const empty: Record<string, string> = {};
            fields.forEach((f) => {
              empty[f.key] = "";
            });
            setValues(empty);
            setOutput("");
            setImported("");
          }}
        >
          기입 초기화
        </button>
        <button type="button" className="btn btn-sm" onClick={exportFieldsXlsx}>
          내보내기(Excel)
        </button>
        <button type="button" className="btn btn-sm" disabled={!output} onClick={exportPdf}>
          내보내기(PDF)
        </button>
      </div>
      {prog && (
        <div className="mt-2">
          <AiProgressBar progress={prog} />
        </div>
      )}
      {output && (
        <pre
          className="mt-3 text-[12.5px] whitespace-pre-wrap rounded-md p-2.5 overflow-x-auto"
          style={{ background: "var(--color-background-primary)" }}
        >
          {output}
        </pre>
      )}
    </div>
  );
}

function TaskFlowNav({
  flatIndex,
  total,
  prevLabel,
  nextLabel,
  onGo,
}: {
  flatIndex: number;
  total: number;
  prevLabel?: string;
  nextLabel?: string;
  onGo: (fi: number) => void;
}) {
  return (
    <div
      className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2"
      style={{ borderColor: "var(--color-border-tertiary)" }}
    >
      <span className="text-[12px] text-ink-3">
        태스크 {flatIndex + 1} / {total} · 이전 태스크 산출은 다음 AI「이전 단계 연동」에 사용됩니다
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-sm"
          disabled={flatIndex <= 0}
          onClick={() => onGo(flatIndex - 1)}
        >
          ← 이전 태스크{prevLabel ? `: ${prevLabel.slice(0, 24)}${prevLabel.length > 24 ? "…" : ""}` : ""}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={flatIndex >= total - 1}
          onClick={() => onGo(flatIndex + 1)}
        >
          다음 태스크 진행 →{nextLabel ? `: ${nextLabel.slice(0, 24)}${nextLabel.length > 24 ? "…" : ""}` : ""}
        </button>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  topic,
  methodName,
  family,
  stageIndex,
  stageLabel,
  flatIndex,
  flatTotal,
  prevFlat,
  nextFlat,
  archetypeId,
  methodNo,
  topicIndex,
  taskIndex,
  linkPrevTaskId,
  onGoTask,
}: {
  task: PracticeTask;
  topic: PracticeTopic;
  methodName: string;
  family?: string;
  stageIndex: number;
  stageLabel: string;
  flatIndex: number;
  flatTotal: number;
  prevFlat?: FlatPracticeTask;
  nextFlat?: FlatPracticeTask;
  archetypeId: number;
  methodNo: number;
  topicIndex: number;
  taskIndex: number;
  linkPrevTaskId?: string | null;
  onGoTask: (fi: number) => void;
}) {
  const isCollect =
    /자료수집|본조사|표본|수집|Data Collection|Raw data|응답자료/i.test(
      `${stageLabel} ${task.label} ${(task.deliverableParas || []).join(" ")}`,
    ) ||
    (task.procedureTable?.rows || []).some((r) => /완료\s*n|목표\s*표본|응답률/i.test(String(r[0] || "")));

  return (
    <div id={`practice-task-${flatIndex}`} className="card mb-3 scroll-mt-24">
      <h4 className="text-[14.5px] font-semibold mb-2">{task.label}</h4>

      <div className="text-[13px] font-semibold mb-1">■ 세부 태스크(Procedural Task)</div>
      <p className="text-[13px] mb-3">
        <Gloss text={task.detail} />
      </p>

      {isCollect && (
        <div className="rounded-md border p-2.5 mb-3 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          <b>자료수집 단계 · 표준 표본수</b>
          <p className="mt-1 text-ink-2">
            이 태스크에서는 ‘몇 명을/몇 건을’ 모을지가 핵심입니다. 양적 설문·실험은 보통 <b>100명 이상</b>(비교·상관 200–400, 모형 400–1,000+),
            질적 면담은 포화 기준 <b>15–40명</b>, 문헌·콘텐츠는 <b>수십~수백 건</b>이 실전 표준에 가깝습니다.
            아래 아코디언에서 주제별 완료 n·응답률에 맞춘 <b>실제 조사 형태 마이크로데이터(100행+)</b>를 펼쳐 보세요.
          </p>
        </div>
      )}

      <div className="text-[13px] font-semibold mb-1">■ 각테스크별 주석</div>
      <div className="mb-3 space-y-2">
        {task.procedures.map((para, i) => (
          <div key={i}>
            <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">
              <strong>({i + 1}) 실행 절차 요지: </strong>
              {para}
            </p>
            {(Array.isArray(task.notes) ? task.notes[i] : "")
              ? String(Array.isArray(task.notes) ? task.notes[i] : "")
                  .split("\n")
                  .filter(Boolean)
                  .map((n, j) => (
                    <p key={j} className="text-[12.5px] text-ink-2 pl-2 leading-relaxed whitespace-pre-wrap">
                      {n}
                    </p>
                  ))
              : null}
          </div>
        ))}
      </div>

      <div className="text-[13px] font-semibold mb-1">■ 상세 실행 절차</div>
      <ul className="list-disc pl-5 text-[13px] mb-2 space-y-1">
        {task.procedures.map((p, i) => (
          <li key={i}>
            <Gloss text={p} />
          </li>
        ))}
      </ul>
      <SampleTable headers={task.procedureTable?.headers} rows={task.procedureTable?.rows} />

      <div className="text-[13px] font-semibold mb-1">■ 결과물 샘플(Sample Deliverable)</div>
      {(task.deliverableParas || []).map((p, i) => (
        <p key={i} className="text-[13px] mb-1">
          <Gloss text={p} />
        </p>
      ))}
      <SampleTable headers={task.deliverableTable?.headers} rows={task.deliverableTable?.rows} />

      {isCollect && (
        <ArchetypeMicrodataAccordion
          methodName={methodName}
          family={family}
          topicTitle={topic.title}
          analysisKey={topic.analysis_key}
          mode={topic.mode}
          procedureRows={task.procedureTable?.rows}
          deliverableHeaders={task.deliverableTable?.headers}
          deliverableRows={task.deliverableTable?.rows}
          defaultOpen={/본조사|Raw data|응답자료/i.test(task.label + (task.deliverableParas || []).join(" "))}
        />
      )}

      <FigureGallery title="태스크 그림(컴팩트)" figures={task.figures || []} />

      <PracticeAiPanel
        task={task}
        topic={topic}
        methodName={methodName}
        stageIndex={stageIndex}
        stageLabel={stageLabel}
        archetypeId={archetypeId}
        methodNo={methodNo}
        topicIndex={topicIndex}
        taskIndex={taskIndex}
        linkPrevTaskId={linkPrevTaskId}
      />
      <TaskFlowNav
        flatIndex={flatIndex}
        total={flatTotal}
        prevLabel={prevFlat?.task.label}
        nextLabel={nextFlat?.task.label}
        onGo={onGoTask}
      />
    </div>
  );
}

export default function ArchetypePracticeTopic({
  archetypeId,
  methodNo,
  topicIndex,
  nav,
}: {
  archetypeId: number;
  methodNo: number;
  topicIndex: number;
  nav: (r: string) => void;
}) {
  const [doc, setDoc] = useState<PracticeMethodDoc | null>(null);
  const [err, setErr] = useState(false);
  const [openSi, setOpenSi] = useState(0);
  const [showTopicFigs, setShowTopicFigs] = useState(false);

  useEffect(() => {
    loadPracticeMethod(archetypeId, methodNo)
      .then(setDoc)
      .catch(() => setErr(true));
  }, [archetypeId, methodNo]);

  const topic = useMemo(
    () => doc?.topics.find((t) => t.index === topicIndex),
    [doc, topicIndex],
  );
  const flatTasks = useMemo(() => (topic ? flattenPracticeTasks(topic) : []), [topic]);

  const goToTask = useCallback(
    (fi: number) => {
      const item = flatTasks[fi];
      if (!item) return;
      setOpenSi(item.stageIndex);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#ft-${fi}`);
      }
      window.setTimeout(() => {
        document.getElementById(`practice-task-${fi}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    },
    [flatTasks],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !flatTasks.length) return;
    const m = window.location.hash.match(/^#ft-(\d+)$/);
    if (!m) return;
    const fi = Number(m[1]);
    if (Number.isFinite(fi) && flatTasks[fi]) {
      setOpenSi(flatTasks[fi].stageIndex);
      window.setTimeout(() => goToTask(fi), 150);
    }
  }, [flatTasks, goToTask]);

  if (err) return <div className="text-[14px] text-ink-3 p-6">주제를 불러오지 못했습니다.</div>;
  if (!doc) return <div className="text-[14px] text-ink-3 p-6">불러오는 중…</div>;
  if (!topic) return <div className="text-[14px] text-ink-3 p-6">주제를 찾을 수 없습니다.</div>;

  return (
    <div className="text-[14px] max-w-[960px]">
      <button
        type="button"
        className="btn btn-sm mb-2.5"
        onClick={() => nav(`archetype/practice/${archetypeId}/method/${methodNo}`)}
      >
        ← 주제 목록
      </button>
      <h1 className="text-[20px] font-semibold">
        주제{topic.index}: <Gloss text={topic.title} />
      </h1>
      <p className="mt-1 text-[13px] text-ink-2">
        {doc.methodName}({doc.methodEn}) · 정교화 샘플 예제·그림
      </p>
      {topic.hypothesis && (
        <p className="mt-2 text-[13px] leading-relaxed">
          <strong>명제:</strong> <Gloss text={topic.hypothesis} />
        </p>
      )}
      <p className="text-[12.5px] text-ink-2 mt-1">
        {[topic.participants, topic.mode, topic.focus].filter(Boolean).join(" / ")}
      </p>

      {(topic.figures || []).length > 0 && (
        <div className="card mt-3 mb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-[13px] font-semibold">주제 공통 그림({topic.figures.length})</div>
            <button type="button" className="btn btn-sm" onClick={() => setShowTopicFigs((v) => !v)}>
              {showTopicFigs ? "접기" : "펼쳐 보기"}
            </button>
          </div>
          {!showTopicFigs ? (
            <FigureGallery figures={topic.figures} compact />
          ) : (
            <FigureGallery figures={topic.figures} />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3 mb-3">
        {topic.stages.map((s, si) => (
          <button
            key={si}
            type="button"
            className={`btn btn-sm ${openSi === si ? "btn-primary" : ""}`}
            onClick={() => setOpenSi(si)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {topic.stages[openSi] && (
        <div>
          <h3 className="text-[16px] font-semibold mb-1">{topic.stages[openSi].label}</h3>
          <p className="text-[13px] text-ink-2 mb-3 leading-relaxed">{topic.stages[openSi].summary}</p>
          <p className="text-[12px] text-ink-3 mb-3">
            이 주제 전체 {flatTasks.length}개 태스크(①~⑥ 절차)가 순서대로 연동됩니다. 각 태스크 하단「다음 태스크 진행」으로 넘기세요.
          </p>
          {flatTasks
            .filter((ft) => ft.stageIndex === openSi)
            .map((ft) => {
              const prevFlat = ft.flatIndex > 0 ? flatTasks[ft.flatIndex - 1] : undefined;
              const nextFlat = ft.flatIndex < flatTasks.length - 1 ? flatTasks[ft.flatIndex + 1] : undefined;
              const prevId =
                ft.flatIndex > 0
                  ? practiceTaskId(
                      archetypeId,
                      methodNo,
                      topicIndex,
                      flatTasks[ft.flatIndex - 1].stageIndex,
                      flatTasks[ft.flatIndex - 1].taskIndex,
                    )
                  : null;
              return (
                <TaskCard
                  key={`${ft.stageIndex}-${ft.taskIndex}`}
                  task={ft.task}
                  topic={topic}
                  methodName={doc.methodName}
                  family={doc.family}
                  stageIndex={ft.stageIndex}
                  stageLabel={ft.stageLabel}
                  flatIndex={ft.flatIndex}
                  flatTotal={flatTasks.length}
                  prevFlat={prevFlat}
                  nextFlat={nextFlat}
                  archetypeId={archetypeId}
                  methodNo={methodNo}
                  topicIndex={topicIndex}
                  taskIndex={ft.taskIndex}
                  linkPrevTaskId={prevId}
                  onGoTask={goToTask}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
