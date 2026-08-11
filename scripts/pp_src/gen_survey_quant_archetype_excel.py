# -*- coding: utf-8 -*-
"""Generate 설문·양적통계 아키타입 Excel workbooks: 48 methods × 5 topic sheets."""
from __future__ import annotations

import json
import re
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-01.json"
OUT_DIR = ROOT.parent / "설문·양적통계 아키타입-연구방법별 샘플"

ARCHETYPE_KO = "설문·양적통계 아키타입"
ARCHETYPE_EN = "Survey–Quantitative Statistics Archetype"

STAGES = [
    {
        "order": 1,
        "label_ko": "① 자료수집",
        "summary": (
            "①모집단 정의 및 표본설계(확률표집/비확률표집) →"
            "②측정도구(설문지, 척도) 개발 및 예비조사(pilot test) →"
            "③본조사 실시(대면/온라인/전화 등)로 구조화된 응답자료 수집"
        ),
        "tasks": [
            "1) 모집단 정의 및 표본설계(확률표집/비확률표집)",
            "2) 측정도구(설문지, 척도) 개발 및 예비조사(pilot test)",
            "3) 본조사 실시(대면/온라인/전화 등)로 구조화된 응답자료 수집하기",
        ],
    },
    {
        "order": 1,
        "label_ko": "② 전처리",
        "summary": (
            "①결측치·이상치 처리 →②역채점 문항 정리 및 척도점수 산출 →"
            "③척도 신뢰도(Cronbach α) 및 타당도 검토 →④변수 코딩(가변수화 등)"
        ),
        "tasks": [
            "1) 결측치·이상치 처리",
            "2) 역채점 문항 정리 및 척도점수 산출하기",
            "3) 척도 신뢰도(Cronbach α) 및 타당도 검토하기",
            "4) 변수 코딩(가변수화 등)",
        ],
    },
    {
        "order": 1,
        "label_ko": "③ 코딩",
        "summary": "해당없음 — 개방형 응답이 있는 경우에만 최소한의 범주코딩(가변수화) 수행, 질적코딩과는 구분",
        "tasks": [
            "1) 해당없음 — 개방형 응답이 있는 경우에만 최소한의 범주코딩(가변수화) 수행, 질적코딩과는 구분",
        ],
    },
    {
        "order": 1,
        "label_ko": "④ 통계기법",
        "summary": (
            "①기술통계(평균, 표준편차, 빈도) 산출 →②정규성·등분산성 등 가정 검토 →"
            "③분석목적에 따라 t검정/ANOVA, 상관·회귀분석, 요인분석/SEM 등 특화기법 적용 →"
            "④효과크기 및 통계적 유의성(p값) 해석"
        ),
        "tasks": [
            "1) 기술통계(평균, 표준편차, 빈도) 산출하기",
            "2) 정규성·등분산성 등 가정 검토하기",
            "3) 분석목적에 따라 t검정/ANOVA, 상관·회귀분석, 요인분석/SEM 등 특화기법 적용하기",
            "4) 효과크기 및 통계적 유의성(p값) 해석하기",
        ],
    },
    {
        "order": 1,
        "label_ko": "⑤ 결과도출",
        "summary": (
            "①가설별 통계적 유의성 판정 →②모형 적합도 지수(CFI, RMSEA 등, 해당시) 확인 →"
            "③결과표·그래프로 정리하여 해석"
        ),
        "tasks": [
            "1) 가설별 통계적 유의성 판정",
            "2) 모형 적합도 지수(CFI, RMSEA 등, 해당시) 확인하기",
            "3) 결과표·그래프로 정리하여 해석하기",
        ],
    },
    {
        "order": 1,
        "label_ko": "⑥ 최종 산출물",
        "summary": "통계분석 결과표 및 모형 적합도",
        "tasks": ["▶ 산출물: 통계분석 결과표 및 모형 적합도"],
    },
]

# English display names + analysis focus + five research topics per method (by catalog no)
METHOD_META: dict[int, dict] = {
    1: {
        "en": "Marketing Research",
        "focus": "세분화·브랜드 추적·구매의도",
        "technique": "교차분석, ANOVA, 다중회귀, 군집·요인 보조",
        "topics": [
            "프리미엄 커피 브랜드 구매의도",
            "전기차 충전앱 사용성 만족",
            "온라인 패션 구독 서비스 충성도",
            "친환경 포장 인식과 구매전환",
            "OTT 광고 타겟팅 수용도",
        ],
    },
    2: {
        "en": "Public Opinion Polling",
        "focus": "여론조사 설계·가중치·표본오차",
        "technique": "가중치 조정, 비율 추정, 신뢰구간, 카이제곱",
        "topics": [
            "지방선거 투표 성향",
            "기후변화 대응 정책 지지",
            "복지예산 우선순위",
            "외교·안보 이슈 인식",
            "디지털 플랫폼 규제 찬반",
        ],
    },
    3: {
        "en": "Questionnaire Design",
        "focus": "문항·척도·타당도 설계",
        "technique": "EFA, Cronbach α, 문항분석, CFA 보조",
        "topics": [
            "대학생 학습동기 척도",
            "직장인 번아웃 측정",
            "지역사회 안전감 설문",
            "디지털 리터러시 자가평가",
            "가족돌봄 부담감 척도",
        ],
    },
    68: {
        "en": "SPSS-Based Statistical Analysis",
        "focus": "SPSS GUI 기반 기술·추론통계",
        "technique": "기술통계, t검정, ANOVA, 상관·회귀(SPSS)",
        "topics": [
            "직무스트레스와 이직의도",
            "학습시간과 시험성적",
            "운동빈도와 건강자가평가",
            "광고노출과 브랜드회상",
            "팀워크와 프로젝트 만족",
        ],
    },
    70: {
        "en": "Structural Equation Modeling",
        "focus": "SEM 경로·잠재변수·적합도",
        "technique": "CFA + SEM, CFI/TLI/RMSEA/SRMR",
        "topics": [
            "서비스품질→만족→충성 SEM",
            "TAM 기반 앱 수용",
            "조직몰입 매개모형",
            "자기효능감→학업성취",
            "브랜드애호→구전의도",
        ],
    },
    71: {
        "en": "Cluster Analysis",
        "focus": "계층·K-means 군집",
        "technique": "K-means, 계층군집, 실루엣, ANOVA 사후비교",
        "topics": [
            "소비자 라이프스타일 세분",
            "관광객 행동 유형",
            "학습자 온라인 패턴",
            "지역 상권 고객 군집",
            "건강관리 앱 사용자 유형",
        ],
    },
    72: {
        "en": "Basic Statistics",
        "focus": "기초 기술·확률·추론",
        "technique": "기술통계, 정규분포, t검정, 상관",
        "topics": [
            "키·몸무게 기술통계",
            "두 반 수학 시험 점수 비교",
            "독서시간과 성적 상관",
            "성별에 따른 스마트폰 사용",
            "기온과 아이스크림 판매",
        ],
    },
    73: {
        "en": "Social Science Statistics 1",
        "focus": "사회과학 1학기 수준 추론",
        "technique": "t검정, ANOVA, 카이제곱, 상관",
        "topics": [
            "정치관심도 성별차",
            "교육수준과 시민참여",
            "미디어 이용 빈도",
            "사회신뢰 척도 비교",
            "지역불균형 인식",
        ],
    },
    74: {
        "en": "Multidimensional Scaling",
        "focus": "MDS·知覚 지도",
        "technique": "MDS, 스트레스, Procrustes",
        "topics": [
            "음료 브랜드 유사성",
            "정당 이미지 지도",
            "자동차 브랜드知覚",
            "대학 이미지 MDS",
            "휴양지 선호 지도",
        ],
    },
    75: {
        "en": "Mediation and Moderation Analysis",
        "focus": "매개·조절·PROCESS",
        "technique": "회귀 기반 매개/조절, Bootstrap 간접효과",
        "topics": [
            "스트레스→수면→업무성과 매개",
            "리더십 조절효과",
            "자기결정성 매개모형",
            "사회적지지 조절",
            "몰입의 매개역할",
        ],
    },
    76: {
        "en": "Systematic Review in Social Science",
        "focus": "체계적고찰+양적 합성 연계",
        "technique": "효과크기 추출, 메타분석 보조, heterogeneity",
        "topics": [
            "원격수업 효과 고찰",
            "마음챙김 중재 효과",
            "청소년 스마트폰 중독",
            "직장 유연근무",
            "독서치료 프로그램",
        ],
    },
    77: {
        "en": "Bayesian Data Analysis",
        "focus": "베이지안 추정·MCMC",
        "technique": "베이지안 회귀, 사후분포, HDI",
        "topics": [
            "베이지안 회귀: 광고→매출",
            "계층모형: 학교 성적",
            "베이지안 A/B 테스트",
            "선거 예측 사후",
            "임상시험 반응률",
        ],
    },
    79: {
        "en": "Social Science Statistical Methods",
        "focus": "사회과학 통계 방법론",
        "technique": "GLM, 가중치, 설계효과",
        "topics": [
            "복합표본 가중 분석",
            "사회조사 패널 횡단",
            "교육격차 OLS",
            "복지수급 결정요인",
            "지역투표율 회귀",
        ],
    },
    80: {
        "en": "Social Science Statistics 2",
        "focus": "다변량·모형 확장",
        "technique": "다중회귀, MANOVA, 로지스틱",
        "topics": [
            "다중회귀: 학업성취",
            "MANOVA: 프로그램 효과",
            "정책 만족 다변량",
            "미디어 다중종속",
            "조직문화 비교",
        ],
    },
    82: {
        "en": "Regression Analysis",
        "focus": "선형회귀·가정·진단",
        "technique": "OLS, VIF, 잔차진단, 표준화계수",
        "topics": [
            "임금 결정요인 회귀",
            "주택가격 결정",
            "광고비→매출",
            "학습시간→성적",
            "운동→BMI",
        ],
    },
    83: {
        "en": "Medical Statistics",
        "focus": "임상·역학 통계",
        "technique": "생존분석 보조, OR, RR, 카이제곱",
        "topics": [
            "흡연과 폐기능",
            "신약 부작용 발생률",
            "BMI와 혈압",
            "검진 프로그램 참여",
            "재발 위험요인",
        ],
    },
    85: {
        "en": "Latent Class and Transition Analysis",
        "focus": "LCA·LTM",
        "technique": "잠재계층, 전이확률, BIC/AIC",
        "topics": [
            "청소년 위험행동 잠재계층",
            "치료 반응 유형",
            "소비자 선택 잠재클래스",
            "학습전략 전이",
            "중독 행동 잠재프로파일",
        ],
    },
    86: {
        "en": "R-Based Latent Variable Models",
        "focus": "lavaan/semPlot R 잠재변수",
        "technique": "CFA/SEM in R, lavaan",
        "topics": [
            "R lavaan: 만족모형",
            "잠재성장곡선",
            "다집단 CFA",
            "2차 요인모형",
            "측정불변성",
        ],
    },
    87: {
        "en": "Logistic Regression Analysis",
        "focus": "이분·다항 로지스틱",
        "technique": "로지스틱, OR, ROC/AUC",
        "topics": [
            "대출 연체 예측",
            "질병 유무 예측",
            "투표 참여 여부",
            "앱 구독 전환",
            "사고 발생 위험",
        ],
    },
    88: {
        "en": "Data-Driven Statistical Decision Making",
        "focus": "의사결정·검정력·비용",
        "technique": "표본크기, 검정력, 의사결정표",
        "topics": [
            "A/B 테스트 의사결정",
            "품질관리 관리도",
            "마케팅 ROI 검정",
            "채용 필터 최적화",
            "재고 수준 결정",
        ],
    },
    89: {
        "en": "Longitudinal Research",
        "focus": "종단·성장모형",
        "technique": "반복측정 ANOVA, LGCM",
        "topics": [
            "3파 종단 우울",
            "학업성취 성장",
            "직무스트레스 추적",
            "정책 전후 비교",
            "건강행동 변화",
        ],
    },
    90: {
        "en": "Exploratory Factor Analysis",
        "focus": "EFA·요인회전",
        "technique": "KMO, Bartlett, EFA, scree",
        "topics": [
            "학습전략 요인",
            "리더십 차원",
            "소비가치 EFA",
            "정신건강 척도",
            "조직문화 요인",
        ],
    },
    91: {
        "en": "Elements of Statistical Learning",
        "focus": "예측·교차검증·정규화",
        "technique": "Ridge/Lasso, CV, 분류 정확도",
        "topics": [
            "신용등급 예측",
            "이탈 예측",
            "질병 분류",
            "가격 예측",
            "텍스트 감성 분류",
        ],
    },
    92: {
        "en": "Discriminant Analysis",
        "focus": "Fisher·Mahalanobis",
        "technique": "판별함수, 분류정확도, 혼동행렬",
        "topics": [
            "대학 전공 적합 분류",
            "고객 이탈/유지",
            "종양 양성/악성",
            "브랜드 선호 군",
            "학습자 유형 분류",
        ],
    },
    93: {
        "en": "Panel Data Econometrics",
        "focus": "패널 고정/랜덤효과",
        "technique": "FE/RE, Hausman, cluster SE",
        "topics": [
            "기업 R&D와 특허",
            "개인 임금 패널",
            "지역 GDP 패널",
            "온실가스 배출",
            "은행 건전성 패널",
        ],
    },
    94: {
        "en": "Confirmatory Factor Analysis",
        "focus": "CFA·측정모형",
        "technique": "CFA, CR/AVE, Fornell-Larcker",
        "topics": [
            "서비스품질 5차원 CFA",
            "디지털 역량 척도",
            "조직신뢰 측정모형",
            "브랜드 자산 CFA",
            "교육만족 확인적요인",
        ],
    },
    95: {
        "en": "SPSS Statistical Analysis",
        "focus": "SPSS 실무 워크플로",
        "technique": "SPSS 전 과정, Syntax 재현",
        "topics": [
            "설문 데이터 SPSS 정리",
            "그룹비교 SPSS t/ANOVA",
            "회귀 SPSS",
            "요인분석 SPSS",
            "교차표 카이제곱 SPSS",
        ],
    },
    96: {
        "en": "Causal Inference",
        "focus": "인과·DID·IV·PSM",
        "technique": "DID, PSM, IV, RDD",
        "topics": [
            "최저임금 DID",
            "교육프로그램 PSM",
            "흡연 규제 자연실험",
            "정책 시행 전후",
            "도구변수 임금",
        ],
    },
    97: {
        "en": "Survey Design 2",
        "focus": "2차 설계·표집·비응답",
        "technique": "층화·집락, nonresponse bias",
        "topics": [
            "전국 표본가구 조사",
            "학교 집락표본",
            "온라인 패널 설계",
            "전화 CATI 설계",
            "혼합모드 조사",
        ],
    },
    98: {
        "en": "Survey Item Design",
        "focus": "문항 타당도·Cognitive interview",
        "technique": "문항분석, EFA, cognitive testing",
        "topics": [
            "정치 efficacy 문항",
            "건강행동 문항",
            "디지털 포용 문항",
            "직무 만족 문항",
            "환경행동 문항",
        ],
    },
    99: {
        "en": "Experimental and Quasi-Experimental Design",
        "focus": "실험·준실험·RCT",
        "technique": "ANOVA/ANCOVA, 무작위배정",
        "topics": [
            "학습앱 RCT",
            "광고 A/B 실험",
            "교육개입 준실험",
            "nudge 행동실험",
            "약물 대조실험",
        ],
    },
    100: {
        "en": "Experimental Design and Analysis",
        "focus": "요인설계·분산분석",
        "technique": "2×2 ANOVA, interaction",
        "topics": [
            "2×2 광고×성별",
            "학습전략×시간",
            "온도×습도 반응",
            "UI×과업 ANOVA",
            "가격×브랜드",
        ],
    },
    101: {
        "en": "Mixed Survey Methods",
        "focus": "양적+질적 혼합(양적 중심)",
        "technique": "설문+개방문항 코딩, quant dominant",
        "topics": [
            "설문+개방: 정책수용",
            "만족도+서술",
            "교육평가 혼합",
            "병원경험 혼합",
            "직장문화 혼합",
        ],
    },
    102: {
        "en": "Multivariate Statistical Analysis",
        "focus": "다변량 종합",
        "technique": "MANOVA, PCA, 회귀, 판별",
        "topics": [
            "다중 결과 MANOVA",
            "PCA 소비지표",
            "다변량 회귀",
            "프로파일 분석",
            "Hotelling T²",
        ],
    },
    103: {
        "en": "Practical Statistics for Medical Research",
        "focus": "의학 연구 실무",
        "technique": "t검정, 카이, 회귀, survival intro",
        "topics": [
            "무작위 대조 trial",
            "case-control OR",
            "코호트 RR",
            "진단검사 민감도",
            "다기관 임상",
        ],
    },
    104: {
        "en": "Econometrics",
        "focus": "계량 추정·가정",
        "technique": "OLS, 2SLS, heteroskedasticity",
        "topics": [
            "임금方程",
            "수요함수 추정",
            "인플레이션 결정",
            "교육수익률",
            "무역 결정요인",
        ],
    },
    105: {
        "en": "Survey Methodology (Quantitative Models)",
        "focus": "QT-038(양적·통계·모형)",
        "technique": "표본설계, 가중치, SE",
        "topics": [
            "가구패널 표본설계",
            "비응답 조정",
            "측정오차 모형",
            "혼합집락",
            "표본크기 산출",
        ],
    },
    106: {
        "en": "Survey Methodology (Advanced Sampling)",
        "focus": "QT-038 심화 표집",
        "technique": "복합표본, Taylor linearization",
        "topics": [
            "다단계 집락",
            "층화+가중",
            "전화 RDD",
            "지역 quota",
            "패널 attrition",
        ],
    },
    107: {
        "en": "Survey Item Design 1",
        "focus": "문항 설계 1",
        "technique": "문항분석, pilot, reliability",
        "topics": [
            "생활만족 문항",
            "정치참여 문항",
            "건강검진 문항",
            "모바일 결제 문항",
            "공공서비스 문항",
        ],
    },
    108: {
        "en": "Cross-Section and Panel Econometrics",
        "focus": "횡단·패널",
        "technique": "FE/RE, dynamic panel",
        "topics": [
            "가계소득 패널",
            "기업투자 패널",
            "지역재정 횡단",
            "노동시장 전환",
            "환율·수출 패널",
        ],
    },
    109: {
        "en": "Linear Statistical Models",
        "focus": "선형모형 GLM 기초",
        "technique": "LM, ANOVA as LM, contrast",
        "topics": [
            "ANCOVA 공변량",
            "다중비교 contrast",
            "블록 회귀",
            "다층 선형모형 intro",
            "반복측정 LM",
        ],
    },
    110: {
        "en": "Discriminant Analysis and Pattern Recognition",
        "focus": "판별·패턴인식",
        "technique": "LDA, QDA, kNN, CV accuracy",
        "topics": [
            "필기체 숫자 분류",
            "스팸 분류",
            "질병 하위유형",
            "소비자 세그먼트",
            "센서 패턴",
        ],
    },
    123: {
        "en": "Statistical NLP Basics",
        "focus": "텍스트 통계·분류",
        "technique": "TF-IDF, 나이브베이즈, 로지스틱",
        "topics": [
            "뉴스 주제 분류",
            "리뷰 감성",
            "스팸 메일",
            "키워드 추출",
            "문서 군집",
        ],
    },
    158: {
        "en": "Meta-Analysis",
        "focus": "효과크기 합성",
        "technique": "Hedges g, I², forest plot, funnel",
        "topics": [
            "심리치료 효과",
            "교육개입 효과",
            "운동 중재",
            "약물 efficacy",
            "조직개입 효과",
        ],
    },
    172: {
        "en": "Modern Multidimensional Scaling",
        "focus": "현대 MDS·비선형",
        "technique": "metric/nonmetric MDS, stress",
        "topics": [
            "맛 프로파일 MDS",
            "색 지각 MDS",
            "정치공간 MDS",
            "향수知覚",
            "도시 이미지",
        ],
    },
    176: {
        "en": "Social Survey Methodology",
        "focus": "사회조사 표준",
        "technique": "KSTAT/GSS 스타일, weighting",
        "topics": [
            "사회복지 인식 조사",
            "가계 금융 조사",
            "노동력 조사",
            "교육실태 조사",
            "시민의식 조사",
        ],
    },
    178: {
        "en": "Income Dynamics Panel",
        "focus": "소득동학·패널",
        "technique": "패널 회귀, 소득 이동",
        "topics": [
            "가계소득 이동성",
            "빈곤 탈출",
            "임금 분포 변화",
            "자산 축적",
            "세대간 소득",
        ],
    },
    197: {
        "en": "Survey Methodology (Evaluation and Mixed)",
        "focus": "QT-038(평가·종합)",
        "technique": "혼합설계, triangulation, quality",
        "topics": [
            "프로그램 평가 설문",
            "공공서비스 만족",
            "정책 인지도",
            "시민참여 조사",
            "지역계획 수용",
        ],
    },
}


def safe_filename(name_ko: str, en: str, no: int) -> str:
    base = name_ko
    if name_ko == "QT-038":
        base = f"{name_ko}{no}"
    bad = r'<>:"/\\|?*'
    for ch in bad:
        base = base.replace(ch, "")
    return f"{ARCHETYPE_KO}-{base}({en}).xlsx"


def research_question(topic: str, focus: str) -> str:
    return f"「{topic}」에 대해 {focus} 관점에서 측정·분석하면 어떤 관계와 차이가 나타나는가?"


def detail_and_sample(
    stage_idx: int,
    task_idx: int,
    task_text: str,
    ctx: dict,
) -> tuple[str, str]:
    topic = ctx["topic"]
    method = ctx["method"]
    focus = ctx["focus"]
    technique = ctx["technique"]
    n = ctx["n"]
    alpha = ctx["alpha"]

    if stage_idx == 0:
        samples = [
            (
                f"모집단: {topic}과 관련 경험이 있는 성인(또는 해당 집단). "
                f"표본: n={n}, {method} 관점에서 {'층화·집락' if '패널' in method or '조사' in method else '단순무작위/쿼터'} 표집. "
                f"표집틀·오차·대체 규칙 문서화.",
                f"[표본설계표] 모집단 정의 | 표집방법 | 목표 n={n} | 실제 n={n - 12} | 응답률 78.4%",
            ),
            (
                f"측정도구: {topic}용 5~7점 Likert {ctx['items']}문항 + 인구통계. "
                f"Cognitive interview 5명 후 문항 수정. Pilot n=30, α={alpha - 0.05:.2f} 미만 문항 2개 삭제.",
                f"[Pilot] 문항 | 수정 전 r(item-total) | 수정 후 | α={alpha:.2f}",
            ),
            (
                f"본조사: CAWI/CAPI 혼합, 2026.03–04, IRB 승인. "
                f"결측·중도 이탈 로그 저장. {method} 핵심 변수 {focus} 포함.",
                f"[Raw data] id, wave, Q1…Q{ctx['items']}, demo — {n - 12}행 × {ctx['items'] + 8}열",
            ),
        ]
        return samples[task_idx]

    if stage_idx == 1:
        samples = [
            (
                f"결측: listwise 3.2%, MCAR Little p=.21 → 단순 대체+민감도. "
                f"이상치 IQR·z>|3| 4건 winsorize.",
                "결측 패턴표 | 처리 전 n | 처리 후 n | 규칙",
            ),
            (
                f"역채점 4문항(R*) 식별 후 합산. 하위척도 {topic[:8]}… mean score 산출.",
                f"척도점수: subscale_mean, composite_score (1–5)",
            ),
            (
                f"Cronbach α={alpha:.2f} (≥.70). EFA/CFA 필요 시 KMO={ctx['kmo']:.2f}. "
                f"수렴·판별 타당도 검토({method}).",
                f"신뢰도표: 척도 | α | 문항수 | 삭제시 α",
            ),
            (
                "범주형 gender, region 더미. 순서형 education 1–4. "
                "연속형 age 표준화. 분석용 analysis.sav/.csv 저장.",
                "코드북: 변수명 | 값라벨 | 유형 | 비고",
            ),
        ]
        return samples[task_idx]

    if stage_idx == 2:
        return (
            f"개방형 Q_open 1문항 → 키워드 12개 범주 → 빈도코딩(qualitative coding 아님, 빈도용). "
            f"해당 없으면 '해당없음' 기록.",
            "open_code | freq | 예시 응답 1줄",
        )

    if stage_idx == 3:
        tech_note = technique
        samples = [
            (
                f"기술통계: {topic} 핵심 변수 mean, SD, skew/kurtosis, 빈도표. "
                f"집단별 교차표.",
                "Table1 Descriptives | M | SD | N",
            ),
            (
                "Shapiro-Wilk, Levene, 잔차 정규성(회귀 시). "
                "위반 시 robust/비모수 대안 기록.",
                "Assumption check | test | stat | p | decision",
            ),
            (
                f"특화기법({method}): {tech_note}. "
                f"가설 H1–H3에 맞춰 모형 추정, software 옵션 고정.",
                f"Model output: {tech_note.split(',')[0]} | coef | SE | p | 95% CI",
            ),
            (
                "Cohen's d / η² / OR 등 효과크기.report p-value + 실질적 크기 해석.",
                "Effects: H1 d=0.42 p=.018 | H2 β=.31 p=.004",
            ),
        ]
        return samples[task_idx]

    if stage_idx == 4:
        samples = [
            (
                "가설별 α=.05 기준 채택/기각. 다중비교 시 Bonferroni/FDR.",
                "Hypothesis | result | p | effect",
            ),
            (
                f"SEM/CFA 해당 시 CFI={ctx['cfi']:.2f}, TLI={ctx['tli']:.2f}, RMSEA={ctx['rmsea']:.3f}, SRMR={ctx['srmr']:.3f}. "
                f"해당 없으면 'N/A — {technique} 중심 분석'.",
                "Fit indices table",
            ),
            (
                f"{topic} 결과를 표·막대/산점도로 Figure 1–2. "
                f"본문 해석 2–3문단 + 한계(표본·단면·Common method).",
                "Figure1 | Table2 Regression/Model | Discussion bullets",
            ),
        ]
        return samples[task_idx]

    # deliverable
    return (
        f"최종 패키지: (1) 분석 결과표 Word/Excel (2) {method} 재현 syntax/R script "
        f"(3) 적합도·효과크기 요약 1p (4) 부록 코드북.",
        f"▶ 산출물: {topic} — 통계분석 결과표 및 모형 적합도(CFI={ctx['cfi']:.2f}, RMSEA={ctx['rmsea']:.3f} 등)",
    )


def build_context(method_name: str, meta: dict, topic: str, topic_i: int) -> dict:
    seed = (hash(method_name) + hash(topic)) % 1000
    n = 280 + (seed % 220)
    return {
        "topic": topic,
        "method": method_name,
        "focus": meta["focus"],
        "technique": meta["technique"],
        "n": n,
        "items": 14 + (topic_i % 6),
        "alpha": 0.78 + (seed % 15) / 100,
        "kmo": 0.82 + (seed % 12) / 100,
        "cfi": 0.91 + (seed % 8) / 100,
        "tli": 0.90 + (seed % 8) / 100,
        "rmsea": 0.04 + (seed % 6) / 100,
        "srmr": 0.05 + (seed % 5) / 100,
    }


def write_topic_sheet(ws, method: dict, meta: dict, topic: str, topic_i: int, sheet_label: str):
    ctx = build_context(method["name"], meta, topic, topic_i)
    header_fill = PatternFill("solid", fgColor="D9E1F2")
    stage_fill = PatternFill("solid", fgColor="F2F2F2")
    bold = Font(bold=True)

    ws["A1"] = "방법론적 아키타입"
    ws["B1"] = f"{ARCHETYPE_KO}({ARCHETYPE_EN})"
    ws["A2"] = "연구방법"
    ws["B2"] = f"{method['name']}({meta['en']})"
    ws["A3"] = "시트(주제)"
    ws["B3"] = sheet_label
    ws["A4"] = "연구주제"
    ws["B4"] = topic
    ws["A5"] = "연구질문(예)"
    ws["B5"] = research_question(topic, meta["focus"])
    ws["A6"] = "방법 특화 초점"
    ws["B6"] = meta["focus"]
    ws["A7"] = "주요 통계기법"
    ws["B7"] = meta["technique"]

    start_row = 9
    headers = [
        "단계",
        "절차적 단계(Procedural Stage)",
        "단계 절차(전체)",
        "세부 태스크(Procedural Task)",
        "상세 실행 절차",
        "결과물 샘플(Sample Deliverable)",
        "완료",
    ]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col, value=h)
        cell.font = bold
        cell.fill = header_fill
        cell.alignment = Alignment(wrap_text=True, vertical="top")

    row = start_row + 1
    for si, stage in enumerate(STAGES):
        first_task_row = row
        for ti, task in enumerate(stage["tasks"]):
            ws.cell(row=row, column=1, value=stage["order"] if ti == 0 else "")
            ws.cell(row=row, column=2, value=stage["label_ko"] if ti == 0 else "")
            ws.cell(row=row, column=3, value=stage["summary"] if ti == 0 else "")
            ws.cell(row=row, column=4, value=task)
            detail, sample = detail_and_sample(si, ti, task, ctx)
            ws.cell(row=row, column=5, value=detail)
            ws.cell(row=row, column=6, value=sample)
            ws.cell(row=row, column=7, value=f"완료 → 시트{topic_i}")
            for c in range(1, 8):
                ws.cell(row=row, column=c).alignment = Alignment(wrap_text=True, vertical="top")
            if ti == 0:
                for c in range(1, 4):
                    ws.cell(row=row, column=c).fill = stage_fill
            row += 1
        if len(stage["tasks"]) > 1:
            for col in (1, 2, 3):
                ws.merge_cells(
                    start_row=first_task_row,
                    start_column=col,
                    end_row=row - 1,
                    end_column=col,
                )

    widths = [6, 14, 36, 42, 48, 40, 14]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def main():
    bundle = json.loads(BUNDLE.read_text(encoding="utf-8"))
    methods = bundle["methods"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    missing = []
    for m in methods:
        no = m["no"]
        if no not in METHOD_META:
            missing.append(no)
            continue
        meta = METHOD_META[no]
        wb = openpyxl.Workbook()
        wb.remove(wb.active)
        for i, topic in enumerate(meta["topics"], 1):
            label = f"시트{i}(주제{i})"
            sheet_name = f"시트{i}(주제{i})"[:31]
            ws = wb.create_sheet(title=sheet_name)
            write_topic_sheet(ws, m, meta, topic, i, label)
        fname = safe_filename(m["name"], meta["en"], no)
        path = OUT_DIR / fname
        wb.save(path)
        print("Wrote", path.name)

    if missing:
        print("Missing meta for method nos:", missing)
    print("Done.", len(methods) - len(missing), "files in", OUT_DIR)


if __name__ == "__main__":
    main()
