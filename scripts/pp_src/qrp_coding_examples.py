# -*- coding: utf-8 -*-
"""Coding / factor-interpretation examples for Q Methodology stage ③."""
from __future__ import annotations


def qset_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["진술ID", "범주", "진술문요지", "출처", "비고"],
        ["Q01", "기회/이득", "도움이 된다", "면담", ""],
        ["Q02", "비용/부담", "부담이 크다", "문헌", ""],
        ["Q03", "관계/인정", "관계가 흔들린다", "미디어", ""],
        ["Q04", "제도/규범", "규칙이 필요하다", "정책", ""],
        ["Q05", "초점", topic.get("focus", "")[:14], "합성", f"s={seed%5}"],
    ]


def factor_label_rows(topic: dict) -> list[list[str]]:
    return [
        ["요인", "가명", "대표(+)", "대표(−)", "한줄"],
        ["F1", "기회확장형", "Q01/Q05", "Q02", "긍정·확장"],
        ["F2", "관계손실형", "Q03", "Q01", "관계우려"],
        ["F3", "규율·책임형", "Q04", "Q01", "제도강조"],
        ["통합메모", "—", "구분진술", "공유진술", topic.get("hypothesis", "")[:22]],
    ]


def coding_proc_qset(topic, method_name, seed):
    return [
        f"【개념코딩】「{topic['title']}」 concourse 발언을 범주화해 Q-set을 구성한다.",
        f"【규모】진술 약 {40 + seed % 12}개로 정제. ({method_name})",
        "【파일럿】이해도·중복·편향을 점검한다.",
        "【산출】Q-set·범주표.",
    ]


def coding_proc_factor_labels(topic, method_name):
    return [
        "【유형명명】요인추출 후 대표(±)진술문으로 관점을 해석·명명한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        f"【주장점검】{topic.get('hypothesis')}",
        "【산출】유형 라벨·대표진술표.",
    ]
