import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = path.resolve("scripts/apply-home-curiosities-content-adjustments.mjs");
const tempPath = path.resolve("scripts/.apply-home-curiosities-content-adjustments.tmp.mjs");

let script = fs.readFileSync(sourcePath, "utf8");

script = script.replace("text\\[#e74c3c\\]", "text-\\[#e74c3c\\]");

const heroBlock = String.raw`replaceOnce(
  "hero attendance handler",
  /  return \(\r?\n    <section data-home-section="hero"/,
  \
  async function handleAttendanceIntent() {
    window.sessionStorage.setItem("hc-attendance-intent", "yes");
    if (!auth.loggedIn || !auth.userId) {
      navigate("claim-profile");
      return;
    }
    setAttendanceState("saving");
    try {
      await saveMyPublicProfile(auth.userId, { intends_to_attend: true });
      window.sessionStorage.removeItem("hc-attendance-intent");
      setAttendanceState("saved");
    } catch {
      setAttendanceState("error");
    }
  }

  return (
    <section data-home-section="hero"\
,
);`;

script = script.replace(
  /replaceOnce\(\n  "hero attendance handler",[\s\S]*?\n\);\nreplaceOnce\(\n  "hero secondary CTA"/,
  `${heroBlock}\nreplaceOnce(\n  "hero secondary CTA"`,
);

fs.writeFileSync(tempPath, script, "utf8");
try {
  await import(`${pathToFileURL(tempPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
