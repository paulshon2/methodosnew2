"use client";
// 연구방법별 표준 시각화 — 전체.docx: 초보 설명·기입·I/O·해석 강화

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  METHODS, ONT, VDEFS, METS, MKD, PIPE_LABELS,
  METHOD_EASY, ANALYSIS_GLOSS, buildDetailedReport,
  ensureChart, destroyAllCharts, paintCharts,
  type StdMethod,
} from "@/lib/research-viz-standard";
import {
  expandCatalogMethods,
  loadMethodCatalogMethods,
  type ExpandedVizMethod,
} from "@/lib/research-viz-catalog";
import {
  glossForTemplate,
  personalizeOntology,
  draftTemplateFor,
  type OntItem,
} from "@/lib/research-viz-profiles";
import { useAnnotation } from "./annotations";

const PM: Record<string, string> = { Few: "few", Tufte: "tufte", Knaflic: "knaflic" };

function varTag(t: string) {
  if (t.includes("Nominal")) return <span className="rv-tag rv-tag-c">{t}</span>;
  if (t.includes("Ordinal")) return <span className="rv-tag rv-tag-o">{t}</span>;
  if (t.includes("Date")) return <span className="rv-tag rv-tag-r">{t}</span>;
  if (t.includes("Binary")) return <span className="rv-tag rv-tag-b">{t}</span>;
  return <span className="rv-tag rv-tag-n">{t}</span>;
}

function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function surveyCsvTemplate() {
  return [
    "respondent_id,work_life,teamwork,manager_support,career,pay",
    "1,4,5,3,3,2",
    "2,5,4,4,4,3",
    "3,3,5,3,2,3",
    "4,4,4,2,3,2",
    "5,2,3,3,4,4",
  ].join("\n");
}

export default function VizStandard({
  nav,
}: {
  nav: (r: string) => void;
  allowedCharts?: Set<string> | null;
}) {
  const [stage, setStage] = useState(1);
  const [method, setMethod] = useState<ExpandedVizMethod | null>(null);
  const [catalogMethods, setCatalogMethods] = useState<ExpandedVizMethod[]>([]);
  const [methodQuery, setMethodQuery] = useState("");
  const [data, setData] = useState<unknown>(null);
  const [sel, setSel] = useState<Record<string, number[]>>({});
  const [report, setReport] = useState<string | null>(null);
  const [openAcc, setOpenAcc] = useState<string | null>(null);
  const [draft, setDraft] = useState("작업집중도,4\n팀소통,5\n관리자지원,3");
  const [aiQ, setAiQ] = useState("");
  const [aiA, setAiA] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { replace: replaceAnnot } = useAnnotation();

  const tpl = (m: ExpandedVizMethod) => m.templateId;

  const ontology = useMemo((): OntItem[] => {
    if (!method) return [];
    const base = (ONT[tpl(method)] || []) as OntItem[];
    // 차트 렌더러 인덱스와 맞추기 위해 순서는 유지하고, 문구만 방법 특화
    return personalizeOntology(base, method.nm, method.id);
  }, [method]);

  const analysisGloss = useMemo(
    () => (method ? glossForTemplate(tpl(method)) : glossForTemplate("correlation")),
    [method]
  );

  // Analysis Engine 용어(맞는 예/틀린 예) → 왼쪽 📒 용어 주석
  useEffect(() => {
    if (stage !== 2 || !method) return;
    replaceAnnot(
      analysisGloss.map((g) => ({
        term: g.term,
        def: `${g.easy}\n✓ 맞는 예: ${g.ok}\n✕ 틀린 예: ${g.bad}`,
      }))
    );
  }, [stage, method, analysisGloss, replaceAnnot]);

  useEffect(() => {
    loadMethodCatalogMethods().then((rows) => {
      const expanded = expandCatalogMethods(rows);
      setCatalogMethods(expanded.length ? expanded : expandCatalogMethods(
        METHODS.map((m) => ({ methodId: m.id, name_ko: m.nm, macro: m.cat, family: m.cat }))
      ));
    });
  }, []);

  const reportMethod = (m: ExpandedVizMethod): StdMethod => {
    const base = METHODS.find((b) => b.id === m.templateId) || METHODS[0];
    return { ...base, nm: m.nm, desc: m.desc, n: m.n, dt: m.dt, out: m.out, col: m.col };
  };

  const filteredMethods = useMemo(() => {
    const q = methodQuery.trim().toLowerCase();
    if (!q) return catalogMethods;
    return catalogMethods.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.nm.toLowerCase().includes(q) ||
        m.cat.toLowerCase().includes(q)
    );
  }, [catalogMethods, methodQuery]);

  const indices = useMemo(() => {
    if (!method) return [0, 1, 2];
    return sel[method.id] ?? [0, 1, 2];
  }, [method, sel]);

  const go = (n: number) => {
    if (n > stage || (n > 1 && !method)) return;
    setStage(n);
  };
  const next = () => setStage((s) => Math.min(6, s + 1));

  const pickMethod = (m: ExpandedVizMethod) => {
    setMethod(m);
    setData(MKD(tpl(m)));
    setDraft(draftTemplateFor(tpl(m), m.nm));
    // 방법별 기본 체크 조합을 다르게 (0~2 중 2~3개)
    const h = m.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const all = [0, 1, 2];
    const picks = h % 2 === 0 ? all : [h % 3, (h + 1) % 3].sort((a, b) => a - b);
    setSel((prev) => ({ ...prev, [m.id]: prev[m.id] ?? picks }));
    setOpenAcc(m.id);
  };

  const toggleChart = (i: number) => {
    if (!method) return;
    setSel((prev) => {
      const cur = [...(prev[method.id] ?? [0, 1, 2])];
      const x = cur.indexOf(i);
      if (x > -1) cur.splice(x, 1); else cur.push(i);
      cur.sort((a, b) => a - b);
      return { ...prev, [method.id]: cur.length ? cur : [i] };
    });
  };

  useEffect(() => {
    if (stage !== 2 || !method) return;
    setData(MKD(tpl(method)));
  }, [stage, method]);

  useEffect(() => {
    if (!method || !data || (stage !== 4 && stage !== 5)) return;
    let cancelled = false;
    const prefix = stage === 4 ? "ch" : "db";
    (async () => {
      await ensureChart();
      if (cancelled) return;
      destroyAllCharts();
      setTimeout(() => { if (!cancelled) paintCharts(tpl(method), data, indices, prefix); }, 80);
    })();
    return () => { cancelled = true; destroyAllCharts(); };
  }, [stage, method, data, indices]);

  const buildLocalReport = useCallback(() => {
    if (!method || !data) return;
    setReport(buildDetailedReport(reportMethod(method), data, indices));
  }, [method, data, indices]);

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setDraft(text.slice(0, 4000));
      if (method) setData(MKD(tpl(method))); // 데모: 샘플 유지 + 사용자 원문 보관
    };
    reader.readAsText(file);
  };

  const askTerm = () => {
    const q = aiQ.trim();
    if (!q) return;
    const hit = analysisGloss.find((g) => q.includes(g.term.split(" ")[0]) || g.term.toLowerCase().includes(q.toLowerCase()) || q.includes(g.term))
      || ANALYSIS_GLOSS.find((g) => q.includes(g.term.split(" ")[0]) || g.term.toLowerCase().includes(q.toLowerCase()) || q.includes(g.term));
    if (hit) {
      setAiA(`【${hit.term}】\n쉬운 설명: ${hit.easy}\n맞는 예: ${hit.ok}\n틀린 예: ${hit.bad}`);
      return;
    }
    const me = method ? METHOD_EASY[tpl(method)] : null;
    setAiA(
      me
        ? `「${q}」에 대한 안내 (${method?.id} · ${method?.nm}):\n${me.summary}\n예) ${me.example}\n시각화 파이프라인: ${method?.desc}`
        : `「${q}」— 먼저 연구방법(1단계)을 고른 뒤 다시 물어 보세요.`
    );
  };

  const cats = [...new Set(filteredMethods.map((m) => m.cat))];
  const interpretBlock = (ci: number) => {
    if (!method) return null;
    const o = ontology[ci];
    if (!o) return null;
    return (
      <div className="mt-2 rounded-md p-2.5 text-[11.5px] leading-relaxed" style={{ background: "var(--color-background-secondary)" }}>
        <strong>쉬운 해석 · {o.nm}</strong>
        <p className="mb-0 mt-1 whitespace-pre-wrap">{o.detail || o.easy || o.r}</p>
      </div>
    );
  };

  return (
    <div className="rv-root text-[14px]">
      <button className="btn btn-sm mb-2.5" onClick={() => nav("tools/charts/list")}>← 그래프 카탈로그</button>
      <h1 className="text-[22px] font-semibold mb-1">연구방법별 추천 그래프</h1>
      <p className="text-[14px] text-ink-2 mb-4">{catalogMethods.length}개 연구방법 · 6단계 파이프라인 표준 시각화</p>

      <div className="rv-pipe mb-4">
        {PIPE_LABELS.map((label, i) => {
          const n = i + 1;
          const cl = n < stage ? "done" : n === stage ? "active" : "locked";
          return (
            <span key={label} className="flex items-center gap-0 shrink-0">
              <button type="button" className={`rv-ps ${cl}`} onClick={() => go(n)} disabled={n > stage || (n > 1 && !method)}>
                <span className="rv-ps-n">{n < stage ? "✓" : n}</span>
                <span>{label}</span>
              </button>
              {i < 5 && <span className="rv-psep">›</span>}
            </span>
          );
        })}
      </div>

      {stage === 1 && (
        <>
          <div className="rv-slbl">연구방법 선택 ({catalogMethods.length}종) — 아키타입 31 소속 · 검색·카드 아코디언</div>
          <input
            className="inp mb-3 max-w-md text-[13px]"
            placeholder="방법 ID·이름·거시 분류 검색…"
            value={methodQuery}
            onChange={(e) => setMethodQuery(e.target.value)}
          />
          {cats.map((cat) => (
            <div key={cat} className="mb-4">
              <div className="rv-catslbl">{cat}</div>
              <div className="flex flex-col gap-2">
                {filteredMethods.filter((m) => m.cat === cat).map((m) => {
                  const open = openAcc === m.id;
                  const easy = METHOD_EASY[tpl(m)];
                  return (
                    <div key={m.id} className={`rounded-lg border ${method?.id === m.id ? "border-[var(--brand)]" : ""}`} style={{ borderColor: "var(--color-border-tertiary)" }}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 flex items-start gap-2"
                        onClick={() => { pickMethod(m); setOpenAcc(open && method?.id === m.id ? null : m.id); }}
                      >
                        <span className="text-[12px] mt-0.5">{open ? "▼" : "▶"}</span>
                        <span className="flex-1">
                          <div className="font-medium text-[13px]" style={{ color: m.col }}>{m.id} · {m.nm}</div>
                          <div className="text-[11px] text-ink-2 leading-snug">{m.desc}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] text-ink-3">
                            <span className="rv-tag rv-tag-n">{m.n}</span>
                            <span className="rv-tag rv-tag-c">{m.dt}</span>
                            <span className="rv-tag rv-tag-r">{m.out}</span>
                          </div>
                        </span>
                      </button>
                      {open && easy && (
                        <div className="px-3 pb-3 text-[12.5px] leading-relaxed border-t" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--brand-soft)" }}>
                          <p className="mt-2 mb-1"><strong>한눈에:</strong> {easy.summary}</p>
                          <p className="mb-1"><strong>예시:</strong> {easy.example}</p>
                          <p className="mb-1"><strong>언제:</strong> {easy.when}</p>
                          <p className="mb-0 text-[11.5px] text-ink-2">파이프라인: Method→Analysis→Ontology→Visualization→Dashboard→Report · 시각화 엔진={tpl(m)}</p>
                        </div>
                      )}
                      {open && !easy && (
                        <div className="px-3 pb-3 text-[12.5px] leading-relaxed border-t" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--brand-soft)" }}>
                          <p className="mt-2 mb-0">{m.desc}. 6단계 표준 시각화로 이 방법의 산출물에 맞는 그래프를 추천합니다.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" disabled={!method} onClick={next}>Analysis Engine으로 이동 ↗</button>
          </div>
        </>
      )}

      {stage === 2 && method && (
        <>
          <div className="rv-ibox mb-3">
            <strong>{method.id} · {method.nm}</strong> — Analysis Engine
            <div className="text-[12px] mt-1 opacity-90">{method.desc} · 템플릿 {tpl(method)}</div>
          </div>
          <p className="text-[12px] text-ink-2 mb-3">
            연구설계·분석 용어(맞는 예 / 틀린 예)는 왼쪽 <strong>📒 용어 주석</strong>에 이 방법에 맞춰 표시됩니다.
          </p>

          <div className="card mb-3 p-3">
            <div className="font-semibold text-[13px] mb-1">테스트 기입란 (이 연구방법용 템플릿)</div>
            <textarea
              className="w-full rounded-md border p-2 text-[12px] font-mono min-h-[88px]"
              style={{ borderColor: "var(--color-border-tertiary)" }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="방법별 예시 형식"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button type="button" className="btn btn-sm" onClick={() => setDraft(draftTemplateFor(tpl(method), method.nm))}>이 방법 샘플 채우기</button>
              <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>불러오기 (엑셀·CSV)</button>
              <button type="button" className="btn btn-sm" onClick={() => downloadText(`methodos-${method.id}-sample.csv`, surveyCsvTemplate())}>내보내기 (CSV)</button>
              <button type="button" className="btn btn-sm" onClick={() => downloadText(`methodos-${method.id}-draft.csv`, draft.includes(",") ? draft : surveyCsvTemplate())}>내 기입 내보내기</button>
              <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[180px]">
                <div className="text-[11px] text-ink-3 mb-1">용어 주석 검색</div>
                <input className="w-full rounded-md border px-2 py-1.5 text-[12px]" style={{ borderColor: "var(--color-border-tertiary)" }} value={aiQ} onChange={(e) => setAiQ(e.target.value)} placeholder="예: NPS, R², Cohen's d, 테마" />
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={askTerm}>주석 보기</button>
            </div>
            {aiA && <pre className="mt-2 whitespace-pre-wrap text-[12px] rounded-md p-2.5" style={{ background: "var(--ok-soft)" }}>{aiA}</pre>}
          </div>

          <div className="rv-slbl">변수 탐지 — {(VDEFS[tpl(method)] || []).length}개</div>
          <div className="rv-vtable mb-3">
            {(VDEFS[tpl(method)] || []).map((v) => (
              <div key={v.n} className="rv-vrow grid grid-cols-2 sm:grid-cols-4 gap-1 py-2 px-3 text-[12px]">
                <span className="font-medium">{v.n}</span><span>{varTag(v.t)}</span>
                <span className="text-ink-3">{v.r}</span><span className="text-ink-2">{v.rng}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {[{ l: "관측 수", v: method.n }, { l: "수치형", v: String((VDEFS[tpl(method)] || []).filter((v) => v.t.includes("Continuous") || v.t.includes("Discrete")).length) },
              { l: "결측", v: "0%" }, { l: "출력", v: method.out }].map((x) => (
              <div key={x.l} className="rounded-md p-3" style={{ background: "var(--color-background-secondary)" }}>
                <div className="text-[11px] text-ink-3">{x.l}</div><div className="text-xl font-medium">{x.v}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2"><button className="btn" onClick={() => go(1)}>← 뒤로</button><button className="btn btn-primary" onClick={next}>시각화 온톨로지 ↗</button></div>
        </>
      )}

      {stage === 3 && method && (
        <>
          <div className="rv-ibox mb-3">
            <strong>{method.id} · {method.nm}</strong> — Viz Ontology
            <div className="text-[12px] mt-1">이 연구방법에 맞춘 표준 시각화 후보입니다. 체크해 Visualization 단계에서 그립니다.</div>
          </div>
          {ontology.map((c, i) => {
            const on = indices.includes(i);
            const easy = c.easy;
            return (
              <button key={`${method.id}-${c.nm}-${i}`} type="button" className={`rv-oi w-full text-left mb-2 ${on ? "sel" : ""}`} onClick={() => toggleChart(i)}>
                <span className={`rv-ochk ${on ? "on" : ""}`}>{on ? "✓" : ""}</span>
                <span className="flex-1">
                  <strong className="text-[13px]">{i + 1}. {c.nm}</strong>
                  <div className="mt-1"><span className={`rv-ptag ${PM[c.p]}`}>{c.p}</span> <em className="text-[10px] text-ink-3">{c.pt}</em></div>
                  <p className="text-[11px] text-ink-2 mt-1 mb-0 leading-relaxed">{c.r}</p>
                  {easy && <p className="text-[11.5px] mt-1.5 mb-0 leading-relaxed" style={{ color: "var(--brand-ink)" }}>💡 {easy}</p>}
                </span>
              </button>
            );
          })}
          <div className="flex gap-2 mt-4"><button className="btn" onClick={() => go(2)}>← 뒤로</button><button className="btn btn-primary" onClick={next}>시각화 생성 ↗</button></div>
        </>
      )}

      {(stage === 4 || stage === 5) && method && data && (
        <>
          {stage === 5 && (
            <div className="rv-dbhdr mb-3">
              <div>
                <div className="font-medium">{method.nm} 분석 대시보드</div>
                <div className="text-[11px] text-ink-3">N={method.n} · {indices.length}개 시각화</div>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => window.print()}>인쇄</button>
            </div>
          )}
          {stage === 5 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              {(METS[tpl(method)] ? METS[tpl(method)](data as never) : []).map((mt) => (
                <div key={mt.l} className="rounded-md p-3" style={{ background: "var(--color-background-secondary)" }}>
                  <div className="text-[11px] text-ink-3">{mt.l}</div>
                  <div className="text-xl font-medium">{mt.v}</div>
                  <div className="text-[10px] text-ink-3">{mt.s}</div>
                  <div className="text-[10.5px] mt-1 leading-snug">해석: {mt.l}이(가) {mt.v}이면 {mt.s} 수준으로 읽으면 됩니다.</div>
                </div>
              ))}
            </div>
          )}
          {stage === 4 && (
            <div className="rounded-md p-3 mb-3 text-[12.5px] leading-relaxed" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
              <strong>{method.id}</strong> 시각화 결과입니다. 각 카드 아래 <strong>쉬운 해석</strong>에 용어 풀이와 읽는 순서를 자세히 적었습니다.
            </div>
          )}
          <div className={`grid gap-3 ${indices.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
            {indices.map((ci, i) => {
              const oc = ontology[ci];
              if (!oc) return null;
              return (
              <div key={ci} className="card p-3" style={indices.length % 2 !== 0 && i === 0 ? { gridColumn: "1 / -1" } : {}}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-medium text-ink-2">{oc.nm}</span>
                  <span className={`rv-ptag ${PM[oc.p]}`}>{oc.p}</span>
                </div>
                <div className="relative" style={{ height: stage === 4 ? 215 : 185 }}>
                  <canvas id={`${stage === 4 ? "ch" : "db"}_${ci}`} role="img" aria-label={oc.nm} />
                </div>
                {interpretBlock(ci)}
              </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn" onClick={() => go(stage - 1)}>← 뒤로</button>
            <button className="btn btn-primary" onClick={next}>{stage === 4 ? "대시보드 ↗" : "보고서 ↗"}</button>
          </div>
        </>
      )}

      {stage === 6 && method && (
        <>
          {!report ? (
            <div className="text-center py-8">
              <p className="text-ink-2 mb-4"><strong>{method.nm}</strong> — 상세 연구 해석 보고서</p>
              <button className="btn btn-primary" onClick={buildLocalReport}>상세 보고서 생성 ↗</button>
            </div>
          ) : (
            <div className="card p-4 prose-sm" dangerouslySetInnerHTML={{ __html: report }} />
          )}
          <div className="flex gap-2 mt-4">
            <button className="btn" onClick={() => go(5)}>← 대시보드</button>
            {report && <button className="btn" onClick={() => { setReport(null); buildLocalReport(); }}>재생성</button>}
          </div>
        </>
      )}
    </div>
  );
}
