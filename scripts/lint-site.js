const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const issues = [];
const secretPatterns = [
  /service_role/i,
  /supabase_service_role/i
];

const jwtPattern = /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g;

const decodeJwtPayload = (jwt) => {
  try {
    const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch (err) {
    return null;
  }
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "test-results", "playwright-report"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(html|css|js|md|sql|toml|example|json)$/i.test(entry.name)) continue;
    const text = fs.readFileSync(fullPath, "utf8");
    const rel = path.relative(rootDir, fullPath);
    if (rel === path.join("scripts", "lint-site.js")) continue;

    if (/href=["']#["']/i.test(text)) issues.push(`${rel}: contains href="#"`);
    if (/ð|�/.test(text)) issues.push(`${rel}: contains mojibake replacement text`);
    if (/console\.log\(/.test(text) && !rel.startsWith("scripts")) issues.push(`${rel}: contains console.log`);
    for (const pattern of secretPatterns) {
      if (pattern.test(text) && !rel.endsWith(".sql") && !rel.endsWith(".md")) {
        issues.push(`${rel}: possible frontend secret pattern`);
      }
    }
    for (const match of text.matchAll(jwtPattern)) {
      const payload = decodeJwtPayload(match[0]);
      if (!payload || payload.role !== "anon") {
        issues.push(`${rel}: possible non-anon JWT committed`);
      }
    }
  }
};

walk(rootDir);

if (issues.length) {
  console.error("Lint issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Static lint checks passed.");
