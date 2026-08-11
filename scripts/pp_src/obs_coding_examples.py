# -*- coding: utf-8 -*-
"""Coding scheme examples for Observation Technique stage ③."""
from __future__ import annotations


def scheme_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["범주코드", "정의", "포함예", "제외예"],
        ["B01_온과제", "과제 관련 주의/행동", "필기·응답", "멍하니"],
        ["B02_이탈", "과제 이탈", "잡담·휴대폰", "짧은시선이동"],
        ["B03_상호작용", "동료/스태프 교류", "질문·도움", "혼잣말"],
        ["B04_초점", topic.get("focus", "")[:12], "핵심행동", "모호행동"],
        ["B05_기타", "기타/불명", "—", f"s={seed%4}"],
    ]


def coded_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["구간/사건", "관찰자A", "관찰자B", "최종코드", "메모"],
        ["T01", "B01", "B01", "B01", "일치"],
        ["T02", "B02", "B03", "B02", "합의후"],
        ["T03", "B04", "B04", "B04", topic.get("focus", "")[:8]],
        ["T04", "B01", "B01", "B01", ""],
        ["T05", "B05", "B02", "B02", f"재코딩{seed%3}"],
    ]


def freq_rows(topic: dict, seed: int) -> list[list[str]]:
    base = 40 + seed % 20
    return [
        ["범주", "빈도", "비율(%)", "비고"],
        ["B01_온과제", str(base), f"{35 + seed % 10}", ""],
        ["B02_이탈", str(base - 15), f"{20 + seed % 8}", ""],
        ["B03_상호작용", str(base - 20), f"{15 + seed % 6}", ""],
        ["B04_초점", str(18 + seed % 7), f"{12 + seed % 5}", topic.get("focus", "")[:10]],
        ["B05_기타", str(8 + seed % 4), f"{5 + seed % 3}", ""],
    ]


def coding_proc_scheme(topic, method_name, seed):
    return [
        f"【코딩체계】「{topic['title']}」 행동범주 체계를 개발한다.",
        f"【원칙】상호배타·포괄. 초점={topic.get('focus')}. ({method_name})",
        f"【규모】핵심범주 {5 + seed % 3}개(+기타).",
        "【산출】코드북.",
    ]


def coding_proc_apply(topic, method_name):
    return [
        "【적용코딩】사전 정의 범주에 관찰내용을 코딩한다.",
        f"【단위】시간구간/사건. 모드={topic.get('mode')}. ({method_name})",
        "【QC】불일치 구간 재합의.",
        "【산출】코딩표.",
    ]
