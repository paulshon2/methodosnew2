/**
 * Survey Engine — AI 기반 설문지 생성기.
 *
 *  1) buildEngineChain(...)       — 자동 연동 체인 산출 (Survey Type → Interpretation)
 *  2) buildProtocolPrompt(...)    — 표준 프로토콜 기반 프롬프트
 *  3) generateSurveyAi(...)       — AI 호출 → SurveyQuestion[] 생성 (폴백: 패턴기반)
 *  4) generateFromPatterns(...)   — 패턴 라이브러리로 결정적 생성
 *  5) parseImportedRows(...)      — 엑셀/텍스트에서 문항 불러오기
 *  6) toCsv(...)                  — 결과 CSV 내보내기
 */
import { aiComplete } from "./engine";
import {
  QUESTION_TYPES,
  SCALES,
  SURVEY_MODES,
  SAMPLING,
  BIASES,
  ANALYSES,
  STANDARD_PROTOCOL,
  ENGINE_CHAIN,
  PATTERN_LIBRARY,
  AUTO_CHAINS,
  type QuestionPattern,
} from "./srm-taxonomy";

export type SurveyQuestion = {
  no: number;
  section: string;
  typeId: string;      // QUESTION_TYPES.id
  typeLabel: string;
  scaleId: string;     // SCALES.id
  scaleLabel: string;
  points: number;      // Likert 3/5/7 등
  stem: string;
  responses: string;
  patternId?: string;  // PATTERN_LIBRARY.id (있으면)
  branchingFrom?: string;
  srm: string;         // internal taxonomy headword (not shown in UI)
};

export type SurveyPlan = {
  title: string;
  purpose: string;
  respondent: string;
  modeId: string;
  samplingId: string;
  analysisId: string;
  count: number;
  points: number;      // 기본 Likert 점수
  topic: string;
  biasChecks: string[];
  // v47 expanded fields
  researchQuestions?: string;
  population?: string;
  inclusion?: string;
  geography?: string;
  timeframe?: string;
  constructs?: string;
  hypothesis?: string;
  incentive?: string;
  language?: string;
  notes?: string;
};

export type EngineChainResult = {
  steps: { stage: string; value: string; srm: string }[];
  summary: string;
};

/* ────────────────── 1) Engine Chain ────────────────── */
export function buildEngineChain(plan: SurveyPlan): EngineChainResult {
  const mode = SURVEY_MODES.find((m) => m.id === plan.modeId);
  const samp = SAMPLING.find((s) => s.id === plan.samplingId);
  const ana = ANALYSES.find((a) => a.id === plan.analysisId);
  const steps = [
    { stage: "Survey Type", value: plan.title, srm: "Survey" },
    { stage: "Research Purpose", value: plan.purpose, srm: "Research Question" },
    { stage: "Respondent", value: plan.respondent, srm: "Target Population" },
    { stage: "Sampling", value: samp ? `${samp.label} (${samp.labelEn})` : "-", srm: samp?.srm || "Sampling" },
    { stage: "Question Pattern", value: `${plan.count}문항 · Likert ${plan.points}점 기반`, srm: "Question Wording" },
    { stage: "Scale", value: `${plan.points}-point Likert + 보조 척도`, srm: "Likert Scale" },
    { stage: "Branching", value: "필터→상세 조건분기 자동 삽입", srm: "Branching / Skip Pattern" },
    { stage: "Quality Check", value: plan.biasChecks.join(", ") || "표준 오차 점검", srm: "Total Survey Error" },
    { stage: "Pilot Test", value: "n=20 사전조사(문항 이해도·응답시간)", srm: "Pretest / Pilot Test" },
    { stage: "Statistical Recommendation", value: ana ? `${ana.label} (${ana.labelEn})` : "기술통계+신뢰도", srm: ana?.srm || "Data Analysis" },
    { stage: "Visualization", value: "빈도표·평균±SD·요인부하도표", srm: "Data Visualization" },
    { stage: "Interpretation", value: "요인·신뢰도·차이검정 → 시사점", srm: "Survey Report" },
  ];
  const summary = ENGINE_CHAIN.join(" → ");
  return { steps, summary };
}

/* ────────────────── 2) 표준 프로토콜 프롬프트 ────────────────── */
export function buildProtocolPrompt(plan: SurveyPlan): string {
  const protocolList = STANDARD_PROTOCOL.map((s, i) => `${i + 1}. ${s.label} — ${s.desc}`).join("\n");
  const typeList = QUESTION_TYPES.map((t) => `${t.label}(${t.labelEn})`).join(", ");
  const scaleList = SCALES.slice(0, 6).map((s) => s.label).join(", ");
  const biasList = plan.biasChecks
    .map((id) => BIASES.find((b) => b.id === id))
    .filter(Boolean)
    .map((b) => `${b!.label}`)
    .join(", ") || "표준 오차 점검";

  return `당신은 설문조사 문항 작성 전문가다.
아래 표준 프로토콜과 사용자가 기입한 제목·주제·연구목적·응답자 맥락을 반드시 반영해 설문지를 설계하라.
절대 '본 서비스'처럼 맥락 없는 일반 문구를 쓰지 마라. 모든 stem은 주제·목적·응답자에 맞게 구체화하라.

[표준 프로토콜]
${protocolList}

[설문 기본정보]
- 제목: ${plan.title}
- 주제(핵심 대상/현상): ${plan.topic || plan.title}
- 연구목적: ${plan.purpose}
- 연구문제: ${plan.researchQuestions || "(미기입)"}
- 응답자: ${plan.respondent}
- 모집단/표적: ${plan.population || plan.respondent}
- 포함기준: ${plan.inclusion || "(미기입)"}
- 지역: ${plan.geography || "(미기입)"}
- 조사시점: ${plan.timeframe || "(미기입)"}
- 구성개념/변수: ${plan.constructs || "(미기입)"}
- 가설: ${plan.hypothesis || "(미기입)"}
- 조사방식: ${SURVEY_MODES.find((m) => m.id === plan.modeId)?.label || plan.modeId}
- 표집: ${SAMPLING.find((s) => s.id === plan.samplingId)?.label || plan.samplingId}
- 권장분석: ${ANALYSES.find((a) => a.id === plan.analysisId)?.label || plan.analysisId}
- 문항 수: ${plan.count}
- 기본 Likert 점수: ${plan.points}
- 인센티브: ${plan.incentive || "(없음)"}
- 언어: ${plan.language || "한국어"}
- 메모: ${plan.notes || ""}
- 오차 점검: ${biasList}

[사용 가능 문항 유형] ${typeList}
[사용 가능 척도] ${scaleList}

[출력 형식] JSON 배열, 항목당 다음 키:
- no (정수, 1부터)
- section (문자열: 예 "인구통계", "태도", "행동", "지식", "만족도" 등)
- typeId (다음 중 하나: ${QUESTION_TYPES.map((t) => t.id).join(" / ")})
- typeLabel (한국어 라벨)
- scaleId (다음 중 하나: ${SCALES.map((s) => s.id).join(" / ")})
- scaleLabel (한국어 라벨)
- points (정수, Likert의 경우 3/5/7 등, 아니면 0)
- stem (문항 어간·한국어)
- responses (응답 범주 설명)

문항은 ${plan.count}개. stem마다 '${plan.topic || plan.title}' 맥락과 연구목적·응답자 표현을 반영하라.
인구통계 3–5개를 후반부에 배치하고, 초두·최신 편향을 피하도록 순서를 다양화하며,
분기(branching)가 필요한 지점에는 typeId="branching"으로 명시하라.
반드시 유효한 JSON 배열만 출력하고 다른 텍스트는 넣지 마라.`;
}

/* ────────────────── 3) AI 생성 (실패시 폴백) ────────────────── */
export async function generateSurveyAi(
  plan: SurveyPlan,
  settings: any
): Promise<{ items: SurveyQuestion[]; simulated: boolean; source: "ai" | "pattern" }> {
  const prompt = buildProtocolPrompt(plan);
  const raw = await aiComplete(prompt, settings);
  if (raw) {
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      // JSON 배열 첫 발생 위치까지 트리밍
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      if (start >= 0 && end > start) {
        const arr = JSON.parse(cleaned.slice(start, end + 1));
        if (Array.isArray(arr) && arr.length > 0) {
          const items = arr.map((x: any, i: number) => normalizeItem(x, i));
          return { items, simulated: false, source: "ai" };
        }
      }
    } catch {
      /* fall through */
    }
  }
  return { items: generateFromPatterns(plan), simulated: true, source: "pattern" };
}

function normalizeItem(x: any, i: number): SurveyQuestion {
  const typeId = String(x.typeId || "likert");
  const scaleId = String(x.scaleId || "likert_scale");
  const t = QUESTION_TYPES.find((v) => v.id === typeId);
  const s = SCALES.find((v) => v.id === scaleId);
  return {
    no: Number(x.no || i + 1),
    section: String(x.section || "본문항"),
    typeId,
    typeLabel: String(x.typeLabel || t?.label || "평정척도(등간형)"),
    scaleId,
    scaleLabel: String(x.scaleLabel || s?.label || "평정척도(등간형) 척도"),
    points: Number(x.points || 5),
    stem: String(x.stem || ""),
    responses: String(x.responses || ""),
    patternId: x.patternId ? String(x.patternId) : undefined,
    branchingFrom: x.branchingFrom ? String(x.branchingFrom) : undefined,
    srm: String(x.srm || t?.srm || "Survey Research"),
  };
}


/* ────────────────── Topic contextualization (v47) ────────────────── */
export function resolveTopic(plan: SurveyPlan): string {
  const t = (plan.topic || "").trim();
  if (t && t !== "본 서비스" && t !== "본서비스") return t;
  const title = (plan.title || "").trim();
  if (title) return title;
  return "조사 주제";
}

export function contextualizeStem(plan: SurveyPlan, stemTemplate: string, points: number): string {
  const topic = resolveTopic(plan);
  let stem = stemTemplate
    .replace(/\{t\}/g, topic)
    .replace(/\{p\}/g, String(points))
    .replace(/본\s*서비스/g, topic);
  // Weave purpose/respondent lightly for attitude-like stems
  const purpose = (plan.purpose || "").trim();
  const who = (plan.respondent || "").trim();
  if (purpose && /만족|동의|중요|추천|신뢰|평가/.test(stem) && !stem.includes(purpose.slice(0, 8))) {
    // keep stem clean; purpose already drives topic selection
  }
  if (who && stem.startsWith("귀하는") && !stem.includes(who) && who.length <= 20) {
    stem = stem.replace("귀하는", `귀하(${who})는`);
  }
  return stem;
}

/* ────────────────── 4) 패턴 기반 결정적 생성 (폴백) ────────────────── */
export function generateFromPatterns(plan: SurveyPlan): SurveyQuestion[] {
  const items: SurveyQuestion[] = [];
  const topic = resolveTopic(plan);
  // 섹션 구성: 인구통계 4 + 지식 2 + 태도(평정척도(등간형)) N + 행동 3 + 개방형 2 + 분기 1
  const demog = PATTERN_LIBRARY.filter((p) => p.typeId === "demographic").slice(0, 4);
  const know = PATTERN_LIBRARY.filter((p) => p.typeId === "knowledge").slice(0, 2);
  const attit = PATTERN_LIBRARY.filter((p) => p.typeId === "likert");
  const behav = PATTERN_LIBRARY.filter((p) => p.typeId === "behavioral").slice(0, 3);
  const open = PATTERN_LIBRARY.filter((p) => p.typeId === "open_ended").slice(0, 2);
  const branch = PATTERN_LIBRARY.filter((p) => p.typeId === "branching").slice(0, 1);

  const fixed = [
    ...know.map((p) => ({ p, section: "지식" })),
    ...behav.map((p) => ({ p, section: "행동" })),
    ...branch.map((p) => ({ p, section: "분기" })),
    ...open.map((p) => ({ p, section: "개방형" })),
    ...demog.map((p) => ({ p, section: "인구통계" })),
  ];
  const attitudeNeeded = Math.max(plan.count - fixed.length, Math.floor(plan.count * 0.4));
  const attitudeExpanded: { p: QuestionPattern; section: string }[] = [];
  for (let i = 0; i < attitudeNeeded; i++) {
    attitudeExpanded.push({ p: attit[i % attit.length], section: "태도" });
  }
  const combined = [...attitudeExpanded, ...fixed].slice(0, plan.count);

  combined.forEach((c, i) => {
    const p = c.p;
    const t = QUESTION_TYPES.find((v) => v.id === p.typeId)!;
    // Scale 매핑
    let scaleId = "likert_scale";
    if (p.typeId === "closed_ended" || p.typeId === "knowledge" || p.typeId === "demographic" || p.typeId === "branching") scaleId = "nominal";
    else if (p.typeId === "ranking") scaleId = "ordinal";
    else if (p.typeId === "semantic_differential") scaleId = "semantic_diff_scale";
    else if (p.typeId === "open_ended") scaleId = "nominal";
    else if (p.typeId === "rating") scaleId = "ordinal";
    const s = SCALES.find((v) => v.id === scaleId)!;
    const stem = contextualizeStem(plan, p.stem, plan.points);
    const responses = p.responses.replace(/\{p\}/g, String(plan.points));
    items.push({
      no: i + 1,
      section: c.section,
      typeId: p.typeId,
      typeLabel: t.label,
      scaleId,
      scaleLabel: s.label,
      points: p.typeId === "likert" ? plan.points : 0,
      stem,
      responses,
      patternId: p.id,
      srm: p.srm,
    });
  });
  return items;
}

/* ────────────────── 5) 불러오기 (엑셀·텍스트) ────────────────── */
/** 2차원 배열(엑셀 시트 파싱 결과)에서 SurveyQuestion[] 로 변환 */
export function parseImportedRows(rows: any[][]): SurveyQuestion[] {
  if (!rows || rows.length === 0) return [];
  const header = (rows[0] || []).map((h: any) => String(h || "").trim().toLowerCase());
  const idxOf = (candidates: string[]) => header.findIndex((h) => candidates.some((c) => h.includes(c)));
  const iNo = idxOf(["no", "번호", "#"]);
  const iSection = idxOf(["section", "섹션", "구분"]);
  const iType = idxOf(["type", "유형"]);
  const iScale = idxOf(["scale", "척도"]);
  const iPts = idxOf(["point", "점수"]);
  const iStem = idxOf(["stem", "문항", "질문", "question"]);
  const iResp = idxOf(["response", "응답", "보기"]);
  const items: SurveyQuestion[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const stem = String((iStem >= 0 ? row[iStem] : row[0]) || "").trim();
    if (!stem) continue;
    const typeLabel = String((iType >= 0 ? row[iType] : "") || "").trim() || "평정척도(등간형)";
    const t = QUESTION_TYPES.find((v) => v.label === typeLabel || v.labelEn.toLowerCase() === typeLabel.toLowerCase() || v.id === typeLabel) || QUESTION_TYPES.find((v) => v.id === "likert")!;
    const scaleLabel = String((iScale >= 0 ? row[iScale] : "") || "").trim() || "평정척도(등간형) 척도";
    const s = SCALES.find((v) => v.label === scaleLabel || v.labelEn.toLowerCase() === scaleLabel.toLowerCase() || v.id === scaleLabel) || SCALES.find((v) => v.id === "likert_scale")!;
    items.push({
      no: Number((iNo >= 0 ? row[iNo] : items.length + 1)) || items.length + 1,
      section: String((iSection >= 0 ? row[iSection] : "본문항") || "본문항"),
      typeId: t.id, typeLabel: t.label,
      scaleId: s.id, scaleLabel: s.label,
      points: Number((iPts >= 0 ? row[iPts] : 0)) || 0,
      stem,
      responses: String((iResp >= 0 ? row[iResp] : "") || ""),
      srm: t.srm,
    });
  }
  return items;
}

/** 텍스트(줄바꿈 구분) → SurveyQuestion[] */
export function parseImportedText(text: string): SurveyQuestion[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((line, i) => {
    // "1. 문항 [type=likert; scale=likert_scale; points=5; resp=1~5]" 형태 지원
    const meta: Record<string, string> = {};
    const bracket = line.match(/\[(.+?)\]\s*$/);
    let stem = line.replace(/^\d+[.)]\s*/, "");
    if (bracket) {
      stem = stem.replace(/\[(.+?)\]\s*$/, "").trim();
      bracket[1].split(";").forEach((kv) => {
        const [k, v] = kv.split("=").map((s) => s.trim());
        if (k) meta[k.toLowerCase()] = v || "";
      });
    }
    const typeId = meta.type || "likert";
    const scaleId = meta.scale || "likert_scale";
    const t = QUESTION_TYPES.find((v) => v.id === typeId) || QUESTION_TYPES[0];
    const s = SCALES.find((v) => v.id === scaleId) || SCALES[0];
    return {
      no: i + 1, section: meta.section || "본문항",
      typeId: t.id, typeLabel: t.label,
      scaleId: s.id, scaleLabel: s.label,
      points: Number(meta.points || 0),
      stem, responses: meta.resp || meta.responses || "",
      srm: t.srm,
    };
  });
}

/* ────────────────── 6) 내보내기 ────────────────── */
export function toCsv(items: SurveyQuestion[]): string {
  const header = ["no", "section", "typeId", "typeLabel", "scaleId", "scaleLabel", "points", "stem", "responses", "srm"];
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((it) => header.map((h) => esc((it as any)[h])).join(","));
  return "\ufeff" + [header.join(","), ...rows].join("\n");
}

export function toRows(items: SurveyQuestion[]): any[][] {
  const header = ["no", "section", "typeId", "typeLabel", "scaleId", "scaleLabel", "points", "stem", "responses", "srm"];
  return [header, ...items.map((it) => header.map((h) => (it as any)[h] ?? ""))];
}

/* auto chain helper */
export function findAutoChain(query: string) {
  const q = (query || "").toLowerCase();
  return AUTO_CHAINS.find((c) => q.includes(c.key) || q.includes(c.label.toLowerCase())) || null;
}
