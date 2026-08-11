"use client";

import { useId, useState, type ReactNode } from "react";
import { GLOSS, EN_KO } from "@/lib/gloss";

/** GLOSS 사전에서 뜻을 찾는다. 대소문자·앞뒤 공백은 무시한다. */
export function lookupTerm(term: string): string | null {
  const k = term.trim();
  if (!k) return null;
  return GLOSS[k] || GLOSS[k.toLowerCase()] || EN_KO[k] || EN_KO[k.toLowerCase()] || null;
}

/**
 * 용어 툴팁.
 * 전문 용어를 피하면 논문을 못 쓰게 된다. 용어는 쓰되 풀이를 붙인다.
 * 마우스뿐 아니라 키보드 포커스에서도 뜬다.
 */
export default function Term({ children, def }: { children: ReactNode; def?: string }) {
  const id = useId();
  const [on, setOn] = useState(false);
  const text = typeof children === "string" ? children : "";
  const meaning = def || lookupTerm(text);
  if (!meaning) return <>{children}</>;
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-describedby={on ? id : undefined}
        aria-expanded={on}
        onMouseEnter={() => setOn(true)}
        onMouseLeave={() => setOn(false)}
        onFocus={() => setOn(true)}
        onBlur={() => setOn(false)}
        onClick={() => setOn((v) => !v)}
        className="cursor-help border-0 bg-transparent p-0 text-inherit"
        style={{ borderBottom: "1px dashed var(--color-text-tertiary)" }}
      >
        {children}
      </button>
      {on && (
        <span
          id={id}
          role="tooltip"
          className="glass-2 absolute bottom-[calc(100%+8px)] left-0 z-[60] block w-max max-w-[min(320px,70vw)] rounded-[10px] px-3 py-2 font-normal"
          style={{
            background: "var(--g-surface-2, var(--color-text-primary))",
            color: "var(--color-text-primary)",
            fontSize: "var(--fs-label)",
            lineHeight: 1.55,
            boxShadow: "var(--g-shadow-2)",
          }}
        >
          {meaning}
        </span>
      )}
    </span>
  );
}
