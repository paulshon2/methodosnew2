# -*- coding: utf-8 -*-
"""Step annotations for Content Analysis–Coding DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"모집단|corpus|전수|확률표집|표집", "「모집단」은 분석하고 싶은 문헌·미디어·텍스트 전체입니다. 전수 또는 확률표집으로 표본을 정합니다."),
    (r"분석단위|unit", "「분석단위」는 코딩의 기본 낱개입니다(단어·문장·기사·연구 등). 단위가 바뀌면 빈도 해석도 바뀝니다."),
    (r"코드북|coding manual|지침", "「코드북」은 범주 정의·포함·제외·예시를 적은 규칙집입니다. 코더가 같은 기준으로 나누게 합니다."),
    (r"예비코딩|pilot|코더 훈련", "「예비코딩」은 본코딩 전 연습입니다. 정의를 고치고 코더를 맞추는 단계입니다."),
    (r"독립 코딩|이중|불일치|합의", "「독립 코딩」은 서로 보지 않고 코딩한 뒤, 불일치를 논의해 합의·개정합니다."),
    (r"신뢰도|Kappa|alpha|크리펜|코헨", "「코더간 신뢰도」는 여러 코더가 얼마나 일치하는지입니다. Kappa·Krippendorff's α로 보고합니다."),
    (r"빈도|백분율|기술통계", "「빈도·백분율」은 각 범주가 얼마나 나왔는지 요약입니다."),
    (r"카이제곱|χ²|연관", "「카이제곱」은 범주와 다른 변수(매체·시기 등)의 연관이 우연인지 보는 검정입니다."),
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
        "【모집단】매체·기간·언어·형식 경계를 문서화합니다.",
        "【포함·제외】광고/사설/댓글 등 포함 여부를 밝힙니다.",
        "【접근】DB·아카이브·크롤 가능성과 윤리를 점검합니다.",
    ],
    (0, 1): [
        "【표집】전수 또는 확률/층화/계통 표집을 선택·정당화합니다.",
        "【크기】목표 n과 대체(누락) 규칙을 정합니다.",
        "【로그】수집일·출처·ID를 남깁니다.",
    ],
    (1, 0): [
        "【단위】단어/문장/문단/기사/연구 중 하나를 고정합니다.",
        "【다중】한 단위에 복수 코드 허용 여부를 정합니다.",
        "【예시】경계 사례를 지침에 넣습니다.",
    ],
    (1, 1): [
        "【코드북】범주명·정의·포함·제외·예시·결정규칙.",
        "【버전】v0.x로 관리하고 개정 이력을 남깁니다.",
        "【상호배타/포괄】가능하면 체계적으로 설계합니다.",
    ],
    (1, 2): [
        "【훈련】코더에게 지침을 교육하고 질의응답합니다.",
        "【파일럿】소표본으로 예비코딩 후 정의를 개정합니다.",
        "【기준】파일럿 신뢰도 목표(예: κ≥.70)를 정합니다.",
    ],
    (2, 0): [
        "【본코딩】코드북대로 독립 코딩(2인 이상 권장).",
        "【맹검】가능하면 가설·상대 코딩을 보지 않습니다.",
        "【기록】단위ID·코더ID·코드·메모.",
    ],
    (2, 1): [
        "【불일치】차이를 표로 모아 논의합니다.",
        "【조정】합의코드 또는 코드북 개정.",
        "【금지】힘센 코더가 일방적으로 누르지 않기.",
    ],
    (2, 2): [
        "【신뢰도】합의 전 독립코딩 구간으로 κ/α 산출.",
        "【보고】전체·범주별 신뢰도를 함께.",
        "【기준미달】재훈련·재코딩.",
    ],
    (3, 0): [
        "【빈도】범주별 n과 % (분석단위 기준).",
        "【교차】시기·매체 등 층별 빈도.",
        "【시각】막대·히트맵.",
    ],
    (3, 1): [
        "【κ/α】우연일치 보정 지표를 보고.",
        "【해석】Landis/Krippendorff 기준 참고(절대기계X).",
        "【범위】어떤 표본·시점에서 계산했는지.",
    ],
    (3, 2): [
        "【χ²】범주×집단/시기 연관 검정(필요시).",
        "【효과】잔차·Cramer's V 등.",
        "【가정】기대빈도·독립성 점검.",
    ],
    (4, 0): [
        "【패턴】어떤 범주가 우세·공백·추세인지 요약.",
        "【신뢰도】해석 가능 수준인지 명시.",
        "【인용】대표 단위 예시.",
    ],
    (4, 1): [
        "【관계】χ²·교차표 결과를 실질적으로 해석.",
        "【한계】표집·단위·코더 편향.",
        "【함의】연구질문에 대한 답.",
    ],
    (5, 0): [
        "【산출】범주·주제별 빈도표 및 해석 + 코드북 + 신뢰도.",
        "【재현】원자료 ID·코딩시트.",
        "【윤리】저작권·개인정보.",
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
                f"본 주제 「{topic['title']}」(단위: {topic.get('unit','')}, "
                f"범주: {topic.get('categories','')})에 맞춰 읽습니다."
            )
        extra = _terms(step)
        if extra:
            parts.append(" ".join(extra[:3]))
        key = analysis_key.lower()
        if i == 0:
            if key.startswith("ma_"):
                parts.append("메타분석 입문은 ‘연구(paper)’를 단위로 설계·효과·보고품질을 코딩합니다.")
            elif key.startswith("slr_"):
                parts.append("체계적고찰 입문은 적격성·품질·주제매핑 코딩이 핵심입니다.")
            elif key.startswith("qm_"):
                parts.append("코딩 매뉴얼은 훈련·합의·코드북 개정의 절차 투명성을 강조합니다.")
            elif key.startswith("media_"):
                parts.append("미디어 TX-002은 채널·포맷·시간층화를 모집단 정의에 명시합니다.")
        out.append("\n".join(parts))
    return out
