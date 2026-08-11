# -*- coding: utf-8 -*-
"""Coding / synthesis examples for Qualitative Meta-Synthesis stage ③."""
from __future__ import annotations


def translation_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["연구A개념", "연구B개념", "번역관계", "근거요지", "메모"],
        ["두려움", "불안", "상호번역", "유사 정서경험", ""],
        ["협상", "조율", "상호번역", "일상-제도", "핵심"],
        ["회복", "재구성", "정교화번역", "단순복원≠", ""],
        ["낙인", "체면", "부분번역", "문화맥락", "긴장"],
        [topic.get("focus", "")[:8], "인접개념", "상호번역", f"seed={seed%7}", "초점"],
    ]


def synthesis_rows(topic: dict) -> list[list[str]]:
    return [
        ["통합주제", "포함개념", "지지연구", "상반/조건", "한줄"],
        ["T1 협상적 자기관리", "협상·조율", "다수", "급성기엔 약화", "협상"],
        ["T2 인정과 관계", "인정공백·단절", "다수", "강한동료지지시완화", "관계"],
        ["T3 새로운 정상", "재구성·적응", "다수", "자원부족시좌절", "정상성"],
        ["T4 초점통합", topic.get("focus", "")[:12], "핵심편", "맥락의존", topic.get("hypothesis", "")[:22]],
    ]


def coding_proc_translation(topic, method_name, seed):
    return [
        f"【번역코딩】「{topic['title']}」 개별 연구의 은유·개념을 상호 번역한다.",
        f"【규칙】원문 용어 보존 + 대응관계 명시. ({method_name})",
        f"【규모】연구쌍 번역 약 {20 + seed % 15}건 후 통합.",
        "【산출】번역 코딩표.",
    ]


def coding_proc_synthesis(topic, method_name):
    return [
        "【종합】유사·상반 개념을 통합적 주제로 종합(synthesis)한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【긴장】상반 발견은 조건·맥락으로 서술한다.",
        "【산출】통합 주제표.",
    ]
