# -*- coding: utf-8 -*-
"""Concrete coding examples for Historical–Comparative stage ③."""
from __future__ import annotations


def _excerpt_pack(akey: str, topic: dict, seed: int) -> dict:
    """Return topic-flavored sample excerpts and code applications."""
    title = topic.get("title", "")
    focus = topic.get("focus", "")
    period = topic.get("period", "")
    a = akey.lower()

    if a.startswith("oral") or a.startswith("ohp"):
        return {
            "unit": "구술 전사 발화(타임코드 단위)",
            "excerpts": [
                {
                    "id": "EX-OH1",
                    "src": "OH-01 전사 00:14:22–00:15:08",
                    "text": f"「그때는 야근이 기본이었고, 다치면 알아서 하랬어요. 노조 이야기는 입 밖으로 못 냈죠.」({period} 회고)",
                    "codes": ["ACT_LABOR", "CTX_REPRESS", "MEM_FEAR", "EVT_WORKRULE"],
                    "why": "노동 경험(행위)+억압 맥락+감정 기억+직장규칙 사건을 한 발화에 겹쳐 코딩",
                },
                {
                    "id": "EX-OH2",
                    "src": "OH-02 전사 00:31:05–00:32:40",
                    "text": "「피란 갈 때 동생 손을 놓칠까 봐… 역 앞에서 사람을 못 찾았어요.」",
                    "codes": ["EVT_FLIGHT", "ACT_FAMILY", "MEM_TRAUMA", "CTX_WAR"],
                    "why": "피란 사건·가족 행위자·트라우마 기억·전쟁 맥락을 분리해 달되, 동일 발화에 다중코드 허용",
                },
                {
                    "id": "EX-OH3",
                    "src": "OH-03 전사 01:02:11–01:03:00",
                    "text": "「신문에 난 것과 우리가 본 것은 달랐어요. 그날은 조용했어요.」",
                    "codes": ["DISC_OFFICIAL", "DISC_COUNTER", "EVID_DISCREP"],
                    "why": "공식서사 vs 현장기억의 불일치를 ‘증거 충돌’ 코드로 표시 → 이후 삼각검증 표로 연결",
                },
            ],
            "codes_extra": [
                ["ACT_LABOR", "행위자-노동", "일터에서의 노동·교섭·파업 행위", "「잔업 거부하고…」", "단순 출퇴근 언급(맥락만이면 CTX)"],
                ["MEM_FEAR", "기억-공포", "위협·감시로 인한 침묵·회피", "「입 밖으로 못 냈다」", "일반적 긴장(MEM_TENSE)"],
                ["EVID_DISCREP", "증거-불일치", "구술↔문서/언론 충돌", "「신문과 달랐다」", "단순 기억 오류 추정만으로 단정 금지"],
            ],
        }

    if a.startswith("doc") or a.startswith("arch") or a.startswith("hrm"):
        return {
            "unit": "문서 단락·조항·목록 행",
            "excerpts": [
                {
                    "id": "EX-D1",
                    "src": "SRC-01 공문서 철3 p.12",
                    "text": f"「군수는 할당된 공출량을 기한 내 완수할 것. 미달 시 문책.」({period})",
                    "codes": ["ACT_STATE", "EVT_REQUISITION", "CTX_ADMIN", "NORM_COERCION"],
                    "why": "행정명령(국가행위)·징발 사건·행정 맥락·강제 규범을 조항 단위로 코딩",
                },
                {
                    "id": "EX-D2",
                    "src": "SRC-02 사설 1924-05-03",
                    "text": "「민중의 각성이 없이는 산업도 없다」",
                    "codes": ["DISC_NATION", "DISC_ECONOMY", "ACT_PRESS"],
                    "why": "담론 코드(민족·경제)와 매체 행위(언론)를 분리. 사설=행위자로서의 언론",
                },
                {
                    "id": "EX-D3",
                    "src": "일기 1952-11-08",
                    "text": "「배급이 끊겨 이웃과 나눠 먹었다.」",
                    "codes": ["EVT_SHORTAGE", "ACT_NEIGHBOR", "CTX_EVERYDAY"],
                    "why": "미시 일상 사건·상호부조 행위·일상 맥락. 거시 정책 코드는 직접 언급 없으면 달지 않음",
                },
            ],
            "codes_extra": [
                ["EVT_REQUISITION", "사건-징발/공출", "물자·노동 강제 할당", "「할당량 완수」", "자발적 기부 서술"],
                ["NORM_COERCION", "규범-강제", "처벌·문책으로 순응 유도", "「미달 시 문책」", "단순 권고·훈시"],
                ["DISC_NATION", "담론-민족", "민족·국민 호명", "「민중의 각성」", "일반 ‘사람’ 지칭만"],
            ],
        }

    if a.startswith("pt_") or a.startswith("comp") or a.startswith("cha") or a.startswith("kkv"):
        return {
            "unit": "사건카드 + 기제단계 증거 조각",
            "excerpts": [
                {
                    "id": "EX-P1",
                    "src": "회의록 1997-11-21 / SRC-01",
                    "text": "「외환 부족이 심각. 긴급 대책위를 구성한다.»",
                    "codes": ["MECH_TRIGGER", "ACT_STATE", "EVT_CRISIS", "COAL_FORM"],
                    "why": "위기 인식=Trigger, 대책위=연합 형성 시작. 기제단계 코드와 행위자 코드를 동시 부여",
                },
                {
                    "id": "EX-P2",
                    "src": "법안 심의록 p.4",
                    "text": "「야당 요구안을 절충해 수정안을 상정」",
                    "codes": ["MECH_AGENDA", "ACT_PARTY", "NEGOTIATE"],
                    "why": "의제화·정당 행위·협상. ‘통과’가 아니면 MECH_DECISION을 아직 달지 않음",
                },
                {
                    "id": "EX-P3",
                    "src": "시행령·신문 교차",
                    "text": "「개정안 공포. 익월부터 적용」 / 「현장은 준비 미비」",
                    "codes": ["MECH_OUTCOME", "EVID_DISCREP", "CTX_IMPL"],
                    "why": "공식적 Outcome과 현장 괴리를 병기 → 기제 ‘완전 성공’ 단정 금지",
                },
            ],
            "codes_extra": [
                ["MECH_TRIGGER", "기제-촉발", "위기·충격이 행위 개시", "긴급·부족·발발", "일상적 안건 상정만"],
                ["MECH_AGENDA", "기제-의제", "공식 안건·수정안 채택", "상정·심의", "사적 의견 교환만"],
                ["COAL_FORM", "연합-형성", "행위자 연합·위원회", "대책위·연대", "단독 지시만"],
            ],
        }

    if a.startswith("herm") or a.startswith("ih") or a.startswith("ihr") or a.startswith("ph_"):
        return {
            "unit": "개념·문장·수사 단위",
            "excerpts": [
                {
                    "id": "EX-H1",
                    "src": "잡지 논설 1948",
                    "text": "「민주주의란 다수결이 아니라 민의 자치이다」",
                    "codes": ["CONCEPT_DEMO", "RHET_DEF", "DISC_CONTEND"],
                    "why": "개념 재정의(정의 수사)+경합 담론. ‘민주주의’ 빈도만 세지 말고 정의 내용을 코딩",
                },
                {
                    "id": "EX-H2",
                    "src": "회고록 서문",
                    "text": "「지금 돌이켜보면 그때의 침묵이 부끄럽다」",
                    "codes": ["NARR_PRESENT", "MEM_REGRET", "TEMP_RETRO"],
                    "why": "서술 시점=현재, 과거 평가=후회. 회고의 ‘지금’이 과거 의미를 재배열함을 표시",
                },
                {
                    "id": "EX-H3",
                    "src": "번역서 주석",
                    "text": "원어 liberty → 「자유」로 옮기되 ‘방종’과 구별",
                    "codes": ["TRANS_CHOICE", "CONCEPT_LIB", "NORM_BOUNDARY"],
                    "why": "번역 선택이 개념 경계를 만듦. 원어·역어·배제항을 함께 기록",
                },
            ],
            "codes_extra": [
                ["CONCEPT_DEMO", "개념-민주주의", "민주주의 정의·용례", "민·다수결·자치", "단순 ‘민주’ 수식어만"],
                ["NARR_PRESENT", "서술-현재시점", "회고·현재 평가 개입", "돌이켜보면·지금", "순수 과거형 사실 진술"],
                ["TRANS_CHOICE", "번역-선택", "역어 결정·주석", "→「…」로 옮김", "번역 사실만 언급"],
            ],
        }

    if a.startswith("lsb_") or a.startswith("hs_"):
        return {
            "unit": "문헌·제도·계량 관찰 단위(+질적 메모)",
            "excerpts": [
                {
                    "id": "EX-S1",
                    "src": "서지 DB 요약 / 학회 창간사",
                    "text": "「본 분과는 대형 장비 공유를 전제로 한다」",
                    "codes": ["SCI_BIG", "INFRA_SHARE", "INST_SPLIT"],
                    "why": "큰 과학·인프라·분과 제도를 연결. 수치(논문 수)와 질적 코드 병행",
                },
                {
                    "id": "EX-S2",
                    "src": "예산 문서",
                    "text": "「연구비 항목에 장비유지비 신설」",
                    "codes": ["SCI_BIG", "BUDGET_SHIFT", "CTX_COLDWAR"],
                    "why": "예산 구조 변화=제도적 전환 증거. 성장곡선 그림과 코딩을 대응",
                },
                {
                    "id": "EX-S3",
                    "src": "공저 네트워크 메모",
                    "text": "동일 논문 저자 12명, 3개국 소속",
                    "codes": ["COLLAB_MULTI", "SCI_BIG", "NET_INTL"],
                    "why": "협업 규모·국제성. ‘작은 과학’ 단독저자 패턴과 대비 코드",
                },
            ],
            "codes_extra": [
                ["SCI_BIG", "과학-거대화", "장비·예산·인력 규모화", "대형·공유·유지비", "개인 실험실 일상만"],
                ["INST_SPLIT", "제도-분화", "분과·저널 신설", "창간·분과", "단순 인사이동"],
                ["COLLAB_MULTI", "협업-다자", "다수 공저·다기관", "N≥5 또는 다국", "2인 공저 기본형"],
            ],
        }

    # default / historical sociology-ish
    return {
        "unit": f"텍스트·사건 단위 (초점: {focus})",
        "excerpts": [
            {
                "id": "EX-G1",
                "src": f"핵심사료 / {title[:20]}",
                "text": f"「{focus}와 관련해 제도 변화와 현장 반응이 동시에 나타난다.»",
                "codes": ["EVT_CHANGE", "ACT_INST", "ACT_LOCAL", "CTX_STRUCT"],
                "why": "제도 행위와 현장 행위를 분리하고, 구조 맥락 코드를 별도 부여",
            },
            {
                "id": "EX-G2",
                "src": "신문·문교 교차",
                "text": "「상부는 성공이라 했으나 일선은 혼란」",
                "codes": ["DISC_OFFICIAL", "DISC_COUNTER", "EVID_DISCREP"],
                "why": "공식/현장 담론 대립을 불일치 코드로 연결",
            },
            {
                "id": "EX-G3",
                "src": "연대기 E12 연결",
                "text": "전환점 이후 동일 코드 빈도 상승",
                "codes": ["EVT_TURN", "PATT_ESCALATE"],
                "why": "패턴코딩: 단발 사건이 아니라 반복·강화 패턴에 상위코드",
            },
        ],
        "codes_extra": [
            ["EVT_CHANGE", "사건-변화", "제도·관행의 전환", "개정·도입·폐지", "일상 반복만"],
            ["CTX_STRUCT", "맥락-구조", "장기 구조 조건", "계급·시장·국가형태", "일시적 날씨·우연"],
            ["PATT_ESCALATE", "패턴-고조", "동일 현상 강화", "빈도↑·수위↑", "일회성 사건"],
        ],
    }


def codebook_rows(akey: str, topic: dict, seed: int) -> list[list[str]]:
    pack = _excerpt_pack(akey, topic, seed)
    base = [
        ["코드", "범주", "조작적 정의", "포함 예시", "제외(비슷한 것)"],
        ["ACT_STATE", "행위자", "국가·관료·공권력의 지시·집행", "포고령·수사·배급 지시", "민간 단체의 자율 결정"],
        ["ACT_CIVIL", "행위자", "시민·노동자·학생 등의 집합행위", "파업·시위·청원", "개인 불만 일기만(집단성 없음)"],
        ["CTX_INTL", "맥락", "국제·안보·원조·외압", "원조조건·조약 압력", "국내 물가만 언급"],
        ["EVT_TURN", "사건", "경로를 바꾼 전환점", "선언·패배·타협 성사", "일상적 회의"],
        ["MEM_TRAUMA", "기억", "트라우마·침묵·회피", "말을 잇지 못함·회피", "단순 피곤 호소"],
        ["DISC_OFFICIAL", "담론", "공식·공보 서사", "관보·공식 성명", "사설의 비판적 논조"],
    ]
    for row in pack["codes_extra"]:
        base.append(row)
    # topic-specific tag
    focus = topic.get("focus", "주제")[:20]
    base.append(
        [
            f"TOP_{seed % 90 + 10}",
            "주제특화",
            f"「{focus}」 관련 핵심 현상",
            f"{topic.get('title', '')[:18]}… 관련 진술",
            "초점 외 일반 서술",
        ]
    )
    return base


def coding_application_rows(akey: str, topic: dict, seed: int) -> list[list[str]]:
    pack = _excerpt_pack(akey, topic, seed)
    rows = [["발췌ID", "출처·위치", "원문(요약)", "부여 코드", "코딩 근거(왜 이 코드인가)"]]
    for ex in pack["excerpts"]:
        rows.append(
            [
                ex["id"],
                ex["src"],
                ex["text"][:80] + ("…" if len(ex["text"]) > 80 else ""),
                ", ".join(ex["codes"]),
                ex["why"],
            ]
        )
    return rows


def double_coding_rows(seed: int) -> list[list[str]]:
    return [
        ["표본", "코더A", "코더B", "합치", "불일치 코드", "합의 결과"],
        [f"15% 표본({12 + seed % 8}발췌)", "ACT_STATE+EVT_TURN", "ACT_STATE+CTX_ADMIN", "부분", "EVT_TURN vs CTX", "EVT_TURN 유지·CTX 추가"],
        ["동일 표본", "MEM_TRAUMA", "MEM_FEAR", "근접", "감정 세분", "상위 MEM_AFFECT로 통합 후 하위 병기"],
        ["동일 표본", "MECH_AGENDA", "MECH_DECISION", "불일치", "단계 성급", "통과 전→AGENDA로 수정"],
    ]


def process_evidence_rows(topic: dict, seed: int, concrete: bool) -> list[list[str]]:
    if not concrete:
        return [
            ["주장요소", "원문·근거 발췌", "사료", "연결 방식"],
            ["핵심개념 정의", "「…란 …이다」(용례 3)", "SRC-02", "개념코드→해석 문단"],
            ["전환점", "연대기 E7과 동일 날짜 기록", "SRC-01", "사건코드 EVT_TURN"],
            ["한계", "C등급 회고만 존재", "OH/2차", "유보·추가수집"],
        ]
    h = topic.get("hypothesis", "")[:36]
    return [
        ["기제단계", "예측 증거(코딩 전)", "실제 발췌·코드", "사료", "판정", "비고"],
        [
            "1 Trigger",
            "위기 인식 문서/보도",
            "「긴급…부족」→ MECH_TRIGGER, EVT_CRISIS",
            "SRC-02",
            "Pass",
            "날짜 일치",
        ],
        [
            "2 Coalition",
            "회합·연대·위원회",
            "「대책위 구성」→ COAL_FORM, ACT_STATE",
            "SRC-01",
            "Pass",
            "참석자 명단 있음",
        ],
        [
            "3 Agenda",
            "공식 안건·수정안",
            "「수정안 상정」→ MECH_AGENDA",
            "심의록",
            "Insufficient",
            "투표 기록 부재",
        ],
        [
            "4 Decision",
            "가결·서명·공포",
            "결정문 → MECH_DECISION",
            "SRC-01",
            "Pass",
            "직인 확인",
        ],
        [
            "5 Outcome",
            "시행·현장 결과",
            "공포+「현장 미비」→ MECH_OUTCOME, EVID_DISCREP",
            "교차",
            "Pass*",
            f"명제 ‘{h}…’는 부분지지",
        ],
    ]


def coding_procedure_paras(akey: str, topic: dict, method_name: str, seed: int) -> list[str]:
    pack = _excerpt_pack(akey, topic, seed)
    n_codes = 18 + seed % 12
    return [
        f"【코딩 단위】{pack['unit']}. 한 단위에 코드 1개 이상 가능(다중코딩). "
        f"주제 「{topic['title']}」·초점 「{topic['focus']}」에 맞춰 코드북 v1.0({n_codes}개)을 확정한다.",
        "【코드북 작성】각 코드마다 (1)짧은 이름 (2)조작적 정의 (3)포함 예시 원문 (4)제외 규칙 (5)상위/하위 관계를 표로 적는다. "
        "유사 코드(예: MEM_FEAR vs MEM_TRAUMA)는 ‘구분 기준’ 한 줄을 추가한다.",
        "【적용 절차】①사건목록·전사·문서 발췌를 행으로 붙인다 →②정의에 맞는 코드를 부여한다 →③왜 그 코드인지 1문장 근거를 적는다 "
        "→④애매하면 ‘후보코드’로 표시 후 메모. 아래 ‘코딩 적용 예시표’처럼 원문→코드→근거를 남긴다.",
        f"【품질】이중코딩 표본 15%. 합치도(합의 전/후)를 기록하고, 불일치 유형(단계 성급·감정 세분·행위자 혼동)별로 코드북을 개정({method_name}).",
        "【analytic memo】코딩 중 떠오른 가설·비교 아이디어는 별도 메모 파일에만 쓰고, 원문 코딩칸과 섞지 않는다.",
    ]


def mechanism_procedure_paras(topic: dict, method_name: str, use_pt: bool) -> list[str]:
    if use_pt:
        return [
            f"【기제 가설 분해】중심 명제 「{topic['hypothesis']}」를 "
            "Trigger→Coalition→Agenda→Decision→Outcome 5단계로 나눈다. 각 단계는 ‘관찰 가능한 증거’로 번역한다.",
            "【코딩과의 연결】단계마다 MECH_* 코드를 쓰고, 동시에 ACT_*/EVT_*/EVID_*를 병기한다. "
            "예: ‘대책위 구성’ = MECH_TRIGGER 이후 COAL_FORM + ACT_STATE.",
            "【증거 테스트】단계별 표에 예측증거 / 실제발췌+코드 / 사료ID / Pass·Fail·Insufficient를 적는다. "
            "Insufficient면 추가 수집 과제로 넘기고 도식에서는 점선으로 표시한다.",
            "【대안 기제】같은 증거를 설명하는 경쟁 설명(예: 외압만이 원인)이 있으면 ALT_MECH로 코딩·병기한다.",
            f"【도식】그림 B에 5단계를 화살표로 그리고, 약한 고리(본 샘플에서는 Agenda)에 주석. ({method_name})",
        ]
    return [
        f"【기제도식 조정】「{method_name}」·본 주제는 과정추적 5단계가 필수는 아니므로 "
        "『개념·주장 → 근거 발췌 → 코드 → 해석 문장』 연결표로 대체한다.",
        "【최소 코딩 연결】핵심 개념·전환점·한계 각각에 원문 발췌 1개 이상과 코드를 붙인다. "
        "C등급 사료만 있으면 ‘유보’로 표시한다.",
        "【개념지도】관련 개념어를 노드로, ‘정의/경합/번역’ 관계를 엣지로 그려 그림 B를 대체할 수 있다.",
        "【명시】방법란에 ‘과정추적 기제도식 N/A — 개념·해석 경로표 사용’ 사유를 한 문단으로 남긴다.",
    ]
