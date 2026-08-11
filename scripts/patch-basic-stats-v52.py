# -*- coding: utf-8 -*-
"""Patch basic-stats-curriculum.json for v1.52.0: strip SPSS/AMOS branding + replace demo data."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "public" / "basic-stats-curriculum.json"

NEW_SAMPLES = {
    "freq": "ID,Shift,Tenure,FocusScore,Site\n1,주간,3년미만,4,판교\n2,야간,3-5년,5,판교\n3,주간,5년이상,3,부산\n4,교대,3-5년,4,대전\n5,야간,3년미만,2,부산\n6,주간,5년이상,5,판교\n7,교대,3년미만,3,대전\n8,야간,5년이상,4,부산\n9,주간,3-5년,5,판교\n10,교대,5년이상,4,대전",
    "ttest": "group,score\n원격,81\n원격,88\n원격,79\n원격,84\n출근,73\n출근,70\n출근,76\n출근,68\n출근,74",
    "anova": "group,score\n멘토링,79\n멘토링,86\n멘토링,82\n워크숍,71\n워크숍,74\n워크숍,69\n자율학습,83\n자율학습,90\n자율학습,78\n자율학습,85",
    "validity": "item1,item2,item3,item4,item5\n4,4,5,3,4\n5,5,4,4,5\n3,4,3,3,4\n5,4,5,4,5\n2,3,2,2,3\n4,5,4,4,4\n3,3,4,3,3\n5,5,5,4,5",
    "efa": "q1,q2,q3,q4,q5,q6\n5,4,5,2,2,3\n4,5,4,3,2,2\n5,5,4,2,3,2\n2,3,2,5,4,5\n3,2,3,4,5,4\n4,4,5,2,2,3\n2,2,3,5,5,4\n5,4,5,3,2,3",
    "reliability": "i1,i2,i3,i4\n4,5,4,4\n5,4,5,5\n3,3,4,3\n5,5,4,5\n2,3,2,2\n4,4,5,4\n3,4,3,3\n5,5,5,4",
    "corr": "sleep,steps,mood\n6.2,8200,4\n7.1,9100,5\n5.4,6400,3\n8.0,10200,5\n6.8,7800,4\n5.9,5900,2\n7.5,9800,5\n6.0,7100,3",
    "chi2": "commute,injury\n자전거,없음\n자전거,있음\n대중교통,없음\n도보,있음\n대중교통,없음\n도보,없음\n자전거,있음\n대중교통,있음\n도보,없음\n자전거,없음",
    "regress": "y,x1,x2\n62,3.1,1.2\n71,4.0,1.8\n78,4.8,2.4\n55,2.2,0.9\n84,5.5,3.1\n90,6.2,3.6\n66,3.4,1.5\n73,4.5,2.0",
    "dummy": "y,x1,x2,coastal\n58,2.8,1.1,1\n69,3.9,1.7,0\n76,4.6,2.3,1\n51,2.1,0.8,0\n82,5.3,2.9,1\n64,3.2,1.4,0\n88,6.0,3.4,1",
    "logistic": "y,x,m,z\n1,2.1,3.2,0\n1,3.4,3.5,0\n0,1.8,2.1,1\n1,4.2,4.1,0\n0,1.2,1.9,1\n1,4.8,4.6,0\n0,2.0,1.5,1\n1,3.9,4.8,1",
    "cluster": "x1,x2,x3\n2,1,2\n1,2,1\n2,2,1\n9,8,9\n8,9,8\n9,9,8\n5,4,5\n4,5,4\n5,5,4",
    "cfa": "f1_1,f1_2,f1_3,f2_1,f2_2,f2_3\n5,4,5,2,2,3\n4,5,4,3,2,2\n5,5,4,2,3,2\n2,2,3,5,4,5\n3,2,2,4,5,4\n4,5,5,2,2,3\n5,4,4,3,2,3\n2,3,2,5,5,4",
    "path": "clarity,engagement,retention\n4.5,4.1,3.9\n3.2,3.0,2.8\n4.9,4.7,4.6\n2.7,2.9,2.5\n4.3,4.4,4.1\n3.6,3.4,3.3\n4.7,4.5,4.4\n3.1,2.8,2.7",
    "sem": "ux1,ux2,ux3,trust1,trust2,loyal1,loyal2\n4,5,4,4,5,4,4\n5,4,5,5,4,5,5\n3,3,4,3,3,3,4\n5,5,4,4,5,5,4\n2,3,2,2,3,2,2\n4,4,5,5,4,4,5\n3,4,3,3,4,3,3\n5,5,5,4,5,5,4",
    "sem_mod": "support,stress,burnout\n4.6,2.1,2.0\n3.2,3.8,3.9\n4.9,1.8,1.7\n2.8,4.2,4.1\n4.1,2.5,2.4\n3.5,3.4,3.3\n4.7,2.0,1.9\n3.0,4.0,4.2",
    "multigroup": "group,clarity,engagement,retention\n신규,4.3,4.0,3.7\n신규,3.4,3.1,2.9\n신규,4.7,4.4,4.3\n경력,4.2,4.4,4.1\n경력,3.9,4.1,3.8\n경력,4.6,4.7,4.5\n신규,3.1,2.9,2.7\n경력,3.2,3.6,3.5",
    "multigroup2": "group,q1,q2,s1,s2\n즉시구매,5,4,5,4\n즉시구매,4,5,4,5\n비교후,3,3,3,4\n비교후,4,3,4,3\n보류,2,2,2,3\n보류,3,2,3,2\n즉시구매,4,4,5,5\n비교후,3,4,3,3\n보류,2,3,2,2",
}

NEW_EXAMPLES = {
    "freq": [
        "원격근무 팀의 주간/야간/교대 비율을 표로 제시할 때",
        "근속연수별 응답 분포를 볼 때",
        "집중도 1~5점의 평균·표준편차를 기술통계로 보고할 때",
        "사업장(판교·부산·대전)별 표본 수를 확인해 대표성을 점검할 때",
    ],
    "ttest": [
        "목표 수면시간이 7시간과 같은지(일표본)",
        "온보딩 전후 적응점수 변화(대응표본)",
        "원격 vs 출근 집중도 차이(독립표본)",
        "앱 A/B 사용성 점수 비교",
    ],
    "anova": [
        "멘토링·워크숍·자율학습 효과 비교(일원)",
        "교육방식×경력이 성과에 미치는 영향(이원)",
        "카페 브랜드 3개의 재방문 의향 차이",
        "팀별 협업만족도 비교 후 Tukey 사후검정",
    ],
    "cfa": [
        "학습몰입·피드백품질 측정모델 검증",
        "디지털 리터러시 척도의 CFA",
        "EFA로 찾은 구조를 CFA로 교차검증",
        "SEM 전에 측정모델부터 확정",
    ],
    "path": [
        "설명명료→참여→잔존 경로",
        "자기조절→연습량→숙련",
        "요인점수 기반 경로모델",
        "매개가설의 간접효과 확인",
    ],
    "sem": [
        "UX품질→신뢰→로열티 SEM",
        "원격협업 수용모형 검증",
        "학습지원→몰입→성과",
        "논문의 전체 연구모형 한 번에 검정",
    ],
}

def scrub(s: str) -> str:
    if not isinstance(s, str):
        return s
    s = s.replace("SPSS/AMOS 강의교안 기반", "")
    s = s.replace("SPSS의 탐색적 요인분석(EFA)과 달리 ", "")
    s = s.replace("SPSS 계열", "기술·추론 계열")
    s = s.replace("AMOS 계열", "구조방정식 계열")
    s = s.replace("SPSS", "")
    s = s.replace("AMOS", "")
    s = re.sub(r"\s{2,}", " ", s).strip()
    s = re.sub(r"\s+([,.])", r"\1", s)
    return s

def main():
    data = json.loads(PATH.read_text(encoding="utf-8"))
    data["version"] = "1.52.0"
    data["source"] = ""
    data["story"] = [
        {"id": "hub", "label": "시작", "desc": "기본통계 스토리 맵"},
        {"id": "basics", "label": "기본 지식", "desc": "가설·척도·표본·코딩"},
        {"id": "decision", "label": "분석 고르기", "desc": "구분도로 기법 선택"},
        {"id": "classic", "label": "기술·추론", "desc": "기술~군집"},
        {"id": "sem_overview", "label": "SEM 개요", "desc": "쉬운 설명·예시"},
        {"id": "sem", "label": "구조방정식", "desc": "CFA~다중집단"},
    ]

    # basics examples refresh
    if "basics" in data and "chapters" in data["basics"]:
        for ch in data["basics"]["chapters"]:
            ch["summary"] = scrub(ch.get("summary", ""))
            ch["examples"] = [scrub(x) for x in ch.get("examples", [])]
            if ch.get("id") == "h1":
                ch["examples"] = [
                    "카페인 함량 표기 80mg이 맞다(귀무) vs 맞지 않다(대립)",
                    "p=.03 < .05 → 대립 채택",
                    "t/ANOVA/회귀에서도 공통으로 p 사용",
                ]
            if ch.get("id") == "h5":
                ch["examples"] = ["평정척도(등간형) 1~5", "역문항 역코딩", "결측값 코드(99 등)"]

    if "semOverview" in data:
        data["semOverview"]["easy"] = scrub(data["semOverview"].get("easy", ""))
        data["semOverview"]["examples"] = [
            "도서관 이용경험→만족→재방문",
            "원격근무 지원→심리적 안전→성과",
            "앱 UX→신뢰→구독 유지",
        ]
        for p in data["semOverview"].get("parts", []):
            p["desc"] = scrub(p.get("desc", ""))

    for m in data.get("modules", []):
        mid = m.get("id")
        if m.get("group") == "spss":
            m["group"] = "classic"
        elif m.get("group") == "amos":
            m["group"] = "sem"
        m["source"] = ""
        m["overview"] = scrub(m.get("overview", ""))
        m["decision"] = scrub(m.get("decision", ""))
        m["process"] = [scrub(x) for x in m.get("process", [])]
        if mid in NEW_EXAMPLES:
            m["examples"] = NEW_EXAMPLES[mid]
        else:
            m["examples"] = [scrub(x) for x in m.get("examples", [])]
            # light theme swap for remaining modules
            repl = {
                "남녀": "원격·출근",
                "직무만족": "협업만족",
                "서비스품질": "학습지원품질",
                "브랜드": "커뮤니티",
                "흡연": "통근수단",
                "재구매": "잔존",
            }
            fixed = []
            for ex in m["examples"]:
                for a, b in repl.items():
                    ex = ex.replace(a, b)
                fixed.append(ex)
            m["examples"] = fixed
        if mid in NEW_SAMPLES:
            m["sampleCsv"] = NEW_SAMPLES[mid]
        # special: multigroup modules may share ids
        if mid == "multigroup" and "group,quality" in (m.get("sampleCsv") or ""):
            m["sampleCsv"] = NEW_SAMPLES["multigroup"]
        for st in m.get("steps", []):
            st["why"] = scrub(st.get("why", ""))
            st["nextWhy"] = scrub(st.get("nextWhy", ""))
            st["example"] = scrub(st.get("example", ""))
            # refresh step examples that mention old demo themes
            if "남" in st["example"] and "여" in st["example"]:
                st["example"] = st["example"].replace("남", "원격").replace("여", "출근")
            for c in st.get("choices", []):
                c["label"] = scrub(c.get("label", ""))
                if c.get("hint"):
                    c["hint"] = scrub(c["hint"])

    # decision tree text scrub
    if "decision" in data:
        data["decision"] = json.loads(scrub(json.dumps(data["decision"], ensure_ascii=False)))

    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("patched", PATH)
    # verify no SPSS/AMOS left in basic-stats curriculum
    text = PATH.read_text(encoding="utf-8")
    for bad in ["SPSS", "AMOS", "강의교안", "Part01", "Part02", "Part03"]:
        if bad in text:
            print("WARN still contains:", bad, "count=", text.count(bad))
        else:
            print("OK removed:", bad)

if __name__ == "__main__":
    main()
