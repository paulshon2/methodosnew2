# -*- coding: utf-8 -*-
"""Canonical topics (2 × 5) for Conversation Analysis Archetype."""
from __future__ import annotations


def _t(title, participants, mode, focus, akey, claim):
    return {
        "title": title,
        "participants": participants,
        "mode": mode,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
    }


METHOD_PROFILES: dict[int, dict] = {
    54: {
        "en": "Conversation Analysis",
        "topics": [
            _t(
                "외래 진료의 진단고지 시퀀스",
                "의사–환자 자연대화",
                "QL-050",
                "고지·수용·수리",
                "ca_clinic",
                "진단고지는 단순 전달이 아니라 수용을 조직하는 다단계 시퀀스다",
            ),
            _t(
                "교실 Q&A의 발화순서 조직",
                "교사–학생 수업대화",
                "QL-050",
                "턴·선택·중첩",
                "ca_class",
                "교사 질문은 다음 화자를 선택·제약하는 턴할당 장치로 작동한다",
            ),
            _t(
                "콜센터 불만통화의 수리·사과",
                "상담원–고객 통화",
                "QL-050",
                "수리·선호",
                "ca_call",
                "비선호 응답(거절·책임회피)은 지연·완화·설명으로 조직된다",
            ),
            _t(
                "가족식사 요청·거절의 선호구조",
                "가족 일상대화",
                "QL-050",
                "요청·거절",
                "ca_family",
                "거절은 직접 부인보다 유보·대안제시로 선호조직된다",
            ),
            _t(
                "응급실 인수인계의 인접쌍 연쇄",
                "의료진 교대대화",
                "QL-050",
                "인수인계·확인",
                "ca_handoff",
                "확인 질문–응답 쌍의 완결이 안전 관련 정보 전달을 담보한다",
            ),
        ],
    },
    173: {
        "en": "Introduction to Conversation Analysis",
        "topics": [
            _t(
                "Jefferson 전사 실습: 중첩·침묵",
                "짧은 자연대화 클립",
                "GN-007",
                "전사기호",
                "cai_jeff",
                "중첩·침묵·억양 표기가 분석 가능한 현상을 보이게 만든다",
            ),
            _t(
                "턴테이킹 기본: 누가 다음에 말하는가",
                "2–3인 대화",
                "GN-007",
                "턴할당",
                "cai_turn",
                "다음 화자 선택은 침묵·시선·호명 등 미세 자원으로 이뤄진다",
            ),
            _t(
                "인접쌍 입문: 질문–대답",
                "일상·수업 클립",
                "GN-007",
                "인접쌍",
                "cai_pair",
                "첫 번째 부분(FPP)이 두 번째 부분(SPP)의 관련성을 강하게 제약한다",
            ),
            _t(
                "수리 입문: 자기수리·타인개시",
                "실수·정정 에피소드",
                "GN-007",
                "수리",
                "cai_repair",
                "자기수리가 선호되며 타인개시는 체면 손상을 최소화하는 형태로 나타난다",
            ),
            _t(
                "미니분석 보고서 작성 실습",
                "선택 클립 1–2개",
                "GN-007",
                "분석서술",
                "cai_report",
                "좋은 CA 서술은 주장마다 전사 근거 줄을 붙여 재현 가능하게 한다",
            ),
        ],
    },
}
