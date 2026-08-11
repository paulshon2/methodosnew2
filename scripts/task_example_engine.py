# -*- coding: utf-8
"""Task-specific detailed example galleries (370×5) with relevance notes."""
from __future__ import annotations

import hashlib
import re

BANNED_FRAGMENTS = ("박사논문", "박사 수준", "중학생수준", "중학생 수준", "국제저널 재현 프로토콜", "박사논문 3장")

ARCHETYPE_DOMAIN = {
    1: ("설문·양적통계", "Survey–Quantitative Statistics", "직무만족·조직몰입 조사"),
    2: ("역사·비교사료", "Historical–Comparative Sources", "산업화 이후 노동조합 비교사"),
    3: ("민족지·참여관찰", "Ethnography", "도시 청년 공유오피스 문화"),
    4: ("텍스트·계산언어", "Computational Text Analysis", "기후정책 SNS 담론"),
    5: ("EV-007·근거합성", "Systematic Review", "원격근무 정신건강 개입"),
    6: ("정책·EP-007", "Policy Evaluation", "지역 청년 일자리 프로그램"),
    7: ("인과·실험설계", "Causal Inference", "독서치료 개입 효과"),
    8: ("현상학·체험탐구", "Phenomenology", "간호사 번아웃 경험"),
    9: ("예측·시스템모형", "Forecasting & Simulation", "전력수요 시계열 예측"),
    10: ("QL-008", "Grounded Theory", "교사 디지털 전환 적응"),
    11: ("TX-002·코딩", "Content Analysis", "선거보도 프레이밍"),
    12: ("서사·생애사", "Narrative Inquiry", "이주 여성의 생애사"),
    13: ("실행·QL-046", "Action Research", "학교 급식 개선 실행연구"),
    14: ("담화·비판담화", "Discourse Analysis", "이주자 정책 담화"),
    15: ("심층면담", "In-depth Interview", "청년 주거 불안 경험"),
    16: ("질적설계·자연주의", "Qualitative Design", "다문화 교실 상호작용"),
    17: ("푸코·비판이론", "Foucauldian Analysis", "교육 평가 담론 권력"),
    18: ("상징적상호작용", "Symbolic Interactionism", "병원 응급실 상호작용"),
    19: ("QL-020", "Case Study", "스타트업 조직문화 단일사례"),
    20: ("계량서지·인용", "Bibliometrics", "인공지능 교육 연구 동향"),
    21: ("질적메타합성", "Qualitative Meta-Synthesis", "돌봄노동 질적연구 합성"),
    22: ("대화·QL-050", "Conversation Analysis", "상담 초기 상담담화"),
    23: ("GN-029", "Q Methodology", "기후정책 수용 관점 유형"),
    24: ("조사연구방법", "Survey Research", "시민 정치참여 조사"),
    25: ("간호이론구축", "Nursing Theory", "만성질환 자기관리 이론"),
    26: ("관찰기법", "Observation", "유아원 놀이 관찰"),
    27: ("비교정치·패턴", "Comparative Politics", "복지국가 유형 비교"),
    28: ("MM-001", "Mixed Methods", "학습플랫폼 UX 혼합연구"),
    29: ("키워드핵심성", "Keyword Salience", "탄소중립 정책 키워드"),
    30: ("역학연구", "Epidemiology", "대사증후군 코호트"),
    31: ("일반연구방법론", "General Methodology", "연구 방법론 장"),
}

PROCESS_KO = {
    "collect": "자료수집(Data Collection)",
    "preprocess": "전처리(Preprocessing)",
    "coding": "코딩(Coding)",
    "stats": "통계기법(Statistical Technique)",
    "result": "결과도출(Result Derivation)",
    "deliverable": "최종 산출물(Final Deliverable)",
}

CASE_NAMES: dict[int, list[str]] = {
    1: ["서울 25구 청년 주거·온라인 본조사", "수도권 간호사 3교대 표본", "공공기관 직무만족 CATI", "대학생 학습몰입 패널 재조사", "제조업 SMES 현장 설문"],
    2: ["1960–80년 노동조합 공문 아카이브", "독·한 산업화 비교 사료", "HC-001 증언 6명(공장)", "국회 기록원 입법 자료", "지방자치단체 회의록 3곳"],
    3: ["강남·성수 공유오피스 12주 관찰", "키 informant 4명(운영·이용)", "공간 사용 사진·플로어맵", "커뮤니티 이벤트 5회 참관", "채팅·게시판 아카이브"],
    4: ["트위터 기후정책 2023–24 8만건", "뉴스 API 헤드라인 1.2만건", "TF-IDF+토픽 8개", "공저 네트워크 450노드", "감성분류 F1=.82 모형"],
    5: ["PubMed+RISS 원격근무 RCT 14편", "PRISMA 스크리닝 1,240→18편", "Risk of bias RoB2", "Forest plot OR=1.34", "GRADE 근거 Very low→Moderate"],
    10: ["초·중 교사 22명 GT 면담", "디지털 수업 전환 1학기 관찰", "교육청 공문·연수 자료", "학부모 4명 보조 면담", "이론적 포화 19명째"],
    11: ["TV 선거보도 2주 180기사", "프레이밍 코드 12개", "Cohen κ=.81", "카이제곱 프레임×후보 p=.003", "정치·경제 지면 비교"],
    30: ["40–69세 코호트 n=3,420", "대사증후군 5년 추적", "OR=1.62 (95% CI 1.21–2.17)", "콕스 HR 보정 1.38", "층화: 성별 effect mod"],
}


def _default_cases(topic: str, dom: str, seed: str, n: int = 5) -> list[str]:
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    pool = [
        f"{topic} — 현장 사례 1",
        f"{topic} — 현장 사례 2",
        f"{dom} 현장 A",
        f"{dom} 현장 B",
        f"{topic} 다기관 협력",
        f"{topic} 예비 점검(n=15)",
        f"{topic} 본실행 기록",
    ]
    return [pool[(h + i) % len(pool)] for i in range(n)]


def case_titles(bundle_id: int, topic: str, dom_ko: str, seed: str) -> list[str]:
    if bundle_id in CASE_NAMES:
        base = CASE_NAMES[bundle_id]
        h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
        return [base[(h + i) % len(base)] for i in range(5)]
    return _default_cases(topic, dom_ko, seed, 5)


def clean_task(task: str) -> str:
    t = re.sub(r"\(Procedural Task\)", "", task or "", flags=re.I)
    return re.sub(r"^\d+\)\s*", "", t).strip()


def relevance(task: str, title: str, because: str) -> str:
    t = clean_task(task)[:70]
    return (
        f"이 예시는 「{title}」 상황에서 「{t}」을(를) 실행할 때 무엇을 적어야 하는지 보여 줍니다. "
        f"{because} 같은 형식으로 적으면 다음 단계에서 자료를 이어 받기 쉽습니다."
    )


def _ex(kind: str, process_key: str, bundle_id: int, topic: str, dom: str, task: str, title: str, idx: int) -> tuple[str, str]:
    """Return (body, relevance_because)."""
    tl = clean_task(task)

    if kind == "population_sampling" or (process_key == "collect" and re.search(r"모집단|표본", tl, re.I)):
        bodies = [
            (
                f"【연구】{topic}\n【모집단】2025년 서울 거주 만 19–29세 (조작적 정의: 주민등록상 주소지)\n"
                f"【표집틀】행정안전부 주민등록 인구통계 + 청년 DB(자치구 제공)\n"
                f"【설계】자치구 인구 비례 층화 → 구 내 성별 층화 → 무작위 추출\n"
                f"【표본크기】95% 신뢰, ±5% 오차, p=.5 → n=385 (무응답 30% 가정 → 발송 550)\n"
                f"【배분】강남구 6.2% → 24명, … (표 1)\n【윤리】IRB-2025-041, 온라인 동의·탈락권 고지",
                "모집단·표본·표본크기를 숫자와 표로 같이 적어야 설문·통계 단계에서 '누구에게 일반화하는지'가 분명해집니다.",
            ),
            (
                f"【연구】{topic}\n【모집단】수도권 300병상 이상 종합병원 간호사\n"
                f"【표집】병동 군집표집 8병원 → 병동 내 명단에서 무작위 40명/병원\n"
                f"【n】목표 320 (클러스터 8×40), 설계효과 DEFF≈1.4 반영\n"
                f"【대체】무작위 선정 5명 거부 → 같은 병동 명단에서 순번 대체",
                "군집표집은 '병동'처럼 표집틀과 대체 규칙을 써야 현장에서 그대로 실행할 수 있습니다.",
            ),
            (
                f"【연구】{topic}\n【모집단】경기 공립고 2학년 재학생\n"
                f"【표집틀】교육청 학교명부, 학교규모(대/중/소) 층화 12교\n"
                f"【표본】교당 38명 무작위 → 총 n=456 (±4.5%)\n"
                f"【비확률 보조】1교 무응답 과다 → 층 내 인접 학교로 1교 교체(기록)",
                "층화표집 예시는 층 정의와 교체 사유를 남겨야 편향 논의가 가능합니다.",
            ),
            (
                f"【연구】{topic}\n【모집단】특정 앱 MAU 상위 20% (최근 30일 로그인)\n"
                f"【표집】앱 내 배너 + 성·연령 할당(남20–29 50% 등)\n"
                f"【n】500 (비확률), 외삽 한계 명시\n"
                f"【로그】user_id 해시, 노출·클릭·완료 시각",
                "비확률 표본도 모집단·할당·한계를 밝히면 온라인 조사 태스크와 맞습니다.",
            ),
            (
                f"【연구】{topic}\n【모집단】종업원 50–200명 제조 SME 재직자\n"
                f"【표집틀】협회 회원사 140社 명단, 업종(금속/전자) 층화\n"
                f"【체계적】k=3, 시작번호 무작위 2 → n=280\n"
                f"【검증】표본 vs 협회 전체 규모·지역 χ² p=.41 (대표성 메모)",
                "체계적표집은 k와 시작점을 적어야 재현 가능합니다.",
            ),
        ]
        b, r = bodies[idx % len(bodies)]
        return b, r

    if kind == "main_survey" or (process_key == "collect" and re.search(r"본조사|응답", tl, re.I)):
        b = (
            f"【조사명】{title}\n【모드】온라인(Google Forms) + 문자 리마인더 2회\n"
            f"【기간】2025-04-07~04-14 (7일)\n【초대】1,240명 / 【완료】412명 (33.2%)\n"
            f"【결측】소득 11건, 소요시간<120초 18건 제외 → 분석 n=389\n"
            f"【변수】ID, Q1–Q28, 성별, 연령, 거주구, 소요초\n"
            f"【품질】중복 IP 3건 삭제, attention check 2문항"
        )
        return b, "본조사 태스크는 초대·응답·제외 규칙과 변수 목록을 한 표처럼 적는 것이 핵심입니다."

    if kind in ("open_coding", "qual_coding", "coding_generic") or (process_key == "coding" and "개방" in tl):
        bank = [
            (
                f"【출처】{title} · 면담 T07 (2025-03-12, 52분)\n"
                f"【원문·줄번호】L34–L38\n"
                f"  \"화면 공유 버튼이 안 보여서 … 아이들이랑 … 그냥 PPT만 돌렸어요.\"\n"
                f"【in-vivo 코드】화면공유_실패\n"
                f"【1차 범주】기술적 장벽(Technical Barrier)\n"
                f"【메모】'그냥'은 차선책 → Axial: 조건(원격)·행위(대체수업)·결과(상호작용 감소)\n"
                f"【코더】A,B 독립 → 불일치 1건 합의 → κ=.84",
                "개방코딩은 실제 발화 한 덩어리·줄번호·코드·왜 그 코드인지 메모까지 한 세트로 보여 줍니다.",
            ),
            (
                f"【출처】{title} · T03 L12–L15\n"
                f"  \"연수는 많은데 … 우리 학교 상황이랑 … 맞는 예시가 없었어요.\"\n"
                f"【코드】연수-현장_불일치\n"
                f"【범주】제도-현장 간극(Policy-Practice Gap)\n"
                f"【비교】T11 유사 발화 2건 → constant comparison\n"
                f"【다음】Axial: 중재조건 '학년부장 지원' 연결 검토",
                "QL-008·질적 코딩 태스크는 비슷한 발화끼리 묶는 과정을 적어야 합니다.",
            ),
            (
                f"【출처】{title} · 현장노트 FN-2025-03-08\n"
                f"  \"키보드 소리만 길게 … 침묵 4.2초 … '네, 알겠습니다'\"\n"
                f"【코드】침묵_수용\n"
                f"【범주】적응적 순응\n"
                f"【화용】Jefferson (4.2) 표기 유지\n"
                f"【감사】코드 정의를 코드북 v0.4에 반영",
                "현장·면담 혼합 시 노트와 전사를 같은 코드북으로 연결하는 예시입니다.",
            ),
            (
                f"【출처】{title} · T15 L67–L71\n"
                f"  \"아이들이 먼저 … '선생님, 링크요' … 그때부터는 … 제가 따라가기만 …\"\n"
                f"【코드】역할_역전\n"
                f"【범주】교사-학생 역할 재협상\n"
                f"【선택코딩 후보】'따라가기' 반복 7/22명 → 핵심범주 검토",
                "반복되는 표현(in-vivo)을 세어 핵심범주로 올리는 과정을 보여 줍니다.",
            ),
            (
                f"【출처】{title} · T02 L21–L24\n"
                f"  \"학부모 문자가 … 부담 … 그래서 … 녹화본만 올렸어요.\"\n"
                f"【코드】학부모_압력\n"
                f"【범주】외부 이해관계자\n"
                f"【삼각】공문 2건·동료 T05와 교차 확인",
                "코딩만이 아니라 문서로 교차 확인한 흔적을 남깁니다.",
            ),
        ]
        b, r = bank[idx % len(bank)]
        return b.replace("{title}", title), r

    if process_key == "stats" or kind in ("descriptive", "inferential", "meta_stats", "assumptions", "effect_size"):
        stats_bank = [
            (
                f"【분석】{title} · 기술통계\n"
                f"N=389, 직무만족 M=3.62, SD=0.71, 왜도=−0.18, 첨도=0.04\n"
                f"성별: 남 203(52.2%), 여 186(47.8%)\n"
                f"Cronbach α=.89 (8문항)\n"
                f"【표】Table 1. Sample characteristics (APA)",
                "기술통계 태스크는 N·평균·SD·빈도를 실제 숫자로 채운 표 형식이어야 합니다.",
            ),
            (
                f"【가설】H1: 실험>대조 (직무만족)\n"
                f"Levene p=.31 → t(387)=2.91, p=.004, Cohen d=0.37\n"
                f"실험 M=3.78 (SD=.68), 대조 M=3.51 (SD=.74)\n"
                f"【보고】95% CI diff [0.09, 0.45]",
                "t검정·ANOVA 태스크는 가정검정→검정통계량→효과크기 순으로 적습니다.",
            ),
            (
                f"【모형】OLS: 만족 ~ 스트레스 + 지원 + 성별\n"
                f"F(3,385)=42.1, p<.001, R²adj=.234\n"
                f"β(스트레스)=−.31, SE=.06, p<.001; VIFmax=1.8\n"
                f"【잔차】Durbin-Watson=1.97",
                "회귀 예시는 계수표·모형적합·다중공선성을 함께 제시합니다.",
            ),
            (
                f"【SEM】CFA 3요인, n=389\n"
                f"χ²/df=1.82, CFI=.962, TLI=.951, RMSEA=.046 [.038–.054], SRMR=.038\n"
                f"적재량 .62–.84\n"
                f"【경로】조직지지 → 몰입 β=.42*** → 이직의도 β=−.28***",
                "SEM/요인 태스크는 적합도 지수와 경로를 구분해 적습니다.",
            ),
            (
                f"【메타】k=18 RCT, random effects\n"
                f"Pooled SMD=0.41, 95% CI [0.28, 0.54], I²=42%, τ²=.04\n"
                f"Egger p=.18, funnel 대칭\n"
                f"【민감】고위험 편향 3편 제외 후 SMD=0.38",
                "메타분석은 효과크기·이질성·편향 점검을 한 블록으로 씁니다.",
            ),
        ]
        b, r = stats_bank[idx % len(stats_bank)]
        return b, r

    if process_key in ("result", "deliverable") or kind in ("result_viz", "deliverable", "hypothesis_decide"):
        b = (
            f"【연구질문】{topic} — {tl}\n"
            f"【핵심결과】지원↑ → 만족↑ (β=.34, p<.001), d=0.37\n"
            f"【표】Table 3. Regression coefficients\n"
            f"【그래프】집단별 막대+95% CI 오차막대 (Comparison)\n"
            f"【해석】{dom} 맥락에서 … 실무적으로는 …\n"
            f"【한계】단면·자기보고, 인과 해석 자제\n"
            f"【산출】Word §4.2 + figure3.png"
        )
        return b, "결과 태스크는 표·그래프·해석·한계·파일명까지 한 번에 정리하는 형식입니다."

    if process_key == "collect":
        b = (
            f"【사례】{title}\n【태스크】{tl}\n"
            f"【1일차】gatekeeper(센터장) 서면 동의, 현장 규칙 3개 합의\n"
            f"【2–8주차】주 3회 4시간 참관, FN 매일 2페이지(기술+분석 분리)\n"
            f"【면담】KI 4명 × 40분, 녹음·전사·동의\n"
            f"【산출】사진 120장(메타태그), 오디오 18시간, 동의서 스캔\n"
            f"【윤리】현장명 가명 'C공간'"
        )
        return b, f"자료수집 태스크「{tl[:40]}」에 맞게 일정·도구·산출물·윤리를 구체적으로 적었습니다."

    if process_key == "preprocess":
        b = (
            f"【사례】{title}\n【원본】raw/20250312_T07.wav (SHA256 기록)\n"
            f"【전사】Jefferson: (0.8) … (.) 침묵, [ ] 겹침\n"
            f"【익명】학교명→S중, 지명→G구\n"
            f"【QC】10% 재청취 오류율 1.2%\n"
            f"【산출】transcripts/T07_v2.docx → NVivo import\n"
            f"【로그】결측 발화 2건 [inaudible] 표기"
        )
        return b, "전처리는 원본 보존·전사 규칙·품질검사·파일명을 로그처럼 남깁니다."

    if process_key == "coding" and kind not in ("open_coding",):
        b = (
            f"【코드북】{title} · v0.6\n"
            f"코드: C14_디지털_피로\n"
            f"정의: 디지털 도구 사용과 감정적 소진을 동시에 언급\n"
            f"포함: '지친다'+'화면/플랫폼' 공존\n"
            f"제외: 단순 '바쁘다'만 있는 경우\n"
            f"예: T07 L34–L38\n"
            f"κ(A,B)=.86 (n=120 segment)"
        )
        return b, "코드북 태스크는 정의·포함/제외·예시 인용·신뢰도를 한 카드에 모읍니다."

    # default rich block
    b = (
        f"【사례】{title}\n【아키타입】{dom} · {topic}\n【태스크】{tl}\n\n"
        f"【입력】1차 자료(면담·문서·관찰) + 전 단계 산출물\n"
        f"【실행】체크리스트 §{idx+1}: (1)목표 확인 (2)절차 기록 (3)품질검증\n"
        f"【산출】다음 단계({PROCESS_KO.get(process_key, process_key)})용 파일·표\n"
        f"【점검】감사기록 2025-03-14, 동료 1명 교차확인"
    )
    return b, f"「{tl[:50]}」을 단계별 입·출력과 점검 기록으로 쪼개 보여 줍니다."


def generate_task_gallery(
    bundle_id: int,
    process_key: str,
    kind: str,
    task_label: str,
    excel_sample: str = "",
) -> list[dict]:
    dom_ko, _dom_en, topic = ARCHETYPE_DOMAIN.get(bundle_id, ARCHETYPE_DOMAIN[31])
    task = clean_task(task_label)
    seed = f"{bundle_id}|{process_key}|{kind}|{task}"
    titles = case_titles(bundle_id, topic, dom_ko, seed)
    items: list[dict] = []

    if excel_sample and excel_sample.strip() and not excel_sample.strip().startswith("입력:"):
        if not any(x in excel_sample for x in BANNED_FRAGMENTS):
            items.append({
                "id": "ex0",
                "title": "정밀가이드 원본 샘플(Guide Sample)",
                "body": excel_sample.strip(),
                "relevance": relevance(task, "정밀가이드", "엑셀 정밀 실행 가이드에 실제로 쓰인 형식"),
                "source": "excel",
            })

    for i, title in enumerate(titles[: (4 if items else 5) ]):
        if any(x in title for x in BANNED_FRAGMENTS):
            title = f"{topic} — 실행 기록 {i+1}"
        body, because = _ex(kind, process_key, bundle_id, topic, dom_ko, task, title, i)
        items.append({
            "id": f"ex{i+1}",
            "title": title,
            "body": body,
            "relevance": relevance(task, title, because),
            "source": "engine",
        })

    return items[:5]
