# -*- coding: utf-8 -*-
"""Step annotations for Discourse–Critical Discourse DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"텍스트|발화|연설|대화|미디어", "「발화·텍스트 자료」는 연설·대화·기사처럼 실제로 쓰이거나 말한 언어 자료입니다."),
    (r"정밀전사|발화단위|침묵|겹침", "「정밀전사」는 침묵·겹침·억양 등 말의 세부를 표기해 담화 분석을 가능하게 합니다."),
    (r"분절|절|문장", "「분절」은 긴 텍스트를 절·문장 단위로 나누 코딩의 기본 칸을 만드는 일입니다."),
    (r"어휘|수사|함축|화용", "어휘선택·수사장치·함축을 코딩하면 ‘무엇을 말했는가’와 ‘어떻게 말했는가’를 함께 봅니다."),
    (r"상호텍스트|이데올로기", "「상호텍스트성」은 다른 텍스트를 끌어오는 방식이고, 「이데올로기 장치」는 특정 세계관을 당연하게 만듭니다."),
    (r"정당화|타자화|담화전략", "「담화전략」은 정당화·타자화처럼 말로 편을 가르고 권력을 수행하는 방식입니다."),
    (r"코퍼스|빈도|연어|collocation", "코퍼스 보조분석은 어휘·연어 빈도로 패턴을 보이되, 해석의 주근거는 담화 분석입니다."),
    (r"권력|이데올로기|사회", "결과를 권력·제도·이데올로기 맥락에 연결해 ‘말이 세계를 어떻게 구성하는지’를 해석합니다."),
    (r"Appraisal|평가|감정|정서", "평가·감정 담화는 태도·개입·위계 자원으로 감정을 언어가 조직하는 방식을 봅니다."),
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
        "【선정】장르·시기·화자·매체를 명시한 분석 코퍼스를 정합니다.",
        "【대표성】전형·대비·경계 사례를 포함합니다.",
        "【윤리】공개자료 vs 비공개 녹음의 동의·가명.",
    ],
    (0, 1): [
        "【수집】현장 녹음 또는 기존 텍스트/아카이브.",
        "【메타】출처·날짜·화자·맥락을 로그로.",
        "【품질】잡음·누락·편집 여부를 기록.",
    ],
    (1, 0): [
        "【정밀전사】발화단위·침묵·겹침·웃음 표기.",
        "【기존텍스트】문장부호·레이아웃 보존.",
        "【QC】난해 구간 재생 대조.",
    ],
    (1, 1): [
        "【분절】절/문장(또는 의미단위)으로 나눔.",
        "【ID】텍스트-절 번호 부여.",
        "【정렬】화자·차례와 분절을 맞춤.",
    ],
    (2, 0): [
        "【언어·화용】어휘선택·수사·함축 코딩.",
        "【근거】발췌+기능 한줄.",
        "【과잉】모든 단어에 코드를 달지 않음.",
    ],
    (2, 1): [
        "【상호텍스트】인용·장르혼종·전제.",
        "【이데올로기장치】자연화·필연성·은유.",
        "【연결】사회제도·담론장과 링크.",
    ],
    (2, 2): [
        "【전략】정당화·타자화·책임전가 등 범주화.",
        "【패턴】전략의 공출현·연쇄.",
        "【이름】전략명은 자료에 가깝게.",
    ],
    (3, 0): [
        "【원칙】가설검정 통계 미사용.",
        "【이유】핵심은 담화 기능·이데올로기 해석.",
    ],
    (3, 1): [
        "【보조】어휘빈도·연어(해당 시 코퍼스).",
        "【주의】빈도로 이데올로기를 ‘증명’하지 않음.",
        "【병치】질적 발췌와 함께.",
    ],
    (4, 0): [
        "【통합】전략·장치를 주제별로 묶어 해석.",
        "【예시】대표 연쇄를 두껍게 제시.",
    ],
    (4, 1): [
        "【맥락】권력·제도·이데올로기와 연결.",
        "【효과】담화가 어떤 주체·관계를 구성하는지.",
        "【한계】코퍼스·연구자 위치성.",
    ],
    (5, 0): [
        "【산출】담화구조·이데올로기 해석 결과.",
        "【첨부】전사·코드북·전략표·(선택)빈도.",
        "【윤리】인용 식별정보 처리.",
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
                f"본 주제 「{topic['title']}」(장르: {topic.get('genre','')}, "
                f"초점: {topic.get('focus','')})에 맞춰 읽습니다."
            )
        extra = _terms(step)
        if extra:
            parts.append(" ".join(extra[:3]))
        key = analysis_key.lower()
        if i == 0:
            if key.startswith("cda_"):
                parts.append("CDA는 텍스트–담론실천–사회실천을 연결하고 권력·이데올로기를 전면에 둡니다.")
            elif key.startswith("ola_"):
                parts.append("일상언어 분석은 화행·인접쌍·체면 등 일상 사용 규칙을 중심으로 봅니다.")
            elif key.startswith("app_"):
                parts.append("Appraisal/감정 담화는 태도·개입·위계 자원의 분포와 기능을 코딩합니다.")
            elif key.startswith("phil_"):
                parts.append("철학적 탐구는 개념 용법·전제·언어게임을 담화 증거로 분석합니다.")
        out.append("\n".join(parts))
    return out
