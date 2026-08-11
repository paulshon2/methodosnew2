# -*- coding: utf-8 -*-
"""Step annotations for General Methodology DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"문헌|면담|설문|수집 전략", "연구주제에 맞춰 문헌·면담·설문 등 수집 전략을 고릅니다."),
    (r"연구설계|수집 계획", "연구설계 단계에서 자료수집 계획을 세웁니다."),
    (r"전사|전처리|코딩", "자료유형에 맞게 전사·코딩 등 표준 전처리를 합니다."),
    (r"주제코딩|변수화", "질은 주제코딩, 양은 변수화로 코딩합니다."),
    (r"기술통계|추론통계", "주제에 맞게 기술통계~추론통계를 선택 적용합니다."),
    (r"통합|서술|지침", "설계 전반 절차에 따라 결과를 통합 서술하고 방법론 지침서로 묶습니다."),
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
        "【전략선택】문헌·면담·설문 중(또는 조합) 수집 전략을 고릅니다.",
        "【정합】연구질문·인식론·자원에 맞는지 점검합니다.",
        "【기록】선택 이유를 감사기록으로 남깁니다.",
    ],
    (0, 1): [
        "【계획】표집·도구·일정·윤리·품질기준을 포함한 수집계획을 수립합니다.",
        "【프로토콜】동의서·양식·로그를 준비합니다.",
        "【완료기준】무엇이면 수집 완료인지 명시합니다.",
    ],
    (1, 0): [
        "【전처리】면담은 전사, 설문·2차자료는 정리·코딩 준비를 합니다.",
        "【표준】파일명·버전·결측코드를 통일합니다.",
        "【QC】품질점검 체크리스트를 적용합니다.",
    ],
    (2, 0): [
        "【선택적용】질→주제코딩, 양→변수화를 설계에 맞게 적용합니다.",
        "【코드북】정의·예시·코딩규칙을 문서화합니다.",
        "【미적용】해당 없는 가닥은 ‘해당없음’으로 명시합니다.",
    ],
    (3, 0): [
        "【통계선택】기술통계만 / 추론통계까지를 연구질문에 맞게 고릅니다.",
        "【가정】추론 시 가정·효과크기를 함께 봅니다.",
        "【질적보완】질 중심이면 빈도 보조만 쓰고 해석을 우선합니다.",
    ],
    (4, 0): [
        "【통합서술】설계–수집–분석–한계를 한 흐름으로 서술합니다.",
        "【근거】표·인용·통계를 연구질문에 연결합니다.",
        "【재현】다른 연구자가 따라올 수 있게 절차를 남깁니다.",
    ],
    (5, 0): [
        "【지침서】연구방법론 지침서 패키지로 묶습니다.",
        "【구성】전략·계획·전처리·코딩·분석·서술·체크리스트.",
        "【버전】날짜·적용 주제·개정사유.",
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
            parts.append(f"· 모드: {topic['mode']}")
        notes.append("\n".join(parts))
    return notes
