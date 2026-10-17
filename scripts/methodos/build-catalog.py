# -*- coding: utf-8 -*-
"""Methodos 엔진(v19-Ngraph-SaaS)의 목록·옵션·예제를 웹판 카탈로그로 묶는다.
사용: python build-catalog.py <v19-Ngraph-SaaS 폴더> <이 저장소 루트>
산출: public/methodos/catalog.json, public/methodos/examples/Mxx.csv
"""
import json, shutil, sys
from pathlib import Path
import yaml

src = Path(sys.argv[1]); dst = Path(sys.argv[2])
res = src / "engine" / "resources"; ex = src / "examples"
cat = {e["code"]: e for e in json.loads((res / "analysis_catalog.json").read_text(encoding="utf-8"))["entries"]}
opts = yaml.safe_load((res / "analysis_options.yaml").read_text(encoding="utf-8"))
tech = {t["code"]: t for t in json.loads((ex / "techniques.json").read_text(encoding="utf-8"))["items"]}
man = {i["code"]: i for i in json.loads((ex / "manifest.json").read_text(encoding="utf-8"))["items"]}

def clean_opt(o):
    out = {k: o[k] for k in ("id", "label", "type", "default", "step", "help") if k in o}
    if "choices" in o:
        out["choices"] = [{"value": c["value"], "label": c["label"]} for c in o["choices"]]
    return out

items = []
for code in sorted(cat):
    c, t, m = cat[code], tech.get(code, {}), man.get(code, {})
    items.append({
        "code": code, "name": c["name_ko"], "english": c["name_en"], "level": c.get("level"), "group": t.get("group") or "",
        "menuPath": c.get("menu_path"), "question": c.get("summary_question"), "tagline": t.get("tagline") or "",
        "whenToUse": c.get("when_to_use"), "minCases": c.get("min_cases"),
        "box": t.get("box") or [],
        "slots": [{"id": s["slot_id"], "label": s["label"], "description": s.get("description", ""), "types": s.get("allowed_storage_types", []), "min": s.get("min_count", 1), "max": s.get("max_count")} for s in c["variable_slots"]],
        "options": [clean_opt(o) for o in opts.get(code, [])],
        "example": {"csv": f"examples/{code}.csv", "slots": m.get("variable_slots", {}), "options": m.get("options", {})},
        "effectSizes": c.get("effect_sizes", []),
    })
    shutil.copyfile(ex / m["csv"], dst / "public" / "methodos" / "examples" / f"{code}.csv")
(dst / "public" / "methodos" / "catalog.json").write_text(json.dumps({"version": "R19-web", "items": items}, ensure_ascii=False), encoding="utf-8")
print(len(items), "techniques")


# ── 통계방법 라이브러리: 기법마다 적용 가능한 예제(분야별 자료) 묶음 ──────────────────────────
import re
multi = json.loads((ex / "multi_examples.json").read_text(encoding="utf-8"))["by_code"]
(dst / "public" / "methodos" / "data").mkdir(parents=True, exist_ok=True)
lib = {}
for code, items in multi.items():
    out = []
    for i, it in enumerate(items):
        if code == "M39" and isinstance(it["options"].get("treat"), list):
            continue  # 처치·시점을 숫자 목록으로 준 옛 방식은 웹판에 없다
        name = re.sub(r"[^0-9A-Za-z_.가-힣]+", "_", Path(it["csv"]).stem) + ".csv"
        shutil.copyfile(ex / it["csv"], dst / "public" / "methodos" / "data" / name)
        out.append({"id": f"{code}#{i}", "label": it["label"], "csv": name, "n": it.get("case_count"), "field": it.get("field"), "group": it.get("group"),
                    "slots": it["variable_slots"], "options": it["options"]})
    lib[code] = out
(dst / "public" / "methodos" / "library.json").write_text(json.dumps(lib, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(sum(len(v) for v in lib.values()), "library examples")
