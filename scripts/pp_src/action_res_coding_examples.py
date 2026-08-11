# -*- coding: utf-8 -*-
"""Coding examples for Action Research stage ③."""
from __future__ import annotations


def theme_code_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["코드", "정의", "발췌(일지/관찰)", "사이클", "비고"],
        ["TH_저항", "개입에 대한 주저·반발", "「또 새 양식이요?」", "C1", ""],
        ["TH_촉진", "실행을 돕는 조건", "「체크리스트가 편해요」", "C2", ""],
        ["TH_부담", "업무·시간 부담", "「준비 시간이…」", "C1–C2", ""],
        ["TH_학습", "실천가 학습·통찰", "「다음엔 더 짧게」", "C2", "성찰"],
        ["TH_변화단서", f"{topic.get('problem','')[:10]} 변화 단서", "관찰 빈도↑/↓", "C3", ""],
        [f"TH_X{seed % 9}", "현장특수", topic.get("intervention", "")[:14], "C2", ""],
    ]


def outcome_track_rows(topic: dict, seed: int) -> list[list[str]]:
    base = 40 + seed % 10
    return [
        ["지표범주", "조작적정의", "C1", "C2", "C3", "판정"],
        ["행동/참여", topic.get("problem", "")[:12] + " 관련행동", str(base), str(base + 8), str(base + 15), "개선"],
        ["품질/완성", "산출물 루브릭", f"{2.8:.1f}", f"{3.2:.1f}", f"{3.5:.1f}", "개선"],
        ["인식/만족", "문항평균(5점)", "3.1", "3.4", "3.6", "소폭↑"],
        ["부작용", "부담·저항 빈도", "고", "중", "저", "완화"],
        ["개입충실도", "계획대로 실행%", "70", "85", "90", "↑"],
    ]


def coding_proc_theme(topic, method_name, seed):
    return [
        f"【자료】실행일지·관찰기록. 주제 「{topic['title']}」.",
        f"【주제코딩】장애·촉진·부담·학습·변화단서. ({method_name})",
        f"【비교】사이클 간 코드 출현 변화. 개입={topic.get('intervention')}.",
        "【산출】주제코드 표+발췌.",
    ]


def coding_proc_outcome(topic, method_name):
    return [
        "【성과지표】행동·품질·인식·부작용·충실도를 범주화한다.",
        f"【추적】{topic.get('cycles')}에 걸쳐 상태를 표로 기록. ({method_name})",
        f"【연결】문제 「{topic.get('problem')}」 해결 정도를 판정한다.",
        "【산출】변화과정 추적표.",
    ]


def reflection_rows(topic: dict) -> list[list[str]]:
    return [
        ["사이클", "잘된 점", "안 된 점", "증거", "다음 조정"],
        ["C1", "개입 착수", "저항·부담", "일지·관찰", "설명회·간소화"],
        ["C2", "충실도↑", "일부 지표 정체", "설문·코딩", "피드백 강화"],
        ["C3", "목표 근접", "확산 과제", "추적표", "제도화 문서"],
        ["종합", topic.get("hypothesis", "")[:28], "잔여문제", "삼각화", "개선안"],
    ]
