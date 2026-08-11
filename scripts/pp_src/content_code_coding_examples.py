# -*- coding: utf-8 -*-
"""Codebook & coding tables for Content Analysis–Coding."""
from __future__ import annotations


def codebook_rows(topic: dict) -> list[list[str]]:
    cats = [c.strip() for c in topic.get("categories", "A/B/C").replace("·", "/").split("/") if c.strip()]
    if len(cats) < 3:
        cats = ["CatA", "CatB", "CatC", "Other"]
    rows = [["코드", "정의", "포함 예시", "제외", "결정규칙"]]
    for i, c in enumerate(cats[:5]):
        rows.append([
            f"C{i+1}_{c[:8]}",
            f"{c}에 해당하는 내용",
            f"「{c}」 명시 표현",
            "모호·타범주 우선",
            "복수허용" if i == 0 else "상호배타 우선",
        ])
    rows.append(["C99_Other", "잔여", "분류불가", "억지분류", "메모필수"])
    return rows


def pilot_rows(seed: int) -> list[list[str]]:
    return [
        ["단위ID", "코더A", "코더B", "일치", "조치"],
        ["U001", "C1", "C1", "Y", "—"],
        ["U002", "C2", "C3", "N", "논의→C2"],
        ["U003", "C1", "C1", "Y", "—"],
        ["U004", "C99", "C3", "N", "정의개정"],
        ["U005", "C2", "C2", "Y", "—"],
        ["요약", f"κ≈{0.62 + (seed % 10)/100:.2f}", "파일럿", "—", "본코딩전개정"],
    ]


def coding_sheet_rows(topic: dict, seed: int) -> list[list[str]]:
    return [
        ["단위ID", "출처", "코더A", "코더B", "합의", "메모"],
        ["U012", topic.get("corpus", "")[:14], "C1", "C1", "C1", ""],
        ["U027", "…", "C2", "C3", "C2", "경계"],
        ["U041", "…", "C1", "C1", "C1", ""],
        ["U058", "…", "C4", "C4", "C4", ""],
        [f"U{100 + seed % 50}", "…", "C2", "C2", "C2", topic.get("unit", "")[:8]],
    ]


def disagreement_rows() -> list[list[str]]:
    return [
        ["단위ID", "A", "B", "쟁점", "합의", "코드북개정"],
        ["U027", "C2", "C3", "정의 겹침", "C2", "C3 제외기준 추가"],
        ["U066", "C1", "C99", "암시적 표현", "C1", "암시 예시 추가"],
        ["U081", "C4", "C2", "복수의미", "복수허용 규칙", "다중코딩 허용 명시"],
    ]


def reliability_rows(seed: int) -> list[list[str]]:
    k = 0.74 + (seed % 12) / 100
    a = 0.71 + (seed % 10) / 100
    return [
        ["지표", "값", "구간/표본", "판정"],
        ["Cohen's κ", f"{k:.2f}", "이중코딩 20%", "양호" if k >= 0.70 else "재훈련"],
        ["Krippendorff's α", f"{a:.2f}", "동일", "수용" if a >= 0.67 else "보완"],
        ["단순일치%", f"{82 + seed % 8}%", "동일", "참고"],
        ["범주별 κ(최저)", f"{0.60 + (seed % 8)/100:.2f}", "C99", "정의강화"],
    ]


def freq_rows(topic: dict, seed: int) -> list[list[str]]:
    cats = [c.strip() for c in topic.get("categories", "A/B/C/D").replace("·", "/").split("/") if c.strip()][:4]
    if len(cats) < 4:
        cats += [f"Cat{i}" for i in range(len(cats), 4)]
    total = 200 + seed % 100
    shares = [0.34, 0.28, 0.22, 0.16]
    rows = [["범주", "n", "%", "비고"]]
    for c, sh in zip(cats, shares):
        n = int(total * sh)
        rows.append([c[:16], str(n), f"{sh*100:.1f}", ""])
    rows.append(["합계", str(total), "100", topic.get("unit", "")])
    return rows


def chisq_rows(seed: int) -> list[list[str]]:
    return [
        ["교차", "χ²", "df", "p", "Cramer's V"],
        ["범주×시기", f"{8.2 + seed % 5:.1f}", "3", f"{0.02 + (seed % 5)/100:.3f}", "0.18"],
        ["범주×매체", f"{5.1 + seed % 4:.1f}", "2", f"{0.08 + (seed % 4)/100:.3f}", "0.12"],
        ["판정", "—", "—", "일부유의", "약한–중간연관"],
    ]


def coding_proc_main(topic, method_name, seed):
    return [
        f"【본코딩】코드북 v1.0으로 「{topic['title']}」 단위({topic['unit']}) 코딩.",
        f"【독립】코더 2인 이상, 표본의 {20 + seed % 10}% 이중코딩. ({method_name})",
        f"【범주】{topic['categories']}.",
        "【산출】코딩시트(단위×코드).",
    ]


def coding_proc_resolve(topic, method_name):
    return [
        "【불일치 목록】코더A≠B 단위를 추출한다.",
        f"【논의】정의·예시 기준으로 합의. 주제 초점={topic.get('categories','')[:20]}. ({method_name})",
        "【개정】반복 쟁점은 코드북에 반영 후 필요 시 재코딩.",
        "【산출】불일치·합의 로그.",
    ]


def coding_proc_rel(topic, method_name):
    return [
        "【신뢰도】합의 전 독립코딩 구간으로 κ 및/또는 α 산출.",
        f"【보고】전체·문제범주. ({method_name})",
        "【기준】사전 목표 미달 시 재훈련.",
        "【산출】신뢰도 표.",
    ]
