"use client";
/** 연구방법의 공통절차 — Excel ‘계열별공통절차’ 시트 기반 */
import { useState } from "react";
import { Gloss } from "./gloss";
import { GlossaryBlock } from "./method-process-hub";
import { useMethodProcessGuide } from "@/lib/method-process-guide";

const STEPS = [
  { key: "collect", label: "자료수집", tone: "var(--fam-survey)" },
  { key: "prepare", label: "가공", tone: "var(--fam-qual)" },
  { key: "analyze", label: "분석", tone: "var(--fam-text)" },
  { key: "interpret", label: "해석", tone: "var(--fam-stats)" },
  { key: "result", label: "결과완성", tone: "var(--fam-eval)" },
] as const;

export default function MethodProcessCommon({ nav }: { nav: (r: string) => void }) {
  const { doc, err } = useMethodProcessGuide();
  const [openKey, setOpenKey] = useState<string>("");

  if (err) return <div className="p-6 text-ink-3">데이터를 불러오지 못했습니다.</div>;
  if (!doc) return <div className="p-6 text-ink-3">불러오는 중…</div>;

  const active =
    doc.commons.find((c) => c.familyKey === (openKey || doc.commons[0]?.familyKey)) || doc.commons[0];

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("process")}>← 연구방법별 프로세스</button>
      <h1 className="text-[22px] font-semibold">연구방법의 공통절차</h1>
      <p className="mt-1 text-[14px] text-ink-2 max-w-[720px] leading-relaxed">
        <strong>방법론적 아키타입 31개</strong>가 공유하는 수집→가공→분석→해석→결과완성 뼈대입니다.
        아키타입만 알면 개별 방법 이름이 낯설어도 “지금은 수집 단계구나”를 구분할 수 있습니다.
      </p>

      <div className="card mt-3 mb-3">
        <h3 className="text-[14px] font-semibold mb-1.5">비유로 이해하기</h3>
        <p className="text-[13px] text-ink-2 leading-relaxed">
          요리를 예로 들면 — <strong>재료 사기(수집)</strong> → <strong>손질(가공)</strong> → <strong>조리(분석)</strong> →{" "}
          <strong>간 보기(해석)</strong> → <strong>접시에 담기(결과완성)</strong>입니다.
          한식·양식(계열)마다 양념은 달라도, 이 다섯 칸 구조는 비슷합니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {doc.commons.map((c) => (
          <button
            key={c.familyKey}
            type="button"
            className="rounded-md px-2.5 py-1.5 text-[12.5px]"
            style={
              (active?.familyKey === c.familyKey)
                ? { background: "var(--brand-soft)", color: "var(--brand-ink)", fontWeight: 600 }
                : { background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }
            }
            onClick={() => setOpenKey(c.familyKey)}
          >
            {c.familyLabel}
            <span className="ml-1 opacity-70">({c.methodCount})</span>
          </button>
        ))}
      </div>

      {active ? (
        <div className="card mb-4" style={{ padding: "16px" }}>
          <div className="flex flex-wrap items-baseline gap-2 mb-2">
            <h2 className="text-[18px] font-semibold">{active.familyLabel}</h2>
            <span className="text-[12px] text-ink-3">키: {active.familyKey} · 소속 방법 약 {active.methodCount}개</span>
          </div>
          <div className="rounded-md p-2.5 mb-2 text-[13px] leading-relaxed" style={{ background: "var(--color-background-secondary)" }}>
            <strong>초보:</strong> <Gloss text={active.beginner} />
          </div>
          <div className="rounded-md p-2.5 mb-3 text-[13px] leading-relaxed" style={{ border: "0.5px dashed var(--color-border-secondary)" }}>
            <strong>예시:</strong> <Gloss text={active.example} />
          </div>

          <div className="relative pl-3 mb-1">
            <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "var(--color-border-secondary)" }} />
            <div className="space-y-2.5">
              {STEPS.map((st) => {
                const body =
                  st.key === "collect" ? active.collect
                    : st.key === "prepare" ? active.prepare
                      : st.key === "analyze" ? active.analyze
                        : st.key === "interpret" ? active.interpret
                          : active.result;
                return (
                  <div key={st.key} className="relative pl-5">
                    <span
                      className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full"
                      style={{ background: st.tone, boxShadow: "0 0 0 3px var(--color-background-primary)" }}
                    />
                    <div className="rounded-md px-3 py-2.5" style={{ background: "var(--color-background-secondary)" }}>
                      <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: st.tone }}>{st.label}</div>
                      <div className="text-[13px] leading-relaxed text-ink-2"><Gloss text={body} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" className="btn btn-sm" onClick={() => nav("process/stages")}>단계별 상세요약</button>
            <button type="button" className="btn btn-sm" onClick={() => nav("archetype")}>아키타입 메뉴</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => nav("library")}>방법 라이브러리</button>
          </div>
        </div>
      ) : null}

      <GlossaryBlock items={doc.glossary} />
    </div>
  );
}
