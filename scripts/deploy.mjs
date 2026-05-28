// Baut die App mit korrektem GitHub-Pages-Basis-Pfad und veroeffentlicht
// den Inhalt von dist/ auf dem gh-pages-Branch.  Aufruf:  npm run deploy
import { execSync } from "node:child_process";
import { writeFileSync, copyFileSync, rmSync } from "node:fs";

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const out = (cmd) => execSync(cmd).toString().trim();

const url = out("git config --get remote.origin.url");
if (!url) {
  console.error("Kein git-Remote 'origin' gefunden. Bitte zuerst ein GitHub-Repo verbinden.");
  process.exit(1);
}
const repo = (url.match(/([^/]+?)(\.git)?$/) || [])[1] || "app";
const base = `/${repo}/`;
const name = (() => {
  try {
    return out("git config user.name") || "deploy";
  } catch {
    return "deploy";
  }
})();
const email = (() => {
  try {
    return out("git config user.email") || "deploy@example.com";
  } catch {
    return "deploy@example.com";
  }
})();

console.log(`\n→ Build mit Basis-Pfad ${base}`);
run("node scripts/gen-icons.mjs");
run("npx tsc -b");
run("npx vite build", { env: { ...process.env, BASE_PATH: base } });

// SPA-Fallback fuer Deep-Links + Jekyll deaktivieren
copyFileSync("dist/index.html", "dist/404.html");
writeFileSync("dist/.nojekyll", "");

console.log("\n→ Veroeffentliche auf gh-pages …");
rmSync("dist/.git", { recursive: true, force: true });
run("git init -q", { cwd: "dist" });
run("git checkout -q -b gh-pages", { cwd: "dist" });
run("git add -A", { cwd: "dist" });
run(`git -c user.name="${name}" -c user.email="${email}" commit -q -m "Deploy"`, { cwd: "dist" });
run(`git push -q -f ${url} gh-pages`, { cwd: "dist" });
rmSync("dist/.git", { recursive: true, force: true });

console.log(`\n✓ Fertig. Live in ~1 Minute unter https://<user>.github.io${base}`);
