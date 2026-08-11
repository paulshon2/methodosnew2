/** Persist archetype task outputs for step linkage */

export type ArchetypeDataMode = "link" | "merge" | "new";

export type ArchetypeTaskSnapshot = {
  taskId: string;
  output: string;
  values: Record<string, string>;
  updatedAt: number;
};

const key = (archetypeId: number) => `methodos-archetype-ws-${archetypeId}`;

export function loadWorkspace(archetypeId: number): Record<string, ArchetypeTaskSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key(archetypeId));
    return raw ? (JSON.parse(raw) as Record<string, ArchetypeTaskSnapshot>) : {};
  } catch {
    return {};
  }
}

export function saveTaskSnapshot(
  archetypeId: number,
  taskId: string,
  output: string,
  values: Record<string, string>,
) {
  if (typeof window === "undefined") return;
  const ws = loadWorkspace(archetypeId);
  ws[taskId] = { taskId, output, values, updatedAt: Date.now() };
  localStorage.setItem(key(archetypeId), JSON.stringify(ws));
}

export function getTaskSnapshot(archetypeId: number, taskId: string): ArchetypeTaskSnapshot | undefined {
  return loadWorkspace(archetypeId)[taskId];
}

export function composeInputForMode(
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
    return [prevOutput || "(이전 단계 산출 없음)", fieldBlock].filter(Boolean).join("\n\n");
  }
  // merge
  return [prevOutput || "", importedText, fieldBlock].filter(Boolean).join("\n\n---\n\n");
}
