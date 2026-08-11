# -*- coding: utf-8 -*-
"""Coding examples for Discourse–Critical Discourse stage ③."""
from __future__ import annotations


def linguistic_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["단위ID", "발췌", "어휘/수사/함축", "코드", "기능"],
        ["T01-03", "「불가피한 선택입니다」", "필연성 수사", "RHET_inevitable", "선택 닫기"],
        ["T01-07", "「그런 분들」", "지시·거리두기", "LEX_distancing", "타자화 예비"],
        ["T02-02", f"「{topic.get('focus','')[:8]}…」", "핵심초점 어휘", "LEX_focus", "주제화"],
        ["T02-11", "「아시잖아요」", "공유전제 함축", "IMP_shared", "반박차단"],
        ["T03-05", "비유/반복", "수사장치", "RHET_metaphor", "감정동원"],
        [f"T0{(seed%3)+1}-{(seed%9)+10}", "완화표지", "좀/약간", "PRAG_hedge", "체면"],
    ]


def intertext_ideo_rows(topic: dict) -> list[list[str]]:
    return [
        ["장치", "유형", "발췌/위치", "끌어온 텍스트·담론", "효과"],
        ["인용", "상호텍스트", "보도/전문가 말", "권위담론", "정당성 이전"],
        ["장르혼종", "상호텍스트", "광고+뉴스 어투", "상업·공적", "신뢰 위장"],
        ["자연화", "이데올로기", "‘원래/당연히’", "상식담론", "대안 봉쇄"],
        ["은유", "이데올로기", "전쟁/질병 은유", "위기담론", "강경대응 유도"],
        ["전제", "이데올로기", topic.get("focus", "")[:12], "문제설정", "질문 틀 고정"],
    ]


def strategy_rows(topic: dict) -> list[list[str]]:
    return [
        ["전략", "정의", "언어징후", "출현", "비고"],
        ["정당화", "행위·정책을 옳다 함", "불가피/모두를위해", "고", ""],
        ["타자화", "남을 외부로 구성", "그들/그런 사람들", "중–고", ""],
        ["책임전가", "귀속 이동", "수동태/상황탓", "중", ""],
        ["내집단결속", "우리 강화", "우리/함께", "중", ""],
        ["초점전략", topic.get("focus", "")[:14], "관련표지", "—", topic.get("hypothesis", "")[:22]],
    ]


def collocation_rows(seed: int) -> list[list[str]]:
    return [
        ["노드", "연어", "빈도", "MI/참고", "해석힌트"],
        ["불가피", "선택/희생", str(12 + seed % 8), "높음", "정당화"],
        ["그들", "문제/부담", str(20 + seed % 10), "높음", "타자화"],
        ["우리", "함께/책임", str(15 + seed % 7), "중", "결속"],
        ["당연히", "해야/알", str(8 + seed % 5), "중", "자연화"],
    ]


def coding_proc_ling(topic, method_name, seed):
    return [
        f"【단위】절/문장. 주제 「{topic['title']}」.",
        f"【코딩】어휘선택·수사장치·함축. 초점={topic.get('focus')}. ({method_name})",
        f"【밀도】핵심 구간 정밀, 주변은 표본. 예시 {30 + seed % 20}단위.",
        "【산출】언어·화용 코딩표.",
    ]


def coding_proc_inter(topic, method_name):
    return [
        "【식별】인용·장르혼종·전제·은유 등 상호텍스트·이데올로기 장치.",
        f"【연결】「{topic.get('genre')}」 담론장과의 관계. ({method_name})",
        "【효과】장치가 닫는 대안·여는 주체를 메모.",
        "【산출】장치 식별표.",
    ]


def coding_proc_strat(topic, method_name):
    return [
        "【범주화】정당화·타자화·책임전가 등 담화전략으로 묶는다.",
        f"【패턴】전략 공출현. 주장: {topic.get('hypothesis')}",
        f"【검증】반례 발화 탐색. ({method_name})",
        "【산출】전략 범주표.",
    ]
