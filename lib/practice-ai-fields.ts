/**
 * 프로젝트 실습 — 단계·태스크별 상세 AI 기입란
 * (쉬운 예시 · 용어 설명 · 기입 안내 포함)
 */
import type { ArchetypeFormField } from "@/lib/archetype-data";
import type { PracticeTask, PracticeTopic } from "@/lib/archetype-data";

function f(
  key: string,
  label: string,
  opts: Partial<ArchetypeFormField> & { example: string; hint: string }
): ArchetypeFormField {
  return {
    key,
    label,
    type: opts.type || "textarea",
    placeholder: opts.placeholder || opts.example,
    example: opts.example,
    gloss: opts.gloss,
    hint: opts.hint,
  };
}

const STAGE_FIELDS: Record<number, ArchetypeFormField[]> = {
  0: [
    f("research_question", "연구질문(Research Question)", {
      hint: "이번 연구에서 답을 내고 싶은 핵심 질문을 한두 문장으로 적습니다.",
      example: "예: 광고노출 빈도가 브랜드 상기도에 정(+)의 영향을 미치는가?",
      gloss: "연구질문: 연구가 답하려는 중심 물음입니다.",
    }),
    f("hypothesis", "가설·명제(Hypothesis)", {
      hint: "검증하거나 탐구할 명제(H1 등)를 적습니다. 질적이면 ‘탐구 초점’으로 바꿔 적어도 됩니다.",
      example: "예: H1 — 광고노출 빈도가 상기도에 정(+)의 영향",
      gloss: "가설: 검증 가능한 예상 관계입니다.",
    }),
    f("population", "모집단·대상(Population)", {
      hint: "누구에게/어디에 대해 말할 연구인지 경계를 적습니다.",
      example: "예: 최근 6개월 내 해당 카테고리 구매 경험 성인 20–59세",
      gloss: "모집단: 결과를 일반화하고 싶은 전체 집단입니다.",
    }),
    f("sample_plan", "표본·표집 계획(Sampling)", {
      hint: "몇 명/몇 건을 어떻게 뽑을지(표집방법·목표 n)를 적습니다.",
      example: "예: 층화임의표집 n=1,200 · CATI+CAWI 혼합",
      gloss: "표집: 모집단에서 실제 조사·관찰할 일부를 고르는 방법입니다.",
    }),
    f("instruments", "수집 도구·자료원(Instruments/Sources)", {
      hint: "설문·면담가이드·관찰지·문헌DB·코퍼스 등 무엇을 쓰는지 적습니다.",
      example: "예: 상기도·선호도 5점 척도 12문항 + 인구통계 6문항",
    }),
    f("ethics", "윤리·동의·개인정보(Ethics)", {
      hint: "동의, 익명, 민감정보, IRB/내부승인 여부를 적습니다.",
      example: "예: 온라인 동의 체크 · 개인식별정보 미수집 · 내부 IRB 면제",
      gloss: "동의(informed consent): 참여자가 목적·위험을 알고 참여에 동의하는 절차입니다.",
    }),
    f("collection_log", "수집 일정·로그(Collection Log)", {
      hint: "수집 기간, 담당, 파일럿 여부를 적습니다.",
      example: "예: 2026-03-01~03-21 · 파일럿 30명 후 본조사",
      type: "text",
    }),
  ],
  1: [
    f("raw_status", "원자료 상태(Raw Data Status)", {
      hint: "받은 파일 형식, 건수, 누락·오류가 눈에 띄는지 적습니다.",
      example: "예: CAWI CSV 1,240행 · 중복 12 · 핵심문항 결측 3%",
    }),
    f("cleaning_rules", "정제 규칙(Cleaning Rules)", {
      hint: "제외·수정·이상치 처리 규칙을 구체적으로 적습니다.",
      example: "예: 전체 동일응답·응답시간<60초 제외 · 역채점 문항 재코딩",
      gloss: "정제: 분석 전에 오류·중복·부적합 케이스를 걸러 자료를 정리하는 단계입니다.",
    }),
    f("missing", "결측치 처리(Missing Values)", {
      hint: "결측을 어떻게 다룰지(완전사례/대치/표시) 적습니다.",
      example: "예: 핵심변수 결측 케이스 제외(CCA) · 인구통계 결측은 ‘무응답’ 코드",
      gloss: "결측치: 비어 있어 값이 없는 칸입니다.",
    }),
    f("transform", "변환·파생변수(Transform/Derived)", {
      hint: "합산점수, 가중치, 범주 묶기 등 만든 변수를 적습니다.",
      example: "예: att_mean=(A1+A2+A3)/3 · weight=성·연령 사후층화",
      gloss: "파생변수: 원문항을 합치거나 계산해 새로 만든 변수입니다.",
    }),
    f("qc_check", "품질점검(QC Checklist)", {
      hint: "이중확인·버전·백업 여부를 적습니다.",
      example: "예: 정제 전·후 n 대조 · analysis_log.txt 기록 · 원본 백업",
      type: "text",
    }),
  ],
  2: [
    f("unit", "코딩 단위(Coding Unit)", {
      hint: "무엇을 한 줄/한 코드로 볼지(문항·발화·문단·사건) 적습니다.",
      example: "예: 면담 의미단위(문장~짧은 절) / 또는 설문 문항→변수",
      gloss: "코딩 단위: 코드를 붙이는 최소 덩어리입니다.",
    }),
    f("codebook", "코드북·변수사전(Codebook)", {
      hint: "코드/변수 이름, 정의, 포함·제외 예를 적습니다.",
      example: "예: T01 연결/단절 — ‘화면만…’ 포함, 단순 기기불만은 제외",
      gloss: "코드북: 코드 정의·예시를 모아 둔 사전입니다.",
    }),
    f("scheme", "코딩체계·척도(Scheme/Scale)", {
      hint: "주제코드 목록 또는 척도(1–5 등) 규칙을 적습니다.",
      example: "예: 5점 Likert(1=전혀 아니다~5=매우 그렇다) · 역채점 2문항",
    }),
    f("reliability", "신뢰·합의(Reliability/Agreement)", {
      hint: "이중코딩·α·Kappa 등 품질 지표 계획을 적습니다.",
      example: "예: 표본 20% 이중코딩 · Cohen κ≥.60 목표 · α≥.70",
      gloss: "신뢰도: 같은 절차를 반복해도 결과가 흔들리지 않는 정도입니다.",
    }),
    f("coding_memo", "경계·난해 메모(Boundary Notes)", {
      hint: "애매한 케이스·합의 결과를 적습니다.",
      example: "예: ‘가격’ 언급은 T02와 T03 중 T02로 합의(2026-03-10)",
    }),
  ],
  3: [
    f("dv_iv", "종속·독립/핵심 변수(DV/IV)", {
      hint: "결과변수와 설명·비교 변수를 적습니다.",
      example: "예: DV=상기도(composite_score) · IV=광고노출 빈도(저/중/고)",
      gloss: "종속변수(DV): 설명하려는 결과. 독립변수(IV): 원인·예측으로 두는 변수.",
    }),
    f("descriptives", "기술통계 계획(Descriptives)", {
      hint: "평균·SD·빈도 등 먼저 볼 요약을 적습니다.",
      example: "예: 전체·성별·연령대별 M·SD·95% CI · D01~D05 빈도표",
      gloss: "기술통계: 자료를 숫자로 요약해 보여주는 통계(평균·빈도 등)입니다.",
    }),
    f("assumptions", "가정 검토(Assumptions)", {
      hint: "정규성·등분산·다중공선성 등 무엇을 점검할지 적습니다.",
      example: "예: Shapiro–Wilk, Levene, VIF<5 · 위반 시 Welch t",
      gloss: "가정: t·ANOVA·회귀 등을 쓰기 전에 자료가 만족해야 하는 조건입니다.",
    }),
    f("tests", "분석기법·모형(Tests/Models)", {
      hint: "t/ANOVA/회귀/SEM 또는 질적 주제 빈도 보조 등 실제 기법을 적습니다.",
      example: "예: 일원 ANOVA(노출 3수준) + 사후 Tukey · η² 보고",
    }),
    f("alpha_es", "유의수준·효과크기(α / Effect Size)", {
      hint: "α와 보고할 효과크기 지표를 적습니다.",
      example: "예: α=.05 · 효과크기 η² 또는 Cohen’s d",
      gloss: "p값: 우연으로 이런 결과가 나올 가능성. 효과크기: 차이가 얼마나 큰지.",
      type: "text",
    }),
    f("software", "소프트웨어·옵션(Software)", {
      hint: "사용할 프로그램과 메뉴/패키지를 적습니다.",
      example: "예: SPSS Analyze→GLM / 또는 R aov + emmeans",
      type: "text",
    }),
  ],
  4: [
    f("key_findings", "주요 발견(Key Findings)", {
      hint: "숫자·주제·패턴을 연구질문에 연결해 적습니다.",
      example: "예: 고노출군 상기도 M이 저노출보다 높음(η²=.06, p<.01)",
    }),
    f("interpretation", "해석(Interpretation)", {
      hint: "왜 그런 결과가 나왔는지, 실무·이론 함의를 적습니다.",
      example: "예: 반복 노출이 인지도 경로를 강화한 것으로 해석(단, 인과 단정 주의)",
    }),
    f("convergence", "합치·불일치(Convergence/Divergence)", {
      hint: "질·양 또는 여러 증거가 맞는지/어긋나는지 적습니다(해당 시).",
      example: "예: 설문 상기도↑와 면담 ‘광고 장면 기억’ 서사가 합치",
      gloss: "합치도: 서로 다른 자료·결과가 같은 방향을 가리키는 정도입니다.",
    }),
    f("limitations", "한계(Limitations)", {
      hint: "표집·측정·설계 한계를 솔직히 적습니다.",
      example: "예: 자기보고 편향 · 단면설계로 인과 제한 · 특정 지역 표본",
    }),
    f("implications", "함의·다음 단계(Implications)", {
      hint: "실무 제안과 후속 분석을 적습니다.",
      example: "예: 고빈도 노출 구간 예산 우선 · 다음 분기 추적조사로 재검증",
    }),
  ],
  5: [
    f("deliverable_title", "산출물 제목(Deliverable Title)", {
      hint: "보고서·지침서·패키지 이름을 적습니다.",
      example: "예: 브랜드 추적조사 통계결과 보고서 v1.0",
      type: "text",
    }),
    f("package_list", "포함 파일·구성(Package Contents)", {
      hint: "표·그림·코드북·로그 등 넣을 목록을 적습니다.",
      example: "예: report.docx · tables.xlsx · figA–C.png · codebook.xlsx · log.txt",
    }),
    f("audience", "독자·용도(Audience)", {
      hint: "누가 읽고 어디에 쓸지 적습니다.",
      example: "예: 마케팅팀 내부 보고 · 학술 포스터 초안",
      type: "text",
    }),
    f("repro", "재현 정보(Reproducibility)", {
      hint: "데이터 버전, 소프트웨어, 시드/옵션을 적습니다.",
      example: "예: data_clean_v3.csv · SPSS 29 · 분석일 2026-03-25",
      gloss: "재현성: 다른 사람이 같은 절차로 같은 결과를 다시 낼 수 있는지입니다.",
    }),
    f("checklist", "최종 점검(Checklist)", {
      hint: "연구질문 정합·수치 검산·윤리·한계 명시를 체크합니다.",
      example: "예: ☐ RQ정합 ☐ 표·그림 캡션 ☐ 한계 ☐ 개인정보 제거",
    }),
  ],
};

/** 태스크 라벨 키워드로 추가 기입란 */
function taskExtraFields(taskLabel: string): ArchetypeFormField[] {
  const t = taskLabel;
  const extra: ArchetypeFormField[] = [];
  if (/모집단|표본|표집/.test(t)) {
    extra.push(
      f("frame", "표집틀(Sampling Frame)", {
        hint: "실제 뽑을 명부·패널·목록을 적습니다.",
        example: "예: ○○패널 성인 DB · 지역×성×연령 할당표",
        gloss: "표집틀: 표본을 뽑는 데 쓰는 명단·목록입니다.",
        type: "text",
      })
    );
  }
  if (/신뢰도|타당도|α|Cronbach|Kappa/.test(t)) {
    extra.push(
      f("scale_items", "척도 문항 구성(Scale Items)", {
        hint: "몇 문항으로 어떤 개념을 재는지 적습니다.",
        example: "예: 상기도 4문항 · 선호도 3문항",
      })
    );
  }
  if (/회귀|ANOVA|t검정|상관|SEM|요인/.test(t)) {
    extra.push(
      f("model_spec", "모형 명세(Model Spec)", {
        hint: "식·요인·공변량을 적습니다.",
        example: "예: score ~ exposure + age + gender",
      })
    );
  }
  if (/면담|전사|주제코딩|코드/.test(t)) {
    extra.push(
      f("quote_plan", "대표 발화·인용 계획(Quote Plan)", {
        hint: "어떤 인용을 결과에 붙일지 기준을 적습니다.",
        example: "예: 주제당 2개 인용 · 화자 ID 익명",
      })
    );
  }
  if (/통합|meta|side-by-side|합치/.test(t)) {
    extra.push(
      f("joint_plan", "통합표 계획(Joint Display)", {
        hint: "질·양을 나란히 놓을 칸 구성을 적습니다.",
        example: "예: 개념 | 양적결과 | 질적결과 | 판정(합치/불일치)",
      })
    );
  }
  return extra;
}

export function buildPracticeAiFields(
  stageIndex: number,
  task: PracticeTask,
  topic: PracticeTopic
): ArchetypeFormField[] {
  const base = STAGE_FIELDS[stageIndex] || STAGE_FIELDS[0];
  const extras = taskExtraFields(task.label || task.detail || "");
  // topic context as first read-only-ish helper field (still editable)
  const ctx: ArchetypeFormField = f("my_topic_title", "내 프로젝트 주제명", {
    hint: "샘플 주제와 같은 급으로, 내 실제 주제를 적습니다.",
    example: `샘플 참고: 「${topic.title}」 → 내 주제로 바꿔 쓰기`,
    type: "text",
  });
  // dedupe by key
  const seen = new Set<string>();
  const out: ArchetypeFormField[] = [];
  for (const field of [ctx, ...base, ...extras]) {
    if (seen.has(field.key)) continue;
    seen.add(field.key);
    out.push(field);
  }
  return out;
}
