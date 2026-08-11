"use client";
/** Stage 5 Domain Sample Pack + Process interstitial deliverables */
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MethodSamplePack, SampleProcessBinding, SamplePackSection } from "@/lib/method-catalog";

function MiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-auto max-h-[360px] border border-[var(--color-border-tertiary)] rounded-md">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr style={{ background: "var(--color-background-secondary)" }}>
            {headers.map((h, i) => (
              <th key={i} className="text-left font-semibold px-2 py-1 whitespace-nowrap border-b border-[var(--color-border-tertiary)] sticky top-0" style={{ background: "var(--color-background-secondary)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {headers.map((_, ci) => (
                <td key={ci} className="px-2 py-1 align-top whitespace-pre-wrap border-b border-[var(--color-border-tertiary)]">
                  {r[ci] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Accordion({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-md border border-[var(--color-border-tertiary)] mb-2">
      <button type="button" className="w-full flex items-center gap-2 text-left px-3 py-2 text-[13px] font-semibold" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <span className="flex-1">{title}</span>
      </button>
      {open ? <div className="px-3 pb-3 space-y-2">{children}</div> : null}
    </div>
  );
}

function SectionBody({ section }: { section: SamplePackSection }) {
  return (
    <>
      {(section.prose || []).map((p, i) => (
        <p key={i} className="text-[12.5px] text-ink-2 leading-relaxed">
          {p}
        </p>
      ))}
      {(section.tables || []).map((t, i) => (
        <div key={i}>
          {t.caption ? <div className="text-[11.5px] text-ink-3 mb-1">{t.caption}</div> : null}
          <MiniTable headers={t.headers} rows={t.rows} />
        </div>
      ))}
    </>
  );
}

export function SamplePackOverview({ pack }: { pack: MethodSamplePack | null }) {
  if (!pack) return null;
  return (
    <div className="mb-4">
      <Accordion
        title={`Domain Sample Pack${pack.practiceRows ? ` · 연습 ${pack.practiceRows}행` : ""} — ${pack.title.replace(/^3-4\.\s*/, "").slice(0, 40)}`}
        defaultOpen={false}
      >
        {pack.guide ? <p className="text-[12.5px] text-ink-2 mb-2 whitespace-pre-wrap">{pack.guide}</p> : null}
        {pack.sections.map((s) => (
          <Accordion key={s.id} title={s.title} defaultOpen={false}>
            <SectionBody section={s} />
          </Accordion>
        ))}
      </Accordion>
    </div>
  );
}

export function ProcessSampleBinding({
  binding,
  processName,
}: {
  binding?: SampleProcessBinding | null;
  processName: string;
}) {
  if (!binding) {
    return (
      <div className="rounded-md px-3 py-2 text-[12px] text-ink-3 mb-3" style={{ background: "var(--color-background-secondary)" }}>
        이 Process용 Sample Pack 행이 없습니다.
      </div>
    );
  }
  return (
    <div className="mb-3">
      <Accordion title={`이 Process용 Sample 예시·포맷·규모 — ${processName}`} defaultOpen={false}>
        {binding.exampleNote ? (
          <p className="text-[12.5px]">
            <span className="text-ink-3">적용 예시 · </span>
            {binding.exampleNote}
          </p>
        ) : null}
        {binding.scaleNote ? (
          <p className="text-[12.5px]">
            <span className="text-ink-3">샘플 규모 · </span>
            {binding.scaleNote}
          </p>
        ) : null}
        {binding.formatNote ? (
          <p className="text-[12.5px]">
            <span className="text-ink-3">포맷 · </span>
            {binding.formatNote}
          </p>
        ) : null}
      </Accordion>
    </div>
  );
}

export function InterstitialDeliverable({
  binding,
}: {
  binding?: SampleProcessBinding | null;
}) {
  const items = binding?.interstitialDeliverables || [];
  if (!items.length) return null;
  return (
    <div className="my-3">
      {items.map((d, i) => (
        <Accordion key={i} title={`산출물 예시 삽입 — ${d.label}`} defaultOpen={false}>
          {(d.prose || []).map((p, pi) => (
            <p key={pi} className="text-[12.5px] text-ink-2">
              {p}
            </p>
          ))}
          {d.table ? <MiniTable headers={d.table.headers} rows={d.table.rows} /> : null}
        </Accordion>
      ))}
    </div>
  );
}
