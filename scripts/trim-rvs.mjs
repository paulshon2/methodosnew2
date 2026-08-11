import fs from "fs";
const p = new URL("../lib/research-viz-standard.ts", import.meta.url);
let t = fs.readFileSync(p, "utf8");
const cut = t.indexOf("/* ─── APP STATE ─── */");
if (cut < 0) throw new Error("cut not found");
t = t.slice(0, cut);
t += "\nexport type StdMethod = (typeof METHODS)[number];\nexport { R, MKD, METHODS, ONT, VDEFS, METS, CR };\n";
fs.writeFileSync(p, t);
console.log("ok", t.split("\n").length);
