# Extension Packaging Guide

This guide explains how to package the Notto extension for Chrome Web Store submission.

## Quick Start

```bash
cd apps/extension
npm run package
```

That's it! The script will create a production-ready zip file in the `release/` folder.

## What the Script Does

The `npm run package` command automatically:

1. **Cleans** previous builds (removes old `release/` folder)
2. **Builds** the extension in production mode (minified, no source maps)
3. **Creates production manifest** - Removes localhost from host_permissions
4. **Verifies** all required files exist
5. **Creates** a zip file with only the necessary files
6. **Reports** the file size and location

## Production vs Development

The packaging script automatically creates a production-ready manifest:

- **Development** (`manifest.json`): Includes `http://localhost:3001/*` for local API testing
- **Production** (in zip): Removes localhost, only includes `https://notto-api.vercel.app/*`

This reduces Chrome Web Store review time by minimizing host permissions.

## What's Included in the Zip

```
notto-extension-v2.2.0.zip
├── manifest.json          # Extension manifest
├── dist/                  # Built JavaScript and CSS
│   ├── background.js      # Background service worker
│   ├── content.js         # Content script
│   ├── popup.js           # Popup script
│   └── overlay.css        # Compiled Tailwind CSS
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── lib/                   # Third-party libraries
    └── fabric.min.js      # Canvas library
```

## What's NOT Included

The script automatically excludes:

- `src/` - Source TypeScript files
- `node_modules/` - Dependencies
- `.DS_Store` - macOS system files
- `*.map` - Source maps
- Development config files (tsconfig.json, esbuild.config.js, etc.)

## Output Location

The zip file is created at:

```
apps/extension/release/notto-extension-v{VERSION}.zip
```

The version number is automatically read from `manifest.json`.

## Before Packaging

Make sure to:

1. **Update version** in `manifest.json` if needed
2. **Sync version** in `package.json` to match (optional but recommended)
3. **Test locally** - Load the unpacked extension and test all features
4. **Remove debug code** - No console.log statements (already done ✅)
5. **Verify config** - Check `src/config.ts` has production URLs

## Testing the Package

Before uploading to Chrome Web Store:

1. Extract the zip file to a test folder
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted folder
6. Test all features:
   - Screenshot capture
   - Annotation tools
   - Authentication flow
   - Workspace/project selection
   - Save functionality
   - Logout

## Uploading to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click on your extension (or "New Item" for first upload)
3. Click "Package" tab
4. Click "Upload new package"
5. Select the zip file from `release/` folder
6. Fill in store listing details
7. Submit for review

## Version Management

The version in `manifest.json` follows semantic versioning:

- **Major** (2.x.x) - Breaking changes
- **Minor** (x.2.x) - New features
- **Patch** (x.x.0) - Bug fixes

Update the version before running `npm run package`:

```json
{
  "version": "2.2.0"
}
```

## Troubleshooting

### "Missing required files" error

- Run `npm run build` first to ensure dist/ folder exists
- Check that all icon files are present in `icons/`

### Zip file too large

- Current size: ~0.12 MB (well under 128 MB limit)
- If it grows, check for accidentally included files

### Build fails

- Run `npm install` to ensure dependencies are installed
- Check for TypeScript errors with `npm run typecheck`

## CI/CD Integration (Future)

This script can be integrated into GitHub Actions:

```yaml
- name: Package extension
  run: |
    cd apps/extension
    npm install
    npm run package

- name: Upload artifact
  uses: actions/upload-artifact@v3
  with:
    name: extension-package
    path: apps/extension/release/*.zip
```

## Notes

- The `release/` folder is gitignored
- Each package is named with the version number
- The script works on macOS and Linux (uses native `zip` command)
- For Windows, you may need to install zip or use WSL
