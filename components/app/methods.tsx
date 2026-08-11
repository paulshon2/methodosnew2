"use client";
/** 방법 라이브러리 · 목록으로 — 4축 필터 · 판단 기준 카드 */
import { useEffect, useMemo, useState } from "react";
import type { Registry } from "@/lib/types";
import { Gloss } from "./gloss";
import { loadMethodCatalog, type MethodCatalog } from "@/lib/method-catalog";
import {
  allDisplayMethods,
  collapseToCanonicalMethods,
  methodListTitle,
  type DisplayMethod,
} from "@/lib/merged-method";
import { loadPracticeByMethodKey, type PracticeByMethodKey } from "@/lib/archetype-data";
import { useAnnotation } from "./annotations";
import { detectTerms } from "@/lib/gloss";
import { mergeTerms, preferAcademic, pickCoreMatching, CORE_METHOD_TERMS } from "@/lib/page-glossary";
import { Search } from "lucide-react";
import LibraryLensTabs from "./library-lens";
import { FamilyBadge } from "./family-badge";
import { PageSkeleton } from "./ui-states";

type FilterOpt = { id: string; label: string; macros?: readonly string[] };

const DATA_OPTS: readonly FilterOpt[] = [
  { id: "all", label: "자료 전체" },
  { id: "survey", label: "설문·척도", macros: ["조사·설문"] },
  { id: "text", label: "면담·텍스트", macros: ["질적·해석", "텍스트·계산언어"] },
  { id: "numeric", label: "수치·표", macros: ["양적·통계·모형", "양적·인과·실험"] },
  { id: "lit", label: "문헌·사료", macros: ["문헌·근거합성", "역사·비교"] },
  { id: "mixed", label: "혼합", macros: ["혼합·설계", "평가·정책"] },
] as const;

const GOAL_OPTS: readonly FilterOpt[] = [
  { id: "all", label: "알고 싶은 것 전체" },
  { id: "describe", label: "분포·현황", macros: ["조사·설문", "양적·통계·모형"] },
  { id: "interpret", label: "의미·경험", macros: ["질적·해석"] },
  { id: "cause", label: "인과·효과", macros: ["양적·인과·실험"] },
  { id: "synth", label: "종합·평가", macros: ["문헌·근거합성", "평가·정책", "역사·비교"] },
  { id: "model", label: "모형·예측", macros: ["양적·통계·모형", "텍스트·계산언어", "혼합·설계"] },
] as const;

const DIFF_OPTS: readonly FilterOpt[] = [
  { id: "all", label: "난이도 전체" },
  { id: "기초~중", label: "기초~중" },
  { id: "중", label: "중" },
  { id: "중상", label: "중상" },
] as const;

function effectiveMethodGate(allowedMethods: Set<string> | null | undefined, catalogIds: string[]): Set<string> | null {
  if (!allowedMethods || catalogIds.length === 0) return null;
  const hit = catalogIds.some((id) => allowedMethods.has(id));
  return hit ? allowedMethods : null;
}

function cardMeta(m: DisplayMethod) {
  const c = m.catalog;
  return {
    requiredData: c?.requiredData || "연구 목적에 맞는 원자료",
    deliverable: c?.deliverable || "분석 결과 · 해석 문단",
    duration: c?.duration || "2~4주",
    difficulty: c?.difficulty || "중",
  };
}

export default function Methods({
  reg,
  nav,
  allowedMethods,
}: {
  reg: Registry;
  nav: (r: string) => void;
  allowedMethods?: Set<string> | null;
}) {
  const [q, setQ] = useState("");
  const [macroFilter, setMacroFilter] = useState("all");
  const [dataFilter, setDataFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [compare, setCompare] = useState<string[]>([]);
  const [cat, setCat] = useState<MethodCatalog | null>(null);
  const [practiceByKey, setPracticeByKey] = useState<PracticeByMethodKey>({});
  const { replace } = useAnnotation();

  useEffect(() => {
    loadMethodCatalog().then(setCat);
    loadPracticeByMethodKey().then(setPracticeByKey);
  }, []);

  const allMethods = useMemo(() => allDisplayMethods(reg, cat), [reg, cat]);
  const catalogIds = useMemo(() => allMethods.map((m) => m.id), [allMethods]);
  const gate = useMemo(() => effectiveMethodGate(allowedMethods, catalogIds), [allowedMethods, catalogIds]);
  const canonicalMethods = useMemo(() => collapseToCanonicalMethods(allMethods), [allMethods]);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const dataMacros = DATA_OPTS.find((o) => o.id === dataFilter)?.macros as string[] | undefined;
    const goalMacros = GOAL_OPTS.find((o) => o.id === goalFilter)?.macros as string[] | undefined;
    return canonicalMethods.filter((m) => {
      if (gate && !gate.has(m.id)) return false;
      const mac = m.macro || "";
      if (macroFilter !== "all" && mac !== macroFilter) return false;
      if (dataMacros && !dataMacros.includes(mac)) return false;
      if (goalMacros && !goalMacros.includes(mac)) return false;
      if (diffFilter !== "all" && (m.catalog?.difficulty || "중") !== diffFilter) return false;
      if (!ql) return true;
      const blob = `${methodListTitle(m)} ${m.purpose || ""} ${mac} ${m.catalog?.requiredData || ""} ${m.catalog?.deliverable || ""}`.toLowerCase();
      return blob.includes(ql);
    });
  }, [canonicalMethods, gate, q, macroFilter, dataFilter, goalFilter, diffFilter]);

  const chips = useMemo(() => {
    const c: { key: string; label: string; clear: () => void }[] = [];
    if (dataFilter !== "all") c.push({ key: "d", label: DATA_OPTS.find((o) => o.id === dataFilter)?.label || dataFilter, clear: () => setDataFilter("all") });
    if (goalFilter !== "all") c.push({ key: "g", label: GOAL_OPTS.find((o) => o.id === goalFilter)?.label || goalFilter, clear: () => setGoalFilter("all") });
    if (diffFilter !== "all") c.push({ key: "f", label: `난이도 ${diffFilter}`, clear: () => setDiffFilter("all") });
    if (macroFilter !== "all") c.push({ key: "m", label: macroFilter, clear: () => setMacroFilter("all") });
    if (q.trim()) c.push({ key: "q", label: `검색: ${q.trim()}`, clear: () => setQ("") });
    return c;
  }, [dataFilter, goalFilter, diffFilter, macroFilter, q]);

  useEffect(() => {
    if (!list.length) return;
    const blob = list.slice(0, 80).map((m) => `${methodListTitle(m)} ${m.purpose || ""}`).join(" ");
    replace(preferAcademic(mergeTerms(pickCoreMatching(blob), CORE_METHOD_TERMS, detectTerms(blob))));
  }, [list, replace]);

  const toggleCompare = (id: string) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compareMethods = canonicalMethods.filter((m) => compare.includes(m.id));
  const macroOrder = cat?.macroOrder?.length ? cat.macroOrder : Object.keys(
    canonicalMethods.reduce<Record<string, number>>((a, m) => {
      a[m.macro || "기타"] = 1;
      return a;
    }, {})
  );

  if (!cat) return <PageSkeleton />;

  return (
    <div>
      <LibraryLensTabs active="list" nav={nav} />
      <h1 className="ty-title mb-1">방법 라이브러리</h1>
      <p className="ty-small text-ink-2 mb-4 max-w-[720px]">
        표준 연구방법을 조건으로 걸러 고릅니다. 같은 방법은 지도·절차·사례 보기로도 이어서 볼 수 있습니다.
      </p>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
        <input
          className="inp w-full pl-10"
          placeholder="예: 인터뷰 내용을 주제로 묶고 싶다"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="방법 검색"
        />
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-4 mb-4">
        <aside className="card" style={{ padding: 14 }}>
          <div className="ty-label mb-2">가진 자료</div>
          <div className="flex flex-col gap-1 mb-3">
            {DATA_OPTS.map((o) => (
              <button key={o.id} type="button" className={dataFilter === o.id ? "tab tab-active w-full justify-start" : "tab w-full justify-start"} onClick={() => setDataFilter(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="ty-label mb-2">알고 싶은 것</div>
          <div className="flex flex-col gap-1 mb-3">
            {GOAL_OPTS.map((o) => (
              <button key={o.id} type="button" className={goalFilter === o.id ? "tab tab-active w-full justify-start" : "tab w-full justify-start"} onClick={() => setGoalFilter(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="ty-label mb-2">준비 난이도</div>
          <div className="flex flex-col gap-1 mb-3">
            {DIFF_OPTS.map((o) => (
              <button key={o.id} type="button" className={diffFilter === o.id ? "tab tab-active w-full justify-start" : "tab w-full justify-start"} onClick={() => setDiffFilter(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="ty-label mb-2">계열</div>
          <div className="flex flex-col gap-1">
            <button type="button" className={macroFilter === "all" ? "tab tab-active w-full justify-start" : "tab w-full justify-start"} onClick={() => setMacroFilter("all")}>전체</button>
            {macroOrder.map((m) => (
              <button key={m} type="button" className={macroFilter === m ? "tab tab-active w-full justify-start" : "tab w-full justify-start"} onClick={() => setMacroFilter(m)}>
                {m}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="ty-subhead">결과 {list.length}개</span>
            {chips.map((c) => (
              <button key={c.key} type="button" className="pill" onClick={c.clear} aria-label={`${c.label} 해제`}>
                {c.label} ×
              </button>
            ))}
            {chips.length ? (
              <button type="button" className="btn btn-sm" onClick={() => { setDataFilter("all"); setGoalFilter("all"); setDiffFilter("all"); setMacroFilter("all"); setQ(""); }}>
                조건 모두 해제
              </button>
            ) : null}
          </div>

          {!list.length ? (
            <div className="card">
              <p className="ty-body mb-2">조건에 맞는 방법이 없습니다.</p>
              <p className="ty-small text-ink-2 mb-3">난이도·계열 조건을 하나 빼면 더 많은 결과가 나옵니다.</p>
              <button type="button" className="btn btn-primary" onClick={() => setDiffFilter("all")}>난이도 조건 해제</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 pb-24">
              {list.map((m) => {
                const meta = cardMeta(m);
                const practiceN = m.catalog?.methodKey ? practiceByKey[m.catalog.methodKey]?.length || 0 : 0;
                const inCmp = compare.includes(m.id);
                return (
                  <div key={m.id} className="card text-left" style={{ padding: 16 }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <FamilyBadge macro={m.macro} />
                      <button
                        type="button"
                        className="btn btn-sm"
                        aria-pressed={inCmp}
                        onClick={() => toggleCompare(m.id)}
                        disabled={!inCmp && compare.length >= 3}
                      >
                        {inCmp ? "담음" : "비교함"}
                      </button>
                    </div>
                    <button type="button" className="text-left w-full" onClick={() => nav("library/method/" + encodeURIComponent(m.id))}>
                      <h3 className="ty-subhead mb-1"><Gloss text={methodListTitle(m)} /></h3>
                      <p className="ty-small text-ink-2 mb-3 min-h-[44px]"><Gloss text={(m.purpose || "연구 목적에 맞는 절차를 따라갑니다.").slice(0, 120)} /></p>
                      <dl className="ty-small space-y-1.5 mb-3">
                        <div><dt className="ty-label text-ink-3 inline">필요 자료 · </dt><dd className="inline text-ink-2">{meta.requiredData}</dd></div>
                        <div><dt className="ty-label text-ink-3 inline">결과물 · </dt><dd className="inline text-ink-2">{meta.deliverable}</dd></div>
                        <div><dt className="ty-label text-ink-3 inline">예상 기간 · </dt><dd className="inline text-ink-2">{meta.duration}</dd></div>
                      </dl>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="pill">{meta.difficulty}</span>
                        {practiceN > 0 ? <span className="pill">실습 사례 {practiceN}</span> : null}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {compare.length > 0 ? (
        <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-30 px-3">
          <div className="mx-auto max-w-[900px] card flex flex-wrap items-center gap-2" style={{ boxShadow: "var(--sh)" }}>
            <strong className="ty-small">비교함 {compare.length}/3</strong>
            {compareMethods.map((m) => (
              <span key={m.id} className="pill">{methodListTitle(m)}</span>
            ))}
            <button type="button" className="btn btn-sm ml-auto" onClick={() => setCompare([])}>비우기</button>
            {compare[0] ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => nav("library/method/" + encodeURIComponent(compare[0]))}>
                첫 후보 열기
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
