export interface SsTechnique {
  category?: string;
  id: string;
  name: string;
  example: string;
  analogy: string;
  etymology: string;
  prep: string;
  dataTask: string;
  dataWhy: string;
  automationLevel: string;
  automationProcess: string;
  sampleTemplate?: string;
  purpose?: string;
  keyStats?: string;
  postHoc?: string;
}

export interface SsPhase {
  id: "descriptive" | "diagnostic" | "inferential";
  title: string;
  techniques: SsTechnique[];
}

export interface SsStatsGuide {
  version: string;
  source: string;
  overview: Record<string, string>;
  phases: SsPhase[];
}

export const SS_STATS_METHOD_ID = "QT-013";

export async function loadSsStatsGuide(): Promise<SsStatsGuide> {
  const r = await fetch("/ss-stats-procedural-guide.json");
  if (!r.ok) throw new Error("ss-stats guide load failed");
  return r.json();
}

export function defaultCsvSample(phaseId: string, tech: SsTechnique): string {
  if (phaseId === "descriptive") {
    if (/교차표|Crosstab/i.test(tech.name)) {
      return "gender,party\n1,2\n1,1\n2,2\n1,2\n2,1\n2,2\n1,1\n2,1";
    }
    if (/평균|중앙|표준편차|분산|Z-score|왜도|첨도/i.test(tech.name)) {
      return "score\n72\n85\n90\n68\n74\n88\n91\n70\n83\n77";
    }
    if (/빈도/i.test(tech.name)) {
      return "ID,Gender,Education,Satisfaction,Region\n1,1,3,4,2\n2,2,4,5,1\n3,1,2,3,3\n4,2,3,4,4\n5,1,1,,2\n6,2,3,3,1\n7,1,,4,3\n8,2,4,5,2\n9,1,3,2,4\n10,2,5,5,1";
    }
    return "var1\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10";
  }
  if (phaseId === "diagnostic") {
    if (/상관|VIF/i.test(tech.name)) {
      return "x1,x2,y\n3,2,5\n4,3,6\n5,4,8\n2,2,4\n6,5,9";
    }
    if (/Cronbach|문항/i.test(tech.name)) {
      return "q1,q2,q3,q4\n4,5,4,3\n3,3,4,2\n5,4,5,4\n2,2,3,2\n4,4,4,3";
    }
    return "group,value\nA,72\nA,85\nA,78\nB,68\nB,70\nB,74";
  }
  if (/t-검정|t검정/i.test(tech.name)) {
    return "group,score\n1,72\n1,85\n1,78\n2,68\n2,70\n2,74\n2,80";
  }
  if (/ANOVA/i.test(tech.name)) {
    return "group,score\n1,72\n1,85\n2,68\n2,70\n3,80\n3,88\n3,75";
  }
  if (/회귀/i.test(tech.name)) {
    return "y,x1,x2\n5,3,2\n6,4,2\n7,5,3\n4,2,1\n8,6,4";
  }
  if (/카이|chi/i.test(tech.name)) {
    return "smoke,cancer\n0,0\n0,1\n1,1\n1,1\n0,0\n1,0\n0,1";
  }
  return "group,value\n1,10\n1,12\n2,14\n2,16";
}
