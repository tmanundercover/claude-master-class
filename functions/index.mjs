import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { fileURLToPath } from "node:url";
import { createApplication } from "./app.mjs";

const secrets = [defineSecret("AI_API_KEY")];
let application;

export const portfolioApp = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  maxInstances: 3,
  concurrency: 20,
  invoker: "public",
  secrets,
}, async (request, response) => {
  process.env.NODE_ENV = "production";
  // Firebase binds the declared secrets into the function environment at runtime.
  application ??= createApplication({ root: fileURLToPath(new URL(".", import.meta.url)) });
  const { app } = await application;
  app(request, response);
});
