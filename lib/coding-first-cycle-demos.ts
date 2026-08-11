/**
 * coding first-cycle demo transcripts (≈3–4 A4 pages each)
 */
import demos from "./coding-first-cycle-demos.generated.json";

export type FirstCycleDemo = {
  id: string;
  label: string;
  title: string;
  chars: number;
  text: string;
};

const MAP = demos as Record<string, FirstCycleDemo>;

export function getFirstCycleDemo(methodId: string): FirstCycleDemo | undefined {
  return MAP[methodId];
}

export function listFirstCycleDemos(): FirstCycleDemo[] {
  return Object.values(MAP);
}
