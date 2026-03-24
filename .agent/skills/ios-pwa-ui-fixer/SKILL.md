---
name: ios-pwa-ui-fixer
description: Enforces Tailwind CSS v4 best practices, strict mobile-first design, iOS PWA safe-area handling, and modifies React UI components (like date inputs) to render perfectly without overflow on iOS Safari.
version: 1.0.0
---

# iOS PWA & Tailwind v4 UI Fixer Skill

You are an expert UI engineer specializing in Tailwind CSS v4 and iOS Progressive Web Apps (PWAs). Whenever you style or fix a component, you must strictly adhere to the following rules to ensure flawless mobile execution, clean code, and correct rendering on iOS Safari.

## 1. Input Fields & iOS Resets
This skill ensures that form inputs (especially date/month types) do not break out of their flex/grid constraints on iOS Safari.
- **Apply Core iOS Resets (Always)**: 
  - Append `min-w-0` to allow flex children to shrink below their content size.
  - Append `max-w-full` and `block` to enforce strict boundary constraints.
  - Append `appearance-none` to strip erratic default native styling.
- **Apply Conditional Resets**:
  - IF the original input contains any `dark:` utility classes (e.g., `dark:bg-primary`), you MUST also append `dark:[color-scheme:dark]` to ensure the native iOS date picker popover matches the app's dark mode state.
  - IF the original input does not have dark mode classes, DO NOT add `dark:[color-scheme:dark]`.
- **Constraints**: Never remove the user's existing aesthetic utility classes (colors, padding, text size). Only append the structural iOS fixes.
- **Reference**: Review the `examples/` directory to see how input logic is applied to both light and dark components.

## 2. Tailwind v4 Architecture
- **CSS-First Configuration:** Tailwind v4 does not use a `tailwind.config.js` file. If you need to define custom theme variables, colors, or fonts, you MUST define them using the `@theme` directive inside the main global CSS file (e.g., `globals.css`).

## 3. Mobile Viewports (Crucial)
- **NEVER** use `h-screen` or `100vh` for full-height layouts. In Safari, `100vh` includes the bottom navigation bar, which causes violent layout jumps when scrolling. 
- **ALWAYS** use `h-dvh` (dynamic viewport height) or `min-h-dvh` to handle Safari's bottom bar appearing/disappearing and to handle the virtual keyboard smoothly.

## 4. iOS PWA Safe Areas
- PWAs installed on the iOS Home Screen run in standalone mode, but notched devices still require safe area insets.
- **ALWAYS** use Tailwind's environment variable support for padding on fixed headers/footers to prevent UI elements from hiding behind the notch or the home indicator (e.g., `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]`).

## 5. Clean TSX & Class Merging
- **NEVER** write long, nested ternary operators inside a `className` prop. 
- **ALWAYS** use a utility like `clsx` combined with `twMerge` (often exported as a `cn()` utility) to handle conditional styling. This prevents class conflicts and keeps the component readable.

## 6. Reference Patterns
Before styling any component, you MUST read and apply the structural patterns provided in the bundled resource:
**Refer to:** `./tailwind-reference.md`

## 7. Verification
Before finalizing your code, ask yourself:
* Did I apply the `min-w-0`, `max-w-full`, `block`, and `appearance-none` fixes to inputs?
* Did I use `h-dvh` instead of `h-screen`?
* Did I account for iOS safe areas on fixed elements?
* Are my conditional classes merged cleanly using a utility function?

If the answer to any of these is "No," you must refactor the styling.