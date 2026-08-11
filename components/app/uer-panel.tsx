"use client";
// MethodOS UER 패널 — 방법(개요/전체프로세스)·단계(프로젝트 페이지)에서 사용.
// 본 패널은 등록된 Universal Engine, 페이지 locator, 승격 상태를 시각화한다.
import {
  UniversalEngine,
  uerForMethod,
  uerForStage,
  bindingForMethod,
  PROMOTION_LABEL,
  PROMOTION_COLOR,
  hasUERSupport,
} from "@/lib/uer";

function EngineCard({ engine, methodId, compact }: { engine: UniversalEngine; methodId: string; compact?: boolean }) {
  const b = bindingForMethod(engine, methodId);
  return (
    <div className="rounded-md p-3 mb-2" style={{ border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)" }}>
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>{engine.engine_uid}</span>
        <span className="text-[14px] font-semibold">{engine.korean_name}</span>
        <span className="text-[11.5px] text-ink-3">{engine.canonical_name}</span>
        <span className="ml-auto text-[10.5px] px-2 py-0.5 rounded-full text-white"
          style={{ background: PROMOTION_COLOR[engine.promotion_status] }}>{PROMOTION_LABEL[engine.promotion_status]}</span>
      </div>
      <div className="text-[12.5px] text-ink-2 mb-1.5"><strong>기능</strong> · {engine.function_statement}</div>
      <div className="grid sm:grid-cols-3 gap-1 text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
        <div><strong>목적</strong> · {engine.purpose}</div>
        <div><strong>메커니즘</strong> · {engine.mechanism}</div>
        <div><strong>티어/계열</strong> · {engine.universality_tier} · {engine.engine_family}</div>
      </div>
      {!compact && b && (
        <div className="mt-2 rounded p-2 text-[12px]" style={{ background: "var(--color-background-secondary)" }}>
          <div className="mb-1"><strong>이 방법에서의 절차명</strong> · {b.original_procedure_term}</div>
          <div className="mb-1"><strong>요약</strong> · {b.source_locator.procedure_summary}</div>
          <div><strong>매핑 근거</strong> · {b.mapping_rationale}</div>
          {b.fidelity_note && <div className="mt-1 text-ink-3"><strong>학파/시점 차이</strong> · {b.fidelity_note}</div>}
        </div>
      )}
      {engine.incompatibility_note && (
        <div className="mt-1.5 text-[11.5px] rounded p-1.5" style={{ background: "var(--warn-wash)", color: "var(--warn)" }}>
          ⚠️ {engine.incompatibility_note}
        </div>
      )}
    </div>
  );
}

export function UEROverviewPanel({ methodId }: { methodId: string }) {
  if (!hasUERSupport(methodId)) return null;
  const engines = uerForMethod(methodId);
  if (!engines.length) return null;
  return (
    <div className="card mt-4" style={{ borderLeft: "3px solid var(--brand)" }}>
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        <h3 className="text-[16px] font-semibold">🧩 MethodOS Universal Engine Registry (UER) 적용</h3>
        <span className="text-[11.5px] text-ink-3">v0.2 · 페이지 locator 실측</span>
      </div>
      <p className="text-[13px] text-ink-2 mb-2">
        이 방법은 아래 <strong>{engines.length}개의 보편 엔진</strong>으로 분해됩니다. 각 엔진은 절차명이 아니라 <strong>기능</strong>으로 정의됩니다.
      </p>
      <div className="grid lg:grid-cols-2 gap-2">
        {engines.map((e) => <EngineCard key={e.engine_uid} engine={e} methodId={methodId} />)}
      </div>
    </div>
  );
}

export function UERFullProcessPanel({ methodId, stages }: { methodId: string; stages: { id: string; name: string; order: number }[] }) {
  if (!hasUERSupport(methodId)) return null;
  const rows = stages
    .map((s) => ({ stage: s, realizations: uerForStage(s.id) }))
    .filter((r) => r.realizations.length > 0);
  if (!rows.length) return null;
  return (
    <div className="card mt-4">
      <h3 className="text-[16px] font-semibold mb-2">🧩 단계별 UER 엔진 매핑 (전체 프로세스)</h3>
      <p className="text-[13px] text-ink-2 mb-3">각 단계가 어떤 보편 엔진(들)을 실행하는지 한눈에 확인. 기본(primary)과 보조(support) 역할로 표시됩니다.</p>
      <table className="tbl text-[13px]">
        <thead><tr><th style={{ width: 32 }}>#</th><th>단계</th><th>실현 엔진(역할)</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.stage.id}>
              <td>{r.stage.order}</td>
              <td><strong>{r.stage.name}</strong></td>
              <td>
                {r.realizations.map((x) => (
                  <div key={x.engine.engine_uid} className="mb-1 last:mb-0">
                    <span className="text-[10.5px] px-1.5 py-0.5 rounded mr-1.5" style={{ background: x.role === "primary" ? "var(--brand-soft)" : "var(--color-background-secondary)", color: x.role === "primary" ? "var(--brand-ink)" : "var(--color-text-secondary)" }}>
                      {x.role === "primary" ? "기본" : "보조"}
                    </span>
                    <span className="font-mono text-[11.5px] mr-1">{x.engine.engine_uid}</span>
                    {x.engine.korean_name}
                    {x.note && <span className="text-[12px] text-ink-3"> · {x.note}</span>}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UERStagePanel({ methodId, stageId }: { methodId: string; stageId: string }) {
  if (!hasUERSupport(methodId)) return null;
  const realizations = uerForStage(stageId);
  if (!realizations.length) return null;
  return (
    <div className="card mt-3" style={{ borderTop: "2px solid var(--brand)" }}>
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <h3 className="text-[15px] font-semibold">🧩 이 단계의 UER 엔진</h3>
        <span className="text-[11px] text-ink-3">기능 중심·페이지 locator</span>
      </div>
      <p className="text-[13px] text-ink-2 mb-2">이 단계가 실행하는 보편 엔진을 보여드립니다. 절차명이 달라도 같은 기능은 같은 엔진으로 모입니다.</p>
      {realizations.map((x) => (
        <div key={x.engine.engine_uid} className="mb-2 last:mb-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10.5px] px-1.5 py-0.5 rounded text-white" style={{ background: x.role === "primary" ? "var(--brand)" : "var(--color-text-tertiary)" }}>{x.role === "primary" ? "기본" : "보조"}</span>
            {x.note && <span className="text-[12.5px] text-ink-2">{x.note}</span>}
          </div>
          <EngineCard engine={x.engine} methodId={methodId} />
        </div>
      ))}
    </div>
  );
}
