"use client";
import type { Stage } from "@/lib/types";
import Figure from "./figure";
import { Gloss } from "./gloss";

// 단계 실제 예시(글·표·그림) — 방법 상세/프로젝트 단계에서 공용.
export default function ExampleBlock({ stage, compact }: { stage: Stage; compact?: boolean }) {
  const ex = stage.example;
  if (!ex) return null;
  const t = ex.table || ({} as any);
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--color-background-secondary)" }}>
      <div className="text-[12px] font-semibold mb-2" style={{ color: "var(--brand-ink)" }}>📋 이 단계 실제 예시 (글 · 표 · 그림)</div>
      <Gloss className="text-[14px] leading-relaxed mb-3 block" text={ex.text} />
      <div className={`grid gap-3.5 items-start ${compact ? "" : "lg:grid-cols-[1.1fr_1fr]"}`}>
        <div>
          <div className="text-[12px] font-semibold mb-1.5" style={{ color: "var(--brand-ink)" }}>표 — {t.title}</div>
          <table className="tbl rounded-md overflow-hidden text-[13px]" style={{ background: "var(--color-background-primary)" }}>
            <thead><tr>{(t.columns || []).map((c: string, i: number) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>{(t.rows || []).map((r: string[], i: number) => <tr key={i}>{r.map((cc, j) => <td key={j}>{cc}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <div>
          <div className="text-[12px] font-semibold mb-1.5" style={{ color: "var(--brand-ink)" }}>그림 — 단계 흐름/결과 도식</div>
          <div className="rounded-md p-2" style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)" }}>
            <Figure fig={ex.figure} />
          </div>
        </div>
      </div>
    </div>
  );
}
