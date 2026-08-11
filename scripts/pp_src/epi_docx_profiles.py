# -*- coding: utf-8 -*-
"""Canonical topics (1 × 5) for Epidemiology Research Archetype."""
from __future__ import annotations


def _t(title, participants, mode, focus, akey, claim, exposure="", outcome=""):
    return {
        "title": title,
        "participants": participants,
        "mode": mode,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
        "exposure": exposure or "노출",
        "outcome": outcome or "결과",
    }


METHOD_PROFILES: dict[int, dict] = {
    193: {
        "en": "Modern Epidemiology",
        "topics": [
            _t(
                "대기오염 장기노출과 심혈관질환 발생 코호트 연구",
                "지역주민 코호트 n≈12,000 · 추적 8년",
                "코호트",
                "PM2.5–CVD",
                "epi_air",
                "PM2.5 고노출군에서 심혈관질환 발생의 상대위험도가 유의하게 높다",
                "PM2.5(연평균)",
                "심혈관질환 신규발생",
            ),
            _t(
                "야간교대근무와 유방암의 환자-대조군 연구",
                "환자 420명 / 대조군 840명(연령·지역 매칭)",
                "환자-대조군",
                "교대–유방암",
                "epi_shift",
                "장기 야간교대 노출의 교차비가 1보다 유의하게 크다",
                "야간교대 누적년수",
                "유방암(진단)",
            ),
            _t(
                "당류음료 섭취와 비만의 단면연구",
                "성인 건강조사 n≈5,800",
                "단면연구",
                "SSB–비만",
                "epi_ssb",
                "당류음료 고섭취군에서 비만 유병 교차비가 높다(단면 연관)",
                "당류음료 주당섭취",
                "비만(BMI≥25)",
            ),
            _t(
                "금연클리닉 참여와 심근경색 재발의 생존분석 코호트",
                "AMI 후 환자 n≈2,400 · 추적 5년",
                "코호트(생존)",
                "금연개입–재발",
                "epi_smoke",
                "클리닉 참여군에서 재발까지의 hazard가 비참여군보다 낮다",
                "금연클리닉 참여",
                "심근경색 재발",
            ),
            _t(
                "소아 항생제 조기노출과 천식의 환자-대조군 연구",
                "천식 환자 310 / 대조 620(연령·성별 매칭)",
                "환자-대조군",
                "항생제–천식",
                "epi_abx",
                "생후 2년 이내 항생제 노출의 교차비가 천식과 양의 연관을 보인다",
                "생후2년 항생제",
                "소아천식",
            ),
        ],
    },
}
