"use client";

import { useEffect, useRef } from "react";
import { allCodes, keyOf, type Assign, type Theme } from "@/lib/coding-types";

export type PopAt = { x: number; y: number } | null;

/** 선택한 문장 위에 뜨는 코드 목록. 숫자키를 쓰지 않는 사람을 위한 통로다. */
export default function CodePopover({
  at,
  themes,
  sel,
  assign,
  onApply,
  onClose,
}: {
  at: PopAt;
  themes: Theme[];
  sel: string[];
  assign: Assign;
  onApply: (codeId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!at) return;
    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      // 문장을 다시 누르는 경우는 문장 쪽 처리가 위치를 옮겨 준다.
      if (el && !el.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [at, onClose]);

  if (!at || sel.length === 0) return null;

  const codes = allCodes(themes);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="코드 적용"
      className="card glass-2 fixed z-[70] p-1.5"
      style={{
        width: 250,
        left: Math.min(at.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 266),
        top: Math.min(at.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 300),
      }}
    >
      <div className="ty-label px-1.5 pb-1.5 pt-0.5 font-bold text-ink-3">
        선택한 문장 {sel.length}개에 코드 적용
      </div>
      <ul className="max-h-[230px] overflow-auto">
        {codes.map((c) => {
          const on = sel.every((s) => (assign[s] ?? []).includes(c.id));
          const k = keyOf(themes, c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onApply(c.id)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left"
                style={{ background: on ? "var(--brand-soft)" : "transparent", fontSize: "var(--fs-small)", fontWeight: on ? 700 : 400 }}
              >
                <span
                  className="ty-label num grid h-4 w-4 shrink-0 place-items-center rounded"
                  style={{ border: "1px solid var(--color-border-tertiary)", color: "var(--color-text-tertiary)" }}
                >
                  {k <= 9 ? k : "·"}
                </span>
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: c.color }} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                {on ? <span aria-hidden="true">✓</span> : null}
                {on ? <span className="sr-only">적용됨</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
