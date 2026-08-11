/** Persist 프로젝트 실습 task outputs for step linkage */

import type { ArchetypeDataMode } from "@/lib/archetype-workflow";
import type { PracticeTask, PracticeTopic } from "@/lib/archetype-data";

export type PracticeTaskSnapshot = {
  taskId: string;
  output: string;
  values: Record<string, string>;
  imported?: string;
  dataMode?: ArchetypeDataMode;
  updatedAt: number;
};

export const PRACTICE_WS_EVENT = "methodos-practice-ws-update";

function notifyPracticeWorkspace(
  archetypeId: number,
  methodNo: number,
  topicIndex: number,
  taskId: string,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PRACTICE_WS_EVENT, {
      detail: { archetypeId, methodNo, topicIndex, taskId },
    }),
  );
}

export function practiceTaskId(
  archetypeId: number,
  methodNo: number,
  topicIndex: number,
  stageIndex: number,
  taskIndex: number,
): string {
  return `p${archetypeId}-m${methodNo}-t${topicIndex}-s${stageIndex}-k${taskIndex}`;
}

const wsKey = (archetypeId: number, methodNo: number, topicIndex: number) =>
  `methodos-practice-ws-${archetypeId}-${methodNo}-${topicIndex}`;

export function loadPracticeWorkspace(
  archetypeId: number,
  methodNo: number,
  topicIndex: number,
): Record<string, PracticeTaskSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(wsKey(archetypeId, methodNo, topicIndex));
    return raw ? (JSON.parse(raw) as Record<string, PracticeTaskSnapshot>) : {};
  } catch {
    return {};
  }
}

export function savePracticeTaskSnapshot(
  archetypeId: number,
  methodNo: number,
  topicIndex: number,
  taskId: string,
  output: string,
  values: Record<string, string>,
  imported?: string,
  dataMode?: ArchetypeDataMode,
) {
  if (typeof window === "undefined") return;
  const ws = loadPracticeWorkspace(archetypeId, methodNo, topicIndex);
  ws[taskId] = { taskId, output, values, imported, dataMode, updatedAt: Date.now() };
  localStorage.setItem(wsKey(archetypeId, methodNo, topicIndex), JSON.stringify(ws));
  notifyPracticeWorkspace(archetypeId, methodNo, topicIndex, taskId);
}

export function getPracticeTaskSnapshot(
  archetypeId: number,
  methodNo: number,
  topicIndex: number,
  taskId: string,
): PracticeTaskSnapshot | undefined {
  return loadPracticeWorkspace(archetypeId, methodNo, topicIndex)[taskId];
}

export function composePracticeInput(
  mode: ArchetypeDataMode,
  prevOutput: string | undefined,
  userFields: Record<string, string>,
  importedText: string,
): string {
  const fieldBlock = Object.entries(userFields)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join("\n");
  if (mode === "new") {
    return [importedText, fieldBlock].filter(Boolean).join("\n\n");
  }
  if (mode === "link") {
    return [prevOutput || "(이전 태스크 산출 없음)", fieldBlock].filter(Boolean).join("\n\n");
  }
  return [prevOutput || "", importedText, fieldBlock].filter(Boolean).join("\n\n---\n\n");
}

export type FlatPracticeTask = {
  flatIndex: number;
  stageIndex: number;
  taskIndex: number;
  stageLabel: string;
  stageSummary: string;
  task: PracticeTask;
};

export function flattenPracticeTasks(topic: PracticeTopic): FlatPracticeTask[] {
  const out: FlatPracticeTask[] = [];
  let fi = 0;
  topic.stages.forEach((stage, si) => {
    stage.tasks.forEach((task, ti) => {
      out.push({
        flatIndex: fi++,
        stageIndex: si,
        taskIndex: ti,
        stageLabel: stage.label,
        stageSummary: stage.summary,
        task,
      });
    });
  });
  return out;
}
