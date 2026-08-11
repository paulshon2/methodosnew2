# -*- coding: utf-8 -*-
"""
Apply 교정 방법명 table to registry.json (210) and align method-catalog.json / v61.json (177).
MERGE targets redirect; catalog keeps existing bilingual name when already equal to 교정 방법명.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

PUBLIC = Path(__file__).resolve().parents[1] / "public"
REG = PUBLIC / "registry.json"
CAT = PUBLIC / "method-catalog.json"
METHODS = PUBLIC / "methods"
REPORT = PUBLIC / "_lv4_name_correction_report.json"

# id -> corrected name; MERGE(id) => merge into that id's corrected name
RAW = {
    # CI
    "CI-001": "비교역사분석(Comparative Historical Analysis)",
    "CI-002": "준실험 인과추론(Quasi-Experimental Causal Inference)",
    "CI-003": "인과추론 — 준실험설계 편(Causal Inference: Quasi-Experimental)",
    "CI-004": "인과추론 — 응용계량 편(Causal Inference: Applied Econometrics)",
    "CI-005": "실험계획법(Experimental Design)",
    "CI-006": "MERGE(CI-004)",
    "CI-007": "임상시험(Clinical Trials)",
    "CI-008": "준실험(Quasi-Experiments)",
    "CI-009": "코호트 연구(Cohort Study)",
    "CI-010": "현장실험(Field Experiments)",
    # EM
    "EM-001": "문헌고찰 방법론(Literature Review Methodology)",
    "EM-002": "MERGE(QT-039)",
    "EM-003": "통합적 문헌고찰(Integrative Literature Review)",
    "EM-004": "체계적 평가(Systematic Evaluation)",
    # EP
    "EP-001": "정책분석(Policy Analysis)",
    "EP-002": "공공프로그램 평가(Public Program Evaluation)",
    "EP-003": "델파이 방법(Delphi Method)",
    "EP-004": "분석적 계층화 과정(Analytic Hierarchy Process)",
    "EP-005": "비용편익분석(Cost-Benefit Analysis)",
    "EP-006": "영향평가(Impact Evaluation)",
    "EP-007": "프로그램 평가(Program Evaluation)",
    "EP-008": "활용중심 평가(Utilization-Focused Evaluation)",
    # EV
    "EV-001": "비판적 문헌평가(Critical Appraisal of Literature)",
    "EV-002": "신속 문헌고찰(Rapid Literature Review)",
    "EV-003": "계량서지분석(Bibliometric Analysis)",
    "EV-004": "메타민족지(Meta-Ethnography)",
    "EV-005": "메타분석(Meta-Analysis)",
    "EV-006": "체계적 문헌고찰(Systematic Literature Review)",
    "EV-007": "서사적 문헌고찰(Narrative Literature Review)",
    "EV-008": "우산 문헌고찰(Umbrella Review)",
    "EV-009": "인용분석(Citation Analysis)",
    "EV-010": "질적 메타합성(Qualitative Meta-Synthesis)",
    "EV-011": "사회과학 체계적 고찰(Systematic Review in Social Science)",
    "EV-012": "스코핑 리뷰(Scoping Review)",
    # GN
    "GN-001": "교사 생애사 연구(Teachers' Life History Research)",
    "GN-002": "구술사 실무(Oral History Practice)",
    "GN-003": "규율권력 계보학 분석(Genealogical Disciplinary Power Analysis)",
    "GN-004": "기록물 연구(Archival Research)",
    "GN-005": "임상근거 비판적 평가(Critical Appraisal of Clinical Evidence)",
    "GN-006": "현대 다차원척도법(Modern Multidimensional Scaling)",
    "GN-007": "대화분석 입문(Introduction to Conversation Analysis)",
    "GN-008": "미디어 내용분석(Media Content Analysis)",
    "GN-009": "MERGE(EP-004)",
    "GN-010": "사회조사방법론(Social Survey Methodology)",
    "GN-011": "MERGE(QL-029)",
    "GN-012": "가구패널 자료분석(Household Panel Data Analysis)",
    "GN-013": "텍스트 분석(Text Analysis)",
    "GN-014": "역사철학(Philosophy of History)",
    "GN-015": "응용 예측모형(Applied Forecasting Models)",
    "GN-016": "종단자료 분석(Longitudinal Data Analysis)",
    "GN-017": "행위자 기반 모형(Agent-Based Modeling)",
    "GN-018": "서사 방법(Narrative Methods)",
    "GN-019": "과학계량학(Scientometrics)",
    "GN-020": "전기·생애 연구(Biographical Research)",
    "GN-021": "지성사(Intellectual History)",
    "GN-022": "키워드 핵심성 분석(Keyword Keyness Analysis)",
    "GN-023": "MERGE(QL-032)",
    "GN-024": "행동연구와 Q기법(Behavioral Study with Q-Technique)",
    "GN-025": "실행연구 — 계획 편(Action Research: Planning)",
    "GN-026": "실행연구 — 종합 편(Action Research: Comprehensive)",
    "GN-027": "역학 연구방법(Epidemiological Research Methods)",
    "GN-028": "연구방법론 — 인문사회 편(Research Methodology: Humanities and Social Science)",
    "GN-029": "Q 방법론(Q Methodology)",
    # HC
    "HC-001": "구술사(Oral History)",
    "HC-002": "문헌·기록물 연구(Documentary and Archival Research)",
    "HC-003": "비교민주주의 연구(Comparative Democracy Research)",
    "HC-004": "비교방법(Comparative Method)",
    "HC-005": "MERGE(CI-001)",
    "HC-006": "사회과학 연구설계(Social Science Research Design)",
    "HC-007": "역사사회학(Historical Sociology)",
    "HC-008": "역사 해석학(Historical Hermeneutics)",
    "HC-009": "역사연구방법(Historical Research Methods)",
    "HC-010": "MERGE(GN-021)",
    "HC-011": "과정추적(Process Tracing)",
    # MM
    "MM-001": "혼합연구방법(Mixed Methods Research)",
    # QL
    "QL-001": "현상학적 연구방법(Phenomenological Research Methods)",
    "QL-002": "간호이론 구축(Nursing Theory Construction)",
    "QL-003": "규율권력 분석(Disciplinary Power Analysis)",
    "QL-004": "비판이론 분석(Critical Theory Analysis)",
    "QL-005": "관찰법(Observation Methods)",
    "QL-006": "구성주의 근거이론(Constructivist Grounded Theory)",
    "QL-007": "근거이론 — 2세대 편(Grounded Theory: Second Generation)",
    "QL-008": "절차적 근거이론(Procedural Grounded Theory)",
    "QL-009": "질적 연구설계(Qualitative Research Design)",
    "QL-010": "네트노그래피(Netnography)",
    "QL-011": "담화분석(Discourse Analysis)",
    "QL-012": "민족지 연구방법(Ethnographic Research Methods)",
    "QL-013": "조직문화 연구(Organizational Culture Research)",
    "QL-014": "MERGE(QL-012)",
    "QL-015": "민족지 현장기록(Ethnographic Fieldnotes)",
    "QL-016": "자문화기술지(Autoethnography)",
    "QL-017": "비판적 민족지(Critical Ethnography)",
    "QL-018": "비판적 담화분석(Critical Discourse Analysis)",
    "QL-019": "교육 실행연구 — 교사 편(Educational Action Research: Teacher-Led)",
    "QL-020": "사례연구 — 설계·적용 편(Case Study Research: Design and Application)",
    "QL-021": "사례연구 — 해석 편(Case Study Research: Interpretive)",
    "QL-022": "해석학적 현상학(Hermeneutic Phenomenology)",
    "QL-023": "상징적 상호작용론(Symbolic Interactionism)",
    "QL-024": "상호작용 의례 분석(Interaction Ritual Analysis)",
    "QL-025": "생애사 연구(Life History Research)",
    "QL-026": "서사 분석(Narrative Analysis)",
    "QL-027": "내러티브 탐구(Narrative Inquiry)",
    "QL-028": "기술적 현상학(Descriptive Phenomenology)",
    "QL-029": "고전 민족지(Classical Ethnography)",
    "QL-030": "초월적 현상학(Transcendental Phenomenology)",
    "QL-031": "시각 민족지(Visual Ethnography)",
    "QL-032": "권력·담론 계보학 분석(Genealogical Power–Discourse Analysis)",
    "QL-033": "이론적 표집·민감성(Theoretical Sampling and Sensitivity)",
    "QL-034": "질적 심층면담(Qualitative In-depth Interviewing)",
    "QL-035": "자연주의적 탐구(Naturalistic Inquiry)",
    "QL-036": "체현적 현상학(Embodied Phenomenology)",
    "QL-037": "MERGE(QL-043)",
    "QL-038": "내용분석 방법론(Content Analysis Methodology)",
    "QL-039": "MERGE(QL-034)",
    "QL-040": "양적·질적·혼합 연구설계(Quantitative, Qualitative, and Mixed Research Design)",
    "QL-041": "MERGE(QL-034)",
    "QL-042": "참여관찰(Participant Observation)",
    "QL-043": "일상언어 분석(Ordinary Language Analysis)",
    "QL-044": "포커스그룹(Focus Group)",
    "QL-045": "해석적 상호작용론(Interpretive Interactionism)",
    "QL-046": "실행연구(Action Research)",
    "QL-047": "교육 실행연구 — 학교개선 편(Educational Action Research: School Improvement)",
    "QL-048": "Q 방법론(Q Methodology)",
    "QL-049": "MERGE(QL-001)",
    "QL-050": "대화분석(Conversation Analysis)",
    "QL-051": "MERGE(QL-006)",
    "QL-052": "MERGE(QL-007)",
    "QL-053": "내용분석 실무(Content Analysis Practice)",
    "QL-054": "MERGE(QL-017)",
    "QL-055": "MERGE(QL-031)",
    "QL-056": "MERGE(QL-030)",
    "QL-057": "평가이론 담화분석(Appraisal Discourse Analysis)",
    "QL-058": "질적연구 기초(Foundations of Qualitative Research)",
    "QL-059": "질적 면담(Qualitative Interviewing)",
    "QL-060": "질적 코딩(Qualitative Coding)",
    "QL-061": "질적연구 합성(Qualitative Research Synthesis)",
    "QL-062": "질적탐구(Qualitative Inquiry)",
    "QL-063": "해석현상학적 분석(Interpretative Phenomenological Analysis)",
    # QT
    "QT-001": "통계패키지 기반 기술·추론통계(Package-Based Descriptive and Inferential Statistics)",
    "QT-002": "교육연구방법론(Educational Research Methodology)",
    "QT-003": "구조방정식 모형(Structural Equation Modeling)",
    "QT-004": "군집분석(Cluster Analysis)",
    "QT-005": "기초통계학(Basic Statistics)",
    "QT-006": "사회과학 통계분석 — 기초 편(Social Science Statistics: Foundations)",
    "QT-007": "다차원척도법(Multidimensional Scaling)",
    "QT-008": "매개·조절 분석(Mediation and Moderation Analysis)",
    "QT-009": "MERGE(EV-011)",
    "QT-010": "베이지안 자료분석(Bayesian Data Analysis)",
    "QT-011": "시스템 다이내믹스(System Dynamics)",
    "QT-012": "사회과학 통계방법(Social Science Statistical Methods)",
    "QT-013": "사회과학 통계분석 — 심화 편(Social Science Statistics: Advanced)",
    "QT-014": "예측 모형(Forecasting Models)",
    "QT-015": "회귀분석(Regression Analysis)",
    "QT-016": "의학통계(Medical Statistics)",
    "QT-017": "MERGE(GN-017)",
    "QT-018": "잠재계층·전이 분석(Latent Class and Transition Analysis)",
    "QT-019": "잠재변수 모형(Latent Variable Modeling)",
    "QT-020": "로지스틱 회귀분석(Logistic Regression Analysis)",
    "QT-021": "통계적 의사결정(Statistical Decision Making)",
    "QT-022": "종단연구(Longitudinal Research)",
    "QT-023": "탐색적 요인분석(Exploratory Factor Analysis)",
    "QT-024": "통계적 학습(Statistical Learning)",
    "QT-025": "판별분석(Discriminant Analysis)",
    "QT-026": "패널자료 분석(Panel Data Analysis)",
    "QT-027": "확인적 요인분석(Confirmatory Factor Analysis)",
    "QT-028": "통계패키지 활용 분석(Statistical Package Analysis)",
    "QT-029": "MERGE(CI-003)",
    "QT-030": "설문조사 설계(Survey Design)",
    "QT-031": "설문 문항 설계(Survey Item Design)",
    "QT-032": "실험·준실험 설계(Experimental and Quasi-Experimental Design)",
    "QT-033": "실험설계와 분석(Experimental Design and Analysis)",
    "QT-034": "혼합모드 조사(Mixed-Mode Survey)",
    "QT-035": "다변량 통계분석(Multivariate Statistical Analysis)",
    "QT-036": "의학연구 통계(Statistics for Medical Research)",
    "QT-037": "계량경제학(Econometrics)",
    "QT-038": "조사방법론(Survey Methodology)",
    "QT-039": "조사연구방법 — 종합 편(Survey Research: Comprehensive)",
    "QT-040": "MERGE(QT-031)",
    "QT-041": "횡단면·패널 계량분석(Cross-Section and Panel Econometrics)",
    "QT-042": "선형 통계모형(Linear Statistical Models)",
    "QT-043": "판별분석과 통계적 패턴인식(Discriminant Analysis and Pattern Recognition)",
    # SV
    "SV-001": "마케팅 조사(Marketing Research)",
    "SV-002": "여론조사(Public Opinion Research)",
    "SV-003": "설문 문항 작성(Survey Question Writing)",
    "SV-004": "조사연구(Survey Research)",
    # TX
    "TX-001": "MERGE(EV-005)",
    "TX-002": "MERGE(EV-006)",
    "TX-003": "딥러닝(Deep Learning)",
    "TX-004": "사회연결망 분석(Social Network Analysis)",
    "TX-005": "자연어처리(Natural Language Processing)",
    "TX-006": "인공지능(Artificial Intelligence)",
    "TX-007": "정보검색(Information Retrieval)",
    "TX-008": "감성분석(Sentiment Analysis)",
    "TX-009": "코퍼스언어학(Corpus Linguistics)",
    "TX-010": "텍스트 마이닝(Text Mining)",
    "TX-011": "텍스트 기계학습(Text Machine Learning)",
    "TX-012": "MERGE(GN-022)",
    "TX-013": "통계적 자연어처리(Statistical Natural Language Processing)",
    "TX-014": "기계학습(Machine Learning)",
    "TX-015": "토픽 모형(Topic Modeling)",
}


def resolve(name: str, depth=0) -> str:
    if depth > 5:
        return name
    m = re.match(r"MERGE\(([^)]+)\)", name.strip())
    if not m:
        return name
    tid = m.group(1)
    return resolve(RAW.get(tid, tid), depth + 1)


def ko_core(name: str) -> str:
    return re.sub(r"\s+", "", re.sub(r"\([^)]*\)", "", name)).replace("—", "-").lower()


def en_core(name: str) -> str:
    m = re.search(r"\(([^)]+)\)\s*$", name)
    return (m.group(1) if m else name).strip().lower()


def main():
    resolved = {k: resolve(v) for k, v in RAW.items()}
    merges = {k: re.match(r"MERGE\(([^)]+)\)", v).group(1) for k, v in RAW.items() if v.startswith("MERGE(")}

    # --- registry ---
    reg = json.loads(REG.read_text(encoding="utf-8"))
    reg_changed = []
    for m in reg.get("methods") or []:
        rid = m.get("id")
        if rid not in resolved:
            continue
        new_name = resolved[rid]
        old = m.get("name_ko") or m.get("name")
        if old != new_name:
            m["name_ko"] = new_name
            # also clean English `name` to parenthetical en if present
            em = re.search(r"\(([^)]+)\)\s*$", new_name)
            if em:
                m["name"] = em.group(1)
            if rid in merges:
                m["mergedInto"] = merges[rid]
                m["hidden"] = True
            reg_changed.append({"id": rid, "from": old, "to": new_name})
        else:
            if rid in merges:
                m["mergedInto"] = merges[rid]
                m["hidden"] = True

    REG.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8")

    # --- catalog: map by English / Korean core to corrected names ---
    cat = json.loads(CAT.read_text(encoding="utf-8"))
    # build lookup of unique corrected names (non-merge)
    corrected_list = sorted({v for v in resolved.values()})
    by_en = {}
    by_ko = {}
    for nm in corrected_list:
        by_en.setdefault(en_core(nm), []).append(nm)
        by_ko.setdefault(ko_core(nm), []).append(nm)

    cat_changed = []
    for m in cat["methods"]:
        cur = m["name_ko"]
        # if already exactly a corrected name, keep
        if cur in corrected_list:
            continue
        # try en match
        en = en_core(cur)
        cands = by_en.get(en) or []
        # try ko match
        if not cands:
            cands = by_ko.get(ko_core(cur)) or []
        # special: causal inference variants
        if m["perfSlug"].startswith("causal-inference-") and m.get("variant"):
            v = m["variant"]
            mapping = {
                1: "인과추론 — 준실험설계 편(Causal Inference: Quasi-Experimental)",
                2: "인과추론 — 응용계량 편(Causal Inference: Applied Econometrics)",
                3: "인과추론(Causal Inference)",
            }
            pick = mapping.get(v)
            if pick and pick != cur:
                m["name_ko"] = pick
                m["name_hint"] = re.search(r"\(([^)]+)\)\s*$", pick).group(1)
                cat_changed.append({"slug": m["perfSlug"], "from": cur, "to": pick})
            continue
        # grounded theory variants
        if m["perfSlug"].startswith("grounded-theory-") and m.get("variant"):
            vmap = {
                1: "근거이론(Grounded Theory)",
                2: "근거이론 — 2세대 편(Grounded Theory: Second Generation)",
                3: "절차적 근거이론(Procedural Grounded Theory)",
            }
            # only rename if English is Grounded Theory family
            if "grounded" in en and vmap.get(m["variant"]) and ko_core(cur).startswith("근거이론"):
                pick = vmap[m["variant"]]
                # variant 1 keep catalog if already 근거이론(Grounded Theory)
                if m["variant"] == 1:
                    continue
                if pick != cur and m["variant"] in (2, 3):
                    # only apply if current is generic 근거이론
                    if ko_core(cur) == ko_core("근거이론"):
                        m["name_ko"] = pick
                        m["name_hint"] = re.search(r"\(([^)]+)\)\s*$", pick).group(1)
                        cat_changed.append({"slug": m["perfSlug"], "from": cur, "to": pick})
                continue

        if len(cands) == 1 and cands[0] != cur:
            # Prefer catalog keep when only punctuation/spacing differs lightly
            if ko_core(cands[0]) == ko_core(cur) and en_core(cands[0]) == en_core(cur):
                # adopt corrected punctuation/spacing
                m["name_ko"] = cands[0]
                em = re.search(r"\(([^)]+)\)\s*$", cands[0])
                if em:
                    m["name_hint"] = em.group(1)
                cat_changed.append({"slug": m["perfSlug"], "from": cur, "to": cands[0]})
            elif en_core(cands[0]) == en and ko_core(cur) != ko_core(cands[0]):
                # English same but Korean display polluted or short — adopt corrected
                m["name_ko"] = cands[0]
                em = re.search(r"\(([^)]+)\)\s*$", cands[0])
                if em:
                    m["name_hint"] = em.group(1)
                cat_changed.append({"slug": m["perfSlug"], "from": cur, "to": cands[0]})

    CAT.write_text(json.dumps(cat, ensure_ascii=False, indent=2), encoding="utf-8")

    # sync v61.json name_ko / nameShortKo
    v61_changed = []
    by_slug = {m["perfSlug"]: m for m in cat["methods"]}
    for folder in METHODS.iterdir():
        if not folder.is_dir():
            continue
        entry = by_slug.get(folder.name)
        if not entry:
            continue
        v61p = folder / "v61.json"
        if not v61p.exists():
            continue
        data = json.loads(v61p.read_text(encoding="utf-8"))
        if data.get("name_ko") != entry["name_ko"]:
            old = data.get("name_ko")
            data["name_ko"] = entry["name_ko"]
            # short ko = before paren
            data["nameShortKo"] = re.sub(r"\([^)]*\)\s*$", "", entry["name_ko"]).strip()
            em = re.search(r"\(([^)]+)\)\s*$", entry["name_ko"])
            if em:
                data["nameShortEn"] = em.group(1)
            v61p.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            v61_changed.append({"slug": folder.name, "from": old, "to": entry["name_ko"]})

    report = {
        "registryChanged": len(reg_changed),
        "catalogChanged": len(cat_changed),
        "v61Changed": len(v61_changed),
        "mergeCount": len(merges),
        "registrySample": reg_changed[:15],
        "catalogSample": cat_changed[:20],
        "v61Sample": v61_changed[:20],
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
