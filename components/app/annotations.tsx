"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

export type Term = { term: string; def: string };
type Ctx = {
  items: Term[];
  register: (t: Term[]) => void;
  replace: (t: Term[]) => void;
  clear: () => void;
};
const AnnotationCtx = createContext<Ctx>({
  items: [],
  register: () => {},
  replace: () => {},
  clear: () => {},
});
export const useAnnotation = () => useContext(AnnotationCtx);

export function AnnotationProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<Map<string, Term>>(new Map());
  const [items, setItems] = useState<Term[]>([]);
  const register = useCallback((arr: Term[]) => {
    let changed = false;
    for (const t of arr) {
      if (!t?.term) continue;
      const k = t.term.toLowerCase();
      if (!mapRef.current.has(k)) {
        mapRef.current.set(k, { term: t.term, def: t.def || "" });
        changed = true;
      }
    }
    if (changed) setItems([...mapRef.current.values()]);
  }, []);
  const replace = useCallback((arr: Term[]) => {
    mapRef.current.clear();
    for (const t of arr) {
      if (!t?.term) continue;
      const k = t.term.toLowerCase();
      if (!mapRef.current.has(k)) mapRef.current.set(k, { term: t.term, def: t.def || "" });
    }
    setItems([...mapRef.current.values()]);
  }, []);
  const clear = useCallback(() => {
    mapRef.current.clear();
    setItems([]);
  }, []);
  return (
    <AnnotationCtx.Provider value={{ items, register, replace, clear }}>
      {children}
    </AnnotationCtx.Provider>
  );
}

function TermList({ items }: { items: Term[] }) {
  if (!items.length) {
    return <p className="ty-small text-ink-3">페이지를 읽으면 관련 용어 설명이 여기에 나타납니다.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t, i) => (
        <li key={i} className="ty-small leading-snug">
          <span className="font-semibold" style={{ color: "var(--brand-ink)" }}>{t.term}</span>
          {t.def.includes("✓ 맞는 예") || t.def.includes("✕ 틀린 예") ? (
            <div className="text-ink-2 mt-0.5 space-y-0.5">
              {t.def.split(/\n+/).map((line, j) => (
                <div key={j} style={line.startsWith("✓") ? { color: "var(--ok)" } : line.startsWith("✕") ? { color: "var(--bad)" } : undefined}>
                  {line.startsWith("·") ? line.slice(1).trim() : line}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-ink-2"> · {t.def}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** 데스크톱 좌측 + 모바일에서도 열 수 있는 용어 패널 */
export function AnnotationPanel() {
  const { items } = useAnnotation();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      <aside className="hidden xl:block sticky top-4 self-start h-[calc(100vh-2rem)] overflow-y-auto pr-1">
        <div className="card" style={{ padding: "14px" }}>
          <h3 className="ty-subhead mb-1">용어 주석</h3>
          <p className="ty-small text-ink-3 mb-2.5">이 페이지의 방법·통계 용어를 쉬운 말로 풀어 둡니다.</p>
          <TermList items={items} />
        </div>
      </aside>
      <div className="xl:hidden mb-3">
        <button
          type="button"
          className="btn w-full justify-between"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>용어 주석 {items.length ? `(${items.length})` : ""}</span>
          <span aria-hidden="true">{open ? "닫기" : "열기"}</span>
        </button>
        {open ? (
          <div className="card mt-2" style={{ padding: 14 }}>
            <TermList items={items} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
