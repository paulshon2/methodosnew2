"use client";
/** 결과 카드 — 요약 → 표 → 권고 → 원본(접힘). 계산 로직은 변경하지 않음 */
import { useMemo, useState } from "react";

function flattenRows(outputs: unknown): { key: string; value: string }[] {
  if (!outputs || typeof outputs !== "object") return [];
  const rows: { key: string; value: string }[] = [];
  const walk = (obj: Record<string, unknown>, prefix = "") => {
    Object.entries(obj).forEach(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v == null) rows.push({ key, value: "—" });
      else if (typeof v === "object" && !Array.isArray(v)) walk(v as Record<string, unknown>, key);
      else if (Array.isArray(v)) rows.push({ key, value: v.length <= 6 ? v.map(String).join(", ") : `${v.length}개 항목` });
      else rows.push({ key, value: String(v) });
    });
  };
  walk(outputs as Record<string, unknown>);
  return rows.slice(0, 40);
}

function summarize(outputs: unknown, stageName?: string): string {
  if (!outputs || typeof outputs !== "object") return `${stageName || "이 단계"} 실행이 끝났습니다.`;
  const o = outputs as Record<string, unknown>;
  if (typeof o.summary === "string" && o.summary.trim()) return o.summary;
  if (typeof o.guidance === "string" && o.guidance.trim()) return o.guidance;
  const keys = Object.keys(o);
  if (!keys.length) return `${stageName || "이 단계"} 산출물이 비어 있습니다. 입력을 확인한 뒤 다시 실행해 보세요.`;
  return `${stageName || "이 단계"}에서 ${keys.length}개 항목이 저장됐습니다. 아래 표에서 핵심 값을 확인하세요.`;
}

function advice(outputs: unknown): string[] {
  const tips: string[] = [];
  if (!outputs || typeof outputs !== "object") {
    tips.push("입력을 채운 뒤 같은 방식으로 다시 실행해 보세요.");
    return tips;
  }
  const o = outputs as Record<string, unknown>;
  if (o._simulated) tips.push("지금은 규칙기반 시뮬레이션입니다. 설정에서 AI 키를 넣으면 AI 보조 결과를 받을 수 있습니다.");
  if (o.validation && typeof o.validation === "object") tips.push("검증 항목을 확인하고 미통과 항목을 먼저 고치세요.");
  tips.push("다음 단계로 넘어가기 전에 표의 값이 연구 질문과 맞는지 한 번 더 읽으세요.");
  tips.push("원본 계산값은 인용·재현을 위해 접어 두었습니다.");
  return tips;
}

export default function ResultSummary({
  outputs,
  stageName,
}: {
  outputs: unknown;
  stageName?: string;
}) {
  const [openRaw, setOpenRaw] = useState(false);
  const summary = useMemo(() => summarize(outputs, stageName), [outputs, stageName]);
  const rows = useMemo(() => flattenRows(outputs), [outputs]);
  const tips = useMemo(() => advice(outputs), [outputs]);

  return (
    <div className="card mt-3" style={{ borderColor: "var(--ok)" }}>
      <div className="ty-label mb-1" style={{ color: "var(--ok)" }}>결과</div>
      <p className="ty-body mb-3">{summary}</p>
      {rows.length ? (
        <div className="overflow-x-auto mb-3">
          <table className="tbl">
            <thead>
              <tr>
                <th>항목</th>
                <th>값</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="font-semibold">{r.key}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="rounded-[10px] p-3 mb-3" style={{ background: "var(--wash)" }}>
        <div className="ty-label mb-1">권고</div>
        <ul className="ty-small text-ink-2 space-y-1 list-disc pl-4 m-0">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
      <details open={openRaw} onToggle={(e) => setOpenRaw((e.target as HTMLDetailsElement).open)}>
        <summary className="ty-small font-semibold cursor-pointer" style={{ minHeight: 44, display: "flex", alignItems: "center" }}>
          원본 계산값 보기
        </summary>
        <pre className="ty-small mt-2 p-3 rounded-[10px] overflow-auto" style={{ background: "var(--wash)", maxHeight: 280 }}>
          {JSON.stringify(outputs, null, 2)}
        </pre>
      </details>
    </div>
  );
}
