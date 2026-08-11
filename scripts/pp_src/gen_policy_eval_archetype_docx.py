# -*- coding: utf-8 -*-
"""Generate Policy–Program Evaluation DOCX: 10 × 5 × 14 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from policy_eval_coding_examples import (
    coding_proc_comments,
    coding_proc_criteria,
    comment_theme_rows,
    criteria_application_rows,
    criteria_codebook,
)
from policy_eval_docx_profiles import METHOD_PROFILES
from policy_eval_figures import figures_for_analysis
from policy_eval_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-06.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\정책·EP-007 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "정책·EP-007 아키타입(Policy–Program Evaluation Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①이해관계자 파악 및 평가기준 설정 →②문헌·정책자료 수집 →③설문 또는 전문가패널(델파이/AHP) 자료 수집",
        [
            "1) 이해관계자 파악 및 평가기준 설정하기",
            "2) 문헌·정책자료 수집하기",
            "3) 설문 또는 전문가패널(델파이/AHP) 자료 수집하기",
        ],
    ),
    (
        "② 전처리",
        "①평가기준별 자료 표준화 →②전문가 응답의 정량화(쌍대비교 행렬 등)",
        [
            "1) 평가기준별 자료 표준화하기",
            "2) 전문가 응답의 정량화(쌍대비교 행렬 등)하기",
        ],
    ),
    (
        "③ 코딩",
        "①문헌·면담자료를 평가기준별 범주화 코딩 →②전문가 질적 논평을 주제별 정리",
        [
            "1) 문헌·면담자료를 평가기준별 범주화 코딩하기",
            "2) 전문가 의견의 질적 논평을 주제별 정리하기",
        ],
    ),
    (
        "④ 통계기법",
        "①기술통계 →②비용-효과비율(CBA) →③AHP 가중치 →④델파이 합의도",
        [
            "1) 기술통계(평균, 표준편차) 산출하기",
            "2) 비용-효과비율 계산(EP-005)하기",
            "3) 쌍대비교 가중치 산출(AHP, 고유벡터법)하기",
            "4) 델파이 반복라운드별 합의도(사분위범위, 표준편차) 확인하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①가중치·합의수준을 종합하여 우선순위 도출 →②정책적 함의 도출",
        [
            "1) 기준별 가중치·합의수준을 종합하여 우선순위 도출하기",
            "2) 정책적 함의 도출하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "평가보고서 및 정책적 제언",
        ["▶ 산출물: 평가보고서 및 정책적 제언"],
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
    if si == 3 and ti == 0:
        return [figs[0]] if figs else []
    if si == 3 and ti == 2:
        return [figs[0]] if figs else []
    if si == 4 and ti == 0:
        return [figs[1]] if len(figs) > 1 else []
    if si == 5:
        return figs
    return []


def eval_spec_table(topic: dict) -> list[list[str]]:
    return [
        ["항목", "내용"],
        ["평가 주제", topic["title"]],
        ["이해관계자", topic["stakeholders"]],
        ["평가기준", topic["criteria"]],
        ["자료·모드", topic["mode"]],
        ["초점", topic["focus"]],
        ["분석 키", topic["analysis_key"]],
        ["중심 주장", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    akey = topic["analysis_key"]

    if si == 0 and ti == 0:
        proc = [
            f"【이해관계자】{topic['stakeholders']}. 영향·관심·권력 맵 작성.",
            f"【평가기준】{topic['criteria']} → 조작적 정의·측정원천 확정. 초점={topic['focus']}.",
            f"【범위】「{topic['title']}」의 대상·기간·지역 경계. ({method_name}/{method_en})",
            "【이용자질문】주요이용자가 답을 쓸 결정질문을 1페이지로 합의(UFE 해당 시 필수).",
        ]
        del_r = [
            ["actor", "역할", "관심", "참여방식"],
            ["수혜자", "결과 체감", "접근·효과", "설문/면담"],
            ["집행기관", "실행", "업무부담", "자료제공"],
            ["예산·정책", "의사결정", "효율·형평", "자문"],
            ["현장실무", "전달", "실현가능성", "워크숍"],
        ]
        return STAGES[0][2][0], proc, (["기준수", "4–6"], [["맵", "Y"]]), ["이해관계자·기준 정의표"], del_r

    if si == 0 and ti == 1:
        proc = [
            "【문헌·정책】법령·지침·예산서·선행평가·공표통계.",
            "【목록】출처·연도·핵심수치·공백표시.",
            "【등급】A(공식통계)·B(평가보고)·C(언론/이차).",
        ]
        del_r = [
            ["ID", "유형", "연도", "핵심내용", "등급"],
            ["P01", "법령/지침", "2024", "사업근거", "A"],
            ["P02", "평가보고서", "2023", "성과·한계", "B"],
            ["P03", "예산서", "2025", "투입", "A"],
            ["P04", "통계표", "2024", "수혜규모", "A"],
        ]
        return STAGES[0][2][1], proc, (["문서", str(15 + s % 20)], [["공백항목", "2+"]]), ["정책·문헌 목록"], del_r

    if si == 0 and ti == 2:
        if akey.startswith("delphi"):
            n = 15 + s % 8
            proc = [
                f"【델파이】전문가 {n}명, 라운드3, 익명, Likert피드백.",
                "【문항】기준·우선순위 Likert + 개방형.",
                "【회수】라운드별 응답률·탈락 사유.",
            ]
            del_r = [["round", "초청n", "응답n", "응답률"], ["R1", str(n), str(n - 2), "90%"], ["R2", str(n - 2), str(n - 3), "85%"], ["R3", str(n - 3), str(n - 3), "100%"]]
        elif akey.startswith("ahp"):
            n = 10 + s % 6
            proc = [
                f"【AHP】전문가 {n}명. Saaty 1–9 쌍대비교.",
                "【교육】일관성(CR) 안내·연습문항.",
                "【수집】온라인/면대면 행렬.",
            ]
            del_r = [["expert", "CR", "재응답"], ["E01", "0.06", "N"], ["E02", "0.12", "Y→0.08"], ["E03", "0.04", "N"]]
        elif akey.startswith("ie_"):
            proc = [
                "【영향평가 자료】행정패널·설문·대조집단 정의.",
                "【식별】DiD/매칭/RD 가정·공통추세 검토 계획.",
                "【표본】처치·비교 n, 기간.",
            ]
            del_r = [["집단", "n", "기간"], ["처치", str(400 + s), "T0–T1"], ["비교", str(400 + s % 50), "T0–T1"], ["공변량", "연령·지역·소득", "매칭"]]
        else:
            proc = [
                "【설문/행정】수혜자·실무자 설문 및/또는 성과DB.",
                f"【표본】수혜자≈{200 + s}, 실무≈{40 + s % 20}, 응답률 기록.",
                "【윤리】동의·가명.",
            ]
            del_r = [["자료", "n", "비고"], ["수혜자설문", str(200 + s), "가중선택"], ["실무자", str(40 + s % 20), ""], ["행정성과", "전수/표본", "월별"]]
        return STAGES[0][2][2], proc, (["mode", topic["mode"][:16]], [["완료", "Y"]]), ["1차 자료 수집로그"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【표준화】min-max 또는 z. 방향(높을수록 좋음) 통일.",
            f"【결측】{3 + s % 5}% — 대체/제외 규칙.",
            "【척도표】기준별 원자료→표준점수 매핑.",
        ]
        del_r = [
            ["alt", "effect_z", "equity_z", "cost_z"],
            ["A1", "1.10", "0.40", "-0.20"],
            ["A2", "0.30", "0.90", "0.50"],
            ["A3", "0.70", "0.10", "0.80"],
        ]
        return STAGES[1][2][0], proc, (["method", "minmax/z"], [["dict", "Y"]]), ["표준화 점수표"], del_r

    if si == 1 and ti == 1:
        if akey.startswith("ahp"):
            proc = [
                "【행렬】기준 쌍대비교 기하평균 집계.",
                "【CR】개인·통합. CR≥0.1 재응답.",
                "【산출】weights_v1.xlsx.",
            ]
            del_r = [
                ["", "효과", "형평", "비용"],
                ["효과", "1", "2", "3"],
                ["형평", "1/2", "1", "2"],
                ["비용", "1/3", "1/2", "1"],
            ]
        elif akey.startswith("delphi"):
            proc = [
                "【정량화】문항별 중앙값·IQR·SD.",
                "【합의기준】예: IQR≤1.",
                "【피드백】요약통계를 다음 라운드에 배포.",
            ]
            del_r = [
                ["item", "Mdn_R1", "IQR_R1", "Mdn_R3", "IQR_R3"],
                ["우선A", "4", "2.0", "5", "0.8"],
                ["우선B", "3", "2.5", "4", "1.2"],
                ["우선C", "5", "1.5", "5", "0.5"],
            ]
        else:
            proc = [
                "【정량화】평정척도(등간형) 평균·성과지표·지수화.",
                "【AHP/델파이 비해당】명시 후 설문·행정 점수 사용.",
                "【품질】신뢰구간/분산 보고.",
            ]
            del_r = [["지표", "M", "SD", "n"], ["만족", "3.8", "0.7", str(200 + s)], ["목표달성%", "72", "—", "—"], ["형평지수", "0.62", "0.11", str(40 + s % 20)]]
        return STAGES[1][2][1], proc, (["quant", "Y"], [["tool", akey[:8]]]), ["행렬·점수화 결과"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_criteria(topic, method_name)
        cb = criteria_codebook(topic)
        del_r = criteria_application_rows(topic)
        return STAGES[2][2][0], proc, (cb[0], cb[1:]), ["기준별 코딩 코드북·적용"], del_r

    if si == 2 and ti == 1:
        proc = coding_proc_comments(topic)
        del_r = comment_theme_rows()
        return STAGES[2][2][1], proc, (["themes", "4+"], [["dissent", "Y"]]), ["질적 논평 주제표"], del_r

    if si == 3 and ti == 0:
        proc = [
            f"【기술통계】전문가/응답 n≈{12 + s % 15}. 기준·대안 M·SD.",
            "【표】기술통계 + 그림 A(가중·중요도).",
            "【점검】극단응답·합의 부족 항목 플래그.",
        ]
        del_r = [
            ["기준", "M", "SD", "n"],
            ["효과", "4.2", "0.6", str(12 + s % 10)],
            ["형평", "3.9", "0.8", str(12 + s % 10)],
            ["실현", "3.5", "0.9", str(12 + s % 10)],
            ["비용", "3.1", "0.9", str(12 + s % 10)],
        ]
        return STAGES[3][2][0], proc, (["n", str(12 + s % 15)], [["items", "8+"]]), ["기술통계표"], del_r

    if si == 3 and ti == 1:
        if akey.startswith("cba"):
            proc = [
                "【CBA】편익·비용 현재가치. 할인율·기간·가정 목록.",
                "【지표】BCR·NPV. 민감도(할인율±2%p).",
                "【그림B】비용·편익 막대.",
            ]
            del_r = [
                ["항목", "값"],
                ["PV_benefit", "135"],
                ["PV_cost", "100"],
                ["BCR", "1.35"],
                ["NPV", "35"],
                ["discount", "3%"],
                ["horizon", "10y"],
            ]
        else:
            proc = [
                "【CBA】본령 아니면 N/A 또는 1인당 단가·비용효율 메모.",
                "【명시】방법란.",
                "【대체】성과 대비 단가.",
            ]
            del_r = [["항목", "처리"], ["CBA", "N/A 또는 단가메모"], ["단가", "1인당 약 12만원"], ["비고", "완전 CBA 아님"]]
        return STAGES[3][2][1], proc, (["BCR", "1.35/N/A"], [["sens", "Y/선택"]]), ["CBA·비용요약"], del_r

    if si == 3 and ti == 2:
        if akey.startswith("ahp"):
            proc = [
                "【AHP】고유벡터 가중치. 합=1. 그림 A.",
                f"【CR】통합≈{0.04 + (s % 6)/100:.2f} (<0.1).",
                "【대안점수】기준가중×대안점수.",
            ]
            del_r = [
                ["기준", "weight"],
                ["효과", "0.28"],
                ["형평", "0.22"],
                ["실현", "0.18"],
                ["비용", "0.17"],
                ["수용", "0.15"],
                ["CR", f"{0.04 + (s % 6)/100:.2f}"],
            ]
        else:
            proc = [
                "【가중치】AHP 비해당 시 설문 중요도 평균·균등가중·정책가중.",
                "【명시】가중 산식.",
                "【그림A】중요도 분포.",
            ]
            del_r = [
                ["기준", "weight", "방법"],
                ["효과", "0.30", "설문평균"],
                ["형평", "0.25", "설문평균"],
                ["실현", "0.20", "설문평균"],
                ["비용", "0.25", "설문평균"],
            ]
        return STAGES[3][2][2], proc, (["CR", "0.07/N/A"], [["method", "AHP/alt"]]), ["가중치표"], del_r

    if si == 3 and ti == 3:
        if akey.startswith("delphi"):
            proc = [
                "【합의】라운드별 IQR·SD 감소(그림 B).",
                "【중지】합의 또는 라운드 상한.",
                "【미합의】보류 목록·추가 워크숍.",
            ]
            del_r = [
                ["item", "IQR_R1", "IQR_R3", "합의"],
                ["우선A", "2.0", "0.8", "Y"],
                ["우선B", "2.5", "1.5", "N(보류)"],
                ["우선C", "1.5", "0.5", "Y"],
            ]
        else:
            proc = [
                "【델파이 합의】비해당 시 N/A. 의견분산(SD) 또는 워크숍 합의록으로 대체.",
                "【명시】.",
                "【연결】질적 논평 이견과 교차.",
            ]
            del_r = [["항목", "처리"], ["Delphi IQR", "N/A"], ["대체", "워크숍 합의록/SD"], ["이견주제", "예산·형평"]]
        return STAGES[3][2][3], proc, (["rounds", "3/N/A"], [["stop_rule", "IQR"]]), ["합의도·분산"], del_r

    if si == 4 and ti == 0:
        proc = [
            f"【우선순위/효과】{topic['hypothesis']}",
            "【산출】가중×성과 순위(그림 B) 또는 영향추정.",
            "【민감도】가중 ±10%·가정 변경(그림 C).",
        ]
        del_r = [
            ["rank", "alt/옵션", "score", "안정성"],
            ["1", "A1", "0.31", "유지"],
            ["2", "A2", "0.27", "유지"],
            ["3", "A3", "0.24", "민감"],
            ["4", "A4", "0.18", "유지"],
        ]
        return STAGES[4][2][0], proc, (["top1", "A1"], [["sensitivity", "Y"]]), ["우선순위·결과표"], del_r

    if si == 4 and ti == 1:
        proc = [
            "【함의】실행과제·담당·시기·필요자원.",
            "【형평·윤리】사각지대·부작용·수용성.",
            "【활용】이용자 다음 행동(회의·예산·매뉴얼) 명시.",
        ]
        del_r = [
            ["제언", "내용", "담당", "시기"],
            ["1", "1순위 대안 시범", "사업과", "6개월"],
            ["2", "핵심지표 축소", "기획", "분기"],
            ["3", "사각지대 보완", "전달기관", "연내"],
            ["4", "데이터 시차 개선", "정보화", "연내"],
        ]
        return STAGES[4][2][1], proc, (["recs", "3+"], [["ufe_next", "Y"]]), ["정책·활용 제언"], del_r

    proc = [
        f"【보고서】「{topic['title']}」평가. 주장: {topic['hypothesis']}. 방법: {method_name}({method_en}).",
        "【구성】요약·배경·이해관계자·기준·방법·결과(표·그림)·제언·한계·부록.",
        f"【패키지】matrices/survey · codebook · figures A–C · recommendations · {date.today().isoformat()}.",
        "【투명성】가정·할인율·CR·비교집단·이해상충.",
    ]
    del_r = [
        ["유형", "파일", "내용"],
        ["본문", "eval_report_v1.docx", "평가보고서"],
        ["가중/점수", "weights.xlsx", "AHP·설문"],
        ["코딩", "criteria_coding.xlsx", "근거발췌"],
        ["그림", "figA–C.png", "가중·순위·합의"],
        ["제언", "recs.md", "실행과제"],
        ["결론", "—", topic["hypothesis"]],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["date", date.today().isoformat()]]), ["평가·제언 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("평가질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」에서 기준({topic['criteria']})과 {method_name}({method_en}) 절차로 "
        f"{topic['hypothesis']}을(를) 뒷받침할 수 있는가?"
    )
    doc.add_paragraph(f"중심 주장: {topic['hypothesis']}")
    doc.add_paragraph(f"이해관계·모드·초점: {topic['stakeholders']} / {topic['mode']} / {topic['focus']}")

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【평가 설계 명세】", level=3)
    doc.add_paragraph("이해관계자·기준·모드 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = eval_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "actor", "ID", "round", "expert", "집단", "자료", "alt", "", "item", "지표", "발췌ID", "theme", "기준", "항목", "rank", "제언", "유형", "기준수", "문서", "mode", "method", "quant", "코드", "themes", "n", "BCR", "CR", "rounds", "top1", "recs", "package",
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
    base = f"{name_ko}{no}" if no == 175 else name_ko
    en_c = en
    for ch in '<>:"/\\|?*':
        base = base.replace(ch, "")
        en_c = en_c.replace(ch, "-")
    return f"정책·EP-007 아키타입-{base}({en_c}).docx"


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
            "본 문서는 정책·EP-007 아키타입의 6단계·14태스크에 따라 "
            "이해관계자·기준·자료·표준화·코딩·기술통계·CBA·AHP·델파이·우선순위·정책제언 패키지를 "
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
