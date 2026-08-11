# -*- coding: utf-8 -*-
"""Step annotations for Qualitative Meta-Synthesis DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"체계적 검색|문헌 수집", "「체계적 검색」은 검색식·DB·기간을 정해 기존 질적연구를 빠짐없이 모으는 절차입니다."),
    (r"포함|배제|기준", "「포함/배제 기준」으로 어떤 연구를 합성에 넣을지 규칙을 정합니다."),
    (r"연구질|appraisal|품질", "「연구질 평가」는 각 연구의 방법·보고 품질을 점검해 해석 가중치를 조절합니다."),
    (r"핵심개념|주제 추출", "각 논문의 핵심 개념·주제를 추출해 합성 원자료로 만듭니다."),
    (r"번역|translation|은유", "Noblit & Hare식 「번역」은 서로 다른 연구의 개념·은유를 맞대어 잇는 코딩입니다."),
    (r"종합|synthesis|통합적 주제", "유사·상반 개념을 묶어 통합적 주제로 종합합니다."),
    (r"통계|검정", "통계적 가설검정은 사용하지 않습니다. 핵심은 개념 통합입니다."),
    (r"line of argument|상위개념|개념적 틀", "개별 주제를 「논증선(line of argument)」으로 올려 새 개념적 틀을 제시합니다."),
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
        "【검색식】PICO/SPIDER 등으로 검색어·동의어를 구성합니다.",
        "【DB】복수 DB·수기검색·참고문헌 추적을 포함합니다.",
        "【로그】검색일·건수·다운로드를 남깁니다.",
    ],
    (0, 1): [
        "【기준】포함·배제 기준을 사전 문서화합니다.",
        "【선별】제목→초록→전문 단계로 적용합니다.",
        "【이중검토】불일치는 합의·제3자로 해결합니다.",
    ],
    (1, 0): [
        "【질평가】CASP 등 체크리스트로 연구질을 평가합니다.",
        "【결정】제외/가중/민감도분석 방침을 정합니다.",
        "【기록】항목별 점수·메모를 남깁니다.",
    ],
    (1, 1): [
        "【추출】각 연구의 핵심개념·주제·은유를 추출합니다.",
        "【표】연구특성(참여자·맥락·방법)과 함께 정리합니다.",
        "【인용】원문 표현을 보존합니다.",
    ],
    (2, 0): [
        "【번역코딩】연구 간 개념·은유를 상호 번역합니다.",
        "【유형】상호번역·반박번역 가능성을 표시합니다.",
        "【메모】번역의 근거 문장을 붙입니다.",
    ],
    (2, 1): [
        "【종합】유사·상반 개념을 통합 주제로 묶습니다.",
        "【긴장】상반 발견을 버리지 않고 조건으로 서술합니다.",
        "【포화】새 연구가 주제를 바꾸는지 점검합니다.",
    ],
    (3, 0): [
        "【통계】가설검정 미사용.",
        "【이유】핵심은 번역·종합·논증선.",
    ],
    (4, 0): [
        "【논증선】개별 주제를 상위 개념(line of argument)으로 통합합니다.",
        "【근거】주제–연구 연결표를 제시합니다.",
    ],
    (4, 1): [
        "【새해석】통합 개념적 틀을 새로운 해석으로 제시합니다.",
        "【함의】실무·연구·정책 함의를 구분합니다.",
        "【한계】검색·언어·보고편향을 명시합니다.",
    ],
    (5, 0): [
        "【산출】통합된 질적 이론/개념 패키지.",
        "【구성】검색·선별·질평가·추출·번역·종합·논증선·틀.",
        "【PRISMA】흐름도를 첨부합니다.",
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
            if key.startswith("qms_"):
                parts.append("메타합성은 번역·종합을 넘어 line of argument로 새 해석을 만드는 데 초점을 둡니다.")
            elif key.startswith("qrs_"):
                parts.append("질적연구 합성은 개별 주제의 상호번역과 통합 서술의 투명성을 강조합니다.")
        out.append("\n".join(parts))
    return out
