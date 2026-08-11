"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type NoteLevel = "info" | "ok" | "warn" | "risk";

const LV: Record<NoteLevel, { bg: string; fg: string; line: string; mark: string; label: string }> = {
  info: { bg: "var(--info-wash)", fg: "var(--info)", line: "var(--info)", mark: "i", label: "안내" },
  ok: { bg: "var(--ok-wash)", fg: "var(--ok)", line: "var(--ok)", mark: "✓", label: "정상" },
  warn: { bg: "var(--warn-wash)", fg: "var(--warn)", line: "var(--warn)", mark: "!", label: "주의" },
  risk: { bg: "var(--danger-soft)", fg: "var(--danger)", line: "var(--danger)", mark: "✕", label: "위험" },
};

/**
 * 알림 — 진단 한 문장 + 처방 한 문장.
 * `fix`를 비워도 되지만, 사용자가 무엇을 해야 할지 모르는 경고는 경고가 아니다.
 */
export default function Note({
  level = "info",
  title,
  children,
  fix,
  action,
  live = false,
  className,
}: {
  level?: NoteLevel;
  title?: ReactNode;
  children?: ReactNode;
  /** 처방 문장 */
  fix?: ReactNode;
  action?: ReactNode;
  /** 검정 결과·품질 점수처럼 값이 갱신되는 자리면 켠다 */
  live?: boolean;
  className?: string;
}) {
  const s = LV[level];
  return (
    <div
      className={cn("flex gap-2.5 rounded-[10px] px-3 py-2.5", className)}
      style={{ background: s.bg, borderLeft: `3px solid ${s.line}` }}
      role={level === "risk" ? "alert" : undefined}
      aria-live={live ? "polite" : undefined}
      aria-atomic={live ? true : undefined}
    >
      <span className="shrink-0 font-extrabold" style={{ color: s.fg }} aria-hidden="true">
        {s.mark}
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">{s.label}. </span>
        {title ? <div className="ty-small font-bold" style={{ color: s.fg }}>{title}</div> : null}
        {children ? <div className="ty-small text-ink-2">{children}</div> : null}
        {fix ? <div className="ty-small mt-1 text-ink-2"><strong style={{ color: s.fg }}>이렇게 하세요 </strong>{fix}</div> : null}
        {action ? <div className="mt-2 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
