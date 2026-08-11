"use client";

import Pane from "@/components/ui/Pane";
import {
  APPROACH_OPTIONS,
  DATA_OPTIONS,
  LEVEL_OPTIONS,
  PURPOSE_OPTIONS,
  filterCount,
  toggle,
  type Filters,
} from "@/lib/method-filter";

function Group<T extends string | number>({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string;
  hint?: string;
  options: { id: T; label: string }[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <fieldset className="mb-4 border-0 p-0">
      <legend className="ty-label mb-1.5 uppercase text-ink-2">{label}</legend>
      {hint ? <p className="ty-label mb-1.5 text-ink-3">{hint}</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={String(o.id)}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o.id)}
              className="rounded-full px-3 py-1.5 text-left"
              style={{
                minHeight: 34,
                fontSize: "var(--fs-label)",
                fontWeight: 700,
                border: `1px solid ${on ? "var(--brand)" : "var(--color-border-tertiary)"}`,
                background: on ? "var(--brand-soft)" : "transparent",
                color: on ? "var(--brand-ink)" : "var(--color-text-secondary)",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** 좌 레일 — 재료. 라벨에 괄호 풀이를 붙여 용어를 몰라도 고를 수 있게 한다. */
export default function MethodFilterRail({
  filters,
  onChange,
  shown,
  total,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  shown: number;
  total: number;
}) {
  const n = filterCount(filters);
  return (
    <Pane
      title="조건으로 좁히기"
      actions={
        n > 0 ? (
          <button type="button" className="btn btn-sm" onClick={() => onChange({ approach: [], purpose: [], data: [], level: [] })}>
            초기화 {n}
          </button>
        ) : null
      }
      foot={
        <p className="ty-small m-0 text-ink-2" aria-live="polite">
          조건에 맞는 방법 <strong className="num">{shown}</strong>개 / 전체 <span className="num">{total}</span>개
        </p>
      }
    >
      <Group
        label="연구 접근"
        options={APPROACH_OPTIONS}
        selected={filters.approach}
        onToggle={(v) => onChange({ ...filters, approach: toggle(filters.approach, v) })}
      />
      <Group
        label="연구 목적"
        options={PURPOSE_OPTIONS}
        selected={filters.purpose}
        onToggle={(v) => onChange({ ...filters, purpose: toggle(filters.purpose, v) })}
      />
      <Group
        label="가진 데이터"
        hint="고르기 어렵다면 여기 하나만 체크해 보세요."
        options={DATA_OPTIONS}
        selected={filters.data}
        onToggle={(v) => onChange({ ...filters, data: toggle(filters.data, v) })}
      />
      <Group
        label="난이도"
        options={LEVEL_OPTIONS}
        selected={filters.level}
        onToggle={(v) => onChange({ ...filters, level: toggle(filters.level, v) })}
      />
      <p className="ty-label text-ink-3">조건에 걸리지 않은 방법도 화면에서 지우지 않고 흐리게 남깁니다. 무엇이 빠졌는지 보이지 않으면 왜 없어졌는지 알 수 없기 때문입니다.</p>
    </Pane>
  );
}
