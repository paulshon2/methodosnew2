"use client";
/**
 * Expert 모드 — Methodos 43기법 목록.
 * 예전의 「기술·추론 분석(41)」·「구조방정식·잠재변수 모형(12)」 목록을 이 화면이 대신한다.
 * 계산은 Methodos 파이썬 엔진(R19)과 같은 정의를 옮긴 TypeScript 로 브라우저 안에서 한다.
 */
import { useEffect, useMemo, useState } from "react";
import { loadMethodosCatalog, loadMethodosVerification, type MCatalog, type MEntry, type MVerification } from "@/lib/methodos/catalog";

const card = "rounded-2xl border p-4 md:p-5";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const LEVELS = ["초급", "중급", "고급"];

export default function MethodosHub({ nav }: { nav: (r: string) => void }) {
  const [cat, setCat] = useState<MCatalog | null>(null);
  const [ver, setVer] = useState<MVerification | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [lv, setLv] = useState<string>("전체");

  useEffect(() => {
    loadMethodosCatalog().then(setCat).catch((e) => setErr(String(e?.message || e)));
    loadMethodosVerification().then(setVer);
  }, []);

  const shown = useMemo(() => {
    if (!cat) return [] as MEntry[];
    const t = q.trim().toLowerCase();
    return cat.items.filter((m) => (lv === "전체" || m.level === lv) && (!t || `${m.code} ${m.name} ${m.english} ${m.group} ${m.question}`.toLowerCase().includes(t)));
  }, [cat, q, lv]);

  if (err) return <div className="p-4 text-red-600">Methodos 기법 목록을 불러오지 못했습니다: {err}</div>;
  if (!cat) return <div className="p-4 text-ink-3">Methodos 기법 목록 불러오는 중…</div>;

  return (
    <section aria-label="Methodos 43기법">
      <div className={`${card} mb-4`} style={{ ...cardStyle, background: "var(--brand-soft)" }}>
        <div className="text-[13px] font-semibold">Methodos 분석 엔진 · 43기법</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          기술통계부터 구조방정식·IRT·생존분석·메타분석까지 43가지를 한 곳에서 돌립니다. 계산은 <b>이 브라우저 안에서</b> 이루어지며
          올린 자료는 서버로 전송되지 않습니다. 계산식은 Methodos 파이썬 엔진(R19)의 정의를 그대로 옮겼고, 예제·다양한 자료에서 엔진 결과와 대조했습니다
          {ver ? ` (예제 ${sum(ver, "exampleMatched")}/${sum(ver, "exampleCells")}칸 일치).` : "."}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="inp"
          style={{ maxWidth: 320 }}
          placeholder="기법 이름·코드 검색 (예: t검정, M25, 생존)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="기법 검색"
        />
        {["전체", ...LEVELS].map((l) => (
          <button key={l} type="button" className={`btn btn-sm ${lv === l ? "btn-primary" : ""}`} onClick={() => setLv(l)}>
            {l}
          </button>
        ))}
        <span className="ty-label text-ink-3">{shown.length}개</span>
      </div>

      {LEVELS.filter((l) => lv === "전체" || lv === l).map((l) => {
        const rows = shown.filter((m) => m.level === l);
        if (!rows.length) return null;
        return (
          <div key={l} className="mb-5">
            <h2 className="mb-2 text-[16px] font-semibold">
              {l} <span className="text-[12px] font-normal text-ink-3">({rows.length})</span>
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  className="rounded-xl border p-3 text-left hover:border-[var(--brand)]"
                  style={cardStyle}
                  onClick={() => nav(`basic-stats/${m.code}`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ background: "var(--brand-soft)" }}>{m.code}</span>
                    <span className="text-[13.5px] font-medium">{m.name}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-3">{m.english}</div>
                  <div className="mt-1.5 line-clamp-2 text-[11.5px] text-ink-2">{m.tagline || m.question}</div>
                  <div className="mt-1.5 text-[10.5px] text-ink-3">{m.group}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function sum(v: MVerification, k: "exampleMatched" | "exampleCells") {
  return Object.values(v.items).reduce((a, b) => a + (b[k] || 0), 0);
}
