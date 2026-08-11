# -*- coding: utf-8 -*-
"""Coding examples for Conversation Analysis stage ③."""
from __future__ import annotations


def turn_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["줄", "화자", "현상", "코드", "메모"],
        ["12", "A", "자기선택 시작", "TT_self", ""],
        ["13", "B", "중첩 시작", "TT_overlap", "협력적?"],
        ["14", "A", "양보/지속", "TT_yield", ""],
        ["18", "B", "다음화자 선택", "TT_other", "호명"],
        ["22", "—", f"침묵(0.{3+seed%5})", "TT_gap", topic.get("focus", "")[:8]],
    ]


def practice_rows(topic: dict) -> list[list[str]]:
    return [
        ["줄", "현상", "유형", "선호/비선호", "요지"],
        ["30–32", "질문–대답", "인접쌍", "선호(즉시답)", "FPP→SPP"],
        ["40–45", "요청–거절", "인접쌍", "비선호(지연)", "완화+설명"],
        ["50–53", "자기수리", "수리", "선호", "잘라고침"],
        ["60–62", "타인개시수리", "수리", "완곡", "huh?/되묻기"],
        ["70+", topic.get("focus", "")[:10], "혼합", "—", topic.get("hypothesis", "")[:20]],
    ]


def coding_proc_turns(topic, method_name, seed):
    return [
        f"【순차·턴코딩】「{topic['title']}」 전사에서 발화순서(turn-taking) 구조를 코딩한다.",
        f"【포인트】TRP·선택·자기선택·중첩·침묵. ({method_name})",
        f"【규모】핵심 시퀀스 {8 + seed % 6}구간.",
        "【산출】턴/순차 코딩표.",
    ]


def coding_proc_practice(topic, method_name):
    return [
        "【식별】인접쌍·수리·선호구조를 표시한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【비선호】지연·완화·설명·계정(account)을 표시한다.",
        "【산출】인접쌍·수리·선호 식별표.",
    ]
