# -*- coding: utf-8 -*-
"""Step annotations for Conversation Analysis DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"자연발생|녹화|음성|영상", "「자연발생적 대화」를 음성/영상으로 녹화합니다. 연출·인터뷰가 아닌 실제 상호작용이 자료입니다."),
    (r"동의|맥락정보", "녹화 전후 동의를 받고, 언제·어디서·누가 참여했는지 맥락정보를 기록합니다."),
    (r"Jefferson|정밀전사|중첩|침묵|억양", "「Jefferson 표기」로 억양·중첩·침묵·늘임 등을 정밀 전사합니다."),
    (r"순차분석|발화순서|turn-taking|턴", "「순차분석」으로 말 차례(turn-taking)가 어떻게 조직되는지 코딩합니다."),
    (r"인접쌍|수리|선호구조|adjacency|repair|preference", "인접쌍·수리·선호구조를 식별해 상호작용 규칙을 드러냅니다."),
    (r"통계|검정", "통계적 가설검정은 쓰지 않습니다. 핵심은 시퀀스 기술과 규칙 일반화입니다."),
    (r"시퀀스|일반화|상호작용 규칙", "사례별 시퀀스를 상세히 기술한 뒤, 반복되는 규칙을 일반화합니다."),
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
        "【자연대화】연출·역할극이 아닌 실제 상황을 녹화합니다.",
        "【품질】음성 명료·가능하면 영상(시선·몸짓)을 확보합니다.",
        "【로그】클립ID·길이·참여자 수를 남깁니다.",
    ],
    (0, 1): [
        "【동의】녹화·전사·인용 범위를 설명하고 동의를 받습니다.",
        "【맥락】시간·장소·역할·직전사건을 기록합니다.",
        "【익명】가명·모자이크 방침을 정합니다.",
    ],
    (1, 0): [
        "【Jefferson】억양·중첩([)·침묵(0.4)·늘임(:) 등을 표기합니다.",
        "【QC】난해 구간은 재생·동료 대조합니다.",
        "【줄번호】분석 인용을 위해 줄번호를 붙입니다.",
    ],
    (2, 0): [
        "【턴코딩】누가 언제 말을 시작하고 넘기는지 표시합니다.",
        "【TRP】전이관련지점에서의 선택·자기선택·침묵을 봅니다.",
        "【중첩】경쟁적/협력적 중첩을 구분합니다.",
    ],
    (2, 1): [
        "【인접쌍】질문–대답, 요청–수락/거절 등을 표시합니다.",
        "【수리】자기/타인 개시·완료를 식별합니다.",
        "【선호】비선호 응답의 지연·완화·설명을 표시합니다.",
    ],
    (3, 0): [
        "【통계】가설검정 미사용.",
        "【이유】핵심은 시퀀스 근거 기술.",
    ],
    (4, 0): [
        "【사례기술】대표 시퀀스를 줄단위로 상세 기술합니다.",
        "【근거】주장마다 전사 줄을 붙입니다.",
    ],
    (4, 1): [
        "【규칙】반복되는 상호작용 규칙을 일반화합니다.",
        "【범위】적용 맥락·예외를 명시합니다.",
        "【함의】실무(교육·의료·상담) 함의를 짧게 적습니다.",
    ],
    (5, 0): [
        "【산출】대화구조 분석결과 패키지.",
        "【구성】동의·맥락·전사·코딩·사례기술·규칙·한계.",
        "【윤리】인용 공개 범위.",
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
            if key.startswith("cai_"):
                parts.append("입문 주제는 전사·턴·인접쌍·수리의 기본 식별과 근거 붙이기를 우선합니다.")
            elif key.startswith("ca_"):
                parts.append("QL-050은 제도적 대화의 시퀀스 조직(고지·요청·인수인계 등)을 정밀히 기술합니다.")
        out.append("\n".join(parts))
    return out
