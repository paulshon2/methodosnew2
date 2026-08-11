# -*- coding: utf-8 -*-
"""Coding examples for Narrative–Life History stage ③."""
from __future__ import annotations


def plot_element_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["코드", "유형", "발췌/장면", "시기", "메모"],
        ["EVT_이직", "사건", "「그때 공장을 나왔죠」", "1998", "전환 후보"],
        ["ACT_어머니", "등장인물", "「엄마가 막아냈어요」", "유년", "조력"],
        ["CTX_IMF", "맥락", "「회사가 갑자기…」", "1997", "사회맥락"],
        ["TP_진단", "전환점", f"「{topic.get('focus','')[:8]}… 그다음부터」", "—", "플롯핵"],
        ["EVT_재회", "사건", "「다시 만났을 때」", "최근", "결말 쪽"],
        [f"ACT_P{(seed%3)+1}", "화자/자아", "자기평가 발화", "현재", "목소리"],
    ]


def structure_rows(topic: dict) -> list[list[str]]:
    arc = topic.get("life_arc", "시작→전개→결말")
    parts = [p.strip() for p in arc.replace("→", "-").split("-") if p.strip()]
    if len(parts) < 4:
        parts = ["시작", "전개", "절정", "결말"]
    labels = ["시작", "전개", "절정", "결말"]
    rows = [["구조", "내용(예)", "핵심코드", "기록물"]]
    for lab, part in zip(labels, parts[:4]):
        rows.append([lab, part[:20], "EVT/TP", topic.get("docs", "")[:12]])
    rows.append(["평가장치", "‘억울/감사/후회’", "EVAL_*", "면담"])
    return rows


def typology_rows(topic: dict) -> list[list[str]]:
    return [
        ["유형", "정의", "해당참여자", "대표플롯", "반례"],
        ["회복형", "위기 후 의미재구성", "P01,P03", topic.get("life_arc", "")[:18], "P04"],
        ["저항형", "제도에 맞서기", "P02", "갈등→투쟁", "—"],
        ["순응·생존형", "버티며 유지", "P05", "일상지속", "P01"],
        ["방황·유예형", "결정 유예", "P04", "미결", "—"],
        ["초점유형", topic.get("focus", "")[:14], "다수", topic.get("hypothesis", "")[:24], ""],
    ]


def chronology_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["연도/시기", "사건", "출처", "확실성", "메모"],
        ["유년", "가족이동", "면담R1", "중", ""],
        ["성인초기", "첫 직장", "면담+사진", "고", ""],
        [str(1990 + seed % 20), "전환점", "면담R2", "고", topic.get("focus", "")[:10]],
        ["최근", "현재 의미화", "면담R3", "고", ""],
        ["공백", "기억단절", "—", "저", "억지연결금지"],
    ]


def coding_proc_plot(topic, method_name, seed):
    return [
        f"【단위】장면·에피소드. 주제 「{topic['title']}」.",
        f"【코딩】사건·등장인물·맥락·전환점 식별. ({method_name})",
        f"【목표】참여자당 핵심 에피소드 {8 + seed % 6}개 수준(예시).",
        "【산출】플롯요소 코딩표.",
    ]


def coding_proc_struct(topic, method_name):
    return [
        f"【매핑】시작–전개–절정–결말에 「{topic.get('life_arc')}」를 배치.",
        f"【복수플롯】하위 이야기 병기. ({method_name})",
        "【평가】화자의 평가·도덕적 위치 표시.",
        "【산출】서사구조표.",
    ]


def coding_proc_type(topic, method_name):
    return [
        "【유형화】참여자 서사를 유형으로 묶고 이름을 붙인다.",
        f"【초점】{topic.get('focus')}. 주장: {topic.get('hypothesis')}",
        f"【비교】유형 간 차이·반례. ({method_name})",
        "【산출】내러티브 유형표.",
    ]


def narrative_sample_paras(topic: dict) -> list[str]:
    return [
        f"【재구성 내러티브(요지)】「{topic['title']}」에서 화자는 "
        f"{topic.get('life_arc')}의 경로를 따라가며, "
        f"{topic.get('focus')}를 중심으로 자기 삶을 설명한다.",
        "시작에서 일상의 자리매김이 이루어지고, 전개에서 관계·제도의 압력이 쌓이며, "
        "전환점에서 선택이 강제되고, 결말에서 현재의 의미가 재작성된다.",
        f"【해석 한줄】{topic.get('hypothesis')}",
        "【인용】「그때는… 그다음부터는…」(P0x, R2) — 전환점 표지.",
    ]
