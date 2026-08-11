# -*- coding: utf-8 -*-
"""Canonical topics (13 × 5) for Text–Computational Linguistics Archetype."""
from __future__ import annotations


def _t(title, source, period, unit, n_docs, focus, pipeline, akey, claim):
    return {
        "title": title,
        "source": source,
        "period": period,
        "unit": unit,
        "n_docs": n_docs,
        "focus": focus,
        "pipeline": pipeline,
        "analysis_key": akey,
        "hypothesis": claim,
    }


METHOD_PROFILES: dict[int, dict] = {
    113: {
        "en": "Deep Learning Methodology",
        "topics": [
            _t("뉴스 헤드라인 주제분류(BERT 미세조정)", "뉴스API·포털 RSS", "2024–2025", "헤드라인+리드", 48000, "다중분류 8주제", "BERT/KoBERT fine-tune", "dl_clf", "도메인 미세조정 BERT가 TF-IDF+SVM 기준선보다 macro-F1에서 우세하다"),
            _t("상품리뷰 감성 RoBERTa", "쇼핑몰 리뷰 DB", "2023–2025", "리뷰문단", 120000, "3극 감성", "RoBERTa+클래스가중", "dl_sent", "도메인적응이 일반 감성모형 대비 재현율을 높인다"),
            _t("보도문 생성요약 BART", "보도자료·기사", "2024", "문서→요약", 15000, "추상요약", "BART/KoBART", "dl_sum", "생성요약이 Lead-3·TextRank보다 ROUGE-L에서 우세하다"),
            _t("공시텍스트 개체명인식", "DART 공시", "2022–2025", "문장", 35000, "ORG/PER/MONEY", "BiLSTM-CRF+BERT", "dl_ner", "문맥임베딩 결합이 규칙기반 NER보다 F1≥0.80을 달성한다"),
            _t("커뮤니티 혐오발화 탐지", "온라인커뮤니티", "2024–2025", "게시·댓글", 60000, "이진+심각도", "한국어 혐오BERT", "dl_hate", "정밀도-재현 균형을 위해 임계값 튜닝이 필요하다"),
        ],
    },
    114: {
        "en": "Social Network Analysis Methods and Applications",
        "topics": [
            _t("트위터 리트윗 확산망", "X API", "이슈 30일", "계정·RT엣지", 25000, "허브·커뮤니티", "directed RT graph", "sna_rt", "허브 소수 계정이 의제 확산의 상당 비중을 설명한다"),
            _t("학술 공저 네트워크", "Scopus 덤프", "2015–2024", "저자·공저", 18000, "매개중심성", "undirected coauthor", "sna_co", "매개중심 연구자가 분과 간 융합 경로에 위치한다"),
            _t("뉴스댓글 멘션망", "포털댓글", "선거철", "유저·멘션", 40000, "양극화 클러스터", "mention graph", "sna_mention", "멘션망에 양극화 커뮤니티가 분리되어 나타난다"),
            _t("해시태그 공출현 이분망", "인스타 공개해시", "캠페인 기간", "태그·게시", 12000, "커뮤니티탐지", "bipartite projection", "sna_tag", "공출현 군집이 캠페인 하위 서사를 구분한다"),
            _t("조직 이메일 통신망(익명)", "사내로그(익명)", "분기", "부서노드", 8000, "비공식 허브", "weighted communication", "sna_org", "공식 조직도와 다른 비공식 허브가 존재한다"),
        ],
    },
    115: {
        "en": "Natural Language Processing",
        "topics": [
            _t("뉴스 형태소·구문 파이프라인", "일간지 코퍼스", "1년", "문장", 100000, "형태소·구문", "MeCab/Kiwi+parser", "nlp_pipe", "형태소분석기 선택이 하위 분류 F1에 유의한 영향을 준다"),
            _t("법령 의존구문·관계추출", "법령·판례", "현행", "절", 20000, "의존·관계", "dependency+pattern", "nlp_dep", "의존경로 패턴이 규칙추출 재현율을 높인다"),
            _t("보고서 핵심구 추출", "정책보고서", "2020–2025", "문서", 5000, "keyphrase", "TF-IDF+NP chunk", "nlp_kp", "명사구 패턴+TF-IDF가 단순 빈도보다 적합하다"),
            _t("한영 기계번역 평가", "병렬코퍼스", "벤치마크", "문장쌍", 30000, "MT품질", "NMT+BLEU/COMET", "nlp_mt", "자동지표와 인간평가 순위가 대체로 일치한다"),
            _t("고객상담 의도분류", "콜센터 로그", "6개월", "발화", 55000, "intent", "fastText/BERT", "nlp_intent", "매크로F1 기준으로 소수 의도 클래스 보완이 필요하다"),
        ],
    },
    116: {
        "en": "Artificial Intelligence Methodology",
        "topics": [
            _t("민원텍스트 SHAP 설명", "국민신문고형", "2024", "민원문서", 22000, "XAI", "분류기+SHAP", "ai_xai", "SHAP 상위토큰이 실무 라벨 정의와 정합한다"),
            _t("리뷰 능동학습 라벨절감", "리뷰풀", "파일럿", "문서", 50000, "active learning", "uncertainty sampling", "ai_al", "능동학습으로 라벨 30%만으로 유사 F1에 도달한다"),
            _t("이미지-캡션 멀티모달 검색", "상품이미지+설명", "카탈로그", "쌍", 40000, "retrieval", "CLIP형", "ai_mm", "멀티모달 임베딩이 텍스트단독 검색을 상회한다"),
            _t("장문 요약 강화학습 목표", "보고서", "벤치", "문서", 8000, "RLHF-lite", "ROUGE+반복패널티", "ai_rl", "반복 패널티가 중복 생성을 줄인다"),
            _t("채용공고 공정성 점검", "채용공고", "연간", "공고", 12000, "fairness", "집단별 F1", "ai_fair", "성별·연령 대리변수 민감도에서 격차가 관찰된다"),
        ],
    },
    117: {
        "en": "Information Retrieval",
        "topics": [
            _t("사내위키 BM25 검색", "위키덤프", "현행", "문서", 9000, "ad-hoc IR", "BM25", "ir_bm25", "BM25 nDCG@10이 단순 TF 검색을 상회한다"),
            _t("FAQ 의미검색(dense)", "고객FAQ", "현행", "QA쌍", 6000, "dense retrieval", "bi-encoder", "ir_dense", "임베딩 검색이 BM25 대비 장문의제에서 우세하다"),
            _t("학술DB 질의확장", "논문초록", "분야A", "질의", 20000, "query expansion", "RM3/임베딩QE", "ir_qe", "질의확장이 재현율을 유의하게 높인다"),
            _t("클릭로그 학습정렬(LTR)", "검색로그", "분기", "쿼리-문서", 100000, "learning to rank", "LambdaMART", "ir_ltr", "LTR이 BM25 대비 CTR·nDCG를 개선한다"),
            _t("뉴스 근사중복 탐지", "뉴스스트림", "30일", "기사", 50000, "near-dup", "MinHash/SimHash", "ir_dedup", "근사해시가 중복보도 클러스터를 효율적으로 탐지한다"),
        ],
    },
    118: {
        "en": "Sentiment Analysis",
        "topics": [
            _t("상품리뷰 감성(사전+ML)", "리뷰100k", "2024", "리뷰", 100000, "pos/neu/neg", "lexicon+SVM/BERT", "sa_rev", "하이브리드가 사전단독보다 F1≥0.82를 달성한다"),
            _t("금융뉴스 톤 지수", "증권뉴스", "2년", "문장", 80000, "도메인감성", "금융lex+회귀", "sa_fin", "톤 지수가 단기 수익률과 약한 상관을 보인다"),
            _t("정치 트윗 3극 감성", "X 샘플", "선거철", "트윗", 70000, "지지/반대/중립", "지도+편향점검", "sa_pol", "주석자 이념 편향이 합치도에 영향을 준다"),
            _t("호텔리뷰 측면감성(ABSA)", "호텔리뷰", "3년", "측면표현", 45000, "aspect polarity", "aspect term+polarity", "sa_absa", "측면별 극성이 전체평점과 불일치하는 경우가 있다"),
            _t("앱리뷰 감성 시계열", "앱스토어", "이벤트전후", "일별톤", 30000, "event study", "일별감성평균", "sa_ts", "업데이트 직후 부정 톤이 유의하게 상승한다"),
        ],
    },
    119: {
        "en": "Corpus Linguistics",
        "topics": [
            _t("장르별 코퍼스 설계·표지", "신문/구어/SNS", "균형표본", "텍스트", 1500, "표지체계", "corpus design", "corp_design", "표지(메타데이터) 체계가 비교 타당성을 좌우한다"),
            _t("연어(collocation) 분석", "신문코퍼스", "1년", "노드단어", 1, "MI/t", "collocation", "corp_coll", "MI 상위 연어가 담론 관용을 드러낸다"),
            _t("장르 키워드성(keyness)", "두 장르 코퍼스", "비교", "단어", 2, "log-likelihood", "keyness", "corp_key", "keyness가 장르 표지 어휘를 식별한다"),
            _t("구어·문어 품사 분포", "구어/문어", "대조", "토큰", 2, "POS profile", "tagset 비교", "corp_pos", "구어에서 대명사·감탄 비율이 높다"),
            _t("학습자 오류주석 코퍼스", "학습자작문", "학기", "오류span", 800, "오류유형", "error annotation", "corp_err", "오류유형 합치도 κ≥0.70이 필요하다"),
        ],
    },
    120: {
        "en": "R Text Mining",
        "topics": [
            _t("tidytext 뉴스 파이프라인", "뉴스CSV", "분기", "문서", 10000, "tidy workflow", "tidytext+dplyr", "rtm_tidy", "tidy 파이프라인이 재현 가능한 스크립트를 제공한다"),
            _t("KNU 감성사전 R분석", "트윗샘플", "이슈", "문서", 20000, "사전감성", "KNU+stringr", "rtm_sent", "정제 규칙이 사전점수 분산을 크게 줄인다"),
            _t("stm 토픽모형(R)", "민원텍스트", "1년", "문서", 12000, "구조토픽", "stm", "rtm_stm", "공변량(지역)이 토픽 유행에 연관된다"),
            _t("TF·워드클라우드 시각화", "보도자료", "캠페인", "문서", 3000, "탐색시각화", "wordcloud2", "rtm_wc", "탐색 시각화는 가설생성용이며 추론이 아니다"),
            _t("정규표현 기반 HTML 정제", "웹크롤 HTML", "배치", "페이지", 8000, "regex clean", "stringr/regex", "rtm_regex", "규칙 기반 정제가 노이즈 토큰을 80% 이상 제거한다"),
        ],
    },
    121: {
        "en": "Text Machine Learning",
        "topics": [
            _t("스팸 나이브베이즈 기준선", "메일/SMS", "현행", "메시지", 30000, "이진분류", "MultinomialNB", "tml_nb", "NB가 강한 기준선을 제공하나 소수클래스에서 한계가 있다"),
            _t("주제분류 선형SVM", "뉴스", "벤치", "문서", 40000, "다중분류", "LinearSVC+TFIDF", "tml_svm", "1–2gram TF-IDF+SVM이 TX-003 없이 경쟁력을 갖는다"),
            _t("리뷰평점 랜덤포레스트", "리뷰", "연간", "문서", 50000, "회귀/다중", "RF+n-gram", "tml_rf", "특성중요도가 감성사전 단어와 부분 일치한다"),
            _t("확률보정(캘리브레이션)", "분류기출력", "검증", "확률", 10000, "reliability", "Platt/isotonic", "tml_cal", "캘리브레이션이 Brier score를 개선한다"),
            _t("희귀클래스 불균형 학습", "민원유형", "연간", "문서", 35000, "imbalance", "class_weight/SMOTE", "tml_imb", "가중치 조정이 macro-F1을 향상한다"),
        ],
    },
    122: {
        "en": "Keyword Analysis",
        "topics": [
            _t("보도 TF-IDF 키워드", "일간지", "이슈주", "문서", 5000, "TF-IDF", "sklearn Tfidf", "kw_tfidf", "TF-IDF 상위어가 이슈 프레임을 요약한다"),
            _t("논문초록 TextRank", "초록", "분야", "문서", 8000, "graph ranking", "TextRank", "kw_tr", "TextRank가 저자키워드와 부분 중첩한다"),
            _t("리뷰 KeyBERT", "리뷰", "카테고리", "문서", 15000, "임베딩키워드", "KeyBERT", "kw_bert", "임베딩 키워드가 구어체 핵심을 포착한다"),
            _t("포털 이슈키워드 추적", "포털검색어", "90일", "일별", 90, "시계열", "daily keyness", "kw_issue", "사건 당일 키워드 급증이 관찰된다"),
            _t("두 코퍼스 keyness 비교", "A/B 코퍼스", "대조", "단어", 2, "LL keyness", "log-likelihood", "kw_ll", "LL 검정 상위어가 집단 차이를 설명한다"),
        ],
    },
    124: {
        "en": "Machine Learning",
        "topics": [
            _t("텍스트+표 결합 교차검증", "민원+메타", "연간", "사례", 18000, "CV pipeline", "Pipeline+CV", "ml_cv", "계층화 CV가 성능 분산을 안정화한다"),
            _t("n-gram 특성공학", "리뷰", "벤치", "문서", 40000, "feature eng", "1–2gram 선택", "ml_feat", "bigram 추가가 단일어보다 F1을 높인다"),
            _t("스태킹 앙상블", "다중분류", "벤치", "문서", 30000, "stacking", "NB+SVM+RF", "ml_ens", "스태킹이 단일모형보다 평균 F1을 개선한다"),
            _t("개념드리프트 탐지", "스트림리뷰", "분기", "배치", 12, "drift", "PSI/ADWIN", "ml_drift", "드리프트 경보 후 재학습이 성능을 회복한다"),
            _t("모델카드·문서화", "배포모형", "운영", "모형", 1, "governance", "model card", "ml_card", "모델카드가 한계·윤리 고지를 표준화한다"),
        ],
    },
    125: {
        "en": "Probabilistic Topic Models",
        "topics": [
            _t("뉴스 LDA 토픽", "뉴스1년", "2024", "문서", 50000, "LDA", "gensim/mallet", "tm_lda", "응집도(c_v) 기준으로 K 선택이 해석에 핵심이다"),
            _t("리뷰 NMF 토픽", "리뷰", "카테고리", "문서", 40000, "NMF", "sklearn NMF", "tm_nmf", "NMF 토픽이 LDA보다 해석이 용이한 경우가 있다"),
            _t("시점별 동적토픽", "연도별뉴스", "10년", "문서", 100000, "DTM", "dynamic topic", "tm_dtm", "토픽 단어분포가 시간에 따라 이동한다"),
            _t("학술 CTM 상관토픽", "논문초록", "분야", "문서", 25000, "CTM", "correlated topics", "tm_ctm", "토픽 간 양의 상관이 학제 융합을 시사한다"),
            _t("정책문서 시드워드 유도토픽", "정책PDF", "정권기", "문서", 6000, "seeded LDA", "seed words", "tm_seed", "시드워드가 정책 프레임 토픽을 안정화한다"),
        ],
    },
    179: {
        "en": "Text Analysis",
        "topics": [
            _t("혼합코퍼스 탐색적 프로파일", "뉴스+SNS+민원", "분기", "문서", 30000, "EDA", "desc+viz", "ta_eda", "출처별 길이·어휘다양도가 체계적으로 다르다"),
            _t("두 집단 비교 텍스트분석", "찬반 댓글", "이슈", "문서", 20000, "contrastive", "keyness+분류", "ta_cmp", "집단 간 키워드·톤 차이가 유의하다"),
            _t("사전+통계 혼합 감성", "리뷰", "파일럿", "문서", 25000, "hybrid", "lex+ML", "ta_hyb", "혼합전략이 단일전략보다 안정적이다"),
            _t("이슈 모니터링 대시보드", "일별수집", "운영30일", "일별", 30, "ops metrics", "dashboard KPIs", "ta_viz", "운영지표가 이상치를 조기 탐지한다"),
            _t("공개데이터 윤리·편향 점검", "벤치마크셋", "감사", "데이터셋", 1, "ethics audit", "checklist", "ta_eth", "수집편향·유해라벨 점검이 배포 전에 필요하다"),
        ],
    },
}
