import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "cms-data.json");
const port = Number(process.env.PORT) || 4173;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

  // 1. One-Click Git Commit & Push to GitHub Pages
  if (urlPath === "/api/cms/publish" && req.method === "POST") {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const gitCmd = `git add "data/cms-data.json" && git commit -m "NeuralCMS update: ${timestamp}" && git push origin main`;

    exec(gitCmd, { cwd: root }, (error, stdout, stderr) => {
      if (error) {
        // If nothing to commit, it's still considered synced
        if ((stdout + stderr).includes("nothing to commit")) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: true, message: "Already up to date on GitHub main branch.", output: stdout }));
          return;
        }
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: stderr || error.message }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true, message: "Successfully committed & pushed live to GitHub Pages!", output: stdout }));
    });
    return;
  }

  // 2. Persistent JSON API for NEURAL.CMS Admin Command Deck
  if (urlPath === "/api/cms") {
    if (req.method === "GET") {
      if (fs.existsSync(dataFile)) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        res.end(fs.readFileSync(dataFile, "utf8"));
      } else {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        res.end("{}");
      }
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) req.destroy();
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          fs.mkdirSync(dataDir, { recursive: true });
          fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), "utf8");
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
        }
      });
      return;
    }
  }

  const safe = path.normalize(urlPath === "/" ? "/index.html" : urlPath).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(root, safe);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const headers = { "Content-Type": mime[ext] || "application/octet-stream" };
  if (ext === ".json") {
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`NEURAL.OS + CMS Server running at http://localhost:${port}`);
  console.log(`Admin Command Deck: http://localhost:${port}/admin.html`);
});
