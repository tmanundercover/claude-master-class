import test from "node:test";
import ts from "typescript";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { assertPublicProjectsProtectEvidence } from "./public-evidence-assertions.mjs";

const config = JSON.parse(await readFile("firebase.json", "utf8"));
const html = await readFile("dist/hosting/index.html", "utf8");

test("Hosting keeps project evidence out of public HTML, search data, and scripts", async () => {
  await assertPublicProjectsProtectEvidence("dist/hosting");
});

test("Hosting serves the rendered public portfolio and rewrites dynamic requests to Functions", () => {
  assert.equal(config.hosting.public, "dist/hosting");
  assert.deepEqual(config.hosting.rewrites, [{ source: "**", function: { functionId: "portfolioApp", region: "us-central1", pinTag: true } }]);
  assert.match(html, /<h1>Fullstack engineer and AI-driven product builder/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /src="\/assets\//);
});

test("Hosting has no private route files that could bypass Functions authorization", async () => {
  const entries = await readdir("dist/hosting");
  assert.ok(entries.every((entry) => ["assets", "email-icons", "index.html", "profile-photo.jpg", "resume.pdf"].includes(entry)));
  const icons = await readdir("dist/hosting/email-icons");
  assert.deepEqual(icons.sort(), (await readdir("src/assets/mail-icons")).sort());
  for (const icon of icons) {
    assert.match(icon, /^[a-z0-9-]+\.png$/);
    const bytes = await readFile(join("dist/hosting/email-icons", icon));
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  }
  assert.equal(/"responses":|"experiences":|"page":"resume"/.test(html), false);
  const files = await readdir("dist/hosting/assets");
  for (const filename of files.filter((file) => file.endsWith(".js"))) {
    const source = await readFile(join("dist/hosting/assets", filename), "utf8");
    assert.equal(/Local correspondence|Local attachment only|fixture-owner|createHmac|readSessionRole|Sanity homepage archive|Situation:|process\.env\.AI_/.test(source), false, `Private content found in ${filename}`);
  }
});

test("Functions package is self-contained and declares its runtime dependencies and environment configuration", async () => {
  const pkg = JSON.parse(await readFile("functions/package.json", "utf8"));
  assert.equal(pkg.engines.node, "22");
  for (const dependency of ["express", "firebase-functions", "react", "react-dom", "openai", "@anthropic-ai/sdk", "@google/genai", "motion", "@fortawesome/free-brands-svg-icons", "simple-icons", "resend", "sanitize-html"]) assert.ok(pkg.dependencies[dependency]);
  await access("functions/dist/server/entry-server.js");
  await access("functions/dist/client/index.html");
  const app = await readFile("functions/app.mjs", "utf8");
  assert.equal(/\.listen\(|ssrLoadModule|createServer/.test(app), false, "Functions owns the runtime; no standalone server");
  assert.match(app, /request\.rawBody/);
  const entry = await readFile("functions/index.mjs", "utf8");
  assert.equal(/defineSecret|defineJsonSecret|secretEnvironmentVariables|\bsecrets\s*:/.test(entry), false);
  for (const name of ["SITE_PASSWORD", "INTERVIEW_PASSWORD", "SESSION_SECRET"]) assert.ok(!entry.includes(name));
  const server = await readFile("functions/dist/server/entry-server.js", "utf8");
  const moduleSyntax = ts.createSourceFile("entry-server.js", server, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  for (const statement of moduleSyntax.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) continue;
    const name = specifier.text;
    if (name.startsWith(".")) continue;
    if (name.startsWith("node:")) continue;
    const packageName = name.startsWith("@") ? name.split("/").slice(0, 2).join("/") : name.split("/")[0];
    assert.ok(pkg.dependencies[packageName], `Missing deployed dependency: ${packageName}`);
  }
  assert.match(server, /__session/);
  const module = await import("../functions/index.mjs");
  assert.equal(typeof module.portfolioApp, "function");
  assert.deepEqual(module.portfolioApp.__endpoint.secretEnvironmentVariables ?? [], []);
});

test("standard PDF is public, valid, and identical to the packaged email fallback", async () => {
  const publicPdf = await readFile("dist/hosting/resume.pdf");
  assert.equal(publicPdf.subarray(0, 5).toString(), "%PDF-");
  assert.deepEqual(publicPdf, await readFile("functions/dist/standard-resume.pdf"));
  assert.match(html, /Download résumé \(PDF\)/);
  assert.match(html, /href="\/resume.pdf"/);
});

test('the public portrait fallback is packaged while Firebase HTML uses the stored photo endpoint', async () => {
  const portrait = await readFile('public/profile-photo.jpg');
  assert.deepEqual(await readFile('dist/hosting/profile-photo.jpg'), portrait);
  assert.deepEqual(await readFile('functions/dist/profile-photo.jpg'), portrait);
  assert.match(html, /src="\/api\/profile-photo"/);
});
