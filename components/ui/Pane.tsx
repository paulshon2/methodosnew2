"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** 패널 — head / body / foot 세 슬롯. 유리는 1단만 걸린다(`card`). */
export default function Pane({
  title,
  actions,
  children,
  foot,
  className,
  bodyClassName,
  flush = false,
  scroll,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  /** 본문 최대 높이(px). 넘치면 스크롤한다. */
  scroll?: number;
}) {
  return (
    <section className={cn("card overflow-hidden p-0", className)}>
      {(title || actions) && (
        <header className="ws-pane__head">
          {title ? <h2 className="ty-label m-0 uppercase text-ink-2">{title}</h2> : null}
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div
        className={cn("ws-pane__body", flush && "ws-pane__body--flush", bodyClassName)}
        style={scroll ? { maxHeight: scroll } : undefined}
      >
        {children}
      </div>
      {foot ? <footer className="ws-pane__foot">{foot}</footer> : null}
    </section>
  );
}
