"use client";
/**
 * 코딩 스튜디오 자체 데이터시각화 (③ 파이프라인 · ⑤ 표준 코딩북 공용)
 * — 빈도 / TF-IDF / 공출현 네트워크 / 의미군집 / 근거 문장
 * CaChart(TX-002 SVG 엔진)만 사용. 외부 Plotly·viz 모듈 비의존.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import CaChart from "./ca-chart";
import {
  specFromFreq,
  specFromTerms,
  specFromCooccur,
  type CaChartType,
} from "@/lib/ca-charts";
import type {
  ComputationalAnalytics,
  EvidencePackage,
} from "@/lib/ai-standard-codebook";
import { exportChartBundle } from "@/lib/viz-export";

const softStyle = { borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" };
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const h3 = "text-[15px] font-semibold";
const chip = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12.5px]";

type Props = {
  analytics: ComputationalAnalytics | null | undefined;
  evidence?: EvidencePackage[];
  evidenceByTerm?: Record<string, string[]>;
  title?: string;
  compact?: boolean;
};

export default function CodingAnalyticsViz({
  analytics,
  evidence = [],
  evidenceByTerm = {},
  title = "데이터 시각화 · 군집 · 빈도 · 공출현 · 의미패턴",
  compact = false,
}: Props) {
  const [freqType, setFreqType] = useState<CaChartType>("hbar");
  const [coType, setCoType] = useState<CaChartType>("network");
  const [clusterType, setClusterType] = useState<CaChartType>("treemap");
  const vizRef = useRef<HTMLDivElement>(null);

  async function exportViz(format: "png" | "jpeg" | "pdf" | "xlsx") {
    const freqRows = (analytics?.frequency || []).map((f) => [f.term, f.count]);
    await exportChartBundle({
      container: vizRef.current,
      baseName: `coding-analytics-${format === "xlsx" ? "table" : "viz"}`,
      title: title,
      summaryLines: [
        `세그먼트 ${analytics?.segmentCount || 0}`,
        `토큰 ${analytics?.tokenCount || 0}`,
        `용어 ${analytics?.frequency?.length || 0}`,
        `공출현 ${analytics?.cooccurrence?.length || 0}`,
        `군집 ${analytics?.clusters?.length || 0}`,
      ],
      table: {
        cols: ["용어", "빈도"],
        rows: freqRows as (string | number)[][],
      },
      format,
    });
  }

  const freqSpec = useMemo(() => {
    if (!analytics?.frequency?.length) return null;
    return {
      ...specFromFreq(
        analytics.frequency.slice(0, 14).map((f) => ({ term: f.term, count: f.count })),
        freqType,
        "회"
      ),
      title: "Frequency · 용어 빈도",
    };
  }, [analytics, freqType]);

  const tfidfSpec = useMemo(() => {
    if (!analytics?.tfidf?.length) return null;
    return {
      ...specFromTerms(
        analytics.tfidf.slice(0, 24).map((t) => ({
          term: t.term,
          count: Math.max(1, Math.round(t.score * 100)),
        })),
        "wordcloud"
      ),
      title: "TF-IDF · 핵심어 가중치",
      note: "글자 크기 ≈ TF-IDF 점수",
    };
  }, [analytics]);

  const coSpec = useMemo(() => {
    if (!analytics?.cooccurrence?.length) return null;
    return {
      ...specFromCooccur(analytics.cooccurrence.slice(0, 24), coType),
      title: "Co-occurrence · 공출현 관계",
    };
  }, [analytics, coType]);

  const clusterSpec = useMemo(() => {
    if (!analytics?.clusters?.length) return null;
    const tree = analytics.clusters.flatMap((c) =>
      c.members.slice(0, 6).map((m, i) => ({
        label: m,
        value: Math.max(1, 8 - i),
        group: c.label.replace(/^의미군집:/, ""),
      }))
    );
    if (clusterType === "treemap") {
      return {
        type: "treemap" as CaChartType,
        title: "의미군집 패턴",
        labels: tree.map((t) => t.label),
        series: [{ name: "군집", values: tree.map((t) => t.value) }],
        tree,
        unit: "가중",
      };
    }
    return {
      ...specFromFreq(
        analytics.clusters.map((c) => ({
          label: c.label.replace(/^의미군집:/, ""),
          count: c.members.length,
        })),
        clusterType === "bubble" ? "bubble" : "bar",
        "멤버"
      ),
      title: "의미군집 규모",
    };
  }, [analytics, clusterType]);

  const quoteFor = (term: string): string[] => {
    if (evidenceByTerm[term]?.length) return evidenceByTerm[term];
    const ev = evidence.find((e) => e.candidateCode === term);
    if (ev?.representativeQuotes?.length) return ev.representativeQuotes.slice(0, 2);
    if (ev?.relatedSentences?.length) return ev.relatedSentences.slice(0, 2);
    return [];
  };

  if (!analytics) {
    return (
      <div className="rounded-xl border p-3 text-[12.5px] text-ink-3" style={softStyle}>
        파이프라인을 실행하면 빈도·공출현·의미군집 시각화가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={vizRef}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className={h3}>{title}</div>
        <span className={chip} style={softStyle}>세그먼트 {analytics.segmentCount}</span>
        <span className={chip} style={softStyle}>토큰 {analytics.tokenCount}</span>
        <span className={chip} style={softStyle}>용어 {analytics.frequency.length}</span>
        <span className={chip} style={softStyle}>공출현 {analytics.cooccurrence.length}</span>
        <span className={chip} style={softStyle}>군집 {analytics.clusters.length}</span>
        <span className="ml-auto flex gap-1 flex-wrap">
          <button type="button" className="text-[11px] px-2 py-0.5 rounded border" style={softStyle} onClick={() => exportViz("png")}>PNG</button>
          <button type="button" className="text-[11px] px-2 py-0.5 rounded border" style={softStyle} onClick={() => exportViz("jpeg")}>JPEG</button>
          <button type="button" className="text-[11px] px-2 py-0.5 rounded border" style={softStyle} onClick={() => exportViz("pdf")}>PDF</button>
          <button type="button" className="text-[11px] px-2 py-0.5 rounded border" style={softStyle} onClick={() => exportViz("xlsx")}>엑셀</button>
        </span>
      </div>

      <div className={`grid gap-3 ${compact ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
        <div className="rounded-xl border p-3" style={cardStyle}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[12.5px] font-semibold">빈도 차트</span>
            {(["hbar", "bar", "lollipop", "bubble"] as CaChartType[]).map((t) => (
              <button key={t} type="button" onClick={() => setFreqType(t)}
                className="text-[11px] px-1.5 py-0.5 rounded border"
                style={freqType === t ? { ...softStyle, borderColor: "var(--brand-ink)" } : softStyle}>
                {t}
              </button>
            ))}
          </div>
          {freqSpec && <CaChart spec={freqSpec} />}
        </div>

        <div className="rounded-xl border p-3" style={cardStyle}>
          <div className="text-[12.5px] font-semibold mb-2">TF-IDF 워드클라우드</div>
          {tfidfSpec && <CaChart spec={tfidfSpec} />}
        </div>

        <div className="rounded-xl border p-3" style={cardStyle}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[12.5px] font-semibold">공출현</span>
            {(["network", "heatmap", "arc", "sankey"] as CaChartType[]).map((t) => (
              <button key={t} type="button" onClick={() => setCoType(t)}
                className="text-[11px] px-1.5 py-0.5 rounded border"
                style={coType === t ? { ...softStyle, borderColor: "var(--brand-ink)" } : softStyle}>
                {t}
              </button>
            ))}
          </div>
          {coSpec && <CaChart spec={coSpec} />}
        </div>

        <div className="rounded-xl border p-3" style={cardStyle}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[12.5px] font-semibold">의미군집 패턴</span>
            {(["treemap", "bar", "bubble"] as CaChartType[]).map((t) => (
              <button key={t} type="button" onClick={() => setClusterType(t)}
                className="text-[11px] px-1.5 py-0.5 rounded border"
                style={clusterType === t ? { ...softStyle, borderColor: "var(--brand-ink)" } : softStyle}>
                {t}
              </button>
            ))}
          </div>
          {clusterSpec && <CaChart spec={clusterSpec} />}
          <ul className="mt-2 text-[12px] text-ink-2 space-y-1 max-h-36 overflow-y-auto">
            {analytics.clusters.slice(0, 6).map((c) => (
              <li key={c.id}>
                <b>{c.label}</b>: {c.members.slice(0, 6).join(", ")}
                {c.members[0] && quoteFor(c.members[0])[0] && (
                  <div className="text-ink-3 italic mt-0.5 pl-2">근거: “{quoteFor(c.members[0])[0]}”</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 용어별 근거 문장 — 단어가 나오면 반드시 근거 문장 동반 */}
      <div className="rounded-xl border p-3" style={softStyle}>
        <div className={h3}>용어 · 근거 문장</div>
        <p className="mt-1 text-[12px] text-ink-3">분석에 등장하는 각 단어/코드에 원자료 근거 문장을 함께 표시합니다.</p>
        <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto">
          {analytics.frequency.slice(0, 16).map((f) => {
            const quotes = quoteFor(f.term);
            const tf = analytics.tfidf.find((t) => t.term === f.term)?.score;
            return (
              <div key={f.term} className="rounded-lg border p-2.5" style={cardStyle}>
                <div className="flex flex-wrap gap-2 items-center text-[13px]">
                  <span className="font-semibold">{f.term}</span>
                  <span className="text-[11.5px] text-ink-3">{f.count}회 · tfidf {tf ?? "-"}</span>
                </div>
                {quotes.length ? (
                  <ul className="mt-1 space-y-0.5">
                    {quotes.map((q, i) => (
                      <li key={i} className="text-[12px] italic text-ink-2">“{q}”</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-1 text-[12px] text-ink-3">(해당 용어의 직접 인용 세그먼트를 찾지 못함)</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
