import type { SsTechnique } from "./ss-stats-guide";

export interface EnrichBlock {
  meaning: string;
  examples: string[];
  process: { step: string; task: string }[];
  sampleForm: { field: string; hint: string; sample: string }[];
  practicePrompt: string;
  practiceFields: { id: string; label: string; placeholder: string }[];
}

export interface CsvFormatGuide {
  why: string;
  tips: string[];
  demoCsv: string;
  codingHint: string;
}

/** 설문 예시 원자료 (초보자 실습용) */
export const DEMO_SURVEY_CSV = `ID,Gender,Education,Satisfaction,Region
1,1,3,4,2
2,2,4,5,1
3,1,2,3,3
4,2,3,4,4
5,1,1,,2
6,2,3,3,1
7,1,,4,3
8,2,4,5,2
9,1,3,2,4
10,2,5,5,1`;

export const DEMO_CODING_TABLE = `변수,코드,라벨
Gender,1,남
Gender,2,여
Education,1,초졸
Education,2,중졸
Education,3,고졸
Education,4,대졸
Education,5,대학원
Satisfaction,1,매우불만
Satisfaction,2,불만
Satisfaction,3,보통
Satisfaction,4,만족
Satisfaction,5,매우만족
Region,1,수도권
Region,2,충청
Region,3,영남
Region,4,호남`;

function isFreqPrep(prep: string) {
  return /범주형|명목|서열|결측/.test(prep);
}

function isCodingDataTask(task: string) {
  return /코딩표|원자료|1=남|변수값/.test(task);
}

export function enrichPrep(tech: SsTechnique): EnrichBlock {
  if (isFreqPrep(tech.prep) || /빈도/.test(tech.name)) {
    return {
      meaning:
        "분석에 들어가기 전에 두 가지를 미리 정해 두라는 뜻입니다. ① 성별·학력처럼 ‘종류’로 나뉘는 답을 숫자로 바꿔 두었는지(예: 남=1, 여=2), ② 빈칸(결측)을 어떻게 처리할지(제외할지, 별도 코드로 둘지)를 연구 시작 전에 합의해 두라는 의미입니다. 숫자만 보고는 ‘1이 남인지 여인지’를 알 수 없고, 빈칸 규칙을 바꾸면 빈도·비율이 달라집니다.",
      examples: [
        "성별 문항: 설문지에 ‘남/여’로 적혀 있어도 엑셀에는 1, 2로만 넣습니다. 분석 전에 ‘1=남, 2=여’를 코딩표에 적어 둡니다.",
        "만족도(1~5): 서열(순서) 척도이므로 평균보다 먼저 빈도·비율로 분포를 봅니다. ‘모름’을 빈칸으로 둘지 9로 둘지 미리 정합니다.",
        "결측 처리: 응답 10명 중 Satisfaction이 비어 있는 1명(ID=5)을 분석에서 빼면 N=9가 됩니다. ‘빈칸=제외’ 규칙을 논문 방법에 적습니다.",
      ],
      process: [
        { step: "1. 변수 목록 작성", task: "분석할 문항(Gender, Education 등)과 척도 유형(명목/서열)을 표로 적습니다." },
        { step: "2. 코딩 규칙 확정", task: "각 숫자값의 의미를 코딩표에 기록합니다(1=남, 2=여 …)." },
        { step: "3. 결측 규칙 확정", task: "빈칸·‘모름’·‘해당없음’을 제외할지, 별도 코드(-999 등)로 둘지 결정합니다." },
        { step: "4. 예비 점검", task: "소표본으로 빈도표를 한 번 돌려 예상과 다른 코드(예: Gender=3)가 없는지 확인합니다." },
      ],
      sampleForm: [
        { field: "변수명", hint: "엑셀 열 이름", sample: "Gender" },
        { field: "척도 유형", hint: "명목 / 서열", sample: "명목" },
        { field: "코딩 규칙", hint: "숫자=의미", sample: "1=남, 2=여" },
        { field: "결측 처리", hint: "제외 / 별도코드", sample: "빈칸은 분석에서 제외" },
      ],
      practicePrompt: "아래 기입란에 본인 연구의 준비사항을 적어 예비테스트를 해 보세요. (저장되지 않는 연습용)",
      practiceFields: [
        { id: "var", label: "분석 변수명", placeholder: "예: Gender" },
        { id: "scale", label: "척도 유형(명목/서열)", placeholder: "예: 명목" },
        { id: "code", label: "코딩 규칙", placeholder: "예: 1=남, 2=여" },
        { id: "miss", label: "결측 처리 기준", placeholder: "예: 빈칸 제외" },
      ],
    };
  }

  return {
    meaning: `「${tech.prep}」은 이 분석을 돌리기 전에 데이터·설계를 미리 맞춰 두라는 뜻입니다. 준비가 안 되면 계산은 나와도 해석이 틀어지거나, 다른 연구자가 결과를 재현하기 어렵습니다.`,
    examples: [
      `예시 1: ${tech.example}`,
      `예시 2: ${tech.analogy}`,
      `예시 3: 준비사항 「${tech.prep}」을 체크리스트로 인쇄해 데이터 수집 전에 팀과 합의합니다.`,
    ],
    process: [
      { step: "1. 준비사항 확인", task: tech.prep },
      { step: "2. 필요 자료 확보", task: tech.dataTask },
      { step: "3. 예비 실행", task: "소표본 CSV로 한 번 돌려 이상값·결측·코딩 오류를 점검합니다." },
      { step: "4. 본분석", task: "규칙을 고정한 뒤 전체 자료로 분석을 실행하고 결과를 기록합니다." },
    ],
    sampleForm: [
      { field: "기법", hint: "분석 이름", sample: tech.name },
      { field: "준비 체크", hint: "준비사항 요약", sample: tech.prep },
      { field: "담당자", hint: "누가 확인했는지", sample: "연구자 A" },
      { field: "확인일", hint: "YYYY-MM-DD", sample: "2026-07-10" },
    ],
    practicePrompt: "이 기법의 분석 전 준비를 직접 적어 예비테스트해 보세요.",
    practiceFields: [
      { id: "prep1", label: "내가 확인할 준비사항", placeholder: tech.prep.slice(0, 40) },
      { id: "prep2", label: "아직 부족한 점", placeholder: "예: 결측 규칙 미정" },
      { id: "prep3", label: "예비테스트 결과 메모", placeholder: "예: Gender에 3이 1건 발견" },
    ],
  };
}

export function enrichDataTask(tech: SsTechnique): EnrichBlock {
  if (isCodingDataTask(tech.dataTask) || /빈도/.test(tech.name)) {
    return {
      meaning:
        "분석을 돌리려면 ① 응답자별 원자료(행=사람, 열=문항)와 ② 숫자값이 무엇을 뜻하는지 적은 코딩표가 함께 있어야 한다는 뜻입니다. 코딩표가 없으면 ‘1’이 남인지 여인지 알 수 없어, 빈도를 세어도 오분류·오해석이 납니다.",
      examples: [
        "원자료만 있고 Gender 열이 1,2만 있으면 ‘남이 몇 %?’를 말할 수 없습니다. 코딩표(1=남, 2=여)가 있어야 해석이 됩니다.",
        "Education=3을 ‘고졸’로 읽어야 하는데 코딩표를 잃어버리면 다른 연구자가 ‘대졸’로 잘못 읽을 수 있습니다.",
        "Satisfaction 빈칸(ID=5)을 코딩표에 ‘결측’으로 명시하지 않으면 프로그램이 0으로 읽어 평균·빈도가 왜곡될 수 있습니다.",
      ],
      process: [
        { step: "1. 원자료 정리", task: "응답 전체를 CSV/엑셀로 모읍니다(행=응답자, 열=변수)." },
        { step: "2. 코딩표 작성", task: "변수마다 코드→라벨 대응표를 만듭니다." },
        { step: "3. 변환·검증", task: "아래 변환기로 숫자↔라벨을 바꿔 보고, 예상과 다른 코드가 없는지 확인합니다." },
        { step: "4. 분석 투입", task: "검증된 자료를 빈도·교차표 등 분석에 넣습니다." },
      ],
      sampleForm: [
        { field: "원자료 파일", hint: "파일명", sample: "survey_raw.csv" },
        { field: "코딩표", hint: "변수·코드·라벨", sample: "Gender: 1=남, 2=여" },
        { field: "결측 코드", hint: "빈칸 의미", sample: "빈칸=무응답(제외)" },
        { field: "검증자", hint: "더블체크", sample: "연구자 B" },
      ],
      practicePrompt: "코딩표와 원자료 준비 상태를 기입해 예비테스트하세요.",
      practiceFields: [
        { id: "raw", label: "원자료 준비 여부", placeholder: "예: CSV 10행 준비됨" },
        { id: "book", label: "코딩표 요약", placeholder: "예: 1=남, 2=여" },
        { id: "risk", label: "오분류 위험 메모", placeholder: "예: Region 코드 미확인" },
      ],
    };
  }

  return {
    meaning: `「${tech.dataTask}」은 이 분석을 실행·해석하려면 반드시 갖춰야 할 자료와 작업입니다. ${tech.dataWhy || "자료가 빠지면 통계량 해석이 불가능하거나 왜곡됩니다."}`,
    examples: [
      `예시 1: ${tech.example}`,
      `예시 2: 필요 자료 — ${tech.dataTask}`,
      `예시 3: 이유 — ${tech.dataWhy || "재현 가능한 분석을 위해 필요합니다."}`,
    ],
    process: [
      { step: "1. 자료 목록화", task: tech.dataTask },
      { step: "2. 형식 맞추기", task: "CSV 헤더·행 단위로 정리하고 결측 표기를 통일합니다." },
      { step: "3. 예비 투입", task: "소표본으로 자동 분석을 돌려 오류를 확인합니다." },
      { step: "4. 본분석·기록", task: "결과표·그래프를 저장하고 해석 메모를 남깁니다." },
    ],
    sampleForm: [
      { field: "필요 자료", hint: "체크리스트", sample: tech.dataTask },
      { field: "확보 여부", hint: "완료/미완", sample: "완료" },
      { field: "비고", hint: "주의점", sample: tech.dataWhy || "" },
    ],
    practicePrompt: "필요 데이터·테스크 준비 상태를 적어 보세요.",
    practiceFields: [
      { id: "have", label: "지금 있는 자료", placeholder: tech.dataTask.slice(0, 36) },
      { id: "need", label: "아직 없는 자료", placeholder: "예: 집단 변수" },
      { id: "note", label: "예비테스트 메모", placeholder: "예: N=10으로 시험 실행" },
    ],
  };
}

export function csvFormatGuide(tech: SsTechnique, phaseId: string): CsvFormatGuide {
  const categorical = /빈도|교차|카이|명목|서열|Gender|범주/i.test(tech.name + tech.prep);
  if (categorical || phaseId === "descriptive" && /빈도/.test(tech.name)) {
    return {
      why:
        "통계 프로그램과 이 화면의 자동 분석은 ‘한 행=한 응답자, 한 열=한 변수’ 표 형식을 전제로 합니다. 헤더(변수명)가 있어야 열을 구분하고, 숫자는 코딩표와 짝을 이뤄야 해석이 가능합니다. 아래 예시는 성별·학력·만족도·지역을 숫자로 코딩한 설문 원자료입니다. 빈칸은 결측(무응답)입니다.",
      tips: [
        "첫 줄은 반드시 변수명(ID, Gender, …)이어야 합니다.",
        "값은 쉼표(,)로 구분합니다. 빈칸은 결측으로 취급됩니다.",
        "Gender 등 숫자는 코딩표 없이 해석하지 마세요(1=남, 2=여).",
        "분석 열만 남기거나, 아래에서 열을 선택해 빈도분석을 실행하세요.",
      ],
      demoCsv: DEMO_SURVEY_CSV,
      codingHint: DEMO_CODING_TABLE,
    };
  }
  return {
    why: `「${tech.name}」은 CSV에서 숫자·범주 열을 읽어 계산합니다. 헤더+행 형식으로 맞추면 자동 분석·그래프가 바로 동작합니다. 열 이름과 값의 의미를 메모해 두면 논문 재현에 유리합니다.`,
    tips: [
      "첫 줄=변수명, 이후 줄=관측값",
      "결측은 빈칸 또는 NA로 통일",
      "집단 비교 시 group/score처럼 열을 명확히 구분",
    ],
    demoCsv: "",
    codingHint: "",
  };
}

export function cleanAutomationProcess(text: string): string {
  if (!text) return "원자료를 입력하면 해당 통계량이 자동으로 산출됩니다. 해석·채택은 연구자가 확인합니다.";
  // 요청 삭제 문구: SPSS FREQUENCIES, R table(), Python value_counts()…
  const stripped = text
    .replace(/SPSS\s*FREQUENCIES,\s*R\s*table\(\),\s*Python\s*value_counts\(\)에\s*원자료를\s*입력하면\s*빈도·비율·누적%가\s*완전자동\s*산출됨/gi, "")
    .replace(/SPSS\s*FREQUENCIES[^.。]*/gi, "")
    .replace(/R\s*table\(\)[^.。]*/gi, "")
    .replace(/Python\s*value_counts\(\)[^.。]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[;,\s.。]+|[;,\s.。]+$/g, "")
    .trim();
  if (!stripped) {
    return "원자료를 입력하면 빈도·비율·누적%가 자동으로 산출됩니다. 결과 해석은 연구자가 확인합니다.";
  }
  return stripped;
}

export interface GlossItem {
  term: string;
  def: string;
}

/** 기초·가정·추론 전 기법에서 쓰이는 용어 주석(쉬운 예시 포함) — 단계별 풀과 동기화 */
export { SS_TERM_POOL } from "./ss-stats-stage-glossary";
import { SS_TERM_POOL as _POOL } from "./ss-stats-stage-glossary";

export const SS_STATS_GLOSSARY: GlossItem[] = Object.values(_POOL);
