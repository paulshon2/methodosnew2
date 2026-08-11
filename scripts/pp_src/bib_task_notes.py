# -*- coding: utf-8 -*-
"""Step annotations for Bibliometrics–Citation Analysis DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"서지 데이터베이스|Web of Science|Scopus|메타데이터", "「서지 DB」에서 출판·인용 메타데이터를 내려받아 분석 코퍼스를 만듭니다."),
    (r"정규화|중복제거|저자명|기관명", "저자·기관명을 통일하고 중복 레코드를 제거해야 지표가 왜곡되지 않습니다."),
    (r"분석기간|분야|필터", "분석 기간·문서유형·분야를 필터로 고정해 재현 가능한 코퍼스를 만듭니다."),
    (r"코딩|해당없음", "이 아키타입의 코딩 단계는 해당 없습니다. 지표·네트워크 분석이 중심입니다."),
    (r"인용지수|h-지수|계량지표", "인용수·h-지수 등 계량지표로 생산성·영향력을 요약합니다."),
    (r"시계열|회귀|네트워크|중심성|공저", "시계열 추세와 공저·인용 네트워크(중심성)로 구조를 봅니다."),
    (r"영향력|연구동향|시각화|네트워크 맵|추세", "지표로 동향을 판단하고 네트워크 맵·추세그래프로 제시합니다."),
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
        "【검색식】키워드·동의어·제한조건을 문서화합니다.",
        "【DB】WoS/Scopus 등 출처·다운로드일을 기록합니다.",
        "【메타】제목·저자·연도·인용·키워드·소속을 포함합니다.",
    ],
    (1, 0): [
        "【정규화】저자·기관명 이표기를 통일합니다.",
        "【중복제거】DOI/제목+연도 기준으로 중복을 제거합니다.",
        "【로그】제거 건수·규칙을 남깁니다.",
    ],
    (1, 1): [
        "【기간·분야】분석 연도·문서유형·주제분야를 필터합니다.",
        "【재현】필터 조건을 검색식과 함께 보관합니다.",
        "【민감도】경계 연도 포함/제외를 점검합니다.",
    ],
    (2, 0): [
        "【코딩】해당 없음(질적 코딩 단계 미적용).",
        "【대신】지표 산출·네트워크 구축으로 진행합니다.",
    ],
    (3, 0): [
        "【지표】인용수·h-지수·생산성 등 계량지표를 산출합니다.",
        "【단위】논문·저자·기관·저널 단위를 구분합니다.",
        "【주의】지표의 한계(분야차이·시간창)를 명시합니다.",
    ],
    (3, 1): [
        "【시계열】연도별 추세·회귀로 성장/전환을 봅니다.",
        "【네트워크】공저·인용망과 중심성(연결·매개)을 계산합니다.",
        "【검증】고립점·자이언트 컴포넌트를 점검합니다.",
    ],
    (4, 0): [
        "【판단】지표로 영향력·동향을 해석합니다.",
        "【주장】가설/명제와 지표를 연결합니다.",
        "【한계】DB 편향·언어·자기인용을 고지합니다.",
    ],
    (4, 1): [
        "【시각화】네트워크 맵·추세그래프를 제작합니다.",
        "【캡션】읽기 가이드(색·크기·기간)를 붙입니다.",
        "【재현】그림 원데이터·코드를 보관합니다.",
    ],
    (5, 0): [
        "【산출】계량서지 지표 및 동향분석 패키지.",
        "【구성】검색식·정제로그·지표표·네트워크·시각화·해석.",
        "【버전】날짜·DB스냅샷.",
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
            if key.startswith("cit_"):
                parts.append("인용분석은 인용 경로·속도·자기인용·중개 구조를 해석 포인트로 둡니다.")
            elif key.startswith("bib_"):
                parts.append("계량서지는 출판량·키워드·생산성·학제 구조를 동향 서술의 축으로 둡니다.")
        out.append("\n".join(parts))
    return out
