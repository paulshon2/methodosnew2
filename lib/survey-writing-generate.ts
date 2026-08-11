import type { AiSurveyForm, ContentTypeId, ScaleTypeId, SurveyItem, SurveyProtocol } from "./survey-writing-spec";
import { CONTENT_TYPE_LABEL, SCALE_LABEL } from "./survey-writing-spec";
import { aiComplete } from "./engine";

const TYPE_TEMPLATES: Record<string, { stem: string; scale: string; scaleType: ScaleTypeId }[]> = {
  attitude: [
    { stem: "귀하는 '{t}'에 대해 얼마나 동의 또는 반대하십니까?", scale: "1=매우 반대 … {p}=매우 동의", scaleType: "ordinal" },
    { stem: "'{t}'이(가) 귀하의 일상·업무에 도움이 된다고 생각하십니까?", scale: "1=전혀 그렇지 않다 … {p}=매우 그렇다", scaleType: "ordinal" },
    { stem: "'{t}' 관련 정책·제도 확대에 대해 어떻게 생각하십니까?", scale: "1=매우 반대 … {p}=매우 찬성", scaleType: "ordinal" },
    { stem: "'{t}'에 대한 전반적 만족도는 어느 정도입니까?", scale: "1=매우 불만족 … {p}=매우 만족", scaleType: "ordinal" },
    { stem: "'{t}'을(를) 주변에 추천할 의향이 있습니까?", scale: "1=전혀 없다 … {p}=매우 있다", scaleType: "ordinal" },
    { stem: "'{t}'의 신뢰성에 대해 어떻게 평가하십니까?", scale: "1=매우 낮음 … {p}=매우 높음", scaleType: "ordinal" },
    { stem: "'{t}'이(가) 공정하다고 느끼십니까?", scale: "1=전혀 그렇지 않다 … {p}=매우 그렇다", scaleType: "ordinal" },
  ],
  knowledge: [
    { stem: "'{t}'의 핵심 목적을 알고 계십니까?", scale: "1=안다 2=모른다 3=잘 모르겠다", scaleType: "nominal" },
    { stem: "'{t}' 관련 공식 안내 채널을 알고 계십니까?", scale: "예/아니오/모름", scaleType: "nominal" },
    { stem: "'{t}' 이용(참여) 가능 대상에 본인이 포함되는지 알고 계십니까?", scale: "예/아니오/모름", scaleType: "nominal" },
    { stem: "'{t}'의 주요 제공 주체는 누구라고 알고 계십니까?", scale: "개방형 / 모름=99", scaleType: "nominal" },
    { stem: "다음 중 '{t}'에서 제공하는 항목을 알고 있는 것은?(항목별 예/아니오)", scale: "항목별 예·아니오", scaleType: "nominal" },
    { stem: "'{t}' 관련 신청·이용 절차의 첫 단계를 알고 계십니까?", scale: "안다/모른다/모름", scaleType: "nominal" },
  ],
  performance: [
    { stem: "지난 한 달간 '{t}'을(를) 이용해 본 적이 있습니까?", scale: "예/아니오", scaleType: "nominal" },
    { stem: "지난 한 달간 '{t}' 이용 횟수는?", scale: "0/1/2-3/4회 이상", scaleType: "ordinal" },
    { stem: "'{t}' 이용 시 목표한 과업을 완료하셨습니까?", scale: "예/아니오/해당없음", scaleType: "nominal" },
    { stem: "'{t}' 이용 중 문제 해결까지 걸린 시간은?", scale: "즉시/1일 이내/2-3일/그 이상/해당없음", scaleType: "ordinal" },
    { stem: "'{t}' 관련 안내를 실제로 읽고 따랐습니까?", scale: "예/아니오", scaleType: "nominal" },
    { stem: "지난 한 달간 '{t}'로 달성한 구체적 성과가 있습니까?", scale: "예/아니오", scaleType: "nominal" },
  ],
  psychographic: [
    { stem: "나는 새로운 '{t}' 관련 시도를 남들보다 먼저 해보는 편이다.", scale: "1=전혀 그렇지 않다 … {p}=매우 그렇다", scaleType: "ordinal" },
    { stem: "나는 '{t}'이(가) 나의 가치관과 잘 맞는다고 느낀다.", scale: "1 … {p}", scaleType: "ordinal" },
    { stem: "나는 여가·학습 시간에 '{t}'을(를) 우선적으로 고려한다.", scale: "1 … {p}", scaleType: "ordinal" },
    { stem: "나는 '{t}'에 대해 주변과 자주 이야기하는 편이다.", scale: "1 … {p}", scaleType: "ordinal" },
    { stem: "나는 디지털·제도 변화가 삶의 질을 높인다고 믿는다.", scale: "1 … {p}", scaleType: "ordinal" },
    { stem: "나는 새로운 정보를 스스로 찾아보는 편이다.", scale: "1 … {p}", scaleType: "ordinal" },
  ],
  demographic: [
    { stem: "귀하의 연령대는?", scale: "18-29/30-39/40-49/50-59/60세 이상", scaleType: "ordinal" },
    { stem: "귀하의 성별은?", scale: "남성/여성/기타/응답거부", scaleType: "nominal" },
    { stem: "최종 학력은?", scale: "고졸 이하/전문대/대졸/대학원 이상", scaleType: "ordinal" },
    { stem: "거주 지역 유형은?", scale: "대도시/중소도시/읍면", scaleType: "nominal" },
    { stem: "가구 월평균 소득 구간은?", scale: "200만 미만/200-399/400-599/600만 이상/응답거부", scaleType: "ordinal" },
    { stem: "현재 직업(경제활동) 상태는?", scale: "취업/학업/구직/기타/응답거부", scaleType: "nominal" },
  ],
  self_administered: [
    { stem: "[지시] 아래 문항은 해당하는 칸에 ○ 하세요. 한 문항씩 순서대로 응답해 주세요.", scale: "(항해 안내)", scaleType: "nominal" },
    { stem: "지난 7일간 '{t}' 관련 활동을 한 날은 며칠입니까?", scale: "___일", scaleType: "ratio" },
    { stem: "(형식 전환) 이제 예/아니오로 답하세요. '{t}' 관련 알림·안내 수신에 동의하셨습니까?", scale: "예/아니오", scaleType: "nominal" },
    { stem: "'{t}'에 대한 추가 의견이 있으면 적어 주세요.", scale: "개방형", scaleType: "nominal" },
    { stem: "응답 중 이해가 어려웠던 문항이 있었습니까?", scale: "예/아니오", scaleType: "nominal" },
  ],
  nonsensitive_behavior: [
    { stem: "지난 7일간 '{t}' 관련 정보를 검색한 적이 있습니까?", scale: "예/아니오", scaleType: "nominal" },
    { stem: "지난 한 달간 '{t}'에 들인 대략적 시간은?", scale: "0/30분 미만/30-119분/2시간 이상", scaleType: "ordinal" },
    { stem: "지난 한 달간 '{t}' 관련 자료를 저장·북마크한 적이 있습니까?", scale: "예/아니오", scaleType: "nominal" },
    { stem: "지난 한 달간 '{t}'에 대해 다른 사람과 이야기한 횟수는?", scale: "0/1/2-3/4회 이상", scaleType: "ordinal" },
  ],
  sensitive_behavior: [
    { stem: "가장 신중한 사람도 가끔 규칙을 어길 때가 있습니다. 지난 1년간 '{t}' 관련 규정을 지키지 못한 적이 있습니까?", scale: "예/아니오/해당없음", scaleType: "nominal" },
    { stem: "많은 사람들이 바쁠 때 안내를 건너뛰곤 합니다. 귀하는 '{t}' 안내를 읽지 않고 진행한 적이 있습니까?", scale: "예/아니오", scaleType: "nominal" },
  ],
};

const CODING_HINT: Record<ScaleTypeId, string> = {
  nominal: "범주형 코드(1,2,3…) · 빈도·카이제곱",
  ordinal: "순위 코드(1~k) · 중앙값·순위검정",
  interval: "등간 점수 · 평균·상관·회귀",
  ratio: "절대영점 실측값 · 모든 통계",
};

function fill(stem: string, topic: string, points: number) {
  return stem.replace(/\{t\}/g, topic).replace(/\{p\}/g, String(points));
}

function ssLinkFor(scaleType: ScaleTypeId, protocol: SurveyProtocol) {
  const scale = protocol.measurementScales.find((s) => s.id === scaleType);
  const link = scale?.ssLinks?.[0];
  return { ssPhase: link?.phase || "descriptive", ssTech: link?.name || "빈도분석" };
}

/** 규칙 기반 생성(최소 문항 수 보장). AI 실패 시 폴백. */
export function generateSurveyItemsRule(form: AiSurveyForm, protocol: SurveyProtocol): SurveyItem[] {
  const topic = form.topic.trim() || "연구 주제";
  const points = form.likertPoints === 7 ? 7 : 5;
  let types = [...form.types];
  if (form.includeSensitive && !types.includes("sensitive_behavior")) types.push("sensitive_behavior");
  if (!types.includes("nonsensitive_behavior")) types.push("nonsensitive_behavior");
  if (!types.length) types = ["attitude", "knowledge", "performance", "psychographic", "demographic", "self_administered"];

  const pool: { type: string; stem: string; scale: string; scaleType: ScaleTypeId }[] = [];
  for (const t of types) {
    const temps = TYPE_TEMPLATES[t] || [];
    for (const x of temps) {
      pool.push({
        type: t,
        stem: fill(x.stem, topic, points),
        scale: fill(x.scale, topic, points),
        scaleType: x.scaleType,
      });
    }
  }

  // 주제 특화 변형으로 30+ 확보
  const variants = [
    "전반적으로",
    "최근 경험을 기준으로",
    "동료·가족과 비교할 때",
    "비용·시간을 고려할 때",
    "장기적으로",
  ];
  const min = Math.max(30, form.minItems || 30);
  const items: SurveyItem[] = [];
  let i = 0;
  while (items.length < min) {
    const base = pool[i % pool.length];
    const v = variants[Math.floor(i / pool.length) % variants.length];
    const stem =
      i < pool.length
        ? base.stem
        : base.type === "demographic" || base.type === "self_administered"
          ? base.stem
          : `${v}, ${base.stem.replace(/\?$/, "")}?`;
    const link = ssLinkFor(base.scaleType, protocol);
    items.push({
      no: items.length + 1,
      code: `Q${String(items.length + 1).padStart(2, "0")}`,
      type: base.type,
      stem,
      responseScale: base.scale,
      scaleType: base.scaleType,
      codingHint: CODING_HINT[base.scaleType],
      codingMap: buildCodingMap(base.scale, base.scaleType),
      ...link,
      note: `${CONTENT_TYPE_LABEL[base.type] || base.type} · ${SCALE_LABEL[base.scaleType].ko}`,
    });
    i += 1;
    if (i > min * 3) break;
  }
  return items;
}

export function buildCodingMap(scale: string, scaleType: ScaleTypeId): string {
  if (scaleType === "ratio" && /___|일|횟수|권/.test(scale)) return "실측값 그대로 (0,1,2…)";
  if (/예\s*\/\s*아니오/.test(scale) || scale.includes("예/아니오")) return "1=예, 2=아니오" + (scale.includes("모름") || scale.includes("해당없음") ? ", 3=기타/모름/해당없음" : "");
  if (scale.includes("안다") && scale.includes("모른다")) return "1=안다, 2=모른다, 3=잘 모르겠다";
  const parts = scale.split(/[\/…~]|1=/).map((s) => s.trim()).filter(Boolean);
  if (scaleType === "ordinal" || scaleType === "interval") {
    const m = scale.match(/1\s*=\s*([^.…]+)[\s.…]*(\d+)\s*=\s*([^\s]+)/);
    if (m) return `1=${m[1].trim()} … ${m[2]}=${m[3].trim()}`;
    const cats = scale.split("/").map((s) => s.trim()).filter(Boolean);
    if (cats.length >= 2) return cats.map((c, idx) => `${idx + 1}=${c}`).join(", ");
  }
  if (scaleType === "nominal") {
    const cats = scale.split("/").map((s) => s.trim()).filter(Boolean);
    if (cats.length >= 2) return cats.map((c, idx) => `${idx + 1}=${c}`).join(", ");
  }
  return parts.slice(0, 6).join(" | ") || scale;
}

export function buildAiPrompt(form: AiSurveyForm, protocol: SurveyProtocol): string {
  const typeNames = form.types.map((t) => CONTENT_TYPE_LABEL[t] || t).join(", ");
  const sheet = (key: string) => protocol.sheets?.[key]?.rows || [];
  const take = (rows: Record<string, string>[], n: number, cols: string[]) =>
    rows.slice(0, n).map((r) => "- " + cols.map((c) => `${c}:${String(r[c] || "").replace(/\s+/g, " ").slice(0, 120)}`).join(" | ")).join("\n");

  const modeDims = take(sheet("modeDimensions"), 5, ["차원", "문항설계 시사점"]);
  const typeProto = take(sheet("typeWriteProtocols"), 8, ["조사유형", "표준 프로토콜(권장)", "피해야 할 오류"]);
  const unimode = take(sheet("unimodePrinciples"), 6, ["원칙", "표준 패턴"]);
  const errorRules = take(sheet("errorPatterns"), 10, ["원칙명", "설명"]);
  const contentProto = take(sheet("contentProtocols"), 8, ["문항 내용유형", "작성 지침"]);
  const stages = (protocol.stages || []).slice(0, 11).map((s) => `${s.order}. ${s.name}: ${s.goal || ""}`).join("\n");

  return `당신은 설문조사 문항 표준프로토콜(Groves·Bradburn·Brace·Dillman, MethodOS 다음1·다음2)에 따라 문항을 작성하는 연구 조수입니다.

[다음1 · 11단계 절차]
${stages || "(단계 정보 없음)"}

주제: ${form.topic}
연구질문: ${form.researchQuestion}
모집단: ${form.population}
조사방식(Mode): ${form.mode}
언어수준: ${form.language}
포함할 유형: ${typeNames}
최소 문항 수: ${Math.max(30, form.minItems)} (반드시 이상)
Likert 점수: ${form.likertPoints}
민감행동 포함: ${form.includeSensitive ? "예" : "아니오"}
추가노트: ${form.notes || "(없음)"}

[다음2 · 조사방식 핵심 차원 시사점]
${modeDims || "- 면접원 없으면 문장만으로 뜻이 통해야 함"}

[다음2 · 유형별 작성 프로토콜]
${typeProto || "- 방식에 맞게 어간·범주 작성"}

[다음2 · 유니모드 원칙]
${unimode || "- 모드 간 범주·어간 동일"}

[다음2 · 내용유형 지침]
${contentProto || "- 태도/지식/행동 지침 준수"}

[다음2 · 오류 패턴 회피]
${errorRules || "- 이중질문 금지, 쉬운 단어, 상호배타 범주, check-all 지양, 5~7점 전점 라벨"}

필수:
- 조사방식(${form.mode})에 맞는 어간·범주·지시문
- 이중질문·모호한 정도부사·check-all-that-apply 금지
- 완성된 한국어 문항 ${Math.max(30, form.minItems)}개 이상, 유형별 고르게

출력 형식(JSON 배열만, 설명 금지):
[{"code":"Q01","type":"attitude","stem":"...","responseScale":"...","scaleType":"ordinal"}]
type은 attitude|knowledge|performance|psychographic|demographic|self_administered|nonsensitive_behavior|sensitive_behavior
scaleType은 nominal|ordinal|interval|ratio`;
}

export async function generateSurveyItemsAi(
  form: AiSurveyForm,
  protocol: SurveyProtocol,
  settings: unknown,
): Promise<{ items: SurveyItem[]; source: "ai" | "rule"; log: string }> {
  const prompt = buildAiPrompt(form, protocol);
  const text = await aiComplete(prompt, settings);
  if (text) {
    try {
      const m = text.match(/\[[\s\S]*\]/);
      if (m) {
        const arr = JSON.parse(m[0]) as Partial<SurveyItem>[];
        if (Array.isArray(arr) && arr.length >= 20) {
          const items = arr.map((raw, idx) => {
            const scaleType = (raw.scaleType || "ordinal") as ScaleTypeId;
            const link = ssLinkFor(scaleType, protocol);
            return {
              no: idx + 1,
              code: raw.code || `Q${String(idx + 1).padStart(2, "0")}`,
              type: (raw.type || "attitude") as ContentTypeId,
              stem: String(raw.stem || ""),
              responseScale: String(raw.responseScale || ""),
              scaleType,
              codingHint: CODING_HINT[scaleType] || "",
              codingMap: buildCodingMap(String(raw.responseScale || ""), scaleType),
              ...link,
              note: CONTENT_TYPE_LABEL[String(raw.type)] || String(raw.type),
            } as SurveyItem;
          }).filter((x) => x.stem);
          if (items.length >= 30) {
            return { items, source: "ai", log: `AI 생성 ${items.length}문항` };
          }
          // pad with rule
          const pad = generateSurveyItemsRule({ ...form, minItems: 30 }, protocol);
          const merged = [...items];
          for (const p of pad) {
            if (merged.length >= Math.max(30, form.minItems)) break;
            if (!merged.some((x) => x.stem === p.stem)) merged.push({ ...p, no: merged.length + 1, code: `Q${String(merged.length + 1).padStart(2, "0")}` });
          }
          return { items: merged, source: "ai", log: `AI ${items.length}문항 + 규칙 보완 → ${merged.length}문항` };
        }
      }
    } catch {
      /* fallthrough */
    }
  }
  const items = generateSurveyItemsRule(form, protocol);
  return { items, source: "rule", log: "AI 키 없거나 파싱 실패 → 표준프로토콜 규칙 기반 생성" };
}

export function itemsToCsv(items: SurveyItem[]): string {
  const headers = ["no", "code", "type", "stem", "responseScale", "scaleType", "codingMap", "ssPhase", "ssTech"];
  const rows = items.map((it) =>
    [it.no, it.code, it.type, `"${(it.stem || "").replace(/"/g, '""')}"`, `"${(it.responseScale || "").replace(/"/g, '""')}"`, it.scaleType, `"${(it.codingMap || "").replace(/"/g, '""')}"`, it.ssPhase || "", it.ssTech || ""].join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function itemsToCodingTable(items: SurveyItem[]): string {
  const headers = ["변수명", "문항", "척도유형(한)", "척도유형(영)", "코딩", "가능통계", "SS통계연동"];
  const rows = items.map((it) => {
    const id = (it.scaleType || "ordinal") as ScaleTypeId;
    const lab = SCALE_LABEL[id] || { ko: id, en: id };
    const stats =
      id === "nominal" ? "빈도,비율,최빈값,카이제곱"
        : id === "ordinal" ? "중앙값,순위검정"
          : id === "interval" ? "평균,SD,상관,회귀"
            : "모든 통계";
    return [
      it.code,
      `"${(it.stem || "").replace(/"/g, '""')}"`,
      lab.ko,
      lab.en,
      `"${(it.codingMap || it.codingHint || "").replace(/"/g, '""')}"`,
      stats,
      `${it.ssPhase || ""}/${it.ssTech || ""}`,
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}
