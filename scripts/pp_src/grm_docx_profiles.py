# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for General Methodology Archetype."""
from __future__ import annotations


def _t(title, participants, mode, focus, akey, claim, strategy=""):
    return {
        "title": title,
        "participants": participants,
        "mode": mode,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
        "strategy": strategy or "문헌·면담·설문 중 선택",
    }


METHOD_PROFILES: dict[int, dict] = {
    194: {
        "en": "Research Methodology",
        "topics": [
            _t(
                "원격수업 학습지속성의 연구설계·방법 선택",
                "대학 원격수업 학습자·교수",
                "설문 중심(+문헌)",
                "설계정당화",
                "grm_remote",
                "연구질문에 맞는 수집전략·분석경로를 명시한 방법론 지침으로 재현 가능한 설계를 제시할 수 있다",
                "EV-007 → 설문(+선택 면담)",
            ),
            _t(
                "지역사회 돌봄 경험의 질적 연구방법 설계",
                "돌봄제공자·이용자",
                "면담 중심(+문헌)",
                "질적설계",
                "grm_care",
                "면담·주제코딩 경로를 연구질문에 정렬한 방법론 지침을 구성할 수 있다",
                "문헌 → 심층면담",
            ),
            _t(
                "중소기업 ESG 공시 인식의 혼합적 방법 설계",
                "실무자·공시담당",
                "설문+면담",
                "혼합정렬",
                "grm_esg",
                "양·질 가닥의 역할·통합시점을 명시한 방법론 지침을 도출할 수 있다",
                "설문과 면담 병행/순차",
            ),
            _t(
                "공공데이터 활용 정책평가의 양적 연구방법 설계",
                "행정·공개데이터 세트",
                "문헌+2차자료",
                "양적설계",
                "grm_policy",
                "2차자료·변수화·추론통계 경로를 문서화한 방법론 지침을 제시할 수 있다",
                "문헌·공개통계·행정자료",
            ),
            _t(
                "간호대학생 임상실습 스트레스의 연구방법 재설계",
                "간호대학생 코호트",
                "설문(+문헌)",
                "타당·윤리",
                "grm_nursing",
                "윤리·측정도구·분석선택 기준을 포함한 연구방법론 지침서를 완성할 수 있다",
                "문헌 → 표준화 설문",
            ),
        ],
    },
}
