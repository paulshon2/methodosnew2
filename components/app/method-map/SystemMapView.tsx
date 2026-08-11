"use client";

import { useMemo } from "react";
import type { Approach, Method } from "@/lib/method-map-catalog";
import { APPROACH_PROFILE, LEVEL_LABEL } from "@/lib/method-map-catalog";
import SectionTables from "./SectionTables";
import type { Section } from "@/lib/method-system-normalize";

const COLS: { id: Approach; color: string }[] = [
  { id: "quant", color: "var(--appr-quant)" },
  { id: "qual", color: "var(--appr-qual)" },
  { id: "mixed", color: "var(--appr-mixed)" },
];

/** ② 전체 체계 — 접근 3열 × 방법군 × 방법 칩. 필터에 안 걸린 칩은 흐리게 남긴다. */
export default function SystemMapView({
  methods,
  selected,
  dimmed,
  hits,
  onSelect,
  sections,
}: {
  methods: Method[];
  selected: string | null;
  dimmed: Set<string>;
  hits: Set<string>;
  onSelect: (id: string) => void;
  sections: Section[];
}) {
  const grouped = useMemo(() => {
    const out: Record<Approach, Record<string, Method[]>> = { quant: {}, qual: {}, mixed: {} };
    methods.forEach((m) => {
      (out[m.approach][m.family] ||= []).push(m);
    });
    return out;
  }, [methods]);

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map((c) => {
          const p = APPROACH_PROFILE[c.id];
          const families = Object.entries(grouped[c.id]);
          return (
            <section key={c.id} className="card overflow-hidden p-0" style={{ borderTop: `3px solid ${c.color}` }}>
              <header className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>
                <h3 className="ty-subhead" style={{ color: c.color }}>
                  {p.ko} <span className="ty-label text-ink-3">{p.en}</span>
                </h3>
                <p className="ty-label mt-0.5 text-ink-3">{p.tag}</p>
              </header>
              {families.map(([fam, list]) => (
                <div key={fam} className="px-4 py-3" style={{ borderTop: "1px solid var(--color-border-tertiary)" }}>
                  <div className="ty-label mb-2 uppercase text-ink-3">{fam}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((m) => {
                      const on = selected === m.id;
                      const dim = dimmed.has(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => onSelect(m.id)}
                          title={`${m.en} · ${LEVEL_LABEL[m.level]} · ${m.year}년`}
                          className={on ? "g-fill rounded-full px-2.5 py-1.5" : "rounded-full px-2.5 py-1.5"}
                          style={{
                            minHeight: 32,
                            fontSize: "var(--fs-label)",
                            fontWeight: 700,
                            border: `1px solid ${on ? "transparent" : "var(--color-border-tertiary)"}`,
                            background: on ? undefined : "var(--color-background-tertiary)",
                            color: on ? "var(--on-accent)" : "var(--color-text-primary)",
                            boxShadow: on ? "var(--g-glow)" : hits.has(m.id) ? "0 0 0 2px var(--warn)" : undefined,
                            opacity: dim ? 0.28 : 1,
                            filter: dim ? "grayscale(1)" : undefined,
                          }}
                        >
                          {m.name} <span className="num opacity-60">L{m.level}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>

      <h3 className="ty-section mb-2 mt-6">원본 표로 확인하기</h3>
      <p className="ty-small mb-3 text-ink-2 prose-w">
        위 지도는 아래 표를 읽기 쉽게 접은 것입니다. 논문에 인용할 때는 원본 표의 층위·설계·자료수집·분석 열을 그대로 확인하세요.
      </p>
      <SectionTables sections={sections} />
    </div>
  );
}
