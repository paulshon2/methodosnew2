# -*- coding: utf-8 -*-
"""
Bind 프롬프트6.1기준_추가-7 DOCX → methods/{slug}/v61.json (workedExample) + samples.json
Follows PROMPT_PLUS7_WORKBENCH_BIND.txt
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

DOCX_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\새 폴더 (2)\프롬프트6.1기준_추가-7")
SAAS_ROOT = Path(__file__).resolve().parents[1]
METHODS_DIR = SAAS_ROOT / "public" / "methods"
CATALOG_PATH = SAAS_ROOT / "public" / "method-catalog.json"
REPORT_PATH = SAAS_ROOT / "public" / "_plus7_bind_report.json"

INSERT_RE = re.compile(r"^【실연구\s*예시\s*삽입】(.*)$")
TASK_TAIL_RE = re.compile(r"(?:^|\s·\s*)Task:\s*(.+)$")
PROC_HEAD_RE = re.compile(r"^(.+?)\s*·\s*Task:")
TOPIC_RE = re.compile(r"^연구\s*주제\s*[:：]\s*(.+)$")
SEC_2_RE = re.compile(r"^2\)\s*산출물\s*[「\"](.+?)[」\"]")
SEC_21_RE = re.compile(r"^2-1\)\s*실제\s*작업표\s*[「\"](.+?)[」\"]")
SAMPLE_PACK_RE = re.compile(r"^3-4\.\s*(.+)$")
SAMPLE_SEC_RE = re.compile(r"^(3-4(?:-\d+[a-z]?)*)\.\s*(.+)$")
RUNTIME_STOP_RE = re.compile(r"^4\.\s*실행\s*계층")
VARIANT_STEM_RE = re.compile(r"^(.*)-(\d{2})$")


def iter_blocks(doc: Document):
    body = doc.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, doc)
        elif child.tag == qn("w:tbl"):
            yield Table(child, doc)


def cell_text(cell) -> str:
    return (cell.text or "").replace("\r", "").strip()


def table_matrix(tbl: Table) -> list[list[str]]:
    rows: list[list[str]] = []
    for row in tbl.rows:
        rows.append([cell_text(c) for c in row.cells])
    return rows


def bullets_after(paras: list[str], start: int, stop_prefixes: tuple[str, ...]) -> tuple[list[str], int]:
    out: list[str] = []
    i = start
    while i < len(paras):
        t = paras[i]
        if any(t.startswith(p) for p in stop_prefixes):
            break
        if t.startswith("·") or t.startswith("-") or t.startswith("•"):
            out.append(t.lstrip("·-• ").strip())
        elif t and not t.startswith("【") and not re.match(r"^\d", t) and not t.startswith("연구 주제"):
            # keep non-empty narrative lines under section if not a new numbered section
            if not t.startswith("아래") and not t.startswith("표 머리"):
                out.append(t)
        i += 1
    return out, i


def parse_insert_blocks(blocks) -> list[dict]:
    """Split document body into 【실연구 예시 삽입】 segments with following tables/paras."""
    items: list[dict] = []
    i = 0
    n = len(blocks)
    while i < n:
        b = blocks[i]
        if not isinstance(b, Paragraph):
            i += 1
            continue
        text = (b.text or "").strip()
        m = INSERT_RE.match(text)
        if not m:
            i += 1
            continue
        head = m.group(1).strip()
        tm = TASK_TAIL_RE.search(head)
        task_name = tm.group(1).strip() if tm else head
        pm = PROC_HEAD_RE.match(head)
        process_name = pm.group(1).strip() if pm else None

        topic = ""
        steps: list[str] = []
        summary_title = ""
        summary_table = None
        sheet_title = ""
        work_sheet = None
        notes: list[str] = []
        explain: list[str] = []
        ai_fields: list[dict] = []
        ai_intro: list[str] = []

        mode = "after_header"
        i += 1
        while i < n:
            bb = blocks[i]
            if isinstance(bb, Paragraph):
                t = (bb.text or "").strip()
                if INSERT_RE.match(t) or SAMPLE_PACK_RE.match(t) or RUNTIME_STOP_RE.match(t):
                    break
                if t.startswith("—") and len(t) <= 3:
                    i += 1
                    break
                tm2 = TOPIC_RE.match(t)
                if tm2:
                    topic = tm2.group(1).strip()
                    i += 1
                    continue
                if t.startswith("1) 이렇게 작업합니다"):
                    mode = "steps"
                    i += 1
                    continue
                if t.startswith("2) 산출물"):
                    mode = "summary_wait_table"
                    sm = SEC_2_RE.search(t)
                    summary_title = sm.group(1) if sm else t
                    i += 1
                    continue
                if t.startswith("2-1)"):
                    mode = "sheet_wait_table"
                    sm = SEC_21_RE.search(t)
                    sheet_title = sm.group(1) if sm else t
                    i += 1
                    continue
                if t.startswith("2-2)"):
                    mode = "notes"
                    i += 1
                    continue
                if t.startswith("3) 예시표"):
                    mode = "explain"
                    i += 1
                    continue
                if t.startswith("4) 실제작업표의 AI작성안"):
                    mode = "ai_wait_table"
                    i += 1
                    continue
                if mode == "steps" and (t.startswith("·") or t.startswith("-") or t.startswith("•")):
                    steps.append(t.lstrip("·-• ").strip())
                elif mode == "notes" and t:
                    if t.startswith("·") or t.startswith("-") or t.startswith("•"):
                        notes.append(t.lstrip("·-• ").strip())
                    elif not t.startswith("표 머리") and not t.startswith("아래"):
                        notes.append(t)
                elif mode == "explain" and t:
                    if t.startswith("·") or t.startswith("-") or t.startswith("•"):
                        explain.append(t.lstrip("·-• ").strip())
                    else:
                        explain.append(t)
                elif mode == "ai_wait_table" and t:
                    ai_intro.append(t)
                elif mode == "sheet_wait_table" and t.startswith("아래"):
                    pass
                i += 1
                continue

            # table
            mat = table_matrix(bb)
            if mode == "summary_wait_table" and mat:
                headers = mat[0]
                rows = mat[1:]
                summary_table = {
                    "title": f"산출물 「{summary_title}」 예시표(요약 골격)" if summary_title else "산출물 예시표(요약 골격)",
                    "headers": headers,
                    "rows": rows,
                }
                mode = "after_summary"
            elif mode == "sheet_wait_table" and mat:
                headers = mat[0]
                rows = mat[1:]
                work_sheet = {
                    "title": f"실제 작업표 「{sheet_title}」" if sheet_title else "실제 작업표",
                    "headers": headers,
                    "rows": rows,
                    "defaultCollapsed": True,
                }
                mode = "after_sheet"
            elif mode == "ai_wait_table" and mat:
                # expect # | 기입 항목 | guide | 연구자 기입
                headers = mat[0]
                # find columns
                item_i = guide_i = fill_i = None
                for idx, h in enumerate(headers):
                    hl = h.replace(" ", "")
                    if "기입항목" in hl or h == "기입 항목":
                        item_i = idx
                    elif "뜻" in h or "가이드" in h or "설명" in h:
                        guide_i = idx
                    elif "연구자" in h:
                        fill_i = idx
                if item_i is None and len(headers) >= 2:
                    item_i = 1 if headers[0] in ("#", "번호", "No", "no") else 0
                if guide_i is None and len(headers) >= 3:
                    guide_i = item_i + 1 if item_i is not None else 1
                if fill_i is None and len(headers) >= 4:
                    fill_i = len(headers) - 1
                for row in mat[1:]:
                    item = row[item_i] if item_i is not None and item_i < len(row) else ""
                    guide = row[guide_i] if guide_i is not None and guide_i < len(row) else ""
                    fill = row[fill_i] if fill_i is not None and fill_i < len(row) else ""
                    if not item.strip():
                        continue
                    ai_fields.append(
                        {
                            "item": item.strip(),
                            "guide": guide.strip(),
                            "researcherFill": fill.strip(),
                        }
                    )
                mode = "after_ai"
            i += 1

        items.append(
            {
                "taskName": task_name,
                "processName": process_name,
                "workedExample": {
                    "topic": topic,
                    "steps": steps,
                    "summaryTable": summary_table,
                    "workSheet": work_sheet,
                    "workSheetNotes": notes,
                    "summaryExplain": explain,
                    "aiPlan": {
                        "title": "실제작업표의 AI작성안",
                        "intro": ai_intro,
                        "fields": ai_fields,
                    },
                },
            }
        )
    return items


def classify_sample_kind(sec_id: str, title: str) -> str:
    t = f"{sec_id} {title}"
    if sec_id.startswith("3-4-1") or "도구" in title:
        return "tool"
    if sec_id.startswith("3-4-2") or "결과표" in title:
        return "resultTable"
    if sec_id.startswith("3-4-3") or "메타" in title:
        return "meta"
    if sec_id.startswith("3-4-4") or "Process별" in title:
        return "processScale"
    if "미니" in title or sec_id.startswith("3-4-5"):
        return "mini5"
    if "전체" in title or sec_id.startswith("3-4-6"):
        return "full100"
    if "Figure" in title or "Chart" in title or sec_id.startswith("3-4-7"):
        return "figureSpec"
    return "other"


def parse_sample_pack(blocks) -> dict | None:
    start = None
    for i, b in enumerate(blocks):
        if isinstance(b, Paragraph):
            t = (b.text or "").strip()
            if SAMPLE_PACK_RE.match(t):
                start = i
                break
    if start is None:
        return None

    title = (blocks[start].text or "").strip()
    sections: list[dict] = []
    practice_rows = None
    guide_bits: list[str] = []
    process_bindings: list[dict] = []

    i = start + 1
    cur: dict | None = None
    n = len(blocks)
    while i < n:
        b = blocks[i]
        if isinstance(b, Paragraph):
            t = (b.text or "").strip()
            if RUNTIME_STOP_RE.match(t) or t.startswith("5. 거버넌스"):
                break
            sm = SAMPLE_SEC_RE.match(t)
            if sm and sm.group(1).startswith("3-4"):
                if cur:
                    sections.append(cur)
                sec_id, sec_title = sm.group(1), sm.group(2).strip()
                cur = {
                    "id": sec_id,
                    "title": f"{sec_id}. {sec_title}",
                    "kind": classify_sample_kind(sec_id, sec_title),
                    "accordionDefault": "collapsed",
                    "tables": [],
                    "prose": [],
                }
                i += 1
                continue
            if cur is None:
                if t and not t.startswith("■"):
                    guide_bits.append(t)
            else:
                if t and not t.startswith("■"):
                    cur["prose"].append(t)
            i += 1
            continue

        mat = table_matrix(b)
        if cur is None:
            if mat:
                for r in mat:
                    if len(r) >= 2:
                        key = (r[0] or "").lower()
                        if "practicerows" in key.replace(" ", "") or "연습" in (r[0] or "") or "행" in (r[0] or ""):
                            nums = re.findall(r"\d+", r[1] or "")
                            if nums:
                                practice_rows = int(nums[0])
                overview = next((s for s in sections if s.get("id") == "3-4-0"), None)
                if overview is None:
                    overview = {
                        "id": "3-4-0",
                        "title": "Domain Sample Pack 개요",
                        "kind": "other",
                        "accordionDefault": "collapsed",
                        "tables": [],
                        "prose": [],
                    }
                    sections.insert(0, overview)
                overview["tables"].append({"headers": mat[0], "rows": mat[1:], "caption": title})
            i += 1
            continue

        if mat:
            cur.setdefault("tables", []).append({"headers": mat[0], "rows": mat[1:]})
            if cur.get("kind") == "processScale" and mat and len(mat[0]) >= 3:
                # build processBindings from this table
                headers = [h.strip() for h in mat[0]]
                def col(*names):
                    for name in names:
                        for idx, h in enumerate(headers):
                            if name.lower() in h.lower() or name in h:
                                return idx
                    return None

                i_proc = col("processId", "Process", "절차ID")
                i_name = col("절차", "processName", "프로세스")
                i_ex = col("적용", "예시")
                i_scale = col("규모", "샘플")
                i_fmt = col("포맷", "format")
                for row in mat[1:]:
                    pname = row[i_name] if i_name is not None and i_name < len(row) else ""
                    pid = row[i_proc] if i_proc is not None and i_proc < len(row) else ""
                    if not pname and not pid:
                        continue
                    process_bindings.append(
                        {
                            "processNo": None,
                            "processIdHint": pid,
                            "processName": pname,
                            "scaleNote": row[i_scale] if i_scale is not None and i_scale < len(row) else "",
                            "formatNote": row[i_fmt] if i_fmt is not None and i_fmt < len(row) else "",
                            "exampleNote": row[i_ex] if i_ex is not None and i_ex < len(row) else "",
                            "interstitialDeliverables": [],
                        }
                    )
        i += 1

    if cur:
        sections.append(cur)

    # attach interstitial from mini5 / figureSpec sections into bindings in order
    mini_secs = [s for s in sections if s.get("kind") in ("mini5", "figureSpec", "full100")]
    for bi, binding in enumerate(process_bindings):
        extras = []
        if mini_secs:
            s = mini_secs[bi % len(mini_secs)]
            extras.append(
                {
                    "label": s["title"],
                    "table": (s.get("tables") or [None])[0],
                    "prose": s.get("prose") or [],
                }
            )
        binding["interstitialDeliverables"] = extras

    # practiceRows from overview table deeper scan
    if practice_rows is None:
        for s in sections:
            for tbl in s.get("tables") or []:
                for r in tbl.get("rows") or []:
                    if not r:
                        continue
                    blob = " ".join(r)
                    if "practiceRows" in blob or "연습 규모" in blob or "분석단위" in blob:
                        nums = re.findall(r"\d+", blob)
                        if nums:
                            practice_rows = int(nums[0])
                            break

    return {
        "title": title,
        "practiceRows": practice_rows,
        "guide": "\n".join(guide_bits).strip() or None,
        "sections": sections,
        "processBindings": process_bindings,
    }


def normalize_task_key(name: str) -> str:
    s = re.sub(r"\s+", "", name)
    s = s.replace("·", "").replace("(", "").replace(")", "")
    return s.lower()


def match_task(v61: dict, task_name: str, process_name: str | None):
    nk = normalize_task_key(task_name)
    # Stage 5 with process
    if process_name:
        pnk = normalize_task_key(process_name)
        for stage in v61.get("stages") or []:
            for proc in stage.get("processes") or []:
                pn = normalize_task_key(proc.get("name") or "")
                pen = normalize_task_key(proc.get("nameEn") or "")
                full = normalize_task_key(f"{proc.get('name','')}({proc.get('nameEn','')})")
                if pnk in (pn, pen, full) or pn in pnk or pnk in pn:
                    for t in proc.get("tasks") or []:
                        if normalize_task_key(t.get("name") or "") == nk:
                            return stage, proc, t
                    # fuzzy: task name contains
                    for t in proc.get("tasks") or []:
                        tn = normalize_task_key(t.get("name") or "")
                        if nk in tn or tn in nk:
                            return stage, proc, t
    # direct stage tasks
    for stage in v61.get("stages") or []:
        for t in stage.get("tasks") or []:
            if normalize_task_key(t.get("name") or "") == nk:
                return stage, None, t
        for proc in stage.get("processes") or []:
            for t in proc.get("tasks") or []:
                if normalize_task_key(t.get("name") or "") == nk:
                    return stage, proc, t
    return None, None, None


def bind_process_numbers(sample: dict, v61: dict) -> None:
    stage5 = next((s for s in v61.get("stages") or [] if s.get("no") == 5), None)
    if not stage5:
        return
    procs = stage5.get("processes") or []
    for b in sample.get("processBindings") or []:
        name = b.get("processName") or ""
        nk = normalize_task_key(name)
        for p in procs:
            pn = normalize_task_key(p.get("name") or "")
            pen = normalize_task_key(p.get("nameEn") or "")
            full = normalize_task_key(f"{p.get('name','')}({p.get('nameEn','')})")
            if nk and (nk == pn or nk == pen or nk == full or pn in nk or nk in pn):
                b["processNo"] = p.get("no")
                b["boundProcessId"] = p.get("id")
                break
        # also mark section boundProcessNo for processScale rows later
    for s in sample.get("sections") or []:
        if s.get("kind") == "processScale":
            s["boundProcessNo"] = None


def map_docx_to_entries(catalog: dict) -> dict[str, dict]:
    by_name: dict[str, list] = {}
    for m in catalog["methods"]:
        by_name.setdefault(m["name_ko"], []).append(m)
    mapping: dict[str, dict] = {}
    for docx in sorted(DOCX_DIR.glob("*.docx")):
        if docx.name.startswith("~"):
            continue
        stem = docx.stem
        vm = VARIANT_STEM_RE.match(stem)
        if vm:
            base, var = vm.group(1), int(vm.group(2))
            cands = [x for x in by_name.get(base, []) if x.get("variant") == var]
            if len(cands) == 1:
                mapping[str(docx)] = cands[0]
                continue
        cands = by_name.get(stem, [])
        if len(cands) == 1:
            mapping[str(docx)] = cands[0]
            continue
        raise SystemExit(f"Cannot map DOCX to catalog: {docx.name}")
    return mapping


def bind_one(docx_path: Path, entry: dict) -> dict:
    slug = entry["perfSlug"]
    v61_path = METHODS_DIR / slug / "v61.json"
    if not v61_path.exists():
        return {"slug": slug, "docx": docx_path.name, "ok": False, "error": "missing v61.json"}

    v61 = json.loads(v61_path.read_text(encoding="utf-8"))
    doc = Document(str(docx_path))
    blocks = list(iter_blocks(doc))
    inserts = parse_insert_blocks(blocks)
    sample = parse_sample_pack(blocks)

    matched = 0
    missing: list[str] = []
    sheet_fail: list[str] = []
    ai_mismatch: list[str] = []

    for ins in inserts:
        stage, proc, task = match_task(v61, ins["taskName"], ins.get("processName"))
        if not task:
            missing.append(ins["taskName"])
            continue
        we = ins["workedExample"]
        ws = we.get("workSheet")
        if not ws or len(ws.get("rows") or []) < 50:
            sheet_fail.append(ins["taskName"])
        # H4: AI fields should include worksheet headers
        headers = (ws or {}).get("headers") or []
        fields = (we.get("aiPlan") or {}).get("fields") or []
        field_items = [f.get("item") for f in fields]
        # allow common extras
        extras_ok = {"연구 주제 한 줄(공통)", "AI요청문(열 고정)", "연구 주제 한 줄", "AI요청문"}
        header_set = set(headers)
        for h in headers:
            if h not in field_items:
                # soft: sometimes spacing differs
                if not any(normalize_task_key(h) == normalize_task_key(fi or "") for fi in field_items):
                    ai_mismatch.append(f"{ins['taskName']}:{h}")
                    break
        task["workedExample"] = we
        matched += 1

    if sample:
        bind_process_numbers(sample, v61)
        samples_path = METHODS_DIR / slug / "samples.json"
        samples_path.write_text(
            json.dumps(sample, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    v61_path.write_text(json.dumps(v61, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    total_tasks = 0
    with_we = 0
    for stage in v61.get("stages") or []:
        for t in stage.get("tasks") or []:
            total_tasks += 1
            if t.get("workedExample"):
                with_we += 1
        for proc in stage.get("processes") or []:
            for t in proc.get("tasks") or []:
                total_tasks += 1
                if t.get("workedExample"):
                    with_we += 1

    return {
        "slug": slug,
        "docx": docx_path.name,
        "ok": len(missing) == 0 and len(sheet_fail) == 0 and with_we == total_tasks,
        "inserts": len(inserts),
        "matched": matched,
        "totalTasks": total_tasks,
        "withWorkedExample": with_we,
        "missingTasks": missing,
        "sheetLt50": sheet_fail,
        "aiHeaderMismatchSample": ai_mismatch[:5],
        "sampleSections": len((sample or {}).get("sections") or []) if sample else 0,
        "processBindings": len((sample or {}).get("processBindings") or []) if sample else 0,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="perfSlug filter")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    mapping = map_docx_to_entries(catalog)
    results = []
    n = 0
    for docx_s, entry in mapping.items():
        if args.only and entry["perfSlug"] not in args.only:
            continue
        n += 1
        if args.limit and n > args.limit:
            break
        docx_path = Path(docx_s)
        print(f"[{n}/{len(mapping)}] {entry['perfSlug']} ← {docx_path.name}", flush=True)
        try:
            results.append(bind_one(docx_path, entry))
        except Exception as e:
            results.append(
                {"slug": entry["perfSlug"], "docx": docx_path.name, "ok": False, "error": str(e)}
            )

    ok_n = sum(1 for r in results if r.get("ok"))
    report = {
        "source": str(DOCX_DIR),
        "methodCount": len(results),
        "okCount": ok_n,
        "failCount": len(results) - ok_n,
        "results": results,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"DONE ok={ok_n}/{len(results)} report={REPORT_PATH}", flush=True)
    return 0 if ok_n == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
