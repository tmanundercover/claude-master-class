import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { renderPage } from "../dist/server/entry-server.js";
import { assertPublicProjectsProtectEvidence } from "./public-evidence-assertions.mjs";

const directory = "dist/pages";
const html = await readFile(join(directory, "index.html"), "utf8");
const profile = JSON.parse(await readFile("data/profile.json", "utf8"));

test("Pages keeps project evidence out of public HTML, search data, and scripts", async () => {
  await assertPublicProjectsProtectEvidence(directory);
});

test("Pages contains rendered portfolio content, crawler metadata, and hydration data", () => {
  assert.ok(html.includes(profile.name));
  assert.ok(html.includes(profile.headline));
  assert.match(html, /<title>James Terrell Singleton/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /id="page-data" type="application\/json">\{"page":"home"/);
  assert.ok(!html.includes("<!--app-"));
  assert.match(html, /Message delivery is unavailable on this static site/);
});

test("Pages internal links and assets respect the configured base path", async () => {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  const script = scripts.find((src) => src.includes("/assets/"));
  assert.ok(script);
  const base = script.slice(0, script.indexOf("assets/"));
  assert.ok(html.includes(`href="${base}#projects"`));
  assert.ok(html.includes(`href="${base}login"`));
  await readFile(join(directory, "assets", script.split("/").at(-1)));
  const css = html.match(/<link[^>]+href="([^"]+\.css)"/)?.[1];
  assert.ok(css?.startsWith(base));
  await readFile(join(directory, "assets", css.split("/").at(-1)));
});

test("static private routes show availability and never embed private page data", async () => {
  for (const route of ["login", "interview", "dashboard", "dashboard/resume", "dashboard/inbox", "dashboard/jobs", "dashboard/fit-analyzer", "dashboard/cover-letter", "dashboard/career-plan", "dashboard/resume-tailor"]) {
    const page = await readFile(join(directory, route, "index.html"), "utf8");
    assert.match(page, /The private workspace needs Firebase Functions/);
    assert.match(page, /"page":"static-unavailable"/);
    assert.ok(!page.includes('id="password"'));
    assert.ok(!page.includes('id="jd"'));
    assert.ok(!page.includes('"responses":'));
    assert.ok(!page.includes('"experiences":'));
  }
});

test("Pages artifact excludes private data, server code, environment files, and recordings", async () => {
  async function files(path) {
    const entries = await readdir(path, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(path, entry.name)) : join(path, entry.name)))).flat();
  }
  for (const path of await files(directory)) {
    assert.doesNotMatch(path, /(?:entry-server|\.env|\.mp4|\.zip|snapshot|\.map$)/);
    if (path.endsWith(".js")) {
      const source = await readFile(path, "utf8");
      assert.equal(/Local correspondence|Local attachment only|fixture-owner|createHmac|readSessionRole|process\.env\.(?:AI_|SITE_PASSWORD|SESSION_SECRET)|Sanity homepage archive|Situation:/.test(source), false, `Private data found in ${path}`);
    }
  }
});

test("serialized page data cannot terminate its JSON script element", () => {
  const attack = '</script><script>alert("injected")</script>';
  const template = '<head><!--app-head--></head><div><!--app-html--></div><script type="application/json"><!--app-data--></script>';
  const result = renderPage(template, { page: "tool", id: attack });
  assert.ok(!result.includes(attack));
  assert.match(result, /\\u003c\/script>/);
});

test("standard PDF and its download respect the Pages base path", async () => {
  const pdf = await readFile(join(directory, "resume.pdf"));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  const script = html.match(/<script[^>]+src="([^"]+assets\/[^"]+)"/)?.[1];
  const base = script.slice(0, script.indexOf("assets/"));
  assert.ok(html.includes(`href="${base}resume.pdf"`));
});

test('Pages bundles the approved portrait with a base-path-aware image URL', async () => {
  const script = html.match(/<script[^>]+src="([^"]+assets\/[^"]+)"/)?.[1];
  const base = script.slice(0, script.indexOf('assets/'));
  assert.ok(html.includes(`src="${base}profile-photo.jpg"`));
  assert.ok(!html.includes('src="/api/profile-photo"'));
  assert.deepEqual(await readFile(join(directory, 'profile-photo.jpg')), await readFile('public/profile-photo.jpg'));
});
