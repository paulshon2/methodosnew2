/**
 * 방법 지도 · 큐레이션 카탈로그 (28개 방법)
 *
 * public/method-system.json 의 표(sections)는 "무엇이 있는가"를 알려 주지만
 * 인스펙터가 답해야 하는 "언제 쓰고 언제 쓰지 않는가 · 표본 기준 · 타당도 위험"까지는
 * 표 형식으로 담기지 않는다. 그 부분을 여기에 정리해 두고
 * lib/method-system-normalize.ts 가 두 자료를 합친다.
 *
 * 연도(year)는 최초 제안 시점이 아니라 그 방법이 표준으로 통용되기 시작한 시점이다.
 * 이 파일은 손으로 관리한다. 자동 생성하지 말 것.
 */

export type Approach = "quant" | "qual" | "mixed";
export type Purpose = "탐색" | "기술" | "설명" | "평가";
export type DataKind = "수치" | "텍스트" | "관찰" | "기존";
export type Level = 1 | 2 | 3;

export type ProcessStep = { title: string; desc: string; checks: string[] };

export type Method = {
  id: string;
  name: string;
  en: string;
  approach: Approach;
  family: string;
  year: number;
  level: Level;
  purpose: Purpose[];
  data: DataKind[];
  def: string;
  use: string[];
  no: string[];
  sample: string;
  analysis: string;
  risks: string[];
  related: string[];
  lit: string;
  /** 계보상 부모 방법의 id. 뿌리면 null. */
  from: string | null;
  process: ProcessStep[];
};

export type ApproachProfile = {
  ko: string;
  en: string;
  tag: string;
  belief: string;
  q: string;
  evidence: string;
  sample: string;
  role: string;
  out: string;
  risk: string;
};

export type ValidityBlock = {
  title: string;
  approach: Approach | "common";
  items: { name: string; what: string; how: string }[];
};

export const APPROACH_PROFILE: Record<Approach, ApproachProfile> = {
  "quant": {
    "ko": "양적",
    "en": "Quantitative",
    "tag": "수를 세어 크기와 관계를 확인한다",
    "belief": "현상에는 관찰 가능한 규칙이 있고, 측정하면 드러난다",
    "q": "얼마나? 어느 쪽이 더? 무엇이 무엇을 얼마나 일으키는가?",
    "evidence": "반복 측정 가능한 수치, 통계적 유의성",
    "sample": "모집단을 대표하는 확률표본 (보통 수백~수천)",
    "role": "연구자는 대상과 거리를 둔다 (관찰자)",
    "out": "모집단으로의 일반화",
    "risk": "맥락과 의미가 지워진다"
  },
  "qual": {
    "ko": "질적",
    "en": "Qualitative",
    "tag": "의미와 맥락을 두껍게 기술한다",
    "belief": "현실은 사람들이 상호작용 속에서 구성한 것이다",
    "q": "어떻게 경험하는가? 그것은 이들에게 무슨 뜻인가?",
    "evidence": "참여자의 언어, 두꺼운 기술, 반복 확인된 패턴",
    "sample": "의도적 표본 (보통 6~30명, 포화될 때까지)",
    "role": "연구자 자신이 도구다 (참여자)",
    "out": "유사 맥락으로의 전이 가능성",
    "risk": "연구자 편향, 재현 곤란"
  },
  "mixed": {
    "ko": "혼합",
    "en": "Mixed Methods",
    "tag": "수와 이야기를 의도적으로 결합한다",
    "belief": "한 종류의 증거만으로는 답할 수 없는 질문이 있다",
    "q": "무엇이 일어났고(양) 왜 그랬는가(질)?",
    "evidence": "두 갈래 자료의 수렴 또는 유의미한 불일치",
    "sample": "단계별로 다름 (양적 대표표본 + 질적 하위표본)",
    "role": "단계마다 위치를 바꾼다",
    "out": "설명의 깊이 + 일반화 가능성",
    "risk": "시간·비용 2배, 통합 실패 시 두 편의 별개 논문이 됨"
  }
};

export const LEVEL_LABEL: Record<Level, string> = {
  1: "입문(학부)",
  2: "중급(석사)",
  3: "고급(전문 훈련)",
};

export const MAP_METHODS: Method[] = [
  {
    "id": "rct",
    "name": "무작위 통제 실험",
    "en": "Randomized Controlled Trial",
    "approach": "quant",
    "family": "실험 설계",
    "year": 1935,
    "level": 3,
    "purpose": [
      "설명",
      "평가"
    ],
    "data": [
      "수치"
    ],
    "def": "참가자를 무작위로 처치집단과 통제집단에 배정한 뒤 결과 차이를 비교해, 그 차이가 처치 때문임을 주장하는 설계입니다. 인과 추론의 기준선입니다.",
    "use": [
      "개입·프로그램의 효과를 인과적으로 주장해야 할 때",
      "무작위 배정이 윤리적·현실적으로 가능할 때",
      "결과를 수치로 잴 수 있을 때"
    ],
    "no": [
      "이미 벌어진 일을 되돌아볼 때",
      "배정 자체가 비윤리적일 때(예: 유해 노출)",
      "표본이 30명 미만으로 매우 작을 때"
    ],
    "sample": "집단당 최소 30명, 검정력 .80 기준 사전 표본수 계산 필수",
    "analysis": "독립표본 t-검정 · ANCOVA · 반복측정 ANOVA · 혼합효과모형",
    "risks": [
      "처치 확산",
      "탈락(중도 이탈)",
      "실험자 기대 효과",
      "외적 타당도 저하"
    ],
    "related": [
      "quasi",
      "preexp",
      "fieldexp"
    ],
    "lit": "Fisher(1935); Shadish, Cook & Campbell(2002)",
    "from": null,
    "process": [
      {
        "title": "연구가설과 결과변수 확정",
        "desc": "무엇이 좋아졌다고 할 것인지 단 하나의 주요 결과변수를 먼저 정합니다.",
        "checks": [
          "주요 결과변수 1개 + 부차 결과변수 2~3개",
          "최소 의미 있는 차이(MCID) 사전 명시",
          "사전등록(OSF·임상시험등록)"
        ]
      },
      {
        "title": "표본수 산정",
        "desc": "효과크기 가정 → 검정력 .80 → 필요 인원 도출.",
        "checks": [
          "예상 효과크기 d의 근거(선행연구·예비조사)",
          "탈락률 15~20% 가산"
        ]
      },
      {
        "title": "무작위 배정 절차 설계",
        "desc": "배정을 예측할 수 없게 만드는 것이 핵심입니다.",
        "checks": [
          "난수표·블록 무작위화",
          "배정 은폐(allocation concealment)",
          "필요 시 층화(성별·기저점수)"
        ]
      },
      {
        "title": "맹검 설계",
        "desc": "누가 무엇을 모르게 할지 정합니다.",
        "checks": [
          "참가자 맹검 / 실행자 맹검 / 평가자 맹검",
          "불가능하면 그 이유를 논문에 명시"
        ]
      },
      {
        "title": "개입 충실도 관리",
        "desc": "계획대로 실행됐는지 자체가 증거입니다.",
        "checks": [
          "처치 매뉴얼·체크리스트",
          "실행 기록 및 이탈 로그"
        ]
      },
      {
        "title": "자료 수집 및 탈락 추적",
        "desc": "",
        "checks": [
          "사전-사후 동일 도구 사용",
          "탈락자 사유 기록, CONSORT 흐름도 작성"
        ]
      },
      {
        "title": "분석 및 보고",
        "desc": "",
        "checks": [
          "배정된 대로 분석(ITT)이 원칙",
          "효과크기와 신뢰구간을 p값보다 앞세울 것",
          "CONSORT 체크리스트 준수"
        ]
      }
    ]
  },
  {
    "id": "quasi",
    "name": "준실험 설계",
    "en": "Quasi-experimental Design",
    "approach": "quant",
    "family": "실험 설계",
    "year": 1963,
    "level": 3,
    "purpose": [
      "설명",
      "평가"
    ],
    "data": [
      "수치",
      "기존"
    ],
    "def": "무작위 배정을 할 수 없는 현장에서, 이미 나뉜 집단을 비교하거나 시점 전후를 비교해 인과에 최대한 근접하려는 설계입니다.",
    "use": [
      "학교·병원·기업 등 배정 통제가 불가능한 현장",
      "정책 시행 전후를 비교할 때",
      "기존 행정자료를 쓸 때"
    ],
    "no": [
      "무작위 배정이 가능한데도 편의상 생략할 때",
      "비교집단을 도저히 구할 수 없을 때"
    ],
    "sample": "집단별 50명 이상 권장 (통계적 보정에 자유도가 필요)",
    "analysis": "이중차분법(DID) · 성향점수매칭(PSM) · 회귀불연속(RDD) · 단절시계열",
    "risks": [
      "선택 편향",
      "역사 효과",
      "성숙 효과",
      "회귀 인공물"
    ],
    "related": [
      "rct",
      "fieldexp",
      "panel"
    ],
    "lit": "Campbell & Stanley(1963); Shadish et al.(2002)",
    "from": "rct",
    "process": [
      {
        "title": "비교집단 확보 전략 결정",
        "desc": "무작위가 없으므로 “왜 이 집단이 비교 대상으로 타당한가”를 논증해야 합니다.",
        "checks": [
          "자연적 비교집단 / 매칭 / 회귀불연속 중 택1",
          "기저 동등성 검토표 필수"
        ]
      },
      {
        "title": "사전 측정 확보",
        "desc": "전후 비교의 생명은 사전 자료입니다.",
        "checks": [
          "처치 이전 최소 2시점 확보 시 시계열 분석 가능"
        ]
      },
      {
        "title": "선택 편향 보정 설계",
        "desc": "",
        "checks": [
          "공변량 목록 사전 확정",
          "성향점수 매칭 시 균형 진단(SMD<0.1)"
        ]
      },
      {
        "title": "위협 요인 목록화",
        "desc": "",
        "checks": [
          "Campbell의 내적타당도 위협 8종을 하나씩 검토·반박"
        ]
      },
      {
        "title": "분석",
        "desc": "",
        "checks": [
          "DID: 평행추세 가정 검증 그래프 필수",
          "민감도 분석으로 결론 견고성 확인"
        ]
      },
      {
        "title": "한계 명시",
        "desc": "",
        "checks": [
          "“인과”라는 단어의 사용 수위를 설계 강도에 맞출 것"
        ]
      }
    ]
  },
  {
    "id": "preexp",
    "name": "단일집단 사전사후",
    "en": "One-group Pretest-Posttest",
    "approach": "quant",
    "family": "실험 설계",
    "year": 1963,
    "level": 1,
    "purpose": [
      "평가"
    ],
    "data": [
      "수치"
    ],
    "def": "비교집단 없이 한 집단의 처치 전후를 비교합니다. 실행이 쉬운 대신 인과 주장 근거가 가장 약합니다.",
    "use": [
      "예비조사·타당성 확인",
      "현장 개선활동의 1차 점검"
    ],
    "no": [
      "논문에서 효과를 주장할 때(단독 사용 부적절)",
      "시간에 따라 저절로 변하는 변수"
    ],
    "sample": "20명 이상이면 실행 가능하나 결론 강도는 낮음",
    "analysis": "대응표본 t-검정 · Wilcoxon 부호순위 검정",
    "risks": [
      "성숙",
      "역사",
      "검사 효과",
      "평균회귀"
    ],
    "related": [
      "quasi",
      "rct"
    ],
    "lit": "Campbell & Stanley(1963)",
    "from": "rct",
    "process": [
      {
        "title": "목적을 “탐색”으로 한정",
        "desc": "",
        "checks": [
          "효과 “확인”이 아니라 “가능성 점검”으로 서술"
        ]
      },
      {
        "title": "동일 도구·동일 조건 사전사후 측정",
        "desc": "",
        "checks": [
          "검사 효과를 줄이려면 동형검사 사용"
        ]
      },
      {
        "title": "대안 설명 기록",
        "desc": "",
        "checks": [
          "같은 기간 벌어진 외부 사건 로그"
        ]
      },
      {
        "title": "결과 보고",
        "desc": "",
        "checks": [
          "효과크기 보고, 인과 표현 자제"
        ]
      }
    ]
  },
  {
    "id": "fieldexp",
    "name": "현장 실험",
    "en": "Field Experiment",
    "approach": "quant",
    "family": "실험 설계",
    "year": 1990,
    "level": 3,
    "purpose": [
      "설명",
      "평가"
    ],
    "data": [
      "수치"
    ],
    "def": "실제 생활 현장에서 무작위 배정을 실행하는 실험입니다. 외적 타당도가 높습니다.",
    "use": [
      "정책·마케팅의 실제 반응을 볼 때",
      "대규모 온라인 A/B 테스트"
    ],
    "no": [
      "처치 통제가 전혀 안 되는 환경",
      "윤리 승인이 어려운 조작"
    ],
    "sample": "효과크기가 작아 수천 단위가 필요한 경우가 많음",
    "analysis": "회귀분석 · 군집 보정 표준오차 · 다층모형",
    "risks": [
      "처치 확산",
      "군집 내 상관 무시",
      "현장 이탈"
    ],
    "related": [
      "rct",
      "quasi"
    ],
    "lit": "Gerber & Green(2012)",
    "from": "rct",
    "process": [
      {
        "title": "현장 파트너와 실행 범위 합의",
        "desc": "",
        "checks": [
          "중단 조건·윤리 절차 문서화"
        ]
      },
      {
        "title": "군집 단위 결정",
        "desc": "",
        "checks": [
          "개인 배정 vs 학급·매장 단위 배정",
          "군집 배정 시 ICC 고려한 표본수 재계산"
        ]
      },
      {
        "title": "실행 및 모니터링",
        "desc": "",
        "checks": [
          "오염(통제집단이 처치 접함) 감시"
        ]
      },
      {
        "title": "분석",
        "desc": "",
        "checks": [
          "군집 보정 표준오차 필수"
        ]
      }
    ]
  },
  {
    "id": "survey",
    "name": "횡단 설문조사",
    "en": "Cross-sectional Survey",
    "approach": "quant",
    "family": "조사 연구",
    "year": 1940,
    "level": 1,
    "purpose": [
      "기술",
      "설명"
    ],
    "data": [
      "수치"
    ],
    "def": "한 시점에 모집단 표본에게 같은 문항을 물어, 분포와 변수 간 관계를 파악합니다.",
    "use": [
      "현황·실태 파악",
      "태도·인식의 분포 확인",
      "변수 간 상관 탐색"
    ],
    "no": [
      "인과 방향을 주장할 때",
      "변화 추이를 볼 때(→ 종단 필요)"
    ],
    "sample": "모집단 무한 가정 시 95% 신뢰수준·±5%p → 385명",
    "analysis": "기술통계 · 교차분석 · 상관 · 중회귀 · 구조방정식",
    "risks": [
      "표본 편향",
      "무응답 편향",
      "공통방법편의",
      "사회적 바람직성"
    ],
    "related": [
      "panel",
      "delphi",
      "sem"
    ],
    "lit": "Dillman et al.(2014); Groves et al.(2009)",
    "from": null,
    "process": [
      {
        "title": "구성개념 정의",
        "desc": "재려는 것이 무엇인지 문장으로 먼저 씁니다.",
        "checks": [
          "개념 정의 → 하위영역 → 문항 순서",
          "기존 검증 척도 우선 검토(신규 개발은 최후)"
        ]
      },
      {
        "title": "표집틀·표집 방법 결정",
        "desc": "",
        "checks": [
          "확률표집 가능 여부 판단",
          "불가하면 한계를 명시하고 가중치 계획"
        ]
      },
      {
        "title": "문항 작성",
        "desc": "",
        "checks": [
          "이중질문·유도질문·전문용어 제거",
          "척도 방향 통일, 역문항은 최소한만"
        ]
      },
      {
        "title": "예비조사(Pilot)",
        "desc": "",
        "checks": [
          "30명 내외 인지면접",
          "소요시간 측정, 15분 초과 시 탈락률 급증"
        ]
      },
      {
        "title": "본조사 실시",
        "desc": "",
        "checks": [
          "응답률 제고: 사전 안내 → 본 발송 → 2회 독촉"
        ]
      },
      {
        "title": "자료 정제",
        "desc": "",
        "checks": [
          "불성실 응답 탐지(직선 응답·초단시간)",
          "결측 패턴 확인 후 처리 방식 결정"
        ]
      },
      {
        "title": "분석·보고",
        "desc": "",
        "checks": [
          "무응답 편향 검토 결과를 반드시 보고"
        ]
      }
    ]
  },
  {
    "id": "panel",
    "name": "종단 패널 조사",
    "en": "Longitudinal Panel Study",
    "approach": "quant",
    "family": "조사 연구",
    "year": 1968,
    "level": 3,
    "purpose": [
      "설명",
      "기술"
    ],
    "data": [
      "수치",
      "기존"
    ],
    "def": "동일 대상을 반복 추적 측정해 시간에 따른 변화와 선후 관계를 봅니다.",
    "use": [
      "발달·변화 궤적 파악",
      "시간 선행성을 통한 인과 근접"
    ],
    "no": [
      "단기 프로젝트",
      "추적 관리 자원이 없을 때"
    ],
    "sample": "초기 표본에 예상 탈락률(연 10~20%) 반영해 여유 확보",
    "analysis": "잠재성장모형 · 다층 성장모형 · 교차지연 패널모형 · 고정효과모형",
    "risks": [
      "표본 마모",
      "패널 조건화",
      "측정 불변성 위배"
    ],
    "related": [
      "survey",
      "quasi",
      "sem"
    ],
    "lit": "Singer & Willett(2003)",
    "from": "survey",
    "process": [
      {
        "title": "측정 시점 설계",
        "desc": "",
        "checks": [
          "변화가 일어나는 속도에 맞춘 간격",
          "최소 3시점(2시점은 곡선을 못 봄)"
        ]
      },
      {
        "title": "측정 불변성 계획",
        "desc": "",
        "checks": [
          "시점 간 동일 문항·동일 방식 고정"
        ]
      },
      {
        "title": "추적 관리 체계",
        "desc": "",
        "checks": [
          "연락처 다중 확보, 소액 인센티브"
        ]
      },
      {
        "title": "탈락 분석",
        "desc": "",
        "checks": [
          "탈락자-잔존자 기저 비교 필수"
        ]
      },
      {
        "title": "성장모형 분석",
        "desc": "",
        "checks": [
          "무조건 모형 → 조건 모형 순서"
        ]
      }
    ]
  },
  {
    "id": "delphi",
    "name": "델파이",
    "en": "Delphi Method",
    "approach": "mixed",
    "family": "합의 형성",
    "year": 1959,
    "level": 2,
    "purpose": [
      "탐색",
      "평가"
    ],
    "data": [
      "수치",
      "텍스트"
    ],
    "def": "전문가 패널에게 익명으로 여러 라운드 설문을 돌려, 피드백을 주며 의견을 수렴시킵니다.",
    "use": [
      "자료가 없는 미래·신규 영역",
      "전문가 합의로 지표·기준을 만들 때"
    ],
    "no": [
      "일반 대중의 의견이 필요한 주제",
      "객관 데이터가 이미 충분할 때"
    ],
    "sample": "동질 패널 10~18명, 이질 패널 20~30명",
    "analysis": "중앙값·사분위범위 · 내용타당도비율(CVR) · 수렴도(변동계수)",
    "risks": [
      "패널 구성 편향",
      "라운드 간 탈락",
      "다수 동조 압력"
    ],
    "related": [
      "survey",
      "ca",
      "fgi"
    ],
    "lit": "Dalkey & Helmer(1963); Linstone & Turoff(1975)",
    "from": "survey",
    "process": [
      {
        "title": "패널 선정 기준 명문화",
        "desc": "전문가의 “전문성”을 정의하는 것이 최대 쟁점입니다.",
        "checks": [
          "경력·업적·현직 여부 등 자격 요건 표",
          "다양성 확보(학계/현장/정책)"
        ]
      },
      {
        "title": "1라운드: 개방형",
        "desc": "",
        "checks": [
          "자유 기술로 항목 풀 생성"
        ]
      },
      {
        "title": "2라운드: 구조화 평정",
        "desc": "",
        "checks": [
          "1라운드 응답을 문항화, 리커트 평정"
        ]
      },
      {
        "title": "3라운드: 피드백 후 재평정",
        "desc": "",
        "checks": [
          "각자 이전 응답 + 패널 중앙값 제시",
          "이탈 의견은 이유 기술 요청"
        ]
      },
      {
        "title": "합의 기준 판정",
        "desc": "",
        "checks": [
          "사전에 정한 기준(예: CVR≥.49, IQR≤1)으로 종료 판단"
        ]
      }
    ]
  },
  {
    "id": "corr",
    "name": "상관 연구",
    "en": "Correlational Study",
    "approach": "quant",
    "family": "관계 분석",
    "year": 1900,
    "level": 1,
    "purpose": [
      "기술",
      "탐색"
    ],
    "data": [
      "수치",
      "기존"
    ],
    "def": "조작 없이 변수들이 함께 변하는 정도를 봅니다. 관계의 존재와 강도를 말할 뿐 원인을 말하지 않습니다.",
    "use": [
      "변수 간 관련성 1차 확인",
      "예측 모형의 기초"
    ],
    "no": [
      "인과를 주장할 때",
      "제3변수 통제가 필수인 주제"
    ],
    "sample": "r=.30 탐지 시 약 85명, r=.20이면 약 195명",
    "analysis": "Pearson·Spearman 상관 · 편상관 · 중회귀",
    "risks": [
      "제3변수(허위상관)",
      "범위 축소",
      "비선형 관계 간과"
    ],
    "related": [
      "survey",
      "sem",
      "ml"
    ],
    "lit": "Pearson(1896); Cohen(1988)",
    "from": null,
    "process": [
      {
        "title": "변수 조작적 정의",
        "desc": "",
        "checks": [
          "각 변수의 측정 도구와 단위 명시"
        ]
      },
      {
        "title": "산점도 먼저 그리기",
        "desc": "상관계수보다 그림이 먼저입니다.",
        "checks": [
          "비선형·이상치 확인 후 계수 계산"
        ]
      },
      {
        "title": "가정 점검",
        "desc": "",
        "checks": [
          "선형성·정규성·등분산성",
          "위배 시 Spearman 등 대안"
        ]
      },
      {
        "title": "통제변수 투입",
        "desc": "",
        "checks": [
          "편상관 또는 위계적 회귀"
        ]
      },
      {
        "title": "해석 수위 관리",
        "desc": "",
        "checks": [
          "“관련이 있다”까지만. “영향을 준다” 금지"
        ]
      }
    ]
  },
  {
    "id": "sem",
    "name": "구조방정식 모형",
    "en": "Structural Equation Modeling",
    "approach": "quant",
    "family": "관계 분석",
    "year": 1973,
    "level": 3,
    "purpose": [
      "설명"
    ],
    "data": [
      "수치"
    ],
    "def": "직접 측정할 수 없는 잠재변수들 사이의 관계를 측정오차를 반영한 채 동시에 추정합니다.",
    "use": [
      "이론적 인과 모형 검증",
      "매개·조절 효과의 동시 추정",
      "측정모형 타당화"
    ],
    "no": [
      "탐색적으로 아무 경로나 그려볼 때",
      "표본이 150 미만일 때"
    ],
    "sample": "추정 모수당 10~20명, 통상 200명 이상 권장",
    "analysis": "확인적 요인분석(CFA) → 구조모형 → 부트스트랩 매개효과",
    "risks": [
      "모형 동치성",
      "과적합(수정지수 남용)",
      "측정모형 부실"
    ],
    "related": [
      "corr",
      "survey",
      "efa"
    ],
    "lit": "Jöreskog(1973); Kline(2023)",
    "from": "corr",
    "process": [
      {
        "title": "이론 모형 도식화",
        "desc": "자료를 보기 전에 그립니다.",
        "checks": [
          "모든 경로에 이론적 근거 문장 부착"
        ]
      },
      {
        "title": "측정모형 검증(CFA)",
        "desc": "",
        "checks": [
          "요인부하 .50 이상, AVE≥.50, CR≥.70",
          "판별타당도: √AVE > 상관"
        ]
      },
      {
        "title": "적합도 판정",
        "desc": "",
        "checks": [
          "CFI/TLI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08",
          "χ²는 표본크기에 민감하므로 단독 판단 금지"
        ]
      },
      {
        "title": "구조모형 추정",
        "desc": "",
        "checks": [
          "경로계수·표준화계수·R² 보고"
        ]
      },
      {
        "title": "매개/조절 검증",
        "desc": "",
        "checks": [
          "Sobel 대신 부트스트랩 5,000회 편의보정 신뢰구간"
        ]
      },
      {
        "title": "수정 시 원칙",
        "desc": "",
        "checks": [
          "수정지수만 보고 경로 추가 금지 — 이론 근거 필수"
        ]
      }
    ]
  },
  {
    "id": "efa",
    "name": "탐색적 요인분석",
    "en": "Exploratory Factor Analysis",
    "approach": "quant",
    "family": "관계 분석",
    "year": 1904,
    "level": 2,
    "purpose": [
      "탐색"
    ],
    "data": [
      "수치"
    ],
    "def": "여러 문항 뒤에 숨은 공통 차원을 찾아 문항을 묶습니다. 척도 개발의 첫 단계입니다.",
    "use": [
      "새 척도의 구조 탐색",
      "문항 축소"
    ],
    "no": [
      "이미 이론적 구조가 확정된 경우(→ CFA)"
    ],
    "sample": "문항당 5~10명, 최소 200명 권장",
    "analysis": "주축분해·최대우도 추출 · 사교회전(Promax) · 평행분석",
    "risks": [
      "요인수 과다/과소 추출",
      "표본 특수성",
      "회전 방법 임의 선택"
    ],
    "related": [
      "sem",
      "survey"
    ],
    "lit": "Spearman(1904); Fabrigar et al.(1999)",
    "from": "corr",
    "process": [
      {
        "title": "적합성 검토",
        "desc": "",
        "checks": [
          "KMO ≥ .60, Bartlett 유의"
        ]
      },
      {
        "title": "요인수 결정",
        "desc": "고유값>1 규칙은 과대추출 경향이 있습니다.",
        "checks": [
          "평행분석 + 스크리 도표 + 해석가능성 3중 판단"
        ]
      },
      {
        "title": "추출·회전",
        "desc": "",
        "checks": [
          "요인 간 상관 가정 시 사교회전이 기본"
        ]
      },
      {
        "title": "문항 정제",
        "desc": "",
        "checks": [
          "부하 <.40 또는 교차부하 >.32 문항 제거 검토"
        ]
      },
      {
        "title": "독립표본으로 CFA 확인",
        "desc": "",
        "checks": [
          "같은 자료로 EFA→CFA 반복은 순환논증"
        ]
      }
    ]
  },
  {
    "id": "meta",
    "name": "메타분석",
    "en": "Meta-analysis",
    "approach": "quant",
    "family": "문헌 종합",
    "year": 1976,
    "level": 3,
    "purpose": [
      "설명",
      "평가"
    ],
    "data": [
      "기존"
    ],
    "def": "같은 주제의 여러 연구 결과를 통계적으로 합성해 전체 효과크기를 추정합니다.",
    "use": [
      "상충하는 선행연구 정리",
      "전체 효과의 크기와 조절변수 확인"
    ],
    "no": [
      "연구 수가 5편 미만",
      "설계가 서로 비교 불가능할 때"
    ],
    "sample": "최소 10편 이상 권장(조절효과 분석 시 20편 이상)",
    "analysis": "랜덤효과모형 · I² 이질성 · 조절효과 메타회귀 · 깔때기 도표",
    "risks": [
      "출판 편향",
      "사과와 오렌지 문제",
      "질 낮은 연구 포함"
    ],
    "related": [
      "sysrev",
      "rct"
    ],
    "lit": "Glass(1976); Borenstein et al.(2021)",
    "from": "rct",
    "process": [
      {
        "title": "프로토콜 사전등록",
        "desc": "",
        "checks": [
          "PROSPERO 등록, PRISMA 준수"
        ]
      },
      {
        "title": "검색 전략 문서화",
        "desc": "",
        "checks": [
          "DB 목록·검색식·기간을 재현 가능하게 기록"
        ]
      },
      {
        "title": "선별 및 이중 코딩",
        "desc": "",
        "checks": [
          "2인 독립 선별, 일치도(κ) 보고"
        ]
      },
      {
        "title": "효과크기 산출",
        "desc": "",
        "checks": [
          "설계별 변환식 통일(d, g, OR 등)"
        ]
      },
      {
        "title": "이질성 검토",
        "desc": "",
        "checks": [
          "I²>50%면 랜덤효과 + 조절변수 탐색"
        ]
      },
      {
        "title": "출판편향 검토",
        "desc": "",
        "checks": [
          "깔때기 도표 + Egger 검정 + trim-and-fill"
        ]
      }
    ]
  },
  {
    "id": "sysrev",
    "name": "체계적 문헌고찰",
    "en": "Systematic Review",
    "approach": "mixed",
    "family": "문헌 종합",
    "year": 1993,
    "level": 2,
    "purpose": [
      "탐색",
      "기술"
    ],
    "data": [
      "기존"
    ],
    "def": "사전에 정한 규칙에 따라 문헌을 빠짐없이 모으고 평가해 종합합니다. 통계 합성 없이 서술로 종합할 수도 있습니다.",
    "use": [
      "특정 질문에 대한 근거 상태 정리",
      "연구 공백 규명"
    ],
    "no": [
      "주제가 너무 넓어 질문이 안 좁혀질 때"
    ],
    "sample": "해당 없음 (문헌이 표본)",
    "analysis": "PRISMA 흐름도 · 근거 질 평가(GRADE, RoB2) · 서술적 종합",
    "risks": [
      "검색 누락",
      "선별 주관성",
      "회색문헌 배제"
    ],
    "related": [
      "meta",
      "scoping"
    ],
    "lit": "Higgins & Green, Cochrane Handbook",
    "from": "meta",
    "process": [
      {
        "title": "PICO로 질문 확정",
        "desc": "",
        "checks": [
          "대상·개입·비교·결과를 문장으로"
        ]
      },
      {
        "title": "포함/배제 기준 사전 확정",
        "desc": "",
        "checks": [
          "자료 보기 전에 확정해야 편향이 줄어듭니다"
        ]
      },
      {
        "title": "다중 DB 검색",
        "desc": "",
        "checks": [
          "최소 3개 DB + 참고문헌 역추적 + 회색문헌"
        ]
      },
      {
        "title": "질 평가",
        "desc": "",
        "checks": [
          "RoB2 / ROBINS-I / MMAT 중 설계에 맞게"
        ]
      },
      {
        "title": "종합 및 근거 강도 판정",
        "desc": "",
        "checks": [
          "GRADE로 확신도 등급화"
        ]
      }
    ]
  },
  {
    "id": "gt",
    "name": "근거이론",
    "en": "Grounded Theory",
    "approach": "qual",
    "family": "이론 생성",
    "year": 1967,
    "level": 3,
    "purpose": [
      "탐색",
      "설명"
    ],
    "data": [
      "텍스트",
      "관찰"
    ],
    "def": "자료에서 출발해 개념을 만들고 범주를 엮어, 현상을 설명하는 이론을 귀납적으로 구성합니다.",
    "use": [
      "이론이 없는 새 현상",
      "과정·변화의 메커니즘 규명"
    ],
    "no": [
      "이미 강한 이론이 있고 검증이 목적일 때",
      "시간이 6개월 미만일 때"
    ],
    "sample": "이론적 표집으로 20~40명, 이론적 포화까지",
    "analysis": "개방코딩 → 축코딩 → 선택코딩 · 지속적 비교법 · 메모잉",
    "risks": [
      "이론적 포화 미달",
      "문헌 선입견",
      "코딩의 임의성"
    ],
    "related": [
      "ca",
      "phen",
      "ethno"
    ],
    "lit": "Glaser & Strauss(1967); Charmaz(2014); Corbin & Strauss(2015)",
    "from": null,
    "process": [
      {
        "title": "선행 문헌 잠정 유보",
        "desc": "자료가 먼저입니다.",
        "checks": [
          "민감 개념 수준으로만 문헌 참고",
          "전면 문헌고찰은 분석 후로 미룸"
        ]
      },
      {
        "title": "1차 면담 후 즉시 코딩",
        "desc": "수집과 분석을 번갈아 합니다.",
        "checks": [
          "줄단위 개방코딩",
          "행위·과정 중심의 동명사형 코드 권장"
        ]
      },
      {
        "title": "이론적 표집",
        "desc": "",
        "checks": [
          "떠오른 범주를 확인·반증할 다음 참여자 선택",
          "“누구를 더 만나야 하는가”를 자료가 결정"
        ]
      },
      {
        "title": "축코딩으로 범주 연결",
        "desc": "",
        "checks": [
          "조건–작용/상호작용–결과 구조로 배열"
        ]
      },
      {
        "title": "선택코딩·핵심범주 도출",
        "desc": "",
        "checks": [
          "모든 범주를 꿰는 핵심범주 1개"
        ]
      },
      {
        "title": "이론적 포화 판정",
        "desc": "",
        "checks": [
          "새 자료가 새 속성을 낳지 않을 때 종료",
          "포화 판단 근거를 논문에 기술"
        ]
      },
      {
        "title": "메모 통합 → 이론 서술",
        "desc": "",
        "checks": [
          "메모잉 기록이 곧 감사추적(audit trail)"
        ]
      }
    ]
  },
  {
    "id": "phen",
    "name": "현상학적 연구",
    "en": "Phenomenology",
    "approach": "qual",
    "family": "경험 탐구",
    "year": 1970,
    "level": 3,
    "purpose": [
      "탐색"
    ],
    "data": [
      "텍스트"
    ],
    "def": "특정 경험을 겪은 사람들의 진술에서 그 경험의 본질적 구조를 밝힙니다.",
    "use": [
      "“그 경험은 어떤 것인가”를 물을 때",
      "체험의 의미 구조 규명"
    ],
    "no": [
      "빈도·분포가 궁금할 때",
      "과정·이론 생성이 목적일 때"
    ],
    "sample": "동일 경험자 5~15명 (깊이 우선)",
    "analysis": "Giorgi 기술적 방법 · Colaizzi 절차 · IPA · van Manen 해석학적 방법",
    "risks": [
      "판단중지 실패",
      "본질 아닌 요약에 그침",
      "과잉 해석"
    ],
    "related": [
      "gt",
      "ca",
      "narr"
    ],
    "lit": "Giorgi(2009); Smith, Flowers & Larkin(2022)",
    "from": "gt",
    "process": [
      {
        "title": "연구자 전제 괄호치기(bracketing)",
        "desc": "",
        "checks": [
          "자신의 선이해를 먼저 글로 써서 분리·기록"
        ]
      },
      {
        "title": "심층 면담",
        "desc": "",
        "checks": [
          "“그때 어떠셨나요”식 개방 질문",
          "유도·해석 질문 금지"
        ]
      },
      {
        "title": "전사 후 전체 읽기",
        "desc": "",
        "checks": [
          "부분 분석 전에 전체 감각 확보"
        ]
      },
      {
        "title": "의미단위 도출",
        "desc": "",
        "checks": [
          "참여자 언어 → 연구자 언어로 변환 기록"
        ]
      },
      {
        "title": "본질 구조 통합",
        "desc": "",
        "checks": [
          "개별 구조 → 일반 구조"
        ]
      },
      {
        "title": "참여자 확인(member check)",
        "desc": "",
        "checks": [
          "본질 기술이 자기 경험과 맞는지 확인 요청"
        ]
      }
    ]
  },
  {
    "id": "ethno",
    "name": "문화기술지",
    "en": "Ethnography",
    "approach": "qual",
    "family": "현장 연구",
    "year": 1922,
    "level": 3,
    "purpose": [
      "탐색",
      "기술"
    ],
    "data": [
      "관찰",
      "텍스트"
    ],
    "def": "집단의 생활 현장에 장기간 참여하며 문화적 패턴을 두껍게 기술합니다.",
    "use": [
      "집단의 문화·규범·일상 실천을 이해할 때",
      "말과 실제 행동이 다를 가능성이 클 때"
    ],
    "no": [
      "현장 접근이 불가능할 때",
      "6개월 이상 투입이 어려울 때"
    ],
    "sample": "현장 1~2곳, 통상 6개월~수년",
    "analysis": "현장노트 · 두꺼운 기술 · 영역분석 · 주제분석",
    "risks": [
      "현지화(going native)",
      "관찰자 효과",
      "접근 권한·게이트키퍼 편향"
    ],
    "related": [
      "case",
      "gt",
      "ar"
    ],
    "lit": "Malinowski(1922); Geertz(1973); Emerson et al.(2011)",
    "from": null,
    "process": [
      {
        "title": "현장 진입 협상",
        "desc": "",
        "checks": [
          "게이트키퍼 확보, 역할과 체류 조건 합의"
        ]
      },
      {
        "title": "참여관찰 강도 설정",
        "desc": "",
        "checks": [
          "완전참여~완전관찰 스펙트럼에서 위치 결정"
        ]
      },
      {
        "title": "현장노트 이중 기록",
        "desc": "",
        "checks": [
          "현장 메모(축약) → 24시간 내 확장 노트",
          "기술/방법/성찰 노트를 분리"
        ]
      },
      {
        "title": "정보제공자 면담 병행",
        "desc": "",
        "checks": [
          "관찰로 안 보이는 의미를 채움"
        ]
      },
      {
        "title": "영역·분류 분석",
        "desc": "",
        "checks": [
          "반복 등장하는 문화 영역을 체계화"
        ]
      },
      {
        "title": "두꺼운 기술 작성",
        "desc": "",
        "checks": [
          "행위 + 맥락 + 의미를 함께 서술"
        ]
      }
    ]
  },
  {
    "id": "case",
    "name": "사례연구",
    "en": "Case Study",
    "approach": "mixed",
    "family": "현장 연구",
    "year": 1984,
    "level": 2,
    "purpose": [
      "탐색",
      "설명",
      "기술"
    ],
    "data": [
      "텍스트",
      "관찰",
      "기존",
      "수치"
    ],
    "def": "경계가 분명한 하나 또는 소수의 사례를 여러 자료원으로 깊이 있게 조사합니다.",
    "use": [
      "“어떻게·왜”를 현재 맥락 속에서 물을 때",
      "드물거나 독특한 사례",
      "복잡한 개입의 실제 작동"
    ],
    "no": [
      "통계적 일반화가 목표일 때",
      "사례 경계를 정의할 수 없을 때"
    ],
    "sample": "단일 사례 또는 다중 사례 4~10개(문자적/이론적 복제)",
    "analysis": "패턴 매칭 · 설명 구축 · 사례 간 종합 · 자료 삼각검증",
    "risks": [
      "일반화 오주장",
      "자료원 단일화",
      "경계 모호"
    ],
    "related": [
      "ethno",
      "gt",
      "ar"
    ],
    "lit": "Yin(2018); Stake(1995); Eisenhardt(1989)",
    "from": "ethno",
    "process": [
      {
        "title": "사례 경계 정의",
        "desc": "무엇이 사례 “안”이고 “밖”인지 먼저 씁니다.",
        "checks": [
          "시간·공간·조직 단위로 경계 명시"
        ]
      },
      {
        "title": "명제 또는 연구질문 설정",
        "desc": "",
        "checks": [
          "Yin: 사전 명제, Stake: 쟁점 질문"
        ]
      },
      {
        "title": "다중 자료원 설계",
        "desc": "최소 3개 자료원이 원칙입니다.",
        "checks": [
          "면담·관찰·문서·기록·산출물"
        ]
      },
      {
        "title": "사례연구 DB 구축",
        "desc": "",
        "checks": [
          "원자료–코드–해석의 연결 사슬 유지(증거 사슬)"
        ]
      },
      {
        "title": "사례 내 분석 → 사례 간 분석",
        "desc": "",
        "checks": [
          "패턴 매칭: 예측 패턴 vs 관찰 패턴"
        ]
      },
      {
        "title": "경쟁 설명 검토",
        "desc": "",
        "checks": [
          "대안 해석을 명시적으로 반박"
        ]
      }
    ]
  },
  {
    "id": "narr",
    "name": "내러티브 탐구",
    "en": "Narrative Inquiry",
    "approach": "qual",
    "family": "경험 탐구",
    "year": 1990,
    "level": 2,
    "purpose": [
      "탐색"
    ],
    "data": [
      "텍스트"
    ],
    "def": "개인의 이야기를 시간 순서와 맥락 속에서 재구성해 삶의 의미를 해석합니다.",
    "use": [
      "생애·전환 경험",
      "정체성 형성 과정"
    ],
    "no": [
      "집단 수준의 패턴이 필요할 때"
    ],
    "sample": "1~5명 (깊이 최우선)",
    "analysis": "시간·장소·사회성 3차원 공간 분석 · 재이야기(restorying) · 구조 분석",
    "risks": [
      "연구자 재구성의 과잉",
      "참여자 목소리 상실",
      "익명성 취약"
    ],
    "related": [
      "phen",
      "case"
    ],
    "lit": "Clandinin & Connelly(2000); Riessman(2008)",
    "from": "phen",
    "process": [
      {
        "title": "관계 형성",
        "desc": "",
        "checks": [
          "장기간 신뢰 구축이 자료의 질을 결정"
        ]
      },
      {
        "title": "이야기 수집",
        "desc": "",
        "checks": [
          "연대기·전환점 중심 면담, 유물·사진 활용"
        ]
      },
      {
        "title": "3차원 공간에서 배치",
        "desc": "",
        "checks": [
          "시간(과거–현재–미래) × 개인/사회 × 장소"
        ]
      },
      {
        "title": "재이야기 작성",
        "desc": "",
        "checks": [
          "연대기적 재구성 후 참여자 확인"
        ]
      },
      {
        "title": "윤리 재점검",
        "desc": "",
        "checks": [
          "소수 사례는 익명화가 어려움 — 재동의 절차"
        ]
      }
    ]
  },
  {
    "id": "ca",
    "name": "질적 내용분석 · 주제분석",
    "en": "Content / Thematic Analysis",
    "approach": "qual",
    "family": "텍스트 분석",
    "year": 1952,
    "level": 1,
    "purpose": [
      "기술",
      "탐색"
    ],
    "data": [
      "텍스트",
      "기존"
    ],
    "def": "텍스트를 체계적으로 코딩해 반복되는 주제를 도출합니다. 질적 분석의 가장 기본이자 범용 도구입니다.",
    "use": [
      "면담·개방형 응답·문서의 패턴 정리",
      "질적 연구 입문"
    ],
    "no": [
      "이론 생성이 목표일 때(→ 근거이론)",
      "경험의 본질이 목표일 때(→ 현상학)"
    ],
    "sample": "자료 분량 기준(면담 6~20건 또는 문서 세트)",
    "analysis": "귀납/연역 코딩 · 코드북 · 주제 지도 · 코더 간 일치도(κ)",
    "risks": [
      "주제의 자의성",
      "맥락 소실",
      "코딩 표류(drift)"
    ],
    "related": [
      "gt",
      "qc",
      "sysrev"
    ],
    "lit": "Braun & Clarke(2006, 2022); Krippendorff(2018)",
    "from": null,
    "process": [
      {
        "title": "자료에 익숙해지기",
        "desc": "",
        "checks": [
          "전사본 최소 2회 통독, 초기 인상 메모"
        ]
      },
      {
        "title": "초기 코드 생성",
        "desc": "",
        "checks": [
          "귀납 코딩 또는 사전 코드북 적용",
          "한 세그먼트에 복수 코드 허용"
        ]
      },
      {
        "title": "코드 → 잠재 주제로 묶기",
        "desc": "",
        "checks": [
          "코드 지도 그리기, 유사 코드 병합"
        ]
      },
      {
        "title": "주제 검토(2단계)",
        "desc": "",
        "checks": [
          "① 코딩된 발췌 수준 ② 전체 자료 수준"
        ]
      },
      {
        "title": "주제 정의·명명",
        "desc": "",
        "checks": [
          "주제마다 한 문장 정의 + 대표 인용문"
        ]
      },
      {
        "title": "신뢰도 확보",
        "desc": "",
        "checks": [
          "2차 코더 20% 재코딩, κ≥.70 목표",
          "불일치는 코드북 개정으로 환원"
        ]
      }
    ]
  },
  {
    "id": "qc",
    "name": "양적 내용분석",
    "en": "Quantitative Content Analysis",
    "approach": "quant",
    "family": "텍스트 분석",
    "year": 1949,
    "level": 2,
    "purpose": [
      "기술"
    ],
    "data": [
      "텍스트",
      "기존"
    ],
    "def": "사전에 정의된 범주로 텍스트의 등장 빈도를 세어 수치화합니다.",
    "use": [
      "미디어 보도 경향 분석",
      "대량 문서의 추세 비교"
    ],
    "no": [
      "의미의 뉘앙스가 핵심일 때"
    ],
    "sample": "표집 단위·기간을 확률표집 (예: 구성주간 표집)",
    "analysis": "빈도·교차분석 · Krippendorff α · 시계열",
    "risks": [
      "범주 타당도",
      "맥락 무시",
      "코더 신뢰도 저하"
    ],
    "related": [
      "ca",
      "ml"
    ],
    "lit": "Berelson(1952); Riffe et al.(2019)",
    "from": "ca",
    "process": [
      {
        "title": "분석 단위 확정",
        "desc": "",
        "checks": [
          "기사/문단/문장 중 무엇을 셀지 명시"
        ]
      },
      {
        "title": "코딩 스킴 개발",
        "desc": "",
        "checks": [
          "범주는 상호배타적·포괄적이어야 함"
        ]
      },
      {
        "title": "코더 훈련 및 사전 신뢰도",
        "desc": "",
        "checks": [
          "본코딩 전 α≥.80 확보"
        ]
      },
      {
        "title": "본코딩",
        "desc": "",
        "checks": [
          "주기적 재점검으로 표류 방지"
        ]
      },
      {
        "title": "분석",
        "desc": "",
        "checks": [
          "빈도 → 관계 → 시간 추세 순"
        ]
      }
    ]
  },
  {
    "id": "ml",
    "name": "텍스트 마이닝 · 토픽 모델링",
    "en": "Text Mining / Topic Modeling",
    "approach": "quant",
    "family": "텍스트 분석",
    "year": 2003,
    "level": 3,
    "purpose": [
      "탐색",
      "기술"
    ],
    "data": [
      "텍스트",
      "기존"
    ],
    "def": "대량 텍스트에서 통계·기계학습으로 잠재 주제나 감성 경향을 추출합니다.",
    "use": [
      "수만 건 이상 문서",
      "사람이 다 읽을 수 없는 규모"
    ],
    "no": [
      "문서가 수백 건 이하",
      "미묘한 해석이 핵심일 때"
    ],
    "sample": "문서 1,000건 이상 권장",
    "analysis": "LDA · BERTopic · 감성분석 · 동시출현 네트워크",
    "risks": [
      "전처리 의존성",
      "토픽 해석의 자의성",
      "한국어 형태소 오류"
    ],
    "related": [
      "qc",
      "ca"
    ],
    "lit": "Blei et al.(2003); Grimmer & Stewart(2013)",
    "from": "qc",
    "process": [
      {
        "title": "말뭉치 수집·정제",
        "desc": "",
        "checks": [
          "중복·광고·봇 제거가 결과를 좌우"
        ]
      },
      {
        "title": "형태소 분석·불용어",
        "desc": "",
        "checks": [
          "도메인 사전 구축, 불용어 목록 공개"
        ]
      },
      {
        "title": "토픽 수 결정",
        "desc": "",
        "checks": [
          "혼란도·일관성 점수 + 사람 해석 병행"
        ]
      },
      {
        "title": "토픽 라벨링",
        "desc": "",
        "checks": [
          "상위 단어만 보지 말고 대표 문서 정독"
        ]
      },
      {
        "title": "타당화",
        "desc": "",
        "checks": [
          "일부 표본을 사람이 직접 코딩해 대조"
        ]
      }
    ]
  },
  {
    "id": "ar",
    "name": "실행연구",
    "en": "Action Research",
    "approach": "mixed",
    "family": "참여·개입",
    "year": 1946,
    "level": 2,
    "purpose": [
      "평가",
      "탐색"
    ],
    "data": [
      "관찰",
      "텍스트",
      "수치"
    ],
    "def": "현장 당사자와 함께 계획–실행–관찰–성찰을 순환하며 문제를 개선하고 동시에 지식을 만듭니다.",
    "use": [
      "실무 개선이 연구와 동시에 필요할 때",
      "교사·간호사·조직 현장"
    ],
    "no": [
      "중립적 관찰이 요구될 때",
      "단회성 결론이 필요할 때"
    ],
    "sample": "현장 1곳, 최소 2~3 순환주기",
    "analysis": "순환별 자료 삼각검증 · 성찰일지 · 사전사후 지표",
    "risks": [
      "역할 갈등",
      "권력관계",
      "일반화 한계"
    ],
    "related": [
      "case",
      "ethno",
      "cbpr"
    ],
    "lit": "Lewin(1946); Kemmis et al.(2014)",
    "from": "ethno",
    "process": [
      {
        "title": "문제 공동 규정",
        "desc": "연구자가 아니라 현장이 문제를 정의합니다.",
        "checks": [
          "이해관계자 워크숍"
        ]
      },
      {
        "title": "1주기 계획",
        "desc": "",
        "checks": [
          "개선 조치 + 관찰 지표를 함께 설계"
        ]
      },
      {
        "title": "실행·관찰",
        "desc": "",
        "checks": [
          "실행 로그와 지표를 동시 기록"
        ]
      },
      {
        "title": "성찰 및 재계획",
        "desc": "",
        "checks": [
          "무엇이 왜 안 됐는지 공동 해석"
        ]
      },
      {
        "title": "주기 반복",
        "desc": "",
        "checks": [
          "최소 2주기 이상이어야 학습이 드러남"
        ]
      },
      {
        "title": "성과와 지식 분리 보고",
        "desc": "",
        "checks": [
          "현장 개선 성과 / 이전 가능한 통찰"
        ]
      }
    ]
  },
  {
    "id": "cbpr",
    "name": "지역사회 참여연구",
    "en": "Community-Based Participatory Research",
    "approach": "mixed",
    "family": "참여·개입",
    "year": 1995,
    "level": 3,
    "purpose": [
      "평가",
      "탐색"
    ],
    "data": [
      "텍스트",
      "수치",
      "관찰"
    ],
    "def": "지역사회를 연구 대상이 아닌 공동 연구자로 삼아 전 과정을 함께 수행합니다.",
    "use": [
      "건강 형평성·소수자 이슈",
      "신뢰가 낮은 커뮤니티"
    ],
    "no": [
      "빠른 결론이 필요할 때",
      "파트너십 구축 자원이 없을 때"
    ],
    "sample": "커뮤니티 파트너 조직 + 주민 자문단",
    "analysis": "혼합자료 공동 해석 · 역량 강화 지표",
    "risks": [
      "형식적 참여(토큰리즘)",
      "권력 불균형",
      "장기 신뢰 유지"
    ],
    "related": [
      "ar",
      "case"
    ],
    "lit": "Israel et al.(2012)",
    "from": "ar",
    "process": [
      {
        "title": "파트너십 협약",
        "desc": "",
        "checks": [
          "의사결정권·자료 소유권·성과 배분 명문화"
        ]
      },
      {
        "title": "공동 연구질문 설정",
        "desc": "",
        "checks": [
          "커뮤니티 우선순위가 출발점"
        ]
      },
      {
        "title": "역량 강화 훈련",
        "desc": "",
        "checks": [
          "주민 연구원 교육"
        ]
      },
      {
        "title": "공동 수집·공동 해석",
        "desc": "",
        "checks": [
          "해석 워크숍에서 결론 합의"
        ]
      },
      {
        "title": "성과 환류",
        "desc": "",
        "checks": [
          "논문 이전에 커뮤니티에 먼저 보고"
        ]
      }
    ]
  },
  {
    "id": "exp_seq",
    "name": "설명적 순차 설계",
    "en": "Explanatory Sequential Design",
    "approach": "mixed",
    "family": "혼합 설계",
    "year": 2003,
    "level": 2,
    "purpose": [
      "설명"
    ],
    "data": [
      "수치",
      "텍스트"
    ],
    "def": "먼저 양적 조사를 하고, 그 결과 중 설명이 필요한 부분을 질적으로 파고듭니다.",
    "use": [
      "통계 결과가 왜 그런지 모를 때",
      "예상 밖 결과의 원인 추적"
    ],
    "no": [
      "한 번에 끝내야 할 때",
      "질적 단계 인력이 없을 때"
    ],
    "sample": "양적 대표표본 → 그 중 극단/전형 사례 8~15명",
    "analysis": "양적 결과 → 질적 표집 기준 도출 → 통합 해석 매트릭스",
    "risks": [
      "두 단계가 따로 놀기",
      "2단계 표집 근거 부실",
      "기간 초과"
    ],
    "related": [
      "explor_seq",
      "conv",
      "survey"
    ],
    "lit": "Creswell & Plano Clark(2018)",
    "from": "survey",
    "process": [
      {
        "title": "1단계 양적 조사 수행",
        "desc": "",
        "checks": [
          "설문·검정 완료"
        ]
      },
      {
        "title": "설명이 필요한 결과 선별",
        "desc": "통합의 핵심은 여기입니다.",
        "checks": [
          "유의하지 않은 관계, 예상 밖 방향, 큰 분산"
        ]
      },
      {
        "title": "질적 표집 기준 도출",
        "desc": "",
        "checks": [
          "1단계 점수 기준 극단·전형 사례 선정 규칙 명시"
        ]
      },
      {
        "title": "2단계 질적 조사",
        "desc": "",
        "checks": [
          "1단계 결과를 면담 프로토콜에 직접 반영"
        ]
      },
      {
        "title": "통합(joint display)",
        "desc": "",
        "checks": [
          "양적 결과–질적 설명을 한 표에 병치",
          "수렴/확장/불일치를 명시"
        ]
      }
    ]
  },
  {
    "id": "explor_seq",
    "name": "탐색적 순차 설계",
    "en": "Exploratory Sequential Design",
    "approach": "mixed",
    "family": "혼합 설계",
    "year": 2003,
    "level": 2,
    "purpose": [
      "탐색"
    ],
    "data": [
      "텍스트",
      "수치"
    ],
    "def": "먼저 질적으로 개념을 발굴하고, 그것을 도구화해 양적으로 검증·일반화합니다.",
    "use": [
      "측정 도구가 없는 새 개념",
      "문화적으로 다른 맥락에 맞는 척도 개발"
    ],
    "no": [
      "기존 척도가 충분할 때"
    ],
    "sample": "질적 10~20명 → 양적 200명 이상",
    "analysis": "주제분석 → 문항 개발 → EFA/CFA → 타당도 검증",
    "risks": [
      "도구화 과정의 의미 손실",
      "기간 장기화"
    ],
    "related": [
      "exp_seq",
      "efa",
      "ca"
    ],
    "lit": "Creswell & Plano Clark(2018)",
    "from": "ca",
    "process": [
      {
        "title": "1단계 질적 탐색",
        "desc": "",
        "checks": [
          "주제분석으로 구성요소 도출"
        ]
      },
      {
        "title": "문항 개발",
        "desc": "",
        "checks": [
          "참여자 언어를 최대한 보존한 문항 초안"
        ]
      },
      {
        "title": "전문가 내용타당도",
        "desc": "",
        "checks": [
          "CVI/CVR 검토"
        ]
      },
      {
        "title": "예비조사 → EFA",
        "desc": "",
        "checks": [
          "요인구조 확인"
        ]
      },
      {
        "title": "본조사 → CFA·신뢰도",
        "desc": "",
        "checks": [
          "독립표본에서 확인, α와 ω 함께 보고"
        ]
      }
    ]
  },
  {
    "id": "conv",
    "name": "수렴적 병렬 설계",
    "en": "Convergent Parallel Design",
    "approach": "mixed",
    "family": "혼합 설계",
    "year": 2003,
    "level": 2,
    "purpose": [
      "기술",
      "설명"
    ],
    "data": [
      "수치",
      "텍스트"
    ],
    "def": "양적·질적 자료를 같은 시기에 따로 모아 분석한 뒤, 결과를 나란히 놓고 비교합니다.",
    "use": [
      "시간이 한정적일 때",
      "두 자료의 일치 여부 자체가 궁금할 때"
    ],
    "no": [
      "한 자료가 다른 자료를 이끌어야 할 때"
    ],
    "sample": "두 표본의 관계(동일/포함/독립)를 사전에 정의",
    "analysis": "병합 매트릭스 · joint display · 불일치 사례 심층 검토",
    "risks": [
      "가중치 불균형",
      "불일치 처리 방침 부재",
      "표본 불일치"
    ],
    "related": [
      "exp_seq",
      "explor_seq"
    ],
    "lit": "Creswell & Plano Clark(2018)",
    "from": "exp_seq",
    "process": [
      {
        "title": "두 갈래 동시 설계",
        "desc": "",
        "checks": [
          "각각 독립적으로 타당한 설계여야 함"
        ]
      },
      {
        "title": "가중치 사전 결정",
        "desc": "",
        "checks": [
          "QUAN+qual / quan+QUAL / QUAN+QUAL"
        ]
      },
      {
        "title": "독립 분석",
        "desc": "",
        "checks": [
          "서로 오염되지 않게 분리 분석"
        ]
      },
      {
        "title": "병합",
        "desc": "",
        "checks": [
          "같은 차원끼리 표로 병치"
        ]
      },
      {
        "title": "불일치 해석",
        "desc": "",
        "checks": [
          "불일치는 실패가 아니라 발견 — 별도 논의 절 배정"
        ]
      }
    ]
  },
  {
    "id": "scoping",
    "name": "주제범위 문헌고찰",
    "en": "Scoping Review",
    "approach": "mixed",
    "family": "문헌 종합",
    "year": 2005,
    "level": 1,
    "purpose": [
      "탐색"
    ],
    "data": [
      "기존"
    ],
    "def": "특정 분야의 연구 지형과 공백을 넓게 훑어 지도로 그립니다. 질 평가를 필수로 하지 않습니다.",
    "use": [
      "분야가 넓고 정리가 안 됐을 때",
      "연구 공백 확인",
      "본 연구 설계 전 사전 작업"
    ],
    "no": [
      "효과 크기 결론이 필요할 때"
    ],
    "sample": "해당 없음",
    "analysis": "PRISMA-ScR · 자료 차트화 · 기술적 요약",
    "risks": [
      "범위 폭주",
      "질 평가 부재로 인한 과잉 해석"
    ],
    "related": [
      "sysrev",
      "meta"
    ],
    "lit": "Arksey & O’Malley(2005); Tricco et al.(2018)",
    "from": "sysrev",
    "process": [
      {
        "title": "넓은 질문 설정",
        "desc": "",
        "checks": [
          "PCC(대상·개념·맥락) 틀 사용"
        ]
      },
      {
        "title": "반복적 검색",
        "desc": "",
        "checks": [
          "범위를 좁혀가며 검색식 조정 — 기록 필수"
        ]
      },
      {
        "title": "자료 차트화",
        "desc": "",
        "checks": [
          "저자·연도·설계·대상·주요결과 표 작성"
        ]
      },
      {
        "title": "지형 요약",
        "desc": "",
        "checks": [
          "빈도·시기·지역·설계 분포 시각화"
        ]
      },
      {
        "title": "공백 진술",
        "desc": "",
        "checks": [
          "다음 연구가 무엇을 해야 하는지 명시"
        ]
      }
    ]
  },
  {
    "id": "obs",
    "name": "구조화 관찰",
    "en": "Structured Observation",
    "approach": "quant",
    "family": "현장 연구",
    "year": 1950,
    "level": 2,
    "purpose": [
      "기술"
    ],
    "data": [
      "관찰"
    ],
    "def": "사전에 정한 행동 범주와 기록 규칙에 따라 행동의 빈도·지속시간을 측정합니다.",
    "use": [
      "자기보고를 믿기 어려운 행동",
      "아동·환자 등 보고가 어려운 대상"
    ],
    "no": [
      "내면의 의미가 궁금할 때"
    ],
    "sample": "관찰 회기 수와 시간 표집 계획으로 결정",
    "analysis": "빈도·지속시간·간격기록 · 관찰자 간 일치도(ICC)",
    "risks": [
      "관찰자 표류",
      "반응성(관찰당함 효과)",
      "시간 표집 편향"
    ],
    "related": [
      "ethno",
      "qc"
    ],
    "lit": "Bakeman & Quera(2011)",
    "from": null,
    "process": [
      {
        "title": "행동 조작적 정의",
        "desc": "",
        "checks": [
          "시작·종료를 초 단위로 판정 가능하게 정의"
        ]
      },
      {
        "title": "기록 방식 선택",
        "desc": "",
        "checks": [
          "사건기록 / 간격기록 / 시간표집"
        ]
      },
      {
        "title": "관찰자 훈련",
        "desc": "",
        "checks": [
          "본관찰 전 ICC≥.80"
        ]
      },
      {
        "title": "적응 기간 확보",
        "desc": "",
        "checks": [
          "반응성 감소를 위해 초기 회기는 분석 제외"
        ]
      },
      {
        "title": "신뢰도 재점검",
        "desc": "",
        "checks": [
          "전체의 20%를 이중 관찰"
        ]
      }
    ]
  },
  {
    "id": "fgi",
    "name": "초점집단 면담",
    "en": "Focus Group Interview",
    "approach": "qual",
    "family": "경험 탐구",
    "year": 1956,
    "level": 1,
    "purpose": [
      "탐색"
    ],
    "data": [
      "텍스트"
    ],
    "def": "6~8명이 함께 이야기하며 상호작용 속에서 의견과 그 근거를 드러내게 합니다.",
    "use": [
      "다양한 관점을 빠르게 모을 때",
      "서비스·정책에 대한 반응 탐색"
    ],
    "no": [
      "민감·사적 주제",
      "개인의 깊은 경험이 목표일 때"
    ],
    "sample": "집단당 6~8명, 3~5개 집단(포화 기준)",
    "analysis": "집단 간 비교 주제분석 · 상호작용 분석",
    "risks": [
      "지배적 발언자",
      "집단사고",
      "민감 주제 침묵"
    ],
    "related": [
      "ca",
      "delphi",
      "phen"
    ],
    "lit": "Krueger & Casey(2015)",
    "from": null,
    "process": [
      {
        "title": "집단 구성 설계",
        "desc": "",
        "checks": [
          "동질성 확보(말하기 편한 조합), 집단 간은 이질적으로"
        ]
      },
      {
        "title": "질문 흐름 설계",
        "desc": "",
        "checks": [
          "도입–전환–핵심–마무리 5~6문항"
        ]
      },
      {
        "title": "진행",
        "desc": "",
        "checks": [
          "발언 균형 관리, 침묵 참기"
        ]
      },
      {
        "title": "보조 진행자 기록",
        "desc": "",
        "checks": [
          "비언어·좌석 배치·발언 순서 기록"
        ]
      },
      {
        "title": "분석",
        "desc": "",
        "checks": [
          "개인 발언만이 아니라 “합의/충돌 지점”을 코딩"
        ]
      }
    ]
  }
];

export const VALIDITY_BLOCKS: ValidityBlock[] = [
  {
    "title": "양적 — 타당도",
    "approach": "quant",
    "items": [
      {
        "name": "내적 타당도",
        "what": "관찰된 차이가 정말 그 원인 때문인가.",
        "how": "위협: 역사·성숙·검사·도구·회귀·선택·탈락·상호작용"
      },
      {
        "name": "외적 타당도",
        "what": "이 결과를 다른 대상·장면·시기에도 적용할 수 있는가.",
        "how": "위협: 표본 특수성, 실험실 환경, 시대 효과"
      },
      {
        "name": "구인 타당도",
        "what": "측정한 것이 정말 재려던 개념인가.",
        "how": "확인: 수렴타당도(AVE≥.50), 판별타당도(√AVE>상관), 내용타당도(CVI)"
      },
      {
        "name": "통계적 결론 타당도",
        "what": "통계 절차가 결론을 지지하는가.",
        "how": "위협: 낮은 검정력, 가정 위배, 다중검정, p-해킹"
      }
    ]
  },
  {
    "title": "양적 — 신뢰도",
    "approach": "quant",
    "items": [
      {
        "name": "내적 일관성",
        "what": "한 척도의 문항들이 같은 것을 재는가.",
        "how": "Cronbach α ≥ .70 (탐색 .60), McDonald ω 병행 보고 권장"
      },
      {
        "name": "검사-재검사",
        "what": "시간이 지나도 같은 값이 나오는가.",
        "how": "2~4주 간격, r ≥ .70"
      },
      {
        "name": "평정자 간",
        "what": "다른 사람이 재도 같은가.",
        "how": "κ ≥ .70 · ICC ≥ .75 · Krippendorff α ≥ .80"
      },
      {
        "name": "동형검사",
        "what": "같은 구조의 다른 문항 세트와 일치하는가.",
        "how": "두 형태 간 상관 ≥ .80"
      }
    ]
  },
  {
    "title": "질적 — 신빙성(Trustworthiness)",
    "approach": "qual",
    "items": [
      {
        "name": "신뢰성 Credibility",
        "what": "해석이 참여자의 현실과 맞는가.",
        "how": "장기간 관여 · 삼각검증 · 참여자 확인 · 동료 검토(peer debriefing)"
      },
      {
        "name": "전이 가능성 Transferability",
        "what": "다른 맥락의 독자가 적용을 판단할 수 있는가.",
        "how": "두꺼운 기술 · 맥락과 표본 특성의 상세 보고"
      },
      {
        "name": "의존 가능성 Dependability",
        "what": "과정이 일관되고 추적 가능한가.",
        "how": "감사추적(audit trail) · 코딩 결정 기록 · 외부 감사"
      },
      {
        "name": "확인 가능성 Confirmability",
        "what": "결론이 자료에서 나왔는가, 연구자에게서 나왔는가.",
        "how": "성찰일지(reflexivity) · 원자료–코드–주제 연결 사슬 제시"
      }
    ]
  },
  {
    "title": "공통 — 연구 윤리와 투명성",
    "approach": "common",
    "items": [
      {
        "name": "사전 동의",
        "what": "목적·위험·철회권을 이해한 상태의 동의인가.",
        "how": "IRB 승인 · 취약집단은 별도 절차"
      },
      {
        "name": "익명성·비밀보장",
        "what": "재식별 가능성이 남아 있지 않은가.",
        "how": "소수 사례 질적 연구는 특히 위험 — 합성 프로파일 고려"
      },
      {
        "name": "사전등록·공개",
        "what": "결과를 본 뒤 가설을 바꾸지 않았는가.",
        "how": "OSF/PROSPERO 등록 · 분석계획 사전 공개"
      },
      {
        "name": "재현 가능성",
        "what": "제3자가 같은 자료로 같은 결과를 얻는가.",
        "how": "코드·코드북·자료 공개 수준 명시"
      }
    ]
  }
];

export const METHOD_BY_ID: Record<string, Method> = Object.fromEntries(MAP_METHODS.map((m) => [m.id, m]));
