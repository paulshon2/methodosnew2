"use client";

import EmptyState from "@/components/ui/EmptyState";
import type { GoalResult } from "@/lib/stats-goal";
import ApaSentence from "./ApaSentence";
import Anova from "./results/Anova";
import ChiSquare from "./results/ChiSquare";
import Correlation from "./results/Correlation";
import Descriptive from "./results/Descriptive";
import Paired from "./results/Paired";
import TwoGroup from "./results/TwoGroup";

/** 3단계 — 목적에 따라 결과 구성 자체가 달라진다. */
export default function ResultPanel({ result }: { result: GoalResult | null }) {
  if (!result) {
    return (
      <EmptyState title="아직 계산할 수 없습니다">
        1단계에서 알고 싶은 것을 고르고, 2단계에서 변수를 모두 지정하면 결과가 바로 나타납니다.
      </EmptyState>
    );
  }

  const body =
    result.goal === "describe" ? <Descriptive r={result} /> :
    result.goal === "two" ? <TwoGroup r={result} /> :
    result.goal === "paired" ? <Paired r={result} /> :
    result.goal === "anova" ? <Anova r={result} /> :
    result.goal === "corr" ? <Correlation r={result} /> :
    <ChiSquare r={result} />;

  return (
    <div className="space-y-3">
      {body}
      <ApaSentence text={result.apa} />
    </div>
  );
}
