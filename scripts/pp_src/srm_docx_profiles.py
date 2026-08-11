# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for Survey Research Method Archetype."""
from __future__ import annotations


def _t(title, sampling, mode, focus, akey, claim):
    return {
        "title": title,
        "participants": sampling,
        "mode": mode,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
    }


METHOD_PROFILES: dict[int, dict] = {
    4: {
        "en": "Survey Research Method",
        "topics": [
            _t(
                "대학생 학습몰입과 학업성취 조사",
                "확률표집 n=420 (학년층화)",
                "온라인설문",
                "몰입→성취",
                "srm_engage",
                "학습몰입이 높을수록 학업성취가 유의하게 높다",
            ),
            _t(
                "직장인 직무만족과 이직의도 조사",
                "기업 종사자 n=380 (업종할당)",
                "온라인+대면",
                "만족→이직의도",
                "srm_turnover",
                "직무만족이 낮을수록 이직의도가 높다",
            ),
            _t(
                "지역주민 생활만족과 안전인식 조사",
                "성·연령 할당 n=500",
                "전화+온라인",
                "안전→만족",
                "srm_safety",
                "안전인식이 높을수록 생활만족이 높다",
            ),
            _t(
                "병원 환자경험과 재이용의도 조사",
                "외래환자 n=320",
                "대면설문",
                "경험→재이용",
                "srm_patient",
                "환자경험 점수가 높을수록 재이용의도가 높다",
            ),
            _t(
                "교사 디지털효능감과 수업혁신 조사",
                "초중등 교사 n=360 (학교층화)",
                "온라인설문",
                "효능감→혁신",
                "srm_teacher",
                "디지털효능감이 높을수록 수업혁신 실천이 높다",
            ),
        ],
    },
}
