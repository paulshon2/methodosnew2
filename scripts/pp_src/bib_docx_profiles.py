# -*- coding: utf-8 -*-
"""Canonical topics (2 × 5) for Bibliometrics–Citation Analysis Archetype."""
from __future__ import annotations


def _t(title, corpus, mode, focus, akey, claim):
    return {
        "title": title,
        "participants": corpus,
        "mode": mode,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
    }


METHOD_PROFILES: dict[int, dict] = {
    156: {
        "en": "Bibliometric Analysis",
        "topics": [
            _t(
                "인공지능 교육 연구 10년 동향",
                "WoS/Scopus 2015–2025",
                "계량서지",
                "출판량·키워드·국가",
                "bib_ai_edu",
                "AI 교육 연구는 응용 키워드 급증과 함께 방법론 다양성은 상대적으로 정체된다",
            ),
            _t(
                "간호학 환자안전 문헌의 성장·분산",
                "Scopus 간호·안전 코퍼스",
                "계량서지",
                "연도별성장·저널",
                "bib_nursing",
                "환자안전 문헌은 소수 저널·국가에 집중되며 성장은 비선형이다",
            ),
            _t(
                "기후적응 정책연구의 학제 구조",
                "WoS 다학제 검색식",
                "계량서지",
                "학제·공저",
                "bib_climate",
                "학제 연결은 증가하나 핵심 클러스터는 소수 기관에 편중된다",
            ),
            _t(
                "원격의료 연구의 생산성·영향력",
                "Scopus telemedicine",
                "계량서지",
                "h지수·생산성",
                "bib_tele",
                "생산성 상위 저자와 영향력 상위 논문의 집합이 부분적으로만 겹친다",
            ),
            _t(
                "메타버스·XR 교육 문헌 맵핑",
                "WoS+Scopus 병합",
                "계량서지",
                "키워드진화",
                "bib_xr",
                "용어 교체(메타버스→XR)가 보이는 성장의 상당 부분을 설명한다",
            ),
        ],
    },
    162: {
        "en": "Citation Analysis",
        "topics": [
            _t(
                "QL-008 고전 논문의 인용 계보",
                "핵심시드+피인용망",
                "인용분석",
                "인용경로·중개",
                "cit_gt",
                "고전 인용은 직접 계보보다 리뷰·교재를 경유하는 중개 경로가 크다",
            ),
            _t(
                "COVID-19 논문의 조기인용·수명",
                "고피인용 코퍼스",
                "인용분석",
                "인용속도·반감기",
                "cit_covid",
                "조기 고인용이 장기 영향력을 보장하지는 않는다",
            ),
            _t(
                "교육평가 분야의 자기인용·국경인용",
                "분야 저널 세트",
                "인용분석",
                "자기인용·국제성",
                "cit_assess",
                "자기인용률과 국제 인용 유입은 저널 군집별로 체계적으로 다르다",
            ),
            _t(
                "오픈액세스와 인용 이득의 관계",
                "대조 코퍼스 OA/비OA",
                "인용분석",
                "OA효과",
                "cit_oa",
                "OA 인용 이득은 분야·시점 통제 후에도 잔여 효과가 남는다",
            ),
            _t(
                "정책문서가 학술인용에 미치는 파급",
                "정책→학술 인용링크",
                "인용분석",
                "정책인용",
                "cit_policy",
                "정책 인용이 많은 논문은 학술 중심성과 다른 경로로 영향력을 얻는다",
            ),
        ],
    },
}
