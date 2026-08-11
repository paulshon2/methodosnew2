# -*- coding: utf-8 -*-
"""Generate In-depth Interview DOCX: 5 × 5 × 13 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from idi_coding_examples import (
    category_rows,
    coding_proc_cat,
    coding_proc_open,
    coding_proc_theme,
    open_code_rows,
    theme_rows,
)
from idi_docx_profiles import METHOD_PROFILES
from idi_figures import figures_for_analysis
from idi_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-15.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\심층면담 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "심층면담 아키타입(In-depth Interview Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①면담 프로토콜(반구조화) 개발 →②목적표집 모집 →③개별/QL-044 심층면담·녹음",
        [
            "1) 면담 프로토콜(반구조화 질문지) 개발하기",
            "2) 목적표집으로 참여자 모집하기",
            "3) 개별/집단(QL-044) 심층면담 진행 및 녹음하기",
        ],
    ),
    (
        "② 전처리",
        "①녹취·축어록 전사 →②전사본 익명화 및 정리",
        [
            "1) 녹취 및 축어록 전사하기",
            "2) 전사본 익명화 및 정리하기",
        ],
    ),
    (
        "③ 코딩",
        "①개방코딩 →②유사 코드 범주화 →③주제(theme) 도출(주제분석)",
        [
            "1) 개방코딩으로 초기코드 생성하기",
            "2) 유사 코드 범주화하기",
            "3) 범주를 관통하는 주제(theme) 도출하기",
        ],
    ),
    (
        "④ 통계기법",
        "①원칙적으로 통계 미사용 →②대규모 시 응답빈도표 보조 가능",
        [
            "1) 원칙적으로 통계 미사용하기",
            "2) 대규모 면담자료의 경우 응답빈도표를 보조적으로 제시하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①주제별 인용·해석 서술 →②주제 간 관계 개념적 통합",
        [
            "1) 주제별 인용문과 해석을 결합해 서술하기",
            "2) 주제 간 관계를 개념적으로 통합하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "주제별 분석결과",
        ["▶ 산출물: 주제별 분석결과"],
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
    if si == 2 and ti == 2:
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
        ["참여자", topic["participants"]],
        ["면담 모드", topic["mode"]],
        ["초점", topic["focus"]],
        ["분석 키", topic["analysis_key"]],
        ["중심 주장", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    is_fg = topic["analysis_key"].startswith("fg_") or "포커스" in topic["mode"] or "FGI" in topic["mode"]
    n_p = 10 + s % 4

    if si == 0 and ti == 0:
        proc = [
            f"【프로토콜】「{topic['title']}」 반구조 질문·탐침 개발. 초점={topic['focus']}.",
            "【구성】워밍업→핵심경험→탐침→의미/미래→마무리.",
            f"【파일럿】1–2회 예비면담. ({method_name}/{method_en})",
        ]
        del_r = [
            ["블록", "예시질문", "탐침"],
            ["워밍업", "간단히 소개해 주세요", "—"],
            ["핵심", f"{topic['focus']} 경험을 들려주세요", "그때 무엇이?"],
            ["의미", "지금은 어떻게 이해하나요", "달라진 점"],
            ["마무리", "덧붙일 말", "—"],
        ]
        return STAGES[0][2][0], proc, (["버전", "v0.9"], [["파일럿", "Y"]]), ["면담 프로토콜"], del_r

    if si == 0 and ti == 1:
        proc = [
            f"【목적표집】{topic['participants']}. 포함·제외 기준 문서화.",
            "【모집】공고·소개·눈덩이. 동의·사례비 안내.",
            f"【목표】약 {n_p}명(또는 그룹). 모드={topic['mode']}.",
        ]
        del_r = [
            ["ID", "포함이유", "모집경로", "동의"],
            ["P01", "핵심경험", "공고", "Y"],
            ["P02", "대비사례", "소개", "Y"],
            ["P03", "경계사례", "눈덩이", "Y"],
        ]
        return STAGES[0][2][1], proc, (["모집n", str(n_p)], [["다양성", "확보"]]), ["모집·표집 로그"], del_r

    if si == 0 and ti == 2:
        if is_fg:
            proc = [
                f"【FGI】6–8명×그룹, 60–90분. 「{topic['title']}」.",
                "【진행】사회자+보조. 전원 발화 촉진, 동조·침묵 관찰.",
                "【녹음】음성(+가능시 영상). 좌석배치·발화맵 메모.",
            ]
            del_r = [
                ["그룹", "n", "분", "역학메모"],
                ["G1", "7", "80", "주도발화 1명"],
                ["G2", "6", "75", "반박 활발"],
                ["G3", "8", "90", "침묵 2명"],
            ]
        else:
            proc = [
                f"【개별면담】60–90분, 녹음. 「{topic['title']}」.",
                "【촉진】반영·요약·탐침. 유도·조언 금지.",
                "【로그】일시·장소·라포·중단 여부.",
            ]
            del_r = [
                ["ID", "분", "장소", "특이"],
                ["P01", "75", "온라인/대면", ""],
                ["P02", "80", "대면", "감정고조"],
                ["P03", "70", "온라인", ""],
            ]
        return STAGES[0][2][2], proc, (["녹음", "Y"], [["프로토콜준수", "Y"]]), ["면담 진행 로그"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【축어전사】추임새·침묵 표기.",
            "【FGI】화자 라벨(P1,P2…) 필수.",
            "【QC】난해 구간 재생 대조.",
        ]
        del_r = [
            ["파일", "분량", "화자라벨", "상태"],
            ["P01.docx", "12p", "N/A(개별)", "확정"],
            ["G1.docx", "18p", "Y", "확정"],
            ["P02.docx", "11p", "N/A", "검수중"],
        ]
        return STAGES[1][2][0], proc, (["전사", "진행"], [["QC", "Y"]]), ["전사 체크"], del_r

    if si == 1 and ti == 1:
        proc = [
            "【익명화】이름·직장·지명·고유사건 재식별 요소 제거/가명.",
            "【정리】파일명·메타(날짜·모드) 통일.",
            "【보관】암호화·접근권한.",
        ]
        del_r = [
            ["항목", "처리규칙", "예"],
            ["인명", "P0x", "홍길동→P03"],
            ["기관", "가명기관", "A병원"],
            ["지명", "일반화", "지방도시"],
        ]
        return STAGES[1][2][1], proc, (["익명화", "완료"], [["키파일", "별도보관"]]), ["익명화·정리 로그"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_open(topic, method_name, s)
        del_r = open_code_rows(topic, s)
        return STAGES[2][2][0], proc, (["초기코드", str(40 + s % 20)], [["인비보", "포함"]]), ["개방코딩 표"], del_r

    if si == 2 and ti == 1:
        proc = coding_proc_cat(topic, method_name)
        del_r = category_rows(topic)
        return STAGES[2][2][1], proc, (["범주수", "4–6"], [["코드북", "v1"]]), ["범주화 표"], del_r

    if si == 2 and ti == 2:
        proc = coding_proc_theme(topic, method_name)
        del_r = theme_rows(topic)
        return STAGES[2][2][2], proc, (["주제수", "3–5"], [["반례", "점검"]]), ["주제 도출표"], del_r

    if si == 3 and ti == 0:
        proc = [
            "【원칙】통계적 가설검정 미사용.",
            "【이유】핵심은 주제·인용·해석의 설득력.",
            f"【주제】「{topic['title']}」.",
        ]
        del_r = [
            ["항목", "결정"],
            ["가설검정", "미사용"],
            ["주근거", "주제분석·인용"],
            ["보조", "선택적 빈도"],
        ]
        return STAGES[3][2][0], proc, (["검정", "N/A"], [["원칙", "질적"]]), ["통계 미사용 선언"], del_r

    if si == 3 and ti == 1:
        proc = [
            "【보조】대규모 시 주제/코드 출현 참여자 수·건수 표.",
            "【금지】빈도로 주제를 증명한다고 서술하지 않음.",
            "【제시】해석의 참고용.",
        ]
        del_r = [
            ["주제", "언급참여자수", "발췌건수", "비고"],
            ["T1", str(8 + s % 3), str(20 + s % 10), ""],
            ["T2", str(7 + s % 2), str(15 + s % 8), ""],
            ["T3", str(6 + s % 3), str(12 + s % 6), ""],
            ["T4", str(5 + s % 2), str(10 + s % 5), "초점"],
        ]
        return STAGES[3][2][1], proc, (["빈도표", "보조"], [["증명용", "N"]]), ["응답·주제 빈도(보조)"], del_r

    if si == 4 and ti == 0:
        proc = [
            f"【서술】주제별로 인용+해석. 주장 점검: {topic['hypothesis']}",
            "【균형】주제 분량·대비·부정사례.",
            f"【모드】{topic['mode']} 특성을 반영. ({method_name})",
        ]
        del_r = [
            ["주제", "대표인용", "해석요지"],
            ["T1", "「혼자 다 알아서…」", "비가시적 부담"],
            ["T2", "「잠이…」", "몸의 신호"],
            ["T3", "「그래도 버텨요」", "협상적 에이전시"],
            ["T4", f"「{topic['focus'][:10]}…」", topic["hypothesis"][:22]],
        ]
        return STAGES[4][2][0], proc, (["초안", "Y"], [["인용윤리", "가명"]]), ["주제별 서술 요지"], del_r

    if si == 4 and ti == 1:
        proc = [
            "【통합】주제 간 관계(조건–과정–결과 등)를 개념적으로 연결.",
            f"【답】연구질문에 대한 통합 명제: {topic['hypothesis']}",
            "【한계】표집·면접자·사회바람직성.",
            f"【방법】{method_name}({method_en}).",
        ]
        del_r = [
            ["관계", "연결", "함의"],
            ["T1→T3", "비가시→버티기", "지원 설계"],
            ["T2↔T4", "몸신호↔제도초점", "조기개입"],
            ["통합", "중심주장", topic["hypothesis"][:28]],
        ]
        return STAGES[4][2][1], proc, (["통합모형", "초안"], [["한계", "명시"]]), ["주제 관계 통합"], del_r

    # si == 5
    proc = [
        "【산출물】주제별 분석결과 패키지.",
        f"【핵심】{topic['hypothesis']}",
        "【구성】주제서술·인용록·코드북·프로토콜·모집로그·성찰.",
        f"【모드】{topic['mode']} · {method_name}({method_en}).",
    ]
    del_r = [
        ["파일", "내용", "비고"],
        ["themes_report.docx", "주제별 분석결과", topic["title"][:20]],
        ["quotes.xlsx", "인용록", "가명"],
        ["codebook.xlsx", "개방·범주·주제", ""],
        ["protocol.pdf", "면담 프로토콜", ""],
        ["figA–C.png", "프로토콜·주제맵·빈도", ""],
        ["date", date.today().isoformat(), "v1.0"],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["deliverable", "thematic results"]]), ["주제별 분석 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」에 대해 {topic['mode']} 심층면담으로 {topic['focus']}를 탐구할 때, "
        f"{method_name}({method_en})의 주제분석으로 {topic['hypothesis']}을(를) "
        f"근거 있게 제시할 수 있는가?"
    )
    doc.add_paragraph(f"중심 주장: {topic['hypothesis']}")
    doc.add_paragraph(
        f"참여자·모드·초점: {topic['participants']} / {topic['mode']} / {topic['focus']}"
    )

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【심층면담 설계 명세】", level=3)
    doc.add_paragraph("참여자·모드·초점 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = design_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "블록", "ID", "그룹", "파일", "항목", "발췌ID", "범주", "주제", "관계",
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
    if no in (43, 45) and name_ko == "심층면접 절차":
        base = f"{name_ko}{no}"
    en_c = en
    for ch in '<>:"/\\|?*':
        base = base.replace(ch, "")
        en_c = en_c.replace(ch, "-")
    return f"심층면담 아키타입-{base}({en_c}).docx"


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
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 13"
        )
        doc.add_paragraph(
            "본 문서는 심층면담 아키타입의 6단계·13태스크에 따라 "
            "프로토콜·목적표집·면담·전사·익명화·개방코딩·범주·주제·보조빈도·주제서술·통합 패키지를 "
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
