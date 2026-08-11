/**
 * 문항 유형 8종 × 예제 10개 — 팔레트 아코디언·설계/AI 연동용.
 * 자동 생성: scripts/_gen_renew6_assets.mjs
 */
import type { QType, Question } from "./survey-types";
import { newId } from "./survey-types";

export type SurveyExample = {
  id: string;
  type: QType;
  title: string;
  summary: string;
  question: Omit<Question, "id"> & { id?: string };
};

export const SURVEY_EXAMPLES: SurveyExample[] = [
  {
    "id": "ex-single-1",
    "type": "single",
    "title": "전공 계열",
    "summary": "인문 · 사회 · 자연…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "귀하의 전공 계열은 무엇입니까?",
      "options": [
        "인문",
        "사회",
        "자연",
        "공학",
        "예체능",
        "기타"
      ]
    }
  },
  {
    "id": "ex-single-2",
    "type": "single",
    "title": "통근 수단",
    "summary": "도보 · 버스 · 지하철…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "평소 학교·직장까지 주로 이용하는 수단은?",
      "options": [
        "도보",
        "버스",
        "지하철",
        "자가용",
        "자전거",
        "기타"
      ]
    }
  },
  {
    "id": "ex-single-3",
    "type": "single",
    "title": "거주 형태",
    "summary": "자택 · 기숙사 · 자취…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "현재 거주 형태는 무엇입니까?",
      "options": [
        "자택",
        "기숙사",
        "자취",
        "하숙",
        "기타"
      ]
    }
  },
  {
    "id": "ex-single-4",
    "type": "single",
    "title": "학습 장소",
    "summary": "도서관 · 카페 · 집…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "집중 공부에 가장 많이 쓰는 장소는?",
      "options": [
        "도서관",
        "카페",
        "집",
        "스터디룸",
        "기타"
      ]
    }
  },
  {
    "id": "ex-single-5",
    "type": "single",
    "title": "정보 경로",
    "summary": "포털 · SNS · 동료…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "연구 관련 정보를 주로 어디서 얻습니까?",
      "options": [
        "포털",
        "SNS",
        "동료",
        "교수·상사",
        "학회",
        "기타"
      ]
    }
  },
  {
    "id": "ex-single-6",
    "type": "single",
    "title": "기기 선호",
    "summary": "노트북 · 데스크톱 · 태블릿…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "학습·업무에 주로 쓰는 기기는?",
      "options": [
        "노트북",
        "데스크톱",
        "태블릿",
        "스마트폰",
        "기타"
      ]
    }
  },
  {
    "id": "ex-single-7",
    "type": "single",
    "title": "식사 유형",
    "summary": "구내식당 · 외식 · 도시락…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "평일 점심은 주로 어떻게 해결합니까?",
      "options": [
        "구내식당",
        "외식",
        "도시락",
        "배달",
        "거름"
      ]
    }
  },
  {
    "id": "ex-single-8",
    "type": "single",
    "title": "수면 패턴",
    "summary": "22시 이전 · 22–24시 · 24–2시…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "평소 취침 시각대는?",
      "options": [
        "22시 이전",
        "22–24시",
        "24–2시",
        "2시 이후"
      ]
    }
  },
  {
    "id": "ex-single-9",
    "type": "single",
    "title": "운동 여부",
    "summary": "예 · 아니오 · 가끔…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "주 1회 이상 규칙적으로 운동합니까?",
      "options": [
        "예",
        "아니오",
        "가끔"
      ]
    }
  },
  {
    "id": "ex-single-10",
    "type": "single",
    "title": "자격 준비",
    "summary": "어학 · 전공자격 · 공무원…",
    "question": {
      "required": true,
      "help": "",
      "type": "single",
      "text": "현재 준비 중인 시험·자격은?",
      "options": [
        "어학",
        "전공자격",
        "공무원",
        "취업",
        "해당없음"
      ]
    }
  },
  {
    "id": "ex-multi-1",
    "type": "multi",
    "title": "이용 채널",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "지난 한 달 이용한 학습 지원을 모두 고르세요.",
      "options": [
        "튜터링",
        "특강",
        "상담",
        "온라인강의",
        "스터디",
        "해당없음"
      ]
    }
  },
  {
    "id": "ex-multi-2",
    "type": "multi",
    "title": "스트레스원",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "최근 스트레스를 주는 요인을 모두 고르세요.",
      "options": [
        "학업",
        "인간관계",
        "경제",
        "건강",
        "진로",
        "기타"
      ]
    }
  },
  {
    "id": "ex-multi-3",
    "type": "multi",
    "title": "앱 기능",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "학습 앱에서 자주 쓰는 기능을 모두 고르세요.",
      "options": [
        "퀴즈",
        "타이머",
        "진도관리",
        "커뮤니티",
        "알림",
        "없음"
      ]
    }
  },
  {
    "id": "ex-multi-4",
    "type": "multi",
    "title": "이동 목적",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "캠퍼스 내 이동 목적을 모두 고르세요.",
      "options": [
        "수업",
        "도서관",
        "식사",
        "동아리",
        "행정",
        "운동"
      ]
    }
  },
  {
    "id": "ex-multi-5",
    "type": "multi",
    "title": "정보 출처",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "건강 정보를 얻는 출처를 모두 고르세요.",
      "options": [
        "병원",
        "포털",
        "SNS",
        "지인",
        "책",
        "해당없음"
      ]
    }
  },
  {
    "id": "ex-multi-6",
    "type": "multi",
    "title": "참여 활동",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "이번 학기 참여한 활동을 모두 고르세요.",
      "options": [
        "동아리",
        "봉사",
        "인턴",
        "연구",
        "아르바이트",
        "없음"
      ]
    }
  },
  {
    "id": "ex-multi-7",
    "type": "multi",
    "title": "방해 요소",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "집중을 방해하는 것을 모두 고르세요.",
      "options": [
        "알림",
        "소음",
        "피로나",
        "동료 대화",
        "유튜브",
        "기타"
      ]
    }
  },
  {
    "id": "ex-multi-8",
    "type": "multi",
    "title": "지원 필요",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "받고 싶은 지원을 모두 고르세요.",
      "options": [
        "멘토링",
        "장학금",
        "상담",
        "공간",
        "장비",
        "해당없음"
      ]
    }
  },
  {
    "id": "ex-multi-9",
    "type": "multi",
    "title": "기록 방식",
    "summary": "복수 선택 5개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "학습 기록을 남기는 방식을 모두 고르세요.",
      "options": [
        "노트",
        "앱",
        "캘린더",
        "음성메모",
        "안 함"
      ]
    }
  },
  {
    "id": "ex-multi-10",
    "type": "multi",
    "title": "식사 이슈",
    "summary": "복수 선택 6개 보기",
    "question": {
      "required": false,
      "help": "",
      "type": "multi",
      "text": "식단에서 신경 쓰는 점을 모두 고르세요.",
      "options": [
        "칼로리",
        "단백질",
        "채식",
        "알레르기",
        "가격",
        "없음"
      ]
    }
  },
  {
    "id": "ex-scale-1",
    "type": "scale",
    "title": "강의 만족",
    "summary": "5점 · 전혀 그렇지 않다–매우 그렇다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "이번 학기 강의에 전반적으로 만족한다.",
      "points": 5,
      "lo": "전혀 그렇지 않다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-scale-2",
    "type": "scale",
    "title": "상담 도움",
    "summary": "5점 · 전혀 아니다–매우 그렇다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "상담이 문제 해결에 도움이 되었다.",
      "points": 5,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-scale-3",
    "type": "scale",
    "title": "앱 추천",
    "summary": "7점 · 전혀 없다–매우 있다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "이 학습 앱을 주변에 추천할 의향이 있다.",
      "points": 7,
      "lo": "전혀 없다",
      "hi": "매우 있다"
    }
  },
  {
    "id": "ex-scale-4",
    "type": "scale",
    "title": "업무 자율",
    "summary": "5점 · 전혀 아니다–매우 그렇다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "업무에서 자율성이 충분히 보장된다.",
      "points": 5,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-scale-5",
    "type": "scale",
    "title": "수면 질",
    "summary": "5점 · 매우 불만족–매우 만족",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "최근 일주일 수면의 질에 만족한다.",
      "points": 5,
      "lo": "매우 불만족",
      "hi": "매우 만족"
    }
  },
  {
    "id": "ex-scale-6",
    "type": "scale",
    "title": "팀플 공정",
    "summary": "5점 · 전혀 아니다–매우 그렇다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "팀 프로젝트 역할 분배가 공정했다.",
      "points": 5,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-scale-7",
    "type": "scale",
    "title": "시설 청결",
    "summary": "5점 · 매우 불만족–매우 만족",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "이용 공간의 청결 상태에 만족한다.",
      "points": 5,
      "lo": "매우 불만족",
      "hi": "매우 만족"
    }
  },
  {
    "id": "ex-scale-8",
    "type": "scale",
    "title": "피드백 속도",
    "summary": "5점 · 전혀 아니다–매우 그렇다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "과제 피드백이 충분히 빠르다.",
      "points": 5,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-scale-9",
    "type": "scale",
    "title": "안전 인식",
    "summary": "5점 · 전혀 아니다–매우 그렇다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "캠퍼스/직장에서 안전하다고 느낀다.",
      "points": 5,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-scale-10",
    "type": "scale",
    "title": "가치 부합",
    "summary": "7점 · 전혀 아니다–매우 그렇다",
    "question": {
      "required": true,
      "help": "",
      "type": "scale",
      "text": "이 활동이 나의 가치와 잘 맞는다.",
      "points": 7,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-matrix-1",
    "type": "matrix",
    "title": "서비스 품질",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "서비스 품질에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "응대 속도",
        "안내 명확성",
        "문제 해결력",
        "친절도"
      ],
      "points": 5,
      "lo": "매우 불만족",
      "hi": "매우 만족"
    }
  },
  {
    "id": "ex-matrix-2",
    "type": "matrix",
    "title": "수업 설계",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "수업 설계에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "목표 명확성",
        "난이도 적절",
        "자료 유용성",
        "참여 기회"
      ],
      "points": 5,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-matrix-3",
    "type": "matrix",
    "title": "조직 분위기",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "조직 분위기에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "협력",
        "존중",
        "피드백",
        "성장 지원"
      ],
      "points": 5,
      "lo": "매우 낮음",
      "hi": "매우 높음"
    }
  },
  {
    "id": "ex-matrix-4",
    "type": "matrix",
    "title": "앱 UX",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "앱 UX에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "속도",
        "가독성",
        "탐색 용이",
        "오류 빈도(역)"
      ],
      "points": 5,
      "lo": "매우 나쁨",
      "hi": "매우 좋음"
    }
  },
  {
    "id": "ex-matrix-5",
    "type": "matrix",
    "title": "건강 습관",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "건강 습관에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "규칙적 식사",
        "수분 섭취",
        "스트레칭",
        "수면 관리"
      ],
      "points": 5,
      "lo": "전혀 안 함",
      "hi": "항상 함"
    }
  },
  {
    "id": "ex-matrix-6",
    "type": "matrix",
    "title": "연구 윤리",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "연구 윤리에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "동의 절차",
        "자료 보관",
        "인용 정확",
        "이해충돌 관리"
      ],
      "points": 5,
      "lo": "매우 미흡",
      "hi": "매우 충분"
    }
  },
  {
    "id": "ex-matrix-7",
    "type": "matrix",
    "title": "온라인 수업",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "온라인 수업에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "접속 안정",
        "상호작용",
        "과제 부담",
        "평가 공정"
      ],
      "points": 5,
      "lo": "매우 불만족",
      "hi": "매우 만족"
    }
  },
  {
    "id": "ex-matrix-8",
    "type": "matrix",
    "title": "고객 여정",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "고객 여정에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "탐색",
        "가입",
        "첫 이용",
        "재이용"
      ],
      "points": 5,
      "lo": "매우 어려움",
      "hi": "매우 쉬움"
    }
  },
  {
    "id": "ex-matrix-9",
    "type": "matrix",
    "title": "리더십",
    "summary": "항목 4개 · 7점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "리더십에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "비전 공유",
        "경청",
        "의사결정",
        "인정"
      ],
      "points": 7,
      "lo": "전혀 아니다",
      "hi": "매우 그렇다"
    }
  },
  {
    "id": "ex-matrix-10",
    "type": "matrix",
    "title": "도서관 환경",
    "summary": "항목 4개 · 5점",
    "question": {
      "required": false,
      "help": "",
      "type": "matrix",
      "text": "도서관 환경에 대해 각 항목을 평가해 주세요.",
      "rows": [
        "좌석",
        "소음",
        "온도",
        "조명"
      ],
      "points": 5,
      "lo": "매우 불만족",
      "hi": "매우 만족"
    }
  },
  {
    "id": "ex-text-1",
    "type": "text",
    "title": "학과명",
    "summary": "예: 교육학과",
    "question": {
      "required": false,
      "help": "예: 교육학과",
      "type": "text",
      "text": "소속 학과명을 적어 주세요."
    }
  },
  {
    "id": "ex-text-2",
    "type": "text",
    "title": "거주 지역",
    "summary": "예: 서울 마포구",
    "question": {
      "required": false,
      "help": "예: 서울 마포구",
      "type": "text",
      "text": "거주 시·군·구를 적어 주세요."
    }
  },
  {
    "id": "ex-text-3",
    "type": "text",
    "title": "사용 도구",
    "summary": "예: R, SPSS",
    "question": {
      "required": false,
      "help": "예: R, SPSS",
      "type": "text",
      "text": "가장 자주 쓰는 분석 도구 이름을 적어 주세요."
    }
  },
  {
    "id": "ex-text-4",
    "type": "text",
    "title": "추천 도서",
    "summary": "제목만",
    "question": {
      "required": false,
      "help": "제목만",
      "type": "text",
      "text": "최근 도움이 된 책 한 권을 적어 주세요."
    }
  },
  {
    "id": "ex-text-5",
    "type": "text",
    "title": "멘토 역할",
    "summary": "예: 선배, 교수",
    "question": {
      "required": false,
      "help": "예: 선배, 교수",
      "type": "text",
      "text": "가장 도움된 멘토의 역할을 한 단어로."
    }
  },
  {
    "id": "ex-text-6",
    "type": "text",
    "title": "선호 주제",
    "summary": "10자 내외",
    "question": {
      "required": false,
      "help": "10자 내외",
      "type": "text",
      "text": "관심 연구 주제를 짧게 적어 주세요."
    }
  },
  {
    "id": "ex-text-7",
    "type": "text",
    "title": "사용 브라우저",
    "summary": "예: Chrome",
    "question": {
      "required": false,
      "help": "예: Chrome",
      "type": "text",
      "text": "주로 쓰는 브라우저를 적어 주세요."
    }
  },
  {
    "id": "ex-text-8",
    "type": "text",
    "title": "자격증명",
    "summary": "없으면 '없음'",
    "question": {
      "required": false,
      "help": "없으면 '없음'",
      "type": "text",
      "text": "보유 자격증이 있다면 대표 1개."
    }
  },
  {
    "id": "ex-text-9",
    "type": "text",
    "title": "선호 좌석",
    "summary": "예: 창가",
    "question": {
      "required": false,
      "help": "예: 창가",
      "type": "text",
      "text": "선호하는 학습 좌석 유형을 적어 주세요."
    }
  },
  {
    "id": "ex-text-10",
    "type": "text",
    "title": "연락 가능 시간",
    "summary": "예: 평일 19–21시",
    "question": {
      "required": false,
      "help": "예: 평일 19–21시",
      "type": "text",
      "text": "연락 가능한 시간대를 적어 주세요."
    }
  },
  {
    "id": "ex-para-1",
    "type": "para",
    "title": "몰입 경험",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "상황·조건·느낌을 포함",
      "type": "para",
      "text": "최근에 깊이 몰입했던 경험을 자유롭게 적어 주세요."
    }
  },
  {
    "id": "ex-para-2",
    "type": "para",
    "title": "이탈 이유",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "서비스/수업을 중단했다면 그 이유를 적어 주세요."
    }
  },
  {
    "id": "ex-para-3",
    "type": "para",
    "title": "개선 제안",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "가장 바꾸고 싶은 점과 이유를 적어 주세요."
    }
  },
  {
    "id": "ex-para-4",
    "type": "para",
    "title": "학습 전략",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "효과적이었던 학습 전략을 설명해 주세요."
    }
  },
  {
    "id": "ex-para-5",
    "type": "para",
    "title": "갈등 경험",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "팀에서 겪은 갈등과 해결 과정을 적어 주세요."
    }
  },
  {
    "id": "ex-para-6",
    "type": "para",
    "title": "건강 변화",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "생활습관 변화 후 느낀 점을 적어 주세요."
    }
  },
  {
    "id": "ex-para-7",
    "type": "para",
    "title": "윤리 딜레마",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "연구·업무에서 겪은 윤리적 고민을 적어 주세요."
    }
  },
  {
    "id": "ex-para-8",
    "type": "para",
    "title": "전환점",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "진로에 영향을 준 사건을 적어 주세요."
    }
  },
  {
    "id": "ex-para-9",
    "type": "para",
    "title": "피드백 경험",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "가장 도움이 된 피드백 사례를 적어 주세요."
    }
  },
  {
    "id": "ex-para-10",
    "type": "para",
    "title": "일상 루틴",
    "summary": "장문 · 코딩 연계",
    "question": {
      "required": false,
      "help": "",
      "type": "para",
      "text": "집중이 잘 되는 하루 루틴을 적어 주세요."
    }
  },
  {
    "id": "ex-number-1",
    "type": "number",
    "title": "나이",
    "summary": "단위: 세",
    "question": {
      "required": false,
      "help": "숫자만 · 세",
      "type": "number",
      "text": "만 나이를 숫자로 적어 주세요."
    }
  },
  {
    "id": "ex-number-2",
    "type": "number",
    "title": "주간 공부",
    "summary": "단위: 시간",
    "question": {
      "required": false,
      "help": "숫자만 · 시간",
      "type": "number",
      "text": "지난주 공부·업무 시간은 대략 몇 시간입니까?"
    }
  },
  {
    "id": "ex-number-3",
    "type": "number",
    "title": "수면 시간",
    "summary": "단위: 시간",
    "question": {
      "required": false,
      "help": "숫자만 · 시간",
      "type": "number",
      "text": "평소 하루 수면 시간은?"
    }
  },
  {
    "id": "ex-number-4",
    "type": "number",
    "title": "통근 분",
    "summary": "단위: 분",
    "question": {
      "required": false,
      "help": "숫자만 · 분",
      "type": "number",
      "text": "편도 통근에 걸리는 시간은?"
    }
  },
  {
    "id": "ex-number-5",
    "type": "number",
    "title": "독서 권수",
    "summary": "단위: 권",
    "question": {
      "required": false,
      "help": "숫자만 · 권",
      "type": "number",
      "text": "지난달 읽은 책은 몇 권입니까?"
    }
  },
  {
    "id": "ex-number-6",
    "type": "number",
    "title": "카페인",
    "summary": "단위: 잔",
    "question": {
      "required": false,
      "help": "숫자만 · 잔",
      "type": "number",
      "text": "하루 카페인 음료는 몇 잔입니까?"
    }
  },
  {
    "id": "ex-number-7",
    "type": "number",
    "title": "운동 분",
    "summary": "단위: 분",
    "question": {
      "required": false,
      "help": "숫자만 · 분",
      "type": "number",
      "text": "지난주 운동 총 시간은?"
    }
  },
  {
    "id": "ex-number-8",
    "type": "number",
    "title": "화면 시간",
    "summary": "단위: 시간",
    "question": {
      "required": false,
      "help": "숫자만 · 시간",
      "type": "number",
      "text": "평일 하루 화면 사용 시간은?"
    }
  },
  {
    "id": "ex-number-9",
    "type": "number",
    "title": "팀원 수",
    "summary": "단위: 명",
    "question": {
      "required": false,
      "help": "숫자만 · 명",
      "type": "number",
      "text": "현재 팀원 수는?"
    }
  },
  {
    "id": "ex-number-10",
    "type": "number",
    "title": "과제 개수",
    "summary": "단위: 건",
    "question": {
      "required": false,
      "help": "숫자만 · 건",
      "type": "number",
      "text": "이번 주 마감 과제·업무는 몇 건입니까?"
    }
  },
  {
    "id": "ex-date-1",
    "type": "date",
    "title": "입학일",
    "summary": "YYYY-MM-DD",
    "question": {
      "required": false,
      "help": "YYYY-MM-DD",
      "type": "date",
      "text": "입학(입사)일을 선택해 주세요."
    }
  },
  {
    "id": "ex-date-2",
    "type": "date",
    "title": "시작일",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "현재 프로젝트 시작일을 선택해 주세요."
    }
  },
  {
    "id": "ex-date-3",
    "type": "date",
    "title": "최근 상담",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "최근 상담·면담일을 선택해 주세요."
    }
  },
  {
    "id": "ex-date-4",
    "type": "date",
    "title": "제출 예정",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "다음 제출 예정일을 선택해 주세요."
    }
  },
  {
    "id": "ex-date-5",
    "type": "date",
    "title": "검진일",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "최근 건강검진일을 선택해 주세요."
    }
  },
  {
    "id": "ex-date-6",
    "type": "date",
    "title": "워크숍",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "참석한 워크숍 일자를 선택해 주세요."
    }
  },
  {
    "id": "ex-date-7",
    "type": "date",
    "title": "계약 만료",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "계약·자격 만료 예정일을 선택해 주세요."
    }
  },
  {
    "id": "ex-date-8",
    "type": "date",
    "title": "이주 시점",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "현재 거주지로 옮긴 시점을 선택해 주세요."
    }
  },
  {
    "id": "ex-date-9",
    "type": "date",
    "title": "마지막 이용",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "서비스를 마지막으로 이용한 날짜는?"
    }
  },
  {
    "id": "ex-date-10",
    "type": "date",
    "title": "목표 마감",
    "summary": "날짜 선택",
    "question": {
      "required": false,
      "help": "",
      "type": "date",
      "text": "스스로 정한 목표 마감일을 선택해 주세요."
    }
  }
];

export function examplesByType(type: QType): SurveyExample[] {
  return SURVEY_EXAMPLES.filter((e) => e.type === type);
}

/** 예제를 실제 문항으로 복제(새 id). */
export function materializeExample(ex: SurveyExample): Question {
  const { id: _ignore, ...rest } = ex.question as Question;
  return { ...rest, id: newId(), type: ex.type } as Question;
}

export function exampleById(id: string): SurveyExample | undefined {
  return SURVEY_EXAMPLES.find((e) => e.id === id);
}
