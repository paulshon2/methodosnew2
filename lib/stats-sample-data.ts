/**
 * 목적 기반 분석을 처음 열었을 때 쓸 연습 자료.
 * 난수는 고정 시드로 만들기 때문에 언제 열어도 같은 값이 나온다 — 결과를 서로 대조할 수 있어야 하기 때문이다.
 */

export type SampleSet = { id: string; title: string; desc: string; csv: string };

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Box–Muller — 정규분포 난수. */
function normal(rnd: () => number, mean: number, sd: number): number {
  const u = Math.max(1e-9, rnd());
  const v = rnd();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function threeGroupCsv(): string {
  const rnd = lcg(20240501);
  const groups: [string, number, number, number][] = [
    ["대면", 62, 9, 40],
    ["온라인", 57, 11, 40],
    ["혼합", 68, 9, 40],
  ];
  const rows: string[] = ["ID,수업방식,성취도,학습시간,사전점수"];
  let id = 1;
  groups.forEach(([label, m, sd, n]) => {
    for (let i = 0; i < n; i++) {
      const hours = round1(Math.max(0, normal(rnd, 6, 2.2)));
      const pre = Math.round(Math.max(0, normal(rnd, 50, 10)));
      const score = Math.round(Math.max(0, normal(rnd, m + (hours - 6) * 1.6 + (pre - 50) * 0.35, sd)));
      rows.push(`${id++},${label},${score},${hours},${pre}`);
    }
  });
  return rows.join("\n");
}

function prePostCsv(): string {
  const rnd = lcg(1997);
  const rows: string[] = ["ID,사전,사후,성별"];
  for (let i = 1; i <= 90; i++) {
    const pre = Math.round(Math.max(0, normal(rnd, 48, 11)));
    const post = Math.round(Math.max(0, pre + normal(rnd, 4.2, 7)));
    rows.push(`${i},${pre},${post},${i % 2 === 0 ? "여" : "남"}`);
  }
  return rows.join("\n");
}

function categoryCsv(): string {
  const rnd = lcg(880303);
  const rows: string[] = ["ID,전공계열,수료여부,만족도"];
  const majors = ["인문", "이공", "예체능"];
  for (let i = 1; i <= 150; i++) {
    const major = majors[Math.floor(rnd() * majors.length)];
    const base = major === "이공" ? 0.72 : major === "인문" ? 0.58 : 0.5;
    const done = rnd() < base ? "수료" : "미수료";
    const sat = Math.round(Math.max(1, Math.min(5, normal(rnd, done === "수료" ? 3.9 : 3.1, 0.8))));
    rows.push(`${i},${major},${done},${sat}`);
  }
  return rows.join("\n");
}

/** 두 집단 t검정 — 남/여 시험점수 */
function twoGroupCsv(): string {
  const rnd = lcg(314159);
  const rows: string[] = ["ID,성별,시험점수,공부시간"];
  let id = 1;
  ([["남", 71, 10, 45], ["여", 74, 9, 45]] as [string, number, number, number][]).forEach(([g, m, sd, n]) => {
    for (let i = 0; i < n; i++) {
      const hours = round1(Math.max(0, normal(rnd, 5.5, 1.8)));
      const score = Math.round(Math.max(0, normal(rnd, m + (hours - 5.5) * 1.2, sd)));
      rows.push(`${id++},${g},${score},${hours}`);
    }
  });
  return rows.join("\n");
}

/** 상관·회귀 연습 — 수면·집중·성적 */
function sleepFocusCsv(): string {
  const rnd = lcg(271828);
  const rows: string[] = ["ID,수면시간,집중도,시험성적"];
  for (let i = 1; i <= 100; i++) {
    const sleep = round1(Math.max(3, Math.min(10, normal(rnd, 6.8, 1.1))));
    const focus = Math.round(Math.max(1, Math.min(10, normal(rnd, 4 + sleep * 0.55, 1.4))));
    const score = Math.round(Math.max(0, normal(rnd, 40 + focus * 4.2 + sleep * 1.5, 8)));
    rows.push(`${i},${sleep},${focus},${score}`);
  }
  return rows.join("\n");
}

/** 카이제곱 — 캠페인 노출 × 참여 */
function campaignCsv(): string {
  const rnd = lcg(424242);
  const rows: string[] = ["ID,노출경로,참여여부,연령대"];
  const paths = ["SNS", "이메일", "포스터"];
  const ages = ["20대", "30대", "40대"];
  for (let i = 1; i <= 180; i++) {
    const path = paths[Math.floor(rnd() * paths.length)];
    const age = ages[Math.floor(rnd() * ages.length)];
    const p = path === "SNS" ? 0.55 : path === "이메일" ? 0.38 : 0.22;
    const join = rnd() < p ? "참여" : "미참여";
    rows.push(`${i},${path},${join},${age}`);
  }
  return rows.join("\n");
}

/** 한 변수 요약 — 리커트 만족도 설문 */
function likertCsv(): string {
  const rnd = lcg(135791);
  const rows: string[] = ["ID,문항1,문항2,문항3,문항4,총점"];
  for (let i = 1; i <= 120; i++) {
    const a = Math.max(1, Math.min(5, Math.round(normal(rnd, 3.6, 0.9))));
    const b = Math.max(1, Math.min(5, Math.round(normal(rnd, 3.4, 1.0))));
    const c = Math.max(1, Math.min(5, Math.round(normal(rnd, 3.8, 0.85))));
    const d = Math.max(1, Math.min(5, Math.round(normal(rnd, 3.2, 1.1))));
    rows.push(`${i},${a},${b},${c},${d},${a + b + c + d}`);
  }
  return rows.join("\n");
}

/** 네 집단 ANOVA — 학년별 읽기점수 */
function gradeAnovaCsv(): string {
  const rnd = lcg(987654);
  const rows: string[] = ["ID,학년,읽기점수,독서량"];
  let id = 1;
  ([["1학년", 58, 10], ["2학년", 63, 9], ["3학년", 67, 10], ["4학년", 71, 8]] as [string, number, number][]).forEach(
    ([g, m, sd]) => {
      for (let i = 0; i < 35; i++) {
        const books = round1(Math.max(0, normal(rnd, 2.5 + (m - 58) * 0.08, 1.2)));
        const score = Math.round(Math.max(0, normal(rnd, m + books * 1.3, sd)));
        rows.push(`${id++},${g},${score},${books}`);
      }
    },
  );
  return rows.join("\n");
}

/** 짝비교 — 워크숍 전후 자신감 */
function workshopCsv(): string {
  const rnd = lcg(555777);
  const rows: string[] = ["ID,사전자신감,사후자신감,소속"];
  const orgs = ["연구소", "기업", "대학"];
  for (let i = 1; i <= 80; i++) {
    const pre = Math.round(Math.max(1, Math.min(10, normal(rnd, 5.2, 1.5))));
    const post = Math.round(Math.max(1, Math.min(10, pre + normal(rnd, 1.8, 1.2))));
    rows.push(`${i},${pre},${post},${orgs[i % 3]}`);
  }
  return rows.join("\n");
}

/** 두 집단 + 공변량 — 처치/통제 우울점수 */
function treatmentCsv(): string {
  const rnd = lcg(112358);
  const rows: string[] = ["ID,집단,우울점수,기저선"];
  let id = 1;
  ([["처치", 12, 4], ["통제", 16, 4.5]] as [string, number, number][]).forEach(([g, m, sd]) => {
    for (let i = 0; i < 50; i++) {
      const base = Math.round(Math.max(0, normal(rnd, 15, 3.5)));
      const score = Math.round(Math.max(0, normal(rnd, m + (base - 15) * 0.4, sd)));
      rows.push(`${id++},${g},${score},${base}`);
    }
  });
  return rows.join("\n");
}

/** 상관 — 운동·체력·스트레스 */
function fitnessCsv(): string {
  const rnd = lcg(667788);
  const rows: string[] = ["ID,운동분,체력점수,스트레스"];
  for (let i = 1; i <= 95; i++) {
    const min = Math.round(Math.max(0, normal(rnd, 45, 20)));
    const fit = Math.round(Math.max(0, normal(rnd, 40 + min * 0.35, 9)));
    const stress = Math.round(Math.max(1, Math.min(10, normal(rnd, 7 - min * 0.03, 1.6))));
    rows.push(`${i},${min},${fit},${stress}`);
  }
  return rows.join("\n");
}

/** 카이제곱 — 근무형태 × 이직의향 */
function turnoverCsv(): string {
  const rnd = lcg(909090);
  const rows: string[] = ["ID,근무형태,이직의향,부서"];
  const modes = ["정규", "계약", "원격"];
  const depts = ["기획", "개발", "영업"];
  for (let i = 1; i <= 160; i++) {
    const mode = modes[Math.floor(rnd() * modes.length)];
    const dept = depts[Math.floor(rnd() * depts.length)];
    const p = mode === "계약" ? 0.48 : mode === "원격" ? 0.35 : 0.22;
    const leave = rnd() < p ? "있음" : "없음";
    rows.push(`${i},${mode},${leave},${dept}`);
  }
  return rows.join("\n");
}

/** 혼합 — 지역 세 곳 소득·교육연수 */
function regionCsv(): string {
  const rnd = lcg(246810);
  const rows: string[] = ["ID,지역,월소득,교육연수"];
  let id = 1;
  ([["수도권", 420, 80], ["광역시", 350, 70], ["기타", 290, 65]] as [string, number, number][]).forEach(
    ([r, m, sd]) => {
      for (let i = 0; i < 40; i++) {
        const edu = round1(Math.max(6, Math.min(22, normal(rnd, 14, 2.2))));
        const income = Math.round(Math.max(100, normal(rnd, m + (edu - 14) * 12, sd)));
        rows.push(`${id++},${r},${income},${edu}`);
      }
    },
  );
  return rows.join("\n");
}

function dietCsv(): string {
  const rnd = lcg(334455);
  const rows: string[] = ["ID,식단유형,체중변화,칼로리"];
  let id = 1;
  ([["저탄수", -3.2, 1.1], ["균형", -1.4, 1.0], ["고단백", -2.5, 1.2]] as [string, number, number][]).forEach(
    ([g, m, sd]) => {
      for (let i = 0; i < 36; i++) {
        const cal = Math.round(Math.max(1200, normal(rnd, 1800, 220)));
        const w = round1(normal(rnd, m + (1800 - cal) * 0.002, sd));
        rows.push(`${id++},${g},${w},${cal}`);
      }
    },
  );
  return rows.join("\n");
}

function deviceCsv(): string {
  const rnd = lcg(778899);
  const rows: string[] = ["ID,기기,구매여부,연령"];
  const devices = ["스마트폰", "태블릿", "웨어러블"];
  for (let i = 1; i <= 150; i++) {
    const d = devices[Math.floor(rnd() * devices.length)];
    const age = Math.round(Math.max(18, Math.min(70, normal(rnd, 34, 11))));
    const p = d === "스마트폰" ? 0.62 : d === "태블릿" ? 0.35 : 0.28;
    rows.push(`${i},${d},${rnd() < p ? "구매" : "미구매"},${age}`);
  }
  return rows.join("\n");
}

function tutoringCsv(): string {
  const rnd = lcg(121212);
  const rows: string[] = ["ID,사전성적,사후성적,과외여부"];
  for (let i = 1; i <= 100; i++) {
    const pre = Math.round(Math.max(0, normal(rnd, 55, 12)));
    const tutor = rnd() < 0.45 ? "과외" : "비과외";
    const gain = tutor === "과외" ? normal(rnd, 8, 5) : normal(rnd, 2.5, 5);
    const post = Math.round(Math.max(0, pre + gain));
    rows.push(`${i},${pre},${post},${tutor}`);
  }
  return rows.join("\n");
}

function climateCsv(): string {
  const rnd = lcg(909091);
  const rows: string[] = ["ID,도시,기온,전력사용"];
  let id = 1;
  ([["서울", 24, 3], ["부산", 26, 2.5], ["대구", 28, 3.2], ["강릉", 22, 2.8]] as [string, number, number][]).forEach(
    ([c, m, sd]) => {
      for (let i = 0; i < 30; i++) {
        const temp = round1(normal(rnd, m, sd));
        const power = round1(Math.max(0, normal(rnd, 40 + temp * 1.8, 6)));
        rows.push(`${id++},${c},${temp},${power}`);
      }
    },
  );
  return rows.join("\n");
}

function readingCsv(): string {
  const rnd = lcg(565656);
  const rows: string[] = ["ID,독서분,어휘점수,학년"];
  for (let i = 1; i <= 90; i++) {
    const min = Math.round(Math.max(0, normal(rnd, 35, 15)));
    const score = Math.round(Math.max(0, normal(rnd, 50 + min * 0.4, 10)));
    const grade = ["초", "중", "고"][Math.floor(rnd() * 3)];
    rows.push(`${i},${min},${score},${grade}`);
  }
  return rows.join("\n");
}

function hospitalCsv(): string {
  const rnd = lcg(343434);
  const rows: string[] = ["ID,진료과,재방문,만족도"];
  const depts = ["내과", "외과", "소아과"];
  for (let i = 1; i <= 140; i++) {
    const d = depts[Math.floor(rnd() * depts.length)];
    const p = d === "내과" ? 0.55 : d === "외과" ? 0.4 : 0.48;
    const revisit = rnd() < p ? "재방문" : "초진";
    const sat = Math.round(Math.max(1, Math.min(5, normal(rnd, revisit === "재방문" ? 4.1 : 3.3, 0.7))));
    rows.push(`${i},${d},${revisit},${sat}`);
  }
  return rows.join("\n");
}

function commuteCsv(): string {
  const rnd = lcg(232323);
  const rows: string[] = ["ID,수단,통근분,스트레스"];
  let id = 1;
  ([["지하철", 42, 12], ["버스", 55, 15], ["자가용", 38, 14], ["도보", 28, 8]] as [string, number, number][]).forEach(
    ([m, mean, sd]) => {
      for (let i = 0; i < 28; i++) {
        const mins = Math.round(Math.max(5, normal(rnd, mean, sd)));
        const stress = Math.round(Math.max(1, Math.min(10, normal(rnd, 3 + mins * 0.05, 1.4))));
        rows.push(`${id++},${m},${mins},${stress}`);
      }
    },
  );
  return rows.join("\n");
}

function languageCsv(): string {
  const rnd = lcg(454545);
  const rows: string[] = ["ID,학습앱,사전토익,사후토익"];
  const apps = ["A앱", "B앱", "C앱"];
  for (let i = 1; i <= 96; i++) {
    const app = apps[Math.floor(rnd() * apps.length)];
    const pre = Math.round(Math.max(200, Math.min(900, normal(rnd, 620, 70))));
    const boost = app === "A앱" ? 35 : app === "B앱" ? 22 : 15;
    const post = Math.round(Math.max(pre, pre + normal(rnd, boost, 18)));
    rows.push(`${i},${app},${pre},${post}`);
  }
  return rows.join("\n");
}

function cafeCsv(): string {
  const rnd = lcg(676767);
  const rows: string[] = ["ID,매장형태,일매출,좌석수"];
  let id = 1;
  ([["프랜차이즈", 180, 40], ["개인카페", 95, 28], ["무인", 70, 20]] as [string, number, number][]).forEach(
    ([t, m, sd]) => {
      for (let i = 0; i < 34; i++) {
        const seats = Math.round(Math.max(4, normal(rnd, 22, 8)));
        const sales = Math.round(Math.max(20, normal(rnd, m + seats * 1.2, sd)));
        rows.push(`${id++},${t},${sales},${seats}`);
      }
    },
  );
  return rows.join("\n");
}

function volunteerCsv(): string {
  const rnd = lcg(898989);
  const rows: string[] = ["ID,활동유형,참여횟수,효능감"];
  const types = ["교육", "환경", "복지"];
  for (let i = 1; i <= 110; i++) {
    const t = types[Math.floor(rnd() * types.length)];
    const n = Math.round(Math.max(0, normal(rnd, 6, 3)));
    const eff = Math.round(Math.max(1, Math.min(10, normal(rnd, 4 + n * 0.35, 1.3))));
    rows.push(`${i},${t},${n},${eff}`);
  }
  return rows.join("\n");
}

export const SAMPLE_SETS: SampleSet[] = [
  {
    id: "three-group",
    title: "수업 방식 세 가지와 성취도",
    desc: "집단 3개 · 숫자 변수 3개 — 세 집단 비교, 두 변수 관계, 한 변수 요약에 모두 쓸 수 있습니다.",
    csv: threeGroupCsv(),
  },
  {
    id: "pre-post",
    title: "같은 학생의 사전·사후 점수",
    desc: "짝지어진 두 측정 + 성별 — 전후 비교와 두 집단 비교에 쓸 수 있습니다.",
    csv: prePostCsv(),
  },
  {
    id: "category",
    title: "전공계열과 수료 여부",
    desc: "범주 변수 2개 + 만족도 — 두 범주의 관련성을 보는 데 쓸 수 있습니다.",
    csv: categoryCsv(),
  },
  {
    id: "two-group",
    title: "남·여 시험점수 비교",
    desc: "두 집단 + 공부시간 — 두 집단 비교와 상관 분석에 쓸 수 있습니다.",
    csv: twoGroupCsv(),
  },
  {
    id: "sleep-focus",
    title: "수면·집중·시험성적",
    desc: "연속 변수 3개 — 두 변수 관계와 한 변수 요약에 쓰기 좋습니다.",
    csv: sleepFocusCsv(),
  },
  {
    id: "campaign",
    title: "캠페인 노출 경로와 참여",
    desc: "범주 변수 위주 — 두 범주 관련성(카이제곱) 연습에 적합합니다.",
    csv: campaignCsv(),
  },
  {
    id: "likert",
    title: "리커트 만족도 설문",
    desc: "문항·총점 — 한 변수 요약과 문항 간 상관을 연습합니다.",
    csv: likertCsv(),
  },
  {
    id: "grade-anova",
    title: "학년별 읽기점수",
    desc: "집단 4개 — 세 집단 이상 비교(ANOVA) 연습용입니다.",
    csv: gradeAnovaCsv(),
  },
  {
    id: "workshop",
    title: "워크숍 전후 자신감",
    desc: "짝지은 사전·사후 + 소속 — 전후 비교와 집단 비교에 씁니다.",
    csv: workshopCsv(),
  },
  {
    id: "treatment",
    title: "처치·통제 집단 우울점수",
    desc: "두 집단 + 기저선 — 두 집단 비교와 공변량 감각을 익힙니다.",
    csv: treatmentCsv(),
  },
  {
    id: "fitness",
    title: "운동량·체력·스트레스",
    desc: "연속 변수 3개 — 상관·한 변수 요약에 다양하게 쓸 수 있습니다.",
    csv: fitnessCsv(),
  },
  {
    id: "turnover",
    title: "근무형태와 이직의향",
    desc: "범주 변수 3개 — 두 범주 관련성 연습에 적합합니다.",
    csv: turnoverCsv(),
  },
  {
    id: "region",
    title: "지역별 소득과 교육연수",
    desc: "집단 3개 + 연속 변수 — ANOVA·상관을 함께 연습합니다.",
    csv: regionCsv(),
  },
  {
    id: "diet",
    title: "식단 유형과 체중 변화",
    desc: "집단 3개 · 칼로리 — ANOVA와 상관 연습용입니다.",
    csv: dietCsv(),
  },
  {
    id: "device",
    title: "기기 종류와 구매 여부",
    desc: "범주 변수 + 연령 — 카이제곱·두 집단 비교에 씁니다.",
    csv: deviceCsv(),
  },
  {
    id: "tutoring",
    title: "과외 여부와 성적 변화",
    desc: "사전·사후 + 집단 — 짝비교와 두 집단 비교에 씁니다.",
    csv: tutoringCsv(),
  },
  {
    id: "climate",
    title: "도시별 기온과 전력 사용",
    desc: "집단 4개 · 연속 변수 — ANOVA·상관 연습용입니다.",
    csv: climateCsv(),
  },
  {
    id: "reading",
    title: "독서 시간과 어휘 점수",
    desc: "연속 변수 + 학년 — 상관·집단 비교에 씁니다.",
    csv: readingCsv(),
  },
  {
    id: "hospital",
    title: "진료과와 재방문 여부",
    desc: "범주 변수 + 만족도 — 카이제곱 연습에 적합합니다.",
    csv: hospitalCsv(),
  },
  {
    id: "commute",
    title: "통근 수단과 스트레스",
    desc: "집단 4개 · 시간 — ANOVA와 상관을 함께 연습합니다.",
    csv: commuteCsv(),
  },
  {
    id: "language",
    title: "학습 앱과 토익 점수",
    desc: "사전·사후 + 앱 유형 — 짝비교·ANOVA에 씁니다.",
    csv: languageCsv(),
  },
  {
    id: "cafe",
    title: "카페 형태와 일매출",
    desc: "집단 3개 · 좌석수 — ANOVA·상관 연습용입니다.",
    csv: cafeCsv(),
  },
  {
    id: "volunteer",
    title: "봉사 유형과 효능감",
    desc: "범주 + 횟수·효능감 — 상관·집단 비교에 씁니다.",
    csv: volunteerCsv(),
  },
  {
    id: "exam-prep",
    title: "준비 시간과 합격 점수",
    desc: "연속 변수 2개 + 반 — 상관·집단 비교 연습용입니다.",
    csv: (() => {
      const rnd = lcg(111222);
      const rows: string[] = ["ID,준비시간,합격점수,반"];
      for (let i = 1; i <= 100; i++) {
        const hours = round1(Math.max(0, normal(rnd, 80, 25)));
        const score = Math.round(Math.max(0, normal(rnd, 40 + hours * 0.35, 12)));
        const ban = ["A반", "B반", "C반"][Math.floor(rnd() * 3)];
        rows.push(`${i},${hours},${score},${ban}`);
      }
      return rows.join("\n");
    })(),
  },
];

/** 기본통계 연습 카드에 쓸 개수(16) · 시각화는 전체(24)를 씁니다. */
export const STATS_PRACTICE_SETS = SAMPLE_SETS.slice(0, 16);
export const VIZ_PRACTICE_SETS = SAMPLE_SETS;
