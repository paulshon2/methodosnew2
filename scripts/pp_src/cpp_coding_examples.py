# -*- coding: utf-8 -*-
"""Coding examples for Comparative Politics–Pattern Analysis stage ③."""
from __future__ import annotations


def category_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["범주", "정의", "사례A", "사례B", "패턴메모"],
        ["제도배치", "권력분산/집중", "연립·연방", "단원·다수", "합의/다수"],
        ["행위자연합", "엘리트·정당 타협", "강", "약", "이행기"],
        ["위기국면", "비상·경제충격", "유", "유", "견제장치"],
        ["개혁경로", "선거·분권 개혁", "점진", "단절", topic.get("focus", "")[:10]],
        ["초점코드", topic.get("focus", "")[:12], "고", "중", f"s={seed%5}"],
    ]


def coding_proc_cat(topic, method_name, seed):
    return [
        f"【주제·개념코딩】「{topic['title']}」 자료를 제도·행위자·국면 범주로 코딩한다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        f"【규모】핵심범주 {5 + seed % 3}개 + 하위코드.",
        "【산출】비교 코딩·범주표.",
    ]
