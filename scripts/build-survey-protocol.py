# -*- coding: utf-8 -*-
"""Convert 설문조사_문항_표준프로토콜.xlsx → public JSON + method overview assets."""
from __future__ import annotations

import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "설문조사_문항_표준프로토콜.xlsx"
PUBLIC = ROOT / "public"
METHOD_DIR = PUBLIC / "methods" / "SV-003"


def sheet_rows(wb, name: str):
    ws = wb[name]
    rows = []
    for row in ws.iter_rows(values_only=True):
        rows.append([("" if c is None else str(c).strip()) for c in row])
    return rows


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    out = {
        "version": "1.0",
        "sourceFile": XLSX.name,
        "purpose": "",
        "sources": [],
        "sheets": {},
    }

    rows0 = sheet_rows(wb, "0_개요")
    for r in rows0:
        for c in r:
            if c and "본 워크북은" in c:
                out["purpose"] = c
        if len(r) > 2 and r[1] in ("Groves", "Bradburn", "Brace", "Dillman", "Rossi(HSR)"):
            out["sources"].append({"abbr": r[1], "citation": r[2], "note": r[3] if len(r) > 3 else ""})

    specs = {
        "1_문항구조유형": {"key": "structureTypes", "headerHints": ["분류축"]},
        "2_내용유형별프로토콜": {"key": "contentProtocols", "headerHints": ["문항 내용유형"]},
        "3_표준_오류패턴": {"key": "errorPatterns", "headerHints": ["원칙 번호"]},
        "4_응답척도설계기준": {"key": "responseScaleCriteria", "headerHints": ["설계 항목"]},
        "5_민감질문_기법": {"key": "sensitiveTechniques", "headerHints": ["기법"]},
        "6_자기기입식설계원칙": {"key": "selfAdminPrinciples", "headerHints": ["원칙"]},
        "7_문항평가방법": {"key": "evaluationMethods", "headerHints": ["평가 방법"]},
        "8_인지응답과정모델": {"key": "cognitiveModel", "headerHints": ["단계"]},
    }

    for sheet, meta in specs.items():
        rows = sheet_rows(wb, sheet)
        headers = None
        data = []
        for r in rows:
            if headers is None:
                if r and r[0] and any(h in r[0] for h in meta["headerHints"]):
                    headers = [c for c in r if c]
                continue
            if not any(r):
                continue
            item = {h: (r[i] if i < len(r) else "") for i, h in enumerate(headers)}
            if any(item.values()):
                data.append(item)
        out["sheets"][meta["key"]] = {"title": sheet, "headers": headers or [], "rows": data}

    out["contentTypes"] = [
        {"id": "attitude", "ko": "태도질문", "en": "Attitude", "keys": ["태도질문", "Attitude"]},
        {"id": "knowledge", "ko": "지식 측정 질문", "en": "Knowledge", "keys": ["지식 측정", "Knowledge"]},
        {"id": "performance", "ko": "성과평가 질문", "en": "Performance evaluation", "keys": ["성과평가", "Performance"]},
        {"id": "psychographic", "ko": "심리특성/사이코그래픽 질문", "en": "Psychographic", "keys": ["심리특성", "사이코그래픽", "Psychographic"]},
        {"id": "demographic", "ko": "인구통계 질문", "en": "Demographic", "keys": ["인구통계", "Demographic"]},
        {"id": "self_administered", "ko": "자기기입식 질문", "en": "Self-administered", "keys": ["자기기입식", "Self-administered"]},
        {"id": "nonsensitive_behavior", "ko": "비민감 행동질문", "en": "Nonsensitive behavior", "keys": ["비민감 행동", "Nonsensitive"]},
        {"id": "sensitive_behavior", "ko": "민감 행동질문", "en": "Sensitive behavior", "keys": ["민감 행동", "Sensitive"]},
    ]

    out["measurementScales"] = [
        {
            "id": "nominal",
            "ko": "명목척도",
            "en": "Nominal Scale",
            "features": "단순 분류, 순서 없음",
            "stats": "빈도, 비율, 최빈값, 카이제곱",
            "ssLinks": [
                {"phase": "descriptive", "techId": "빈도분석-빈도-비율-누적빈도", "name": "빈도분석"},
                {"phase": "descriptive", "techId": "교차표-Crosstab", "name": "교차표"},
                {"phase": "descriptive", "techId": "최빈값-Mode", "name": "최빈값"},
                {"phase": "inferential", "techId": "카이제곱검정", "name": "카이제곱검정"},
            ],
        },
        {
            "id": "ordinal",
            "ko": "서열척도",
            "en": "Ordinal Scale",
            "features": "순서는 있으나 간격 불명",
            "stats": "중앙값, 순위검정",
            "ssLinks": [
                {"phase": "descriptive", "techId": "중앙값-Median", "name": "중앙값"},
                {"phase": "descriptive", "techId": "백분위수-사분위수", "name": "백분위수·사분위수"},
                {"phase": "diagnostic", "techId": "Cronbach-alpha-문항신뢰도", "name": "Cronbach α"},
                {"phase": "inferential", "techId": "t-검정", "name": "집단비교(순위·서열 연계)"},
            ],
        },
        {
            "id": "interval",
            "ko": "등간척도",
            "en": "Interval Scale",
            "features": "간격 동일, 절대영점 없음",
            "stats": "평균, 표준편차, 상관분석, 회귀",
            "ssLinks": [
                {"phase": "descriptive", "techId": "평균-산술-조화-기하평균", "name": "평균"},
                {"phase": "descriptive", "techId": "표준편차-분산", "name": "표준편차·분산"},
                {"phase": "diagnostic", "techId": "정규성검정-Shapiro-Wilk-K-S-Q-Q-Plot", "name": "정규성검정"},
                {"phase": "inferential", "techId": "회귀분석", "name": "회귀분석"},
            ],
        },
        {
            "id": "ratio",
            "ko": "비율척도",
            "en": "Ratio Scale",
            "features": "간격 동일, 절대영점 존재",
            "stats": "모든 통계 가능",
            "ssLinks": [
                {"phase": "descriptive", "techId": "평균-산술-조화-기하평균", "name": "평균"},
                {"phase": "descriptive", "techId": "표준편차-분산", "name": "표준편차·분산"},
                {"phase": "diagnostic", "techId": "이상치탐지-Z-score-IQR", "name": "이상치탐지"},
                {"phase": "inferential", "techId": "ANOVA", "name": "ANOVA"},
                {"phase": "inferential", "techId": "회귀분석", "name": "회귀분석"},
            ],
        },
    ]

    out["stages"] = [
        {"id": "s1", "order": 1, "name": "연구목적·측정개념 정의", "goal": "설문으로 측정할 구성개념·연구질문을 명확히 한다", "inputs": ["연구주제", "연구질문"], "outputs": ["측정개념목록"]},
        {"id": "s2", "order": 2, "name": "내용 유형별 문항 분류", "goal": "태도·지식·성과·심리·인구통계·자기기입 등으로 문항 유형을 배분한다", "inputs": ["측정개념목록"], "outputs": ["유형별문항계획"]},
        {"id": "s3", "order": 3, "name": "문항 구조 유형 선택", "goal": "개방/폐쇄·자발/제시·이분/단일/복수응답 구조를 선택한다", "inputs": ["유형별문항계획"], "outputs": ["구조설계안"]},
        {"id": "s4", "order": 4, "name": "표준 패턴으로 문항 초안 작성", "goal": "프로토콜 지침과 Dillman 원칙에 따라 문항을 작성한다", "inputs": ["구조설계안"], "outputs": ["문항초안"]},
        {"id": "s5", "order": 5, "name": "응답 척도 설계", "goal": "5~7점·라벨·균형·DK 위치 등 척도 기준을 적용한다", "inputs": ["문항초안"], "outputs": ["척도설계안"]},
        {"id": "s6", "order": 6, "name": "오류 패턴 점검", "goal": "이중질문·비상호배타·check-all 등 오류를 Before→After로 수정한다", "inputs": ["척도설계안"], "outputs": ["수정문항"]},
        {"id": "s7", "order": 7, "name": "민감질문·자기기입 원칙 적용", "goal": "사회적 바람직성·항해오류를 줄이는 기법을 적용한다", "inputs": ["수정문항"], "outputs": ["민감·자기기입반영안"]},
        {"id": "s8", "order": 8, "name": "인지과정 모델 기반 사전검증", "goal": "이해·회상·판단·보고 단계 오류를 평가방법으로 점검한다", "inputs": ["민감·자기기입반영안"], "outputs": ["사전검증결과"]},
        {"id": "s9", "order": 9, "name": "AI 생성·엑셀 검수", "goal": "주제 기반 30문항 이상 생성 또는 기존 엑셀을 프로토콜로 검수한다", "inputs": ["주제", "기존문항엑셀"], "outputs": ["검수·생성문항세트"]},
        {"id": "s10", "order": 10, "name": "척도유형 코딩 변환", "goal": "명목·서열·등간·비율 척도로 코딩표를 만든다", "inputs": ["검수·생성문항세트"], "outputs": ["코딩표"]},
        {"id": "s11", "order": 11, "name": "사회과학 통계분석 연동", "goal": "기초·가정검토·추론통계 하위기법으로 분석 경로를 연결한다", "inputs": ["코딩표"], "outputs": ["통계분석연동맵"]},
    ]

    out["examples"] = {
        "attitude": {
            "title": "태도질문 완성 예시",
            "guidelines": ["태도 대상을 구체화", "이중질문 회피", "5~7점 양극 척도·전점 라벨", "일반→구체 순서"],
            "items": [
                {"code": "A01", "stem": "귀하는 지역 공공도서관의 디지털 대출 서비스에 대해 얼마나 동의 또는 반대하십니까?", "scale": "1=매우 반대 … 5=매우 동의", "scaleType": "ordinal", "note": "대상 구체화 + 양극 문두"},
                {"code": "A02", "stem": "디지털 대출 서비스가 귀하의 학습·업무에 도움이 된다고 생각하십니까?", "scale": "1=전혀 그렇지 않다 … 5=매우 그렇다", "scaleType": "ordinal", "note": "강도 측정"},
                {"code": "A03", "stem": "디지털 대출 수수료 인상안에 대해 어떻게 생각하십니까?", "scale": "1=매우 반대 … 5=매우 찬성", "scaleType": "ordinal", "note": "단일 대상"},
            ],
            "bad": "도서관과 박물관 서비스에 만족하십니까?(이중질문)",
            "good": "도서관 서비스 만족도와 박물관 서비스 만족도를 분리 질문",
        },
        "knowledge": {
            "title": "지식 측정 질문 완성 예시",
            "guidelines": ["정답·추측 구분", "모르겠다 옵션 명시적 결정", "사실 기반 문항"],
            "items": [
                {"code": "K01", "stem": "귀하의 거주 지역 공공도서관에서 제공하는 디지털 대출 앱 이름을 알고 계십니까?", "scale": "1=안다 2=모른다 3=잘 모르겠다", "scaleType": "nominal", "note": "DK 포함"},
                {"code": "K02", "stem": "디지털 대출 1회 최대 대여 가능 권수는 몇 권입니까?", "scale": "개방형 숫자 / 모름=99", "scaleType": "ratio", "note": "추측 통제용 모름"},
                {"code": "K03", "stem": "다음 중 디지털 대출이 가능한 자료 유형은?(해당 항목별 예/아니오)", "scale": "전자책/오디오북/잡지 각 예·아니오", "scaleType": "nominal", "note": "check-all 대신 개별 평정"},
            ],
            "bad": "디지털 대출에 대해 얼마나 잘 아십니까?(모호)",
            "good": "구체적 사실·수치를 묻는 문항으로 분해",
        },
        "performance": {
            "title": "성과평가 질문 완성 예시",
            "guidelines": ["행동기반 체크리스트", "관대화·중심화 편향 주의", "구체적 행동 기술"],
            "items": [
                {"code": "P01", "stem": "지난 한 달간 디지털 대출로 자료를 검색한 적이 있습니까?", "scale": "예/아니오", "scaleType": "nominal", "note": "행동 체크"},
                {"code": "P02", "stem": "지난 한 달간 디지털 대출로 실제로 자료를 빌린 횟수는?", "scale": "0 / 1 / 2-3 / 4회 이상", "scaleType": "ordinal", "note": "상호배타 구간"},
                {"code": "P03", "stem": "빌린 자료를 기한 내 반납(자동반납 포함)했습니까?", "scale": "예/아니오/해당없음", "scaleType": "nominal", "note": "성과 행동"},
            ],
            "bad": "디지털 대출을 잘 활용하십니까?(모호·관대화)",
            "good": "검색·대출·반납 등 행동으로 분해",
        },
        "psychographic": {
            "title": "심리특성/사이코그래픽 질문 완성 예시",
            "guidelines": ["다문항 척도", "가치·라이프스타일 구성개념", "신뢰도 확보"],
            "items": [
                {"code": "Y01", "stem": "나는 새로운 디지털 서비스를 남들보다 먼저 써보는 편이다.", "scale": "1=전혀 그렇지 않다 … 5=매우 그렇다", "scaleType": "ordinal", "note": "혁신성"},
                {"code": "Y02", "stem": "나는 여가 시간에 혼자 책을 읽는 것을 선호한다.", "scale": "1~5", "scaleType": "ordinal", "note": "라이프스타일"},
                {"code": "Y03", "stem": "나는 공공 서비스의 디지털화가 삶의 질을 높인다고 믿는다.", "scale": "1~5", "scaleType": "ordinal", "note": "가치관"},
            ],
            "bad": "당신은 어떤 사람입니까?(단일·모호)",
            "good": "구성개념별 다문항 Likert",
        },
        "demographic": {
            "title": "인구통계 질문 완성 예시",
            "guidelines": ["표준 범주 재사용", "상호배타·포괄", "민감 항목은 구간화"],
            "items": [
                {"code": "D01", "stem": "귀하의 연령대는?", "scale": "18-29 / 30-39 / 40-49 / 50-59 / 60세 이상", "scaleType": "ordinal", "note": "경계 상호배타"},
                {"code": "D02", "stem": "귀하의 성별은?", "scale": "남성/여성/기타/응답거부", "scaleType": "nominal", "note": "표준+거부"},
                {"code": "D03", "stem": "최종 학력은?", "scale": "고졸이하/전문대/대졸/대학원이상", "scaleType": "ordinal", "note": "비교가능 범주"},
            ],
            "bad": "35세 이하/35-50 (경계 중복)",
            "good": "35세 이하/36-50처럼 경계 분리",
        },
        "self_administered": {
            "title": "자기기입식 질문·설계 완성 예시",
            "guidelines": ["시각 일관성", "지시문은 사용 지점", "한 번에 한 질문", "형식 전환 신호"],
            "items": [
                {"code": "S01", "stem": "[지시] 아래 각 문항에 대해 해당하는 숫자에 ○ 하세요.", "scale": "(항해 안내)", "scaleType": "nominal", "note": "사용 시점 지시"},
                {"code": "S02", "stem": "지난 7일간 디지털 대출 앱을 실행한 날은 며칠입니까?", "scale": "직접 기입: ___일", "scaleType": "ratio", "note": "한 질문만"},
                {"code": "S03", "stem": "(형식 전환) 이제부터는 예/아니오로 답해 주세요. 알림 기능을 켜 두셨습니까?", "scale": "예/아니오", "scaleType": "nominal", "note": "전환 신호"},
            ],
            "bad": "정규직 중 가입자 수·비가입자 수·평균 근속을 한 칸에 묻기",
            "good": "하위질문을 분리하고 시각 단서 제공",
        },
    }

    templates = [
        ("attitude", "귀하는 '{topic}'에 대해 얼마나 동의 또는 반대하십니까?", "1=매우 반대 … 5=매우 동의", "ordinal"),
        ("attitude", "'{topic}'이(가) 귀하의 일상생활에 긍정적인 영향을 준다고 생각하십니까?", "1=전혀 그렇지 않다 … 5=매우 그렇다", "ordinal"),
        ("attitude", "'{topic}' 관련 정책 확대에 대해 어떻게 생각하십니까?", "1=매우 반대 … 5=매우 찬성", "ordinal"),
        ("attitude", "'{topic}'에 대한 귀하의 전반적 만족도는 어느 정도입니까?", "1=매우 불만족 … 5=매우 만족", "ordinal"),
        ("attitude", "'{topic}'을(를) 주변에 추천할 의향이 있습니까?", "1=전혀 없다 … 5=매우 있다", "ordinal"),
        ("knowledge", "'{topic}'의 핵심 목적을 알고 계십니까?", "1=안다 2=모른다 3=잘 모르겠다", "nominal"),
        ("knowledge", "'{topic}'과(와) 관련된 공식 안내 채널을 알고 계십니까?", "예/아니오/모름", "nominal"),
        ("knowledge", "'{topic}' 이용(참여) 가능 대상에 본인이 포함되는지 알고 계십니까?", "예/아니오/모름", "nominal"),
        ("knowledge", "'{topic}'의 주요 제공 주체는 누구입니까?", "개방형 / 모름=99", "nominal"),
        ("knowledge", "다음 중 '{topic}'에서 제공하는 항목을 알고 있는 것은?(항목별 예/아니오)", "항목별 예·아니오", "nominal"),
        ("performance", "지난 한 달간 '{topic}'을(를) 이용해 본 적이 있습니까?", "예/아니오", "nominal"),
        ("performance", "지난 한 달간 '{topic}' 이용 횟수는?", "0/1/2-3/4회 이상", "ordinal"),
        ("performance", "'{topic}' 이용 시 목표한 과업을 완료하셨습니까?", "예/아니오/해당없음", "nominal"),
        ("performance", "'{topic}' 이용 중 문제가 발생했을 때 해결까지 걸린 시간은?", "즉시/1일이내/2-3일/그이상/해당없음", "ordinal"),
        ("performance", "'{topic}' 관련 안내를 실제로 읽고 따랐습니까?", "예/아니오", "nominal"),
        ("psychographic", "나는 새로운 '{topic}' 관련 시도를 먼저 해보는 편이다.", "1~5", "ordinal"),
        ("psychographic", "나는 '{topic}'이(가) 나의 가치관과 잘 맞는다고 느낀다.", "1~5", "ordinal"),
        ("psychographic", "나는 여가·학습 시간에 '{topic}'을(를) 우선적으로 고려한다.", "1~5", "ordinal"),
        ("psychographic", "나는 '{topic}'에 대해 주변과 자주 이야기하는 편이다.", "1~5", "ordinal"),
        ("psychographic", "나는 디지털 전환이 삶의 질을 높인다고 믿는다.", "1~5", "ordinal"),
        ("demographic", "귀하의 연령대는?", "18-29/30-39/40-49/50-59/60+", "ordinal"),
        ("demographic", "귀하의 성별은?", "남성/여성/기타/응답거부", "nominal"),
        ("demographic", "최종 학력은?", "고졸이하/전문대/대졸/대학원이상", "ordinal"),
        ("demographic", "거주 지역 유형은?", "대도시/중소도시/읍면", "nominal"),
        ("demographic", "가구 월평균 소득 구간은?", "200만미만/200-399/400-599/600만이상/응답거부", "ordinal"),
        ("self_administered", "[지시] 아래 문항은 해당하는 칸에 ○ 하세요.", "(안내)", "nominal"),
        ("self_administered", "지난 7일간 '{topic}' 관련 활동을 한 날은 며칠입니까?", "___일", "ratio"),
        ("self_administered", "(형식 전환) 이제 예/아니오로 답하세요. 알림/안내 수신에 동의하셨습니까?", "예/아니오", "nominal"),
        ("self_administered", "추가 의견이 있으면 적어 주세요.", "개방형", "nominal"),
        ("nonsensitive_behavior", "지난 7일간 '{topic}' 관련 정보를 검색한 적이 있습니까?", "예/아니오", "nominal"),
        ("nonsensitive_behavior", "지난 한 달간 '{topic}'에 들인 대략적 시간은?", "0/30분미만/30-119분/2시간이상", "ordinal"),
        ("sensitive_behavior", "가장 신중한 사람도 가끔 규칙을 어길 때가 있습니다. 지난 1년간 '{topic}' 이용 규정을 지키지 못한 적이 있습니까?", "예/아니오/해당없음", "nominal"),
    ]
    topic = "공공 디지털 서비스"
    coding = {"nominal": "범주 코드 1,2,3…", "ordinal": "순위 코드 1~k", "interval": "등간 점수", "ratio": "실측값/횟수"}
    full = []
    for i, t in enumerate(templates, 1):
        ctype, stem, scale, st = t
        full.append(
            {
                "no": i,
                "type": ctype,
                "code": f"Q{i:02d}",
                "stem": stem.format(topic=topic),
                "responseScale": scale,
                "scaleType": st,
                "codingHint": coding[st],
            }
        )
    out["fullQuestionnaireExample"] = {"topic": topic, "count": len(full), "items": full}

    out["aiFormFields"] = [
        {"id": "topic", "label": "설문 주제", "placeholder": "예: 원격근무 만족도, 공공도서관 디지털 대출", "required": True},
        {"id": "researchQuestion", "label": "연구질문", "placeholder": "예: 디지털 대출 이용은 학습 만족도와 관련이 있는가?", "required": True},
        {"id": "population", "label": "대상 모집단", "placeholder": "예: 국내 성인 도서관 회원", "required": True},
        {"id": "mode", "label": "조사 방식", "placeholder": "자기기입식 웹 / 면접원 / 혼합", "required": False},
        {"id": "types", "label": "포함할 내용 유형(복수)", "placeholder": "태도,지식,성과,심리,인구통계,자기기입", "required": True},
        {"id": "minItems", "label": "최소 문항 수", "placeholder": "30", "required": True},
        {"id": "likertPoints", "label": "태도·심리 척도 점수 수", "placeholder": "5 또는 7", "required": False},
        {"id": "includeSensitive", "label": "민감행동 문항 포함 여부", "placeholder": "예/아니오", "required": False},
        {"id": "language", "label": "문항 언어 수준", "placeholder": "일반 성인 / 청소년 / 전문가", "required": False},
        {"id": "notes", "label": "추가 제약·필수 측정개념", "placeholder": "반드시 포함할 개념, 피해야 할 표현 등", "required": False},
    ]

    PUBLIC.mkdir(exist_ok=True)
    METHOD_DIR.mkdir(parents=True, exist_ok=True)
    protocol_path = PUBLIC / "survey-question-protocol.json"
    protocol_path.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")

    # overview for method detail / generic overview
    stage_views = []
    for s in out["stages"]:
        stage_views.append(
            {
                "registryStageId": f"SV-003.{s['id']}",
                "uiStage": s["order"],
                "title": f"{s['order']}단계 · {s['name']}",
                "oneLine": s["goal"],
                "stepRole": ["프로토콜 적용", s["name"], "산출물 정리"],
                "inFunction": "넣는 것 · " + ", ".join(s["inputs"]),
                "outFunction": "나오는 것 · " + ", ".join(s["outputs"]),
                "why": f"{s['name']}은(는) 설문조사 문항 표준프로토콜(Groves·Bradburn·Brace·Dillman)에 따른 필수 절차입니다. 이 단계를 건너뛰면 측정오차·코딩 오류·통계 연동 실패로 이어질 수 있습니다.",
                "exampleText": f"주제 '{topic}' 설문에서 「{s['name']}」을(를) 수행합니다. 워크벤치의 해당 탭에서 예시·기입란·AI/검수를 사용하세요.",
                "table": {
                    "title": f"{s['name']} 산출(예시)",
                    "columns": ["입력", "출력", "자동화"],
                    "rows": [[", ".join(s["inputs"]), ", ".join(s["outputs"]), "반자동화"]],
                },
                "figure": {
                    "type": "flow",
                    "inputs": s["inputs"],
                    "outputs": s["outputs"],
                    "step": s["name"][:12],
                },
                "moreExamples": [
                    {
                        "label": "예시 2 · 체크",
                        "text": f"이 단계가 끝나면 '{s['outputs'][0]}'을(를) 저장하고 다음 단계 입력으로 넘깁니다.",
                    }
                ],
                "beginnerTip": "프로젝트 워크벤치에서 같은 단계 이름으로 진행하세요.",
            }
        )

    overview = {
        "stageViews": stage_views,
        "glossary": [
            {"term": "이중질문", "def": "한 문항에서 두 개 이상의 태도 대상을 동시에 묻는 오류(double-barreled)."},
            {"term": "응답 척도", "def": "응답범주의 점수 수·라벨·균형·DK 위치 등 설계 기준."},
            {"term": "인지응답과정", "def": "이해–회상–판단–보고(및 자기기입 항해) 단계의 응답 모델."},
            {"term": "명목·서열·등간·비율", "def": "측정수준(척도유형). 가능한 통계분석이 달라진다."},
            {"term": "사전검증", "def": "전문가검토·인지면접·현장예비조사·스플릿발럿 등 문항 평가."},
        ],
        "purpose": out["purpose"],
        "source": "Groves et al.(2009); Bradburn et al.(2004); Brace(2018); Dillman(2007)",
        "flow": "목적정의 → 유형분류 → 구조선택 → 초안 → 척도 → 오류점검 → 민감·자기기입 → 사전검증 → AI/엑셀검수 → 코딩변환 → 통계연동",
        "domain": "조사·설문",
        "beginnerIntro": "「설문조사 작성」은 표준프로토콜을 기준으로 문항을 유형별로 설계·생성·검수하고, 명목/서열/등간/비율 코딩 후 사회과학 통계분석(기초·가정검토·추론)으로 연결하는 워크벤치입니다.",
    }
    (METHOD_DIR / "overview.json").write_text(json.dumps(overview, ensure_ascii=False, indent=1), encoding="utf-8")
    (METHOD_DIR / "glossary.json").write_text(json.dumps(overview["glossary"], ensure_ascii=False, indent=1), encoding="utf-8")

    # lightweight perf-registry for f11 runner fallback
    tasks = []
    for s in out["stages"]:
        tasks.append(
            {
                "stage": s["order"],
                "stageName": s["name"],
                "taskId": f"sqw-{s['id']}",
                "taskName": s["name"],
                "automation": "반자동화",
                "input": ", ".join(s["inputs"]),
                "output": ", ".join(s["outputs"]),
                "easy": s["goal"],
                "example": f"{topic} 설문 · {s['name']}",
            }
        )
    perf = {"methodId": "SV-003", "perfSlug": "SV-003", "stages": 11, "tasks": tasks}
    (METHOD_DIR / "perf-registry.json").write_text(json.dumps(perf, ensure_ascii=False, indent=1), encoding="utf-8")
    (METHOD_DIR / "samples.json").write_text(
        json.dumps({"fullQuestionnaireExample": out["fullQuestionnaireExample"], "examples": out["examples"]}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    print("OK", protocol_path)
    print("sheets", {k: len(v["rows"]) for k, v in out["sheets"].items()})
    print("full", len(full))


if __name__ == "__main__":
    main()
