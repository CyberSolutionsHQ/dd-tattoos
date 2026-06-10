const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const resolvePath = (urlPath) => {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0]);
  let normalized = path.posix.normalize(clean).replace(/^(\.\.(\/|\\|$))+/, "/");
  if (normalized === "/" || normalized === "") normalized = "/index.html";
  if (normalized.endsWith("/")) normalized += "index.html";
  return path.join(rootDir, normalized);
};

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Dungeon Dweller Tattoos site running at http://127.0.0.1:${port}`);
});
