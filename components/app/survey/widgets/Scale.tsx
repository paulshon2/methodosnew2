"use client";

import type { WidgetProps } from "./types";

/** 리커트 척도 — 양끝 라벨이 없으면 응답자가 방향을 모른다. */
export default function Scale({ q, preview, value, onValue, onPatch }: WidgetProps) {
  const points = q.points ?? 5;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="ty-label text-ink-3">{q.lo || "왼쪽 끝"}</span>
        {Array.from({ length: points }, (_, i) => String(i + 1)).map((n) => (
          <label key={n} className="flex flex-col items-center gap-1">
            <input type="radio" name={q.id} disabled={!preview} checked={value === n} onChange={() => onValue?.(n)} />
            <span className="ty-label num">{n}</span>
          </label>
        ))}
        <span className="ty-label text-ink-3">{q.hi || "오른쪽 끝"}</span>
      </div>
      {!preview && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input className="inp" value={q.lo || ""} placeholder="왼쪽 끝 라벨" aria-label="왼쪽 끝 라벨" onChange={(e) => onPatch?.({ lo: e.target.value })} />
          <input className="inp" value={q.hi || ""} placeholder="오른쪽 끝 라벨" aria-label="오른쪽 끝 라벨" onChange={(e) => onPatch?.({ hi: e.target.value })} />
        </div>
      )}
    </div>
  );
}
