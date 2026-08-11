"use client";

import type { WidgetProps } from "./types";

/** 단답 — 답이 자유로울수록 나중에 코딩할 일이 늘어난다. */
export default function Text({ q, preview, value, onValue }: WidgetProps) {
  return (
    <input
      className="inp"
      type="text"
      disabled={!preview}
      placeholder={preview ? "여기에 답을 적습니다" : "응답자가 한 줄로 답하는 칸입니다"}
      aria-label={q.text || "단답 응답"}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onValue?.(e.target.value)}
    />
  );
}
