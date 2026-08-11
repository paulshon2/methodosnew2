"use client";
import { useMemo, useState } from "react";
import {
  buildArchetypeMicrodata,
  buildMethodPracticeDataset,
  tableToCsv,
  type SampleTable,
} from "@/lib/practice-sample-n";
import {
  basicStatsSampleSizeGuide,
  csvToSampleTable,
  BASIC_STATS_PRACTICE_N,
} from "@/lib/basic-stats-demos";
import { downloadBlob } from "@/lib/ca-automation";

function MiniTable({ table, maxVisible = 12 }: { table: SampleTable; maxVisible?: number }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? table.rows : table.rows.slice(0, maxVisible);
  return (
    <div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto rounded border" style={{ borderColor: "var(--color-border-tertiary)" }}>
        <table className="w-full text-[11.5px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c} className="text-left p-1.5 sticky top-0 bg-[var(--color-background-primary)]" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="p-1 align-top" style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    {String(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.rows.length > maxVisible && (
        <button type="button" className="btn btn-sm mt-1.5" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "일부만 보기" : `전체 ${table.rows.length}행 펼치기`}
        </button>
      )}
    </div>
  );
}

/** 연구방법 11단계 워크벤치 — 표준 n 안내 + 100행+ 아코디언 */
export function MethodPracticeSampleAccordion({
  methodId,
  methodLabel,
  exampleLabel,
  exampleText,
  seedTable,
}: {
  methodId: string;
  methodLabel: string;
  exampleLabel: string;
  exampleText: string;
  seedTable?: SampleTable | null;
}) {
  const [open, setOpen] = useState(false);
  const built = useMemo(
    () =>
      buildMethodPracticeDataset({
        methodId,
        methodLabel,
        exampleLabel,
        table: seedTable || undefined,
        n: 100,
      }),
    [methodId, methodLabel, exampleLabel, seedTable],
  );

  return (
    <div className="mt-2 rounded-md border overflow-hidden" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <button
        type="button"
        className="w-full text-left px-2.5 py-2 text-[12.5px] font-semibold flex items-center justify-between gap-2"
        style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          자료수집 표준 표본수 · 연습 데이터 {built.n}행 — {exampleLabel}
        </span>
        <span className="text-[11px] font-normal">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && (
        <div className="p-2.5 space-y-2 text-[12.5px] leading-relaxed">
          <div className="rounded border p-2" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
            <div className="font-semibold mb-1">{built.guide.title}</div>
            <p>
              <b>실전 표준 n · </b>
              {built.guide.standardN}
            </p>
            <p className="mt-1 text-ink-2">{built.guide.rationale}</p>
            <p className="mt-1 text-ink-3">{built.guide.practiceNote}</p>
          </div>
          <p className="text-ink-2">{exampleText}</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                downloadBlob(tableToCsv(built.table), `${methodId}_${built.n}rows.csv`, "text/csv;charset=utf-8")
              }
            >
              CSV 저장 ({built.n}행)
            </button>
          </div>
          <MiniTable table={built.table} />
        </div>
      )}
    </div>
  );
}

/** 프로젝트 예비학습 — 본조사 마이크로데이터 아코디언 */
export function ArchetypeMicrodataAccordion({
  methodName,
  family,
  topicTitle,
  analysisKey,
  mode,
  procedureRows,
  deliverableHeaders,
  deliverableRows,
  defaultOpen,
}: {
  methodName: string;
  family?: string;
  topicTitle: string;
  analysisKey?: string;
  mode?: string;
  procedureRows?: string[][];
  deliverableHeaders?: string[];
  deliverableRows?: string[][];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const built = useMemo(
    () =>
      buildArchetypeMicrodata({
        methodName,
        family,
        topicTitle,
        analysisKey,
        mode,
        procedureRows,
        deliverableHeaders,
        deliverableRows,
      }),
    [methodName, family, topicTitle, analysisKey, mode, procedureRows, deliverableHeaders, deliverableRows],
  );

  return (
    <div className="mt-3 mb-3 rounded-md border overflow-hidden" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <button
        type="button"
        className="w-full text-left px-3 py-2.5 text-[13px] font-semibold flex items-center justify-between gap-2"
        style={{ background: "var(--appr-qual-soft)", color: "var(--fam-mixed)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          실제 조사 데이터표본(마이크로데이터) · 완료 n={built.completedN} · 미리보기 {built.previewN}행
        </span>
        <span className="text-[11px] font-normal">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2 text-[12.5px] leading-relaxed">
          <div className="rounded border p-2.5" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
            <div className="font-semibold mb-1">{built.guide.title}</div>
            <p>
              <b>이 주제·방법의 실전 표준 n · </b>
              {built.guide.standardN}
            </p>
            <p className="mt-1 text-ink-2">{built.guide.rationale}</p>
            <p className="mt-1 text-ink-3">
              본 주제 결과 지표의 완료 n={built.completedN}에 맞춰, 동일 변수 구조의 가상 응답 {built.previewN}행을
              아래에 제공합니다. (전체 n이 더 크면 미리보기이며, CSV로 저장해 분석 연습에 쓸 수 있습니다.)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="text-[12px] w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="text-left p-1 border-b">지표</th>
                  <th className="text-left p-1 border-b">값</th>
                </tr>
              </thead>
              <tbody>
                {built.metrics.map((m) => (
                  <tr key={m.label}>
                    <td className="p-1 border-b">{m.label}</td>
                    <td className="p-1 border-b font-medium">{m.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                downloadBlob(
                  tableToCsv(built.table),
                  `${methodName.replace(/\s+/g, "_")}_t_${built.previewN}.csv`,
                  "text/csv;charset=utf-8",
                )
              }
            >
              마이크로데이터 CSV 저장
            </button>
          </div>
          <MiniTable table={built.table} maxVisible={15} />
        </div>
      )}
    </div>
  );
}

/** 기본통계(기술·추론 41 · SEM 12) — 표준 n 안내 + 100행+ 아코디언 표 */
export function BasicStatsSampleAccordion({
  moduleId,
  moduleName,
  englishName,
  demoTitle,
  csv,
  defaultOpen,
}: {
  moduleId: string;
  moduleName: string;
  englishName?: string;
  demoTitle?: string;
  csv: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const guide = useMemo(
    () => basicStatsSampleSizeGuide(moduleId, moduleName, englishName),
    [moduleId, moduleName, englishName],
  );
  const table = useMemo(() => csvToSampleTable(csv), [csv]);
  const n = table?.rows.length || 0;
  const label = demoTitle || moduleName;

  if (!table || n < 1) return null;

  return (
    <div className="mt-3 rounded-md border overflow-hidden" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <button
        type="button"
        className="w-full text-left px-2.5 py-2 text-[12.5px] font-semibold flex items-center justify-between gap-2"
        style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          자료수집 표준 표본수 · 연습 데이터 {n}행 — {label}
          {n >= BASIC_STATS_PRACTICE_N ? "" : ` (권장 ${BASIC_STATS_PRACTICE_N}+)`}
        </span>
        <span className="text-[11px] font-normal">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && (
        <div className="p-2.5 space-y-2 text-[12.5px] leading-relaxed">
          <div
            className="rounded border p-2"
            style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}
          >
            <div className="font-semibold mb-1">{guide.title}</div>
            <p>
              <b>실전 표준 n · </b>
              {guide.standardN}
            </p>
            <p className="mt-1 text-ink-2">{guide.rationale}</p>
            <p className="mt-1 text-ink-3">{guide.practiceNote}</p>
            <p className="mt-1 text-[11.5px] text-ink-3">
              적용 기법: {moduleName}
              {englishName ? ` (${englishName})` : ""} · 계열 {guide.family === "sem" ? "구조방정식·잠재변수" : guide.family === "meta" ? "메타(연구 단위)" : guide.family === "timeseries" ? "시계열" : "기술·추론"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                downloadBlob(tableToCsv(table as SampleTable), `${moduleId}_${n}rows.csv`, "text/csv;charset=utf-8")
              }
            >
              CSV 저장 ({n}행)
            </button>
          </div>
          <MiniTable table={table as SampleTable} maxVisible={12} />
        </div>
      )}
    </div>
  );
}
