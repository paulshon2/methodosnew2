# -*- coding: utf-8 -*-
"""Step annotations for Epidemiology Research DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"코호트", "「코호트」는 같은 특징의 집단을 추적하는 설계입니다."),
    (r"환자-대조|환자대조", "「환자-대조군」은 환자군과 대조군을 비교합니다."),
    (r"단면", "「단면연구」는 한 시점에 노출·결과를 함께 조사합니다."),
    (r"노출|결과변수", "원인으로 의심되는 「노출」과 「결과변수」를 정의·측정합니다."),
    (r"교란|보정", "「교란변수」를 식별하고 보정변수로 넣습니다."),
    (r"결측|측정오류", "결측치·측정오류를 처리·문서화합니다."),
    (r"상대위험|RR|교차비|OR", "설계에 맞게 RR 또는 OR을 산출합니다."),
    (r"로지스틱|콕스|Cox", "로지스틱·콕스 등으로 교란을 보정합니다."),
    (r"층화|효과수정", "층화분석으로 효과수정을 검토합니다."),
    (r"Bradford|힐|인과", "Bradford Hill 기준으로 인과적 해석을 점검합니다."),
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
        "【설계】코호트·환자-대조군·단면 중 목적을 고릅니다.",
        "【시간성】노출→결과 시간순을 설계로 확보할 수 있는지 봅니다.",
        "【표집】대상·대조·추적기간을 문서화합니다.",
    ],
    (0, 1): [
        "【측정】노출·결과의 조작적 정의를 고정합니다.",
        "【도구】설문·의무기록·환경측정 등을 수집합니다.",
        "【윤리】동의·개인정보·최소수집을 지킵니다.",
    ],
    (1, 0): [
        "【교란】노출·결과와 모두 관련된 제3요인을 목록화합니다.",
        "【DAG】가능하면 인과도(DAG)로 보정 집합을 정당화합니다.",
        "【보정목록】분석에 넣을 변수를 확정합니다.",
    ],
    (1, 1): [
        "【결측】메커니즘을 가정하고 완전사례/다중대치를 선택합니다.",
        "【측정오류】분류오류·재현성을 점검합니다.",
        "【민감】오류 가정에 따른 민감분석을 계획합니다.",
    ],
    (2, 0): [
        "【해당없음】본 아키타입의 코딩 단계는 별도 질적코딩이 없습니다.",
        "【대체】노출·결과·보정변수의 범주코딩(변수정의)만 데이터사전으로 관리합니다.",
    ],
    (3, 0): [
        "【RR/OR】설계에 맞는 연관성 지표를 산출합니다.",
        "【CI】점추정과 신뢰구간을 함께 제시합니다.",
    ],
    (3, 1): [
        "【보정】로지스틱·콕스 등으로 교란을 보정합니다.",
        "【모형】공변량·비례위험 가정을 점검합니다.",
    ],
    (3, 2): [
        "【층화】성·연령 등으로 나눠 효과를 비교합니다.",
        "【효과수정】상호작용·이질성을 검토합니다.",
    ],
    (4, 0): [
        "【크기】연관성의 유의성과 효과크기를 제시합니다.",
        "【임상】절대위험·NNT 등(가능 시)을 보완합니다.",
    ],
    (4, 1): [
        "【Hill】강도·일관성·시간성·생물학적개연성 등을 점검합니다.",
        "【한계】잔여교란·선택편향을 명시합니다.",
    ],
    (5, 0): [
        "【산출】역학적 연관성 분석결과 패키지.",
        "【재현】설계·코드북·모형·민감분석 결과를 첨부합니다.",
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
            parts.append(f"· 설계: {topic['mode']}")
        notes.append("\n".join(parts))
    return notes
