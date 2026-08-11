# -*- coding: utf-8 -*-
"""Step annotations for Mixed Methods Design DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"혼합설계|혼합연구", "질적(말·글)과 양적(숫자)을 함께 쓰는 「혼합설계」입니다."),
    (r"수렴적", "「수렴적 설계」는 질·양을 동시에 모아 맞춰 봅니다."),
    (r"설명적 순차", "「설명적 순차」는 양적 조사 뒤 질적으로 이유를 파고듭니다."),
    (r"탐색적 순차", "「탐색적 순차」는 질적 탐색 뒤 양적으로 확인합니다."),
    (r"전사|변수화", "질은 전사하고, 양은 변수로 코딩합니다."),
    (r"공통 분석틀|통합", "두 자료를 같은 분석틀로 맞춰 통합 준비를 합니다."),
    (r"주제코딩", "질적 자료에서 주제를 찾아 표시하는 「주제코딩」입니다."),
    (r"quantitiz|양적화", "질적 코딩을 숫자 변수로 바꾸는 「양적화(quantitizing)」입니다."),
    (r"qualitiz|질적화", "숫자 결과를 이야기로 풀어 쓰는 「질적화(qualitizing)」입니다."),
    (r"합치도|convergence", "질·양 결과가 서로 들어맞는 정도를 「합치도」로 봅니다."),
    (r"side-by-side|나란히|통합표", "질·양 결과를 나란히 놓거나 통합표로 비교합니다."),
    (r"meta-inference|통합해석", "질·양을 합쳐 내리는 최종 해석이 「통합해석」입니다."),
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
        "【설계선택】수렴·설명적 순차·탐색적 순차 중 목적을 고릅니다.",
        "【우선순위】어느 가닥이 주도·보조인지 밝힙니다.",
        "【통합시점】동시/순차와 통합 지점을 미리 적습니다.",
    ],
    (0, 1): [
        "【이중수집】설계 순서에 맞춰 설·면담(또는 동시)을 수행합니다.",
        "【표집】양·질 표집을 각각 정당화합니다.",
        "【윤리】동의·익명·자료연계 ID를 관리합니다.",
    ],
    (1, 0): [
        "【전사】면담을 표준 규칙으로 전사합니다.",
        "【변수화】설문·척도를 분석용 변수로 정리합니다.",
        "【QC】결측·이상치·전사 품질을 점검합니다.",
    ],
    (1, 1): [
        "【공통틀】연구질문·개념을 공유하는 분석틀을 만듭니다.",
        "【정렬】동일 개념의 질 코드·양 변수를 매핑합니다.",
        "【통합준비】후속 quantitizing/합치 비교용 키를 둡니다.",
    ],
    (2, 0): [
        "【주제코딩】질적 자료에 주제코드를 적용합니다.",
        "【코드북】정의·예시·제외를 문서화합니다.",
        "【신뢰】이중코딩·합의 메모를 남깁니다.",
    ],
    (2, 1): [
        "【양적화/질적화】통합을 위해 변환 방향을 선택합니다.",
        "【규칙】변환 규칙을 재현 가능하게 적습니다.",
        "【검증】변환 전·후를 표본으로 대조합니다.",
    ],
    (3, 0): [
        "【양적분석】기술·추론통계(회귀·ANOVA 등)를 적용합니다.",
        "【가정】정규성·등분산 등 설계에 맞게 점검합니다.",
        "【효과】핵심 효과를 표로 요약합니다.",
    ],
    (3, 1): [
        "【합치】질적 주제와 양적 결과를 합치도로 비교합니다.",
        "【불일치】불일치를 무시하지 말고 해석합니다.",
        "【보완】서로 보완하는 지점을 표시합니다.",
    ],
    (4, 0): [
        "【나란히】side-by-side 또는 통합표로 배치합니다.",
        "【증거】각 칸에 질·양 증거를 함께 둡니다.",
    ],
    (4, 1): [
        "【통합해석】meta-inference를 문장으로 도출합니다.",
        "【한계】설계·표집·통합 한계를 명시합니다.",
        "【함의】실무·이론 함의를 연결합니다.",
    ],
    (5, 0): [
        "【보고서】통합적 연구결과 보고서로 묶습니다.",
        "【재현】설계도·코드북·통계·통합표를 첨부합니다.",
    ],
}


def task_step_annotations(si, ti, proc_lines, akey, topic, method_name):
    bank = STEP_NOTE_BANK.get((si, ti), [])
    notes = []
    for i, line in enumerate(proc_lines):
        parts = []
        if i < len(bank):
            parts.append(bank[i])
        terms = _terms(line)
        if terms:
            parts.append("· " + " ".join(terms[:2]))
        if not parts:
            parts.append(f"【실행】{method_name} 절차를 주제 맥락에 맞게 적용합니다.")
        if topic.get("mode") and i == 0:
            parts.append(f"· 설계모드: {topic['mode']}")
        notes.append("\n".join(parts))
    return notes
