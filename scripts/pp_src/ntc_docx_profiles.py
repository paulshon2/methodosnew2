# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for Nursing Theory Construction Archetype."""
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
    6: {
        "en": "Nursing Theory Construction Strategies",
        "topics": [
            _t(
                "만성질환 환자의 자기돌봄 협상 이론",
                "환자·가족돌봄자 12–16명",
                "면담+관찰+문서",
                "자기돌봄·협상",
                "ntc_selfcare",
                "자기돌봄은 의료지시와 일상 제약의 지속적 협상으로 구성된다",
            ),
            _t(
                "중환자실 간호사의 윤리적 고뇌 이론",
                "ICU 간호사 10–14명",
                "면담+관찰",
                "윤리고뇌·지지",
                "ntc_moral",
                "윤리적 고뇌는 가치충돌이 조직 지지 없이 반복될 때 심화된다",
            ),
            _t(
                "암 생존자의 새로운 정상 재구성 이론",
                "암 생존자 12명",
                "면담+일기문서",
                "정상성·재구성",
                "ntc_survivorship",
                "생존 이후 ‘정상’은 복원이 아니라 관계·몸·일상의 재구성이다",
            ),
            _t(
                "가정간호에서 신뢰 형성 과정 이론",
                "가정간호사·환자·가족",
                "면담+가정방문관찰",
                "신뢰·경계",
                "ntc_trust",
                "신뢰는 기술 숙련만이 아니라 경계 존중과 일관된 약속 이행으로 쌓인다",
            ),
            _t(
                "신규간호사의 전문직 정체성 형성 이론",
                "신규간호사·프리셉터",
                "면담+병동관찰",
                "정체성·사회화",
                "ntc_identity",
                "전문직 정체성은 과제 숙련과 동료 인정, 돌봄 의미의 교차로 형성된다",
            ),
        ],
    },
}
