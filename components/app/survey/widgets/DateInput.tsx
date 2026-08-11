"use client";

import type { WidgetProps } from "./types";

/** 날짜 — 기간을 계산할 수 있게 자유 문자열 대신 날짜로 받는다. */
export default function DateInput({ q, preview, value, onValue }: WidgetProps) {
  return (
    <input
      className="inp num"
      type="date"
      disabled={!preview}
      aria-label={q.text || "날짜 응답"}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onValue?.(e.target.value)}
    />
  );
}
