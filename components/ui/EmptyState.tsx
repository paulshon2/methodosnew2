"use client";

import type { ReactNode } from "react";

/** 빈 상태 — 반드시 다음 행동을 지시한다. */
export default function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 px-6 py-12 text-center">
      {icon ? <div className="opacity-40" aria-hidden="true">{icon}</div> : null}
      <div className="ty-subhead text-ink-2">{title}</div>
      {children ? <p className="ty-small max-w-[42ch] text-ink-3">{children}</p> : null}
      {action ? <div className="flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
