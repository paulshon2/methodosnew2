# -*- coding: utf-8 -*-
"""Build 47-module curriculum slice + merge into basic-stats-curriculum.json"""
import json
from pathlib import Path

ROOT = Path(r"c:\Users\saran\OneDrive\Desktop\making-M\methodos--s23-all-17\saas")
RAW = json.loads((ROOT / "scripts/_stats47_raw.json").read_text(encoding="utf-8"))

EN = {
    "A-01": "Frequency Analysis",
    "A-02": "Descriptive Statistics",
    "A-03": "Exploratory Data Analysis (Quartiles)",
    "A-04": "Normality Tests (Shapiro–Wilk · K–S)",
    "A-05": "Outlier Detection (z · Mahalanobis)",
    "A-08": "Custom Tables · Crosstab Aggregation",
    "A-09": "Multiple Response Frequency",
    "A-10": "Optimal Binning (MDLP)",
    "B-01": "Reliability (Cronbach α · McDonald ω · Split-half)",
    "B-02": "Intraclass Correlation (ICC)",
    "B-03": "EFA · PCA · KMO · Bartlett",
    "B-05": "Bland–Altman Analysis",
    "C-01": "One-sample t · Sign · Wilcoxon",
    "C-02": "Independent t · Welch · Levene · Mann–Whitney",
    "C-03": "Paired t · Wilcoxon Signed-rank",
    "C-04": "One-way ANOVA · Kruskal–Wallis",
    "C-05": "Two-way ANOVA",
    "C-06": "MANOVA (Wilks · Pillai)",
    "C-07": "ANCOVA",
    "C-08": "Repeated-measures ANOVA · Mauchly · GG",
    "C-09": "Proportion · Binomial · McNemar",
    "C-10": "Post-hoc (Tukey · Scheffé · Bonferroni)",
    "D-01": "Correlation (Pearson · Spearman · Kendall)",
    "D-02": "Partial · Semi-partial Correlation",
    "D-03": "Distance Correlation",
    "D-04": "Chi-square · Cramér V · Fisher Exact",
    "D-05": "Canonical Correlation Analysis",
    "D-06": "Correspondence Analysis (CA · MCA)",
    "D-07": "Multidimensional Scaling (MDS)",
    "E-01": "Simple Linear Regression",
    "E-02": "Multiple Regression · VIF · Durbin–Watson",
    "E-03": "Hierarchical Regression · ΔR² · F-change",
    "E-04": "Stepwise · Forward · Backward Selection",
    "E-05": "Dummy-variable Regression",
    "E-06": "Mediation (Bootstrap CI)",
    "E-07": "Moderation · Simple Slopes · Johnson–Neyman",
    "E-15": "Two-Stage Least Squares (2SLS)",
    "G-01": "Cluster Analysis (Hierarchical · K-means · Ward)",
    "G-02": "Silhouette Coefficient",
    "G-03": "Discriminant Analysis · kNN",
    "G-04": "Decision Tree (CHAID · CART)",
    "G-06": "ROC · AUC · Youden",
    "I-01": "Seasonal Decomposition · ACF/PACF · Ljung–Box",
    "I-03": "VAR · Granger Causality",
    "I-04": "Conjoint Analysis · TURF",
    "J-01": "Meta-analysis (Fixed · Random · Q · I²)",
    "J-02": "Publication Bias (Egger · Begg · Trim-and-fill)",
}

SEM_CODES = {"B-01", "B-03", "E-06", "E-07", "D-05", "G-03"}

CSV = {
    "default": "ID,Group,X,Y,Z\n1,A,12,45,3\n2,A,14,48,4\n3,A,11,42,2\n4,B,18,55,5\n5,B,20,58,6\n6,B,17,52,4\n7,C,22,61,7\n8,C,19,57,5\n9,C,21,60,6\n10,A,13,46,3\n11,B,16,54,5\n12,C,23,62,7",
    "freq": "ID,Category\n1,주간\n2,야간\n3,주간\n4,교대\n5,주간\n6,야간\n7,주간\n8,교대\n9,야간\n10,주간",
    "pair": "ID,Pre,Post\n1,62,70\n2,55,60\n3,48,55\n4,71,74\n5,58,65\n6,64,68\n7,50,58\n8,66,72",
    "items": "ID,I1,I2,I3,I4,I5\n1,4,5,4,3,4\n2,5,5,4,4,5\n3,3,4,3,3,4\n4,4,4,5,4,4\n5,5,5,5,5,5\n6,2,3,2,2,3\n7,4,4,3,4,4\n8,3,3,4,3,3",
    "reg": "ID,X1,X2,Y\n1,2.1,3.0,5.2\n2,2.5,2.8,5.5\n3,3.0,3.2,6.1\n4,3.4,3.5,6.8\n5,3.8,3.1,7.0\n6,4.0,4.0,7.5\n7,4.5,3.8,8.0\n8,5.0,4.2,8.6\n9,5.2,4.5,8.9\n10,5.5,4.8,9.2",
    "mediat": "ID,X,M,Y\n1,1,2,3\n2,2,3,4\n3,3,3,5\n4,4,5,6\n5,5,5,7\n6,6,6,8\n7,7,7,8\n8,8,8,9\n9,2,4,5\n10,5,6,7",
    "crosstab": "ID,Row,Col\n1,남,찬성\n2,남,반대\n3,여,찬성\n4,여,찬성\n5,남,찬성\n6,여,반대\n7,남,반대\n8,여,찬성\n9,남,찬성\n10,여,반대",
    "time": "t,Y\n1,10\n2,12\n3,11\n4,15\n5,14\n6,18\n7,17\n8,20\n9,19\n10,22\n11,21\n12,25",
    "meta": "study,d,se,n1,n2\n1,0.40,0.12,40,40\n2,0.25,0.15,30,30\n3,0.55,0.10,50,50\n4,0.10,0.18,25,25\n5,0.35,0.11,45,45",
    "roc": "ID,score,label\n1,0.1,0\n2,0.2,0\n3,0.35,0\n4,0.4,1\n5,0.55,0\n6,0.6,1\n7,0.7,1\n8,0.8,1\n9,0.85,1\n10,0.3,0",
    "rater": "case,r1,r2,r3\n1,4,5,4\n2,3,3,2\n3,5,5,5\n4,2,3,2\n5,4,4,5\n6,1,2,1\n7,5,4,5\n8,3,3,3",
    "multi": "ID,opt_A,opt_B,opt_C\n1,1,0,1\n2,1,1,0\n3,0,1,1\n4,1,0,0\n5,0,1,0\n6,1,1,1\n7,0,0,1\n8,1,0,1",
}


def csv_for(code: str) -> str:
    if code in ("A-01", "A-08", "A-09", "D-04", "D-06"):
        return CSV["crosstab"] if code != "A-01" else CSV["freq"]
    if code == "A-09":
        return CSV["multi"]
    if code in ("A-02", "A-03", "A-04", "A-05", "A-10"):
        return CSV["default"]
    if code in ("B-01", "B-03"):
        return CSV["items"]
    if code == "B-02":
        return CSV["rater"]
    if code == "B-05":
        return CSV["pair"]
    if code in ("C-01",):
        return CSV["default"]
    if code in ("C-02", "C-04", "C-05", "C-06", "C-07", "C-10", "E-05", "G-03"):
        return CSV["default"]
    if code in ("C-03", "C-08"):
        return CSV["pair"]
    if code == "C-09":
        return CSV["crosstab"]
    if code in ("D-01", "D-02", "D-03", "D-05", "D-07"):
        return CSV["reg"]
    if code in ("E-01", "E-02", "E-03", "E-04", "E-15"):
        return CSV["reg"]
    if code == "E-06":
        return CSV["mediat"]
    if code == "E-07":
        return CSV["reg"]
    if code in ("G-01", "G-02", "G-04"):
        return CSV["reg"]
    if code == "G-06":
        return CSV["roc"]
    if code in ("I-01", "I-03"):
        return CSV["time"]
    if code == "I-04":
        return CSV["reg"]
    if code in ("J-01", "J-02"):
        return CSV["meta"]
    return CSV["default"]


def make_steps(row):
    code = row["code"]
    return [
        {
            "id": "goal",
            "title": "분석 목표 정하기",
            "why": f"{row['newName']}({row['formalName']})로 답할 연구 질문을 한 문장으로 씁니다.",
            "nextWhy": "질문이 분명해야 변수·척도 선택이 쉬워집니다.",
            "choices": [
                {"id": "desc", "label": "요약·탐색", "hint": "분포·중심·관계 파악"},
                {"id": "infer", "label": "추론·검정", "hint": "가설·p값·효과크기"},
                {"id": "model", "label": "모형·예측", "hint": "회귀·구조·분류"},
            ],
            "example": f"예: {row['newName']}로 ‘차이가 있는지/관계가 있는지’를 확인한다.",
        },
        {
            "id": "data",
            "title": "데이터·변수 확인",
            "why": "필요한 열(집단·점수·문항·시점)이 CSV에 있는지 확인합니다.",
            "nextWhy": "결측·이상치는 이후 검정 가정에 영향을 줍니다.",
            "choices": [
                {"id": "ok", "label": "열 구성 충분", "hint": "분석 열 준비됨"},
                {"id": "fix", "label": "열 이름 정리", "hint": "영문/한글 헤더 통일"},
                {"id": "miss", "label": "결측 점검", "hint": "빈 칸 비율 확인"},
            ],
            "example": "샘플 CSV로 먼저 절차를 익힌 뒤 본 데이터를 넣습니다.",
        },
        {
            "id": "rule",
            "title": "규칙 기반 절차 실행",
            "why": f"구현 단계 {row['stage']} · 수치도구 {row['tools']} · 실행위치 {row['execLoc']}.",
            "nextWhy": "결과는 검증 여과장치(①절대·②불변·③시뮬 앵커)를 통과해야 신뢰합니다.",
            "choices": [
                {"id": "run", "label": "규칙엔진 실행", "hint": "stats-core / 규칙기반"},
                {"id": "verify", "label": "검증 필터 포함", "hint": "권장"},
                {"id": "demo", "label": "데모만 확인", "hint": "학습용"},
            ],
            "example": f"판정 기준: {row['criterion'][:120]}",
        },
        {
            "id": "report",
            "title": "결과 해석·보고",
            "why": "통계량·p·효과크기와 검증 통과 여부를 함께 적습니다.",
            "nextWhy": "외부 패키지 없이도 불변성·앵커로 자체 검산합니다.",
            "choices": [
                {"id": "paper", "label": "논문 결과 절 문장", "hint": "한국어 보고"},
                {"id": "limit", "label": "한계 적기", "hint": "가정·표본"},
                {"id": "next", "label": "다음 분석", "hint": "후속 기법"},
            ],
            "example": f"검정통계량·분포: {row['statDist'][:100]}",
        },
    ]


def build_module(row):
    code = row["code"]
    group = "sem" if code in SEM_CODES else "classic"
    en = EN.get(code, row["formalName"])
    note = (row.get("formulaNote") or "").replace("초등학생", "").replace("초등", "").strip()
    # strip meta phrases if any
    for bad in ("(이말은", "프로그램에서 삭제", "엑셀표에 포함시키지말라"):
        note = note.replace(bad, "")
    name = f"{row['newName']} · {row['formalName']}"
    return {
        "id": code,
        "name": name,
        "group": group,
        "code": code,
        "newName": row["newName"],
        "formalName": row["formalName"],
        "englishName": en,
        "formula": row["formula"],
        "formulaNote": note,
        "statDist": row["statDist"],
        "criterion": row["criterion"],
        "implStage": row["stage"],
        "numTools": row["tools"],
        "execLoc": row["execLoc"],
        "overview": (
            f"【정식 명칭】{row['formalName']} ({en})\n"
            f"【새 명칭】{row['newName']}\n"
            f"【영역】{row['area']} · 코드 {code}\n\n"
            f"{row['formalName']}은(는) {row['newName']} 질문에 답하기 위한 분석입니다. "
            f"판정: {row['criterion']}"
        ),
        "process": [
            "연구 질문·가설 정리",
            "변수·척도·표본 확인",
            f"규칙 기반 계산 (단계 {row['stage']}, 도구 {row['tools']})",
            "검증 여과장치 통과 확인",
            "결과 해석·시각화·보고",
        ],
        "examples": [
            f"{row['newName']} 적용 예: 설문·실험·이차자료에서 {row['formalName']} 보고",
            f"실행위치 가이드: {row['execLoc']}",
        ],
        "steps": make_steps(row),
        "sampleCsv": csv_for(code),
        "chart": "bar" if code.startswith("A") else ("scatter" if code.startswith(("D", "E")) else "bar"),
        "next": [],
        "decision": f"코드={code}. 분석대상={row['newName']}. 도구={row['tools']}. 위치={row['execLoc']}.",
        "naming": {
            "why": f"정식 명칭 ‘{row['formalName']}’({en})은 학계 표준 표기이고, 화면의 새 명칭 ‘{row['newName']}’은 연구 질문 형태를 따릅니다.",
            "use": f"논문·보고서에는 정식 명칭({en})을 쓰고, 메뉴에서는 {row['newName']}으로 고릅니다.",
            "examples": [f"{code}: {row['newName']} / {en}"],
        },
        "overviewEasy": {
            "plain": note or f"{row['newName']}은 {row['formalName']}을 쉽게 부른 이름입니다.",
            "examples": [f"핵심 수식 주석: {note}"] if note else [],
        },
        "processDetail": [
            {"term": "핵심 수식", "desc": row["formula"], "examples": [note] if note else []},
            {"term": "판정 기준", "desc": row["criterion"], "examples": []},
            {
                "term": "검증 여과",
                "desc": "①절대 앵커 ②불변성 ③시뮬레이션 권장 조합으로 결과 신뢰도를 표시합니다.",
                "examples": ["Xᵀe≈0", "SST=SSR+SSE", "특수함수 Φ(0)=0.5"],
            },
        ],
        "examplesEasy": [
            {"ex": row["formalName"], "plain": note or row["newName"]},
        ],
        "source": "통계분석기법_원천수식표_갱신.xlsx",
    }


modules = [build_module(r) for r in RAW]
# wire next links within area
by_area = {}
for m in modules:
    area = next(r["area"] for r in RAW if r["code"] == m["id"])
    by_area.setdefault(area, []).append(m["id"])
for m in modules:
    area = next(r["area"] for r in RAW if r["code"] == m["id"])
    ids = by_area[area]
    i = ids.index(m["id"])
    m["next"] = [ids[(i + 1) % len(ids)]]

out_path = ROOT / "public" / "basic-stats-47.json"
out_path.write_text(json.dumps({"version": "1.0.0", "modules": modules}, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", out_path, "n=", len(modules))

# merge into curriculum
cur_path = ROOT / "public" / "basic-stats-curriculum.json"
cur = json.loads(cur_path.read_text(encoding="utf-8"))
# remove previous 47 codes if re-run
keep = [m for m in cur["modules"] if not (isinstance(m.get("id"), str) and m["id"] in EN)]
cur["modules"] = keep + modules
cur["version"] = "1.72.47"
cur["source"] = (cur.get("source") or "") + " + stats47 from 원천수식표_갱신"
# story tweak
for s in cur.get("story", []):
    if s["id"] == "classic":
        s["desc"] = "기술·추론 + 완전구현 47 중 classic"
    if s["id"] == "sem":
        s["desc"] = "SEM + 측정·매개·요인(B-01·B-03 등)"
cur_path.write_text(json.dumps(cur, ensure_ascii=False, indent=2), encoding="utf-8")
print("merged curriculum modules=", len(cur["modules"]))
