# -*- coding: utf-8 -*-
"""Coding examples for In-depth Interview stage ③."""
from __future__ import annotations


def open_code_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["발췌ID", "원문요지", "초기코드", "인비보", "메모"],
        ["P01-14", "「혼자 다 알아서…」", "OC_고립", "알아서", "지원공백?"],
        ["P01-22", "「그때부터 잠이…」", "OC_몸반응", "잠", "소진"],
        ["P02-08", f"「{topic.get('focus','')[:8]}…」", "OC_초점", "—", "핵심"],
        ["P02-19", "「남들은 모르죠」", "OC_비가시", "모르죠", "인정욕구"],
        ["P03-05", "「그래도 버텨요」", "OC_견딤", "버텨", "전략"],
        [f"P0{(seed%4)+1}-{(seed%20)+10}", "「다시는…」", "OC_전환", "다시는", "변화"],
    ]


def category_rows(topic: dict) -> list[list[str]]:
    return [
        ["범주", "포함 초기코드", "정의", "제외", "대표발췌"],
        ["지원·관계", "OC_고립/비가시", "도움·인정 관련", "순수정보요청", "P01-14"],
        ["몸·감정", "OC_몸반응", "신체·정서 반응", "사실일정만", "P01-22"],
        ["전략·협상", "OC_견딤/전환", "대처·선택", "타인비난만", "P03-05"],
        ["제도·맥락", "OC_초점 관련", topic.get("focus", "")[:14], "사담", "P02-08"],
    ]


def theme_rows(topic: dict) -> list[list[str]]:
    return [
        ["주제", "핵심의미", "근거범주", "참여자", "한줄"],
        ["T1 보이지 않는 노동/부담", "인정받지 못하는 수고", "지원·관계", "다수", "비가시성"],
        ["T2 몸과 일상의 흔들림", "수면·리듬 붕괴", "몸·감정", "P01,P04", "체현"],
        ["T3 버티기와 협상", "한계 내 조율", "전략·협상", "다수", "에이전시"],
        ["T4 초점주제", topic.get("focus", "")[:16], "제도·맥락", "다수", topic.get("hypothesis", "")[:24]],
    ]


def coding_proc_open(topic, method_name, seed):
    return [
        f"【개방코딩】전사본 의미단위에 초기코드. 「{topic['title']}」.",
        f"【규칙】과잉추상 금지, 인비보 허용. ({method_name})",
        f"【규모】참여자당 대략 {40 + seed % 20}코드 후 통합.",
        "【산출】초기코드 목록.",
    ]


def coding_proc_cat(topic, method_name):
    return [
        "【범주화】유사 초기코드를 묶어 범주명·정의를 정한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【코드북】포함·제외·예시 고정.",
        "【산출】범주표.",
    ]


def coding_proc_theme(topic, method_name):
    return [
        "【주제분석】범주를 관통하는 theme을 도출·명명한다.",
        f"【검토】대표인용·반례. 주장: {topic.get('hypothesis')}",
        f"【모드】{topic.get('mode')} 자료 특성을 반영. ({method_name})",
        "【산출】주제 정의표.",
    ]
