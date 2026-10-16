"use client";
/**
 * 기본통계 · 목적으로 시작하기
 *
 * "어떤 검정을 쓸 것인가"가 아니라 "무엇을 알고 싶은가"에서 출발한다.
 * 계산은 검증된 엔진(lib/basic-stats-engine · lib/stats-core)이 하고,
 * 이 파일은 자료 · 목적 · 변수라는 세 가지 상태만 들고 있다.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Note from "@/components/ui/Note";
import PageHead from "@/components/ui/PageHead";
import Stepper from "@/components/ui/Stepper";
import StudioGuide, { IoToolbar } from "@/components/ui/StudioGuide";
import Workspace from "@/components/ui/Workspace";
import { parseCsv } from "@/lib/basic-stats-engine";
import { STATS_PRACTICE_SETS } from "@/lib/stats-sample-data";
import {
  GOAL_BY_ID,
  buildDataset,
  runGoal,
  type Dataset,
  type GoalId,
  type GoalResult,
} from "@/lib/stats-goal";
import { downloadBlob, exportSimplePdf, exportTableXlsx } from "@/lib/viz-export";
import { useStore } from "@/store/app-store";
import AssumptionPanel from "./AssumptionPanel";
import GoalPicker from "./GoalPicker";
import ResultPanel from "./ResultPanel";
import VariableList from "./VariableList";
import VariableSlots from "./VariableSlots";

type StepId = "data" | "goal" | "vars" | "result";

const STEPS = [
  { id: "data", label: "자료", sub: "표를 불러옵니다" },
  { id: "goal", label: "알고 싶은 것", sub: "목적을 고릅니다" },
  { id: "vars", label: "변수", sub: "쓸 수 있는 것만 보입니다" },
  { id: "result", label: "결과", sub: "해석과 문장까지" },
];

const SESSION_KEY = "goal-based";

function csvToAoa(csv: string): (string | number)[][] {
  const { headers, rows } = parseCsv(csv);
  return [headers, ...rows];
}

function applyCsvFromFile(
  text: string,
  setCsv: (v: string) => void,
  setSlots: (v: Record<string, string>) => void,
  setError: (v: string) => void,
  setStep: (v: StepId) => void,
) {
  const { headers, rows } = parseCsv(text);
  if (!headers.length || !rows.length) {
    setError("첫 줄을 변수 이름으로 읽지 못했습니다. 쉼표로 구분된 CSV인지 확인해 주세요.");
    return;
  }
  setCsv(text);
  setSlots({});
  setError("");
  setStep("goal");
}

async function xlsxFileToCsv(f: File): Promise<string> {
  const buf = await f.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(ws);
}

export default function BasicStatsStudio({ nav }: { nav: (r: string) => void }) {
  const saved = useStore((s) => s.menuArtifacts?.basicStats?.[SESSION_KEY]);
  const setBasicStatsSession = useStore((s) => s.setBasicStatsSession);

  const [csv, setCsv] = useState<string>(saved?.csv || "");
  const [step, setStep] = useState<StepId>(saved?.csv ? "goal" : "data");
  const [goal, setGoal] = useState<GoalId | null>((saved?.choices?.goal as GoalId) || null);
  const [slots, setSlots] = useState<Record<string, string>>(() => {
    const { goal: _g, ...rest } = saved?.choices || {};
    return rest;
  });
  const [error, setError] = useState("");
  const [fileLabel, setFileLabel] = useState("");

  const ds: Dataset | null = useMemo(() => {
    if (!csv.trim()) return null;
    const { headers, rows } = parseCsv(csv);
    if (!headers.length || !rows.length) return null;
    return buildDataset(headers, rows);
  }, [csv]);

  const result: GoalResult | null = useMemo(() => {
    if (!ds || !goal) return null;
    try {
      return runGoal(ds, goal, slots);
    } catch {
      return null;
    }
  }, [ds, goal, slots]);

  useEffect(() => {
    if (!csv) return;
    setBasicStatsSession(SESSION_KEY, {
      moduleId: SESSION_KEY,
      moduleName: "기본통계 · 목적으로 시작하기",
      csv,
      choices: { ...slots, ...(goal ? { goal } : {}) },
      result: result ? { test: result.chosenTest, apa: result.apa } : undefined,
      updatedAt: Date.now(),
    });
  }, [csv, slots, goal, result, setBasicStatsSession]);

  useEffect(() => {
    if (result) setStep("result");
  }, [result]);

  const loadSample = useCallback((id: string) => {
    const s = STATS_PRACTICE_SETS.find((x) => x.id === id);
    if (!s) return;
    setCsv(s.csv);
    setSlots({});
    setError("");
    setFileLabel(s.title);
    setStep("goal");
  }, []);

  const onImportCsv = useCallback(
    (f: File) => {
      if (f.size > 8 * 1024 * 1024) {
        setError("파일이 8MB를 넘습니다. 필요한 열만 남겨 다시 저장한 뒤 올려 주세요.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        applyCsvFromFile(String(reader.result || ""), setCsv, setSlots, setError, setStep);
        setFileLabel(f.name);
      };
      reader.onerror = () => setError("파일을 읽지 못했습니다.");
      reader.readAsText(f, "utf-8");
    },
    [],
  );

  const onImportXlsx = useCallback(async (f: File) => {
    if (f.size > 8 * 1024 * 1024) {
      setError("파일이 8MB를 넘습니다. 필요한 열만 남겨 다시 저장한 뒤 올려 주세요.");
      return;
    }
    try {
      const text = await xlsxFileToCsv(f);
      applyCsvFromFile(text, setCsv, setSlots, setError, setStep);
      setFileLabel(f.name);
    } catch {
      setError("엑셀 파일을 읽지 못했습니다.");
    }
  }, []);

  const exportBase = fileLabel.replace(/\.[^.]+$/, "") || "기본통계";

  const onExportCsv = useCallback(() => {
    if (!csv.trim()) return;
    downloadBlob(`${exportBase}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
  }, [csv, exportBase]);

  const onExportXlsx = useCallback(() => {
    if (!csv.trim()) return;
    const sheets: { name: string; aoa: (string | number)[][] }[] = [{ name: "data", aoa: csvToAoa(csv) }];
    if (result) {
      const resultAoa: (string | number)[][] = [
        ["검정", result.chosenTest],
        ["APA", result.apa],
        [],
        ...result.keyNumbers.map((k) => [k.label, k.value]),
      ];
      sheets.push({ name: "result", aoa: resultAoa });
    }
    exportTableXlsx(`${exportBase}.xlsx`, sheets);
  }, [csv, exportBase, result]);

  const onExportPdf = useCallback(() => {
    const lines: string[] = [];
    if (ds) lines.push(`행 ${ds.n}개 · 변수 ${ds.variables.length}개`);
    if (result) {
      lines.push(result.why, `검정: ${result.chosenTest}`, result.apa);
      result.keyNumbers.slice(0, 8).forEach((k) => lines.push(`${k.label}: ${k.value}`));
    } else if (csv.trim()) {
      lines.push("결과 단계까지 진행하면 요약이 여기에 붙습니다.");
    }
    exportSimplePdf({
      filename: `${exportBase}.pdf`,
      title: "기본통계 · 분석 요약",
      lines,
    });
  }, [csv, ds, exportBase, result]);

  const chooseGoal = useCallback((g: GoalId) => {
    setGoal(g);
    setSlots({});
    setStep("vars");
  }, []);

  const done: StepId[] = [];
  if (ds) done.push("data");
  if (goal) done.push("goal");
  if (result) done.push("vars");

  const main = (
    <div>
      <PageHead
        title="기본통계 · 목적으로 시작하기"
        expert={{ label: "기법 이름으로 찾기 (Methodos 43기법)", onOpen: () => nav("basic-stats/hub") }}
      />

      <StudioGuide
        why="검정 이름을 외우지 않아도 됩니다. 알고 싶은 것(목적)을 고르면 그에 맞는 방법이 정해지고, 가정이 깨지면 대안까지 알려 드립니다."
        steps={[
          { title: "목적", body: "평균·집단 차·관련·빈도 등 무엇을 알고 싶은지 정합니다." },
          { title: "자료", body: "연습 자료 또는 내 CSV·Excel을 불러옵니다." },
          { title: "알고 싶은 것", body: "목적에 맞는 분석 유형을 고릅니다." },
          { title: "변수", body: "슬롯에 변수를 끼워 넣으면 계산이 준비됩니다." },
          { title: "결과", body: "표·그림·APA 문장과 가정 점검을 봅니다." },
        ]}
        parts={[
          { name: "연습 자료", body: "고정된 예시 표로 흐름을 익힙니다." },
          { name: "내 자료", body: "Excel·CSV를 올리거나 표를 붙여 넣습니다." },
          { name: "변수 레일", body: "왼쪽에서 유형·분포를 확인합니다." },
          { name: "가정 점검", body: "오른쪽에서 정규성 등 가정과 대안을 봅니다." },
        ]}
      />

      <Stepper steps={STEPS} current={step} done={done} onGo={(id) => setStep(id as StepId)} className="mb-4" />

      {step === "data" && (
        <section className="anim-panel space-y-3">
          <div className="card">
            <h2 className="ty-section mb-2">연습 자료로 바로 시작하기</h2>
            <p className="ty-small mb-3 text-ink-2 prose-w">
              아래 연습 자료는 모두 고정된 값이라 언제 열어도 같은 결과가 나옵니다. 내 자료를 올리기 전에 목적별 흐름을 익히는 데 쓰세요.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {STATS_PRACTICE_SETS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="rounded-2xl p-3 text-left"
                  style={{ border: "1px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}
                  onClick={() => loadSample(s.id)}
                >
                  <div className="text-[12.5px] font-semibold">{s.title}</div>
                  <p className="mt-1 text-[10.5px] text-ink-3">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="ty-section mb-2">내 자료 올리기</h2>
            <p className="ty-small mb-3 text-ink-2 prose-w">
              첫 줄이 변수 이름인 표이면 됩니다. CSV·Excel 모두 지원합니다. 올린 자료는 브라우저 안에서만 처리되고 서버로 전송되지 않습니다.
            </p>
            <IoToolbar
              onImportCsv={onImportCsv}
              onImportXlsx={onImportXlsx}
              onExportCsv={onExportCsv}
              onExportXlsx={onExportXlsx}
              onExportPdf={onExportPdf}
              fileLabel={fileLabel || undefined}
              disabledExport={!csv.trim()}
            />
            <label className="ty-label mt-3 block font-bold" htmlFor="csv-paste">
              또는 표를 그대로 붙여넣기
            </label>
            <textarea
              id="csv-paste"
              className="inp mt-1 font-mono"
              rows={6}
              placeholder={"ID,집단,점수\n1,대면,62\n2,온라인,55"}
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setSlots({});
                setFileLabel("");
              }}
            />
            {error ? (
              <Note level="risk" className="mt-3" title="자료를 읽지 못했습니다" fix="첫 줄에 변수 이름이 있고, 값이 쉼표로 구분되어 있는지 확인해 주세요.">
                {error}
              </Note>
            ) : null}
            {ds ? (
              <Note level="ok" className="mt-3" title="자료를 읽었습니다">
                행 {ds.n}개 · 변수 {ds.variables.length}개를 인식했습니다. 왼쪽 목록에서 각 변수의 유형과 분포를 확인한 뒤 다음 단계로 넘어가세요.
              </Note>
            ) : null}
            {ds ? (
              <button type="button" className="btn btn-primary mt-3" onClick={() => setStep("goal")}>
                다음 — 알고 싶은 것 고르기 →
              </button>
            ) : null}
          </div>
        </section>
      )}

      {step === "goal" && ds && (
        <section className="anim-panel">
          <GoalPicker ds={ds} value={goal} onChange={chooseGoal} />
        </section>
      )}

      {step === "vars" && ds && goal && (
        <section className="anim-panel">
          <div className="card">
            <h2 className="ty-section mb-1">{GOAL_BY_ID[goal].label}</h2>
            <VariableSlots ds={ds} goal={goal} chosen={slots} onChange={setSlots} />
          </div>
        </section>
      )}

      {step === "result" && (
        <section className="anim-panel">
          <ResultPanel result={result} />
        </section>
      )}

      {!ds && step !== "data" && (
        <Note level="info" title="먼저 자료가 필요합니다" action={<button type="button" className="btn btn-sm btn-primary" onClick={() => setStep("data")}>자료 단계로</button>}>
          연습 자료를 불러오거나 CSV를 올리면 나머지 단계가 열립니다.
        </Note>
      )}
    </div>
  );

  return (
    <Workspace
      rail={ds ? <VariableList ds={ds} used={Object.values(slots).filter(Boolean)} /> : <p className="ty-small text-ink-3">자료를 불러오면 변수 목록이 나타납니다.</p>}
      railTitle="변수"
      main={main}
      inspector={
        result ? (
          <AssumptionPanel items={result.assumptions} />
        ) : (
          <div className="card">
            <h2 className="ty-subhead mb-1">가정 점검</h2>
            <p className="ty-small text-ink-3">
              결과가 나오면 이 자리에서 가정이 지켜졌는지, 어겼다면 무엇으로 갈아타야 하는지 알려 드립니다.
            </p>
          </div>
        )
      }
      inspectorTitle="가정 점검"
      statusbar={
        <>
          <span>모든 계산은 브라우저에서 수행되며 자료가 외부로 전송되지 않습니다.</span>
          {ds ? <span>행 <strong className="num">{ds.n}</strong> · 변수 <strong className="num">{ds.variables.length}</strong></span> : null}
          {result ? <span>사용한 검정 · {result.chosenTest}</span> : null}
        </>
      }
    />
  );
}
