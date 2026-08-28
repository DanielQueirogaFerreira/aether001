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

const shellPath = findShell(src);
if (!shellPath) {
  console.error("no prerendered shell HTML found under", src);
  process.exit(1);
}

let html = readFileSync(shellPath);
html = Buffer.from(html.toString("utf8").replace(/\u0000/g, ""));
const text = html.toString("utf8");
const looksLikeStart =
  text.includes("$_TSR") &&
  text.includes("type=\"module\"") &&
  text.length > 800;

if (!looksLikeStart) {
  console.error("prerendered HTML is not a TanStack Start document");
  console.error(text.slice(0, 800));
  process.exit(1);
}

if (src !== dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (name === ".html") continue;
    cpSync(join(src, name), join(dest, name), { recursive: true });
  }
}

writeFileSync(join(dest, "index.html"), html);
writeFileSync(join(dest, "404.html"), html);
writeFileSync(join(dest, ".nojekyll"), "");

const stray = join(dest, ".html");
if (existsSync(stray)) rmSync(stray);

console.log(
  `froze ${shellPath} → ${join(dest, "index.html")} (${html.length} bytes)`,
);
if (existsSync(join(dest, "assets"))) {
  console.log("assets", readdirSync(join(dest, "assets")).join(", "));
}
