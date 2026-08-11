# -*- coding: utf-8 -*-
"""
Export 프로젝트 실습(Project Practice) assets from refined DOCX generators.
Writes: saas/public/archetypes/project-practice/
  index.json
  bundle-XX/method-{no}.json
  bundle-XX/m{no}_t{topic}/fig*.png
"""
from __future__ import annotations

import importlib.util
import inspect
import json
import sys
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # saas
PP_SRC = Path(__file__).resolve().parent / "pp_src"
OUT = ROOT / "public" / "archetypes" / "project-practice"
BUNDLES = ROOT / "public" / "archetypes" / "bundles"

# bundle id -> generator module stem in pp_src
GEN_MAP = {
    1: "gen_survey_quant_archetype_docx",
    2: "gen_hist_comp_archetype_docx",
    3: "gen_ethno_archetype_docx",
    4: "gen_text_comp_archetype_docx",
    5: "gen_lit_synth_archetype_docx",
    6: "gen_policy_eval_archetype_docx",
    7: "gen_causal_exp_archetype_docx",
    8: "gen_phenom_archetype_docx",
    9: "gen_forecast_sys_archetype_docx",
    10: "gen_gt_archetype_docx",
    11: "gen_content_code_archetype_docx",
    12: "gen_narr_life_archetype_docx",
    13: "gen_action_res_archetype_docx",
    14: "gen_discourse_archetype_docx",
    15: "gen_idi_archetype_docx",
    16: "gen_qdn_archetype_docx",
    17: "gen_fct_archetype_docx",
    18: "gen_si_archetype_docx",
    19: "gen_cs_archetype_docx",
    20: "gen_bib_archetype_docx",
    21: "gen_qms_archetype_docx",
    22: "gen_ca_archetype_docx",
    23: "gen_qrp_archetype_docx",
    24: "gen_srm_archetype_docx",
    25: "gen_ntc_archetype_docx",
    26: "gen_obs_archetype_docx",
    27: "gen_cpp_archetype_docx",
    28: "gen_mm_archetype_docx",
    29: "gen_ksa_archetype_docx",
    30: "gen_epi_archetype_docx",
    31: "gen_grm_archetype_docx",
}


def load_module(stem: str):
    path = PP_SRC / f"{stem}.py"
    if not path.exists():
        raise FileNotFoundError(path)
    spec = importlib.util.spec_from_file_location(stem, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[stem] = mod
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


def call_figures(mod, topic: dict, fig_dir: Path, seed: int):
    """Call figures_for_analysis with flexible signatures."""
    fn = getattr(mod, "figures_for_analysis", None)
    if fn is None:
        # try imported name on gen module — some re-export
        return []
    fig_dir.mkdir(parents=True, exist_ok=True)
    akey = topic.get("analysis_key", "default")
    title = topic.get("title", "")
    mode = topic.get("mode", "")
    sig = inspect.signature(fn)
    params = list(sig.parameters.keys())
    try:
        if len(params) >= 5 and "mode" in params:
            return fn(akey, title, mode, fig_dir, seed)
        if len(params) >= 4:
            return fn(akey, title, fig_dir, seed)
        return fn(akey, title, fig_dir, seed)
    except TypeError:
        try:
            return fn(akey, title, fig_dir, seed)
        except TypeError:
            return fn(title, fig_dir, seed)


def call_task_notes(mod, si, ti, proc, topic, method_name):
    fn = getattr(mod, "task_step_annotations", None)
    if fn is None:
        return [""] * len(proc)
    akey = topic.get("analysis_key", "")
    try:
        return fn(si, ti, proc, akey, topic, method_name)
    except TypeError:
        try:
            return fn(si, ti, proc, akey, topic)
        except TypeError:
            return fn(si, ti, proc, topic)


def figures_for_task(mod, si, ti, figs):
    fn = getattr(mod, "figures_for_task", None)
    if fn is None:
        return []
    try:
        return fn(si, ti, figs)
    except Exception:
        return []


def export_bundle(bid: int) -> dict | None:
    stem = GEN_MAP.get(bid)
    if not stem:
        return None
    print(f"[{bid:02d}] loading {stem} …", flush=True)
    # Ensure pp_src is first on path for sibling imports
    if str(PP_SRC) not in sys.path:
        sys.path.insert(0, str(PP_SRC))

    mod = load_module(stem)
    # Point BUNDLE to all-8
    bpath = BUNDLES / f"bundle-{bid:02d}.json"
    if hasattr(mod, "BUNDLE"):
        mod.BUNDLE = bpath
    bundle = json.loads(bpath.read_text(encoding="utf-8"))
    profiles = getattr(mod, "METHOD_PROFILES", {})
    stages = getattr(mod, "STAGES", [])
    task_content = getattr(mod, "task_content")
    # Prefer figures from dedicated module if gen re-exports
    figs_mod = mod

    out_meta = {
        "id": bid,
        "name": bundle.get("name"),
        "name_ko": bundle.get("name_ko"),
        "name_en": bundle.get("name_en"),
        "methods": [],
    }

    for m in bundle["methods"]:
        no = m["no"]
        name = m["name"]
        prof = profiles.get(no)
        if not prof:
            print(f"  skip method {no} (no profile)")
            continue
        method_en = prof.get("en", "")
        topics_out = []
        for ti_idx, topic in enumerate(prof["topics"], 1):
            seed = abs(hash((name, topic["title"], no))) % 997
            fig_dir = OUT / f"bundle-{bid:02d}" / f"m{no}_t{ti_idx}"
            # Resolve figures function — try gen module first, else import common pattern
            try:
                fig_bundle = call_figures(figs_mod, topic, fig_dir, seed)
            except Exception as e:
                print(f"  fig warn m{no} t{ti_idx}: {e}")
                fig_bundle = []

            # Normalize fig paths to web URLs
            web_figs = []
            for item in fig_bundle or []:
                if isinstance(item, (list, tuple)) and len(item) >= 2:
                    cap, fp = item[0], Path(item[1])
                    rel = fp.relative_to(OUT).as_posix() if fp.exists() else ""
                    web_figs.append({"caption": cap, "src": f"/archetypes/project-practice/{rel}" if rel else ""})

            stages_out = []
            for si, (slab, ssum, tasks) in enumerate(stages):
                tasks_out = []
                for ti, tlab in enumerate(tasks):
                    try:
                        _label, proc, ptbl, dparas, drows = task_content(si, ti, topic, name, method_en)
                    except Exception as e:
                        print(f"  task fail {si}/{ti}: {e}")
                        traceback.print_exc()
                        continue
                    notes = call_task_notes(mod, si, ti, proc, topic, name)
                    # Attach figures for this task
                    task_figs = []
                    try:
                        selected = figures_for_task(mod, si, ti, fig_bundle or [])
                        for item in selected:
                            if isinstance(item, (list, tuple)) and len(item) >= 2:
                                cap, fp = item[0], Path(item[1])
                                rel = fp.relative_to(OUT).as_posix() if Path(fp).exists() else ""
                                if rel:
                                    task_figs.append(
                                        {"caption": cap, "src": f"/archetypes/project-practice/{rel}"}
                                    )
                    except Exception:
                        pass
                    # On deliverable stage, include all figs if none selected
                    if si == len(stages) - 1 and not task_figs:
                        task_figs = [f for f in web_figs if f.get("src")]

                    headers = list(ptbl[0]) if ptbl and ptbl[0] else []
                    proc_rows = list(ptbl[1]) if ptbl and len(ptbl) > 1 else []
                    deliv_headers = drows[0] if drows and len(drows) > 1 else (drows[0] if drows else [])
                    deliv_rows = drows[1:] if drows and len(drows) > 1 else []

                    tasks_out.append(
                        {
                            "label": tlab,
                            "detail": tlab,
                            "notes": notes if isinstance(notes, list) else [str(notes)],
                            "procedures": proc,
                            "procedureTable": {"headers": headers, "rows": proc_rows},
                            "deliverableParas": dparas,
                            "deliverableTable": {"headers": deliv_headers, "rows": deliv_rows},
                            "figures": task_figs,
                            "aiTransform": {
                                "title": "AI 변환기 — 내 프로젝트로",
                                "kind": "project-practice",
                                "hint": (
                                    "위 예제·그림을 참고하되 문구를 그대로 복사하지 말고, "
                                    "아래 기입란의 내 연구주제·대상·자료로 같은 형식의 산출물을 작성하세요."
                                ),
                                "outputLabel": "내 프로젝트 산출물 초안",
                            },
                        }
                    )
                stages_out.append(
                    {
                        "label": slab,
                        "summary": ssum,
                        "tasks": tasks_out,
                    }
                )

            topics_out.append(
                {
                    "index": ti_idx,
                    "title": topic.get("title"),
                    "participants": topic.get("participants", ""),
                    "mode": topic.get("mode", ""),
                    "focus": topic.get("focus", ""),
                    "hypothesis": topic.get("hypothesis", ""),
                    "analysis_key": topic.get("analysis_key", ""),
                    "extra": {k: v for k, v in topic.items() if k not in {
                        "title", "participants", "mode", "focus", "hypothesis", "analysis_key"
                    }},
                    "figures": web_figs,
                    "stages": stages_out,
                }
            )

        method_doc = {
            "archetypeId": bid,
            "methodNo": no,
            "methodName": name,
            "methodEn": method_en,
            "family": m.get("family", ""),
            "label": m.get("label", ""),
            "topics": topics_out,
        }
        out_dir = OUT / f"bundle-{bid:02d}"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"method-{no}.json"
        out_path.write_text(json.dumps(method_doc, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  wrote {out_path.name} topics={len(topics_out)}")
        out_meta["methods"].append(
            {
                "no": no,
                "name": name,
                "en": method_en,
                "label": m.get("label", ""),
                "topicCount": len(topics_out),
                "path": f"bundle-{bid:02d}/method-{no}.json",
            }
        )
    return out_meta


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if str(PP_SRC) not in sys.path:
        sys.path.insert(0, str(PP_SRC))

    index = {
        "title": "프로젝트 실습(Project Practice)",
        "intro": (
            "연구방법별 정교화 샘플(주제 5개·절차적 단계·태스크)의 예제와 그림을 그대로 보고, "
            "태스크별 AI 변환기로 내 프로젝트를 만듭니다."
        ),
        "archetypes": [],
    }
    errors = []
    for bid in range(1, 32):
        try:
            meta = export_bundle(bid)
            if meta:
                index["archetypes"].append(meta)
        except Exception as e:
            errors.append({"id": bid, "error": str(e)})
            print(f"[{bid:02d}] ERROR {e}")
            traceback.print_exc()

    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Done.", OUT)
    print("archetypes", len(index["archetypes"]), "errors", len(errors))
    if errors:
        (OUT / "_export_errors.json").write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
