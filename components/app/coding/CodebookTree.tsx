"use client";

import { ChevronRight, Plus } from "lucide-react";
import { allCodes, keyOf, type Assign, type Theme } from "@/lib/coding-types";
import { codeCounts } from "@/lib/coding-types";

/** 좌 · 코드북. 코드마다 단축키 번호·색·적용 빈도를 함께 보여 준다. */
export default function CodebookTree({
  themes,
  assign,
  active,
  query,
  onQuery,
  onPick,
  onToggleTheme,
  onAddCode,
}: {
  themes: Theme[];
  assign: Assign;
  active: string | null;
  query: string;
  onQuery: (v: string) => void;
  /** 문장이 선택돼 있으면 코드 적용, 아니면 코드 자체를 고른다. */
  onPick: (codeId: string) => void;
  onToggleTheme: (themeId: string) => void;
  onAddCode: () => void;
}) {
  const counts = codeCounts(assign);
  const max = Math.max(1, ...Object.values(counts));
  const q = query.trim().toLowerCase();

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="ty-label font-bold">코드북</h3>
        <span className="ty-label num text-ink-3">{allCodes(themes).length}개</span>
        <button type="button" className="btn btn-sm ml-auto" onClick={onAddCode} aria-label="코드 추가">
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>

      <input
        className="inp mb-2"
        type="search"
        value={query}
        placeholder="코드 검색"
        aria-label="코드 검색"
        onChange={(e) => onQuery(e.target.value)}
      />

      {themes.map((t) => {
        const codes = t.codes.filter((c) => !q || c.name.toLowerCase().includes(q));
        if (!codes.length) return null;
        return (
          <div key={t.id} className="mb-1">
            <button
              type="button"
              aria-expanded={t.open}
              onClick={() => onToggleTheme(t.id)}
              className="ty-label flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1.5 font-bold uppercase text-ink-3"
            >
              <ChevronRight
                size={12}
                aria-hidden="true"
                style={{ transform: t.open ? "rotate(90deg)" : "none", transition: "transform .15s" }}
              />
              {t.name}
            </button>
            {t.open && (
              <ul>
                {codes.map((c) => {
                  const n = counts[c.id] ?? 0;
                  const k = keyOf(themes, c.id);
                  const on = active === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onPick(c.id)}
                        aria-pressed={on}
                        className="flex w-full items-center gap-2 py-1 pl-2 pr-1.5 text-left"
                        style={{
                          background: on ? "var(--brand-soft)" : "transparent",
                          borderLeft: `3px solid ${on ? "var(--brand)" : "transparent"}`,
                          fontSize: "var(--fs-small)",
                          fontWeight: on ? 700 : 400,
                        }}
                      >
                        <span
                          className="ty-label num grid h-4 w-4 shrink-0 place-items-center rounded"
                          style={{ border: "1px solid var(--color-border-tertiary)", color: "var(--color-text-tertiary)" }}
                        >
                          {k <= 9 ? k : "·"}
                        </span>
                        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: c.color }} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        <span className="h-1 w-10 shrink-0 overflow-hidden rounded-full" style={{ background: "var(--color-background-tertiary)" }} aria-hidden="true">
                          <span className="block h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: c.color }} />
                        </span>
                        <span className="ty-label num w-5 shrink-0 text-right text-ink-3">{n}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
