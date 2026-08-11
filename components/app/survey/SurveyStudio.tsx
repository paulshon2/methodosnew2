"use client";
/**
 * 설문 만들기
 *
 * 답하는 질문: "응답자는 이 설문을 어떻게 보게 되는가?"
 * 그래서 미리보기 창을 따로 두지 않는다. 같은 화면에서 편집과 응답자 보기를 오간다.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import Inspector from "@/components/ui/Inspector";
import Note from "@/components/ui/Note";
import PageHead from "@/components/ui/PageHead";
import Segmented from "@/components/ui/Segmented";
import Stepper from "@/components/ui/Stepper";
import StudioGuide, { IoToolbar } from "@/components/ui/StudioGuide";
import Workspace from "@/components/ui/Workspace";
import { useDeferredValidation } from "@/hooks/useDeferredValidation";
import { useKeyboard } from "@/hooks/useKeyboard";
import { auditSurvey, canDeploy } from "@/lib/survey-quality";
import { materializeExample, type SurveyExample } from "@/lib/survey-examples";
import {
  formatDuration,
  newId,
  newQuestion,
  parseSurvey,
  totalSeconds,
  type QType,
  type Question,
  type Survey,
} from "@/lib/survey-types";
import { downloadBlob, exportSimplePdf, exportTableXlsx } from "@/lib/viz-export";
import { useStore } from "@/store/app-store";
import DisplayLogic from "./DisplayLogic";
import QualityPanel from "./QualityPanel";
import QuestionOutline from "./QuestionOutline";
import QuestionPalette from "./QuestionPalette";
import QuestionProps from "./QuestionProps";
import SurveyAiAssist from "./SurveyAiAssist";
import SurveyPaper from "./SurveyPaper";

const STEPS = [
  { id: "design", label: "설문 설계", sub: "무엇을 왜 묻는가" },
  { id: "write", label: "문항 작성", sub: "응답자 화면 그대로" },
  { id: "logic", label: "흐름·로직", sub: "누구에게 무엇을" },
  { id: "review", label: "검토·배포", sub: "품질 점검" },
];

const EMPTY: Survey = { title: "", desc: "", questions: [] };

const Q_HEADERS = ["id", "type", "text", "required", "help", "options", "rows", "points", "lo", "hi", "cond_q", "cond_v"];

function surveyToAoa(s: Survey): (string | number)[][] {
  return [
    ["title", s.title],
    ["desc", s.desc],
    [],
    Q_HEADERS,
    ...s.questions.map((q) => [
      q.id,
      q.type,
      q.text,
      q.required ? "1" : "0",
      q.help,
      (q.options || []).join("|"),
      (q.rows || []).join("|"),
      q.points ?? "",
      q.lo ?? "",
      q.hi ?? "",
      q.cond?.q ?? "",
      q.cond?.v ?? "",
    ]),
  ];
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function surveyToCsv(s: Survey): string {
  return "\ufeff" + surveyToAoa(s).map((row) => row.map(csvEscape).join(",")).join("\n");
}

function parseCsvRows(text: string): string[][] {
  const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter((l) => l.length > 0);
  return lines.map((line) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  });
}

function splitPipe(s: string): string[] | undefined {
  const t = s.trim();
  if (!t) return undefined;
  return t.split("|").map((x) => x.trim()).filter(Boolean);
}

function aoaToSurvey(rows: (string | number)[][]): Survey | null {
  let title = "";
  let desc = "";
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r?.length) continue;
    const k = String(r[0] ?? "").trim().toLowerCase();
    if (k === "title" && r.length >= 2) title = String(r[1] ?? "");
    else if (k === "desc" && r.length >= 2) desc = String(r[1] ?? "");
    else if (headerIdx < 0) {
      const lower = r.map((c) => String(c ?? "").trim().toLowerCase());
      if (lower.includes("type") && lower.includes("text")) headerIdx = i;
    }
  }
  if (headerIdx < 0) return null;
  const header = rows[headerIdx].map((h) => String(h ?? "").trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const questions: Question[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const text = String(row[col("text")] ?? "").trim();
    if (!text) continue;
    const type = String(row[col("type")] ?? "single").trim() as QType;
    const reqRaw = String(row[col("required")] ?? "0").trim();
    const pointsRaw = String(row[col("points")] ?? "").trim();
    const pts = pointsRaw ? (Number(pointsRaw) as 4 | 5 | 6 | 7) : undefined;
    const cq = String(row[col("cond_q")] ?? "").trim();
    const cv = String(row[col("cond_v")] ?? "").trim();
    questions.push({
      id: String(row[col("id")] ?? "").trim() || newId(),
      type,
      text,
      required: reqRaw === "1" || reqRaw.toLowerCase() === "true" || reqRaw === "yes",
      help: String(row[col("help")] ?? "").trim(),
      options: splitPipe(String(row[col("options")] ?? "")),
      rows: splitPipe(String(row[col("rows")] ?? "")),
      points: pts && [4, 5, 6, 7].includes(pts) ? pts : undefined,
      lo: String(row[col("lo")] ?? "").trim() || undefined,
      hi: String(row[col("hi")] ?? "").trim() || undefined,
      cond: cq && cv ? { q: cq, v: cv } : null,
    });
  }
  const parsed = parseSurvey({ title, desc, questions });
  return parsed ?? { title, desc, questions };
}

function parseSurveyImportText(text: string): Survey | null {
  const trimmed = text.replace(/^\ufeff/, "").trim();
  if (trimmed.startsWith("{")) {
    try {
      return parseSurvey(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }
  return aoaToSurvey(parseCsvRows(trimmed));
}

async function readXlsxFirstSheet(f: File): Promise<(string | number)[][]> {
  const buf = await f.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: "" }) as (string | number)[][];
}

export default function SurveyStudio({ nav }: { nav: (r: string) => void }) {
  const saved = useStore((s) => s.menuArtifacts?.survey);
  const setSurveySession = useStore((s) => s.setSurveySession);

  const [survey, setSurvey] = useState<Survey>(() => parseSurvey(saved?.paper) || EMPTY);
  const [step, setStep] = useState("design");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [sel, setSel] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState("");

  // 품질 점검은 입력이 멈춘 뒤에 돌린다 — 타이핑 중 화면이 흔들리지 않게.
  const issues = useDeferredValidation(survey, auditSurvey, 260);
  const preview = mode === "preview";
  const selected = useMemo(() => survey.questions.find((q) => q.id === sel) ?? null, [survey, sel]);

  useEffect(() => {
    setSurveySession({ ...(saved || {}), paper: survey, updatedAt: Date.now() });
    // saved를 의존성에 넣으면 자기 자신이 만든 갱신에 다시 반응한다.
  }, [survey, setSurveySession]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = useCallback((t: QType) => {
    const q = newQuestion(t);
    setSurvey((s) => ({ ...s, questions: [...s.questions, q] }));
    setSel(q.id);
    setStep("write");
  }, []);

  const addExample = useCallback((ex: SurveyExample) => {
    const q = materializeExample(ex);
    setSurvey((s) => ({ ...s, questions: [...s.questions, q] }));
    setSel(q.id);
    setStep("write");
    setMode("preview");
  }, []);

  const duplicate = useCallback((id: string) => {
    setSurvey((s) => {
      const i = s.questions.findIndex((q) => q.id === id);
      if (i < 0) return s;
      const copy = { ...s.questions[i], id: newId() };
      const next = [...s.questions];
      next.splice(i + 1, 0, copy);
      return { ...s, questions: next };
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSurvey((s) => ({
      ...s,
      // 지운 문항을 조건으로 쓰던 문항은 조건을 함께 지운다. 남겨 두면 영원히 숨겨진다.
      questions: s.questions.filter((q) => q.id !== id).map((q) => (q.cond?.q === id ? { ...q, cond: null } : q)),
    }));
    setSel((cur) => (cur === id ? null : cur));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setSurvey((s) => {
      const next = [...s.questions];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...s, questions: next };
    });
  }, []);

  const moveSelected = useCallback(
    (delta: number) => {
      if (!sel) return;
      setSurvey((s) => {
        const i = s.questions.findIndex((q) => q.id === sel);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= s.questions.length) return s;
        const next = [...s.questions];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...s, questions: next };
      });
    },
    [sel],
  );

  // 입력 중에는 훅이 조합키 없는 단축키를 이미 걸러 준다.
  useKeyboard({
    "ctrl+d": (e) => {
      if (!sel) return;
      e.preventDefault();
      duplicate(sel);
    },
    "alt+ArrowUp": (e) => {
      e.preventDefault();
      moveSelected(-1);
    },
    "alt+ArrowDown": (e) => {
      e.preventDefault();
      moveSelected(1);
    },
    Delete: () => {
      if (sel) remove(sel);
    },
  });

  const goTo = useCallback((id: string) => {
    setSel(id);
    setMode("edit");
    document.getElementById(`q-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(survey, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${survey.title || "설문"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const baseName = (survey.title || "설문").replace(/[\\/:*?"<>|]/g, "_");

  const applyImported = useCallback((next: Survey | null, label: string) => {
    if (!next) return;
    setSurvey(next);
    setFileLabel(label);
    setSel(next.questions[0]?.id ?? null);
    setStep(next.questions.length ? "write" : "design");
  }, []);

  const onImportCsv = useCallback(
    (f: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const next = parseSurveyImportText(String(reader.result || ""));
        if (next) applyImported(next, f.name);
      };
      reader.readAsText(f, "utf-8");
    },
    [applyImported],
  );

  const onImportXlsx = useCallback(
    async (f: File) => {
      try {
        const rows = await readXlsxFirstSheet(f);
        if (rows.length === 1 && rows[0]?.length === 1) {
          try {
            const j = parseSurvey(JSON.parse(String(rows[0][0])));
            if (j) {
              applyImported(j, f.name);
              return;
            }
          } catch {
            /* fall through */
          }
        }
        const next = aoaToSurvey(rows);
        if (next) applyImported(next, f.name);
      } catch {
        /* ignore */
      }
    },
    [applyImported],
  );

  const onExportCsv = useCallback(() => {
    downloadBlob(`${baseName}.csv`, surveyToCsv(survey), "text/csv;charset=utf-8");
  }, [baseName, survey]);

  const onExportXlsx = useCallback(() => {
    exportTableXlsx(`${baseName}.xlsx`, [{ name: "설문", aoa: surveyToAoa(survey) }]);
  }, [baseName, survey]);

  const onExportPdf = useCallback(() => {
    const lines = [
      survey.desc || "(안내문 없음)",
      "",
      `문항 ${survey.questions.length}개 · 예상 ${formatDuration(totalSeconds(survey))}`,
      ...survey.questions.map((q, i) => `${i + 1}. [${q.type}] ${q.text}`),
    ];
    exportSimplePdf({ filename: `${baseName}.pdf`, title: survey.title || "설문", lines });
  }, [baseName, survey]);

  const deployable = canDeploy(issues);

  const main = (
    <div>
      <PageHead
        title="설문 만들기"
        expert={{ label: "문항 은행·AI 검토", onOpen: () => nav("tools/survey/classic") }}
        right={
          <Segmented<"edit" | "preview">
            label="편집 · 응답자 화면 전환"
            value={mode}
            onChange={setMode}
            options={[
              { id: "edit", label: "편집", hint: "문구와 보기를 고칩니다" },
              { id: "preview", label: "응답자 화면", hint: "실제로 답해 보며 조건을 확인합니다" },
            ]}
          />
        }
      />

      <StudioGuide
        why="응답자가 실제로 보게 될 화면을 그대로 편집합니다. 미리보기 창을 따로 두지 않는 이유는, 같은 내용을 두 곳에서 보여 주면 어느 쪽이 진짜인지 매번 확인해야 하기 때문입니다."
        steps={[
          { title: "설문 설계", body: "목적·대상·분석 계획을 정하고 안내문(제목·설명)을 씁니다." },
          { title: "문항 작성", body: "유형별 문항을 추가하고 응답자 화면으로 바꿔 답해 봅니다." },
          { title: "흐름·로직", body: "앞 문항의 답에 따라 보일 문항(표시 조건)을 연결합니다." },
          { title: "검토·배포", body: "품질 점검을 통과한 뒤 배포하거나 파일로 내보냅니다." },
        ]}
        parts={[
          { name: "문항 추가", body: "왼쪽에서 유형을 고르면 문항이 추가됩니다." },
          { name: "목차", body: "문항 순서를 드래그하거나 선택해 이동합니다." },
          { name: "속성", body: "오른쪽에서 문구·필수·보기·척도를 고칩니다." },
          { name: "표시 조건", body: "특정 답을 골랐을 때만 이 문항을 보이게 합니다." },
          { name: "품질 점검", body: "빈 문항·모순·과도한 길이 등을 자동으로 짚어 줍니다." },
          { name: "불러오기·내보내기", body: "아래 도구로 Excel·CSV·PDF로 설문을 주고받습니다." },
        ]}
      />

      <Stepper steps={STEPS} current={step} done={survey.questions.length ? ["design"] : []} onGo={setStep} className="mb-4" />

      {step === "design" && (
        <>
          <section className="anim-panel card mb-3">
            <h2 className="ty-section mb-2">먼저 정할 것</h2>
            <ul className="ty-body space-y-1.5 text-ink-2 prose-w">
              <li>· 이 설문으로 답하려는 질문은 무엇입니까. 그 질문에 쓰이지 않을 문항은 넣지 않습니다.</li>
              <li>· 각 문항은 나중에 어떤 분석에 쓰입니까. 유형을 고를 때 척도가 함께 정해집니다.</li>
              <li>· 안내문에는 목적·소요시간·익명성·연락처를 적습니다. 이 넷이 응답률을 가장 크게 좌우합니다.</li>
            </ul>
            <button type="button" className="btn btn-primary mt-3" onClick={() => setStep("write")}>
              문항 작성으로 →
            </button>
          </section>
          <SurveyAiAssist
            survey={survey}
            mode="design"
            onApply={(next) => {
              setSurvey(next);
              setSel(next.questions[0]?.id ?? null);
              setStep("write");
            }}
            onAppendExample={addExample}
          />
        </>
      )}

      {step === "write" && (
        <SurveyAiAssist survey={survey} mode="write" onApply={setSurvey} onAppendExample={addExample} />
      )}

      {step === "logic" && (
        <>
          <Note level="info" className="mb-3" title="흐름·로직 단계">
            오른쪽 &lsquo;표시 조건&rsquo; 탭에서 앞 문항의 답에 따라 이 문항을 보일지 정합니다. 조건을 건 뒤에는 위에서 &lsquo;응답자 화면&rsquo;으로 바꿔 실제로 답해 보세요.
          </Note>
          <SurveyAiAssist
            survey={survey}
            mode="logic"
            onApply={(next) => {
              setSurvey(next);
              setMode("preview");
            }}
            onAppendExample={addExample}
          />
        </>
      )}

      {step === "review" && (
        <section className="anim-panel card mb-3">
          <h2 className="ty-section mb-2">검토 · 배포</h2>
          <p className="ty-small mb-3 text-ink-2 prose-w">
            예상 응답시간은 <strong className="num">{formatDuration(totalSeconds(survey))}</strong>입니다.
            꼭 고쳐야 할 항목이 하나라도 남아 있으면 배포할 수 없습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={!deployable}>
              배포하기
            </button>
            <button type="button" className="btn" onClick={exportJson}>
              <Download size={15} aria-hidden="true" /> 설문 내려받기 (JSON)
            </button>
          </div>
          {!deployable && (
            <p className="ty-small mt-2" style={{ color: "var(--danger)" }}>
              오른쪽 품질 점검에서 빨간 항목을 눌러 해당 문항으로 이동해 고치세요.
            </p>
          )}
        </section>
      )}

      <SurveyPaper
        survey={survey}
        preview={preview}
        selected={sel}
        issues={issues}
        onChange={setSurvey}
        onSelect={setSel}
        onDuplicate={duplicate}
        onDelete={remove}
      />

      <IoToolbar
        onImportCsv={onImportCsv}
        onImportXlsx={onImportXlsx}
        onExportCsv={onExportCsv}
        onExportXlsx={onExportXlsx}
        onExportPdf={onExportPdf}
        fileLabel={fileLabel || undefined}
        disabledExport={!survey.questions.length && !survey.title.trim()}
      />
    </div>
  );

  return (
    <Workspace
      rail={
        <div className="space-y-4">
          <div>
            <h3 className="ty-label mb-2 font-bold">문항 추가</h3>
            <QuestionPalette onAdd={add} onAddExample={addExample} />
          </div>
          <div>
            <h3 className="ty-label mb-2 font-bold">목차</h3>
            <QuestionOutline survey={survey} selected={sel} issues={issues} onSelect={goTo} onMove={move} />
          </div>
        </div>
      }
      railTitle="문항"
      main={main}
      inspector={
        <Inspector
          tabs={[
            { id: "props", label: "속성", content: <QuestionProps q={selected} onChange={(q) => setSurvey((s) => ({ ...s, questions: s.questions.map((x) => (x.id === q.id ? q : x)) }))} /> },
            { id: "logic", label: "표시 조건", content: <DisplayLogic survey={survey} q={selected} onChange={(q) => setSurvey((s) => ({ ...s, questions: s.questions.map((x) => (x.id === q.id ? q : x)) }))} /> },
            { id: "quality", label: "품질 점검", content: <QualityPanel survey={survey} issues={issues} onGo={goTo} /> },
          ]}
        />
      }
      inspectorTitle="문항 설정"
      statusbar={
        <>
          <span>
            문항 <strong className="num">{survey.questions.length}</strong>개 · 예상 <strong className="num">{formatDuration(totalSeconds(survey))}</strong>
          </span>
          <span>점검 <strong className="num">{issues.length}</strong>건</span>
          <span className="text-ink-3">Ctrl+D 복제 · Alt+↑↓ 순서 이동 · Delete 삭제</span>
        </>
      }
    />
  );
}
