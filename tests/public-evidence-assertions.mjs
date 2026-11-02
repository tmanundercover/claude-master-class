import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export async function assertPublicProjectsProtectEvidence(directory) {
  const profile = JSON.parse(await readFile("data/profile.json", "utf8"));
  const html = await readFile(join(directory, "index.html"), "utf8");
  const payload = JSON.parse(html.match(/<script id="page-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.match(html, /Selected projects/);
  assert.ok(!html.includes("Evidence you can discuss"));
  assert.equal(payload.profile.projects.length, profile.projects.length);
  for (const project of payload.profile.projects) assert.equal("evidence" in project, false);
  const files = await readdir(join(directory, "assets"));
  const scripts = await Promise.all(files.filter((file) => file.endsWith(".js")).map((file) => readFile(join(directory, "assets", file), "utf8")));
  for (const [index, project] of profile.projects.entries()) {
    assert.equal(html.includes(project.evidence), false, `Project ${index} notes leaked in public HTML or search data`);
    for (const source of scripts) assert.equal(source.includes(project.evidence), false, `Project ${index} notes leaked in a public script`);
  }
}
