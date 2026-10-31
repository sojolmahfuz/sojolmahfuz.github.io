import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "cms-data.json");
const messagesFile = path.join(dataDir, "messages.json");
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

function readJsonFile(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (err) {
    console.warn("JSON read error:", filePath, err.message);
  }
  return defaultValue;
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

http.createServer(async (req, res) => {
  const urlParts = (req.url || "/").split("?");
  const urlPath = decodeURIComponent(urlParts[0]);
  const queryString = urlParts[1] || "";
  const queryParams = new URLSearchParams(queryString);

  // Set CORS headers so local testing and cross-origin tools function smoothly
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Database Health & Status Endpoint
  if (urlPath === "/api/db/status" && req.method === "GET") {
    const messages = readJsonFile(messagesFile, []);
    const cmsExists = fs.existsSync(dataFile);
    const cmsStat = cmsExists ? fs.statSync(dataFile) : { size: 0 };
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({
      ok: true,
      provider: "Neural.NodeDatabase",
      status: "connected",
      storage: "local_disk_json",
      messagesCount: messages.length,
      unreadCount: messages.filter((m) => !m.read).length,
      cmsSize: cmsStat.size,
      updatedAt: new Date().toISOString()
    }));
    return;
  }

  // 2. Dedicated Messages Database REST API
  if (urlPath === "/api/messages") {
    const messages = readJsonFile(messagesFile, []);

    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify(messages));
      return;
    }

    if (req.method === "POST") {
      try {
        const body = await parseRequestBody(req);
        const name = String(body.name || "Anonymous").trim();
        const email = String(body.email || "").trim();
        const topic = String(body.topic || "General Inquiry").trim();
        const message = String(body.message || "").trim();

        if (!name || !message) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "Name and message are required." }));
          return;
        }

        const newEntry = {
          id: "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          name,
          email,
          topic,
          message,
          createdAt: new Date().toISOString(),
          read: false,
          starred: false
        };

        messages.unshift(newEntry);
        writeJsonFile(messagesFile, messages);

        // Also sync into cms-data.json messages array if file exists
        if (fs.existsSync(dataFile)) {
          const cmsData = readJsonFile(dataFile, {});
          if (!Array.isArray(cmsData.messages)) cmsData.messages = [];
          cmsData.messages.unshift(newEntry);
          writeJsonFile(dataFile, cmsData);
        }

        res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, message: newEntry }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: err.message || "Invalid payload" }));
      }
      return;
    }

    if (req.method === "PATCH") {
      try {
        const body = await parseRequestBody(req);
        const id = body.id || queryParams.get("id");
        const idx = messages.findIndex((m) => m.id === id);
        if (idx === -1) {
          res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "Message not found" }));
          return;
        }

        if (typeof body.read === "boolean") messages[idx].read = body.read;
        if (typeof body.starred === "boolean") messages[idx].starred = body.starred;
        writeJsonFile(messagesFile, messages);

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, message: messages[idx] }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (req.method === "DELETE") {
      try {
        const body = await parseRequestBody(req).catch(() => ({}));
        const id = body.id || queryParams.get("id");
        const filtered = messages.filter((m) => m.id !== id);
        writeJsonFile(messagesFile, filtered);

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, deletedId: id }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }
  }

  // 3. Persistent JSON API for NEURAL.CMS Admin Command Deck
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
      try {
        const parsed = await parseRequestBody(req);
        writeJsonFile(dataFile, parsed);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
      }
      return;
    }
  }

  // 4. One-Click Git Commit & Push to GitHub Pages
  if (urlPath === "/api/cms/publish" && req.method === "POST") {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const gitCmd = `git add "data/cms-data.json" "data/messages.json" && git commit -m "NeuralCMS update: ${timestamp}" && git push origin main`;

    exec(gitCmd, { cwd: root }, (error, stdout, stderr) => {
      if (error) {
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

  // 5. Static File Serving
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
  console.log(`Database Endpoints:`);
  console.log(` - GET/POST/PATCH/DELETE /api/messages`);
  console.log(` - GET/POST /api/cms`);
  console.log(` - GET /api/db/status`);
});
