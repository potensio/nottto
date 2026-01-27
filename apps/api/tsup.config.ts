import { defineConfig } from "tsup";
import path from "path";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  target: "node18",
  outDir: "api",
  clean: true,
  // Bundle all workspace dependencies
  noExternal: [/@notto\/.*/],
  esbuildOptions(options) {
    // Ensure package exports are resolved correctly
    options.conditions = ["import", "module", "default"];
    // Explicitly resolve workspace packages
    options.alias = {
      "@notto/shared/db": path.resolve(
        __dirname,
        "../../packages/shared/src/db/index.ts",
      ),
      "@notto/shared/schemas": path.resolve(
        __dirname,
        "../../packages/shared/src/schemas/index.ts",
      ),
      "@notto/shared/types": path.resolve(
        __dirname,
        "../../packages/shared/src/types/index.ts",
      ),
      "@notto/shared": path.resolve(
        __dirname,
        "../../packages/shared/src/index.ts",
      ),
    };
  },
});
