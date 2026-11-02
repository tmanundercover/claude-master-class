import { onRequest } from "firebase-functions/v2/https";
import { fileURLToPath } from "node:url";
import { createApplication } from "./app.mjs";

let application;

export const portfolioApp = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  maxInstances: 3,
  concurrency: 20,
  invoker: "public",
}, async (request, response) => {
  process.env.NODE_ENV = "production";
  application ??= createApplication({ root: fileURLToPath(new URL(".", import.meta.url)) });
  const { app } = await application;
  app(request, response);
});
