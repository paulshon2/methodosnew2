# -*- coding: utf-8 -*-
"""Coding examples for Grounded Theory stage ③."""
from __future__ import annotations


def open_code_rows(topic: dict, seed: int) -> list[list[str]]:
    focus = topic.get("core_focus", "과정")[:12]
    return [
        ["발췌ID", "원문(요지)", "개방코드", "인비보", "메모"],
        ["P01-12", "「그냥 참고 버티는 거죠」", f"OC_{focus}_견딤", "버티는", "전략?"],
        ["P01-28", "「물어볼 데가 없어요」", "OC_지지부재", "물어볼 데", "맥락"],
        ["P02-09", "「눈치 보면 티 나요」", "OC_암묵규범", "눈치", "현장규칙"],
        ["P02-41", "「그래도 동료가 한 마디」", "OC_동료지지", "한 마디", "중재"],
        ["P03-05", f"「{topic['title'][:10]}… 그때부터」", "OC_전환점", "그때부터", "과정단계"],
        [f"P0{(seed%4)+1}-{(seed%20)+10}", "「다시는 그렇게 안 해요」", "OC_학습전환", "다시는", "결과"],
    ]


def axial_paradigm_rows(topic: dict) -> list[list[str]]:
    core = topic.get("core_focus", "핵심과정")
    return [
        ["패러다임 요소", "범주(예)", "속성/차원", "근거발췌", "한줄"],
        ["인과조건", "준비부족·정보공백", "강도:고–저", "P01-28", "시작 조건"],
        ["현상(중심)", core, "지속:일시–만성", "P01-12", "다루는 중심과정"],
        ["맥락", topic.get("site", "현장")[:14], "제도압력", "P02-09", "상황"],
        ["중재조건", "동료·멘토·자원", "유무", "P02-41", "완화/강화"],
        ["작용/상호작용전략", "버티기·협상·회피·요청", "적극–소극", "P01-12", "대응"],
        ["결과", "적응/소진/학습/이탈", "적응도", "P03-05", "산출"],
    ]


def selective_rows(topic: dict) -> list[list[str]]:
    return [
        ["핵심범주", "통합되는 하위범주", "관계", "근거", "통합문장"],
        [
            topic.get("core_focus", "핵심"),
            "지지부재·암묵규범·동료지지·전환점",
            "중심으로 수렴",
            "개방+축",
            topic.get("hypothesis", "")[:40],
        ],
        ["(후보기각)", "단순개인성격", "설명력↓", "부정사례", "핵심에서 제외"],
    ]


def saturation_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["라운드", "추가표집", "새속성?", "새관계?", "판정"],
        ["R1", "초기 6명", "많음", "많음", "계속"],
        ["R2", "+4명(개념공백)", "일부", "일부", "계속"],
        ["R3", f"+{2 + seed % 2}명(부정사례)", "거의없음", "거의없음", "포화근접"],
        ["R4", "확인면담 2", "없음", "없음", "포화(문서화)"],
        ["초점", topic.get("core_focus", "")[:16], "—", "—", topic.get("process", "")[:12]],
    ]


def coding_proc_open(topic, method_name, seed):
    return [
        f"【단위】문장·구. 주제 「{topic['title']}」 전사·관찰노트.",
        f"【개방코딩】초기 개념·인비보 부여. 과잉추상 금지. ({method_name})",
        f"【목표】사례당 초기코드 약 {40 + seed % 30}개 수준(예시) 후 통합.",
        "【산출】개방코드 목록+메모.",
    ]


def coding_proc_axial(topic, method_name):
    return [
        "【범주화】유사 개방코드를 속성과 차원으로 묶는다.",
        f"【패러다임】인과–현상–맥락–중재–전략–결과에 「{topic.get('core_focus')}」를 배치. ({method_name})",
        "【근거】요소마다 발췌 ≥2.",
        "【산출】축코딩·패러다임 표.",
    ]


def coding_proc_selective(topic, method_name):
    return [
        f"【핵심범주】설명력·빈번·다른 범주 연결력으로 「{topic.get('core_focus')}」 선정.",
        f"【통합】{topic.get('hypothesis')}",
        f"【검증】부정사례로 흔들기. ({method_name})",
        "【산출】선택코딩·통합 맵.",
    ]


def coding_proc_compare(topic, method_name):
    return [
        "【지속비교】사건↔사건, 사례↔사례, 개념↔개념을 표로 비교.",
        f"【포화】「{topic['process']}」 관련 새 속성이 더해지지 않음을 라운드별로 기록. ({method_name})",
        "【결정】추가 표집 중단 또는 보완.",
        "【산출】비교·포화 점검표.",
    ]


def storyline_paras(topic: dict) -> list[str]:
    return [
        f"【이야기 윤곽】「{topic['title']}」에서 참여자들은 "
        f"{topic.get('site')}의 맥락 속에서 「{topic.get('core_focus')}」 과정을 거친다.",
        f"조건(정보·자원 공백) 아래 암묵규범이 작동하고, 중재(동료·제도)에 따라 "
        f"전략(버티기·협상·요청)이 달라지며, 결과적으로 적응·학습 또는 소진·이탈로 이어진다.",
        f"【이론적 한줄】{topic.get('hypothesis')}",
    ]


def propositions(topic: dict) -> list[list[str]]:
    return [
        ["명제ID", "이론적 명제", "근거범주", "범위"],
        ["P1", topic.get("hypothesis", ""), topic.get("core_focus", ""), topic.get("site", "")],
        ["P2", f"{topic.get('core_focus')}는 중재조건(지지·자원)에 따라 전략이 달라진다", "중재–전략", "실체"],
        ["P3", "부정사례(조기이탈 등)는 핵심과정의 경계조건을 드러낸다", "결과·경계", "실체"],
    ]
