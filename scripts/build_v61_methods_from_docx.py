# -*- coding: utf-8 -*-
"""Parse Prompt Design Structure 6.1 DOCX → method-catalog + per-method JSON (RWOS 6-stage)."""
from __future__ import annotations

import json
import os
import re
import zipfile
from collections import OrderedDict, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

SRC = Path(r"C:\Users\saran\OneDrive\Desktop\새 폴더 (2)\프롬프트6.1기준_추가-3")
OUT_PUBLIC = Path(__file__).resolve().parents[1] / "public"
METHODS_DIR = OUT_PUBLIC / "methods-v61"
CATALOG_PATH = OUT_PUBLIC / "method-catalog.json"
PERF_INDEX_PATH = OUT_PUBLIC / "perf-index.json"
LEGACY_METHODS = OUT_PUBLIC / "methods"  # will be replaced by symlink/copy later

W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

KIND_MACRO = {
    "survey": "조사·설문",
    "delphi": "조사·설문",
    "qualitative": "질적·해석",
    "phenomenology": "질적·해석",
    "ethnography": "질적·해석",
    "narrative": "질적·해석",
    "grounded": "질적·해석",
    "interview": "질적·해석",
    "observation": "질적·해석",
    "symbolic": "질적·해석",
    "discourse": "질적·해석",
    "conversation": "질적·해석",
    "foucault": "질적·해석",
    "nursing_theory": "질적·해석",
    "case": "질적·해석",
    "action": "질적·해석",
    "descriptive_stats": "양적·통계·모형",
    "multivariate": "양적·통계·모형",
    "regression": "양적·통계·모형",
    "logistic": "양적·통계·모형",
    "factor_sem": "양적·통계·모형",
    "longitudinal": "양적·통계·모형",
    "bayesian": "양적·통계·모형",
    "cluster": "양적·통계·모형",
    "mds": "양적·통계·모형",
    "text_ml": "텍스트·계산언어",
    "content": "텍스트·계산언어",
    "sentiment": "텍스트·계산언어",
    "topic": "텍스트·계산언어",
    "keyness": "텍스트·계산언어",
    "information_retrieval": "텍스트·계산언어",
    "bibliometric": "텍스트·계산언어",
    "evaluation": "평가·정책",
    "cost_benefit": "평가·정책",
    "ahp": "평가·정책",
    "causal": "양적·인과·실험",
    "epidemiology": "양적·인과·실험",
    "history": "역사·비교",
    "comparative": "역사·비교",
    "review": "문헌·근거합성",
    "meta_analysis": "문헌·근거합성",
    "scoping_review": "문헌·근거합성",
    "rapid_review": "문헌·근거합성",
    "qual_synthesis": "문헌·근거합성",
    "mixed": "혼합·설계",
    "system_model": "혼합·설계",
    "research_programme": "혼합·설계",
    "network": "혼합·설계",
    "qsort": "혼합·설계",
}

MACRO_ORDER = [
    "조사·설문",
    "질적·해석",
    "양적·통계·모형",
    "텍스트·계산언어",
    "평가·정책",
    "양적·인과·실험",
    "역사·비교",
    "문헌·근거합성",
    "혼합·설계",
]

FAMILY_KO = {
    "조사·설문": "조사·설문",
    "질적·해석": "질적연구",
    "양적·통계·모형": "통계·모형",
    "텍스트·계산언어": "텍스트·언어",
    "평가·정책": "평가·정책",
    "양적·인과·실험": "인과·실험",
    "역사·비교": "역사·비교",
    "문헌·근거합성": "문헌·합성",
    "혼합·설계": "혼합·설계",
}


def extract_paras(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    paras: list[str] = []
    for p in root.iter(f"{W_NS}p"):
        texts: list[str] = []
        for t in p.iter(f"{W_NS}t"):
            if t.text:
                texts.append(t.text)
            if t.tail:
                texts.append(t.tail)
        line = "".join(texts).strip()
        if line:
            paras.append(line)
    return paras


def kv_after(paras: list[str], start: int, end: int, keys: list[str]) -> dict[str, str]:
    """Scan [start,end) for key/value pairs where key is on its own line."""
    out: dict[str, str] = {}
    keyset = set(keys)
    i = start
    while i < end - 1:
        k = paras[i].strip()
        if k in keyset and paras[i + 1].strip() not in keyset:
            out[k] = paras[i + 1].strip()
            i += 2
            continue
        i += 1
    return out


STAGE_HEAD = re.compile(
    r"^Stage\s+(\d+)\.\s*(.+?)(?:\(([^)]+)\))?\s*$", re.I
)
PROC_HEAD = re.compile(
    r"^프로세스\s*(\d+)\.\s*(.+?)(?:\(([^)]+)\))?\s*$"
)
PHASE_HEAD = re.compile(
    r"^Phase\s+(\d+)\s*[·\-—]\s*(.+?)(?:\(([^)]+)\))?\s*$", re.I
)
ANNOT_WHAT = "이 항목은 무엇인가?"
ANNOT_WHY = "왜 필요한가?"
ANNOT_TERMS = "용어 풀이"


def find_sections(paras: list[str]) -> list[tuple[int, str]]:
    """Return (index, kind) markers for major structure."""
    marks = []
    for i, p in enumerate(paras):
        if p.startswith("0. 아키텍처"):
            marks.append((i, "arch"))
        elif p.startswith("1. 설정 계층"):
            marks.append((i, "config"))
        elif p.startswith("2. 정의 계층"):
            marks.append((i, "definition"))
        elif p.startswith("3. 실행 요소"):
            marks.append((i, "execution"))
        elif p.startswith("4. 실행 계층") or p.startswith("4. Runtime"):
            marks.append((i, "runtime"))
        elif p.startswith("5. 거버넌스"):
            marks.append((i, "governance"))
        elif PHASE_HEAD.match(p):
            marks.append((i, "phase"))
        elif STAGE_HEAD.match(p):
            marks.append((i, "stage"))
        elif PROC_HEAD.match(p):
            marks.append((i, "process"))
    return marks


def parse_annotation_block(paras: list[str], start: int, end: int) -> dict:
    what = why = terms = ""
    i = start
    while i < end:
        if paras[i] == ANNOT_WHAT and i + 1 < end:
            what = paras[i + 1]
            i += 2
            continue
        if paras[i] == ANNOT_WHY and i + 1 < end:
            why = paras[i + 1]
            i += 2
            continue
        if paras[i] == ANNOT_TERMS and i + 1 < end:
            terms = paras[i + 1]
            i += 2
            continue
        i += 1
    return {"what": what, "why": why, "terms": terms}


def parse_glossary_terms(blob: str) -> list[dict]:
    """Split 'Term(EN): def. Term2: def2.' style glossary."""
    if not blob:
        return []
    parts = re.split(r"(?<=\.)\s+(?=[^\s:]{1,40}(?:\([^)]+\))?:)", blob)
    out = []
    seen = set()
    for part in parts:
        part = part.strip()
        m = re.match(r"^([^:：]{1,80})[:：]\s*(.+)$", part, re.S)
        if not m:
            continue
        term = m.group(1).strip()
        defn = m.group(2).strip().rstrip(".")
        key = term.lower()
        if key in seen or len(term) > 80:
            continue
        seen.add(key)
        ko = re.sub(r"\s*\([^)]*\)\s*", "", term).strip() or term
        out.append({"term": term, "termKo": ko, "def": defn})
    return out[:80]


def parse_task_table(paras: list[str], start: int, end: int, has_desc: bool) -> list[dict]:
    """Parse numbered task rows after header markers."""
    # Find header row start
    hdr = -1
    for i in range(start, min(end, start + 40)):
        if paras[i] in ("taskName(작업명)", "#") or paras[i].startswith("taskName"):
            hdr = i
            break
    if hdr < 0:
        return []
    # Advance past header labels
    i = hdr
    while i < end and not re.match(r"^\d+$", paras[i]):
        i += 1
    tasks = []
    width = 6 if has_desc else 5  # # name type [desc] in out auto  — after number
    # Actually layout: number, name, type, [desc], input, output, auto
    while i < end:
        if not re.match(r"^\d+$", paras[i]):
            if paras[i].startswith("■") or STAGE_HEAD.match(paras[i]) or PROC_HEAD.match(paras[i]) or PHASE_HEAD.match(paras[i]):
                break
            i += 1
            continue
        num = int(paras[i])
        i += 1
        chunk = []
        while i < end and len(chunk) < (5 if has_desc else 4):
            if re.match(r"^\d+$", paras[i]) and len(chunk) >= (4 if has_desc else 3):
                break
            if paras[i].startswith("■"):
                break
            chunk.append(paras[i])
            i += 1
        if has_desc and len(chunk) >= 5:
            name, typ, desc, inp, outp = chunk[:5]
            auto = chunk[5] if len(chunk) > 5 else "반자동화(Semi-automatic)"
            # sometimes auto is still in chunk if we only took 5 — peek
            if i < end and ("자동화" in paras[i] or "수동" in paras[i] or "Semi" in paras[i] or "Manual" in paras[i] or "Automatic" in paras[i]):
                auto = paras[i]
                i += 1
            tasks.append({
                "no": num,
                "name": name,
                "type": typ,
                "description": desc,
                "input": inp,
                "output": outp,
                "automation": auto,
            })
        elif not has_desc and len(chunk) >= 4:
            name, typ, inp, outp = chunk[:4]
            auto = "반자동화(Semi-automatic)"
            if i < end and ("자동화" in paras[i] or "수동" in paras[i] or "Semi" in paras[i] or "Manual" in paras[i] or "Automatic" in paras[i]):
                auto = paras[i]
                i += 1
            tasks.append({
                "no": num,
                "name": name,
                "type": typ,
                "description": f"{name}을(를) 수행한다.",
                "input": inp,
                "output": outp,
                "automation": auto,
            })
        else:
            break
    return tasks


def next_marker_index(marks: list[tuple[int, str]], after: int, kinds: set[str] | None = None) -> int:
    for idx, kind in marks:
        if idx <= after:
            continue
        if kinds is None or kind in kinds:
            return idx
    return 10**9


def parse_docx(path: Path, meta: dict) -> dict:
    paras = extract_paras(path)
    marks = find_sections(paras)

    # Config method fields
    config_start = next((i for i, k in marks if k == "config"), 0)
    def_start = next((i for i, k in marks if k == "definition"), len(paras))
    method_fields = kv_after(
        paras,
        config_start,
        def_start,
        [
            "methodId",
            "researchMethodName",
            "methodFamily",
            "methodMechanism",
            "protocolBasis",
            "protocolStatus",
            "methodologyLabel",
            "practiceRows",
            "primaryUnit",
        ],
    )

    method_id_raw = method_fields.get("methodId") or meta.get("kind") or path.stem
    method_id_raw = re.sub(r"[^a-zA-Z0-9_]+", "_", method_id_raw).strip("_").lower() or "method"

    name_ko = meta.get("standardKorean") or paras[0]
    name_en = meta.get("standardEnglish") or (paras[1] if len(paras) > 1 else "")
    display = method_fields.get("researchMethodName") or f"{name_ko}({name_en})"
    family = method_fields.get("methodFamily") or meta.get("kind") or "general"
    mechanism = method_fields.get("methodMechanism") or ""
    kind = meta.get("kind") or family
    macro = KIND_MACRO.get(kind, KIND_MACRO.get(family, "혼합·설계"))

    # Architecture annotation
    arch_i = next((i for i, k in marks if k == "arch"), 0)
    arch_end = next_marker_index(marks, arch_i)
    arch_ann = parse_annotation_block(paras, arch_i, min(arch_end, arch_i + 40))

    # beginner intro from architecture / method annotation
    beginner = arch_ann.get("what") or f"{display}은(는) MethodOS RWOS 6단계 표준 프로세스로 학습·실행합니다."

    # Phases
    phases = []
    for i, k in marks:
        if k != "phase":
            continue
        m = PHASE_HEAD.match(paras[i])
        if not m:
            continue
        end = next_marker_index(marks, i, {"phase", "stage", "execution", "runtime", "governance"})
        ann = parse_annotation_block(paras, i, min(end, i + 30))
        phases.append({
            "no": int(m.group(1)),
            "name": m.group(2).strip(),
            "nameEn": (m.group(3) or "").strip(),
            "what": ann.get("what") or "",
            "why": ann.get("why") or "",
        })

    # Stages
    stages = []
    stage_indices = [(i, k) for i, k in marks if k == "stage"]
    for si, (i, _) in enumerate(stage_indices):
        m = STAGE_HEAD.match(paras[i])
        if not m:
            continue
        end = stage_indices[si + 1][0] if si + 1 < len(stage_indices) else next_marker_index(
            marks, i, {"execution", "runtime", "governance", "phase"}
        )
        # Don't cut Stage 5 early at first process — processes belong to stage 5
        # end is next stage or layer
        fields = kv_after(
            paras,
            i,
            min(end, i + 80),
            [
                "stageId",
                "stageName / stageEnglish",
                "stageSummary",
                "stagePurpose",
                "stageInput",
                "stageOutput",
                "nextStage",
                "automationLevel",
                "beginnerTip",
            ],
        )
        name_pair = fields.get("stageName / stageEnglish", "")
        if " / " in name_pair:
            sn, se = [x.strip() for x in name_pair.split(" / ", 1)]
        else:
            sn = m.group(2).strip()
            se = (m.group(3) or "").strip()

        has_desc = any("taskDescription" in paras[j] for j in range(i, min(end, i + 100)))
        # For stage 5, tasks are under processes — collect processes first
        processes = []
        if int(m.group(1)) == 5:
            proc_marks = [(j, kk) for j, kk in marks if kk == "process" and i < j < end]
            for pi, (pj, _) in enumerate(proc_marks):
                pm = PROC_HEAD.match(paras[pj])
                if not pm:
                    continue
                pend = proc_marks[pi + 1][0] if pi + 1 < len(proc_marks) else end
                pf = kv_after(
                    paras,
                    pj,
                    min(pend, pj + 50),
                    [
                        "processId",
                        "processName / processEnglish",
                        "processPurpose",
                        "processInput",
                        "processOutput",
                        "methodMechanismPosition",
                        "boundStage",
                        "entryCondition",
                        "exitCondition",
                        "automationLevel",
                    ],
                )
                pname = pf.get("processName / processEnglish", "")
                if " / " in pname:
                    pnk, pne = [x.strip() for x in pname.split(" / ", 1)]
                else:
                    pnk = pm.group(2).strip()
                    pne = (pm.group(3) or "").strip()
                ptasks = parse_task_table(paras, pj, pend, has_desc=True)
                pann = parse_annotation_block(paras, pj, min(pend, pj + 120))
                processes.append({
                    "id": pf.get("processId") or f"PROC-{int(pm.group(1)):02d}",
                    "no": int(pm.group(1)),
                    "name": pnk,
                    "nameEn": pne,
                    "purpose": pf.get("processPurpose") or pann.get("what") or "",
                    "input": pf.get("processInput") or "",
                    "output": pf.get("processOutput") or "",
                    "position": pf.get("methodMechanismPosition") or "",
                    "automation": pf.get("automationLevel") or "반자동화(Semi-automatic)",
                    "what": pann.get("what") or "",
                    "why": pann.get("why") or "",
                    "tasks": ptasks,
                })
            tasks = []
        else:
            tasks = parse_task_table(paras, i, end, has_desc=False)
            processes = []

        sann = parse_annotation_block(paras, i, min(end, i + 200))
        stages.append({
            "id": fields.get("stageId") or f"STAGE-{m.group(1)}",
            "no": int(m.group(1)),
            "name": sn,
            "nameEn": se,
            "summary": fields.get("stageSummary") or "",
            "purpose": fields.get("stagePurpose") or sann.get("what") or "",
            "input": fields.get("stageInput") or "",
            "output": fields.get("stageOutput") or "",
            "automation": fields.get("automationLevel") or "반자동화(Semi-automatic)",
            "beginnerTip": fields.get("beginnerTip") or "",
            "what": sann.get("what") or "",
            "why": sann.get("why") or "",
            "terms": sann.get("terms") or "",
            "tasks": tasks,
            "processes": processes,
        })

    # Glossary — merge from stage terms + arch
    gloss: list[dict] = []
    gloss.extend(parse_glossary_terms(arch_ann.get("terms") or ""))
    for s in stages:
        gloss.extend(parse_glossary_terms(s.get("terms") or ""))
    # dedupe
    seen_g = set()
    glossary = []
    for g in gloss:
        k = g["term"].lower()
        if k in seen_g:
            continue
        seen_g.add(k)
        glossary.append(g)

    # Purpose line
    purpose = mechanism
    if not purpose and stages:
        purpose = stages[0].get("purpose") or beginner
    if purpose and len(purpose) > 220:
        purpose = purpose[:217] + "…"

    return {
        "file": path.name,
        "methodId": method_id_raw,
        "name_ko": display if "(" in display else f"{name_ko}({name_en})" if name_en else name_ko,
        "name_hint": name_en or name_ko,
        "nameShortKo": name_ko,
        "nameShortEn": name_en,
        "family": family,
        "family_ko": FAMILY_KO.get(macro, macro),
        "macro": macro,
        "kind": kind,
        "mechanism": mechanism,
        "practiceRows": int(meta.get("practiceRows") or method_fields.get("practiceRows") or 100),
        "duplicateSequence": meta.get("duplicateSequence"),
        "duplicateTotal": meta.get("duplicateTotal") or 1,
        "beginnerIntro": beginner,
        "architecture": arch_ann,
        "phases": phases,
        "stages": stages,
        "glossary": glossary[:60],
        "purpose": purpose or f"{name_ko} — RWOS 6단계 가상 학습·워크벤치",
    }


def to_overview(doc: dict) -> dict:
    stage_views = []
    for s in doc["stages"]:
        roles = []
        if s["processes"]:
            roles = [f"{p['name']}({p['nameEn']})" if p.get("nameEn") else p["name"] for p in s["processes"][:8]]
        elif s["tasks"]:
            roles = [t["name"] for t in s["tasks"][:6]]
        else:
            roles = [s["name"]]
        rows = []
        if s["processes"]:
            for p in s["processes"]:
                rows.append([p["name"], p.get("output") or "산출물", (p.get("automation") or "")[:20]])
        else:
            for t in s["tasks"]:
                rows.append([t["name"], t.get("output") or "산출물", (t.get("automation") or "")[:20]])
        if not rows:
            rows = [[s["name"], s.get("output") or "산출물", (s.get("automation") or "")[:20]]]
        stage_views.append({
            "registryStageId": f"{doc['slug']}.s{s['no']}",
            "uiStage": s["no"],
            "title": f"{s['name']}" + (f"({s['nameEn']})" if s.get("nameEn") else ""),
            "oneLine": s.get("summary") or s.get("purpose") or s["name"],
            "stepRole": roles,
            "inFunction": s.get("input") or "선행 산출물·연구 맥락",
            "outFunction": s.get("output") or "단계 산출물",
            "why": s.get("why") or s.get("purpose") or "",
            "exampleText": s.get("what") or s.get("summary") or "",
            "table": {
                "title": f"{s['name']}에서 만드는 것",
                "columns": ["세부 항목", "나오는 것", "자동화"],
                "rows": rows[:12],
            },
            "figure": {
                "type": "flow",
                "inputs": [s.get("input") or "선행 자료"],
                "outputs": [s.get("output") or "단계 산출물"],
                "step": s["name"],
            },
            "moreExamples": [],
            "beginnerTip": s.get("beginnerTip") or "",
        })
    return {
        "stageViews": stage_views,
        "glossary": doc.get("glossary") or [],
        "purpose": doc.get("purpose") or "",
        "source": "Prompt Design Structure 6.1",
        "flow": "Phase1(Stage1–4) → Phase2(Stage5 Processes) → Phase3(Stage6)",
        "domain": doc.get("macro") or "",
        "beginnerIntro": doc.get("beginnerIntro") or "",
        "phases": doc.get("phases") or [],
        "mechanism": doc.get("mechanism") or "",
        "rwosVersion": "6.1",
        "stageCount": len(doc.get("stages") or []),
    }


def _entry(eid: str, kind: str, content: str, auto: str, procedure: list[str], behavior: str = "analysis") -> dict:
    return {
        "id": eid,
        "kind": kind,
        "seg": "1",
        "content": content,
        "auto": _auto_short(auto),
        "reason": f"{_auto_short(auto)} 수준으로 수행·검증합니다.",
        "procedure": procedure or ["절차를 수행하고 산출물을 기록합니다."],
        "behavior": behavior,
        "modes": ["ai", "rule", "user"],
        "io": "chain",
        "easyTitle": content[:40],
        "easyContent": content,
        "easyWhyNeed": "다음 단계가 검증 가능한 입력을 받도록 이 산출물이 필요합니다.",
        "procedureEasy": procedure or ["절차를 수행하고 산출물을 기록합니다."],
    }


def to_perf_registry(doc: dict) -> list[dict]:
    """GtStage-compatible workbench registry for PerfStageRunner + v61 extras."""
    stages_out = []
    for s in doc["stages"]:
        tasks_out = []
        if s["processes"]:
            for p in s["processes"]:
                items = []
                for t in p["tasks"]:
                    auto = t.get("automation") or p.get("automation") or ""
                    items.append({
                        "perfNo": f"{p['id']}-{t['no']}",
                        "label": t["name"],
                        "entries": [
                            _entry(
                                f"{p['id']}.t{t['no']}.do",
                                "수행내용",
                                t.get("description") or t["name"],
                                auto,
                                [
                                    f"입력 확인: {t.get('input') or p.get('input') or '선행 산출물'}",
                                    t.get("description") or f"{t['name']} 수행",
                                    f"산출 기록: {t.get('output') or p.get('output') or '결과'}",
                                ],
                                t.get("type") or "analysis",
                            ),
                            _entry(
                                f"{p['id']}.t{t['no']}.out",
                                "산출물",
                                t.get("output") or p.get("output") or "검증된 산출물",
                                auto,
                                ["산출물 형식·완전성 점검", "다음 작업으로 전달"],
                                "validation",
                            ),
                        ],
                    })
                if not items:
                    auto = p.get("automation") or ""
                    items.append({
                        "perfNo": f"{p['id']}-1",
                        "label": p["name"],
                        "entries": [
                            _entry(f"{p['id']}.do", "수행내용", p.get("purpose") or p["name"], auto, [p.get("purpose") or p["name"]]),
                            _entry(f"{p['id']}.out", "산출물", p.get("output") or "산출물", auto, ["결과 저장"]),
                        ],
                    })
                tasks_out.append({
                    "taskNo": p["id"],
                    "name": p["name"] + (f"({p['nameEn']})" if p.get("nameEn") else ""),
                    "nameKo": p["name"],
                    "whyTask": p.get("why") or p.get("purpose") or "",
                    "example": p.get("what") or "",
                    "items": items,
                    # v61 extras (ignored by old runner)
                    "isProcess": True,
                    "input": p.get("input") or "",
                    "output": p.get("output") or "",
                    "automation": p.get("automation") or "",
                })
        else:
            for t in s["tasks"]:
                auto = t.get("automation") or ""
                tasks_out.append({
                    "taskNo": f"{s['id']}-T{t['no']}",
                    "name": t["name"],
                    "nameKo": t["name"],
                    "whyTask": t.get("description") or "",
                    "example": "",
                    "items": [
                        {
                            "perfNo": f"{s['id']}-{t['no']}",
                            "label": t["name"],
                            "entries": [
                                _entry(
                                    f"{s['id']}.t{t['no']}.do",
                                    "수행내용",
                                    t.get("description") or t["name"],
                                    auto,
                                    [
                                        f"입력: {t.get('input') or s.get('input') or ''}",
                                        t.get("description") or t["name"],
                                        f"출력: {t.get('output') or s.get('output') or ''}",
                                    ],
                                    t.get("type") or "form",
                                ),
                                _entry(
                                    f"{s['id']}.t{t['no']}.out",
                                    "산출물",
                                    t.get("output") or "산출물",
                                    auto,
                                    ["산출물 저장·다음 단계 전달"],
                                    "validation",
                                ),
                            ],
                        }
                    ],
                    "isProcess": False,
                    "input": t.get("input") or "",
                    "output": t.get("output") or "",
                    "automation": auto,
                })
        title = s["name"] + (f"({s['nameEn']})" if s.get("nameEn") else "")
        stages_out.append({
            "stageNo": s["no"],
            "title": title,
            "fullName": f"{s['no']}단계 · {title}",
            "stageLabel": title,
            "easyIntro": s.get("summary") or s.get("what") or "",
            "whyStage": s.get("why") or s.get("purpose") or "",
            "inEasy": s.get("input") or "",
            "outEasy": s.get("output") or "",
            "tasks": tasks_out,
        })
    return stages_out


def _auto_short(a: str | None) -> str:
    if not a:
        return "반자동화"
    if "수동" in a or "Manual" in a:
        return "수동화"
    if "완전" in a or "Automatic" in a and "Semi" not in a:
        return "자동화"
    return "반자동화"


def load_manifest() -> list[dict]:
    man = json.loads((SRC / "_manifest_5.1-format_v6.1.json").read_text(encoding="utf-8"))
    return man["results"]


def main():
    manifest = load_manifest()
    by_file = {r["file"]: r for r in manifest}

    docs = []
    errors = []
    files = sorted([f for f in SRC.glob("*.docx") if not f.name.startswith("~")])
    print(f"Parsing {len(files)} docx…")
    for fi, path in enumerate(files, 1):
        meta = by_file.get(path.name, {})
        try:
            doc = parse_docx(path, meta)
            docs.append(doc)
            if fi % 20 == 0 or fi == len(files):
                print(f"  {fi}/{len(files)} ok — last={doc['nameShortKo']} stages={len(doc['stages'])}")
        except Exception as e:
            errors.append({"file": path.name, "error": str(e)})
            print(f"  FAIL {path.name}: {e}")

    # Stable slugs from English name + variant; unique catalog IDs
    used_slugs: set[str] = set()
    used_ids: set[str] = set()
    catalog_methods = []
    for idx, doc in enumerate(docs, 1):
        en = doc.get("nameShortEn") or doc.get("name_hint") or doc["methodId"]
        base = re.sub(r"[^a-zA-Z0-9]+", "-", en).strip("-").lower()
        base = re.sub(r"-+", "-", base)
        # strip trailing variant already in english
        base = re.sub(r"-\d{2}$", "", base)
        if not base:
            base = re.sub(r"_+", "-", doc["methodId"]).strip("-")
        seq = doc.get("duplicateSequence")
        total = int(doc.get("duplicateTotal") or 1)
        if total > 1:
            slug = f"{base}-{int(seq or 1):02d}"
        else:
            slug = base
        if slug in used_slugs:
            n = 2
            while f"{slug}-{n:02d}" in used_slugs:
                n += 1
            slug = f"{slug}-{n:02d}"
        used_slugs.add(slug)
        doc["slug"] = slug

        method_id = f"V61-{idx:03d}"
        # Prefer readable id when short enough & unique
        readable = "V61-" + slug.replace("_", "-").upper()
        if len(readable) <= 42 and readable not in used_ids:
            method_id = readable
        used_ids.add(method_id)
        doc["catalogId"] = method_id

        task_count = 0
        for s in doc["stages"]:
            if s["processes"]:
                task_count += sum(len(p["tasks"]) or 1 for p in s["processes"])
            else:
                task_count += len(s["tasks"])

        catalog_methods.append({
            "methodId": method_id,
            "perfSlug": slug,
            "legacyPerf": None,
            "name_ko": doc["name_ko"],
            "name_hint": doc["name_hint"],
            "family": doc["family"],
            "family_ko": doc["family_ko"],
            "macro": doc["macro"],
            "source": "Prompt Design Structure 6.1",
            "purpose": doc["purpose"],
            "stageCount": len(doc["stages"]) or 6,
            "taskCount": task_count,
            "xlsxFile": "",
            "kind": doc["kind"],
            "practiceRows": doc["practiceRows"],
            "rwos": "6.1",
            "variant": doc.get("duplicateSequence"),
            "variantTotal": doc.get("duplicateTotal") or 1,
        })

    # Write per-method bundles into methods/ (replace old)
    if METHODS_DIR.exists():
        import shutil
        shutil.rmtree(METHODS_DIR)
    METHODS_DIR.mkdir(parents=True)

    # Also wipe and rewrite public/methods
    if LEGACY_METHODS.exists():
        import shutil
        # Keep directory but remove children
        for child in LEGACY_METHODS.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    else:
        LEGACY_METHODS.mkdir(parents=True)

    for doc in docs:
        slug = doc["slug"]
        bundle_dir = LEGACY_METHODS / slug
        bundle_dir.mkdir(parents=True, exist_ok=True)
        overview = to_overview(doc)
        perf = to_perf_registry(doc)
        (bundle_dir / "overview.json").write_text(
            json.dumps(overview, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        (bundle_dir / "perf-registry.json").write_text(
            json.dumps(perf, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        (bundle_dir / "glossary.json").write_text(
            json.dumps({"terms": doc.get("glossary") or []}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        # Full structured doc for new UI (parent/child)
        (bundle_dir / "v61.json").write_text(
            json.dumps(
                {
                    "catalogId": doc["catalogId"],
                    "slug": slug,
                    "name_ko": doc["name_ko"],
                    "nameShortKo": doc["nameShortKo"],
                    "nameShortEn": doc["nameShortEn"],
                    "macro": doc["macro"],
                    "family": doc["family"],
                    "kind": doc["kind"],
                    "mechanism": doc["mechanism"],
                    "purpose": doc["purpose"],
                    "beginnerIntro": doc["beginnerIntro"],
                    "architecture": doc["architecture"],
                    "phases": doc["phases"],
                    "stages": doc["stages"],
                    "glossary": doc["glossary"],
                    "practiceRows": doc["practiceRows"],
                    "variant": doc.get("duplicateSequence"),
                    "variantTotal": doc.get("duplicateTotal") or 1,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    catalog = {
        "version": 61,
        "macroOrder": MACRO_ORDER,
        "method_count": len(catalog_methods),
        "standard": "Prompt Design Structure 6.1",
        "stageModel": "RWOS-6",
        "methods": catalog_methods,
    }
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    perf_index = {
        m["methodId"]: {"perfSlug": m["perfSlug"], "legacyPerf": None}
        for m in catalog_methods
    }
    PERF_INDEX_PATH.write_text(json.dumps(perf_index, ensure_ascii=False, indent=2), encoding="utf-8")

    # Summary stats
    macro_counts = defaultdict(int)
    for m in catalog_methods:
        macro_counts[m["macro"]] += 1
    stage_lens = [len(d["stages"]) for d in docs]
    print("\n=== DONE ===")
    print(f"methods: {len(catalog_methods)}")
    print(f"errors: {len(errors)}")
    print(f"stage counts: min={min(stage_lens) if stage_lens else 0} max={max(stage_lens) if stage_lens else 0} avg={sum(stage_lens)/len(stage_lens) if stage_lens else 0:.1f}")
    print("macro:", dict(macro_counts))
    if errors:
        (OUT_PUBLIC / "_v61_parse_errors.json").write_text(
            json.dumps(errors, ensure_ascii=False, indent=2), encoding="utf-8"
        )


if __name__ == "__main__":
    main()
