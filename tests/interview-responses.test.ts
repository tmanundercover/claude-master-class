import { test } from "node:test";
import assert from "node:assert/strict";
import { interviewResponses } from "../src/lib/interview-responses.ts";

test("interview responses have unique media ids and complete evidence metadata", () => {
  assert.equal(new Set(interviewResponses.map((response) => response.id)).size, interviewResponses.length);
  for (const response of interviewResponses) {
    assert.match(response.question, /[?.]$/);
    assert.ok(response.summary.length > 30);
    assert.ok(response.transcript.includes("Situation:"));
    assert.ok(response.transcript.includes("Task:"));
    assert.ok(response.transcript.includes("Action:"));
    assert.ok(response.transcript.includes("Result:"));
    assert.ok(response.technologies.length > 0);
    assert.ok(response.experience.role);
    assert.ok(response.experience.organization);
    assert.ok(response.experience.description.length > 40);
    assert.ok(response.experience.bullets.length >= 3);
    assert.ok(response.experience.bullets.every((bullet) => bullet.length > 30));
    assert.equal(response.videoSrc, `/interview/${response.id}.mp4`);
  }
});
