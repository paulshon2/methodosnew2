"use client";

import { useState } from "react";
import { X } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { LEVEL_LABEL, METHOD_BY_ID } from "@/lib/method-map-catalog";

const ROWS: { label: string; get: (id: string) => string }[] = [
  { label: "연구 접근", get: (id) => ({ quant: "양적", qual: "질적", mixed: "혼합" })[METHOD_BY_ID[id].approach] },
  { label: "방법군", get: (id) => METHOD_BY_ID[id].family },
  { label: "난이도", get: (id) => LEVEL_LABEL[METHOD_BY_ID[id].level] },
  { label: "정착 연도", get: (id) => String(METHOD_BY_ID[id].year) },
  { label: "정의", get: (id) => METHOD_BY_ID[id].def },
  { label: "이럴 때 쓴다", get: (id) => METHOD_BY_ID[id].use.join(" / ") },
  { label: "이럴 때는 쓰지 않는다", get: (id) => METHOD_BY_ID[id].no.join(" / ") },
  { label: "필요 데이터", get: (id) => METHOD_BY_ID[id].data.join(" · ") },
  { label: "표본 기준", get: (id) => METHOD_BY_ID[id].sample },
  { label: "주로 쓰는 분석", get: (id) => METHOD_BY_ID[id].analysis },
  { label: "타당도 위험", get: (id) => METHOD_BY_ID[id].risks.join(" · ") },
  { label: "대표 문헌", get: (id) => METHOD_BY_ID[id].lit },
];

/** 비교함 — 최대 3개. 세 개를 넘으면 표가 읽히지 않는다. */
export default function CompareTray({ ids, onRemove, onClear }: { ids: string[]; onRemove: (id: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  if (ids.length === 0) return null;
  const valid = ids.filter((id) => METHOD_BY_ID[id]);

  return (
    <>
      <div className="glass-2 fixed bottom-20 left-1/2 z-40 flex max-w-[92vw] -translate-x-1/2 flex-wrap items-center gap-2 rounded-full px-4 py-2 lg:bottom-6">
        <span className="ty-label text-ink-2">비교함 {valid.length}/3</span>
        {valid.map((id) => (
          <span key={id} className="pill pill-brand">
            {METHOD_BY_ID[id].name}
            <button type="button" onClick={() => onRemove(id)} aria-label={`${METHOD_BY_ID[id].name} 빼기`} className="ml-0.5">
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(true)} disabled={valid.length < 2}>
          비교하기
        </button>
        <button type="button" className="btn btn-sm" onClick={onClear}>
          비우기
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          style={{ background: "rgba(4,6,14,.72)", backdropFilter: "blur(6px)" }}
          role="dialog"
          aria-modal="true"
          aria-label="방법 비교"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="glass-2 anim-panel max-h-[86vh] w-full max-w-[1000px] overflow-auto rounded-[16px] p-5">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="ty-section flex-1">방법 비교</h2>
              <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>
                닫기 <kbd className="ty-label">Esc</kbd>
              </button>
            </div>
            <DataTable
              columns={["비교 항목", ...valid.map((id) => METHOD_BY_ID[id].name)]}
              rows={ROWS.map((r) => [r.label, ...valid.map((id) => r.get(id))])}
            />
          </div>
        </div>
      )}
    </>
  );
}
