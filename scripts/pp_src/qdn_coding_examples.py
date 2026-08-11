# -*- coding: utf-8 -*-
"""Coding / design-strategy examples for Qualitative Design–Naturalistic stage ③."""
from __future__ import annotations


def strategy_rows(topic: dict, seed: int) -> list[list[str]]:
    mode = topic.get("mode", "")
    if "혼합" in mode:
        strat = "통합코딩+양적지표 병행(질적 범주↔문항)"
    elif "근거" in mode:
        strat = "개방→축→선택(이론적 코딩)"
    elif "현상" in mode:
        strat = "의미단위→주제적 묶음(본질 기술)"
    elif "자연" in mode:
        strat = "현장코드→패턴·맥락 코드"
    elif "용어" in mode:
        strat = "용어–절차–증거 연결 코딩"
    else:
        strat = "주제적·개념적 코딩(설계 정합)"
    return [
        ["구분", "내용", "비고"],
        ["설계모드", mode, topic.get("focus", "")[:18]],
        ["코딩전략", strat, f"seed={seed % 7}"],
        ["코드북 초안", "정의·예시·제외", "v0.9"],
        ["민감성 메모", "개념질문 병행", "필수"],
        ["산출", "전략적용 로그", topic.get("title", "")[:20]],
    ]


def peer_rows(topic: dict) -> list[list[str]]:
    return [
        ["쟁점", "연구자안", "동료피드백", "결정"],
        ["코드명 추상도", "다소 추상", "인비보 유지 권고", "재명명"],
        ["범주 중복", "2범주 유사", "통합 제안", "통합"],
        ["부정사례", "미포함", "1건 추가", "포함"],
        ["초점정렬", topic.get("focus", "")[:14], "질문과 정합", "유지"],
        ["주장강도", topic.get("hypothesis", "")[:18], "증거 보강", "문장완화"],
    ]


def coding_proc_strategy(topic, method_name, seed):
    return [
        f"【코딩전략】「{topic['title']}」에 대해 설계 전통({topic.get('mode')})에 맞는 "
        f"주제적/개념적/이론적 코딩을 적용한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        f"【규모】초기코드 약 {35 + seed % 25}개 후 통합·정리.",
        "【산출】코딩전략 적용표·코드북 초안.",
    ]


def coding_proc_peer(topic, method_name):
    return [
        "【동료검토】코드·범주·해석 초안을 동료와 점검한다(peer debriefing).",
        f"【쟁점】주장 「{topic.get('hypothesis')}」의 과잉/과소 해석 여부.",
        f"【기록】불일치·합의·보류를 감사기록에 남긴다. ({method_name})",
        "【산출】동료검토 의사록·개정 코드북.",
    ]
