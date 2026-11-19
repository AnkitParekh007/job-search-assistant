import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // @ts-expect-error vitest config is consumed by vitest
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test-setup.ts"] },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
  },
});
