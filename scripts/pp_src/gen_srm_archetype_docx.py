# -*- coding: utf-8 -*-
"""Generate Survey Research Method DOCX: 1 × 5 × 11 (publication-grade)."""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from srm_coding_examples import coding_na_rows, desc_rows, scale_rows, test_rows
from srm_docx_profiles import METHOD_PROFILES
from srm_figures import figures_for_analysis
from srm_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-24.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\조사연구방법 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "조사연구방법 아키타입(Survey Research Method Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①모집단 정의 및 표본설계 →②설문지 개발 및 예비조사 →③본조사 실시(대면/온라인/전화)",
        [
            "1) 모집단 정의 및 표본설계하기",
            "2) 설문지 개발 및 예비조사하기",
            "3) 본조사 실시(대면/온라인/전화)하기",
        ],
    ),
    (
        "② 전처리",
        "①결측치·이상치 처리 →②척도점수 산출 및 신뢰도(Cronbach α) 검토",
        [
            "1) 결측치·이상치 처리하기",
            "2) 척도점수 산출 및 신뢰도(Cronbach α) 검토하기",
        ],
    ),
    (
        "③ 코딩",
        "해당없음(응답의 수치 변수화만 수행)",
        ["1) 해당없음(응답의 수치 변수화만 수행)"],
    ),
    (
        "④ 통계기법",
        "①기술통계 산출 →②t검정/ANOVA, 회귀분석 등 가설검정 실시",
        [
            "1) 기술통계 산출하기",
            "2) t검정/ANOVA, 회귀분석 등 가설검정 실시하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①통계적 유의성 판정 →②결과표·그래프로 정리",
        [
            "1) 통계적 유의성 판정하기",
            "2) 결과표·그래프로 정리하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "통계분석 결과보고서",
        ["▶ 산출물: 통계분석 결과보고서"],
    ),
]


def _seed(*parts) -> int:
    return abs(hash(tuple(parts))) % 997


def parse_n(sampling: str) -> int:
    m = re.search(r"n\s*=\s*([\d,]+)", sampling.replace("×", " "))
    if m:
        return int(m.group(1).replace(",", ""))
    return 300 + _seed(sampling) % 200


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
        return [figs[2]] if len(figs) > 2 else []
    if si == 5:
        return figs
    return []


def design_spec_table(topic: dict) -> list[list[str]]:
    return [
        ["항목", "내용"],
        ["연구 주제", topic["title"]],
        ["표본설계", topic["participants"]],
        ["조사 모드", topic["mode"]],
        ["초점", topic["focus"]],
        ["분석 키", topic["analysis_key"]],
        ["가설/주장", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    n = parse_n(topic["participants"])
    n_final = n - (8 + s % 12)

    if si == 0 and ti == 0:
        proc = [
            f"【모집단·표본】「{topic['title']}」 — {topic['participants']}.",
            "【설계】포함·제외·표집틀·목표응답률을 문서화한다.",
            f"【방법】{method_name}({method_en}).",
        ]
        del_r = [
            ["항목", "내용"],
            ["모집단", "연구질문에 해당하는 전체"],
            ["표집", topic["participants"]],
            ["목표n", str(n)],
            ["모드", topic["mode"]],
        ]
        return STAGES[0][2][0], proc, (["목표n", str(n)], [["설계서", "Y"]]), ["모집단·표본설계 명세"], del_r

    if si == 0 and ti == 1:
        proc = [
            f"【설문개발】구성개념({topic['focus']})에 맞춰 문항·척도를 개발한다.",
            "【예비조사】소표본으로 이해도·소요시간·예비 α를 점검한다.",
            "【개정】모호·중복·편향 문항을 수정한다.",
        ]
        del_r = [
            ["블록", "문항수", "척도", "예비결과"],
            ["인구통계", "6", "선택형", "OK"],
            ["예측변수", "5", "평정척도(등간형)5", f"α≈0.{75 + s % 8}"],
            ["결과변수", "4", "평정척도(등간형)5", f"α≈0.{72 + s % 8}"],
            ["파일럿n", str(25 + s % 15), "—", "문항개정"],
        ]
        return STAGES[0][2][1], proc, (["설문", "v0.9→v1.0"], [["파일럿", "Y"]]), ["설문·예비조사 요지"], del_r

    if si == 0 and ti == 2:
        proc = [
            f"【본조사】확정 설문으로 {topic['mode']} 자료를 수집한다.",
            f"【관리】목표 n≈{n}, 응답률·독려·품질점검 로그.",
            f"【윤리】동의·익명·철회. 「{topic['title']}」.",
        ]
        del_r = [
            ["지표", "값"],
            ["착수", "Y"],
            ["완료응답", str(n_final + 5)],
            ["유효응답", str(n_final)],
            ["응답률", f"{55 + s % 20}%"],
            ["모드", topic["mode"]],
        ]
        return STAGES[0][2][2], proc, (["수집", "완료"], [["유효n", str(n_final)]]), ["본조사 수행 로그"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【결측·이상치】처리 규칙을 정하고 적용한다.",
            "【기준】예: 문항 결측≥20% 제외, |z|>3 점검.",
            f"【결과】분석 n={n_final}.",
        ]
        del_r = [
            ["단계", "전n", "후n", "조치"],
            ["결측삭제/대체", str(n_final + 10), str(n_final + 3), "규칙적용"],
            ["이상치", str(n_final + 3), str(n_final), "윈저/제외"],
            ["최종", "—", str(n_final), "분석셋"],
        ]
        return STAGES[1][2][0], proc, (["QC", "Y"], [["분석n", str(n_final)]]), ["결측·이상치 처리표"], del_r

    if si == 1 and ti == 1:
        proc = [
            "【척도점수】문항 평균/합으로 척도점수를 산출한다.",
            "【신뢰도】Cronbach α를 검토한다(기준 .70).",
            f"【초점】{topic['focus']}.",
        ]
        del_r = scale_rows(topic, s)
        return STAGES[1][2][1], proc, (["α검토", "Y"], [["척도", "확정"]]), ["척도·신뢰도 표"], del_r

    if si == 2 and ti == 0:
        proc = [
            "【코딩】해당없음 — 질적코딩 미수행.",
            "【변수화】평정척도(등간형)·범주형 응답을 수치/더미로 코딩한다.",
            f"【주제】「{topic['title']}」.",
        ]
        del_r = coding_na_rows(topic)
        return STAGES[2][2][0], proc, (["coding", "N/A"], [["변수화", "Y"]]), ["수치 변수화 선언"], del_r

    if si == 3 and ti == 0:
        proc = [
            f"【기술통계】주요 변수의 평균·SD·빈도를 산출한다. n={n_final}.",
            f"【연관】초점={topic['focus']}의 기초 상관을 제시한다.",
            f"【방법】{method_name}.",
        ]
        del_r = desc_rows(topic, s)
        return STAGES[3][2][0], proc, (["desc", "Y"], [["표1", "준비"]]), ["기술통계 요약"], del_r

    if si == 3 and ti == 1:
        proc = [
            "【가설검정】t검정/ANOVA·회귀 등 연구가설에 맞는 분석을 실시한다.",
            "【가정】정규성·등분산·다중공선성 등을 점검한다.",
            f"【가설】{topic['hypothesis']}",
        ]
        del_r = test_rows(topic, s)
        return STAGES[3][2][1], proc, (["검정", "실시"], [["효과크기", "보고"]]), ["가설검정 요지"], del_r

    if si == 4 and ti == 0:
        proc = [
            "【유의성】α=.05 기준으로 가설 채택/기각을 판정한다.",
            f"【판정】「{topic['hypothesis']}」 — 자료상 지지(도식).",
            "【주의】통계적 유의와 실질적 중요를 구분한다.",
        ]
        del_r = [
            ["가설", "판정", "근거", "실질해석"],
            ["H1 주효과/연관", "지지", "p<.05", "효과 소–중"],
            ["H2 집단차", "부분지지", "일부집단", "맥락의존"],
            ["종합", topic["hypothesis"][:24], "—", "함의연결"],
        ]
        return STAGES[4][2][0], proc, (["판정", "Y"], [["한계", "명시"]]), ["유의성 판정표"], del_r

    if si == 4 and ti == 1:
        proc = [
            "【정리】결과표·그래프로 핵심 결과를 제시한다.",
            "【캡션】표본·척도·유의표시(*p<.05)를 명시한다.",
            "【한계】표집·측정·횡단설계의 인과추론 한계를 적는다.",
        ]
        del_r = [
            ["산출물", "내용"],
            ["Table 1", "기술통계"],
            ["Table 2", "회귀/비교"],
            ["Figure", "연관·집단비교"],
            ["한계", "표집·횡단"],
        ]
        return STAGES[4][2][1], proc, (["표그림", "Y"], [["캡션", "Y"]]), ["결과표·그래프 목록"], del_r

    # si == 5
    proc = [
        "【산출물】통계분석 결과보고서.",
        f"【핵심】{topic['hypothesis']}",
        "【구성】설계·설문·정제·α·기술통계·검정·판정·표그림·한계.",
        f"【모드】{topic['mode']} · {method_name}({method_en}).",
    ]
    del_r = [
        ["파일", "내용", "비고"],
        ["survey_report.docx", "통계분석 결과보고서", topic["title"][:20]],
        ["questionnaire.pdf", "최종설문", ""],
        ["data_clean.xlsx", "분석데이터", f"n={n_final}"],
        ["syntax.R/sps", "분석코드", ""],
        ["figA–C.png", "흐름·기술·연관", ""],
        ["date", date.today().isoformat(), "v1.0"],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["deliverable", "stats report"]]), ["통계분석 결과보고서 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」을(를) {topic['mode']} 조사로 수행할 때, "
        f"{method_name}({method_en})의 표본·설문·검정 절차로 "
        f"{topic['hypothesis']}을(를) 통계적으로 검증할 수 있는가?"
    )
    doc.add_paragraph(f"가설/주장: {topic['hypothesis']}")
    doc.add_paragraph(
        f"표본 / 모드 / 초점: {topic['participants']} / {topic['mode']} / {topic['focus']}"
    )

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【조사연구방법 설계 명세】", level=3)
    doc.add_paragraph("모집단·표본·모드·초점 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = design_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "블록", "ID", "그룹", "파일", "항목", "발췌ID", "범주", "주제", "관계",
        "지표", "단계", "척도", "변수", "분석", "가설", "산출물", "구분",
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
    return f"조사연구방법 아키타입-{base}({en_c}).docx"


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
            "본 문서는 조사연구방법 아키타입의 6단계·11태스크에 따라 "
            "모집단·표본·설문·예비·본조사·결측/이상치·척도α·수치변수화·"
            "기술통계·가설검정·유의성·표그림·결과보고서 패키지를 "
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
