# -*- coding: utf-8 -*-
"""Generate Epidemiology Research DOCX: 1 × 5 × 11 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from epi_coding_examples import coding_proc_na, var_dict_rows
from epi_docx_profiles import METHOD_PROFILES
from epi_figures import figures_for_analysis
from epi_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-30.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\역학연구 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "역학연구 아키타입(Epidemiology Research Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①연구설계 결정(코호트, 환자-대조군, 단면연구) →②노출·결과변수 측정자료 수집",
        [
            "1) 연구설계 결정(코호트, 환자-대조군, 단면연구)하기",
            "2) 노출·결과변수 측정자료 수집하기",
        ],
    ),
    (
        "② 전처리",
        "①교란변수 식별 및 보정변수 목록화 →②결측치·측정오류 처리",
        [
            "1) 교란변수 식별 및 보정변수 목록화하기",
            "2) 결측치·측정오류 처리하기",
        ],
    ),
    (
        "③ 코딩",
        "해당없음",
        ["1) 해당없음"],
    ),
    (
        "④ 통계기법",
        "①상대위험도(RR)/교차비(OR) 산출 →②로지스틱회귀·콕스생존분석 등으로 교란변수 보정 →③층화분석으로 효과수정(effect modification) 검토",
        [
            "1) 상대위험도(RR)/교차비(OR) 산출하기",
            "2) 로지스틱회귀·콕스생존분석 등으로 교란변수 보정하기",
            "3) 층화분석으로 효과수정(effect modification) 검토하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①위험요인-질병 간 연관성의 통계적 유의성 및 크기 제시 →②인과적 해석(Bradford Hill 기준 등) 적용",
        [
            "1) 위험요인-질병 간 연관성의 통계적 유의성 및 크기 제시하기",
            "2) 인과적 해석(Bradford Hill 기준 등) 적용하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "역학적 연관성 분석결과",
        ["▶ 산출물: 역학적 연관성 분석결과"],
    ),
]


def _seed(*parts) -> int:
    return abs(hash(tuple(parts))) % 997


def add_table(doc, headers, rows):
    tbl = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl.style = "Table Grid"
    for j, h in enumerate(headers):
        tbl.rows[0].cells[j].text = str(h)
    for i, row in enumerate(rows, 1):
        for j, val in enumerate(row):
            tbl.rows[i].cells[j].text = str(val)
    doc.add_paragraph()


def add_figure(doc, path: Path, caption: str):
    p = doc.add_paragraph()
    run = p.add_run(caption)
    run.bold = True
    run.font.size = Pt(10)
    if path.exists():
        doc.add_picture(str(path), width=Inches(5.5))
    doc.add_paragraph()


def figures_for_task(si, ti, figs):
    if si == 0 and ti == 0:
        return [figs[0]] if figs else []
    if si == 3 and ti == 0:
        return [figs[1]] if len(figs) > 1 else []
    if si == 3 and ti == 1:
        return [figs[1], figs[2]] if len(figs) > 2 else figs[1:]
    if si == 5:
        return figs
    return []


def design_spec_table(topic: dict) -> list[list[str]]:
    return [
        ["항목", "내용"],
        ["연구 주제", topic["title"]],
        ["대상·규모", topic["participants"]],
        ["연구설계", topic["mode"]],
        ["노출", topic["exposure"]],
        ["결과", topic["outcome"]],
        ["초점", topic["focus"]],
        ["분석 키", topic["analysis_key"]],
        ["연관 명제(초안)", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    mode = topic["mode"]
    use_or = "환자" in mode or "단면" in mode
    metric = "OR" if use_or else ("HR" if "생존" in mode else "RR")
    est = 1.25 + (s % 20) * 0.03
    lo = est - 0.15
    hi = est + 0.22

    if si == 0 and ti == 0:
        if "환자" in mode:
            why = "희귀 결과·과거노출 평가에 효율적. 시간성은 회상·기록으로 확보."
        elif "단면" in mode:
            why = "유병·분포 파악에 적합. 인과시간성은 제한적임을 명시."
        else:
            why = "노출→결과 시간순·발생률 기반 RR/HR 산출에 적합."
        proc = [
            f"【설계결정】「{topic['title']}」에 {mode} 설계를 채택한다.",
            f"【근거】{why}",
            f"【표집】{topic['participants']}. ({method_name}/{method_en})",
        ]
        del_r = [
            ["항목", "결정"],
            ["설계", mode],
            ["노출정의", topic["exposure"]],
            ["결과정의", topic["outcome"]],
            ["일차지표", metric],
            ["추적/매칭", "코호트추적" if "코호트" in mode else ("1:2 매칭" if "환자" in mode else "단일시점")],
            ["윤리·동의", "IRB/동의 계획"],
        ]
        return STAGES[0][2][0], proc, (["설계", mode[:8]], [["문서화", "Y"]]), ["연구설계 결정서"], del_r

    if si == 0 and ti == 1:
        proc = [
            f"【측정수집】노출={topic['exposure']}, 결과={topic['outcome']} 자료를 수집한다.",
            "【원천】설문·의무기록·환경/생체측정 등 설계에 맞게 결합한다.",
            f"【QC】측정시점·단위·결측코드를 표준화. 「{topic['title']}」.",
        ]
        del_r = [
            ["변수", "원천", "시점", "완결"],
            [topic["exposure"][:10], "설문/측정", "기준/누적", "Y"],
            [topic["outcome"][:10], "진단/등록", "발생/유병", "Y"],
            ["공변량", "기록/설문", "기준", "Y"],
            ["로그", "수집일·버전", "—", "Y"],
        ]
        return STAGES[0][2][1], proc, (["수집", "Y"], [["QC", "Y"]]), ["노출·결과 수집 로그"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【교란식별】노출·결과와 연관된 제3요인을 목록화한다.",
            "【보정집합】연령·성별·사회경제 등 + 주제 특이 교란을 선정한다.",
            f"【정당화】가능하면 DAG. 초점={topic['focus']}.",
        ]
        del_r = [
            ["후보교란", "노출연관", "결과연관", "보정포함"],
            ["age", "Y", "Y", "Y"],
            ["sex", "Y", "Y", "Y"],
            ["smoking/BMI 등", "Y/부분", "Y", "Y"],
            ["중간변수(주의)", "Y", "Y", "N(과보정방지)"],
        ]
        return STAGES[1][2][0], proc, (["교란목록", "Y"], [["DAG", "초안"]]), ["교란·보정변수 목록"], del_r

    if si == 1 and ti == 1:
        miss = 4 + s % 8
        proc = [
            f"【결측】결측률≈{miss}%를 진단하고 완전사례/다중대치 전략을 정한다.",
            "【측정오류】노출·결과 분류오류·재현성(가능 시)을 점검한다.",
            "【민감】오류·결측 가정에 따른 민감분석을 계획한다.",
        ]
        del_r = [
            ["이슈", "처리", "비고"],
            ["결측", f"MI 또는 CCA (≈{miss}%)", "패턴점검"],
            ["노출오분류", "검증하위표본", "비차별가정"],
            ["결과오분류", "진단기준 통일", ""],
            ["이상치", "윈저/제외규칙", "문서화"],
        ]
        return STAGES[1][2][1], proc, (["결측", "처리"], [["민감", "계획"]]), ["결측·측정오류 처리"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_na(topic, method_name)
        del_r = var_dict_rows(topic, s)
        return STAGES[2][2][0], proc, (["코딩단계", "N/A"], [["변수사전", "Y"]]), ["변수사전(코딩 N/A)"], del_r

    if si == 3 and ti == 0:
        proc = [
            f"【{metric}】조연관성을 산출한다. 「{topic['title']}」.",
            f"【결과(도식)】{metric}≈{est:.2f} (95% CI {lo:.2f}–{hi:.2f}).",
            f"【설계】{mode}. ({method_name})",
        ]
        del_r = [
            ["지표", "추정", "95% CI", "비고"],
            [f"조{metric}", f"{est:.2f}", f"{lo:.2f}–{hi:.2f}", "미보정"],
            ["사건수", str(80 + s % 40), "—", ""],
            ["노출군n", str(400 + s % 200), "—", ""],
        ]
        return STAGES[3][2][0], proc, ([metric, f"{est:.2f}"], [["CI", "Y"]]), [f"{metric} 산출표"], del_r

    if si == 3 and ti == 1:
        adj = est - 0.08
        model = "Cox PH" if "생존" in mode or "코호트" in mode else "로지스틱회귀"
        if "코호트" in mode and "생존" not in mode and metric == "RR":
            model = "포아송/로그이항 또는 로지스틱(보고규칙에 따름)"
        proc = [
            f"【보정】{model}로 교란변수를 보정한다.",
            f"【결과(도식)】보정 {metric}≈{adj:.2f}.",
            "【가정】비례위험/선형성·적합도를 점검한다.",
        ]
        del_r = [
            ["모형", "공변량", f"보정{metric}", "95% CI"],
            [model[:18], "age+sex+ses", f"{adj:.2f}", f"{adj-0.12:.2f}–{adj+0.18:.2f}"],
            ["+행동요인", "+smoking 등", f"{adj-0.03:.2f}", "민감"],
            ["가정점검", "PH/잔차", "통과/주의", ""],
        ]
        return STAGES[3][2][1], proc, (["보정", "Y"], [["가정", "점검"]]), ["교란보정 모형요약"], del_r

    if si == 3 and ti == 2:
        a, b = est + 0.15, est - 0.20
        proc = [
            "【층화】성·연령 등으로 층화해 효과를 비교한다.",
            f"【효과수정】층별 {metric}≈{a:.2f} vs {b:.2f} (이질성 검토).",
            "【상호작용】곱셈·덧셈 척도 상호작용을 필요 시 검정한다.",
        ]
        del_r = [
            ["층", f"{metric}", "95% CI", "판정"],
            ["Stratum A", f"{a:.2f}", f"{a-0.2:.2f}–{a+0.25:.2f}", "강"],
            ["Stratum B", f"{b:.2f}", f"{b-0.15:.2f}–{b+0.2:.2f}", "약"],
            ["상호작용p", f"{0.04 + (s % 5) * 0.02:.2f}", "—", "검토"],
            ["결론", "효과수정 가능/제한적", "—", "보고"],
        ]
        return STAGES[3][2][2], proc, (["층화", "Y"], [["EM", "검토"]]), ["층화·효과수정"], del_r

    if si == 4 and ti == 0:
        proc = [
            f"【제시】위험요인–질병 연관성의 유의성·크기를 제시한다. 「{topic['title']}」.",
            f"【요약】보정 {metric}≈{est-0.08:.2f}, CI가 1을 {'미포함' if lo > 1 or (est-0.08-0.12) > 1 else '경계/포함 가능'}.",
            "【절대위험】가능하면 위험차·NNT를 보완한다.",
        ]
        del_r = [
            ["항목", "값", "해석"],
            [f"보정{metric}", f"{est-0.08:.2f}", "연관 크기"],
            ["95% CI", f"{est-0.20:.2f}–{est+0.12:.2f}", "정밀도"],
            ["p(도식)", f"{0.01 + (s % 9) * 0.005:.3f}", "유의성"],
            ["절대지표", "RD/NNT(선택)", "실무해석"],
        ]
        return STAGES[4][2][0], proc, (["유의·크기", "Y"], [["절대", "선택"]]), ["연관성 크기·유의성"], del_r

    if si == 4 and ti == 1:
        proc = [
            f"【인과해석】Bradford Hill 기준 등으로 해석한다. 명제: {topic['hypothesis']}",
            "【체크】강도·일관성·특이성·시간성·생물학적 기울기·개연성·실험·유추.",
            "【한계】잔여교란·선택·정보편향을 명시하고 인과 단정을 자제한다.",
        ]
        del_r = [
            ["Hill항목", "본연구", "판정"],
            ["강도", f"{metric} 중등도", "부분지지"],
            ["시간성", "설계상 " + ("확보" if "코호트" in mode else "제한/회상"), ""],
            ["일관성", "선행연구 대조", "검토"],
            ["개연성", "기전 문헌", ""],
            ["종합", topic["hypothesis"][:32], "연관+조건부인과"],
        ]
        return STAGES[4][2][1], proc, (["Hill", "점검"], [["한계", "명시"]]), ["인과적 해석(Hill)"], del_r

    # si == 5
    proc = [
        "【산출물】역학적 연관성 분석결과 패키지.",
        f"【핵심】{topic['hypothesis']}",
        "【구성】설계·수집·교란/결측·(변수사전)·RR/OR·보정·층화·Hill·한계.",
        f"【설계】{mode} · {method_name}({method_en}).",
    ]
    del_r = [
        ["파일", "내용", "비고"],
        ["epi_association.docx", "역학적 연관성 결과", topic["title"][:20]],
        ["design_protocol.docx", "설계·측정정의", mode[:12]],
        ["analysis.xlsx", f"{metric}·보정·층화", ""],
        ["figA–C.png", "설계·추정·생존", ""],
        ["date", date.today().isoformat(), "v1.0"],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["deliverable", "epi association"]]), ["연관성 분석결과 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」을(를) {topic['mode']} 설계로 수행할 때, "
        f"{method_name}({method_en})의 노출·결과 측정·교란보정·RR/OR·Hill 절차로 "
        f"{topic['hypothesis']}을(를) 근거 있게 제시할 수 있는가?"
    )
    doc.add_paragraph(f"연관 명제: {topic['hypothesis']}")
    doc.add_paragraph(
        f"설계 / 노출–결과: {topic['mode']} / {topic['exposure']} → {topic['outcome']}"
    )
    doc.add_paragraph(f"대상: {topic['participants']}")

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(
        topic["analysis_key"], topic["title"], topic["mode"], fig_dir, fig_seed
    )

    doc.add_heading("【역학연구 설계 명세】", level=3)
    doc.add_paragraph("설계·노출·결과 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = design_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "블록", "ID", "그룹", "파일", "항목", "변수", "후보교란", "이슈", "지표",
        "모형", "층", "Hill항목", "구분",
    }

    for si, (slab, ssum, tasks) in enumerate(STAGES):
        doc.add_heading(slab, level=3)
        doc.add_paragraph(ssum)
        for ti, tlab in enumerate(tasks):
            _, proc, ptbl, dparas, drows = task_content(si, ti, topic, method_name, method_en)
            doc.add_heading(tlab, level=4)

            doc.add_paragraph().add_run("■ 세부 태스크(Procedural Task)").bold = True
            doc.add_paragraph(tlab)

            notes = task_step_annotations(si, ti, proc, topic["analysis_key"], topic, method_name)
            doc.add_paragraph().add_run("■ 각테스크별 주석").bold = True
            for i, (para, note) in enumerate(zip(proc, notes), start=1):
                head = doc.add_paragraph()
                head.add_run(f"({i}) 실행 절차 요지: ").bold = True
                head.add_run(para)
                for block in note.split("\n"):
                    if block.strip():
                        doc.add_paragraph(block.strip())

            doc.add_paragraph().add_run("■ 상세 실행 절차").bold = True
            for para in proc:
                doc.add_paragraph(para)
            if ptbl[1]:
                add_table(doc, ptbl[0], ptbl[1])

            doc.add_paragraph().add_run("■ 결과물 샘플(Sample Deliverable)").bold = True
            for dp in dparas:
                doc.add_paragraph(dp)
            if drows:
                if drows[0][0] in header_first or (len(drows) > 1 and len(drows[0]) == len(drows[1])):
                    add_table(doc, drows[0], drows[1:])
                else:
                    ncols = max(len(r) for r in drows)
                    hdr = ["항목"] + [f"열{i}" for i in range(1, ncols)]
                    add_table(doc, hdr[:ncols], [list(r) + [""] * (ncols - len(r)) for r in drows])

            for cap, fp in figures_for_task(si, ti, fig_bundle):
                add_figure(doc, fp, cap)
            doc.add_paragraph()


def safe_filename(name_ko: str, en: str, no: int) -> str:
    base = name_ko
    en_c = en
    for ch in '<>:"/\\|?*':
        base = base.replace(ch, "")
        en_c = en_c.replace(ch, "-")
    return f"역학연구 아키타입-{base}({en_c}).docx"


def main():
    bundle = json.loads(BUNDLE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for m in bundle["methods"]:
        no, name = m["no"], m["name"]
        prof = METHOD_PROFILES.get(no)
        if not prof:
            print("skip", no)
            continue
        doc = Document()
        sect = doc.sections[0]
        sect.top_margin = Cm(2)
        sect.bottom_margin = Cm(2)
        t = doc.add_heading(ARCHETYPE, level=0)
        t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_heading(f"연구방법: {name}({prof['en']})", level=1)
        doc.add_paragraph(
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 11"
        )
        doc.add_paragraph(
            "본 문서는 역학연구 아키타입의 6단계·11태스크에 따라 "
            "연구설계·노출/결과수집·교란/결측처리·(코딩 해당없음)·RR/OR·교란보정·"
            "층화·효과수정·연관 크기·Bradford Hill·역학적 연관성 결과 패키지를 "
            "설문·양적통계 및 민족지 샘플과 동일한 출판 형식으로 제시한다."
        )
        doc.add_page_break()
        for i, topic in enumerate(prof["topics"], 1):
            write_topic_section(doc, i, topic, name, prof["en"], no)
            if i < 5:
                doc.add_page_break()
        path = OUT_DIR / safe_filename(name, prof["en"], no)
        tmp = path.with_suffix(".docx.generating")
        doc.save(tmp)
        try:
            if path.exists():
                path.unlink()
            tmp.replace(path)
        except OSError:
            alt = path.with_name(path.stem + "_갱신본.docx")
            if alt.exists():
                alt.unlink()
            tmp.replace(alt)
            print("Wrote (locked)", alt.name)
            continue
        print("Wrote", path.name)
    print("Done.", OUT_DIR)


if __name__ == "__main__":
    main()
