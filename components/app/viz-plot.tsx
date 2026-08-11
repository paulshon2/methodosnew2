"use client";
// React VizPlot — 자체 SVG 엔진 (Plotly 제거). ①② 적용이 모두 동작.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useStore } from "@/store/app-store";
import { CHART_CATALOG } from "@/lib/charts";
import { getWizardConfig, type WizardCompareExample, type WizardDataExample } from "@/lib/viz-wizard-config";
import { CompareExampleAccordions, DataExampleAccordions } from "./viz-wizard-panels";
import VizNativeChart from "./viz-native-chart";
import {
  CHART_BUILDERS, findChart,
  inferModel, numCols, catCols, demoData, researchData, parseCSV,
  DataModel, Mapping,
} from "@/lib/viz-engine";

type Source = "research" | "demo_scatter" | "demo_ts" | "demo_cat" | "demo_multi" | "csv";

export default function VizPlot({
  chartId, mode = "self", preview = false, projectData = null,
}: {
  chartId: string;
  mode?: "research" | "self";
  preview?: boolean;
  projectData?: { artifacts?: any[] } | null;
}) {
  const setVizSession = useStore((s) => s.setVizSession);
  const savedViz = useStore((s) => s.menuArtifacts?.viz?.[chartId]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipDataSync = useRef(false);
  const hydrated = useRef(false);
  const mappingLock = useRef<Mapping | null>(null);

  const initial = findChart(chartId) || { cat: "기본", chart: "scatter" };
  const savedPayload = savedViz?.data as { source?: Source; csv?: string; model?: DataModel } | undefined;
  const savedSpec = savedViz?.spec as { cat?: string; chart?: string; mapping?: Mapping } | undefined;

  const [cat, setCat] = useState(savedSpec?.cat || initial.cat);
  const [chart, setChart] = useState(savedSpec?.chart || initial.chart);
  const [source, setSource] = useState<Source>(
    savedPayload?.source || (mode === "research" && projectData ? "research" : "demo_scatter")
  );
  const [csv, setCsv] = useState(
    savedPayload?.csv || "이름,점수,그룹\n홍길동,82,A\n김철수,90,B\n이영희,75,A"
  );
  const [data, setData] = useState<DataModel>(() =>
    savedPayload?.model || inferModel(...demoData("demo_scatter"))
  );
  const [mapping, setMapping] = useState<Mapping>(savedSpec?.mapping || { x: "x", y: "y" });
  const snapshotRef = useRef<string>("");
  const [openDataEx, setOpenDataEx] = useState<string | null>(null);
  const [openCmpEx, setOpenCmpEx] = useState<string | null>(null);
  const [applyStatus, setApplyStatus] = useState<string>("");

  const wizard = useMemo(() => getWizardConfig(chartId), [chartId]);
  const allowedByCat = useMemo(() => {
    const m = new Map<string, typeof wizard.allowedCharts>();
    wizard.allowedCharts.forEach((c) => {
      const list = m.get(c.cat) || [];
      list.push(c);
      m.set(c.cat, list);
    });
    return m;
  }, [wizard.allowedCharts]);

  function modelFromExample(ex: WizardDataExample): DataModel {
    if (ex.source === "csv" && ex.csv) {
      const [c, r] = parseCSV(ex.csv);
      return inferModel(c, r);
    }
    const [c, r] = demoData(ex.source);
    return inferModel(c, r);
  }

  function defaultMappingFor(model: DataModel, prefer?: Partial<Mapping>): Mapping {
    const all = model.columns.map((c) => c.name);
    const cats = catCols(model);
    const nums = numCols(model);
    const pick = (want: string | undefined, fallback: string) =>
      want && all.includes(want) ? want : fallback;
    // 산점·관계형: X/Y는 연속형 2열을 우선 (범주가 X로 잡히면 점이 비게 됨)
    const xyPrefer = nums.length >= 2;
    const fallbackX = xyPrefer ? nums[0] : (cats[0] || all[0] || "x");
    const fallbackY = xyPrefer
      ? (nums.find((n) => n !== pick(prefer?.x, fallbackX)) || nums[1] || nums[0])
      : (nums[0] || all[1] || all[0] || "y");
    const x = pick(prefer?.x, fallbackX);
    const y = pick(prefer?.y, fallbackY);
    const gDefault = cats.find((c) => c !== x) || "";
    return {
      x,
      y,
      g: prefer?.g !== undefined
        ? (prefer.g && all.includes(prefer.g) ? prefer.g : "")
        : gDefault,
      s: prefer?.s && all.includes(prefer.s) ? prefer.s : "",
    };
  }

  function beginApply() {
    skipDataSync.current = true;
  }
  function endApply() {
    // source/csv effect가 한 틱 늦게 돌 수 있어 잠금 유지
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        skipDataSync.current = false;
      });
    });
  }

  function applyDataExample(ex: WizardDataExample, preferMap?: Partial<Mapping>, statusMsg?: string) {
    beginApply();
    const model = modelFromExample(ex);
    // Step①만 눌러도 이 차트용 비교 예시(키×몸무게 등) 축을 함께 맞춤
    const linkedCmp = !preferMap
      ? wizard.compareExamples.find((c) => c.dataId === ex.id)
      : undefined;
    const prefer = preferMap || linkedCmp
      ? {
          x: preferMap?.x ?? linkedCmp?.x,
          y: preferMap?.y ?? linkedCmp?.y,
          g: preferMap?.g ?? linkedCmp?.g,
          s: preferMap?.s ?? linkedCmp?.s,
        }
      : mappingLock.current || undefined;
    const nextMap = defaultMappingFor(model, prefer);
    mappingLock.current = nextMap;
    if (ex.source === "csv" && ex.csv) {
      setSource("csv");
      setCsv(ex.csv);
    } else {
      setSource(ex.source as Source);
    }
    setData(model);
    setMapping(nextMap);
    endApply();
    setApplyStatus(statusMsg || `자료 적용: ${ex.title} (${model.rows.length}행) · 축 ${nextMap.x}×${nextMap.y}`);
  }

  function applyCompareExample(ex: WizardCompareExample) {
    const prefer: Mapping = { x: ex.x, y: ex.y, g: ex.g || "", s: ex.s || "" };
    const linked = ex.dataId ? wizard.dataExamples.find((d) => d.id === ex.dataId) : undefined;
    const all = data.columns.map((c) => c.name);
    const need = [ex.x, ex.y, ex.g, ex.s].filter(Boolean) as string[];
    const missing = need.filter((n) => !all.includes(n));

    const match =
      linked ||
      (missing.length
        ? wizard.dataExamples.find((d) => {
            if (d.source === "csv" && d.csv) {
              const cols = d.csv.trim().split(/\r?\n/)[0].split(",").map((s) => s.trim());
              return need.every((n) => cols.includes(n));
            }
            if (d.source === "demo_scatter") return ["x", "y", "group", "size"].some((c) => need.includes(c));
            if (d.source === "demo_ts") return ["date", "value"].some((c) => need.includes(c));
            if (d.source === "demo_cat") return ["category", "count", "mean"].some((c) => need.includes(c));
            if (d.source === "demo_multi") return ["v1", "v2", "v3", "v4", "group"].some((c) => need.includes(c));
            return false;
          })
        : undefined) ||
      (missing.length ? wizard.dataExamples[0] : undefined);

    if (match) {
      applyDataExample(match, prefer, `축·자료 적용: ${ex.title} (${match.title})`);
      return;
    }

    beginApply();
    const next: Mapping = {
      x: all.includes(ex.x) ? ex.x : all[0],
      y: all.includes(ex.y) ? ex.y : (numCols(data)[0] || all[1] || all[0]),
      g: ex.g && all.includes(ex.g) ? ex.g : "",
      s: ex.s && all.includes(ex.s) ? ex.s : "",
    };
    mappingLock.current = next;
    setMapping(next);
    endApply();
    setApplyStatus(`축 조합 적용: ${ex.title} · ${next.x}×${next.y}`);
  }

  function buildVizNote(name: string) {
    const cols = data.columns.map((c) => `${c.name}(${c.type === "num" ? "수" : "범"})`).join(", ");
    return [
      `${name} 그래프를 ${data.rows.length}행·${data.columns.length}열 자료로 그렸습니다.`,
      `가로축 ${mapping.x}, 세로축 ${mapping.y}${mapping.g ? `, 색 ${mapping.g}` : ""}${mapping.s ? `, 크기 ${mapping.s}` : ""}.`,
      `열: ${cols}`,
    ].join("\n");
  }

  function buildVizProseHtml(name: string) {
    const sample = data.rows.slice(0, 5);
    const heads = data.columns.map((c) => c.name);
    const rows = sample.map((r) => heads.map((h) => String(r[h] ?? "")));
    const table =
      sample.length > 0
        ? `<table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:8px"><tr>${heads.map((h) => `<th style="border:1px solid #e2e8f0;padding:4px 6px;background:#f1f5f9">${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #e2e8f0;padding:4px 6px">${c}</td>`).join("")}</tr>`).join("")}</table>`
        : "";
    return `<p style="margin:8px 0;font-size:14px;line-height:1.6">${buildVizNote(name).replace(/\n/g, "<br/>")}</p>${table}`;
  }

  useEffect(() => {
    const s = savedViz;
    if (!s?.updatedAt || hydrated.current) return;
    hydrated.current = true;
    beginApply();
    const payload = s.data as { source?: Source; csv?: string; model?: DataModel } | undefined;
    const spec = s.spec as { cat?: string; chart?: string; mapping?: Mapping } | undefined;
    if (spec?.cat) setCat(spec.cat);
    if (spec?.chart) setChart(spec.chart);
    if (spec?.mapping) { setMapping(spec.mapping); mappingLock.current = spec.mapping; }
    if (payload?.csv) setCsv(payload.csv);
    if (payload?.model) setData(payload.model);
    if (payload?.source) setSource(payload.source);
    endApply();
  }, [savedViz?.updatedAt, chartId]);

  useEffect(() => {
    if (skipDataSync.current) return;
    if (source === "csv") { const [c, r] = parseCSV(csv); setData(inferModel(c, r)); return; }
    if (source === "research") { const [c, r] = researchData(projectData); setData(inferModel(c, r)); return; }
    const [c, r] = demoData(source); setData(inferModel(c, r));
  }, [source, csv, projectData]);

  useEffect(() => {
    const f = findChart(chartId);
    if (!f) return;
    const allowed = wizard.allowedCharts;
    const ids = new Set(allowed.map((c) => c.id));
    if (ids.has(f.chart)) {
      setCat(f.cat);
      setChart(f.chart);
      return;
    }
    const first = allowed[0];
    if (first) {
      setCat(first.cat);
      setChart(first.id);
    } else {
      setCat(f.cat);
      setChart(f.chart);
    }
  }, [chartId, wizard]);

  useEffect(() => {
    const all = data.columns.map((c) => c.name);
    if (!all.length) return;
    if (mappingLock.current) {
      const prefer = mappingLock.current;
      mappingLock.current = null;
      setMapping(defaultMappingFor(data, prefer));
      return;
    }
    if (skipDataSync.current) return;
    const cats = catCols(data), nums = numCols(data);
    setMapping((m) => ({
      x: m.x && all.includes(m.x) ? m.x : (cats[0] || all[0]),
      y: m.y && all.includes(m.y) ? m.y : (nums[0] || all[1] || all[0]),
      g: m.g && all.includes(m.g) ? m.g : "",
      s: m.s && all.includes(m.s) ? m.s : "",
    }));
  }, [data]);

  const onSnapshot = useCallback((url: string) => {
    snapshotRef.current = url;
  }, []);

  const allCols = useMemo(() => data.columns.map((c) => c.name), [data]);
  const nums = useMemo(() => numCols(data), [data]);

  const chartName = ((CHART_BUILDERS[cat] || []).find((c) => c[0] === chart) || [])[1] || chart;

  useEffect(() => {
    if (preview) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const note = buildVizNote(chartName);
      setVizSession(chartId, {
        chartId,
        title: chartName,
        data: { source, csv, model: data },
        spec: { cat, chart, mapping },
        note,
        proseHtml: buildVizProseHtml(chartName),
        snapshotPng: snapshotRef.current || undefined,
        updatedAt: Date.now(),
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [preview, chartId, chartName, source, csv, data, cat, chart, mapping, setVizSession]);

  const plot = (
    <VizNativeChart
      chartId={chart}
      data={data}
      mapping={mapping}
      height={preview ? 460 : 540}
      onSnapshot={preview ? undefined : onSnapshot}
    />
  );

  return (
    <div>
      {!preview && (
        <>
          <div className="rounded-md p-3 mb-3" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)", fontSize: 14 }}>
            📊 <strong>내 연구 결과를 그래프로 그려보는 곳이에요.</strong> 순서만 따라 하면 됩니다 — <strong>① 어떤 자료로 그릴지 → ② 가로·세로 정하기 → ③ 그래프 종류 고르기.</strong>
          </div>

          <div className="grid lg:grid-cols-[300px_1fr] gap-4">
            <div className="flex flex-col gap-3">
              <div className="card">
                <h4 className="text-[14px] font-semibold mb-1">① 어떤 자료로 그릴까요?</h4>
                <p className="text-[12px] text-ink-3 mb-2">내 연구 결과를 고르거나, 연습용 예시·CSV 붙여넣기를 쓸 수 있어요.</p>
                <select className="inp text-[13px]" value={source} onChange={(e) => setSource(e.target.value as Source)}>
                  <option value="research">내 연구 결과 (프로젝트 자료)</option>
                  <option value="demo_scatter">연습용 — 두 값의 관계 보기</option>
                  <option value="demo_ts">연습용 — 시간에 따른 변화</option>
                  <option value="demo_cat">연습용 — 그룹별 개수 비교</option>
                  <option value="demo_multi">연습용 — 여러 값 한꺼번에</option>
                  <option value="csv">내 표 붙여넣기 (엑셀/CSV 복사)</option>
                </select>
                {source === "csv" && (
                  <textarea className="inp mt-2 text-[12px] font-mono min-h-[120px]" value={csv} onChange={(e) => setCsv(e.target.value)}
                    placeholder="첫 줄은 항목 이름, 그 아래 값을 쉼표로:" />
                )}
                <div className="text-[12px] text-ink-3 mt-2">
                  {data.rows.length}행 · {data.columns.length}열 ({data.columns.map((c) => c.name + ":" + (c.type === "num" ? "수" : "범")).join(", ")})
                </div>
                {applyStatus && (
                  <div className="mt-1.5 text-[11px] rounded px-2 py-1" style={{ background: "var(--ok-soft)", color: "var(--brand-ink)" }}>
                    ✓ {applyStatus}
                  </div>
                )}
                <p className="text-[11px] text-ink-3 mt-2 mb-0">이 그래프에 맞는 자료 예시 (표를 펼쳐서 적용)</p>
                <DataExampleAccordions
                  examples={wizard.dataExamples}
                  openId={openDataEx}
                  onToggle={(id) => setOpenDataEx((p) => (p === id ? null : id))}
                  onApply={(ex) => applyDataExample(ex)}
                />
              </div>

              <div className="card">
                <h4 className="text-[14px] font-semibold mb-1">② 무엇을 비교할까요?</h4>
                <p className="text-[12px] text-ink-3 mb-2">가로·세로축에 어떤 항목을 놓을지 고르세요. 「이 조합으로 적용」은 맞는 자료도 함께 맞춥니다.</p>
                <CompareExampleAccordions
                  examples={wizard.compareExamples}
                  openId={openCmpEx}
                  onToggle={(id) => setOpenCmpEx((p) => (p === id ? null : id))}
                  onApply={applyCompareExample}
                />
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border-tertiary)" }}>
                <label className="block text-[12px] mb-0.5">가로축 (X) — 보통 ‘이름·날짜·그룹’</label>
                <select className="inp text-[13px] mb-2" value={allCols.includes(mapping.x) ? mapping.x : (allCols[0] || "")} onChange={(e) => setMapping((m) => ({ ...m, x: e.target.value }))}>
                  {allCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="block text-[12px] mb-0.5">세로축 (Y) — 보통 ‘숫자·값’</label>
                <select className="inp text-[13px] mb-2" value={(nums.includes(mapping.y) || allCols.includes(mapping.y)) ? mapping.y : (nums[0] || allCols[0] || "")} onChange={(e) => setMapping((m) => ({ ...m, y: e.target.value }))}>
                  {(nums.length ? [...new Set([...nums, ...allCols.filter((c) => c === mapping.y)])] : allCols).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="block text-[12px] mb-0.5">색으로 구분 (그룹, 선택)</label>
                <select className="inp text-[13px] mb-2" value={mapping.g || ""} onChange={(e) => setMapping((m) => ({ ...m, g: e.target.value }))}>
                  <option value="">(없음)</option>
                  {allCols.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="block text-[12px] mb-0.5">점 크기 (선택)</label>
                <select className="inp text-[13px]" value={mapping.s || ""} onChange={(e) => setMapping((m) => ({ ...m, s: e.target.value }))}>
                  <option value="">(없음)</option>
                  {nums.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[14px] font-semibold mb-1">③ 그래프 종류를 고르세요</h4>
              <p className="text-[12px] text-ink-3 mb-2">{chartId}에 쓸 수 있는 그래프만 표시합니다. (자체 SVG 엔진)</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[...allowedByCat.keys()].map((cKey) => {
                  const catKo = CHART_CATALOG.find((c) => c.key === cKey)?.catKo || cKey;
                  return (
                  <button key={cKey} type="button" onClick={() => { setCat(cKey); const first = allowedByCat.get(cKey)?.[0]; if (first) setChart(first.id); }}
                    className="rounded-md px-2.5 py-1 text-[12px]"
                    style={cKey === cat ? { background: "var(--brand-soft)", color: "var(--brand-ink)", fontWeight: 600 } : { background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>
                    {catKo}
                  </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {(allowedByCat.get(cat) || wizard.allowedCharts).map(({ id, name }) => (
                  <button key={id} type="button" onClick={() => setChart(id)}
                    className="rounded-md border px-2 py-1.5 text-[12px] text-left"
                    style={id === chart
                      ? { borderColor: "var(--brand)", borderWidth: 1.5, background: "var(--brand-soft)", color: "var(--brand-ink)", fontWeight: 600 }
                      : { borderColor: "var(--color-border-tertiary)", background: "var(--color-background-primary)" }}>
                    {name}
                  </button>
                ))}
              </div>
              <div className="card p-2.5">{plot}</div>
              <div className="text-[13px] text-ink-2 mt-2">지금 그래프: <strong>{chartName}</strong> · 자료나 가로·세로 항목을 바꾸면 그래프가 바로 바뀝니다.</div>
            </div>
          </div>
        </>
      )}
      {preview && plot}
    </div>
  );
}
