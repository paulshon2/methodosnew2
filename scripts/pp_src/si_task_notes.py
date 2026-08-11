# -*- coding: utf-8 -*-
"""Step annotations for Symbolic Interactionism DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"참여관찰|상호작용 장면", "「참여관찰」은 현장에 들어가 상호작용이 일어나는 장면을 함께 보며 기록하는 방법입니다."),
    (r"심층면담|의미체계|행위자", "「심층면담」으로 행위자가 부여하는 의미체계(상징의 짜임)를 파악합니다."),
    (r"현장기록|전사", "현장노트와 장면·면담 녹음을 전사해 분석 가능한 텍스트로 만듭니다."),
    (r"상황|맥락", "누가·어디서·어떤 규범 하에 상호작용했는지 상황·맥락 정보를 붙입니다."),
    (r"상징|의미 단위|개념적 코딩", "「상징·의미 단위」는 말·몸짓·사물이 어떤 뜻으로 쓰이는지 묶은 분석 단위입니다."),
    (r"의례|상호작용 규칙", "「의례적 요소」는 반복되는 절차·공동초점·정서 교환처럼 규칙화된 상호작용입니다."),
    (r"의미협상|협상", "「의미협상」은 서로 뜻을 맞추거나 다투며 정의를 조율하는 과정입니다."),
    (r"통계|검정", "이 아키타입은 통계적 가설검정을 쓰지 않습니다. 핵심은 상징·의례·협상의 이론적 서술입니다."),
    (r"패턴|개념화|이론적", "관찰된 상호작용 패턴을 개념화해 이론적 서술로 통합합니다."),
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
        "【장면】상호작용이 반복되는 시·공간을 정해 참여관찰합니다.",
        "【기록】말·몸짓·침묵·사물 사용을 장면 단위로 남깁니다.",
        "【역할】관찰자 위치·라포·윤리를 메모합니다.",
    ],
    (0, 1): [
        "【면담】핵심 행위자에게 상징의 뜻을 묻습니다.",
        "【대비】관찰과 면담의 불일치를 중요 자료로 둡니다.",
        "【다양】역할이 다른 행위자를 포함합니다.",
    ],
    (1, 0): [
        "【전사】현장기록·장면녹음·면담을 텍스트화합니다.",
        "【화자】누가 말했는지·순서를 보존합니다.",
        "【비언어】몸짓·시선은 괄호 표기합니다.",
    ],
    (1, 1): [
        "【맥락】장소·규범·참석자·직전사건을 정리합니다.",
        "【상황정의】참여자가 상황을 무엇으로 부르는지 적습니다.",
        "【연결】장면ID와 면담ID를 링크합니다.",
    ],
    (2, 0): [
        "【상징코딩】상징·의미 단위를 개념적으로 식별합니다.",
        "【단위】말·제스처·사물·공간배치를 포함합니다.",
        "【인비보】행위자 언어를 우선 가능합니다.",
    ],
    (2, 1): [
        "【의례·규칙】반복 절차·공동초점·예의 규칙을 범주화합니다.",
        "【성공/실패】의례가 깨지는 순간을 표시합니다.",
        "【정서】연대·당황·체면 손상 등을 메모합니다.",
    ],
    (2, 2): [
        "【협상】뜻이 맞춰지거나 어긋나는 과정을 분석합니다.",
        "【전환】재정의·타협·철회의 순간을 표시합니다.",
        "【권력】누가 정의를 주도하는지 봅니다.",
    ],
    (3, 0): [
        "【통계】가설검정 미사용.",
        "【이유】핵심은 상징·의례·협상의 이론적 서술.",
    ],
    (4, 0): [
        "【개념화】상호작용 패턴을 개념으로 끌어올립니다.",
        "【통합】상징–의례–협상을 이론적 서술로 연결합니다.",
        "【한계】장면·표집·관찰자 효과를 명시합니다.",
    ],
    (5, 0): [
        "【산출】상호작용 이론적 서술 패키지.",
        "【구성】장면록·면담·코드북·의례맵·협상과정·이론서술.",
        "【윤리】익명화·동의 범위.",
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
        key = analysis_key.lower()
        if i == 0:
            if key.startswith("ir_"):
                parts.append("상호작용 의례는 공동초점·정서에너지·도덕적 연대를 관찰 포인트로 둡니다.")
            elif key.startswith("ii_"):
                parts.append("해석적상호작용론은 전환점에서 행위자의 상황 정의·재해석을 중심에 둡니다.")
            elif key.startswith("si_"):
                parts.append("상징적 상호작용론은 상징이 자아·관계·행동을 매개하는 방식을 추적합니다.")
        out.append("\n".join(parts))
    return out
