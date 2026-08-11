# -*- coding: utf-8 -*-
"""Step annotations for Nursing Theory Construction DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"목적표집|참여자", "「목적표집」으로 이론 구축에 적합한 경험·돌봄 경험을 가진 참여자를 선정합니다."),
    (r"심층면담|참여관찰|문서", "면담·관찰·문서를 함께 모아 간호 현상과 돌봄 맥락을 다각도로 봅니다."),
    (r"전사|자료정리", "녹음·관찰노트를 전사·정리해 분석 가능한 텍스트로 만듭니다."),
    (r"소프트웨어|입력", "NVivo 등 분석 소프트웨어에 자료를 올려 코딩을 관리합니다."),
    (r"개방코딩|초기코드", "「개방코딩」으로 초기코드를 붙입니다."),
    (r"범주화|주제", "유사 코드를 범주로 묶고, 범주를 관통하는 「주제」를 도출합니다."),
    (r"통계|빈도", "가설검정은 쓰지 않고, 필요 시 기초빈도만 보조로 둡니다."),
    (r"통합|서술|이론", "주제·범주를 해석적으로 통합해 간호이론(중범위)으로 서술합니다."),
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
        "【목적표집】포함·제외·최대변이 기준을 문서화합니다.",
        "【다양】환자·가족·간호사 등 관점 다양성을 고려합니다.",
        "【윤리】동의·취약성·철회권을 확보합니다.",
    ],
    (0, 1): [
        "【복수자료】면담·관찰·문서를 병행합니다.",
        "【현장】병동·가정 등 돌봄 맥락을 기록합니다.",
        "【메모】이론적 메모를 즉시 남깁니다.",
    ],
    (1, 0): [
        "【전사】축어 전사·관찰노트 정리를 합니다.",
        "【익명】식별정보를 가명 처리합니다.",
        "【QC】난해 구간을 재생 대조합니다.",
    ],
    (1, 1): [
        "【입력】분석 SW에 사례·자료 단위로 올립니다.",
        "【메타】참여자·일시·자료유형 태그를 붙입니다.",
        "【백업】암호화 백업을 유지합니다.",
    ],
    (2, 0): [
        "【개방코딩】의미단위에 초기코드를 붙입니다.",
        "【간호개념】돌봄·고통·지지 등 개념 민감성을 유지합니다.",
        "【메모】개념 질문을 병행합니다.",
    ],
    (2, 1): [
        "【범주화】유사 코드를 상위 범주로 묶습니다.",
        "【정의】범주 정의·포함·제외를 고정합니다.",
        "【관계】범주 간 조건을 초안으로 적습니다.",
    ],
    (2, 2): [
        "【주제】범주를 관통하는 주제를 도출합니다.",
        "【이론화】중범위 이론 명제를 초안합니다.",
        "【포화】새 자료가 주제를 바꾸는지 점검합니다.",
    ],
    (3, 0): [
        "【통계】가설검정 미사용.",
        "【보조】필요 시 주제 출현 빈도만 제시.",
    ],
    (4, 0): [
        "【통합】주제·범주를 간호이론 틀로 통합합니다.",
        "【명제】과정·조건·결과를 명제화합니다.",
    ],
    (4, 1): [
        "【서술】인용과 해석을 결합한 서술적 결과를 씁니다.",
        "【실무함의】간호중재·교육·정책 함의를 구분합니다.",
        "【한계】표집·전이가능성을 명시합니다.",
    ],
    (5, 0): [
        "【산출】질적 분석결과(주제·이론) 패키지.",
        "【구성】코드북·주제·이론도식·인용록·성찰.",
        "【버전】날짜·이론명.",
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
            parts.append("간호이론구축은 현상 기술에서 중범위 이론(개념·관계·명제)으로 올리는 것이 목표입니다.")
        out.append("\n".join(parts))
    return out
