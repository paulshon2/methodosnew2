# -*- coding: utf-8 -*-
"""Coding examples for Symbolic Interactionism stage ③."""
from __future__ import annotations


def symbol_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["단위ID", "관찰요지", "상징코드", "행위자의미", "메모"],
        ["S01", "호칭·별명 사용", "SYM_호칭", "친밀/거리", "관계표시"],
        ["S02", "시선·고개짓", "SYM_시선", "승인/무시", "비언어"],
        ["S03", f"{topic.get('focus','')[:8]} 관련 말", "SYM_초점", "공유뜻", "핵심"],
        ["S04", "사물·자리 배치", "SYM_사물", "경계/소속", "물질상징"],
        ["S05", "침묵·망설임", "SYM_침묵", "체면/갈등", ""],
        [f"S{(seed%4)+6:02d}", "유머·반말 전환", "SYM_톤", "라포", "전환"],
    ]


def ritual_rows(topic: dict) -> list[list[str]]:
    return [
        ["범주", "포함코드", "정의", "성공신호", "실패신호"],
        ["개시의례", "S01/S02", "시작 인사·자리잡기", "응답·눈맞춤", "무시·지연"],
        ["공동초점", "S03", "함께 주목하는 대상/주제", "동시반응", "산만"],
        ["예의·얼굴", "S05/S01", "체면 지키기 규칙", "완화발화", "공개망신"],
        ["종료의례", "S02", "마무리·퇴장", "인사교환", "갑작스런끊김"],
        ["초점의례", topic.get("focus", "")[:12], "주제 특화 반복", "반복성공", "규칙다툼"],
    ]


def negotiate_rows(topic: dict) -> list[list[str]]:
    return [
        ["에피소드", "초기정의", "도전/제안", "조율결과", "주도행위자"],
        ["E1", "공식규칙", "현장해석", "타협", "중간역할"],
        ["E2", "장난", "피해호소", "재정의(폭력)", "목격자"],
        ["E3", "괜찮다", "재질문", "다층의미 인정", "돌봄자"],
        ["E4", topic.get("focus", "")[:10], "대안상징", topic.get("hypothesis", "")[:18], "공동"],
    ]


def coding_proc_symbol(topic, method_name, seed):
    return [
        f"【상징코딩】「{topic['title']}」 장면에서 상징·의미 단위를 개념적으로 식별한다.",
        f"【규칙】말·몸짓·사물·공간을 포함. ({method_name})",
        f"【규모】초기단위 약 {35 + seed % 20}개 후 통합.",
        "【산출】상징·의미 단위표.",
    ]


def coding_proc_ritual(topic, method_name):
    return [
        "【범주화】상호작용 규칙·의례적 요소(개시·공동초점·예의·종료)로 묶는다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【성패】의례 성공/실패 신호를 표시한다.",
        "【산출】의례·규칙 범주표.",
    ]


def coding_proc_negotiate(topic, method_name):
    return [
        "【의미협상】행위자 간 뜻이 맞춰지거나 어긋나는 과정을 분석한다.",
        f"【검토】주장: {topic.get('hypothesis')}",
        f"【모드】{topic.get('mode')}. ({method_name})",
        "【산출】의미협상 과정표.",
    ]
