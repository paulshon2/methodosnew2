# -*- coding: utf-8 -*-
"""Generate Text–Computational Linguistics DOCX: 13 methods × 5 topics × 15 tasks (publication-grade)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Inches, Pt

from text_comp_coding_examples import (
    coding_proc_label,
    coding_proc_lexicon,
    coding_proc_unsup,
    double_coding_rows,
    label_application_rows,
    label_codebook,
    lexicon_rule_rows,
    topic_model_rows,
)
from text_comp_docx_profiles import METHOD_PROFILES
from text_comp_figures import figures_for_analysis
from text_comp_task_notes import task_step_annotations

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "public" / "archetypes" / "bundles" / "bundle-04.json"
OUT_DIR = Path(r"C:\Users\saran\OneDrive\Desktop\making-M\텍스트·계산언어 아키타입-연구방법별 샘플_정교화")
ARCHETYPE = "텍스트·계산언어 아키타입(Text–Computational Linguistics Archetype)"

STAGES = [
    (
        "① 자료수집",
        "①대상 플랫폼/DB에서 텍스트·네트워크 데이터 수집(크롤링, API) →②수집 데이터의 메타정보(시간, 출처 등) 정리",
        [
            "1) 대상 플랫폼/DB에서 텍스트·네트워크 데이터 수집(크롤링, API)하기",
            "2) 수집 데이터의 메타정보(시간, 출처 등) 정리하기",
        ],
    ),
    (
        "② 전처리",
        "①토큰화·형태소분석 →②불용어 제거·정제(노이즈 필터링) →③임베딩(TF-IDF, word2vec 등) 또는 네트워크 그래프 구축",
        [
            "1) 토큰화·형태소분석하기",
            "2) 불용어 제거·정제(노이즈 필터링)하기",
            "3) 임베딩(TF-IDF, word2vec 등) 또는 네트워크 그래프 구축하기",
        ],
    ),
    (
        "③ 코딩",
        "①지도학습 시 사전 라벨링(수작업 태깅) 표본 구축 →②비지도학습 시 클러스터링/토픽모형으로 자동 범주 생성 →③사전기반(lexicon) 분류 규칙 적용",
        [
            "1) 지도학습 시 사전 라벨링(수작업 태깅) 표본 구축하기",
            "2) 비지도학습 시 클러스터링/토픽모형으로 자동 범주 생성하기",
            "3) 사전기반(lexicon) 분류 규칙 적용하기",
        ],
    ),
    (
        "④ 통계기법",
        "①빈도·TF-IDF 등 기술통계 산출 →②분류/회귀 모형 학습 및 하이퍼파라미터 튜닝 →③네트워크 중심성 지표 계산 →④모형 성능 평가(정확도, F1, AUC 등)",
        [
            "1) 빈도·TF-IDF 등 기술통계 산출하기",
            "2) 분류/회귀 모형 학습 및 하이퍼파라미터 튜닝하기",
            "3) 네트워크 중심성 지표(연결정도, 매개중심성 등) 계산하기",
            "4) 모형 성능 평가(정확도, F1-score, AUC 등)하기",
        ],
    ),
    (
        "⑤ 결과도출",
        "①모형 성능 및 주요 변수(특성중요도)를 바탕으로 패턴 해석 →②토픽/네트워크 구조를 시각화하여 제시",
        [
            "1) 모형 성능 및 주요 변수(특성중요도)를 바탕으로 패턴 해석하기",
            "2) 토픽/네트워크 구조를 시각화하여 제시하기",
        ],
    ),
    (
        "⑥ 최종 산출물",
        "텍스트/네트워크 분석결과 및 모형",
        ["▶ 산출물: 텍스트/네트워크 분석결과 및 모형"],
    ),
]


def _seed(*parts) -> int:
    return abs(hash(tuple(parts))) % 997


def add_table(doc: Document, headers: list[str], rows: list[list[str]]):
    tbl = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl.style = "Table Grid"
    for j, h in enumerate(headers):
        tbl.rows[0].cells[j].text = str(h)
    for i, row in enumerate(rows, 1):
        for j, val in enumerate(row):
            tbl.rows[i].cells[j].text = str(val)
    doc.add_paragraph()


def add_figure(doc: Document, path: Path, caption: str):
    p = doc.add_paragraph()
    run = p.add_run(caption)
    run.bold = True
    run.font.size = Pt(10)
    if path.exists():
        doc.add_picture(str(path), width=Inches(5.5))
    doc.add_paragraph()


def figures_for_task(si: int, ti: int, figs: list[tuple[str, Path]]) -> list[tuple[str, Path]]:
    if si == 3 and ti == 0:
        return [figs[0]] if figs else []
    if si == 3 and ti == 3:
        return figs[1:2] + (figs[2:] if len(figs) > 2 else [])
    if si == 4 and ti == 1:
        return figs
    if si == 5 and ti == 0:
        return figs
    if si == 3 and ti == 2 and len(figs) > 1:
        return [figs[1]]
    return []


def corpus_spec_table(topic: dict) -> list[list[str]]:
    return [
        ["항목", "내용"],
        ["출처·플랫폼", topic["source"]],
        ["기간", topic["period"]],
        ["분석 단위", topic["unit"]],
        ["목표 규모(대략)", str(topic["n_docs"])],
        ["초점", topic["focus"]],
        ["파이프라인", topic["pipeline"]],
        ["분석 키", topic["analysis_key"]],
        ["중심 주장", topic["hypothesis"]],
    ]


def task_content(si, ti, topic, method_name, method_en):
    s = _seed(method_name, topic["title"], si, ti)
    akey = topic["analysis_key"]
    n = int(topic["n_docs"]) if isinstance(topic["n_docs"], int) else 10000 + s
    n_clean = n - (400 + s % 200)

    if si == 0 and ti == 0:
        proc = [
            f"【수집 설계】주제 「{topic['title']}」. 출처={topic['source']}, 기간={topic['period']}, 단위={topic['unit']}.",
            f"【방법】API/크롤링/덤프. 목표 n≈{n}. 쿼리·필터·페이지크기를 config.yaml에 고정. 파이프라인 단서: {topic['pipeline']}.",
            f"【준수】이용약관·개인정보·rate limit·재식별 위험 체크. ({method_name}/{method_en})",
            "【로그】배치ID, 시작·종료시각, HTTP 오류, 재시도. raw/ 디렉터리에 원본 보존.",
        ]
        del_r = [
            ["필드", "타입", "예시", "비고"],
            ["doc_id", "string", "D000001", "고유키"],
            ["text", "string", "본문…", "원문"],
            ["created_at", "datetime", "2025-06-01T12:03:11", "타임존 명시"],
            ["source", "string", topic["source"][:20], "채널"],
            ["author_hash", "string", "a9f3…", "가명"],
            ["lang", "string", "ko", "언어감지"],
        ]
        return STAGES[0][2][0], proc, (["항목", "값"], [["n_target", str(n)], ["batch", f"B{s}"]]), ["raw corpus 스키마·수집로그"], del_r

    if si == 0 and ti == 1:
        proc = [
            "【메타 정리】시간·출처·언어·URL해시·수집배치·네트워크면 from/to 노드ID를 표준 컬럼으로 정렬.",
            f"【QC】중복 {120 + s % 80}건, 결측본문 {30 + s % 40}건, 봇후보 플래그 {50 + s % 30}건 표시.",
            "【데이터사전】data_dictionary.md에 컬럼 정의·허용값·결측코드 기록.",
        ]
        del_r = [
            ["컬럼", "설명", "QC규칙"],
            ["batch_id", "수집배치", "필수"],
            ["is_dup", "중복여부", "text hash"],
            ["is_bot", "봇후보", "활동패턴"],
            ["n_chars", "길이", f"min={20 + s % 10}"],
        ]
        return STAGES[0][2][1], proc, (["unique_n", str(n - 120)], [["flagged", str(80 + s % 40)]]), ["메타테이블·QC요약"], del_r

    if si == 1 and ti == 0:
        proc = [
            f"【토큰화】도구·사전 버전 고정. 한국어 형태소 또는 WordPiece. 단위={topic['unit']}.",
            "【정규화】숫자→#NUM, 반복ㅋ 축약, 대소문자(영문), 이모지 정책(유지/삭제) 문서화.",
            "【점검】무작위 20문서 토큰을 사람이 검수(과분할·미분할).",
        ]
        del_r = [["doc_id", "tokens(샘플)"], ["D1", "배송/NNG 늦/VA …"], ["D2", "환불/NNG 요청/NNG …"]]
        return STAGES[1][2][0], proc, (["tokenizer", topic["pipeline"].split("+")[0][:20]], [["version", "v1.2"]]), ["토큰 샘플"], del_r

    if si == 1 and ti == 1:
        rem = 8 + s % 12
        proc = [
            f"【불용어】기본 목록 + 도메인 화이트리스트(초점: {topic['focus']}).",
            f"【노이즈】HTML/URL/초단문/광고패턴 제거. 제거율≈{rem}%.",
            f"【잔여】문서≈{n_clean}. 전후 토큰수 보고.",
        ]
        del_r = [["규칙", "적용", "제거n"], ["min_tokens", "5", str(200 + s % 100)], ["html_strip", "Y", str(150 + s % 80)], ["url_spam", "Y", str(90 + s % 50)]]
        return STAGES[1][2][1], proc, (["removal_%", f"{rem}%"], [["n_clean", str(n_clean)]]), ["정제 로그"], del_r

    if si == 1 and ti == 2:
        if akey.startswith("sna"):
            proc = [
                "【그래프 구축】노드=계정/문서, 엣지=RT·멘션·공저·공출현. 방향·가중 정의.",
                "【필터】자기루프 제거, 가중 하위 1% 엣지 절단(선택).",
                f"【산출】graph.gexf / edgelist.parquet. nodes≈{800 + s}, edges≈{3000 + s * 2}.",
            ]
            del_r = [["지표", "값"], ["nodes", str(800 + s)], ["edges", str(3000 + s * 2)], ["density", f"{0.01 + (s % 20)/1000:.3f}"], ["components", str(3 + s % 5)]]
        else:
            proc = [
                "【벡터화】TF-IDF(1–2gram) 및/또는 임베딩(word2vec/BERT CLS).",
                f"【파라미터】min_df={2 + s % 3}, max_df=0.9, dim={100 + s % 200}, seed={s}.",
                "【산출】X.npz, embeddings.npy, vectorizer.pkl.",
            ]
            del_r = [["표현", "설정", "shape"], ["TF-IDF", "1–2gram", f"{n_clean}×{12000 + s}"], ["embedding", f"dim={100 + s % 200}", f"{n_clean}×dim"]]
        return STAGES[1][2][2], proc, (["artifact", "Y"], [["path", "features/"]]), ["벡터·그래프 요약"], del_r

    if si == 2 and ti == 0:
        proc = coding_proc_label(topic, method_name, s)
        cb = label_codebook(topic, s)
        del_r = label_application_rows(topic, akey)
        return STAGES[2][2][0], proc, (cb[0], cb[1:]), ["라벨 코드북 + 적용 예시"], del_r

    if si == 2 and ti == 1:
        proc = coding_proc_unsup(topic, s)
        del_r = topic_model_rows(s)
        return STAGES[2][2][1], proc, (["K", str(5 + s % 4)], [["seed", str(s)], ["coherence", f"{0.45 + (s % 20)/100:.2f}"]]), ["토픽·클러스터 해석표"], del_r

    if si == 2 and ti == 2:
        proc = coding_proc_lexicon(topic)
        del_r = lexicon_rule_rows()
        return STAGES[2][2][2], proc, (["lexicon", "v1"], [["neg_window", "2"]]), ["사전·규칙 표"], del_r

    if si == 3 and ti == 0:
        proc = [
            f"【기술통계】n_docs={n_clean}, 평균길이={80 + s % 60}토큰, vocab≈{12000 + s}.",
            "【상위용어】TF/DF/TF-IDF 표 + 그림 A.",
            f"【층화】출처·기간별 분포 점검(편향). 초점={topic['focus']}.",
        ]
        del_r = [
            ["term", "tfidf", "df", "rank"],
            ["배송", "0.21", "1204", "1"],
            ["환불", "0.17", "880", "2"],
            ["가격", "0.15", "1022", "3"],
            ["친절", "0.12", "650", "4"],
            ["포장", "0.11", "590", "5"],
        ]
        return STAGES[3][2][0], proc, (["n_docs", str(n_clean)], [["vocab", str(12000 + s)]]), ["기술통계·상위용어"], del_r

    if si == 3 and ti == 1:
        if akey.startswith("sna") and not any(x in akey for x in ("ml", "dl", "ir", "tml")):
            proc = [
                "【학습】SNA 본령이 중심성·커뮤니티면 분류기는 선택. 링크예측 시 로지스틱/임베딩 링크분류.",
                "【분할】엣지 마스크 80/10/10 또는 시간분할.",
                f"【튜닝】C/lr 등. seed={s}.",
            ]
            del_r = [["실험", "설정", "val"], ["linkpred", "LR+features", f"{0.70 + (s % 10)/100:.2f}"], ["null", "random", "0.50"]]
        else:
            f1 = 0.78 + (s % 12) / 100
            proc = [
                "【분할】train/val/test = 8:1:1 (계층화). 시험셋은 최종 1회.",
                f"【모형】{topic['pipeline']} 기준 학습. early stopping·class_weight 검토.",
                f"【튜닝】그리드/베이지안. best val macro-F1≈{f1:.2f}. seed={s}.",
            ]
            del_r = [["param", "후보", "선택"], ["lr / C", "2e-5 / 1.0", "best"], ["epochs/max_iter", str(5 + s % 15), "early stop"], ["max_features", "50k", "50k"], ["val_macroF1", f"{f1:.2f}", "—"]]
        return STAGES[3][2][1], proc, (["split", "8:1:1"], [["seed", str(s)]]), ["학습·튜닝 로그"], del_r

    if si == 3 and ti == 2:
        if akey.startswith("sna"):
            proc = [
                "【중심성】degree, betweenness, eigenvector. 가중·방향 정의 준수.",
                "【허브】상위 10 노드 해석(활동·역할).",
                "【커뮤니티】modularity / Louvain 결과와 교차.",
            ]
            del_r = [
                ["node", "degree", "betweenness", "해석"],
                ["U12", "48", "0.21", "확산 허브"],
                ["U03", "35", "0.17", "중개"],
                ["U29", "22", "0.09", "지역 허브"],
                ["U07", "18", "0.04", "주변"],
            ]
        else:
            proc = [
                "【네트워크 지표】문서분류 중심이면 키워드 공출현망 보조 또는 N/A.",
                "【선택 시】상위 키워드 공출현 degree로 이슈 클러스터 확인.",
                f"【명시】본 주제 초점({topic['focus']})상 SNA 본분석 {'해당' if '망' in topic['title'] else '보조/N/A'}.",
            ]
            del_r = [["항목", "처리"], ["SNA 본분석", "보조 공출현 또는 N/A"], ["사유", "분석 본령=텍스트 분류/토픽/검색"], ["보조산출", "cooccur_top50.csv"]]
        return STAGES[3][2][2], proc, (["graph_metrics", "Y/부분"], [["tool", "networkx/igraph"]]), ["중심성·커뮤니티 표"], del_r

    if si == 3 and ti == 3:
        acc = 0.80 + (s % 12) / 100
        f1 = acc - 0.03
        proc = [
            f"【시험성능】Accuracy={acc:.2f}, macro-F1={f1:.2f}, AUC={min(acc + 0.06, 0.95):.2f} (또는 nDCG@10 검색과제).",
            "【혼동행렬】그림 C. 오분류 유형 주석.",
            "【임계값】비용민감·불균형 시 precision/recall 곡선으로 선택.",
        ]
        del_r = [
            ["metric", "value", "비고"],
            ["Accuracy", f"{acc:.2f}", "test"],
            ["macro-F1", f"{f1:.2f}", "불균형 대응"],
            ["AUC/PR", f"{min(acc + 0.06, 0.95):.2f}", "이진/OvR"],
            ["nDCG@10", f"{0.55 + (s % 20)/100:.2f}", "IR과제 시"],
        ]
        return STAGES[3][2][3], proc, (["test_n", str(max(500, n_clean // 10))], [["pos_rate", f"{0.35 + (s % 20)/100:.2f}"]]), ["성능표"], del_r

    if si == 4 and ti == 0:
        proc = [
            f"【주장 해석】{topic['hypothesis']}",
            "【근거】성능표 + 상위 특성/토픽단어/허브노드 + 오류분석 5건.",
            "【한계】플랫폼 편향, 시간 드리프트, 라벨 비용, 약관 제약.",
        ]
        del_r = [
            ["유형", "사례 요지", "함의"],
            ["FP", "반어·인용문", "맥락피처 필요"],
            ["FN", "도메인은어·신조어", "사전/지속학습"],
            ["허브", "U12 과연결", "의제설정력"],
            ["토픽", "T1 배송불만", "운영 KPI 연계"],
        ]
        return STAGES[4][2][0], proc, (["interpretation", "Y"], [["error_n", "5"]]), ["패턴 해석 메모"], del_r

    if si == 4 and ti == 1:
        proc = [
            "【시각화】그림 A 용어, 그림 B 성능/토픽/망, 그림 C 혼동·보조.",
            f"【캡션】n={n_clean}, 기간={topic['period']}, 전처리={topic['pipeline']}.",
            "【공유】300dpi PNG + 원본 데이터 집계표.",
        ]
        del_r = [["fig", "내용", "파일"], ["A", "top terms", "figA_terms.png"], ["B", "metrics/topics/net", "figB_main.png"], ["C", "confusion/aux", "figC_aux.png"]]
        return STAGES[4][2][1], proc, (["dpi", "180"], [["n_figs", "3"]]), ["시각화 목록"], del_r

    # deliverable
    proc = [
        f"【요약(Abstract)】「{topic['title']}」: {topic['source']} n≈{n_clean} ({topic['period']}). "
        f"{topic['hypothesis']} — {method_name}({method_en}) · {topic['pipeline']}.",
        "【패키지】data/cleaned.parquet · labels/ · models/best.* · notebooks/ · figures/ · metrics.json · README.",
        f"【재현】seed={s}, 라이브러리 록파일, 학습 커맨드. 버전 {date.today().isoformat()}.",
        "【윤리·한계】재식별·유해출력·플랫폼 편향·일반화 범위. 라이선스·공유 범위 명시.",
    ]
    del_r = [
        ["유형", "파일", "내용"],
        ["data", "corpus_clean.parquet", "정제 코퍼스"],
        ["labels", "gold_labels.csv", "금표준"],
        ["model", "best_model", topic["pipeline"][:24]],
        ["metrics", "metrics.json", "시험성능"],
        ["figures", "figA–C.png", "시각화"],
        ["code", "reproduce.sh", "재현 스크립트"],
        ["결론", "—", topic["hypothesis"]],
    ]
    return STAGES[5][2][0], proc, (["package", "v1.0"], [["date", date.today().isoformat()]]), ["분석·모형 패키지"], del_r


def write_topic_section(doc, topic_idx, topic, method_name, method_en, method_no):
    doc.add_heading(f"주제{topic_idx}: {topic['title']}", level=2)
    p = doc.add_paragraph()
    p.add_run("연구질문: ").bold = True
    p.add_run(
        f"「{topic['title']}」코퍼스에서 {method_name}({method_en})의 표준 파이프라인을 적용할 때, "
        f"{topic['hypothesis']}을(를) 재현 가능한 지표·표·그림으로 제시할 수 있는가?"
    )
    doc.add_paragraph(f"중심 주장: {topic['hypothesis']}")
    doc.add_paragraph(
        f"출처·기간·단위·규모: {topic['source']} / {topic['period']} / {topic['unit']} / n≈{topic['n_docs']}"
    )
    doc.add_paragraph(f"초점·파이프라인: {topic['focus']} · {topic['pipeline']}")

    fig_seed = _seed(method_name, topic["title"], method_no)
    fig_dir = OUT_DIR / "_fig_cache" / f"m{method_no}_t{topic_idx}"
    fig_bundle = figures_for_analysis(topic["analysis_key"], topic["title"], fig_dir, fig_seed)

    doc.add_heading("【코퍼스·과제 명세】", level=3)
    doc.add_paragraph("본 주제의 자료·단위·파이프라인 명세이다. ①자료수집 태스크와 동일 체계로 확장한다.")
    spec = corpus_spec_table(topic)
    add_table(doc, spec[0], spec[1:])

    header_first = {
        "필드", "컬럼", "doc_id", "규칙", "지표", "표현", "id", "topic", "term", "param", "실험", "node", "항목",
        "metric", "유형", "fig", "라벨", "표본", "규칙ID",
    }

    for si, (slab, ssum, tasks) in enumerate(STAGES):
        doc.add_heading(slab, level=3)
        doc.add_paragraph(ssum)
        for ti, tlab in enumerate(tasks):
            _, proc, ptbl, dparas, drows = task_content(si, ti, topic, method_name, method_en)
            doc.add_heading(tlab, level=4)

            doc.add_paragraph().add_run("■ 세부 태스크(Procedural Task)").bold = True
            doc.add_paragraph(tlab)

            notes = task_step_annotations(si, ti, proc, topic["analysis_key"], topic, method_name)
            doc.add_paragraph().add_run("■ 각테스크별 주석").bold = True
            for i, (para, note) in enumerate(zip(proc, notes), start=1):
                head = doc.add_paragraph()
                head.add_run(f"({i}) 실행 절차 요지: ").bold = True
                head.add_run(para)
                for block in note.split("\n"):
                    if block.strip():
                        doc.add_paragraph(block.strip())

            doc.add_paragraph().add_run("■ 상세 실행 절차").bold = True
            for para in proc:
                doc.add_paragraph(para)
            if ptbl[1]:
                add_table(doc, ptbl[0], ptbl[1])

            doc.add_paragraph().add_run("■ 결과물 샘플(Sample Deliverable)").bold = True
            for dp in dparas:
                doc.add_paragraph(dp)
            if drows:
                if drows[0][0] in header_first or (len(drows) > 1 and len(drows[0]) == len(drows[1])):
                    add_table(doc, drows[0], drows[1:])
                else:
                    ncols = max(len(r) for r in drows)
                    hdr = ["항목"] + [f"열{i}" for i in range(1, ncols)]
                    add_table(doc, hdr[:ncols], [list(r) + [""] * (ncols - len(r)) for r in drows])

            if si == 2 and ti == 0:
                doc.add_paragraph().add_run("■ 결과물 샘플 보충: 이중코딩 합의표").bold = True
                doc.add_paragraph("독립 라벨링 불일치를 유형별로 합의·코드북 개정에 반영한 기록이다.")
                dc = double_coding_rows(_seed(method_name, topic["title"], si, ti))
                add_table(doc, dc[0], dc[1:])

            for cap, fp in figures_for_task(si, ti, fig_bundle):
                add_figure(doc, fp, cap)
            doc.add_paragraph()


def safe_filename(name_ko: str, en: str) -> str:
    base, en_c = name_ko, en
    for ch in '<>:"/\\|?*':
        base = base.replace(ch, "")
        en_c = en_c.replace(ch, "-")
    return f"텍스트·계산언어 아키타입-{base}({en_c}).docx"


def main():
    bundle = json.loads(BUNDLE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for m in bundle["methods"]:
        no, name = m["no"], m["name"]
        prof = METHOD_PROFILES.get(no)
        if not prof:
            print("skip", no)
            continue
        doc = Document()
        sect = doc.sections[0]
        sect.top_margin = Cm(2)
        sect.bottom_margin = Cm(2)
        t = doc.add_heading(ARCHETYPE, level=0)
        t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_heading(f"연구방법: {name}({prof['en']})", level=1)
        doc.add_paragraph(
            f"생성일: {date.today().isoformat()} · 번호 {no} · 주제 5개 · 절차 6단계 · 태스크 15"
        )
        doc.add_paragraph(
            "본 문서는 텍스트·계산언어 아키타입의 6단계·15태스크에 따라 "
            "코퍼스 명세·수집·전처리·라벨/토픽/사전 코딩·모형학습·중심성·성능·시각화·재현 패키지를 "
            "설문·양적통계 및 민족지 샘플과 동일한 출판 형식으로 제시한다."
        )
        doc.add_page_break()
        for i, topic in enumerate(prof["topics"], 1):
            write_topic_section(doc, i, topic, name, prof["en"], no)
            if i < 5:
                doc.add_page_break()
        path = OUT_DIR / safe_filename(name, prof["en"])
        tmp = path.with_suffix(".docx.generating")
        doc.save(tmp)
        try:
            if path.exists():
                path.unlink()
            tmp.replace(path)
        except OSError:
            alt = path.with_name(path.stem + "_갱신본.docx")
            if alt.exists():
                alt.unlink()
            tmp.replace(alt)
            print("Wrote (locked)", alt.name)
            continue
        print("Wrote", path.name)
    print("Done.", OUT_DIR)


if __name__ == "__main__":
    main()
