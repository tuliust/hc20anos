import fs from "node:fs";

const EXPECTED_NODE = "22.23.2";
const EXPECTED_NPM = "10.9.8";
const EXPECTED_SUPABASE_CLI = "2.109.1";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(fs.readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const nvmrc = fs.readFileSync(new URL("../.nvmrc", import.meta.url), "utf8").trim();

const errors = [];

if (process.versions.node !== EXPECTED_NODE) {
  errors.push(`Node runtime must be ${EXPECTED_NODE}; got ${process.versions.node}`);
}

if (nvmrc !== EXPECTED_NODE) {
  errors.push(`.nvmrc must contain ${EXPECTED_NODE}; got ${nvmrc}`);
}

if (pkg.packageManager !== `npm@${EXPECTED_NPM}`) {
  errors.push(`packageManager must be npm@${EXPECTED_NPM}; got ${pkg.packageManager ?? "<missing>"}`);
}

if (pkg.engines?.node !== EXPECTED_NODE || pkg.engines?.npm !== EXPECTED_NPM) {
  errors.push("package.json engines must match the pinned Node/npm toolchain");
}

if (lock.lockfileVersion !== 3) {
  errors.push(`package-lock.json lockfileVersion must be 3; got ${lock.lockfileVersion}`);
}

if (lock.name !== pkg.name || lock.version !== pkg.version) {
  errors.push("package-lock.json root identity must match package.json name/version");
}

if (pkg.devDependencies?.supabase !== EXPECTED_SUPABASE_CLI) {
  errors.push(`Supabase CLI must remain pinned at ${EXPECTED_SUPABASE_CLI}; got ${pkg.devDependencies?.supabase ?? "<missing>"}`);
}

const lockRoot = lock.packages?.[""];
if (!lockRoot) {
  errors.push("package-lock.json is missing packages['']");
} else {
  if (lockRoot.name !== pkg.name || lockRoot.version !== pkg.version) {
    errors.push("package-lock packages[''] identity does not match package.json");
  }

  if (lockRoot.engines?.node !== EXPECTED_NODE || lockRoot.engines?.npm !== EXPECTED_NPM) {
    errors.push("package-lock root engines do not match package.json");
  }

  for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      const installed = lock.packages?.[`node_modules/${name}`]?.version;
      const lockedSpec = lockRoot[section]?.[name];

      if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(spec)) {
        errors.push(`${section} ${name} is not pinned exactly: ${spec}`);
      }
      if (installed !== spec) {
        errors.push(`${section} ${name}: package.json=${spec}, lock resolved=${installed ?? "<missing>"}`);
      }
      if (lockedSpec !== spec) {
        errors.push(`${section} ${name}: package-lock root spec=${lockedSpec ?? "<missing>"}, package.json=${spec}`);
      }
    }
  }
}

if (errors.length) {
  console.error("Reproducibility audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Reproducibility audit passed (Node ${EXPECTED_NODE}, npm ${EXPECTED_NPM}, lockfile v3).`);
