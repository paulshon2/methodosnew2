"use client";

import { APPROACH_PROFILE, type Approach } from "@/lib/method-map-catalog";
import DataTable from "@/components/ui/DataTable";
import SectionTables from "./SectionTables";
import type { Section } from "@/lib/method-system-normalize";

const ORDER: Approach[] = ["quant", "qual", "mixed"];
const COLOR: Record<Approach, string> = { quant: "var(--appr-quant)", qual: "var(--appr-qual)", mixed: "var(--appr-mixed)" };

const ROWS: { key: keyof (typeof APPROACH_PROFILE)["quant"]; label: string }[] = [
  { key: "belief", label: "세계관" },
  { key: "q", label: "대표 질문" },
  { key: "evidence", label: "증거로 인정하는 것" },
  { key: "role", label: "연구자의 자리" },
  { key: "sample", label: "표집 논리" },
  { key: "out", label: "결과 확장 방식" },
  { key: "risk", label: "가장 큰 약점" },
];

/** ③ 접근별 상세 — 세 접근을 나란히 놓고 같은 항목으로 비교한다. */
export default function ApproachView({ sections }: { sections: Section[] }) {
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        {ORDER.map((a) => {
          const p = APPROACH_PROFILE[a];
          return (
            <section key={a} className="card" style={{ borderTop: `3px solid ${COLOR[a]}` }}>
              <h3 className="ty-subhead" style={{ color: COLOR[a] }}>
                {p.ko} <span className="ty-label text-ink-3">{p.en}</span>
              </h3>
              <p className="ty-small mt-1 text-ink-2">{p.tag}</p>
              <dl className="mt-3">
                {ROWS.map((r) => (
                  <div key={r.key} className="py-2" style={{ borderTop: "1px solid var(--color-border-tertiary)" }}>
                    <dt className="ty-label uppercase text-ink-3">{r.label}</dt>
                    <dd className="ty-small mt-0.5">{p[r.key]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>

      <h3 className="ty-section mb-2 mt-6">한눈 비교표</h3>
      <div className="card">
        <DataTable
          columns={["비교 항목", APPROACH_PROFILE.quant.ko, APPROACH_PROFILE.qual.ko, APPROACH_PROFILE.mixed.ko]}
          rows={ROWS.map((r) => [r.label, APPROACH_PROFILE.quant[r.key], APPROACH_PROFILE.qual[r.key], APPROACH_PROFILE.mixed[r.key]])}
        />
      </div>

      <h3 className="ty-section mb-2 mt-6">접근별 원본 상세</h3>
      <SectionTables sections={sections} />
    </div>
  );
}
