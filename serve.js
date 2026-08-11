// saas/out 정적 export 검증용 서버. 사용: node serve.js [port]
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "out");
const PORT = process.argv[2] || 4174;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };
http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  // SPA/PWA: /home · /dashboard 등 클라이언트 라우트는 index로 폴백 (모바일 홈화면 404 방지)
  const spa = !path.extname(p) || p.endsWith("/");
  if (p === "/" || p === "/home" || p === "/home/" || p === "/dashboard" || p === "/dashboard/" || p === "/index.html") p = "/index.html";
  let fp = path.join(ROOT, p);
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, "index.html");
  if (!fs.existsSync(fp)) {
    const alt = fp + ".html";
    if (fs.existsSync(alt)) fp = alt;
    else if (spa) fp = path.join(ROOT, "index.html");
    else fp = path.join(ROOT, "index.html");
  }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`methodos SaaS (export) → http://localhost:${PORT}`));
