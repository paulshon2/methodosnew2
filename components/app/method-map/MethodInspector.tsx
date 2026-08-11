"use client";

import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import Inspector from "@/components/ui/Inspector";
import EmptyState from "@/components/ui/EmptyState";
import { LEVEL_LABEL, METHOD_BY_ID, type Method } from "@/lib/method-map-catalog";

const APPR_TONE = { quant: "quant", qual: "qual", mixed: "mixed" } as const;
const APPR_LABEL = { quant: "양적", qual: "질적", mixed: "혼합" } as const;

function List({ label, items, mark, color }: { label: string; items: string[]; mark: string; color: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-4">
      <h4 className="ty-label mb-1.5 uppercase text-ink-3">{label}</h4>
      <ul className="flex flex-col gap-1">
        {items.map((t) => (
          <li key={t} className="ty-small flex gap-2 text-ink-2">
            <span aria-hidden="true" style={{ color, fontWeight: 800 }}>{mark}</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 우 인스펙터 — 선택한 방법의 속성. */
export default function MethodInspector({
  method,
  inCompare,
  onToggleCompare,
  onSelect,
  onGoProcess,
}: {
  method: Method | null;
  inCompare: boolean;
  onToggleCompare: () => void;
  onSelect: (id: string) => void;
  onGoProcess: () => void;
}) {
  if (!method) {
    return (
      <Inspector
        title="방법 상세"
        tabs={[]}
        empty={<EmptyState title="선택한 방법이 없습니다">지도·계보에서 방법을 누르면 정의·적용 조건·타당도 위험이 여기에 나옵니다.</EmptyState>}
      />
    );
  }

  const overview = (
    <div>
      <h3 className="ty-subhead">{method.name}</h3>
      <p className="ty-label mb-2 text-ink-3">{method.en}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge tone={APPR_TONE[method.approach]}>{APPR_LABEL[method.approach]}</Badge>
        <Badge tone="neutral" mark="·">{method.family}</Badge>
        <Badge tone="neutral" mark="L">{LEVEL_LABEL[method.level]}</Badge>
        <Badge tone="neutral" mark="·">{method.year}년 정착</Badge>
      </div>

      <p className="ty-small mb-4 text-ink-2">{method.def}</p>

      <List label="이럴 때 쓴다" items={method.use} mark="✓" color="var(--ok)" />
      <List label="이럴 때는 쓰지 않는다" items={method.no} mark="✕" color="var(--danger)" />

      <section className="mb-4">
        <h4 className="ty-label mb-1 uppercase text-ink-3">필요 데이터</h4>
        <div className="flex flex-wrap gap-1.5">
          {method.data.map((d) => (
            <Badge key={d} tone="neutral" mark="·">{d}</Badge>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h4 className="ty-label mb-1 uppercase text-ink-3">표본 기준</h4>
        <p className="ty-small text-ink-2">{method.sample}</p>
      </section>

      <section className="mb-4">
        <h4 className="ty-label mb-1 uppercase text-ink-3">주로 쓰는 분석</h4>
        <p className="ty-small text-ink-2">{method.analysis}</p>
      </section>

      <section className="mb-4">
        <h4 className="ty-label mb-1 uppercase text-ink-3">연구 목적</h4>
        <div className="flex flex-wrap gap-1.5">
          {method.purpose.map((p) => (
            <Badge key={p} tone="brand" mark="·">{p}</Badge>
          ))}
        </div>
      </section>

      <Note level="risk" title="타당도 위험" fix="설계 단계에서 각 항목의 대응책을 미리 문서로 정하세요. 자료 수집이 끝난 뒤에는 대부분 되돌릴 수 없습니다.">
        {method.risks.join(" · ")}
      </Note>

      <section className="my-4">
        <h4 className="ty-label mb-1.5 uppercase text-ink-3">함께 보면 좋은 방법</h4>
        <div className="flex flex-wrap gap-1.5">
          {method.related.map((r) => {
            const rel = METHOD_BY_ID[r];
            if (!rel) return null;
            return (
              <button key={r} type="button" className="btn btn-sm" onClick={() => onSelect(r)}>
                {rel.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-4">
        <h4 className="ty-label mb-1 uppercase text-ink-3">대표 문헌</h4>
        <p className="ty-small text-ink-2">{method.lit}</p>
      </section>
    </div>
  );

  const process = (
    <ol className="flex flex-col gap-3">
      {method.process.map((s, i) => (
        <li key={s.title}>
          <div className="ty-small font-bold">
            <span className="num text-ink-3">{i + 1}.</span> {s.title}
          </div>
          {s.desc ? <p className="ty-small mt-0.5 text-ink-2">{s.desc}</p> : null}
          {s.checks.length > 0 && (
            <ul className="mt-1">
              {s.checks.map((c) => (
                <li key={c} className="ty-label flex gap-1.5 text-ink-3">
                  <span aria-hidden="true">·</span>
                  {c}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );

  return (
    <Inspector
      title="방법 상세"
      tabs={[
        { id: "overview", label: "개요", content: overview },
        { id: "process", label: "수행 절차", content: process },
      ]}
      foot={
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm btn-primary" onClick={onGoProcess}>
            수행 절차 보기 →
          </button>
          <button type="button" className="btn btn-sm" aria-pressed={inCompare} onClick={onToggleCompare}>
            {inCompare ? "비교함에서 빼기" : "비교함에 담기"} <kbd className="ty-label">C</kbd>
          </button>
        </div>
      }
    />
  );
}
