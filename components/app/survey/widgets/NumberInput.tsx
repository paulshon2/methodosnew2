"use client";

import type { WidgetProps } from "./types";

/** 숫자 — 범위를 묻지 않고 값을 그대로 받아야 평균·상관을 쓸 수 있다. */
export default function NumberInput({ q, preview, value, onValue }: WidgetProps) {
  return (
    <input
      className="inp num"
      type="number"
      inputMode="numeric"
      disabled={!preview}
      placeholder={preview ? "숫자만 입력" : "응답자가 숫자를 적는 칸입니다"}
      aria-label={q.text || "숫자 응답"}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onValue?.(e.target.value)}
    />
  );
}
