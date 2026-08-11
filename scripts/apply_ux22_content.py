# -*- coding: utf-8 -*-
"""all-21 UX22: 명칭·영어명·decision 정리·쉬운 수식·분석절차 단계 보강"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\methodos--s23-all-21\saas")
CUR = ROOT / "public" / "basic-stats-curriculum.json"
CUR47 = ROOT / "public" / "basic-stats-47.json"
DEMOS = ROOT / "lib" / "basic-stats-demos.generated.json"

SHAPIRO_NAME = "Shapiro–Wilk(정규성 검정) · Kolmogorov–Smirnov(분포 적합성 검정 (정규성 포함))"
SHAPIRO_EN = "Shapiro–Wilk (Normality) · Kolmogorov–Smirnov (Goodness-of-fit, incl. Normality)"

SEM_EN = {
    "cfa": "Confirmatory Factor Analysis (CFA)",
    "path": "Path Analysis",
    "sem": "Structural Equation Modeling (SEM)",
    "sem_fix": "SEM Model Modification (Modification Indices)",
    "sem_mod": "SEM Moderation Analysis",
    "mg": "Multi-Group SEM",
}

SEM_TARGET = {
    "cfa": "가정한 요인 구조가 데이터와 맞는지 검증",
    "path": "연구모델 경로(가설 화살표)의 직접·간접·총효과 확인",
    "sem": "측정모델과 구조모델을 한 번에 추정",
    "sem_fix": "적합도 개선을 위한 수정·대안모형 비교",
    "sem_mod": "집단·조건에 따라 경로 효과가 다른지(조절) 확인",
    "mg": "여러 집단에서 측정·경로 동일성 비교",
}

# 기법별 쉬운 수식 설명 (메타문구 없이)
FORMULA_EASY = {
    "A-01": "빈도분석은 ‘같은 답이 몇 번 나왔나’를 셉니다. 전체 인원으로 나누면 비율(%)이 됩니다. 가장 많이 나온 답이 표본을 너무 한쪽으로 치우치게 하는지 먼저 봅니다.",
    "A-02": "평균은 점수 합÷인원, 표준편차는 ‘평균에서 얼마나 흩어졌나’입니다. 표준오차는 표본 평균이 얼마나 흔들릴지 가늠합니다.",
    "A-03": "사분위는 점수를 줄 세운 뒤 25%·50%·75% 지점을 찾는 방법입니다. IQR(사분위범위)은 가운데 절반이 얼마나 넓은지 보여 줍니다.",
    "A-04": "Shapiro–Wilk는 ‘점수가 종 모양(정규)에 가깝나’를 한 점수로 봅니다. Kolmogorov–Smirnov는 ‘실제 누적 분포’와 ‘가정한 분포’의 최대 차이를 봅니다. p가 크면 가정한 모양을 크게 의심하지 않습니다.",
    "A-05": "z점수는 ‘평균에서 몇 걸음 떨어졌나’입니다. 마할라노비스 거리는 여러 점수를 한꺼번에 보며 ‘유난히 다른 사람’을 찾습니다.",
    "C-01": "한 집단 평균이 기준값(예: 0)과 다른지 봅니다. 차이를 흩어짐으로 나눈 값이 t입니다.",
    "C-02": (
        "【공통 분산을 가정한 t】\n"
        "① 각 집단의 ‘흩어짐(분산)’을 표본 크기로 가중 평균한 값이 s_p²(합동분산)입니다.\n"
        "② 두 평균 차이(x̄₁−x̄₂)를, 합동분산으로 만든 ‘흔들림’으로 나누면 t가 됩니다.\n"
        "③ 분모 √(s_p²(1/n₁+1/n₂))는 ‘평균 차이가 우연히 커 보일 수 있는 정도’입니다.\n\n"
        "【Welch t】두 집단 흩어짐이 다를 때, 각자 분산을 그대로 써서 더 공정하게 비교합니다.\n\n"
        "【Levene】집단마다 ‘절대편차의 평균’이 비슷한지(등분산) 먼저 점검합니다. p가 크면 흩어짐이 비슷하다고 봅니다.\n\n"
        "【Mann–Whitney U】순위만 써서 평균 대신 ‘누가 더 위에 있나’를 비교하는 완화판입니다."
    ),
    "C-03": "같은 사람의 사전·사후처럼 짝이 있는 두 점수의 차이 평균이 0인지 봅니다. 개인 차이를 빼 주어 더 민감합니다.",
    "C-04": "여러 집단 평균이 모두 같은지 F로 한 번에 봅니다. 집단 간 흩어짐÷집단 내 흩어짐이 F입니다.",
    "C-05": "두 요인(예: 집단×조건)이 점수에 미치는 주효과와 상호작용을 함께 봅니다. ‘누구에게 더 센가’가 상호작용입니다.",
    "C-06": "여러 결과 점수를 한꺼번에 두 집단으로 비교합니다. 하나가 아니라 묶음으로 다릅니다.",
    "C-07": "관심 없는 점수(공변량)의 영향을 먼저 걷어낸 뒤, 집단 평균을 비교합니다.",
    "C-08": "같은 사람을 여러 시점에서 재측정했을 때, 시점에 따라 평균이 달라지는지 봅니다.",
    "D-01": "상관계수 r는 −1~+1입니다. +면 함께 커지고, −면 반대로 움직이며, 0에 가까우면 거의 무관합니다.",
    "D-04": "교차표에서 ‘예상 칸 도수’와 ‘실제 칸 도수’ 차이를 모아 χ²로 만듭니다. 차이가 크면 연관이 있다고 봅니다.",
    "E-01": "직선 y = a + b·x에서 기울기 b는 x가 1 늘 때 y가 얼마나 변하는지입니다.",
    "E-02": "여러 x로 y를 설명할 때, 각 x의 ‘순수 기여’를 동시에 추정합니다. VIF는 설명변수끼리 너무 비슷한지 경고합니다.",
    "E-06": "X→M→Y처럼 ‘중간 길’이 있는지 봅니다. 직접 효과와 간접 효과를 나누어 읽습니다.",
    "E-07": "X의 효과가 Z 수준에 따라 달라지는지(상호작용) 봅니다.",
    "B-01": "문항들이 같은 개념을 재는지 α·ω로 봅니다. 문항 간 상관이 높을수록 값이 커집니다.",
    "B-03": "여러 문항을 몇 개의 ‘숨은 묶음(요인)’으로 줄입니다. 고유값이 큰 축이 설명을 많이 담습니다.",
    "G-01": "비슷한 사람들끼리 무리(군집)를 만듭니다. 거리와 중심(평균)으로 소속을 정합니다.",
    "cfa": "이미 그린 요인 그림이 데이터와 맞는지 적합도(CFI, TLI, RMSEA 등)로 확인합니다.",
    "path": "화살표(가설 경로)의 세기(계수)를 추정하고, 직접·간접·총효과를 읽습니다.",
    "sem": "측정(문항→잠재)과 구조(잠재→잠재)를 한 모형에서 동시에 추정합니다.",
    "sem_fix": "적합도가 낮을 때, 수정지수(MI)로 ‘어디에 화살표를 더할지’ 후보를 봅니다. 이론과 맞는지 함께 판단합니다.",
    "sem_mod": "집단·조건에 따라 경로 세기가 다른지(조절) 봅니다.",
    "mg": "여러 집단에서 측정·경로가 같은지 단계적으로 비교합니다.",
}


def formula_easy_for(m: dict) -> str:
    code = m.get("code") or m["id"]
    if code in FORMULA_EASY:
        return FORMULA_EASY[code]
    fam = code.split("-")[0] if "-" in code else code
    base = FORMULA_EASY.get(fam) or FORMULA_EASY.get(m["id"])
    if base:
        return base
    note = m.get("formulaNote") or ""
    formal = m.get("formalName") or m.get("name") or code
    return (
        f"「{formal}」의 핵심은 ‘연구 질문에 맞는 숫자(검정통계량)를 만들고, "
        f"그 숫자가 우연히 나올 법한지(p값)와 효과의 크기’를 함께 읽는 것입니다.\n"
        f"기호: 평균(x̄), 표본수(n), 분산(s²), 합(Σ)은 ‘모아서 나누고·흩어짐을 재는’ 기본 도구입니다.\n"
        f"{note}"
    ).strip()


def clean_decision(m: dict) -> str:
    formal = m.get("formalName") or m.get("name") or m["id"]
    mid = m["id"]
    if mid in SEM_TARGET:
        return f"{formal}으로 ‘{SEM_TARGET[mid]}’에 답합니다."
    target = ""
    d = m.get("decision") or ""
    mm = re.search(r"분석대상\s*=\s*([^.\n]+)", d)
    if mm:
        target = mm.group(1).strip()
    if not target:
        # 기존 decision이 이미 정제된 문장이면 분석대상만 추출 시도
        mm2 = re.search(r"‘([^’]+)’", d)
        if mm2 and "질문에 답" in d:
            target = mm2.group(1)
    if not target:
        target = m.get("legacyNewName") or ""
    if not target:
        target = "연구 질문에 맞는 요약·검정·모형 추정"
    return f"{formal}으로 ‘{target}’ 질문에 답합니다."


def build_steps(m: dict) -> list:
    formal = m.get("formalName") or m.get("name")
    eng = m.get("englishName") or ""
    demo_hint = "테스트용 데모 12종 중 연구 주제와 가까운 것을 고르면, 변수 이름이 주제로 바뀝니다."
    return [
        {
            "id": "goal",
            "title": "분석 목표 정하기",
            "why": (
                f"「{formal}」{f'({eng})' if eng else ''}로 무엇을 알고 싶은지 "
                f"한 문장으로 씁니다. 예: ‘두 집단의 ○○ 점수가 다른가?’ "
                f"목표가 분명해야 나중에 표·그림을 올바르게 읽습니다."
            ),
            "nextWhy": "목표가 정해지면, 그 목표에 필요한 열(집단·점수·문항)이 데이터에 있는지 확인합니다.",
            "example": f"예: {formal}으로 ‘차이가 있는지 / 관계가 있는지 / 모형이 맞는지’를 확인한다.",
            "choices": [
                {"id": "diff", "label": "차이·비교가 궁금", "hint": "집단·시점·조건 비교"},
                {"id": "assoc", "label": "관계·예측이 궁금", "hint": "상관·회귀·경로"},
                {"id": "struct", "label": "구조·측정이 궁금", "hint": "요인·SEM·신뢰도"},
            ],
        },
        {
            "id": "data",
            "title": "데이터·변수 확인",
            "why": (
                f"필요한 열이 있는지 표로 확인합니다. "
                f"집단 비교면 ‘집단’과 ‘점수’, 회귀면 ‘결과(y)’와 ‘설명(x)’, "
                f"요인·SEM이면 ‘문항(I1,I2…)’이 있어야 합니다. {demo_hint}"
            ),
            "nextWhy": "빈칸(결측)·이상한 값(이상치)이 많으면 결과가 흔들립니다. 미리보기로 먼저 훑습니다.",
            "example": "데모 데이터를 고른 뒤, 변수 설명 표에서 한글명·의미를 읽고 상위 8행을 확인합니다.",
            "choices": [
                {"id": "ok", "label": "열 구성 충분", "hint": "필요한 열이 있음"},
                {"id": "rename", "label": "열 이름 정리", "hint": "헤더를 알기 쉽게"},
                {"id": "miss", "label": "결측 점검", "hint": "빈 칸 비율 확인"},
            ],
        },
        {
            "id": "run",
            "title": "분석 절차 실행",
            "why": (
                f"준비가 끝나면 같은 규칙으로 숫자를 계산합니다. "
                f"평균·흩어짐·검정통계량·p값을 만들고, "
                f"이어서 ‘계산이 약속된 규칙을 지키는지’ 자체 검산(검증 여과)을 붙입니다."
            ),
            "nextWhy": "숫자만 보지 말고, 표·그림·쉬운 해석 문장까지 이어서 읽습니다.",
            "example": f"판정 힌트: {m.get('criterion') or 'p와 효과크기·적합도를 함께 보고합니다.'}",
            "choices": [
                {"id": "engine", "label": "규칙엔진 실행", "hint": "동일 규칙으로 계산"},
                {"id": "verify", "label": "검증 포함", "hint": "앵커·일관성 검산"},
                {"id": "demo", "label": "데모로 연습", "hint": "학습용 먼저"},
            ],
        },
        {
            "id": "report",
            "title": "결과 해석·보고",
            "why": (
                "정식 수치(t·F·r·α·적합도 등)와 p값, 효과의 크기를 함께 적습니다. "
                "검증 통과 여부도 짧게 남기면 ‘계산 신뢰’를 보여줄 수 있습니다."
            ),
            "nextWhy": "한계(표본·가정)와 다음 분석(사후검정·SEM 등)을 한두 문장으로 덧붙입니다.",
            "example": "보고 예: ‘집단 A 평균이 B보다 높았고(t=…, p=…), 검증 검산을 통과했다.’",
            "choices": [
                {"id": "ko", "label": "논문 문장(한국어)", "hint": "결과 절 초안"},
                {"id": "limit", "label": "한계 적기", "hint": "가정·표본"},
                {"id": "next", "label": "다음 분석", "hint": "후속 기법"},
            ],
        },
    ]


def enrich_examples(m: dict, demos: list) -> None:
    """데모 주제 기반으로 쉬운 예시 교체"""
    formal = m.get("formalName") or m.get("name")
    easy = []
    for d in (demos or [])[:6]:
        title = d.get("title") or ""
        easy.append(
            {
                "ex": f"{title} 데이터로 {formal} 연습",
                "plain": (
                    f"「{title}」데모를 불러오면 변수 이름이 연구 주제에 맞게 바뀝니다. "
                    f"미리보기에서 집단·점수를 확인한 뒤 분석 절차를 실행해 보세요."
                ),
            }
        )
    if easy:
        m["examplesEasy"] = easy
        m["examples"] = [e["ex"] for e in easy]


def display_name(m: dict) -> str:
    formal = m.get("formalName") or m.get("name") or m["id"]
    eng = m.get("englishName") or ""
    code = m.get("code") or (m["id"] if re.match(r"^[A-J]-\d{2}$", m["id"]) else "")
    if code and eng:
        return f"{formal} {code} · {eng}"
    if eng:
        return f"{formal} · {eng}"
    if code:
        return f"{formal} {code}"
    return formal


def patch_module(m: dict, demos_map: dict) -> None:
    mid = m["id"]
    # 수정1 Shapiro
    if mid == "A-04" or "Shapiro" in (m.get("formalName") or "") or "Shapiro" in (m.get("name") or ""):
        m["formalName"] = SHAPIRO_NAME
        m["name"] = SHAPIRO_NAME
        m["newName"] = SHAPIRO_NAME
        m["englishName"] = SHAPIRO_EN
        if m.get("naming"):
            m["naming"]["why"] = (
                f"정식 명칭 ‘{SHAPIRO_NAME}’은 학계에서 쓰는 정규성·분포 적합 검정 이름입니다. "
                f"Shapiro–Wilk는 정규성, Kolmogorov–Smirnov는 분포 적합(정규성 포함)에 초점을 둡니다."
            )
            m["naming"]["use"] = (
                "논문·보고서에는 위 정식 명칭과 영어명(Shapiro–Wilk · Kolmogorov–Smirnov)을 쓰고, "
                "메뉴에서도 같은 이름을 사용합니다."
            )
            m["naming"]["examples"] = [f"A-04: {SHAPIRO_NAME} / {SHAPIRO_EN}"]

    # SEM 영어명
    if mid in SEM_EN:
        m["englishName"] = SEM_EN[mid]
        m["formalName"] = m.get("formalName") or m.get("name")
        m["name"] = m["formalName"]

    # 영어명 있는 모듈: 표시용 name에 코드·영어 삽입 (hub는 formalName 우선이므로 formalName은 한글 정식 유지,
    # displayTitle 필드 추가)
    if not m.get("englishName") and mid in SEM_EN:
        m["englishName"] = SEM_EN[mid]

    m["displayTitle"] = display_name(m)
    # hub/카드용: name은 정식+코드+영어
    formal = m.get("formalName") or m.get("name")
    eng = m.get("englishName")
    code = m.get("code") or (mid if re.match(r"^[A-J]-\d{2}$", mid) else "")
    if code and not m.get("code"):
        m["code"] = code

    # 수정3 decision / formulaNote
    m["decision"] = clean_decision(m)
    m["formulaNote"] = formula_easy_for(m)
    if m.get("overviewEasy"):
        m["overviewEasy"]["plain"] = m["formulaNote"].split("\n")[0][:240]
        m["overviewEasy"]["examples"] = [
            "기호 x̄=평균, n=인원, s²=흩어짐, Σ=합, p=우연 가능성",
            "숫자는 ‘크기’와 ‘우연인지’를 같이 읽습니다.",
        ]

    # overview에서 코드/도구/위치 군더더기 약화
    ov = m.get("overview") or ""
    ov = re.sub(r"【새 명칭】[^\n]*\n?", "", ov)
    ov = re.sub(r"코드\s*[A-J]-\d{2}", "", ov)
    m["overview"] = ov.strip()

    # 수정4 steps
    m["steps"] = build_steps(m)
    # process labels sync
    m["process"] = [
        "연구 질문·가설을 쉬운 문장으로 쓰기",
        "데모·CSV에서 변수(열) 확인하기",
        "같은 규칙으로 계산·검증하기",
        "검증 성적표 확인하기",
        "표·그림·문장으로 보고하기",
    ]
    m["processDetail"] = [
        {"term": "질문", "desc": "무엇을 비교·설명할지 한 줄로 적습니다.", "examples": [f"{formal} 적용"]},
        {"term": "데이터", "desc": "데모 12종 또는 내 CSV로 열 구성을 확인합니다.", "examples": ["미리보기 8행"]},
        {
            "term": "계산",
            "desc": formula_easy_for(m)[:180],
            "examples": [m.get("criterion") or "p·효과크기"],
        },
        {"term": "검증", "desc": "앵커·일관성으로 계산기를 검산합니다.", "examples": ["검증 통과 여부"]},
        {"term": "보고", "desc": "정식 수치 + 쉬운 해석 + 그림을 함께 남깁니다.", "examples": ["PNG/PDF"]},
    ]

    demos = demos_map.get(mid) or []
    enrich_examples(m, demos)
    # 기본 샘플을 첫 데모로
    if demos:
        m["sampleCsv"] = demos[0]["csv"]

    # naming examples에 영어 표기
    if m.get("naming") and eng:
        m["naming"]["examples"] = [f"{code or mid}: {formal} / {eng}"]
        if "새 명칭" in (m["naming"].get("why") or ""):
            m["naming"]["why"] = (
                f"정식 명칭 ‘{formal}’{f'({eng})' if eng else ''}은 학계 표준 표기입니다. "
                f"화면과 논문에서 같은 이름을 씁니다."
            )
            m["naming"]["use"] = (
                f"논문·보고서에는 정식 명칭{f'({eng})' if eng else ''}을 그대로 사용합니다."
            )


def main():
    cur = json.loads(CUR.read_text(encoding="utf-8"))
    demos_map = json.loads(DEMOS.read_text(encoding="utf-8")) if DEMOS.exists() else {}
    for m in cur["modules"]:
        patch_module(m, demos_map)
        # hub 표시: name에 영어 포함
        formal = m.get("formalName") or m["name"]
        eng = m.get("englishName")
        code = m.get("code") or ""
        if eng and code:
            m["name"] = f"{formal}"
            # keep formalName as korean formal; displayTitle has full
        elif eng:
            m["name"] = formal

    # demos desc for A-04
    if "A-04" in demos_map:
        for d in demos_map["A-04"]:
            d["desc"] = d["desc"].replace(
                "Shapiro–Wilk · Kolmogorov–Smirnov",
                SHAPIRO_NAME,
            )
        DEMOS.write_text(json.dumps(demos_map, ensure_ascii=False, indent=2), encoding="utf-8")

    cur["version"] = "1.73.22"
    cur["source"] = "ux22 · formal+EN · easy formula · procedure · result explain"
    CUR.write_text(json.dumps(cur, ensure_ascii=False, indent=2), encoding="utf-8")

    # sync 47 json names if present
    if CUR47.exists():
        j = json.loads(CUR47.read_text(encoding="utf-8"))
        by = {m["id"]: m for m in cur["modules"]}
        for m in j.get("modules", []):
            if m["id"] in by:
                src = by[m["id"]]
                for k in (
                    "name",
                    "formalName",
                    "englishName",
                    "newName",
                    "decision",
                    "formulaNote",
                    "steps",
                    "overview",
                    "displayTitle",
                    "examplesEasy",
                    "process",
                    "processDetail",
                    "sampleCsv",
                    "naming",
                    "overviewEasy",
                ):
                    if k in src:
                        m[k] = src[k]
        CUR47.write_text(json.dumps(j, ensure_ascii=False, indent=2), encoding="utf-8")

    print("modules", len(cur["modules"]))
    a04 = next(x for x in cur["modules"] if x["id"] == "A-04")
    print("A-04", a04["formalName"][:60])
    c02 = next(x for x in cur["modules"] if x["id"] == "C-02")
    print("C-02 decision", c02["decision"])
    print("C-02 step2", c02["steps"][2]["title"], c02["steps"][2]["why"][:50])
    cfa = next(x for x in cur["modules"] if x["id"] == "cfa")
    print("cfa EN", cfa.get("englishName"), "title", cfa.get("displayTitle"))


if __name__ == "__main__":
    main()
