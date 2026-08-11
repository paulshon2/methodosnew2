# -*- coding: utf-8 -*-
"""Generate Literature Review–Evidence Synthesis DOCX: 10 × 5 × 16 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from lit_synth_coding_examples import (
    coding_proc_characteristics,
    coding_proc_themes,
    study_characteristics_codebook,
    study_coding_rows,
    theme_coding_rows,
)
from lit_synth_docx_profiles import METHOD_PROFILES
from lit_synth_figures import figures_for_analysis
from lit_synth_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-05.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\EV-007·근거합성 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "EV-007·근거합성 아키타입(Literature Review–Evidence Synthesis Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①연구질문(PICO 등) 설정 →②체계적 검색전략·다중 DB 검색 →③중복제거 후 제목·초록 스크리닝, 전문 검토",
        [
            "1) 연구질문(PICO 등) 설정하기",
            "2) 체계적 검색전략 수립 및 다중 데이터베이스 검색하기",
            "3) 중복제거 후 제목·초록 스크리닝, 전문(full-text) 검토하기",
        ],
    ),
    (
        "② 전처리",
        "①선정·배제기준에 따라 최종 포함연구 확정 →②연구질 평가 →③연구특성·결과 추출표 작성",
        [
            "1) 선정·배제기준에 따라 최종 포함연구 확정하기",
            "2) 연구질 평가(risk of bias, GRADE 등)하기",
            "3) 연구특성 및 결과 추출표(data extraction form) 작성하기",
        ],
    ),
    (
        "③ 코딩",
        "①연구특성을 표준 코딩표에 기록 →②질적 종합 시 주제별 코딩으로 결과 통합",
        [
            "1) 연구설계·표본·결과지표 등 연구특성을 표준화된 코딩표에 기록하기",
            "2) 질적 종합의 경우 주제별 코딩으로 결과 통합하기",
        ],
    ),
    (
        "④ 통계기법",
        "①개별 효과크기 산출 →②이질성 검정 →③고정/랜덤효과 통합 →④출판편향 점검",
        [
            "1) 개별연구 효과크기(OR/RR/SMD 등) 산출하기",
            "2) 이질성 검정(Q, I²)하기",
            "3) 고정/랜덤효과 모형으로 통합효과크기 산출하기",
            "4) 출판편향 점검(funnel plot, Egger)하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①통합효과·CI 제시 →②하위그룹·메타회귀 →③근거수준(GRADE 등) 평가",
        [
            "1) 통합효과크기와 신뢰구간 제시하기",
            "2) 이질성 원인에 대한 하위그룹·메타회귀 분석하기",
            "3) 근거수준(GRADE 등) 평가하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "체계적 EV-007/메타분석 보고서",
        ["▶ 산출물: 체계적 EV-007/메타분석 보고서"],
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
    if si == 1 and ti == 0:
        return [figs[0]] if figs else []
    if si == 1 and ti == 1 and len(figs) > 2:
        return [figs[2]]
    if si == 3 and ti == 2:
        return [figs[1]] if len(figs) > 1 else []
    if si == 4 and ti == 0:
        return [figs[1]] if len(figs) > 1 else []
    if si == 5:
        return figs
    return []


def is_quant_meta(akey: str) -> bool:
    return akey.startswith(("sr_", "ur_", "ssr_", "rr_")) and not akey.startswith("rr_edu")


def is_narrative_like(akey: str) -> bool:
    return akey.startswith(("nr_", "sc_", "ilr_", "ca_qual", "lrm_", "ebm_", "ca_guide", "ca_rct", "ca_obs", "ca_dx"))


def review_spec_table(topic: dict) -> list[list[str]]:
    return [
        ["항목", "내용"],
        ["고찰 주제", topic["title"]],
        ["연구질문", topic["question"]],
        ["질문 틀", topic["framework"]],
        ["DB(계획)", topic["dbs"]],
        ["설계·도구 초점", f"{topic['design']} / {topic['focus']}"],
        ["분석 키", topic["analysis_key"]],
        ["중심 주장", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    akey = topic["analysis_key"]
    quant = is_quant_meta(akey)
    n_incl = 18 + s % 22

    if si == 0 and ti == 0:
        proc = [
            f"【질문】「{topic['title']}」— {topic['question']}",
            f"【틀】{topic['framework']}. 주결과·비교·인구를 조작적으로 정의. 초점={topic['focus']}.",
            f"【고찰유형】{method_name}({method_en}). 프로토콜 초안·가능 시 사전등록.",
            "【적격】선정·배제 초안을 질문에 붙여 검색 전에 고정.",
        ]
        del_r = [
            ["요소", "진술"],
            ["Population/Concept", topic["question"][:60] + "…"],
            ["Intervention/Exposure", "프로토콜 명시"],
            ["Comparator", "usual / none / other"],
            ["Outcomes", topic["focus"]],
            ["Study designs", topic["design"]],
        ]
        return STAGES[0][2][0], proc, (["등록", "계획"], [["PROSPERO/OSF", "Y/검토"]]), ["질문서·적격기준 초안"], del_r

    if si == 0 and ti == 1:
        proc = [
            f"【DB】{topic['dbs']}. 회색문헌 포함 여부 규칙화.",
            "【검색식】불리언+통제어. 실행일·히트수·식 전문을 search_log에 보존.",
            "【검증】사서/동료 PRESS 체크리스트. 신속고찰은 DB 수 축소 내역을 명시.",
        ]
        hits = [["DB", "hits", "실행일"], ["PubMed/대표", str(420 + s), "2026-03-01"], ["Scopus/2nd", str(510 + s % 80), "2026-03-01"], ["국내DB", str(60 + s % 40), "2026-03-02"]]
        return STAGES[0][2][1], proc, (["총hits(중복전)", str(900 + s)], [["언어제한", "있음/없음"]]), ["검색 로그"], hits

    if si == 0 and ti == 2:
        unique = 800 + s % 200
        ft = 90 + s % 40
        proc = [
            f"【중복제거】unique≈{unique}.",
            f"【이중스크리닝】제목·초록 → 전문({ft}). κ≈{0.70 + (s % 15)/100:.2f}. 불일치 합의.",
            "【제외사유】인구/개입/결과/설계/전문없음 코드화. PRISMA 숫자 준비.",
        ]
        del_r = [
            ["단계", "n", "비고"],
            ["identified", str(unique + 150), "DB합"],
            ["after_dup", str(unique), ""],
            ["fulltext", str(ft), ""],
            ["included", str(n_incl), "잠정"],
            ["excluded_ft", str(ft - n_incl), "사유코드"],
        ]
        return STAGES[0][2][2], proc, (["κ", f"{0.70 + (s % 15)/100:.2f}"], [["screeners", "2"]]), ["스크리닝·제외사유"], del_r

    if si == 1 and ti == 0:
        proc = [
            f"【최종포함】n={n_incl}. 그림 A PRISMA와 숫자 일치.",
            "【목록】citation manager 공유 버전 고정. 충돌해결 로그.",
            "【우산고찰】포함 단위=SR/MA임을 명시(개별연구 아님).",
        ]
        del_r = [
            ["ID", "저자년도", "설계", "국가"],
            ["S01", "Kim2021", "RCT", "KR"],
            ["S02", "Lee2022", "RCT", "US"],
            ["S03", "Park2020", "cohort", "KR"],
            ["S04", "Choi2019", "qual/SR", "UK"],
        ]
        return STAGES[1][2][0], proc, (["included", str(n_incl)], [["prisma", "Y"]]), ["최종 포함목록"], del_r

    if si == 1 and ti == 1:
        proc = [
            f"【도구】{topic['design']} 질평가(영역별). 그림 C 요약.",
            "【이중평가】불일치 합의. 고비뚤림 비율 보고.",
            "【EBM읽기·방법론】단일 논문/지침 심층 평가표로 대체 가능.",
        ]
        del_r = [
            ["ID", "영역1", "영역2", "전체"],
            ["S01", "Low", "Some", "Some"],
            ["S02", "High", "High", "High"],
            ["S03", "Some", "Low", "Some"],
            ["요약", f"High {10 + s % 20}%", "", ""],
        ]
        return STAGES[1][2][1], proc, (["tool", topic["design"][:20]], [["dual", "Y"]]), ["질평가 요약"], del_r

    if si == 1 and ti == 2:
        proc = [
            "【추출양식】설계·n·개입·비교·결과·시점·효과·자금·COI. 파일럿 3편.",
            "【이중추출】핵심 수치 교차. 불일치→원문 재확인.",
            "【산출】extraction.xlsx.",
        ]
        del_r = [
            ["ID", "n", "outcome", "ES", "funding"],
            ["S01", "120", "primary", "-0.31", "공공"],
            ["S02", "80", "primary", "-0.12", "NR"],
            ["S03", "450", "primary", "-0.20", "공공"],
        ]
        return STAGES[1][2][2], proc, (["fields", "18+"], [["pilot", "3"]]), ["추출표 샘플"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_characteristics(topic, method_name)
        cb = study_characteristics_codebook()
        del_r = study_coding_rows(topic)
        return STAGES[2][2][0], proc, (cb[0], cb[1:]), ["특성 코딩표·적용"], del_r

    if si == 2 and ti == 1:
        proc = coding_proc_themes(topic, akey)
        del_r = theme_coding_rows(topic, akey)
        return STAGES[2][2][1], proc, (["theme_coding", "Y/부분/N/A"], [["matrix", "theme×study"]]), ["주제코딩·통합"], del_r

    if si == 3 and ti == 0:
        if quant or akey.startswith("sr_") or akey.startswith("ur_") or akey.startswith("ssr_"):
            proc = [
                "【효과크기】MD/SMD/OR 등 계산·변환. 분산·CI.",
                "【소프트웨어】R metafor / RevMan. 스크립트 보존.",
                f"【k】효과 산출 가능 연구≈{min(n_incl, 8 + s % 8)}.",
            ]
            del_r = [
                ["ID", "metric", "ES", "SE"],
                ["S01", "SMD", "-0.31", "0.09"],
                ["S02", "SMD", "-0.12", "0.11"],
                ["S03", "SMD", "-0.45", "0.14"],
                ["S05", "SMD", "-0.22", "0.10"],
            ]
        else:
            proc = [
                "【효과크기】서술·스코핑·비판적평가·EBM읽기는 통합 ES N/A 또는 개별 보고만.",
                "【대체】주제요약·질평가·적용 판단표.",
                "【명시】방법란에 N/A 사유.",
            ]
            del_r = [["항목", "처리"], ["pooled ES", "N/A"], ["대체", "서술·주제·비판적평가"], ["개별보고", "해당 시 원문 수치"]]
        return STAGES[3][2][0], proc, (["metric", "SMD/OR/N/A"], [["k", str(min(n_incl, 10))]]), ["효과크기표"], del_r

    if si == 3 and ti == 1:
        i2 = 30 + s % 45
        proc = [
            f"【이질성】I²≈{i2}%, Q p=.{10 + s % 40:02d}, τ² 보고.",
            "【해석】통계+임상/맥락. I²만으로 기계 판단 금지.",
            "【N/A】메타 미시행 시 명시.",
        ]
        del_r = [["통계", "값"], ["I²", f"{i2}%"], ["Q_p", f".{10 + s % 40:02d}"], ["τ²", "0.04"], ["해석", "중등도 이질성" if i2 < 60 else "높은 이질성"]]
        return STAGES[3][2][1], proc, (["I2", f"{i2}%"], [["model_plan", "RE"]]), ["이질성 검정"], del_r

    if si == 3 and ti == 2:
        pooled = -0.25 + (s % 15) / 100
        if quant or akey.startswith("sr_") or akey.startswith("ur_") or akey.startswith("ssr_"):
            proc = [
                f"【모형】랜덤효과(REML/DL). pooled≈{pooled:.2f}, 95% CI 제시. 그림 B.",
                "【민감도】고비뚤림 제외·고정효과 비교.",
                "【예측구간】가능 시 보고.",
            ]
            del_r = [
                ["추정", "값"],
                ["pooled", f"{pooled:.2f}"],
                ["95% CI", f"[{pooled-0.15:.2f}, {pooled+0.08:.2f}]"],
                ["k", str(min(n_incl, 10))],
                ["model", "RE"],
            ]
        else:
            proc = [
                "【통합효과】N/A — 서술/스코핑/평가 중심. 그림 B는 주제빈도 등으로 대체.",
                "【명시】합성 유형=서술·지도·비판.",
                f"【주장 연결】{topic['hypothesis']}",
            ]
            del_r = [["항목", "처리"], ["pooled", "N/A"], ["합성", "서술/주제지도"], ["그림B", "themes"]]
        return STAGES[3][2][2], proc, (["synthesis", "RE/narrative"], [["figure", "B"]]), ["통합·합성 결과"], del_r

    if si == 3 and ti == 3:
        proc = [
            f"【출판편향】funnel + Egger p=.{20 + s % 50:02d}.",
            "【주의】k 소규모 시 해석 절제. trim-and-fill 선택.",
            "【N/A】질적·소규모 서술고찰.",
        ]
        del_r = [["방법", "결과"], ["funnel", "경미한 비대칭/대칭"], ["Egger", f"p=.{20 + s % 50:02d}"], ["trimfill", "선택적"], ["판정", "편향 가능성 낮~중"]]
        return STAGES[3][2][3], proc, (["bias_check", "Y/N/A"], [["k_for_bias", str(min(n_incl, 10))]]), ["출판편향 점검"], del_r

    if si == 4 and ti == 0:
        proc = [
            f"【제시】{topic['hypothesis']}",
            "【형식】forest/주제 그림 + 본문 1–2단락. 실질적 중요(MID) 언급.",
            "【확실성】예비 GRADE와 연결.",
        ]
        del_r = [["결과", "요약"], ["본분석", "지지/부분지지"], ["CI", "제시"], ["실질해석", "작~중등 효과/맥락의존"], ["그림", "B"]]
        return STAGES[4][2][0], proc, (["primary", "reported"], [["ci", "Y"]]), ["주결과 요약"], del_r

    if si == 4 and ti == 1:
        proc = [
            "【하위그룹】설계·지역·용량·위험도(사전명세 우선).",
            f"【상호작용 p】≈.{15 + s % 40:02d} (탐색적이면 명시).",
            "【스코핑】효과검정 대신 공백·유형 분포 해석.",
        ]
        del_r = [["그룹", "ES/요약", "n"], ["RCT", "-0.30", "6"], ["observational", "-0.10", "4"], ["고비뚤림제외", f"{-0.22 + (s%10)/100:.2f}", "—"]]
        return STAGES[4][2][1], proc, (["subgroup", "Y"], [["pre_specified", "부분"]]), ["하위그룹·탐색"], del_r

    if si == 4 and ti == 2:
        proc = [
            "【GRADE】비뚤림·비일관성·간접성·부정확·출판편향 영역별 하향.",
            "【SoF】Summary of Findings.",
            "【권고】근거→실무/정책 연결은 절제·맥락화.",
        ]
        del_r = [
            ["결과", "확실성", "하향사유"],
            ["주결과", "Moderate", "비뚤림 Some"],
            ["이차결과", "Low", "비일관성·부정확"],
            ["적용성", "맥락의존", "간접성"],
        ]
        return STAGES[4][2][2], proc, (["GRADE", "done"], [["SoF", "Y"]]), ["GRADE·SoF"], del_r

    proc = [
        f"【보고서】「{topic['title']}」. 주장: {topic['hypothesis']}. 방법: {method_name}({method_en}).",
        "【구성】초록·서론·방법(PRISMA)·결과·논의·한계·이해상충·부록(검색식·제외목록·추출).",
        f"【패키지】protocol · search_log · extraction.xlsx · figures A–C · manuscript · {date.today().isoformat()}.",
        "【재현·윤리】검색일·버전·자금원·이해상충·데이터 공유 범위.",
    ]
    del_r = [
        ["유형", "파일", "내용"],
        ["본문", "review_v1.docx", "고찰 보고서"],
        ["흐름", "figA_prisma.png", "PRISMA"],
        ["합성", "figB_main.png", "forest/themes"],
        ["질평가", "figC_rob.png", "RoB"],
        ["데이터", "extraction.xlsx", "추출·코딩"],
        ["검색", "search_log.md", "식·hits"],
        ["결론", "—", topic["hypothesis"]],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["date", date.today().isoformat()]]), ["고찰·합성 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(topic["question"])
    doc.add_paragraph(f"중심 주장: {topic['hypothesis']}")
    doc.add_paragraph(f"틀·DB·설계초점: {topic['framework']} / {topic['dbs']} / {topic['design']} · {topic['focus']}")

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【고찰·질문 명세】", level=3)
    doc.add_paragraph(
        f"{method_name}({method_en}) 절차에 따른 질문·범위 명세이다. ①자료수집 태스크와 동일 체계로 확장한다."
    )
    spec = review_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "요소", "DB", "단계", "ID", "변수", "study_id", "theme_id", "항목", "통계", "추정", "방법", "결과", "그룹", "유형", "등록", "총hits(중복전)", "κ", "included", "tool", "fields", "theme_coding", "metric", "I2", "synthesis", "bias_check", "primary", "subgroup", "GRADE", "package",
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


def safe_filename(name_ko: str, en: str) -> str:
    base, en_c = name_ko, en
    for ch in '<>:"/\\|?*':
        base = base.replace(ch, "")
        en_c = en_c.replace(ch, "-")
    return f"EV-007·근거합성 아키타입-{base}({en_c}).docx"


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
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 16"
        )
        doc.add_paragraph(
            "본 문서는 EV-007·근거합성 아키타입의 6단계·16태스크에 따라 "
            "PICO·검색·스크리닝·질평가·추출·특성/주제 코딩·효과크기·이질성·통합·출판편향·GRADE·보고서 패키지를 "
            "설문·양적통계 및 민족지 샘플과 동일한 출판 형식으로 제시한다."
        )
        doc.add_page_break()
        for i, topic in enumerate(prof["topics"], 1):
            write_topic_section(doc, i, topic, name, prof["en"], no)
            if i < 5:
                doc.add_page_break()
        path = OUT_DIR / safe_filename(name, prof["en"])
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
