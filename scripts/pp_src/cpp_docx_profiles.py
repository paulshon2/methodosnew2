# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for Comparative Politics–Pattern Analysis Archetype."""
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
    145: {
        "en": "Patterns of Democracy",
        "topics": [
            _t(
                "합의제·다수제 민주주의 패턴 비교",
                "서유럽 국가 4–6개 사례",
                "역사·비교",
                "권력분산·연립",
                "cpp_consensual",
                "합의제 패턴은 다당·연립·연방적 제도 배치와 함께 반복적으로 나타난다",
            ),
            _t(
                "민주화 이행기의 제도선택 패턴",
                "제3물결 국가 비교사례",
                "역사·비교",
                "이행·제도설계",
                "cpp_transit",
                "이행기 타협 강도에 따라 의원내각제/대통령제 선택이 체계적으로 갈린다",
            ),
            _t(
                "선거제도 개혁과 정당체계 재편 패턴",
                "개혁 전후 국가 세트",
                "역사·비교",
                "선거규칙·정당수",
                "cpp_electoral",
                "비례성 강화 개혁 이후 유효정당 수 증가 패턴이 반복된다",
            ),
            _t(
                "지방분권과 민주주의 심화 패턴",
                "분권개혁 국가 비교",
                "역사·비교",
                "분권·참여",
                "cpp_decentral",
                "행정분권만으로는 참여 심화가 자동으로 나타나지 않으며 정당·시민사회 매개가 관건이다",
            ),
            _t(
                "위기 국면의 비상권력과 견제 패턴",
                "경제·안보 위기 사례",
                "역사·비교",
                "비상권·견제",
                "cpp_emergency",
                "비상권력 확대는 한시성·사후감독 장치가 약할 때 민주주의 침식으로 이어지는 패턴을 보인다",
            ),
        ],
    },
}
