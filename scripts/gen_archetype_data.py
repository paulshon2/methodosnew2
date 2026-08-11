# -*- coding: utf-8 -*-
"""Generate Methodological Archetype JSON from Excel sources."""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path

import openpyxl

DESK = Path(r"c:\Users\saran\OneDrive\Desktop")
OUT = Path(__file__).resolve().parents[1] / "public" / "archetypes"
BUNDLES_OUT = OUT / "bundles"

PROCESS_KEYS = [
    ("collect", "① 자료수집", "Data Collection", "자료수집방법 과정", "자료수집 쉬운 풀이"),
    ("preprocess", "② 전처리", "Preprocessing", "전처리 과정", "전처리 쉬운 풀이"),
    ("coding", "③ 코딩", "Coding", "코딩방법 과정", "코딩방법 쉬운 풀이"),
    ("stats", "④ 통계기법", "Statistical Technique", "통계기법 과정", "통계기법 쉬운 풀이"),
    ("result", "⑤ 결과도출", "Result Derivation", "결과도출방식 과정", "결과도출 쉬운 풀이"),
    ("deliverable", "⑥ 최종 산출물", "Final Deliverable", "최종 산출물", "최종산출물 쉬운 풀이"),
]

# Display names for the 31 archetypes (Korean + English)
ARCHETYPE_NAMES = {
    1: ("설문·양적통계 아키타입", "Survey–Quantitative Statistics Archetype"),
    2: ("역사·비교사료 아키타입", "Historical–Comparative Source Archetype"),
    3: ("민족지·참여관찰 아키타입", "Ethnography–Participant Observation Archetype"),
    4: ("텍스트·계산언어 아키타입", "Text–Computational Linguistics Archetype"),
    5: ("EV-007·근거합성 아키타입", "Literature Review–Evidence Synthesis Archetype"),
    6: ("정책·EP-007 아키타입", "Policy–Program Evaluation Archetype"),
    7: ("인과·실험설계 아키타입", "Causal–Experimental Design Archetype"),
    8: ("현상학·체험탐구 아키타입", "Phenomenology–Lived Experience Archetype"),
    9: ("예측·시스템모형 아키타입", "Forecasting–System Modeling Archetype"),
    10: ("QL-008 아키타입", "Grounded Theory Archetype"),
    11: ("TX-002·코딩 아키타입", "Content Analysis–Coding Archetype"),
    12: ("서사·생애사 아키타입", "Narrative–Life History Archetype"),
    13: ("실행·QL-046 아키타입", "Action–Participatory Research Archetype"),
    14: ("담화·비판담화 아키타입", "Discourse–Critical Discourse Archetype"),
    15: ("심층면담 아키타입", "In-depth Interview Archetype"),
    16: ("질적설계·자연주의 아키타입", "Qualitative Design–Naturalistic Archetype"),
    17: ("푸코·비판이론 아키타입", "Foucauldian–Critical Theory Archetype"),
    18: ("상징적상호작용 아키타입", "Symbolic Interactionism Archetype"),
    19: ("QL-020 아키타입", "Case Study Archetype"),
    20: ("계량서지·인용분석 아키타입", "Bibliometrics–Citation Analysis Archetype"),
    21: ("질적메타합성 아키타입", "Qualitative Meta-Synthesis Archetype"),
    22: ("대화·QL-050 아키타입", "Conversation Analysis Archetype"),
    23: ("GN-029·연구프로그램 아키타입", "Q Methodology–Research Programme Archetype"),
    24: ("조사연구방법 아키타입", "Survey Research Method Archetype"),
    25: ("간호이론구축 아키타입", "Nursing Theory Construction Archetype"),
    26: ("관찰기법 아키타입", "Observation Technique Archetype"),
    27: ("비교정치·패턴분석 아키타입", "Comparative Politics–Pattern Analysis Archetype"),
    28: ("MM-001 아키타입", "Mixed Methods Design Archetype"),
    29: ("키워드핵심성 아키타입", "Keyword Salience Analysis Archetype"),
    30: ("역학연구 아키타입", "Epidemiology Research Archetype"),
    31: ("일반연구방법론 아키타입", "General Methodology Archetype"),
}

TERM_EN = {
    "자료수집": "Data Collection",
    "전처리": "Preprocessing",
    "코딩": "Coding",
    "통계기법": "Statistical Technique",
    "결과도출": "Result Derivation",
    "최종 산출물": "Final Deliverable",
    "모집단": "Population",
    "표본설계": "Sampling Design",
    "측정도구": "Measurement Instrument",
    "예비조사": "Pilot Test",
    "본조사": "Main Survey",
    "결측치": "Missing Value",
    "이상치": "Outlier",
    "신뢰도": "Reliability",
    "타당도": "Validity",
    "가변수화": "Dummy Coding",
    "기술통계": "Descriptive Statistics",
    "가설": "Hypothesis",
}


def ko_en(ko: str, en: str | None = None) -> str:
    ko = (ko or "").strip()
    if not ko:
        return ""
    # already bilingual?
    if re.search(r"\([A-Za-z][^)]*\)\s*$", ko) or " (" in ko and ko.rstrip().endswith(")"):
        # normalize to 한글(English) without space if needed
        m = re.match(r"^(.+?)\s*\(([^)]+)\)\s*$", ko)
        if m:
            return f"{m.group(1).strip()}({m.group(2).strip()})"
        return ko
    if en:
        return f"{ko}({en.strip()})"
    # try extract english from trailing paren already in text
    return ko


def clean_process_label(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫]\s*", "", s)
    return s.strip()


def parse_methods(blob: str) -> list[dict]:
    out = []
    if not blob:
        return out
    for line in str(blob).split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^(\d+)\.\s*(.+?)(?:\s*\(([^)]+)\))?\s*$", line)
        if m:
            name = m.group(2).strip()
            fam = (m.group(3) or "").strip()
            out.append({"no": int(m.group(1)), "name": name, "family": fam, "label": ko_en(name, fam or "Research Method")})
        else:
            out.append({"no": None, "name": line, "family": "", "label": line})
    return out


def split_stage_chain(text: str) -> list[str]:
    if not text:
        return []
    t = str(text).strip()
    if t.startswith("해당없음") or t == "-":
        return [t]
    parts = re.split(r"\s*→\s*", t)
    cleaned = []
    for p in parts:
        p = re.sub(r"^[①②③④⑤⑥⑦⑧⑨⑩]+", "", p).strip()
        if p:
            cleaned.append(p)
    return cleaned or [t]


def parse_tasks_from_cell(cell: str) -> list[str]:
    if not cell:
        return []
    lines = []
    for line in str(cell).split("\n"):
        line = line.strip()
        if not line:
            continue
        line = re.sub(r"^▶\s*산출물:\s*", "", line)
        line = re.sub(r"^\d+\)\s*", "", line)
        lines.append(line)
    return lines


def extract_term_pairs(easy_text: str) -> list[dict]:
    """Parse ▸ 용어(english): def lines."""
    items = []
    if not easy_text:
        return items
    for line in str(easy_text).split("\n"):
        line = line.strip().lstrip("▸·*- ").strip()
        if not line:
            continue
        m = re.match(r"^(.+?)(?:\(([^)]+)\))?\s*:\s*(.+)$", line)
        if m:
            term_ko = m.group(1).strip()
            term_en = (m.group(2) or "").strip() or TERM_EN.get(term_ko, "")
            definition = m.group(3).strip()
            items.append({"term": ko_en(term_ko, term_en or None), "term_ko": term_ko, "term_en": term_en, "definition": definition})
    return items


def bilingualize_phrase(text: str) -> str:
    """Turn '한글(english)' style already present; ensure 한글(English) for known terms."""
    if not text:
        return ""
    t = str(text)

    def repl(m):
        ko = m.group(1).strip()
        en = m.group(2).strip()
        return f"{ko}({en})"

    t = re.sub(r"([가-힣A-Za-z0-9 ··\-/]+?)\s*\(([^)]+)\)", repl, t)
    return t


def load_bundle_summaries():
    wb = openpyxl.load_workbook(DESK / "연구방법_199개_유사과정.xlsx", data_only=True)
    ws = wb["1. 묶음 요약"]
    rows = list(ws.iter_rows(values_only=True))
    headers = [h for h in rows[0]]
    hi = {h: i for i, h in enumerate(headers)}
    bundles = []
    for r in rows[1:]:
        if r[0] is None:
            continue
        bid = int(r[0])
        methods = parse_methods(r[hi["묶인 연구방법 (번호·이름·대분류)"]])
        name_ko, name_en = ARCHETYPE_NAMES.get(bid, (f"아키타입 {bid}", f"Archetype {bid}"))
        processes = []
        for key, label_ko, label_en, proc_col, easy_col in PROCESS_KEYS:
            proc = r[hi[proc_col]] if proc_col in hi else None
            easy = r[hi[easy_col]] if easy_col in hi else None
            processes.append({
                "id": key,
                "label": ko_en(clean_process_label(label_ko) if not label_ko.startswith("①") else label_ko.replace("① ", "").replace("② ", "").replace("③ ", "").replace("④ ", "").replace("⑤ ", "").replace("⑥ ", ""), label_en),
                "label_ko": label_ko,
                "label_en": label_en,
                "order": ["collect", "preprocess", "coding", "stats", "result", "deliverable"].index(key) + 1,
                "procedure": bilingualize_phrase(str(proc or "")),
                "easy": bilingualize_phrase(str(easy or "")),
                "steps": [bilingualize_phrase(s) for s in split_stage_chain(str(proc or ""))],
                "terms": extract_term_pairs(str(easy or "")),
            })
        # fix labels with circle numbers properly
        for i, p in enumerate(PROCESS_KEYS):
            processes[i]["label"] = ko_en(p[1][2:].strip() if p[1][0] in "①②③④⑤⑥" else p[1], p[2])
            processes[i]["label_ko"] = p[1]
            processes[i]["label_en"] = p[2]

        bundles.append({
            "id": bid,
            "methodCount": int(r[hi["방법수"]] or len(methods)),
            "name": ko_en(name_ko, name_en),
            "name_ko": name_ko,
            "name_en": name_en,
            "methods": methods,
            "processes": processes,
            "deliverable": bilingualize_phrase(str(r[hi["최종 산출물"]] or "")),
        })
    wb.close()
    return bundles


def load_task_table():
    """From 태스크표및용어 풀이 — process stages + task lists + interpretations."""
    wb = openpyxl.load_workbook(DESK / "연구방법_199개_유사과정_태스크표및용어 풀이.xlsx", data_only=True)
    ws = wb["1. 유사 과정·태스크"]
    rows = list(ws.iter_rows(values_only=True))
    by_bundle = defaultdict(list)
    cur = None
    for i, r in enumerate(rows):
        if i == 0:
            continue
        if r[0] is not None:
            cur = int(r[0])
        if cur is None:
            continue
        process = r[3]
        stage_text = r[4]
        interpretation = r[5]
        tasks_cell = r[6]
        by_bundle[cur].append({
            "process": process,
            "stageChain": bilingualize_phrase(str(stage_text or "")),
            "interpretation": bilingualize_phrase(str(interpretation or "")),
            "tasks": [bilingualize_phrase(t) for t in parse_tasks_from_cell(str(tasks_cell or ""))],
        })
    # glossary
    ws2 = wb["2. 용어사전 "]
    glossary = []
    for i, r in enumerate(ws2.iter_rows(values_only=True)):
        if i == 0:
            continue
        if not r[1]:
            continue
        term_ko = str(r[1]).strip()
        term_en = str(r[2]).strip() if r[2] else TERM_EN.get(term_ko, "")
        definition = str(r[3]).strip() if r[3] else ""
        glossary.append({
            "no": r[0],
            "term": ko_en(term_ko, term_en or "Term"),
            "term_ko": term_ko,
            "term_en": term_en,
            "definition": definition,
        })
    wb.close()
    return by_bundle, glossary


def load_precise_guide():
    """Bundle 1 detailed ①-⑤ + full roadmap."""
    wb = openpyxl.load_workbook(DESK / "연구방법_과정별_태스크_정밀실행가이드.xlsx", data_only=True)
    ws = wb["1. 1번묶음 정밀가이드"]
    detailed = []
    cur_process = None
    cur_stage = None
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        if r[0]:
            cur_process = r[0]
        if r[1]:
            cur_stage = r[1]
        if not r[2]:
            continue
        detailed.append({
            "process": cur_process,
            "stageChain": bilingualize_phrase(str(cur_stage or "")),
            "task": bilingualize_phrase(str(r[2])),
            "why": bilingualize_phrase(str(r[3] or "")),
            "how": bilingualize_phrase(str(r[4] or "")),
            "protocol": bilingualize_phrase(str(r[5] or "")),
            "sample": bilingualize_phrase(str(r[6] or "")),
            "sampleExplain": bilingualize_phrase(str(r[7] or "")),
        })

    ws2 = wb["2. 전체 태스크 로드맵"]
    roadmap = defaultdict(list)
    cur_b = None
    cur_proc = None
    cur_stage = None
    for i, r in enumerate(ws2.iter_rows(values_only=True)):
        if i == 0:
            continue
        if r[0] is not None:
            cur_b = int(r[0])
        if r[1]:
            cur_proc = r[1]
        if r[2]:
            cur_stage = r[2]
        if not r[3] or cur_b is None:
            continue
        roadmap[cur_b].append({
            "process": cur_proc,
            "stageChain": bilingualize_phrase(str(cur_stage or "")),
            "task": bilingualize_phrase(str(r[3])),
            "status": r[4],
        })
    wb.close()
    return detailed, roadmap


def process_key_from_label(label: str) -> str:
    s = str(label or "")
    if "자료수집" in s:
        return "collect"
    if "전처리" in s:
        return "preprocess"
    if "코딩" in s:
        return "coding"
    if "통계" in s:
        return "stats"
    if "결과" in s:
        return "result"
    if "산출" in s:
        return "deliverable"
    return "other"


def gen_why(task: str, process: str, archetype: str) -> str:
    t = clean_process_label(task)
    p = clean_process_label(process or "")
    return (
        f"이 절차적 태스크(Procedural Task) '{t}'는 {archetype}의 '{p}' 과정에서 "
        f"다음 단계로 넘어가기 전에 반드시 갖춰야 할 근거를 만들기 위해 수행합니다. "
        f"이 단계를 건너뛰면 자료의 품질·해석의 설득력·결과의 재현성이 떨어집니다."
    )


def gen_how(task: str, stage_chain: str) -> str:
    steps = split_stage_chain(stage_chain) if stage_chain else []
    if len(steps) >= 2:
        numbered = " → ".join(f"{i+1}) {s}" for i, s in enumerate(steps[:6]))
        return f"표준 흐름: {numbered}. 각 하위 절차를 문서에 남기며 순서대로 실행하고, 완료 여부를 체크합니다."
    return (
        f"①목표를 한 문장으로 적기 → ②필요한 자료·도구 준비 → ③'{clean_process_label(task)}' 실행 → "
        f"④결과물 점검 → ⑤다음 절차적 단계(Procedural Stage)로 전달."
    )


def gen_protocol(task: str, process_key: str) -> str:
    base = {
        "collect": "연구질문(Research Question)과 모집단(Population)을 먼저 문서화하고, 수집 도구·동의·기록 양식을 준비합니다. 수집 로그(날짜·출처·담당)를 남깁니다.",
        "preprocess": "원본은 보존하고 작업본에서만 수정합니다. 결측·이상치·코딩 규칙을 코드북(Codebook)에 기록합니다.",
        "coding": "코드북(Codebook)을 사전 정의하고, 이중코딩(Double Coding) 또는 동료검토로 일관성을 점검합니다.",
        "stats": "분석 전 가정 검토(Assumption Checking)를 수행하고, 사용한 모형·소프트웨어·옵션을 재현 가능하게 기록합니다.",
        "result": "결과표·그림·해석을 연구질문별로 대응시키고, 한계(Limitation)와 함의(Implication)를 함께 적습니다.",
        "deliverable": "산출물 템플릿(표·그림·요약문)에 맞춰 최종본을 정리하고 버전을 남깁니다.",
    }
    return f"{base.get(process_key, '준비물·절차·점검 기준을 문서화한 뒤 실행합니다.')} 태스크 초점: {clean_process_label(task)}."


def make_interactive_samples(task: str, process_key: str, seed_sample: str = "", seed_explain: str = "") -> list[dict]:
    """Create 5 testable sample exercises."""
    t = clean_process_label(task)
    samples = []

    # 1) scenario decision
    samples.append({
        "id": "s1",
        "title": ko_en("상황 판단", "Scenario Judgment"),
        "type": "choice",
        "prompt": f"'{t}'를 시작할 때 가장 먼저 해야 할 일은?",
        "options": [
            "결과 해석부터 쓰기",
            "목표·준비물·기준을 짧게 문서화하기",
            "통계 소프트웨어만 실행하기",
            "최종 보고서 표지만 만들기",
        ],
        "answer": 1,
        "feedback": "절차적 태스크는 목표와 준비 기준을 먼저 고정해야 오류가 줄어듭니다.",
        "usable": "실습: 메모장에 목표 1문장 + 준비물 3개 + 완료기준 1개를 적고 체크하세요.",
    })

    # 2) fill / short answer
    samples.append({
        "id": "s2",
        "title": ko_en("핵심 용어 확인", "Key Term Check"),
        "type": "choice",
        "prompt": f"'{t}'에서 결과의 신뢰를 높이려면 무엇을 남기는가?",
        "options": [
            "감정 기록만",
            "감사기록(Audit Trail)·코드북(Codebook)·결정 이유",
            "최종 문장만",
            "비밀번호만",
        ],
        "answer": 1,
        "feedback": "감사기록과 코드북은 다른 사람도 같은 절차를 따라갈 수 있게 합니다.",
        "usable": "실습: 오늘 결정 3가지와 이유를 감사기록 형식으로 적어 보세요.",
    })

    # 3) apply mini case
    case_map = {
        "collect": ("학교 급식 만족도 조사", "모집단을 '우리 학교 전교생'으로 정의하고 표본 40명을 층화표집한다."),
        "preprocess": ("응답 표에 빈칸·극단값 있음", "결측치(Missing Value)와 이상치(Outlier)를 표시한 뒤 처리 규칙을 적용한다."),
        "coding": ("인터뷰 문장 20개", "비슷한 뜻끼리 코드(Code)를 붙이고 상위 범주(Category)로 묶는다."),
        "stats": ("두 반 평균 점수 비교", "기술통계(Descriptive Statistics) 후 t검정(t-test) 가정을 점검한다."),
        "result": ("유의한 차이가 나옴", "효과크기(Effect Size)와 함께 표·그림으로 해석한다."),
        "deliverable": ("분석 완료", "결과표·요약문·한계를 한 세트로 묶어 산출한다."),
    }
    case_title, case_action = case_map.get(process_key, ("연습 사례", "절차를 순서대로 적용한다."))
    samples.append({
        "id": "s3",
        "title": ko_en("미니 사례 적용", "Mini Case Application"),
        "type": "choice",
        "prompt": f"사례: {case_title}. 올바른 다음 행동은?",
        "options": [
            case_action,
            "아무 기록 없이 바로 결론만 발표",
            "관련 없는 변수를 모두 삭제",
            "표본을 숨기고 결과만 공개",
        ],
        "answer": 0,
        "feedback": f"올바른 적용: {case_action}",
        "usable": f"실습: '{case_title}'를 본인 주제로 바꿔 같은 행동을 한 줄로 다시 쓰세요.",
    })

    # 4) order / checklist
    samples.append({
        "id": "s4",
        "title": ko_en("순서 점검", "Sequence Check"),
        "type": "choice",
        "prompt": "절차적 단계(Procedural Stage) 안에서 태스크를 진행하는 바람직한 순서는?",
        "options": [
            "해석 → 수집 → 준비",
            "준비(프로토콜) → 실행 → 점검 → 산출",
            "산출 → 준비 → 실행",
            "점검 없이 실행만 반복",
        ],
        "answer": 1,
        "feedback": "표준 프로토콜(Standard Protocol)로 준비한 뒤 실행·점검·산출 순서가 안전합니다.",
        "usable": "실습: 체크리스트 4칸(준비/실행/점검/산출)을 만들고 오늘 태스크에 표시하세요.",
    })

    # 5) from excel sample or constructed usable sample
    if seed_sample:
        samples.append({
            "id": "s5",
            "title": ko_en("실제 예시 샘플", "Worked Example Sample"),
            "type": "open",
            "prompt": "아래 예시 샘플을 읽고, 같은 형식으로 본인 주제의 한 줄을 작성해 보세요.",
            "example": seed_sample,
            "explain": seed_explain or "예시의 숫자·기준·형식을 그대로 본인 맥락에 옮기면 됩니다.",
            "placeholder": "예: 모집단=…, 표본=…, 기준=…",
            "modelAnswer": "예시와 같은 구조(대상·수치·기준·결론)로 한 문단을 쓰면 합격입니다.",
            "usable": seed_sample,
        })
    else:
        samples.append({
            "id": "s5",
            "title": ko_en("직접 작성 샘플", "Write-Your-Own Sample"),
            "type": "open",
            "prompt": f"'{t}'에 대해 ①입력 ②절차 ③출력 을 세 줄로 적어 보세요.",
            "example": "입력: 원자료 표\n절차: 규칙에 따라 정리\n출력: 정제된 분석용 표",
            "explain": "입·출력을 분명히 하면 AI·동료와 협업할 때도 오류가 줄어듭니다.",
            "placeholder": "입력:\n절차:\n출력:",
            "modelAnswer": "입력·절차·출력이 각각 한 줄 이상이면 완료입니다.",
            "usable": "입력: (자료명)\n절차: (이 태스크에서 할 일)\n출력: (다음 단계로 넘길 산출물)",
        })

    return samples


def enrich_task(entry: dict, archetype_name: str, detailed_map: dict) -> dict:
    task = entry["task"]
    process = entry.get("process") or ""
    stage = entry.get("stageChain") or ""
    pk = process_key_from_label(process)
    key = re.sub(r"\s+", " ", clean_process_label(task)).lower()
    det = detailed_map.get(key)

    why = det["why"] if det else gen_why(task, process, archetype_name)
    how = det["how"] if det else gen_how(task, stage)
    protocol = det["protocol"] if det else gen_protocol(task, pk)
    sample = det["sample"] if det else ""
    sample_explain = det["sampleExplain"] if det else ""

    samples = make_interactive_samples(task, pk, sample, sample_explain)

    # Ensure task title is bilingual-ish
    task_label = bilingualize_phrase(task)
    if "(" not in task_label:
        task_label = ko_en(clean_process_label(task), "Procedural Task")

    stage_label = bilingualize_phrase(stage) if stage else ko_en(clean_process_label(process), "Procedural Stage")

    return {
        "id": entry.get("id"),
        "task": task_label,
        "taskRaw": task,
        "processKey": pk,
        "processLabel": ko_en(clean_process_label(process), {
            "collect": "Data Collection", "preprocess": "Preprocessing", "coding": "Coding",
            "stats": "Statistical Technique", "result": "Result Derivation", "deliverable": "Final Deliverable",
        }.get(pk, "Process")),
        "stageLabel": stage_label,
        "why": why,
        "how": how,
        "protocol": protocol,
        "sampleExplain": sample_explain,
        "samples": samples,
    }


def build_stages_for_bundle(bid: int, bundle: dict, task_rows: list, roadmap_tasks: list, detailed_map: dict) -> list:
    """Group tasks under procedural stages."""
    # Prefer roadmap order; fall back to task table
    source = roadmap_tasks if roadmap_tasks else []
    if not source and task_rows:
        for row in task_rows:
            for t in row["tasks"]:
                source.append({"process": row["process"], "stageChain": row["stageChain"], "task": t})

    # Build stage groups: process + stageChain
    stages = OrderedStages()
    for i, item in enumerate(source):
        proc = item.get("process") or ""
        chain = item.get("stageChain") or ""
        pk = process_key_from_label(proc)
        stage_id = f"{pk}-{abs(hash(chain)) % 100000}"
        if stage_id not in stages.map:
            # find process meta
            proc_meta = next((p for p in bundle["processes"] if p["id"] == pk), None)
            stages.add(stage_id, {
                "id": stage_id,
                "processKey": pk,
                "processLabel": ko_en(clean_process_label(proc), proc_meta["label_en"] if proc_meta else "Process"),
                "name": bilingualize_phrase(chain) if chain else ko_en(clean_process_label(proc), "Procedural Stage"),
                "name_ko": chain or proc,
                "procedure": proc_meta["procedure"] if proc_meta else chain,
                "easy": proc_meta["easy"] if proc_meta else "",
                "terms": proc_meta["terms"] if proc_meta else [],
                "tasks": [],
            })
        enriched = enrich_task(
            {"id": f"b{bid}-t{i+1}", "task": item["task"], "process": proc, "stageChain": chain},
            bundle["name"],
            detailed_map,
        )
        stages.map[stage_id]["tasks"].append(enriched)

    return stages.list


class OrderedStages:
    def __init__(self):
        self.order = []
        self.map = {}

    def add(self, sid, obj):
        if sid not in self.map:
            self.order.append(sid)
            self.map[sid] = obj

    @property
    def list(self):
        return [self.map[k] for k in self.order]


def main():
    BUNDLES_OUT.mkdir(parents=True, exist_ok=True)
    print("Loading Excel…")
    bundles = load_bundle_summaries()
    task_table, glossary = load_task_table()
    detailed_list, roadmap = load_precise_guide()

    detailed_map = {}
    for d in detailed_list:
        k = re.sub(r"\s+", " ", clean_process_label(d["task"])).lower()
        detailed_map[k] = d
        # also looser key
        k2 = re.sub(r"[^\w가-힣]+", "", k)
        detailed_map[k2] = d

    catalog_archetypes = []
    for b in bundles:
        bid = b["id"]
        stages = build_stages_for_bundle(
            bid, b,
            task_table.get(bid, []),
            roadmap.get(bid, []),
            detailed_map,
        )
        task_count = sum(len(s["tasks"]) for s in stages)
        payload = {
            "id": bid,
            "name": b["name"],
            "name_ko": b["name_ko"],
            "name_en": b["name_en"],
            "methodCount": b["methodCount"],
            "methods": b["methods"],
            "overview": (
                f"{b['name']}은(는) 연구 과정(수집→전처리→코딩→통계→결과→산출)이 같은 연구방법 "
                f"{b['methodCount']}개를 하나의 방법론적 아키타입(Methodological Archetype)으로 묶은 유형입니다. "
                f"같은 프로세스 유형을 선택하면 공통 절차적 단계(Procedural Stage)와 절차적 태스크(Procedural Task)를 "
                f"AI 기반 실습으로 따라갈 수 있습니다."
            ),
            "processes": b["processes"],
            "deliverable": b["deliverable"],
            "stages": stages,
            "stats": {"stageCount": len(stages), "taskCount": task_count},
        }
        out_path = BUNDLES_OUT / f"bundle-{bid:02d}.json"
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        catalog_archetypes.append({
            "id": bid,
            "name": b["name"],
            "name_ko": b["name_ko"],
            "name_en": b["name_en"],
            "methodCount": b["methodCount"],
            "stageCount": len(stages),
            "taskCount": task_count,
            "deliverable": b["deliverable"],
            "processSummary": [
                {"id": p["id"], "label": p["label"], "procedure": p["procedure"][:160]}
                for p in b["processes"] if p["id"] != "deliverable"
            ],
            "methodNames": [m["label"] if m.get("label") else m["name"] for m in b["methods"][:8]],
            "methodTotal": len(b["methods"]),
        })
        print(f"  bundle {bid}: {len(stages)} stages, {task_count} tasks")

    catalog = {
        "title": ko_en("방법론적 아키타입", "Methodological Archetype"),
        "intro": (
            "방법론적 아키타입(Methodological Archetype)은 연구방법의 프로세스가 같은 연구방법끼리 묶어, "
            "같은 과정을 쓰는 유형입니다. 개요·단계·용어를 익힌 뒤, 31개 프로세스 유형 중 하나를 골라 "
            "절차적 단계(Procedural Stage)와 절차적 태스크(Procedural Task)를 AI 기반으로 실습합니다."
        ),
        "howTo": [
            "개요 및 단계에서 31개 유형의 공통 과정(수집→산출)을 먼저 훑습니다.",
            "용어 페이지에서 한글(English) 표기 용어를 확인합니다.",
            "프로젝트에서 프로세스 유형 1개를 선택합니다.",
            "절차적 단계 → 절차적 태스크로 내려가 ①왜 ②어떻게 ③표준 프로토콜 ④⑤예시 샘플을 테스트합니다.",
        ],
        "stats": {
            "archetypeCount": len(catalog_archetypes),
            "methodCoverage": sum(a["methodCount"] for a in catalog_archetypes),
            "taskCount": sum(a["taskCount"] for a in catalog_archetypes),
            "termCount": len(glossary),
        },
        "archetypes": catalog_archetypes,
        "hubCards": [
            {
                "id": "overview",
                "title": ko_en("개요 및 단계", "Overview & Stages"),
                "blurb": "31개 아키타입의 과정 뼈대와 단계 설명을 한곳에서 봅니다.",
            },
            {
                "id": "glossary",
                "title": ko_en("용어", "Terminology"),
                "blurb": "아키타입 전반에서 쓰는 용어를 한글(English)과 쉬운 정의로 모았습니다.",
            },
            {
                "id": "projects",
                "title": ko_en("프로젝트", "Projects"),
                "blurb": "31개 프로세스 유형을 선택하고 절차적 단계·태스크를 실행합니다.",
            },
        ],
    }
    (OUT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "glossary.json").write_text(json.dumps({
        "title": ko_en("방법론적 아키타입 용어", "Methodological Archetype Terminology"),
        "intro": "아래 용어는 방법론적 아키타입(Methodological Archetype) 페이지에서 한글(English) 형식으로 사용합니다.",
        "terms": glossary,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print("Done.", OUT)
    print("archetypes:", len(catalog_archetypes), "glossary:", len(glossary), "tasks:", catalog["stats"]["taskCount"])


if __name__ == "__main__":
    main()
