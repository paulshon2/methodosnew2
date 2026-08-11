"use client";

import { Plus, X } from "lucide-react";
import type { WidgetProps } from "./types";

/** 다중 선택 — 분석에서는 보기마다 별도 변수가 된다. */
export default function Multi({ q, preview, value, onValue, onPatch }: WidgetProps) {
  const options = q.options ?? [];
  const picked = Array.isArray(value) ? value : [];
  const set = (i: number, v: string) => onPatch?.({ options: options.map((o, j) => (j === i ? v : o)) });

  return (
    <div className="space-y-1.5">
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${q.id}-${i}`}
            disabled={!preview}
            checked={picked.includes(o)}
            onChange={(e) => onValue?.(e.target.checked ? [...picked, o] : picked.filter((p) => p !== o))}
          />
          {preview ? (
            <label htmlFor={`${q.id}-${i}`} className="ty-body">
              {o || <span className="text-ink-3">(빈 보기)</span>}
            </label>
          ) : (
            <>
              <input className="inp" value={o} placeholder={`보기 ${i + 1}`} aria-label={`보기 ${i + 1}`} onChange={(e) => set(i, e.target.value)} />
              <button type="button" className="btn btn-sm" aria-label={`보기 ${i + 1} 삭제`} onClick={() => onPatch?.({ options: options.filter((_, j) => j !== i) })}>
                <X size={14} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      ))}
      {!preview && (
        <button type="button" className="btn btn-sm" onClick={() => onPatch?.({ options: [...options, ""] })}>
          <Plus size={14} aria-hidden="true" /> 보기 추가
        </button>
      )}
    </div>
  );
}
