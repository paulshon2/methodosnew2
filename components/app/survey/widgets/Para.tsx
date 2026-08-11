"use client";

import type { WidgetProps } from "./types";

/** 장문 — 이 답은 코딩 스튜디오에서 문장 단위로 코딩하게 된다. */
export default function Para({ q, preview, value, onValue }: WidgetProps) {
  return (
    <textarea
      className="inp"
      rows={4}
      disabled={!preview}
      placeholder={preview ? "자유롭게 적어 주세요" : "응답자가 여러 줄로 답하는 칸입니다"}
      aria-label={q.text || "장문 응답"}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onValue?.(e.target.value)}
    />
  );
}
