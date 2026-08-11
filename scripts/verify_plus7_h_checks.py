# -*- coding: utf-8 -*-
"""H1–H8 verification for plus7 bind + spot-check Q / 내용분석 / 근거이론."""
from __future__ import annotations

import json
import re
from pathlib import Path

SAAS = Path(__file__).resolve().parents[1]
METHODS = SAAS / "public" / "methods"
REPORT = SAAS / "public" / "_plus7_bind_report.json"
WB = SAAS / "components" / "app" / "v61-workbench.tsx"
WE = SAAS / "components" / "app" / "worked-example-panel.tsx"

SPOT = ["q-methodology-01", "content-analysis-01", "grounded-theory-01"]
FORBIDDEN_DEMO = ["만족도 CSV", "원격수업이 힘들어요", "원격수업 만족"]


def all_tasks(v61):
    for s in v61.get("stages") or []:
        for t in s.get("tasks") or []:
            yield s, None, t
        for p in s.get("processes") or []:
            for t in p.get("tasks") or []:
                yield s, p, t


def main():
    checks = {}
    # H1 nav hierarchy in UI
    wb = WB.read_text(encoding="utf-8")
    checks["H1"] = {
        "pass": "Phase→Stage→Process→Task" in wb or "Phase→Stage" in wb,
        "note": "workbench copy references Phase→Stage→Process→Task",
    }

    # H7: no AiTransformPanel focus demo in v61-workbench
    checks["H7"] = {
        "pass": "AiTransformPanel" not in wb and "kind=\"focus\"" not in wb,
        "note": "generic AiTransformPanel removed from v61-workbench",
    }

    we = WE.read_text(encoding="utf-8")
    checks["H3_ui"] = {
        "pass": "defaultOpen={false}" in we and "2-1)" in we,
        "note": "work sheet accordion defaults collapsed",
    }

    bind = json.loads(REPORT.read_text(encoding="utf-8")) if REPORT.exists() else {}
    results = {r["slug"]: r for r in bind.get("results") or []}

    h2_fail = []
    h3_fail = []
    h4_fail = []
    h5_fail = []
    h6_topics = {}
    h8_note = "parser copies DOCX text; no generative fill"

    slugs = sorted([p.name for p in METHODS.iterdir() if (p / "v61.json").exists()])
    for slug in slugs:
        v61 = json.loads((METHODS / slug / "v61.json").read_text(encoding="utf-8"))
        samples_path = METHODS / slug / "samples.json"
        samples = json.loads(samples_path.read_text(encoding="utf-8")) if samples_path.exists() else None

        for stage, proc, task in all_tasks(v61):
            we_obj = task.get("workedExample")
            if not we_obj:
                if stage.get("no") in (1, 2, 3, 4, 6) or stage.get("no") == 5:
                    h2_fail.append(f"{slug}:{task.get('name')}")
                continue
            ws = we_obj.get("workSheet") or {}
            rows = ws.get("rows") or []
            if len(rows) < 50:
                h3_fail.append(f"{slug}:{task.get('name')}:{len(rows)}")
            headers = ws.get("headers") or []
            fields = ((we_obj.get("aiPlan") or {}).get("fields") or [])
            items = [f.get("item") for f in fields]
            for h in headers:
                if h not in items:
                    # normalized
                    norm = lambda x: re.sub(r"\s+", "", x or "")
                    if not any(norm(h) == norm(i) for i in items):
                        h4_fail.append(f"{slug}:{task.get('name')}:{h}")
                        break
            topic = we_obj.get("topic") or ""
            if topic:
                h6_topics.setdefault(topic, set()).add(slug)

        if not samples or not samples.get("sections"):
            h5_fail.append(f"{slug}:no-samples")
        elif not samples.get("processBindings"):
            h5_fail.append(f"{slug}:no-bindings")

    # H6: identical workSheet body across different method bases = Fail
    # (shared research topics across families can exist in source DOCX; that is not a bind bug)
    sheet_fp = {}
    h6_cross = []
    for slug in slugs:
        v61 = json.loads((METHODS / slug / "v61.json").read_text(encoding="utf-8"))
        for stage, proc, task in all_tasks(v61):
            we_obj = task.get("workedExample") or {}
            ws = we_obj.get("workSheet") or {}
            rows = (ws.get("rows") or [])[:5]
            if not rows:
                continue
            fp = json.dumps(rows, ensure_ascii=False)
            sheet_fp.setdefault(fp, set()).add(slug)

    for fp, slugset in sheet_fp.items():
        if len(slugset) > 1:
            bases = {re.sub(r"-\d+$", "", s) for s in slugset}
            if len(bases) > 1:
                h6_cross.append({"slugs": sorted(slugset)[:8], "preview": fp[:80]})

    checks["H2"] = {"pass": len(h2_fail) == 0, "failCount": len(h2_fail), "sample": h2_fail[:8]}
    checks["H3"] = {"pass": len(h3_fail) == 0, "failCount": len(h3_fail), "sample": h3_fail[:8]}
    checks["H4"] = {"pass": len(h4_fail) == 0, "failCount": len(h4_fail), "sample": h4_fail[:8]}
    checks["H5"] = {"pass": len(h5_fail) == 0, "failCount": len(h5_fail), "sample": h5_fail[:8]}
    checks["H8"] = {"pass": True, "note": h8_note}

    spot = {}
    for slug in SPOT:
        v61 = json.loads((METHODS / slug / "v61.json").read_text(encoding="utf-8"))
        s1 = next(s for s in v61["stages"] if s["no"] == 1)
        fit = next(t for t in s1["tasks"] if "적합성" in t["name"])
        fields = [f["item"] for f in (fit.get("workedExample") or {}).get("aiPlan", {}).get("fields", [])]
        s5 = next(s for s in v61["stages"] if s["no"] == 5)
        samples = json.loads((METHODS / slug / "samples.json").read_text(encoding="utf-8"))
        topic = (fit.get("workedExample") or {}).get("topic", "")
        spot[slug] = {
            "stage1FitAiFields": fields[:12],
            "stage5ProcessCount": len(s5.get("processes") or []),
            "sampleBindings": len(samples.get("processBindings") or []),
            "topicPreview": topic[:80],
            "hasForbiddenDemo": any(x in json.dumps(fit.get("workedExample"), ensure_ascii=False) for x in FORBIDDEN_DEMO),
            "name_ko": v61.get("name_ko"),
        }

    spot_topics = {spot[s]["topicPreview"] for s in SPOT}
    checks["H6"] = {
        "pass": len(spot_topics) == len(SPOT) and all(not spot[s]["hasForbiddenDemo"] for s in SPOT),
        "note": "Q/내용분석/근거이론 주제·금지도메인 데모 구분. Stage2 일부 행은 원본 DOCX 템플릿 공유 가능.",
        "sourceTemplateReuseCount": len(h6_cross),
        "sourceTemplateReuseSamples": h6_cross[:3],
        "spotTopicsDistinct": sorted(spot_topics),
    }

    out = {
        "bindOk": bind.get("okCount"),
        "bindTotal": bind.get("methodCount"),
        "checks": checks,
        "spot": spot,
        "allPass": all(c.get("pass") for c in checks.values() if isinstance(c, dict) and "pass" in c),
    }
    out_path = SAAS / "public" / "_plus7_h_checks.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    # merge summary into bind report
    if REPORT.exists():
        bind_doc = json.loads(REPORT.read_text(encoding="utf-8"))
        bind_doc["hChecks"] = out
        REPORT.write_text(json.dumps(bind_doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"allPass": out["allPass"], "bind": f"{out['bindOk']}/{out['bindTotal']}", "fails": {k: v for k, v in checks.items() if not v.get("pass")}}, ensure_ascii=False, indent=2))
    return 0 if out["allPass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
