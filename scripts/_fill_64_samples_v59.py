# -*- coding: utf-8 -*-
"""
Fill empty samples.json entries for 64 methods (scaffold fill).
Only touches entries; preserves domain/method top-level fields.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public" / "methods"

METHODS = [
    "IBM_QT-001활용",
    "GN-029",
    "QT-029",
    "GN-001",
    "구성주의QL-008",
    "HC-001수행_실무지침",
    "GN-003",
    "QL-008발전_2세대재방문",
    "GN-004",
    "TX-002",
    "TX-002가이드북",
    "GN-005",
    "QT-007법",
    "GN-007",
    "EV-007하기",
    "GN-008",
    "GN-009",
    "QL-054",
    "GN-010",
    "GN-011",
    "QT-030",
    "SV-003",
    "QT-031",
    "GN-012",
    "QL-055",
    "GN-013",
    "QT-032",
    "QT-033",
    "GN-014",
    "EM-002",
    "QT-034",
    "응용QT-006",
    "QT-042",
    "GN-015",
    "GN-016",
    "QT-036",
    "QL-056",
    "GN-017",
    "GN-018",
    "QT-037",
    "GN-019",
    "GN-020",
    "QL-057",
    "QT-038",
    "QT-039",
    "GN-021",
    "질문하기_QT-030",
    "질적연구기초_QL-008",
    "QL-059",
    "QL-060",
    "QL-061",
    "QL-062",
    "GN-022",
    "통합연구_EV-007안내",
    "QT-025과통계적패턴인식",
    "EM-004",
    "GN-023",
    "QL-063",
    "QL-046_Q기법",
    "QL-046플래너",
    "QL-046핸드북",
    "GN-027",
    "GN-028",
    "QT-041",
]

NOTE = "※ 실제 논문·기관 서식이 아니라, 초보자가 '무엇을 써야 하는지'만 익히는 연습용 샘플입니다."


def classify(name: str) -> str:
    n = name.lower()
    if any(k in name for k in ["SPSS", "통계", "계량", "회귀", "다변량", "판별", "예측", "종단", "패널", "역학", "의학연구", "소득동학", "QT-033", "다차원"]):
        return "stats"
    if any(k in name for k in ["설문", "조사", "우편", "사회조사", "질문하기"]):
        return "survey"
    if any(k in name for k in ["TX-002", "미디어", "텍스트", "담화", "대화분석", "실용텍스트"]):
        return "content"
    if any(k in name for k in ["QL-008", "코딩", "질적", "면담", "내러티브", "현상학", "해석현상", "구술", "전기", "교사생애", "민족지", "푸코", "규율", "이념"]):
        return "qual"
    if any(k in name for k in ["Q방법", "QL-046_Q", "분석계층"]):
        return "qmethod"
    if any(k in name for k in ["문헌", "메타", "합성", "논문읽는", "통합연구", "기록의문제", "역사", "지적역사", "작은과학", "GN-028", "평가_"]):
        return "review"
    if any(k in name for k in ["실험", "준실험"]):
        return "experiment"
    if any(k in name for k in ["인공사회"]):
        return "sim"
    return "general"


def table_for(kind: str, method: str, task_name: str, domain: str, idx: int):
    """Return (title, columns, rows, caption) tailored to method family."""
    if kind == "stats":
        tables = [
            ("변수 코딩표", ["변수명", "측정수준", "값 레이블", "예시값"],
             [["sat", "등간(1-5)", "1=전혀아님~5=매우동의", "4"],
              ["group", "명목", "1=실험,2=통제", "1"],
              ["age", "비율", "만 나이(세)", "22"]],
             "가상 N 소표본 코딩 예시"),
            ("기술통계표", ["변수", "N", "평균", "SD", "최소", "최대"],
             [["만족도", "6", "3.83", "0.75", "3", "5"],
              ["학습시간", "6", "4.2", "1.1", "2", "6"]],
             "연습용 기술통계"),
            ("검정 결과표", ["검정", "통계량", "df", "p", "해석"],
             [["독립표본 t", "t=2.41", "10", "0.037", "유의(α=.05)"],
              ["Levene", "F=0.82", "1,10", "0.386", "등분산 가정 유지"]],
             "가상 결과 — 패키지 출력 대체용"),
            ("회귀계수표", ["항", "B", "SE", "β", "p"],
             [["(상수)", "1.24", "0.55", "—", "0.048"],
              ["학습시간", "0.42", "0.15", "0.51", "0.021"],
              ["동기", "0.31", "0.14", "0.38", "0.056"]],
             "가상 다중회귀"),
        ]
    elif kind == "survey":
        tables = [
            ("설문 문항표", ["문항번호", "구성개념", "문항문구", "척도"],
             [["Q1", "학습만족", "이번 수업 내용에 전반적으로 만족한다", "1-5 평정척도(등간형)"],
              ["Q2", "학습동기", "스스로 더 공부하고 싶다", "1-5 평정척도(등간형)"],
              ["Q3", "참여", "토론에 적극 참여했다", "1-5 평정척도(등간형)"]],
             "가상 설문 초안"),
            ("문항-구성개념 매핑", ["구성개념", "문항", "역채점"],
             [["학습만족", "Q1,Q4,Q7", "없음"],
              ["학습동기", "Q2,Q5,Q8", "Q8"],
              ["참여", "Q3,Q6", "없음"]],
             "예비조사 전 점검용"),
            ("응답 분포표", ["문항", "1", "2", "3", "4", "5", "평균"],
             [["Q1", "0", "1", "2", "2", "1", "3.5"],
              ["Q2", "0", "0", "1", "3", "2", "4.2"]],
             "가상 N=6"),
        ]
    elif kind == "content":
        tables = [
            ("코드북 초안", ["코드", "정의", "예시 발췌", "규칙"],
             [["동기부여", "학습 의지·동기 표현", "\"다시 해보고 싶다\"", "감정 표현 포함"],
              ["장벽", "방해 요인", "\"시간이 부족\"", "외적 제약만"],
              ["성과인식", "결과·효과 평가", "\"점수가 올랐다\"", "자기평가 포함"]],
             "가상 텍스트 코딩"),
            ("단위-코드 매핑표", ["단위ID", "원문 발췌", "코드", "메모"],
             [["U01", "수업이 끝난 뒤에도 자료를 다시 봤다", "동기부여", "행동 증거"],
              ["U02", "과제가 겹쳐 집중이 어려웠다", "장벽", "상황 맥락"]],
             "연습용 코딩표"),
            ("빈도 요약", ["코드", "빈도", "비율", "대표 인용"],
             [["동기부여", "12", "40%", "다시 해보고 싶다"],
              ["장벽", "9", "30%", "시간이 부족"],
              ["성과인식", "9", "30%", "점수가 올랐다"]],
             "가상 집계"),
        ]
    elif kind == "qual":
        tables = [
            ("인터뷰 발췌·코드표", ["참여자", "발췌", "개방코드", "메모"],
             [["P1", "처음엔 막막했는데 동료 피드백이 전환점이었다", "전환점", "관계 자원"],
              ["P2", "실패를 숨기다가 일기에 적으면서 정리됐다", "성찰기록", "기록 실천"]],
             "가상 면담 발췌"),
            ("주제 범주표", ["상위주제", "하위코드", "근거 발췌 수", "한줄 정의"],
             [["성장서사", "전환점,성찰기록", "7", "실패→의미화 과정"],
              ["관계자원", "동료피드백,멘토", "5", "타자와의 상호작용"]],
             "주제 묶기 연습"),
            ("이론 메모", ["메모유형", "내용", "연결 코드"],
             [["과정메모", "장벽 인식 후 기록 행위가 증가", "장벽→성찰기록"],
              ["이론메모", "관계 자원이 전환점을 촉진", "동료피드백"]],
             "QL-008식 메모"),
        ]
    elif kind == "qmethod":
        tables = [
            ("Q표본 진술문", ["번호", "진술문", "출처"],
             [["S01", "온라인 수업은 자기주도성이 핵심이다", "문헌+면담"],
              ["S02", "동료 토론이 이해도를 높인다", "면담"],
              ["S03", "평가 기준이 모호하면 불안하다", "문헌"]],
             "가상 Q표본"),
            ("P표본·정렬 요약", ["참여자", "요인부하(가상)", "해석 단서"],
             [["P1", "0.72 (F1)", "자기주도 강조"],
              ["P2", "0.68 (F2)", "관계·토론 강조"],
              ["P3", "-0.41 (F1)", "평가 불안"]],
             "연습용 정렬 결과"),
        ]
    elif kind == "review":
        tables = [
            ("문헌 선정표", ["ID", "저자·연도", "설계", "포함여부", "이유"],
             [["L01", "Kim 2021", "설문", "포함", "구성개념 일치"],
              ["L02", "Lee 2019", "실험", "제외", "모집단 불일치"],
              ["L03", "Park 2022", "질적", "포함", "과정 서술 풍부"]],
             "PRISMA식 연습"),
            ("추출 코딩표", ["문헌", "표본", "핵심결과", "비고"],
             [["Kim 2021", "N=120", "동기→만족 β=.41", "온라인"],
              ["Park 2022", "N=12", "동료피드백이 전환점", "면담"]],
             "데이터 추출 연습"),
            ("효과크기 요약", ["비교", "k", "ES(가상)", "95%CI"],
             [["동기→성과", "8", "0.32", "0.18–0.46"],
              ["피드백→만족", "5", "0.27", "0.09–0.45"]],
             "가상 메타분석"),
        ]
    elif kind == "experiment":
        tables = [
            ("설계 요약표", ["요소", "내용"],
             [["설계", "사전사후 · 통제집단"],
              ["독립변수", "피드백 유형(즉시/지연)"],
              ["종속변수", "과제점수, 자기효능"],
              ["위협요인", "선택·성숙·검사"]],
             "준실험 설계 메모"),
            ("조건별 결과", ["조건", "n", "사전", "사후", "변화"],
             [["즉시피드백", "15", "62.1", "74.3", "+12.2"],
              ["지연피드백", "15", "61.8", "68.0", "+6.2"]],
             "가상 결과"),
        ]
    elif kind == "sim":
        tables = [
            ("에이전트 규칙표", ["규칙", "조건", "행동"],
             [["R1", "이웃 만족>0.6", "협력 선택"],
              ["R2", "자원<임계", "탐색 이동"]],
             "가상 시뮬레이션"),
            ("런 결과 요약", ["런", "협력비율", "평균효용"],
             [["run01", "0.58", "0.71"],
              ["run02", "0.63", "0.74"]],
             "연습용 출력"),
        ]
    else:
        tables = [
            ("작업 체크표", ["항목", "상태", "메모"],
             [["목적 문장", "완료", domain[:40]],
              ["자료 목록", "진행", task_name[:40]],
              ["다음 산출물", "대기", "초안 확정 후"]],
             "일반 연구 절차"),
            ("핵심 메모표", ["구분", "내용"],
             [["관찰", f"{method} 맥락에서 {task_name} 수행"],
              ["해석", "연습용 가상 결론"],
              ["다음", "후속 task로 전달"]],
             "워크벤치 메모"),
        ]
    title, cols, rows, cap = tables[idx % len(tables)]
    return title, cols, rows, cap


def concrete_memo(kind: str, method: str, task_name: str, domain: str, idx: int) -> str:
    samples = {
        "stats": [
            f"가상 데이터({domain})에서 변수 코딩을 마쳤고, 측정수준·결측 규칙을 메모에 고정했다.",
            f"{task_name} 결과: 집단 평균 차이가 t=2.41, p=.037로 유의(연습값). 등분산 가정은 유지.",
            f"회귀 초안 R²≈0.41. 학습시간 계수 +0.42(p=.021). 다중공선성 VIF<2로 가정.",
        ],
        "survey": [
            f"문항 초안 12개를 구성개념 3개에 매핑. 역채점 1문항 표시. 예비조사 N=6 가정.",
            f"응답 척도 1–5, 중간점 허용. 스킵 로직은 인구통계 뒤로 배치.",
            f"인지면담에서 ‘만족’ 해석이 갈려 Q1 문구를 ‘전반적 만족’으로 구체화.",
        ],
        "content": [
            f"기사/게시 텍스트 20단위를 코딩. ‘동기부여’ 12, ‘장벽’ 9회로 집계(가상).",
            f"코드 정의를 한 줄로 고정하고 경계 사례 2건을 규칙에 추가.",
            f"상호코더 일치 κ≈0.78(연습값). 불일치 구간은 합의 코딩으로 정리.",
        ],
        "qual": [
            f"참여자 P1 발췌에서 ‘전환점=동료 피드백’ 개방코드 부여. 과정메모 1건 작성.",
            f"주제 ‘성장서사’ 아래 하위코드 3개를 묶고, 반증 사례 1건을 별도 메모.",
            f"이론메모: 관계 자원이 장벽 인식 이후 성찰 기록을 촉진한다는 가설적 연결.",
        ],
        "qmethod": [
            f"Q표본 진술 36개 확정. P표본 정렬에서 F1(자기주도)·F2(관계) 해석 초안.",
            f"강제분포(+4~-4) 기준으로 극단 진술 차이를 요인별로 대조.",
            f"요인배열 해석문에 대표 진술 S01·S03을 인용(가상).",
        ],
        "review": [
            f"검색식 확정 후 1차 120건→포함 18건(가상). 제외 사유를 표에 기입.",
            f"추출 항목: 설계·표본·측정도구·핵심결과. 이질성 메모를 별도 칸에 기록.",
            f"효과크기 통합 ES=0.32(k=8, 가상). 민감도: 아웃라이어 1건 제거 시 0.29.",
        ],
        "experiment": [
            f"독립변수=피드백 유형, 종속=과제점수. 내적타당도 위협(선택·성숙) 체크 완료.",
            f"사전 동등성 확인 후 사후 평균차 +6.0(가상). 처치충실도 체크리스트 사용.",
            f"제한점: 무선배정 불가 → 공변량(사전점수) 통제 계획을 명시.",
        ],
        "sim": [
            f"에이전트 규칙 R1·R2로 200틱 시뮬레이션. 협력비율 0.58→0.63(가상).",
            f"초기조건 시드 3종을 비교해 결과 안정성을 표로 정리.",
        ],
        "general": [
            f"{method} 절차에서 ‘{task_name}’ 산출물 초안을 작성하고 근거 메모를 남겼다.",
            f"연습 주제({domain})에 맞춰 표·체크리스트를 채웠다. 다음 task 입력으로 전달.",
        ],
    }
    arr = samples.get(kind, samples["general"])
    return arr[idx % len(arr)]


def sample_key(entry_id: str, task_no: str, perf_no) -> str:
    """Build samples.json key from perf-registry 산출물 id."""
    eid = entry_id or ""
    if ":산출물:" in eid:
        suffix = eid.split(":산출물:", 1)[1]
    elif eid.startswith("t") and "-" in eid:
        # e.g. t3-b
        suffix = eid
    else:
        suffix = eid.lstrip(":")
        if suffix.startswith("산출물:"):
            suffix = suffix.split(":", 1)[1]

    m = re.match(r"^(\d+(?:\.\d+)?-\d+)(?:-[a-zA-Z])?$", suffix)
    if m:
        prefix = m.group(1)
    else:
        # fallback: taskNo-perfNo
        pn = str(perf_no)
        # if perfNo already like 1.1, avoid duplicating taskNo
        if pn == str(task_no) or str(task_no).startswith(pn + ".") or pn.startswith(str(task_no)):
            prefix = f"{task_no}-{pn}" if pn != str(task_no) else f"{task_no}-1"
            # for id :산출물:1.1-a → prefer 1.1-a style prefix stripped of letter?
            m2 = re.match(r"^(\d+(?:\.\d+)?)(?:-([a-zA-Z]))?$", suffix)
            if m2 and m2.group(2):
                prefix = f"{m2.group(1)}-{m2.group(2)}"  # 1.1-a
            elif re.match(r"^\d", suffix):
                prefix = suffix
        else:
            prefix = f"{task_no}-{pn}"
        # normalize weird t3-b
        if suffix.startswith("t") and "-" in suffix:
            prefix = f"{task_no}-{suffix}"

    return f"{prefix}:산출물:{suffix}", (f":산출물:{suffix}" if not eid.startswith(":산출물:") and not eid.startswith("t") else eid)


def collect_outputs(pr: list):
    """Return list of output meta in order, plus flat task list for next-task links."""
    tasks_flat = []
    for stage in pr:
        for task in stage.get("tasks", []):
            tasks_flat.append(
                {
                    "stageNo": stage.get("stageNo"),
                    "stageTitle": stage.get("title") or stage.get("fullName") or "",
                    "taskNo": task.get("taskNo"),
                    "taskName": task.get("nameKo") or task.get("name") or "",
                }
            )

    outs = []
    for stage in pr:
        stage_title = stage.get("title") or stage.get("fullName") or ""
        for task in stage.get("tasks", []):
            task_no = task.get("taskNo")
            task_name = task.get("nameKo") or task.get("name") or ""
            for item in task.get("items", []):
                perf_no = item.get("perfNo")
                for e in item.get("entries", []):
                    if e.get("kind") != "산출물":
                        continue
                    outs.append(
                        {
                            "stageTitle": stage_title,
                            "taskNo": task_no,
                            "taskName": task_name,
                            "perfNo": perf_no,
                            "id": e.get("id") or "",
                            "content": e.get("content") or e.get("easyContent") or "",
                            "easyTitle": e.get("easyTitle") or "",
                        }
                    )
    return outs, tasks_flat


def next_task_label(tasks_flat, task_no: str) -> str:
    idxs = [i for i, t in enumerate(tasks_flat) if str(t["taskNo"]) == str(task_no)]
    if not idxs:
        return "다음 단계 산출물·메모"
    i = idxs[-1]
    if i + 1 < len(tasks_flat):
        nxt = tasks_flat[i + 1]
        return f"{nxt['taskNo']} {nxt['taskName']}"
    return "최종 정리·감사추적 파일"


def clean_title_name(task_name: str, easy_title: str) -> str:
    name = task_name.strip()
    # shorten bilingual noise
    name = re.sub(r"\s*\([^)]*\)\s*", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    if len(name) > 60:
        name = name[:57] + "…"
    if not name and easy_title:
        name = re.sub(r"^[📄]\s*산출물\s*·\s*", "", easy_title)
        name = re.sub(r"\s*\([^)]*\)\s*", " ", name).strip()[:60]
    return name or "산출물"


def build_entry(method_label: str, domain: str, kind: str, out: dict, next_label: str, idx: int):
    task_name = clean_title_name(out["taskName"], out.get("easyTitle") or "")
    stage = out["stageTitle"]
    # shorten stage
    stage_short = re.sub(r"\s*\([^)]*\)\s*", " ", stage)
    stage_short = re.sub(r"\s+", " ", stage_short).strip()[:40]

    eid = out["id"]
    key, norm_id = sample_key(eid, out["taskNo"], out["perfNo"])
    # Prefer original id if it already looks like :산출물:...
    if eid.startswith(":산출물:") or eid.startswith("t"):
        sample_id = eid if eid.startswith(":") or eid.startswith("t") else f":산출물:{eid}"
        if not eid.startswith(":산출물:") and ":산출물:" not in eid and eid.startswith("t"):
            sample_id = eid  # keep t3-b as-is? Prompt wants :산출물: form.
            # For t3-b style, store id as-is since that's what lookup uses
            sample_id = eid
    else:
        sample_id = norm_id if norm_id.startswith(":") else f":산출물:{norm_id}"

    # Fix: use exact registry id for lookup
    sample_id = eid

    tbl_title, cols, rows, cap = table_for(kind, method_label, task_name, domain, idx)
    memo = concrete_memo(kind, method_label, task_name, domain, idx)

    entry = {
        "id": sample_id,
        "title": f"산출물 서식 샘플 — {task_name}",
        "subtitle": f"{method_label} · {stage_short}",
        "meta": [
            {"label": "연구 예시 주제", "value": domain},
            {"label": "세부Task", "value": task_name},
            {"label": "용도", "value": "워크벤치 연습용(가상 데이터)"},
        ],
        "sections": [
            {"kind": "note", "note": NOTE},
            {
                "kind": "para",
                "title": "이 산출물 한 줄 요약",
                "para": f"【만들 결과물】{task_name}에 대응하는 표·메모·체크 산출물(연습용).",
            },
            {
                "kind": "form",
                "title": "작성란(예시)",
                "form": [
                    {"label": "연구 주제(연습)", "value": domain, "multiline": False},
                    {"label": "이번 Task에서 한 일", "value": task_name, "multiline": False},
                    {"label": "핵심 결론·메모", "value": memo, "multiline": True},
                    {"label": "다음 단계에 넘길 것", "value": next_label, "multiline": True},
                ],
            },
            {
                "kind": "table",
                "title": tbl_title,
                "table": {"columns": cols, "rows": rows, "caption": cap},
            },
            {
                "kind": "sig",
                "title": "확인",
                "para": "연구자: __________ · 날짜: ____-__-__",
            },
        ],
    }
    return key, entry


def fill_one(folder: str) -> tuple[int, str]:
    path = ROOT / folder
    sj = path / "samples.json"
    pr_path = path / "perf-registry.json"
    if not sj.exists() or not pr_path.exists():
        return 0, "missing files"

    samples = json.loads(sj.read_text(encoding="utf-8"))
    # only fill if empty
    if samples.get("entries") not in ({}, None):
        if isinstance(samples.get("entries"), dict) and len(samples["entries"]) > 0:
            return len(samples["entries"]), "already filled"

    pr = json.loads(pr_path.read_text(encoding="utf-8"))
    outs, tasks_flat = collect_outputs(pr)
    domain = samples.get("domain") or folder
    method_label = samples.get("method") or folder
    # prefer overview title if present
    ov = path / "overview.json"
    if ov.exists():
        try:
            o = json.loads(ov.read_text(encoding="utf-8"))
            method_label = o.get("title") or o.get("name") or o.get("label") or method_label
        except Exception:
            pass

    kind = classify(folder)
    entries = {}
    for i, out in enumerate(outs):
        next_label = next_task_label(tasks_flat, out["taskNo"])
        key, entry = build_entry(method_label, domain, kind, out, next_label, i)
        # ensure unique keys
        base = key
        n = 2
        while key in entries:
            key = f"{base}#{n}"
            n += 1
        entries[key] = entry

    # preserve top-level fields
    out_obj = {k: v for k, v in samples.items() if k != "entries"}
    out_obj["entries"] = entries
    sj.write_text(json.dumps(out_obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return len(entries), "filled"


def main():
    # re-verify empty targets
    targets = []
    for name in METHODS:
        sj = ROOT / name / "samples.json"
        if not sj.exists():
            print(f"MISSING {name}")
            continue
        d = json.loads(sj.read_text(encoding="utf-8"))
        if d.get("entries") == {} or d.get("entries") is None:
            targets.append(name)
        else:
            print(f"SKIP(non-empty) {name}: {len(d.get('entries') or {})}")

    print(f"targets empty: {len(targets)}")
    report = []
    for name in targets:
        n, status = fill_one(name)
        report.append((name, n, status))
        print(f"{status:14} {name}: {n}")

    # verify counts
    print("\n=== VERIFY ===")
    bad = 0
    for name, n, status in report:
        pr = json.loads((ROOT / name / "perf-registry.json").read_text(encoding="utf-8"))
        outs, _ = collect_outputs(pr)
        sj = json.loads((ROOT / name / "samples.json").read_text(encoding="utf-8"))
        en = len(sj.get("entries") or {})
        # unique-key collisions may change count — compare to outs len ideally
        ok = en == len(outs)
        if not ok:
            bad += 1
            print(f"MISMATCH {name}: entries={en} 산출물={len(outs)}")
        # json parse already done
        # domain preserved
    print(f"mismatches: {bad}/{len(report)}")
    print(f"total entries written: {sum(n for _, n, _ in report)}")


if __name__ == "__main__":
    main()
