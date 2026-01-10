const esbuild = require("esbuild");

const isWatch = process.argv.includes("--watch");

const commonOptions = {
  bundle: true,
  format: "iife",
  target: "chrome100",
  minify: !isWatch,
  sourcemap: isWatch ? "inline" : false,
};

async function build() {
  const contexts = await Promise.all([
    // Content script
    esbuild.context({
      ...commonOptions,
      entryPoints: ["src/content/index.ts"],
      outfile: "dist/content.js",
    }),
    // Background script
    esbuild.context({
      ...commonOptions,
      entryPoints: ["src/background/index.ts"],
      outfile: "dist/background.js",
    }),
    // Popup script
    esbuild.context({
      ...commonOptions,
      entryPoints: ["src/popup/index.ts"],
      outfile: "dist/popup.js",
    }),
  ]);

  if (isWatch) {
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log("Watching for changes...");
  } else {
    await Promise.all(contexts.map((ctx) => ctx.rebuild()));
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
    console.log("Build complete!");
  }
}

build().catch(() => process.exit(1));
