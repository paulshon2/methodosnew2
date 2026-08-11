"use client";
/** 방법론적 아키타입 — 태스크별 AI 변환기 (기입란 → 산출물 초안) */
import { useEffect, useMemo, useRef, useState } from "react";
import { Gloss } from "./gloss";
import { aiComplete } from "@/lib/engine";
import { useStore } from "@/store/app-store";
import AiProgressBar from "./ai-progress-bar";
import type { ArchetypeAiTransform, ArchetypeExampleItem, ArchetypeFormField } from "@/lib/archetype-data";
import type { ProgressEvent } from "@/lib/coding-standards";
import {
  composeInputForMode,
  getTaskSnapshot,
  saveTaskSnapshot,
  type ArchetypeDataMode,
} from "@/lib/archetype-workflow";
import { exportChartBundle, exportTableXlsx, exportSimplePdf, downloadBlob } from "@/lib/viz-export";
import ArchetypeResultCharts from "@/lib/archetype-result-charts";
import * as XLSX from "xlsx";

function ruleDraft(taskName: string, fields: Record<string, string>, gallery: ArchetypeExampleItem[]): string {
  const lines = Object.entries(fields)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `· ${k}: ${v.trim()}`);
  const ex = gallery[0]?.body?.slice(0, 280) || "";
  return (
    `【태스크】${taskName}\n\n` +
    `【기입 항목】\n${lines.length ? lines.join("\n") : "(아직 기입 없음 — 예시 형식으로 초안만 제시)"}\n\n` +
    `【참고 예시 형식】\n${ex || "(예시 없음)"}\n\n` +
    `【산출물 초안(규칙)】\n` +
    `1) 목표 한 줄: ${fields.goal || fields.topic || fields.concept || fields.hypothesis || taskName}\n` +
    `2) 핵심 수치/정의: ${fields.population || fields.n || fields.alpha || fields.stats || fields.result || "— "}\n` +
    `3) 다음 단계로 넘길 산출: 위 항목을 표·문단으로 정리한 문서\n` +
    `4) 연구자 확인 ☐ 예시와 형식 일치 ☐ 수치 검산 ☐ 용어 한글(English) 표기`
  );
}

export default function ArchetypeTaskAi({
  archetypeId,
  taskId,
  processKey,
  linkPrevTaskId,
  taskName,
  stageLabel,
  formFields,
  values,
  setValues,
  gallery,
  excelSample,
  ai,
  taskKind,
}: {
  archetypeId: number;
  taskId: string;
  processKey: string;
  linkPrevTaskId?: string | null;
  taskName: string;
  stageLabel: string;
  formFields: ArchetypeFormField[];
  values: Record<string, string>;
  setValues: (v: Record<string, string>) => void;
  gallery: ArchetypeExampleItem[];
  excelSample?: string;
  ai?: ArchetypeAiTransform;
  taskKind?: string;
}) {
  const settings = useStore((s) => s.settings);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<ProgressEvent | null>(null);
  const [output, setOutput] = useState("");
  const [selectedEx, setSelectedEx] = useState(0);
  const [dataMode, setDataMode] = useState<ArchetypeDataMode>("new");
  const [imported, setImported] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  const showCharts = processKey === "result" || processKey === "deliverable" || processKey === "stats";

  const prevOutput = useMemo(() => {
    const prevId = linkPrevTaskId;
    if (!prevId) return "";
    return getTaskSnapshot(archetypeId, prevId)?.output || "";
  }, [archetypeId, linkPrevTaskId]);

  useEffect(() => {
    const snap = getTaskSnapshot(archetypeId, taskId);
    if (snap?.values && Object.keys(snap.values).length) setValues(snap.values);
    if (snap?.output) setOutput(snap.output);
  }, [archetypeId, taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filled = useMemo(() => Object.values(values).some((v) => v.trim().length > 0), [values]);

  const fillFromExample = (idx: number) => {
    const ex = gallery[idx];
    if (!ex) return;
    setSelectedEx(idx);
    const next = { ...values };
    const lines = ex.body.split(/\n/).map((l) => l.trim()).filter(Boolean);

    // Prefer mapping known keys from labeled lines
    const mapHints: [RegExp, string][] = [
      [/모집단|population/i, "population"],
      [/표집틀|sampling frame|frame/i, "frame"],
      [/표집|sampling method|표집방법/i, "method"],
      [/표본|sample size|^n\s*=/i, "n"],
      [/신뢰|허용오차|confidence|margin/i, "error"],
      [/개념|construct|척도명|scale/i, "concept"],
      [/가설|hypothesis/i, "hypothesis"],
      [/조사방식|mode/i, "mode"],
    ];
    for (const line of lines) {
      for (const [re, key] of mapHints) {
        if (formFields.some((f) => f.key === key) && re.test(line)) {
          next[key] = line.replace(/^[^:=]+[=:]\s*/, "").trim() || line;
          break;
        }
      }
    }

    const first = formFields[0];
    if (first) next[first.key] = next[first.key]?.trim() ? next[first.key] : ex.title;

    const textArea = formFields.find((f) => f.type === "textarea");
    if (textArea) {
      next[textArea.key] = ex.body;
    } else {
      // dump full sample into the richest text-like field still empty
      const prefer = ["population", "items", "stats", "result", "input", "output", "error", "note"];
      const target = prefer.find((k) => formFields.some((f) => f.key === k)) || formFields[Math.min(1, formFields.length - 1)]?.key;
      if (target && (!next[target] || next[target].length < 20)) next[target] = ex.body;
    }
    setValues(next);
  };

  const runAi = async () => {
    setBusy(true);
    setProg({ phase: "준비", percent: 8 });
    try {
      const mergedContext = composeInputForMode(dataMode, prevOutput, values, imported);
      const draft = ruleDraft(taskName, values, gallery) + `\n\n【자료 연동(${dataMode})】\n${mergedContext.slice(0, 2000)}`;
      setProg({ phase: "규칙 초안", percent: 25 });
      setOutput(draft);
      const fieldBlock = formFields
        .map((f) => `${f.label}: ${values[f.key]?.trim() || "(비어 있음)"}`)
        .join("\n");
      const prompt =
        `당신은 사회과학 연구 조교입니다. 방법론적 아키타입(Methodological Archetype)의 절차적 태스크를 수행합니다.\n` +
        `상위 절차적 단계(Procedural Stage): ${stageLabel}\n` +
        `태스크: ${taskName}\n` +
        `자료 연동 모드: ${dataMode}\n` +
        `지시: ${ai?.hint || "예시 샘플 형식으로 산출물 초안을 만드세요."}\n` +
        `용어는 한글(English) 병기를 유지하세요. 중학생도 읽게 쉬운 말로 쓰되, 전문 수치는 유지하세요.\n\n` +
        `【연동·불러온 자료】\n${mergedContext.slice(0, 2500)}\n\n` +
        `【사용자 기입】\n${fieldBlock}\n\n` +
        `【⑤ 원본 예시 샘플】\n${(excelSample || gallery[0]?.body || "").slice(0, 1200)}\n\n` +
        `출력 형식:\n1) 한 줄 요약\n2) 완성된 산출물(표 또는 구조화 문단)\n3) 연구자 확인 체크 3개`;
      setProg({ phase: "AI 호출", percent: 55 });
      const aiText = await aiComplete(prompt, settings);
      setProg({ phase: "정리", percent: 88 });
      const finalOut =
        aiText?.trim() ||
        draft + "\n\n※ AI 키가 없어 규칙 기반 초안입니다. 설정에서 API 키를 넣으면 AI 문장으로 보강됩니다.";
      setOutput(finalOut);
      saveTaskSnapshot(archetypeId, taskId, finalOut, values);
      setProg({ phase: "완료", percent: 100 });
    } finally {
      setBusy(false);
    }
  };

  const onImportFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      const text = await file.text();
      setImported(text);
      return;
    }
    if (ext === "xlsx" || ext === "xls") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      setImported(csv);
    }
  };

  const exportFieldsXlsx = () => {
    const rows: (string | number)[][] = [["field", "value"], ...formFields.map((f) => [f.label, values[f.key] || ""])];
    if (output) rows.push([], ["output", output]);
    exportTableXlsx(`archetype-${archetypeId}-${taskId}.xlsx`, [{ name: "task", aoa: rows }]);
  };

  const exportPdf = () => {
    exportSimplePdf({
      filename: `archetype-${archetypeId}-${taskId}.pdf`,
      title: taskName,
      lines: output ? output.split("\n") : ["(산출물 없음)"],
    });
  };

  return (
    <div className="card" style={{ borderTop: "3px solid var(--info)" }}>
      <h2 className="text-[16px] font-semibold mb-1">
        🔄 {ai?.title || "AI 변환기(AI Transformer)"}
      </h2>
      <p className="text-[13px] text-ink-2 mb-3">
        아래 <strong>④ 예시 샘플</strong>을 보고 항목을 기입한 뒤, AI로 이 태스크 산출물을 만드세요.
      </p>

      <h3 className="text-[14px] font-semibold mb-2">자료 연동 방식(Data Linkage)</h3>
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
            onClick={() => setDataMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>
      {dataMode !== "new" && (
        <p className="text-[12px] text-ink-3 mb-2">
          이전 단계 산출: {prevOutput ? `${prevOutput.slice(0, 120)}…` : "(저장된 산출 없음 — 이전 태스크에서 AI로 만들기 실행)"}
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
        {imported && (
          <span className="text-[12px] text-ink-3">불러온 자료 {imported.length}자</span>
        )}
      </div>

      <h3 className="text-[14px] font-semibold mb-2">④ 예시 샘플(Example Samples) — 실제 테스트용</h3>
      <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
        {gallery.map((g, i) => (
          <button
            key={g.id}
            type="button"
            className="text-left rounded-md p-2.5 transition-colors"
            style={{
              background: selectedEx === i ? "var(--brand-soft)" : "var(--color-background-secondary)",
              border: selectedEx === i ? "1px solid var(--brand)" : "1px solid transparent",
            }}
            onClick={() => fillFromExample(i)}
          >
            <div className="text-[12.5px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>
              샘플 {i + 1}. <Gloss text={g.title} />
            </div>
            <pre className="text-[11.5px] whitespace-pre-wrap leading-relaxed m-0 font-sans text-ink-2">{g.body}</pre>
            {g.relevance && (
              <p className="text-[11px] mt-2 leading-relaxed m-0" style={{ color: "var(--ink-3)" }}>
                💡 {g.relevance}
              </p>
            )}
            <div className="text-[11px] mt-1.5" style={{ color: "var(--brand)" }}>클릭 → 기입란에 불러오기</div>
          </button>
        ))}
      </div>

      {excelSample && (
        <div className="rounded-md px-3 py-2.5 mb-4" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
          <div className="text-[12.5px] font-semibold mb-1">⑤ 예시 샘플(원본 그대로)(Original Worked Sample)</div>
          <pre className="text-[12.5px] whitespace-pre-wrap m-0 font-sans leading-relaxed">{excelSample}</pre>
        </div>
      )}

      <h3 className="text-[14px] font-semibold mb-2">항목 기입란(Input Fields)</h3>
      <div className="space-y-2.5 mb-3">
        {formFields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[12px] text-ink-3 mb-1 block"><Gloss text={f.label} /></span>
            {f.type === "textarea" ? (
              <textarea
                className="inp w-full min-h-[72px] text-[13px]"
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            ) : (
              <input
                className="inp w-full text-[13px]"
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={runAi}>
          {busy ? "AI 생성 중…" : "AI로 만들기"}
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => fillFromExample(0)}
        >
          첫 샘플 기입
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            const empty: Record<string, string> = {};
            formFields.forEach((f) => (empty[f.key] = ""));
            setValues(empty);
            setOutput("");
          }}
        >
          기입 초기화
        </button>
        <button type="button" className="btn btn-sm" onClick={exportFieldsXlsx}>
          보내기(Excel)
        </button>
        <button type="button" className="btn btn-sm" disabled={!output} onClick={exportPdf}>
          보내기(PDF)
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!output}
          onClick={() => {
            const blob = new Blob(["\ufeff" + output], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `archetype-task-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          결과 내보내기
        </button>
      </div>
      {!filled && (
        <p className="text-[12px] text-ink-3 mb-2">샘플을 클릭하거나 직접 기입한 뒤 AI로 만들 수 있습니다.</p>
      )}
      {(busy || prog) && (
        <div className="mb-2">
          <AiProgressBar progress={prog} label={ai?.outputLabel || "태스크 변환"} hideOnDone />
        </div>
      )}
      {showCharts && (
        <>
          <ArchetypeResultCharts
            processKey={processKey}
            taskKind={taskKind || ai?.kind}
            topic={taskName}
            chartRef={chartRef}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                void exportChartBundle({
                  container: chartRef.current,
                  baseName: `archetype-chart-${archetypeId}-${taskId}`,
                  title: taskName,
                  summaryLines: output ? output.split("\n").slice(0, 8) : [taskName],
                  format: "png",
                })
              }
            >
              그래프 PNG
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                void exportChartBundle({
                  container: chartRef.current,
                  baseName: `archetype-chart-${archetypeId}-${taskId}`,
                  title: taskName,
                  summaryLines: [],
                  format: "jpeg",
                })
              }
            >
              그래프 JPEG
            </button>
          </div>
        </>
      )}
      {output && (
        <div className="rounded-md p-3 text-[13px] leading-relaxed" style={{ background: "var(--color-background-secondary)" }}>
          <div className="text-[12.5px] font-semibold mb-1.5">{ai?.outputLabel || "산출물 초안"}</div>
          <pre className="whitespace-pre-wrap m-0 font-sans">{output}</pre>
        </div>
      )}
    </div>
  );
}
