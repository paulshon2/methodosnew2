# -*- coding: utf-8 -*-
"""Step annotations for In-depth Interview DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"프로토콜|반구조|질문지", "「면담 프로토콜」은 기본 질문과 순서를 적은 가이드입니다. 반구조라서 즉석 탐침을 더할 수 있습니다."),
    (r"목적표집|참여자|모집", "「목적표집」은 연구 질문에 맞는 경험을 가진 사람을 의도적으로 모집하는 방법입니다."),
    (r"포커스|집단|FGI", "「QL-044」은 여러 명이 함께 이야기하며, 개인 면담과 달리 상호작용·동조·반박이 자료가 됩니다."),
    (r"심층면담|녹음|개별", "「심층면담」은 한 사람과 깊고 길게 나누는 인터뷰로, 보통 녹음해 전사합니다."),
    (r"축어|전사|익명화", "「축어 전사」는 말한 그대로 옮기고, 「익명화」는 이름·소속 등 식별정보를 가립니다."),
    (r"개방코딩|초기코드", "「개방코딩」은 자료에 초기 이름표를 붙이는 첫 코딩입니다."),
    (r"범주화|주제|theme|주제분석", "비슷한 코드를 범주로 묶고, 범주를 관통하는 「주제」를 뽑는 것이 주제분석입니다."),
    (r"빈도|통계", "원칙적으로 가설검정 통계는 쓰지 않습니다. 큰 자료면 응답빈도만 보조로 둘 수 있습니다."),
    (r"인용|통합", "주제별 인용과 해석을 붙이고, 주제 간 관계를 개념적으로 통합합니다."),
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
        "【프로토콜】연구질문을 열린 질문·탐침으로 번역합니다.",
        "【순서】쉬운 질문→핵심→민감 순을 권장합니다.",
        "【파일럿】1–2명으로 질문을 다듬습니다.",
    ],
    (0, 1): [
        "【목적표집】포함·제외 기준을 문서화합니다.",
        "【다양】유사·대비 참여자를 포함합니다.",
        "【윤리】설명문·동의·사례비·철회권.",
    ],
    (0, 2): [
        "【진행】개별 또는 QL-044으로 녹음.",
        "【촉진】요약·반영·탐침. 유도 금지.",
        "【로그】일시·장소·특이사항.",
    ],
    (1, 0): [
        "【축어전사】추임새·침묵 표기.",
        "【FGI】화자 라벨 필수.",
        "【QC】난해 구간 재생 대조.",
    ],
    (1, 1): [
        "【익명화】이름·지명·직장 등 재식별 정보 제거.",
        "【정리】파일명·메타데이터 통일.",
        "【보관】암호화·접근권한.",
    ],
    (2, 0): [
        "【개방코딩】문장·의미단위에 초기코드.",
        "【인비보】참여자 언어 우선 가능.",
        "【메모】모호한 코드에 질문 메모.",
    ],
    (2, 1): [
        "【범주화】유사 코드를 상위 범주로.",
        "【정의】범주 정의·포함·제외.",
        "【개정】코드북 버전 관리.",
    ],
    (2, 2): [
        "【주제】범주를 관통하는 theme 도출.",
        "【검토】주제명·정의·대표인용.",
        "【포화】새 면담이 주제를 바꾸는지.",
    ],
    (3, 0): [
        "【원칙】통계적 가설검정 미사용.",
        "【이유】핵심은 주제·인용·해석.",
    ],
    (3, 1): [
        "【보조】대규모 시 주제/코드 출현 빈도표.",
        "【주의】빈도로 의미를 증명하지 않음.",
    ],
    (4, 0): [
        "【서술】주제별 인용+해석.",
        "【균형】주제 간 분량·대비.",
    ],
    (4, 1): [
        "【통합】주제 간 관계·모형.",
        "【주장】연구질문에 대한 답.",
        "【한계】표집·면접자 효과.",
    ],
    (5, 0): [
        "【산출】주제별 분석결과 패키지.",
        "【첨부】프로토콜·코드북·인용록·성찰.",
        "【윤리】동의된 공개범위.",
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
            if key.startswith("fg_"):
                parts.append("QL-044은 사회역학(동조·침묵·주도발화)을 분석 메모에 남깁니다.")
            elif key.startswith("uqi_"):
                parts.append("면접 이해·훈련 주제는 질문·탐침·윤리·QC 절차의 투명성을 강조합니다.")
        out.append("\n".join(parts))
    return out
