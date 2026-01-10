import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "api",
  outExtension: () => ({ js: ".js" }),
  clean: true,
  sourcemap: false,
  // Bundle workspace dependencies
  noExternal: [/@nottto\/.*/],
});
