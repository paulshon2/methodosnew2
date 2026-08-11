"use client";

import { X } from "lucide-react";
import type { Dataset } from "@/lib/stats-goal";
import type { VizSpec } from "@/lib/viz-spec";
import { AGG_LABEL } from "@/lib/viz-spec";

const SLOTS: { key: keyof VizSpec["enc"]; label: string; hint: string }[] = [
  { key: "x", label: "가로축 (X)", hint: "비교할 이름이나 시간, 또는 분포를 볼 숫자" },
  { key: "y", label: "세로축 (Y)", hint: "크기를 나타낼 숫자" },
  { key: "color", label: "색상", hint: "계열을 나눌 범주 — 여섯 개를 넘기지 마세요" },
  { key: "facet", label: "분할", hint: "같은 축으로 나란히 그릴 범주" },
];

/** 어떤 변수를 어느 자리에 놓을지 — 드롭다운과 드래그를 모두 받는다. */
export default function EncodingShelf({
  ds,
  spec,
  onChange,
}: {
  ds: Dataset;
  spec: VizSpec;
  onChange: (next: VizSpec) => void;
}) {
  const set = (key: keyof VizSpec["enc"], name: string) =>
    onChange({ ...spec, enc: { ...spec.enc, [key]: name || undefined } });

  return (
    <div className="space-y-3">
      {SLOTS.map((s) => {
        const id = `enc-${s.key}`;
        const cur = spec.enc[s.key] || "";
        return (
          <div
            key={s.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const name = e.dataTransfer.getData("text/plain");
              if (name) set(s.key, name);
            }}
          >
            <label htmlFor={id} className="ty-label mb-1 block font-bold">
              {s.label}
            </label>
            <div className="flex gap-1.5">
              <select id={id} className="inp" value={cur} onChange={(e) => set(s.key, e.target.value)}>
                <option value="">비어 있음</option>
                {ds.variables.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} · {v.type === "num" ? "숫자" : "범주"}
                  </option>
                ))}
              </select>
              {cur ? (
                <button type="button" className="btn btn-sm" onClick={() => set(s.key, "")} aria-label={`${s.label} 비우기`}>
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <p className="ty-label mt-1 text-ink-3">{s.hint}</p>
          </div>
        );
      })}

      <div>
        <label htmlFor="enc-agg" className="ty-label mb-1 block font-bold">
          같은 범주의 값을 묶는 방법
        </label>
        <select
          id="enc-agg"
          className="inp"
          value={spec.agg}
          onChange={(e) => onChange({ ...spec, agg: e.target.value as VizSpec["agg"] })}
        >
          {(Object.keys(AGG_LABEL) as VizSpec["agg"][]).map((a) => (
            <option key={a} value={a}>
              {AGG_LABEL[a]}
            </option>
          ))}
        </select>
        <p className="ty-label mt-1 text-ink-3">
          평균은 극단값에 흔들리고 중위수는 덜 흔들립니다. 사례 수를 세려면 &lsquo;사례 수&rsquo;를 고르세요.
        </p>
      </div>
    </div>
  );
}
