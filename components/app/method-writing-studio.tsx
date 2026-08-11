"use client";
/**
 * 연구방법작성 — 사이드바 전체메뉴
 * · 원고 표면(--doc-*) 위의 에디터 — 화면에서는 테마를 따르고 인쇄·내보내기에서는 흰 종이가 된다
 * · 상단: 그림/텍스트/엑셀 불러오기 · 표·그림 도구 (크기 조절 가능)
 * · 내보내기: PDF / 엑셀 / HTML
 * · 하단 아코디언: 다른 메뉴 산출물을 글·그림으로 삽입
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  FileText, Image as ImageIcon, Table2, Upload, Download,
  ChevronDown, ChevronRight, Plus, Bold, Italic, Underline,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
} from "lucide-react";
import PageHead from "@/components/ui/PageHead";
import { useStore } from "@/store/app-store";
import {
  collectLinkedArtifacts,
  emptyMenuArtifacts,
  type MethodWritingDoc,
  type LinkedArtifact,
} from "@/lib/menu-artifacts";
import { exportSimplePdf, exportTableXlsx, downloadBlob } from "@/lib/viz-export";

const MENU_GROUPS: { key: LinkedArtifact["menu"]; label: string; hint: string }[] = [
  { key: "methods", label: "연구방법 · 프로세스 산출물", hint: "방법 프로젝트·단계 실행·아키타입 프로젝트 실습(①–⑥) 결과" },
  { key: "viz", label: "데이터 시각화", hint: "시각화 스튜디오 결과" },
  { key: "survey", label: "설문조사", hint: "설문 설계·문항·결과" },
  { key: "coding", label: "코딩", hint: "코딩 스튜디오·코드북·테마" },
  { key: "basic-stats", label: "기본통계", hint: "기술·추론·SEM 분석 결과" },
  { key: "recommend", label: "연구방법 추천", hint: "추천·체크리스트 결과" },
  { key: "misc", label: "기타", hint: "기타 저장된 산출물" },
];

const RESIZE_IMG =
  "max-width:100%;width:min(100%,520px);height:auto;display:block;border-radius:8px;resize:both;overflow:auto;min-width:120px;min-height:80px;cursor:nwse-resize";
const RESIZE_TABLE_WRAP =
  "display:block;max-width:100%;width:min(100%,100%);overflow:auto;resize:both;min-width:180px;min-height:60px;margin:12px 0;border:1px dashed var(--doc-line);padding:4px;border-radius:8px;color:var(--doc-ink)";
const TABLE_STYLE =
  "border-collapse:collapse;width:100%;font-size:13px;margin:0;color:var(--doc-ink)";
const CELL_BASE =
  "border:1px solid var(--doc-line);padding:6px 8px;text-align:left;color:var(--doc-ink)";
const CELL_TH = `${CELL_BASE};background:var(--doc-wash);font-weight:600`;
const CELL_TD = `${CELL_BASE};background:transparent`;
const IMPORT_TEXT_BOX =
  "margin:12px 0;padding:12px;background:var(--doc-wash);border:1px solid var(--doc-line);border-radius:8px;font-size:14px;line-height:1.65;color:var(--doc-ink);white-space:pre-wrap";
const IMPORT_META =
  "font-size:12px;color:var(--doc-ink-2);margin:8px 0 0";
const PROSE_P =
  "margin:8px 0;font-size:14.5px;line-height:1.65;color:var(--doc-ink)";
const PROSE_H3 =
  "font-size:16px;font-weight:600;margin:0 0 4px;color:var(--doc-ink)";
const PROSE_META =
  "font-size:12px;color:var(--doc-ink-2);margin:0 0 10px";
const PROSE_CAP =
  "font-size:12px;color:var(--doc-ink-2);margin-top:4px";
const FIGURE_PLACEHOLDER =
  "margin:16px 0;padding:24px;border:1.5px dashed var(--doc-line);border-radius:10px;text-align:center;color:var(--doc-ink-2);background:var(--doc-wash);resize:both;overflow:auto;min-width:160px;min-height:100px";

function esc(s: string) {
  return String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainTextFromPayload(payload: unknown): string {
  if (payload == null) return "";
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return String(payload);
  const o = payload as Record<string, unknown>;
  const chunks: string[] = [];
  const prefer = ["summary", "note", "aiNote", "finalAi", "interpretation", "theory", "title", "result"];
  for (const k of prefer) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) chunks.push(v.trim());
    else if (v && typeof v === "object" && "summary" in (v as object) && typeof (v as any).summary === "string") {
      chunks.push((v as any).summary);
    }
  }
  if (typeof o.note === "string" && o.note.trim()) chunks.push(o.note.trim());
  if (typeof o.output === "string" && o.output.trim()) chunks.push(o.output.trim());
  const spec = o.spec as { mapping?: { x?: string; y?: string } } | undefined;
  const payloadData = o.data as { model?: { rows?: unknown[]; columns?: { name: string }[] } } | undefined;
  if (spec?.mapping?.x) {
    chunks.push(`축 설정: X=${spec.mapping.x}, Y=${spec.mapping.y || "—"}`);
  }
  if (payloadData?.model?.rows?.length) {
    const cols = payloadData.model.columns?.map((c) => c.name).join(", ") || "";
    chunks.push(`표본 ${payloadData.model.rows.length}행 · ${cols}`);
  }
  if (Array.isArray(o.themes)) {
    chunks.push("테마: " + (o.themes as any[]).map((t) => (typeof t === "string" ? t : t?.name || t?.label || "")).filter(Boolean).join(", "));
  }
  if (Array.isArray(o.codebook) && o.codebook.length) {
    const lines = (o.codebook as any[]).slice(0, 20).map((c) => {
      if (typeof c === "string") return "· " + c;
      return "· " + [c?.code || c?.name, c?.definition || c?.def || c?.memo].filter(Boolean).join(" — ");
    });
    chunks.push("코드북\n" + lines.join("\n"));
  }
  if (!chunks.length) {
    try {
      const s = JSON.stringify(payload, null, 2);
      // avoid dumping huge JSON — short human lines only
      if (s.length < 400) return s;
    } catch { /* ignore */ }
  }
  return chunks.join("\n\n");
}

function findImageSrcs(payload: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 6 || payload == null) return out;
  if (typeof payload === "string") {
    if (/^data:image\//i.test(payload) || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(payload)) out.push(payload);
    return out;
  }
  if (Array.isArray(payload)) {
    payload.slice(0, 40).forEach((x) => findImageSrcs(x, out, depth + 1));
    return out;
  }
  if (typeof payload === "object") {
    for (const [k, v] of Object.entries(payload as object)) {
      if (/^(src|url|image|img|dataUrl|thumbnail|chartPng|snapshotPng|png|jpeg)$/i.test(k) && typeof v === "string") {
        findImageSrcs(v, out, depth + 1);
      } else if (k === "data" || k === "payload" || k === "result" || k === "chart" || k === "figures") {
        findImageSrcs(v, out, depth + 1);
      }
    }
  }
  return out;
}

export default function MethodWritingStudio() {
  const menuArtifacts = useStore((s) => s.menuArtifacts);
  const setMethodWriting = useStore((s) => s.setMethodWriting);
  const cmqProject = useStore((s) => s.cmqProject);
  const caPipelines = useStore((s) => s.caPipelines);
  const stageRuns = useStore((s) => s.stageRuns);
  const projects = useStore((s) => s.projects);

  const saved = menuArtifacts?.methodWriting;
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(saved?.title || "연구방법 (Methodology)");
  const [html, setHtml] = useState(saved?.html || "");
  const [openAcc, setOpenAcc] = useState<string | null>("basic-stats");
  const [status, setStatus] = useState("");
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const doc = menuArtifacts?.methodWriting;
    if (!doc) return;
    if (!hydrated.current) {
      hydrated.current = true;
      setTitle(doc.title || "연구방법 (Methodology)");
      setHtml(doc.html || "");
      if (editorRef.current && doc.html) editorRef.current.innerHTML = doc.html;
      return;
    }
    if (doc.updatedAt && doc.html !== html && document.activeElement !== editorRef.current) {
      setTitle(doc.title);
      setHtml(doc.html);
      if (editorRef.current) editorRef.current.innerHTML = doc.html || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuArtifacts?.methodWriting?.updatedAt]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const doc: MethodWritingDoc = {
        title,
        subtitle: "",
        html,
        blocks: menuArtifacts?.methodWriting?.blocks || [],
        updatedAt: Date.now(),
      };
      setMethodWriting(doc);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, html, setMethodWriting]);

  const artifacts = useMemo(
    () =>
      collectLinkedArtifacts({
        menuArtifacts: menuArtifacts || emptyMenuArtifacts(),
        cmqProject,
        caPipelines,
        stageRuns,
        projects,
      }),
    [menuArtifacts, cmqProject, caPipelines, stageRuns, projects]
  );

  function syncHtml() {
    const h = editorRef.current?.innerHTML || "";
    setHtml(h);
  }

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncHtml();
  }

  function insertHtml(fragment: string) {
    editorRef.current?.focus();
    const ok = document.execCommand("insertHTML", false, fragment);
    if (!ok && editorRef.current) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const tpl = document.createElement("template");
        tpl.innerHTML = fragment;
        range.insertNode(tpl.content);
      } else {
        editorRef.current.insertAdjacentHTML("beforeend", fragment);
      }
    }
    syncHtml();
    setStatus("에디터에 삽입됨");
  }

  /** 연동 산출물 → 코드/JSON이 아니라 제목·본문 글 + 그림으로 삽입 */
  function insertArtifact(a: LinkedArtifact) {
    const when = new Date(a.updatedAt).toLocaleString("ko-KR");
    const payload = a.payload as Record<string, unknown> | undefined;
    const proseHtml = typeof payload?.proseHtml === "string" ? payload.proseHtml : "";
    const body = plainTextFromPayload(a.payload) || a.summary || "";
    const imgs = findImageSrcs(a.payload).slice(0, 6);
    if (typeof payload?.snapshotPng === "string" && !imgs.includes(payload.snapshotPng)) {
      imgs.unshift(payload.snapshotPng);
    }
    const paras = esc(body)
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p style="${PROSE_P}">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    const imgHtml = imgs
      .map(
        (src, i) =>
          `<figure class="mw-resizable" style="margin:12px 0;display:inline-block;max-width:100%">
            <img src="${src}" alt="${esc(a.title)} ${i + 1}" style="${RESIZE_IMG}" />
            <figcaption style="${PROSE_CAP}">${esc(a.title)} · 그림 ${i + 1}</figcaption>
          </figure>`
      )
      .join("");
    const block = `
<section data-artifact="${esc(a.id)}" style="margin:18px 0;padding:0;color:var(--doc-ink)">
  <h3 style="${PROSE_H3}">${esc(a.title)}</h3>
  <p style="${PROSE_META}">${esc(a.menu)} · ${esc(when)}</p>
  ${proseHtml || ""}
  ${!proseHtml && paras ? paras : !proseHtml && !imgs.length ? `<p style="${PROSE_META}">${esc(body.slice(0, 2000))}</p>` : !proseHtml ? paras : ""}
  ${imgHtml}
</section>`;
    insertHtml(block);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const name = f.name.toLowerCase();
    try {
      if (/\.(png|jpe?g|gif|webp)$/i.test(name)) {
        const reader = new FileReader();
        reader.onload = () => {
          insertHtml(
            `<figure class="mw-resizable" style="margin:16px 0;display:inline-block;max-width:100%">
              <img src="${reader.result}" alt="${esc(f.name)}" style="${RESIZE_IMG}" />
              <figcaption style="${PROSE_CAP}">${esc(f.name)} · 모서리에서 크기 조절</figcaption>
            </figure>`
          );
        };
        reader.readAsDataURL(f);
        return;
      }
      if (/\.(xlsx|xls|csv)$/i.test(name)) {
        const buf = await f.arrayBuffer();
        let aoa: any[][] = [];
        if (name.endsWith(".csv")) {
          const txt = new TextDecoder("utf-8").decode(buf);
          aoa = txt.split(/\r?\n/).filter(Boolean).map((l) => l.split(","));
        } else {
          const wb = XLSX.read(buf, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
        }
        const rows = aoa.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== "")).slice(0, 80);
        if (!rows.length) {
          setStatus("불러오기 실패: 표 데이터가 비어 있습니다.");
          return;
        }
        const table =
          `<div class="mw-table-resize" style="${RESIZE_TABLE_WRAP}" title="모서리에서 표 크기 조절">` +
          `<table class="mw-import-table" style="${TABLE_STYLE}">` +
          rows
            .map(
              (r, i) =>
                `<tr>${(r as any[])
                  .map(
                    (c) =>
                      `<t${i === 0 ? "h" : "d"} style="${i === 0 ? CELL_TH : CELL_TD}">${esc(String(c ?? ""))}</t${i === 0 ? "h" : "d"}>`
                  )
                  .join("")}</tr>`
            )
            .join("") +
          `</table></div>`;
        insertHtml(`<p style="${IMPORT_META}">불러온 표 · ${esc(f.name)}</p>${table}`);
        setStatus(`불러오기 완료 · ${f.name} (${rows.length}행)`);
        return;
      }
      const txt = await f.text();
      const safe = esc(txt).replace(/\n/g, "<br/>");
      insertHtml(`<div class="mw-import-text" style="${IMPORT_TEXT_BOX}">${safe}</div>`);
      setStatus(`불러오기 완료 · ${f.name}`);
    } catch (err: any) {
      setStatus("불러오기 실패: " + (err?.message || err));
    }
  }

  function insertBlankTable() {
    const r = Math.max(1, Math.min(20, tableRows));
    const c = Math.max(1, Math.min(12, tableCols));
    let htmlT = `<div class="mw-table-resize" style="${RESIZE_TABLE_WRAP}" title="모서리에서 표 크기 조절"><table class="mw-import-table" style="${TABLE_STYLE}">`;
    for (let i = 0; i < r; i++) {
      htmlT += "<tr>";
      for (let j = 0; j < c; j++) {
        const tag = i === 0 ? "th" : "td";
        htmlT += `<${tag} style="${i === 0 ? CELL_TH : CELL_TD}">${i === 0 ? `열${j + 1}` : "&nbsp;"}</${tag}>`;
      }
      htmlT += "</tr>";
    }
    htmlT += "</table></div>";
    insertHtml(htmlT);
    setTableOpen(false);
  }

  function insertFigurePlaceholder() {
    insertHtml(
      `<figure class="mw-resizable" style="${FIGURE_PLACEHOLDER}">
        <div style="font-size:13px;color:var(--doc-ink-2)">그림 자리 · 상단 [불러오기]로 이미지를 넣거나 캡션을 수정하세요 · 모서리에서 크기 조절</div>
        <figcaption style="margin-top:8px;font-size:12px;color:var(--doc-ink-2)">그림 1. 캡션을 입력하세요</figcaption>
      </figure>`
    );
  }

  function onExportPdf() {
    syncHtml();
    const text = (editorRef.current?.innerText || "").split(/\n/).filter(Boolean).slice(0, 80);
    exportSimplePdf({
      filename: `${(title || "연구방법").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40)}.pdf`,
      title: title,
      lines: text,
    });
    setStatus("PDF 내보내기 완료");
  }

  function onExportXlsx() {
    syncHtml();
    const text = editorRef.current?.innerText || "";
    const linked = artifacts.map((a) => [a.menu, a.title, a.summary, new Date(a.updatedAt).toISOString()]);
    exportTableXlsx(`${(title || "연구방법").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40)}.xlsx`, [
      { name: "본문", aoa: [[title], [], ...text.split(/\n/).map((l) => [l])] },
      { name: "연동산출물", aoa: [["메뉴", "제목", "요약", "시각"], ...linked] },
    ]);
    setStatus("엑셀 내보내기 완료");
  }

  function onExportHtml() {
    syncHtml();
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>body{font-family:Malgun Gothic,sans-serif;max-width:720px;margin:40px auto;color:#111;line-height:1.65}
      h1{font-size:28px;margin:0 0 24px} img{max-width:100%}</style></head>
      <body><h1>${esc(title)}</h1>${editorRef.current?.innerHTML || ""}</body></html>`;
    downloadBlob(`${(title || "연구방법").replace(/[\\/:*?"<>|]/g, "_").slice(0, 40)}.html`, doc, "text/html;charset=utf-8");
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5">
      <PageHead title="원고 쓰기">
        다른 메뉴에서 실행한 분석과 그림을 그대로 문단으로 옮겨 적습니다. 화면에서는 눈이 편한 표면으로 보이고, 인쇄·내보내기에서는 흰 종이로 되돌아갑니다.
      </PageHead>

      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" className="hidden" accept=".png,.jpg,.jpeg,.gif,.webp,.txt,.md,.html,.csv,.xlsx,.xls" onChange={onImportFile} />
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          <Upload size={14} className="inline mr-1" />불러오기
        </button>
        <button type="button" className="btn btn-sm" onClick={insertFigurePlaceholder}>
          <ImageIcon size={14} className="inline mr-1" />그림 도구
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setTableOpen((v) => !v)}>
          <Table2 size={14} className="inline mr-1" />표 도구
        </button>
        <button type="button" className="btn btn-sm" onClick={onExportPdf}>
          <Download size={14} className="inline mr-1" />PDF
        </button>
        <button type="button" className="btn btn-sm" onClick={onExportXlsx}>
          <Download size={14} className="inline mr-1" />엑셀
        </button>
        <button type="button" className="btn btn-sm" onClick={onExportHtml}>
          <FileText size={14} className="inline mr-1" />HTML
        </button>
        {status && <span className="text-[12px] text-ink-3 ml-1">{status}</span>}
      </div>

      {tableOpen && (
        <div className="rounded-xl border p-3 flex flex-wrap items-end gap-3" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--doc-bg)" }}>
          <label className="text-[12px]">행
            <input type="number" min={1} max={20} className="inp ml-1 w-16" value={tableRows} onChange={(e) => setTableRows(+e.target.value || 1)} />
          </label>
          <label className="text-[12px]">열
            <input type="number" min={1} max={12} className="inp ml-1 w-16" value={tableCols} onChange={(e) => setTableCols(+e.target.value || 1)} />
          </label>
          <button type="button" className="btn btn-sm btn-primary" onClick={insertBlankTable}>
            <Plus size={14} className="inline mr-1" />표 삽입
          </button>
        </div>
      )}

      <section
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--color-border-tertiary)", background: "var(--doc-bg)", color: "var(--doc-ink)" }}
      >
        <div className="px-8 pb-2 pt-8">
          <input
            className="w-full text-[28px] font-semibold tracking-tight bg-transparent outline-none border-0"
            style={{ fontFamily: "var(--font-gothic)" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="연구방법 (Methodology)"
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-1 px-4 py-2 border-y"
          style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink-2)", background: "var(--doc-wash)" }}
        >
          <ToolBtn onClick={() => exec("formatBlock", "H1")} title="H1"><Heading1 size={16} /></ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "H2")} title="H2"><Heading2 size={16} /></ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "H3")} title="H3"><Heading3 size={16} /></ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "P")} title="본문"><span className="text-[12px] font-medium px-0.5">본문</span></ToolBtn>
          <span className="mx-1 h-4 w-px" style={{ background: "var(--doc-line)" }} />
          <ToolBtn onClick={() => exec("bold")} title="굵게"><Bold size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec("italic")} title="기울임"><Italic size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec("underline")} title="밑줄"><Underline size={15} /></ToolBtn>
          <span className="mx-1 h-4 w-px" style={{ background: "var(--doc-line)" }} />
          <ToolBtn onClick={() => exec("insertUnorderedList")} title="글머리"><List size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec("insertOrderedList")} title="번호"><ListOrdered size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "BLOCKQUOTE")} title="인용"><Quote size={15} /></ToolBtn>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncHtml}
          onBlur={syncHtml}
          className="mw-editor min-h-[560px] px-8 py-6 text-[15px] leading-relaxed outline-none"
          style={{ color: "var(--doc-ink)" }}
          data-placeholder="여기에 논문을 작성하세요…"
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-gothic)" }}>
          연구설계·분석 연동 결과
        </h2>
        <p className="text-[13px] text-ink-3 mb-2">
          다른 메뉴에서 실행·저장된 분석과 산출물을 골라 에디터에 <strong>글과 그림</strong>으로 삽입합니다. 워크스페이스 저장 시 함께 보존됩니다.
        </p>
        {MENU_GROUPS.map((g) => {
          const items = artifacts.filter((a) => a.menu === g.key);
          const open = openAcc === g.key;
          return (
            <div key={g.key} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--doc-bg)" }}>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-[14px] font-medium"
                onClick={() => setOpenAcc(open ? null : g.key)}
              >
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="flex-1">{g.label}</span>
                <span className="text-[11px] text-ink-3">{items.length ? `${items.length}건` : "없음"}</span>
              </button>
              {open && (
                <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: "var(--doc-line-2)" }}>
                  <p className="text-[12px] text-ink-3 pt-2">{g.hint}</p>
                  {!items.length && (
                    <div className="text-[13px] text-ink-3 py-2">아직 연동된 결과가 없습니다. 해당 메뉴에서 분석을 실행·저장하세요.</div>
                  )}
                  {items.map((a) => (
                    <div key={a.id} className="rounded-lg border p-3" style={{ borderColor: "var(--doc-line)" }}>
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium">{a.title}</div>
                          <div className="text-[12px] text-ink-3 mt-0.5">{new Date(a.updatedAt).toLocaleString("ko-KR")}</div>
                          <div className="text-[13px] text-ink-2 mt-1 line-clamp-2">{a.summary}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--ok-wash)", color: "var(--ok)" }}>연동됨</span>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => insertArtifact(a)}>
                          글·그림으로 삽입
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--doc-ink-2);
        }
        .mw-editor {
          color: var(--doc-ink);
        }
        .mw-editor img {
          max-width: 100%;
          height: auto;
        }
        .mw-editor img[style*="resize"],
        .mw-editor .mw-resizable img {
          resize: both;
          overflow: auto;
        }
        .mw-editor .mw-table-resize {
          resize: both;
          overflow: auto;
          color: var(--doc-ink);
        }
        /* 불러온 표·텍스트: 테마 토큰으로 대비 유지 (흰 배경+흰 글자 방지) */
        .mw-editor table,
        .mw-editor table th,
        .mw-editor table td {
          color: var(--doc-ink) !important;
        }
        .mw-editor table th {
          background: var(--doc-wash) !important;
          border-color: var(--doc-line) !important;
        }
        .mw-editor table td {
          background: transparent !important;
          border-color: var(--doc-line) !important;
        }
        .mw-editor .mw-import-text,
        .mw-editor div[style*="background:#f8fafc"],
        .mw-editor div[style*="background: #f8fafc"] {
          color: var(--doc-ink) !important;
          background: var(--doc-wash) !important;
        }
      `}</style>
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 text-slate-600"
    >
      {children}
    </button>
  );
}
