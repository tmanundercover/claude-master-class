import { cp, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { renderPage, publicPageData } from "../dist/server/entry-server.js";

import { buildStandardResume } from "./build-standard-resume.mjs";

const hosting = "dist/hosting";
await rm(hosting, { recursive: true, force: true });
await mkdir(hosting, { recursive: true });
await cp("dist/client/assets", join(hosting, "assets"), { recursive: true });
await cp("src/assets/mail-icons", join(hosting, "email-icons"), { recursive: true });
const template = await readFile("dist/client/index.html", "utf8");
await writeFile(join(hosting, "index.html"), renderPage(template, publicPageData()));
try {
  await access("public/profile-photo.jpg");
  await cp("public/profile-photo.jpg", join(hosting, "profile-photo.jpg"));
} catch (error) { if (error.code !== "ENOENT") throw error; }

await buildStandardResume(hosting);

// Package only the server runtime and its template; all dependencies live in functions/package.json.
await rm("functions/dist", { recursive: true, force: true });
await mkdir("functions/dist/client", { recursive: true });
await cp("dist/server", "functions/dist/server", { recursive: true });
await cp("dist/client/index.html", "functions/dist/client/index.html");
await cp("dist/hosting/resume.pdf", "functions/dist/standard-resume.pdf");
try { await cp('public/profile-photo.jpg', 'functions/dist/profile-photo.jpg'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await cp("src/assets/mail-icons", "functions/dist/pdf-icons", { recursive: true });
await rm("functions/public", { recursive: true, force: true });
try {
  await access("public/interview");
  await cp("public/interview", "functions/public/interview", { recursive: true });
} catch (error) { if (error.code !== "ENOENT") throw error; }
console.log("Firebase Hosting frontend and Functions backend prepared.");
