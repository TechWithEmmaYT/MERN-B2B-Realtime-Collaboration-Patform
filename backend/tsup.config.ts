import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  bundle: true,
  clean: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  minify: false,
  splitting: false,
});
