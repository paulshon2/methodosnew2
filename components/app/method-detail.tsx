"use client";
/** Prompt 6.1 — 연구방법 상세(상위: 개요·프로세스·용어) + 실습 진입 + 변형 선택 */
import { useEffect, useMemo, useState } from "react";
import type { Registry } from "@/lib/types";
import { useStore } from "@/store/app-store";
import { Gloss } from "./gloss";
import GenericMethodOverview from "./generic-method-overview";
import {
  loadMethodCatalog,
  loadMethodOverview,
  loadMethodSamples,
  loadV61Bundle,
  type MethodCatalog,
  type MethodSamplePack,
  type V61Bundle,
} from "@/lib/method-catalog";
import {
  allDisplayMethods,
  displayMethodById,
  learningVariantsFor,
  methodDisplayTitle,
  methodListTitle,
} from "@/lib/merged-method";
import { loadPracticeByMethodKey, type PracticeByMethodKey } from "@/lib/archetype-data";
import { useAnnotation } from "./annotations";
import { mergeTerms, preferAcademic, termsFromText, pickCoreMatching, CORE_METHOD_TERMS } from "@/lib/page-glossary";
import { FamilyBadge } from "./family-badge";

export default function MethodDetail({ reg, id, nav }: { reg: Registry; id: string; nav: (r: string) => void }) {
  const [cat, setCat] = useState<MethodCatalog | null>(null);
  const [v61, setV61] = useState<V61Bundle | null>(null);
  const [samples, setSamples] = useState<MethodSamplePack | null>(null);
  const [beginnerIntro, setBeginnerIntro] = useState("");
  const [practiceByKey, setPracticeByKey] = useState<PracticeByMethodKey>({});
  const { replace } = useAnnotation();
  const createProject = useStore((s) => s.createProject);

  useEffect(() => {
    loadMethodCatalog().then(setCat);
    loadPracticeByMethodKey().then(setPracticeByKey);
  }, []);

  const m = displayMethodById(reg, cat, id);
  const allMethods = useMemo(() => allDisplayMethods(reg, cat), [reg, cat]);
  const variants = useMemo(() => (m ? learningVariantsFor(allMethods, m) : []), [allMethods, m]);

  const practiceCases = useMemo(() => {
    const mk = m?.catalog?.methodKey;
    if (!mk) return [];
    return practiceByKey[mk] || [];
  }, [m?.catalog?.methodKey, practiceByKey]);

  useEffect(() => {
    if (!m?.perfSlug) return;
    loadV61Bundle(m.perfSlug).then((b) => {
      setV61(b);
      if (b?.beginnerIntro) setBeginnerIntro(b.beginnerIntro);
    });
    loadMethodSamples(m.perfSlug).then(setSamples);
    loadMethodOverview(m.perfSlug).then((b) => {
      if (b?.beginnerIntro) setBeginnerIntro((prev) => prev || b.beginnerIntro || "");
    });
  }, [m?.id, m?.perfSlug]);

  useEffect(() => {
    if (!m) return;
    const gloss = (v61?.glossary || []).map((g) => ({ term: g.term, def: g.def }));
    const blob = [
      m.purpose,
      beginnerIntro,
      v61?.mechanism,
      ...(v61?.stages || []).flatMap((s) => [s.name, s.purpose, s.what, s.why]),
      ...gloss.map((g) => `${g.term} ${g.def}`),
    ]
      .filter(Boolean)
      .join(" ");
    replace(
      preferAcademic(mergeTerms(pickCoreMatching(blob), gloss, CORE_METHOD_TERMS, termsFromText(blob)))
    );
  }, [m, v61, beginnerIntro, replace]);

  if (!m) return <p>방법을 찾을 수 없습니다.</p>;

  const title = methodDisplayTitle(m);
  const listTitle = methodListTitle(m);
  const stageN = m.catalog?.stageCount || v61?.stages?.length || 6;
  const start = () => {
    const p = createProject(m.id, title, title + " 프로젝트");
    nav("project/" + p.id);
  };

  const processList =
    v61?.stages?.map((s) => ({
      key: s.id,
      title: s.name + (s.nameEn ? `(${s.nameEn})` : ""),
      sub: (s.summary || s.purpose || "").slice(0, 80),
      n: s.no,
    })) || null;

  const samplesHint = samples ? " · Stage5 Sample Pack 포함" : "";

  return (
    <div>
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("library")}>
        방법 라이브러리
      </button>
      <div className="mb-2"><FamilyBadge macro={m.macro || m.family} /></div>
      <h1 className="ty-title tracking-tight">
        <Gloss text={listTitle} />
      </h1>
      <details className="ty-small text-ink-3 mb-4">
        <summary className="cursor-pointer font-semibold min-h-[44px] flex items-center">표준 표기 보기</summary>
        <div className="mt-2 rounded-[10px] p-3" style={{ background: "var(--wash)" }}>
          {m.catalog?.methodKey ? <div>methodKey: {m.catalog.methodKey}</div> : null}
          <div>단계: {stageN}단계</div>
          <div>표준: 프롬프트 설계구조 6.1 · RWOS Phase→Stage→Process→Task{samplesHint}</div>
        </div>
      </details>

      <div className="sticky top-0 z-20 py-2 mb-3" style={{ background: "var(--color-background-secondary)" }}>
        <button type="button" className="btn btn-primary" onClick={start}>이 방법으로 프로젝트 시작</button>
      </div>

      {variants.length > 1 && (
        <div className="mb-4 card">
          <label className="fld">예시 주제 선택</label>
          <select
            className="inp w-full max-w-xl"
            value={m.id}
            onChange={(e) => nav("library/method/" + encodeURIComponent(e.target.value))}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {methodDisplayTitle(v)}
              </option>
            ))}
          </select>
          <p className="ty-small text-ink-3 mt-1.5">같은 표준 방법의 예시 주제가 다릅니다.</p>
        </div>
      )}

      {(beginnerIntro || v61?.beginnerIntro) && (
        <div
          className="rounded-[10px] p-3.5 mb-4 ty-small leading-relaxed"
          style={{ background: "var(--ok-wash)", color: "var(--ok)" }}
        >
          <Gloss text={beginnerIntro || v61?.beginnerIntro || ""} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold mb-2">개요</h3>
          {m.purpose && <Gloss className="text-[14px] mb-3 leading-relaxed block" text={m.purpose} />}
          {v61?.mechanism && (
            <div className="rounded-md p-3 mb-3 text-[13px] leading-relaxed" style={{ background: "var(--color-background-secondary)" }}>
              <div className="text-[11px] font-semibold text-ink-3 mb-1">방법 메커니즘</div>
              <Gloss text={v61.mechanism} />
            </div>
          )}
          <table className="tbl text-[13px]">
            <tbody>
              <tr>
                <th>매크로 영역</th>
                <td>{m.macro || "-"}</td>
              </tr>
              <tr>
                <th>계열</th>
                <td>
                  <Gloss text={m.catalog?.family_ko || m.family || "-"} />
                </td>
              </tr>
              <tr>
                <th>단계 수</th>
                <td>{stageN}단계 (수집→보고)</td>
              </tr>
              <tr>
                <th>세부 Task</th>
                <td>{m.catalog?.taskCount || "—"}</td>
              </tr>
              {v61?.practiceRows ? (
                <tr>
                  <th>연습 분석단위</th>
                  <td>{v61.practiceRows}행</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold mb-2">전체 프로세스 ({stageN}단계)</h3>
          {v61?.phases && v61.phases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {v61.phases.map((ph) => (
                <span
                  key={ph.no}
                  className="rounded-md px-2 py-1 text-[11.5px] font-medium"
                  style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
                >
                  Phase {ph.no} · {ph.name}
                </span>
              ))}
            </div>
          )}
          {processList ? (
            <ol className="list-decimal pl-5 text-[13.5px] leading-relaxed space-y-1.5">
              {processList.map((v) => (
                <li key={v.key}>
                  <strong>
                    <Gloss text={v.title} />
                  </strong>
                  {v.sub ? (
                    <span className="text-ink-3">
                      {" "}
                      — <Gloss text={v.sub} />
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13px] text-ink-2">아래 한눈에 보기에서 단계별 역할을 확인하세요.</p>
          )}
          <button type="button" className="btn btn-primary w-full mt-4" onClick={start}>
            이 방법으로 프로젝트 시작
          </button>
        </div>
      </div>

      {v61?.stages && v61.stages.length > 0 && (
        <div className="mt-6">
          <h2 className="text-[18px] font-semibold mb-1">Stage 5 · 방법 고유 프로세스</h2>
          <p className="text-[13px] text-ink-2 mb-3">
            공통 준비(1–4)·보고(6)와 분리된 방법 고유 절차입니다.
            {samples ? " Domain Sample Pack·산출물 예시 슬롯이 워크벤치에 포함됩니다." : " 프로젝트에서 하위 항목으로 실행합니다."}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(v61.stages.find((s) => s.no === 5)?.processes || []).map((p) => (
              <div key={p.id} className="rounded-lg px-3 py-2.5" style={{ background: "var(--color-background-secondary)" }}>
                <div className="text-[11px] text-ink-3 mb-0.5">{p.id}</div>
                <div className="text-[13.5px] font-semibold leading-snug">
                  <Gloss text={p.name + (p.nameEn ? `(${p.nameEn})` : "")} />
                </div>
                <div className="text-[11.5px] text-ink-2 mt-1">{p.tasks?.length || 0}개 세부 Task</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {m.perfSlug ? (
        <GenericMethodOverview perfSlug={m.perfSlug} title={m.name_ko || m.name} />
      ) : (
        <div className="mt-6 card">
          <p className="text-ink-3">개요 데이터를 불러올 수 없습니다.</p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-[18px] font-semibold mb-1">이 방법으로 실습하기</h2>
        <p className="text-[13px] text-ink-2 mb-3">
          같은 표준 방법에 연결된 실습 케이스입니다.
          {practiceCases.length ? ` · ${practiceCases.length}개` : " · 연결된 실습 케이스 없음"}
        </p>
        {practiceCases.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {practiceCases.map((c) => (
              <button
                key={`${c.archetypeId}-${c.methodNo}-${c.caseId}`}
                type="button"
                className="card text-left"
                onClick={() =>
                  nav(
                    c.methodNo != null
                      ? `archetype/practice/${c.archetypeId}/method/${c.methodNo}`
                      : `archetype/practice/${c.archetypeId}`
                  )
                }
              >
                <div className="text-[11px] text-ink-3">{c.archetypeName} 아키타입</div>
                <div className="text-[14px] font-semibold mt-1 leading-snug">
                  <Gloss text={c.caseName} />
                </div>
                <div className="text-[12px] text-ink-2 mt-2">프로젝트 실습으로 이동 →</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card text-[13px] text-ink-3">아직 매핑된 실습 케이스가 없습니다. (pending 또는 신규 제작 대상)</div>
        )}
      </div>

      {v61?.glossary && v61.glossary.length > 0 && (
        <div className="mt-6 card">
          <h3 className="text-[16px] font-semibold mb-2">이 방법의 핵심 용어</h3>
          <p className="text-[12.5px] text-ink-3 mb-3">왼쪽 용어 주석과 함께 보세요. 프로젝트 하위 단계에서도 같은 용어가 이어집니다.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {v61.glossary.slice(0, 12).map((g) => (
              <div key={g.term} className="rounded-md px-2.5 py-2 text-[12.5px]" style={{ background: "var(--color-background-secondary)" }}>
                <span className="font-semibold" style={{ color: "var(--brand-ink)" }}>
                  {g.term}
                </span>
                <span className="text-ink-2"> · {g.def.slice(0, 120)}{g.def.length > 120 ? "…" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center my-7">
        <p className="ty-small text-ink-3 mb-2">상단 버튼과 동일합니다.</p>
        <button type="button" className="btn btn-primary" onClick={start}>
          이 방법으로 프로젝트 시작
        </button>
      </div>
    </div>
  );
}
