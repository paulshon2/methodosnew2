"use client";
// AI 보조 질적 코딩 인터페이스 — ai_coding_tool.html의 React 전환 + 5개 모드 확장. methodos-f18.
// 공통 원칙(사용자 요구): ① AI 산출물은 항상 '초안'(확정은 연구자) ② 원문 근거 인용 강제(환각 방지)
// ③ 일치도·포화도 수치 추적(Cohen's κ·신규정보율) ④ 프롬프트/코드북 버전 기록(재현가능성).
// 모드:
//  ca-category  TX-002 6단계(유목 설계): 개방형 주제 추출 → 군집화(상호배타성 점검) → 코드북 초안 → 연구자 확정
//  ca-coding    TX-002 8단계(본코딩): 코드북=프롬프트, AI 1·2차(설정 변형) 다중코더 → κ 일치도 → 불일치 재검토 → 10% 검수
//  gt-open      QL-008 4단계(개방코딩): 라인바이라인 개념 명명(괄호치기 제약·in-vivo) → 범주 후보 → 속성·차원
//  gt-axial     QL-008 5단계(축코딩): 범주쌍 관계 추출(원문 인용 필수, 근거 없으면 기각) → 패러다임 슬롯 초안 → 네트워크
//  gt-selective QL-008 6단계(선택코딩): 포화도 정량 추적(신규정보율) → 핵심범주 후보(연결 중심성) → 스토리라인 초안
// AI 호출: engine.aiComplete(설정된 공급자 키). 키가 없으면 규칙기반 근사로 대체하고 반드시 그 사실을 표기한다.
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/app-store";
import { aiComplete } from "@/lib/engine";
import { exportXLSX, extractFile } from "@/lib/ca-automation";
import CaChart from "./ca-chart";
import { specFromCooccur, specFromTrend, type CaChartSpec } from "@/lib/ca-charts";
import { Gloss } from "./gloss";
import { useAnnotation } from "./annotations";
import { mergeTerms, preferAcademic, PARADIGM_SLOT_TERMS, CORE_METHOD_TERMS, termsFromText } from "@/lib/page-glossary";

export type AiMode = "ca-category" | "ca-coding" | "gt-open" | "gt-axial" | "gt-selective";

const META: Record<AiMode, { title: string; desc: string }> = {
  "ca-category": { title: "AI 유목 설계 보조 — 주제 추출 · 군집화 · 코드북 초안", desc: "AI는 연구자가 놓칠 수 있는 반복 패턴을 먼저 보여주는 도구입니다. 유목의 최종 확정(상호배타성·포괄성 판단)은 연구자의 이론적 판단으로만 이루어집니다." },
  "ca-coding": { title: "AI 본코딩 — 코드북 기반 다중코더 시뮬레이션 · 신뢰도 검증", desc: "AI를 '코더 중 하나'로 취급합니다. 1차·2차(설정 변형) 코딩의 일치도를 Cohen's κ로 계산하고, 불일치 사례는 연구자가 재검토해 확정합니다." },
  "gt-open": { title: "AI 개방코딩 보조 — 라인바이라인 개념 명명 · 범주 후보 · 속성/차원", desc: "프롬프트에 '텍스트에 명시된 내용만 근거로 하고 외부 지식으로 추론하지 말라'는 괄호치기 제약을 강제합니다. 개념 확정·명명은 연구자의 몫입니다." },
  "gt-axial": { title: "AI 축코딩 보조 — 관계 추출(근거 인용 필수) · 패러다임 슬롯 · 네트워크", desc: "범주 간 관계는 원문 인용이 있는 것만 채택합니다(근거 없는 관계는 기각). 패러다임 배치는 초안이며 연구자가 원자료와 대조해 검증합니다." },
  "gt-selective": { title: "AI 선택코딩 보조 — 이론적 포화 추적 · 핵심범주 후보 · 스토리라인 초안", desc: "새 자료에서 신규 정보 비율이 임계치 이하로 떨어지면 포화 근접 신호로 참고합니다(최종 판단은 연구자). 핵심범주는 연결 중심성 기준 후보만 제시합니다." },
};

interface Unit { id: number; text: string; }
interface Coded { code: string; quote: string; reason: string; }
interface Cat { category: string; codes: string[]; rationale: string; }
interface Rel { a: string; b: string; type: string; quote: string; ok: boolean; }
interface CodebookRow { name: string; def: string; }
interface ToolState {
  rawText: string; unitType: "paragraph" | "sentence" | "line"; units: Unit[];
  codebook: CodebookRow[];
  run1: Record<number, Coded>; run2: Record<number, Coded>; finalCode: Record<number, string>;
  cats: Cat[]; propdims: { category: string; property: string; dimension: string }[];
  relations: Rel[]; paradigm: Record<string, string>;
  saturation: { label: string; ratio: number }[]; core: { name: string; degree: number }[]; storyline: string;
  onlyMismatch: boolean; project: string;
}
const BLANK: ToolState = { rawText: "", unitType: "paragraph", units: [], codebook: [{ name: "", def: "" }, { name: "", def: "" }, { name: "", def: "" }], run1: {}, run2: {}, finalCode: {}, cats: [], propdims: [], relations: [], paradigm: {}, saturation: [], core: [], storyline: "", onlyMismatch: false, project: "" };

const SLOTS = ["인과적 조건", "중심현상", "맥락적 조건", "중재적 조건", "작용/상호작용 전략", "결과"];
const IMPORT_ACCEPT = ".xlsx,.xls,.csv,.pdf,.docx,.doc,.txt,.md";

// ── 소형 유틸(규칙기반 근사) ──
const STOP = new Set("그리고 그러나 하지만 또한 또 또는 이런 저런 그런 매우 너무 정말 가장 등 및 의 가 이 그 저 것 수 때 더 본 위 내 안 중 약 대한 대해 위해 위한 에서 으로 하는 한다 있다 없다 된다 이다 같다 저는 나는 제가".split(/\s+/));
const tok = (t: string) => ((t || "").toLowerCase().match(/[가-힣]{2,}|[a-z]{3,}/g) || []).filter((w) => !STOP.has(w));
const topKw = (t: string, n = 3) => { const f: Record<string, number> = {}; tok(t).forEach((w) => (f[w] = (f[w] || 0) + 1)); return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w); };
const overlap = (a: Set<string>, b: Set<string>) => { let n = 0; a.forEach((w) => { if (b.has(w)) n++; }); return n; };
function kappa(c1: string[], c2: string[]) {
  const n = c1.length; if (!n) return { po: 0, k: 0 };
  let agree = 0; for (let i = 0; i < n; i++) if (c1[i] === c2[i]) agree++;
  const po = agree / n; const cats = Array.from(new Set([...c1, ...c2]));
  let pe = 0; for (const c of cats) pe += (c1.filter((x) => x === c).length / n) * (c2.filter((x) => x === c).length / n);
  return { po, k: pe >= 1 ? 1 : (po - pe) / (1 - pe) };
}
function parseJsonLoose<T = any>(text: string): T | null {
  try { let t = text.trim().replace(/```json/gi, "").replace(/```/g, "").trim(); const s = t.indexOf("["), e = t.lastIndexOf("]"); if (s >= 0 && e > s) t = t.slice(s, e + 1); return JSON.parse(t); } catch { return null; }
}
const BRACKET = "반드시 이 텍스트에 명시된 내용만 근거로 사용하고, 외부 지식이나 기존 이론으로 추론하지 마세요(괄호치기).";
const JSON_ONLY = "반드시 순수 JSON 배열만 출력하세요. 설명·코드블록 표시(백틱)를 절대 포함하지 마세요.";

export default function AiCodingTool({ pid, mode }: { pid: string; mode: AiMode }) {
  const settings = useStore((s) => s.settings);
  const getCa = useStore((s) => s.getCa);
  const setCa = useStore((s) => s.setCa);
  const { replace } = useAnnotation();
  const key = `aict:${mode}`;
  const ctxKey = mode.startsWith("ca") ? "capctx" : "gtctx";

  const [st, setSt] = useState<ToolState>(() => ({ ...BLANK, ...(getCa(pid)[key] || {}) }));
  const [busy, setBusy] = useState("");
  const [prog, setProg] = useState(0);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const abortRef = useRef(false);
  const patch = (p: Partial<ToolState>) => setSt((s) => { const n = { ...s, ...p }; setCa(pid, { [key]: n }); return n; });
  const say = (text: string, ok = true) => setNote({ text, ok });

  // 하위 워크벤치(개방·축·선택코딩): 왼쪽 용어 주석에 학술용어+쉬운 예시 강제 시드
  useEffect(() => {
    const meta = META[mode];
    const blob = `${meta.title} ${meta.desc} ${SLOTS.join(" ")} 개방코딩 축코딩 선택코딩 패러다임모형 속성 차원 이론적 포화 핵심범주 이야기윤곽`;
    const modeTerms =
      mode === "gt-axial" ? PARADIGM_SLOT_TERMS
        : mode === "gt-open" ? CORE_METHOD_TERMS.filter((t) => ["개방코딩", "속성", "차원", "범주별 속성 차원"].includes(t.term))
          : mode === "gt-selective" ? CORE_METHOD_TERMS.filter((t) => ["선택코딩", "핵심범주", "이야기윤곽", "이론적 포화", "패러다임모형"].includes(t.term))
            : CORE_METHOD_TERMS.filter((t) => ["개방코딩", "축코딩"].includes(t.term));
    replace(preferAcademic(mergeTerms(modeTerms, PARADIGM_SLOT_TERMS, termsFromText(blob), CORE_METHOD_TERMS.filter((t) => blob.includes(t.term)))));
  }, [mode, replace]);

  const cb = st.codebook.filter((c) => c.name.trim());
  const hasAiKey = !!((settings?.keys && settings.keys[settings.provider || "google"]) || (settings as any)?.apiKey || settings?.provider === "ollama");
  const aiTag = (usedAi: boolean) => usedAi ? "" : " (AI 키 없음 — 규칙기반 근사로 대체됨. 설정 > AI 공급자에서 키 입력 시 실제 LLM 사용)";

  const ai = async (prompt: string): Promise<string | null> => { try { return await aiComplete(prompt, settings); } catch { return null; } };

  // ── 자료 분할 ──
  const split = () => {
    const raw = st.rawText.trim(); if (!raw) return say("자료를 먼저 입력하세요.", false);
    let parts: string[] = [];
    if (st.unitType === "paragraph") parts = raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    else if (st.unitType === "line") parts = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    else parts = (raw.replace(/\n/g, " ").match(/[^.!?。]+[.!?。]*/g) || []).map((s) => s.trim()).filter((s) => s.length > 1);
    // 축·선택코딩 모드에서는 개방코딩에서 불러온 범주를 보존한다(분할이 범주를 지우면 안 됨)
    const keepCats = mode === "gt-axial" || mode === "gt-selective";
    patch({ units: parts.map((text, i) => ({ id: i + 1, text })), run1: {}, run2: {}, finalCode: {}, ...(keepCats ? {} : { cats: [] }), relations: [], saturation: [], core: [] });
    say(`${parts.length}개 분석 단위로 분할되었습니다.${keepCats && st.cats.length ? ` (범주 ${st.cats.length}개 유지)` : ""}`);
  };
  const loadCtx = () => {
    const ctx = getCa(pid)[ctxKey] || {};
    const t = ctx.poolText || (ctx.pool || []).map((p: any) => p.text).join("\n");
    if (!t) return say("이전 단계 결과 자료가 없습니다. 앞 단계에서 자료를 불러오거나 직접 붙여넣으세요.", false);
    patch({ rawText: t }); say("이전 단계 자료를 가져왔습니다. [자료 분할하기]를 누르세요.");
  };
  const onFile = async (f: File | undefined) => { if (!f) return; setBusy("파일"); try { const d = await extractFile(f); patch({ rawText: (st.rawText ? st.rawText + "\n\n" : "") + d.text }); say(`${f.name}에서 ${d.chars.toLocaleString()}자 추출`); } finally { setBusy(""); } };

  // ── 코딩(1차/2차) — AI 배치 + 규칙기반 폴백 ──
  const codingPrompt = (open: boolean, variant: boolean) => open
    ? `당신은 질적 연구의 개방코딩(open coding)을 보조하는 코더입니다.\n각 텍스트 단위에서 나타나는 행위·사건·의미를 간결한 개념(코드)명으로 명명하세요(참여자 표현을 살린 in-vivo code 허용).\n${BRACKET}\n- 코드명은 2~6단어 명사구.\n- 반드시 원문에서 근거 부분을 15단어 이내로 발췌해 quote에 넣으세요.\n${variant ? "- 앞선 코딩과 독립적으로, 처음 보는 자료처럼 판단하세요.\n" : ""}- ${JSON_ONLY}\n출력: [{"id":1,"code":"...","quote":"...","reason":"..."}]`
    : `당신은 TX-002 본코딩을 수행하는 코더입니다. 아래 코드북의 코드 중 하나만 각 단위에 배정하세요(새 코드 생성 금지).\n[코드북 v${new Date().toISOString().slice(0, 10)}]\n${cb.map((c) => `- ${c.name}: ${c.def || "(정의 없음)"}`).join("\n")}\n${BRACKET}\n- 반드시 원문 근거를 15단어 이내로 quote에 발췌.\n- 애매하면 가장 근접한 코드를 고르고 reason에 설명.\n${variant ? "- 앞선 코딩과 독립적으로 재판단하세요.\n" : ""}- ${JSON_ONLY}\n출력: [{"id":1,"code":"코드북의 코드명","quote":"...","reason":"..."}]`;

  const ruleCode = (u: Unit, open: boolean, variant: boolean): Coded => {
    const words = tok(u.text);
    if (open || !cb.length) {
      const kws = topKw(u.text, variant ? 3 : 2);
      return { code: (variant ? kws.slice(1) : kws).slice(0, 2).join("·") || "미분류", quote: u.text.split(/\s+/).slice(0, 10).join(" "), reason: "키워드 기반 규칙 명명(근사)" };
    }
    const uset = new Set(words);
    let best = cb[0], bestN = -1;
    for (const c of cb) { const cset = new Set(tok(c.name + " " + (variant ? "" : c.def))); const n = overlap(uset, cset); if (n > bestN) { bestN = n; best = c; } }
    const hit = tok(best.name + " " + best.def).find((w) => uset.has(w));
    return { code: best.name, quote: hit ? u.text.slice(Math.max(0, u.text.indexOf(hit) - 8), u.text.indexOf(hit) + 22) : u.text.slice(0, 24), reason: `규칙기반 매칭(중복 토큰 ${Math.max(0, bestN)}개)` };
  };

  const runCoding = async (which: 1 | 2) => {
    if (!st.units.length) return say("먼저 자료를 분할하세요.", false);
    if (mode === "ca-coding" && !cb.length) return say("코드북을 먼저 입력(또는 유목설계에서 불러오기)하세요.", false);
    const open = mode !== "ca-coding";
    setBusy(`run${which}`); setProg(0); abortRef.current = false;
    const store: Record<number, Coded> = {};
    let usedAi = false;
    const B = 6;
    for (let i = 0; i < st.units.length; i += B) {
      if (abortRef.current) break;
      const batch = st.units.slice(i, i + B);
      let done = false;
      if (hasAiKey) {
        const raw = await ai(codingPrompt(open, which === 2) + "\n\n다음 단위들을 코딩하세요:\n" + batch.map((u) => `[id:${u.id}] ${u.text.slice(0, 500)}`).join("\n\n"));
        const arr = raw ? parseJsonLoose<any[]>(raw) : null;
        if (arr) { usedAi = true; done = true; arr.forEach((it) => { if (it && it.id) store[it.id] = { code: String(it.code || "").trim(), quote: String(it.quote || "").trim(), reason: String(it.reason || "").trim() }; }); }
      }
      if (!done) batch.forEach((u) => { store[u.id] = ruleCode(u, open, which === 2); });
      batch.forEach((u) => { if (!store[u.id]) store[u.id] = ruleCode(u, open, which === 2); });
      setProg(Math.round(Math.min(100, ((i + B) / st.units.length) * 100)));
    }
    if (which === 1) { const fin: Record<number, string> = {}; st.units.forEach((u) => (fin[u.id] = store[u.id]?.code || "")); patch({ run1: store, finalCode: fin }); }
    else patch({ run2: store });
    setBusy(""); setProg(100);
    say(`${which}차 코딩 완료 — ${Object.keys(store).length}개 단위${aiTag(usedAi)}`, true);
  };

  // ── 범주화(군집) — ca-category ②, gt-open ② 공용 ──
  const runCategorize = async () => {
    const codes = Array.from(new Set(st.units.map((u) => st.finalCode[u.id] || st.run1[u.id]?.code).filter(Boolean))) as string[];
    if (!codes.length) return say("먼저 ① 코딩(개념 추출)을 실행하세요.", false);
    setBusy("cat");
    let cats: Cat[] | null = null; let usedAi = false;
    if (hasAiKey) {
      const raw = await ai(`당신은 질적 코딩의 범주화를 보조합니다. 아래 코드들을 의미가 유사한 것끼리 묶어 상위 범주 후보를 제안하세요.\n- 근거 없이 억지로 묶지 말고, 관련성이 낮으면 별도 범주로 두세요.\n- 각 범주: 이름·포함 코드·묶은 근거(rationale).\n- ${JSON_ONLY}\n출력: [{"category":"...","codes":["..."],"rationale":"..."}]\n\n코드 목록:\n${codes.map((c) => "- " + c).join("\n")}`);
      const arr = raw ? parseJsonLoose<Cat[]>(raw) : null;
      if (arr) { cats = arr.map((c) => ({ category: String(c.category || ""), codes: (c.codes || []).map(String), rationale: String(c.rationale || "") })); usedAi = true; }
    }
    if (!cats) { // 규칙: 토큰 중복 군집(임베딩 유사도 근사)
      const groups: { key: Set<string>; codes: string[] }[] = [];
      for (const c of codes) {
        const cset = new Set(tok(c));
        const g = groups.find((x) => overlap(x.key, cset) > 0);
        if (g) { g.codes.push(c); cset.forEach((w) => g.key.add(w)); } else groups.push({ key: cset, codes: [c] });
      }
      cats = groups.map((g, i) => ({ category: `범주 후보 ${i + 1}(${g.codes[0].slice(0, 12)})`, codes: g.codes, rationale: "공유 어휘 기반 자동 군집(임베딩 유사도 근사) — 연구자 검토 필요" }));
    }
    // 상호배타성 점검: 서로 다른 범주에 같은 코드가 있으면 경계 애매 신호
    const seen = new Map<string, number>(); let dup = 0;
    cats.forEach((c, i) => c.codes.forEach((cd) => { if (seen.has(cd) && seen.get(cd) !== i) dup++; seen.set(cd, i); }));
    patch({ cats });
    setBusy("");
    say(`범주 후보 ${cats.length}개 생성${dup ? ` · ⚠ 범주 간 중복 코드 ${dup}개 — 유목 경계가 애매하다는 신호(상호배타성 재검토)` : " · 범주 간 중복 없음(상호배타성 양호 신호)"}${aiTag(usedAi)}`, !dup);
  };

  // ── 코드북 초안(ca-category ③) / 속성·차원(gt-open ③) ──
  const runCodebookDraft = async () => {
    if (!st.cats.length) return say("먼저 ② 범주화를 실행하세요.", false);
    setBusy("cbd"); let usedAi = false;
    let rows: CodebookRow[] | null = null;
    if (hasAiKey) {
      const raw = await ai(`아래 각 범주에 대해 TX-002 코드북 항목 초안을 작성하세요: 정의(1문장), 포함 예시 기준, 제외 예시 기준을 def에 '정의 / 포함: … / 제외: …' 형식으로.\n- ${JSON_ONLY}\n출력: [{"name":"범주명","def":"정의 / 포함: ... / 제외: ..."}]\n\n범주:\n${st.cats.map((c) => `- ${c.category}: ${c.codes.join(", ")}`).join("\n")}`);
      const arr = raw ? parseJsonLoose<CodebookRow[]>(raw) : null;
      if (arr) { rows = arr.map((r) => ({ name: String(r.name || ""), def: String(r.def || "") })); usedAi = true; }
    }
    if (!rows) rows = st.cats.map((c) => ({ name: c.category, def: `${c.codes.slice(0, 3).join("·")} 관련 내용 / 포함: ${c.codes[0] || ""} 등 유사 표현 / 제외: 다른 범주가 더 적합한 경우` }));
    patch({ codebook: rows });
    setBusy(""); say(`코드북 초안 ${rows.length}개 생성 — 연구자가 정의·포함/제외 기준을 다듬어 확정하세요${aiTag(usedAi)}`);
  };
  const runPropDim = async () => {
    if (!st.cats.length) return say("먼저 ② 범주화를 실행하세요.", false);
    setBusy("pd"); let usedAi = false;
    let rows: ToolState["propdims"] | null = null;
    if (hasAiKey) {
      const raw = await ai(`QL-008 지속적 비교의 초벌 작업입니다. 각 범주에 속한 개념들이 공유하는 속성(property)과 그 속성이 나타나는 차원(dimension: 낮음↔높음 같은 연속 범위)을 정리하세요.\n${BRACKET}\n- ${JSON_ONLY}\n출력: [{"category":"...","property":"...","dimension":"...↔..."}]\n\n범주와 개념:\n${st.cats.map((c) => `- ${c.category}: ${c.codes.join(", ")}`).join("\n")}`);
      const arr = raw ? parseJsonLoose<any[]>(raw) : null;
      if (arr) { rows = arr.map((r) => ({ category: String(r.category || ""), property: String(r.property || ""), dimension: String(r.dimension || "") })); usedAi = true; }
    }
    if (!rows) rows = st.cats.map((c) => ({ category: c.category, property: topKw(c.codes.join(" "), 1)[0] || "정도", dimension: "약함 ↔ 강함" }));
    patch({ propdims: rows });
    setBusy(""); say(`속성·차원 초안 ${rows.length}건${aiTag(usedAi)}`);
  };

  // ── 축코딩: 관계 추출 + 패러다임 슬롯 ──
  const catNames = () => st.cats.length ? st.cats.map((c) => c.category) : Array.from(new Set(Object.values(st.finalCode).filter(Boolean)));
  const loadCatsFromOpen = () => {
    const c = (getCa(pid).gtctx || {}).aiOpenCats as Cat[] | undefined;
    if (!c?.length) return say("개방코딩 단계에서 보낸 범주가 없습니다. 4단계 도구에서 [범주를 축코딩으로 보내기]를 먼저 실행하세요.", false);
    patch({ cats: c }); say(`개방코딩 범주 ${c.length}개를 불러왔습니다.`);
  };
  const runRelations = async () => {
    const names = catNames();
    if (names.length < 2) return say("범주가 2개 이상 필요합니다(개방코딩 범주 불러오기 또는 ①·② 실행).", false);
    if (!st.units.length) return say("근거 인용 검증을 위해 원자료를 분할해 두세요.", false);
    setBusy("rel"); let usedAi = false;
    let rels: Rel[] | null = null;
    if (hasAiKey) {
      const raw = await ai(`QL-008 축코딩의 관계 추출입니다. 아래 범주 쌍들 사이에 인과적/맥락적/중재적/전략/결과적 관계가 '실제 자료에서' 나타나는지 판단하세요.\n${BRACKET}\n- 반드시 원문에서 근거 문장을 quote로 인용하세요. 근거를 인용할 수 없는 관계는 출력하지 마세요(기각).\n- ${JSON_ONLY}\n출력: [{"a":"범주1","b":"범주2","type":"인과적|맥락적|중재적|전략|결과적","quote":"원문 근거"}]\n\n범주: ${names.join(", ")}\n\n원자료(발췌):\n${st.units.slice(0, 40).map((u) => u.text).join("\n").slice(0, 3500)}`);
      const arr = raw ? parseJsonLoose<any[]>(raw) : null;
      if (arr) { rels = arr.filter((r) => r && r.quote).map((r) => ({ a: String(r.a), b: String(r.b), type: String(r.type || "연관"), quote: String(r.quote), ok: false })); usedAi = true; }
    }
    if (!rels) { // 규칙: 같은 단위 내 동시출현(부분 문자열 매칭 — 조사 대응) + 단서어 휴리스틱
      rels = [];
      const kws = (i: number) => Array.from(new Set(tok(names[i] + " " + (st.cats[i]?.codes || []).join(" "))));
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        const A = kws(i), B = kws(j);
        const hit = st.units.find((u) => A.some((w) => u.text.includes(w)) && B.some((w) => u.text.includes(w)));
        if (hit) {
          const t = hit.text;
          const type = /때문|으로 인해|덕분/.test(t) ? "인과적" : /상황|환경|여건/.test(t) ? "맥락적" : /도움|지원|중재/.test(t) ? "중재적" : /하려고|위해|노력/.test(t) ? "전략" : /결과|되었다|해졌다/.test(t) ? "결과적" : "연관";
          rels.push({ a: names[i], b: names[j], type, quote: t.slice(0, 90), ok: false });
        }
      }
    }
    patch({ relations: rels });
    setBusy(""); say(`관계 후보 ${rels.length}건(모두 원문 인용 포함) — 각 행의 ✔로 연구자 검증을 표시하세요${aiTag(usedAi)}`);
  };
  const runParadigm = async () => {
    const names = catNames();
    if (!names.length) return say("범주가 없습니다.", false);
    setBusy("par"); let usedAi = false;
    let slots: Record<string, string> | null = null;
    if (hasAiKey) {
      const raw = await ai(`QL-008 패러다임 모형의 슬롯 배치 초안입니다. 아래 범주들을 6개 슬롯(인과적 조건/중심현상/맥락적 조건/중재적 조건/작용상호작용 전략/결과)에 배치하세요. 억지로 채우지 말고 해당 없으면 비워두세요.\n- 반드시 순수 JSON 객체만 출력: {"인과적 조건":"범주명, 범주명","중심현상":"...","맥락적 조건":"...","중재적 조건":"...","작용/상호작용 전략":"...","결과":"..."}\n\n범주: ${names.join(", ")}\n검증된 관계: ${st.relations.filter((r) => r.ok).map((r) => `${r.a}-${r.type}->${r.b}`).join("; ") || "(없음)"}`);
      if (raw) { try { let t = raw.trim().replace(/```json/gi, "").replace(/```/g, "").trim(); const s = t.indexOf("{"), e = t.lastIndexOf("}"); if (s >= 0 && e > s) t = t.slice(s, e + 1); const obj = JSON.parse(t); slots = {}; SLOTS.forEach((k) => (slots![k] = String(obj[k] || obj[k.replace("/", "")] || ""))); usedAi = true; } catch { } }
    }
    if (!slots) {
      const deg: Record<string, number> = {}; st.relations.forEach((r) => { deg[r.a] = (deg[r.a] || 0) + 1; deg[r.b] = (deg[r.b] || 0) + 1; });
      const byDeg = [...names].sort((a, b) => (deg[b] || 0) - (deg[a] || 0));
      slots = { "중심현상": byDeg[0] || "", "인과적 조건": byDeg[1] || "", "작용/상호작용 전략": byDeg[2] || "", "결과": byDeg[3] || "", "맥락적 조건": byDeg[4] || "", "중재적 조건": byDeg[5] || "" };
    }
    patch({ paradigm: slots });
    setBusy(""); say(`패러다임 슬롯 초안 완성 — '이 배치가 실제로 성립하는가'를 원자료와 대조해 검증하세요${aiTag(usedAi)}`);
  };

  // ── 선택코딩: 포화도 + 핵심범주 + 스토리라인 ──
  const runSaturation = () => {
    if (st.units.length < 5) return say("포화도 추적에는 5개 이상의 분석 단위가 필요합니다.", false);
    const B = Math.max(1, Math.ceil(st.units.length / 5));
    const seen = new Set<string>(); const points: { label: string; ratio: number }[] = [];
    for (let b = 0; b * B < st.units.length; b++) {
      const batch = st.units.slice(b * B, (b + 1) * B);
      let neu = 0, tot = 0;
      batch.forEach((u) => tok(u.text).forEach((w) => { tot++; if (!seen.has(w)) { neu++; seen.add(w); } }));
      points.push({ label: `${b + 1}차`, ratio: tot ? Math.round((neu / tot) * 100) : 0 });
    }
    patch({ saturation: points });
    const last = points[points.length - 1]?.ratio ?? 100;
    say(`신규 정보 비율(임베딩 유사도 근사): ${points.map((p) => p.ratio + "%").join(" → ")} · ${last <= 10 ? "✓ 임계치(10%) 이하 — 포화 근접 신호(최종 판단은 연구자)" : "아직 새로운 정보가 유입 중 — 추가 표집 검토"}`);
  };
  const runCore = () => {
    const names = catNames();
    if (!names.length) return say("범주가 없습니다(개방코딩 범주 불러오기 또는 코딩 실행).", false);
    const rels = ((getCa(pid).gtctx || {}).aiRelations as Rel[] | undefined) || st.relations;
    const deg: Record<string, number> = {}; names.forEach((n) => (deg[n] = 0));
    if (rels.length) rels.forEach((r) => { deg[r.a] = (deg[r.a] || 0) + 1; deg[r.b] = (deg[r.b] || 0) + 1; });
    else { names.forEach((n, i) => { const ws = Array.from(new Set(tok(n + " " + (st.cats[i]?.codes || []).join(" ")))); deg[n] = st.units.filter((u) => ws.some((w) => u.text.includes(w))).length; }); }
    const core = Object.entries(deg).map(([name, degree]) => ({ name, degree })).sort((a, b) => b.degree - a.degree).slice(0, 6);
    patch({ core });
    say(`핵심범주 후보(연결 중심성 순) ${core.length}개 — 이론적 스토리라인으로 서술할지는 연구자가 최종 결정합니다.`);
  };
  const runStoryline = async () => {
    if (!st.core.length) return say("먼저 핵심범주 후보를 산출하세요.", false);
    setBusy("story"); let usedAi = false; let text: string | null = null;
    if (hasAiKey) {
      text = await ai(`QL-008 선택코딩의 이야기윤곽(story line) 초안을 5~7문장으로 작성하세요. 핵심범주 '${st.core[0].name}'를 중심으로 조건→현상→전략→결과의 흐름으로 서술하되, 아래 자료 범위를 벗어난 내용을 지어내지 마세요.\n범주: ${catNames().join(", ")}\n패러다임: ${SLOTS.map((s) => `${s}=${st.paradigm[s] || (getCa(pid).gtctx || {}).aiParadigm?.[s] || "-"}`).join("; ")}`);
      if (text) usedAi = true;
    }
    if (!text) {
      const p = { ...(getCa(pid).gtctx || {}).aiParadigm, ...st.paradigm } as Record<string, string>;
      text = `[스토리라인 초안 · 규칙기반 골격]\n${p["인과적 조건"] || "선행 조건"} 속에서 참여자들은 '${st.core[0].name}'(중심현상)을 경험한다. ${p["맥락적 조건"] || "맥락"}이라는 조건 아래, ${p["중재적 조건"] || "중재 요인"}의 영향을 받으며 ${p["작용/상호작용 전략"] || "대응 전략"}을 전개하고, 그 결과 ${p["결과"] || "결과"}에 이른다. (연구자가 원자료 인용과 함께 재서술하세요)`;
    }
    patch({ storyline: text.trim() });
    setBusy(""); say(`스토리라인 초안 생성${aiTag(usedAi)}`);
  };

  // ── 단계 간 전달 ──
  const sendCodebook = () => {
    if (!cb.length) return say("코드북이 비어 있습니다.", false);
    setCa(pid, { capctx: { ...(getCa(pid).capctx || {}), aiCodebook: cb } });
    say(`코드북 ${cb.length}개 항목을 본코딩(8단계) 도구로 보냈습니다.`);
  };
  const loadCodebook = () => {
    const c = (getCa(pid).capctx || {}).aiCodebook as CodebookRow[] | undefined;
    if (!c?.length) return say("유목설계(6단계)에서 보낸 코드북이 없습니다.", false);
    patch({ codebook: c }); say(`코드북 ${c.length}개 항목을 불러왔습니다.`);
  };
  const sendCatsToAxial = () => {
    if (!st.cats.length) return say("범주가 없습니다. ② 범주화를 먼저 실행하세요.", false);
    setCa(pid, { gtctx: { ...(getCa(pid).gtctx || {}), aiOpenCats: st.cats, poolText: st.rawText || (getCa(pid).gtctx || {}).poolText } });
    say(`범주 ${st.cats.length}개를 축코딩(5단계) 도구로 보냈습니다.`);
  };
  const sendAxialToSelective = () => {
    const ok = st.relations.filter((r) => r.ok);
    setCa(pid, { gtctx: { ...(getCa(pid).gtctx || {}), aiRelations: ok.length ? ok : st.relations, aiParadigm: st.paradigm } });
    say(`검증된 관계 ${ok.length || st.relations.length}건과 패러다임 배치를 선택코딩(6단계) 도구로 보냈습니다.`);
  };

  // ── 내보내기 ──
  const doExport = async () => {
    const info = [
      { "항목": "프로젝트/연구자", "값": st.project || "(미입력)" },
      { "항목": "도구 모드", "값": META[mode].title },
      { "항목": "코딩 모드", "값": mode === "ca-coding" ? `코드북 기반(${cb.length}개)` : "개방코딩/보조" },
      { "항목": "AI 공급자", "값": hasAiKey ? String(settings.provider || "") : "규칙기반 대체(키 없음)" },
      { "항목": "프롬프트 버전", "값": `bracketing+quote-required v${new Date().toISOString().slice(0, 10)}` },
      { "항목": "내보낸 일시", "값": new Date().toLocaleString("ko-KR") },
    ];
    const sheets: { name: string; rows: Record<string, any>[] }[] = [{ name: "정보", rows: info }];
    if (cb.length) sheets.push({ name: "코드북", rows: cb.map((c) => ({ "코드명": c.name, "정의": c.def })) });
    if (st.units.length) sheets.push({
      name: "코딩결과", rows: st.units.map((u) => {
        const r1 = st.run1[u.id] || { code: "", quote: "", reason: "" }; const r2 = st.run2[u.id];
        return { "번호": u.id, "원문": u.text, "AI 1차 코드": r1.code, "1차 근거인용": r1.quote, "1차 판단이유": r1.reason, "AI 2차 코드": r2?.code || "", "일치": r2 ? (r2.code === r1.code ? "일치" : "불일치") : "", "최종 확정": st.finalCode[u.id] || "", "10% 검수표본": u.id % 10 === 0 ? "검수" : "" };
      })
    });
    if (st.cats.length) sheets.push({ name: "범주화", rows: st.cats.map((c) => ({ "범주": c.category, "포함 코드": c.codes.join(", "), "근거": c.rationale })) });
    if (st.propdims.length) sheets.push({ name: "속성차원", rows: st.propdims.map((p) => ({ "범주": p.category, "속성": p.property, "차원": p.dimension })) });
    if (st.relations.length) sheets.push({ name: "관계", rows: st.relations.map((r) => ({ "범주A": r.a, "관계": r.type, "범주B": r.b, "원문 근거": r.quote, "연구자 검증": r.ok ? "확인" : "미확인" })) });
    if (Object.keys(st.paradigm).length) sheets.push({ name: "패러다임", rows: SLOTS.map((s) => ({ "슬롯": s, "배치 범주": st.paradigm[s] || "" })) });
    if (st.saturation.length) sheets.push({ name: "포화도", rows: st.saturation.map((p) => ({ "배치": p.label, "신규정보율(%)": p.ratio })) });
    if (st.core.length) sheets.push({ name: "핵심범주후보", rows: st.core.map((c) => ({ "범주": c.name, "연결 중심성": c.degree })) });
    if (st.storyline) sheets.push({ name: "스토리라인", rows: [{ "초안": st.storyline }] });
    await exportXLSX(sheets, `AI코딩_${mode}_${st.project || "무기명"}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── 신뢰도 통계 ──
  const rel = useMemo(() => {
    const ids = st.units.map((u) => u.id).filter((id) => st.run1[id] && st.run2[id]);
    if (!ids.length) return null;
    const { po, k } = kappa(ids.map((id) => st.run1[id].code), ids.map((id) => st.run2[id].code));
    return { n: ids.length, po, k };
  }, [st.run1, st.run2, st.units]);

  const netSpec: CaChartSpec | null = useMemo(() => {
    if (!st.relations.length) return null;
    return specFromCooccur(st.relations.map((r) => ({ a: r.a.slice(0, 12), b: r.b.slice(0, 12), count: r.ok ? 2 : 1 })), "network");
  }, [st.relations]);

  const isCA = mode.startsWith("ca");
  const showCodebookPanel = mode === "ca-coding" || (mode === "ca-category" && st.codebook.some((c) => c.name));
  const showCoding = mode === "ca-coding" || mode === "ca-category" || mode === "gt-open";
  const rows = st.units.filter((u) => !st.onlyMismatch || (st.run2[u.id] && st.run1[u.id] && st.run2[u.id].code !== st.run1[u.id].code));

  const box = { background: "var(--color-background-secondary)" } as const;
  return (
    <div className="text-[13.5px] leading-relaxed">
      <div className="rounded-md p-2.5 mb-3 text-[12.5px]" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
        <b>{META[mode].title}</b><div className="mt-0.5">{META[mode].desc}</div>
        {!hasAiKey && <div className="mt-1">ℹ 현재 AI 공급자 키가 없어 모든 실행이 <b>규칙기반 근사</b>로 대체됩니다(오프라인 동작). 설정 &gt; AI 공급자에서 키를 넣으면 실제 LLM으로 실행됩니다.</div>}
      </div>

      {/* 자료 입력 */}
      <div className="rounded-md p-3 mb-3" style={box}>
        <div className="font-semibold mb-2">Ⓐ 분석 자료 입력</div>
        <textarea className="inp text-[13px] w-full min-h-[110px]" placeholder="인터뷰 전사록·기사·개방형 응답 등을 붙여넣으세요." value={st.rawText} onChange={(e) => patch({ rawText: e.target.value })} />
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <span className="text-[12.5px]">분석 단위:</span>
          {([["paragraph", "문단"], ["sentence", "문장"], ["line", "줄"]] as const).map(([v, l]) => (
            <label key={v} className="text-[12.5px]"><input type="radio" checked={st.unitType === v} onChange={() => patch({ unitType: v })} /> {l}</label>))}
          <button className="btn btn-sm btn-primary" onClick={split}>자료 분할하기</button>
          <button className="btn btn-sm" onClick={loadCtx}>이전 단계 자료 연동</button>
          <label className="btn btn-sm cursor-pointer">파일 불러오기<input type="file" accept={IMPORT_ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
          <span className="text-[12px] text-ink-3">{st.units.length ? `${st.units.length}개 단위` : ""}</span>
        </div>
      </div>

      {/* 코드북 (CA) */}
      {isCA && (
        <div className="rounded-md p-3 mb-3" style={box}>
          <div className="font-semibold mb-1 flex items-center flex-wrap gap-2">Ⓑ 코드북(분석유목)
            {mode === "ca-coding" && <button className="btn btn-sm" onClick={loadCodebook}>유목설계(6단계) 코드북 불러오기</button>}
            {mode === "ca-category" && <button className="btn btn-sm btn-primary" onClick={sendCodebook}>확정 코드북을 본코딩(8단계)으로 보내기 ▶</button>}
            <button className="btn btn-sm" onClick={() => patch({ codebook: [...st.codebook, { name: "", def: "" }] })}>+ 코드 추가</button>
          </div>
          <p className="text-[12px] text-ink-3 mb-2">{mode === "ca-coding" ? (cb.length ? `코드북 기반 코딩 — ${cb.length}개 코드 정의됨(코드북이 곧 프롬프트가 됩니다)` : "모두 비우면 개방코딩 모드로 동작합니다.") : "③에서 생성된 초안을 여기서 다듬어 확정하세요(정의·포함·제외 기준)."}</p>
          <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
            <thead><tr>{["코드명", "정의 / 포함·제외 기준", ""].map((h, i) => <th key={i} className="text-left p-1.5" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>{h}</th>)}</tr></thead>
            <tbody>{st.codebook.map((c, i) => (
              <tr key={i}>
                <td className="p-1" style={{ width: 160 }}><input className="inp text-[12.5px] w-full" value={c.name} placeholder="예: 정서적_지지" onChange={(e) => { const n = [...st.codebook]; n[i] = { ...n[i], name: e.target.value }; patch({ codebook: n }); }} /></td>
                <td className="p-1"><input className="inp text-[12.5px] w-full" value={c.def} placeholder="정의 / 포함: … / 제외: …" onChange={(e) => { const n = [...st.codebook]; n[i] = { ...n[i], def: e.target.value }; patch({ codebook: n }); }} /></td>
                <td className="p-1" style={{ width: 52 }}><button className="btn btn-sm" onClick={() => patch({ codebook: st.codebook.filter((_, j) => j !== i) })}>삭제</button></td>
              </tr>))}</tbody>
          </table>
        </div>
      )}

      {/* 실행 버튼 묶음 — 모드별 */}
      <div className="rounded-md p-3 mb-3" style={box}>
        <div className="font-semibold mb-2">Ⓒ AI 실행 (모든 결과는 초안 — 연구자 검증·확정 필요)</div>
        <div className="flex gap-1.5 flex-wrap">
          {showCoding && <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={() => runCoding(1)}>{mode === "ca-coding" ? "① AI 1차 코딩" : "① 개념·주제 추출(1차)"}</button>}
          {showCoding && <button className="btn btn-sm" disabled={!!busy} onClick={() => runCoding(2)}>{mode === "ca-coding" ? "② AI 2차 코딩(신뢰도 검증)" : "②′ 재실행(일치도 확인)"}</button>}
          {(mode === "ca-category" || mode === "gt-open") && <button className="btn btn-sm" disabled={!!busy} onClick={runCategorize}>② 유사 개념 군집화(범주 후보)</button>}
          {mode === "ca-category" && <button className="btn btn-sm" disabled={!!busy} onClick={runCodebookDraft}>③ 코드북 초안 생성</button>}
          {mode === "gt-open" && <button className="btn btn-sm" disabled={!!busy} onClick={runPropDim}>③ 속성·차원 추출</button>}
          {mode === "gt-open" && <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={sendCatsToAxial}>범주를 축코딩(5단계)으로 보내기 ▶</button>}
          {mode === "gt-axial" && <><button className="btn btn-sm" onClick={loadCatsFromOpen}>개방코딩 범주 불러오기</button>
            <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={runRelations}>① 관계 추출(근거 인용 필수)</button>
            <button className="btn btn-sm" disabled={!!busy} onClick={runParadigm}>② 패러다임 슬롯 배치 초안</button>
            <button className="btn btn-sm btn-primary" onClick={sendAxialToSelective}>검증 결과를 선택코딩(6단계)으로 보내기 ▶</button></>}
          {mode === "gt-selective" && <><button className="btn btn-sm" onClick={loadCatsFromOpen}>개방코딩 범주 불러오기</button>
            <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={runSaturation}>① 포화도 정량 추적</button>
            <button className="btn btn-sm" disabled={!!busy} onClick={runCore}>② 핵심범주 후보(중심성)</button>
            <button className="btn btn-sm" disabled={!!busy} onClick={runStoryline}>③ 스토리라인 초안</button></>}
        </div>
        {busy && <div className="mt-2"><div className="h-2 rounded overflow-hidden" style={{ background: "var(--color-background-primary)" }}><div className="h-full" style={{ width: prog + "%", background: "var(--brand)" }} /></div><div className="text-[12px] text-ink-3 mt-1">처리 중… {prog}%</div></div>}
        {note && <div className="rounded-md p-2 mt-2 text-[12.5px]" style={{ background: note.ok ? "var(--ok-soft)" : "rgba(220,38,38,.08)", color: note.ok ? "var(--ok)" : "var(--danger)" }}>{note.text}</div>}
      </div>

      {/* 신뢰도 + 코딩 결과 표 */}
      {showCoding && Object.keys(st.run1).length > 0 && (
        <div className="rounded-md p-3 mb-3" style={box}>
          <div className="font-semibold mb-1 flex items-center gap-3 flex-wrap">Ⓓ 코딩 결과·신뢰도
            {rel && <span className="text-[12.5px]" style={{ color: rel.k >= 0.8 ? "var(--ok)" : "var(--danger)" }}>단순 일치율 {Math.round(rel.po * 100)}% · Cohen's κ = {rel.k.toFixed(3)} {rel.k >= 0.8 ? "(기준 α≥.80 충족)" : "(기준 미달 — 불일치 재검토·코드북 보완 필요)"}</span>}
            <label className="text-[12px] ml-auto"><input type="checkbox" checked={st.onlyMismatch} onChange={(e) => patch({ onlyMismatch: e.target.checked })} /> 불일치 사례만 보기</label>
          </div>
          <div style={{ maxHeight: 380, overflow: "auto" }}>
            <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
              <thead><tr>{["#", "원문", "1차 코드", "2차 코드", "일치", "최종 확정(연구자)", "근거 인용(1차)"].map((h, i) => <th key={i} className="text-left p-1.5 sticky top-0" style={{ background: "var(--brand)", color: "var(--on-accent)" }}>{h}</th>)}</tr></thead>
              <tbody>{rows.map((u) => {
                const r1 = st.run1[u.id] || { code: "", quote: "", reason: "" }; const r2 = st.run2[u.id];
                const match = r2 ? r1.code === r2.code : null;
                return (<tr key={u.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <td className="p-1.5 align-top">{u.id}{u.id % 10 === 0 && <div className="text-[10px]" style={{ color: "var(--brand-ink)" }}>검수10%</div>}</td>
                  <td className="p-1.5 align-top" style={{ maxWidth: 260 }}>{u.text.slice(0, 110)}</td>
                  <td className="p-1.5 align-top">{r1.code}</td>
                  <td className="p-1.5 align-top">{r2?.code || "-"}</td>
                  <td className="p-1.5 align-top">{match == null ? "-" : <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: match ? "var(--ok-soft)" : "rgba(220,38,38,.10)", color: match ? "var(--ok)" : "var(--danger)" }}>{match ? "일치" : "불일치"}</span>}</td>
                  <td className="p-1.5 align-top">
                    {cb.length ? (
                      <select className="inp text-[12px]" value={st.finalCode[u.id] || ""} onChange={(e) => patch({ finalCode: { ...st.finalCode, [u.id]: e.target.value } })}>
                        <option value="">-- 선택 --</option>{cb.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    ) : <input className="inp text-[12px] w-full" value={st.finalCode[u.id] || ""} onChange={(e) => patch({ finalCode: { ...st.finalCode, [u.id]: e.target.value } })} placeholder="확정 코드/개념명" />}
                  </td>
                  <td className="p-1.5 align-top text-ink-3" style={{ maxWidth: 200, fontStyle: "italic" }}>{r1.quote.slice(0, 60)}</td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* 범주(군집) 카드 */}
      {st.cats.length > 0 && (mode === "ca-category" || mode === "gt-open" || mode === "gt-axial") && (
        <div className="rounded-md p-3 mb-3" style={box}>
          <div className="font-semibold mb-2">Ⓔ 범주 후보 (AI 초안 — 이론적 라벨·경계는 연구자가 확정)</div>
          {st.cats.map((c, i) => (
            <div key={i} className="rounded-md p-2.5 mb-2" style={{ background: "var(--color-background-primary)", borderLeft: "3px solid var(--brand)" }}>
              <input className="inp text-[13px] font-semibold w-full mb-1" value={c.category} onChange={(e) => { const n = [...st.cats]; n[i] = { ...n[i], category: e.target.value }; patch({ cats: n }); }} />
              <div className="text-[12px] text-ink-3">포함 코드: {c.codes.join(", ")}</div>
              <div className="text-[12.5px] mt-0.5">{c.rationale}</div>
            </div>
          ))}
        </div>
      )}

      {/* 속성·차원 */}
      {st.propdims.length > 0 && mode === "gt-open" && (
        <div className="rounded-md p-3 mb-3" style={box}>
          <div className="font-semibold mb-2">Ⓕ 속성·차원 초안(지속적 비교 초벌)</div>
          <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
            <thead><tr>{["범주", "속성(property)", "차원(dimension)"].map((h, i) => <th key={i} className="text-left p-1.5" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>{h}</th>)}</tr></thead>
            <tbody>{st.propdims.map((p, i) => <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}><td className="p-1.5">{p.category}</td><td className="p-1.5">{p.property}</td><td className="p-1.5">{p.dimension}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {/* 관계 + 패러다임 + 네트워크 (축코딩) */}
      {mode === "gt-axial" && (st.relations.length > 0 || Object.keys(st.paradigm).length > 0) && (
        <div className="rounded-md p-3 mb-3" style={box}>
          <div className="font-semibold mb-2">Ⓔ 관계 추출 결과 — 원문 인용이 있는 관계만 채택됨 · ✔=연구자 검증</div>
          {st.relations.length > 0 && (
          <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
            <thead><tr>{["✔", "범주A", "관계 유형", "범주B", "원문 근거(인용)"].map((h, i) => <th key={i} className="text-left p-1.5" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>{h}</th>)}</tr></thead>
            <tbody>{st.relations.map((r, i) => (
              <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td className="p-1.5"><input type="checkbox" checked={r.ok} onChange={(e) => { const n = [...st.relations]; n[i] = { ...n[i], ok: e.target.checked }; patch({ relations: n }); }} /></td>
                <td className="p-1.5">{r.a}</td><td className="p-1.5"><b style={{ color: "var(--brand-ink)" }}>{r.type}</b></td><td className="p-1.5">{r.b}</td>
                <td className="p-1.5 text-ink-3" style={{ fontStyle: "italic" }}>{r.quote.slice(0, 80)}</td>
              </tr>))}</tbody>
          </table>
          )}
          {netSpec && <div className="mt-3"><div className="text-[12px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>범주 관계 네트워크(굵은 선=검증됨) — 억지로 짜맞춘 관계가 없는지 한눈에 검토</div><CaChart spec={netSpec} /></div>}
          {Object.keys(st.paradigm).length > 0 && (
            <div className="mt-3"><div className="text-[12px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>패러다임 모형 슬롯 초안(수정 가능)</div>
              <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
                <tbody>{SLOTS.map((s) => (
                  <tr key={s} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <th className="text-left p-1.5" style={{ width: 150 }}><Gloss text={s} /></th>
                    <td className="p-1"><input className="inp text-[12.5px] w-full" value={st.paradigm[s] || ""} onChange={(e) => patch({ paradigm: { ...st.paradigm, [s]: e.target.value } })} /></td>
                  </tr>))}</tbody>
              </table></div>
          )}
        </div>
      )}

      {/* 포화도 + 핵심범주 + 스토리라인 (선택코딩) */}
      {mode === "gt-selective" && (st.saturation.length > 0 || st.core.length > 0 || st.storyline) && (
        <div className="rounded-md p-3 mb-3" style={box}>
          <div className="font-semibold mb-2">Ⓔ 선택코딩 보조 결과</div>
          {st.saturation.length > 0 && (<div className="mb-3">
            <div className="text-[12px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>이론적 포화 추적 — 배치별 신규 정보 비율(%) · 10% 이하 = 포화 근접 신호</div>
            <CaChart spec={specFromTrend(st.saturation.map((p) => p.label), st.saturation.map((p) => p.ratio), "line", "%")} /></div>)}
          {st.core.length > 0 && (<div className="mb-3">
            <div className="text-[12px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>핵심범주 후보(연결 중심성 순) — 최종 채택·명명은 연구자</div>
            <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
              <thead><tr><th className="text-left p-1.5" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>순위</th><th className="text-left p-1.5" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>범주</th><th className="text-left p-1.5" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>연결 수</th></tr></thead>
              <tbody>{st.core.map((c, i) => <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}><td className="p-1.5">{i + 1}</td><td className="p-1.5">{i === 0 ? <b>{c.name}</b> : c.name}</td><td className="p-1.5">{c.degree}</td></tr>)}</tbody>
            </table></div>)}
          {st.storyline && (<div>
            <div className="text-[12px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>이야기윤곽(story line) 초안</div>
            <pre className="text-[12.5px] whitespace-pre-wrap rounded-md p-2.5" style={{ background: "var(--color-background-primary)" }}>{st.storyline}</pre></div>)}
        </div>
      )}

      {/* 내보내기 */}
      <div className="rounded-md p-3" style={box}>
        <div className="font-semibold mb-2">Ⓖ 엑셀 내보내기 (프롬프트 버전·검증 상태 포함 — 재현가능성 기록)</div>
        <div className="flex gap-2 flex-wrap items-center">
          <input className="inp text-[13px] min-w-[200px]" placeholder="프로젝트명 / 연구자명" value={st.project} onChange={(e) => patch({ project: e.target.value })} />
          <button className="btn btn-sm btn-primary" onClick={doExport}>엑셀 내보내기</button>
        </div>
        <p className="text-[11.5px] text-ink-3 mt-2">AI 코딩 결과는 반드시 초안이며, 최종 코딩 확정과 이론적 해석은 연구자의 판단으로 이루어져야 합니다.</p>
      </div>
    </div>
  );
}
