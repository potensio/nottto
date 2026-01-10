import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  target: "node18",
  outDir: "api",
  clean: true,
  sourcemap: true,
  noExternal: [/@nottto\/.*/],
});
