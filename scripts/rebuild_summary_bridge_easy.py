# -*- coding: utf-8 -*-
"""
Rebuild workedExample.summaryTable + summaryExplain so they:
- read at middle-school Korean level
- explicitly map to 2-1 workSheet columns / sample rows
"""
from __future__ import annotations

import json
import re
from pathlib import Path

METHODS = Path(__file__).resolve().parents[1] / "public" / "methods"
REPORT = Path(__file__).resolve().parents[1] / "public" / "_lv4_summary_bridge_report.json"

# Easy gloss for common work-sheet column names
COL_EASY = {
    "행": "몇 번째 줄인지 번호",
    "작업일": "언제 했는지 날짜",
    "담당": "누가 했는지 이름",
    "체크ID": "점검 줄 번호(C01 같은 코드)",
    "점검범주": "무엇을 검사했는지 짧은 이름",
    "점검문항(구체)": "실제로 물은 확인 질문",
    "확인한 파일·시트·셀": "열어본 파일 위치",
    "관찰값/상태": "확인해 보니 어땠는지",
    "기준": "통과로 볼 조건",
    "결과": "통과(Pass)인지 실패(Fail)인지",
    "조치·수정내용": "고친 내용(없으면 -)",
    "확인자": "마지막에 확인한 사람",
    "다음연결": "다음에 이을 줄/작업",
    "날짜": "적은 날",
    "버전": "몇 번째 고친 판",
    "출처메모": "아이디어가 나온 메모",
    "초안문장": "처음 떠올린 문장",
    "다듬은문장": "연구용으로 고친 문장",
    "목적": "이 작업으로 남길 것",
    "제외범위": "일부러 안 할 일",
    "결정": "채택/수정/폐기",
    "결정이유": "그렇게 정한 이유",
}


def easy_col(h: str) -> str:
    if h in COL_EASY:
        return COL_EASY[h]
    # strip parenthetical
    base = re.sub(r"\([^)]*\)", "", h).strip()
    return COL_EASY.get(base, f"「{h}」칸에 적는 내용")


def output_title(we: dict) -> str:
    st = we.get("summaryTable") or {}
    title = st.get("title") or ""
    m = re.search(r"[「\"](.+?)[」\"]", title)
    if m:
        return m.group(1)
    ws = we.get("workSheet") or {}
    wt = ws.get("title") or ""
    m2 = re.search(r"[「\"](.+?)[」\"]", wt)
    if m2:
        return m2.group(1)
    return "이 단계 산출물"


def build_bridge(we: dict) -> tuple[dict, list[str]]:
    ws = we.get("workSheet") or {}
    headers: list[str] = list(ws.get("headers") or [])
    rows: list[list[str]] = list(ws.get("rows") or [])
    topic = (we.get("topic") or "").strip()
    out_name = output_title(we)

    # Prefer key columns for the preview (skip pure index if many cols)
    preview_cols = [h for h in headers if h not in ("행",)][:6]
    if not preview_cols:
        preview_cols = headers[:6]

    sum_headers = ["미리보기", "실제 작업표 열(연결)", "쉬운 말", "적는 예"]
    sum_rows: list[list[str]] = []

    # Row A: what this whole table is
    sum_rows.append(
        [
            "이 표의 역할",
            "아래 2-1 실제 작업표 전체",
            f"「{out_name}」을 만들기 전에, 같은 내용을 짧게 미리 보는 표입니다. 아래 큰 표(2-1)와 같은 산출물입니다.",
            topic[:40] + ("…" if len(topic) > 40 else "") if topic else out_name,
        ]
    )

    # Map first 3 work-sheet data rows into plain language
    for i, row in enumerate(rows[:3]):
        cells = {headers[j]: (row[j] if j < len(row) else "") for j in range(len(headers))}
        # pick a human label
        label_bits = []
        for key in ("체크ID", "점검범주", "항목", "코드", "행"):
            if cells.get(key):
                label_bits.append(str(cells[key]))
                break
        if not label_bits:
            label_bits.append(f"{i+1}번째 줄")

        # connected columns text
        conn = " · ".join(preview_cols[:4])

        # easy story from known columns
        if "점검문항(구체)" in cells and cells["점검문항(구체)"]:
            story = (
                f"실제로 확인한 질문: {cells['점검문항(구체)'][:60]}"
                + ("…" if len(cells.get("점검문항(구체)", "")) > 60 else "")
            )
            if cells.get("결과"):
                story += f" → 결과「{cells['결과']}」"
            if cells.get("관찰값/상태"):
                story += f" (본 것: {cells['관찰값/상태']})"
        elif "다듬은문장" in cells and cells.get("다듬은문장"):
            story = f"질문을 「{cells['다듬은문장'][:50]}」처럼 다듬었습니다."
        else:
            bits = [f"{h}={cells.get(h,'')}" for h in preview_cols[:3] if cells.get(h)]
            story = " / ".join(bits) if bits else "실제 작업표의 이 줄을 짧게 옮긴 것입니다."

        example_bits = []
        for h in preview_cols[:3]:
            v = cells.get(h) or ""
            if v:
                example_bits.append(f"{h}:{v[:28]}")
        example = " · ".join(example_bits) if example_bits else (row[0] if row else "")

        sum_rows.append(
            [
                f"줄 보기 {label_bits[0]}",
                conn,
                story,
                example[:120],
            ]
        )

    # Column dictionary rows (how to write) — top meaningful cols
    for h in preview_cols[:5]:
        # sample value from first data row
        sample = ""
        if rows:
            idx = headers.index(h) if h in headers else -1
            if idx >= 0 and idx < len(rows[0]):
                sample = rows[0][idx]
        sum_rows.append(
            [
                f"칸 안내「{h}」",
                h,
                easy_col(h) + " — 아래 2-1 표에서 같은 이름 열에 적습니다.",
                sample[:80] if sample else f"예: {h} 값",
            ]
        )

    explain = [
        f"위 표(2)는 「{out_name}」의 미리보기입니다. 아래 2-1 「실제 작업표」와 같은 산출물을 다룹니다.",
        "미리보기 줄의 ‘줄 보기 …’는 실제 작업표의 한 행을 쉬운 말로 옮긴 것입니다. ‘칸 안내’는 실제 작업표 열 이름과 1:1로 연결됩니다.",
        "작성 순서: (1) 위 미리보기로 무엇을 남길지 이해하고 (2) 아래 2-1에서 같은 열 이름으로 50행을 채웁니다. 열이 다른 새 표를 만들지 마세요.",
        "하나라도 결과=Fail(실패)이면 다음 실행 단계로 가지 말고, 조치·수정내용에 고친 뒤 다시 확인합니다."
        if any("결과" == h for h in headers)
        else "빈 칸을 남긴 채 다음 Stage로 넘기지 않습니다.",
    ]
    if topic:
        explain.insert(
            1,
            f"연구 주제「{topic}」과 맞는 내용만 적습니다. 주제를 벗어난 예시는 쓰지 않습니다.",
        )

    summary = {
        "title": f"산출물 「{out_name}」 예시표(요약 골격) — 실제 작업표 연결 미리보기",
        "headers": sum_headers,
        "rows": sum_rows,
        "bridgeToWorkSheet": True,
    }
    return summary, explain


def main():
    updated = 0
    missing = 0
    samples = []
    for folder in sorted(METHODS.iterdir()):
        v61p = folder / "v61.json"
        if not v61p.exists():
            continue
        data = json.loads(v61p.read_text(encoding="utf-8"))
        changed = False
        for stage in data.get("stages") or []:
            tasks = list(stage.get("tasks") or [])
            for proc in stage.get("processes") or []:
                tasks.extend(proc.get("tasks") or [])
            for t in tasks:
                we = t.get("workedExample")
                if not we or not (we.get("workSheet") or {}).get("headers"):
                    missing += 1
                    continue
                summary, explain = build_bridge(we)
                we["summaryTable"] = summary
                we["summaryExplain"] = explain
                # keep a short howTo bridge for UI
                we["summaryHowTo"] = (
                    "이 요약표는 아래 실제 작업표(2-1)를 쉽게 미리 보여 주는 것입니다. "
                    "‘실제 작업표 열(연결)’ 칸의 이름과 2-1 표 머리글이 같습니다."
                )
                changed = True
                updated += 1
                if len(samples) < 3 and "입력검증" in (summary.get("title") or ""):
                    samples.append({"slug": folder.name, "task": t.get("name"), "summary": summary, "explain": explain})
        if changed:
            v61p.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    report = {"updatedTasks": updated, "missingWorkSheet": missing, "samples": samples}
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"updatedTasks": updated, "missing": missing, "report": str(REPORT)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
