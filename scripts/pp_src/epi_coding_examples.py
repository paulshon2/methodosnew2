# -*- coding: utf-8 -*-
"""Variable dictionary helpers for Epidemiology (coding stage N/A)."""
from __future__ import annotations


def var_dict_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["변수", "역할", "조작적정의", "코딩"],
        [topic.get("exposure", "노출")[:12], "노출", "연속/범주 컷", f"0/1 또는 Q{1+seed%4}"],
        [topic.get("outcome", "결과")[:12], "결과", "사건 유무/시점", "0/1 (+time)"],
        ["age", "보정", "연령(세)", "연속"],
        ["sex", "보정/층화", "성별", "0/1"],
        ["ses", "보정", "사회경제", "3수준"],
    ]


def coding_proc_na(topic, method_name):
    return [
        "【해당없음】질적 주제코딩 단계는 본 역학 프로세스에서 적용하지 않는다.",
        f"【데이터사전】노출·결과·보정변수의 범주정의를 고정한다. 「{topic['title']}」.",
        f"【설계】{topic.get('mode')}. ({method_name})",
        "【산출】변수사전(코드북)만 유지.",
    ]
