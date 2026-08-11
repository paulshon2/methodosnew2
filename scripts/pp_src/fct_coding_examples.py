# -*- coding: utf-8 -*-
"""Coding examples for Foucauldian–Critical Theory stage ③."""
from __future__ import annotations


def apparatus_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["코드ID", "자료요지", "개념코드", "계보메모", "권력/지식효과"],
        ["C01", "규칙·지침 조항", "PK_규범화", "출현시기 표시", "말할 자격 제한"],
        ["C02", "측정·평가 항목", "PK_가시화", "지표화 전환", "비교·서열"],
        ["C03", f"{topic.get('focus','')[:10]} 관련 서술", "PK_문제화", "정의 변화", "개입 정당화"],
        ["C04", "공간·시간 배치", "PK_규율배치", "제도화", "신체 길들이기"],
        ["C05", "자기책임·자발 언어", "PK_자기통치", "최근 강화", "내적 규율"],
        [f"C{(seed%5)+6:02d}", "대항·우회 실천", "PK_저항", "틈새", "전유"],
    ]


def formation_rows(topic: dict) -> list[list[str]]:
    return [
        ["범주", "포함코드", "정의", "예시장치", "제외"],
        ["담론형성체", "C01/C03", "말할 수 있는 대상·방식의 틀", topic.get("focus", "")[:14], "단순사실 나열"],
        ["규율기제", "C02/C04", "시간·공간·시선·상벌로 길들이기", "시간표·기록·CCTV", "일회성 사건"],
        ["지식생산", "C02/C03", "전문가·지표가 진실을 만드는 방식", "평가표·진단", "사담"],
        ["주체요청", "C05", "바람직한 주체상 요청", "자기계발·책임", "물리적 강제만"],
    ]


def governmentality_rows(topic: dict) -> list[list[str]]:
    return [
        ["개념", "작동방식", "근거범주", "대표자료", "한줄"],
        ["G1 자기규율", "외적명령→내적규범", "주체요청", "캠페인/HR", "자발성"],
        ["G2 인구관리", "집단지표·위험분류", "지식생산", "통계·대시보드", "생체권력"],
        ["G3 문제화통치", "문제정의→개입권한", "담론형성체", "정책서문", "문제화"],
        ["G4 초점통치", topic.get("focus", "")[:16], "규율기제", "현장문서", topic.get("hypothesis", "")[:24]],
    ]


def coding_proc_apparatus(topic, method_name, seed):
    return [
        f"【개념·계보 코딩】「{topic['title']}」 문헌에서 권력/지식 장치를 식별한다.",
        f"【규칙】표면 수사보다 ‘누가·무엇을·어떻게 알게/말하게 되는가’에 코드. ({method_name})",
        f"【규모】초기코드 약 {40 + seed % 20}개 후 장치 단위로 통합.",
        "【산출】장치 식별 코드표.",
    ]


def coding_proc_formation(topic, method_name):
    return [
        "【범주화】담론형성체·규율기제·지식생산·주체요청으로 코드를 묶는다.",
        f"【초점】{topic.get('focus')}. ({method_name})",
        "【연결】담론–제도–물질(공간·기술) 연결을 표시한다.",
        "【산출】담론형성체·규율기제 범주표.",
    ]


def coding_proc_gov(topic, method_name):
    return [
        "【통치성】자기규율·인구관리·문제화 등 통치 개념을 도출·명명한다.",
        f"【검토】주장: {topic.get('hypothesis')}",
        f"【모드】{topic.get('mode')} 자료 특성을 반영. ({method_name})",
        "【산출】통치성 개념표.",
    ]
