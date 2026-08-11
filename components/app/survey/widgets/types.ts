import type { Question } from "@/lib/survey-types";

/**
 * 위젯은 응답자가 볼 화면 그 자체다.
 * `preview`가 켜지면 답할 수 있고, 꺼지면 같은 자리에서 문구를 고칠 수 있다.
 */
export type WidgetProps = {
  q: Question;
  preview: boolean;
  value?: string | string[] | Record<string, string>;
  onValue?: (v: string | string[] | Record<string, string>) => void;
  onPatch?: (patch: Partial<Question>) => void;
};

export const inputBase = "inp";
