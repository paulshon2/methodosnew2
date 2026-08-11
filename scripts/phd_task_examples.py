# -*- coding: utf-8
"""Delegates to task_example_engine for detailed galleries."""
from __future__ import annotations

from task_example_engine import ARCHETYPE_DOMAIN, PROCESS_KO, generate_task_gallery


def generate_phd_gallery(
    bundle_id: int,
    process_key: str,
    kind: str,
    task_label: str,
    excel_sample: str = "",
) -> list[dict]:
    return generate_task_gallery(bundle_id, process_key, kind, task_label, excel_sample)
