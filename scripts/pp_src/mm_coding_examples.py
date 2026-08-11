# -*- coding: utf-8 -*-
"""Coding / integration examples for Mixed Methods Design stage ③."""
from __future__ import annotations


def theme_rows(topic: dict, seed: int) -> list[list[str]]:
    focus = topic.get("focus", "초점")[:10]
    return [
        ["코드", "주제정의", "대표발화(요약)", "연결양변수"],
        ["T01", "연결/단절", "‘화면만 보고…’", "소속감"],
        ["T02", "정보·절차", "‘어디를 봐야…’", "정보만족"],
        ["T03", focus, "초점 관련 진술", topic.get("quant_strand", "")[:8]],
        ["T04", "자원·지원", "‘도움창구가…’", "지원인식"],
        ["T05", "기타/경계", f"모호·중복(s={seed%3})", "—"],
    ]


def quantitize_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["참여자", "T01강도(0–2)", "T02강도", "T03강도", "양척도(요약)", "변환메모"],
        ["Q01", "2", "1", "2", "낮음", "면담→점수"],
        ["Q02", "0", "2", "1", "중간", ""],
        ["Q03", "1", "1", "2", "낮음", topic.get("focus", "")[:8]],
        ["Q04", "2", "0", "1", "높음", f"규칙v{1+seed%2}"],
        ["…", "—", "—", "—", "—", "표본행"],
    ]


def coding_proc_theme(topic, method_name, seed):
    return [
        f"【주제코딩】「{topic['title']}」 질적 가닥에 주제코딩을 적용한다.",
        f"【초점】{topic.get('focus')}. 가닥={topic.get('qual_strand')}. ({method_name})",
        f"【규모】핵심주제 {4 + seed % 2}개(+경계).",
        "【산출】코드북·코딩표.",
    ]


def coding_proc_transform(topic, method_name):
    mode = topic.get("mode", "")
    if "탐색" in mode:
        direction = "질→양 확인용 quantitizing 비중↑"
    elif "설명" in mode:
        direction = "양 결과 설명용 qualitizing·선택적 quantitizing"
    else:
        direction = "수렴 비교용 quantitizing + qualitizing"
    return [
        f"【변환】{direction}.",
        f"【규칙】주제강도→점수, 또는 점수패턴→서사. ({method_name})",
        f"【정렬】양 가닥={topic.get('quant_strand')}.",
        "【산출】변환표·매핑키.",
    ]
