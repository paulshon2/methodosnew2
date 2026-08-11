# -*- coding: utf-8 -*-
"""Generate Korean PDF verification report from renew9-verification-report.json"""
from __future__ import annotations

import json
import os
from pathlib import Path

try:
    from fpdf import FPDF
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "fpdf2", "-q"])
    from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "docs" / "verification" / "renew9-verification-report.json"
OUT_PDF = ROOT / "docs" / "verification" / "MethodOS_renew9_stats_io_verification_report.pdf"
# Also copy beside package parent for user convenience
OUT_PDF_ALT = Path(r"C:\Users\saran\OneDrive\Desktop\making-M") / "MethodOS_renew9_stats_io_verification_report.pdf"

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\malgun.ttf",
    r"C:\Windows\Fonts\malgunbd.ttf",
    r"C:\Windows\Fonts\NanumGothic.ttf",
    r"C:\Windows\Fonts\gulim.ttc",
]


def find_font() -> str:
    for p in FONT_CANDIDATES:
        if os.path.isfile(p):
            return p
    raise SystemExit("Korean TTF font not found")


class ReportPDF(FPDF):
    def __init__(self, font_path: str):
        super().__init__(format="A4")
        self.font_path = font_path
        self.add_font("kr", "", font_path)
        self.set_auto_page_break(auto=True, margin=16)

    def header(self):
        self.set_font("kr", size=9)
        self.set_text_color(90, 90, 90)
        self.cell(0, 6, "MethodOS s24-lv-renew-9 · 통계·입출력 검증 보고서", align="R")
        self.ln(8)

    def footer(self):
        self.set_y(-12)
        self.set_font("kr", size=8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"{self.page_no()}", align="C")


def section(pdf: ReportPDF, title: str):
    pdf.set_font("kr", size=13)
    pdf.set_text_color(20, 40, 80)
    pdf.ln(2)
    pdf.multi_cell(0, 7, title)
    pdf.set_draw_color(60, 100, 180)
    pdf.set_line_width(0.4)
    y = pdf.get_y()
    pdf.line(10, y, 200, y)
    pdf.ln(3)


def body(pdf: ReportPDF, text: str, size: int = 10):
    pdf.set_font("kr", size=size)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(0, 5.5, text)
    pdf.ln(1)


def main():
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    font = find_font()
    pdf = ReportPDF(font)
    pdf.add_page()

    pdf.set_font("kr", size=18)
    pdf.set_text_color(15, 25, 55)
    pdf.multi_cell(0, 9, "MethodOS 기본통계 수학·입출력 검증 보고서")
    pdf.ln(1)
    body(
        pdf,
        f"패키지: {data.get('package')}\n생성시각: {data.get('generatedAt')}\n"
        f"기술·추론 분석(classic): {data['counts']['classicModules']}개\n"
        f"구조방정식·잠재변수(sem): {data['counts']['semModules']}개\n"
        f"결과 집계: PASS {data['counts']['pass']} · WARN {data['counts']['warn']} · "
        f"FAIL {data['counts']['fail']} / 총 {data['counts']['total']}",
        11,
    )

    section(pdf, "1. 검증 목적")
    body(
        pdf,
        "본 보고서는 methodos--s24-lv-renew-9 패키지의 (1) 작업 메뉴 불러오기·내보내기 연동과 "
        "(2) 기본통계 메뉴의 기술·추론 분석 41기법 및 구조방정식·잠재변수 모형 12기법에 대해 "
        "통계적·수학적 오류가 없는지 재현 가능한 방법으로 점검한 결과이다.",
    )

    section(pdf, "2. 검증 방법")
    body(
        pdf,
        "방법 A — 절대 앵커(해석적 값)\n"
        "  · 표준정규 CDF Φ(0)=0.5, erf(0)=0, 베타불완전함수 betainc(x;1,1)=x,\n"
        "    lgamma(5)=ln(24), χ²·t 분포 CDF 특수값을 checkSpecialAnchors로 확인.\n"
        "  · OLS QR: Xᵀe≈0, 잔차합≈0, SST≈SSR+SSE 불변식.\n\n"
        "방법 B — 수작업 공식 대조(대표 예제)\n"
        "  · 독립표본 t검정(C-02): t=(m1−m2)/√(s1²/n1+s2²/n2), p=Student-t CDF를\n"
        "    수작업 계산값과 엔진 출력(t,p)을 허용오차 내에서 비교.\n"
        "  · Pearson 상관(D-01): y=2x+1 완전선형 자료에서 r=1인지 공식·엔진 대조.\n\n"
        "방법 C — 커리큘럼 전수 실행\n"
        "  · public/basic-stats-curriculum.json의 group=classic(41), group=sem(12)\n"
        "  · 각 모듈의 데모/ sampleCsv로 runBasicStats(id, csv) 실행\n"
        "  · 요약·해석 본문 존재, p∈[0,1], verify 앵커 실패 여부를 판정\n"
        "  · PASS / WARN(교육용·경고) / FAIL로 등급화\n\n"
        "방법 D — 불러오기·내보내기 라운드트립\n"
        "  · 그래프: CSV↔Excel 왕복, 예제 title+desc 존재\n"
        "  · 코딩: 연구자/참여자 텍스트·CSV 불러오기 → Excel 시트 내보내기\n"
        "  · 설문: AOA↔Excel 왕복\n"
        "  · 통계: CSV 불러오기→분석→결과 포함 Excel\n"
        "  · 원고쓰기: glass 테마에서 흰배경+밝은글자 버그 수정(CSS 토큰) 정적 검증\n"
        "  · UI: StudioGuide 제목 '개요' 변경 확인",
    )

    section(pdf, "3. 사용한 예제 자료")
    body(
        pdf,
        "· t검정: 집단 A(70+(i%5), n=30) vs B(65+(i%5), n=30) 합성자료\n"
        "· 상관: x=1..10, y=2x+1\n"
        "· OLS: X=[1..5], y=[2.1,3.9,6.2,7.8,10.1]\n"
        "· 코딩: 몰입 주제 연구자/참여자 4턴 전사, interview.csv\n"
        "· 설문: Q1 단일선택 / Q2 리커트 AOA\n"
        "· 그래프: VIZ_PRACTICE_SETS 첫 예제 및 전체 title+desc\n"
        "· 각 통계 모듈: basic-stats-demos.generated.json 또는 curriculum sampleCsv",
    )

    # Summaries by area
    from collections import defaultdict

    by = defaultdict(lambda: {"pass": 0, "warn": 0, "fail": 0, "items": []})
    for r in data["rows"]:
        by[r["area"]][r["severity"]] += 1
        by[r["area"]]["items"].append(r)

    section(pdf, "4. 영역별 요약")
    for area, st in by.items():
        body(
            pdf,
            f"[{area}] PASS {st['pass']} · WARN {st['warn']} · FAIL {st['fail']}",
            10,
        )

    section(pdf, "5. 기술·추론 분석(41) 상세")
    for r in by.get("classic", {}).get("items", []):
        body(
            pdf,
            f"· [{r['severity'].upper()}] {r['id']} {r['name']}\n"
            f"  방법: {r['method']}\n"
            f"  예제: {r['example']}\n"
            f"  결과: {r['detail']}"
            + (f"\n  통계: {r['keyStats']}" if r.get("keyStats") else ""),
            9,
        )

    pdf.add_page()
    section(pdf, "6. 구조방정식·잠재변수 모형(12) 상세")
    for r in by.get("sem", {}).get("items", []):
        body(
            pdf,
            f"· [{r['severity'].upper()}] {r['id']} {r['name']}\n"
            f"  방법: {r['method']}\n"
            f"  예제: {r['example']}\n"
            f"  결과: {r['detail']}"
            + (f"\n  통계: {r['keyStats']}" if r.get("keyStats") else ""),
            9,
        )

    section(pdf, "7. 입출력·UI 검증 상세")
    for area in ("core", "math-check", "io-viz", "io-coding", "io-survey", "io-stats", "io-manuscript", "ui"):
        for r in by.get(area, {}).get("items", []):
            body(
                pdf,
                f"· [{r['severity'].upper()}] {r['id']} {r['name']}\n"
                f"  방법: {r['method']}\n"
                f"  예제: {r['example']}\n"
                f"  결과: {r['detail']}",
                9,
            )

    section(pdf, "8. 결론")
    fails = [r for r in data["rows"] if r["severity"] == "fail"]
    if not fails:
        body(
            pdf,
            "기술·추론 41기법과 구조방정식·잠재변수 12기법은 예제 기반 실행·앵커·대표 수식 대조에서 "
            "치명적 수학 오류(FAIL)가 검출되지 않았다. 불러오기·내보내기 라운드트립과 원고쓰기 대비 수정, "
            "개요 문구·그릴자료 설명 복원도 검증을 통과했다. WARN은 교육용/근사 안내가 포함된 경우이다.",
        )
    else:
        body(
            pdf,
            "다음 FAIL 항목은 추가 점검이 필요하다:\n"
            + "\n".join(f"· {r['area']}/{r['id']}: {r['detail']}" for r in fails[:40]),
        )

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT_PDF))
    pdf.output(str(OUT_PDF_ALT))
    print("PDF written:", OUT_PDF)
    print("PDF written:", OUT_PDF_ALT)


if __name__ == "__main__":
    main()
