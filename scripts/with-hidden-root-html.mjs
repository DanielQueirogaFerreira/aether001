import { spawn } from "node:child_process";
import { existsSync, renameSync } from "node:fs";

const files = ["index.html", "404.html"];
const hidden = [];
let restored = false;

for (const file of files) {
  if (!existsSync(file)) continue;
  renameSync(file, `${file}.bak`);
  hidden.push(file);
}

function restore() {
  if (restored) return;
  restored = true;
  for (const file of hidden) {
    if (existsSync(`${file}.bak`)) renameSync(`${file}.bak`, file);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  restore();
  console.error("usage: with-hidden-root-html.mjs <command> [...args]");
  process.exit(1);
}

const child = spawn(args[0], args.slice(1), {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => {
  restore();
  process.exit(code ?? 1);
});
child.on("error", (err) => {
  restore();
  console.error(err);
  process.exit(1);
});
process.on("SIGINT", () => {
  restore();
  process.exit(130);
});
