# -*- coding: utf-8 -*-
"""Generate fully written Korean survey items per topic (analysis_key + constructs)."""
from __future__ import annotations

LIKERT5 = "1=전혀 그렇지 않다 2=그렇지 않다 3=보통이다 4=그렇다 5=매우 그렇다"
LIKERT7 = "1=매우 불만족 … 7=매우 만족"
FREQ5 = "1=전혀 없음 2=월1회 미만 3=월1–3회 4=주1회 5=거의 매일"
YESNO = "1=예 2=아니오"
NPS = "0=전혀 추천하지 않음 … 10=적극 추천"

DEMO = [
    ("D01", "귀하의 성별은?", "1=남성 2=여성 3=기타 4=응답 거부", "명목", ""),
    ("D02", "귀하의 연령(만)에 해당하는 범주는?", "1=18–29 2=30–39 3=40–49 4=50–59 5=60세 이상", "서열", ""),
    ("D03", "귀하의 최종 학력은?", "1=중졸 이하 2=고졸 3=전문대 4=대졸 5=대학원 이상", "서열", ""),
    ("D04", "현재 거주하는 광역시·도는?", "11=서울 26=부산 … (통계청 코드)", "명목", ""),
    ("D05", "귀하의 직업 유형은?", "1=상용직 2=자영업 3=학생 4=무직/기타", "명목", ""),
]

OE = ("OE01", "위 문항과 관련하여 추가로 전하고 싶은 의견이 있으면 자유롭게 기술해 주십시오.", "자유 서술", "명목", "개방형")


def _short_title(title: str) -> str:
    t = title.split(":")[0].split("(")[0].strip()
    return t[:40]


def _row(code, stem, scale, stype, note=""):
    return [code, stem, scale, stype, note]


def _likert_block(prefix: str, stems: list[str], reverse_at: set[int] | None = None) -> list[list[str]]:
    reverse_at = reverse_at or set()
    rows = []
    for i, stem in enumerate(stems, 1):
        code = f"{prefix}{i:02d}"
        rev = reverse_at and i in reverse_at
        note = "역채점(R)" if rev else ""
        rows.append(_row(code, stem, LIKERT5, "5점 Likert", note))
    return rows


def items_by_analysis_key(topic: dict) -> list[list[str]]:
    akey = topic["analysis_key"]
    label = _short_title(topic["title"])
    constructs = topic.get("constructs") or label
    n_target = max(int(topic.get("n_items") or 12), 8)

    # --- Meta / literature-only: minimal screening ---
    if akey in ("meta", "meta_sr") or n_target == 0:
        return [
            _row("M01", "본 연구는 문헌·DB에서 추출한 1차 연구의 효과크기를 합성합니다. (설문 본조사 없음)", "해당없음", "—", ""),
            _row("M02", "코딩용: 1차 연구 ID, 표본 n, 효과크기, SE, 연구질 평가점수를 기록합니다.", "연구자 입력", "—", ""),
        ] + [_row(c, s, sc, t, n) for c, s, sc, t, n in DEMO[:3]]

    rows: list[list[str]] = []

    if akey in ("spss_ttest", "spss_descriptive", "csat_sem_lite", "eval_survey", "social_survey"):
        rows = _likert_block(
            "Q",
            [
                f"최근 이용한 {label} 서비스 전반에 대해 얼마나 만족하십니까?",
                "직원(또는 상담원)의 친절도에 만족하십니까?",
                "문제 발생 시 해결이 신속했다고 느끼십니까?",
                "제공된 정보·안내가 이해하기 어렵다.",  # R
                "대기 시간(또는 처리 시간)이 적절했다고 느끼십니까?",
                "서비스 품질이 요금(또는 비용)에 비해 합리적이라고 느끼십니까?",
                "앞으로도 동일 서비스를 이용할 의향이 있습니까?",
                "지인에게 이 서비스를 추천할 의향이 있습니까?",
            ],
            reverse_at={4},
        )

    elif akey in ("spss_anova", "anova", "factorial_anova", "ancova", "rct", "field_exp", "medical_rct"):
        group_hint = "실험·집단" if "실험" in topic["title"] or akey in ("rct", "factorial_anova") else "교수법(또는 집단)"
        rows = _likert_block(
            "Q",
            [
                f"이번 {label} 경험 후 해당 주제에 대한 이해가 높아졌다고 느낍니다.",
                f"{group_hint} A에 배정(또는 해당)된 경우, 학습·과업 성과가 향상되었다고 느낍니다.",
                "제공된 자료·설명이 학습(또는 과업)에 도움이 되었습니다.",
                "과정이 지나치게 어렵거나 부담스러웠다.",  # R
                "같은 조건이라면 다른 사람에게도 참여를 권하고 싶습니다.",
                "전반적 만족도는 높은 편입니다.",
            ],
            reverse_at={4},
        )
        rows.append(_row("Y01", "본 조사에서 측정한 종속변수(점수·성과)를 기록합니다.", "연속형(0–100)", "비율", "행정/성적 연계"))

    elif akey in ("spss_regression", "ols", "mr", "regression", "bayes_reg", "demand", "gravity", "ecological_reg"):
        rows = [
            _row("X01", "지난 1년간 해당 사업·학습에 투입한 월평균 시간(시간)은?", "0–200 (연속)", "비율", "독립"),
            _row("X02", "관련 광고·홍보에 지출한 월평균 비용(만원)은?", "0–500 (연속)", "비율", "독립"),
            _row("X03", "교육·훈련 이수 연수(년)는?", "0–30 (연속)", "비율", "독립"),
            _row("Y01", "동일 기간 매출(또는 성적·성과) 수준은?", "1=매우 낮음 … 5=매우 높음", "서열", "종속"),
            _row("Y02", "위 성과에 대한 객관적 점수(또는 금액)를 적어 주십시오.", "개방형 숫자", "비율", "종속"),
        ] + _likert_block(
            "Q",
            [
                f"{label}과 관련된 환경·정책이 성과에 긍정적이라고 느낍니다.",
                "필요한 자원(시간·비용)을 충분히 투입할 수 있었습니다.",
            ],
        )

    elif akey in ("spss_chi", "poll_crosstab", "policy_chi", "chi", "chi_rr"):
        rows = [
            _row("P01", "다음 지방선거(또는 총선)에 투표하실 의향이 있습니까?", YESNO, "명목", ""),
            _row("P02", "현재 가장 지지하는 정당·후보 성향에 가까운 것은?", "1=A 2=B 3=C 4=무당·기타 5=모름", "명목", ""),
            _row("P03", "귀하의 최종 학력 범주는?", "1=중졸↓ 2=고졸 3=대졸 4=대학원↑", "서열", "교차분석"),
            _row("P04", "최근 1년간 공공서비스(또는 정책)에 대한 관심도는?", LIKERT5, "5점 Likert", ""),
        ]

    elif akey in ("spss_factor", "efa", "scale_development", "item_design", "cfa", "invariance", "second_order", "mg_cfa"):
        base_stems = [
            f"{label}과 관련된 첫 번째 핵심 특성을 잘 반영한다고 느낍니다.",
            "나는 이 영역에서 스스로 역량이 있다고 느낍니다.",
            "주변 사람들도 내가 이 영역에 관심이 많다고 말한다.",
            "관련 활동을 지속하기 어렵다.",  # R
            "새로운 시도보다 익숙한 방식을 고수하는 편이다.",  # R
            "관련 정보를 적극적으로 찾아본다.",
            "실제 행동으로 옮기는 경우가 많다.",
            "장애가 있어도 목표를 유지하려 노력한다.",
            "이 영역은 나의 정체성과 밀접하다.",
            "타인의 의견보다 자신의 판단을 중시한다.",
        ]
        extra = max(0, min(n_target, 24) - len(base_stems))
        for k in range(extra):
            base_stems.append(f"{constructs}과 관련하여 중요하다고 생각하는 측면 {k + 1}에 동의합니다.")
        rows = _likert_block("Q", base_stems[: min(n_target, 24)], reverse_at={4, 5})

    elif akey in ("sem_path", "lavaan_sem", "sem_mediation", "cfa"):
        rows = []
        blocks = [
            ("SQ", "서비스 품질", [
                "물리적 환경(시설·장비)이 쾌적합니다.",
                "제공 과정이 신뢰할 수 있습니다.",
                "직원이 전문적입니다.",
                "문제 발생 시 공감적으로 대응합니다.",
                "약속한 시간·내용을 잘 지킵니다.",
            ]),
            ("SAT", "만족", [
                "전반적 만족도가 높습니다.",
                "기대 대비 결과가 좋았습니다.",
                "다시 이용하고 싶습니다.",
            ]),
            ("LOY", "충성·구전", [
                "앞으로도 계속 이용할 의향이 있습니다.",
                "지인에게 추천할 의향이 있습니다.",
                "대체 서비스로 옮기고 싶지 않습니다.",  # R-ish for loyalty
            ]),
        ]
        rev_sq = {4}
        idx = 1
        for prefix, _, stems in blocks:
            for j, stem in enumerate(stems, 1):
                note = "역채점(R)" if prefix == "SQ" and j in rev_sq else ""
                rows.append(_row(f"{prefix}{j:02d}", stem, LIKERT5, "5점 Likert", note))
                idx += 1

    elif akey in ("cluster_kmeans", "cluster_hierarchical", "cluster_two_step", "lpa", "lca"):
        rows = _likert_block(
            "L",
            [
                "나는 새로운 제품·서비스를 주변보다 먼저 써보는 편이다.",
                "가격보다 품질·브랜드를 우선한다.",
                "할인·프로모션 정보에 민감하게 반응한다.",
                "온라인보다 오프라인 매장 이용을 선호한다.",
                "친환경·윤리적 소비를 중요하게 생각한다.",
                "충동구매를 자주 한다.",
                "리뷰·추천을 구매 전에 꼭 확인한다.",
                "한 브랜드에 오래 충성하는 편이다.",
                "여가 시간의 상당 부분을 쇼핑·관련 활동에 쓴다.",
                f"{label}과 관련된 활동 빈도가 높은 편이다.",
            ],
            reverse_at=set(),
        )
        rows.append(_row("B01", f"지난 3개월간 {label} 관련 구매·이용 횟수는?", FREQ5, "서열", "행동"))

    elif akey in ("poll_weighted", "poll_anova", "poll_correlation", "poll_chi", "rdd", "survey_design", "stratified", "multistage", "nonresponse", "sample_design", "quota", "panel_attrition"):
        rows = [
            _row("V01", "현재 국정(또는 지방정부) 운영에 대해 전반적으로 어떻게 평가하십니까?", LIKERT5, "5점 Likert", ""),
            _row("V02", "향후 6개월 경기(또는 생활) 전망은?", "1=매우 나쁨 … 5=매우 좋음", "5점 Likert", ""),
            _row("V03", "특정 정책(조사 주제)에 대해 찬성하십니까?", "1=매우 반대 … 5=매우 찬성", "5점 Likert", ""),
            _row("V04", "정치·사회 이슈에 대한 관심도는?", LIKERT5, "5점 Likert", ""),
            _row("V05", "언론·공공기관 정보를 얼마나 신뢰하십니까?", LIKERT5, "5점 Likert", ""),
            _row("V06", "최근 1년간 선거·투표에 참여하셨습니까?", YESNO, "명목", ""),
        ]

    elif akey in ("concept_anova", "ad_anova", "price_logit", "tracking_regression"):
        rows = [
            _row("C01", "제시된 컨셉(또는 광고) A에 대한 구매 의향은?", LIKERT5, "5점 Likert", "집단 A"),
            _row("C02", "제시된 컨셉(또는 광고) B에 대한 구매 의향은?", LIKERT5, "5점 Likert", "집단 B"),
            _row("C03", "해당 제품·서비스가 기존 대비 독특하다고 느끼십니까?", LIKERT5, "5점 Likert", ""),
            _row("C04", "가격이 수용 가능한 수준이라고 느끼십니까?", LIKERT5, "5점 Likert", ""),
            _row("C05", "브랜드에 대한 신뢰도는?", LIKERT5, "5점 Likert", ""),
            _row("NPS1", "지인에게 추천할 가능성(0–10점)은?", NPS, "11점", "NPS"),
        ]

    elif akey in ("mediation", "moderation"):
        rows = _likert_block(
            "M",
            [
                f"최근 1개월 {label} 관련 스트레스 수준은 높은 편입니다.",
                "수면의 질이 좋지 않습니다.",
                "업무·학업 성과(또는 만족)가 낮다고 느낍니다.",
                "주변으로부터 실질적 도움을 받고 있습니다.",
                "리더(또는 교사)의 지원이 충분합니다.",
                "팀(또는 학급) 구성원과 협력이 잘 됩니다.",
            ],
            reverse_at={3},
        )

    elif akey in ("logistic", "logit", "spss_logistic", "case_control", "panel_logit"):
        rows = [
            _row("E01", "지난 12개월 내 연체·부작용·낙상·전환 등 목표 사건(event)이 발생했습니까?", YESNO, "명목", "종속"),
            _row("R01", "관련 위험 요인 1(예: 부채·흡연·기능저하)에 해당합니까?", YESNO, "명목", "독립"),
            _row("R02", "관련 위험 요인 2에 해당합니까?", YESNO, "명목", "독립"),
            _row("R03", "예방·관리 프로그램에 참여한 적이 있습니까?", YESNO, "명목", "독립"),
        ] + _likert_block("Q", [f"{label} 관련 자기효능감·인식이 높은 편입니다.", "건강·재무 관리를 규칙적으로 합니다."])

    elif akey in ("longitudinal", "repeated_anova", "lgm", "growth", "did_lite", "income_panel", "panel_fe", "panel_re"):
        rows = [
            _row("W1", "1차(또는 사전) 측정: 주요 결과 변수(예: 우울·성적·소득) 점수", "연속/척도", "비율", "파1"),
            _row("W2", "2차 측정: 동일 변수", "연속/척도", "비율", "파2"),
            _row("W3", "3차 측정: 동일 변수", "연속/척도", "비율", "파3"),
        ] + _likert_block("Q", [f"{label} 관련 경험이 시간이 지나며 개선되었다고 느낍니다.", "동일 문항을 각 파에서 반복 측정합니다."])

    elif akey in ("mds", "mds_metric", "mds_nonmetric"):
        rows = [
            _row("S01", "브랜드(또는 대상) A와 B는 유사하다.", LIKERT5, "5점 Likert", "유사성 쌍"),
            _row("S02", "A와 C는 유사하다.", LIKERT5, "5점 Likert", ""),
            _row("S03", "B와 C는 유사하다.", LIKERT5, "5점 Likert", ""),
            _row("S04", "A와 D는 유사하다.", LIKERT5, "5점 Likert", ""),
        ]

    elif akey in ("mixed",):
        rows = _likert_block(
            "Q",
            [
                f"{label}에 대한 전반적 태도가 긍정적입니다.",
                "정책·서비스 도입을 찬성합니다.",
                "실행 가능성이 충분하다고 느낍니다.",
            ],
        )
        rows.append(_row("OE01", "찬반 이유·경험을 구체적으로 서술해 주십시오.", "자유 서술", "명목", "질적 병행"))

    elif akey in ("ttest", "descriptive", "correlation", "ttest_anova", "medical", "diagnostic"):
        rows = _likert_block(
            "Q",
            [
                f"{label} 관련 자가 보고 건강(또는 성과) 상태는 양호한 편입니다.",
                "측정·검사 결과를 정기적으로 확인합니다.",
                "위험 요인(흡연·비만 등)을 관리하고 있습니다.",
            ],
        )

    else:
        # Generic attitude/behavior for remaining keys
        rows = _likert_block(
            "Q",
            [
                f"{label}에 대해 잘 알고 있다고 느낍니다.",
                f"{label}이(가) 나에게 중요합니다.",
                f"{label} 관련 경험이 전반적으로 긍정적이었습니다.",
                f"{label}과 관련된 불편·부담이 크다.",  # R
                f"앞으로도 {label}과(와) 관련된 활동을 할 것입니다.",
            ],
            reverse_at={4},
        )
        need = min(n_target, 15) - len(rows)
        for k in range(max(0, need)):
            rows.append(_row(f"Q{len(rows)+1:02d}", f"{constructs}과 관련된 추가 문항 {k+1}에 동의합니다.", LIKERT5, "5점 Likert", ""))

    # Trim or extend to reasonable count
    max_q = min(max(n_target, 8), 28)
    if len(rows) > max_q:
        rows = rows[:max_q]

    # Standard demographics + open unless already has OE
    has_oe = any(r[0].startswith("OE") for r in rows)
    rows.extend([_row(c, s, sc, t, n) for c, s, sc, t, n in DEMO])
    if not has_oe:
        rows.append(_row(OE[0], OE[1], OE[2], OE[3], OE[4]))

    return rows


def build_questionnaire_table(topic: dict, method_name: str) -> list[list[str]]:
    """Full survey table rows: code, stem, scale, type, note."""
    _ = method_name
    return items_by_analysis_key(topic)


def questionnaire_item_count(topic: dict) -> int:
    rows = items_by_analysis_key(topic)
    return sum(1 for r in rows if r[0].startswith(("Q", "L", "M", "C", "V", "P", "X", "S", "E", "R", "W")))
