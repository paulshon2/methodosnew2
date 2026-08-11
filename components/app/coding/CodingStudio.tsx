"use client";
/**
 * 코딩 스튜디오
 *
 * 답하는 질문: "이 발언은 어떤 코드인가?"
 *
 * 코딩 단위를 문장으로 고정한 것이 이 화면의 핵심 결정이다.
 * 임의 범위를 끌어 지정하면 코더마다 단위가 달라져 일치도(κ)를 계산할 수 없고, 키보드만으로는 코딩할 수 없다.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Download, Undo2 } from "lucide-react";
import Inspector from "@/components/ui/Inspector";
import Note from "@/components/ui/Note";
import PageHead from "@/components/ui/PageHead";
import Segmented from "@/components/ui/Segmented";
import StudioGuide, { IoToolbar } from "@/components/ui/StudioGuide";
import Workspace from "@/components/ui/Workspace";
import { useKeyboard } from "@/hooks/useKeyboard";
import type { PickMode } from "@/hooks/useSelection";
import {
  codingWorkbookSheets,
  exportTranscriptCsv,
  exportTranscriptPlain,
  importCodingFileText,
  importCodingXlsx,
} from "@/lib/coding-io";
import { downloadBlob, exportSimplePdf, exportTableXlsx } from "@/lib/viz-export";
import {
  allCodes,
  codingCsv,
  progress,
  CODE_PALETTE,
  SAMPLE_ASSIGN,
  SAMPLE_CODER2,
  SAMPLE_DOCS,
  SAMPLE_KINDS,
  SAMPLE_THEMES,
  type Assign,
  type Code,
  type Doc,
  type Theme,
} from "@/lib/coding-types";
import { CODING_TOPIC_PACKS, seedAssignForPack } from "@/lib/coding-topic-packs";
import CodebookTree from "./CodebookTree";
import CodeMemoPanel from "./CodeMemoPanel";
import CodePopover, { type PopAt } from "./CodePopover";
import CodingTopicAccordion from "./CodingTopicAccordion";
import QuotesPanel from "./QuotesPanel";
import ReliabilityPanel from "./ReliabilityPanel";
import TranscriptView, { type SegFilter } from "./TranscriptView";

export default function CodingStudio({ nav }: { nav: (r: string) => void }) {
  const [topicId, setTopicId] = useState(CODING_TOPIC_PACKS[0]?.id || "flow");
  const pack = CODING_TOPIC_PACKS.find((p) => p.id === topicId) || CODING_TOPIC_PACKS[0];

  // 몰입(flow)은 기존 손코딩·κ 비교 자료를 유지하고, 나머지는 주제 팩을 쓴다.
  const useLegacyFlow = topicId === "flow";
  const baseDocs = useMemo(() => (useLegacyFlow ? SAMPLE_DOCS : pack.docs), [useLegacyFlow, pack]);
  const [sessionDocs, setSessionDocs] = useState<Doc[] | null>(null);
  const [importLabel, setImportLabel] = useState<string | null>(null);
  const docs = sessionDocs ?? baseDocs;
  const kinds = useMemo(() => (useLegacyFlow ? SAMPLE_KINDS : [...new Set(docs.map((d) => d.kind))]), [useLegacyFlow, docs]);

  const [themes, setThemes] = useState<Theme[]>(useLegacyFlow ? SAMPLE_THEMES : pack.themes);
  const [assign, setAssign] = useState<Assign>(useLegacyFlow ? SAMPLE_ASSIGN : seedAssignForPack(pack));
  const [docId, setDocId] = useState(baseDocs[0]?.id ?? "");
  const [sel, setSel] = useState<string[]>([]);
  const [filter, setFilter] = useState<SegFilter>("all");
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pop, setPop] = useState<PopAt>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [docMenuPos, setDocMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const docMenuRef = useRef<HTMLDivElement>(null);
  const docBtnRef = useRef<HTMLButtonElement>(null);
  const anchor = useRef<string | null>(null);
  const undo = useRef<Assign[]>([]);

  const doc = docs.find((d) => d.id === docId) ?? docs[0];

  useLayoutEffect(() => {
    if (!docOpen || !docBtnRef.current) {
      setDocMenuPos(null);
      return;
    }
    const place = () => {
      const r = docBtnRef.current!.getBoundingClientRect();
      setDocMenuPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 320) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [docOpen]);

  useEffect(() => {
    if (!docOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (docMenuRef.current?.contains(t) || docBtnRef.current?.contains(t)) return;
      setDocOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDocOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [docOpen]);
  const codes = useMemo(() => allCodes(themes), [themes]);
  const codeMap = useMemo(() => Object.fromEntries(codes.map((c) => [c.id, c])) as Record<string, Code>, [codes]);
  const stat = progress(docs, assign);

  const coder2 = useMemo(() => {
    if (useLegacyFlow) return SAMPLE_CODER2;
    // 주제 팩: 일부 문장만 인접 코드로 갈라 κ 연습이 되게 한다.
    const codesList = allCodes(themes);
    const out: Record<string, string> = {};
    let i = 0;
    for (const [seg, arr] of Object.entries(assign)) {
      const c = arr[0];
      if (!c) continue;
      const idx = codesList.findIndex((x) => x.id === c);
      out[seg] = i % 5 === 3 && idx >= 0 ? codesList[(idx + 1) % codesList.length].id : c;
      i++;
    }
    return out;
  }, [useLegacyFlow, assign, themes]);

  const pickTopic = useCallback((next: (typeof CODING_TOPIC_PACKS)[0]) => {
    setTopicId(next.id);
    const legacy = next.id === "flow";
    const nextDocs = legacy ? SAMPLE_DOCS : next.docs;
    setSessionDocs(null);
    setImportLabel(null);
    setThemes(legacy ? SAMPLE_THEMES : next.themes);
    setAssign(legacy ? SAMPLE_ASSIGN : seedAssignForPack(next));
    setDocId(nextDocs[0]?.id || "");
    setSel([]);
    setPop(null);
    setActive(null);
    undo.current = [];
  }, []);

  const applyImport = useCallback((result: { docs: Doc[]; assign: Assign; label: string }) => {
    if (!result.docs.length) return;
    setSessionDocs(result.docs);
    setImportLabel(result.label);
    setDocId(result.docs[0].id);
    setAssign(result.assign);
    setSel([]);
    setPop(null);
    setActive(null);
    undo.current = [];
  }, []);

  const onImportCsv = useCallback(
    (f: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const result = importCodingFileText(text, themes, f.name);
        if (result) applyImport(result);
        else if (typeof window !== "undefined") window.alert("불러올 수 있는 전사·코딩 형식이 아닙니다.");
      };
      reader.readAsText(f, "UTF-8");
    },
    [themes, applyImport],
  );

  const onImportXlsx = useCallback(
    async (f: File) => {
      try {
        const result = await importCodingXlsx(f, themes);
        if (result) applyImport(result);
        else if (typeof window !== "undefined") window.alert("불러올 수 있는 전사·코딩 형식이 아닙니다.");
      } catch {
        if (typeof window !== "undefined") window.alert("Excel 파일을 읽지 못했습니다.");
      }
    },
    [themes, applyImport],
  );

  const exportBaseName = useMemo(() => {
    const slug = (doc.title || "coding").replace(/[^\w가-힣]+/g, "_").slice(0, 40);
    return `methodos-coding-${slug}`;
  }, [doc.title]);

  const onExportCsv = useCallback(() => {
    if (docs.length === 1) {
      downloadBlob(`${exportBaseName}-transcript.csv`, exportTranscriptCsv(docs[0]), "text/csv;charset=utf-8");
      return;
    }
    const merged = docs.map((d) => exportTranscriptCsv(d).split("\n").slice(1).join("\n")).join("\n");
    const head = exportTranscriptCsv(docs[0]).split("\n")[0];
    downloadBlob(`${exportBaseName}-transcript.csv`, `${head}\n${merged}`, "text/csv;charset=utf-8");
  }, [docs, exportBaseName]);

  const onExportXlsx = useCallback(() => {
    exportTableXlsx(`${exportBaseName}.xlsx`, codingWorkbookSheets(docs, themes, assign));
  }, [docs, themes, assign, exportBaseName]);

  const onExportPdf = useCallback(() => {
    exportSimplePdf({
      filename: `${exportBaseName}.pdf`,
      title: doc.title,
      lines: exportTranscriptPlain(doc).replace(/^\ufeff/, "").split("\n"),
    });
  }, [doc, exportBaseName]);

  const exportCodingCsv = useCallback(
    () => downloadBlob(`${exportBaseName}-coding.csv`, codingCsv(docs, themes, assign), "text/csv;charset=utf-8"),
    [docs, themes, assign, exportBaseName],
  );

  /** 선택한 문장이 전부 그 코드를 갖고 있으면 해제, 아니면 부여한다. */
  const apply = useCallback(
    (codeId: string, target: string[] = sel) => {
      if (!target.length) return;
      undo.current.push(assign);
      const allHave = target.every((s) => (assign[s] ?? []).includes(codeId));
      const next: Assign = { ...assign };
      target.forEach((s) => {
        const cur = next[s] ?? [];
        const after = allHave ? cur.filter((c) => c !== codeId) : cur.includes(codeId) ? cur : [...cur, codeId];
        if (after.length) next[s] = after;
        else delete next[s];
      });
      setAssign(next);
      setPop(null);
    },
    [assign, sel],
  );

  const pickSeg = useCallback(
    (id: string, mode: PickMode, el: HTMLElement) => {
      const ids = doc.segs.map((s) => s.id);
      setSel((cur) => {
        if (mode === "toggle") {
          anchor.current = id;
          return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        }
        if (mode === "range" && anchor.current) {
          const a = ids.indexOf(anchor.current);
          const b = ids.indexOf(id);
          if (a >= 0 && b >= 0) {
            const [lo, hi] = a < b ? [a, b] : [b, a];
            return ids.slice(lo, hi + 1);
          }
        }
        anchor.current = id;
        return [id];
      });
      const r = el.getBoundingClientRect();
      setPop({ x: r.left, y: r.bottom + 6 });
    },
    [doc],
  );

  const step = useCallback(
    (delta: number) => {
      const ids = doc.segs.map((s) => s.id);
      const from = sel.length ? ids.indexOf(sel[sel.length - 1]) : -1;
      const i = Math.max(0, Math.min(ids.length - 1, from + delta));
      const id = ids[i];
      setSel([id]);
      anchor.current = id;
      const el = document.getElementById(`seg-${id}`);
      el?.scrollIntoView({ block: "nearest" });
      if (el) {
        const r = el.getBoundingClientRect();
        setPop({ x: r.left, y: r.bottom + 6 });
      }
    },
    [doc, sel],
  );

  const undoOnce = useCallback(() => {
    const prev = undo.current.pop();
    if (prev) setAssign(prev);
  }, []);

  const goSeg = useCallback((segId: string) => {
    const owner = docs.find((d) => d.segs.some((s) => s.id === segId));
    if (owner) setDocId(owner.id);
    setSel([segId]);
    anchor.current = segId;
    setPop(null);
    requestAnimationFrame(() => document.getElementById(`seg-${segId}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  }, [docs]);

  useKeyboard(
    useMemo(() => {
      const map: Record<string, (e: KeyboardEvent) => void> = {
        Escape: () => {
          setSel([]);
          setPop(null);
        },
        "ctrl+z": (e) => {
          e.preventDefault();
          undoOnce();
        },
        ArrowDown: (e) => {
          e.preventDefault();
          step(1);
        },
        ArrowUp: (e) => {
          e.preventDefault();
          step(-1);
        },
      };
      // 1~9 — 코드북 순서대로 적용·해제한다.
      codes.slice(0, 9).forEach((c, i) => {
        map[String(i + 1)] = (e) => {
          if (!sel.length) return;
          e.preventDefault();
          apply(c.id);
        };
      });
      return map;
    }, [codes, sel, apply, step, undoOnce]),
  );

  const pickCode = useCallback(
    (codeId: string) => {
      if (sel.length) apply(codeId);
      else setActive((cur) => (cur === codeId ? null : codeId));
    },
    [sel, apply],
  );

  const patchCode = useCallback((next: Code) => {
    setThemes((ts) => ts.map((t) => ({ ...t, codes: t.codes.map((c) => (c.id === next.id ? next : c)) })));
  }, []);

  const addCode = useCallback(() => {
    const name = typeof window !== "undefined" ? window.prompt("새 코드 이름") : null;
    if (!name) return;
    setThemes((ts) => {
      const n = ts.flatMap((t) => t.codes).length;
      const code: Code = { id: `c${Date.now()}`, name, color: CODE_PALETTE[n % CODE_PALETTE.length], memo: "" };
      return ts.map((t, i) => (i === 0 ? { ...t, codes: [...t.codes, code] } : t));
    });
  }, []);


  const main = (
    <div>
      <PageHead
        title="코딩 스튜디오"
        expert={{ label: "1차·2차 코딩 절차와 AI 보조", onOpen: () => nav("tools/coding/classic") }}
        right={
          <Segmented<SegFilter>
            label="문장 보기 필터"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "전체" },
              { id: "uncoded", label: "미코딩만", hint: "코딩된 문장을 흐리게 합니다" },
              { id: "coded", label: "코딩된 것만", hint: "미코딩 문장을 흐리게 합니다" },
            ]}
          />
        }
      />

      <StudioGuide
        why="질적 자료에서 ‘이 발언이 무엇을 말하는가’를 코드로 고정해야, 인용·메모·코더 간 일치도(κ)를 같은 단위로 쌓을 수 있습니다. 코딩 단위를 문장으로 고정한 이유는 임의 범위 선택이 코더마다 달라져 κ를 계산할 수 없기 때문입니다."
        steps={[
          { title: "주제 고르기", body: "왼쪽 ‘코딩 예제 주제’에서 형식·주제를 고릅니다. 주제마다 코드북과 분석자료가 바뀝니다." },
          { title: "자료 고르기", body: "‘분석 중인 자료’에서 면담·초점집단 등 시연 자료를 고릅니다." },
          { title: "문장 선택", body: "가운데 전사문을 누르거나 방향키로 옮깁니다. Shift+클릭으로 범위를 잡을 수 있습니다." },
          { title: "코드 부여", body: "왼쪽 코드북에서 코드를 누르거나 숫자키 1~9로 즉시 붙입니다." },
          { title: "검토", body: "오른쪽 인용문·코드 메모·신뢰도에서 근거와 코더 일치도를 확인합니다." },
        ]}
        parts={[
          { name: "코딩 예제 주제", body: "20가지 이상 주제·형식을 아코디언으로 고릅니다." },
          { name: "코드북", body: "코드 이름·색·빈도. 새 코드를 추가하고 주제를 펼치거나 접습니다." },
          { name: "분석 중인 자료", body: "지금 코딩할 전사 문서를 바꿉니다. Excel·CSV·연구자/참여자 텍스트로 연구자 자료를 불러올 수 있습니다." },
          { name: "문장 보기 필터", body: "전체 / 미코딩만 / 코딩된 것만 — 남은 작업을 빠르게 찾습니다." },
          { name: "인용문", body: "코드별로 묶인 원문 조각. 논문·보고서 인용 후보입니다." },
          { name: "코드 메모", body: "코드 정의·포함·제외 기준을 적어 코더가 같은 뜻을 쓰게 합니다." },
          { name: "신뢰도", body: "두 코더 할당을 비교해 κ를 계산합니다. 단위가 문장이라 자동 계산이 가능합니다." },
        ]}
      />

      <div className="card mb-3 py-2.5">
        <p className="ty-small text-ink-2">
          현재 주제 · <strong>{pack.label}</strong> — {pack.researchQuestion}
        </p>
      </div>

      <div className="card mb-3 flex flex-wrap items-center gap-2 py-2.5 relative z-[60]" style={{ overflow: "visible" }}>
        <span className="ty-label font-bold" id="doc-sel-label">
          분석 중인 자료
        </span>
        <div className="relative" style={{ zIndex: 70 }}>
          <button
            type="button"
            id="doc-sel"
            ref={docBtnRef}
            className="inp inline-flex items-center gap-2 text-left"
            style={{ width: "auto", minWidth: 300 }}
            aria-labelledby="doc-sel-label"
            aria-haspopup="listbox"
            aria-expanded={docOpen}
            onClick={() => setDocOpen((v) => !v)}
          >
            <span className="flex-1 truncate">{doc.title}</span>
            <ChevronDown size={14} aria-hidden="true" className="shrink-0 opacity-70" />
          </button>
          {docOpen && docMenuPos && typeof document !== "undefined"
            ? createPortal(
                <div
                  ref={docMenuRef}
                  role="listbox"
                  aria-labelledby="doc-sel-label"
                  className="max-h-[min(420px,70vh)] overflow-y-auto rounded-xl py-1 shadow-lg"
                  style={{
                    position: "fixed",
                    top: docMenuPos.top,
                    left: docMenuPos.left,
                    width: docMenuPos.width,
                    zIndex: 10000,
                    background: "#0d1424",
                    color: "#eef2ff",
                    border: "1px solid var(--color-border-secondary)",
                  }}
                >
                  {kinds.map((k) => (
                    <div key={k}>
                      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(226,233,255,.55)" }}>
                        {k}
                      </div>
                      {docs
                        .filter((d) => d.kind === k)
                        .map((d) => {
                          const activeDoc = d.id === docId;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              role="option"
                              aria-selected={activeDoc}
                              className="flex w-full px-3 py-2 text-left text-[13px]"
                              style={{
                                background: activeDoc ? "rgba(77,124,255,.22)" : "transparent",
                                color: "#eef2ff",
                              }}
                              onMouseEnter={(e) => {
                                if (!activeDoc) e.currentTarget.style.background = "rgba(255,255,255,.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = activeDoc ? "rgba(77,124,255,.22)" : "transparent";
                              }}
                              onClick={() => {
                                setDocId(d.id);
                                setSel([]);
                                setPop(null);
                                setDocOpen(false);
                              }}
                            >
                              {d.title}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>,
                document.body,
              )
            : null}
        </div>
        <span className="ty-label text-ink-3">
          {doc.kind} · {doc.meta} · <span className="num">{doc.segs.length}</span>문장
        </span>
        <span className="ty-label text-ink-3">
          자료 <span className="num">{docs.length}</span>건 · 갈래 <span className="num">{kinds.length}</span>종
        </span>
        <span className="ty-label ml-auto text-ink-3">
          {sel.length ? `${sel.length}개 문장 선택됨 — 코드를 누르거나 숫자키를 누르세요` : "문장을 눌러 선택 · Shift+클릭으로 범위 선택"}
        </span>
        <button type="button" className="btn btn-sm" onClick={undoOnce} disabled={!undo.current.length}>
          <Undo2 size={14} aria-hidden="true" /> 되돌리기
        </button>
        <button type="button" className="btn btn-sm" onClick={() => { setSel([]); setPop(null); }} disabled={!sel.length}>
          선택 해제
        </button>
        <button type="button" className="btn btn-sm" onClick={exportCodingCsv}>
          <Download size={14} aria-hidden="true" /> 코딩 결과 CSV
        </button>
      </div>

      <div className="card mb-3 py-2.5">
        <p className="ty-small text-ink-2 mb-0">
          연구자 전사는 <strong>연구자</strong> / <strong>참여자</strong> 줄과 발화 블록(다음1 형식), 또는 표(발화자·발화)로 불러옵니다. Excel은 「전사」「코딩」 시트로 내보냅니다.
        </p>
        <IoToolbar
          onImportCsv={onImportCsv}
          onImportXlsx={onImportXlsx}
          onExportCsv={onExportCsv}
          onExportXlsx={onExportXlsx}
          onExportPdf={onExportPdf}
          fileLabel={importLabel || (sessionDocs ? "연구자 불러오기" : undefined)}
          disabledExport={!docs.length}
        />
      </div>

      <div className="card">
        <TranscriptView doc={doc} assign={assign} codeMap={codeMap} sel={sel} filter={filter} onPick={pickSeg} />
      </div>

      <CodePopover at={pop} themes={themes} sel={sel} assign={assign} onApply={(c) => apply(c)} onClose={() => setPop(null)} />
    </div>
  );

  return (
    <Workspace
      rail={
        <div className="space-y-3">
          <CodingTopicAccordion activeId={topicId} onPick={pickTopic} />
          <CodebookTree
            themes={themes}
            assign={assign}
            active={active}
            query={query}
            onQuery={setQuery}
            onPick={pickCode}
            onToggleTheme={(id) => setThemes((ts) => ts.map((t) => (t.id === id ? { ...t, open: !t.open } : t)))}
            onAddCode={addCode}
          />
          <Note level="info" title="코딩 단위는 문장입니다">
            단위를 고정했기 때문에 코더 간 일치도(κ)를 자동으로 계산할 수 있습니다. 문장을 누르고 1~9를 누르면 즉시 코딩됩니다.
          </Note>
        </div>
      }
      railTitle="주제·코드북"
      main={main}
      inspector={
        <Inspector
          tabs={[
            {
              id: "quotes",
              label: "인용문",
              content: <QuotesPanel code={active ? codeMap[active] : null} docs={docs} assign={assign} codeMap={codeMap} onGo={goSeg} />,
            },
            { id: "memo", label: "코드 메모", content: <CodeMemoPanel code={active ? codeMap[active] : null} onChange={patchCode} /> },
            {
              id: "rel",
              label: "신뢰도",
              content: <ReliabilityPanel docs={docs} assign={assign} coder2={coder2} codeMap={codeMap} onGo={goSeg} />,
            },
          ]}
        />
      }
      inspectorTitle="인용문·메모·신뢰도"
      statusbar={
        <>
          <span>
            코딩 진행 <strong className="num">{stat.pct}%</strong>
          </span>
          <span className="h-1.5 w-[110px] overflow-hidden rounded-full" style={{ background: "var(--color-background-tertiary)" }} aria-hidden="true">
            <span className="block h-full rounded-full" style={{ width: `${stat.pct}%`, background: "var(--brand)" }} />
          </span>
          <span className="text-ink-3">
            미코딩 <strong className="num">{stat.total - stat.coded}</strong>문장
          </span>
          <span className="text-ink-3">
            코드 적용 <strong className="num">{stat.applied}</strong>회
          </span>
          <span className="text-ink-3">1–9 코드 적용 · ↑↓ 문장 이동 · Shift+클릭 범위 · Ctrl+Z 되돌리기 · Esc 해제</span>
        </>
      }
    />
  );
}
