"use client";

import { useEffect, useState } from "react";
import type { WizardCompareExample, WizardDataExample } from "@/lib/viz-wizard-config";

function esc(s: string) {
  return String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseCsvPreview(csv: string): { headers: string[]; body: string[][] } {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], body: [] };
  const headers = lines[0].split(",").map((s) => s.trim());
  const body = lines.slice(1).map((line) => line.split(",").map((s) => s.trim()));
  return { headers, body };
}

function toCsv(headers: string[], body: string[][]): string {
  return [headers.join(","), ...body.map((r) => r.map((c) => String(c ?? "")).join(","))].join("\n");
}

function EditableTable({
  headers,
  rows,
  onChange,
}: {
  headers: string[];
  rows: string[][];
  onChange?: (next: { headers: string[]; rows: string[][] }) => void;
}) {
  const editable = !!onChange;
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-[11px] border-collapse" style={{ borderColor: "var(--color-border-tertiary)" }}>
        <thead>
          <tr>
            {headers.map((h, hi) => (
              <th key={hi} className="border px-1 py-1 text-left font-semibold" style={{ background: "var(--color-background-secondary)" }}>
                {editable ? (
                  <input
                    className="w-full min-w-[64px] bg-transparent font-semibold outline-none"
                    value={h}
                    onChange={(e) => {
                      const nh = [...headers];
                      nh[hi] = e.target.value;
                      onChange!({ headers: nh, rows });
                    }}
                  />
                ) : (
                  h
                )}
              </th>
            ))}
            {editable ? <th className="border px-1 w-8" style={{ background: "var(--color-background-secondary)" }} /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {headers.map((_, j) => (
                <td key={j} className="border px-1 py-0.5">
                  {editable ? (
                    <input
                      className="w-full min-w-[48px] bg-transparent outline-none"
                      value={r[j] ?? ""}
                      onChange={(e) => {
                        const nr = rows.map((row) => [...row]);
                        while (nr[i].length < headers.length) nr[i].push("");
                        nr[i][j] = e.target.value;
                        onChange!({ headers, rows: nr });
                      }}
                    />
                  ) : (
                    esc(r[j] ?? "")
                  )}
                </td>
              ))}
              {editable ? (
                <td className="border px-1 text-center">
                  <button
                    type="button"
                    className="text-[10px] text-ink-3"
                    title="행 삭제"
                    onClick={() => onChange!({ headers, rows: rows.filter((_, ri) => ri !== i) })}
                  >
                    ×
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {editable ? (
        <button
          type="button"
          className="btn btn-sm mt-1.5"
          onClick={() => onChange!({ headers, rows: [...rows, headers.map(() => "")] })}
        >
          + 행 추가
        </button>
      ) : null}
    </div>
  );
}

function DataExampleEditor({
  ex,
  onApply,
}: {
  ex: WizardDataExample;
  onApply: (ex: WizardDataExample) => void;
}) {
  const initial = ex.source === "csv" && ex.csv ? parseCsvPreview(ex.csv) : { headers: [], body: [] };
  const [headers, setHeaders] = useState(initial.headers);
  const [rows, setRows] = useState(initial.body);

  useEffect(() => {
    if (ex.source === "csv" && ex.csv) {
      const p = parseCsvPreview(ex.csv);
      setHeaders(p.headers);
      setRows(p.body);
    }
  }, [ex.id, ex.csv, ex.source]);

  if (ex.source !== "csv" || !ex.csv) {
    return (
      <div className="px-2.5 pb-2 border-t" style={{ borderColor: "var(--color-border-tertiary)" }}>
        <p className="text-[11px] text-ink-3 mt-2">연습용 생성 데이터 ({ex.source}) — 「이 자료로 적용」을 누르면 표본이 채워집니다.</p>
        <button
          type="button"
          className="btn btn-sm btn-primary mt-2 w-full"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onApply(ex);
          }}
        >
          이 자료로 적용
        </button>
      </div>
    );
  }

  return (
    <div className="px-2.5 pb-2 border-t" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <p className="text-[11px] text-ink-3 mt-1.5">표 칸을 직접 수정한 뒤 적용할 수 있습니다.</p>
      <EditableTable
        headers={headers}
        rows={rows}
        onChange={({ headers: h, rows: r }) => {
          setHeaders(h);
          setRows(r);
        }}
      />
      <button
        type="button"
        className="btn btn-sm btn-primary mt-2 w-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onApply({ ...ex, csv: toCsv(headers, rows) });
        }}
      >
        이 자료로 적용
      </button>
    </div>
  );
}

export function DataExampleAccordions({
  examples,
  openId,
  onToggle,
  onApply,
}: {
  examples: WizardDataExample[];
  openId: string | null;
  onToggle: (id: string) => void;
  onApply: (ex: WizardDataExample) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {examples.map((ex) => {
        const open = openId === ex.id;
        return (
          <div key={ex.id} className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-border-tertiary)" }}>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px]"
              onClick={() => onToggle(ex.id)}
            >
              <span>{open ? "▼" : "▶"}</span>
              <span className="flex-1 font-medium">{ex.title}</span>
              <span className="text-[10px] text-ink-3">{ex.hint}</span>
            </button>
            {open ? <DataExampleEditor ex={ex} onApply={onApply} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function CompareExampleAccordions({
  examples,
  openId,
  onToggle,
  onApply,
}: {
  examples: WizardCompareExample[];
  openId: string | null;
  onToggle: (id: string) => void;
  onApply: (ex: WizardCompareExample) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {examples.map((ex) => {
        const open = openId === ex.id;
        return (
          <div key={ex.id} className="rounded-md border overflow-hidden" style={{ borderColor: "var(--color-border-tertiary)" }}>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px]"
              onClick={() => onToggle(ex.id)}
            >
              <span>{open ? "▼" : "▶"}</span>
              <span className="flex-1 font-medium">{ex.title}</span>
            </button>
            {open && (
              <div className="px-2.5 pb-2 border-t text-[11px]" style={{ borderColor: "var(--color-border-tertiary)" }}>
                <EditableTable
                  headers={["축/옵션", "열 이름", "설명"]}
                  rows={[
                    ["가로 (X)", ex.x, "범주·날짜·연속"],
                    ["세로 (Y)", ex.y, "값·빈도"],
                    ...(ex.g ? [["색 (그룹)", ex.g, "범례"]] : []),
                    ...(ex.s ? [["크기", ex.s, "버블 등"]] : []),
                    ["메모", ex.note, ""],
                  ]}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary mt-2 w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onApply(ex);
                  }}
                >
                  이 조합으로 적용
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
