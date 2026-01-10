# Design Document: Tailwind Migration

## Overview

This design document outlines the approach for migrating remaining inline CSS styles in the Nottto Chrome extension to Tailwind CSS utility classes. The migration focuses on three main areas: gradients, box shadows, and max-height calculations.

## Architecture

The migration follows a two-part approach:

1. **Tailwind Configuration Extension**: Add custom utilities to `tailwind.config.js` for styles that don't have built-in Tailwind equivalents
2. **Content Script Update**: Replace inline `style` attributes in `content.js` with Tailwind utility classes

### Current Inline Styles to Migrate

| Location                | Current Inline Style                                                    | Migration Approach        |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------- |
| Overlay header gradient | `background: linear-gradient(160deg, rgba(255, 200, 180, 0.5) 0%, ...)` | Custom gradient utility   |
| Canvas container shadow | `box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), ...`                       | Custom shadow utility     |
| Floating toolbar shadow | `box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), ...`                       | Custom shadow utility     |
| Canvas max-height       | `max-height: calc(100vh - 200px)`                                       | Custom max-height utility |

## Components and Interfaces

### Tailwind Configuration Extensions

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      // Custom max-height for canvas
      maxHeight: {
        canvas: "calc(100vh - 200px)",
      },
      // Custom box shadows
      boxShadow: {
        canvas:
          "0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
        toolbar:
          "0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)",
      },
      // Custom background image for gradient
      backgroundImage: {
        "overlay-gradient":
          "linear-gradient(160deg, rgba(255, 200, 180, 0.5) 0%, rgba(255, 215, 195, 0.35) 25%, rgba(250, 240, 235, 0.2) 50%, rgba(250, 250, 250, 0) 75%)",
      },
    },
  },
};
```

### Content Script Class Replacements

| Element             | Old Style Attribute                        | New Tailwind Classes  |
| ------------------- | ------------------------------------------ | --------------------- |
| Gradient header div | `style="background: linear-gradient(...)"` | `bg-overlay-gradient` |
| Canvas container    | `style="box-shadow: 0 4px 24px..."`        | `shadow-canvas`       |
| Floating toolbar    | `style="box-shadow: 0 4px 24px..."`        | `shadow-toolbar`      |
| Canvas element      | `style="max-height: calc(100vh - 200px)"`  | `max-h-canvas`        |

## Data Models

No data models are affected by this migration. This is purely a styling refactor.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis, most acceptance criteria are specific examples rather than universal properties. The migration is primarily a code refactoring task with verification through:

1. **Code inspection**: Verify inline styles are removed
2. **Build verification**: Verify Tailwind generates the expected CSS
3. **Visual inspection**: Verify appearance is unchanged

No property-based tests are applicable for this migration as the criteria are:

- Configuration checks (example-based)
- Code structure checks (example-based)
- Visual appearance (not automatable without visual regression tools)

## Error Handling

### Potential Issues and Mitigations

1. **Missing Tailwind Classes in Output**

   - Cause: Tailwind purges unused classes
   - Mitigation: Ensure `content.js` is in the `content` array in `tailwind.config.js` (already configured)

2. **CSS Specificity Issues**

   - Cause: Page styles overriding extension styles
   - Mitigation: The `important: true` setting in tailwind.config.js already handles this

3. **Build Failures**
   - Cause: Invalid Tailwind configuration syntax
   - Mitigation: Test build after each configuration change

## Testing Strategy

### Manual Testing

1. **Visual Regression Testing**

   - Load the extension before and after migration
   - Compare overlay appearance visually
   - Verify gradient, shadows, and canvas sizing are identical

2. **Build Verification**
   - Run `npm run build` and verify no errors
   - Inspect `overlay.css` for presence of new utility classes

### Automated Verification

Since this is a styling migration with no functional changes, automated testing focuses on:

1. **Build Success**: Verify the build completes without errors
2. **CSS Output**: Verify the generated CSS contains the expected custom utilities

Unit tests are not applicable as there is no logic to test—this is purely a CSS refactoring task.
