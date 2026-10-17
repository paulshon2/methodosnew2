/* 「분석 시각화」— 기존 그림(엔진이 그린 그림)은 그대로 두고 그 아래에 이 분석에 맞춰 새로 설계한 그림 묶음을 놓는다.
   분석 실행 · 그래프 그리기 · 통계분석결과 세 화면이 같은 FigureGallery 를 쓰므로 한 곳에서 붙인다. */
import { useMemo, useState } from "react";
import { useLocale } from "./locale-ko.js";
import { DCard, Tiles, t3 } from "./core.jsx";
import { designFor } from "./registry.jsx";
import { L } from "./bh.jsx";
import "./dviz.css";

export default function DesignedViz({ result }) {
  const { locale } = useLocale();
  const d = useMemo(() => designFor(result), [result, locale]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(true);
  if (!d || !d.charts.length) return null;
  const name = L(result.analysis_name || "");
  return (
    <section className="dv-panel" data-testid="dviz-panel">
      <div className="dv-panel-head">
        <h4>{t3("분석 시각화", "Result visualisation", "结果可视化")}</h4>
        <span className="dv-chip">{result.analysis_code} · {name}</span>
        <span className="dv-chip">{t3(`그림 ${d.charts.length}장`, `${d.charts.length} charts`, `${d.charts.length} 张图`)}</span>
        <button type="button" className="dv-btn dv-toggle" onClick={() => setOpen((v) => !v)}>{open ? t3("접기", "Hide", "收起") : t3("펼치기", "Show", "展开")}</button>
      </div>
      {open && (
        <>
          <p className="dv-lead">{t3("위의 기존 그림은 그대로이며, 아래는 이 분석의 결과표를 한눈에 읽도록 새로 설계한 그림입니다. 모든 값은 결과표에서 가져온 것이고, 그림마다 ‘읽는 법’과 ‘표로 보기’가 있습니다.", "The figures above are unchanged. Below are charts newly designed for this analysis so its results can be read at a glance. Every value comes from the result tables; each chart has ‘How to read’ and ‘Data table’.", "上方原有图表保持不变。下方是为本分析重新设计的图表,便于一眼读懂结果;所有数值均来自结果表,每张图都有“阅读方法”和“查看表格”。")}</p>
          {d.tiles && d.tiles.length > 0 && <Tiles items={d.tiles} />}
          <div className="dv-grid">{d.charts.map((c) => <DCard key={c.key} title={c.title} take={c.take} guide={c.guide} data={c.data} wide={c.wide}>{c.node}</DCard>)}</div>
        </>
      )}
    </section>
  );
}
