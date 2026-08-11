"use client";
/**
 * AI 기반 질적연구 표준 코딩북 만들기 및 해석 (코딩 스튜디오 탭 ⑤)
 * 원자료(PDF/텍스트/엑셀) → 계산 → Evidence → Inference → Codebook → 해석 리포트
 */
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload, Play, Download, Sparkles, RotateCcw, FileText, BookMarked,
} from "lucide-react";
import { extractFile } from "@/lib/ca-automation";
import {
  emptyStandardAiCodebook,
  runStandardAiCodebookPipeline,
  generateStandardInterpretation,
  sacCategoryFreq,
  sacMetaCategories,
  sacTopThemes,
  type StandardAiCodebookState,
  type ProgressEvent,
} from "@/lib/ai-standard-codebook";
import AiProgressBar from "./ai-progress-bar";
import CodingAnalyticsViz from "./coding-analytics-viz";

const card = "rounded-2xl border p-5 md:p-6";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const softStyle = { borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" };
const chip = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12.5px]";
const body = "text-[14.5px] leading-relaxed text-ink-2";
const h2 = "text-[18px] font-semibold";
const h3 = "text-[15px] font-semibold";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold";
const btnGhost = "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px]";

function download(name: string, data: string | Uint8Array, mime: string) {
  const blob = new Blob([data as any], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const PIPE_STEPS = [
  { id: "raw", label: "원자료" },
  { id: "calc", label: "계산" },
  { id: "evidence", label: "Evidence" },
  { id: "infer", label: "추론" },
  { id: "codebook", label: "코드북" },
  { id: "report", label: "해석 리포트" },
];

type Props = {
  settings: any;
  state: StandardAiCodebookState;
  onChange: (next: StandardAiCodebookState) => void;
  onNote?: (kind: "info" | "ok" | "warn" | "err", msg: string) => void;
};

export default function AiStandardCodebookPanel({ settings, state, onChange, onNote }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [prog, setProg] = useState<ProgressEvent | null>(null);
  const say = (kind: "info" | "ok" | "warn" | "err", msg: string) => onNote?.(kind, msg);

  function patch(partial: Partial<StandardAiCodebookState>) {
    onChange({ ...state, ...partial });
  }

  async function onImportFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy("import");
    try {
      const texts: string[] = [];
      const names: string[] = [];
      for (const f of files) {
        const doc = await extractFile(f);
        if (doc.text && !doc.text.startsWith("[추출 실패")) {
          texts.push(`### ${doc.source}\n${doc.text}`);
          names.push(doc.source);
        } else {
          say("warn", `${f.name} 추출 실패 또는 내용이 거의 없습니다.`);
        }
      }
      if (!texts.length) {
        say("err", "불러온 파일에서 텍스트를 추출하지 못했습니다.");
        return;
      }
      const merged = [state.raw.trim(), ...texts].filter(Boolean).join("\n\n");
      patch({
        raw: merged,
        fileNames: [...new Set([...(state.fileNames || []), ...names])],
        title: state.title || names[0]?.replace(/\.[^.]+$/, "") || "AI 표준 코딩북",
      });
      say("ok", `원자료 ${names.length}개 파일 병합 · ${(merged.length).toLocaleString()}자`);
    } catch (err: any) {
      say("err", `파일 불러오기 실패: ${err?.message || err}`);
    } finally {
      setBusy("");
      e.target.value = "";
    }
  }

  async function runPipeline() {
    if (!(state.raw || "").trim()) {
      say("warn", "원자료를 먼저 불러오거나 붙여넣으세요. (PDF · 텍스트 · 엑셀)");
      return;
    }
    setBusy("pipeline");
    setProg({ phase: "준비", percent: 2 });
    try {
      const next = await runStandardAiCodebookPipeline(
        {
          title: state.title,
          question: state.question,
          purpose: state.purpose,
          raw: state.raw,
          fileNames: state.fileNames,
        },
        settings,
        (e) => setProg(e)
      );
      onChange(next);
      say("ok",
        `표준 코딩북 완료 (${next.source || "rule"}) · 코드 ${next.codebook.length} · ` +
        `Evidence ${next.evidence.length} · 테마 ${next.themes.length}`);
    } catch (err: any) {
      say("err", `파이프라인 실패: ${err?.message || err}`);
    } finally {
      setBusy("");
      setProg(null);
    }
  }

  async function regenReport() {
    if (!state.codebook.length) {
      say("warn", "먼저 파이프라인을 실행하세요.");
      return;
    }
    setBusy("interpret");
    try {
      const { text, source } = await generateStandardInterpretation(state, settings);
      patch({
        interpretation: text,
        source: state.source === "ai" || source === "ai" ? (state.source === "rule" ? "hybrid" : state.source || source) : state.source || source,
        updatedAt: new Date().toISOString(),
      });
      say("ok", `해석 리포트 재생성 (${source})`);
    } catch (err: any) {
      say("err", `리포트 생성 실패: ${err?.message || err}`);
    } finally {
      setBusy("");
    }
  }

  function exportXlsx() {
    if (!state.interpretation.trim() && !state.codebook.length) {
      say("warn", "먼저 파이프라인을 실행하세요.");
      return;
    }
    const wb = XLSX.utils.book_new();
    const lines = (state.interpretation || "").split("\n");
    const rows: any[][] = [["섹션", "내용"]];
    let section = "";
    for (const raw of lines) {
      const line = raw.replace(/\r$/, "");
      const h = line.match(/^#{1,6}\s+(.*)$/);
      if (h) { section = h[1].trim(); rows.push([section, ""]); }
      else if (line.trim()) rows.push([section, line.replace(/^[-*]\s?/, "").trim()]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "해석리포트");

    const cbRows = [
      ["Code ID", "Code Name", "Definition", "Frequency", "TF-IDF", "Salience", "Pattern", "Quotes", "AI Confidence"],
      ...state.codebook.map((c) => [
        c.codeId, c.codeName, c.definition, c.frequency, c.tfidf, c.salienceScore,
        c.pattern, (c.representativeQuotes || []).join(" | "), c.aiConfidence,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cbRows), "AI코드북");

    const stats = sacCategoryFreq(state);
    if (stats.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["범주", "코드수", "부여빈도", "밀도(%)"],
          ...stats.map((s) => [s.label, s.codeCount, s.freq, s.densityPct]),
        ]),
        "범주빈도"
      );
    }
    const metas = sacMetaCategories(state);
    if (metas.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["상위범주", "빈도", "포함 코드"],
          ...metas.map((m) => [m.label, m.freq, m.members.join(" · ")]),
        ]),
        "상위범주"
      );
    }
    const themes = sacTopThemes(state);
    if (themes.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([
          ["상위주제", "근거"],
          ...themes.map((t) => [t.statement, t.basis.join(" · ")]),
        ]),
        "상위주제"
      );
    }
    const evRows = [
      ["Code ID", "후보코드", "대표인용", "문맥", "관련개념"],
      ...state.evidence.map((e) => [
        e.codeId, e.candidateCode,
        (e.representativeQuotes || []).join(" | "),
        e.context,
        (e.relatedConcepts || []).join(", "),
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(evRows), "Evidence");

    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    download(`ai-codebook-${state.title || "report"}.xlsx`, new Uint8Array(out), "application/octet-stream");
    say("ok", "엑셀 저장 — 해석·AI코드북·범주빈도·상위범주·상위주제·Evidence 시트");
  }

  function exportPdf() {
    if (!state.interpretation.trim()) {
      say("warn", "먼저 해석 리포트를 생성하세요.");
      return;
    }
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const bodyHtml = state.interpretation.split("\n").map((raw) => {
      const line = raw.replace(/\r$/, "");
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { const lv = Math.min(h[1].length, 3); return `<h${lv}>${esc(h[2])}</h${lv}>`; }
      if (/^[-*]\s+/.test(line)) return `<li>${esc(line.replace(/^[-*]\s+/, ""))}</li>`;
      if (line.trim()) return `<p>${esc(line)}</p>`;
      return "";
    }).join("\n");
    const stats = sacCategoryFreq(state);
    const metas = sacMetaCategories(state);
    const themes = sacTopThemes(state);
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${esc(state.title || "AI 표준 코딩북")}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: -apple-system, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; color:#1a1a1a; line-height:1.6; font-size:12.5px; }
  h1 { font-size:20px; border-bottom:2px solid #333; padding-bottom:6px; }
  h2 { font-size:15px; margin-top:18px; } h3 { font-size:13.5px; margin-top:12px; }
  table { border-collapse:collapse; width:100%; margin-top:8px; font-size:11.5px; }
  th,td { border:1px solid #bbb; padding:4px 6px; text-align:left; } th { background:#f0f0f0; }
  .meta { color:#666; font-size:11px; margin-bottom:14px; }
</style></head><body>
<h1>${esc(state.title || "AI 표준 코딩북")} — 최종 해석 리포트</h1>
<div class="meta">생성 ${new Date().toLocaleString("ko-KR")} · 세그먼트 ${state.segments.length} · 코드 ${state.codebook.length} · Evidence ${state.evidence.length}</div>
${bodyHtml}
${stats.length ? `<h2>부록 A. 범주 빈도</h2><table><tr><th>범주</th><th>코드수</th><th>빈도</th><th>밀도(%)</th></tr>${stats.map((s) => `<tr><td>${esc(s.label)}</td><td>${s.codeCount}</td><td>${s.freq}</td><td>${s.densityPct}</td></tr>`).join("")}</table>` : ""}
${metas.length ? `<h2>부록 B. 상위범주</h2><ul>${metas.map((m) => `<li><b>${esc(m.label)}</b> (${m.freq}) — ${esc(m.members.join(" · "))}</li>`).join("")}</ul>` : ""}
${themes.length ? `<h2>부록 C. 상위주제</h2><ul>${themes.map((t) => `<li>${esc(t.statement)}</li>`).join("")}</ul>` : ""}
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { say("warn", "팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요."); return; }
    w.document.open(); w.document.write(html); w.document.close();
    say("ok", "PDF 인쇄창 열림 — ‘PDF로 저장’을 선택하세요.");
  }

  function resetAll() {
    if (!window.confirm("표준 코딩북 작업을 초기화할까요? (원자료 포함)")) return;
    onChange(emptyStandardAiCodebook());
    say("info", "표준 코딩북 상태가 초기화되었습니다.");
  }

  const doneCalc = !!state.analytics;
  const doneEv = state.evidence.length > 0;
  const doneInf = state.inferences.length > 0;
  const doneCb = state.codebook.length > 0;
  const doneRep = !!state.interpretation.trim();

  return (
    <div className="space-y-4">
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 flex-wrap">
          <BookMarked size={18} />
          <h2 className={h2}>AI 기반 질적연구 표준 코딩북 만들기 및 해석</h2>
          {state.source && <span className={chip} style={softStyle}>소스: {state.source}</span>}
          {state.updatedAt && (
            <span className="text-[11.5px] text-ink-3 ml-auto">
              갱신 {new Date(state.updatedAt).toLocaleString("ko-KR")}
            </span>
          )}
        </div>
        <p className={`mt-2 ${body}`}>
          문서 표준 프로세스 <b>원자료 → 계산 → 추론 → 코드북</b>을 따릅니다.
          Computational Analytics로 자료를 구조화하고, Evidence Extraction으로 해석 근거를 자동 생성하며,
          Interpretive Inference로 의미를 추론한 뒤 Living AI Codebook과 최종 해석 리포트를 만듭니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PIPE_STEPS.map((s, i) => {
            const ok =
              (s.id === "raw" && !!(state.raw || "").trim()) ||
              (s.id === "calc" && doneCalc) ||
              (s.id === "evidence" && doneEv) ||
              (s.id === "infer" && doneInf) ||
              (s.id === "codebook" && doneCb) ||
              (s.id === "report" && doneRep);
            return (
              <span key={s.id} className={chip} style={ok ? { ...softStyle, borderColor: "var(--brand-ink)" } : softStyle}>
                {i + 1}. {s.label}{ok ? " ✓" : ""}
              </span>
            );
          })}
        </div>
      </div>

      {/* 연구 프레임 + 원자료 */}
      <div className={card} style={cardStyle}>
        <h2 className={h2}>1️⃣ 연구 프레임 · 원자료 불러오기</h2>
        <p className="mt-1 text-[13px] text-ink-2">PDF · 텍스트(.txt/.md/.csv) · 엑셀(.xlsx/.xls) · DOCX 지원. 여러 파일을 이어서 병합할 수 있습니다.</p>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <label className="block text-[12.5px] text-ink-3">
            프로젝트 제목
            <input className="mt-1 w-full rounded border px-2.5 py-1.5 text-[13.5px]" style={cardStyle}
              value={state.title} onChange={(e) => patch({ title: e.target.value })}
              placeholder="예: 돌봄 경험 인터뷰 코딩북" />
          </label>
          <label className="block text-[12.5px] text-ink-3">
            연구질문
            <input className="mt-1 w-full rounded border px-2.5 py-1.5 text-[13.5px]" style={cardStyle}
              value={state.question} onChange={(e) => patch({ question: e.target.value })}
              placeholder="예: 참여자들은 돌봄 부담을 어떻게 의미화하는가?" />
          </label>
        </div>
        <label className="block mt-3 text-[12.5px] text-ink-3">
          연구목적 (선택)
          <input className="mt-1 w-full rounded border px-2.5 py-1.5 text-[13.5px]" style={cardStyle}
            value={state.purpose} onChange={(e) => patch({ purpose: e.target.value })}
            placeholder="연구 목적·맥락을 한 줄로" />
        </label>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <input ref={fileRef} type="file" multiple
            accept=".pdf,.txt,.md,.csv,.xlsx,.xls,.docx,.doc,.json"
            className="hidden" onChange={onImportFiles} />
          <button type="button" disabled={!!busy}
            onClick={() => fileRef.current?.click()}
            className={btnPrimary} style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>
            <Upload size={14} /> 원자료 불러오기
          </button>
          <button type="button" onClick={resetAll} className={btnGhost} style={cardStyle}>
            <RotateCcw size={13} /> 초기화
          </button>
          {(state.fileNames || []).length > 0 && (
            <span className={chip} style={softStyle}>파일 {(state.fileNames || []).join(", ")}</span>
          )}
          <span className={chip} style={softStyle}>{(state.raw || "").length.toLocaleString()}자</span>
        </div>
        <textarea
          rows={8}
          className="mt-3 w-full rounded-lg border px-3 py-2 text-[13px] leading-relaxed"
          style={cardStyle}
          placeholder="여기에 원자료를 붙여넣거나, 위에서 파일을 불러오세요."
          value={state.raw}
          onChange={(e) => patch({ raw: e.target.value })}
        />
      </div>

      {/* 실행 */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className={h2}>2️⃣ 파이프라인 실행</h2>
          <button type="button" disabled={!!busy || !(state.raw || "").trim()}
            onClick={runPipeline}
            className={btnPrimary + " ml-auto"} style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>
            <Play size={14} /> {busy === "pipeline" ? "실행 중…" : "원자료→계산→추론→코드북 실행"}
          </button>
        </div>
        <p className="mt-2 text-[13px] text-ink-2">
          AI(또는 규칙 기반 폴백)가 Computational Analytics → Evidence Extraction → Interpretive Inference → AI Codebook → 해석 리포트까지 생성합니다.
        </p>
        {prog && <div className="mt-3"><AiProgressBar progress={prog} label="표준 코딩북 파이프라인" /></div>}
      </div>

      {/* 계산 / Evidence / Codebook 요약 */}
      {doneCalc && state.analytics && (
        <div className={card} style={cardStyle}>
          <h2 className={h2}>3️⃣ Computational Analytics · Evidence · Inference</h2>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border p-3" style={softStyle}>
              <div className={h3}>Frequency / TF-IDF</div>
              <ul className="mt-2 text-[12.5px] text-ink-2 space-y-1 max-h-48 overflow-y-auto">
                {state.analytics.frequency.slice(0, 12).map((f) => {
                  const ev = state.evidence.find((e) => e.candidateCode === f.term);
                  const quote = ev?.representativeQuotes?.[0] || ev?.relatedSentences?.[0];
                  return (
                    <li key={f.term}>
                      <div>{f.term} · {f.count}회
                        <span className="text-ink-3"> (tfidf {state.analytics!.tfidf.find((t) => t.term === f.term)?.score ?? "-"})</span>
                      </div>
                      {quote && <div className="text-[11.5px] italic text-ink-3 truncate">근거: “{quote}”</div>}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-xl border p-3" style={softStyle}>
              <div className={h3}>Co-occurrence · Cluster</div>
              <ul className="mt-2 text-[12.5px] text-ink-2 space-y-0.5 max-h-48 overflow-y-auto">
                {state.analytics.cooccurrence.slice(0, 8).map((p, i) => (
                  <li key={i}>{p.a} ↔ {p.b} ({p.count})</li>
                ))}
                {state.analytics.clusters.slice(0, 4).map((c) => {
                  const hub = c.members[0];
                  const quote = state.evidence.find((e) => e.candidateCode === hub)?.representativeQuotes?.[0];
                  return (
                    <li key={c.id} className="text-ink-3">
                      {c.label}: {c.members.slice(0, 4).join(", ")}
                      {quote && <div className="italic">근거: “{quote}”</div>}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-xl border p-3" style={softStyle}>
              <div className={h3}>Evidence Packages</div>
              <ul className="mt-2 text-[12.5px] text-ink-2 space-y-1 max-h-48 overflow-y-auto">
                {state.evidence.slice(0, 8).map((e) => (
                  <li key={e.codeId}>
                    <b>{e.codeId} {e.candidateCode}</b>
                    <div className="text-ink-3 truncate">{e.representativeQuotes[0] || "(인용 없음)"}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <CodingAnalyticsViz
              analytics={state.analytics}
              evidence={state.evidence}
              evidenceByTerm={Object.fromEntries(
                state.evidence.map((e) => [e.candidateCode, e.representativeQuotes || e.relatedSentences || []])
              )}
              title="자체 데이터시각화 · 빈도 · 공출현 · 의미군집"
            />
          </div>
        </div>
      )}

      {doneCb && (
        <div className={card} style={cardStyle}>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={h2}>4️⃣ AI Codebook · Pattern / Category / Theme</h2>
            <span className={chip} style={softStyle}>코드 {state.codebook.length}</span>
            <span className={chip} style={softStyle}>범주 {state.categories.length}</span>
            <span className={chip} style={softStyle}>테마 {state.themes.length}</span>
          </div>
          <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto">
            {state.codebook.map((c) => (
              <div key={c.codeId} className="rounded-lg border p-3" style={softStyle}>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={chip} style={cardStyle}>{c.codeId}</span>
                  <span className="font-semibold text-[14px]">{c.codeName}</span>
                  <span className="text-[11.5px] text-ink-3">f={c.frequency} · sal={c.salienceScore} · conf={c.aiConfidence}</span>
                </div>
                <div className="mt-1 text-[12.5px] text-ink-2">{c.definition}</div>
                <div className="mt-1 text-[12px] text-ink-3">패턴: {c.pattern}</div>
                {(c.representativeQuotes || []).slice(0, 2).map((q, i) => (
                  <div key={i} className="mt-1 text-[12px] italic text-ink-2">근거{i + 1}: “{q}”</div>
                ))}
                {!c.representativeQuotes?.length && (
                  <div className="mt-1 text-[12px] text-ink-3">(근거 문장 없음)</div>
                )}
              </div>
            ))}
          </div>
          {state.themes.length > 0 && (
            <div className="mt-3">
              <div className={h3}>테마</div>
              <ul className="mt-1 text-[13px] text-ink-2 space-y-1">
                {state.themes.map((t) => <li key={t.id}>· {t.sentence}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 해석 리포트 */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 flex-wrap">
          <FileText size={16} />
          <h2 className={h2}>5️⃣ 최종 해석 리포트</h2>
          <button type="button" disabled={!!busy || !state.codebook.length}
            onClick={regenReport} className={btnGhost + " ml-auto"} style={cardStyle}>
            <Sparkles size={13} /> {busy === "interpret" ? "생성 중…" : (state.interpretation ? "수동 재생성" : "해석 리포트 생성")}
          </button>
          <button type="button" disabled={!state.interpretation.trim()} onClick={exportPdf} className={btnGhost} style={cardStyle}>
            <Download size={13} /> PDF
          </button>
          <button type="button" disabled={!state.codebook.length} onClick={exportXlsx} className={btnGhost} style={cardStyle}>
            <Download size={13} /> 엑셀(.xlsx)
          </button>
        </div>
        <p className="mt-2 text-[12.5px] text-ink-3">
          연구 프레임 · 규모 · 핵심 발견 · 테마/범주 해석 · 개념·이론 · 잠정 답변 · 후속 체크리스트 포함.
          엑셀에는 범주 빈도·상위범주·상위주제 시트가 포함됩니다.
        </p>
        {state.interpretation ? (
          <pre className="mt-3 whitespace-pre-wrap text-[13px] text-ink-2 leading-relaxed rounded-lg border p-3 max-h-[520px] overflow-y-auto" style={softStyle}>
            {state.interpretation}
          </pre>
        ) : (
          <p className="mt-2 text-[12.5px] text-ink-3">
            파이프라인을 실행하면 AI(또는 규칙 기반 폴백)가 해석 리포트를 생성합니다. 수동 재생성도 가능합니다.
          </p>
        )}
      </div>
    </div>
  );
}
