# -*- coding: utf-8 -*-
"""Coding examples for Case Study stage ③."""
from __future__ import annotations


def within_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["사례", "코드", "정의", "근거자료", "메모"],
        ["C1", "WC_촉진", "변화를 돕는 조건", "면담/문서", ""],
        ["C1", "WC_장벽", "지연·저항 요인", "관찰/기록", ""],
        ["C2", "WC_촉진", "유사 촉진", "면담", "비교후보"],
        ["C2", "WC_특수", topic.get("focus", "")[:10], "문서", "사례특수"],
        [f"C{(seed%3)+1}", "WC_전환점", "국면 전환 사건", "연대기", "핵심"],
    ]


def cross_rows(topic: dict) -> list[list[str]]:
    return [
        ["패턴", "C1", "C2", "C3", "조건"],
        ["중간관리 조율", "강", "중", "약", "권한위임"],
        ["보고 안전문화", "중", "강", "약", "비난회피"],
        ["의제설정권", "약", "중", "강", "거버넌스"],
        ["초점패턴", "유", "유", "무", topic.get("focus", "")[:12]],
    ]


def pattern_rows(topic: dict) -> list[list[str]]:
    return [
        ["기법", "예상/경쟁설명", "관찰결과", "판정", "수정"],
        ["패턴매칭", "기술→성과", "조율→성과", "부분불일치", "모형수정"],
        ["패턴매칭", "참여형식↑", "의제실질↑", "대안채택", "재정의"],
        ["설명구축", "장벽누적→정체", "전환점에서 분기", "지지", "경로정교화"],
        ["경쟁설명", "자원부족만", "문화·권한이 더 설명", "기각(부분)", "복합설명"],
        ["통합", topic.get("hypothesis", "")[:20], "다수사례지지", "채택", "명제화"],
    ]


def coding_proc_within(topic, method_name, seed):
    return [
        f"【within-case】「{topic['title']}」의 각 사례를 개별 코딩한다.",
        f"【규칙】공통코드+사례특수코드. ({method_name})",
        f"【규모】사례당 대략 {30 + seed % 20}코드 후 정리.",
        "【산출】사례 내 코딩표.",
    ]


def coding_proc_cross(topic, method_name):
    return [
        "【cross-case】사례 간 공통·대비·부재 패턴을 도출한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【표】패턴×사례 행렬로 가시화한다.",
        "【산출】사례 간 비교표.",
    ]


def coding_proc_pattern(topic, method_name):
    return [
        "【패턴매칭·설명구축】예상 패턴과 관찰을 대조하고 설명을 구축한다.",
        f"【검토】주장: {topic.get('hypothesis')}",
        f"【모드】{topic.get('mode')}. ({method_name})",
        "【산출】패턴매칭·설명구축 로그.",
    ]
