# -*- coding: utf-8 -*-
"""Generate Causal–Experimental Design DOCX: 9 × 5 × 12 (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from causal_exp_coding_examples import analysis_codebook, balance_rows, coding_proc_na
from causal_exp_docx_profiles import METHOD_PROFILES
from causal_exp_figures import figures_for_analysis
from causal_exp_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-07.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\인과·실험설계 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "인과·실험설계 아키타입(Causal–Experimental Design Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①연구설계 확정(무작위배정 또는 준실험 매칭) →②처치군/통제군 구성 →③사전-사후 측정 또는 반복측정 자료 수집",
        [
            "1) 연구설계 확정(무작위배정 또는 준실험 매칭)하기",
            "2) 처치군/통제군 구성하기",
            "3) 사전-사후 측정 또는 반복측정 자료 수집하기",
        ],
    ),
    (
        "② 전처리",
        "①무작위화/매칭 적절성 점검(공변량 균형성 확인) →②결측·중도탈락(attrition) 자료 처리",
        [
            "1) 무작위화/매칭 적절성 점검(공변량 균형성 확인)하기",
            "2) 결측·중도탈락(attrition) 자료 처리하기",
        ],
    ),
    (
        "③ 코딩",
        "해당없음",
        ["1) 해당없음(질적 코딩 미수행 · 분석변수 코딩만)"],
    ),
    (
        "④ 통계기법",
        "①집단 간 동질성 검정(t검정/카이제곱) →②주효과 분석: t검정/ANOVA,RDD,DID,IV 등 →③강건성 점검(민감도분석)",
        [
            "1) 집단 간 동질성 검정(t검정/카이제곱)하기",
            "2) 주효과 분석(t/ANOVA·RDD·DID·IV 등 인과추정)하기",
            "3) 강건성 점검(민감도분석)하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①처치효과 추정치와 신뢰구간 제시 →②통계적 유의성 및 실질적 효과크기 해석",
        [
            "1) 처치효과 추정치와 신뢰구간 제시하기",
            "2) 통계적 유의성 및 실질적 효과크기 해석하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "인과효과 추정치 및 신뢰구간",
        ["▶ 산출물: 인과효과 추정치 및 신뢰구간"],
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
        ["분석단위", topic["units"]],
        ["설계", topic["design"]],
        ["처치", topic["treatment"]],
        ["결과", topic["outcome"]],
        ["규모(n)", topic["n"]],
        ["분석 키", topic["analysis_key"]],
        ["중심 주장", topic["hypothesis"]],
    ]


def _estimator_label(akey: str) -> str:
    a = akey.lower()
    if "rdd" in a:
        return "국소선형 RDD (ATE at cutoff)"
    if "did" in a or a.endswith("_es") or "scm" in a:
        return "DiD / event-study / SCM ATT"
    if "iv" in a:
        return "2SLS / LATE"
    if "iptw" in a or "match" in a:
        return "ATT (matching/IPTW)"
    if "med" in a:
        return "총·직접·간접효과"
    if a.startswith("ct_") or a.startswith("doe_") or a.startswith("fe_") or a.startswith("ci1_"):
        return "ITT (및 필요시 TOT)"
    if a.startswith("cha_"):
        return "비교역사·반사실 정량관측"
    if "its" in a:
        return "ITS (수준·기울기 변화)"
    return "처치효과(ATE/ATT/ITT)"


def _main_effect_proc(topic, method_name, method_en, s):
    akey = topic["analysis_key"].lower()
    est = 0.12 + (s % 25) / 100
    se = 0.04 + (s % 10) / 200
    lo, hi = est - 1.96 * se, est + 1.96 * se
    y = topic["outcome"]
    tr = topic["treatment"]
    label = _estimator_label(akey)

    if "rdd" in akey:
        proc = [
            f"【RDD】러닝변수 컷오프 기준 국소선형·삼각커널. 대역폭={0.8 + (s % 5)/10:.1f} SD.",
            f"【추정】컷오프 통과 효과(jump) on 「{y}」: {est:.3f} (SE={se:.3f}).",
            f"【보고】점추정·95% CI [{lo:.3f}, {hi:.3f}], n={topic['n']}. ({method_name})",
        ]
        del_r = [
            ["모형", "대역폭", "추정", "SE", "95% CI"],
            ["local linear", f"{0.8 + (s % 5)/10:.1f}", f"{est:.3f}", f"{se:.3f}", f"[{lo:.3f},{hi:.3f}]"],
            ["quadratic", f"{1.0 + (s % 3)/10:.1f}", f"{est - 0.02:.3f}", f"{se + 0.01:.3f}", "—"],
        ]
    elif "iv" in akey:
        proc = [
            f"【1단계】도구→처치 「{tr}」 F={12 + s % 20:.0f} (약도구 점검).",
            f"【2SLS】「{y}」에 대한 LATE={est:.3f} (SE={se:.3f}).",
            "【가정】배제제약·단조성·독립성을 문서로 명시.",
        ]
        del_r = [
            ["단계", "계수", "SE", "F/CI"],
            ["1st stage", f"{0.25 + s/500:.3f}", "0.02", f"F={12 + s % 20}"],
            ["2SLS", f"{est:.3f}", f"{se:.3f}", f"[{lo:.3f},{hi:.3f}]"],
            ["OLS(참고)", f"{est - 0.05:.3f}", f"{se:.3f}", "편향가능"],
        ]
    elif "did" in akey or akey.endswith("_es") or "scm" in akey or "its" in akey:
        proc = [
            f"【식별】{topic['design']}: 처치×사후 상호작용 또는 이벤트스터디/ITS/SCM.",
            f"【주추정】{label} on 「{y}」= {est:.3f} (클러스터 SE={se:.3f}).",
            "【사전추세】event-study 계수 사전기간≈0 여부 확인.",
        ]
        del_r = [
            ["추정량", "값", "SE", "95% CI"],
            [label[:20], f"{est:.3f}", f"{se:.3f}", f"[{lo:.3f},{hi:.3f}]"],
            ["사전추세합", f"{0.01 + s/2000:.3f}", f"{se:.3f}", "유의X"],
            ["TWFE(참고)", f"{est - 0.03:.3f}", f"{se:.3f}", "—"],
        ]
    elif akey.startswith("cha_"):
        proc = [
            f"【비교역사】사례표·연대기와 정량관측({topic['n']})을 병행.",
            f"【관측연관】「{tr}」→「{y}」 상관계수/패널추정 {est:.3f}.",
            "【반사실】대안경로·부정사례를 명시(인과 주장 강도 조절).",
        ]
        del_r = [
            ["지표", "처치높음", "처치낮음", "차이"],
            [y[:12], f"{50 + s % 10}", f"{45 + s % 8}", f"{est * 10:.1f}"],
            ["사례수", topic["n"], "—", "—"],
        ]
    elif akey.startswith("doe_"):
        proc = [
            f"【DOE】{topic['design']}: ANOVA/요인효과. 블록·상호작용 포함.",
            f"【주효과】「{tr}」 on 「{y}」: F={8 + s % 12}, p<.05, η²={0.06 + s/500:.3f}.",
            f"【평균차】{est:.3f} (95% CI [{lo:.3f},{hi:.3f}]).",
        ]
        del_r = [
            ["효과", "SS", "F", "p", "η²"],
            ["처치", "—", f"{8 + s % 12}", "<.05", f"{0.06 + s/500:.3f}"],
            ["블록", "—", f"{3 + s % 5}", "ns/.05", "—"],
            ["잔차", "—", "—", "—", "—"],
        ]
    elif akey.startswith("ct_"):
        proc = [
            "【임상】주평가변수 ITT 분석. 비열등/우월 가설에 맞는 검정.",
            f"【효과】「{y}」 처치−대조 = {est:.3f} (SE={se:.3f}), 95% CI [{lo:.3f},{hi:.3f}].",
            "【안전성】AE 빈도·중증도 병기(해당 시).",
        ]
        del_r = [
            ["분석셋", "추정", "SE", "95% CI"],
            ["ITT", f"{est:.3f}", f"{se:.3f}", f"[{lo:.3f},{hi:.3f}]"],
            ["PP", f"{est + 0.02:.3f}", f"{se:.3f}", "—"],
            ["안전성(AE%)", f"{8 + s % 5}%", f"{10 + s % 4}%", "차이 ns"],
        ]
    else:
        proc = [
            f"【주분석】{label}: 「{tr}」→「{y}」.",
            f"【추정】{est:.3f} (SE={se:.3f}), 95% CI [{lo:.3f}, {hi:.3f}], n≈{topic['n']}.",
            f"【소프트웨어】R/Stata/Python · {method_name}({method_en}) 표준절차.",
        ]
        del_r = [
            ["추정량", "값", "SE", "95% CI", "n"],
            [label[:18], f"{est:.3f}", f"{se:.3f}", f"[{lo:.3f},{hi:.3f}]", str(topic["n"])],
        ]
    return proc, del_r, est, lo, hi


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    akey = topic["analysis_key"]

    if si == 0 and ti == 0:
        proc = [
            f"【설계】{topic['design']}로 고정. 무작위 vs 준실험 여부를 프로토콜 1면에 명시.",
            f"【식별가정】설계에 맞는 가정(병렬추세/컷오프연속/배정무시불가 등)을 문서화. 키={akey}.",
            f"【단위】분석단위={topic['units']}, 규모={topic['n']}. 클러스터 배정 여부 결정.",
            f"【사전등록】주결과 「{topic['outcome']}」, 추정량({_estimator_label(akey)}) 사전명시.",
        ]
        del_r = [
            ["항목", "결정"],
            ["설계", topic["design"]],
            ["처치", topic["treatment"]],
            ["주결과", topic["outcome"]],
            ["추정량", _estimator_label(akey)],
            ["단위", topic["units"]],
        ]
        return STAGES[0][2][0], proc, (["등록", "Y"], [["버전", "v0.9"]]), ["설계·사전등록 요약"], del_r

    if si == 0 and ti == 1:
        n_t = 100 + s % 80
        n_c = 100 + (s * 3) % 70
        proc = [
            f"【처치정의】「{topic['treatment']}」 수령 기준·시점·강도를 조작적으로 정의.",
            f"【구성】처치군/통제(또는 비교)군 배정·선정 규칙. 설계={topic['design']}.",
            "【오염】교차오염·불응·확산 가능성을 점검하고 로그에 남김.",
            f"【규모】목표 n≈{topic['n']} (예시 배정 n_T≈{n_t}, n_C≈{n_c}).",
        ]
        del_r = [
            ["집단", "정의", "n(예시)", "배정방식"],
            ["처치", topic["treatment"][:20], str(n_t), topic["design"][:14]],
            ["통제/비교", "비수령·표준·합성", str(n_c), "프로토콜"],
            ["제외", "동의거부·부적격", str(5 + s % 8), "스크린"],
        ]
        return STAGES[0][2][1], proc, (["배정완료", "Y"], [["오염위험", "중/저"]]), ["집단 구성 로그"], del_r

    if si == 0 and ti == 2:
        proc = [
            f"【측정】사전(baseline)·사후(follow-up) 또는 패널 반복. 주결과={topic['outcome']}.",
            "【도구】설문/행정/임상/센서 등 자료원·시점·담당자를 수집로그에 기록.",
            f"【주제】「{topic['title']}」 가설: {topic['hypothesis']}.",
            "【QC】이중입력·범위점검·타임스탬프 정렬.",
        ]
        del_r = [
            ["시점", "변수", "n", "완료율"],
            ["T0 사전", topic["outcome"][:12], str(400 + s), f"{92 + s % 6}%"],
            ["T1 사후", topic["outcome"][:12], str(380 + s % 30), f"{88 + s % 8}%"],
            ["공변량", "연령·성별·사전점수", "—", "100%"],
        ]
        return STAGES[0][2][2], proc, (["파형", "T0–T1"], [["QC", "pass"]]), ["측정·수집 로그"], del_r

    if si == 1 and ti == 0:
        proc = [
            "【균형성】처치 전 공변량 SMD·Love plot. |SMD|<0.1을 목표로 점검.",
            f"【무작위/매칭】{topic['design']}에 맞게 재가중·재매칭·층화 재검토.",
            "【보고】불균형 변수는 주분석에 공변량으로 조정할지 사전규칙에 따름.",
        ]
        del_r = balance_rows(s)
        return STAGES[1][2][0], proc, (["max|SMD|", f"{0.06 + (s % 8)/100:.2f}"], [["판정", "통과/주의"]]), ["균형성 진단표"], del_r

    if si == 1 and ti == 1:
        drop_t, drop_c = 8 + s % 7, 6 + s % 5
        proc = [
            f"【탈락】처치군 탈락≈{drop_t}%, 통제≈{drop_c}%. 집단별·사유별 집계.",
            "【처리규칙】완전사례 / 다중대체 / IPW 중 주분석 규칙을 선택·문서화.",
            "【민감도】탈락이 결과에 미치는 최악가정 시나리오를 준비.",
            "【흐름도】CONSORT형 n 흐름과 분석셋(ITT)을 일치시킴.",
        ]
        del_r = [
            ["집단", "T0 n", "T1 n", "탈락%", "처리"],
            ["처치", str(400 + s), str(400 + s - 30), f"{drop_t}%", "ITT+IPW"],
            ["통제", str(400 + s % 40), str(400 + s % 40 - 20), f"{drop_c}%", "동일"],
            ["차이", "—", "—", f"{abs(drop_t - drop_c)}pp", "민감도"],
        ]
        return STAGES[1][2][1], proc, (["주규칙", "ITT"], [["대체", "m=5"]]), ["결측·탈락 처리로그"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_na(topic, method_name)
        cb = analysis_codebook(topic)
        return STAGES[2][2][0], proc, (["코딩", "변수코딩만"], [["질적코딩", "N/A"]]), ["분석변수 코드북"], cb

    if si == 3 and ti == 0:
        proc = [
            "【동질성】배정/매칭 직후 배경변수 t검정·χ² 및 SMD 병기.",
            "【목적】시작 시점 집단 차이를 보여 인과 전제를 점검(유의성만으로 판단 금지).",
            f"【자료】「{topic['title']}」 사전 공변량 세트.",
        ]
        del_r = [
            ["변수", "검정", "통계량", "p", "SMD"],
            ["연령", "t", f"{0.4 + s/100:.2f}", "0.42", "0.04"],
            ["성별", "χ²", f"{0.8 + s/200:.2f}", "0.51", "0.05"],
            ["사전점수", "t", f"{1.1 + s/150:.2f}", "0.18", "0.07"],
        ]
        return STAGES[3][2][0], proc, (["판정", "대체로균형"], [["조치", "없음/조정"]]), ["동질성 검정표"], del_r

    if si == 3 and ti == 1:
        proc, del_r, _, _, _ = _main_effect_proc(topic, method_name, method_en, s)
        return STAGES[3][2][1], proc, (["추정량", _estimator_label(akey)[:16]], [["유의", "Y/경계"]]), ["주효과 추정표"], del_r

    if si == 3 and ti == 2:
        proc = [
            "【강건성】공변량 세트·대역폭·표본·대안추정량을 바꿔 재추정.",
            "【가정점검】사전추세, placebo 컷오프/시기, 밀도점프, overID 등 해당 항목.",
            "【보고】주결론이 유지되는지 요약 표로 제시.",
        ]
        del_r = [
            ["점검", "결과", "결론변화"],
            ["대안공변량", "추정±유사", "없음"],
            ["대역폭/표본", "CI 겹침", "없음"],
            ["placebo", "영효과", "가정지지"],
            ["최악탈락", "부호유지", "약화가능"],
        ]
        return STAGES[3][2][2], proc, (["통과", "3/4"], [["경고", "1"]]), ["강건성·민감도 표"], del_r

    if si == 4 and ti == 0:
        _, _, est, lo, hi = _main_effect_proc(topic, method_name, method_en, s + 1)
        proc = [
            f"【제시】처치효과={est:.3f}, 95% CI [{lo:.3f}, {hi:.3f}] ({_estimator_label(akey)}).",
            f"【대비】결과단위=「{topic['outcome']}」, 처치=「{topic['treatment']}」.",
            "【그림】점추정·CI 포레스트/이벤트스터디를 본문에 삽입.",
        ]
        del_r = [
            ["추정대상", "점추정", "95% CI", "해석단위"],
            [_estimator_label(akey)[:18], f"{est:.3f}", f"[{lo:.3f},{hi:.3f}]", topic["outcome"][:14]],
        ]
        return STAGES[4][2][0], proc, (["CI포함0", "N" if lo > 0 else "Y"], [["보고", "표+그림"]]), ["효과·CI 요약"], del_r

    if si == 4 and ti == 1:
        d = 0.25 + (s % 20) / 100
        proc = [
            f"【유의성】주추정의 p와 CI를 함께 해석(p만으로 결론 금지).",
            f"【효과크기】대략 d≈{d:.2f} 또는 결과단위 변화량으로 환산.",
            f"【실질】「{topic['hypothesis']}」 맥락에서 정책·임상·현장 의미 평가.",
            "【한계】외적타당도·가정 위반·측정오차를 명시.",
        ]
        del_r = [
            ["측면", "판단"],
            ["통계적 유의", "CI가 0 제외/포함 명시"],
            ["효과크기", f"d≈{d:.2f}"],
            ["실질적 의미", "비용·규모 대비 검토"],
            ["한계", "가정·일반화"],
        ]
        return STAGES[4][2][1], proc, (["결론강도", "중–강"], [["권고", "조건부"]]), ["유의성·효과크기 해석"], del_r

    # si == 5
    _, _, est, lo, hi = _main_effect_proc(topic, method_name, method_en, s + 2)
    proc = [
        "【산출물】인과효과 추정치·95% CI·강건성·설계문서·재현코드 패키지.",
        f"【핵심수치】{_estimator_label(akey)} = {est:.3f} [{lo:.3f}, {hi:.3f}].",
        f"【주장】{topic['hypothesis']} — 근거 표·그림과 연결.",
        "【윤리】동의·등록·데이터 보호(임상·현장 해당 시).",
    ]
    del_r = [
        ["파일", "내용", "비고"],
        ["protocol.pdf", "설계·가정·주결과", topic["design"]],
        ["table_effects.xlsx", "점추정·CI·강건성", f"{est:.3f}"],
        ["figA–C.png", "균형·설계·효과", "본문삽입"],
        ["code/", "재현 스크립트", "R/Stata/Py"],
        ["data/", "분석용(가명)", topic["n"]],
        ["결론", topic["hypothesis"], "CI해석"],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["date", date.today().isoformat()]]), ["인과효과·CI 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」에서 {topic['design']} 설계와 {method_name}({method_en}) 절차로 "
        f"{topic['hypothesis']}을(를) 식별·추정할 수 있는가?"
    )
    doc.add_paragraph(f"중심 주장: {topic['hypothesis']}")
    doc.add_paragraph(
        f"단위·처치·결과·n: {topic['units']} / {topic['treatment']} / {topic['outcome']} / {topic['n']}"
    )

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【인과·실험 설계 명세】", level=3)
    doc.add_paragraph("설계·처치·결과·식별 키 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = design_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "항목", "집단", "시점", "공변량", "변수", "모형", "단계", "추정량", "점검", "추정대상", "측면",
        "파일", "분석셋", "효과", "지표", "ID", "actor", "round",
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
    return f"인과·실험설계 아키타입-{base}({en_c}).docx"


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
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 12"
        )
        doc.add_paragraph(
            "본 문서는 인과·실험설계 아키타입의 6단계·12태스크(③코딩=해당없음)에 따라 "
            "설계확정·집단구성·측정·균형성·탈락처리·변수코딩·동질성·인과추정·강건성·효과·CI 패키지를 "
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
