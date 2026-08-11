"use client";
import { chartById } from "@/lib/charts";
import { Gloss } from "./gloss";
import VizPlot from "./viz-plot";

// 시각화 — ② 그래프 유형 상세: 개요·왜(근거)·만드는 단계·예시 미리보기
export default function VizType({ id, nav }: { id: string; nav: (r: string) => void }) {
  const found = chartById(id);
  if (!found) return <div><button className="btn btn-sm mb-2.5" onClick={() => nav("tools/charts/list")}>← 그래프 목록</button><p>그래프를 찾을 수 없습니다.</p></div>;
  const { chart, category } = found;
  return (
    <div className="text-[14px] leading-relaxed">
      <button className="btn btn-sm mb-2.5" onClick={() => nav("tools/charts/list")}>← 그래프 목록</button>
      <h1 className="text-[22px] font-semibold">{chart.name}</h1>
      <p className="text-[14px] text-ink-2 mb-4">{category.catKo}</p>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold mb-2">개요 — 어떤 그래프인가요?</h3>
          <Gloss className="text-[14px] mb-2 block" text={chart.desc} />
          <div className="rounded-md p-3 text-[14px]" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
            <strong>👉 언제 쓰나요? </strong><Gloss text={chart.useWhen} /></div>
          <h3 className="text-base font-semibold mt-4 mb-2">왜 이렇게 그리나요? (근거)</h3>
          <Gloss className="text-[14px] block" text={category.why} />
        </div>
        <div className="card">
          <h3 className="text-base font-semibold mb-2">전체 프로세스 — 어떻게 만드나요?</h3>
          <ol className="list-decimal pl-5 text-[14px]">
            {category.steps.map((s, i) => (<li key={i} className="mb-1.5">{s.replace(/^[①②③④]\s?/, "")}</li>))}
            <li className="mb-1.5"><strong>이 그래프({chart.name})</strong>는 특히 <span style={{ color: "var(--brand-ink)" }}>{chart.useWhen}</span> 효과적입니다.</li>
          </ol>
          <button className="btn btn-primary w-full mt-3 text-[15px] py-2.5" onClick={() => nav("vizmake/" + chart.id)}>이 그래프 직접 만들기 →</button>
        </div>
      </div>

      <div className="mt-5">
        <h2 className="text-[18px] font-semibold mb-1">미리 보기 — 실제로 이렇게 그려져요</h2>
        <p className="text-[14px] text-ink-2 mb-3">아래는 연습용 자료로 그린 <strong>{chart.name}</strong> 예시입니다. ‘직접 만들기’를 누르면 내 연구 결과로 바꿔 그릴 수 있어요.</p>
        <div className="rounded-lg" style={{ border: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", padding: 8 }}>
          <VizPlot chartId={chart.id} preview />
        </div>
      </div>
    </div>
  );
}
