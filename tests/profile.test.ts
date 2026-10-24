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
  }>;
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
