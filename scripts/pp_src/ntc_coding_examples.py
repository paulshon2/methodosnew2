# -*- coding: utf-8 -*-
"""Coding examples for Nursing Theory Construction stage ③."""
from __future__ import annotations


def open_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["발췌ID", "원문요지", "초기코드", "간호메모", "비고"],
        ["P01-12", "「혼자 견뎌야…」", "OC_고립", "지지공백", ""],
        ["P01-20", "「그래도 지켜야죠」", "OC_의무", "돌봄규범", ""],
        ["P02-08", f"「{topic.get('focus','')[:8]}…」", "OC_초점", "핵심현상", ""],
        ["P02-15", "「몸이 먼저 알려요」", "OC_체현", "증상신호", ""],
        ["P03-06", "「팀과 맞춰요」", "OC_협상", "다학제", f"s={seed%5}"],
    ]


def cat_rows(topic: dict) -> list[list[str]]:
    return [
        ["범주", "포함코드", "정의", "간호함의"],
        ["지지·관계", "OC_고립 등", "도움·인정·연결", "지지자원 설계"],
        ["규범·의무", "OC_의무", "해야 한다는 압박", "부담조절"],
        ["몸·경험", "OC_체현", "신체·정서 신호", "사정포인트"],
        ["협상·조율", "OC_협상/초점", topic.get("focus", "")[:14], "중재전략"],
    ]


def theme_rows(topic: dict) -> list[list[str]]:
    return [
        ["주제", "핵심의미", "근거범주", "이론요소", "한줄"],
        ["T1 보이지 않는 부담", "인정받지 못한 수고", "지지·관계", "조건", "비가시"],
        ["T2 몸의 경고", "증상·피로 신호", "몸·경험", "과정단서", "체현"],
        ["T3 협상적 돌봄", "규범과 일상의 조율", "협상·조율", "핵심과정", "협상"],
        ["T4 초점이론", topic.get("focus", "")[:14], "통합", "결과", topic.get("hypothesis", "")[:22]],
    ]


def coding_proc_open(topic, method_name, seed):
    return [
        f"【개방코딩】「{topic['title']}」 자료에 초기코드를 생성한다.",
        f"【민감성】간호 개념(돌봄·고통·지지·정체성). ({method_name})",
        f"【규모】참여자당 약 {35 + seed % 20}코드 후 통합.",
        "【산출】초기코드표.",
    ]


def coding_proc_cat(topic, method_name):
    return [
        "【범주화】유사 초기코드를 범주로 묶고 정의한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【관계】범주 간 조건·상호작용을 메모한다.",
        "【산출】범주표.",
    ]


def coding_proc_theme(topic, method_name):
    return [
        "【주제도출】범주를 관통하는 주제를 명명한다.",
        f"【이론화】중범위 명제 초안: {topic.get('hypothesis')}",
        f"【모드】{topic.get('mode')}. ({method_name})",
        "【산출】주제·이론요소표.",
    ]
