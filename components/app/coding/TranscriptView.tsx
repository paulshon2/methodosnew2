"use client";

import { memo } from "react";
import type { Assign, Code, Doc, Seg } from "@/lib/coding-types";
import { modeFromEvent, type PickMode } from "@/hooks/useSelection";

export type SegFilter = "all" | "uncoded" | "coded";

/**
 * 문장 하나.
 * 코딩된 문장은 배경(코드색 15%)과 하단 2px 선으로 표시하고, 코드가 여럿이면 끝에 색 사각형을 나열한다.
 * 색만으로 상태를 말하지 않도록 aria-label에 코드 이름을 함께 싣는다.
 */
const SegmentSpan = memo(function SegmentSpan({
  seg,
  codes,
  selected,
  faded,
  onPick,
}: {
  seg: Seg;
  codes: Code[];
  selected: boolean;
  faded: boolean;
  onPick: (id: string, mode: PickMode, el: HTMLElement) => void;
}) {
  const first = codes[0];
  return (
    <span
      id={`seg-${seg.id}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={codes.length ? `코딩됨: ${codes.map((c) => c.name).join(", ")}` : "미코딩"}
      onClick={(e) => onPick(seg.id, modeFromEvent(e), e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick(seg.id, "single", e.currentTarget);
        }
      }}
      className="cursor-pointer rounded"
      style={{
        background: selected ? "var(--brand-soft)" : first ? `${first.color}26` : "transparent",
        borderBottom: `2px solid ${first ? first.color : "transparent"}`,
        outline: selected ? "2px solid var(--brand)" : "none",
        outlineOffset: 1,
        opacity: faded ? 0.22 : 1,
        padding: "1px 2px",
        margin: "0 -2px",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        scrollMarginTop: 96,
      }}
    >
      {seg.text}
      {codes.length > 0 && (
        <span className="ml-1.5 inline-flex gap-[3px] align-middle" aria-hidden="true">
          {codes.map((c) => (
            <span key={c.id} title={c.name} className="inline-block h-2 w-2 rounded-sm" style={{ background: c.color }} />
          ))}
        </span>
      )}
    </span>
  );
});

const TurnBlock = memo(function TurnBlock({
  segs,
  codesOf,
  sel,
  filter,
  who,
  onPick,
}: {
  segs: Seg[];
  codesOf: (segId: string) => Code[];
  sel: string[];
  filter: SegFilter;
  who: "R" | "P";
  onPick: (id: string, mode: PickMode, el: HTMLElement) => void;
}) {
  return (
    <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "72px 1fr" }}>
      <div
        className="ty-label sticky top-2 h-fit pt-1 text-right font-bold"
        style={{ color: who === "R" ? "var(--brand-ink)" : "var(--color-text-tertiary)" }}
      >
        {who === "R" ? "연구자" : "참여자"}
      </div>
      <p className="ty-body" style={{ lineHeight: 2 }}>
        {segs.map((s, i) => {
          const codes = codesOf(s.id);
          const faded = (filter === "coded" && codes.length === 0) || (filter === "uncoded" && codes.length > 0);
          return (
            <span key={s.id}>
              {i > 0 ? " " : ""}
              <SegmentSpan seg={s} codes={codes} selected={sel.includes(s.id)} faded={faded} onPick={onPick} />
            </span>
          );
        })}
      </p>
    </div>
  );
});

/** 중앙 · 전사본. 발화 단위로 묶고, 그 안을 문장으로 쪼개 보여 준다. */
export default function TranscriptView({
  doc,
  assign,
  codeMap,
  sel,
  filter,
  onPick,
}: {
  doc: Doc;
  assign: Assign;
  codeMap: Record<string, Code>;
  sel: string[];
  filter: SegFilter;
  onPick: (id: string, mode: PickMode, el: HTMLElement) => void;
}) {
  const codesOf = (segId: string) => (assign[segId] ?? []).map((c) => codeMap[c]).filter(Boolean);
  const segById = new Map(doc.segs.map((s) => [s.id, s]));

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 820 }}>
      {doc.turns.map((t, i) => (
        <TurnBlock
          key={`${doc.id}-t${i}`}
          who={t.who}
          segs={t.segIds.map((id) => segById.get(id)).filter(Boolean) as Seg[]}
          codesOf={codesOf}
          sel={sel}
          filter={filter}
          onPick={onPick}
        />
      ))}
    </div>
  );
}
