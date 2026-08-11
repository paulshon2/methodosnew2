# -*- coding: utf-8 -*-
"""Concrete coding examples for Ethnography stage ③ (4 tasks)."""
from __future__ import annotations


def descriptive_codebook(topic: dict, seed: int) -> list[list[str]]:
    focus = topic.get("focus", "실천")[:16]
    return [
        ["코드", "유형", "조작적 정의", "포함 예시", "제외"],
        ["DESC_GREET", "기술", "인사·입장 의례", "「안녕하세요」·고개 숙임", "업무 지시만"],
        ["DESC_HANDOFF", "기술", "인수인계·교대 대화", "「이거만 챙기세요」", "잡담 전체"],
        ["DESC_SPACE", "기술", "자리·영역 표시", "가방으로 자리 찜", "단순 이동"],
        ["DESC_RULE", "기술", "규칙·금지 언급", "「여기선 안 돼요」", "연구자 추측만"],
        ["DESC_JOKE", "기술", "농담·놀림", "웃음 유발 발화", "공식 공지"],
        ["DESC_SILENCE", "기술", "침묵·회피", "질문 후 3초↑ 침묵", "짧은 숨"],
        [f"DESC_T{seed % 20}", "기술-주제", f"{focus} 관련 장면", f"{topic.get('title','')[:14]}…", "초점 외"],
    ]


def descriptive_application(topic: dict, akey: str) -> list[list[str]]:
    site = topic.get("site", "현장")
    if akey.startswith("netn"):
        rows = [
            ["FN-12 스레드", f"{site} 게시글", "「신규는 인사부터」", "DESC_GREET, DESC_RULE", "입장 규범을 게시물이 명시"],
            ["FN-18 댓글", "댓글연쇄", "이모지 20개·답글 없음", "DESC_SILENCE, DESC_JOKE", "리액션이 말 대신 쓰임"],
            ["FN-22 DM요지", "동의한 DM", "「방장한테 먼저…」", "DESC_RULE, DESC_HANDOFF", "게이트키핑 안내"],
        ]
    elif akey.startswith("auto"):
        rows = [
            ["AE-03", "자기일지", "「교사로 남아야 할지…」", "DESC_SILENCE, DESC_RULE", "역할 갈등 장면"],
            ["AE-07", "동료대화", "「너는 연구자 모드야」", "DESC_JOKE, DESC_RULE", "위치성 지적"],
            ["AE-11", "교실장면", "손을 들었다가 내림", "DESC_SILENCE, DESC_SPACE", "발언 주저"],
        ]
    else:
        rows = [
            ["FN-03", f"{site} 09:10", "문이 열리며 구두 인사", "DESC_GREET", "입장 의례"],
            ["FN-09", "교대 시간", "「야간만 보면 돼요」", "DESC_HANDOFF, DESC_RULE", "교대 지식 전달"],
            ["FN-15", "휴게 코너", "가방으로 소파 한쪽 점유", "DESC_SPACE", "영역 표시"],
        ]
    return [["발췌ID", "출처", "원문·장면", "기술코드", "근거"]] + rows


def pattern_rows(topic: dict) -> list[list[str]]:
    return [
        ["패턴코드", "의미", "근거가 된 기술코드", "발췌 예", "반례"],
        ["PATT_INFORMAL_HIER", "암묵적 서열", "DESC_GREET+DESC_SILENCE", "신입은 말없이 고개만", "공식 직책자가 먼저 인사하는 날"],
        ["PATT_SCRIPT_GAP", "공식↔실제 간극", "DESC_RULE+DESC_JOKE", "매뉴얼 읽고 바로 편법 농담", "감사 기간엔 매뉴얼 준수"],
        ["PATT_CARE_TACTIC", "임기응변 돌봄/조정", "DESC_HANDOFF", "인수인계에 비공식 팁", "매뉴얼에만 의존한 교대"],
        ["PATT_BOUNDARY", "경계·배제", "DESC_SPACE+DESC_RULE", "「회원만」 자리 표시", "개방 행사일"],
        ["PATT_FOCUS", f"{topic.get('focus','')[:12]} 패턴", "DESC_T*", f"{topic.get('title','')[:16]}", "초점 외 에피소드"],
    ]


def concept_map_rows(topic: dict) -> list[list[str]]:
    return [
        ["개념A", "관계", "개념B", "현장 근거", "한줄 명제"],
        ["공식규칙", "긴장", "암묵규범", "PATT_SCRIPT_GAP", "말은 평등, 실천은 서열"],
        ["라포", "가능하게함", "비밀공유", "핵심정보제공자 면담", "신뢰 후에야 금기 이야기"],
        ["공간배치", "재생산", "위계", "DESC_SPACE", "자리=목소리 크기"],
        ["상징(유니폼·이모지)", "표시", "소속", "인공물 목록", "작은 기호가 멤버십"],
        ["연구자위치", "굴절", "관찰내용", "성찰메모", f"{topic.get('hypothesis','')[:28]}…"],
    ]


def thick_description_sample(topic: dict) -> list[str]:
    return [
        f"【에피소드】「{topic['title']}」현장({topic.get('site')})의 한 장면.",
        "얇은 기술: 신입 참여자가 문 앞에서 멈추고, 먼저 온 사람이 고개를 끄덕인 뒤에야 들어왔다.",
        "두꺼운 기술: 그 멈춤은 ‘허락을 구함’의 몸짓이다. 고개 끄덕임은 공식 출입 규칙에 없는 "
        "암묵적 승인이다. 나중에 핵심정보제공자는 「여기 눈치 못 보면 금방 티 나요」라고 했다. "
        f"이 장면은 초점({topic.get('focus')})과 연결되어, 소속이 ‘서류’가 아니라 ‘승인 의례’로 갱신됨을 보여 준다.",
        f"해석 한줄: {topic.get('hypothesis')}",
    ]


def coding_proc_descriptive(topic: dict, method_name: str, seed: int) -> list[str]:
    return [
        f"【단위】현장노트 단락·스레드·장면 카드. 주제 「{topic['title']}」.",
        f"【절차】①확장 노트를 행으로 붙인다 →②기술코드(DESC_*)를 부여한다 →③근거 1문장 →④애매하면 후보코드. ({method_name})",
        f"【코드북】약 {12 + seed % 8}개 기술코드. 정의·포함·제외를 표로 고정(아래).",
        "【금지】첫 코딩에서 바로 ‘권력’ 같은 추상 개념만 달지 않는다. 먼저 관찰 가능한 행위에 라벨.",
    ]


def coding_proc_pattern(topic: dict) -> list[str]:
    return [
        "【묶기】같은 기술코드가 3회 이상 반복되거나, 서로 다른 기술코드가 한 장면에서 공출현하면 패턴 후보.",
        f"【명명】PATT_* 로 규범·위계·간극·경계를 이름 붙인다. 초점={topic.get('focus')}.",
        "【증거】패턴당 발췌 ≥3, 반례 ≥1을 표에 남긴다.",
        "【개정】반례가 많으면 패턴을 쪼개거나 폐기한다.",
    ]


def coding_proc_integrate(topic: dict) -> list[str]:
    return [
        "【관계】패턴 간 긴장·상호강화·조건관계를 화살표로 연결한다.",
        f"【통합 명제】{topic.get('hypothesis')}",
        "【검증】개념지도의 각 화살표에 현장 근거(발췌ID)를 붙인다.",
        "【성찰】연구자 위치성이 어떤 관계를 ‘더 잘 보이게’ 했는지 memo에 적는다.",
    ]


def coding_proc_thick(topic: dict) -> list[str]:
    return [
        "【선택】패턴을 잘 보여주는 에피소드 1–2개를 고른다.",
        "【쓰기】누가·무엇을 했는지(얇음) + 그 문화에서 뜻하는 바(두꺼움) + 참여자 언어.",
        "【연결】기술코드·패턴코드를 각주에 병기해 코딩 감사추적(audit trail)을 남긴다.",
        f"【윤리】식별 위험 세부은 가명·장소 일반화. 주제={topic.get('title')}.",
    ]
