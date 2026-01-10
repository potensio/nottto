# BugFinder - Screenshot Annotation Chrome Extension

A full-screen Chrome extension for capturing and annotating screenshots with arrows, boxes, and text. Now powered by **Tailwind CSS** for better maintainability and smaller bundle sizes.

## Features

- Full-screen screenshot annotation overlay
- Drawing tools: arrows, rectangles, ellipses, text
- Customizable colors and stroke weights
- Export annotated screenshots and task data
- Clean, modern UI built with Tailwind CSS

## Development Setup

### Prerequisites

- Node.js and npm installed
- Chrome browser for testing

### Building the CSS

This project now uses Tailwind CSS instead of custom CSS. To build the styles:

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the CSS (one-time):**

   ```bash
   npm run build
   ```

3. **Development with auto-rebuild:**

   ```bash
   npm run build-css
   ```

   This will watch for changes and rebuild automatically.

4. **Or use the build script:**
   ```bash
   ./build.sh
   ```

### Loading the Extension

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this directory

## Usage

1. Navigate to any webpage
2. **Click the BugFinder extension icon** in Chrome toolbar
3. The page freezes and **full-screen annotation mode** opens
4. Use the floating toolbar to annotate:
   - **Arrow**: Click and drag to draw arrows
   - **Rectangle**: Click and drag to draw boxes
   - **Text**: Click to place, type, press Enter
5. Add context notes in the right panel
6. Click **Save Task**

## Keyboard Shortcuts

| Key      | Action         |
| -------- | -------------- |
| `A`      | Arrow tool     |
| `R`      | Rectangle tool |
| `T`      | Text tool      |
| `Ctrl+Z` | Undo           |
| `Ctrl+S` | Save           |
| `Esc`    | Cancel         |

## Output

Saves two files:

- `bugfinder-task-{id}.json` - Full task data with metadata
- `bugfinder-screenshot-{id}.png` - Annotated screenshot

## Project Structure

```
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script with Tailwind classes
├── overlay.css           # Generated Tailwind CSS (don't edit directly)
├── src/
│   └── input.css         # Tailwind source file
├── tailwind.config.js    # Tailwind configuration
├── package.json          # Dependencies and scripts
└── icons/               # Extension icons
```

## Tailwind Migration Benefits

- **Smaller bundle size**: Only used utilities are included
- **Better maintainability**: Utility classes instead of custom CSS
- **Consistent design system**: Predefined spacing, colors, and components
- **Easier responsive design**: Built-in responsive utilities
- **Better developer experience**: IntelliSense support and faster development

## Custom Design Tokens

The project uses custom design tokens defined in `tailwind.config.js`:

- **Colors**: `bf-primary`, `bf-secondary`, `bf-accent`, `bf-bg`, `bf-surface`, `bf-border`
- **Spacing**: Custom spacing values for the extension layout
- **Z-index**: High z-index values for overlay functionality
- **Animations**: Custom slide-up animation for toasts
