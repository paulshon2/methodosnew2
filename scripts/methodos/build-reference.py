# -*- coding: utf-8 -*-
"""Methodos 파이썬 엔진의 기준 결과를 웹판 검증용 묶음으로 만든다.

엔진(v19-Ngraph-SaaS)에 같은 자료·변수·옵션을 넣어 돌린 결과표를 reference/cases.json 에 담고,
쓰인 CSV 를 reference/data/ 로 복사한다. verify.ts 가 이 묶음을 읽어 TypeScript 계산과 칸마다 견준다.

사용:  python build-reference.py <v19-Ngraph-SaaS 폴더> [사용자 지정 사례 JSON]
"""
import json, os, re, shutil, subprocess, sys, threading
from pathlib import Path

SRC = Path(sys.argv[1])
HERE = Path(__file__).parent
OUT = HERE / "reference"
(OUT / "data").mkdir(parents=True, exist_ok=True)
EX = SRC / "examples"


class Engine:
    def __init__(self):
        env = dict(os.environ, METHODOS_RESOURCE_ROOT=str(SRC / "engine" / "resources"), PYTHONUTF8="1")
        self.p = subprocess.Popen([sys.executable, "-X", "utf8", str(SRC / "engine" / "engine_main.py")], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
        threading.Thread(target=lambda: [None for _ in iter(self.p.stderr.readline, b"")], daemon=True).start()
        self.n = 0

    def call(self, cmd, payload=None):
        self.n += 1
        self.p.stdin.write((json.dumps({"request_id": f"r{self.n}", "command": cmd, "payload": payload or {}}, ensure_ascii=False) + "\n").encode())
        self.p.stdin.flush()
        while True:
            m = json.loads(self.p.stdout.readline().decode())
            if m.get("kind") != "progress":
                return m


def slim(run):
    if not run.get("success"):
        return None
    r = run["result"]["result"]
    return [{"id": t["table_id"], "cols": [c["name"] for c in t["columns"]], "rows": t["rows"]} for t in r["tables"]]


def main():
    cases = []
    man = json.load((EX / "manifest.json").open(encoding="utf-8"))["items"]
    for it in man:
        cases.append({"id": f"EX::{it['code']}", "kind": "example", "code": it["code"], "csv": it["csv"], "slots": it["variable_slots"], "options": it["options"]})
    multi = json.load((EX / "multi_examples.json").open(encoding="utf-8"))["by_code"]
    for code, items in multi.items():
        for it in items:
            if code == "M39" and isinstance(it["options"].get("treat"), list):
                continue  # 처치·시점을 숫자 목록으로 준 옛 방식 — 웹판은 열 배정만 받는다
            cases.append({"id": it["id"], "kind": "multi", "code": code, "csv": it["csv"], "slots": it["variable_slots"], "options": it["options"]})
    if len(sys.argv) > 2:
        for it in json.load(open(sys.argv[2], encoding="utf-8")):
            cases.append({"id": it["id"], "kind": "custom", "code": it["code"], "csv": it["csv"], "slots": it["slots"], "options": it["options"]})
    e = Engine()
    imported = {}
    done = []
    seen = set()
    for c in cases:
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        csv = EX / c["csv"]
        key = str(csv)
        if key not in imported:
            r = e.call("data.import", {"path": key, "name": csv.stem})
            imported[key] = r["result"]["dataset_id"] if r.get("success") else None
        run = e.call("analysis.run", {"analysis_code": c["code"], "dataset_id": imported[key], "variable_slots": c["slots"], "options": c["options"]}) if imported[key] else {"success": False}
        base = re.sub(r"[^0-9A-Za-z_.가-힣]+", "_", Path(c["csv"]).stem) + ".csv"
        shutil.copyfile(csv, OUT / "data" / base)
        done.append({**c, "csv": base, "tables": slim(run), "engineError": None if run.get("success") else (run.get("error_code") or "error")})
        print(c["id"], run.get("success"), flush=True)
    (OUT / "cases.json").write_text(json.dumps(done, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(done), "cases")


main()
