# -*- coding: utf-8 -*-
"""Step annotations for Literature Review–Evidence Synthesis DOCX."""
from __future__ import annotations

import re
from typing import Any

TERM_HINTS: list[tuple[str, str]] = [
    (r"PICO|PICo|PCC|SPIDER", "「PICO/PCC」는 누구·무엇·비교·결과(또는 인구·개념·맥락)를 정해 질문을 날카롭게 만드는 틀입니다."),
    (r"검색|search|불리언|MeSH|통제어", "「검색전략」은 DB마다 키워드·통제어·필터를 적은 레시피입니다. 실행일과 식 전문을 남겨야 재현됩니다."),
    (r"스크리닝|screening|중복|PRISMA", "「스크리닝」은 제목·초록으로 먼저 걸러 전문을 읽는 단계입니다. PRISMA 흐름도의 숫자와 맞아야 합니다."),
    (r"선정|배제|inclusion|exclusion", "「선정·배제기준」은 ‘어떤 연구를 넣고 빼는지’ 규칙입니다. 사후에 바꾸면 선택 편향이 생깁니다."),
    (r"RoB|비뚤림|NOS|QUADAS|AMSTAR|CASP|AGREE|GRADE", "「질평가」는 연구가 얼마나 믿을 만한지 도구로 점검하는 일입니다. 도구 이름을 반드시 밝힙니다."),
    (r"추출|extraction|코딩표", "「자료추출」은 표본·설계·결과·효과를 같은 칸에 옮겨 적는 일입니다. 두 사람이 하면 오타가 줄어듭니다."),
    (r"효과크기|SMD|OR|RR|MD\b", "「효과크기」는 개입이 얼마나 달랐는지 같은 단위로 바꾼 숫자입니다. 서술·스코핑만 하면 N/A일 수 있습니다."),
    (r"이질성|I²|I2|Q통계|τ", "「이질성」은 연구 결과가 서로 얼마나 다른지입니다. I²가 크면 통합만 보고 끝내기 어렵습니다."),
    (r"랜덤효과|고정효과|pooled|통합", "「랜덤효과」는 ‘진짜 효과가 연구마다 다를 수 있다’고 보고 통합합니다. 95% 신뢰구간과 함께 봅니다."),
    (r"funnel|Egger|출판편향", "「출판편향」은 작은·비유의 연구가 덜 출판되어 결과가 한쪽으로 기울 가능성을 가늠합니다."),
    (r"하위그룹|메타회귀", "「하위그룹·메타회귀」는 이질성 후보(용량·인구·설계)를 탐색합니다. 사후 분석임을 밝혀야 합니다."),
    (r"주제코딩|질적 종합|서술합성|번역", "「주제코딩/서술합성」은 숫자 통합 대신 결과 문장을 주제로 묶어 이야기하듯 종합하는 방법입니다."),
    (r"프로토콜|PROSPERO|사전등록", "「사전등록」은 분석 계획을 미리 공개해 ‘좋은 결과만 고르는 것’을 줄입니다."),
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
        "【질문】 무엇을 알고 싶은지 한 문장으로 쓰고, PICO/PCC 칸에 쪼갭니다.",
        "【결과·비교】 주결과(primary outcome)와 비교군을 미리 정해 사후 변경을 막습니다.",
        "【등록】 가능하면 프로토콜을 PROSPERO/OSF에 올립니다.",
        "【적합 고찰유형】 질문 성격에 따라 SR·스코핑·서사·우산·비판적평가를 고릅니다.",
    ],
    (0, 1): [
        "【다중DB】 한 DB만 쓰면 누락이 커집니다. 검색식·실행일·hit 수를 로그로 남깁니다.",
        "【통제어】 MeSH 등과 자유키워드를 함께 씁니다. 사서·동료 PRESS 검토를 권장합니다.",
        "【회색문헌】 지침·보고서·시험등록을 포함할지 규칙을 정합니다.",
    ],
    (0, 2): [
        "【중복제거】 참고관리 도구로 중복을 없앤 뒤 unique n을 적습니다.",
        "【이중스크리닝】 두 명이 독립 검토하고 κ·불일치 합의를 기록합니다.",
        "【전문검토】 제외 사유를 코드화해 PRISMA 상자와 숫자를 맞춥니다.",
    ],
    (1, 0): [
        "【최종 포함】 포함 목록과 PRISMA 숫자가 일치해야 합니다.",
        "【충돌해결】 제3자 또는 합의 규칙을 남깁니다.",
        "【인용관리】 공유 라이브러리(버전)를 고정합니다.",
    ],
    (1, 1): [
        "【도구】 RoB2, ROBINS-I, NOS, QUADAS, AMSTAR, CASP, AGREE 등 질문에 맞는 도구를 고릅니다.",
        "【이중평가】 불일치를 합의하고 영역별 판정을 표로 요약합니다.",
        "【서술고찰】 형식 도구 대신 비판적 질문지(강점·약점)를 쓸 수 있습니다.",
    ],
    (1, 2): [
        "【추출양식】 설계·n·개입·결과·효과·자금·이해상충 칸을 파일럿합니다.",
        "【이중추출】 수치를 교차 확인합니다.",
        "【결측】 NR(보고없음)로 표시하고 저자 연락 여부를 적습니다.",
    ],
    (2, 0): [
        "【특성 코딩】 연구 한 편=한 행. 설계·국가·추적기간·지표정의를 표준화합니다.",
        "【코드북】 범주 정의를 남겨 추출자 간 해석을 맞춥니다.",
        "【버전】 codebook_v1과 변경이력을 둡니다.",
    ],
    (2, 1): [
        "【주제코딩】 질적·서술·통합고찰에서 결과 문장을 주제로 묶습니다.",
        "【근거발췌】 연구ID·쪽수를 붙여 감사를 가능하게 합니다.",
        "【양적메타만】 본령이 효과크기면 최소 주제메모 또는 N/A 사유를 명시합니다.",
    ],
    (3, 0): [
        "【효과크기】 SMD/OR/RR/MD와 분산을 계산·변환합니다.",
        "【소프트웨어】 R metafor, RevMan 등 버전을 적습니다.",
        "【비해당】 서사·스코핑·읽기실습은 N/A 또는 개별 보고만.",
    ],
    (3, 1): [
        "【이질성】 Q, I², τ²를 보고하고 맥락과 함께 해석합니다.",
        "【관례】 I²만으로 기계적으로 판단하지 않습니다.",
        "【N/A】 메타가 없으면 명시합니다.",
    ],
    (3, 2): [
        "【모형】 랜덤효과(또는 고정효과) 선택 근거를 적습니다.",
        "【통합】 pooled 추정과 95% CI, 연구 수 k.",
        "【민감도】 고비뚤림 제외·대안모형을 시행합니다.",
    ],
    (3, 3): [
        "【출판편향】 funnel, Egger, trim-and-fill 등.",
        "【소표본】 k가 작으면 해석을 절제합니다.",
        "【N/A】 질적합성·소규모 서술고찰.",
    ],
    (4, 0): [
        "【제시】 통합효과·CI 또는 주제요약. forest/주제 그림.",
        "【실질해석】 통계적 유의와 실질적 중요(MID)를 구분합니다.",
        "【확실성】 예비 GRADE 소견을 연결합니다.",
    ],
    (4, 1): [
        "【하위그룹】 사전명세 우선. 사후탐색이면 명시.",
        "【메타회귀】 공변량·다중비교 주의를 적습니다.",
        "【스코핑】 ‘효과검정’이 아니라 ‘분포·공백’ 해석으로 대체합니다.",
    ],
    (4, 2): [
        "【GRADE】 비뚤림·비일관성·간접성·부정확·출판편향으로 하향.",
        "【SoF】 Summary of Findings 표.",
        "【권고】 근거→실무 연결은 조심스럽게.",
    ],
    (5, 0): [
        "【보고서】 PRISMA·검색식·RoB·합성·한계·이해상충.",
        "【부록】 제외목록·추출파일·프로토콜.",
        "【재현】 검색일·버전·데이터 공유 범위.",
    ],
}


def task_step_annotations(stage_i, task_i, proc_paras, analysis_key, topic, method_name=""):
    n = max(len(proc_paras), 1)
    bank = STEP_NOTE_BANK.get((stage_i, task_i), [])
    out = []
    for i in range(n):
        step = proc_paras[i] if i < len(proc_paras) else ""
        note = bank[i] if i < len(bank) else (
            f"이 단계({stage_i+1}단계·태스크 {task_i+1}의 {i+1}번째 절차) 입력→처리→출력을 남겨 재현합니다."
        )
        parts = [note]
        if i == 0 and topic.get("title"):
            parts.append(f"본 주제 「{topic['title']}」(틀: {topic.get('framework','')})에 맞춰 읽습니다.")
        extra = _terms(step)
        if extra:
            parts.append(" ".join(extra[:3]))
        key = analysis_key.lower()
        if i == 0:
            if key.startswith("nr_") or key.startswith("sc_"):
                parts.append("서사·스코핑은 ‘지도·이야기 종합’이 본령이라 메타분석 칸이 N/A일 수 있습니다.")
            elif key.startswith("ur_"):
                parts.append("우산고찰은 ‘체계고찰을 다시 고찰’하므로 포함 단위가 개별연구가 아니라 SR입니다.")
            elif key.startswith("ebm_") or key.startswith("ca_"):
                parts.append("비판적평가·EBM읽기는 다수 합성보다 ‘한 편·한 지침을 깊게 읽기’가 중심입니다.")
            elif key.startswith("rr_"):
                parts.append("신속고찰은 시간 제약에 맞춰 DB·이중작업·합성을 간소화하되, 간소화 내역을 투명히 적습니다.")
        out.append("\n".join(parts))
    return out
