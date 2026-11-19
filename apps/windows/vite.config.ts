import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
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
  clearScreen: false,
  server: {
    port: 1424,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1425 } : undefined,
    fs: { allow: [path.resolve(__dirname, "../..")] },
    watch: { ignored: ["**/src-tauri/**"] },
  },
}));
