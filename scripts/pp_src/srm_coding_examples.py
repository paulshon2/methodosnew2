# -*- coding: utf-8 -*-
"""Variableization / scale examples for Survey Research Method."""
from __future__ import annotations


def scale_rows(topic: dict, seed: int) -> list[list[str]]:
    a = 0.78 + (seed % 8) * 0.01
    return [
        ["척도", "문항수", "점수산출", "Cronbach α", "비고"],
        ["독립/예측", "5", "평균", f"{a:.2f}", topic.get("focus", "").split("→")[0][:8]],
        ["종속/결과", "4", "평균", f"{a - 0.03:.2f}", topic.get("focus", "").split("→")[-1][:8]],
        ["통제", "3", "합/더미", "—", "인구통계"],
    ]


def coding_na_rows(topic: dict) -> list[list[str]]:
    return [
        ["항목", "결정"],
        ["질적코딩", "해당없음"],
        ["수행내용", "응답 수치 변수화(평정척도(등간형)·더미)"],
        ["주제", topic.get("title", "")[:28]],
    ]


def desc_rows(topic: dict, seed: int) -> list[list[str]]:
    m1 = 3.2 + (seed % 10) * 0.05
    m2 = 3.0 + (seed % 8) * 0.05
    return [
        ["변수", "M", "SD", "n", "비고"],
        ["예측변수", f"{m1:.2f}", "0.72", str(300 + seed % 100), ""],
        ["결과변수", f"{m2:.2f}", "0.81", str(300 + seed % 100), ""],
        ["상관 r", f"{0.25 + (seed % 15) * 0.02:.2f}", "—", "—", topic.get("focus", "")[:12]],
    ]


def test_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["분석", "결과요지", "통계량", "p", "효과크기"],
        ["회귀/상관", "정(+)관계", f"β={0.22 + (seed % 10) * 0.01:.2f}", "<.05", "소–중"],
        ["집단비교", "집단차 유의", f"t={2.1 + (seed % 5) * 0.1:.1f}", "<.05", "d≈0.3"],
        ["가설", topic.get("hypothesis", "")[:28], "지지/부분", "—", ""],
    ]
