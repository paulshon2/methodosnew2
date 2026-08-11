"use client";
/**
 * 데이터 시각화 · 그림 만들기
 *
 * 답하는 질문: "이 데이터는 어떤 그림으로 보여야 정직한가?"
 * 그릴 수 없는 것은 비활성화하고, 그릴 수 있지만 나쁜 것은 경고한다.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Inspector from "@/components/ui/Inspector";
import Note from "@/components/ui/Note";
import PageHead from "@/components/ui/PageHead";
import StudioGuide, { IoToolbar } from "@/components/ui/StudioGuide";
import Workspace from "@/components/ui/Workspace";
import { parseCsv } from "@/lib/basic-stats-engine";
import { buildDataset, type Dataset } from "@/lib/stats-goal";
import { VIZ_PRACTICE_SETS } from "@/lib/stats-sample-data";
import { advise, chartEnabled, emptySpec, parseSpec, recommend, type ChartId, type VizSpec } from "@/lib/viz-spec";
import { downloadBlob, exportSimplePdf, exportTableXlsx } from "@/lib/viz-export";
import { useStore } from "@/store/app-store";
import AdvicePanel from "./AdvicePanel";
import ChartCanvas from "./ChartCanvas";
import ChartTypeBar from "./ChartTypeBar";
import EncodingShelf from "./EncodingShelf";
import FormatPanel from "./FormatPanel";
import VariableRail from "./VariableRail";

const SESSION_KEY = "studio";

function csvToAoa(csv: string): (string | number)[][] {
  const { headers, rows } = parseCsv(csv);
  return [headers, ...rows];
}

async function xlsxFileToCsv(f: File): Promise<string> {
  const buf = await f.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(ws);
}

function applyCsvText(
  text: string,
  setCsv: (v: string) => void,
  setSpec: (v: VizSpec) => void,
  setError: (v: string) => void,
) {
  const { headers, rows } = parseCsv(text);
  if (!headers.length || !rows.length) {
    setError("첫 줄을 변수 이름으로 읽지 못했습니다. 쉼표로 구분된 CSV인지 확인해 주세요.");
    return;
  }
  setCsv(text);
  setSpec(emptySpec());
  setError("");
}

export default function VizStudio({ nav: _nav }: { nav: (r: string) => void }) {
  const saved = useStore((s) => s.menuArtifacts?.viz?.[SESSION_KEY]);
  const setVizSession = useStore((s) => s.setVizSession);

  const [csv, setCsv] = useState<string>(saved?.csv || "");
  const [spec, setSpec] = useState<VizSpec>(() => parseSpec(saved?.vizSpec) || emptySpec());
  const [error, setError] = useState("");
  const [fileLabel, setFileLabel] = useState("");

  const ds: Dataset | null = useMemo(() => {
    if (!csv.trim()) return null;
    const { headers, rows } = parseCsv(csv);
    if (!headers.length || !rows.length) return null;
    return buildDataset(headers, rows);
  }, [csv]);

  const x = ds?.variables.find((v) => v.name === spec.enc.x) ?? null;
  const y = ds?.variables.find((v) => v.name === spec.enc.y) ?? null;
  const rec = useMemo(() => recommend(x, y), [x, y]);
  const advice = useMemo(() => (ds ? advise(spec, ds) : []), [ds, spec]);

  useEffect(() => {
    if (!csv) return;
    setVizSession(SESSION_KEY, { csv, vizSpec: spec, title: spec.title, updatedAt: Date.now() });
  }, [csv, spec, setVizSession]);

  useEffect(() => {
    if (!ds || !x) return;
    if (!chartEnabled(spec.chart, x, y).ok && rec) setSpec((s) => ({ ...s, chart: rec }));
  }, [ds, x, y, spec.chart, rec]);

  const loadSample = useCallback((id: string) => {
    const s = VIZ_PRACTICE_SETS.find((v) => v.id === id);
    if (!s) return;
    setCsv(s.csv);
    setSpec(emptySpec());
    setError("");
    setFileLabel(s.title);
  }, []);

  const onImportCsv = useCallback((f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      applyCsvText(String(reader.result || ""), setCsv, setSpec, setError);
      setFileLabel(f.name);
    };
    reader.onerror = () => setError("파일을 읽지 못했습니다.");
    reader.readAsText(f, "utf-8");
  }, []);

  const onImportXlsx = useCallback(async (f: File) => {
    try {
      const text = await xlsxFileToCsv(f);
      applyCsvText(text, setCsv, setSpec, setError);
      setFileLabel(f.name);
    } catch {
      setError("엑셀 파일을 읽지 못했습니다.");
    }
  }, []);

  const exportBase = (fileLabel.replace(/\.[^.]+$/, "") || spec.title || "visualization").replace(/[\\/:*?"<>|]/g, "_");

  const onExportCsv = useCallback(() => {
    if (!csv.trim()) return;
    downloadBlob(`${exportBase}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
  }, [csv, exportBase]);

  const onExportXlsx = useCallback(() => {
    if (!csv.trim()) return;
    exportTableXlsx(`${exportBase}.xlsx`, [{ name: "data", aoa: csvToAoa(csv) }]);
  }, [csv, exportBase]);

  const onExportPdf = useCallback(() => {
    const lines = [
      ds ? `행 ${ds.n}개 · 변수 ${ds.variables.length}개` : "",
      spec.title ? `제목: ${spec.title}` : "",
      `그래프: ${spec.chart}`,
      x ? `X: ${x.name}` : "",
      y ? `Y: ${y.name}` : "",
      ...advice.slice(0, 6).map((a) => `[${a.level}] ${a.title}: ${a.message}`),
    ].filter(Boolean);
    exportSimplePdf({
      filename: `${exportBase}.pdf`,
      title: spec.title || "데이터 시각화",
      lines,
    });
  }, [advice, ds, exportBase, spec.chart, spec.title, x, y]);

  const quickAssign = useCallback((name: string) => {
    setSpec((s) => {
      if (!s.enc.x) return { ...s, enc: { ...s.enc, x: name } };
      if (!s.enc.y) return { ...s, enc: { ...s.enc, y: name } };
      if (!s.enc.color) return { ...s, enc: { ...s.enc, color: name } };
      return { ...s, enc: { ...s.enc, facet: name } };
    });
  }, []);

  const dataPane = (
    <div className="card">
      <h2 className="ty-section mb-2">그릴 자료</h2>
      <div className="viz-sample-grid">
        {VIZ_PRACTICE_SETS.map((s) => {
          const on = fileLabel === s.title;
          return (
            <button
              key={s.id}
              type="button"
              className="viz-sample-btn"
              title={`${s.title}${s.desc ? ` — ${s.desc}` : ""}`}
              aria-pressed={on}
              onClick={() => loadSample(s.id)}
            >
              <span className="viz-sample-btn__title">{s.title}</span>
              {s.desc ? <span className="viz-sample-btn__desc">{s.desc}</span> : null}
            </button>
          );
        })}
      </div>
      <IoToolbar
        onImportCsv={onImportCsv}
        onImportXlsx={onImportXlsx}
        onExportCsv={onExportCsv}
        onExportXlsx={onExportXlsx}
        onExportPdf={onExportPdf}
        fileLabel={fileLabel || undefined}
        disabledExport={!csv.trim()}
      />
      {error ? (
        <Note level="risk" className="mt-3" title="자료를 읽지 못했습니다">
          {error}
        </Note>
      ) : null}
      {!ds ? (
        <p className="ty-small mt-3 text-ink-2 prose-w">
          연습 자료를 고르거나 Excel·CSV를 올리면 변수 목록이 왼쪽에 나타납니다. 자료는 브라우저 안에서만 처리됩니다.
        </p>
      ) : null}
    </div>
  );

  const main = (
    <div>
      <PageHead title="데이터 시각화" />

      <StudioGuide
        why="같은 자료도 어떻게 그리느냐에 따라 다른 결론처럼 보일 수 있습니다. 그릴 수 없는 그림은 잠그고, 오해를 부를 선택에는 이유를 함께 알려 정직하게 읽을 수 있게 합니다."
        steps={[
          { title: "자료 불러오기", body: "연습 자료 또는 Excel·CSV를 올립니다." },
          { title: "변수 배치", body: "X·Y·색·면에 변수를 지정합니다." },
          { title: "그래프 고르기", body: "자료에 맞는 유형을 고르거나 추천을 따릅니다." },
          { title: "서식", body: "제목·축·범례를 읽기 좋게 다듬습니다." },
          { title: "읽기 도움", body: "주의할 점과 해석 힌트를 확인합니다." },
        ]}
        parts={[
          { name: "변수", body: "왼쪽 레일에서 유형별 변수를 눌러 빠르게 배치합니다." },
          { name: "그릴 자료", body: "위에서 표를 고르거나 파일을 올립니다." },
          { name: "그래프 유형", body: "막대·산점·박스 등 자료에 맞는 그림을 고릅니다." },
          { name: "축·색", body: "인코딩 슬롯으로 축과 색 변수를 바꿉니다." },
          { name: "서식", body: "글꼴·눈금·범례 위치 등을 조정합니다." },
          { name: "읽기 도움", body: "왜곡·과장·표본 크기 등을 점검합니다." },
        ]}
      />

      <div className="space-y-3">
        {dataPane}

        {ds && (
          <>
            <div className="card">
              <h2 className="ty-section mb-2">그래프 유형</h2>
              <ChartTypeBar value={spec.chart} x={x} y={y} recommended={rec} onChange={(c: ChartId) => setSpec((s) => ({ ...s, chart: c }))} />
            </div>
            <ChartCanvas ds={ds} spec={spec} />
          </>
        )}
      </div>
    </div>
  );

  return (
    <Workspace
      rail={ds ? <VariableRail ds={ds} used={Object.values(spec.enc).filter(Boolean) as string[]} onQuickAssign={quickAssign} /> : <p className="ty-small text-ink-3">자료를 불러오면 변수 목록이 나타납니다.</p>}
      railTitle="변수"
      main={main}
      inspector={
        ds ? (
          <Inspector
            tabs={[
              { id: "enc", label: "축·색", content: <EncodingShelf ds={ds} spec={spec} onChange={setSpec} /> },
              { id: "fmt", label: "서식", content: <FormatPanel spec={spec} onChange={setSpec} /> },
              { id: "advice", label: "읽기 도움", content: <AdvicePanel spec={spec} advice={advice} /> },
            ]}
          />
        ) : (
          <div className="card">
            <h2 className="ty-subhead mb-1">그림 설정</h2>
            <p className="ty-small text-ink-3">자료를 불러오면 축·서식·읽기 도움이 열립니다.</p>
          </div>
        )
      }
      inspectorTitle="그림 설정"
      statusbar={
        <>
          <span>모든 그림은 브라우저에서 그려지며 자료가 외부로 전송되지 않습니다.</span>
          {ds ? <span>행 <strong className="num">{ds.n}</strong> · 변수 <strong className="num">{ds.variables.length}</strong></span> : null}
          {advice.some((a) => a.level === "risk") ? <span style={{ color: "var(--danger)" }}>주의할 점 {advice.filter((a) => a.level === "risk").length}건</span> : null}
        </>
      }
    />
  );
}
