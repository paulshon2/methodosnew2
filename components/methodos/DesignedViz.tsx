"use client";
/** 이 분석에 맞춰 설계한 그림 묶음(데스크톱판 「분석 시각화」와 같은 그림·같은 설계). 값은 모두 결과표에서 가져온다. */
import { useMemo } from "react";
import "./dviz/dviz.css";
import Panel from "./dviz/Panel.jsx";
import { toEngineResult } from "@/lib/methodos/adapt";
import type { MResult } from "@/lib/methodos/types";

export default function DesignedViz({ result, slots }: { result: MResult; slots?: Record<string, string[]> }) {
  const engine = useMemo(() => toEngineResult(result, slots), [result, slots]);
  return (
    <div className="dv-scope">
      <Panel result={engine} />
    </div>
  );
}
