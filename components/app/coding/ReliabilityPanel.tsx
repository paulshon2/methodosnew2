"use client";

import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import { cohensKappa, kappaVerdict, KAPPA_THRESHOLD } from "@/lib/coding-reliability";
import type { Assign, Code, Doc } from "@/lib/coding-types";

/** 우 · 신뢰도. κ 하나만 보여 주면 고칠 것을 알 수 없으므로 불일치 문장을 함께 싣는다. */
export default function ReliabilityPanel({
  docs,
  assign,
  coder2,
  codeMap,
  onGo,
}: {
  docs: Doc[];
  assign: Assign;
  /** 2차 코더가 독립 코딩한 문장: segId → codeId */
  coder2: Record<string, string>;
  codeMap: Record<string, Code>;
  onGo: (segId: string) => void;
}) {
  const ids = Object.keys(coder2);
  const mine = ids.map((i) => (assign[i] ?? [])[0] ?? "none");
  const other = ids.map((i) => coder2[i]);
  const { kappa, po, pe, n } = cohensKappa(mine, other);
  const v = kappaVerdict(kappa);
  const color = v.level === "ok" ? "var(--ok)" : v.level === "warn" ? "var(--warn)" : "var(--danger)";
  const segIndex = new Map(docs.flatMap((d) => d.segs.map((s) => [s.id, s] as const)));
  const disagree = ids.filter((_, i) => mine[i] !== other[i]);
  const nameOf = (id: string) => (id === "none" ? "없음" : codeMap[id]?.name ?? "없음");

  if (n === 0) {
    return <p className="ty-small text-ink-3">2차 코더가 코딩한 문장이 없어 일치도를 계산할 수 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div>
          <div className="num" style={{ font: "800 26px/1 var(--font-gothic)", color, letterSpacing: "-.02em" }}>
            {kappa.toFixed(2)}
          </div>
          <div className="ty-label mt-1 text-ink-3">Cohen&rsquo;s κ</div>
        </div>
        <div className="min-w-0">
          <Badge tone={v.level}>{v.label}</Badge>
          <p className="ty-label mt-1.5 text-ink-3" style={{ lineHeight: 1.7 }}>
            2차 코더가 독립 코딩한 <strong className="num">{n}</strong>문장 기준.
            <br />
            단순 일치율 <span className="num">{(po * 100).toFixed(0)}%</span> · 우연 일치 기대{" "}
            <span className="num">{(pe * 100).toFixed(0)}%</span>
          </p>
        </div>
      </div>

      {kappa >= KAPPA_THRESHOLD ? (
        <Note level="ok" title="보고 기준을 충족합니다" live>
          κ ≥ .70입니다. 이 값과 대상 문장 수를 논문 방법 절에 그대로 보고하세요.
        </Note>
      ) : (
        <Note
          level="warn"
          title="κ가 .70 미만입니다"
          live
          fix="아래 불일치 문장을 두 코더가 함께 읽고, 코드 정의를 고친 뒤 다시 코딩하세요."
        >
          코더를 설득해 답을 맞추는 것이 아니라 코드북을 고치는 것이 원칙입니다. 불일치는 대개 코더의 실수가 아니라 정의의 빈틈에서 나옵니다.
        </Note>
      )}

      <div>
        <h4 className="ty-small mb-2 font-bold">
          불일치 문장 <span className="num">{disagree.length}</span>건
        </h4>
        {disagree.length === 0 ? (
          <p className="ty-small text-ink-3">두 코더의 판단이 모두 같습니다.</p>
        ) : (
          <ul className="space-y-3">
            {disagree.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => onGo(id)} className="w-full text-left">
                  <p className="ty-small pl-3" style={{ borderLeft: "2px solid var(--warn)", lineHeight: 1.75 }}>
                    {segIndex.get(id)?.text}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="neutral" mark={false}>1차: {nameOf((assign[id] ?? [])[0] ?? "none")}</Badge>
                    <Badge tone="warn">2차: {nameOf(coder2[id])}</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="ty-label text-ink-3" style={{ lineHeight: 1.7 }}>
        판정 기준(Landis &amp; Koch, 1977): .81 이상 거의 완전 · .61–.80 상당 · .41–.60 보통 · .40 이하 불충분. 범주가 셋 이상이고 순서가 있다면 가중 κ를, 코더가 3인 이상이면 Krippendorff α를 쓰세요.
      </p>
    </div>
  );
}
