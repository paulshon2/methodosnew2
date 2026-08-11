"use client";
import { useEffect, useState } from "react";

export type ProcessGloss = { term: string; def: string };
export type ProcessSummary = {
  no: number;
  catalogFamily: string;
  name: string;
  familyKey: string;
  familyLabel: string;
  collect: string;
  prepare: string;
  analyze: string;
  interpret: string;
  result: string;
  pipeline: string;
  stageCount: number | null;
  perfSlug: string;
  beginner: string;
  example: string;
  oneLiner: string;
};
export type ProcessStage = {
  no: number;
  name: string;
  stageNo: number;
  stageName: string;
  tip: string;
  familyKey: string;
  perfSlug: string;
};
export type ProcessCommon = {
  familyKey: string;
  familyLabel: string;
  collect: string;
  prepare: string;
  analyze: string;
  interpret: string;
  result: string;
  beginner: string;
  example: string;
  methodCount: number;
};
export type MethodProcessGuide = {
  version: string;
  source: string;
  intro: string;
  howTo: string[];
  glossary: ProcessGloss[];
  summaries: ProcessSummary[];
  stages: ProcessStage[];
  commons: ProcessCommon[];
  stats: { methodCount: number; stageRowCount: number; familyCount: number };
};

let _cache: MethodProcessGuide | null = null;

export function loadMethodProcessGuide(): Promise<MethodProcessGuide | null> {
  if (_cache) return Promise.resolve(_cache);
  return fetch("method-process-guide.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      _cache = d;
      return d;
    })
    .catch(() => null);
}

export function useMethodProcessGuide() {
  const [doc, setDoc] = useState<MethodProcessGuide | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    loadMethodProcessGuide().then((d) => {
      if (!d) setErr(true);
      else setDoc(d);
    });
  }, []);
  return { doc, err };
}
