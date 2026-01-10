# BugFinder - Screenshot Annotation Chrome Extension

A full-screen Chrome extension for capturing and annotating screenshots with arrows, boxes, and text.

## Installation

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `bugfinder` folder

## Usage

1. Navigate to any webpage
2. **Click the BugFinder extension icon** in Chrome toolbar
3. The page freezes and **full-screen annotation mode** opens
4. Use the floating toolbar to annotate:
   - **Arrow**: Click and drag to draw arrows
   - **Rectangle**: Click and drag to draw boxes
   - **Text**: Click to place, type, press Enter
5. Add context notes at the bottom
6. Click **Save Task**

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` | Arrow tool |
| `R` | Rectangle tool |
| `T` | Text tool |
| `Ctrl+Z` | Undo |
| `Ctrl+S` | Save |
| `Esc` | Cancel |

## Output

Saves two files:
- `bugfinder-task-{id}.json` - Full task data with metadata
- `bugfinder-screenshot-{id}.png` - Annotated screenshot
