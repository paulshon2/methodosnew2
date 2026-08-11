# -*- coding: utf-8 -*-
"""Coding / candidate keyword examples for Keyword Salience Analysis stage ③."""
from __future__ import annotations


def candidate_rows(topic: dict, seed: int) -> list[list[str]]:
    focus = topic.get("focus", "초점")[:10]
    return [
        ["후보어", "주제표지", "대상빈도", "참조빈도", "메모"],
        ["전환", "프레임A", str(420 + seed % 40), str(180 + seed % 20), "후보"],
        ["책임", "프레임A", str(310 + seed % 30), str(220 + seed % 25), ""],
        ["위기", "프레임B", str(280 + seed % 35), str(90 + seed % 15), "고대비"],
        [focus[:4] or "현안", "초점군", str(150 + seed % 20), str(40 + seed % 10), topic.get("focus", "")[:8]],
        ["잡음어", "제외후보", str(90), str(85), "고유명/숫자"],
    ]


def coding_proc_kw(topic, method_name, seed):
    return [
        f"【코딩】「{topic['title']}」에서 질적 주제표지와 양적 빈도변수화를 병행한다.",
        f"【초점】{topic.get('focus')}. 대상={topic.get('target_corpus')}. ({method_name})",
        f"【규모】후보어 {20 + seed % 15}개 → 주제군 {4 + seed % 2}개.",
        "【산출】후보·주제표지표.",
    ]
