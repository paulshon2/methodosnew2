"use client";

import type { ReactNode } from "react";

/** 작업 화면 상단 — 순서·항목 의미·이유를 한 카드에 담는다. */
export default function StudioGuide({
  why,
  steps,
  parts,
}: {
  why: string;
  steps: { title: string; body: string }[];
  parts: { name: string; body: string }[];
}) {
  return (
    <div className="card mb-4" style={{ padding: "14px 16px" }}>
      <h2 className="ty-section mb-1.5">개요</h2>
      <p className="ty-small text-ink-2 prose-w mb-3">{why}</p>
      <h3 className="ty-label font-bold mb-1.5">권장 순서</h3>
      <ol className="mb-3 space-y-1.5">
        {steps.map((s, i) => (
          <li key={s.title} className="ty-small text-ink-2 flex gap-2">
            <span className="num shrink-0 font-bold" style={{ color: "var(--brand-ink)" }}>
              {i + 1}.
            </span>
            <span>
              <strong className="text-ink-1">{s.title}</strong> — {s.body}
            </span>
          </li>
        ))}
      </ol>
      <h3 className="ty-label font-bold mb-1.5">화면 항목의 의미</h3>
      <dl className="grid gap-2 sm:grid-cols-2">
        {parts.map((p) => (
          <div key={p.name} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--color-border-tertiary)" }}>
            <dt className="ty-label font-bold mb-0.5">{p.name}</dt>
            <dd className="ty-small text-ink-2">{p.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function IoToolbar({
  onImportCsv,
  onImportXlsx,
  onExportCsv,
  onExportXlsx,
  onExportPdf,
  fileLabel,
  disabledExport,
}: {
  onImportCsv: (f: File) => void;
  onImportXlsx: (f: File) => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  onExportPdf: () => void;
  fileLabel?: string;
  disabledExport?: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <span className="ty-label font-bold shrink-0">불러오기</span>
      <label className="btn btn-sm cursor-pointer">
        Excel
        <input
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportXlsx(f);
            e.target.value = "";
          }}
        />
      </label>
      <label className="btn btn-sm cursor-pointer">
        CSV
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportCsv(f);
            e.target.value = "";
          }}
        />
      </label>
      <span className="ty-label font-bold shrink-0 ml-2">내보내기</span>
      <button type="button" className="btn btn-sm" disabled={disabledExport} onClick={onExportXlsx}>
        Excel
      </button>
      <button type="button" className="btn btn-sm" disabled={disabledExport} onClick={onExportCsv}>
        CSV
      </button>
      <button type="button" className="btn btn-sm" disabled={disabledExport} onClick={onExportPdf}>
        PDF
      </button>
      {fileLabel ? <span className="ty-label text-ink-3 ml-auto truncate max-w-[220px]">현재 · {fileLabel}</span> : null}
    </div>
  );
}

export function GuideSlot({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
