"use client";

import { useEffect, useState } from "react";

/**
 * 입력 중 전체 리렌더를 막는다.
 * 값은 즉시 바뀌지만 검증 결과는 `ms` 뒤에 따라온다.
 * `fn`은 반드시 `useCallback`으로 안정화해 넘길 것 — 아니면 매 렌더마다 타이머가 다시 걸린다.
 */
export function useDeferredValidation<T, R>(value: T, fn: (v: T) => R, ms = 260): R {
  const [out, setOut] = useState<R>(() => fn(value));
  useEffect(() => {
    const t = setTimeout(() => setOut(fn(value)), ms);
    return () => clearTimeout(t);
  }, [value, fn, ms]);
  return out;
}

export default useDeferredValidation;
