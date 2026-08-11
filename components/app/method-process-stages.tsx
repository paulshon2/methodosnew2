"use client";
/** 연구방법 단계별 상세요약 — 표준 연구방법(L1) 145 × 6단계 */
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Gloss } from "./gloss";
import { GlossaryBlock } from "./method-process-hub";
import { useMethodProcessGuide } from "@/lib/method-process-guide";

export default function MethodProcessStages({ nav }: { nav: (r: string) => void }) {
  const { doc, err } = useMethodProcessGuide();
  const [q, setQ] = useState("");
  const [methodNo, setMethodNo] = useState<number | "">("");

  const methodOptions = useMemo(() => {
    if (!doc) return [];
    const seen = new Map<number, { no: number; name: string; family: string }>();
    for (const s of doc.stages) {
      if (!seen.has(s.no)) {
        seen.set(s.no, { no: s.no, name: s.name, family: s.familyKey });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.no - b.no);
  }, [doc]);

  const stages = useMemo(() => {
    if (!doc) return [];
    const qq = q.trim().toLowerCase();
    return doc.stages.filter((s) => {
      if (methodNo !== "" && s.no !== methodNo) return false;
      if (!qq) return true;
      return `${s.name} ${s.stageName} ${s.tip} ${s.familyKey}`.toLowerCase().includes(qq);
    });
  }, [doc, q, methodNo]);

  const grouped = useMemo(() => {
    const map = new Map<number, typeof stages>();
    for (const s of stages) {
      const arr = map.get(s.no) || [];
      arr.push(s);
      map.set(s.no, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.stageNo - b.stageNo);
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [stages]);

  if (err) return <div className="p-6 text-ink-3">데이터를 불러오지 못했습니다.</div>;
  if (!doc) return <div className="p-6 text-ink-3">불러오는 중…</div>;

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("process")}>← 연구방법별 프로세스</button>
      <h1 className="text-[22px] font-semibold">연구방법 단계별 상세요약</h1>
      <p className="mt-1 text-[14px] text-ink-2 max-w-[720px] leading-relaxed">
        연구방법 가상 학습의 <strong>표준 연구방법(L1) 145개</strong>마다 6단계로
        “지금 무엇을 하면 되는지”를 정리했습니다. 실행 화면을 열기 전에 미리 읽으면 막히는 지점이 줄어듭니다.
      </p>

      <div className="card mt-3 mb-3">
        <h3 className="text-[14px] font-semibold mb-1.5">초보 사용 팁</h3>
        <ul className="text-[13px] text-ink-2 leading-relaxed list-disc pl-5 space-y-1">
          <li>위에서 <strong>표준 연구방법</strong>을 고르면 그 방법의 6단계만 보입니다.</li>
          <li>각 단계의 설명은 “이 단계에서 할 일”입니다. 산출물을 남기고 다음으로 넘기세요.</li>
          <li>같은 매크로(설문·질적·통계 등)끼리 단계 뼈대가 비슷합니다. 공통절차 메뉴와 함께 보세요.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select
          className="rounded-md px-2.5 py-2 text-[13px] flex-1 min-w-[220px]"
          style={{ border: "0.5px solid var(--color-border-secondary)" }}
          value={methodNo === "" ? "" : String(methodNo)}
          onChange={(e) => setMethodNo(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">모든 표준 연구방법 ({methodOptions.length})</option>
          {methodOptions.map((m) => (
            <option key={m.no} value={m.no}>{m.no}. {m.name}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            className="w-full rounded-md pl-8 pr-3 py-2 text-[13.5px]"
            style={{ border: "0.5px solid var(--color-border-secondary)" }}
            placeholder="방법명·단계·설명 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="text-[12px] text-ink-3">{stages.length}개 단계행</span>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {grouped.map(([no, list]) => (
          <div key={no} className="card" style={{ padding: "12px 14px" }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="text-[11px] text-ink-3">No.{no} · {list[0]?.familyKey}</div>
                <h3 className="text-[14.5px] font-semibold">{list[0]?.name}</h3>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => nav("process/common")}>공통절차</button>
            </div>
            <ol className="space-y-2">
              {list.map((st) => (
                <li key={`${st.no}-${st.stageNo}`} className="rounded-md px-3 py-2" style={{ background: "var(--color-background-secondary)" }}>
                  <div className="flex gap-2 items-baseline">
                    <span className="text-[12px] font-semibold shrink-0" style={{ color: "var(--brand-ink)" }}>
                      {st.stageNo}단계
                    </span>
                    <span className="text-[13.5px] font-medium"><Gloss text={st.stageName} /></span>
                  </div>
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed pl-0 sm:pl-12">
                    <Gloss text={st.tip} />
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ))}
        {!grouped.length ? <p className="text-ink-3 text-center py-8">조건에 맞는 단계가 없습니다.</p> : null}
      </div>

      <GlossaryBlock items={doc.glossary} />
    </div>
  );
}
