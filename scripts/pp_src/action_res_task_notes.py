# -*- coding: utf-8 -*-
"""Step annotations for Action–Participatory Research DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"문제|실행계획|action plan", "「실행계획」은 현장 문제를 고치기 위해 무엇을·누가·언제 할지 적은 행동 계획입니다."),
    (r"사이클|계획.?실행.?관찰.?반성|순환", "「실행 사이클」은 계획→실행→관찰→반성을 한 바퀴 도는 것입니다. 여러 번 돌며 개선합니다."),
    (r"실행일지|관찰|면담|설문", "사이클마다 관찰·면담·설문·실행일지 등으로 변화를 증거를 모읍니다."),
    (r"시간순|정리|전사|양적.?코딩", "사이클별 자료를 시간순으로 모으고, 질은 전사·양은 설문코딩으로 정리합니다."),
    (r"주제코딩|성과 지표|범주화|변화", "일지·관찰은 주제로 코딩하고, 성과지표는 범주로 묶어 사이클 간 변화를 추적합니다."),
    (r"기술통계|평균|빈도", "설문이 있으면 평균·빈도로 요약한 뒤, 질적 성찰과 함께 읽습니다."),
    (r"사전.?사후|t검정", "사전–사후 점수가 있으면 t검정 등을 보조로 쓸 수 있으나, 실행연구의 핵심은 순환 개선입니다."),
    (r"성찰|reflection|재설계|개선안", "「성찰」로 무엇이 됐/안 됐는지 종합하고, 다음 사이클 계획을 다시 짭니다."),
    (r"Q기법|Q방법", "Q기법은 주관적 관점 유형을 나눈 뒤, 그 관점에 맞춘 실행 개입을 설계하는 데 쓸 수 있습니다."),
]


def _terms(text: str) -> list[str]:
    found, seen = [], set()
    for pat, expl in TERM_HINTS:
        if re.search(pat, text, re.I):
            k = expl[:36]
            if k not in seen:
                seen.add(k)
                found.append(expl)
    return found


STEP_NOTE_BANK: dict[tuple[int, int], list[str]] = {
    (0, 0): [
        "【문제】현장의 구체적·관찰가능 문제로 좁힙니다.",
        "【이해관계】누가 영향받는지 맵합니다.",
        "【계획】목표·개입·일정·성공지표·윤리를 문서화합니다.",
        "【기준선】개입 전 상태를 측정·기술합니다.",
    ],
    (0, 1): [
        "【사이클】계획→실행→관찰→반성을 반복합니다.",
        "【다중자료】일지·관찰·면담·설문을 병행합니다.",
        "【기록】사이클 ID·날짜·담당을 남깁니다.",
    ],
    (1, 0): [
        "【시간순】C1→C2→C3 폴더/표로 정리합니다.",
        "【완전성】누락 자료·미실시 관찰을 표시합니다.",
        "【연결】계획서와 실제 실행의 차이를 적습니다.",
    ],
    (1, 1): [
        "【질】면담·성찰 녹음 전사.",
        "【양】설문 문항코딩·결측처리.",
        "【통합키】참여자/일시로 자료를 연결합니다.",
    ],
    (2, 0): [
        "【주제코딩】일지·관찰에서 장애·촉진·감정·전략 주제.",
        "【사이클비교】같은 코드의 출현 변화를 봅니다.",
        "【근거】발췌를 붙입니다.",
    ],
    (2, 1): [
        "【성과지표】행동·학습·만족 등을 범주화.",
        "【추적】사이클별 지표 상태를 표로.",
        "【기제】무엇이 변화를 만들었는지 가설.",
    ],
    (3, 0): [
        "【기술통계】평균·SD·빈도·응답률.",
        "【층화】집단·시기별 요약.",
        "【질과 병치】숫자만으로 결론내지 않음.",
    ],
    (3, 1): [
        "【보조】사전–사후 t/윌콕슨 등(해당 시).",
        "【한계】무선배정 없음·표본 소 → 인과 단정 금지.",
        "【보고】효과크기·CI를 가능하면 함께.",
    ],
    (4, 0): [
        "【성찰종합】사이클별 what worked / what didn’t.",
        "【증거】질·양·관찰을 삼각화.",
        "【학습】실무 지식으로 문장화.",
    ],
    (4, 1): [
        "【재설계】다음 사이클 개입·지표 수정.",
        "【중단/지속】성공 요소 제도화 여부.",
        "【공유】이해관계자 피드백.",
    ],
    (5, 0): [
        "【산출】실행 개선안 및 변화보고서.",
        "【포함】문제·사이클·증거·개선안·한계·다음계획.",
        "【윤리】참여자 보호·합의 공개범위.",
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
                f"본 주제 「{topic['title']}」(현장: {topic.get('site','')}, "
                f"개입: {topic.get('intervention','')})에 맞춰 읽습니다."
            )
        extra = _terms(step)
        if extra:
            parts.append(" ".join(extra[:3]))
        key = analysis_key.lower()
        if i == 0:
            if key.startswith("arq_"):
                parts.append("Q기법 병행 시, 관점 유형(Q요인)을 실행계획의 맞춤 개입에 연결합니다.")
            elif key.startswith("ear") or key.startswith("ear2"):
                parts.append("교육 실행연구 절차 절차는 수업·학생 학습 증거를 사이클 지표의 중심에 둡니다.")
            elif key.startswith("arm"):
                parts.append("방법 입문·심화는 절차 문서화(계획서·관찰틀·성찰프로토콜)를 특히 강조합니다.")
        out.append("\n".join(parts))
    return out
