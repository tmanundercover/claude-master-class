import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profile = JSON.parse(readFileSync(new URL("../data/profile.json", import.meta.url), "utf8")) as {
  experience: Array<{ title: string; organization: string; bullets: string[]; tags: string[] }>;
  projects: Array<{ title: string; summary: string; evidence: string; skills: string[]; tags: string[]; url?: string; links?: Array<{ label: string; url: string }> }>;
  skills: Record<string, string[]>;
};

const archive = JSON.parse(readFileSync(new URL("../data/sanity-resume-snapshot.json", import.meta.url), "utf8")) as {
  source: { contentScope: string };
  skillsets: Array<{ skills: Array<{ name: string; proficiency: number | null }> }>;
  experiences: Array<{ startDate: string; skills: string[] }>;
  projects: Array<{ title: string; inceptionDate: string; skills: string[] }>;
};

test("the Sanity snapshot is an additive evidence source with the complete normalized archive", () => {
  const skills = archive.skillsets.flatMap((skillset) => skillset.skills);

  assert.match(archive.source.contentScope, /historical self-reported resume evidence/i);
  assert.equal(skills.length, 80);
  assert.equal(new Set(skills.map((skill) => skill.name)).size, 79);
  assert.equal(new Set(skills.filter((skill) => skill.proficiency !== null).map((skill) => skill.name)).size, 60);
  assert.equal(archive.experiences.length, 12);
  assert.equal(archive.projects.length, 9);
});

test("older roles and projects preserve dated technology evidence", () => {
  const earliestRole = archive.experiences.map((experience) => experience.startDate).sort()[0];
  const reactDates = [
    ...archive.experiences.filter((experience) => experience.skills.includes("React.js")).map((experience) => experience.startDate),
    ...archive.projects.filter((project) => project.skills.includes("React.js")).map((project) => project.inceptionDate),
  ].sort();

  assert.equal(earliestRole, "2004-11-01");
  assert.equal(reactDates[0], "2017-01-01");
  assert.ok(archive.projects.some((project) => project.title === "JamWorks 24/7 Shopify Store"));
});

test("the current résumé remains intact alongside the archive", () => {
  const currentSkills = Object.values(profile.skills).flat();

  assert.equal(profile.experience.length, 16);
  assert.equal(profile.projects.length, 13);
  assert.ok(profile.experience.some((experience) => experience.title === "Automation Engineer" && experience.organization === "MTC Art Studios"));
  assert.ok(profile.projects.some((project) => project.title === "White-label application generator"));
  assert.ok(currentSkills.includes("React"));
  assert.ok(profile.experience.some(role => role.tags.includes("Prompt engineering")));
  assert.ok(currentSkills.includes("OpenAI Codex"));
  assert.ok(currentSkills.includes("Google Gemini"));
  assert.ok(currentSkills.includes("Google Forms Integrations"));
  assert.ok(currentSkills.includes("Wix Automations"));
  assert.ok(currentSkills.includes("n8n"));
  const questionnaire = profile.projects.find((project) => project.title === "Dorothea Project questionnaire publishing");
  assert.ok(questionnaire?.skills.includes("Google Forms"));
  assert.ok(questionnaire?.skills.includes("Google Sheets"));
});

test("the consolidated résumé adds recent consulting without losing earlier work", () => {
  const organizations = profile.experience.map((experience) => experience.organization);
  const projectTitles = profile.projects.map((project) => project.title);

  for (const organization of ["Addition, Inc.", "Dorothea Project", "Black Workers Together", "Chef Jamie G"]) {
    assert.ok(organizations.includes(organization), `${organization} consulting experience is missing`);
  }
  for (const organization of ["Northrop Grumman", "Cybercore Technologies", "Raytheon Company", "L-3 Communications"]) {
    assert.ok(organizations.includes(organization), `${organization} historical experience was removed`);
  }
  for (const project of ["Time Allocation by Percentage", "Dorothea Project questionnaire publishing", "Black Workers Together website", "AI Code Generation"]) {
    assert.ok(projectTitles.includes(project), `${project} is missing from the consolidated projects`);
  }
});

test("published project links point to their specific experiences", () => {
  const urls = new Map(profile.projects.map((project) => [project.title, project.url]));

  assert.equal(urls.get("Dorothea Project questionnaire publishing"), "https://dorotheaproject.com/candidate-questionnaire-results/");
  assert.equal(urls.get("Bartender Flash Cards"), "https://bartender-concierge.web.app/bartender-concierge/home");
  assert.equal(urls.get("MTC interview booking automation"), "https://www.mtcartstudios.org/book-online");
  const assembled = profile.projects.find((project) => project.title === "Assembled Brands website and blog");
  assert.deepEqual(assembled?.links, [
    { label: "Visit website", url: "https://assembledbrands.com" },
    { label: "Visit blog", url: "https://assembledbrands.com/blog" },
  ]);
});

test("Shopify projects credit complete site ownership as well as their standout custom features", () => {
  const chefJamie = profile.projects.find((project) => project.title.includes("Chef Jamie G"));
  const jamWorks = profile.projects.find((project) => project.title.includes("JamWorks247"));

  assert.ok(chefJamie);
  assert.match(chefJamie.summary, /complete.*Shopify site/i);
  assert.match(chefJamie.evidence, /designed and developed the full Shopify site/i);
  assert.match(chefJamie.evidence, /hosted it through MAAiN/i);
  assert.match(chefJamie.evidence, /iframe/i);

  assert.ok(jamWorks);
  assert.match(jamWorks.summary, /complete Shopify commerce site/i);
  assert.match(jamWorks.evidence, /created the full Shopify site/i);
  assert.match(jamWorks.evidence, /most notable custom feature/i);
});

test("recent consulting evidence identifies Codex as a development tool", () => {
  const codexProjects = profile.projects.filter((project) => project.skills.includes("OpenAI Codex"));
  const recentConsultingOrganizations = ["Addition, Inc.", "Dorothea Project", "Black Workers Together", "Chef Jamie G", "MTC Art Studios"];

  assert.ok(codexProjects.length >= 8);
  for (const organization of recentConsultingOrganizations) {
    const experience = profile.experience.find((item) => item.organization === organization);
    assert.ok(experience, `${organization} is missing`);
    assert.ok(experience.bullets.some((bullet) => bullet.includes("OpenAI Codex")), `${organization} needs Codex development evidence`);
  }
});
