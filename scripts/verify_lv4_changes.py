# -*- coding: utf-8 -*-
"""lv-4 verification: summary bridge, AI UI markers, name corrections."""
from __future__ import annotations

import json
import re
from pathlib import Path

SAAS = Path(__file__).resolve().parents[1]
METHODS = SAAS / "public" / "methods"
CAT = SAAS / "public" / "method-catalog.json"
REG = SAAS / "public" / "registry.json"
UI = SAAS / "components" / "app" / "worked-example-panel.tsx"
OUT = SAAS / "public" / "_lv4_verify_report.json"


def main():
    checks = {}
    ui = UI.read_text(encoding="utf-8")
    checks["UI_briefForm"] = "간략 기입란" in ui
    checks["UI_sheetAI"] = "실제 작업표 AI로 채우기" in ui
    checks["UI_draftBtn"] = "AI 초안 요청" in ui
    checks["UI_bridgeHint"] = "실제 작업표 열(연결)" in ui or "summaryHowTo" in ui

    # summary bridge on all tasks
    bad_old = 0
    bad_bridge = 0
    total = 0
    sample = None
    for folder in METHODS.iterdir():
        v61p = folder / "v61.json"
        if not v61p.exists():
            continue
        data = json.loads(v61p.read_text(encoding="utf-8"))
        for stage in data.get("stages") or []:
            tasks = list(stage.get("tasks") or [])
            for proc in stage.get("processes") or []:
                tasks.extend(proc.get("tasks") or [])
            for t in tasks:
                we = t.get("workedExample") or {}
                st = we.get("summaryTable") or {}
                total += 1
                headers = st.get("headers") or []
                if headers == ["체크", "기준", "결과", "메모"]:
                    bad_old += 1
                if "실제 작업표 열(연결)" not in headers and "bridgeToWorkSheet" not in st:
                    bad_bridge += 1
                if sample is None and folder.name == "meta-analysis-01" and "입력기준" in (t.get("name") or ""):
                    sample = {
                        "task": t.get("name"),
                        "title": st.get("title"),
                        "headers": headers,
                        "row0": (st.get("rows") or [None])[0],
                        "howTo": we.get("summaryHowTo"),
                    }

    checks["summaryRebuilt"] = bad_old == 0
    checks["summaryBridgeHeaders"] = bad_bridge == 0
    checks["summaryTaskCount"] = total

    cat = json.loads(CAT.read_text(encoding="utf-8"))
    reg = json.loads(REG.read_text(encoding="utf-8"))
    checks["catalogCount"] = len(cat["methods"])
    checks["registryCount"] = len(reg["methods"])
    # polluted patterns in catalog display names
    polluted = []
    for m in cat["methods"]:
        n = m["name_ko"]
        if re.search(r"\b(Mastering|Mixtape|Handbook of|Doing a Literature)\b", n):
            polluted.append(n)
        if re.search(r"(EV-007|QT-038|QL-008|TX-002)\(", n):
            polluted.append(n)
    checks["catalogNoBookTitlePollution"] = len(polluted) == 0
    checks["pollutedSample"] = polluted[:5]

    # causal / gt variants renamed
    by = {m["perfSlug"]: m["name_ko"] for m in cat["methods"]}
    checks["causal01"] = by.get("causal-inference-01", "")
    checks["gt02"] = by.get("grounded-theory-02", "")
    checks["variantNamesOk"] = (
        "준실험설계" in by.get("causal-inference-01", "")
        and "2세대" in by.get("grounded-theory-02", "")
    )

    # registry CI-003 corrected
    ci003 = next((m for m in reg["methods"] if m["id"] == "CI-003"), None)
    checks["registryCI003"] = (ci003 or {}).get("name_ko")
    checks["registryCI003ok"] = "준실험설계" in ((ci003 or {}).get("name_ko") or "")

    all_pass = all(
        bool(checks[k])
        for k in [
            "UI_briefForm",
            "UI_sheetAI",
            "UI_draftBtn",
            "summaryRebuilt",
            "summaryBridgeHeaders",
            "catalogNoBookTitlePollution",
            "variantNamesOk",
            "registryCI003ok",
        ]
    )
    out = {"allPass": all_pass, "checks": checks, "metaSample": sample, "badOld": bad_old, "badBridge": bad_bridge}
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"allPass": all_pass, "badOld": bad_old, "badBridge": bad_bridge, "sampleTitle": (sample or {}).get("title")}, ensure_ascii=False, indent=2))
    return 0 if all_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
