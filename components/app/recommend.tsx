"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Registry } from "@/lib/types";
import { methodById } from "@/lib/use-registry";
import { setGoals, type RecRow } from "@/lib/recommend";
import { loadMethodCatalog, type MethodCatalog } from "@/lib/method-catalog";
import { displayMethodById, methodDisplayTitle } from "@/lib/merged-method";
import {
  loadResearchChecklist, loadPaperIntake, savePaperIntake, loadCheckedIds, saveCheckedIds,
  type PaperIntake, type ResearchChecklistDoc, EMPTY_PAPER_INTAKE,
} from "@/lib/research-checklist";
import { runProfileRecommend, sectionSummaryForAI } from "@/lib/research-intake-recommend";
import { aiComplete } from "@/lib/engine";
import { useStore } from "@/store/app-store";
import { Gloss } from "./gloss";
import { useAnnotation } from "./annotations";
import { detectTerms } from "@/lib/gloss";

const INTAKE_FIELDS: { key: keyof PaperIntake; label: string; rows: number; hint: string }[] = [
  { key: "topic", label: "연구 주제", rows: 2, hint: "한 문장으로 핵심 주제" },
  { key: "researchQuestions", label: "연구질문 (RQs)", rows: 3, hint: "R1, R2 형식으로 작성" },
  { key: "objectives", label: "연구 목적", rows: 2, hint: "달성하고 싶은 목표" },
  { key: "preferredMethods", label: "관심 방법·접근", rows: 2, hint: "이미 고려 중인 방법이 있다면" },
  { key: "keywords", label: "키워드", rows: 1, hint: "3~6개" },
  { key: "targetPopulation", label: "대상·표본", rows: 2, hint: "누구를, 몇 명" },
  { key: "dataPlan", label: "자료 수집·분석 계획", rows: 3, hint: "1차/2차, 정량/정성" },
  { key: "expectedContribution", label: "기대 기여", rows: 2, hint: "학문·실무 기여" },
  { key: "timeline", label: "일정", rows: 1, hint: "예: 한 학기, 1년 논문" },
];

const easyDesc = (reg: Registry, id: string) => {
  const m = methodById(reg, id);
  return m?.stages?.[0]?.explain?.easy || m?.purpose || (m?.family + " 계열 연구방법입니다.");
};

export default function Recommend({
  reg,
  nav,
  allowedMethods,
}: {
  reg: Registry;
  nav: (r: string) => void;
  allowedMethods?: Set<string> | null;
}) {
  setGoals(reg.goals);
  const settings = useStore((s) => s.settings);
  const savedRecommend = useStore((s) => s.menuArtifacts?.recommend);
  const setRecommendSession = useStore((s) => s.setRecommendSession);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);
  const { replace } = useAnnotation();
  const [doc, setDoc] = useState<ResearchChecklistDoc | null>(null);
  const [intake, setIntake] = useState<PaperIntake>(EMPTY_PAPER_INTAKE);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [openStep, setOpenStep] = useState<number>(0);
  const [rows, setRows] = useState<RecRow[] | null>(() => (savedRecommend?.rows as RecRow[]) || null);
  const [cat, setCat] = useState<MethodCatalog | null>(null);
  const [sectionAi, setSectionAi] = useState<Record<string, string>>(() => {
    const cl = savedRecommend?.checklist as { sectionAi?: Record<string, string> } | undefined;
    return cl?.sectionAi || {};
  });
  const [sectionBusy, setSectionBusy] = useState<string | null>(null);
  const [finalAi, setFinalAi] = useState<string | null>(() => savedRecommend?.finalAi ?? null);
  const [finalBusy, setFinalBusy] = useState(false);

  useEffect(() => {
    loadResearchChecklist().then(setDoc);
    loadMethodCatalog().then(setCat);
    const saved = useStore.getState().menuArtifacts?.recommend;
    if (saved?.intake) {
      setIntake(saved.intake as PaperIntake);
      savePaperIntake(saved.intake as PaperIntake);
    } else {
      setIntake(loadPaperIntake());
    }
    const cl = saved?.checklist as { checkedIds?: string[] } | undefined;
    if (cl?.checkedIds?.length) {
      setChecked(new Set(cl.checkedIds));
      saveCheckedIds(new Set(cl.checkedIds));
    } else {
      setChecked(loadCheckedIds());
    }
    if (saved?.rows) setRows(saved.rows as RecRow[]);
    if (saved?.finalAi != null) setFinalAi(saved.finalAi);
    const sectionAiSaved = (saved?.checklist as { sectionAi?: Record<string, string> } | undefined)?.sectionAi;
    if (sectionAiSaved) setSectionAi(sectionAiSaved);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current || !savedRecommend?.updatedAt) return;
    const s = savedRecommend;
    const cl = s.checklist as { checkedIds?: string[]; sectionAi?: Record<string, string> } | undefined;
    const savedIds = [...(cl?.checkedIds || [])].sort().join("\0");
    const localIds = [...checked].sort().join("\0");
    if (s.intake && JSON.stringify(s.intake) !== JSON.stringify(intake)) {
      setIntake(s.intake as PaperIntake);
    }
    if (cl?.checkedIds && savedIds !== localIds) setChecked(new Set(cl.checkedIds));
    if (cl?.sectionAi && JSON.stringify(cl.sectionAi) !== JSON.stringify(sectionAi)) {
      setSectionAi(cl.sectionAi);
    }
    if (s.rows && JSON.stringify(s.rows) !== JSON.stringify(rows)) setRows(s.rows as RecRow[]);
    if (s.finalAi != null && s.finalAi !== finalAi) setFinalAi(s.finalAi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedRecommend?.updatedAt]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setRecommendSession({
        rows,
        finalAi: finalAi ?? undefined,
        intake,
        checklist: { checkedIds: [...checked], sectionAi },
        updatedAt: Date.now(),
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [rows, finalAi, intake, checked, sectionAi, setRecommendSession]);

  useEffect(() => {
    if (!doc) return;
    const blob = doc.sections
      .flatMap((s) => [s.title, s.whyNeeded || "", ...s.items.flatMap((i) => [i.label, i.implication, i.easy || ""])])
      .join(" ");
    replace(detectTerms(blob));
  }, [doc, replace]);

  const recTitle = (id: string, fallback?: string | null) => {
    const m = displayMethodById(reg, cat, id);
    return m ? methodDisplayTitle(m) : (fallback || id);
  };

  const patchIntake = (patch: Partial<PaperIntake>) => {
    setIntake((prev) => {
      const next = { ...prev, ...patch };
      savePaperIntake(next);
      return next;
    });
  };

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCheckedIds(next);
      return next;
    });
  };

  const runRecommend = () => {
    if (!doc) return;
    setRows(runProfileRecommend(reg.methods, intake, doc.sections, checked));
  };

  const analyzeSection = async (sectionId: string) => {
    if (!doc) return;
    const sec = doc.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    setSectionBusy(sectionId);
    const prompt = `당신은 연구방법론 전문가입니다. 아래 체크리스트 단계와 연구자 기본정보를 바탕으로, 초보 대학원생도 이해할 수 있는 한국어로 5~8문장 분석을 작성하세요. 선택 항목의 시사점, 주의점, 다음 단계에서 무엇을 더 점검해야 하는지 구체적으로 제시하세요.\n\n${sectionSummaryForAI(sec, checked, intake)}`;
    const text = await aiComplete(prompt, settings);
    setSectionAi((prev) => ({
      ...prev,
      [sectionId]: text || `[규칙 기반 요약] ${sec.title}: 선택 ${sec.items.filter((i) => checked.has(i.id)).length}개. AI 키가 없으면 설정에서 API 키를 등록하세요.`,
    }));
    setSectionBusy(null);
  };

  const analyzeFinal = async () => {
    if (!doc) return;
    setFinalBusy(true);
    const profile = doc.sections.map((s) => sectionSummaryForAI(s, checked, intake)).join("\n\n");
    const rec = rows?.slice(0, 5).map((r) => `${recTitle(r.id, r.name_ko || r.name)} (${r.match}%)`).join(", ") || "(아직 추천 실행 전)";
    const prompt = `연구방법 선정 종합 분석을 작성하세요. ① 연구 설계 초안 ② 아키타입·표준방법(L1 145) 선정 ③ 매크로 영역 정합 ④ 윤리·자료 ⑤ 방법론적 아키타입 31개 매칭 관점에서 항목별로 짧은 소제목을 달고, 마지막에 추천 방법 Top5와 각각 한 줄 이유를 제시하세요.\n\n[체크리스트 전체]\n${profile}\n\n[엔진 추천 Top5]\n${rec}`;
    const text = await aiComplete(prompt, settings);
    setFinalAi(text || "종합 분석: 체크리스트와 기본정보를 바탕으로 상단 「연구방법 찾기」를 실행한 뒤, 설계 점검·32개 선정·매크로 정합과 대조하세요. AI 키를 설정하면 더 풍부한 분석이 생성됩니다.");
    setFinalBusy(false);
  };

  const checkedCount = useMemo(() => checked.size, [checked]);
  const top = (rows || [])
    .filter((r) => {
      if (!allowedMethods) return true;
      if (allowedMethods.has(r.id)) return true;
      // 구버전 권한(V61 미포함)이면 필터 무시
      if (![...allowedMethods].some((x) => String(x).startsWith("V61-")) && String(r.id).startsWith("V61-")) {
        return true;
      }
      return false;
    })
    .slice(0, 8);
  const best = top[0];

  return (
    <div>
      <div className="mb-5">
        <h1 className="ty-title">방법 찾기</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          방법 찾기 3문항 → 후보 비교 → 방법 라이브러리에서 확인하고 → 프로젝트로 담아 이어서 작업합니다.
        </p>
      </div>

      <div className="card mb-4">
        <h2 className="ty-section mb-1">1. 연구 기본 기입 (논문 설계 초안)</h2>
        <p className="text-[12px] text-ink-3 mb-3">주제·연구질문·자료계획을 먼저 적으면, 표준 연구방법 145개·아키타입 31개 기반 체크리스트·추천 정확도가 올라갑니다.</p>
        <div className="grid lg:grid-cols-2 gap-3">
          {INTAKE_FIELDS.map((f) => (
            <div key={f.key} className={f.rows > 2 ? "lg:col-span-2" : ""}>
              <label className="text-[12px] font-medium text-ink-2">{f.label}</label>
              <p className="text-[10px] text-ink-3 mb-1">{f.hint}</p>
              <textarea
                className="inp w-full text-[13px]"
                rows={f.rows}
                value={intake[f.key]}
                onChange={(e) => patchIntake({ [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {doc && (
        <div className="card mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h2 className="text-[16px] font-semibold flex-1">2. 연구방법 선정 체크리스트 ({checkedCount}개 선택)</h2>
          </div>
          {doc.sections.map((sec) => {
            const open = openStep === sec.step;
            const picked = sec.items.filter((i) => checked.has(i.id)).length;
            return (
              <div key={sec.id} className="mb-2 border rounded-lg" style={{ borderColor: "var(--color-border-tertiary)" }}>
                <button type="button" className="w-full text-left px-3 py-2.5 flex items-center gap-2" onClick={() => setOpenStep(open ? 0 : sec.step)}>
                  <span className="pill pill-brand text-[11px]">{sec.step}단계</span>
                  <strong className="text-[13px] flex-1"><Gloss text={sec.title} /></strong>
                  <span className="text-[11px] text-ink-3">{picked}/{sec.items.length}</span>
                </button>
                {open && (
                  <div className="px-3 pb-3">
                    {sec.whyNeeded && (
                      <div className="rounded-md p-2.5 mb-2 text-[12.5px] leading-relaxed" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                        <Gloss text={sec.whyNeeded} />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button className="btn btn-sm" disabled={sectionBusy === sec.id} onClick={() => analyzeSection(sec.id)}>
                        {sectionBusy === sec.id ? "AI 분석 중…" : "이 단계 AI 분석"}
                      </button>
                    </div>
                    {sectionAi[sec.id] && (
                      <div className="text-[12.5px] leading-relaxed mb-3 p-2.5 rounded" style={{ background: "var(--brand-soft)" }}>{sectionAi[sec.id]}</div>
                    )}
                    <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto rounded-md p-1" style={{ background: "rgba(255,255,255,.03)" }}>
                      {sec.items.map((it) => (
                        <label key={it.id} className="flex gap-2 cursor-pointer text-[12.5px] p-2 rounded" style={{ color: "var(--color-text-primary)", background: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--wash2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                          <input type="checkbox" checked={checked.has(it.id)} onChange={() => toggle(it.id)} className="mt-0.5" />
                          <span>
                            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}><Gloss text={it.label} /></span>
                            {it.easy && (
                              <span className="block text-[11.5px] mt-1 leading-relaxed" style={{ background: "rgba(255,255,255,.06)", color: "var(--color-text-secondary)", padding: "6px 8px", borderRadius: 6 }}>
                                <Gloss text={it.easy} />
                              </span>
                            )}
                            {it.implication && <span className="block mt-0.5" style={{ color: "var(--color-text-secondary)" }}>→ <Gloss text={it.implication} /></span>}
                            {it.source && <span className="block text-[10px] mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{it.source}</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center my-4 flex flex-wrap justify-center gap-2">
        <button className="btn btn-primary px-6 py-2.5" onClick={runRecommend} disabled={!doc}>연구방법 엔진으로 추천 받기</button>
        <button className="btn px-6 py-2.5" onClick={analyzeFinal} disabled={finalBusy || !doc}>
          {finalBusy ? "종합 AI 분석 중…" : "종합 AI 분석 (항목별 통합)"}
        </button>
      </div>

      {finalAi && (
        <div className="card mb-4 text-[13px] leading-relaxed whitespace-pre-wrap">{finalAi}</div>
      )}

      {best && (
        <div>
          <div className="card mb-3.5" style={{ borderColor: "var(--brand)" }}>
            <div className="text-[12px] text-ink-3">체크리스트·기본정보 기반 최적 후보</div>
            <div className="flex items-center gap-2.5 my-1.5">
              <span className="pill pill-brand">1위</span>
              <strong className="text-[19px] flex-1">{recTitle(best.id, best.name_ko || best.name)}</strong>
              <span className="text-[22px] font-bold" style={{ color: "var(--brand-ink)" }}>{best.match}%</span>
            </div>
            <div className="xfield"><div className="text-[10.5px] uppercase text-ink-3 mb-1">쉬운 설명</div><div>{easyDesc(reg, best.id)}</div></div>
            {best.reasons.length > 0 && (
              <div className="mt-2.5 text-[12.5px]"><strong>추천 근거</strong><br />
                {best.reasons.map((x, i) => <span key={i} style={{ color: "var(--ok)" }}>✔ {x}<br /></span>)}
              </div>
            )}
            <button className="btn btn-primary mt-3.5" onClick={() => nav("method/" + encodeURIComponent(best.id))}>이 방법으로 시작하기</button>
          </div>
          <h3 className="text-sm font-semibold mb-2.5">다른 후보</h3>
          <div className="grid sm:grid-cols-2 gap-3.5">
            {top.slice(1).map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center gap-2">
                  <strong className="flex-1 text-[13.5px]">{recTitle(r.id, r.name_ko || r.name)}</strong>
                  <span className="font-bold" style={{ color: "var(--brand-ink)" }}>{r.match}%</span>
                  <button className="btn btn-sm" onClick={() => nav("method/" + encodeURIComponent(r.id))}>선택</button>
                </div>
                <div className="match-bar mt-1.5"><span style={{ width: Math.max(2, r.match) + "%" }} /></div>
                <div className="text-[11.5px] text-ink-2 mt-1.5">{easyDesc(reg, r.id)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
