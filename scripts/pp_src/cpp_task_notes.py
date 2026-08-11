# -*- coding: utf-8 -*-
"""Step annotations for Comparative Politics–Pattern Analysis DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"사료|문헌|구술", "사료·문헌·구술자료를 모아 비교사례의 제도·사건을 재구성합니다."),
    (r"사료비평|연대기", "「사료비평」으로 신빙성을 점검하고 「연대기」로 사건을 시간순 정리합니다."),
    (r"주제적|개념적|범주화|코딩", "주제적·개념적 코딩으로 제도·행위자·사건을 범주화합니다."),
    (r"기초빈도|보조", "기초빈도는 보조로만 쓰고, 핵심은 역사·비교 해석입니다."),
    (r"역사적 해석|비교명제|패턴", "역사적 해석과 비교명제로 민주주의 패턴을 제시합니다."),
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
        "【수집】헌법·법령·의회기록·언론·구술 등 다원자료를 모읍니다.",
        "【사례】비교 단위(국가/시기)와 경계를 명시합니다.",
        "【로그】출처·접근일·판본을 남깁니다.",
    ],
    (1, 0): [
        "【사료비평】출처·의도·편향·교차검증을 수행합니다.",
        "【연대기】핵심 제도변화·사건을 시간순으로 배열합니다.",
        "【비교창】사례 간 동일 기간/국면을 맞춥니다.",
    ],
    (2, 0): [
        "【코딩】제도·행위자·위기·개혁 범주로 코딩합니다.",
        "【패턴후보】반복·대비·부재 패턴을 표시합니다.",
        "【코드북】정의·예시를 고정합니다.",
    ],
    (3, 0): [
        "【기초빈도】제도유형·사건유형 출현만 보조 집계합니다.",
        "【주의】빈도로 인과를 주장하지 않습니다.",
    ],
    (4, 0): [
        "【해석】역사적 맥락에서 패턴을 해석합니다.",
        "【비교명제】조건–결과 형태의 명제를 도출합니다.",
        "【한계】사례 특수성·자료편향을 명시합니다.",
    ],
    (5, 0): [
        "【산출】역사·비교분석 서술 패키지.",
        "【구성】자료목록·연대기·코드북·명제·서술.",
        "【버전】날짜·사례세트.",
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
        if i == 0:
            parts.append("민주주의의패턴 분석은 Lijphart류 제도 배치·역사적 국면 비교로 반복 패턴을 읽습니다.")
        out.append("\n".join(parts))
    return out
