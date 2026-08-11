/**
 * 코딩 스튜디오 — 전사 불러오기·내보내기 (CSV / Excel / 연구자·참여자 텍스트).
 */
import * as XLSX from "xlsx";
import { parseCsv } from "@/lib/basic-stats-engine";
import {
  buildDoc,
  codeById,
  type Assign,
  type Doc,
  type Theme,
  type Who,
} from "@/lib/coding-types";

export type CodingImportResult = {
  docs: Doc[];
  assign: Assign;
  label: string;
};

const ROLE_LABEL: Record<Who, string> = { R: "연구자", P: "참여자" };

function roleFromToken(raw: string): Who | null {
  const t = raw.trim().replace(/\s/g, "");
  if (!t) return null;
  const lower = t.toLowerCase();
  if (t === "연구자" || lower === "r" || lower === "researcher" || t === "R") return "R";
  if (t === "참여자" || lower === "p" || lower === "participant" || t === "P") return "P";
  return null;
}

/** 다음1 형식 — ‘연구자’ / ‘참여자’ 줄 뒤에 발화가 이어지는 평문. */
export function parseTranscriptPlain(text: string): [Who, string][] {
  const lines = text.replace(/^\ufeff/, "").split(/\r?\n/);
  const turns: [Who, string][] = [];
  let who: Who | null = null;
  const buf: string[] = [];

  const flush = () => {
    const body = buf.join("\n").trim();
    buf.length = 0;
    if (who && body) turns.push([who, body]);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const role = roleFromToken(line);
    if (role && line.length <= 12) {
      flush();
      who = role;
      continue;
    }
    if (!who) who = "P";
    buf.push(raw.trim());
  }
  flush();
  return turns;
}

function headerIndex(headers: string[], names: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const n of names) {
    const i = lower.indexOf(n.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

function docFromTurns(
  turns: [Who, string][],
  opts: { id?: string; title?: string; kind?: string; meta?: string },
): Doc | null {
  if (!turns.length) return null;
  const id = opts.id || `imp-${Date.now().toString(36)}`;
  const title = opts.title?.trim() || "불러온 전사";
  const kind = opts.kind?.trim() || "연구자 전사";
  const meta = opts.meta?.trim() || "불러오기";
  return buildDoc(id, title, meta, turns, kind);
}

/** 표 형식 전사 — 발화자+발화 또는 role+text. */
export function parseTranscriptTable(headers: string[], rows: string[][]): Doc[] {
  const hiRole = headerIndex(headers, ["발화자", "role", "who", "화자", "speaker"]);
  const hiText = headerIndex(headers, ["발화", "발화내용", "text", "내용", "transcript"]);
  if (hiRole < 0 || hiText < 0) return [];

  let title = "불러온 전사";
  let kind = "연구자 전사";
  let meta = "CSV/Excel";
  const hiTitle = headerIndex(headers, ["자료", "title", "제목"]);
  const hiKind = headerIndex(headers, ["kind", "갈래", "유형"]);
  const hiMeta = headerIndex(headers, ["meta", "메타"]);

  const turns: [Who, string][] = [];
  for (const row of rows) {
    const roleRaw = String(row[hiRole] ?? "").trim();
    const text = String(row[hiText] ?? "").trim();
    if (!text) continue;
    if (hiTitle >= 0 && row[hiTitle]) title = String(row[hiTitle]).trim() || title;
    if (hiKind >= 0 && row[hiKind]) kind = String(row[hiKind]).trim() || kind;
    if (hiMeta >= 0 && row[hiMeta]) meta = String(row[hiMeta]).trim() || meta;
    const who = roleFromToken(roleRaw) ?? (roleRaw.includes("연구") ? "R" : "P");
    turns.push([who, text]);
  }
  const doc = docFromTurns(turns, { title, kind, meta });
  return doc ? [doc] : [];
}

/** 코딩 결과 표 — 자료·문장·코드 열이 있으면 할당을 복원한다. */
export function parseCodingResultTable(headers: string[], rows: string[][], themes: Theme[]): { docs: Doc[]; assign: Assign } {
  const hiDoc = headerIndex(headers, ["자료", "doc", "title", "제목"]);
  const hiWho = headerIndex(headers, ["발화자", "role", "who"]);
  const hiText = headerIndex(headers, ["문장", "text", "발화", "내용"]);
  const hiCode = headerIndex(headers, ["코드", "codes", "code"]);
  if (hiText < 0) return { docs: [], assign: {} };

  const groups = new Map<string, string[][]>();
  for (const row of rows) {
    const docTitle = hiDoc >= 0 ? String(row[hiDoc] ?? "").trim() || "불러온 자료" : "불러온 자료";
    if (!groups.has(docTitle)) groups.set(docTitle, []);
    groups.get(docTitle)!.push(row);
  }

  const docs: Doc[] = [];
  const assign: Assign = {};
  const nameToId = new Map(allCodes(themes).map((c) => [c.name, c.id]));
  let di = 0;

  for (const [title, docRows] of groups) {
    const raw: [Who, string][] = docRows
      .map((row) => {
        const whoRaw = hiWho >= 0 ? String(row[hiWho] ?? "") : "참여자";
        const who = roleFromToken(whoRaw) ?? "P";
        const text = String(row[hiText] ?? "").trim();
        return [who, text] as [Who, string];
      })
      .filter(([, t]) => t);

    const id = `imp-${di++}-${Date.now().toString(36)}`;
    const doc = docFromTurns(raw, { id, title });
    if (!doc) continue;
    docs.push(doc);

    docRows.forEach((row, ri) => {
      const text = String(row[hiText] ?? "").trim();
      const codesRaw = hiCode >= 0 ? String(row[hiCode] ?? "").trim() : "";
      if (!codesRaw || !text) return;
      const seg = doc.segs[ri] ?? doc.segs.find((s) => s.text === text);
      if (!seg) return;
      const ids = codesRaw
        .split(/[;|]/)
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => nameToId.get(n))
        .filter(Boolean) as string[];
      if (ids.length) assign[seg.id] = ids;
    });
  }

  return { docs, assign };
}

function allCodes(themes: Theme[]) {
  return themes.flatMap((t) => t.codes);
}

/** CSV / TSV / 평문 자동 판별. */
export function importCodingFileText(text: string, themes: Theme[], filename?: string): CodingImportResult | null {
  const trimmed = text.replace(/^\ufeff/, "").trim();
  if (!trimmed) return null;

  const baseLabel = (filename || "import").replace(/\.[^.]+$/, "");

  if (!trimmed.includes(",") && /연구자|참여자/.test(trimmed)) {
    const turns = parseTranscriptPlain(trimmed);
    const doc = docFromTurns(turns, { title: baseLabel });
    if (!doc) return null;
    return { docs: [doc], assign: {}, label: filename || "전사.txt" };
  }

  const { headers, rows } = parseCsv(trimmed);
  if (headers.length && rows.length) {
    const hiCode = headerIndex(headers, ["코드", "codes", "code"]);
    if (hiCode >= 0) {
      const { docs, assign } = parseCodingResultTable(headers, rows, themes);
      if (docs.length) return { docs, assign, label: filename || "coding.csv" };
    }
    const docs = parseTranscriptTable(headers, rows);
    if (docs.length) return { docs, assign: {}, label: filename || "transcript.csv" };
  }

  const turns = parseTranscriptPlain(trimmed);
  const doc = docFromTurns(turns, { title: baseLabel });
  if (!doc) return null;
  return { docs: [doc], assign: {}, label: filename || "전사.txt" };
}

export async function importCodingXlsx(file: File, themes: Theme[]): Promise<CodingImportResult | null> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(ws);
  return importCodingFileText(csv, themes, file.name);
}

/** 연구자·참여자 평문 (다음1 형식). */
export function exportTranscriptPlain(doc: Doc): string {
  const blocks = doc.turns.map((t) => `${ROLE_LABEL[t.who]}\n${t.text}`);
  return `\ufeff${blocks.join("\n\n")}`;
}

export function exportTranscriptCsv(doc: Doc): string {
  const rows: string[][] = [["제목", "갈래", "메타", "발화자", "발화"]];
  doc.turns.forEach((t) => {
    rows.push([doc.title, doc.kind, doc.meta, ROLE_LABEL[t.who], t.text]);
  });
  return "\ufeff" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function codingWorkbookSheets(docs: Doc[], themes: Theme[], assign: Assign) {
  const transcript: (string | number)[][] = [["제목", "갈래", "메타", "발화자", "발화"]];
  docs.forEach((d) =>
    d.turns.forEach((t) => transcript.push([d.title, d.kind, d.meta, ROLE_LABEL[t.who], t.text])),
  );

  const coded: (string | number)[][] = [["자료", "발화자", "문장", "코드"]];
  docs.forEach((d) =>
    d.segs.forEach((s) =>
      coded.push([
        d.title,
        s.who === "R" ? "연구자" : "참여자",
        s.text,
        (assign[s.id] ?? []).map((id) => codeById(themes, id)?.name ?? id).join("; "),
      ]),
    ),
  );

  return [
    { name: "전사", aoa: transcript },
    { name: "코딩", aoa: coded },
  ];
}
