# -*- coding: utf-8 -*-
"""Concrete coding examples for Policy–Program Evaluation stage ③."""
from __future__ import annotations


def criteria_codebook(topic: dict) -> list[list[str]]:
    return [
        ["코드", "평가기준", "조작적 정의", "포함 예시", "제외"],
        ["C_EFF", "효과", "목표 성과지표 개선", "취업률·혈압·만족 상승", "단순 산출(횟수)만"],
        ["C_EQ", "형평", "하위집단 격차·접근", "농어촌·저소득 접근성", "평균만 보고 격차 무시"],
        ["C_COST", "비용·효율", "투입 대비 성과", "1인당단가·BCR", "총액만(성과 없음)"],
        ["C_FEAS", "실현가능성", "예산·인력·일정", "인력 부족 지적", "막연한 ‘어려움’"],
        ["C_ACC", "수용성", "이해관계자 수용", "민원·지지 발화", "무관심"],
        ["C_FOCUS", topic.get("focus", "초점")[:10], f"{topic.get('focus')} 관련", topic.get("title", "")[:18], "범위 외"],
    ]


def criteria_application_rows(topic: dict) -> list[list[str]]:
    return [
        ["발췌ID", "출처", "원문·요지", "코드", "근거"],
        ["EX01", "평가보고서 p.12", "대기시간이 단축되었다", "C_EFF", "성과지표 개선"],
        ["EX02", "면담-주민3", "읍면은 센터가 멀다", "C_EQ", "접근 격차"],
        ["EX03", "예산서", "인건비 미확보", "C_FEAS", "실현 제약"],
        ["EX04", "전문가논평", "보고서류가 중복", "C_ACC/부담", "수용·부담"],
        ["EX05", "정책자료", topic.get("focus", "")[:16], "C_FOCUS", "주제 초점"],
    ]


def comment_theme_rows() -> list[list[str]]:
    return [
        ["theme", "요지", "출처 수", "이견"],
        ["예산·인력 제약", "지표만 있고 인력이 없다", "8", "일부 ‘재배치로 가능’"],
        ["현장 보고부담", "중복 보고·서식", "6", "최소화 찬성 다수"],
        ["형평·사각지대", "비수혜 집단 누락", "5", "대상 확대 vs 집중"],
        ["데이터 품질", "행정자료 시차·결측", "4", "—"],
    ]


def coding_proc_criteria(topic: dict, method_name: str) -> list[str]:
    return [
        f"【단위】문헌 단락·면담 발화·정책조항. 주제 「{topic['title']}」.",
        f"【코드북】평가기준({topic['criteria']})을 C_EFF 등으로 코드화. ({method_name})",
        "【적용】원문→코드→근거 1문장. 다중코딩 허용.",
        "【품질】이중코딩 15%·불일치 합의. codebook_v1 개정.",
    ]


def coding_proc_comments(topic: dict) -> list[str]:
    return [
        "【질적 논평】델파이/AHP/설문 개방형·워크숍 발화를 주제화.",
        "【절차】개방코드→주제병합→이견 보존→순위/가중 해석에 인용.",
        f"【초점】{topic.get('focus')} 관련 논평을 C_FOCUS와 교차.",
        "【산출】comment_themes.xlsx.",
    ]
