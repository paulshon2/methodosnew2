# -*- coding: utf-8 -*-
"""Generate refined DOCX samples: 48 methods × 5 canonical topics × 16 tasks."""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from survey_docx_figures import figures_for_analysis
from survey_quant_docx_profiles import METHOD_PROFILES
from survey_real_items import build_questionnaire_table, questionnaire_item_count
from survey_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-01.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\설문·양적통계 아키타입-연구방법별 샘플_정교화")

ARCHETYPE = "설문·양적통계 아키타입(Survey–Quantitative Statistics Archetype)"

STAGES = [
    ("① 자료수집", "①모집단 정의 및 표본설계(확률표집/비확률표집) →②측정도구(설문지, 척도) 개발 및 예비조사(pilot test) →③본조사 실시(대면/온라인/전화 등)로 구조화된 응답자료 수집", [
        "1) 모집단 정의 및 표본설계(확률표집/비확률표집)",
        "2) 측정도구(설문지, 척도) 개발 및 예비조사(pilot test)",
        "3) 본조사 실시(대면/온라인/전화 등)로 구조화된 응답자료 수집하기",
    ]),
    ("② 전처리", "①결측치·이상치 처리 →②역채점 문항 정리 및 척도점수 산출 →③척도 신뢰도(Cronbach α) 및 타당도 검토 →④변수 코딩(가변수화 등)", [
        "1) 결측치·이상치 처리",
        "2) 역채점 문항 정리 및 척도점수 산출하기",
        "3) 척도 신뢰도(Cronbach α) 및 타당도 검토하기",
        "4) 변수 코딩(가변수화 등)",
    ]),
    ("③ 코딩", "해당없음 — 개방형 응답이 있는 경우에만 최소한의 범주코딩(가변수화) 수행, 질적코딩과는 구분", [
        "1) 해당없음 — 개방형 응답이 있는 경우에만 최소한의 범주코딩(가변수화) 수행, 질적코딩과는 구분",
    ]),
    ("④ 통계기법", "①기술통계(평균, 표준편차, 빈도) 산출 →②정규성·등분산성 등 가정 검토 →③분석목적에 따라 t검정/ANOVA, 상관·회귀분석, 요인분석/SEM 등 특화기법 적용 →④효과크기 및 통계적 유의성(p값) 해석", [
        "1) 기술통계(평균, 표준편차, 빈도) 산출하기",
        "2) 정규성·등분산성 등 가정 검토하기",
        "3) 분석목적에 따라 t검정/ANOVA, 상관·회귀분석, 요인분석/SEM 등 특화기법 적용하기",
        "4) 효과크기 및 통계적 유의성(p값) 해석하기",
    ]),
    ("⑤ 결과도출", "①가설별 통계적 유의성 판정 →②모형 적합도 지수(CFI, RMSEA 등, 해당시) 확인 →③결과표·그래프로 정리하여 해석", [
        "1) 가설별 통계적 유의성 판정",
        "2) 모형 적합도 지수(CFI, RMSEA 등, 해당시) 확인하기",
        "3) 결과표·그래프로 정리하여 해석하기",
    ]),
    ("⑥ 최종 산출물", "통계분석 결과표 및 모형 적합도", [
        "▶ 산출물: 통계분석 결과표 및 모형 적합도",
    ]),
]


def _seed(*parts) -> int:
    return abs(hash(tuple(parts))) % 997


def parse_n(sampling: str) -> int:
    m = re.search(r"n\s*=\s*([\d,]+)", sampling.replace("×", " "))
    if m:
        return int(m.group(1).replace(",", ""))
    m2 = re.search(r"([\d,]+)×", sampling)
    if m2:
        return int(m2.group(1).replace(",", ""))
    return 300 + _seed(sampling) % 200


def add_table(doc: Document, headers: list[str], rows: list[list[str]]):
    tbl = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl.style = "Table Grid"
    for j, h in enumerate(headers):
        tbl.rows[0].cells[j].text = h
    for i, row in enumerate(rows, 1):
        for j, val in enumerate(row):
            tbl.rows[i].cells[j].text = str(val)
    doc.add_paragraph()


def add_bullets(doc: Document, items: list[str]):
    for it in items:
        doc.add_paragraph(it, style="List Bullet")


def add_figure(doc: Document, path: Path, caption: str):
    p = doc.add_paragraph()
    run = p.add_run(caption)
    run.bold = True
    run.font.size = Pt(10)
    if path.exists():
        doc.add_picture(str(path), width=Inches(5.6))
    doc.add_paragraph()


def figures_for_task(stage_i: int, task_i: int, figs: list[tuple[str, Path]]) -> list[tuple[str, Path]]:
    if not figs:
        return []
    if stage_i == 3:
        if task_i == 0:
            return figs[:1]
        if task_i == 2:
            return figs[1:2]
        if task_i == 3:
            return figs
    if stage_i == 5 and task_i == 0:
        return figs
    return []


def _effect_size_rows(akey: str, seed: int) -> list[list[str]]:
    d = 0.38 + (seed % 15) / 100
    return [
        ["가설", "검定통계量", "p", "효과크기", "95% CI", "해석"],
        ["H1 (주)", "t/F/χ² 등", f".{(seed % 35 + 10):03d}", f"Cohen's d={d:.2f}", f"[{d-0.12:.2f}, {d+0.12:.2f}]", "실질적으로 유의"],
        ["H0 (보조)", "—", f".{(seed % 50 + 40):03d}", "—", "—", "기각·보류 사유 기록"],
    ]


def build_questionnaire(topic: dict, method_name: str) -> list[list[str]]:
    return build_questionnaire_table(topic, method_name)


def task_content(stage_i: int, task_i: int, topic: dict, method_name: str, method_en: str) -> tuple[str, list[str], tuple[list[str], list[list[str]]], list[str], list[list[str]]]:
    """Returns: task_label, procedure_paragraphs, procedure_tables (as header+rows flattened), deliverable_paras, deliverable_table rows."""
    n_target = parse_n(topic["sampling"])
    seed = _seed(method_name, topic["title"], stage_i, task_i)
    n_actual = n_target - (seed % 25)
    resp_rate = 72 + (seed % 18)
    alpha = 0.78 + (seed % 12) / 100
    akey = topic["analysis_key"]

    if stage_i == 0 and task_i == 0:
        proc = [
            f"【모집단 정의】연구주제 「{topic['title']}」에 맞춰 모집단을 「{topic['population']}」으로 operationalize하였다. "
            f"포함기준: (1) 조사 시점 기준 해당 경험/자격 보유 (2) 만 18세 이상 또는 연구별 연령 범위 충족 (3) 설문 완료 의사·개인정보 동의. "
            f"제외기준: 관련 업종 종사자(오염 응답), 최근 6개월 내 동일 조사 참여, 표본틀 외 거주.",
            f"【표본틀·리스트】표본틀 출처: {topic['frame']}. 리스트 항목: respondent_id, 성명(가명), 연락처, 성별, 연령, 거주지역(시·도·구), "
            f"층(stratum_code), 표집확률(weight), 접촉상태(contact_status: 미접촉/거절/완료), 조사일, 면접원ID.",
            f"【표본설계】{topic['sampling']}. 무응답 대체: 동일 층 내 무작위 대체 1회. 설계효과·표준오차는 QT-038 문서에 별도 산출.",
        ]
        tbl_h = ["항목", "내용"]
        tbl_r = [
            ["모집단", topic["population"]],
            ["표본틀", topic["frame"]],
            ["표집방법", topic["sampling"]],
            ["목표 표본수 n", str(n_target)],
            ["예상 완료 n", str(n_actual)],
            ["조사방식", topic["mode"]],
        ]
        del_p = ["표본설계서·표집 리스트(익명화) 일부"]
        del_r = [["단계", "기록"], ["표집", f"n_target={n_target}, strata=성별×연령"], ["완료", f"n={n_actual}, RR={resp_rate}%"]]
        return (
            STAGES[0][2][0],
            proc,
            (tbl_h, tbl_r),
            del_p,
            del_r,
        )

    if stage_i == 0 and task_i == 1:
        qrows = build_questionnaire(topic, method_name)
        n_scale = questionnaire_item_count(topic)
        n_total = len(qrows)
        proc = [
            f"【측정도구】구조화 설문(자기기입·{topic['mode']}). 측정 구성: {topic['constructs']}. "
            f"확정 문항: 측정문항 {n_scale}개 + 인구통계·기타 {n_total - n_scale}개 = 총 {n_total}개(아래 설문지 전문·표 참조). "
            f"척도: 태도·인식은 5점 Likert(전점 라벨), 빈도·행동은 서열/명목. 선택 근거: {method_name} 실습·{akey} 분석에 필요한 변 구조.",
            "【문항 개발 절차】 (1) 개념·조작적 정의 (2) 문헌·기존 척도 (3) 초안 작성 (4) 전문가 검토 (5) Cognitive interview 5명 "
            "(6) 문항 수정 (7) Pilot n=30 → r_it·α 기준 미달 2문항 삭제 후 아래 문항 확정.",
            f"【예비조사(Pilot)】2026-02-15~22. 확정 후 본조사용 설문지는 동일 문항·코드(Q/L/M 등) 유지.",
        ]
        del_p = ["확정 설문지 전문(아래 표), Pilot item-total·α 표, IRB/동의서"]
        del_r = qrows
        return STAGES[0][2][1], proc, (["문항코드", "문항내용", "응답척도", "척도유형", "비고"], qrows), del_p, del_r

    if stage_i == 0 and task_i == 2:
        proc = [
            f"【본조사 실시】기간: 2026-03-01~2026-04-15, 방식: {topic['mode']}. "
            f"모집: 표본틀 SMS/전화 초대 → CAWI 링크. 면접원 매뉴얼·QC(20% 재연락).",
            f"【자료 형태】구조화 데이터: 1행=1응답자. 변수: id, start_time, duration_min, Q01–Qn, D01–D04, OE01, weight, stratum.",
            f"【{method_name} 연계】본 자료는 {method_en}에서 일반적으로 쓰는 {akey} 분석 입력 데이터로 사용.",
        ]
        del_r = [
            ["변수", "유형", "값 예시", "라벨"],
            ["id", "문자", "R0001", "응답자"],
            ["Q01", "숫자", "4", "Likert"],
            ["D02", "숫자", "2", "30–39세"],
            ["weight", "연속", "1.12", "가중치"],
        ]
        return STAGES[0][2][2], proc, (["지표", "값"], [["완료 n", str(n_actual)], ["응답률", f"{resp_rate}%"], ["평균 소요", "11.4분"]]), ["Raw data CSV/SPSS .sav"], del_r

    if stage_i == 1 and task_i == 0:
        miss = 2.5 + (seed % 20) / 10
        proc = [
            f"결측: 전체 {miss:.1f}%. Little MCAR p={0.08 + (seed % 50)/1000:.3f}. "
            "단일 문항>20% 결측 0건. 다중 imputation vs listwise 민감도 비교.",
            "이상치: 연속형 duration>180분 3건 삭제, Likert 1–5 외 2건 결측 처리. z>|3| 4건 winsorize(1%,99%).",
        ]
        del_r = [["규칙", "n 전", "n 후"], ["listwise", str(n_actual), str(n_actual - 8)], ["이상치", "—", "4건 winsorize"]]
        return STAGES[1][2][0], proc, (["결측 유형", "비율", "처리"], [["단일", f"{miss:.1f}%", "대체/무"], ["다중", "0.4%", "listwise"]]), ["결측·이상치 로그"], del_r

    if stage_i == 1 and task_i == 1:
        proc = [
            "역채점: Q04, Q09 (R) → (6-x) 변환 후 하위척도 합산.",
            f"하위척도: (1) 인식/태도 (2) 행동/의도 — 각 mean score 1–5. composite_score = 두 하위척도 평균.",
        ]
        del_r = [["변수", "산식"], ["att_mean", "mean(Q01,Q02,Q03,Q05,Q06)"], ["comp_score", "mean(att_mean,int_mean)"]]
        return STAGES[1][2][1], proc, (["문항", "역채점"], [["Q04", "예"], ["Q09", "예"]]), ["analysis_scored.sav"], del_r

    if stage_i == 1 and task_i == 2:
        proc = [
            f"Cronbach α={alpha:.2f} (≥.70). KMO={0.80 + seed/500:.2f}, Bartlett p<.001.",
            f"타당도: {method_name} 관행에 따라 수렴·판별(요인/SEM 해당 시) 또는 EFA 사전 검토.",
        ]
        del_r = [["척도", "α", "문항수"], ["태도", f"{alpha:.2f}", str(topic.get("n_items", 12))]]
        return STAGES[1][2][2], proc, (["지표", "값"], [["α", f"{alpha:.2f}"], ["KMO", f"{0.80 + seed/500:.2f}"]]), ["신뢰도·타당도 표"], del_r

    if stage_i == 1 and task_i == 3:
        proc = [
            "gender: 1=남 2=여. region: 17개 더미. educ: 1–4. age_grp: 1–5.",
            "분석용 education_3: 1=고졸↓ 2=대졸 3=대학원↑. weight 그대로 사용.",
        ]
        del_r = [["변수", "값", "라벨"], ["gender", "1", "남"], ["region_seoul", "0/1", "서울 더미"]]
        return STAGES[1][2][3], proc, (["코드북", "—"], [["완료", "analysis_coded.sav"]]), ["codebook.xlsx"], del_r

    if stage_i == 2 and task_i == 0:
        proc = [
            "개방형 OE01: '추가 의견' → 키워드 12범주(예: 가격, 품질, 접근성…) 빈도코딩. 질적 주제분석 아님.",
            "범주별 dummy 12개 생성(1회 언급=1). 분석에는 선택적 포함.",
        ]
        del_r = [["code", "빈도", "예시"], ["가격", "42", "비용 부담"], ["품질", "38", "서비스 품질"]]
        return STAGES[2][2][0], proc, (["OE", "처리"], [["범주", "12"], ["방식", "빈도코딩"]]), ["open_coded.csv"], del_r

    # Statistics stage - method-specific main analysis
    if stage_i == 3:
        sw = f"{0.08 + (seed % 40) / 1000:.3f}"
        if task_i == 0:
            m1, sd1 = 3.42 + seed / 200, 0.78
            proc = [
                f"【Table 1】핵심 변수(composite_score 및 하위척도)에 대해 전체·성별·연령대(5분할) 기술통계 산출.",
                f"전체 composite_score: M={m1:.2f}, SD={sd1:.2f}, Min=1.00, Max=5.00, Skew={-0.12 + seed/500:.2f}, Kurt={0.08:.2f}.",
                "빈도표: D01 성별, D02 연령, D03 학력, D05 직업 — 가중치(weight) 적용 빈도·백분율 병기.",
                f"분석 소프트웨어: {_software(method_name, akey)} · Analyze → Descriptive Statistics → Frequencies / Explore.",
            ]
            del_r = [
                ["변수", "집단", "n", "M", "SD", "95% CI"],
                ["composite_score", "전체", str(n_actual - 8), f"{m1:.2f}", f"{sd1:.2f}", f"[{m1-0.08:.2f}, {m1+0.08:.2f}]"],
                ["composite_score", "남성", str(n_actual // 2 - 4), "3.28", "0.81", "[3.12, 3.44]"],
                ["composite_score", "여성", str(n_actual // 2 - 4), "3.52", "0.76", "[3.37, 3.67]"],
                ["att_mean", "전체", str(n_actual - 8), "3.38", "0.72", "[3.31, 3.45]"],
                ["int_mean", "전체", str(n_actual - 8), "3.47", "0.69", "[3.40, 3.54]"],
            ]
            del_p = [
                "표 1. 인구·학력 빈도(요약) 및 표 2. 기술통계(집단별)",
                "그림 A. 핵심 변수 분포(히스토그램) — 결과물 샘플에 포함",
            ]
            return STAGES[3][2][0], proc, (del_r[0], del_r[1:]), del_p, del_r
        if task_i == 1:
            proc = [
                "【정규성】composite_score 및 잔차(회귀·모형 해당 시): Shapiro–Wilk W, Q–Q plot 저장.",
                f"Shapiro–Wilk W=0.97, p={sw} → α=.05 기준 정규성 위반 없음으로 판단(보고서에 Q–Q 그림 부록).",
                "【등분산】집단 비교 시 Levene F=1.42, p=.22 → 등분산 가정 충족. 위반 시 Welch t, Games–Howell 사후검정.",
                "【다중공선성】회귀 시 VIF<5, tolerance>.20. 【잔차】Durbin–Watson 1.8–2.2, 잔차 정규성·등분산성 도식 점검.",
            ]
            del_r = [
                ["검定", "통계량", "df", "p", "판정", "대안"],
                ["Shapiro–Wilk", "0.97", str(n_actual - 10), sw, "정규", "—"],
                ["Levene", "1.42", "2, n-3", ".22", "등분산", "Welch t"],
                ["VIF (max)", "1.84", "—", "—", "OK", "—"],
            ]
            del_p = ["표 3. 가정 검토 요약", "부록 Fig. Q–Q, Residual plot (PNG 300dpi)"]
            return STAGES[3][2][1], proc, (["항목", "기록"], [["analysis_log.txt", "가정검定 일시·옵션"]]), del_p, del_r
        if task_i == 2:
            proc, del_r = _main_analysis(akey, topic, method_name, n_actual, seed)
            proc = [
                f"【분석 설계】연구주제 「{topic['title']}」 — {topic['hypothesis']}",
                f"【추정】{_software(method_name, akey)} · 분석 키={akey} · listwise n={n_actual - 8} · α=.05(양측).",
                *proc,
                "【재현성】syntax/R script 주석에 FILTER, WEIGHT, MISSING, MEASUREMENT 수준 명시.",
            ]
            del_p = [
                "표 4. 주 분석 결과(아래)",
                "그림 B. 방법별 핵심 시각화(막대·산점·경로·Forest 등)",
                f"부록: { _software(method_name, akey) } syntax 전문",
            ]
            return STAGES[3][2][2], proc, (["분석", "도구"], [[akey, _software(method_name, akey)]]), del_p, del_r
        proc = [
            "【효과크기】p값과 별도로 Cohen's d, η²/partial η², OR·RR, R² change 등 보고.",
            "【신뢰구간】주요 계수·평균차 95% CI. 【실무 해석】‘통계적 유의’와 ‘크기·방향’을 분리 서술.",
        ]
        del_r = _effect_size_rows(akey, seed)
        del_p = ["표 5. 가설별 효과크기·CI", "그림 A·B와 연결한 해석 문단(Results 초안)"]
        return STAGES[3][2][3], proc, (["—", "—"], []), del_p, del_r

    if stage_i == 4:
        if task_i == 0:
            del_r = [["가설", "결과", "p"], [topic["hypothesis"], "채택" if seed % 2 else "기각", f".{seed%40+10:02d}"]]
            return STAGES[4][2][0], ["α=.05 Bonferroni k=3."], (["—", "—"], []), ["Hypothesis table"], del_r
        if task_i == 1:
            if akey in ("sem_path", "cfa", "lavaan_sem", "sem_mediation"):
                cfi, rmsea = 0.92 + seed / 500, 0.04 + seed / 800
                proc = [f"CFI={cfi:.2f}, TLI={cfi-.02:.2f}, RMSEA={rmsea:.3f}, SRMR=.045"]
                del_r = [["지수", "값", "기준"], ["CFI", f"{cfi:.2f}", "≥.90"], ["RMSEA", f"{rmsea:.3f}", "≤.08"]]
            else:
                proc = ["구조모형 해당 없음 — N/A. 보고서에 '해당 없음' 명시."]
                del_r = [["", "N/A"]]
            return STAGES[4][2][1], proc, (["Fit", "—"], []), ["Fit indices"], del_r
        proc = [
            f"Figure 1: {topic['title']} 핵심 결과 막대그래프(집단별 mean±SE). Table 2: 다변량 결과.",
            "해석: 통계적 유의 + 효과크기 + {method_name} 관점 함의 2문단. 한계: 단면·자기보고·표본.",
        ]
        del_r = [["Figure", "내용"], ["Fig.1", "집단별 mean"], ["Table 2", "회귀/ANOVA/군집"]]
        return STAGES[4][2][2], proc, (["—", "—"], []), ["Results draft"], del_r

    # deliverable — publication package
    cfi = 0.92 + seed / 500
    rmsea = 0.04 + seed / 800
    proc = [
        f"【요약(Abstract)】「{topic['title']}」: {topic['population']} n={n_actual} ({topic['mode']}). "
        f"{topic['hypothesis']} — {method_name}({method_en}) 절차에 따라 수집·전처리·{akey} 분석. "
        f"주요 결과는 표 4–5 및 그림 A–B에 제시.",
        "【본문 구성】1. 서론 2. 방법(표본·도구·분석) 3. 결과(표·그림) 4. 논의·한계 5. 참고문헌 6. 부록(설문지·syntax·윤리).",
        f"【재현 패키지】data/analysis_coded.sav · code/analysis.{('sps' if 'SPSS' in method_name else 'R')} · output/tables.docx · output/figures/*.png (300dpi).",
        f"【윤리·품질】IRB 승인번호, 동의서, 표본설계서, 감사기록(audit trail) 포함.",
    ]
    del_p = [
        "출판용 결과 패키지(아래 목록·표·그림)",
        "표 1–5 + 그림 A–B + 해석 초안(Results·Discussion)",
    ]
    del_r = [
        ["유형", "파일명", "내용"],
        ["데이터", "analysis_coded.sav", "가중·코딩·척도점수 반영"],
        ["표", "Table1_descriptive.docx", "기술·빈도"],
        ["표", "Table2_assumptions.docx", "정규·등분산·VIF"],
        ["표", "Table3_main_model.docx", f"{akey} 주 분석"],
        ["표", "Table4_effects.docx", "효과크기·CI"],
        ["그림", "FigA_distribution.png", "분포"],
        ["그림", "FigB_main_result.png", "핵심 결과"],
        ["syntax", f"analysis.{('sps' if 'SPSS' in method_name else 'R')}", "전체 재현"],
        ["부록", "questionnaire_final.pdf", "확정 설문"],
    ]
    if akey in ("sem_path", "cfa", "lavaan_sem", "sem_mediation"):
        del_r.append(["표", "TableS_fit.docx", f"CFI={cfi:.2f}, RMSEA={rmsea:.3f}, SRMR=.045"])
    del_r.append(
        ["결론(1문장)", "—", f"{topic['title']}: {topic['hypothesis']} — 데이터·{akey} 결과 요약"]
    )
    return STAGES[5][2][0], proc, (["산출", "버전"], [["package_v1.0", date.today().isoformat()]]), del_p, del_r


def _software(method_name: str, akey: str) -> str:
    if "SPSS" in method_name or akey.startswith("spss"):
        return "SPSS 29"
    if "R" in method_name or "lavaan" in akey or "bayes" in akey:
        return "R 4.4"
    if akey in ("panel_fe", "did", "iv", "ols"):
        return "Stata 18 / R"
    return "SPSS / R / Stata"


def _main_analysis(akey: str, topic: dict, method_name: str, n: int, seed: int) -> tuple[list[str], list[list[str]]]:
    t = topic["title"]
    pval = f".{(seed % 35 + 8):03d}"
    if akey in ("spss_ttest", "ttest"):
        return (
            [
                f"Independent samples t-test: comp_score by gender — {t}.",
                "Levene p=.22 → equal variance t. 보고: M, SD, t, df, p, Cohen's d, mean difference 95% CI.",
            ],
            [
                ["집단", "n", "M", "SD", "t", "df", "p", "Cohen's d", "ΔM 95% CI"],
                ["남", str(n // 2 - 2), "3.28", "0.81", "2.14", str(n - 4), pval, "0.41", "[0.04, 0.48]"],
                ["여", str(n // 2 - 2), "3.52", "0.76", "", "", "", "", ""],
            ],
        )
    if akey in ("spss_anova", "anova", "factorial_anova"):
        return (
            [f"One-way ANOVA: 집단(3) × comp_score.", "Post-hoc Tukey HSD."],
            [["Source", "SS", "df", "F", "p"], ["Between", "12.4", "2", "4.82", ".009"], ["Within", "88.1", str(n - 3), "", ""]],
        )
    if akey in ("spss_regression", "ols", "regression", "mr"):
        b = 0.28 + seed / 1000
        return (
            [f"OLS: comp_score ~ educ + age + gender. {method_name} 표준 회귀 보고."],
            [["Predictor", "B", "SE", "β", "p"], ["educ", "0.21", "0.06", "0.22", ".001"], ["constant", "2.91", "0.18", "—", ".000"]],
        )
    if akey in ("spss_chi", "poll_crosstab", "chi"):
        return (
            ["Crosstab educ × vote →  χ²."],
            [["", "χ²", "df", "p", "V"], ["", "14.82", "6", ".021", "0.19"]],
        )
    if akey in ("spss_factor", "efa"):
        return (
            ["EFA principal axis, varimax, eigenvalue>1 → 2 factors, 78.2% variance."],
            [["Factor", "Items", "Variance%"], ["F1", "6", "42.1"], ["F2", "5", "36.1"]],
        )
    if akey in ("cluster_kmeans", "cluster_hierarchical", "cluster_two_step"):
        return (
            [f"K-means k=4, 20 random starts. Silhouette=0.48. ANOVA cluster × comp_score p<.001."],
            [["Cluster", "n", "%", "M_score"], ["1", str(n // 4), "25", "2.81"], ["2", str(n // 4), "25", "3.45"], ["3", str(n // 4), "25", "3.92"], ["4", str(n // 4), "25", "4.21"]],
        )
    if akey in ("sem_path", "cfa", "lavaan_sem"):
        return (
            ["lavaan/Amos: 측정모형 + 구조경로. ML estimation."],
            [["Path", "β", "SE", "p"], ["Quality→Sat", "0.62", "0.08", ".000"], ["Sat→Loyal", "0.48", "0.09", ".000"]],
        )
    if akey in ("logistic", "logit", "spss_logistic"):
        return (
            ["Binary logistic: event ~ predictors."],
            [["Var", "B", "OR", "p"], ["educ", "0.42", "1.52", ".012"]],
        )
    if akey in ("meta", "meta_sr"):
        return (
            ["Random-effects meta: Hedges g, I²=42%."],
            [["k", "g", "95%CI", "I²"], ["38", "0.35", "0.21–0.49", "42%"]],
        )
    if akey in ("panel_fe", "income_panel"):
        return (
            ["Two-way FE: Y ~ X + entity FE + time FE, cluster SE."],
            [["X", "coef", "SE", "p"], ["main", "0.18", "0.04", ".000"]],
        )
    if akey in ("mediation",):
        return (
            ["PROCESS Model 4: indirect effect bootstrap 5000, CI excludes 0."],
            [["Effect", "ab", "SE", "CI"], ["Indirect", "0.12", "0.03", "0.06–0.19"]],
        )
    if akey in ("mds", "mds_metric"):
        return (
            ["metric MDS 2D, stress=0.118."],
            [["Dim", "stress", "RSQ"], ["2", "0.118", "0.94"]],
        )
    if akey in ("did",):
        return (
            ["DID: treat×post, cluster SE at region."],
            [["DID", "coef", "SE", "p"], ["", "0.24", "0.09", ".008"]],
        )
    return (
        [f"{method_name} 핵심 분석({akey}) 실행 — {t}."],
        [["Statistic", "Value", "p"], ["main", f"{2.1 + seed/100:.2f}", f".{seed%30+10:02d}"]],
    )


def write_topic_section(
    doc: Document,
    topic_idx: int,
    topic: dict,
    method_name: str,
    method_en: str,
    method_no: int,
):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」에 대해 {method_name}({method_en})의 표준 설계·분석 절차를 적용할 때, "
        f"{topic['hypothesis']}을(를) 검증할 수 있는가?"
    )
    doc.add_paragraph(f"가설: {topic['hypothesis']}")
    doc.add_paragraph(f"모집단·표본·조사: {topic['population']} / {topic['sampling']} / {topic['mode']}")

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    q_full = build_questionnaire(topic, method_name)
    n_scale = questionnaire_item_count(topic)
    doc.add_heading("【확정 설문지 전문】", level=3)
    doc.add_paragraph(
        f"본 주제의 측정도구는 아래와 같습니다. 핵심 측정문항 {n_scale}개, 전체 {len(q_full)}문항(인구통계·개방형 포함). "
        "태스크 2) 결과물 샘플과 동일 내용입니다."
    )
    add_table(doc, ["문항코드", "문항내용", "응답척도", "척도유형", "비고"], q_full)

    header_rows = {
        "변수", "검定", "유형", "가설", "집단", "Source", "Predictor", "Cluster", "Path", "k", "산출", "결론(1문장)",
    }

    for si, (stage_label, stage_sum, tasks) in enumerate(STAGES):
        doc.add_heading(stage_label, level=3)
        doc.add_paragraph(stage_sum)
        for ti, task_label in enumerate(tasks):
            _, proc_paras, proc_tbl, del_paras, del_rows = task_content(si, ti, topic, method_name, method_en)
            doc.add_heading(task_label, level=4)

            doc.add_paragraph().add_run("■ 세부 태스크(Procedural Task)").bold = True
            doc.add_paragraph(task_label)

            step_notes = task_step_annotations(
                si, ti, proc_paras, topic["analysis_key"], topic, method_name
            )
            doc.add_paragraph().add_run("■ 각테스크별 주석").bold = True
            for step_i, (para, note) in enumerate(zip(proc_paras, step_notes), start=1):
                head = doc.add_paragraph()
                head.add_run(f"({step_i}) 실행 절차 요지: ").bold = True
                preview = para
                head.add_run(preview)
                for block in note.split("\n"):
                    if block.strip():
                        doc.add_paragraph(block.strip())
            if not proc_paras and step_notes:
                for block in step_notes[0].split("\n"):
                    if block.strip():
                        doc.add_paragraph(block.strip())

            doc.add_paragraph().add_run("■ 상세 실행 절차").bold = True
            for para in proc_paras:
                doc.add_paragraph(para)
            if proc_tbl[1]:
                add_table(doc, proc_tbl[0], proc_tbl[1])

            doc.add_paragraph().add_run("■ 결과물 샘플(Sample Deliverable)").bold = True
            for dp in del_paras:
                doc.add_paragraph(dp)
            if del_rows:
                q_hdr = ["문항코드", "문항내용", "응답척도", "척도유형", "비고"]
                if del_rows and len(del_rows[0]) == 5 and re.match(r"^[A-Z]", str(del_rows[0][0])):
                    add_table(doc, q_hdr, del_rows)
                elif del_rows[0][0] in header_rows:
                    add_table(doc, del_rows[0], del_rows[1:])
                elif len(del_rows) > 1 and len(del_rows[0]) == len(del_rows[1]):
                    add_table(doc, del_rows[0], del_rows[1:])
                else:
                    ncols = max(len(r) for r in del_rows)
                    hdr = ["항목"] + [f"열{i}" for i in range(1, ncols)]
                    add_table(doc, hdr[:ncols], del_rows)

            for cap, fpath in figures_for_task(si, ti, fig_bundle):
                add_figure(doc, fpath, cap)

            doc.add_paragraph()


def safe_filename(name_ko: str, en: str, no: int) -> str:
    base = f"{name_ko}{no}" if name_ko == "QT-038" else name_ko
    for ch in '<>:"/\\|?*':
        base = base.replace(ch, "")
    return f"설문·양적통계 아키타입-{base}({en}).docx"


def main():
    bundle = json.loads(BUNDLE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    methods = bundle["methods"]

    for m in methods:
        no = m["no"]
        prof = METHOD_PROFILES.get(no)
        if not prof:
            print("skip missing profile", no)
            continue
        doc = Document()
        sect = doc.sections[0]
        sect.top_margin = Cm(2)
        sect.bottom_margin = Cm(2)
        title = doc.add_heading(f"{ARCHETYPE}", level=0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_heading(f"연구방법: {m['name']}({prof['en']})", level=1)
        doc.add_paragraph(f"생성일: {date.today().isoformat()} · 연구방법 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 16")
        doc.add_paragraph(
            "본 문서는 설문·양적통계 아키타입의 6단계·16태스크 절차에 따라, "
            "각 연구방법의 표준 주제·확정 설문지·통계 결과표·그림을 출판(학술보고) 수준의 형식으로 제시한 실행 샘플이다."
        )
        doc.add_page_break()

        for i, topic in enumerate(prof["topics"], 1):
            write_topic_section(doc, i, topic, m["name"], prof["en"], no)
            if i < 5:
                doc.add_page_break()

        path = OUT_DIR / safe_filename(m["name"], prof["en"], no)
        tmp_path = path.with_suffix(".docx.generating")
        doc.save(tmp_path)
        try:
            if path.exists():
                path.unlink()
            tmp_path.replace(path)
        except OSError:
            alt = path.with_name(path.stem + "_갱신본.docx")
            if alt.exists():
                alt.unlink()
            tmp_path.replace(alt)
            print("Wrote (locked original)", alt.name)
            continue
        print("Wrote", path.name)

    print("Done.", OUT_DIR)


if __name__ == "__main__":
    main()
