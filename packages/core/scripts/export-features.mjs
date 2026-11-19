import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const relScript = `
import { PRODUCT_FEATURES, WORKFLOW_FEATURES, WORKFLOWS } from './src/index.ts';
console.log(JSON.stringify({ product: PRODUCT_FEATURES, workflows: WORKFLOW_FEATURES, count: WORKFLOWS.length }, null, 2));
`;

const r = spawnSync("npx", ["--yes", "tsx", "-e", relScript], { cwd: root, encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status || 1);
}
const jsonOut = r.stdout.trim();
const outDir = join(root, "dist");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "features.json"), jsonOut + "\n");
const market = join(root, "../../market-site/public/assets/data");
mkdirSync(market, { recursive: true });
writeFileSync(join(market, "features.json"), jsonOut + "\n");
console.log("Wrote packages/core/dist/features.json and market-site/public/assets/data/features.json");
