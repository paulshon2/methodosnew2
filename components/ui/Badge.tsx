"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "ok" | "warn" | "risk" | "info" | "quant" | "qual" | "mixed";

const TONE: Record<BadgeTone, { bg: string; fg: string; mark: string }> = {
  neutral: { bg: "var(--color-background-tertiary)", fg: "var(--color-text-secondary)", mark: "·" },
  brand: { bg: "var(--brand-soft)", fg: "var(--brand-ink)", mark: "●" },
  ok: { bg: "var(--ok-wash)", fg: "var(--ok)", mark: "✓" },
  warn: { bg: "var(--warn-wash)", fg: "var(--warn)", mark: "!" },
  risk: { bg: "var(--danger-soft)", fg: "var(--danger)", mark: "✕" },
  info: { bg: "var(--info-wash)", fg: "var(--info)", mark: "i" },
  quant: { bg: "var(--appr-quant-soft)", fg: "var(--appr-quant)", mark: "수" },
  qual: { bg: "var(--appr-qual-soft)", fg: "var(--appr-qual)", mark: "말" },
  mixed: { bg: "var(--appr-mixed-soft)", fg: "var(--appr-mixed)", mark: "혼" },
};

/**
 * 상태 배지.
 * 색만으로 상태를 말하지 않도록 문자 표식을 강제한다 — 흑백 인쇄·색각 이상에서도 읽혀야 한다.
 * `mark={false}` 로 끄려면 텍스트 자체가 상태를 말하고 있어야 한다.
 */
export default function Badge({
  tone = "neutral",
  mark,
  children,
  title,
  className,
}: {
  tone?: BadgeTone;
  /** 기본은 톤별 기본 표식. false면 표식 없음(텍스트가 상태를 말할 때만). */
  mark?: string | false;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  const t = TONE[tone];
  const symbol = mark === false ? null : mark || t.mark;
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 align-middle", className)}
      style={{ background: t.bg, color: t.fg, fontSize: "var(--fs-label)", fontWeight: 700 }}
      title={title}
    >
      {symbol ? <span aria-hidden="true">{symbol}</span> : null}
      <span>{children}</span>
    </span>
  );
}
