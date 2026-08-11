# -*- coding: utf-8 -*-
"""Step annotations for Survey Research Method DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"모집단|표본설계|표집", "「모집단」을 정의하고 「표본설계」로 누구를 어떻게 뽑을지 정합니다."),
    (r"설문지|예비조사|pilot", "설문지를 만들고 「예비조사」로 문항을 다듬은 뒤 본조사로 갑니다."),
    (r"본조사|대면|온라인|전화", "대면·온라인·전화 등으로 「본조사」를 실시해 구조화 응답을 수집합니다."),
    (r"결측|이상치", "빠진 값(결측)과 튀는 값(이상치)을 규칙에 따라 처리합니다."),
    (r"척도점수|신뢰도|Cronbach|α", "문항을 합쳐 척도점수를 만들고 Cronbach α로 신뢰도를 봅니다."),
    (r"변수화|코딩|해당없음", "질적 코딩은 해당 없고, 응답을 숫자 변수로 바꾸는 수준만 수행합니다."),
    (r"기술통계|평균|빈도", "평균·표준편차·빈도로 자료를 요약합니다."),
    (r"t검정|ANOVA|회귀|가설검정", "집단비교·회귀 등 가설검정으로 관계·차이를 검증합니다."),
    (r"유의성|p값|결과표|그래프", "유의성을 판정하고 표·그래프로 결과를 정리합니다."),
]


def _terms(text: str) -> list[str]:
    found, seen = [], set()
    for pat, expl in TERM_HINTS:
        if re.search(pat, text, re.I):
            k = expl[:40]
            if k not in seen:
                seen.add(k)
                found.append(expl)
    return found


STEP_NOTE_BANK: dict[tuple[int, int], list[str]] = {
    (0, 0): [
        "【모집단】조사 대상 전체를 문장으로 정의합니다.",
        "【표집】확률/비확률·층화·할당 등을 문서화합니다.",
        "【목표n】효과크기·검정력을 고려해 표본 수를 잡습니다.",
    ],
    (0, 1): [
        "【문항】구성개념→문항 초안을 만듭니다.",
        "【예비】소표본으로 이해도·시간·신뢰도를 점검합니다.",
        "【개정】모호·중복 문항을 수정합니다.",
    ],
    (0, 2): [
        "【본조사】확정 설문으로 자료를 수집합니다.",
        "【모드】대면/온라인/전화 특성을 기록합니다.",
        "【관리】응답률·독려·품질점검을 남깁니다.",
    ],
    (1, 0): [
        "【결측】MCAR/MAR 가정과 처리(삭제/대체)를 정합니다.",
        "【이상치】기준(예: |z|>3)과 처리를 문서화합니다.",
        "【로그】처리 전후 n을 기록합니다.",
    ],
    (1, 1): [
        "【척도】문항 합/평균으로 척도점수를 산출합니다.",
        "【α】Cronbach α≥.70을 기준으로 검토합니다.",
        "【역채점】해당 문항이 있으면 먼저 처리합니다.",
    ],
    (2, 0): [
        "【코딩】질적코딩 해당없음 — 수치 변수화만.",
        "【예】예/아니오→1/0, 평정척도(등간형)→1–5.",
    ],
    (3, 0): [
        "【기술통계】평균·SD·빈도·상관 요약을 산출합니다.",
        "【표】핵심 변수를 한 표로 제시합니다.",
    ],
    (3, 1): [
        "【검정】t/ANOVA/회귀 등 가설에 맞는 분석을 실시합니다.",
        "【가정】정규성·등분산 등을 점검합니다.",
        "【효과크기】d, η², β 등을 함께 보고합니다.",
    ],
    (4, 0): [
        "【유의성】α=.05 기준으로 가설을 판정합니다.",
        "【해석】통계적 유의≠실질적 중요을 구분합니다.",
    ],
    (4, 1): [
        "【표·그림】APA식 표와 그래프를 정리합니다.",
        "【캡션】표본·척도·유의표시를 명확히 합니다.",
        "【한계】표집·측정·인과추론 한계를 적습니다.",
    ],
    (5, 0): [
        "【산출】통계분석 결과보고서.",
        "【구성】설계·도구·기술통계·검정·해석·한계.",
        "【버전】날짜·분석코드.",
    ],
}


def task_step_annotations(stage_i, task_i, proc_paras, analysis_key, topic, method_name=""):
    n = max(len(proc_paras), 1)
    bank = STEP_NOTE_BANK.get((stage_i, task_i), [])
    out = []
    for i in range(n):
        step = proc_paras[i] if i < len(proc_paras) else ""
        note = bank[i] if i < len(bank) else (
            f"이 단계({stage_i+1}단계·태스크 {task_i+1}의 {i+1}번째 절차)를 문서화해 재현합니다."
        )
        parts = [note]
        if i == 0 and topic.get("title"):
            parts.append(
                f"본 주제 「{topic['title']}」(모드: {topic.get('mode','')}, "
                f"초점: {topic.get('focus','')})에 맞춰 읽습니다."
            )
        extra = _terms(step)
        if extra:
            parts.append(" ".join(extra[:3]))
        out.append("\n".join(parts))
    return out
