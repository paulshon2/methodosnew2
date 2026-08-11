"use client";
import type { DeliverableSample } from "@/lib/deliverable-samples";

interface MethodSamplesFile {
  domain?: string;
  entries: Record<string, DeliverableSample>;
}

const cache: Record<string, MethodSamplesFile | null> = {};
const pending: Record<string, Promise<MethodSamplesFile | null>> = {};

export function loadMethodSamples(slug: string): Promise<MethodSamplesFile | null> {
  if (cache[slug] !== undefined) return Promise.resolve(cache[slug]);
  if (pending[slug]) return pending[slug];
  pending[slug] = fetch(`methods/${encodeURIComponent(slug)}/samples.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: MethodSamplesFile | null) => {
      cache[slug] = d && d.entries ? d : null;
      return cache[slug];
    })
    .catch(() => {
      cache[slug] = null;
      return null;
    });
  return pending[slug];
}

export function sampleFromMethodFile(file: MethodSamplesFile | null, entryId: string): DeliverableSample | null {
  if (!file?.entries) return null;
  if (file.entries[entryId]) return file.entries[entryId];
  // samples.json keys are often "1.1-1:산출물:1.1-1" while lookup uses ":산출물:1.1-1"
  for (const sample of Object.values(file.entries)) {
    if (sample?.id === entryId) return sample;
  }
  const suffix = entryId.startsWith(":") ? entryId.slice(1) : entryId;
  for (const [key, sample] of Object.entries(file.entries)) {
    if (key === suffix || key.endsWith(entryId) || key.endsWith(suffix)) return sample;
  }
  return null;
}
