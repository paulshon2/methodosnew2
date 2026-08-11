# -*- coding: utf-8 -*-
"""Indicator / network examples for Bibliometrics stage ④ (coding N/A)."""
from __future__ import annotations


def indicator_rows(topic: dict, seed: int) -> list[list[str]]:
    base = 1200 + seed % 800
    return [
        ["단위", "지표", "값", "비고"],
        ["코퍼스", "문헌수(N)", str(base), "정제후"],
        ["코퍼스", "총인용", str(base * 8 + seed), ""],
        ["저자", "상위 h-지수", str(18 + seed % 10), "저자단위"],
        ["논문", "상위피인용", str(400 + seed % 200), "논문단위"],
        ["초점", topic.get("focus", "")[:14], "요약지표", topic.get("hypothesis", "")[:20]],
    ]


def network_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["분석", "결과요지", "중심성예", "해석"],
        ["시계열회귀", "연평균 +%d%%" % (5 + seed % 8), "β>0", "성장"],
        ["공저망", "클러스터 %d개" % (3 + seed % 3), "degree top", "협업핵"],
        ["인용망", "중개허브 존재", "betweenness", "경로"],
        ["초점링크", topic.get("focus", "")[:12], "ego망", "핵심구조"],
    ]


def coding_na_rows(topic: dict) -> list[list[str]]:
    return [
        ["항목", "결정"],
        ["질적코딩", "해당없음"],
        ["대체절차", "계량지표·네트워크 분석"],
        ["주제", topic.get("title", "")[:28]],
    ]


def stats_proc_indicators(topic, method_name, seed):
    return [
        f"【계량지표】「{topic['title']}」 코퍼스에서 인용지수·h-지수 등을 산출한다.",
        f"【단위】논문/저자/기관/저널을 구분해 집계. ({method_name})",
        f"【QC】이상치·자기인용 옵션을 기록. seed={seed % 9}.",
        "【산출】지표 요약표.",
    ]


def stats_proc_network(topic, method_name):
    return [
        "【시계열·네트워크】연도별 추세 회귀와 공저·인용망 중심성을 분석한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【검증】컴포넌트·고립점·기간창 민감도를 점검한다.",
        "【산출】회귀요지·중심성 표.",
    ]
