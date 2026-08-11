# -*- coding: utf-8 -*-
"""Step annotations for Q Methodology–Research Programme DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"concourse|모집단|진술문|Q-set", "「concourse」에서 의견 진술문을 뽑아 「Q-set」을 만듭니다."),
    (r"P-sample|응답자", "「P-sample」은 Q-sort를 수행할 참여자 표본입니다(대표성이 아닌 관점 다양성)."),
    (r"Q-sort|그리드|정규분포", "참여자가 진술문을 동의–반대 정규분포 그리드에 분류하는 것이 Q-sort입니다."),
    (r"매트릭스|결측|오류", "Q-sort 결과를 응답자×진술문 매트릭스로 입력하고 결측·오류를 점검합니다."),
    (r"개념적 코딩|범주화", "진술문 개발 시 모집단 발언을 개념적으로 범주화해 Q-set을 구성합니다."),
    (r"대표진술문|명명|유형", "요인추출 후 유형별 대표 진술문으로 관점을 해석·명명합니다."),
    (r"상관행렬|요인분석|PCA|centroid|회전|varimax|Z-score|요인점수", "응답자 상관→요인추출→회전→요인점수(Z)로 유형을 통계적으로 정리합니다."),
    (r"하드코어|보호대|문제이동|연구프로그램", "연구프로그램 관점에서는 하드코어·보호대·진보/퇴행 문제이동 언어로 유형을 해석할 수 있습니다."),
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
        "【concourse】인터뷰·문헌·미디어에서 의견 발언을 모읍니다.",
        "【Q-set】중복·모호를 줄여 40± 진술문으로 정제합니다.",
        "【균형】찬반·측면이 한쪽으로 치우치지 않게 합니다.",
    ],
    (0, 1): [
        "【P-sample】관점이 다양하도록 목적표집합니다.",
        "【규모】보통 수십 명(대표표본 아님).",
        "【윤리】설명·동의·철회권을 확보합니다.",
    ],
    (0, 2): [
        "【Q-sort】정규분포 그리드에 강제 분류합니다.",
        "【후속】극단 칸 선택 이유를 짧게 묻습니다(후속면담).",
        "【기록】정렬표 사진/디지털 저장.",
    ],
    (1, 0): [
        "【입력】응답자×진술문 점수 매트릭스를 만듭니다.",
        "【범위】그리드 점수(+4…−4 등)를 그대로 기입합니다.",
        "【백업】원본 정렬표를 보관합니다.",
    ],
    (1, 1): [
        "【QC】결측·중복배치·합계 오류를 점검합니다.",
        "【수정】재분류 요청 또는 제외 기준을 문서화합니다.",
        "【로그】수정 이력을 남깁니다.",
    ],
    (2, 0): [
        "【개념코딩】concourse 발언을 범주화해 Q-set을 구성합니다.",
        "【정의】범주 정의·대표문장을 고정합니다.",
        "【파일럿】소규모로 이해도·중복을 점검합니다.",
    ],
    (2, 1): [
        "【유형해석】요인별 대표(±)진술문으로 관점을 명명합니다.",
        "【근거】Z점수·구분진술문을 함께 제시합니다.",
        "【이름】해석적 라벨은 한 줄로 요약 가능하게.",
    ],
    (3, 0): [
        "【상관】응답자 간 상관행렬을 산출합니다.",
        "【의미】비슷한 정렬끼리 높게 상관됩니다.",
    ],
    (3, 1): [
        "【추출】centroid 또는 PCA로 요인을 추출합니다.",
        "【결정】고유값·설명분산·해석가능성을 봅니다.",
    ],
    (3, 2): [
        "【회전】varimax 등으로 해석을 용이하게 합니다.",
        "【부하】유의한 요인부하 기준을 명시합니다.",
    ],
    (3, 3): [
        "【Z점수】요인점수로 대표 정렬을 만듭니다.",
        "【구분문】유형을 가르는 진술문을 표시합니다.",
    ],
    (4, 0): [
        "【명명】유형별 관점을 해석적으로 이름 붙입니다.",
        "【서술】가장 동의/반대 진술문으로 초상을 그립니다.",
    ],
    (4, 1): [
        "【차이】유형 간 핵심 대립·공유를 질적으로 서술합니다.",
        "【함의】정책·교육·임상 함의를 짧게 적습니다.",
        "【한계】P-sample·concourse 편향을 고지합니다.",
    ],
    (5, 0): [
        "【산출】주관적 관점 유형화 패키지.",
        "【구성】Q-set·P-sample·매트릭스·요인·유형서술.",
        "【버전】날짜·소프트웨어.",
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
            if key.startswith("srp_"):
                parts.append("연구프로그램 주제는 유형 해석에 하드코어·보호대·문제이동 언어를 연결합니다.")
            elif key.startswith("qm_"):
                parts.append("GN-029 주제는 주관성 유형의 구분진술문과 명명의 설득력을 중심에 둡니다.")
        out.append("\n".join(parts))
    return out
