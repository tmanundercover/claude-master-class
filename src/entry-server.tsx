import { existsSync } from "node:fs";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import App from "./App";
import type { PageData } from "./app-types";
import { authConfiguration, currentSessionRole } from "./lib/auth";
import { SESSION_ROLES, type SessionRole } from "./lib/session";
import { tools } from "./lib/tools";
import { interviewResponses } from "./lib/interview-responses";
import { careerYears, getPublicSkillEvidence, getResumeSearchItems, getResumeEvidenceSummary, getArchivedSkillEvidence, sanityResumeArchive } from "./lib/resume-evidence";
import profile from "../data/profile.json";
import * as auth from "./server/routes/auth";
import * as fit from "./server/routes/fit-analyzer";
import * as letter from "./server/routes/cover-letter";
import * as career from "./server/routes/career-plan";

const apiRoutes: Record<string, Partial<Record<string, (request: Request) => Promise<Response>>>> = {
  "/api/auth/config": { GET: auth.configuration },
  "/api/auth": { POST: auth.POST, DELETE: auth.DELETE },
  "/api/fit-analyzer": { POST: fit.POST },
  "/api/cover-letter": { POST: letter.POST },
  "/api/career-plan": { POST: career.POST },
};

function hasPublicFile(path: string, publicRoot = join(process.cwd(), "public")): boolean {
  return existsSync(join(publicRoot, path));
}

export function publicPageData(publicRoot = join(process.cwd(), "public")): PageData {
  return { page: "home", home: {
    hasProfilePhoto: hasPublicFile("profile-photo.jpg", publicRoot),
    yearsInSoftware: careerYears(),
    skillEvidence: Object.fromEntries(Object.values(profile.skills).flat().map((skill) => [skill, getPublicSkillEvidence(skill)])),
    searchItems: getResumeSearchItems(),
  } };
}

async function authorize(request: Request, allowedRoles: readonly SessionRole[]): Promise<SessionRole | Response> {
  try {
    authConfiguration();
    const role = await currentSessionRole(request);
    if (!role) return new Response(null, { status: 307, headers: { Location: "/login" } });
    if (!allowedRoles.includes(role)) return new Response(null, { status: 307, headers: { Location: "/interview" } });
    return role;
  } catch {
    return new Response("Authentication is not securely configured.", { status: 503 });
  }
}

/** Used before static middleware so private recordings require the same session as the room. */
export async function authorizeMedia(request: Request): Promise<Response | null> {
  const result = await authorize(request, SESSION_ROLES);
  return result instanceof Response ? result : null;
}

export async function resolveRequest(request: Request, publicRoot = join(process.cwd(), "public")): Promise<PageData | Response> {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    const handlers = apiRoutes[pathname];
    if (!handlers) return Response.json({ error: "API route not found." }, { status: 404 });
    const allow = [...Object.keys(handlers), "OPTIONS"].join(", ");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: allow } });
    const handler = handlers[request.method];
    if (!handler) return Response.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: allow } });
    return handler(request);
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed.", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  if (pathname === "/") return publicPageData(publicRoot);
  if (pathname === "/login") return { page: "login", hasWelcomeVideo: hasPublicFile("interview/welcome.mp4", publicRoot) };
  const ownerRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (ownerRoute || pathname === "/interview") {
    const access = await authorize(request, ownerRoute ? ["terrell"] : SESSION_ROLES);
    if (access instanceof Response) return access.status === 503 ? { page: "configuration" } : access;
    if (pathname === "/interview") return { page: "interview", interview: {
      role: access,
      responses: interviewResponses,
      availableVideoIds: interviewResponses.filter((item) => hasPublicFile(item.videoSrc.slice(1), publicRoot)).map((item) => item.id),
    } };
    if (pathname === "/dashboard") return { page: "dashboard", evidence: getResumeEvidenceSummary() };
    if (pathname === "/dashboard/resume") return { page: "resume", resume: {
      summary: getResumeEvidenceSummary(),
      snapshotCreatedAt: sanityResumeArchive.source.snapshotCreatedAt,
      skills: getArchivedSkillEvidence(),
      experiences: sanityResumeArchive.experiences,
      projects: sanityResumeArchive.projects,
    } };
    const tool = tools.find((item) => pathname === `/dashboard/${item.id}`);
    if (tool) return { page: "tool", id: tool.id };
  }
  return { page: "not-found" };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function renderPage(template: string, data: PageData): string {
  const title = escapeHtml(`${profile.name} | Fullstack Engineer & AI Product Builder`);
  const description = escapeHtml(profile.pitch);
  const head = `<title>${title}</title><meta name="description" content="${description}" />`
    + `<meta name="author" content="${escapeHtml(profile.name)}" /><meta name="creator" content="${escapeHtml(profile.name)}" />`
    + `<meta property="og:title" content="${title}" /><meta property="og:description" content="${description}" /><meta property="og:type" content="website" />`
    + (data.page === "home" ? "" : '<meta name="robots" content="noindex" />');
  // Escape script delimiters even when approved text happens to contain HTML.
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return template.replace("<!--app-head-->", () => head)
    .replace("<!--app-html-->", () => renderToString(<App data={data} />))
    .replace("<!--app-data-->", () => serialized);
}
