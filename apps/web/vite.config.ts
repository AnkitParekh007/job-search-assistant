import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@ai-job-search/runtime": path.resolve(__dirname, "src/runtime/index.ts"),
      "@ai-job-search/core": path.resolve(__dirname, "../../packages/core/src"),
      "@ai-job-search/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  // @ts-expect-error vitest
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: [path.resolve(__dirname, "../..")] },
  },
  preview: { port: 5173 },
});
