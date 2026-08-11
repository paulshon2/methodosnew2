# -*- coding: utf-8 -*-
"""Generate Qualitative Meta-Synthesis DOCX: 2 × 5 × 10 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from qms_coding_examples import (
    coding_proc_synthesis,
    coding_proc_translation,
    synthesis_rows,
    translation_rows,
)
from qms_docx_profiles import METHOD_PROFILES
from qms_figures import figures_for_analysis
from qms_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-21.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\질적메타합성 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "질적메타합성 아키타입(Qualitative Meta-Synthesis Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①체계적 검색전략으로 기존 질적연구 문헌 수집 →②포함/배제 기준 적용",
        [
            "1) 체계적 검색전략으로 기존 질적연구 문헌 수집하기",
            "2) 포함/배제 기준 적용하기",
        ],
    ),
    (
        "② 전처리",
        "①연구질 평가(quality appraisal) →②각 연구의 핵심개념·주제 추출",
        [
            "1) 연구질 평가(quality appraisal)하기",
            "2) 각 연구의 핵심개념·주제 추출하기",
        ],
    ),
    (
        "③ 코딩",
        "①개별 연구의 은유·개념을 상호 \"번역\"(translation)하는 코딩 →②유사·상반 개념을 통합적 주제로 종합(synthesis)",
        [
            "1) 개별 연구의 은유·개념을 상호 \"번역\"(translation)하는 코딩하기",
            "2) 유사·상반 개념을 통합적 주제로 종합(synthesis)하기",
        ],
    ),
    (
        "④ 통계기법",
        "해당없음 — 통계적 검정을 사용하지 않음",
        ["1) 해당없음 — 통계적 검정을 사용하지 않음"],
    ),
    (
        "⑤ 결과도출",
        "①개별연구 주제를 상위개념(line of argument)으로 통합 →②통합된 개념적 틀을 새로운 해석으로 제시",
        [
            "1) 개별연구 주제를 상위개념(line of argument)으로 통합하기",
            "2) 통합된 개념적 틀을 새로운 해석으로 제시하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "통합된 질적 이론/개념",
        ["▶ 산출물: 통합된 질적 이론/개념"],
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
    if si == 0 and ti == 1:
        return [figs[0]] if figs else []
    if si == 2 and ti == 0:
        return [figs[1]] if len(figs) > 1 else []
    if si == 4 and ti == 0:
        return [figs[2]] if len(figs) > 2 else []
    if si == 5:
        return figs
    return []


def design_spec_table(topic: dict) -> list[list[str]]:
    return [
        ["항목", "내용"],
        ["연구 주제", topic["title"]],
        ["문헌 코퍼스", topic["participants"]],
        ["합성 모드", topic["mode"]],
        ["초점", topic["focus"]],
        ["분석 키", topic["analysis_key"]],
        ["중심 주장", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    n_hit = 600 + s % 400
    n_inc = 16 + s % 10

    if si == 0 and ti == 0:
        proc = [
            f"【체계적검색】「{topic['title']}」에 대해 질적연구 문헌을 체계적으로 수집한다.",
            f"【범위】{topic['participants']}. 식별 가안 n≈{n_hit}.",
            f"【기록】DB·검색식·날짜. ({method_name}/{method_en})",
        ]
        del_r = [
            ["DB", "검색식요지", "건수", "날짜"],
            ["PubMed/CINAHL", "주제+qualitative", str(n_hit // 2), "D1"],
            ["Scopus/WoS", "동의어확장", str(n_hit // 3), "D1"],
            ["수기/참고문헌", "눈덩이", str(30 + s % 20), "D2"],
            ["합계식별", "—", str(n_hit), ""],
        ]
        return STAGES[0][2][0], proc, (["식별n", str(n_hit)], [["검색식", "Y"]]), ["체계적 검색 로그"], del_r

    if si == 0 and ti == 1:
        proc = [
            "【포함/배제】사전 기준을 제목→초록→전문 단계로 적용한다.",
            f"【목표】최종 포함 약 {n_inc}편. 초점={topic['focus']}.",
            "【이중검토】불일치는 합의·제3자 중재.",
        ]
        del_r = [
            ["단계", "잔여n", "주요배제사유"],
            ["제목/초록", str(120 + s % 40), "양적only/비관련"],
            ["전문", str(40 + s % 15), "질적자료부족"],
            ["최종포함", str(n_inc), "기준충족"],
            ["포함예", "질적설계·관련현상·충분보고", ""],
        ]
        return STAGES[0][2][1], proc, (["포함n", str(n_inc)], [["PRISMA", "초안"]]), ["포함·배제 선별표"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【연구질평가】CASP 등 체크리스트로 각 연구의 품질을 평가한다.",
            "【방침】낮은 질 연구는 제외 또는 민감도분석으로 처리한다.",
            f"【적용】「{topic['title']}」 포함 문헌.",
        ]
        del_r = [
            ["연구ID", "질평가요지", "결정", "메모"],
            ["S01", "높음", "포함", ""],
            ["S02", "중", "포함(주의)", "성찰부족"],
            ["S03", "낮음", "민감도", "방법모호"],
            ["S04", "높음", "포함", ""],
        ]
        return STAGES[1][2][0], proc, (["appraisal", "Y"], [["방침", "문서화"]]), ["연구질 평가표"], del_r

    if si == 1 and ti == 1:
        proc = [
            f"【추출】각 연구의 핵심개념·주제·은유를 추출한다. 초점={topic['focus']}.",
            "【보존】원문 표현·페이지를 남긴다.",
            "【특성】참여자·맥락·방법을 함께 표로 정리한다.",
        ]
        del_r = [
            ["연구", "맥락", "핵심개념", "주제요지"],
            ["S01", "환자", "협상", "일상조율"],
            ["S02", "가족", "인정", "비가시노동"],
            ["S03", "의료진", "낙인", "도움장벽"],
            ["S04", "공통", topic["focus"][:10], topic["hypothesis"][:18]],
        ]
        return STAGES[1][2][1], proc, (["추출", "완료"], [["원문보존", "Y"]]), ["핵심개념·주제 추출표"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_translation(topic, method_name, s)
        del_r = translation_rows(topic, s)
        return STAGES[2][2][0], proc, (["번역쌍", str(20 + s % 15)], [["원문근거", "Y"]]), ["상호번역 코딩표"], del_r

    if si == 2 and ti == 1:
        proc = coding_proc_synthesis(topic, method_name)
        del_r = synthesis_rows(topic)
        return STAGES[2][2][1], proc, (["통합주제", "3–5"], [["상반보존", "Y"]]), ["통합 주제 종합표"], del_r

    if si == 3 and ti == 0:
        proc = [
            "【원칙】통계적 가설검정을 사용하지 않는다.",
            "【이유】핵심은 번역·종합·논증선(line of argument)이다.",
            f"【주제】「{topic['title']}」.",
        ]
        del_r = [
            ["항목", "결정"],
            ["가설검정", "미사용"],
            ["주근거", "번역·종합·개념틀"],
            ["보조", "연구특성 빈도표(선택)"],
        ]
        return STAGES[3][2][0], proc, (["검정", "N/A"], [["원칙", "메타합성"]]), ["통계 미사용 선언"], del_r

    if si == 4 and ti == 0:
        proc = [
            f"【논증선】개별 주제를 상위개념(line of argument)으로 통합한다. 「{topic['title']}」.",
            f"【핵심】{topic['hypothesis']}",
            f"【방법】{method_name}({method_en}).",
        ]
        del_r = [
            ["주제", "상위개념", "지지연구", "역할"],
            ["T1", "협상적 실천", "다수", "과정"],
            ["T2", "관계·인정", "다수", "조건"],
            ["T3", "재구성", "다수", "결과"],
            ["LoA", "통합논지", "전체", topic["hypothesis"][:24]],
        ]
        return STAGES[4][2][0], proc, (["LoA", "초안"], [["연결표", "Y"]]), ["논증선(line of argument) 요지"], del_r

    if si == 4 and ti == 1:
        proc = [
            "【새해석】통합된 개념적 틀을 새로운 해석으로 제시한다.",
            f"【함의】초점={topic['focus']}에 대한 실무·연구 함의.",
            "【한계】검색·언어·보고편향·이질성을 명시한다.",
        ]
        del_r = [
            ["틀요소", "정의", "함의"],
            ["과정", "협상·조율", "지원설계"],
            ["조건", "인정·안전문화", "조직개입"],
            ["결과", "새로운 정상/소속", "평가지표재정의"],
            ["신규해석", topic["hypothesis"][:30], "이론기여"],
        ]
        return STAGES[4][2][1], proc, (["개념틀", "Y"], [["한계", "명시"]]), ["통합 개념적 틀·해석"], del_r

    # si == 5
    proc = [
        "【산출물】통합된 질적 이론/개념 패키지.",
        f"【핵심】{topic['hypothesis']}",
        "【구성】검색·선별·질평가·추출·번역·종합·LoA·개념틀·한계·PRISMA.",
        f"【모드】{topic['mode']} · {method_name}({method_en}).",
    ]
    del_r = [
        ["파일", "내용", "비고"],
        ["meta_synthesis.docx", "통합 이론/개념", topic["title"][:20]],
        ["prisma.png", "선별흐름", ""],
        ["appraisal.xlsx", "연구질평가", ""],
        ["translation.xlsx", "번역·종합", ""],
        ["framework.pdf", "개념틀·LoA", ""],
        ["figA–C.png", "선별·번역·LoA", ""],
        ["date", date.today().isoformat(), "v1.0"],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["deliverable", "integrated theory"]]), ["통합 질적 이론/개념 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」에 대해 기존 질적연구를 {topic['mode']}할 때, "
        f"{method_name}({method_en})의 번역·종합·논증선 절차로 "
        f"{topic['hypothesis']}을(를) 통합 이론/개념으로 제시할 수 있는가?"
    )
    doc.add_paragraph(f"중심 주장: {topic['hypothesis']}")
    doc.add_paragraph(
        f"문헌코퍼스 / 모드 / 초점: {topic['participants']} / {topic['mode']} / {topic['focus']}"
    )

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【질적메타합성 설계 명세】", level=3)
    doc.add_paragraph("문헌 코퍼스·모드·초점 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = design_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "블록", "ID", "그룹", "파일", "항목", "발췌ID", "범주", "주제", "관계",
        "DB", "단계", "연구ID", "연구", "연구A개념", "통합주제", "틀요소", "구분",
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
    return f"질적메타합성 아키타입-{base}({en_c}).docx"


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
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 10"
        )
        doc.add_paragraph(
            "본 문서는 질적메타합성 아키타입의 6단계·10태스크에 따라 "
            "체계적검색·포함배제·연구질평가·개념추출·상호번역·종합·논증선·개념틀·통합이론 패키지를 "
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
