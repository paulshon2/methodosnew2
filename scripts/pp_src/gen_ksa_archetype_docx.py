# -*- coding: utf-8 -*-
"""Generate Keyword Salience Analysis DOCX: 1 × 5 × 6 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from ksa_coding_examples import candidate_rows, coding_proc_kw
from ksa_docx_profiles import METHOD_PROFILES
from ksa_figures import figures_for_analysis
from ksa_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-29.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\키워드핵심성 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "키워드핵심성 아키타입(Keyword Salience Analysis Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①연구주제 및 방법론 전통에 따라 자료수집 전략 결정",
        ["1) 연구주제 및 방법론 전통에 따라 자료수집 전략 결정하기"],
    ),
    (
        "② 전처리",
        "①자료유형별 표준 전처리(전사 또는 변수화) 수행",
        ["1) 자료유형별 표준 전처리(전사 또는 변수화) 수행하기"],
    ),
    (
        "③ 코딩",
        "①질적요소는 주제코딩,양적요소는 변수화(자료유형에 따라 선택)",
        ["1) 질적요소는 주제코딩,양적요소는 변수화(자료유형에 따라 선택)하기"],
    ),
    (
        "④ 통계기법",
        "①자료유형에 따라 기초통계~추론통계 선택적 적용",
        ["1) 자료유형에 따라 기초통계~추론통계 선택적 적용하기"],
    ),
    (
        "⑤ 결과도출",
        "①연구설계에 따른 결과 해석",
        ["1) 연구설계에 따른 결과 해석하기"],
    ),
    (
        "⑥ 최종 산출물",
        "연구방법별 결과보고서",
        ["▶ 산출물: 연구방법별 결과보고서"],
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
        return [figs[1], figs[2]] if len(figs) > 2 else figs
    if si == 4 and ti == 0:
        return [figs[1]] if len(figs) > 1 else []
    if si == 5:
        return figs
    return []


def design_spec_table(topic: dict) -> list[list[str]]:
    return [
        ["항목", "내용"],
        ["연구 주제", topic["title"]],
        ["코퍼스 규모", topic["participants"]],
        ["분석 모드", topic["mode"]],
        ["대상 코퍼스", topic["target_corpus"]],
        ["참조 코퍼스", topic["reference_corpus"]],
        ["초점", topic["focus"]],
        ["분석 키", topic["analysis_key"]],
        ["핵심성 명제(초안)", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    min_freq = 5 + s % 6
    top_n = 30 + s % 20

    if si == 0 and ti == 0:
        proc = [
            f"【수집전략】「{topic['title']}」에 대해 대상·참조 코퍼스 수집 전략을 결정한다.",
            f"【경계】대상={topic['target_corpus']} / 참조={topic['reference_corpus']}.",
            f"【전통】코퍼스언어학·키니스(keyness) 전통. ({method_name}/{method_en})",
        ]
        del_r = [
            ["항목", "결정"],
            ["대상코퍼스", topic["target_corpus"]],
            ["참조코퍼스", topic["reference_corpus"]],
            ["비교가능성", "기간·장르·매체 정합"],
            ["규모목표", topic["participants"][:28]],
            ["라이선스·윤리", "공개/동의·인용규정"],
            ["수집로그", "출처·일자·어절수"],
        ]
        return STAGES[0][2][0], proc, (["전략", "문서화"], [["로그", "Y"]]), ["코퍼스 수집 전략서"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【전처리】정제·토큰화·(선택)형태소/표제어·불용어 처리를 표준화한다.",
            f"【변수화】어휘별 대상/참조 빈도를 변수로 구축한다. 최소빈도≥{min_freq}.",
            "【QC】중복문서·인코딩·OCR 오류를 점검한다.",
        ]
        del_r = [
            ["단계", "규칙", "완료"],
            ["정제", "HTML·특수문자·중복제거", "Y"],
            ["토큰화", "어절/형태소 단위 고정", "Y"],
            ["불용어", "기능어·숫자(선택)", "Y"],
            ["빈도표", f"min_freq≥{min_freq}", "Y"],
            ["백업", "원문·처리파이프라인", "Y"],
        ]
        return STAGES[1][2][0], proc, (["전처리", "v1"], [["빈도표", "Y"]]), ["표준 전처리·빈도표"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_kw(topic, method_name, s)
        del_r = candidate_rows(topic, s)
        return STAGES[2][2][0], proc, (["후보", str(top_n)], [["주제표지", "Y"]]), ["키워드 후보·주제표지"], del_r

    if si == 3 and ti == 0:
        ll_cut = 15.13
        proc = [
            f"【통계】대상 vs 참조 2×2 빈도에서 로그우도(LL)·%DIFF 등 keyness를 산출한다. 「{topic['title']}」.",
            f"【임계】예: LL≥{ll_cut}(p<.001), 최소빈도≥{min_freq}, 상위 {top_n}어.",
            "【선택】기초빈도 요약 + 추론적 keyness 검정. 용례(concordance)로  substantive 확인.",
        ]
        del_r = [
            ["순위", "키워드", "LL", "%DIFF", "판정"],
            ["1", "전환", f"{86 + s % 10}", f"+{120 + s % 40}%", "핵심"],
            ["2", "위기", f"{72 + s % 8}", f"+{90 + s % 30}%", "핵심"],
            ["3", "책임", f"{61 + s % 7}", f"+{55 + s % 20}%", "유의"],
            ["4", topic["focus"][:4] or "현안", f"{48 + s % 6}", f"+{40 + s % 15}%", "유의"],
            ["…", "—", "—", "—", f"상위{top_n}"],
        ]
        return STAGES[3][2][0], proc, (["LL", "적용"], [["임계", "문서화"]]), ["keyness 통계표"], del_r

    if si == 4 and ti == 0:
        proc = [
            f"【해석】연구설계(대상–참조)에 따라 상위 keyness 키워드를 해석한다. 「{topic['title']}」.",
            f"【명제】{topic['hypothesis']}",
            f"【한계】코퍼스 편향·크기비·장르혼입. ({method_name}/{method_en})",
        ]
        del_r = [
            ["키워드군", "해석 요지", "용례근거", "한계"],
            ["프레임A", "정책/평가 핵심 담화", "concordance", "장르효과"],
            ["프레임B", "위기·불만 강조", "군집", "시기효과"],
            ["초점군", topic["focus"][:12], "상위LL", "고유명주의"],
            ["종합", topic["hypothesis"][:36], "통계+용례", "일반화범위"],
        ]
        return STAGES[4][2][0], proc, (["해석", "Y"], [["용례", "병행"]]), ["핵심성 결과 해석"], del_r

    # si == 5
    proc = [
        "【산출물】키워드 핵심성 분석 결과보고서 패키지.",
        f"【핵심】{topic['hypothesis']}",
        "【구성】수집전략·전처리·후보표지·keyness표·효과크기·용례·해석·한계.",
        f"【모드】{topic['mode']} · {method_name}({method_en}).",
    ]
    del_r = [
        ["파일", "내용", "비고"],
        ["keyness_report.docx", "연구방법별 결과보고서", topic["title"][:20]],
        ["corpus_log.xlsx", "대상·참조 수집로그", ""],
        ["freq_keyness.xlsx", "빈도·LL·%DIFF", ""],
        ["concordance.xlsx", "용례 샘플", ""],
        ["figA–C.png", "규모·LL·효과", ""],
        ["date", date.today().isoformat(), "v1.0"],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["deliverable", "keyness report"]]), ["결과보고서 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」을(를) {topic['mode']}로 분석할 때, "
        f"{method_name}({method_en})의 대상–참조 코퍼스·전처리·keyness 통계 절차로 "
        f"{topic['hypothesis']}을(를) 근거 있게 제시할 수 있는가?"
    )
    doc.add_paragraph(f"핵심성 명제: {topic['hypothesis']}")
    doc.add_paragraph(
        f"대상 / 참조 / 초점: {topic['target_corpus']} / {topic['reference_corpus']} / {topic['focus']}"
    )

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【키워드 핵심성 분석 설계 명세】", level=3)
    doc.add_paragraph("대상·참조 코퍼스와 keyness 설계 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = design_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "블록", "ID", "그룹", "파일", "항목", "발췌ID", "범주", "주제", "관계",
        "단계", "후보어", "순위", "키워드군", "구분",
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
    return f"키워드핵심성 아키타입-{base}({en_c}).docx"


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
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 6"
        )
        doc.add_paragraph(
            "본 문서는 키워드핵심성 아키타입의 6단계·6태스크에 따라 "
            "코퍼스 수집전략·표준 전처리·주제표지/빈도변수화·keyness(LL·효과크기)·"
            "결과 해석·연구방법별 결과보고서 패키지를 "
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
