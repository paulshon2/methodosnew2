# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for Observation Technique Archetype."""
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
    9: {
        "en": "Observation Technique",
        "topics": [
            _t(
                "교실 학생 참여행동 관찰",
                "초등 수업 장면 8–12회",
                "구조적+시간표집",
                "참여·이탈",
                "obs_class",
                "교사 질문 직후 구간에서 온과제 참여 비율이 유의하게 높아진다",
            ),
            _t(
                "병동 손위생 수행 관찰",
                "병동 간호·의료진",
                "구조적+사건표집",
                "손위생 기회",
                "obs_hand",
                "환자 접촉 전 손위생 준수율이 접촉 후보다 낮다",
            ),
            _t(
                "어린이집 또래놀이 상호작용 관찰",
                "자유놀이 시간대",
                "비구조→구조화",
                "협력·갈등",
                "obs_play",
                "갈등 사건은 짧은 중재 개입 후 협력 에피소드로 전환되는 경향이 있다",
            ),
            _t(
                "콜센터 상담원 응대행동 관찰",
                "통화·화면공유 장면",
                "구조적+시간표집",
                "경청·스크립트",
                "obs_call",
                "스크립트 이탈 구간에서 고객 재질문 빈도가 증가한다",
            ),
            _t(
                "재활실 보행훈련 지도행동 관찰",
                "치료사–환자 세션",
                "구조적+사건표집",
                "피드백·안전",
                "obs_rehab",
                "즉각 교정 피드백이 많은 세션에서 안전관련 개입도 함께 증가한다",
            ),
        ],
    },
}
