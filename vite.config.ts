import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ isSsrBuild, mode }) => ({
  plugins: [react()],
  base: mode === "pages" ? process.env.BASE_PATH || "/" : "/",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    outDir: isSsrBuild ? "dist/server" : "dist/client",
    // Media is served by the Function after authorization, never copied to a public bundle.
    copyPublicDir: false,
  },
}));
