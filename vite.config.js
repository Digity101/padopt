import { defineConfig } from "vite";
import path from "path";
import eslintPlugin from "@nabla/vite-plugin-eslint";

export default defineConfig({
  plugins: [eslintPlugin()],
  base: "./",
  build: {
    outDir: "./dist",
  },
});
