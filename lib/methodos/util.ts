export function parseStructural(lines: string[]): Record<string, string[]> {
  const eqs: Record<string, string[]> = {};
  for (const line of lines) {
    if (!line.includes("~")) continue;
    const [y, xs] = [line.slice(0, line.indexOf("~")), line.slice(line.indexOf("~") + 1)];
    const preds = xs.replace(/\+/g, " ").split(/\s+/).map((s) => s.trim()).filter(Boolean);
    const dst = (eqs[y.trim()] ??= []);
    for (const q of preds) if (!dst.includes(q)) dst.push(q);
  }
  return eqs;
}
