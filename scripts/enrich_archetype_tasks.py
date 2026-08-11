# -*- coding: utf-8 -*-
"""Enrich archetype task JSON with concrete example galleries, form fields, and AI transform specs."""
from __future__ import annotations

import json
import re
from pathlib import Path

import openpyxl

DESK = Path(r"c:\Users\saran\OneDrive\Desktop")
BUNDLES = Path(__file__).resolve().parents[1] / "public" / "archetypes" / "bundles"


def clean(s: str) -> str:
    return re.sub(r"^\d+\)\s*", "", (s or "").strip())


def detect_kind(task: str) -> str:
    t = clean(task).lower()
    checks = [
        (r"모집단|표본설계|표집|sampling", "population_sampling"),
        (r"측정도구|설문|척도|예비조사|pilot|문항", "instrument_pilot"),
        (r"본조사|응답자료|수집하기|배포", "main_survey"),
        (r"결측|이상치|outlier|missing", "missing_outlier"),
        (r"역채점|척도점수", "reverse_score"),
        (r"신뢰도|타당도|cronbach|α", "reliability_validity"),
        (r"가변수|변수 코딩|더미|코딩\(가", "dummy_coding"),
        (r"범주코딩|개방형", "category_coding"),
        (r"기술통계|평균|표준편차|빈도", "descriptive"),
        (r"정규성|등분산|가정", "assumptions"),
        (r"t검정|anova|회귀|요인|sem|특화기법", "inferential"),
        (r"효과크기|유의성|p값", "effect_size"),
        (r"가설.*판정|유의성 판정", "hypothesis_decide"),
        (r"적합도|cfi|rmsea", "model_fit"),
        (r"결과표|그래프|해석", "result_viz"),
        (r"산출물|보고서", "deliverable"),
        (r"현장|참여관찰|라포|gatekeeper", "ethnography_collect"),
        (r"현장노트|전사|색인", "fieldnotes"),
        (r"기술적 코딩|패턴코딩|두꺼운|주제적·개념적 코딩|개념적 코딩", "qual_coding"),
        (r"사료|구술|문헌 수집|1차", "archive_collect"),
        (r"사료비평|연대기", "source_criticism"),
        (r"과정추적|인과기제|process tracing", "process_trace"),
        (r"크롤링|api|텍스트.*수집", "text_collect"),
        (r"토큰|불용어|임베딩|전처리", "text_preprocess"),
        (r"토픽|클러스터|라벨링", "text_model"),
        (r"문헌|스크리닝|pico|검색", "lit_search"),
        (r"선정|배제|추출|risk of bias", "lit_screen"),
        (r"메타|이질성|효과크기|통합효과", "meta_stats"),
        (r"델파이|ahp|평가기준|이해관계", "eval_collect"),
        (r"무작위|처치|통제|준실험", "causal_design"),
        (r"면담|인터뷰", "interview"),
        (r"개방코딩|open coding", "open_coding"),
        (r"축코딩|axial coding", "axial_coding"),
        (r"선택코딩|selective coding", "selective_coding"),
        (r"코더간|inter-coder|kappa", "intercoder"),
        (r"주제적|thematic|주제\(theme\)", "thematic"),
        (r"과정추적|process tracing", "process_trace"),
        (r"코딩", "coding_generic"),
    ]
    for pat, kind in checks:
        if re.search(pat, t, re.I):
            return kind
    return "generic"


FORM_SPECS: dict[str, list[dict]] = {
    "population_sampling": [
        {"key": "topic", "label": "연구주제(Research Topic)", "placeholder": "예: 청년 주거 만족도"},
        {"key": "population", "label": "모집단(Population)", "placeholder": "예: 2025년 서울 거주 만 19~29세"},
        {"key": "frame", "label": "표집틀(Sampling Frame)", "placeholder": "예: 주민등록 청년 명부 / 대학 재학생 명단"},
        {"key": "method", "label": "표집방법(Sampling Method)", "placeholder": "예: 층화표집(자치구 비례)"},
        {"key": "n", "label": "목표표본수(Sample Size)", "placeholder": "예: 385"},
        {"key": "error", "label": "신뢰수준·허용오차(Confidence & Margin)", "placeholder": "예: 95%, ±5%"},
    ],
    "instrument_pilot": [
        {"key": "concept", "label": "측정개념(Construct)", "placeholder": "예: 직무만족"},
        {"key": "items", "label": "문항초안(Items)", "type": "textarea", "placeholder": "문항을 한 줄에 하나씩"},
        {"key": "scale", "label": "척도형식(Scale Format)", "placeholder": "예: 5점 평정척도(등간형)(1전혀아니다~5매우그렇다)"},
        {"key": "pilot_n", "label": "예비조사 인원(Pilot n)", "placeholder": "예: 40"},
        {"key": "note", "label": "수정메모(Revision Note)", "placeholder": "예: 3번 문항 문구 수정"},
    ],
    "main_survey": [
        {"key": "mode", "label": "조사방식(Survey Mode)", "placeholder": "예: 온라인(Google Forms)"},
        {"key": "period", "label": "조사기간(Field Period)", "placeholder": "예: 5일, 리마인더 2회"},
        {"key": "sent", "label": "발송수(Invited n)", "placeholder": "예: 1200"},
        {"key": "responded", "label": "응답수(Responded n)", "placeholder": "예: 412"},
        {"key": "structure", "label": "자료구조(Data Structure)", "type": "textarea", "placeholder": "1행=1응답자, 1열=1변수 예시"},
    ],
    "missing_outlier": [
        {"key": "issue", "label": "문제값(Issue)", "placeholder": "예: 나이=227, 소득 결측 3건"},
        {"key": "rule", "label": "처리규칙(Rule)", "placeholder": "예: |z|>3 또는 IQR 밖 → 검토"},
        {"key": "action", "label": "조치(Action)", "type": "textarea", "placeholder": "예: 227→결측 후 중앙값 대체"},
    ],
    "reverse_score": [
        {"key": "item", "label": "역문항(Reverse Item)", "placeholder": "예: 나는 자주 불안하다"},
        {"key": "raw", "label": "원점수(Raw Score)", "placeholder": "예: 2"},
        {"key": "formula", "label": "역채점식(Formula)", "placeholder": "예: 6 − 원점수 (5점 척도)"},
        {"key": "scale_score", "label": "척도점수(Scale Score)", "placeholder": "예: (4+5+4)/3 = 4.33"},
    ],
    "reliability_validity": [
        {"key": "scale_name", "label": "척도명(Scale Name)", "placeholder": "예: 직무만족"},
        {"key": "alpha", "label": "Cronbach α", "placeholder": "예: .86"},
        {"key": "validity", "label": "타당도 결과(Validity)", "type": "textarea", "placeholder": "예: 1요인, 적재량 .62~.81"},
    ],
    "dummy_coding": [
        {"key": "variable", "label": "변수(Variable)", "placeholder": "예: 지역"},
        {"key": "categories", "label": "범주(Categories)", "placeholder": "예: 수도권/영남/호남/기타"},
        {"key": "ref", "label": "기준범주(Reference)", "placeholder": "예: 수도권"},
        {"key": "dummies", "label": "더미정의(Dummy Coding)", "type": "textarea", "placeholder": "예: 영남=1 그외=0"},
    ],
    "descriptive": [
        {"key": "var", "label": "변수(Variable)", "placeholder": "예: 직무만족"},
        {"key": "stats", "label": "기술통계(Descriptives)", "type": "textarea", "placeholder": "평균, SD, 범위, 빈도"},
    ],
    "assumptions": [
        {"key": "test", "label": "가정검정(Assumption Test)", "placeholder": "예: Shapiro / Levene"},
        {"key": "result", "label": "결과(Result)", "type": "textarea", "placeholder": "예: W=.99, p=.11 → 정규성 만족"},
    ],
    "inferential": [
        {"key": "hypothesis", "label": "가설(Hypothesis)", "placeholder": "예: 성별에 따라 직무만족 차이"},
        {"key": "method", "label": "분석기법(Technique)", "placeholder": "예: 독립표본 t검정"},
        {"key": "result", "label": "결과(Result)", "type": "textarea", "placeholder": "예: t(410)=2.34, p=.020"},
    ],
    "effect_size": [
        {"key": "stat", "label": "검정통계량(Test Statistic)", "placeholder": "예: t=2.34"},
        {"key": "es", "label": "효과크기(Effect Size)", "placeholder": "예: Cohen's d=0.23"},
        {"key": "ci", "label": "신뢰구간(CI)", "placeholder": "예: 95% CI [0.03, 0.35]"},
    ],
    "hypothesis_decide": [
        {"key": "h_list", "label": "가설목록(Hypotheses)", "type": "textarea", "placeholder": "H1… H2…"},
        {"key": "decision", "label": "판정(Decision)", "type": "textarea", "placeholder": "채택/기각과 p값"},
    ],
    "model_fit": [
        {"key": "indices", "label": "적합도지수(Fit Indices)", "type": "textarea", "placeholder": "CFI, TLI, RMSEA, SRMR"},
    ],
    "result_viz": [
        {"key": "table", "label": "결과표(Result Table)", "type": "textarea", "placeholder": "표 내용"},
        {"key": "interp", "label": "해석문(Interpretation)", "type": "textarea", "placeholder": "한두 문단 해석"},
    ],
    "deliverable": [
        {"key": "outline", "label": "산출물 목차(Deliverable Outline)", "type": "textarea", "placeholder": "①표본특성 → ②신뢰도 → …"},
    ],
    "interview": [
        {"key": "participant", "label": "참여자(Participant)", "placeholder": "예: 교사 3년차"},
        {"key": "guide", "label": "면담질문(Interview Guide)", "type": "textarea", "placeholder": "주요 질문 3~5개"},
        {"key": "note", "label": "핵심발화(Key Quote)", "type": "textarea", "placeholder": "인상적인 발화"},
    ],
    "qual_coding": [
        {"key": "excerpt", "label": "자료발췌(Excerpt)", "type": "textarea", "placeholder": "코딩할 문장"},
        {"key": "code", "label": "코드(Code)", "placeholder": "예: 불안"},
        {"key": "category", "label": "범주(Category)", "placeholder": "예: 초기적응"},
    ],
    "text_collect": [
        {"key": "source", "label": "출처(Source)", "placeholder": "예: 뉴스 API / 커뮤니티"},
        {"key": "query", "label": "검색식(Query)", "placeholder": "예: 키워드+기간"},
        {"key": "n", "label": "수집량(Volume)", "placeholder": "예: 12,000건"},
    ],
    "lit_search": [
        {"key": "pico", "label": "연구질문(PICO)", "type": "textarea", "placeholder": "P/I/C/O"},
        {"key": "databases", "label": "DB(Databases)", "placeholder": "예: PubMed, RISS"},
        {"key": "hits", "label": "검색건수(Hits)", "placeholder": "예: 1,240"},
    ],
    "generic": [
        {"key": "context", "label": "연구·현장 맥락(Context)", "placeholder": "누구·어디·언제"},
        {"key": "input", "label": "입력자료(Input Materials)", "type": "textarea", "placeholder": "파일명·건수·출처"},
        {"key": "procedure", "label": "실행 절차(Procedure Steps)", "type": "textarea", "placeholder": "순서·도구·소요"},
        {"key": "output", "label": "산출물(Output)", "type": "textarea", "placeholder": "표·코드북·로그·파일"},
        {"key": "quality", "label": "품질·윤리 점검(Quality & Ethics)", "placeholder": "동의·익명·검증"},
    ],
}

# Fallbacks for kinds not listed above
PHD_CODING_FIELDS = [
    {"key": "codebook", "label": "코드북 조항(Codebook Entry)", "type": "textarea", "placeholder": "코드명·정의·포함/제외 기준"},
    {"key": "excerpt", "label": "자료발췌(Excerpt)", "type": "textarea"},
    {"key": "code", "label": "코드(Code)", "placeholder": "in-vivo / 개념코드"},
    {"key": "category", "label": "범주(Category)"},
    {"key": "memo", "label": "분석메모(Analytic Memo)", "type": "textarea"},
    {"key": "audit", "label": "감사기록(Audit Trail)", "placeholder": "일시·코더·합의"},
]
for k in ("open_coding", "axial_coding", "selective_coding", "intercoder", "thematic",
          "category_coding", "coding_generic", "qual_coding"):
    FORM_SPECS[k] = PHD_CODING_FIELDS

for k in ("ethnography_collect", "fieldnotes", "archive_collect", "source_criticism",
          "process_trace", "text_preprocess", "text_model", "lit_screen", "meta_stats", "eval_collect",
          "causal_design"):
    FORM_SPECS.setdefault(k, FORM_SPECS["generic"])

FORM_SPECS["population_sampling"] = [
    {"key": "rq", "label": "연구질문(Research Question)", "placeholder": "RQ: …"},
    {"key": "population", "label": "모집단(Population)", "placeholder": "조작적 정의"},
    {"key": "frame", "label": "표집틀(Sampling Frame)"},
    {"key": "method", "label": "표집방법(Sampling Method)"},
    {"key": "n", "label": "표본크기(Sample Size & Power)", "placeholder": "n=…, 95% CI, power"},
    {"key": "error", "label": "신뢰·오차(Confidence & Margin)"},
]
FORM_SPECS["result_viz"] = [
    {"key": "figure_type", "label": "그래프 유형(Chart Type)", "placeholder": "bar|line|scatter|hist|box"},
    {"key": "table", "label": "결과표(Result Table)", "type": "textarea"},
    {"key": "interp", "label": "해석(Interpretation)", "type": "textarea"},
    {"key": "limitation", "label": "한계(Limitation)", "type": "textarea"},
]


GALLERY_BANK: dict[str, list[dict]] = {
    "population_sampling": [
        {"title": "청년 주거 조사", "body": "모집단(Population)=2025년 서울 거주 만 19~29세\n표집(Sampling)=자치구 비례 층화\n신뢰 95%·오차 ±5% → n≈385\n강남구 6% → 약 23명"},
        {"title": "고등학생 학습동기", "body": "모집단=경기도 공립고 2학년\n표집틀=학교 명단\n층화=학교규모(대/중/소)\nn=450 (허용오차 ±4.5%)"},
        {"title": "병원 간호사 소진", "body": "모집단=수도권 종합병원 간호사\n표집=병동 단위 군집표집 후 단순무작위\nn=320"},
        {"title": "온라인 커뮤니티 이용자", "body": "모집단=특정 앱 활성 이용자(최근 30일)\n표집=비확률(편의)+할당(성별·연령)\nn=500"},
        {"title": "중소기업 재직자", "body": "모집단=종업원 50인 미만 제조업 재직자\n표집틀=협회 회원사 명부\n체계적표집(k=20) → n=280"},
    ],
    "instrument_pilot": [
        {"title": "직무만족 5점 척도", "body": "1. 업무에 보람을 느낀다\n2. 복지에 만족한다\n3. 이직 생각이 없다\n예비(n=40) α=.82 → 3번 문항 수정"},
        {"title": "학습몰입 척도", "body": "집중·호기심·지속 3요인 × 4문항\n7점 평정척도(등간형)\n예비(n=35) 문항-총점 <.30 2문항 삭제"},
        {"title": "고객충성도", "body": "재구매·추천의향·애착 각 3문항\n전문가 내용타당도 CVI=.89\n예비 α=.79"},
        {"title": "수면의 질", "body": "기존 검증척도 번역·역번역\n이중질문 금지 점검\n예비 소요시간 4분"},
        {"title": "조직신뢰", "body": "상사신뢰·조직신뢰 분리\n부정문항 1개만 유지\n예비 후 문구 명확화"},
    ],
    "main_survey": [
        {"title": "온라인 본조사", "body": "Google Forms, 5일, 리마인더 2회\n발송 1,200 → 응답 412(34%)\nID|Q1|Q2|Q3|성별|나이"},
        {"title": "대면 조사", "body": "캠퍼스 부스, 3일\n목표 200명, 실제 188명\n동의서·익명 번호 부여"},
        {"title": "전화 조사", "body": "CATI, 저녁 6–9시\n접촉 900, 완료 210(응답률 23%)"},
        {"title": "혼합모드", "body": "이메일 1차 + 문자 리마인더\n중복응답 토큰 차단\ntidy data로 저장"},
        {"title": "패널 조사", "body": "기존 패널 600명 중 재응답 480\n사전 고지·동의 확인"},
    ],
    "missing_outlier": [
        {"title": "나이 입력오류", "body": "227 → IQR 밖 → 결측 후 중앙값 29 대체"},
        {"title": "소득 결측", "body": "결측 3건(1.2%, 무작위) → 목록삭제"},
        {"title": "만족도 극단", "body": "전원 5점이나 개방형 ‘최악’ → 검토 후 유지+메모"},
        {"title": "중복 ID", "body": "같은 토큰 2회 → 최신 응답만 유지"},
        {"title": "범위 밖 코드", "body": "성별=3(정의 없음) → 결측 처리"},
    ],
    "descriptive": [
        {"title": "직무만족", "body": "n=412, M=3.71, SD=0.68, 범위 1.4~5.0"},
        {"title": "성별 빈도", "body": "남 210(51%), 여 202(49%)"},
        {"title": "전공별", "body": "인문 32%, 사회 28%, 자연 22%, 기타 18%"},
        {"title": "연령", "body": "M=24.1, SD=3.2, 왜도 0.4"},
        {"title": "이용시간", "body": "중앙값 45분, IQR 20–90"},
    ],
    "inferential": [
        {"title": "성별 t검정", "body": "남 M=3.80, 여 M=3.61, t(410)=2.34, p=.020"},
        {"title": "ANOVA", "body": "학년 3집단 F(2,409)=4.1, p=.017"},
        {"title": "상관", "body": "공부시간–성적 r=.42, p<.001"},
        {"title": "회귀", "body": "급여→만족 β=.34, p<.001, R²=.28"},
        {"title": "요인분석", "body": "EFA 2요인, 설명분산 58%"},
    ],
    "generic": [
        {"title": "예시 A", "body": "입력 → 절차 → 출력 한 세트를 문서화"},
        {"title": "예시 B", "body": "작은 표본으로 먼저 연습 후 본실행"},
        {"title": "예시 C", "body": "결정 이유를 감사기록(Audit Trail)에 남김"},
        {"title": "예시 D", "body": "동료 1명과 교차확인"},
        {"title": "예시 E", "body": "다음 단계로 넘길 산출물 형식 고정"},
    ],
}


def gallery_for(
    bundle_id: int,
    process_key: str,
    kind: str,
    task_label: str,
    excel_sample: str,
) -> list[dict]:
    from phd_task_examples import generate_phd_gallery

    phd = generate_phd_gallery(bundle_id, process_key, kind, task_label, excel_sample)
    # Bundle 1 survey kinds: blend Excel guide + rich bank when kind has dedicated bank
    if bundle_id == 1 and kind in GALLERY_BANK and kind != "generic":
        bank = GALLERY_BANK[kind]
        merged = []
        seen = set()
        for item in phd + [{"id": f"b{i}", "title": g["title"], "body": g["body"], "source": "bank"} for i, g in enumerate(bank)]:
            sig = item["body"][:60]
            if sig in seen:
                continue
            seen.add(sig)
            merged.append(item)
        return merged[:5]
    return phd


def load_excel_detail() -> dict[tuple[int, str], dict]:
    """Load ①–⑤ for all 31 bundle sheets (Desktop guide or public precise-guide-31bundles.xlsx)."""
    public_dir = BUNDLES.parent.parent  # public/
    from excel_precise_guide import load_all_bundle_details

    merged = load_all_bundle_details(public_dir)
    print(
        "excel detail entries",
        len(merged),
        "bundles",
        len({b for b, _ in merged}),
    )
    return merged


def enrich_task(
    task: dict,
    detailed: dict,
    bundle_id: int,
    process_key: str,
) -> dict:
    raw = task.get("taskRaw") or task.get("task") or ""
    kind = detect_kind(raw)
    key = re.sub(r"[^\w가-힣]+", "", clean(raw).lower())
    det = detailed.get((bundle_id, key))
    if not det:
        # legacy flat key (bundle 1 only)
        det = detailed.get((1, key)) if bundle_id == 1 else None

    # Prefer Excel detail when available
    if det:
        if det["why"]:
            task["why"] = det["why"]
        if det["how"]:
            task["how"] = det["how"]
        if det["protocol"]:
            task["protocol"] = det["protocol"]
        task["excelSample"] = det["sample"]
        task["sampleExplain"] = det["explain"]
    else:
        task["excelSample"] = task.get("excelSample") or (task.get("samples") or [{}])[-1].get("usable", "") if task.get("samples") else ""
        # Try pull from last open sample
        if not task.get("excelSample"):
            for s in task.get("samples") or []:
                if s.get("example"):
                    task["excelSample"] = s["example"]
                    break
            if not task.get("excelSample"):
                task["excelSample"] = task.get("protocol", "")[:400]

    task["taskKind"] = kind
    task["formFields"] = FORM_SPECS.get(kind, FORM_SPECS["generic"])
    task["exampleGallery"] = gallery_for(
        bundle_id,
        process_key,
        kind,
        raw,
        task.get("excelSample") or "",
    )
    task["aiTransform"] = {
        "title": f"AI 변환기 · {clean(raw)}",
        "kind": kind,
        "hint": (
            f"이 태스크({clean(raw)})의 예시 샘플 형식을 따라, "
            f"사용자가 기입한 항목으로 완성된 산출물 초안을 만드세요. "
            f"표·수치가 있으면 표로, 없으면 번호 목록으로 출력하세요."
        ),
        "outputLabel": "태스크 산출물 초안(Task Output Draft)",
    }
    # Keep quiz samples as optional practice but primary is gallery+form+AI
    return task


def main():
    detailed = load_excel_detail()
    print("excel detailed keys", len(detailed))
    for path in sorted(BUNDLES.glob("bundle-*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        bundle_id = int(data.get("id") or re.search(r"(\d+)", path.stem).group(1))
        stages = data.get("stages", [])
        for si, stage in enumerate(stages):
            pk = stage.get("processKey") or stage.get("id", "").split("-")[0]
            stage["prevStageId"] = stages[si - 1]["id"] if si > 0 else None
            stage["nextStageId"] = stages[si + 1]["id"] if si < len(stages) - 1 else None
            tasks = stage.get("tasks", [])
            for ti, task in enumerate(tasks):
                enrich_task(task, detailed, bundle_id, pk)
                task["prevTaskId"] = tasks[ti - 1]["id"] if ti > 0 else None
                task["nextTaskId"] = tasks[ti + 1]["id"] if ti < len(tasks) - 1 else None
                if si > 0 and ti == 0:
                    task["linkPrevStageTaskId"] = stages[si - 1]["tasks"][-1]["id"]
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print("enriched", path.name, "tasks", sum(len(s["tasks"]) for s in data["stages"]))
    print("done")


if __name__ == "__main__":
    main()
