import { cp, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { renderPage, publicPageData } from "../dist/server/entry-server.js";

import { buildStandardResume } from "./build-standard-resume.mjs";

const destination = "dist/pages";
await rm(destination, { recursive: true, force: true });
await cp("dist/client", destination, { recursive: true });
const template = await readFile("dist/client/index.html", "utf8");
await writeFile(join(destination, "index.html"), renderPage(template, publicPageData()));
await writeFile(join(destination, "404.html"), renderPage(template, { page: "not-found" }));
await writeFile(join(destination, ".nojekyll"), "");
// Explicit public asset allowlist. Private recordings and data never enter the export.
try {
  await access("public/profile-photo.jpg");
  await cp("public/profile-photo.jpg", join(destination, "profile-photo.jpg"));
} catch (error) { if (error.code !== "ENOENT") throw error; }
for (const route of ["login", "interview", "dashboard", "dashboard/resume", "dashboard/inbox", "dashboard/jobs", "dashboard/fit-analyzer", "dashboard/cover-letter", "dashboard/career-plan", "dashboard/resume-tailor"]) {
  const directory = join(destination, route);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), renderPage(template, { page: "static-unavailable" }));
}
await buildStandardResume(destination);
console.log(`Public GitHub Pages export written to ${destination}`);
