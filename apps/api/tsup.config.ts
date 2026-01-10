import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node18",
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
  clean: true,
  sourcemap: true,
  noExternal: [/@nottto\/.*/],
});
