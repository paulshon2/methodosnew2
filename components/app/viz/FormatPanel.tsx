"use client";

import type { VizSpec, PaletteId } from "@/lib/viz-spec";
import { PALETTES } from "@/lib/viz-spec";

const TOGGLES: { key: keyof VizSpec["format"]; label: string; hint: string }[] = [
  { key: "zeroBaseline", label: "세로축 0에서 시작", hint: "막대에서는 반드시 켜 두세요. 끄면 차이가 과장됩니다." },
  { key: "grid", label: "격자선", hint: "값을 눈으로 따라가기 쉬워집니다." },
  { key: "showValues", label: "값 표시", hint: "항목이 적을 때만 켜세요. 많으면 오히려 읽기 어렵습니다." },
  { key: "sortByValue", label: "값 순으로 정렬", hint: "순위를 보여 줄 때 씁니다. 시간 축에는 쓰지 마세요." },
  { key: "errorBars", label: "95% 신뢰구간 오차막대", hint: "평균이 얼마나 흔들리는지 함께 보여 줍니다." },
];

/** 우 · 서식. 규칙을 어길 수 있게 두되, 어기면 읽기 도움에 경고가 뜬다. */
export default function FormatPanel({ spec, onChange }: { spec: VizSpec; onChange: (s: VizSpec) => void }) {
  const setFormat = (patch: Partial<VizSpec["format"]>) => onChange({ ...spec, format: { ...spec.format, ...patch } });

  return (
    <div className="space-y-3">
      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="viz-title">
          제목
        </label>
        <input
          id="viz-title"
          className="inp"
          value={spec.title}
          placeholder="무엇을 보여 주는 그림인지 한 문장으로"
          onChange={(e) => onChange({ ...spec, title: e.target.value })}
        />
      </div>

      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="viz-sub">
          부제 · 단위
        </label>
        <input
          id="viz-sub"
          className="inp"
          value={spec.subtitle || ""}
          placeholder="예: 단위 = 점, n = 120"
          onChange={(e) => onChange({ ...spec, subtitle: e.target.value })}
        />
      </div>

      <fieldset>
        <legend className="ty-label mb-1.5 font-bold">표시</legend>
        <ul className="space-y-1.5">
          {TOGGLES.map((t) => (
            <li key={String(t.key)}>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!spec.format[t.key]}
                  onChange={(e) => setFormat({ [t.key]: e.target.checked } as Partial<VizSpec["format"]>)}
                />
                <span>
                  <span className="ty-label font-bold">{t.label}</span>
                  <span className="ty-label block text-ink-3">{t.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="viz-palette">
          색 팔레트
        </label>
        <select
          id="viz-palette"
          className="inp"
          value={spec.format.palette}
          onChange={(e) => setFormat({ palette: e.target.value as PaletteId })}
        >
          {(Object.keys(PALETTES) as PaletteId[]).map((p) => (
            <option key={p} value={p}>
              {PALETTES[p].label}
            </option>
          ))}
        </select>
        <p className="ty-label mt-1 text-ink-3">{PALETTES[spec.format.palette].note}</p>
      </div>

      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="viz-source">
          출처
        </label>
        <input
          id="viz-source"
          className="inp"
          value={spec.format.source || ""}
          placeholder="예: 2024년 자체 설문(n=120)"
          onChange={(e) => setFormat({ source: e.target.value })}
        />
        <p className="ty-label mt-1 text-ink-3">출처가 없는 그림은 논문에 실을 수 없습니다.</p>
      </div>
    </div>
  );
}
