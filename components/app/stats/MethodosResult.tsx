"use client";
/** Methodos 결과 — 표·효과크기·신뢰구간·주석. 숫자는 보이는 자릿수만 줄이고 내려받는 파일에는 전체 정밀도를 둔다. */
import { useMemo } from "react";
import type { MResult, Tbl } from "@/lib/methodos/types";
import { downloadBlob, exportTableXlsx } from "@/lib/viz-export";

const cardStyle = { borderColor: "var(--color-border-tertiary)" };

export function fmtNum(v: number, col = ""): string {
  if (!Number.isFinite(v)) return Number.isNaN(v) ? "—" : v > 0 ? "∞" : "−∞";
  if (/^p(\(|$|값|\s)|유의확률|^p\b|Δp|p\(/.test(col) && v >= 0 && v <= 1) return v < 0.0001 ? "<.0001" : v.toFixed(4);
  if (Number.isInteger(v) && Math.abs(v) < 1e9) return String(v);
  const a = Math.abs(v);
  if (a >= 1e6 || (a > 0 && a < 1e-4)) return v.toExponential(3);
  if (a >= 100) return v.toFixed(3);
  return v.toFixed(4);
}

function cellText(v: unknown, col: string): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") return fmtNum(v, col);
  return String(v);
}

function TableView({ t }: { t: Tbl }) {
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 text-[13.5px] font-semibold">{t.title}</h3>
      <div className="overflow-x-auto rounded-xl border" style={cardStyle}>
        <table className="w-full min-w-max border-collapse text-[12.5px]">
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {t.columns.map((c, j) => (
                <th key={j} className={`px-2.5 py-1.5 font-semibold ${j === 0 ? "text-left" : "text-right"}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i} className="border-t" style={cardStyle}>
                {r.map((v, j) => (
                  <td key={j} className={`px-2.5 py-1.5 tabular-nums ${j === 0 || typeof v === "string" ? "text-left" : "text-right"}`}>
                    {cellText(v, t.columns[j] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MethodosResult({ res, ms, fileBase }: { res: MResult; ms?: number; fileBase: string }) {
  const aoa = useMemo(() => {
    const sheets: { name: string; aoa: (string | number | null)[][] }[] = res.tables.map((t) => ({ name: t.id, aoa: [t.columns, ...t.rows] }));
    if (res.effects.length) sheets.push({ name: "효과크기", aoa: [["이름", "값", "CI 하", "CI 상"], ...res.effects.map((e) => [e.name, e.value, e.ciLow ?? "", e.ciHigh ?? ""])] });
    if (res.cis.length) sheets.push({ name: "신뢰구간", aoa: [["모수", "추정", "하한", "상한"], ...res.cis.map((c) => [c.parameter, c.estimate, c.low, c.high])] });
    return sheets;
  }, [res]);

  const tsv = () => {
    const out: string[] = [];
    for (const t of res.tables) { out.push(t.title, t.columns.join("\t"), ...t.rows.map((r) => r.map((v) => (v ?? "")).join("\t")), ""); }
    return out.join("\n");
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-[16px] font-semibold" data-method={res.code}>결과 — {res.name}</h2>
        {ms !== undefined ? <span className="ty-label text-ink-3">브라우저 안에서 {ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}초`} · 서버로 전송하지 않음</span> : null}
        <span className="flex-1" />
        <button type="button" className="btn btn-sm" onClick={() => { void navigator.clipboard?.writeText(tsv()); }}>표 복사</button>
        <button type="button" className="btn btn-sm" onClick={() => exportTableXlsx(`${fileBase}_${res.code}.xlsx`, aoa)}>엑셀로 저장</button>
        <button type="button" className="btn btn-sm" onClick={() => downloadBlob(`${fileBase}_${res.code}.json`, JSON.stringify(res, null, 1), "application/json")}>JSON</button>
      </div>

      {res.tables.map((t) => <TableView key={t.id} t={t} />)}

      {res.effects.length > 0 && (
        <TableView t={{ id: "effects", title: "효과크기·부가 통계", columns: ["이름", "값", "95% CI 하", "95% CI 상"], rows: res.effects.map((e) => [e.name, e.value, e.ciLow ?? null, e.ciHigh ?? null]) }} />
      )}
      {res.cis.length > 0 && (
        <TableView t={{ id: "cis", title: "신뢰구간", columns: ["모수", "추정", "하한", "상한"], rows: res.cis.map((c) => [c.parameter, c.estimate, c.low, c.high]) }} />
      )}
      {res.notes.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-ink-2">
          {res.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}
