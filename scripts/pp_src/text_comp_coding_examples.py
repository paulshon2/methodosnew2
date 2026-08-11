# -*- coding: utf-8 -*-
"""Concrete coding/labeling examples for Text–Computational stage ③."""
from __future__ import annotations


def label_codebook(topic: dict, seed: int) -> list[list[str]]:
    akey = topic.get("analysis_key", "")
    if akey.startswith("sa_") or "sent" in akey or akey.startswith("dl_sent"):
        return [
            ["라벨", "정의", "포함 예시", "제외·애매 처리"],
            ["pos", "명확한 긍정·추천", "「재구매할게요」", "중립 사실만→neu"],
            ["neu", "사실·혼재·판단보류", "「배송은 빨랐고 맛은 보통」", "강한 욕설→neg 우선 검토"],
            ["neg", "불만·비추천·피해", "「환불했습니다」", "반어(「참 좋네요」+맥락) 지침 참조"],
            ["ignore", "광고·도배·외국어만", "스팸 URL 반복", "분석 제외"],
        ]
    if akey.startswith("dl_hate") or "hate" in akey:
        return [
            ["라벨", "정의", "포함 예시", "제외"],
            ["hate", "집단비하·위협", "정체성 공격 표현", "일반 비판(정책만)"],
            ["offensive", "비방·모욕(집단표적 불명)", "인신공격", "유머 논쟁은 이중코딩"],
            ["none", "비해당", "일반 토론", "—"],
        ]
    if akey.startswith("nlp_intent") or "intent" in akey:
        return [
            ["라벨", "정의", "포함 예시", "제외"],
            ["refund", "환불·취소 요청", "「환불해주세요」", "단순 불만 토로→complaint"],
            ["shipping", "배송조회", "「언제 도착」", "주소변경→account"],
            ["account", "계정·회원", "「비밀번호」", "결제오류→pay"],
            ["other", "기타", "잡담", "재라벨 후보"],
        ]
    # default multiclass / topic-ish gold
    return [
        ["라벨", "정의", "포함 예시", "제외"],
        ["economy", "경제·물가·고용", "「물가 상승」", "개인소비 감성만"],
        ["politics", "정치·선거·의회", "「법안 통과」", "기업 내부정치"],
        ["society", "사회·교육·복지", "「학교 무상」", "연예가십"],
        ["other", "기타/복합", "복합주제", "주라벨 우선규칙 적용"],
        [f"dom_{seed % 9}", f"{topic.get('focus','도메인')[:12]} 특화", topic.get("title", "")[:18], "범위 외"],
    ]


def label_application_rows(topic: dict, akey: str) -> list[list[str]]:
    if akey.startswith("sa_") or "sent" in akey:
        rows = [
            ["L001", "배송도 빠르고 맛있어요. 재구매!", "pos", "A", "긍정 평가+재구매 의사"],
            ["L002", "가격은 괜찮은데 포장이 아쉽네요.", "neu", "A/B→neu", "혼재→neu 지침"],
            ["L003", "제대로 된 검수도 없네요. 환불합니다.", "neg", "B", "피해·환불"],
        ]
    elif akey.startswith("sna"):
        rows = [
            ["E01", "U12→U03 RT", "edge_rt", "자동", "리트윗 관계"],
            ["E02", "U03→U12 mention", "edge_mention", "자동", "멘션 관계"],
            ["N01", "U12", "node_user", "자동", "활성 허브 후보"],
        ]
    else:
        rows = [
            ["L101", f"{topic.get('title','')[:20]} 관련 본문 샘플…", "economy", "A", "주제 단서 단어"],
            ["L102", "복합: 물가+선거 언급", "politics", "합의", "주라벨 규칙 적용"],
            ["L103", "광고성 반복 URL", "ignore", "A", "노이즈 제외"],
        ]
    return [["id", "텍스트·관계 요약", "라벨", "코더", "근거"]] + rows


def double_coding_rows(seed: int) -> list[list[str]]:
    return [
        ["표본", "코더A", "코더B", "합치", "불일치 유형", "합의"],
        [f"{80 + seed % 40}건", "pos", "neu", "부분", "혼재감성", "neu 지침 강화"],
        ["동일", "politics", "society", "불일치", "복합주제", "주라벨=politics"],
        ["동일", "ignore", "neg", "불일치", "스팸vs불만", "광고패턴→ignore"],
    ]


def topic_model_rows(seed: int) -> list[list[str]]:
    k = 5 + seed % 4
    rows = [["topic", "상위단어(해석용)", "비중", "대표문서ID", "가제목"]]
    samples = [
        ("T0", "가격,가성비,비싸,할인", "0.21", "D1022", "가격·가성비"),
        ("T1", "배송,늦,포장,파손", "0.18", "D3341", "배송·포장"),
        ("T2", "맛,신선,재구매,추천", "0.16", "D0881", "품질·재구매"),
        ("T3", "직원,응대,불친절,친절", "0.14", "D5510", "응대서비스"),
        ("T4", "환불,교환,AS,고객센터", "0.12", "D2209", "환불·AS"),
        ("T5", "광고,협찬,이벤트", "0.09", "D0199", "프로모션/노이즈"),
    ]
    for i in range(min(k, len(samples))):
        rows.append(list(samples[i]))
    return rows


def lexicon_rule_rows() -> list[list[str]]:
    return [
        ["규칙ID", "패턴", "점수", "비고"],
        ["R_pos1", "최고|만족|추천|재구매", "+1", "어간 매칭"],
        ["R_neg1", "최악|환불|파손|짜증", "-1", "어간 매칭"],
        ["R_negation", "앞 2토큰에 안|못|없", "×(-1)", "극성 반전"],
        ["R_intensify", "너무|진짜|완전", "×1.5", "강도"],
        ["R_domain", "도메인사전_v1 추가어", "±1", "버전 명시"],
    ]


def coding_proc_label(topic: dict, method_name: str, seed: int) -> list[str]:
    n = 200 + seed % 150
    return [
        f"【과제】「{topic['title']}」지도 학습/평가용 금표준 라벨 표본 구축. 분석 단위={topic.get('unit','문서')}.",
        f"【지침】라벨 코드북(정의·포함·제외·애매규칙) 확정 후 코더 교육. ({method_name})",
        f"【규모】목표 {n}건 이상. 이중코딩 비율 15–20%. 목표 κ≥0.70(또는 합의 후 κ).",
        "【산출】labels.csv + codebook_v1.md + disagreement_log.xlsx. 비지도 전용 주제는 평가용 최소셋 또는 N/A 사유 명시.",
    ]


def coding_proc_unsup(topic: dict, seed: int) -> list[str]:
    k = 5 + seed % 4
    return [
        f"【모형】토픽/클러스터 K={k}, random_seed={seed}. 전처리 버전={topic.get('pipeline','v1')}와 동일 입력.",
        "【해석 절차】①상위단어 10 →②대표문서 3 →③가제목 →④쓰레기 토픽 병합.",
        "【품질】응집도(c_v/NPMI)와 인간 판독성 병행. 지도학습 주제에서는 오류분석용 보조 군집으로 사용 가능.",
        f"【초점】{topic.get('focus')} — 토픽이 초점과 무관한 광고·노이즈면 제거.",
    ]


def coding_proc_lexicon(topic: dict) -> list[str]:
    return [
        f"【사전】극성/주제 lexicon 적용. 출처·버전을 「{topic.get('source')}」 도메인에 맞게 명시.",
        "【규칙】부정어 윈도우=2, 강조부사 가중, 도메인 추가어 반영.",
        "【검증】라벨 표본과 점수 상관·합치 구간 보고. 사전 alone vs 모형 하이브리드 비교표.",
        "【산출】lexicon_v1.csv, rule_fire_log(어떤 규칙이 점수를 만들었는지).",
    ]
