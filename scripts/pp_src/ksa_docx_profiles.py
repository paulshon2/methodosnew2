# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for Keyword Salience Analysis Archetype."""
from __future__ import annotations


def _t(title, participants, mode, focus, akey, claim, target="", reference=""):
    return {
        "title": title,
        "participants": participants,
        "mode": mode,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
        "target_corpus": target or "대상 코퍼스",
        "reference_corpus": reference or "참조 코퍼스",
    }


METHOD_PROFILES: dict[int, dict] = {
    188: {
        "en": "Keyword Keyness / Salience Analysis",
        "topics": [
            _t(
                "기후정책 보도의 키워드 핵심성 비교",
                "신문 기사 대상≈80만 어절 / 일반뉴스 참조≈200만",
                "대상–참조 키니스",
                "위기·전환 담화",
                "ksa_climate",
                "기후정책 코퍼스에서 ‘전환·책임·위기’ 계열 키워드의 keyness가 유의하게 높다",
                "기후·에너지 정책 기사",
                "동일기간 일반뉴스",
            ),
            _t(
                "대학 강의평가 서술의 긍정·부정 키워드 핵심성",
                "긍정평가≈12만 / 부정평가≈9만 어절",
                "하위코퍼스 대비",
                "교수·수업 평가어",
                "ksa_course",
                "부정 하위코퍼스에서 ‘피드백·불명확·과제’ 계열의 keyness가 두드러진다",
                "부정 서술형 평가",
                "긍정 서술형 평가",
            ),
            _t(
                "스타트업 IR 자료 vs 일반 기업공시 키워드 핵심성",
                "IR 덱트·공시문 대상≈5만 / 상장사 공시 참조≈40만",
                "장르 대비 키니스",
                "성장·리스크 어휘",
                "ksa_ir",
                "스타트업 IR에서 ‘확장·시장·성장’ 키워드의 상대빈도가 참조 대비 높다",
                "스타트업 IR·피치",
                "상장사 정기공시",
            ),
            _t(
                "환자 온라인 후기 vs 의료기관 공식안내 키워드 핵심성",
                "후기≈15만 / 안내문≈6만 어절",
                "장르·화자 대비",
                "대기·설명·공감",
                "ksa_patient",
                "환자 후기에서 ‘대기·설명부족·공감’ 계열 keyness가 공식안내와 대비된다",
                "환자 커뮤니티 후기",
                "병원 공식 안내문",
            ),
            _t(
                "지방선거 후보 연설의 지역현안 키워드 핵심성",
                "후보연설≈20만 / 전국정치연설 참조≈100만",
                "지역–전국 대비",
                "현안·공약 어휘",
                "ksa_election",
                "지방선거 연설에서 지역현안 고유명·생활밀착 키워드의 keyness가 높다",
                "지방선거 후보연설",
                "전국정치 연설 코퍼스",
            ),
        ],
    },
}
