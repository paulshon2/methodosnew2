/**
 * 기본통계 — 모듈별 데모 데이터 12종 + 미리보기·변수 설명 헬퍼
 */
import demosJson from "./basic-stats-demos.generated.json";

export type BsDemo = {
  id: string;
  title: string;
  desc: string;
  n: number;
  csv: string;
};

export type ColumnGlossary = {
  key: string;
  label: string;
  meaning: string;
};

const DEMOS = demosJson as Record<string, BsDemo[]>;

/** 연구 주제별 종속·독립변수 한글 의미 (미리보기 정밀화) */
const TOPIC_VARS: { match: RegExp; y: string; x1: string; x2: string; score: string; group: string; context: string }[] = [
  { match: /학습동기/, y: "학습동기 총점", x1: "자기효능감(5점)", x2: "주당 학습시간", score: "학습동기 점수", group: "집단(수업·조건)", context: "대학생의 학습동기와 관련 요인" },
  { match: /조직몰입/, y: "조직몰입 총점", x1: "상사지지(5점)", x2: "직무자율성", score: "조직몰입 점수", group: "집단(부서·조건)", context: "직장인의 조직몰입과 성과 맥락" },
  { match: /수업 만족|온라인 수업/, y: "수업만족도", x1: "상호작용 품질", x2: "콘텐츠 유용성", score: "만족도 점수", group: "집단(남/여·방식)", context: "온라인·원격수업 만족도" },
  { match: /복지 인식/, y: "복지인식 점수", x1: "정보접근성", x2: "지역애착", score: "복지인식", group: "집단(거주·채널)", context: "지역사회 복지 인식" },
  { match: /창업의도/, y: "창업의도", x1: "기업가정신", x2: "자원접근성", score: "창업의도 점수", group: "집단(전공·경험)", context: "스타트업 창업의도" },
  { match: /진로성숙/, y: "진로성숙도", x1: "진로탐색", x2: "부모지지", score: "진로성숙 점수", group: "집단(학년·프로그램)", context: "중학생 진로성숙" },
  { match: /직무스트레스|간호/, y: "직무스트레스", x1: "업무부하", x2: "사회적지지", score: "스트레스 점수", group: "집단(근무형태)", context: "간호·직무 스트레스" },
  { match: /브랜드/, y: "브랜드충성도", x1: "브랜드신뢰", x2: "만족도", score: "충성도 점수", group: "집단(구매경험)", context: "소비자 브랜드 충성" },
  { match: /디지털리터러시|노인/, y: "디지털리터러시", x1: "기기사용빈도", x2: "교육경험", score: "리터러시 점수", group: "집단(연령대)", context: "노인 디지털리터러시" },
  { match: /교사|소진/, y: "교사효능감", x1: "소진(역)", x2: "동료지지", score: "효능감 점수", group: "집단(학교급)", context: "교사 소진·효능감" },
  { match: /기후/, y: "기후행동의도", x1: "환경태도", x2: "규범인식", score: "행동의도", group: "집단(캠페인노출)", context: "기후행동 의도" },
  { match: /헬스케어|앱/, y: "앱지속사용의도", x1: "유용성", x2: "용이성", score: "사용의도", group: "집단(이용기간)", context: "헬스케어 앱 사용" },
];

const GENERIC_COL: Record<string, { label: string; meaning: string }> = {
  id: { label: "응답 ID", meaning: "설문 응답자 식별번호" },
  ID: { label: "응답 ID", meaning: "설문 응답자 식별번호" },
  group: { label: "집단", meaning: "비교 집단(처치·통제·조건)" },
  집단: { label: "집단", meaning: "평균 비교에 쓰는 집단 구분" },
  score: { label: "점수", meaning: "측정 척도 총점 또는 핵심 종속변수" },
  y: { label: "종속변수(Y)", meaning: "설명하려는 결과 변수" },
  x1: { label: "독립변수(X1)", meaning: "첫 번째 예측·설명 변수" },
  x2: { label: "독립변수(X2)", meaning: "두 번째 예측·설명 변수" },
  Shift: { label: "근무/학습 형태", meaning: "교대·주간·야간 등 (기본 교육용 샘플)" },
  Tenure: { label: "경력·재학기간", meaning: "경험 기간 범주 (기본 교육용 샘플)" },
  FocusScore: { label: "핵심 척도 점수", meaning: "연구 주제 핵심 연속형 점수 (기본 교육용 샘플)" },
  Site: { label: "지역/사이트", meaning: "조사 지역 또는 수집 채널 (기본 교육용 샘플)" },
  학년: { label: "학년", meaning: "응답자의 학년(또는 학기) 구분" },
  전공: { label: "전공", meaning: "소속 전공·계열" },
  학습동기점수: { label: "학습동기 점수", meaning: "학습동기 척도 점수" },
  선호학습시간: { label: "선호 학습시간", meaning: "주로 학습하는 시간대" },
  학습동기: { label: "학습동기", meaning: "종속변수(학습동기)" },
  자기효능감: { label: "자기효능감", meaning: "예측변수(자기효능감)" },
  주당학습시간: { label: "주당학습시간", meaning: "주당 학습 시간(시간)" },
  조직몰입: { label: "조직몰입", meaning: "종속변수(조직몰입)" },
  상사지지: { label: "상사지지", meaning: "예측변수(상사 지지)" },
  직무자율성: { label: "직무자율성", meaning: "예측변수(직무 자율성)" },
};

function topicFor(title: string) {
  return TOPIC_VARS.find((t) => t.match.test(title)) ?? null;
}

/** 데모 제목·컬럼에 맞춘 변수 설명표 */
export function columnGlossary(demo: BsDemo | null | undefined, headers: string[]): ColumnGlossary[] {
  const topic = demo ? topicFor(demo.title) : null;
  return headers.map((h) => {
    const key = h.trim();
    if (topic) {
      if (/^y$/i.test(key)) return { key, label: topic.y, meaning: `${topic.context}의 종속변수` };
      if (/^x1$/i.test(key)) return { key, label: topic.x1, meaning: `${topic.context}의 주요 예측변수` };
      if (/^x2$/i.test(key)) return { key, label: topic.x2, meaning: `${topic.context}의 보조 예측변수` };
      if (/^score$/i.test(key)) return { key, label: topic.score, meaning: `${topic.context}의 핵심 점수` };
      if (/^group$/i.test(key) || key === "집단") return { key, label: topic.group, meaning: "평균 비교에 쓰는 집단 구분" };
    }
    const g = GENERIC_COL[key];
    if (g) return { key, label: g.label, meaning: g.meaning };
    if (/^item\d+$/i.test(key) || /^q\d+$/i.test(key) || /^i\d+$/i.test(key) || /^f\d_\d+$/i.test(key)) {
      return { key, label: `문항 ${key}`, meaning: "척도 문항(평정척도(등간형) 등) 응답값" };
    }
    if (/[가-힣]/.test(key)) {
      return { key, label: key, meaning: topic ? `${topic.context} 관련 변수` : "설문·측정 변수" };
    }
    return { key, label: key, meaning: "데이터 열" };
  });
}

export function demoContextBlurb(demo: BsDemo | null | undefined): string {
  if (!demo) return "현재 불러온 CSV를 표로 확인합니다.";
  const topic = topicFor(demo.title);
  const base = topic?.context ?? demo.desc;
  return `「${demo.title}」 — ${base}. ${demo.desc}`;
}

/** 기본 샘플·사용자 CSV용 안내 문구 */
export function previewContextBlurb(demo: BsDemo | null | undefined, moduleName?: string): string {
  if (demo) return demoContextBlurb(demo);
  if (moduleName) {
    return `「${moduleName}」 기본 교육용 샘플입니다. y·x1·group 등은 통계 학습용 약어이며, 테스트용 데모(12종)를 고르면 연구 주제에 맞는 한글 변수명으로 미리보기가 정밀해집니다.`;
  }
  return "현재 불러온 데이터입니다. 테스트용 데모(12종)를 선택하면 주제별 변수 설명과 함께 표가 표시됩니다.";
}

export function getDemosForModule(moduleId: string): BsDemo[] {
  return DEMOS[moduleId] || [];
}

export function getDemo(moduleId: string, demoId: string): BsDemo | undefined {
  return getDemosForModule(moduleId).find((d) => d.id === demoId);
}

export function previewCsv(csv: string, maxRows = 8): { headers: string[]; rows: string[][]; total: number } {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [], total: 0 };
  const headers = lines[0].split(",");
  const rows = lines.slice(1, maxRows + 1).map((l) => l.split(","));
  return { headers, rows, total: Math.max(0, lines.length - 1) };
}

/** 기본통계 연습용 최소 표본(실전 표준의 하한에 맞춤) */
export const BASIC_STATS_PRACTICE_N = 120;

export const CLASSIC_MODULE_IDS = [
  "A-01", "A-02", "A-03", "A-04", "A-05", "A-08", "A-09", "A-10",
  "B-02", "B-05",
  "C-01", "C-02", "C-03", "C-04", "C-05", "C-06", "C-07", "C-08", "C-09", "C-10",
  "D-01", "D-02", "D-03", "D-04", "D-06", "D-07",
  "E-01", "E-02", "E-03", "E-04", "E-05", "E-15",
  "G-01", "G-02", "G-04", "G-06",
  "I-01", "I-03", "I-04",
  "J-01", "J-02",
] as const;

export const SEM_MODULE_IDS = [
  "cfa", "path", "sem", "sem_fix", "sem_mod", "mg",
  "B-01", "B-03", "D-05", "E-06", "E-07", "G-03",
] as const;

export type BsSampleSizeGuide = {
  title: string;
  standardN: string;
  rationale: string;
  practiceNote: string;
  family: "classic" | "sem" | "meta" | "timeseries";
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function looksIdCol(col: string) {
  return /^(id|ID|응답\s*ID|응답자|respondent|사례|case|no\.?|번호|t|study)$/i.test(col.trim());
}

/** 기법·메카니즘별 자료수집 단계 표준 표본수 안내 */
export function basicStatsSampleSizeGuide(
  moduleId: string,
  moduleName: string,
  englishName?: string,
): BsSampleSizeGuide {
  const id = moduleId;
  const s = `${moduleId} ${moduleName} ${englishName || ""}`.toLowerCase();
  const title = "자료수집 단계 · 표준 표본수(실전 기준)";

  // 시계열
  if (/^I-0[134]$/.test(id) || /시계열|time.?series|arima|예측/.test(s)) {
    return {
      title,
      family: "timeseries",
      standardN: "시계열 관측점 T ≥ 50–100(월·주 단위) · 단기 비교라도 T ≥ 30을 권장",
      rationale:
        "시계열은 ‘사람 수’가 아니라 ‘시점 수’가 표본입니다. 추세·계절·자기상관을 안정적으로 읽으려면 관측 길이가 필요합니다.",
      practiceNote: "아래 아코디언 표는 T=120 시점의 학습용 시계열입니다. 실제 분석도 동일 길이로 연습합니다.",
    };
  }

  // 메타분석 (연구 단위)
  if (/^J-0[12]$/.test(id) || /메타|meta.?analy|효과크기 통합/.test(s)) {
    return {
      title,
      family: "meta",
      standardN: "통합 연구 수 k ≥ 10–20편(이질성·하위집단 분석 시 20–40편+) · 각 연구의 n은 별도 보고",
      rationale:
        "메타분석의 표본은 응답자가 아니라 ‘연구(study)’입니다. Forest·이질성(I²) 해석을 위해 최소 k와 각 연구의 n₁·n₂를 함께 적습니다.",
      practiceNote: "학습용으로 연구 단위 행을 120건까지 확장합니다. 논문에서는 포함기준을 통과한 k편만 씁니다.",
    };
  }

  // SEM · 잠재변수
  if (
    SEM_MODULE_IDS.includes(id as (typeof SEM_MODULE_IDS)[number]) ||
    /cfa|sem|path|구조방정식|잠재|확인적.?요인|탐색적.?요인|매개|조절|다집단|측정모형/.test(s)
  ) {
    if (/cfa|확인적|b-01|신뢰|타당|측정/.test(s) || id === "cfa" || id === "B-01") {
      return {
        title,
        family: "sem",
        standardN: "CFA·신뢰도/타당도 보통 n ≥ 200–400 · 문항당 5–10명 규칙(예: 20문항 → 100–200명+)",
        rationale:
          "측정모형은 요인적재·적합도(CFI·RMSEA) 추정이 불안정하지 않도록 충분한 n이 필요합니다. 복잡한 요인·다집단이면 상한을 따릅니다.",
        practiceNote: "아래 표는 SEM/측정 연습용 n=120 마이크로데이터입니다(실전 하한에 맞춘 학습 규모).",
      };
    }
    if (/efa|b-03|탐색적.?요인/.test(s) || id === "B-03") {
      return {
        title,
        family: "sem",
        standardN: "EFA 보통 n ≥ 150–300 · 변수(문항)당 5–10명 · Kaiser–Meyer–Olkin·공통성 점검",
        rationale: "탐색적 요인분석은 상관행렬 안정성이 핵심입니다. 문항이 많을수록 n을 늘립니다.",
        practiceNote: "아래 n=120 표로 요인·잠재구조 연습 데이터 형태를 익힙니다.",
      };
    }
    if (/mg|다집단|multi.?group/.test(s) || id === "mg") {
      return {
        title,
        family: "sem",
        standardN: "집단당 n ≥ 150–200(측정동일성 검증) · 전체 300–500명+",
        rationale: "다집단 SEM은 집단별로 측정모형이 돌아가므로 ‘전체 n’이 아니라 ‘집단당 n’이 기준입니다.",
        practiceNote: "학습용 n=120(혼합 집단)으로 변수 구조를 익히고, 실전에서는 집단당 표본을 확보합니다.",
      };
    }
    if (/매개|조절|e-06|e-07|moder|mediat/.test(s) || id === "E-06" || id === "E-07") {
      return {
        title,
        family: "sem",
        standardN: "매개·조절 보통 n ≥ 200–400(간접효과·부트스트랩 안정성) · 복잡한 조절은 400+",
        rationale: "간접효과·상호작용은 효과크기가 작아 검정력에 n이 더 필요합니다.",
        practiceNote: "아래 n=120은 경로·매개 연습용입니다. 논문 설계 시 검정력 분석을 병행하세요.",
      };
    }
    return {
      title,
      family: "sem",
      standardN: "경로·SEM 보통 n ≥ 200–500 · 자유모수 10배 규칙(예: 30모수 → 300명+) · ML 추정 시 200명+",
      rationale:
        "구조방정식은 측정+구조 모수를 동시에 추정합니다. 적합도·표준오차가 흔들리지 않도록 자료수집 단계에서 n을 넉넉히 잡습니다.",
      practiceNote: "아래 아코디언의 n=120 표가 기본통계 SEM 메뉴 학습용 표준 연습 규모입니다.",
    };
  }

  // 대응분석 · 교차 · 카이제곱
  if (/^D-0[46]$/.test(id) || /^A-08$/.test(id) || /^C-09$/.test(id) || /대응분석|ca\b|mca|교차|카이|chi/.test(s)) {
    return {
      title,
      family: "classic",
      standardN: "교차표·CA/MCA 보통 n ≥ 150–400 · 기대빈도 셀당 ≥ 5(χ² 가정) · 범주·차원이 많으면 300명+",
      rationale:
        "대응분석은 교차표(대응행렬)의 관성(χ²/n)을 차원으로 분해합니다. 셀이 비면 지도(좌표)가 왜곡되므로 자료수집 때 범주 균형과 n을 함께 설계합니다.",
      practiceNote: "아래 n=120 범주형 표로 ‘관계 지도’용 교차 구조를 연습합니다(미리보기 8행이 아닌 전체 연습 표본).",
    };
  }

  // t검정·대응표본
  if (/^C-0[238]$/.test(id) || /t검정|t-?test|welch|mann/.test(s)) {
    return {
      title,
      family: "classic",
      standardN: "독립 t 집단당 ≥ 30명(전체 60–100+) · 중간효과·검정력 0.8이면 집단당 50–64명 · 대응 t는 쌍 ≥ 30쌍",
      rationale: "평균 비교는 집단(또는 쌍)별 n과 분산이 검정력·효과크기(Cohen d)를 좌우합니다.",
      practiceNote: "아래 n=120(두 집단 혼합)으로 기술·추론 t검정 연습 데이터를 제공합니다.",
    };
  }

  // ANOVA
  if (/^C-0[4567]$/.test(id) || /^C-10$/.test(id) || /anova|분산분석|사후/.test(s)) {
    return {
      title,
      family: "classic",
      standardN: "요인·셀당 ≥ 20–30명 · 3집단 일원배치 전체 100–150+ · 이원·반복측정은 셀 설계에 따라 150–300+",
      rationale: "ANOVA는 셀 빈도가 고르지 않으면 제곱합·사후검정이 흔들립니다. 자료수집 때 집단 할당 균형을 맞춥니다.",
      practiceNote: "아래 n=120 표로 집단·점수 구조를 익힌 뒤 분석절차를 실행하세요.",
    };
  }

  // 회귀
  if (/^E-0[1-5]$/.test(id) || /^E-15$/.test(id) || /회귀|regression|logit|로지스틱/.test(s)) {
    return {
      title,
      family: "classic",
      standardN: "예측변수 1개당 15–20명+ · 다중회귀 보통 n ≥ 150–400 · 로지스틱은 사건 수(events) 기준 10–20/예측변수",
      rationale: "회귀는 계수 표준오차·과적합이 n과 예측변수 수에 민감합니다. 통제변수가 많을수록 본조사 n을 키웁니다.",
      practiceNote: "아래 n=120은 회귀·예측 연습용 표준 하한 규모입니다.",
    };
  }

  // 상관·연관
  if (/^D-0[1237]$/.test(id) || /상관|correlation|공분산|연관/.test(s)) {
    return {
      title,
      family: "classic",
      standardN: "이변량 상관 보통 n ≥ 100–250 · 안정적 r·신뢰구간이면 200명+ · 부분·다변량 상관은 150–300+",
      rationale: "상관계수는 표본이 작으면 출렁입니다. 자료수집 단계에서 효과크기와 원하는 CI 폭으로 n을 정합니다.",
      practiceNote: "아래 n=120 표로 상관·관계 연습 데이터를 제공합니다.",
    };
  }

  // 군집·분류
  if (/^G-0[1246]$/.test(id) || /군집|cluster|분류|판별|roc/.test(s)) {
    return {
      title,
      family: "classic",
      standardN: "군집·세그먼트 보통 n ≥ 150–300 · 고차원 변수면 변수당 10명+ · 분류 모형은 클래스당 50명+",
      rationale: "군집은 거리·밀도 추정이 n에 민감합니다. 희소 세그먼트를 보려면 본조사 n을 더 확보합니다.",
      practiceNote: "아래 n=120으로 군집·분류용 변수 배치를 연습합니다.",
    };
  }

  // 기술통계·빈도 기본
  if (/^A-/.test(id) || /^B-0[25]$/.test(id) || /^C-01$/.test(id) || /빈도|기술|기술통계|정규성|교차표/.test(s)) {
    return {
      title,
      family: "classic",
      standardN: "기술통계·빈도·기초 탐색 보통 n ≥ 100–200 · 하위집단(성·학년·전공) 비교를 염두에 두면 200–400명",
      rationale:
        "기술·추론의 첫 단계는 분포·결측·이상치를 보는 일입니다. 셀·집단으로 나누어 볼수록 자료수집 n이 커져야 합니다.",
      practiceNote: "이전 미니표(8–16행)는 서식 익힘용입니다. 아래 아코디언 n=120이 자료수집 학습용 표준 규모입니다.",
    };
  }

  return {
    title,
    family: "classic",
    standardN: "양적 설문·추론 보통 n ≥ 100–200(기술) · 집단비교·상관 200–400 · 회귀·다변량 400+",
    rationale: "오차·셀 빈도·검정력이 표본수를 정합니다. 파일럿 20–50명 후 본조사에서 기법에 맞는 표준 n을 확보합니다.",
    practiceNote: "아래 아코디언의 n=120+ 표가 기본통계(기술·추론) 메뉴 학습용 표준 연습 표본입니다.",
  };
}

export type BsSampleTable = { columns: string[]; rows: string[][] };

/** CSV → 표 */
export function csvToSampleTable(csv: string): BsSampleTable | null {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const columns = lines[0].split(",").map((c) => c.trim());
  const rows = lines.slice(1).map((l) => {
    const cells = l.split(",");
    while (cells.length < columns.length) cells.push("");
    return cells.slice(0, columns.length).map((c) => c.trim());
  });
  return { columns, rows };
}

export function sampleTableToCsv(table: BsSampleTable): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return [table.columns.join(","), ...table.rows.map((r) => r.map((c) => esc(String(c))).join(","))].join("\n");
}

/**
 * 모듈 메커니즘에 맞게 시드 CSV를 n행 이상으로 확장.
 * 범주형은 시드 고유값에서 표본추출, 연속형은 잡음·재추출을 섞어 학습용 분포를 유지합니다.
 */
export function expandDemoCsvToN(csv: string, n: number, seedKey: string): string {
  const seed = csvToSampleTable(csv);
  if (!seed?.columns.length) return csv;
  const target = Math.max(BASIC_STATS_PRACTICE_N, n);
  if (seed.rows.length >= target) {
    // id만 정규화
    const rows = seed.rows.slice(0, Math.max(seed.rows.length, target)).map((r, i) => {
      const row = [...r];
      seed.columns.forEach((c, j) => {
        if (looksIdCol(c)) row[j] = String(i + 1);
      });
      return row;
    });
    return sampleTableToCsv({ columns: seed.columns, rows });
  }

  const cols = seed.columns;
  const seedRows = seed.rows.map((r) => r.map(String));
  const pools = cols.map((_, j) => {
    const u = [...new Set(seedRows.map((r) => r[j] || "").filter((v) => v !== ""))];
    return u.length ? u : ["1"];
  });
  const numericFlags = pools.map((pool) => pool.every((v) => /^-?\d+(\.\d+)?$/.test(v.trim())));
  const rnd = mulberry32(hashSeed(seedKey) || 1);
  const out: string[][] = [];

  for (let i = 0; i < target; i++) {
    if (i < seedRows.length) {
      const row = [...seedRows[i]];
      cols.forEach((c, j) => {
        if (looksIdCol(c)) row[j] = String(i + 1);
      });
      out.push(row.slice(0, cols.length));
      continue;
    }
    const base = seedRows[Math.floor(rnd() * seedRows.length)] || cols.map(() => "");
    const row = cols.map((c, j) => {
      if (looksIdCol(c)) return String(i + 1);
      const pool = pools[j];
      if (!numericFlags[j]) {
        return pool[Math.floor(rnd() * pool.length)];
      }
      // Likert(1–5)·점수·연속: 풀에서 뽑거나 소폭 잡음
      if (pool.length <= 7 && pool.every((v) => {
        const x = Number(v);
        return x >= 0 && x <= 10;
      })) {
        return pool[Math.floor(rnd() * pool.length)];
      }
      const raw = base[j] ?? pool[Math.floor(rnd() * pool.length)];
      const num = parseFloat(raw);
      if (!Number.isFinite(num)) return pool[Math.floor(rnd() * pool.length)];
      const v = Math.round(num + (rnd() - 0.5) * 6);
      return String(Math.max(0, v));
    });
    out.push(row);
  }
  return sampleTableToCsv({ columns: cols, rows: out });
}

/** 미리보기·분석용 CSV가 연습 표준 n 미만이면 확장 */
export function ensurePracticeDemoCsv(
  csv: string,
  moduleId: string,
  demoKey: string,
  n: number = BASIC_STATS_PRACTICE_N,
): string {
  const total = previewCsv(csv, 1).total;
  if (total >= n) return csv;
  return expandDemoCsvToN(csv, n, `${moduleId}|${demoKey}|v24`);
}
