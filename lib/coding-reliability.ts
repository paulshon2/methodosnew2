/**
 * 코더 간 일치도 — 순수 함수.
 *
 * 코딩 단위를 문장으로 고정했기 때문에 두 코더의 판단을 같은 자리에서 비교할 수 있다.
 * 단위가 다르면 아래 계산은 성립하지 않는다.
 */

export type Kappa = { kappa: number; po: number; pe: number; n: number };

/**
 * Cohen's κ.
 * 두 배열은 같은 문장을 같은 순서로 가리켜야 한다. 코딩하지 않은 자리는 "none" 같은 값으로 채워 넘긴다.
 */
export function cohensKappa(a: string[], b: string[]): Kappa {
  const n = Math.min(a.length, b.length);
  if (n === 0) return { kappa: 0, po: 0, pe: 0, n: 0 };
  const po = a.slice(0, n).filter((x, i) => x === b[i]).length / n;
  const cats = [...new Set([...a.slice(0, n), ...b.slice(0, n)])];
  const pe = cats.reduce(
    (s, c) => s + (a.slice(0, n).filter((x) => x === c).length / n) * (b.slice(0, n).filter((x) => x === c).length / n),
    0,
  );
  // pe가 1이면 두 코더가 한 범주만 쓴 것이라 우연을 넘어선 일치를 정의할 수 없다.
  const kappa = pe === 1 ? (po === 1 ? 1 : 0) : (po - pe) / (1 - pe);
  return { kappa, po, pe, n };
}

export type Verdict = { label: string; level: "ok" | "warn" | "risk" };

/** Landis & Koch(1977) 기준. */
export function kappaVerdict(k: number): Verdict {
  if (k >= 0.81) return { label: "거의 완전 일치", level: "ok" };
  if (k >= 0.61) return { label: "상당한 일치", level: "ok" };
  if (k >= 0.41) return { label: "보통 일치", level: "warn" };
  return { label: "불충분", level: "risk" };
}

/** 보고 기준선. .70 미만이면 코드북을 고쳐 다시 코딩해야 한다. */
export const KAPPA_THRESHOLD = 0.7;
