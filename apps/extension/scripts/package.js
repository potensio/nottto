#!/usr/bin/env node

/**
 * Package script for Chrome extension
 * Creates a production-ready zip file for Chrome Web Store submission
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Read version from manifest.json
const manifestPath = path.join(__dirname, "..", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;

// Paths
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const releaseDir = path.join(rootDir, "release");
const zipName = `notto-extension-v${version}.zip`;
const zipPath = path.join(releaseDir, zipName);

console.log("📦 Packaging Notto Extension for Chrome Web Store");
console.log(`Version: ${version}`);
console.log("");

// Step 1: Clean previous builds
console.log("🧹 Cleaning previous builds...");
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

// Step 2: Run production build
console.log("🔨 Building extension...");
try {
  execSync("npm run build", { cwd: rootDir, stdio: "inherit" });
} catch (error) {
  console.error("❌ Build failed!");
  process.exit(1);
}

// Step 3: Create production manifest (remove localhost)
console.log("📝 Creating production manifest...");
const prodManifest = { ...manifest };
prodManifest.host_permissions = prodManifest.host_permissions.filter(
  (perm) => !perm.includes("localhost"),
);

const prodManifestPath = path.join(rootDir, "manifest.prod.json");
fs.writeFileSync(prodManifestPath, JSON.stringify(prodManifest, null, 2));

// Step 4: Verify required files exist
console.log("✅ Verifying required files...");
const requiredFiles = [
  "manifest.json",
  "dist/background.js",
  "dist/content.js",
  "dist/popup.js",
  "dist/overlay.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "lib/fabric.min.js",
];

const missingFiles = [];
for (const file of requiredFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error("❌ Missing required files:");
  missingFiles.forEach((file) => console.error(`   - ${file}`));
  process.exit(1);
}

// Step 5: Create zip file
console.log("📦 Creating zip file...");
try {
  // Create temp directory for packaging
  const tempDir = path.join(releaseDir, "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy files to temp directory
  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(path.join(rootDir, "dist"), path.join(tempDir, "dist"));
  copyDir(path.join(rootDir, "icons"), path.join(tempDir, "icons"));
  copyDir(path.join(rootDir, "lib"), path.join(tempDir, "lib"));

  // Copy production manifest as manifest.json
  fs.copyFileSync(prodManifestPath, path.join(tempDir, "manifest.json"));

  // Create zip from temp directory
  const zipCommand = `zip -r "${zipPath}" . -x "*.DS_Store" "*.map"`;
  execSync(zipCommand, { cwd: tempDir, stdio: "pipe" });

  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true });
} catch (error) {
  console.error("❌ Failed to create zip file!");
  console.error(error.message);
  process.exit(1);
} finally {
  // Clean up production manifest
  if (fs.existsSync(prodManifestPath)) {
    fs.unlinkSync(prodManifestPath);
  }
}

// Step 6: Get zip file size
const stats = fs.statSync(zipPath);
const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

// Step 7: Success!
console.log("");
console.log("✨ Package created successfully!");
console.log("");
console.log("📄 Details:");
console.log(`   File: ${zipName}`);
console.log(`   Size: ${fileSizeInMB} MB`);
console.log(`   Path: ${zipPath}`);
console.log("");
console.log("📋 Next steps:");
console.log("   1. Test the extension by loading the zip in Chrome");
console.log("   2. Go to chrome://extensions/");
console.log("   3. Enable 'Developer mode'");
console.log("   4. Click 'Load unpacked' and select the extracted folder");
console.log("   5. Test all features thoroughly");
console.log("   6. Upload to Chrome Web Store Developer Dashboard");
console.log("");
console.log(
  "🌐 Chrome Web Store: https://chrome.google.com/webstore/devconsole",
);
