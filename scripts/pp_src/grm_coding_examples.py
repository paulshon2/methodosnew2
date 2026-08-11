# -*- coding: utf-8 -*-
"""Coding examples for General Methodology stage ③."""
from __future__ import annotations


def coding_rows(topic: dict, seed: int) -> list[list[str]]:
    mode = topic.get("mode", "")
    if "면담" in mode and "설문" not in mode:
        return [
            ["코드", "주제정의", "자료출처", "메모"],
            ["T01", "경험핵심", "면담", ""],
            ["T02", "맥락조건", "면담", ""],
            ["T03", topic.get("focus", "")[:10], "면담", "초점"],
            ["T04", "경계/기타", "문헌메모", f"s={seed%3}"],
        ]
    if "2차" in mode or "양적" in mode:
        return [
            ["변수", "정의", "척도", "출처"],
            ["Y", "결과변수", "연속/이분", "공개자료"],
            ["X1", "핵심설명", "연속/범주", ""],
            ["C1", "통제", "연속", ""],
            ["C2", topic.get("focus", "")[:8], "범주", "초점"],
        ]
    # survey or mixed
    return [
        ["유형", "적용", "산출", "비고"],
        ["주제코딩", "면담 있을 때", "코드북", "선택"],
        ["변수화", "설문/2차", "데이터사전", "기본"],
        ["초점", topic.get("focus", "")[:10], "정렬키", ""],
        ["미적용가닥", "명시", "N/A표기", f"s={seed%2}"],
    ]


def coding_proc(topic, method_name, seed):
    return [
        f"【선택코딩】「{topic['title']}」 설계({topic.get('mode')})에 따라 주제코딩·변수화를 선택 적용한다.",
        f"【초점】{topic.get('focus')}. 전략={topic.get('strategy')}. ({method_name})",
        f"【규모】핵심코드/변수 {4 + seed % 3}개(+통제/경계).",
        "【산출】코드북 또는 데이터사전.",
    ]
