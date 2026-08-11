"use client";

import Bar from "@/components/charts/Bar";
import Box from "@/components/charts/Box";
import ChartFrame from "@/components/charts/ChartFrame";
import Donut from "@/components/charts/Donut";
import Histogram, { histogram } from "@/components/charts/Histogram";
import Line from "@/components/charts/Line";
import Scatter from "@/components/charts/Scatter";
import EmptyState from "@/components/ui/EmptyState";
import type { Cell } from "@/components/ui/DataTable";
import type { Dataset } from "@/lib/stats-goal";
import { AGG_LABEL, CHART_BY_ID, PALETTES, buildData, effectiveChart, facetLevels, type VizSpec } from "@/lib/viz-spec";

/** 그래프 본체 — 값 계산은 lib/viz-spec.ts가 하고, 그리기는 components/charts/*에 맡긴다. */
export default function ChartCanvas({ ds, spec }: { ds: Dataset; spec: VizSpec }) {
  const levels = facetLevels(ds, spec);
  if (!spec.enc.x) {
    return (
      <EmptyState title="가로축에 놓을 변수를 고르세요">
        왼쪽 목록에서 변수를 끌어다 &lsquo;가로축(X)&rsquo; 자리에 놓으면 그림이 바로 그려집니다.
      </EmptyState>
    );
  }
  if (levels.length > 0) {
    return (
      <div className="space-y-3 min-w-0">
        <p className="ty-small text-ink-2 prose-w">
          {spec.enc.facet} 값마다 같은 축으로 나누어 그렸습니다. 색으로 겹쳐 그리는 것보다 정확하게 비교됩니다.
        </p>
        {/* 분할 시 좁은 2열은 제목이 한 글자씩 세로로 깨지므로, 기본은 1열·넓은 화면만 2열 */}
        <div className="viz-facet-grid">
          {levels.map((lv) => (
            <One key={lv} ds={ds} spec={spec} facetValue={lv} compact />
          ))}
        </div>
      </div>
    );
  }
  return <One ds={ds} spec={spec} />;
}

function One({
  ds,
  spec,
  facetValue,
  compact = false,
}: {
  ds: Dataset;
  spec: VizSpec;
  facetValue?: string;
  compact?: boolean;
}) {
  const data = buildData(ds, spec, facetValue);
  const meta = CHART_BY_ID[spec.chart];
  const chart = effectiveChart(spec);
  const palette = PALETTES[spec.format.palette].colors;
  const yName = spec.format.yLabel || spec.enc.y || AGG_LABEL[spec.agg];
  // 분할 패널: 긴 "X별 Y · facet" 대신 짧은 제목 + 분할값 배지
  const title = compact
    ? facetValue
      ? `${spec.enc.facet || "분할"}: ${facetValue}`
      : meta.label
    : [spec.title || `${spec.enc.x || ""}별 ${yName}`, facetValue ? `· ${facetValue}` : ""].join(" ").trim();
  const subtitle = compact
    ? [spec.title || `${spec.enc.x || ""} × ${yName}`, meta.label].filter(Boolean).join(" · ")
    : [spec.subtitle, meta.label !== CHART_BY_ID[chart]?.label ? `(표시: ${meta.label})` : ""].filter(Boolean).join(" ");

  let body: React.ReactNode = null;
  let table: { columns: string[]; rows: Cell[][]; numeric?: number[] } | undefined;
  let legend: { label: string; color: string }[] = [];

  if (chart === "hist") {
    const { bins } = histogram(data.values);
    body = <Histogram values={data.values} xLabel={spec.enc.x} yLabel="사례 수" title={title} />;
    table = {
      columns: ["구간 시작", "구간 끝", "사례 수"],
      rows: bins.map((b) => [b.lo, b.hi, b.n]),
      numeric: [0, 1, 2],
    };
  } else if (chart === "scatter") {
    const groups = [...new Set(data.points.map((p) => p.group).filter(Boolean))] as string[];
    const groupColors = Object.fromEntries(groups.map((g, i) => [g, palette[i % palette.length]]));
    legend = groups.map((g) => ({ label: g, color: groupColors[g] }));
    body = (
      <Scatter
        points={data.points}
        xLabel={spec.enc.x}
        yLabel={spec.enc.y}
        regression={spec.chart !== "strip"}
        groupColors={groups.length ? groupColors : undefined}
        title={title}
      />
    );
    table = {
      columns: [spec.enc.x || "X", spec.enc.y || "Y", ...(groups.length ? ["계열"] : [])],
      rows: data.points.slice(0, 300).map((p) => [p.x, p.y, ...(groups.length ? [p.group ?? ""] : [])]),
      numeric: [0, 1],
    };
  } else if (chart === "box") {
    body = <Box groups={data.groups} showPoints xLabel={spec.enc.x} yLabel={yName} title={title} />;
    table = {
      columns: ["집단", "사례 수", "중위수", "Q1", "Q3"],
      rows: data.groups.map((g) => {
        const s = [...g.values].sort((a, b) => a - b);
        const q = (p: number) => {
          if (!s.length) return 0;
          const idx = (s.length - 1) * p;
          const lo = Math.floor(idx);
          const hi = Math.ceil(idx);
          return lo === hi ? s[lo] : s[lo] * (hi - idx) + s[hi] * (idx - lo);
        };
        return [g.label, g.values.length, q(0.5), q(0.25), q(0.75)];
      }),
      numeric: [1, 2, 3, 4],
    };
  } else if (chart === "line") {
    legend = data.series.length > 1 ? data.series.map((s, i) => ({ label: s.name, color: palette[i % palette.length] })) : [];
    body = (
      <Line
        series={data.series.map((s, i) => ({ name: s.name, points: s.points, color: palette[i % palette.length] }))}
        xTickLabels={data.xTickLabels.length ? data.xTickLabels : undefined}
        xLabel={spec.enc.x}
        yLabel={yName}
        zeroBaseline={spec.format.zeroBaseline}
        grid={spec.format.grid}
        title={title}
      />
    );
    table = {
      columns: [spec.enc.x || "X", ...data.series.map((s) => s.name)],
      rows: (data.series[0]?.points || []).map((p, i) => [
        p.label ?? p.x,
        ...data.series.map((s) => s.points[i]?.y ?? 0),
      ]),
      numeric: data.series.map((_, i) => i + 1),
    };
  } else if (chart === "donut") {
    legend = data.categories.map((c) => ({ label: c.label, color: c.color || palette[0] }));
    body = (
      <Donut
        data={data.categories.map((c) => ({ label: c.label, value: c.value, color: c.color }))}
        title={title}
        size={compact ? 180 : 240}
      />
    );
    table = {
      columns: ["범주", AGG_LABEL[spec.agg], "사례 수", "비중(%)"],
      rows: (() => {
        const total = data.categories.reduce((s, c) => s + c.value, 0) || 1;
        return data.categories.map((c) => [c.label, c.value, c.n, (c.value / total) * 100]);
      })(),
      numeric: [1, 2, 3],
    };
  } else {
    body = (
      <Bar
        data={data.categories.map((c) => ({ label: c.label, value: c.value, ci: c.ci, color: c.color }))}
        horizontal={chart === "hbar" || spec.chart === "lollipop"}
        zeroBaseline={spec.format.zeroBaseline}
        showValues={spec.format.showValues || spec.chart === "waterfall"}
        grid={spec.format.grid}
        errorBars={spec.format.errorBars && spec.chart !== "lollipop"}
        xLabel={spec.enc.x}
        yLabel={yName}
        title={title}
      />
    );
    table = {
      columns: ["범주", AGG_LABEL[spec.agg], "사례 수", ...(spec.format.errorBars ? ["95% CI ±"] : [])],
      rows: data.categories.map((c) => [c.label, c.value, c.n, ...(spec.format.errorBars ? [c.ci ?? 0] : [])]),
      numeric: [1, 2, 3],
    };
  }

  return (
    <ChartFrame
      title={title || meta.label}
      subtitle={subtitle}
      legend={legend}
      howToRead={meta.howToRead}
      source={spec.format.source}
      table={table}
    >
      {body}
    </ChartFrame>
  );
}
