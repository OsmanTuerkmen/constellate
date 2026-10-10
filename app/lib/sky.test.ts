import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { matchStars, project, type Sky } from "./sky";

const sky = JSON.parse(readFileSync(join(import.meta.dirname, "..", "public", "world", "sky.json"), "utf8")) as Sky;

test("project returns two finite numbers per star", () => {
  const out = project(sky, 0.3, 800, 600);
  assert.equal(out.length, 2 * sky.ids.length);
  assert.ok(out.every((v) => Number.isFinite(v)));
});

test("projected stars stay roughly on the canvas", () => {
  const out = project(sky, 1.2, 800, 600);
  let inside = 0;
  for (let i = 0; i < out.length; i += 2) if (out[i] >= 0 && out[i] <= 800 && out[i + 1] >= 0 && out[i + 1] <= 600) inside++;
  assert.ok(inside / sky.ids.length > 0.9);
});

test("matchStars finds Krabbe", () => {
  assert.equal(matchStars(sky, ["MONDO:0009499"]).length, 1);
  assert.equal(matchStars(sky, ["NOPE"]).length, 0);
});
