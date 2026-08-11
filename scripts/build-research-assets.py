# -*- coding: utf-8 -*-
"""Build public JSON assets from 연구방법_선정_체크리스트.docx and 통계분석 xlsx."""
import json, re, zipfile, os
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
DOCX = os.path.join(ROOT, "연구방법_선정_체크리스트.docx")
XLSX = os.path.join(ROOT, "통계분석_기법별_예시자동화_상세가이드.xlsx")
if not os.path.isfile(XLSX):
    XLSX = os.path.join(os.path.dirname(ROOT), "통계분석_기법별_예시자동화_상세가이드.xlsx")

# --- Checklist: parse docx paragraphs into sections ---
with zipfile.ZipFile(DOCX) as z:
    xml = z.read("word/document.xml").decode("utf-8")
text = re.sub(r"</w:p>", "\n", xml)
text = re.sub(r"<[^>]+>", "", text)
text = text.replace("&apos;", "'").replace("&amp;", "&").replace("&quot;", '"')
lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

sections = []
current = None
item_buf = None

def flush_item():
    global item_buf
    if not current or not item_buf:
        item_buf = None
        return
    label = item_buf.get("label", "").strip()
    if not label or label.startswith("체크") or label == "해당 시 시사점":
        item_buf = None
        return
    iid = f"s{current['step']}-{len(current['items']) + 1}"
    current["items"].append({
        "id": iid,
        "label": label,
        "implication": item_buf.get("implication", ""),
        "source": item_buf.get("source", ""),
        "recommendTags": item_buf.get("tags", []),
    })
    item_buf = None

for ln in lines:
    m = re.match(r"^(\d+)단계\.\s*(.+)$", ln)
    if m:
        flush_item()
        if current:
            sections.append(current)
        current = {"step": int(m.group(1)), "id": f"step-{m.group(1)}", "title": m.group(2).strip(), "items": []}
        continue
    if ln.startswith("사용법:") or ln.startswith("근거 문헌") or ln.startswith("연구방법("):
        continue
    if ln == "체크" or ln.startswith("참고:"):
        flush_item()
        continue
    if not current:
        continue
    if ln.startswith("☐"):
        flush_item()
        item_buf = {"label": ln.replace("☐", "").strip(), "tags": []}
        continue
    if item_buf is not None:
        if ln.startswith("→"):
            item_buf["implication"] = ln[1:].strip()
            if "양적" in ln:
                item_buf["tags"].append("quantitative")
            if "질적" in ln:
                item_buf["tags"].append("qualitative")
            if "혼합" in ln:
                item_buf["tags"].append("mixed")
            if "인과" in ln or "실험" in ln:
                item_buf["tags"].append("causal")
            if "문헌" in ln or "종합" in ln or "리뷰" in ln:
                item_buf["tags"].append("literature")
        elif ln.startswith("[") or "Ch." in ln or "p." in ln:
            item_buf["source"] = (item_buf.get("source", "") + " " + ln).strip()
        elif not item_buf.get("implication") and ("적합" in ln or "검토" in ln or "→" not in ln):
            if len(ln) < 120:
                item_buf.setdefault("extra", ln)

flush_item()
if current:
    sections.append(current)

checklist = {
    "version": "1.0",
    "source": "연구방법_선정_체크리스트.docx",
    "sections": sections,
}
with open(os.path.join(PUBLIC, "research-method-checklist.json"), "w", encoding="utf-8") as f:
    json.dump(checklist, f, ensure_ascii=False, indent=2)
print("checklist sections:", len(sections), "items:", sum(len(s["items"]) for s in sections))

# --- SS stats guide from xlsx ---
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)

def sheet_rows(name):
    ws = wb[name]
    rows = []
    for row in ws.iter_rows(values_only=True):
        if any(c is not None and str(c).strip() for c in row):
            rows.append(["" if c is None else str(c).strip() for c in row])
    return rows

overview = {}
for row in sheet_rows("개요")[1:]:
    if len(row) >= 2:
        overview[row[0]] = row[1]

def parse_descriptive(rows):
    hdr = rows[0]
    out = []
    for row in rows[1:]:
        if len(row) < len(hdr):
            row = row + [""] * (len(hdr) - len(row))
        d = dict(zip(hdr, row))
        out.append({
            "category": d.get("중분류", ""),
            "id": re.sub(r"[^a-zA-Z0-9가-힣]+", "-", d.get("세부 항목(지표/기법)", ""))[:60].strip("-"),
            "name": d.get("세부 항목(지표/기법)", ""),
            "example": d.get("사용 예시(실제 연구·현장)", ""),
            "analogy": d.get("쉬운 비유 예시", ""),
            "etymology": d.get("명칭의 유래·의미", ""),
            "prep": d.get("분석 전 준비사항", ""),
            "dataTask": d.get("필요 데이터·테스크", ""),
            "dataWhy": d.get("필요한 이유", ""),
            "automationLevel": d.get("자동화 수준", ""),
            "automationProcess": d.get("자동화 가능 프로세스와 방법", ""),
            "sampleTemplate": d.get("필요 데이터·테스크", ""),
        })
    return out

def parse_diagnostic(rows):
    hdr = rows[0]
    out = []
    for row in rows[1:]:
        if len(row) < len(hdr):
            row = row + [""] * (len(hdr) - len(row))
        d = dict(zip(hdr, row))
        out.append({
            "category": d.get("중분류", ""),
            "id": re.sub(r"[^a-zA-Z0-9가-힣]+", "-", d.get("세부 항목(지표/기법)", ""))[:60].strip("-"),
            "name": d.get("세부 항목(지표/기법)", ""),
            "example": d.get("사용 예시(실제 연구·현장)", ""),
            "analogy": d.get("쉬운 비유 예시", ""),
            "etymology": d.get("명칭의 유래·의미", ""),
            "prep": d.get("분석 전 준비사항", ""),
            "dataTask": d.get("필요 데이터·테스크", ""),
            "dataWhy": d.get("필요한 이유", ""),
            "automationLevel": d.get("자동화 수준", ""),
            "automationProcess": d.get("자동화 가능 프로세스와 방법", ""),
        })
    return out

def parse_inferential(rows):
    hdr = rows[0]
    out = []
    for row in rows[1:]:
        if len(row) < len(hdr):
            row = row + [""] * (len(hdr) - len(row))
        d = dict(zip(hdr, row))
        out.append({
            "id": re.sub(r"[^a-zA-Z0-9가-힣]+", "-", d.get("분석 기법", ""))[:40].strip("-"),
            "name": d.get("분석 기법", ""),
            "purpose": d.get("목적/용도", ""),
            "example": d.get("사용 예시(실제 연구·현장)", ""),
            "analogy": d.get("쉬운 비유 예시", ""),
            "etymology": d.get("명칭의 유래·의미", ""),
            "prep": d.get("분석 전 준비사항", ""),
            "dataTask": d.get("필요 데이터·테스크", ""),
            "dataWhy": d.get("필요한 이유", ""),
            "keyStats": d.get("주요 통계량", ""),
            "postHoc": d.get("사후·부가 분석", ""),
            "automationLevel": d.get("자동화 수준", ""),
            "automationProcess": d.get("자동화 가능 프로세스와 방법", ""),
        })
    return out

guide = {
    "version": "1.0",
    "source": "통계분석_기법별_예시자동화_상세가이드.xlsx",
    "overview": overview,
    "phases": [
        {"id": "descriptive", "title": "기초통계 (Descriptive Statistics)", "techniques": parse_descriptive(sheet_rows("기초통계_Descriptive"))},
        {"id": "diagnostic", "title": "가정검토 (Diagnostic Statistics)", "techniques": parse_diagnostic(sheet_rows("가정검토_Diagnostic"))},
        {"id": "inferential", "title": "추론통계 (Inferential Statistics)", "techniques": parse_inferential(sheet_rows("추론통계_Inferential"))},
    ],
}
with open(os.path.join(PUBLIC, "ss-stats-procedural-guide.json"), "w", encoding="utf-8") as f:
    json.dump(guide, f, ensure_ascii=False, indent=2)
print("ss-stats techniques:", [len(p["techniques"]) for p in guide["phases"]])
