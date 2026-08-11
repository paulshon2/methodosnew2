"use client";

import { cn } from "@/lib/cn";

export type Cell = string | number | null | undefined;

/** 숫자를 화면에 낼 수 있는 문자열로 바꾼다. NaN·Infinity는 절대 내보내지 않는다. */
export function fmt(v: Cell, digits = 2): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "—";
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(digits);
  }
  const s = String(v);
  return s === "NaN" || s === "Infinity" || s === "-Infinity" || s === "undefined" ? "—" : s;
}

/**
 * 차트 대체 표.
 * 모든 차트는 같은 값의 표를 토글로 함께 제공한다 — 스크린리더·인쇄·검증용.
 */
export default function DataTable({
  columns,
  rows,
  caption,
  numeric = [],
  digits = 2,
  className,
  maxHeight,
}: {
  columns: string[];
  rows: Cell[][];
  caption?: string;
  /** 우측 정렬·등폭으로 낼 열 인덱스 */
  numeric?: number[];
  digits?: number;
  className?: string;
  maxHeight?: number;
}) {
  const num = new Set(numeric);
  return (
    <div className={cn("overflow-auto", className)} style={maxHeight ? { maxHeight } : undefined}>
      <table className="tbl">
        {caption ? <caption className="ty-label pb-2 text-left text-ink-3">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={c + i} scope="col" className={num.has(i) ? "num" : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((v, ci) => (
                <td key={ci} className={num.has(ci) ? "num" : undefined}>
                  {fmt(v, digits)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="ty-small px-2.5 py-3 text-ink-3">표시할 행이 없습니다.</p>}
    </div>
  );
}
