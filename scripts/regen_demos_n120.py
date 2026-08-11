# -*- coding: utf-8 -*-
"""기본통계 12종 데모를 n=120으로 재생성 (커리큘럼 본문은 유지)."""
from __future__ import annotations
import json
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CUR_PATH = ROOT / "public" / "basic-stats-curriculum.json"
DEMOS_PATH = ROOT / "lib" / "basic-stats-demos.generated.json"
SRC = Path(__file__).resolve().parent / "apply_formal_names_demos21.py"

spec = importlib.util.spec_from_file_location("demos21", SRC)
mod = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(mod)

# 경로 오버라이드
mod.ROOT = ROOT
mod.CUR_PATH = CUR_PATH
mod.DEMOS_PATH = DEMOS_PATH

cur = json.loads(CUR_PATH.read_text(encoding="utf-8"))
demos_map = {}
for m in cur["modules"]:
    demos = mod.build_demos_for_module(m)
    demos_map[m["id"]] = demos
    # 기본 샘플도 첫 데모(n=120)로 맞춤
    m["sampleCsv"] = demos[0]["csv"]

DEMOS_PATH.write_text(json.dumps(demos_map, ensure_ascii=False, indent=2), encoding="utf-8")
CUR_PATH.write_text(json.dumps(cur, ensure_ascii=False, indent=2), encoding="utf-8")

# 검증
sample = demos_map.get("D-06", [{}])[0]
n = sample.get("n")
rows = sample.get("csv", "").strip().splitlines()
print(f"modules={len(demos_map)} D-06 n={n} csv_rows={len(rows)-1}")
print(f"title0={sample.get('title')}")
sem = demos_map.get("cfa", [{}])[0]
print(f"cfa n={sem.get('n')} rows={len(sem.get('csv','').strip().splitlines())-1}")
