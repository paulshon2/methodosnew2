# -*- coding: utf-8 -*-
"""Concrete coding/extraction examples for Literature Review stage ③."""
from __future__ import annotations


def study_characteristics_codebook() -> list[list[str]]:
    return [
        ["변수", "정의", "허용값", "결측코드"],
        ["study_id", "연구 식별자", "S01…", "—"],
        ["design", "연구설계", "RCT/cluster/cohort/qual/SR", "NR"],
        ["country", "수행국가", "ISO또는국명", "NR"],
        ["n", "분석표본", "정수", "NR"],
        ["intervention", "개입·노출 요약", "자유텍스트(표준화)", "NR"],
        ["comparator", "비교", "usual/placebo/none/other", "NR"],
        ["outcome_def", "주결과 정의", "측정·시점", "NR"],
        ["effect_metric", "효과지표", "MD/SMD/OR/RR/qual", "NA"],
        ["funding", "자금", "공공/민간/없음/NR", "NR"],
        ["coi", "이해상충", "Y/N/NR", "NR"],
    ]


def study_coding_rows(topic: dict) -> list[list[str]]:
    return [
        ["study_id", "design", "n", "outcome", "ES/요약", "RoB"],
        ["S01", "RCT", "120", topic.get("focus", "주결과")[:12], "-0.31", "Some"],
        ["S02", "RCT", "80", topic.get("focus", "주결과")[:12], "-0.12", "High"],
        ["S03", "cohort", "450", topic.get("focus", "주결과")[:12], "-0.20", "Some"],
        ["S04", "qual", "28", "주제진술", "자율성·장벽", "CASP"],
    ]


def theme_coding_rows(topic: dict, akey: str) -> list[list[str]]:
    if akey.startswith(("sr_", "ur_")) and "teach" not in akey:
        return [
            ["항목", "처리"],
            ["질적 주제코딩", "선택(논의용) 또는 N/A"],
            ["사유", "본령=효과크기 합성"],
            ["보조", "고찰 논의 문단용 메모만"],
        ]
    return [
        ["theme_id", "주제", "포함 연구", "근거 발췌(요약)", "비고"],
        ["TH1", "자율성·자기효능 지지", "S01,S04", "「스스로 조절…」", "반복"],
        ["TH2", "자원·접근 장벽", "S02,S07", "「대기·비용…」", "구조요인"],
        ["TH3", "낙인·침묵", "S03", "「말하기 어려움」", "소수이나 중요"],
        ["TH4", f"{topic.get('focus','초점')[:10]} 관련", "S01–S03", topic.get("title", "")[:24], "주제특화"],
    ]


def coding_proc_characteristics(topic: dict, method_name: str) -> list[str]:
    return [
        f"【단위】포함 연구 1편=1행. 주제 「{topic['title']}」·질문틀 {topic.get('framework')}.",
        f"【표준화】설계·표본·개입·결과정의·효과지표를 codebook에 맞춰 기록. ({method_name})",
        "【이중코딩】추출 변수 핵심항목 이중입력 후 불일치 해결 로그.",
        "【산출】characteristics.csv + codebook_v1.md.",
    ]


def coding_proc_themes(topic: dict, akey: str) -> list[str]:
    if akey.startswith(("nr_", "sc_", "ilr_", "ca_qual", "ssr_")) or "qual" in akey:
        return [
            "【질적·서술 종합】결과 섹션 문장을 주제코드로 묶는다.",
            "【절차】①개방코드 →②주제병합 →③연구 간 번역(유사개념 정렬) →④반증사례.",
            f"【초점】{topic.get('focus')} — 주제명과 발췌·연구ID를 항상 연결.",
            "【산출】themes.xlsx (theme×study 행렬).",
        ]
    return [
        "【적용 범위】양적 메타가 본령이면 주제코딩은 논의 보조 또는 N/A.",
        "【최소】고찰 논의에 쓸 핵심 서술 포인트 3개를 메모.",
        "【명시】방법란에 ‘질적 주제코딩 N/A(또는 보조)’ 사유 기입.",
        f"【연결】중심 주장 「{topic.get('hypothesis','')[:40]}…」와 모순되지 않게.",
    ]
