"use client";
/**
 * 기본통계 스튜디오 — 기본 지식·분석 고르기·SEM 개요 화면과 Expert 모드(Methodos 43기법) 길잡이.
 * 계산 화면은 stats/MethodosStudio 가 맡는다. 예전 모듈별 계산 화면(A-01 … cfa)은 Methodos 기법으로 바뀌어 없어졌다.
 */
import { useEffect, useMemo, useState } from "react";
import { loadBasicStatsCurriculum, getModule, type BsCurriculum } from "@/lib/basic-stats-guide";
import MethodosHub from "./stats/MethodosHub";
import MethodosStudio from "./stats/MethodosStudio";

const card = "rounded-2xl border p-4 md:p-5";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const h1 = "text-[24px] font-semibold tracking-tight";
const h2 = "text-[16px] font-semibold";
const body = "text-[14px] leading-relaxed text-ink-2";

/** 예전 기본통계 모듈 번호 → Methodos 43기법. 같은 일을 하는 기법으로 곧장 보낸다. */
const LEGACY_TO_METHODOS: Record<string, string> = {
  "A-01": "M02", "A-02": "M01", "A-03": "M01", "B-01": "M21", "B-02": "M21", "B-03": "M22",
  "C-01": "M04", "C-02": "M05", "C-03": "M06", "C-04": "M07", "C-05": "M14", "C-06": "M18", "C-07": "M15", "C-08": "M16", "C-09": "M03", "C-10": "M07",
  "D-01": "M08", "D-04": "M03", "E-01": "M09", "E-02": "M10", "E-03": "M11", "E-04": "M10", "E-05": "M10", "E-06": "M13", "E-07": "M12",
  "G-03": "M18", "G-06": "M19", "I-01": "M34", "J-01": "M40", "J-02": "M40",
  cfa: "M25", path: "M28", sem: "M29", sem_fix: "M29", sem_mod: "M29", mg: "M26",
};

export default function BasicStatsStudio({
  nav,
  sub,
}: {
  nav: (r: string) => void;
  sub?: string;
}) {
  const [cur, setCur] = useState<BsCurriculum | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadBasicStatsCurriculum()
      .then(setCur)
      .catch((e) => setErr(String(e?.message || e)));
  }, []);

  const mod = useMemo(() => {
    if (!cur || !sub) return null;
    if (["basics", "sem-overview", "decision", "hub"].includes(sub)) return null;
    return getModule(cur, sub) || null;
  }, [cur, sub]);

  // 예전 모듈 번호로 들어오면 같은 일을 하는 Methodos 기법으로 보낸다.
  const legacyTarget = sub ? LEGACY_TO_METHODOS[sub] : undefined;
  useEffect(() => {
    if (legacyTarget) nav(`basic-stats/${legacyTarget}`);
  }, [legacyTarget, nav]);
  if (sub && /^M\d{2}$/.test(sub)) return <MethodosStudio code={sub} nav={nav} />;
  if (legacyTarget) return <div className="p-6 text-ink-3">Methodos 기법({legacyTarget})으로 이동합니다…</div>;

  if (err) return <div className="p-6 text-red-600">커리큘럼 로드 실패: {err}</div>;
  if (!cur) return <div className="p-6 text-ink-3">기본통계 로딩 중…</div>;

  if (mod) {
    return (
      <div>
        <div className="mb-4 rounded-xl border p-3 text-[13px]" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--brand-soft)" }}>
          「{mod.displayTitle || mod.formalName || mod.name}」은 Methodos 43기법으로 바뀌었습니다. 아래 목록에서 같은 일을 하는 기법을 고르세요.
        </div>
        <MethodosHub nav={nav} />
      </div>
    );
  }

  if (sub === "basics") {
    return (
      <div>
        <button type="button" className="btn btn-sm mb-3" onClick={() => nav("basic-stats")}>← 기본통계 홈</button>
        <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>{cur.basics.title}</h1>
        <p className={`${body} mt-2 mb-4`}>논문 통계의 공통 언어입니다. 가설·척도·표본·코딩을 이해하면 이후 분석이 훨씬 쉽습니다.</p>
        <div className="space-y-3">
          {cur.basics.chapters.map((ch, i) => (
            <section key={ch.id} className={card} style={cardStyle}>
              <h2 className={h2}>{i + 1}. {ch.title}</h2>
              <p className={`${body} mt-2`}>{ch.summary}</p>
              <ul className="mt-2 list-disc pl-5 text-[13px] text-ink-2 space-y-1">
                {ch.examples.map((ex, j) => <li key={j}>{ex}</li>)}
              </ul>
              {ch.detail && (
                <div className="mt-3 rounded-xl border p-3" style={{ ...cardStyle, background: "var(--brand-soft)" }}>
                  <p className="text-[13px] text-ink-2"><b>명칭 유래 · </b>{ch.detail.naming}</p>
                  <p className="mt-1.5 text-[13px] text-ink-2"><b>의미·쓰임 · </b>{ch.detail.meaning}</p>
                  {ch.detail.examples?.length > 0 && (
                    <div className="mt-1.5 text-[12.5px] text-ink-3">예시 — {ch.detail.examples.join(" · ")}</div>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* v53: 모든 척도 전면 서술 */}
        {cur.basics.scales && (
          <section className={`${card} mt-4`} style={cardStyle}>
            <h2 className={h2}>{cur.basics.scales.title}</h2>
            <p className={`${body} mt-1.5`}>{cur.basics.scales.intro}</p>
            <div className="mt-3 grid md:grid-cols-2 gap-2.5">
              {cur.basics.scales.items.map((s, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{s.name}</div>
                  <p className="mt-1 text-[13px] text-ink-2">{s.desc}</p>
                  <div className="mt-1.5 text-[12.5px] text-ink-3"><b>쓸 수 있는 통계 · </b>{s.stat}</div>
                  {s.examples?.length > 0 && (
                    <div className="mt-1 text-[12.5px] text-ink-3">예시 — {s.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* v53: 모든 변수 전면 서술 */}
        {cur.basics.variables && (
          <section className={`${card} mt-4`} style={cardStyle}>
            <h2 className={h2}>{cur.basics.variables.title}</h2>
            <p className={`${body} mt-1.5`}>{cur.basics.variables.intro}</p>
            <div className="mt-3 grid md:grid-cols-2 gap-2.5">
              {cur.basics.variables.items.map((v, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{v.name}</div>
                  <p className="mt-1 text-[13px] text-ink-2">{v.desc}</p>
                  {v.examples?.length > 0 && (
                    <div className="mt-1 text-[12.5px] text-ink-3">예시 — {v.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => nav("basic-stats/decision")}>
            구분도로 분석 고르기 →
          </button>
          <button type="button" className="btn" onClick={() => nav("basic-stats/sem-overview")}>
            SEM 개요 보기
          </button>
        </div>
      </div>
    );
  }

  if (sub === "sem-overview") {
    const s = cur.semOverview;
    return (
      <div>
        <button type="button" className="btn btn-sm mb-3" onClick={() => nav("basic-stats")}>← 기본통계 홈</button>
        <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>{s.title}</h1>
        <p className={`${body} mt-2 mb-4`}>{s.easy}</p>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {s.parts.map((p) => (
            <div key={p.name} className={card} style={cardStyle}>
              <div className="font-semibold">{p.name}</div>
              <p className="text-[13px] text-ink-2 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
        <section className={card} style={cardStyle}>
          <h2 className={h2}>쉬운 예시</h2>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-[14px] text-ink-2">
            {s.examples.map((ex, i) => <li key={i}>{ex}</li>)}
          </ol>
        </section>
        <section className={`${card} mt-3`} style={cardStyle}>
          <h2 className={h2}>추천순서</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.story.map((x, i) => (
              <span key={i} className="text-[12px] rounded-lg border px-2 py-1" style={cardStyle}>
                {i + 1}. {x}
              </span>
            ))}
          </div>
        </section>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => nav("basic-stats/cfa")}>
            확인적 요인분석부터 →
          </button>
          <button type="button" className="btn" onClick={() => nav("basic-stats/sem")}>
            SEM 분석 모듈
          </button>
          <button type="button" className="btn" onClick={() => nav("basic-stats/path")}>
            경로분석
          </button>
        </div>
      </div>
    );
  }

  if (sub === "decision") {
    const d = cur.decision;
    return (
      <div>
        <button type="button" className="btn btn-sm mb-3" onClick={() => nav("basic-stats")}>← 기본통계 홈</button>
        <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>{d.title}</h1>
        <p className={`${body} mt-2 mb-2`}>평균/분산 경로를 클릭형으로 단순화했습니다.</p>
        <ul className="text-[13px] text-ink-3 mb-4 list-disc pl-5">
          {d.assumptions.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
        <div className="space-y-2">
          {d.branches.map((b, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left rounded-xl border p-3 hover:bg-[var(--brand-soft)]"
              style={cardStyle}
              onClick={() => nav(`basic-stats/${b.to}`)}
            >
              <div className="text-[12px] text-ink-3">{b.when}</div>
              <div className="font-medium text-[14px] mt-0.5">→ {b.then}</div>
            </button>
          ))}
        </div>

        {/* 구분도 용어 가이드 — 집단·측정·종속·독립·분산이 왜 몇 개 들어가나 */}
        {d.termGuide && d.termGuide.length > 0 && (
          <section className={`${card} mt-5`} style={cardStyle}>
            <h2 className={h2}>구분도 용어 — 왜 이 변수가, 몇 개 들어가나요?</h2>
            <p className={`${body} mt-1`}>구분도에 나오는 <b>분석대상·집단·측정·종속·독립·분산</b>이 무슨 뜻이고, 왜 개수를 따지는지 쉽게 풀었습니다.</p>
            <div className="mt-3 space-y-2.5">
              {d.termGuide.map((t, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{t.term}</div>
                  <p className="mt-1 text-[13.5px] text-ink-2"><b>뜻 · </b>{t.meaning}</p>
                  <p className="mt-1 text-[13.5px] text-ink-2"><b>왜 개수를 따지나 · </b>{t.why}</p>
                  {t.examples?.length > 0 && (
                    <div className="mt-1.5 text-[12.5px] text-ink-3">예시 — {t.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8개 분석 명칭 유래 */}
        {d.analysisNaming && d.analysisNaming.length > 0 && (
          <section className={`${card} mt-4`} style={cardStyle}>
            <h2 className={h2}>이 분석들은 왜 이런 이름인가요?</h2>
            <p className={`${body} mt-1`}>구분도가 가리키는 <b>8가지 분석</b>의 명칭 유래와 쓰임을 쉬운 예시와 함께 정리했습니다.</p>
            <div className="mt-3 grid md:grid-cols-2 gap-2.5">
              {d.analysisNaming.map((a, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{a.name}</div>
                  <p className="mt-1 text-[13px] text-ink-2"><b>명칭 · </b>{a.why}</p>
                  <p className="mt-1 text-[13px] text-ink-2"><b>쓰임 · </b>{a.use}</p>
                  {a.examples?.length > 0 && (
                    <div className="mt-1.5 text-[12.5px] text-ink-3">예시 — {a.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Hub

  return (
    <div>
      <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>기본통계</h1>
      <p className={`${body} mt-2 mb-4`}>
        논문 통계 기본 지식부터 Methodos 43기법(기술통계·검정·회귀·구조방정식·IRT·생존·메타분석)까지, 스토리처럼 이어지는 분석절차형 워크벤치입니다.
        쉬운 선택지로 단계마다 이유와 다음 단계를 안내합니다.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {cur.story.map((s) => (
          <button
            key={s.id}
            type="button"
            className="rounded-xl border px-3 py-2 text-left text-[13px]"
            style={cardStyle}
            onClick={() => {
              if (s.id === "basics") nav("basic-stats/basics");
              else if (s.id === "sem_overview") nav("basic-stats/sem-overview");
              else if (s.id === "decision") nav("basic-stats/decision");
              else if (s.id === "classic" || s.id === "spss") nav("basic-stats/M01");
              else if (s.id === "sem" || s.id === "amos") nav("basic-stats/M25");
              else nav("basic-stats");
            }}
          >
            <div className="font-medium">{s.label}</div>
            <div className="text-[11px] text-ink-3">{s.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-5">
        <button type="button" className={`${card} text-left`} style={cardStyle} onClick={() => nav("basic-stats/basics")}>
          <div className="font-semibold text-[15px]">📖 논문 통계 기본 지식</div>
          <p className="text-[13px] text-ink-2 mt-1">가설·유의수준·척도·표본·코딩·분석 선택</p>
        </button>
        <button type="button" className={`${card} text-left`} style={cardStyle} onClick={() => nav("basic-stats/sem-overview")}>
          <div className="font-semibold text-[15px]">🔗 구조방정식모델 개요</div>
          <p className="text-[13px] text-ink-2 mt-1">측정·구조·적합도를 쉬운 예시로</p>
        </button>
      </div>

      <MethodosHub nav={nav} />
    </div>
  );
}
