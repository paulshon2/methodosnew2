"use client";
/** 추가-7 【실연구 예시 삽입】 — 요약↔작업표 연결 · 간략기입 · AI 작업표 작성 · 상세 AI작성안 */
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { V61WorkedExample } from "@/lib/method-catalog";
import { aiComplete } from "@/lib/engine";
import { useStore } from "@/store/app-store";
import AiProgressBar from "@/components/app/ai-progress-bar";
import { downloadBlob, exportSimplePdf, exportTableXlsx } from "@/lib/viz-export";
import type { ProgressEvent } from "@/lib/coding-standards";
import * as XLSX from "xlsx";

/** AI 응답이 null/undefined일 때 화면에 "null" 문자열이 나오지 않게 한다. */
function normalizeAiText(text: string | null | undefined, fallback: string): string {
  if (text == null) return fallback;
  const s = typeof text === "string" ? text : String(text);
  if (!s.trim() || s.trim().toLowerCase() === "null" || s.trim().toLowerCase() === "undefined") {
    return fallback;
  }
  return s;
}

const NO_AI =
  "AI 응답이 비어 있습니다. 설정에서 API 키를 확인한 뒤 다시 요청하세요.";

/** 다른 메뉴와 동일하게 store settings(키·공급자·모델)를 넘긴다. */
function useAiSettings(maxTokens?: number) {
  const settings = useStore((s) => s.settings);
  return useMemo(
    () => ({
      ...(settings || {}),
      preferErrorText: true as const,
      ...(maxTokens != null ? { maxTokens } : {}),
    }),
    [settings, maxTokens]
  );
}

async function callAi(prompt: string, settings: Record<string, unknown>): Promise<string> {
  const text = await aiComplete(prompt, settings);
  return normalizeAiText(text, NO_AI);
}

function parseDelimited(text: string): { headers: string[]; rows: string[][] } | null {
  const src = String(text || "").trim();
  if (!src) return null;
  const lines = src
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const cells = lines.map((line) => line.split(sep).map((x) => x.trim()));
  if (cells[0].length < 2) return null;
  return { headers: cells[0], rows: cells.slice(1) };
}

function asOneColTable(title: string, text: string): { headers: string[]; rows: string[][] } {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return { headers: [title], rows: lines.length ? lines.map((line) => [line]) : [["(비어 있음)"]] };
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
          return s;
        })
        .join(",")
    )
    .join("\n");
}

function exportTableSet(base: string, title: string, headers: string[], rows: string[][], mode: "xlsx" | "csv" | "pdf") {
  if (mode === "xlsx") {
    exportTableXlsx(`${base}.xlsx`, [{ name: "sheet1", aoa: [headers, ...rows] }]);
    return;
  }
  if (mode === "csv") {
    const csv = toCsv([headers, ...rows]);
    downloadBlob(`${base}.csv`, csv, "text/csv;charset=utf-8");
    return;
  }
  const lines = [headers.join(" | "), ...rows.slice(0, 120).map((r) => r.join(" | "))];
  exportSimplePdf({ filename: `${base}.pdf`, title, lines });
}

function DataTable({
  headers,
  rows,
  compact,
}: {
  headers: string[];
  rows: string[][];
  compact?: boolean;
}) {
  return (
    <div className="overflow-auto max-h-[480px] border border-[var(--color-border-tertiary)] rounded-md">
      <table className="w-full border-collapse" style={{ fontSize: compact ? "12.5px" : "13px" }}>
        <thead>
          <tr style={{ background: "var(--color-background-secondary)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left font-semibold px-2 py-1.5 whitespace-nowrap border-b border-[var(--color-border-tertiary)] sticky top-0"
                style={{ background: "var(--color-background-secondary)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="odd:bg-transparent even:bg-[rgba(0,0,0,0.015)]">
              {headers.map((_, ci) => (
                <td key={ci} className="px-2 py-1 align-top whitespace-pre-wrap border-b border-[var(--color-border-tertiary)]">
                  {r[ci] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Accordion({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-md border border-[var(--color-border-tertiary)] mb-2">
      <button
        type="button"
        className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-[13.5px] font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="flex-1">{title}</span>
      </button>
      {open ? <div className="px-3 pb-3">{children}</div> : null}
    </div>
  );
}

function BriefAiAndSheetForm({
  example,
  methodLabel,
  taskName,
}: {
  example: V61WorkedExample;
  methodLabel: string;
  taskName: string;
}) {
  const aiSettings = useAiSettings(2048);
  const sheetSettings = useAiSettings(8192);
  const headers = example.workSheet?.headers || [];
  const [topic, setTopic] = useState(example.topic || "");
  const [goal, setGoal] = useState("아래 열 구조의 실제 작업표를 연구 주제에 맞게 채운다");
  const [notes, setNotes] = useState("");
  const [briefLocked, setBriefLocked] = useState(false);
  const [busy, setBusy] = useState<"fillBrief" | "brief" | "sheet" | null>(null);
  const [briefOut, setBriefOut] = useState("");
  const [sheetOut, setSheetOut] = useState("");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);

  const sample = useMemo(
    () =>
      (example.workSheet?.rows || [])
        .slice(0, 3)
        .map((r) => headers.map((h, i) => `${h}=${r[i] ?? ""}`).join(" | "))
        .join("\n"),
    [example.workSheet, headers]
  );

  const fillBriefFields = async () => {
    setBusy("fillBrief");
    setProgress({ phase: "간략 기입란 AI 작성 시작", percent: 8 });
    try {
      const prompt = [
        `너는 ${methodLabel} 조교다. JSON만 출력하라(다른 문장 금지).`,
        `Task: ${taskName}`,
        `실제 작업표 열: ${headers.join(" · ")}`,
        `현재 주제 힌트: ${topic || example.topic || "(없음)"}`,
        `형식: {"topic":"연구 주제 한 줄","goal":"이 표로 남길 것(목표)","notes":"메모(선택)"}`,
        `규칙: topic은 장소·사람·문제를 한 줄. goal은 열 구조 실제 작업표를 채운다는 뜻으로. notes는 짧게(없으면 빈 문자열).`,
      ].join("\n");
      setProgress({ phase: "간략 기입란 생성 중", percent: 45, note: "AI가 짧은 JSON을 작성하고 있습니다." });
      const raw = await callAi(prompt, aiSettings);
      setProgress({ phase: "응답 파싱 중", percent: 82 });
      if (raw.startsWith("AI API 키가 없습니다") || raw.startsWith("AI 호출 실패") || raw.startsWith("AI(")) {
        setBriefOut(raw);
        return;
      }
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const j = JSON.parse(m[0]) as { topic?: string; goal?: string; notes?: string };
          if (j.topic) setTopic(String(j.topic));
          if (j.goal) setGoal(String(j.goal));
          if (j.notes != null) setNotes(String(j.notes));
          setBriefLocked(true);
          setBriefOut("간략 기입란을 AI로 채웠습니다. 내용을 바꾸려면 「수정」을 누르세요.");
          setProgress({ phase: "간략 기입란 완료", percent: 100 });
          return;
        } catch {
          /* fall through */
        }
      }
      setBriefOut("간략 기입란 JSON을 해석하지 못했습니다. 다시 시도하거나 「수정」 후 직접 입력하세요.\n\n" + raw.slice(0, 500));
    } catch (e) {
      setBriefOut(String(e));
      setProgress({ phase: "간략 기입란 실패", percent: 100, note: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const runBrief = async () => {
    setBusy("brief");
    setProgress({ phase: "간략 안내 요청 시작", percent: 10 });
    try {
      const prompt = [
        `너는 ${methodLabel} 조교다. 중학생도 이해하게 짧게 답하라.`,
        `Task: ${taskName}`,
        `연구 주제: ${topic}`,
        `목표: ${goal}`,
        `메모: ${notes || "(없음)"}`,
        `실제 작업표 열: ${headers.join(" · ")}`,
        `할 일: 이 Task에서 무엇을 확인하고, 실제 작업표에 무엇을 어떻게 적을지 5줄 이내로 안내하라.`,
      ].join("\n");
      setProgress({ phase: "간략 안내 생성 중", percent: 60 });
      setBriefOut(await callAi(prompt, aiSettings));
      setProgress({ phase: "간략 안내 완료", percent: 100 });
    } catch (e) {
      setBriefOut(String(e));
      setProgress({ phase: "간략 안내 실패", percent: 100, note: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const runSheet = async () => {
    setBusy("sheet");
    setProgress({ phase: "실제 작업표 초안 요청 시작", percent: 10 });
    try {
      const prompt = [
        `너는 ${methodLabel} 조교다.`,
        `Task「${taskName}」의 실제 작업표를 작성한다.`,
        `연구 주제: ${topic}`,
        `추가 메모: ${notes || "(없음)"}`,
        `열(고정, 이 순서만): ${headers.join(" | ")}`,
        `표본 3행:`,
        sample,
        `출력 규칙: TSV. 첫 행=열 이름. 이후 최소 50행. 다른 열·요약 표·설명 문단 금지. 빈칸은 "?"로.`,
      ].join("\n");
      setProgress({ phase: "실제 작업표(50행+) 생성 중", percent: 65, note: "긴 출력은 시간이 더 걸릴 수 있습니다." });
      setSheetOut(await callAi(prompt, sheetSettings));
      setProgress({ phase: "실제 작업표 초안 완료", percent: 100 });
    } catch (e) {
      setSheetOut(String(e));
      setProgress({ phase: "실제 작업표 초안 실패", percent: 100, note: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const briefTable = useMemo(() => asOneColTable("간략 안내", briefOut), [briefOut]);
  const sheetTable = useMemo(() => parseDelimited(sheetOut) || asOneColTable("AI가 채운 실제 작업표(초안)", sheetOut), [sheetOut]);

  return (
    <div className="rounded-md border border-[var(--color-border-tertiary)] p-3 mb-3 space-y-2.5">
      <AiProgressBar progress={progress} label="실제작업표 AI 작업상태" compact hideOnDone />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13.5px] font-semibold">간략 기입란 · 실제 작업표 AI 작성</div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-sm" disabled={!!busy} onClick={fillBriefFields}>
            {busy === "fillBrief" ? "채우는 중…" : "간략 기입란 AI로 채우기"}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={!briefLocked}
            onClick={() => setBriefLocked(false)}
            title="AI가 채운 뒤 직접 고칠 때"
          >
            수정
          </button>
        </div>
      </div>
      <p className="text-[12.5px] text-ink-2 leading-relaxed">
        아래는 짧은 칸만 채우는 간편 모드입니다. 자세한 열별 기입은 맨 아래 「AI 초안 요청」을 쓰세요.
      </p>
      <label className="block">
        <div className="text-[12.5px] font-semibold mb-0.5">연구 주제 한 줄</div>
        <textarea
          className="inp w-full min-h-[44px] text-[13px]"
          value={topic}
          disabled={briefLocked}
          onChange={(e) => setTopic(e.target.value)}
        />
      </label>
      <label className="block">
        <div className="text-[12.5px] font-semibold mb-0.5">이 표로 남길 것(목표)</div>
        <textarea
          className="inp w-full min-h-[44px] text-[13px]"
          value={goal}
          disabled={briefLocked}
          onChange={(e) => setGoal(e.target.value)}
        />
      </label>
      <label className="block">
        <div className="text-[12.5px] font-semibold mb-0.5">메모(선택)</div>
        <textarea
          className="inp w-full min-h-[44px] text-[13px]"
          placeholder="알고 있는 파일 이름, Fail이 난 칸, 꼭 넣을 예시 등"
          value={notes}
          disabled={briefLocked}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-2">
        <button type="button" className="btn w-full" disabled={!!busy} onClick={runBrief}>
          {busy === "brief" ? "안내 작성 중…" : "간략 안내 요청"}
        </button>
        <button type="button" className="btn btn-primary w-full" disabled={!!busy || headers.length === 0} onClick={runSheet}>
          {busy === "sheet" ? "작업표 작성 중…" : "실제 작업표 AI로 채우기"}
        </button>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-[12px] font-semibold">간략 안내</div>
          <div className="flex gap-1.5">
            <button type="button" className="btn btn-sm" disabled={!briefOut} onClick={() => exportTableSet(`brief-guide-${Date.now()}`, "간략 안내", briefTable.headers, briefTable.rows, "xlsx")}>엑셀 내보내기</button>
            <button type="button" className="btn btn-sm" disabled={!briefOut} onClick={() => exportTableSet(`brief-guide-${Date.now()}`, "간략 안내", briefTable.headers, briefTable.rows, "csv")}>CSV 내보내기</button>
            <button type="button" className="btn btn-sm" disabled={!briefOut} onClick={() => exportTableSet(`brief-guide-${Date.now()}`, "간략 안내", briefTable.headers, briefTable.rows, "pdf")}>PDF 내보내기</button>
          </div>
        </div>
        {briefOut ? (
          <DataTable headers={briefTable.headers} rows={briefTable.rows} compact />
        ) : (
          <p className="text-[12px] text-ink-3">아직 안내가 없습니다. 「간략 안내 요청」을 누르면 여기에 표시됩니다.</p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-[12px] font-semibold">AI가 채운 실제 작업표(초안)</div>
          <div className="flex gap-1.5">
            <button type="button" className="btn btn-sm" disabled={!sheetOut} onClick={() => exportTableSet(`ai-sheet-draft-${Date.now()}`, "AI가 채운 실제 작업표(초안)", sheetTable.headers, sheetTable.rows, "xlsx")}>엑셀 내보내기</button>
            <button type="button" className="btn btn-sm" disabled={!sheetOut} onClick={() => exportTableSet(`ai-sheet-draft-${Date.now()}`, "AI가 채운 실제 작업표(초안)", sheetTable.headers, sheetTable.rows, "csv")}>CSV 내보내기</button>
            <button type="button" className="btn btn-sm" disabled={!sheetOut} onClick={() => exportTableSet(`ai-sheet-draft-${Date.now()}`, "AI가 채운 실제 작업표(초안)", sheetTable.headers, sheetTable.rows, "pdf")}>PDF 내보내기</button>
          </div>
        </div>
        {sheetOut ? (
          <DataTable headers={sheetTable.headers} rows={sheetTable.rows} compact />
        ) : (
          <p className="text-[12px] text-ink-3">아직 초안이 없습니다. 「실제 작업표 AI로 채우기」를 누르면 여기에 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}

function AiPlanForm({
  example,
  methodLabel,
  taskName,
  hasNextTask,
  onNextTask,
}: {
  example: V61WorkedExample;
  methodLabel: string;
  taskName: string;
  hasNextTask?: boolean;
  onNextTask?: (() => void) | null;
}) {
  const aiSettings = useAiSettings(4096);
  const draftSettings = useAiSettings(8192);
  const fields = example.aiPlan?.fields || [];
  const headers = example.workSheet?.headers || [];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      init[f.item] = f.researcherFill || (f.item.includes("연구 주제") ? example.topic || "" : "");
    });
    return init;
  });
  const [detailLocked, setDetailLocked] = useState(false);
  const [busy, setBusy] = useState<"fillDetail" | "draft" | null>(null);
  const [out, setOut] = useState("");
  const [fillMsg, setFillMsg] = useState("");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importMode, setImportMode] = useState<"xlsx" | "csv" | "pdf">("xlsx");

  const sampleRows = useMemo(() => (example.workSheet?.rows || []).slice(0, 3), [example.workSheet]);

  const fillDetailFields = async () => {
    setBusy("fillDetail");
    setFillMsg("");
    setProgress({ phase: "열별 상세 기입란 AI 작성 시작", percent: 10 });
    try {
      const items = fields.map((f) => f.item).join("\n");
      const prompt = [
        `너는 ${methodLabel} 조교다. JSON 객체만 출력하라(키=기입 항목명, 값=연구자 기입 초안).`,
        `Task: ${taskName}`,
        `연구 주제 힌트: ${example.topic || values["연구 주제 한 줄(공통)"] || ""}`,
        `실제 작업표 열: ${headers.join(" · ")}`,
        `채울 항목 목록:`,
        items,
        `규칙: 각 값은 한 줄~짧게. AI요청문(열 고정) 항목은 열 목록을 포함한 지시문으로. 빈 값 금지(모르면 "?").`,
      ].join("\n");
      setProgress({ phase: "열별 상세 기입란 생성 중", percent: 65 });
      const raw = await callAi(prompt, aiSettings);
      if (raw.startsWith("AI API 키가 없습니다") || raw.startsWith("AI 호출 실패") || raw.startsWith("AI(")) {
        setFillMsg(raw);
        setProgress({ phase: "열별 상세 기입란 실패", percent: 100, note: raw });
        return;
      }
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const j = JSON.parse(m[0]) as Record<string, unknown>;
          const next: Record<string, string> = { ...values };
          fields.forEach((f) => {
            const v = j[f.item];
            if (v != null && String(v).trim() && String(v).toLowerCase() !== "null") {
              next[f.item] = String(v);
            }
          });
          setValues(next);
          setDetailLocked(true);
          setFillMsg("열별 상세 기입란을 AI로 채웠습니다. 내용을 바꾸려면 「수정」을 누르세요.");
          setProgress({ phase: "열별 상세 기입란 완료", percent: 100 });
          return;
        } catch {
          /* fall through */
        }
      }
      setFillMsg("상세 기입 JSON을 해석하지 못했습니다. 「수정」 후 직접 입력하세요.\n\n" + raw.slice(0, 500));
    } catch (e) {
      setFillMsg(String(e));
      setProgress({ phase: "열별 상세 기입란 실패", percent: 100, note: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const requestDraft = async () => {
    const reqField = fields.find((f) => f.item.includes("AI요청문"));
    const colList = headers.join(" · ");
    const filled = fields.map((f) => `- ${f.item}: ${values[f.item] || "(비움)"}`).join("\n");
    const sample = sampleRows.map((r) => headers.map((h, i) => `${h}=${r[i] ?? ""}`).join(" | ")).join("\n");
    const system =
      reqField?.guide ||
      `너는 ${methodLabel} 조교다. Task「${taskName}」실제작업표를 열 구조 그대로 최소 50행 초안한다. 다른 열 금지.`;
    const user = [
      `연구 주제: ${example.topic || values["연구 주제 한 줄(공통)"] || ""}`,
      `열(고정): ${colList}`,
      `연구자 기입:`,
      filled,
      `표본 3행:`,
      sample,
      `출력: TSV(첫 행=열 이름, 이후 >=50행). 설명 문단 금지.`,
    ].join("\n");
    setBusy("draft");
    setProgress({ phase: "AI 초안 요청 시작", percent: 10 });
    try {
      setProgress({ phase: "AI 초안 작성 중", percent: 68 });
      setOut(await callAi(`${system}\n\n${user}`, draftSettings));
      setProgress({ phase: "AI 초안 완료", percent: 100 });
    } catch (e) {
      setOut(String(e));
      setProgress({ phase: "AI 초안 실패", percent: 100, note: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const detailRows = useMemo(() => fields.map((f) => [f.item, values[f.item] || ""]), [fields, values]);
  const detailHeaders = useMemo(() => ["기입 항목", "값"], []);
  const draftTable = useMemo(() => parseDelimited(out) || asOneColTable("AI 초안 결과", out), [out]);

  const exportDetails = (mode: "xlsx" | "csv" | "pdf") =>
    exportTableSet(`ai-plan-detail-${Date.now()}`, "열별 상세 기입란", detailHeaders, detailRows, mode);

  const readTextFromPdfBytes = (bytes: Uint8Array): string => {
    const raw = new TextDecoder("latin1").decode(bytes);
    const streams = [...raw.matchAll(/stream[\r\n]+([\s\S]*?)endstream/g)].map((m) => m[1]);
    return streams.join("\n");
  };

  const applyImportedRows = (rows: string[][]) => {
    const next = { ...values };
    rows.forEach((r) => {
      const k = (r[0] || "").trim();
      const v = (r[1] || "").trim();
      if (!k || !v) return;
      if (Object.prototype.hasOwnProperty.call(next, k)) next[k] = v;
    });
    setValues(next);
    setDetailLocked(false);
    setFillMsg("불러오기를 완료했습니다. 필요하면 값을 수정한 뒤 AI 초안을 요청하세요.");
  };

  const importDetails = async (file: File) => {
    try {
      const ext = file.name.toLowerCase().split(".").pop() || "";
      if (ext === "csv") {
        const txt = await file.text();
        const parsed = parseDelimited(txt);
        if (!parsed) throw new Error("CSV 형식을 읽지 못했습니다.");
        applyImportedRows(parsed.rows);
        return;
      }
      if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const first = wb.SheetNames[0];
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[first], { header: 1 }) as Array<Array<string | number>>;
        const rows = aoa.slice(1).map((r) => [String(r[0] ?? ""), String(r[1] ?? "")]);
        applyImportedRows(rows);
        return;
      }
      if (ext === "pdf") {
        const buf = await file.arrayBuffer();
        const txt = readTextFromPdfBytes(new Uint8Array(buf));
        const lines = txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
        const rows: string[][] = [];
        lines.forEach((line) => {
          const tab = line.split("\t");
          if (tab.length >= 2) rows.push([tab[0], tab.slice(1).join(" ")]);
          else {
            const idx = line.indexOf(":");
            if (idx > 0) rows.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()]);
          }
        });
        if (!rows.length) throw new Error("PDF에서 읽을 수 있는 항목/값 쌍이 없습니다.");
        applyImportedRows(rows);
        return;
      }
      throw new Error("지원하지 않는 파일 형식입니다.");
    } catch (e) {
      setFillMsg(`불러오기 실패: ${String(e)}`);
    }
  };

  if (!fields.length) {
    return <p className="text-[12.5px] text-ink-3">추가-7 미바인딩 — AI작성안 없음</p>;
  }

  return (
    <div className="space-y-2.5">
      <AiProgressBar progress={progress} label="실제작업표 AI 작업상태" compact hideOnDone />
      {(example.aiPlan?.intro || []).map((line, i) => (
        <p key={i} className="text-[12.5px] text-ink-2 leading-relaxed">
          {line}
        </p>
      ))}
      <BriefAiAndSheetForm example={example} methodLabel={methodLabel} taskName={taskName} />
      <Accordion title="열별 상세 기입란 (실제 작업표 열 = AI 기입 항목)" defaultOpen>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button type="button" className="btn btn-sm" disabled={!!busy} onClick={fillDetailFields}>
            {busy === "fillDetail" ? "채우는 중…" : "열별 상세 기입란 AI로 채우기"}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={!detailLocked}
            onClick={() => setDetailLocked(false)}
            title="AI가 채운 뒤 직접 고칠 때"
          >
            수정
          </button>
          <button type="button" className="btn btn-sm" onClick={() => exportDetails("xlsx")}>엑셀 내보내기</button>
          <button type="button" className="btn btn-sm" onClick={() => exportDetails("csv")}>CSV 내보내기</button>
          <button type="button" className="btn btn-sm" onClick={() => exportDetails("pdf")}>PDF 내보내기</button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setImportMode("xlsx");
              importInputRef.current?.click();
            }}
          >
            엑셀 불러오기
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setImportMode("csv");
              importInputRef.current?.click();
            }}
          >
            CSV 불러오기
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setImportMode("pdf");
              importInputRef.current?.click();
            }}
          >
            PDF 불러오기
          </button>
          <input
            ref={importInputRef}
            type="file"
            className="hidden"
            accept={importMode === "xlsx" ? ".xlsx,.xls" : importMode === "csv" ? ".csv,.tsv,text/csv" : ".pdf,application/pdf"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importDetails(f);
              e.currentTarget.value = "";
            }}
          />
        </div>
        {fillMsg ? (
          <p className="text-[12px] text-ink-2 mb-2 whitespace-pre-wrap">{fillMsg}</p>
        ) : null}
        <div className="space-y-2">
          {fields.map((f) => (
            <label key={f.item} className="block">
              <div className="text-[12.5px] font-semibold mb-0.5">{f.item}</div>
              {f.guide ? (
                <p className="text-[11.5px] text-ink-3 mb-1 leading-snug whitespace-pre-wrap">{f.guide}</p>
              ) : null}
              <textarea
                className="inp w-full min-h-[52px] text-[13px]"
                value={values[f.item] || ""}
                disabled={detailLocked}
                onChange={(e) => setValues((v) => ({ ...v, [f.item]: e.target.value }))}
                placeholder="연구자 기입"
              />
            </label>
          ))}
        </div>
      </Accordion>
      <button type="button" className="btn btn-primary w-full" disabled={!!busy} onClick={requestDraft}>
        {busy === "draft" ? "AI 초안 요청 중…" : "AI 초안 요청"}
      </button>
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-[12px] font-semibold">AI 초안 결과</div>
          <div className="flex gap-1.5">
            <button type="button" className="btn btn-sm" disabled={!out} onClick={() => exportTableSet(`ai-draft-${Date.now()}`, "AI 초안 결과", draftTable.headers, draftTable.rows, "xlsx")}>엑셀 내보내기</button>
            <button type="button" className="btn btn-sm" disabled={!out} onClick={() => exportTableSet(`ai-draft-${Date.now()}`, "AI 초안 결과", draftTable.headers, draftTable.rows, "csv")}>CSV 내보내기</button>
            <button type="button" className="btn btn-sm" disabled={!out} onClick={() => exportTableSet(`ai-draft-${Date.now()}`, "AI 초안 결과", draftTable.headers, draftTable.rows, "pdf")}>PDF 내보내기</button>
          </div>
        </div>
        {out ? (
          <DataTable headers={draftTable.headers} rows={draftTable.rows} compact />
        ) : (
          <p className="text-[12px] text-ink-3">아직 초안이 없습니다. 「AI 초안 요청」을 누르면 여기에 표시됩니다.</p>
        )}
      </div>
      <button type="button" className="btn w-full" disabled={!hasNextTask} onClick={onNextTask || undefined}>
        다음테스크
      </button>
    </div>
  );
}

export default function WorkedExamplePanel({
  example,
  methodLabel,
  taskName,
  hasNextTask,
  onNextTask,
}: {
  example?: V61WorkedExample | null;
  methodLabel: string;
  taskName: string;
  hasNextTask?: boolean;
  onNextTask?: (() => void) | null;
}) {
  if (!example) {
    return (
      <div className="rounded-md px-3 py-2.5 text-[12.5px] mb-4" style={{ background: "var(--warn-wash)", color: "var(--warn)" }}>
        추가-7 미바인딩 — 이 Task에 실연구 예시가 아직 없습니다.
      </div>
    );
  }

  const ws = example.workSheet;
  const sheetTitle = ws
    ? `실제 작업표 「${(ws.title || "").replace(/^실제 작업표 「|」$/g, "") || "산출물"}」 · ${ws.rows?.length || 0}행 · 열 ${(ws.headers || []).join("·")}`
    : "실제 작업표";

  return (
    <div className="mb-4 space-y-3">
      <div className="rounded-md px-3 py-2.5" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
        <div className="text-[12px] font-semibold mb-0.5">【실연구 예시 삽입】</div>
        {example.topic ? <div className="text-[13.5px] leading-snug">연구 주제: {example.topic}</div> : null}
      </div>

      <Accordion title="1) 이렇게 작업합니다" defaultOpen>
        <ol className="list-decimal pl-5 text-[13px] leading-relaxed space-y-1">
          {(example.steps || []).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Accordion>

      {example.summaryTable ? (
        <div>
          <h3 className="text-[14px] font-semibold mb-2">2) {example.summaryTable.title || "산출물 예시표(요약 골격)"}</h3>
          <div className="rounded-md px-3 py-2 mb-2 text-[12.5px] leading-relaxed" style={{ background: "var(--color-background-secondary)" }}>
            {example.summaryHowTo ||
              "이 표는 아래 「실제 작업표(2-1)」를 쉽게 미리 보여 주는 것입니다. ‘실제 작업표 열(연결)’에 적힌 이름과 2-1 표의 열 이름이 같습니다."}
          </div>
          <DataTable headers={example.summaryTable.headers} rows={example.summaryTable.rows} />
        </div>
      ) : null}

      {ws ? (
        <Accordion title={`2-1) ${sheetTitle}`} defaultOpen={false}>
          <p className="text-[12.5px] text-ink-2 mb-2 leading-relaxed">
            위 2) 요약표와 같은 산출물입니다. 요약표의 ‘줄 보기’·‘칸 안내’를 보고, 여기 같은 열 이름에 50행을 채웁니다.
          </p>
          <DataTable headers={ws.headers} rows={ws.rows} compact />
        </Accordion>
      ) : null}

      {(example.workSheetNotes || []).length > 0 ? (
        <Accordion title="2-2) 실제 작업표 주석" defaultOpen>
          <ul className="list-disc pl-5 text-[12.5px] leading-relaxed space-y-1.5">
            {example.workSheetNotes!.map((n, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {n}
              </li>
            ))}
          </ul>
        </Accordion>
      ) : null}

      {(example.summaryExplain || []).length > 0 ? (
        <div>
          <h3 className="text-[14px] font-semibold mb-1.5">3) 예시표(요약 골격) 내용 설명</h3>
          <ul className="list-disc pl-5 text-[13px] leading-relaxed space-y-1">
            {example.summaryExplain!.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-[14px] font-semibold mb-2">4) {example.aiPlan?.title || "실제작업표의 AI작성안"}</h3>
        <AiPlanForm
          example={example}
          methodLabel={methodLabel}
          taskName={taskName}
          hasNextTask={hasNextTask}
          onNextTask={onNextTask}
        />
      </div>
    </div>
  );
}
