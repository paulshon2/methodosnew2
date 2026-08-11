import type { ScaleTypeId, SurveyItem, SurveyProtocol } from "./survey-writing-spec";
import { CONTENT_TYPE_LABEL, SCALE_LABEL } from "./survey-writing-spec";
import { buildCodingMap } from "./survey-writing-generate";

export interface ExcelIssue {
  row: number;
  stem: string;
  severity: "error" | "warn" | "info";
  rule: string;
  problem: string;
  suggestion: string;
  cognitiveStage?: string;
}

export interface ExcelAnalysisResult {
  total: number;
  issues: ExcelIssue[];
  summary: { error: number; warn: number; info: number };
  inferredItems: SurveyItem[];
}

function cell(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
  }
  // fuzzy
  for (const [k, v] of Object.entries(row)) {
    if (keys.some((x) => k.includes(x)) && String(v).trim()) return String(v).trim();
  }
  return "";
}

export function rowsFromMatrix(matrix: string[][]): Record<string, string>[] {
  if (!matrix.length) return [];
  const headers = matrix[0].map((h, i) => (h && String(h).trim()) || `col${i + 1}`);
  return matrix.slice(1).filter((r) => r.some((c) => String(c || "").trim())).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { o[h] = String(r[i] ?? "").trim(); });
    return o;
  });
}

export function analyzeSurveyRows(rows: Record<string, string>[], protocol: SurveyProtocol): ExcelAnalysisResult {
  const issues: ExcelIssue[] = [];
  const inferred: SurveyItem[] = [];

  rows.forEach((row, idx) => {
    const stem = cell(row, ["문항", "질문", "문항내용", "stem", "question", "내용", "문항 문구", "질문내용"]);
    const scale = cell(row, ["응답척도", "척도", "응답", "scale", "responseScale", "보기", "선택지"]);
    const type = cell(row, ["유형", "내용유형", "type", "분류"]);
    const code = cell(row, ["코드", "문항번호", "번호", "code", "no", "ID"]) || `Q${String(idx + 1).padStart(2, "0")}`;
    if (!stem) {
      issues.push({
        row: idx + 2,
        stem: "(빈 문항)",
        severity: "warn",
        rule: "필수필드",
        problem: "문항 문구가 비어 있습니다.",
        suggestion: "문항/질문 열에 완성된 질문 문장을 입력하세요.",
      });
      return;
    }

    // double-barreled
    if (/(그리고|및|&|and).*(습니까|인가요|합니까)|과\s+.+(만족|동의|찬성)/i.test(stem) || /와\s+.+(만족|동의)/.test(stem)) {
      issues.push({
        row: idx + 2, stem, severity: "error", rule: "이중질문(Double-barreled)",
        problem: "한 문항에 두 대상·두 평가가 결합된 것으로 보입니다.",
        suggestion: "대상을 분리해 두 문항으로 나누세요. (Groves p.248-249)",
        cognitiveStage: "이해(Comprehension)",
      });
    }

    // hard words / long
    if (stem.length > 120) {
      issues.push({
        row: idx + 2, stem, severity: "warn", rule: "Dillman 2.2 최소 단어",
        problem: "문항이 과도하게 길어 인지 부담이 클 수 있습니다.",
        suggestion: "핵심만 남기고 짧게 재작성하되, 민감행동·회상 단서가 필요하면 장문화를 유지하세요.",
        cognitiveStage: "이해(Comprehension)",
      });
    }

    // check-all
    if (/모두\s*선택|해당하는\s*것을\s*모두|check-?all/i.test(stem + scale)) {
      issues.push({
        row: idx + 2, stem, severity: "error", rule: "Dillman 2.10 check-all 지양",
        problem: "전부 해당 체크 형식은 초두효과·만족화로 품질이 떨어집니다.",
        suggestion: "각 항목을 예/아니오 또는 정도 척도로 개별 평정하세요.",
        cognitiveStage: "보고(Reporting)",
      });
    }

    // overlapping age-like categories
    if (/\d+\s*세?\s*이하.+\d+|\d+\s*~\s*\d+.+\d+\s*~\s*\d+/.test(scale) && /(\d+)\s*[~\-–]\s*(\d+).*\1/.test(scale.replace(/\s/g, ""))) {
      issues.push({
        row: idx + 2, stem, severity: "error", rule: "Dillman 2.11 상호배타성",
        problem: "응답 범주 경계가 중복될 수 있습니다.",
        suggestion: "예: 35세 이하 / 36~50세처럼 경계값을 한 구간에만 속하게 하세요.",
        cognitiveStage: "보고(Reporting)",
      });
    }
    if (/이하\/\d+|~\d+\/\d+~/.test(scale.replace(/\s/g, "")) && /35.*35|50.*50|65.*65/.test(scale.replace(/\s/g, ""))) {
      issues.push({
        row: idx + 2, stem, severity: "error", rule: "Dillman 2.11 상호배타성",
        problem: "연령·구간 경계 중복 패턴이 감지되었습니다.",
        suggestion: "경계값을 분리하세요 (35 이하 / 36~50).",
        cognitiveStage: "보고(Reporting)",
      });
    }

    // unbalanced agree without disagree in stem
    if (/얼마나\s*동의/.test(stem) && !/반대/.test(stem)) {
      issues.push({
        row: idx + 2, stem, severity: "warn", rule: "Dillman 2.9 양극 문두",
        problem: "문두에 동의만 언급되어 묵인편향 위험이 있습니다.",
        suggestion: "'얼마나 동의 또는 반대하십니까?'처럼 양측을 명시하세요.",
        cognitiveStage: "추정과 판단(Judgment)",
      });
    }

    // vague
    if (/잘\s*활용|어느\s*정도\s*알고|어떻게\s*생각.*전반/.test(stem) && stem.length < 40) {
      issues.push({
        row: idx + 2, stem, severity: "warn", rule: "구체성(Groves)",
        problem: "태도·성과 대상이 모호할 수 있습니다.",
        suggestion: "태도 대상·기간·행동을 구체적으로 특정하세요.",
        cognitiveStage: "이해(Comprehension)",
      });
    }

    // DK in middle of scale text
    if (/동의.+미결정.+반대|찬성.+모르겠다.+반대/.test(scale)) {
      issues.push({
        row: idx + 2, stem, severity: "warn", rule: "Dillman 2.7 미결정 위치",
        problem: "미결정/모름이 척도 중간에 있으면 회피응답이 늘어납니다.",
        suggestion: "미결정은 척도 끝에 두거나 중립과 의견없음을 분리하세요.",
        cognitiveStage: "보고(Reporting)",
      });
    }

    // multiple questions in one
    if ((stem.match(/\?/g) || []).length > 1 || /몇\s*명이며.*몇\s*명/.test(stem)) {
      issues.push({
        row: idx + 2, stem, severity: "error", rule: "자기기입 원칙: 한 번에 한 질문",
        problem: "한 문항에 여러 하위질문이 압축되어 있습니다.",
        suggestion: "하위질문을 분리하세요. (Jenkins & Dillman)",
        cognitiveStage: "항해(Navigation)",
      });
    }

    const scaleType = inferScaleType(stem, scale, type);
    inferred.push({
      no: idx + 1,
      code,
      type: inferContentType(stem, type),
      stem,
      responseScale: scale || "(척도 미기재)",
      scaleType,
      codingHint: SCALE_LABEL[scaleType].ko,
      codingMap: buildCodingMap(scale || "", scaleType),
      note: type || CONTENT_TYPE_LABEL[inferContentType(stem, type)],
    });
  });

  // protocol coverage info
  if (rows.length < 30) {
    issues.push({
      row: 0,
      stem: "(전체)",
      severity: "info",
      rule: "문항 수",
      problem: `현재 ${rows.length}문항입니다. AI 생성 기준 최소 30문항 권장.`,
      suggestion: "유형별 문항을 보강하거나 AI 생성으로 30문항 이상 만드세요.",
    });
  }

  // attach evaluation method reminder
  issues.push({
    row: 0,
    stem: "(사전검증)",
    severity: "info",
    rule: "문항 평가방법",
    problem: "엑셀 규칙 검수는 1차 점검입니다.",
    suggestion: "전문가 검토·인지면접·현장 예비조사·스플릿발럿으로 보완하세요. (Groves Ch.8)",
    cognitiveStage: "이해–회상–판단–보고",
  });

  const summary = {
    error: issues.filter((i) => i.severity === "error").length,
    warn: issues.filter((i) => i.severity === "warn").length,
    info: issues.filter((i) => i.severity === "info").length,
  };
  return { total: rows.length, issues, summary, inferredItems: inferred };
}

function inferScaleType(stem: string, scale: string, type: string): ScaleTypeId {
  const s = `${stem} ${scale} ${type}`.toLowerCase();
  if (/___|횟수|몇\s*일|몇\s*권|소득\s*액|나이\s*\(만/.test(s) || /비율/.test(type)) return "ratio";
  if (/예\s*\/\s*아니오|안다|모른다|성별|지역|명목/.test(s)) return "nominal";
  if (/등간|평균\s*점수|temperature|0\s*~\s*100/.test(s)) return "interval";
  if (/1\s*=|likert|동의|만족|서열|~\s*5|~\s*7/.test(s)) return "ordinal";
  return "ordinal";
}

function inferContentType(stem: string, type: string): string {
  const t = `${type} ${stem}`;
  if (/태도|동의|만족|찬성/.test(t)) return "attitude";
  if (/지식|알고|모릅/.test(t)) return "knowledge";
  if (/성과|완료|이용 횟수|반납/.test(t)) return "performance";
  if (/나는 |가치|라이프|심리|사이코/.test(t)) return "psychographic";
  if (/연령|성별|학력|소득|인구/.test(t)) return "demographic";
  if (/지시|○|형식 전환|자기기입/.test(t)) return "self_administered";
  if (/규정|지키지|민감/.test(t)) return "sensitive_behavior";
  return type || "attitude";
}

export function convertItemsToScaleCoding(items: SurveyItem[], protocol: SurveyProtocol) {
  return items.map((it) => {
    const id = (it.scaleType || "ordinal") as ScaleTypeId;
    const scaleMeta = protocol.measurementScales.find((s) => s.id === id);
    return {
      ...it,
      scaleKo: SCALE_LABEL[id]?.ko || id,
      scaleEn: SCALE_LABEL[id]?.en || id,
      features: scaleMeta?.features || "",
      stats: scaleMeta?.stats || "",
      ssLinks: scaleMeta?.ssLinks || [],
      codingMap: it.codingMap || buildCodingMap(it.responseScale, id),
    };
  });
}
