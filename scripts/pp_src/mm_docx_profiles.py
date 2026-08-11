# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for Mixed Methods Design Archetype."""
from __future__ import annotations


def _t(title, participants, mode, focus, akey, claim, quant="", qual=""):
    return {
        "title": title,
        "participants": participants,
        "mode": mode,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
        "quant_strand": quant or "설문·척도",
        "qual_strand": qual or "심층면담",
    }


METHOD_PROFILES: dict[int, dict] = {
    166: {
        "en": "Designing and Conducting Mixed Methods Research",
        "topics": [
            _t(
                "원격근무 전환 후 직무만족·소속감 혼합분석",
                "IT·서비스직 근로자 n≈220 / 면담 14명",
                "수렴적(동시)",
                "만족·연결감 합치",
                "mm_remote",
                "양적 만족도 저하 구간에서 질적 ‘단절 서사’가 수렴한다",
                "직무만족·소속감 척도",
                "원격경험 면담",
            ),
            _t(
                "신규 온보딩 교육 효과의 설명적 순차 혼합연구",
                "신입사원 설문 n≈180 → 면담 12명",
                "설명적 순차(양→질)",
                "점수차의 이유",
                "mm_onboard",
                "양적 효과 차이가 큰 하위집단의 질적 메커니즘이 설명된다",
                "사전·사후 역량점수",
                "학습경험 면담",
            ),
            _t(
                "지역보건 이용장벽의 탐색적 순차 혼합연구",
                "주민 면담 16명 → 지역설문 n≈320",
                "탐색적 순차(질→양)",
                "장벽 유형 일반화",
                "mm_health",
                "질적 도출 장벽 범주가 양적 측정에서도 재현된다",
                "장벽·이용의도 척도",
                "이용경험 면담",
            ),
            _t(
                "디지털 전환 조직저항의 수렴적 혼합분석",
                "중간관리자 설문 n≈150 / 면담 10명",
                "수렴적(동시)",
                "저항유형·강도",
                "mm_digital",
                "양적 저항점수와 질적 저항 유형이 측방검증된다",
                "변화저항 척도",
                "전환경험 면담",
            ),
            _t(
                "외래환자 대기경험의 설명적 순차 혼합연구",
                "외래환자 설문 n≈260 → 면담 15명",
                "설명적 순차(양→질)",
                "대기불만 기제",
                "mm_wait",
                "양적 대기만족 저하를 질적 정보·절차 단절로 설명할 수 있다",
                "대기·정보만족 척도",
                "대기경험 면담",
            ),
        ],
    },
}
