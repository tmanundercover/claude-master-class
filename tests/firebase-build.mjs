import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";

const config = JSON.parse(await readFile("firebase.json", "utf8"));
const html = await readFile("dist/hosting/index.html", "utf8");

test("Hosting serves the rendered public portfolio and rewrites dynamic requests to Functions", () => {
  assert.equal(config.hosting.public, "dist/hosting");
  assert.deepEqual(config.hosting.rewrites, [{ source: "**", function: { functionId: "portfolioApp", region: "us-central1", pinTag: true } }]);
  assert.match(html, /<h1>Fullstack engineer and AI-driven product builder/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /src="\/assets\//);
});

test("Hosting has no private route files that could bypass Functions authorization", async () => {
  const entries = await readdir("dist/hosting");
  assert.ok(entries.every((entry) => ["assets", "index.html", "profile-photo.jpg"].includes(entry)));
  assert.equal(/"responses":|"experiences":|"page":"resume"/.test(html), false);
  const files = await readdir("dist/hosting/assets");
  for (const filename of files.filter((file) => file.endsWith(".js"))) {
    const source = await readFile(join("dist/hosting/assets", filename), "utf8");
    assert.equal(/createHmac|readSessionRole|Sanity homepage archive|Situation:|process\.env\.AI_/.test(source), false, `Private content found in ${filename}`);
  }
});

test("Functions package is self-contained and declares its runtime dependencies and secrets", async () => {
  const pkg = JSON.parse(await readFile("functions/package.json", "utf8"));
  assert.equal(pkg.engines.node, "22");
  for (const dependency of ["express", "firebase-functions", "react", "react-dom", "openai", "@anthropic-ai/sdk", "@google/genai", "motion", "@fortawesome/free-brands-svg-icons", "simple-icons"]) assert.ok(pkg.dependencies[dependency]);
  await access("functions/dist/server/entry-server.js");
  await access("functions/dist/client/index.html");
  const app = await readFile("functions/app.mjs", "utf8");
  assert.equal(/\.listen\(|ssrLoadModule|createServer/.test(app), false, "Functions owns the runtime; no standalone server");
  assert.match(app, /request\.rawBody/);
  const entry = await readFile("functions/index.mjs", "utf8");
  assert.ok(entry.includes("AI_API_KEY"));
  for (const name of ["SITE_PASSWORD", "INTERVIEW_PASSWORD", "SESSION_SECRET"]) assert.ok(!entry.includes(name));
  const server = await readFile("functions/dist/server/entry-server.js", "utf8");
  for (const match of server.matchAll(/from "([^".][^"]*)"/g)) {
    const name = match[1];
    if (name.startsWith("node:")) continue;
    const packageName = name.startsWith("@") ? name.split("/").slice(0, 2).join("/") : name.split("/")[0];
    assert.ok(pkg.dependencies[packageName], `Missing deployed dependency: ${packageName}`);
  }
  assert.match(server, /__session/);
  const module = await import("../functions/index.mjs");
  assert.equal(typeof module.portfolioApp, "function");
});
