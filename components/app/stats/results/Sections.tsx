"use client";

import Bar from "@/components/charts/Bar";
import Box from "@/components/charts/Box";
import ChartFrame from "@/components/charts/ChartFrame";
import Histogram, { histogram } from "@/components/charts/Histogram";
import Scatter from "@/components/charts/Scatter";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Note from "@/components/ui/Note";
import { apaDecimal, num, type GoalChart, type GoalResult } from "@/lib/stats-goal";

/** ① 자동으로 고른 검정과 그 이유. */
export function WhyBlock({ r }: { r: GoalResult }) {
  return (
    <Note level={r.switched ? "warn" : "ok"} title={`이 자료에는 ${r.chosenTest}을(를) 썼습니다`} live>
      {r.why}
    </Note>
  );
}

/** ② 집단별 기술통계. */
export function DescriptiveBlock({ r }: { r: GoalResult }) {
  if (!r.descriptives) return null;
  return (
    <section className="card">
      <h3 className="ty-subhead mb-2">기술통계</h3>
      <DataTable
        columns={r.descriptives.cols}
        rows={r.descriptives.rows}
        numeric={r.descriptives.cols.map((_, i) => i).filter((i) => i > 0)}
        caption="집단별 사례 수 · 평균 · 표준편차 · 표준오차 · 평균의 95% 신뢰구간"
      />
      <p className="ty-label mt-2 text-ink-3">
        SE는 평균이 표본마다 얼마나 흔들리는지를, 95% CI는 같은 방식으로 표본을 반복해 뽑았을 때 참값이 들어올 구간을 뜻합니다.
      </p>
    </section>
  );
}

/** ③ 핵심 수치 카드 + 효과크기. */
export function KeyNumberBlock({ r }: { r: GoalResult }) {
  return (
    <section className="card">
      <h3 className="ty-subhead mb-2">핵심 수치</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {r.keyNumbers.map((k) => (
          <div key={k.label} className="rounded-xl p-3" style={{ border: "1px solid var(--color-border-tertiary)" }}>
            <div className="ty-label text-ink-3">{k.label}</div>
            <div className="num" style={{ fontSize: "var(--fs-title)", fontWeight: 800, lineHeight: 1.2 }}>
              {k.value}
            </div>
            <p className="ty-label mt-1 text-ink-3">{k.hint}</p>
          </div>
        ))}
      </div>

      {r.effects.length > 0 && (
        <div className="mt-3">
          <h4 className="ty-label mb-1.5 font-bold">효과크기 — 차이가 &lsquo;있는가&rsquo;가 아니라 &lsquo;얼마나 큰가&rsquo;</h4>
          <ul className="flex flex-wrap gap-2">
            {r.effects.map((e) => (
              <li key={e.key} className="rounded-xl px-3 py-2" style={{ border: "1px solid var(--color-border-tertiary)" }}>
                <span className="ty-label text-ink-3">{e.label} </span>
                <span className="num" style={{ fontWeight: 800 }}>{apaDecimal(e.value, 2)}</span>
                <Badge tone="info" mark="→" className="ml-2">
                  {e.reading}
                </Badge>
                <span className="ty-label ml-2 text-ink-3">{e.cutoffs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** ④ 분석별 추가 표. */
export function TableBlock({ r }: { r: GoalResult }) {
  if (!r.tables.length) return null;
  return (
    <div className="space-y-3">
      {r.tables.map((t) => (
        <section key={t.title} className="card">
          <h3 className="ty-subhead mb-2">{t.title}</h3>
          <DataTable
            columns={t.table.cols}
            rows={t.table.rows}
            numeric={t.table.cols.map((_, i) => i).filter((i) => i > 0)}
            caption={t.note}
          />
          {t.note ? <p className="ty-small mt-2 text-ink-2 prose-w">{t.note}</p> : null}
        </section>
      ))}
    </div>
  );
}

/** ⑤ 분포 그림 — 그림마다 같은 값을 읽을 수 있는 표를 붙인다. */
export function ChartBlock({ r }: { r: GoalResult }) {
  return (
    <div className="space-y-3">
      {r.charts.map((c, i) => (
        <ChartRender key={i} c={c} />
      ))}
    </div>
  );
}

function ChartRender({ c }: { c: GoalChart }) {
  if (c.kind === "hist") {
    const { bins } = histogram(c.values);
    return (
      <ChartFrame
        title={`${c.label} 분포`}
        subtitle="막대 하나가 한 구간에 들어간 사례 수입니다."
        howToRead="봉우리가 하나이고 좌우가 비슷하면 정규분포에 가깝습니다. 봉우리가 둘이면 서로 다른 집단이 섞였을 수 있습니다."
        table={{
          columns: ["구간 시작", "구간 끝", "사례 수"],
          rows: bins.map((b) => [num(b.lo), num(b.hi), b.n]),
          numeric: [0, 1, 2],
        }}
      >
        <Histogram values={c.values} xLabel={c.label} yLabel="사례 수" title={`${c.label} 분포`} />
      </ChartFrame>
    );
  }
  if (c.kind === "bar") {
    return (
      <ChartFrame
        title={c.label}
        subtitle="막대 길이가 곧 값이므로 세로축은 항상 0에서 시작합니다."
        howToRead={c.errors ? "오차막대가 서로 크게 겹치면 평균 차이를 단정하기 어렵습니다." : undefined}
        table={{
          columns: ["범주", "값", ...(c.errors ? ["±SE"] : [])],
          rows: c.labels.map((l, i) => [l, num(c.values[i]), ...(c.errors ? [num(c.errors[i])] : [])]),
          numeric: [1, 2],
        }}
      >
        <Bar
          data={c.labels.map((l, i) => ({ label: l, value: c.values[i], ci: c.errors?.[i] }))}
          errorBars={!!c.errors}
          showValues
          yLabel="값"
          title={c.label}
        />
      </ChartFrame>
    );
  }
  if (c.kind === "scatter") {
    return (
      <ChartFrame
        title={`${c.xLabel} × ${c.yLabel}`}
        subtitle="점 하나가 사례 하나입니다. 직선은 최소제곱 회귀선입니다."
        howToRead="점들이 곡선을 그리거나 한쪽에 극단값이 떨어져 있으면 상관계수 하나로 관계를 요약하기 어렵습니다."
        table={{
          columns: [c.xLabel, c.yLabel],
          rows: c.points.slice(0, 200).map((p) => [num(p.x), num(p.y)]),
          numeric: [0, 1],
        }}
      >
        <Scatter points={c.points} xLabel={c.xLabel} yLabel={c.yLabel} regression title={`${c.xLabel} × ${c.yLabel}`} />
      </ChartFrame>
    );
  }
  return (
    <ChartFrame
      title={c.label}
      subtitle="상자는 가운데 50%, 가로선은 중위수, 점은 개별 사례입니다."
      howToRead="상자의 높이가 서로 많이 다르면 등분산 가정이 흔들립니다. 상자 밖 점은 이상치 후보입니다."
      table={{
        columns: ["집단", "n", "최소", "Q1", "중위수", "Q3", "최대"],
        rows: c.groups.map((g) => {
          const s = [...g.values].sort((a, b) => a - b);
          const q = (p: number) => {
            const idx = (s.length - 1) * p;
            const lo = Math.floor(idx);
            const hi = Math.ceil(idx);
            return lo === hi ? s[lo] : s[lo] * (hi - idx) + s[hi] * (idx - lo);
          };
          return [g.label, g.values.length, num(s[0]), num(q(0.25)), num(q(0.5)), num(q(0.75)), num(s[s.length - 1])];
        }),
        numeric: [1, 2, 3, 4, 5, 6],
      }}
    >
      <Box groups={c.groups} showPoints yLabel="값" title={c.label} />
    </ChartFrame>
  );
}
