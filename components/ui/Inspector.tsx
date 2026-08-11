"use client";

import { useId, useState, type ReactNode } from "react";

export type InspectorTab = { id: string; label: string; content: ReactNode };

/** 우측 속성 패널 — 탭이 하나면 탭 줄을 그리지 않는다. */
export default function Inspector({
  title,
  tabs,
  empty,
  foot,
}: {
  title?: string;
  tabs: InspectorTab[];
  /** 탭이 없을 때 보여줄 내용 */
  empty?: ReactNode;
  foot?: ReactNode;
}) {
  const base = useId();
  const [active, setActive] = useState(tabs[0]?.id || "");
  if (tabs.length === 0) {
    return (
      <section className="card overflow-hidden p-0">
        {title ? (
          <header className="ws-pane__head">
            <h2 className="ty-label m-0 uppercase text-ink-2">{title}</h2>
          </header>
        ) : null}
        <div className="ws-pane__body">{empty}</div>
      </section>
    );
  }
  const cur = tabs.find((t) => t.id === active) || tabs[0];
  return (
    <section className="card overflow-hidden p-0">
      {title ? (
        <header className="ws-pane__head">
          <h2 className="ty-label m-0 uppercase text-ink-2">{title}</h2>
        </header>
      ) : null}
      {tabs.length > 1 && (
        <div role="tablist" aria-label={title || "속성"} className="flex gap-1 overflow-x-auto px-3 pt-2">
          {tabs.map((t) => {
            const on = t.id === cur.id;
            return (
              <button
                key={t.id}
                id={`${base}-tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`${base}-panel-${t.id}`}
                onClick={() => setActive(t.id)}
                className="whitespace-nowrap px-2.5 pb-2 pt-1"
                style={{
                  borderBottom: `2px solid ${on ? "var(--brand)" : "transparent"}`,
                  color: on ? "var(--brand-ink)" : "var(--color-text-tertiary)",
                  fontSize: "var(--fs-small)",
                  fontWeight: on ? 800 : 600,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      <div
        id={`${base}-panel-${cur.id}`}
        role={tabs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={tabs.length > 1 ? `${base}-tab-${cur.id}` : undefined}
        className="ws-pane__body anim-panel"
      >
        {cur.content}
      </div>
      {foot ? <footer className="ws-pane__foot">{foot}</footer> : null}
    </section>
  );
}
