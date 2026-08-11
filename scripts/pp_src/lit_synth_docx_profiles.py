# -*- coding: utf-8 -*-
"""Canonical topics (10 × 5) for Literature Review–Evidence Synthesis Archetype."""
from __future__ import annotations


def _t(title, question, framework, dbs, design, focus, akey, claim):
    return {
        "title": title,
        "question": question,
        "framework": framework,
        "dbs": dbs,
        "design": design,
        "focus": focus,
        "analysis_key": akey,
        "hypothesis": claim,
    }


METHOD_PROFILES: dict[int, dict] = {
    154: {
        "en": "Critical Appraisal of Literature",
        "topics": [
            _t("당뇨 자가관리 교육 RCT 비판적평가", "P:성인2형당뇨 I:구조화교육 C:usual care O:HbA1c", "PICO", "PubMed, Cochrane", "RoB2", "내부타당도", "ca_rct", "높은 비뚤림 위험 연구는 효과 크기를 과대평가할 수 있다"),
            _t("우울 개입 관찰연구 평가", "P:지역사회 성인 I:상담 C:비노출 O:PHQ-9", "PICO", "PubMed, PsycINFO", "NOS/ROBINS-I", "교란통제", "ca_obs", "교란 통제 부족이 인과 추론을 약화한다"),
            _t("영상진단 정확도 연구 평가", "P:의심환자 I:AI판독 C:전문가 O:민감도·특이도", "PIRT", "PubMed, Embase", "QUADAS-2", "스펙트럼편향", "ca_dx", "스펙트럼 편향이 진단정확도를 부풀릴 수 있다"),
            _t("질적 돌봄경험 연구 CASP", "현상:입원환자 돌봄경험", "SPIDER", "CINAHL, RISS", "CASP qualitative", "반영성·윤리", "ca_qual", "연구자 반영성 기록이 해석 신뢰도를 좌우한다"),
            _t("임상지침 권고 AGREE II", "주제:고혈압 관리 지침", "AGREE", "가이드라인DB", "AGREE II", "이해상충·적용성", "ca_guide", "이해상충 불투명이 권고 신뢰도를 떨어뜨린다"),
        ],
    },
    155: {
        "en": "Rapid Literature Review",
        "topics": [
            _t("원격진료 효과 신속고찰", "P:만성질환 I:원격진료 C:대면 O:임상·만족", "PICO", "PubMed+1DB", "신속SR", "4주일정", "rr_tele", "핵심 DB만으로도 방향성 결론은 가능하나 완전성은 제한된다"),
            _t("마스크 정책 신속근거", "P:지역사회 I:마스크의무 C:비의무 O:감염", "PICO", "PubMed, WHO, grey", "신속+회색문헌", "공중보건", "rr_mask", "근거 공백과 맥락의존성을 명시해야 한다"),
            _t("학교 사회정서개입 신속", "P:초등 I:SEL프로그램 C:없음 O:문제행동", "PICO", "ERIC, PubMed", "언어제한", "교육", "rr_edu", "영어·한국어 제한이 누락을 유발할 수 있다"),
            _t("디지털정신건강앱 신속", "P:불안·우울 I:앱 C:대기 O:증상", "PICO", "PubMed, app reviews(제한)", "우선결과", "디지털헬스", "rr_dmh", "사전 정의된 우선 결과만 합성하는 것이 신속고찰의 핵심이다"),
            _t("백신수용 개입 신속업데이트", "P:성인 I:커뮤니케이션 C:usual O:접종의도", "PICO", "living search", "living RR", "업데이트", "rr_vac", "살아있는 고찰은 검색일을 버전으로 관리해야 한다"),
        ],
    },
    159: {
        "en": "Systematic Literature Review",
        "topics": [
            _t("고혈압 운동요법 SR+MA", "P:고혈압 I:유산소운동 C:usual O:수축기혈압", "PICO", "PubMed, Embase, CENTRAL, KCI", "PRISMA+MA", "SMD/MD", "sr_htn", "랜덤효과 통합에서 운동이 혈압을 유의하게 낮춘다"),
            _t("교사전문성개발 SR", "P:교원 I:연수 C:없음 O:교수실천", "PICO", "ERIC, Scopus, RISS", "혼합연구SR", "이질성", "sr_teach", "설계 이질성이 높아 서술합성이 병행된다"),
            _t("원격근무와 건강 SR", "P:직장인 I:원격근무 C:출근 O:수면·근골격", "PICO", "PubMed, Scopus", "PRISMA", "산업보건", "sr_wfh", "원격근무는 수면·근골격 결과에 혼합효과를 보인다"),
            _t("항생제 stewardship SR", "P:병원 I:ASP C:이전 O:처방량", "PICO", "PubMed, Cochrane", "클러스터설계", "감염관리", "sr_abx", "ASP가 항생제 처방을 감소시킨다"),
            _t("영상AI 진단 SR", "P:환자 I:AI C:방사선의 O:AUROC", "PICO", "PubMed, Embase, IEEE", "QUADAS+SR", "외부검증", "sr_ai", "외부검증 부족이 일반화 근거를 약화한다"),
        ],
    },
    160: {
        "en": "Narrative Literature Review",
        "topics": [
            _t("조직침묵 서사고찰", "조직에서 침묵은 어떻게 개념화·설명되는가", "주제사", "Scopus, KCI", "서술합성", "개념지형", "nr_silence", "침묵은 순응과 저항의 양가적 실천으로 서술된다"),
            _t("돌봄노동 서사고찰", "돌봄노동 연구는 어떤 이론 축으로 축적되었는가", "서사맵", "Scopus, RISS", "테마통합", "젠더·이주", "nr_care", "돌봄사슬 개념이 사례를 관통하는 축이다"),
            _t("도시재생 참여담론 서사", "참여는 재생사업에서 어떻게 정당화되는가", "담론서사", "정책·학술DB", "사례통합", "거버넌스", "nr_urban", "참여 담론이 갈등 관리 장치로 기능한다"),
            _t("학습동기 이론 서사정리", "동기이론은 교육연구에서 어떻게 분기했는가", "이론서사", "ERIC, PsycINFO", "이론지도", "교육심리", "nr_mot", "자기결정·기대가치·목표지향이 병존한다"),
            _t("재난 커뮤니티 회복 서사", "회복력은 현장에서 어떻게 서술되는가", "서사", "Scopus, 재난DB", "개념비판", "회복력", "nr_dis", "회복력 개념이 책임 전가에 동원될 수 있다"),
        ],
    },
    161: {
        "en": "Umbrella Review",
        "topics": [
            _t("우울치료 개입 우산고찰", "우울 개입 SR들을 종합하면 어떤 패턴인가", "SR of SRs", "PubMed, Epistemonikos", "AMSTAR-2", "상위합성", "ur_dep", "심리치료·약물 SR의 효과가 우산에서 재확인된다"),
            _t("비만생활습관 우산", "생활습관 개입 SR의 중복·일관성", "우산", "PubMed, Cochrane", "중복보정", "생활습관", "ur_ob", "중복 연구 보정이 효과 과대평가를 줄인다"),
            _t("학교폭력예방 우산", "예방개입 SR 지도", "우산", "ERIC, PubMed", "개입유형", "예방", "ur_bully", "보편·표적 개입의 효과 크기가 다르다"),
            _t("대기오염-건강 우산", "노출-결과 SR 종합", "우산", "PubMed, Embase", "노출정의", "환경역학", "ur_air", "호흡기·심혈관 결과가 일관되게 나타난다"),
            _t("디지털학습효과 우산", "에듀테크 SR 종합", "우산", "ERIC, Scopus", "혼합결과", "교육기술", "ur_edtech", "효과는 과목·설계에 따라 이질적이다"),
        ],
    },
    164: {
        "en": "Systematic Review in Social Science",
        "topics": [
            _t("복지태도 결정요인 체계고찰", "복지태도는 어떤 요인과 연관되는가", "PICo", "Scopus, KCI, SSCI", "혼합방법SR", "제도신뢰", "ssr_welfare", "제도신뢰가 복지태도와 정적으로 연관된다"),
            _t("SNS와 정치참여 SR", "SNS이용과 참여의 관계", "PICO-lite", "Scopus, Comm&Mass", "PRISMA-S", "선택편향", "ssr_sns", "선택편향 통제가 효과 크기를 축소한다"),
            _t("이주통합정책 효과 SR", "통합정책이 노동·교육에 미치는 영향", "PICo", "Scopus, policy DB", "질양혼합", "맥락의존", "ssr_mig", "효과는 제도 맥락에 강하게 의존한다"),
            _t("조직공정성과 성과 메타가능SR", "공정성→성과 경로", "PICO", "Scopus, Business", "메타후보", "효과크기", "ssr_just", "분배·절차공정성이 성과와 정적 연관이다"),
            _t("교육격차 누적불리 SR", "계층·지역 격차의 종단 패턴", "PICo", "ERIC, KCI", "QT-022", "누적불리", "ssr_gap", "초기 격차가 이후 성취에 누적된다"),
        ],
    },
    165: {
        "en": "Scoping Review",
        "topics": [
            _t("디지털헬스 개입 스코핑", "디지털헬스는 어떻게 정의·유형화되는가", "PCC", "PubMed, Scopus, IEEE", "JBI scoping", "개념지도", "sc_dh", "정의·유형이 분과마다 불일치한다"),
            _t("노인돌봄기술 스코핑", "기술유형·이해관계자·결과 지표 지도", "PCC", "PubMed, CINAHL", "공백식별", "연구공백", "sc_elder", "돌봄자 부담 결과가 상대적으로 적다"),
            _t("청년 기후불안 스코핑", "기후불안 측정·개입 현황", "PCC", "PsycINFO, Scopus", "정의", "개념 overlapping", "sc_climate", "측정 도구가 표준화되어 있지 않다"),
            _t("플랫폼노동 건강·법 스코핑", "연구영역 overlapping 지도", "PCC", "Scopus, law DB", "다학제", "노동", "sc_plat", "건강·고용법 연구가 분절되어 있다"),
            _t("학교정신건강 서비스 스코핑", "직종·개입·전달경로 지도", "PCC", "ERIC, PubMed", "다직종", "전달체계", "sc_smh", "다직종 협력이 핵심 공백이다"),
        ],
    },
    171: {
        "en": "Reading Evidence-Based Medicine Papers",
        "topics": [
            _t("RCT 논문 비판적 읽기 실습", "이 치료는 효과가 있는가(내부타당도)", "EBM worksheet", "예시RCT 1편", "사용자읽기", "무작위·눈가림", "ebm_rct", "배정은닉·탈락이 결과 해석을 좌우한다"),
            _t("진단연구 2×2 해석", "검사의 민감도·특이도·사후확률", "진단EBM", "예시진단문", "사전확률", "LR", "ebm_dx", "사전확률 없이 검사 결과만으로 결정을 내리면 오도된다"),
            _t("체계고찰 forest 읽기", "통합효과와 이질성을 어떻게 읽는가", "SR읽기", "예시SR", "I²·CI", "forest", "ebm_sr", "I²가 높으면 통합점 추정만으로 불충분하다"),
            _t("가이드라인 적용 판단", "이 권고를 내 환자에게 적용할 수 있는가", "SHARE", "지침1종", "적용가능성", "환자선호", "ebm_gl", "근거·가치·자원이 적용을 공동결정한다"),
            _t("통계함정 점검 읽기", "p해킹·다중비교를 어떻게 감지하는가", "통계비판", "예시논문", "다중성", "과잉해석", "ebm_stat", "사전등록 없는 다중분석은 과잉해석 위험이 크다"),
        ],
    },
    196: {
        "en": "Literature Review Methodology",
        "topics": [
            _t("고찰유형 선택 설계", "연구질문에 맞는 고찰유형은 무엇인가", "방법선택", "방법문헌", "설계", "목적적합", "lrm_type", "질문 유형이 고찰유형을 결정한다"),
            _t("프로토콜 사전등록", "선택보고를 어떻게 줄일 것인가", "PROSPERO/OSF", "등록템플릿", "사전등록", "투명성", "lrm_prot", "사전등록이 선택적 보고를 억제한다"),
            _t("검색식 PRESS 검토", "검색 완전성을 어떻게 검증하는가", "PRESS", "사서협업", "검색검증", "재현", "lrm_press", "동료검토가 검색 누락을 줄인다"),
            _t("이중스크리닝 신뢰도 설계", "스크리닝 합치도를 어떻게 확보하는가", "κ설계", "파일럿", "신뢰도", "합치도", "lrm_screen", "파일럿 후 지침 개정이 κ를 높인다"),
            _t("PRISMA 보고 점검", "보고 완전성을 어떻게 담보하는가", "PRISMA2020", "체크리스트", "보고", "투명성", "lrm_report", "체크리스트가 보고 누락을 드러낸다"),
        ],
    },
    198: {
        "en": "Integrative Literature Review",
        "topics": [
            _t("혼합근거 통합고찰(돌봄)", "질·양 근거를 어떻게 통합 서술하는가", "Whittemore", "CINAHL, PubMed, KCI", "통합서술", "돌봄", "ilr_mix", "통합 서술이 단일방법 고찰보다 실무함의를 풍부히 한다"),
            _t("이론정교화형 통합고찰", "개념모형을 어떻게 정교화하는가", "이론통합", "다학제DB", "모형합성", "개념", "ilr_theory", "통합고찰이 개념 경계를 재정의한다"),
            _t("간호실무 권고 통합", "실무권고로 어떻게 번역하는가", "실무통합", "지침+연구", "적용", "간호", "ilr_prac", "맥락화 권고가 현장 수용성을 높인다"),
            _t("정책함의 통합고찰", "연구근거를 정책언어로 번역", "정책번역", "policy+학술", "번역", "공공", "ilr_pol", "정책레버와 근거를 연결해야 활용된다"),
            _t("비판적 통합고찰", "권력·위치성을 어떻게 드러내는가", "비판통합", "질적·담론", "성찰", "권력", "ilr_crit", "위치성 성찰이 통합 서술의 타당성을 높인다"),
        ],
    },
}
