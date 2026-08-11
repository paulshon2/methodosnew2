# -*- coding: utf-8 -*-
"""all-20 → 정식명칭 통일 · 중복 제거 · 12종 데모 생성"""
from __future__ import annotations
import json
import random
from pathlib import Path

ROOT = Path(r"c:\Users\saran\OneDrive\Desktop\making-M\methodos--s23-all-20\saas")
CUR_PATH = ROOT / "public" / "basic-stats-curriculum.json"
DEMOS_PATH = ROOT / "lib" / "basic-stats-demos.generated.json"

# 기존 레거시와 47코드 중복 → 47코드만 유지
DROP_IDS = {
    "freq",  # → A-01
    "ttest",  # → C-02
    "anova",  # → C-04
    "validity",  # → B-01
    "reliability",  # → B-01
    "efa",  # → B-03
    "assoc",  # → D-01/D-04
    "reg_basic",  # → E-01/E-02
    "reg_mid",  # → E-03~E-05
    "reg_adv",  # → E-06/E-07
    "cluster",  # → G-01
}

TOPICS = [
    ("01", "대학생 학습동기 조사", "학습동기", "자기효능감", "주당학습시간", "전공계열"),
    ("02", "직장인 조직몰입", "조직몰입", "상사지지", "직무자율성", "부서"),
    ("03", "온라인 수업 만족도", "수업만족도", "상호작용", "콘텐츠유용성", "수강방식"),
    ("04", "지역사회 복지 인식", "복지인식", "정보접근성", "지역애착", "거주지역"),
    ("05", "스타트업 창업의도", "창업의도", "기업가정신", "자원접근성", "전공경험"),
    ("06", "중학생 진로성숙", "진로성숙도", "진로탐색", "부모지지", "학년"),
    ("07", "간호 직무스트레스", "직무스트레스", "업무부하", "사회적지지", "근무형태"),
    ("08", "소비자 브랜드충성", "브랜드충성도", "브랜드신뢰", "제품만족", "구매경험"),
    ("09", "노인 디지털리터러시", "디지털리터러시", "기기사용빈도", "교육경험", "연령대"),
    ("10", "교사 소진·효능감", "교사효능감", "소진", "동료지지", "학교급"),
    ("11", "기후행동 의도", "기후행동의도", "환경태도", "규범인식", "캠페인노출"),
    ("12", "헬스케어 앱 사용", "앱지속사용의도", "유용성", "용이성", "이용기간"),
]

GROUPS = {
    "01": ["인문", "이공"],
    "02": ["영업", "기획"],
    "03": ["실시간", "녹화"],
    "04": ["도심", "읍면"],
    "05": ["경험有", "경험無"],
    "06": ["1학년", "3학년"],
    "07": ["주간", "야간"],
    "08": ["재구매", "첫구매"],
    "09": ["전기고령", "후기고령"],
    "10": ["초등", "중등"],
    "11": ["노출", "비노출"],
    "12": ["단기이용", "장기이용"],
}


def rng(seed: str) -> random.Random:
    return random.Random(hash(seed) & 0xFFFFFFFF)


def score(r: random.Random, lo=1, hi=5) -> int:
    return r.randint(lo, hi)


def cont(r: random.Random, mu=50, sig=10) -> int:
    return max(1, int(r.gauss(mu, sig)))


def csv_lines(header: list[str], rows: list[list]) -> str:
    return ",".join(header) + "\n" + "\n".join(",".join(str(c) for c in row) for row in rows)


def make_demo_csv(code: str, topic_id: str, topic: tuple) -> tuple[str, int]:
    """기법별·주제별 CSV. returns (csv, n)"""
    tid, title, yname, x1, x2, gname = topic
    r = rng(f"{code}-{topic_id}")
    gs = GROUPS[topic_id]
    n = 120

    def ids():
        return list(range(1, n + 1))

    # --- by technique family ---
    if code in ("A-01",):
        cats = [gs[0], gs[1], "기타", x1[:2] + "형"]
        rows = [[i, r.choice(cats)] for i in ids()]
        return csv_lines(["ID", gname], rows), n

    if code in ("A-02", "A-03", "A-04", "A-10", "C-01"):
        rows = [[i, cont(r, 55, 12), score(r), score(r)] for i in ids()]
        return csv_lines(["ID", yname, x1, x2], rows), n

    if code in ("A-05", "D-07", "G-01", "G-02", "B-03", "D-05"):
        rows = [[i, score(r), score(r), score(r), score(r), cont(r, 40, 8)] for i in ids()]
        return csv_lines(["ID", f"{yname}_a", f"{yname}_b", x1, x2, "활동량"], rows), n

    if code in ("A-08", "D-04", "D-06", "C-09"):
        rows = [[i, r.choice(gs), r.choice(["높음", "보통", "낮음"])] for i in ids()]
        return csv_lines(["ID", gname, f"{yname}수준"], rows), n

    if code == "A-09":
        rows = [[i, r.randint(0, 1), r.randint(0, 1), r.randint(0, 1)] for i in ids()]
        return csv_lines(["ID", f"이용_{x1}", f"이용_{x2}", f"이용_{yname}"], rows), n

    if code in ("B-01", "cfa", "path", "sem", "sem_fix", "sem_mod", "mg", "validity", "reliability"):
        rows = [[i] + [score(r) for _ in range(6)] for i in ids()]
        return csv_lines(["ID", "I1", "I2", "I3", "I4", "I5", "I6"], rows), n

    if code == "B-02":
        rows = [[i, score(r), score(r), score(r)] for i in ids()]
        return csv_lines(["ID", "평정자1", "평정자2", "평정자3"], rows), n

    if code in ("B-05", "C-03", "C-08"):
        rows = []
        for i in ids():
            pre = cont(r, 50, 8)
            rows.append([i, pre, pre + r.randint(-5, 12)])
        return csv_lines(["ID", "사전", "사후"], rows), n

    if code in ("C-02", "C-04", "C-05", "C-07", "C-10", "E-05", "G-03", "G-04", "I-04"):
        rows = []
        for i in ids():
            g = gs[i % 2]
            base = 45 if g == gs[0] else 58
            rows.append([i, g, cont(r, base, 7), score(r), score(r)])
        return csv_lines(["ID", "Group", yname, x1, x2], rows), n

    if code == "C-06":
        rows = []
        for i in ids():
            g = gs[i % 2]
            base = 40 if g == gs[0] else 55
            rows.append([i, g, cont(r, base, 6), cont(r, base + 5, 6), score(r)])
        return csv_lines(["ID", "Group", f"{yname}1", f"{yname}2", x1], rows), n

    if code in ("D-01", "D-02", "D-03", "E-01", "E-02", "E-03", "E-04", "E-07", "E-15"):
        rows = []
        for i in ids():
            a = score(r)
            b = min(5, max(1, a + r.randint(-1, 1)))
            y = cont(r, 20 + 8 * a + 3 * b, 5)
            rows.append([i, a, b, score(r), y])
        return csv_lines(["ID", x1, x2, "통제변인", yname], rows), n

    if code == "E-06":
        rows = []
        for i in ids():
            x = score(r)
            m = min(5, max(1, x + r.randint(-1, 1)))
            y = cont(r, 15 + 6 * x + 5 * m, 4)
            rows.append([i, x, m, y])
        return csv_lines(["ID", "X", "M", "Y"], rows), n

    if code == "G-06":
        rows = []
        for i in ids():
            s = round(r.random(), 2)
            lab = 1 if s > 0.45 else 0
            if r.random() < 0.15:
                lab = 1 - lab
            rows.append([i, s, lab])
        return csv_lines(["ID", "예측점수", "실제라벨"], rows), n

    if code in ("I-01", "I-03"):
        rows = []
        v = 50.0
        w = 40.0
        for t in range(1, 121):
            v += r.uniform(-2, 3)
            w += r.uniform(-2, 2.5)
            rows.append([t, round(v, 1), round(w, 1)])
        return csv_lines(["t", f"{yname}_시계열", f"{x1}_시계열"], rows), 120

    if code in ("J-01", "J-02"):
        rows = []
        for i in range(1, 121):
            d = round(r.uniform(0.1, 0.6), 2)
            se = round(r.uniform(0.08, 0.2), 2)
            rows.append([i, d, se, r.randint(30, 80), r.randint(30, 80)])
        return csv_lines(["study", "d", "se", "n1", "n2"], rows), 120

    # default regression-like
    rows = [[i, gs[i % 2], score(r), score(r), cont(r, 50, 10)] for i in ids()]
    return csv_lines(["ID", "Group", x1, x2, yname], rows), n


def build_demos_for_module(mod: dict) -> list[dict]:
    code = mod["id"]
    out = []
    for tid, title, y, x1, x2, g in TOPICS:
        csv, n = make_demo_csv(code, tid, (tid, title, y, x1, x2, g))
        out.append(
            {
                "id": f"{code}-demo-{tid}",
                "title": f"{title} ({int(tid)})",
                "desc": f"{title} · {mod.get('formalName') or mod.get('name')}용 컬럼 구성",
                "n": n,
                "csv": csv,
            }
        )
    return out


def main():
    cur = json.loads(CUR_PATH.read_text(encoding="utf-8"))
    kept = []
    for m in cur["modules"]:
        mid = m["id"]
        if mid in DROP_IDS:
            continue
        # 정식 명칭으로 표시명 통일 (새명칭 제거·정식명칭만)
        formal = m.get("formalName") or m.get("name") or mid
        eng = m.get("englishName") or ""
        if m.get("newName") and m["newName"] != formal:
            m["legacyNewName"] = m["newName"]
        m["formalName"] = formal
        m["name"] = formal
        m["newName"] = formal
        if eng:
            m["englishName"] = eng
        # sampleCsv = 첫 데모
        demos = build_demos_for_module(m)
        m["sampleCsv"] = demos[0]["csv"]
        m["_demos"] = demos  # temp
        kept.append(m)

    # write demos json
    demos_map = {m["id"]: m.pop("_demos") for m in kept}
    DEMOS_PATH.write_text(json.dumps(demos_map, ensure_ascii=False, indent=2), encoding="utf-8")

    cur["modules"] = kept
    cur["version"] = "1.73.21"
    cur["source"] = "formal-names · dedupe legacy · 12 topic demos"
    # story labels
    for s in cur.get("story", []):
        if s["id"] == "classic":
            s["desc"] = "완전구현 기법(정식 명칭)"
        if s["id"] == "sem":
            s["desc"] = "SEM·측정·매개(정식 명칭)"

    CUR_PATH.write_text(json.dumps(cur, ensure_ascii=False, indent=2), encoding="utf-8")
    classic = sum(1 for m in kept if m.get("group") in ("classic", "spss"))
    sem = sum(1 for m in kept if m.get("group") in ("sem", "amos"))
    print(f"modules={len(kept)} classic={classic} sem={sem}")
    print(f"demos modules={len(demos_map)} each={len(next(iter(demos_map.values())))}")
    print("dropped", sorted(DROP_IDS))


if __name__ == "__main__":
    main()
