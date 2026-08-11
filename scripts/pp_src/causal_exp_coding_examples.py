# -*- coding: utf-8 -*-
"""Variable-coding & design tables for Causal–Experimental stage ③ (N/A qualitative)."""
from __future__ import annotations


def analysis_codebook(topic: dict) -> list[list[str]]:
    akey = topic.get("analysis_key", "")
    rows = [
        ["변수", "정의", "값", "비고"],
        ["unit_id", "분석단위 ID", "문자열/정수", topic.get("units", "")],
        ["treat", "처치(또는 배정)", "0/1", topic.get("treatment", "")],
        ["y", "결과", "연속/이진", topic.get("outcome", "")],
        ["t", "시점", "정수/날짜", "사전=0,사후=1 또는 연월"],
    ]
    if "did" in akey or akey.endswith("_es") or "did" in akey:
        rows += [["post", "사후시기", "0/1", ""], ["did", "treat×post", "0/1", "주상호작용"]]
    if "rdd" in akey:
        rows += [["running", "러닝변수", "연속", "컷오프 기준 중심화"], ["above", "컷오프 이상", "0/1", ""]]
    if "iv" in akey:
        rows += [["z", "도구변수", "0/1또는연속", "배정/거리/추첨"], ["d_receive", "실제수령", "0/1", "TOT/LATE"]]
    if akey.startswith(("doe_", "ct_", "fe_", "ci1_")):
        rows += [["strata", "층화/블록", "범주", "학교·기관"], ["cluster_id", "클러스터", "ID", "SE 클러스터링"]]
    rows.append(["attrition", "탈락", "0/1", "사후관측 없음"])
    return rows


def coding_proc_na(topic: dict, method_name: str) -> list[str]:
    return [
        "【해당없음】 질적 주제코딩·개방코딩은 수행하지 않는다(아키타입 규정).",
        f"【대체】 분석용 변수 코딩만 수행: treat/y/시점/층화/도구/러닝변수. 주제 「{topic['title']}」.",
        f"【코드북】 아래 표와 같이 0/1·시점 정의를 고정. ({method_name})",
        "【QC】 배정 로그와 treat 변수의 일치, 중복 ID, 시점 정렬을 점검한다.",
    ]


def balance_rows(seed: int) -> list[list[str]]:
    return [
        ["공변량", "Treat M", "Control M", "SMD", "판정"],
        ["연령", "34.2", "33.8", "0.04", "균형"],
        ["여성%", "0.52", "0.50", "0.05", "균형"],
        ["사전점수", "50.1", "49.7", "0.06", "균형"],
        ["소득로그", "3.21", "3.35", f"{0.12 + (seed % 10)/100:.2f}", "주의" if seed % 3 == 0 else "균형"],
        ["지역도시%", "0.61", "0.58", "0.07", "균형"],
    ]
