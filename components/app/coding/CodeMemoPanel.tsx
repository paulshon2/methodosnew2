"use client";

import { useEffect, useState } from "react";
import Note from "@/components/ui/Note";
import type { Code } from "@/lib/coding-types";

/** 우 · 코드 메모. 코드가 무엇을 가리키는지 적어 두는 자리다. */
export default function CodeMemoPanel({ code, onChange }: { code: Code | null; onChange: (next: Code) => void }) {
  const [name, setName] = useState(code?.name ?? "");
  const [memo, setMemo] = useState(code?.memo ?? "");

  useEffect(() => {
    setName(code?.name ?? "");
    setMemo(code?.memo ?? "");
  }, [code?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!code) return <p className="ty-small text-ink-3">코드를 선택하면 그 코드의 정의와 메모를 쓸 수 있습니다.</p>;

  return (
    <div className="space-y-3">
      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="code-name">
          코드 이름
        </label>
        <input
          id="code-name"
          className="inp"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            onChange({ ...code, name: e.target.value });
          }}
        />
      </div>

      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="code-memo">
          코드 정의 · 메모 <span className="font-normal text-ink-3">(감사추적 자료)</span>
        </label>
        <textarea
          id="code-memo"
          className="inp"
          rows={8}
          value={memo}
          placeholder="이 코드를 언제 붙이고 언제 붙이지 않는지 규칙을 적어 두세요. 나중에 코더 간 불일치를 줄이는 근거가 됩니다."
          onChange={(e) => {
            setMemo(e.target.value);
            onChange({ ...code, memo: e.target.value });
          }}
        />
        <p className="ty-label mt-1 text-ink-3">
          포함 기준 · 배제 기준 · 경계 사례를 함께 적어 두면 코딩이 시간에 따라 표류하는 것을 막을 수 있습니다.
        </p>
      </div>

      <Note level="info" title="이 메모는 논문에 쓸 수 있습니다">
        코드 정의와 그 변경 기록은 Braun &amp; Clarke의 주제 정의 단계, Corbin &amp; Strauss의 메모잉에 해당하는 감사추적 자료입니다. 방법 절에 그대로 인용할 수 있습니다.
      </Note>
    </div>
  );
}
