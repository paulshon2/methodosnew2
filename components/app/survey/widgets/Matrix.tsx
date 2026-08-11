"use client";

import { Plus, X } from "lucide-react";
import type { WidgetProps } from "./types";

/** 행렬 — 같은 척도로 여러 항목을 물을 때만 쓴다. 항목이 많으면 응답 피로가 커진다. */
export default function Matrix({ q, preview, value, onValue, onPatch }: WidgetProps) {
  const rows = q.rows ?? [];
  const points = q.points ?? 5;
  const answers = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, string>;
  const cols = Array.from({ length: points }, (_, i) => String(i + 1));

  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <caption className="ty-label text-left text-ink-3">
          {q.lo || "왼쪽 끝"} … {q.hi || "오른쪽 끝"} · {points}점 척도
        </caption>
        <thead>
          <tr>
            <th scope="col">항목</th>
            {cols.map((c) => (
              <th key={c} scope="col" className="num">
                {c}
              </th>
            ))}
            {!preview && <th scope="col" className="sr-only">항목 삭제</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row" style={{ minWidth: 160 }}>
                {preview ? (
                  r || <span className="text-ink-3">(빈 항목)</span>
                ) : (
                  <input className="inp" value={r} placeholder={`항목 ${i + 1}`} aria-label={`항목 ${i + 1}`} onChange={(e) => onPatch?.({ rows: rows.map((x, j) => (j === i ? e.target.value : x)) })} />
                )}
              </th>
              {cols.map((c) => (
                <td key={c} className="text-center">
                  <input
                    type="radio"
                    name={`${q.id}-${i}`}
                    aria-label={`${r || `항목 ${i + 1}`} — ${c}점`}
                    disabled={!preview}
                    checked={answers[r] === c}
                    onChange={() => onValue?.({ ...answers, [r]: c })}
                  />
                </td>
              ))}
              {!preview && (
                <td>
                  <button type="button" className="btn btn-sm" aria-label={`항목 ${i + 1} 삭제`} onClick={() => onPatch?.({ rows: rows.filter((_, j) => j !== i) })}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!preview && (
        <button type="button" className="btn btn-sm mt-2" onClick={() => onPatch?.({ rows: [...rows, ""] })}>
          <Plus size={14} aria-hidden="true" /> 항목 추가
        </button>
      )}
    </div>
  );
}
