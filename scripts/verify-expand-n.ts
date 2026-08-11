import {
  getDemo,
  previewCsv,
  basicStatsSampleSizeGuide,
  ensurePracticeDemoCsv,
  BASIC_STATS_PRACTICE_N,
} from "../lib/basic-stats-demos";

const d = getDemo("D-06", "D-06-demo-01");
console.log("D-06 n=", d?.n, "total=", previewCsv(d?.csv || "", 8).total);
console.log("CA guide:", basicStatsSampleSizeGuide("D-06", "대응분석", "CA").standardN);
console.log("SEM family:", basicStatsSampleSizeGuide("sem", "구조방정식").family);
const tiny = "ID,a,b\n1,인문,낮음\n2,이공,높음";
console.log("expand", previewCsv(ensurePracticeDemoCsv(tiny, "D-06", "t"), 1).total, "need", BASIC_STATS_PRACTICE_N);
