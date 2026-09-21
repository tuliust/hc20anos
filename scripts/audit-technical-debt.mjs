import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const APP_PATH = path.join(ROOT, "src/app/App.tsx");
const BUILD_DIR = path.join(ROOT, "build");
const TRANSFORMS = [
  "buyerOrdersSharedRouteTransform.mjs",
  "photoUploadYearInputTransform.mjs",
  "productionReadinessTransform.mjs",
  "profileClaimIdentityTransform.mjs",
  "profileClaimProfileAiTransform.mjs",
  "sourceLineEndingNormalizationTransform.mjs",
];

const errors = [];
for (const file of TRANSFORMS) {
  const source = fs.readFileSync(path.join(BUILD_DIR, file), "utf8");
  if (!source.includes('"./transformUtils.mjs"')) {
    errors.push(`${file} must import the shared transform utilities`);
  }
  if (/function\s+replaceRequired\s*\(/.test(source)) {
    errors.push(`${file} reintroduced a local replaceRequired implementation`);
  }
  if (/function\s+replaceRangeRequired\s*\(/.test(source)) {
    errors.push(`${file} reintroduced a local replaceRangeRequired implementation`);
  }
}

const appSource = fs.readFileSync(APP_PATH, "utf8");
const appBytes = Buffer.byteLength(appSource, "utf8");
const appLines = appSource.split(/\r?\n/).length;

if (errors.length) {
  console.error("Technical-debt audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Technical-debt audit passed: ${TRANSFORMS.length} transforms share utilities.`);
console.log(`App.tsx baseline: ${appBytes} bytes / ${appLines} lines (informational; no size gate).`);
