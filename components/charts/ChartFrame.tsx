"use client";

import { useRef, useState, type ReactNode } from "react";
import { Download, Table2 } from "lucide-react";
import DataTable, { type Cell } from "@/components/ui/DataTable";
import { inlineCssVars } from "@/lib/design-tokens";

export type Legend = { label: string; color: string };

/**
 * 차트 래퍼 — 제목·부제·범례·출처·대체표 토글.
 * 대체표는 선택이 아니라 규칙이다. 그림을 볼 수 없는 사람도 같은 값을 읽을 수 있어야 한다.
 */
export default function ChartFrame({
  title,
  subtitle,
  legend = [],
  source,
  howToRead,
  table,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  legend?: Legend[];
  source?: string;
  /** 이 그래프를 읽는 법 — 출처 줄 위에 붙는다 */
  howToRead?: string;
  table?: { columns: string[]; rows: Cell[][]; numeric?: number[] };
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  /** CSS 변수를 실제 색으로 굳혀야 파일에서도 색이 살아 있다. */
  const serialize = (): { markup: string; width: number; height: number } | null => {
    const svg = box.current?.querySelector("svg");
    if (!svg) return null;
    const clone = inlineCssVars(svg as SVGSVGElement);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return {
      markup: new XMLSerializer().serializeToString(clone),
      width: (svg as SVGSVGElement).width.baseVal.value || 720,
      height: (svg as SVGSVGElement).height.baseVal.value || 400,
    };
  };

  const exportSvg = () => {
    const s = serialize();
    if (!s) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([s.markup], { type: "image/svg+xml;charset=utf-8" }));
    a.download = `${title || "chart"}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPng = () => {
    const s = serialize();
    if (!s) return;
    const scale = 2;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([s.markup], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = s.width * scale;
      canvas.height = s.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // 투명 배경으로 내보내면 흰 글자가 사라지므로 배경을 깔아 둔다.
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-background-primary").trim() || "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `${title || "chart"}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <figure className="card chart-frame min-w-0 overflow-hidden">
      <div className="chart-frame__head mb-3">
        <div className="chart-frame__title min-w-0">
          <h3 className="ty-subhead chart-frame__h">{title}</h3>
          {subtitle ? <p className="ty-small text-ink-2 chart-frame__sub">{subtitle}</p> : null}
        </div>
        <div className="chart-frame__actions flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          <div
            className="flex flex-row flex-wrap items-center gap-1 rounded-xl border px-1 py-1"
            style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}
          >
            {table ? (
              <button
                type="button"
                className="btn btn-sm gap-1.5"
                style={{ background: "transparent", boxShadow: "none" }}
                aria-pressed={showTable}
                title="데이터 표 함께 보기"
                onClick={() => setShowTable((v) => !v)}
              >
                <Table2 size={14} aria-hidden="true" />
                <span className="ty-label">표 함께</span>
              </button>
            ) : null}
            <button type="button" className="btn btn-sm gap-1.5" style={{ background: "transparent", boxShadow: "none" }} onClick={exportSvg}>
              <Download size={14} aria-hidden="true" />
              <span className="ty-label">SVG</span>
            </button>
            <button type="button" className="btn btn-sm gap-1.5" style={{ background: "transparent", boxShadow: "none" }} onClick={exportPng}>
              <Download size={14} aria-hidden="true" />
              <span className="ty-label">PNG</span>
            </button>
          </div>
        </div>
      </div>

      {legend.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {legend.map((l) => (
            <li key={l.label} className="ty-label flex items-center gap-1.5 text-ink-2">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: l.color }} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      )}

      <div ref={box}>{children}</div>

      {showTable && table && (
        <div className="anim-panel mt-3">
          <DataTable columns={table.columns} rows={table.rows} numeric={table.numeric} caption="그래프와 같은 값" maxHeight={320} />
        </div>
      )}

      {(howToRead || source) && (
        <figcaption className="mt-3">
          {howToRead ? <p className="ty-small text-ink-2">{howToRead}</p> : null}
          {source ? <p className="ty-label mt-1 text-ink-3">출처 · {source}</p> : null}
        </figcaption>
      )}
    </figure>
  );
}
