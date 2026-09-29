import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("event settings accepts a legitimately hidden cancelled event", async () => {
  const services = await source("src/lib/services.ts");
  const match = services.match(
    /export async function getEventSettings[\s\S]*?\n\}/
  );

  assert.ok(match, "getEventSettings must exist");
  assert.match(match[0], /\.eq\("slug", slug\)\.maybeSingle\(\)/);
  assert.doesNotMatch(match[0], /\.eq\("slug", slug\)\.single\(\)/);
  assert.match(match[0], /DbEvent \| null/);
});
