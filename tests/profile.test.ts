import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profile = JSON.parse(
  readFileSync(new URL("../data/profile.json", import.meta.url), "utf8"),
) as {
  experience: Array<{
    title: string;
    organization: string;
    bullets: string[];
    skills: string[];
    tags: string[];
    employmentType: string;
  }>;
  skills: Record<string, string[]>;
};

test("every homepage experience includes detailed résumé bullets", () => {
  assert.ok(profile.experience.length > 0);

  for (const experience of profile.experience) {
    assert.ok(
      experience.bullets.length >= 3,
      `${experience.title} at ${experience.organization} needs at least three bullets`,
    );
    assert.ok(experience.bullets.every((bullet) => bullet.length > 30));
  }
});

test("position skills use unique labels from the main skills section", () => {
  const labels = new Set(Object.values(profile.skills).flat());
  for (const role of profile.experience) {
    assert.ok(["consulting", "full-time"].includes(role.employmentType));
    assert.ok(role.skills.length > 0 || role.tags.length > 0, `${role.organization} needs technology or contextual metadata`);
    assert.equal(new Set(role.skills).size, role.skills.length);
    for (const skill of role.skills) assert.ok(labels.has(skill), `Unknown position skill: ${skill}`);
  }
});
