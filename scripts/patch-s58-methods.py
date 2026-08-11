# -*- coding: utf-8 -*-
"""
methodos-s22-all-58 patches:
- Strip display phrase 'Creswell 연구설계6e' from method JSON texts
- Ensure stageLabel / overview titles are bilingual: 한글 (English)
  Prefer title / fullName when stageLabel is Korean-only
- Marketing (SV-001): align stageLabel with sample bilingual titles
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METHODS = ROOT / "public" / "methods"

HAS_EN = re.compile(r"[\(（][^)）]*[A-Za-z][^)）]*[\)）]")
# Remove the exact display phrase (and common variants with separators)
CRESWELL_RE = re.compile(
    r"\s*[·\-\—–_]?\s*Creswell\s*연구설계\s*6e\s*[·\-\—–_]?",
    re.IGNORECASE,
)
CRESWELL_PAREN_RE = re.compile(
    r"\s*[\(（]\s*[^)）]*Creswell\s*연구설계\s*6e[^)）]*[\)）]",
    re.IGNORECASE,
)

# Marketing sample bilingual stage titles (uiStage 1..11)
MARKET_TITLES = {
    1: "SV-001 도입 및 연구과정 (Introduction)",
    2: "조사문제 정의 및 접근방법 (Problem Definition & Approach)",
    3: "조사설계 수립 (Research Design)",
    4: "탐색조사: 2차자료·질적조사 (Exploratory Research: Secondary & Qualitative Data)",
    5: "기술조사: 설문·관찰조사 (Descriptive Research: Survey & Observation)",
    6: "측정·척도·설문지 설계 (Measurement & Questionnaire Design)",
    7: "표본추출 및 표본크기 (Sampling Design & Sample Size)",
    8: "현장조사 (Fieldwork / Data Collection)",
    9: "자료 준비 및 기술·교차분석 (Data Preparation & Descriptive/Cross Analysis)",
    10: "다변량·심화분석 (Multivariate & Advanced Analysis)",
    11: "보고·발표·국제·윤리 (Report, Presentation, International & Ethics)",
}


def strip_creswell(s: str) -> str:
    if not isinstance(s, str) or "Creswell" not in s and "연구설계6e" not in s and "연구설계 6e" not in s:
        if not isinstance(s, str):
            return s
        if "Creswell" not in s and "연구설계6e" not in s:
            return s
    out = CRESWELL_PAREN_RE.sub("", s)
    out = CRESWELL_RE.sub(" ", out)
    # tidy leftover double spaces / empty parens
    out = re.sub(r"\(\s*\)", "", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\s+([,.;:）\)])", r"\1", out)
    return out.strip()


def strip_obj(obj):
    if isinstance(obj, str):
        return strip_creswell(obj)
    if isinstance(obj, list):
        return [strip_obj(x) for x in obj]
    if isinstance(obj, dict):
        return {k: strip_obj(v) for k, v in obj.items()}
    return obj


def bilingual_from(title: str, full: str, label: str) -> str | None:
    for cand in (title, full, label):
        if cand and HAS_EN.search(cand):
            # Prefer cleaned title without method prefix in fullName
            t = cand.strip()
            # fullName often: "방법 · 단계 (English)" → drop method prefix
            if " · " in t and HAS_EN.search(t.split(" · ", 1)[-1]):
                t = t.split(" · ", 1)[-1].strip()
            return t
    return None


def normalize_space_before_paren(s: str) -> str:
    # "한글(English)" → "한글 (English)" for readability (sample style)
    return re.sub(r"([^\s\(（])([\(\（])", r"\1 \2", s)


def patch_stages(stages: list, is_market: bool) -> tuple[int, int]:
    fixed_label = 0
    stripped = 0
    for s in stages:
        if not isinstance(s, dict):
            continue
        no = s.get("stageNo")
        if is_market and no in MARKET_TITLES:
            desired = MARKET_TITLES[no]
            for key in ("title", "stageLabel"):
                if s.get(key) != desired:
                    s[key] = desired
                    fixed_label += 1
            # keep fullName method prefix if present
            fn = s.get("fullName") or ""
            if "마케팅" in fn or "SV-001" in fn or "Marketing" in fn:
                prefix = fn.split(" · ", 1)[0].strip() if " · " in fn else "마케팅리서치"
                s["fullName"] = f"{prefix} · {desired}"
            else:
                s["fullName"] = f"마케팅리서치 · {desired}"
            continue

        label = (s.get("stageLabel") or "").strip()
        title = (s.get("title") or "").strip()
        full = (s.get("fullName") or "").strip()
        bi = bilingual_from(title, full, label)
        if bi:
            bi = normalize_space_before_paren(bi)
            if not label or not HAS_EN.search(label):
                if s.get("stageLabel") != bi:
                    s["stageLabel"] = bi
                    fixed_label += 1
            elif label and not re.search(r"\s[\(（]", label) and HAS_EN.search(label):
                # has english but no space before paren
                fixed = normalize_space_before_paren(label)
                if fixed != label:
                    s["stageLabel"] = fixed
                    fixed_label += 1
            # also ensure title is bilingual when possible
            if title and not HAS_EN.search(title) and bi:
                s["title"] = bi
                fixed_label += 1
            elif title and HAS_EN.search(title):
                nt = normalize_space_before_paren(title)
                if nt != title:
                    s["title"] = nt
    return fixed_label, stripped


def patch_overview(ov: dict, is_market: bool) -> int:
    n = 0
    views = ov.get("stageViews") or []
    for sv in views:
        if not isinstance(sv, dict):
            continue
        ui = sv.get("uiStage")
        title = (sv.get("title") or "").strip()
        if is_market and ui in MARKET_TITLES:
            if title != MARKET_TITLES[ui]:
                sv["title"] = MARKET_TITLES[ui]
                n += 1
            continue
        if title and not HAS_EN.search(title):
            # try to recover from registry later — leave for now
            pass
        elif title and HAS_EN.search(title):
            nt = normalize_space_before_paren(title)
            if nt != title:
                sv["title"] = nt
                n += 1
    return n


def sync_overview_from_registry(ov: dict, stages: list) -> int:
    """Fill Korean-only overview titles from registry bilingual titles."""
    by_no = {}
    for s in stages:
        if isinstance(s, dict) and s.get("stageNo") is not None:
            by_no[s["stageNo"]] = s
    n = 0
    for sv in ov.get("stageViews") or []:
        if not isinstance(sv, dict):
            continue
        ui = sv.get("uiStage")
        title = (sv.get("title") or "").strip()
        if title and HAS_EN.search(title):
            continue
        src = by_no.get(ui)
        if not src:
            continue
        bi = bilingual_from(src.get("title") or "", src.get("fullName") or "", src.get("stageLabel") or "")
        if bi:
            sv["title"] = normalize_space_before_paren(bi)
            n += 1
    return n


def main():
    creswell_files = 0
    label_fixes = 0
    overview_fixes = 0
    for d in sorted(METHODS.iterdir()):
        if not d.is_dir():
            continue
        is_market = d.name == "SV-001"
        reg_path = d / "perf-registry.json"
        ov_path = d / "overview.json"
        stages = []

        if reg_path.exists():
            raw = reg_path.read_text(encoding="utf-8")
            had_c = "Creswell 연구설계6e" in raw or "Creswell 연구설계 6e" in raw
            data = json.loads(raw)
            data = strip_obj(data)
            if had_c:
                creswell_files += 1
            stages = data if isinstance(data, list) else (data.get("stages") or [])
            fl, _ = patch_stages(stages, is_market)
            label_fixes += fl
            if isinstance(data, list):
                out = stages
            else:
                data["stages"] = stages
                out = data
            reg_path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        if ov_path.exists():
            raw = ov_path.read_text(encoding="utf-8")
            had_c = "Creswell 연구설계6e" in raw or "Creswell 연구설계 6e" in raw
            ov = json.loads(raw)
            ov = strip_obj(ov)
            if had_c:
                creswell_files += 1
            overview_fixes += patch_overview(ov, is_market)
            if stages:
                overview_fixes += sync_overview_from_registry(ov, stages)
            ov_path.write_text(json.dumps(ov, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        # also strip other json companions
        for extra in ("samples.json", "beginner.json", "bundle.json"):
            ep = d / extra
            if not ep.exists():
                continue
            raw = ep.read_text(encoding="utf-8")
            if "Creswell 연구설계6e" not in raw and "Creswell 연구설계 6e" not in raw:
                continue
            data = strip_obj(json.loads(raw))
            creswell_files += 1
            ep.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "creswell_files_touched": creswell_files,
        "stage_label_fixes": label_fixes,
        "overview_fixes": overview_fixes,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
