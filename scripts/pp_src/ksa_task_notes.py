# -*- coding: utf-8 -*-
"""Step annotations for Keyword Salience Analysis DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"방법론 전통|수집 전략|코퍼스", "연구주제·전통에 맞춰 대상·참조 코퍼스 수집 전략을 정합니다."),
    (r"전사|변수화|토큰|전처리", "텍스트를 정제·토큰화하고 빈도 변수로 정리합니다."),
    (r"주제코딩|키워드|후보", "핵심 후보어를 주제 표지하거나 빈도·문서분포로 변수화합니다."),
    (r"keyness|로그우도|LL|추론통계|기초통계", "빈도·로그우도(LL)·효과크기로 키워드 핵심성을 검정합니다."),
    (r"해석|연구설계|salience|핵심성", "설계(대상–참조)에 따라 두드러진 키워드를 해석합니다."),
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
        "【전략】대상 코퍼스와 참조 코퍼스를 정의합니다.",
        "【경계】기간·장르·매체·언어를 맞춰 비교 가능성을 확보합니다.",
        "【로그】출처·수집일·라이선스·어절수를 기록합니다.",
    ],
    (1, 0): [
        "【전처리】정제·토큰화·불용어·표제어(선택)를 표준화합니다.",
        "【단위】어절/형태소 단위와 최소빈도 컷을 고정합니다.",
        "【QC】중복·OCR오류·인코딩을 점검합니다.",
    ],
    (2, 0): [
        "【후보】고빈도·고분산 어휘를 키워드 후보로 표시합니다.",
        "【주제표지】의미군(프레임)으로 주제코딩하거나 빈도변수로 둡니다.",
        "【제외】고유명·숫자·잡음 규칙을 문서화합니다.",
    ],
    (3, 0): [
        "【통계】대상 vs 참조 빈도표에서 LL/%DIFF 등을 산출합니다.",
        "【임계】유의수준·최소빈도·효과크기 기준을 적용합니다.",
        "【주의】통계적 유의≠실질적 중요성. 맥락 concordance를 병행합니다.",
    ],
    (4, 0): [
        "【해석】상위 keyness 키워드의 담화·장르 함의를 읽습니다.",
        "【검증】용례·군집으로 오탐을 걸러냅니다.",
        "【한계】코퍼스 편향·크기 불균형을 명시합니다.",
    ],
    (5, 0): [
        "【산출】키워드 핵심성 결과보고서 패키지.",
        "【구성】전략·전처리·후보·통계표·해석·한계.",
        "【버전】코퍼스ID·파라미터·날짜.",
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
            parts.append(
                "키워드 핵심성(keyness)은 대상 코퍼스가 참조 대비 상대적으로 두드러진 어휘를 "
                "빈도·통계량으로 가려내는 분석입니다."
            )
        out.append("\n".join(parts))
    return out
