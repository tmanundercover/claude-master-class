import express from "express";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, posix } from "node:path";
import { Readable } from "node:stream";

export async function createApplication({ root }) {
  const app = express();
  app.disable("x-powered-by");
  const loadApplication = () => import(pathToFileURL(join(root, "dist/server/entry-server.js")).href);

  function webRequest(request) {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
    if ((process.env.K_SERVICE || process.env.FUNCTIONS_EMULATOR) && headers.has("x-forwarded-host")) {
      headers.set("host", headers.get("x-forwarded-host").split(",")[0].trim());
    }
    return new Request(`http://${request.headers.host || "localhost"}${request.originalUrl}`, {
      method: request.method,
      headers,
      ...(!["GET", "HEAD"].includes(request.method) ? { body: request.rawBody ?? Readable.toWeb(request), duplex: "half" } : {}),
    });
  }

  async function send(response, result) {
    response.status(result.status);
    result.headers.forEach((value, name) => response.setHeader(name, value));
    response.send(Buffer.from(await result.arrayBuffer()));
  }

  // Authorize private recordings before any static file middleware.
  app.use(async (request, response, next) => {
    try {
      const pathname = posix.normalize(decodeURIComponent(new URL(request.originalUrl, "http://localhost").pathname).replaceAll("\\", "/"));
      if (!pathname.startsWith("/interview/") || pathname === "/interview/" || pathname === "/interview/welcome.mp4") return next();
      response.setHeader("Cache-Control", "private, no-store");
      const result = await (await loadApplication()).authorizeMedia(webRequest(request));
      if (result) return await send(response, result);
      next();
    } catch (error) { next(error); }
  });
  app.use(express.static(join(root, "public"), { index: false, redirect: false, dotfiles: "deny" }));


  app.use(async (request, response, next) => {
    try {
      const application = await loadApplication();
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Vary", "Cookie");
      const result = await application.resolveRequest(webRequest(request), join(root, "public"));
      if (result instanceof Response) return await send(response, result);
      const template = readFileSync(join(root, "dist/client/index.html"), "utf8");
      response.status(result.page === "not-found" ? 404 : 200).type("html").send(application.renderPage(template, result));
    } catch (error) {
      next(error);
    }
  });
  app.use((error, _request, response, _next) => {
    console.error("Application request failed:", error);
    response.status(500).json({ error: "The application could not complete this request." });
  });

  return { app };
}
