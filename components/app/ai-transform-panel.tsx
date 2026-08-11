"use client";
/** 연구방법 공통 AI 변환기 — 수집·코딩·분석·해석·보고 단계의 원문/CSV를 다음 형식 초안으로 변환
 *  v48: 진행률(Progress) 표시 · 데이터 클린징 표준 프로토콜 옵션 · 파일 불러오기·내보내기·수동 규칙 지원 */
import { useState } from "react";
import { Gloss } from "./gloss";
import { aiComplete } from "@/lib/engine";
import { useStore } from "@/store/app-store";
import { runDataCleaning } from "@/lib/cmq-engine";
import { DATA_CLEANING_PROTOCOL, type ProgressEvent } from "@/lib/coding-standards";
import AiProgressBar from "./ai-progress-bar";

export type AiTransformKind =
  | "focus" | "raw→refined" | "코딩" | "분석" | "해석" | "보고" | "수집" | "서식" | "action" | string;

const KIND_HELP: Record<string, { title: string; easy: string; example: string }> = {
  focus: {
    title: "초점·설계 변환(Focus)",
    easy: "막연한 관심사를 ‘연구 질문 한 줄’로 다듬습니다.",
    example: "입력: 원격수업이 힘들어요 → 출력: RQ: 원격수업 만족은 학습지원 인식과 어떻게 관련되는가?",
  },
  "raw→refined": {
    title: "원자료→정제 변환(Raw→Refined)",
    easy: "오타·중복·이름을 정리해 분석용 표/문장으로 만듭니다.",
    example: "입력: 홍길동, 만족 좋아요 → 출력: P01, 만족=4 (이름 마스킹)",
  },
  코딩: {
    title: "코딩 변환(Coding)",
    easy: "문장에 짧은 이름표(코드)를 붙입니다.",
    example: "“처음엔 불안했어요” → [불안] → [적응]",
  },
  분석: {
    title: "분석·계산 변환(Analysis)",
    easy: "빈도·교차·간단한 요약을 표로 만듭니다.",
    example: "성별 열 → 여 2 / 남 1 빈도표",
  },
  해석: {
    title: "해석 변환(Interpretation)",
    easy: "숫자·코드를 초보자도 읽는 문장으로 바꿉니다.",
    example: "여 평균 4.5 > 남 3.0 → 여성 응답 만족이 더 높은 편",
  },
  보고: {
    title: "보고 변환(Reporting)",
    easy: "결과 절에 넣을 초안 문단을 만듭니다.",
    example: "방법·결과·한계 3문장 초안",
  },
  수집: {
    title: "수집 변환(Collection)",
    easy: "수집 로그·체크리스트를 정리합니다.",
    example: "면담 일시·동의·파일명 표",
  },
  서식: {
    title: "서식 변환(Form)",
    easy: "빈 템플릿을 채워 산출물 초안을 만듭니다.",
    example: "코드북 표 헤더 + 예시 행",
  },
  action: {
    title: "실행·다음단계 변환(Action)",
    easy: "다음에 할 일·개선 계획을 적습니다.",
    example: "다음 순환: 문항 2개 수정 후 재조사",
  },
};

function parseCsv(text: string): { header: string[]; rows: string[][] } | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const header = lines[0].split(/[,\t]/).map((c) => c.trim());
  if (header.length < 2) return null;
  return { header, rows: lines.slice(1).map((l) => l.split(/[,\t]/).map((c) => c.trim())) };
}

function ruleTransform(kind: string, text: string): { summary: string; text: string; cols?: string[]; rows?: (string | number)[][] } {
  const csv = parseCsv(text);
  const help = KIND_HELP[kind] || KIND_HELP.focus;
  if (kind === "분석" && csv) {
    const col = csv.header[1] || csv.header[0];
    const idx = Math.min(1, csv.header.length - 1);
    const freq: Record<string, number> = {};
    csv.rows.forEach((r) => { const k = r[idx] || "(빈칸)"; freq[k] = (freq[k] || 0) + 1; });
    const rows = Object.entries(freq).map(([k, v]) => [k, v]);
    return {
      summary: `분석 변환 · ${col} 빈도 ${rows.length}종`,
      cols: [col, "빈도"],
      rows,
      text: `${help.easy}\n예시: ${help.example}\n(규칙 기반 집계. AI 키가 있으면 해석 문장도 보강됩니다.)`,
    };
  }
  if (kind === "코딩") {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 40);
    const rows = lines.map((l, i) => {
      let code = "기타";
      if (/불안|걱정/.test(l)) code = "불안";
      else if (/익숙|적응/.test(l)) code = "적응";
      else if (/만족|좋/.test(l)) code = "만족";
      else if (/어렵|힘들/.test(l)) code = "어려움";
      return [`U${i + 1}`, l.slice(0, 80), code];
    });
    return {
      summary: `코딩 변환 · ${rows.length}개 단위`,
      cols: ["ID", "원문", "코드 후보"],
      rows,
      text: `${help.easy}\n${help.example}\n코드는 후보입니다. 코드북에 정의를 적고 연구자가 확정하세요.`,
    };
  }
  if (kind === "raw→refined" && csv) {
    const rows = csv.rows.map((r, i) => {
      const copy = [...r];
      // mask name-like first cell if hangul name
      if (copy[0] && /^[가-힣]{2,4}$/.test(copy[0])) copy[0] = `P${String(i + 1).padStart(2, "0")}`;
      return copy;
    });
    return {
      summary: `정제 변환 · ${rows.length}행 (식별정보 마스킹 시도)`,
      cols: csv.header,
      rows: rows.slice(0, 50),
      text: `${help.easy}\n${help.example}`,
    };
  }
  const preview = text.trim().slice(0, 500) || "(입력 없음 — 예시 CSV를 붙여넣으세요)";
  return {
    summary: `${help.title} 초안`,
    text: `【쉬운 설명】${help.easy}\n【예시】${help.example}\n\n【입력 미리보기】\n${preview}\n\n【초안】\n1) 핵심 한 줄 요약\n2) 다음 단계 입력물\n3) 연구자 확인 체크☐`,
  };
}

export default function AiTransformPanel({
  kind = "focus",
  title,
  initialText = "",
}: {
  kind?: AiTransformKind;
  title?: string;
  initialText?: string;
}) {
  const settings = useStore((s) => s.settings);
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<ProgressEvent | null>(null);
  const [result, setResult] = useState<{ summary: string; text: string; cols?: string[]; rows?: (string | number)[][] } | null>(null);
  const [cleanOpen, setCleanOpen] = useState(false);
  const [cleanOpts, setCleanOpts] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    DATA_CLEANING_PROTOCOL.forEach((s) => { o[s.id] = true; });
    return o;
  });
  const [manualRule, setManualRule] = useState("");
  const help = KIND_HELP[kind] || KIND_HELP.focus;

  const run = async () => {
    setBusy(true);
    setProg({ phase: "준비", percent: 5 });
    try {
      setProg({ phase: "규칙 기반 초안 생성", percent: 20 });
      const fb = ruleTransform(kind, text);
      setProg({ phase: "AI 프롬프트 생성", percent: 40 });
      const manualHint = manualRule.trim()
        ? `\n\n[사용자 수동 규칙(반드시 반영)]\n${manualRule.trim()}`
        : "";
      const prompt =
        `당신은 사회과학 연구 조교입니다. 초보자가 이해하게 쉬운 말로, ` +
        `${help.title}을 수행하세요. 설명: ${help.easy}\n` +
        `출력: (1) 한 줄 요약 (2) 표 또는 목록 (3) 연구자가 확인할 체크 3개\n` +
        `입력:\n${text.slice(0, 6000)}${manualHint}`;
      setProg({ phase: "AI 호출", percent: 60 });
      const ai = await aiComplete(prompt, settings);
      setProg({ phase: "응답 정리", percent: 85 });
      if (ai && ai.trim()) {
        setResult({ summary: `${help.title} · AI 초안`, text: ai.trim(), cols: fb.cols, rows: fb.rows });
      } else {
        setResult({ ...fb, text: fb.text + "\n\n※ AI 키가 없어 규칙 기반으로 변환했습니다. 설정에서 키를 넣으면 AI 문장이 보강됩니다." });
      }
      setProg({ phase: "완료", percent: 100 });
    } finally {
      setBusy(false);
    }
  };

  const runCleaning = async () => {
    setBusy(true);
    try {
      const r = await runDataCleaning(text, cleanOpts, (e) => setProg(e));
      // 반복 클린징 시 태그 중첩 방지: 분석용(비태그) 텍스트로 반영
      setText(r.analysisText || r.cleaned);
      setResult({
        summary: `데이터 클린징 완료 — ${r.steps.length}개 단계 적용`,
        text: r.steps.map((s) => `· ${s.id}: ${s.before} → ${s.after}자`).join("\n"),
      });
    } finally {
      setBusy(false);
    }
  };

  const loadDemo = () => {
    setText("응답ID,성별,만족도,의견\n1,여,4,처음엔 불안했지만 익숙해졌어요\n2,남,3,설명이 더 필요해요\n3,여,5,다시 참여하고 싶어요");
  };

  const doExport = () => {
    if (!result) return;
    const csvLike = result.cols && result.rows
      ? [result.cols.join(","), ...result.rows.map((r) => r.map((c) => String(c)).join(","))].join("\n")
      : result.text;
    const blob = new Blob(["\ufeff" + csvLike], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transform-${kind}-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-md p-3 mb-3" style={{ border: "1px solid var(--color-border-tertiary)", background: "rgba(14,165,233,.06)" }}>
      <div className="font-semibold text-[13px] text-sky-900 mb-1">
        🔄 AI 변환기 · {title || help.title}
      </div>
      <p className="text-[12px] text-ink-2 mb-2">
        <Gloss text={help.easy} /> 예: <Gloss text={help.example} />
      </p>
      <div className="flex gap-1.5 flex-wrap mb-2">
        <button type="button" className="btn btn-sm" onClick={loadDemo}>예시 불러오기</button>
        <label className="btn btn-sm cursor-pointer">
          파일 불러오기
          <input
            type="file"
            accept=".csv,.txt,.md,.xlsx,.xls"
            className="hidden"
            onChange={async (ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              const t = await f.text();
              setText((prev) => (prev ? prev + "\n" : "") + t.slice(0, 200000));
            }}
          />
        </label>
        <button type="button" className="btn btn-sm" onClick={() => setCleanOpen((v) => !v)}>
          {cleanOpen ? "▲ 클린징 접기" : "▼ 데이터 클린징"}
        </button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={run}>
          {busy ? "변환 중…" : "AI 변환 실행"}
        </button>
        <button type="button" className="btn btn-sm" disabled={!result} onClick={doExport}>
          내보내기
        </button>
      </div>
      {cleanOpen && (
        <div className="mb-2 rounded-md border p-2 text-[11.5px]" style={{ borderColor: "var(--color-border-tertiary)" }}>
          <div className="mb-1 text-[12px] font-semibold">데이터 클린징 표준 프로토콜(19단계)</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1">
            {DATA_CLEANING_PROTOCOL.map((s) => (
              <label key={s.id} className="flex items-start gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!cleanOpts[s.id]}
                  onChange={(e) => setCleanOpts((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                />
                <span>
                  <span className="font-medium">{s.label}</span>{" "}
                  <span className="text-ink-3">({s.labelEn})</span>
                </span>
              </label>
            ))}
          </div>
          <button type="button" className="btn btn-sm btn-primary mt-2" disabled={busy} onClick={runCleaning}>
            {busy ? "클린징 중…" : "클린징 실행"}
          </button>
        </div>
      )}
      <div className="mb-2">
        <label className="block text-[11px] text-ink-3 mb-1">수동 변환 규칙(선택)</label>
        <input
          type="text"
          className="inp w-full text-[12px]"
          placeholder="예: '만족' 문자가 있으면 'Positive'로 코드하라"
          value={manualRule}
          onChange={(e) => setManualRule(e.target.value)}
        />
      </div>
      <textarea
        className="inp w-full text-[12.5px] min-h-[88px]"
        placeholder="엑셀에서 복사한 CSV, 전사 텍스트, 코딩표를 붙여넣으세요."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {(busy || prog) && <div className="mt-2"><AiProgressBar progress={prog} label={help.title} hideOnDone /></div>}
      {result && (
        <div className="mt-2 rounded-md p-2.5 text-[12.5px]" style={{ background: "var(--color-background-primary)" }}>
          <div className="font-semibold mb-1">{result.summary}</div>
          {result.cols && result.rows && (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-[11.5px] border-collapse">
                <thead>
                  <tr>{result.cols.map((c, i) => <th key={i} className="text-left p-1 border-b">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i}>{r.map((c, j) => <td key={j} className="p-1 border-b align-top">{String(c)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <pre className="whitespace-pre-wrap text-[12px]">{result.text}</pre>
        </div>
      )}
    </div>
  );
}
