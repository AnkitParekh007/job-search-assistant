import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: "spa-github-pages-fallback",
      // Client build only: copy the shell to 404.html before routes are prerendered.
      apply: (_config, env) => !env.isSsrBuild,
      closeBundle() {
        const dist = resolve(rootDir, "dist");
        const index = resolve(dist, "index.html");
        const fallback = resolve(dist, "404.html");
        if (existsSync(index)) {
          copyFileSync(index, fallback);
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
  },
  ssr: {
    // Bundle router deps into the SSR entry so the prerender step runs in plain Node.
    noExternal: ["react-router-dom", "react-router"],
  },
  server: {
    port: 5174,
  },
});
