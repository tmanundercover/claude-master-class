// Server-only projection: internal project evidence never enters public page data.
import profile from "../../data/profile.json";
import type { PublicProfile } from "../app-types";

export function publicProfile(): PublicProfile {
  return {
    ...profile,
    projects: profile.projects.map(({ title, context, summary, tools, ...project }) => ({
      title, context, summary, tools,
      ...(project.url ? { url: project.url } : {}),
      ...(project.links ? { links: project.links } : {}),
    })),
  };
}
