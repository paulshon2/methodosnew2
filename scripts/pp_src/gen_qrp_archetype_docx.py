# -*- coding: utf-8 -*-
"""Generate Q Methodology–Research Programme DOCX: 2 × 5 × 14 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from qrp_coding_examples import (
    coding_proc_factor_labels,
    coding_proc_qset,
    factor_label_rows,
    qset_rows,
)
from qrp_docx_profiles import METHOD_PROFILES
from qrp_figures import figures_for_analysis
from qrp_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-23.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\GN-029·연구프로그램 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "GN-029·연구프로그램 아키타입(Q Methodology–Research Programme Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①모집단(concourse)에서 진술문(Q-set) 개발 →②응답자(P-sample) 선정 →③Q-sort 수행",
        [
            "1) 모집단(concourse)에서 진술문(Q-set) 개발하기",
            "2) 응답자(P-sample) 선정하기",
            "3) 응답자가 진술문을 정규분포 형태의 그리드에 분류(Q-sort) 수행하기",
        ],
    ),
    (
        "② 전처리",
        "①Q-sort 결과를 응답자×진술문 매트릭스로 입력 →②결측·오류 점검",
        [
            "1) Q-sort 결과를 응답자×진술문 매트릭스로 입력하기",
            "2) 결측·오류 점검하기",
        ],
    ),
    (
        "③ 코딩",
        "①개념적 코딩으로 Q-set 구성 →②요인추출 후 유형별 대표진술문 해석·명명",
        [
            "1) 진술문 개발 단계에서 개념적 코딩(모집단 발언의 범주화)으로 Q-set 구성하기",
            "2) 요인추출 후 유형별 대표진술문 해석·명명(코딩적 해석)하기",
        ],
    ),
    (
        "④ 통계기법",
        "①상관행렬 →②요인추출(centroid/PCA) →③요인회전(varimax) →④요인점수(Z-score)",
        [
            "1) 응답자 간 상관행렬 산출하기",
            "2) 요인분석(centroid법 또는 PCA)으로 요인 추출하기",
            "3) 요인회전(varimax 등)하기",
            "4) 요인점수(Z-score) 산출하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①요인(유형)별 관점 해석적 명명 →②유형 간 차이 질적 서술",
        [
            "1) 요인(유형)별 대표 진술문을 근거로 관점을 해석적으로 명명하기",
            "2) 유형 간 차이를 질적으로 서술하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "주관적 관점 유형화",
        ["▶ 산출물: 주관적 관점 유형화"],
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
    if si == 0 and ti == 2:
        return [figs[0]] if figs else []
    if si == 3 and ti == 1:
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
        ["P-sample·현장", topic["participants"]],
        ["분석 모드", topic["mode"]],
        ["초점", topic["focus"]],
        ["분석 키", topic["analysis_key"]],
        ["중심 주장", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    n_q = 40 + s % 12
    n_p = 28 + s % 14
    is_srp = topic["analysis_key"].startswith("srp_")

    if si == 0 and ti == 0:
        proc = [
            f"【concourse→Q-set】「{topic['title']}」에 대한 의견 발언을 모아 진술문 {n_q}개를 개발한다.",
            f"【출처】면담·문헌·미디어. 초점={topic['focus']}.",
            f"【균형】찬반·측면 치우침 점검. ({method_name}/{method_en})",
        ]
        del_r = [
            ["출처", "초안n", "정제후", "비고"],
            ["면담", "60", "18", ""],
            ["문헌", "40", "12", ""],
            ["미디어/정책", "30", "10", ""],
            ["최종Q-set", "—", str(n_q), "파일럿후"],
        ]
        return STAGES[0][2][0], proc, (["Q-set", str(n_q)], [["균형", "Y"]]), ["Q-set 개발 로그"], del_r

    if si == 0 and ti == 1:
        proc = [
            f"【P-sample】관점 다양성을 목표로 약 {n_p}명을 목적표집한다.",
            f"【구성】{topic['participants']}.",
            "【윤리】설명·동의·사례(필요시)·철회권.",
        ]
        del_r = [
            ["층", "목표n", "선정이유", "동의"],
            ["핵심이해관계", str(n_p // 3), "관점풍부", "Y"],
            ["경계/대비", str(n_p // 3), "이질성", "Y"],
            ["기타", str(n_p - 2 * (n_p // 3)), "보완", "Y"],
            ["합계", str(n_p), "대표표본아님", ""],
        ]
        return STAGES[0][2][1], proc, (["P-n", str(n_p)], [["다양성", "Y"]]), ["P-sample 선정표"], del_r

    if si == 0 and ti == 2:
        proc = [
            "【Q-sort】정규분포 그리드에 진술문을 강제 분류한다.",
            "【후속】±극단 칸 선택 이유를 짧게 면담·메모한다.",
            f"【기록】정렬표 저장. 「{topic['title']}」.",
        ]
        del_r = [
            ["응답자", "완료", "극단(+)요지", "극단(−)요지"],
            ["P01", "Y", "기회강조", "부담강조"],
            ["P02", "Y", "관계우려", "낙관"],
            ["P03", "Y", "제도필요", "자율"],
            ["…", "…", topic["focus"][:10], ""],
        ]
        return STAGES[0][2][2], proc, (["Q-sort", "수행"], [["후속메모", "Y"]]), ["Q-sort 수행 로그"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【매트릭스】Q-sort 점수를 응답자(행)×진술문(열) 매트릭스로 입력한다.",
            f"【규모】약 {n_p}×{n_q}.",
            "【백업】원본 정렬표와 이중저장.",
        ]
        del_r = [
            ["파일", "내용", "상태"],
            ["qmatrix.xlsx", "P×Q 점수", "입력중"],
            ["sort_photos/", "원본정렬", "보관"],
            ["codebook_q.txt", "진술ID", "확정"],
        ]
        return STAGES[1][2][0], proc, (["matrix", "Y"], [["백업", "Y"]]), ["매트릭스 입력 체크"], del_r

    if si == 1 and ti == 1:
        proc = [
            "【QC】결측·중복배치·행합계(분포) 오류를 점검한다.",
            "【조치】재분류 요청 또는 분석 제외 기준을 문서화한다.",
            f"【로그】수정 이력. 초점={topic['focus']}.",
        ]
        del_r = [
            ["점검", "발견", "조치", "잔여"],
            ["결측", "1건", "재입력", "0"],
            ["중복칸", "0", "—", "0"],
            ["분포불일치", "1건", "재분류", "0"],
            ["최종분석n", str(n_p - 1), "제외1", ""],
        ]
        return STAGES[1][2][1], proc, (["QC", "완료"], [["분석n", str(n_p - 1)]]), ["결측·오류 점검표"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_qset(topic, method_name, s)
        del_r = qset_rows(topic, s)
        return STAGES[2][2][0], proc, (["범주", "4–6"], [["파일럿", "Y"]]), ["Q-set 개념코딩·범주표"], del_r

    if si == 2 and ti == 1:
        proc = coding_proc_factor_labels(topic, method_name)
        del_r = factor_label_rows(topic)
        return STAGES[2][2][1], proc, (["유형라벨", "초안"], [["대표진술", "Y"]]), ["유형 해석·명명표"], del_r

    if si == 3 and ti == 0:
        proc = [
            "【상관행렬】응답자 간 상관을 산출한다(유사 정렬 탐지).",
            f"【주제】「{topic['title']}」.",
            "【산출】상관행렬 파일.",
        ]
        del_r = [
            ["지표", "값(도식)", "비고"],
            ["평균|r|", f"0.{35 + s % 20}", ""],
            ["고상관쌍", str(6 + s % 5), "동일유형후보"],
            ["소프트웨어", "PQMethod/Ken-Q/R", ""],
        ]
        return STAGES[3][2][0], proc, (["corr", "Y"], [["파일", "저장"]]), ["응답자 상관 요지"], del_r

    if si == 3 and ti == 1:
        proc = [
            "【요인추출】centroid 또는 PCA로 요인을 추출한다.",
            "【결정】고유값·설명분산·해석가능성을 종합한다.",
            f"【가안】요인 2–4개. ({method_name})",
        ]
        del_r = [
            ["요인", "고유값", "분산%", "채택"],
            ["F1", f"{4.5 + (s % 5) * 0.1:.1f}", "28", "Y"],
            ["F2", f"{2.4 + (s % 4) * 0.1:.1f}", "15", "Y"],
            ["F3", f"{1.3 + (s % 3) * 0.1:.1f}", "9", "검토"],
            ["F4", "0.9", "6", "N"],
        ]
        return STAGES[3][2][1], proc, (["추출", "PCA/centroid"], [["요인수", "2–3"]]), ["요인 추출 요약"], del_r

    if si == 3 and ti == 2:
        proc = [
            "【회전】varimax 등으로 요인을 회전해 해석을 용이하게 한다.",
            "【부하】유의한 요인부하 기준(예: |loading|≥0.40)을 명시한다.",
            "【정의】각 요인에 유의미하게 부하된 응답자를 표시한다.",
        ]
        del_r = [
            ["응답자", "F1", "F2", "F3", "정의"],
            ["P01", "0.72", "0.11", "0.05", "F1"],
            ["P02", "0.08", "0.68", "0.12", "F2"],
            ["P03", "0.15", "0.10", "0.61", "F3"],
            ["P04", "0.45", "0.42", "0.05", "혼합"],
        ]
        return STAGES[3][2][2], proc, (["varimax", "Y"], [["기준", "|λ|≥.40"]]), ["회전·요인부하 요지"], del_r

    if si == 3 and ti == 3:
        proc = [
            "【Z-score】요인점수로 유형별 대표 정렬을 산출한다.",
            "【구분진술】유형을 가르는 진술문을 표시한다.",
            f"【초점】{topic['focus']}.",
        ]
        del_r = [
            ["진술", "F1 Z", "F2 Z", "구분"],
            ["Q01", "+1.8", "−0.4", "F1+"],
            ["Q02", "−1.5", "+1.2", "대비"],
            ["Q03", "0.2", "+1.6", "F2+"],
            ["Q05", "+1.1", "−1.0", "초점"],
        ]
        return STAGES[3][2][3], proc, (["Z", "산출"], [["구분문", "Y"]]), ["요인점수·구분진술"], del_r

    if si == 4 and ti == 0:
        if is_srp:
            proc = [
                f"【명명】유형을 연구프로그램 언어(하드코어·보호대·문제이동)와 연결해 해석한다. 「{topic['title']}」.",
                f"【핵심】{topic['hypothesis']}",
                f"【방법】{method_name}({method_en}).",
            ]
            del_r = [
                ["유형", "이름", "하드코어/보호대 요지", "대표진술"],
                ["F1", "하드코어수호형", "기존 핵심 가정 고수", "Q01/Q04"],
                ["F2", "보호대확장형", "보조가설로 이상 흡수", "Q02"],
                ["F3", "문제이동형", "진보/퇴행 재평가", "Q05"],
            ]
        else:
            proc = [
                f"【명명】대표(±)진술문으로 관점 유형을 해석적으로 명명한다. 「{topic['title']}」.",
                f"【핵심】{topic['hypothesis']}",
                f"【방법】{method_name}({method_en}).",
            ]
            del_r = [
                ["유형", "이름", "초상요지", "대표진술"],
                ["F1", "기회확장형", "이득·확장 강조", "Q01"],
                ["F2", "관계손실형", "관계·소속 우려", "Q03"],
                ["F3", "규율·책임형", "규칙·책임 강조", "Q04"],
            ]
        return STAGES[4][2][0], proc, (["명명", "Y"], [["근거Z", "Y"]]), ["유형 해석적 명명"], del_r

    if si == 4 and ti == 1:
        proc = [
            "【차이서술】유형 간 핵심 대립·공유 지점을 질적으로 서술한다.",
            f"【함의】초점={topic['focus']}에 대한 정책/교육/임상 함의.",
            "【한계】P-sample·concourse·강제분포의 제약을 명시한다.",
        ]
        del_r = [
            ["비교축", "F1", "F2", "F3"],
            ["핵심동의", "기회", "관계", "제도"],
            ["핵심반대", "부담무시", "낙관과다", "자율과다"],
            ["공유", "변화필요", "변화필요", "변화필요"],
            ["함의", "지원설계", "관계회복", "거버넌스"],
        ]
        return STAGES[4][2][1], proc, (["차이", "서술"], [["한계", "명시"]]), ["유형 간 차이 서술"], del_r

    # si == 5
    proc = [
        "【산출물】주관적 관점 유형화 패키지.",
        f"【핵심】{topic['hypothesis']}",
        "【구성】concourse·Q-set·P-sample·매트릭스·상관·요인·Z·유형서술·함의.",
        f"【모드】{topic['mode']} · {method_name}({method_en}).",
    ]
    del_r = [
        ["파일", "내용", "비고"],
        ["q_viewpoints.docx", "주관적 관점 유형화", topic["title"][:20]],
        ["qset.xlsx", "진술문·범주", ""],
        ["qmatrix.xlsx", "P×Q", ""],
        ["factors.xlsx", "부하·Z·구분문", ""],
        ["figA–C.png", "그리드·스크리·유형", ""],
        ["date", date.today().isoformat(), "v1.0"],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["deliverable", "viewpoint typology"]]), ["주관적 관점 유형화 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」에 대해 Q-set·Q-sort·요인분석으로 주관성을 탐구할 때, "
        f"{method_name}({method_en})의 절차로 "
        f"{topic['hypothesis']}을(를) 관점 유형으로 제시할 수 있는가?"
    )
    doc.add_paragraph(f"중심 주장: {topic['hypothesis']}")
    doc.add_paragraph(
        f"P-sample / 모드 / 초점: {topic['participants']} / {topic['mode']} / {topic['focus']}"
    )

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【GN-029·연구프로그램 설계 명세】", level=3)
    doc.add_paragraph("P-sample·모드·초점 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = design_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "블록", "ID", "그룹", "파일", "항목", "발췌ID", "범주", "주제", "관계",
        "출처", "층", "응답자", "진술ID", "요인", "지표", "점검", "진술", "유형", "비교축", "구분",
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
    return f"GN-029·연구프로그램 아키타입-{base}({en_c}).docx"


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
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 14"
        )
        doc.add_paragraph(
            "본 문서는 GN-029·연구프로그램 아키타입의 6단계·14태스크에 따라 "
            "concourse·Q-set·P-sample·Q-sort·매트릭스·개념코딩·유형명명·"
            "상관·요인추출·회전·Z점수·유형서술·주관성 유형화 패키지를 "
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
