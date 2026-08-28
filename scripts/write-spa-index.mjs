import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const dest = process.argv[2] || "dist";
const prefix = (process.argv[3] ?? "").replace(/\/$/, "");

const candidates = [
  join(".vercel", "output", "static"),
  join(".output", "public"),
  dest,
];

const src = candidates.find((dir) => existsSync(dir));
if (!src) {
  console.error("no static output directory found");
  process.exit(1);
}

function findShell(root) {
  const extra = prefix.replace(/^\//, "");
  const names = ["index.html", "_shell.html", "shell.html", ".html"];
  const dirs = [root, extra ? join(root, extra) : null].filter(Boolean);
  for (const dir of dirs) {
    for (const name of names) {
      const p = join(dir, name);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

function rewriteAssetUrls(html, destDir, pathPrefix) {
  const assetsDir = join(destDir, "assets");
  if (!existsSync(assetsDir)) return html;
  const files = readdirSync(assetsDir);
  const css = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
  const js = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
  const routes = files.find((f) => f.startsWith("routes-") && f.endsWith(".js"));
  const base = pathPrefix || "";
  let out = html;
  if (css) {
    out = out.replace(/\/(?:[\w-]+\/)?assets\/styles-[^"' \]]+\.css/g, `${base}/assets/${css}`);
  }
  if (js) {
    out = out.replace(/\/(?:[\w-]+\/)?assets\/index-[^"' \]]+\.js/g, `${base}/assets/${js}`);
  }
  if (routes) {
    out = out.replace(/\/(?:[\w-]+\/)?assets\/routes-[^"' \]]+\.js/g, `${base}/assets/${routes}`);
  }
  return out;
}

const shellPath = findShell(src);
if (!shellPath) {
  console.error("no prerendered shell HTML found under", src);
  process.exit(1);
}

let html = readFileSync(shellPath);
html = Buffer.from(html.toString("utf8").replace(/\u0000/g, ""));

if (src !== dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (name === ".html") continue;
    cpSync(join(src, name), join(dest, name), { recursive: true });
  }
}

let text = rewriteAssetUrls(html.toString("utf8"), dest, prefix);
const looksLikeStart =
  text.includes("$_TSR") &&
  text.includes("type=\"module\"") &&
  text.length > 800;

if (!looksLikeStart) {
  console.error("prerendered HTML is not a TanStack Start document");
  console.error(text.slice(0, 800));
  process.exit(1);
}

writeFileSync(join(dest, "index.html"), text);
writeFileSync(join(dest, "404.html"), text);
writeFileSync(join(dest, ".nojekyll"), "");

const stray = join(dest, ".html");
if (existsSync(stray)) rmSync(stray);

console.log(
  `froze ${shellPath} → ${join(dest, "index.html")} (${text.length} bytes)`,
);
if (existsSync(join(dest, "assets"))) {
  console.log("assets", readdirSync(join(dest, "assets")).join(", "));
}
