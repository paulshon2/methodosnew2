# -*- coding: utf-8 -*-
"""Step annotations for Causal–Experimental Design DOCX."""
from __future__ import annotations

import re
from typing import Any

TERM_HINTS: list[tuple[str, str]] = [
    (r"무작위|RCT|배정|randomiz", "「무작위배정」은 동전 던지기처럼 처치/대조를 정해, 두 집단이 평균적으로 비슷해지게 하는 방법입니다."),
    (r"준실험|매칭|PSM|DiD|RDD|IV|ITS", "「준실험」은 완전 무작위가 아닐 때, 자연스러운 단절·전후·도구 등으로 비교를 비슷하게 만드는 설계입니다."),
    (r"처치|treatment|통제|control|대조", "「처치군」은 개입·정책을 받은 쪽, 「통제군」은 비교를 위해 받지 않은(또는 다른) 쪽입니다."),
    (r"사전|사후|baseline|follow-up|반복측정", "「사전·사후」는 개입 전후 같은 지표를 재는 것입니다. 변화량을 보려면 둘 다 필요합니다."),
    (r"균형성|balance|SMD|공변량", "「균형성」은 배정/매칭 후 나이·점수 같은 배경변수가 집단 간 비슷한지 보는 점검입니다."),
    (r"중도탈락|attrition|결측", "「중도탈락」은 중간에 빠진 사람입니다. 처치군만 많이 빠지면 결과가 왜곡될 수 있습니다."),
    (r"ITT|per-protocol|순응", "「ITT」는 ‘배정된 대로’ 분석합니다. 실제로 안 받아도 배정 집단에 둡니다. 현실적 효과를 봅니다."),
    (r"효과크기|ATE|ATT|LATE|신뢰구간", "「효과」는 처치로 인한 평균 차이입니다. 점추정과 함께 신뢰구간으로 불확실성을 보여 줍니다."),
    (r"강건성|민감도|placebo|병렬추세", "「강건성」은 가정·표본·모형을 바꿔도 결론이 비슷한지 보는 검사입니다."),
    (r"코딩|해당없음", "이 아키타입의 ③코딩은 질적 코딩이 아닙니다. 처치·시점·층화 변수만 분석용으로 코딩합니다."),
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
        "【설계 확정】 RCT(무작위)인지 준실험(DiD/RDD/IV/매칭)인지 한 문장으로 고정합니다.",
        "【식별가정】 예: 병렬추세, 컷오프 근처 연속, 배정 무시 불가능성 등을 명시합니다.",
        "【단위·배정단위】 개인/학급/지역 중 무엇을 배정·관측하는지 밝힙니다(클러스터).",
        "【사전등록】 가능하면 분석계획·주결과를 사전등록합니다.",
    ],
    (0, 1): [
        "【처치/통제 정의】 누가 무엇을 언제 받는지 조작적으로 정의합니다.",
        "【배정·선정】 난수·층화·매칭·컷오프·도입시점 규칙을 프로토콜에 적습니다.",
        "【오염·확산】 통제군이 처치를 간접 받을 가능성을 점검합니다.",
    ],
    (0, 2): [
        "【측정】 사전(baseline)·사후(follow-up) 또는 패널 반복측정.",
        "【주결과】 primary outcome을 하나만 못 박습니다.",
        "【자료원】 설문·행정·임상·센서 등 출처와 시점을 로그로 남깁니다.",
    ],
    (1, 0): [
        "【균형성】 처치 전 공변량의 표준화평균차(SMD) 등을 표·Love plot으로 봅니다.",
        "【무작위화 점검】 큰 불균형이 있으면 층화/재배정·공변량 조정을 검토합니다.",
        "【매칭품질】 공통지지·가중치 진단을 보고합니다.",
    ],
    (1, 1): [
        "【결측·탈락】 집단별 탈락률, 탈락 예측요인을 봅니다.",
        "【처리】 다중대체, 역확률가중, 민감도(최악가정) 중 규칙을 정합니다.",
        "【보고】 CONSORT/흐름도에 n을 맞춥니다.",
    ],
    (2, 0): [
        "【해당없음(질적코딩)】 주제코딩 대신 분석변수 코딩만 수행합니다.",
        "【변수】 treat, post, treat×post, score(러닝변수), instrument, strata, cluster_id.",
        "【코드북】 0/1 정의·시점·결측코드를 남깁니다.",
    ],
    (3, 0): [
        "【동질성】 배정 직후/매칭 후 배경변수의 t/χ² 또는 SMD.",
        "【목적】 ‘이미 달랐는지’를 보여 인과 해석의 전제를 점검합니다.",
        "【유의성만 금지】 표본이 크면 작은 차이도 유의 → SMD를 함께.",
    ],
    (3, 1): [
        "【주추정】 설계에 맞는 추정량: 차이평균, ANCOVA, DiD, RDD, IV, SCM 등.",
        "【표준오차】 클러스터·이분산·시계열에 맞는 SE.",
        "【보고】 점추정·95% CI·n.",
    ],
    (3, 2): [
        "【강건성】 대안모형, 대역폭, 공변량 세트, placebo 시기/컷오프.",
        "【가정점검】 병렬추세(사전추세), 밀도점프(McCrary), overID 등.",
        "【다중성】 주결과 외 탐색은 명시.",
    ],
    (4, 0): [
        "【제시】 처치효과 추정치와 신뢰구간을 표·그림으로.",
        "【대비】 ITT/ATT/LATE 등 추정 대상 명시.",
        "【단위】 결과 변수 단위로 해석.",
    ],
    (4, 1): [
        "【유의성+효과크기】 p만 보지 말고 d, pp, % 변화를 함께.",
        "【실질】 비용·정책 맥락에서 ‘의미 있는 크기’인지.",
        "【한계】 외적타당도·가정 위반 가능성.",
    ],
    (5, 0): [
        "【산출물】 인과효과 추정치·CI·강건성·설계문서·재현코드.",
        "【윤리】 동의·등록·유해사건(임상).",
        "【패키지】 data/code/figures/table_effects.",
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
                f"본 주제 「{topic['title']}」(설계: {topic.get('design','')}, 처치: {topic.get('treatment','')})에 맞춰 읽습니다."
            )
        extra = _terms(step)
        if extra:
            parts.append(" ".join(extra[:3]))
        key = analysis_key.lower()
        if i == 0:
            if "rdd" in key:
                parts.append("RDD는 컷오프 근처에서만 국소적 효과를 말합니다. 멀리 외삽하지 않습니다.")
            elif "did" in key or key.endswith("_es"):
                parts.append("DiD/이벤트스터디는 ‘병렬추세’ 가정이 핵심입니다. 사전추세 그림을 꼭 봅니다.")
            elif "iv" in key:
                parts.append("IV는 도구→처치→결과 경로와 배제제약을 글로 적어야 합니다.")
            elif key.startswith("ct_") or key.startswith("doe_") or key.startswith("fe_") or key.startswith("ci1_"):
                parts.append("실험·임상·CI-010은 배정 기전·맹검·클러스터를 CONSORT형으로 보고합니다.")
            elif key.startswith("cha_"):
                parts.append("비교역사는 사례 수와 관측을 늘리는 설계·반사실 논증을 병기합니다.")
        out.append("\n".join(parts))
    return out
