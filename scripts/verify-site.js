const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const htmlFiles = [];
const missing = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
};

const localAssetPath = (file, href) => {
  if (!href || href.startsWith("#") || /^[a-z]+:/i.test(href) || href.startsWith("//")) return null;
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return null;
  return path.resolve(path.dirname(file), clean);
};

walk(rootDir);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const refs = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const ref of refs) {
    const target = localAssetPath(file, ref);
    if (target && !fs.existsSync(target)) {
      missing.push(`${path.relative(rootDir, file)} -> ${ref}`);
    }
  }
}

if (missing.length) {
  console.error("Missing local assets or links:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Verified ${htmlFiles.length} HTML files and local asset references.`);
