---
name: ios-pwa-ui-fixer
description: >-
  Tailwind CSS v4 and Apple iOS/iPadOS Safari & Home Screen PWA UI conventions:
  dynamic viewports (dvh), safe-area insets with zero-inset fallbacks, status bar theme-color tinting,
  date/month input overflow resets, standalone back navigation, @theme tokens in src/index.css, and cn() class merging.
  Use when creating, styling, auditing, or fixing React UI components, layouts, overlays, or form inputs.
  Not for service workers, Workbox caching, or Dexie database logic.
---

# iOS PWA & Tailwind CSS v4 Guidelines

## 1. Viewport, Safe Areas & Zero-Inset Fallbacks
- **Head Meta Tags (`index.html`)**:
  - Viewport must include `viewport-fit=cover` so `env(safe-area-inset-*)` resolves on notched/Dynamic Island devices.
  - Never add `maximum-scale=1` or `user-scalable=no` (preserve pinch zoom). Prevent iOS auto-zoom on input focus by keeping input font sizes at `16px` (`text-base`) or larger, or handled properly within the layout.
  - Provide light and dark `<meta name="theme-color">` tags matching `--color-background-light` (`#f8fafc`) and `--color-background-dark` (`#0f172a`) so Safari's status bar and address bar tint seamlessly.
- **Dynamic Viewport Height**:
  - Use `h-dvh` or `min-h-dvh` (never `h-screen` / `100vh`) so layouts adapt smoothly to Safari's collapsible address bar and virtual keyboard.
- **Safe Area Insets & Zero-Inset Validity**:
  - A `0px` safe-area inset is valid (desktop, non-notched iPads, or landscape). Never rely *solely* on `env(safe-area-inset-*)` for an element's visual padding.
  - Either place `pt-[env(safe-area-inset-top)]` / `pb-[env(safe-area-inset-bottom)]` on the outer sticky/fixed wrapper with standard padding (`py-3`, `py-4`) on the inner container (as in [`AppLayout.tsx`](../../src/components/layout/AppLayout.tsx) and [`BottomNavigation.tsx`](../../src/components/layout/BottomNavigation.tsx)), or combine them via `calc()` / `max()` (e.g., `pt-[calc(1rem+env(safe-area-inset-top))]`).
  - Full-height fixed drawers/modals (`fixed inset-0` or `fixed top-0 bottom-0`, like [`SideMenu.tsx`](../../src/components/layout/SideMenu.tsx)) must also account for top and bottom safe areas.

## 2. Standalone Navigation & Touch Ergonomics
- **Standalone Back Navigation**: Because the app runs in `display: standalone` when installed to the Home Screen (hiding Safari's back/forward controls), any page or modal that hides [`BottomNavigation`](../../src/components/layout/BottomNavigation.tsx) (e.g., `hideBottomNav` or standalone Add/Edit screens) must render an explicit in-app back or cancel button in its top bar.
- **Touch & Text Selection**: Preserve default text selection on content; scope `select-none` only to interactive controls, buttons, or tabs.

## 3. Date/Month Inputs & iOS Safari Overflow Resets
Native iOS Safari `date` and `month` inputs can overflow flex/grid containers unless constrained.
- Prefer the shared [`DateInput`](../../src/components/ui/DateInput.tsx) component (`src/components/ui/DateInput.tsx`) for `date` and `month` fields.
- When styling raw `<input>` elements directly:
  - Append structural resets: `block max-w-full min-w-0 appearance-none`
  - If the input supports dark mode (`dark:*` classes), append `dark:[color-scheme:dark]` so the native iOS picker popover matches the dark theme.
  - Preserve existing visual utility classes (colors, borders, spacing, typography).
  - Reference examples: [`light_input_out.tsx`](./examples/light_input_out.tsx), [`dark_input_out.tsx`](./examples/dark_input_out.tsx).

## 4. Tailwind v4 & Class Merging
- **CSS-First Theme (`src/index.css`)**: This project uses Tailwind CSS v4 (`@import "tailwindcss";`) without `tailwind.config.js`. Define custom theme variables (`--color-*`, `--font-*`) inside the `@theme` block in [`src/index.css`](../../src/index.css).
- **Class Merging**: Use `cn()` from [`@/lib/utils`](../../src/lib/utils.ts) (`clsx` + `tailwind-merge`) for conditional classes and `className` prop overrides instead of nested string ternaries.
- **Layout Reference**: See [`tailwind-reference.md`](./tailwind-reference.md) for a complete layout example.

## 5. Verification
- Verify TypeScript compilation, unit tests (`npm test`), and lint rules (`npm run lint`).
- Real-device behaviors (iOS status-bar tint sampling, standalone safe-area timing, hardware keyboard overlap) cannot be proved by jsdom or desktop emulation alone—verify the generated DOM/CSS classes and explicitly note any device-only visual checks as **Unverified on device**.
