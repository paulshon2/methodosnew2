# -*- coding: utf-8 -*-
"""Canonical topics & case specs per method (48 × 5) for refined docx samples."""

from __future__ import annotations

# Each topic: title, population, frame, sampling, mode, constructs, n_items, analysis_key, h1
# analysis_key drives method-appropriate statistics in the generator.

def _t(title, pop, frame, sampling, mode, constructs, items, akey, h1):
    return {
        "title": title,
        "population": pop,
        "frame": frame,
        "sampling": sampling,
        "mode": mode,
        "constructs": constructs,
        "n_items": items,
        "analysis_key": akey,
        "hypothesis": h1,
    }


METHOD_PROFILES: dict[int, dict] = {
    1: {
        "en": "Marketing Research",
        "topics": [
            _t("신제품 컨셉 테스트(Concept Test)", "지난 3개월 내 해당 카테고리 구매 경험 20–59세", "패널 DB + POS 가맹점 회원", "층화(성별×연령) 무작위 n=400", "온라인 CAWI", "구매의도·독특성·가격수용", 18, "concept_anova", "H1: 컨셉 A의 구매의도가 B보다 높다"),
            _t("브랜드 추적조사(Brand Tracking)", "전국 20–69세 일반소비자", "Kstat 표본틀", "다단계 집락+가중 n=1200", "CATI+CAWI 혼합", "상기도·최빈사용·NPS", 22, "tracking_regression", "H1: 광고노출 빈도가 상기도에 정(+)의 영향"),
            _t("가격민감도 조사(Gabor-Granger)", "프리미엄 생수 구매자", "온라인몰 구매자 표본", "쿼터(지역·연령) n=350", "CAWI", "구매확률×가격점", 12, "price_logit", "H1: 가격 상승 시 구매확률 감소"),
            _t("광고 캠페인 사전·사후(Pretest-Posttest)", "캠페인 타깃 30–49세", "미디어 플랫폼 이용자", "무작위 대조 노출군/비노출 n=300", "온라인 패널", "브랜드태도·구매의도", 16, "ad_anova", "H1: 노출군 브랜드태도 > 비노출군"),
            _t("고객만족·충성도(CSAT-CLI)", "국내 이동통신 가입자", "CRM 가입자 리스트", "층화(요금제) n=500", "CAWI+SMS 초대", "만족·충성·이탈의도", 20, "csat_sem_lite", "H1: 만족이 충성도에 정(+) 영향"),
        ],
    },
    2: {
        "en": "Public Opinion Polling",
        "topics": [
            _t("지방선거 투표성향 조사", "선거구 만 18세 이상 유권자", "주민등록 인구통계 틀", "RDD+휴대전화 층화 n=1000", "CATI", "정당지지·후보인지", 14, "poll_weighted", "H1: 연령대별 정당지지율 차이"),
            _t("국정수행·경제인식 여론", "전국 19세 이상", "Kstat", "집락+가중 n=1500", "CATI/CAWI", "국정평가·경기전망", 12, "poll_crosstab", "H1: 경제인식이 국정평가와 상관"),
            _t("정책 지지도(복지·세제)", "전국 성인", "표본틀", "무작위 n=800", "CAWI", "정책지지·부담인식", 16, "policy_chi", "H1: 소득 quintile별 지지율 차이"),
            _t("외교·안보 이슈 인식", "19–70세", "패널", "쿼터 n=600", "CAWI", "위험인식·정책선호", 15, "poll_anova", "H1: 세대별 안보인식 차이"),
            _t("언론 신뢰·정치 양극화", "성인 전체", "Kstat", "가중 n=1200", "혼합", "언론신뢰·양극화", 18, "poll_correlation", "H1: 언론신뢰↓ 양극화↑"),
        ],
    },
    3: {
        "en": "Questionnaire Design",
        "topics": [
            _t("직무스트레스 척도 개발", "4대보험 직장인", "기업 HR 협조", "편의 n=350+Pilot30", "CAWI", "스트레스·대처", 24, "scale_development", "H1: 3요인 구조 적합"),
            _t("디지털 리터러시 자가평가 척도", "대학생", "대학 표본", "층화 n=280", "자기기입", "역량·태도", 20, "scale_development", "H1: α≥.80"),
            _t("공공서비스 만족(CSI) 설문", "행정서비스 이용자", "민원 DB", "무작위 n=400", "CAWI", "품질·만족·신뢰", 22, "scale_development", "H1: 5차원 타당"),
            _t("환경행동 Intent 척도", "성인", "패널", "쿼터 n=320", "CAWI", "태도·주관적규범·행동의도", 18, "scale_development", "H1: TPB 요인 구조"),
            _t("학습동기(Likert) 문항은행", "중·고등학생", "학교 표본", "집락 n=300", "종이+OMR", "내재·외재동기", 26, "scale_development", "H1: 문항판별력 r≥.40"),
        ],
    },
    68: {
        "en": "SPSS-Based Statistical Analysis",
        "topics": [
            _t("고객만족도: 성별 t검정(SPSS)", "서비스센터 이용 고객", "CRM 이용로그", "무작위 n=240", "CAWI", "만족 5문항", 8, "spss_ttest", "H1: 여성 CSAT > 남성"),
            _t("교수법 3집단 성적 비교(일원ANOVA)", "대학 통계학 수강생", "수강명단", "편의 3반 n=156", "성적 DB", "중간·기말", 4, "spss_anova", "H1: 교수법별 평균 차이"),
            _t("광고비–매출 상관·회귀(SPSS)", "소상공인", "상공회의소", "쿼터 n=180", "면접+자료", "광고비·매출", 6, "spss_regression", "H1: 광고비→매출 β>0"),
            _t("학력×투표성향 교차(카이제곱)", "유권자", "선거연구 표본", "층화 n=400", "CATI", "학력·투표", 5, "spss_chi", "H1: 학력과 투표 독립 아님"),
            _t("심리척도 신뢰도·EFA(SPSS)", "일반성인", "패널", "무작위 n=320", "CAWI", "불안 20문항", 20, "spss_factor", "H1: 2요인 추출"),
        ],
    },
    70: {
        "en": "Structural Equation Modeling",
        "topics": [
            _t("서비스품질→만족→충성 SEM", "호텔 이용객", "멤버십", "무작위 n=380", "CAWI", "SERVQUAL·만족·충성", 24, "sem_path", "H1: 품질→만족→충성 경로 유의"),
            _t("TAM 모형(지각유용성·용이성)", "모바일뱅킹 사용자", "은행 패널", "층화 n=420", "CAWI", "TAM 변수", 22, "sem_path", "H1: PU→사용의도"),
            _t("조직몰입 매개모형", "기업 임직원", "HR", "편의 n=350", "CAWI", "리더십·몰입·이직", 26, "sem_mediation", "H1: 몰입 매개"),
            _t("자기효능감→학업성취 SEM", "대학생", "학과", "집락 n=280", "설문", "효능·전략·성취", 20, "sem_path", "H1: 효능→성취"),
            _t("브랜드애호→구전의도", "패션브랜드 고객", "CRM", "무작위 n=360", "CAWI", "애호·신뢰·구전", 18, "sem_path", "H1: 애호→구전"),
        ],
    },
    71: {
        "en": "Cluster Analysis",
        "topics": [
            _t("소비자 라이프스타일 세분(VALS형)", "20–59세 구매자", "리서치 패널", "무작위 n=400", "CAWI", "가치·활동·구매", 28, "cluster_kmeans", "H1: k=4 군집 해석 가능"),
            _t("CRM RFM 기반 고객군집", "온라인몰 구매자", "거래 DB", "전수 표본 n=5000→분석400", "DB+설문", "R·F·M·태도", 8, "cluster_hierarchical", "H1: 고가치군 15%"),
            _t("관광객 행동 패턴 군집", "국내 관광객", "관광지 표본", "쿼터 n=320", "현장+CAWI", "동기·지출·체류", 22, "cluster_kmeans", "H1: 3유형 관광객"),
            _t("식품선호·구매빈도 군집", "가구주", "소비자 패널", "층화 n=350", "CAWI", "선호·건강·가격", 20, "cluster_kmeans", "H1: 군집별 LTV 차"),
            _t("온라인 학습자 참여 패턴", "MOOC 수강생", "LMS 로그", "무작위 n=280", "로그+설문", "참여·성취", 12, "cluster_two_step", "H1: 이탈위험군 식별"),
        ],
    },
    72: {
        "en": "Basic Statistics",
        "topics": [
            _t("키·몸무게 기술통계", "대학생", "보건센터", "편의 n=120", "측정", "키·몸무게", 2, "descriptive", "H1: 남녀 평균 키 차"),
            _t("두 반 시험점수 t검정", "중학생", "학교", "2반 n=64", "시험", "점수", 1, "ttest", "H1: μ1≠μ2"),
            _t("독서시간–성적 상관", "고등학생", "학교", "n=90", "설문+성적", "시간·성적", 3, "correlation", "H1: r>0"),
            _t("성별 스마트폰 사용 ANOVA", "청소년", "학교", "n=150", "설문", "사용시간", 4, "anova", "H1: 학년별 차"),
            _t("기온–아이스크림 판매 회귀", "매장", "POS", "30일 n=30", "기록", "기온·판매", 2, "regression", "H1: β>0"),
        ],
    },
    73: {
        "en": "Social Science Statistics 1",
        "topics": [
            _t("GSS형 정치관심 성별차", "성인", "표본틀", "무작위 n=500", "CAWI", "관심·참여", 10, "ttest_chi", "H1: 정치관심 성별차"),
            _t("교육수준과 시민참여", "성인", "Kstat", "n=600", "CATI", "학력·참여", 8, "correlation", "H1: 학력↑ 참여↑"),
            _t("미디어 이용 빈도", "10대·20대", "학교·패널", "n=400", "CAWI", "SNS·TV", 12, "anova", "H1: 연령별 차"),
            _t("사회신뢰 척도 비교", "성인", "패널", "n=450", "CAWI", "일반·기관신뢰", 14, "ttest", "H1: 세대차"),
            _t("지역불균형 인식", "전국", "Kstat", "n=700", "CAWI", "인식·정책", 11, "regression", "H1: 지역 변수 유의"),
        ],
    },
    74: {
        "en": "Multidimensional Scaling",
        "topics": [
            _t("음료 브랜드知覚 지도", "20–40세", "패널", "n=200", "유사성 판정", "브랜드쌍", 15, "mds_metric", "H1: stress<.15"),
            _t("정당 이미지 MDS", "유권자", "표본", "n=250", "CAWI", "정당 유사", 10, "mds_nonmetric", "H1: 2차원 해석"),
            _t("자동차 브랜드 포지셔닝", "잠재구매자", "딜러", "n=220", "조사", "속성·유사", 12, "mds_metric", "H1: luxury vs economy 축"),
            _t("대학 이미지 MDS", "고3", "학교", "n=180", "설문", "대학쌍", 8, "mds", "H1: 지역·전공 축"),
            _t("휴양지 선호 지도", "직장인", "패널", "n=210", "CAWI", "지역 유사", 9, "mds", "H1: 가격·자연 축"),
        ],
    },
    75: {
        "en": "Mediation and Moderation Analysis",
        "topics": [
            _t("스트레스→수면→업무성과 매개", "직장인", "기업", "n=320", "CAWI", "스트레스·수면·성과", 18, "mediation", "H1: 간접효과 유의"),
            _t("리더십×팀응집 조절", "팀 단위", "IT기업", "n=280", "CAWI", "리더십·응집·성과", 20, "moderation", "H1: 조절 유의"),
            _t("자기결정성 매개", "학습자", "대학", "n=250", "설문", "SDT", 16, "mediation", "H1: 매개"),
            _t("사회적지지 조절(건강)", "환자", "병원", "n=200", "설문", "지지·스트레스", 14, "moderation", "H1: buffer"),
            _t("몰입 매개(몰입이론)", "게임 이용자", "패널", "n=300", "CAWI", "몰입·만족", 15, "mediation", "H1: 간접"),
        ],
    },
    76: {
        "en": "Systematic Review in Social Science",
        "topics": [
            _t("원격수업 효과 SR+메타", "K-12·대학 연구", "DB 검색", "연구 k=42", "문헌", "효과크기 g", 0, "meta_sr", "H1: g>0"),
            _t("마음챙김 중재 SR", "성인 RCT", "PsycINFO", "k=35", "문헌", "우울 g", 0, "meta_sr", "H1: 중재효과"),
            _t("스마트폰 중독 SR", "청소년", "DB", "k=28", "문헌", "중독 척도", 0, "meta_sr", "H1: 위험요인"),
            _t("유연근무 SR", "직장인", "DB", "k=30", "문헌", "만족·성과", 0, "meta_sr", "H1: 혼합"),
            _t("독서치료 프로그램 SR", "아동·청소년", "DB", "k=22", "문헌", "literacy", 0, "meta_sr", "H1: 효과"),
        ],
    },
    77: {
        "en": "Bayesian Data Analysis",
        "topics": [
            _t("베이지안 회귀: 광고→매출", "소상공인", "조사", "n=150", "면접", "광고·매출", 5, "bayes_reg", "H1: β>0 HDI"),
            _t("계층모형: 학교 성적", "학생", "NEIS", "n=800", "행정", "성적", 4, "bayes_hlm", "H1: 학교효과"),
            _t("베이지안 A/B 테스트", "웹 이용자", "로그", "n=10000", "실험", "전환", 2, "bayes_ab", "H1: B>A"),
            _t("선거 예측 베이지안", "유권자", "여론", "n=2000", "조사", "투표", 6, "bayes_poll", "H1: posterior"),
            _t("임상 반응률 베이지안", "환자", "병원", "n=120", "RCT", "반응", 3, "bayes_clinical", "H1: OR"),
        ],
    },
    79: {
        "en": "Social Science Statistical Methods",
        "topics": [
            _t("복합표본 가중 추정", "전국 성인", "Kstat", "n=1500", "CATI", "복지태도", 12, "weighted_glm", "H1: 가중 추정"),
            _t("사회조사 패널 횡단", "패널 가구", "가구패널", "n=5000", "면접", "소득·소비", 20, "survey_glm", "H1: 소득→소비"),
            _t("교육격차 OLS", "학생", "교육통계", "n=2000", "행정+설문", "성취", 10, "ols_robust", "H1: SES gap"),
            _t("복지수급 결정요인", "저소득층", "행정", "n=800", "면접", "수급·욕구", 14, "logit", "H1: OR"),
            _t("지역투표율 회귀", "시군구", "선관위", "n=230", "집계", "투표율", 8, "ecological_reg", "H1: 인구학"),
        ],
    },
    80: {
        "en": "Social Science Statistics 2",
        "topics": [
            _t("다중회귀: 학업성취", "대학생", "학교", "n=350", "설문", "성취", 12, "mr", "H1: R²"),
            _t("MANOVA: 프로그램 효과", "참여자", "기관", "n=180", "실험", "다중결과", 8, "manova", "H1: Wilks"),
            _t("정책 만족 다변량", "시민", "조사", "n=400", "CAWI", "만족차원", 15, "manova", "H1: 집단차"),
            _t("미디어 다중종속", "청소년", "학교", "n=320", "설문", "SNS·게임", 10, "manova", "H1: 성별"),
            _t("조직문화 비교", "공기업", "HR", "n=280", "설문", "문화차원", 24, "discriminant_manova", "H1: 부서차"),
        ],
    },
    82: {
        "en": "Regression Analysis",
        "topics": [
            _t("임금 결정 OLS(Mincer형)", "임금근로자", "경제활동조사", "n=1200", "조사", "임금·교육·경력", 10, "ols", "H1: 교육↑ 임금↑"),
            _t("주택가격 헤도닉 회귀", "아파트 거래", "실거래가", "n=800", "행정", "가격·면적", 12, "ols", "H1: 면적 β"),
            _t("광고비→매출 회귀", "기업", "DART", "n=200", "재무", "광고·매출", 6, "ols", "H1: β>0"),
            _t("학습시간→성적", "학생", "학교", "n=150", "설문", "시간·성적", 4, "ols", "H1: β>0"),
            _t("운동→BMI", "성인", "건강검진", "n=400", "검진", "운동·BMI", 5, "ols", "H1: β<0"),
        ],
    },
    83: {
        "en": "Medical Statistics",
        "topics": [
            _t("흡연과 FEV1", "40–70세", "건강검진", "n=350", "검진", "흡연·폐기능", 6, "ttest_anova", "H1: 흡연↓ FEV1"),
            _t("신약 부작용 RCT", "환자", "병원", "n=160", "RCT", "부작용", 4, "chi_rr", "H1: OR>1"),
            _t("BMI와 수축기혈압", "성인", "검진", "n=500", "검진", "BMI·BP", 4, "correlation", "H1: r>0"),
            _t("검진 프로그램 참여", "40세+", "건강센터", "n=600", "설문", "참여", 8, "logistic", "H1: OR"),
            _t("재발 위험 Cox(개념)", "암 생존자", "병원", "n=200", "추적", "재발", 5, "survival_intro", "H1: HR"),
        ],
    },
    85: {
        "en": "Latent Class and Transition Analysis",
        "topics": [
            _t("청소년 위험행동 LCA", "중·고", "학교", "n=400", "설문", "음주·흡연·성", 12, "lca", "H1: 3class"),
            _t("치료 반응 잠재계층", "환자", "병원", "n=180", "RCT", "반응패턴", 8, "lca", "H1: responder"),
            _t("소비자 선택 LCA", "구매자", "패널", "n=350", "CAWI", "선택", 10, "lca", "H1: class"),
            _t("학습전략 LTA", "학생", "학교", "2파 n=300", "설문", "전략", 10, "lta", "H1: 전이"),
            _t("중독 행동 LPA", "성인", "클리닉", "n=220", "설문", "중독", 14, "lpa", "H1: profile"),
        ],
    },
    86: {
        "en": "R-Based Latent Variable Models",
        "topics": [
            _t("lavaan 만족 SEM", "고객", "CRM", "n=320", "CAWI", "만족", 18, "lavaan_sem", "H1: fit"),
            _t("잠재성장 LGCM", "학생", "학교", "3파 n=250", "추적", "성취", 6, "lgcm", "H1: 기울기"),
            _t("다집단 CFA", "국가", "ISSP", "n=800", "설문", "태도", 12, "mg_cfa", "H1: invariant"),
            _t("2차 요인모형", "소비자", "조사", "n=280", "CAWI", "브랜드", 20, "second_order", "H1: fit"),
            _t("측정불변성", "집단", "조사", "n=400", "CAWI", "척도", 16, "invariance", "H1: scalar"),
        ],
    },
    87: {
        "en": "Logistic Regression Analysis",
        "topics": [
            _t("대출 연체 예측", "차주", "금융", "n=2000", "행정", "연체", 10, "logistic", "H1: OR"),
            _t("질병 유무 예측", "성인", "검진", "n=600", "검진", "질병", 8, "logistic", "H1: AUC"),
            _t("투표 참여", "유권자", "조사", "n=800", "CATI", "투표", 9, "logistic", "H1: OR"),
            _t("앱 구독 전환", "무료 사용자", "로그", "n=1500", "CAWI", "전환", 7, "logistic", "H1: OR"),
            _t("낙상 위험(노인)", "65+", "요양", "n=250", "평가", "낙상", 12, "logistic", "H1: OR"),
        ],
    },
    88: {
        "en": "Data-Driven Statistical Decision Making",
        "topics": [
            _t("A/B 테스트 의사결정", "웹", "로그", "n=20000", "실험", "CTR", 2, "ab_power", "H1: lift"),
            _t("SPC 관리도", "공정", "공장", "n=500", "측정", "불량", 3, "spc", "H1: out of control"),
            _t("마케팅 ROI 검정", "캠페인", "광고", "n=50", "집계", "ROI", 4, "decision_test", "H1: ROI>0"),
            _t("채용 필터", "지원자", "HR", "n=800", "테스트", "합격", 6, "classification", "H1: accuracy"),
            _t("재고 수준", "SKU", "ERP", "n=200", "기록", "재고", 5, "inventory", "H1: cost min"),
        ],
    },
    89: {
        "en": "Longitudinal Research",
        "topics": [
            _t("3파 종단 우울", "성인", "패널", "n=450", "CAWI", "PHQ-9", 9, "longitudinal", "H1: 감소"),
            _t("학업성취 성장", "학생", "학교·학적 DB", "4파 종단 n=300", "행정+설문", "성적", 4, "lgm", "H1: slope"),
            _t("직무스트레스 추적", "직장인", "기업", "3파 n=280", "CAWI", "stress", 14, "repeated_anova", "H1: time"),
            _t("정책 전후", "시민", "조사", "2파 n=600", "CAWI", "인식", 10, "did_lite", "H1: diff"),
            _t("건강행동 변화", "성인", "건강", "3파 n=320", "설문", "행동", 12, "growth", "H1: change"),
        ],
    },
    90: {
        "en": "Exploratory Factor Analysis",
        "topics": [
            _t("학습전략 EFA", "대학생", "학교", "n=350", "설문", "전략 24", 24, "efa", "H1: 3factor"),
            _t("리더십 차원 EFA", "관리자", "기업", "n=280", "CAWI", "리더 20", 20, "efa", "H1: 4factor"),
            _t("소비가치 EFA", "소비자", "패널", "n=320", "CAWI", "가치 18", 18, "efa", "H1: 2factor"),
            _t("정신건강 척도 EFA", "성인", "클리닉", "n=250", "설문", "증상 22", 22, "efa", "H1: factor"),
            _t("조직문화 EFA", "직원", "공기업", "n=300", "CAWI", "문화 26", 26, "efa", "H1: 5factor"),
        ],
    },
    91: {
        "en": "Elements of Statistical Learning",
        "topics": [
            _t("신용등급 분류", "차주", "금융", "n=5000", "행정", "특성", 15, "ml_class", "H1: AUC"),
            _t("고객 이탈 예측", "구독", "CRM", "n=8000", "로그", "이탈", 12, "ml_class", "H1: F1"),
            _t("질병 분류", "환자", "병원", "n=1200", "검진", "질병", 10, "ml_class", "H1: acc"),
            _t("주택가격 예측", "거래", "실거래", "n=3000", "행정", "가격", 20, "ml_reg", "H1: RMSE"),
            _t("리뷰 감성", "이용자", "플랫폼", "n=10000", "텍스트", "감성", 5, "ml_text", "H1: F1"),
        ],
    },
    92: {
        "en": "Discriminant Analysis",
        "topics": [
            _t("전공 적합 Fisher", "고3", "학교", "n=200", "검사", "적성", 10, "lda", "H1: classify"),
            _t("고객 이탈 LDA", "고객", "CRM", "n=400", "DB", "행동", 8, "lda", "H1: hit rate"),
            _t("종양 양성/악성", "환자", "병원", "n=150", "영상", "지표", 6, "lda", "H1: sens"),
            _t("브랜드 선호 군", "소비자", "조사", "n=280", "CAWI", "선호", 12, "lda", "H1: Wilks"),
            _t("학습자 유형", "학생", "LMS", "n=220", "로그", "패턴", 9, "qda", "H1: accuracy"),
        ],
    },
    93: {
        "en": "Panel Data Econometrics",
        "topics": [
            _t("기업 R&D 패널", "제조업", "KIS", "n=500×5", "패널", "R&D·특허", 6, "panel_fe", "H1: FE"),
            _t("개인 임금 패널", "근로자", "KLIPS", "n=2000×8", "패널", "임금", 8, "panel_fe", "H1: union"),
            _t("지역 GDP 패널", "시도", "통계", "n=17×10", "패널", "GDP", 5, "panel_re", "H1: invest"),
            _t("온실가스 배출", "국가", "OECD", "n=30×15", "패널", "CO2", 6, "panel_fe", "H1: policy"),
            _t("은행 건전성", "은행", "금감원", "n=20×12", "패널", "BIS", 7, "panel_fe", "H1: capital"),
        ],
    },
    94: {
        "en": "Confirmatory Factor Analysis",
        "topics": [
            _t("SERVQUAL 5차원 CFA", "서비스 이용", "조사", "n=380", "CAWI", "SERV 22", 22, "cfa", "H1: fit"),
            _t("디지털 역량 CFA", "성인", "패널", "n=350", "CAWI", "역량 18", 18, "cfa", "H1: AVE"),
            _t("조직신뢰 CFA", "직원", "기업", "n=320", "CAWI", "신뢰 15", 15, "cfa", "H1: CR"),
            _t("브랜드 자산 CFA", "소비자", "조사", "n=360", "CAWI", "브랜드 20", 20, "cfa", "H1: fit"),
            _t("교육만족 CFA", "학생", "대학", "n=280", "설문", "만족 16", 16, "cfa", "H1: fit"),
        ],
    },
    95: {
        "en": "SPSS Statistical Analysis",
        "topics": [
            _t("사회조사 데이터 정리(SPSS)", "성인", "GSS형", "n=500", "CAWI", "인구·태도", 25, "spss_descriptive", "H1: freq"),
            _t("집단비교 SPSS t/ANOVA", "학생", "학교", "n=180", "시험", "점수", 3, "spss_anova", "H1: mean diff"),
            _t("회귀 SPSS(Analyze-Regression)", "근로자", "조사", "n=250", "CAWI", "임금", 8, "spss_regression", "H1: β"),
            _t("요인분석 SPSS", "성인", "패널", "n=300", "CAWI", "척도 20", 20, "spss_factor", "H1: factor"),
            _t("교차표 카이 SPSS", "유권자", "조사", "n=400", "CATI", "학력·투표", 4, "spss_chi", "H1: assoc"),
        ],
    },
    96: {
        "en": "Causal Inference",
        "topics": [
            _t("최저임금 DID", "청년", "행정·고용 DB", "시도×연도 패널 n=5000", "행정", "임금·고용", 4, "did", "H1: DID"),
            _t("교육프로그램 PSM", "학생", "학교", "n=400", "RCT quasi", "성취", 6, "psm", "H1: ATT"),
            _t("흡연규제 RD", "성인", "정책", "n=800", "조사", "흡연", 5, "rd", "H1: jump"),
            _t("정책 시행 전후", "시민", "조사 패널", "2파 n=600", "CAWI", "인식", 8, "did", "H1: effect"),
            _t("IV 임금(교육)", "근로자", "KLIPS", "n=1200", "조사", "임금", 7, "iv", "H1: 2SLS"),
        ],
    },
    97: {
        "en": "Survey Design 2",
        "topics": [
            _t("전국 표본가구 조사", "가구", "전국 인구·주택 센서스 틀", "다단계 n=3000", "CAPI", "가구·소득", 40, "survey_design", "H1: SE"),
            _t("학교 집락표본", "학생", "학교명부", "집락 n=1200", "PAPI", "학업", 30, "survey_design", "H1: DEFF"),
            _t("온라인 패널 설계", "성인", "패널", "n=2000", "CAWI", "태도", 20, "survey_design", "H1: represent"),
            _t("전화 CATI RDD", "성인", "전화번호", "RDD n=1000", "CATI", "여론", 15, "survey_design", "H1: coverage"),
            _t("혼합모드(Mixed-mode)", "성인", "틀", "n=1500", "CATI+Web", "복지", 25, "survey_design", "H1: mode bias"),
        ],
    },
    98: {
        "en": "Survey Item Design",
        "topics": [
            _t("정치 efficacy 문항", "성인", "Kstat", "n=400", "CAWI", "efficacy 12", 12, "item_design", "H1: ITC"),
            _t("건강행동 문항", "성인", "건강", "n=350", "CAWI", "HBM 18", 18, "item_design", "H1: α"),
            _t("디지털 포용 문항", "전체", "조사", "n=380", "CAWI", "포용 15", 15, "item_design", "H1: clarity"),
            _t("직무만족 문항", "직장인", "기업", "n=320", "CAWI", "MS 14", 14, "item_design", "H1: validity"),
            _t("환경행동 문항", "성인", "패널", "n=300", "CAWI", "행동 16", 16, "item_design", "H1: pilot"),
        ],
    },
    99: {
        "en": "Experimental and Quasi-Experimental Design",
        "topics": [
            _t("학습앱 RCT", "학생", "학교", "n=120", "실험", "성취", 4, "rct", "H1: treatment"),
            _t("광고 A/B", "소비자", "온라인", "n=400", "실험", "클릭", 2, "rct", "H1: B>A"),
            _t("교육개입 준실험", "학급", "학교", "n=8반", "quasi", "성취", 3, "ancova", "H1: gain"),
            _t("nudge 행동실험", "시민", "기관", "n=500", "필드", "참여", 2, "field_exp", "H1: nudge"),
            _t("약물 대조 RCT", "환자", "병원", "n=200", "RCT", "치료성공", 5, "rct", "H1: efficacy"),
        ],
    },
    100: {
        "en": "Experimental Design and Analysis",
        "topics": [
            _t("2×2 광고×성별", "소비자", "패널", "n=320", "실험", "태도", 6, "factorial_anova", "H1: interaction"),
            _t("학습전략×시간", "학생", "학교", "n=180", "실험", "성취", 4, "factorial_anova", "H1: interaction"),
            _t("온도×습도 반응", "실험실", "공학", "n=80", "실험", "반응", 3, "factorial_anova", "H1: main"),
            _t("UI×과업 ANOVA", "이용자", "랩", "n=60", "실험", "오류", 4, "factorial_anova", "H1: UI"),
            _t("가격×브랜드", "소비자", "조사", "n=240", "실험", "선택", 3, "factorial_anova", "H1: brand"),
        ],
    },
    101: {
        "en": "Mixed Survey Methods",
        "topics": [
            _t("설문+개방: 정책수용", "시민", "조사", "n=350", "CAWI", "수용+서술", 15, "mixed", "H1: quant+qual"),
            _t("CSI+추적면담", "이용자", "기관", "n=200", "혼합", "만족", 18, "mixed", "H1: triangulation"),
            _t("교육평가 혼합", "학생", "학교", "n=280", "혼합", "성취·경험", 20, "mixed", "H1: integrate"),
            _t("병원경험 혼합", "환자", "병원", "n=220", "혼합", "경험", 16, "mixed", "H1: explain"),
            _t("직장문화 혼합", "직원", "기업", "n=300", "혼합", "문화", 22, "mixed", "H1: mixed"),
        ],
    },
    102: {
        "en": "Multivariate Statistical Analysis",
        "topics": [
            _t("MANOVA 프로그램", "참여자", "기관", "n=160", "실험", "다변량", 6, "manova", "H1: Wilks"),
            _t("PCA 소비지표", "가구", "조사", "n=400", "CAWI", "지출", 15, "pca", "H1: components"),
            _t("다변량 회귀", "학생", "학교", "n=200", "설문", "다중 DVs", 10, "multivariate_reg", "H1: R²"),
            _t("프로파일 분석", "환자", "병원·3집단", "n=180", "임상측정", "profile", 5, "profile", "H1: parallel"),
            _t("Hotelling T²", "두 집단", "실험", "n=100", "실험", "다변량", 4, "hotelling", "H1: T²"),
        ],
    },
    103: {
        "en": "Practical Statistics for Medical Research",
        "topics": [
            _t("RCT 이진결과", "환자", "병원", "n=180", "RCT", "치료성공", 4, "medical_rct", "H1: RR"),
            _t("case-control OR", "환자", "병원", "n=250", "case-control", "노출", 6, "case_control", "H1: OR"),
            _t("cohort RR", "성인", "cohort", "n=500", "추적", "발생", 5, "cohort", "H1: RR"),
            _t("진단검사 민감도", "검사", "병원", "n=300", "검사", "민감·특이", 3, "diagnostic", "H1: AUC"),
            _t("다기관 임상", "환자", "multi-site", "n=400", "RCT", "임상결과", 5, "multicenter", "H1: ICC"),
        ],
    },
    104: {
        "en": "Econometrics",
        "topics": [
            _t("Mincer 임금方程", "근로자", "조사", "n=1500", "조사", "임금", 8, "ols_hetero", "H1: educ"),
            _t("수요함수", "가구", "소비", "n=800", "조사", "수요", 6, "demand", "H1: elastic"),
            _t("인플레 결정", "국가", "macro", "n=40", "시계열", "CPI", 5, "ts_reg", "H1: money"),
            _t("교육수익률", "근로자", "KLIPS", "n=2000", "조사", "임금", 7, "ols", "H1: return"),
            _t("무역 결정", "국가", "UN", "n=100", "무역", "export", 6, "gravity", "H1: GDP"),
        ],
    },
    105: {
        "en": "Survey Methodology (Quantitative Models)",
        "topics": [
            _t("가구패널 표본설계", "가구", "틀", "n=5000", "CAPI", "패널", 30, "sample_design", "H1: attrition"),
            _t("비응답 조정", "조사", "틀", "n=1200", "CATI", "가중", 15, "nonresponse", "H1: bias↓"),
            _t("측정오차 모형", "성인", "조사", "n=600", "CAWI", "latent", 20, "measurement_error", "H1: reliability"),
            _t("혼합집락", "학생", "학교", "n=2000", "PAPI", "학업", 25, "cluster_design", "H1: DEFF"),
            _t("표본크기 산출", "계획", "design", "power", "—", "power", 0, "power_calc", "H1: n"),
        ],
    },
    106: {
        "en": "Survey Methodology (Advanced Sampling)",
        "topics": [
            _t("다단계 집락", "가구", "틀", "n=2500", "CAPI", "복지", 35, "multistage", "H1: SE"),
            _t("층화+가중", "성인", "Kstat", "n=1800", "CATI", "태도", 18, "stratified", "H1: weight"),
            _t("전화 RDD", "성인", "RDD", "n=900", "CATI", "여론", 12, "rdd", "H1: coverage"),
            _t("지역 quota", "성인", "quota", "n=600", "CAWI", "정치", 14, "quota", "H1: compare"),
            _t("패널 attrition", "패널", "가구패널 DB", "5파 n=3000", "CAWI", "패널 유지", 20, "panel_attrition", "H1: bias"),
        ],
    },
    107: {
        "en": "Survey Item Design 1",
        "topics": [
            _t("생활만족 문항", "성인", "Kstat", "n=400", "CAWI", "SWLS형", 12, "item_design", "H1: α"),
            _t("정치참여 문항", "성인", "조사", "n=380", "CAWI", "참여", 10, "item_design", "H1: ITC"),
            _t("건강검진 문항", "40+", "건강", "n=350", "CAWI", "검진", 14, "item_design", "H1: clarity"),
            _t("모바일 결제 문항", "성인", "패널", "n=320", "CAWI", "결제", 11, "item_design", "H1: pilot"),
            _t("공공서비스 문항", "이용자", "기관", "n=360", "CAWI", "서비스", 16, "item_design", "H1: validity"),
        ],
    },
    108: {
        "en": "Cross-Section and Panel Econometrics",
        "topics": [
            _t("가계소득 패널 FE", "가구", "KLIPS", "n=3000×10", "패널", "소득", 8, "panel_fe", "H1: FE"),
            _t("기업투자 패널", "기업", "KIS", "n=800×7", "패널", "invest", 6, "panel_fe", "H1: cash"),
            _t("지역재정 횡단", "시군", "행정", "n=228", "횡단", "재정", 7, "cross_section", "H1: debt"),
            _t("노동시장 전환", "근로자", "KLIPS", "n=1500×8", "패널", "employment", 5, "panel_logit", "H1: trans"),
            _t("환율·수출 패널", "국가", "trade", "n=25×20", "패널", "export", 4, "panel_fe", "H1: FX"),
        ],
    },
    109: {
        "en": "Linear Statistical Models",
        "topics": [
            _t("ANCOVA 공변량", "학생", "학교", "n=120", "실험", "post", 3, "ancova", "H1: adj mean"),
            _t("다중비교 contrast", "3+집단", "실험", "n=150", "실험", "mean", 4, "contrast", "H1: contrast"),
            _t("블록 회귀", "실험", "랩", "n=80", "실험", "Y", 5, "blocked_lm", "H1: block"),
            _t("HLM intro", "학생", "학교", "n=800", "중첩", "성취", 6, "hlm", "H1: ICC"),
            _t("반복측정 LM", "피험자", "실험", "n=40", "within", "반응", 4, "repeated_lm", "H1: time"),
        ],
    },
    110: {
        "en": "Discriminant Analysis and Pattern Recognition",
        "topics": [
            _t("필기체 숫자 LDA", "이미지", "MNIST subset", "n=1000", "digit", "pixel", 784, "lda_ml", "H1: acc"),
            _t("스팸 분류", "이메일", "corpus", "n=2000", "텍스트", "spam", 50, "nb_lda", "H1: F1"),
            _t("질병 하위유형", "환자", "병원", "n=180", "clinical", "marker", 8, "lda", "H1: classify"),
            _t("소비자 세그먼트", "고객", "CRM", "n=350", "CAWI", "feature", 12, "qda", "H1: accuracy"),
            _t("센서 패턴 kNN", "공정", "IoT", "n=500", "sensor", "class", 10, "knn", "H1: acc"),
        ],
    },
    123: {
        "en": "Statistical NLP Basics",
        "topics": [
            _t("뉴스 주제 NB", "기사", "corpus", "n=3000", "텍스트", "topic", 100, "nb_text", "H1: acc"),
            _t("리뷰 감성 로지스틱", "리뷰", "플랫폼", "n=5000", "텍스트", "sentiment", 200, "logit_text", "H1: F1"),
            _t("스팸 필터", "메일", "corpus", "n=4000", "텍스트", "spam", 150, "nb_text", "H1: prec"),
            _t("키워드 TF-IDF", "문서", "DB", "n=800", "텍스트", "term", 500, "tfidf", "H1: rank"),
            _t("문서 k-means", "문서", "corpus", "n=1200", "텍스트", "cluster", 300, "text_cluster", "H1: k"),
        ],
    },
    158: {
        "en": "Meta-Analysis",
        "topics": [
            _t("심리치료 g", "RCT", "PsycINFO", "k=45", "문헌", "g", 0, "meta", "H1: g>0"),
            _t("교육개입 g", "학교", "ERIC", "k=38", "문헌", "g", 0, "meta", "H1: g"),
            _t("운동 중재", "성인", "PubMed", "k=32", "문헌", "Hedges", 0, "meta", "H1: I²"),
            _t("약물 OR", "임상", "PubMed", "k=25", "문헌", "OR", 0, "meta_or", "H1: OR"),
            _t("조직개입 d", "직장", "DB", "k=20", "문헌", "d", 0, "meta", "H1: d"),
        ],
    },
    172: {
        "en": "Modern Multidimensional Scaling",
        "topics": [
            _t("맛 프로파일 MDS", "패널", "관능", "n=180", "유사", "taste", 12, "mds", "H1: stress"),
            _t("색 지각 MDS", "참가", "실험", "n=100", "유사", "color", 8, "mds", "H1: 2D"),
            _t("정치공간 MDS", "유권자", "조사", "n=220", "CAWI", "party", 10, "mds", "H1: dim"),
            _t("향수知覚", "소비자", "조사", "n=150", "유사", "scent", 9, "mds", "H1: map"),
            _t("도시 이미지", "관광", "조사", "n=200", "CAWI", "city", 11, "mds", "H1: axis"),
        ],
    },
    176: {
        "en": "Social Survey Methodology",
        "topics": [
            _t("사회복지 인식(Kstat형)", "성인", "Kstat", "n=1500", "CATI", "복지", 22, "social_survey", "H1: weight"),
            _t("가계 금융 조사", "가구", "가구금융", "n=3000", "CAPI", "자산", 35, "social_survey", "H1: asset"),
            _t("노동력 조사", "15+", "경활", "n=5000", "CAPI", "고용", 40, "social_survey", "H1: rate"),
            _t("교육실태 조사", "학교", "교육부", "n=2000", "PAPI", "교육", 30, "social_survey", "H1: policy"),
            _t("시민의식 조사", "성인", "틀", "n=1200", "CAWI", "시민", 18, "social_survey", "H1: trust"),
        ],
    },
    178: {
        "en": "Income Dynamics Panel",
        "topics": [
            _t("소득 이동성 KLIPS", "가구", "KLIPS", "n=4000×12", "패널", "income", 6, "income_panel", "H1: mobility"),
            _t("빈곤 탈출", "저소득", "패널", "n=1500×8", "패널", "poverty", 5, "income_panel", "H1: exit"),
            _t("임금 분포", "근로자", "KLIPS", "n=2500×10", "패널", "wage", 4, "income_panel", "H1: inequality"),
            _t("자산 축적", "가구", "패널", "n=2000×10", "패널", "wealth", 7, "income_panel", "H1: save"),
            _t("세대간 소득", "가구", "패널", "n=1800×6", "패널", "IGE", 5, "income_panel", "H1: elasticity"),
        ],
    },
    197: {
        "en": "Survey Methodology (Evaluation and Mixed)",
        "topics": [
            _t("프로그램 평가 설문", "수혜자", "기관", "n=400", "CAWI", "Outcome", 20, "eval_survey", "H1: impact"),
            _t("공공서비스 만족", "이용자", "행정", "n=600", "CAWI", "CSI", 18, "eval_survey", "H1: sat"),
            _t("정책 인지도", "시민", "조사", "n=800", "CATI", "aware", 12, "eval_survey", "H1: aware"),
            _t("시민참여 조사", "성인", "지자체", "n=500", "CAWI", "particip", 15, "eval_survey", "H1: part"),
            _t("지역계획 수용", "주민", "지역", "n=450", "혼합", "accept", 16, "eval_survey", "H1: accept"),
        ],
    },
}
