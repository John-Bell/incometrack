---
name: Prudence & Precision
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#4c4451'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#7d7483'
  outline-variant: '#cec3d3'
  surface-tint: '#7b41b3'
  primary: '#2e0052'
  on-primary: '#ffffff'
  primary-container: '#4b0082'
  on-primary-container: '#ba7ef4'
  inverse-primary: '#ddb7ff'
  secondary: '#555f6d'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f1'
  on-secondary-container: '#596372'
  tertiary: '#161d26'
  on-tertiary: '#ffffff'
  tertiary-container: '#2b323c'
  on-tertiary-container: '#939aa6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f0dbff'
  primary-fixed-dim: '#ddb7ff'
  on-primary-fixed: '#2c0050'
  on-primary-fixed-variant: '#622599'
  secondary-fixed: '#d9e3f4'
  secondary-fixed-dim: '#bdc7d8'
  on-secondary-fixed: '#121c28'
  on-secondary-fixed-variant: '#3e4755'
  tertiary-fixed: '#dce3f0'
  tertiary-fixed-dim: '#c0c7d3'
  on-tertiary-fixed: '#151c25'
  on-tertiary-fixed-variant: '#404752'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  chart-fill-start: rgba(75, 0, 130, 0.15)
  chart-fill-end: rgba(75, 0, 130, 0)
  grid-line: '#E5E7EB'
  surface-base: '#FFFFFF'
  surface-muted: '#F9FAFB'
typography:
  display-value:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  heading-section:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  chart-tick:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
  caption-bold:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
  caption-muted:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
---

## Brand & Style

The brand personality is anchored in professional reliability and intellectual clarity. It is designed for high-stakes financial planning where precision is paramount. The emotional response should be one of "calm confidence"—moving away from the anxiety of complex data toward the serenity of clear insights.

This design system adopts a **Functional Minimalist** style. It utilizes heavy whitespace to reduce cognitive load and a strict hierarchical structure to prioritize data readouts. The aesthetic is "premium-utilitarian," where every element exists to serve a specific informational purpose. Visual flair is reserved exclusively for the data itself, using a deep plum accent to draw the eye toward critical financial trajectories.

## Colors

The palette is intentionally restrained to ensure the primary deep plum (`#4B0082`) serves as the "source of truth." This color is used for active data lines, primary actions, and focused states.

- **Neutrals:** A range of Cool Grays provides structure without competition. Darker grays (`#111827`) are used for primary currency values to maximize contrast, while lighter grays handle labels and auxiliary data.
- **Data Visualization:** The chart uses a vertical linear gradient. The primary stroke is a solid 3px plum, fading into a 15% opacity fill that terminates at 0% to prevent visual clutter at the baseline.
- **Status & Backgrounds:** Use `surface-muted` for background sections that need to feel distinct from the main white canvas, such as loading states or informational badges.

## Typography

The typography system uses **Manrope** for high-impact data readouts and headlines to provide a modern, slightly geometric feel that remains professional. **Inter** is used for all functional UI elements, labels, and secondary text due to its exceptional legibility at small scales.

- **Financial Readouts:** Currency values should always use `display-value` with tight letter spacing to feel cohesive.
- **Chart Labels:** Age labels on the X-axis and currency scales on the Y-axis use `chart-tick`. In multi-persona charts, use stacked rows of `chart-tick` to maintain a compact footprint.
- **Annotations:** Use `caption-bold` for titles within informational badges (e.g., "Assumptions") and `caption-muted` for the supporting legal or technical text.

## Layout & Spacing

The layout is built on a strict **8px rhythmic scale**, ensuring vertical and horizontal alignment across complex data tables and charts.

- **Layout Model:** A fixed-width container approach is preferred for financial dashboards to maintain the integrity of chart aspect ratios. On desktop, the content is centered with generous side margins.
- **Grid:** Use a 12-column fluid grid for dashboard widgets, but internal components (like the chart card) rely on safe internal padding of `md` (16px).
- **Responsive Behavior:** 
  - **Mobile:** Margins shrink to 16px. Chart height is fixed at 260px to ensure touch-scrubbing usability. 
  - **Desktop:** Chart scales width-wise but maintains a controlled vertical rhythm. The "Assumptions" badge moves from a stacked position to an absolute-positioned overlay to save vertical space.

## Elevation & Depth

This design system avoids heavy shadows and physical metaphors. Depth is communicated through **Tonal Layers** and **Subtle Outlines**.

- **Surface Levels:** The base background is `surface-muted`. Cards and primary content containers use `surface-base` with a 1px border (`gray-100`).
- **Shadows:** A single `shadow-sm` (low-opacity, minimal blur) is used for the main container to lift it slightly from the background.
- **Grid Lines:** Inside charts, horizontal grid lines use a dashed `grid-line` stroke (`3 3`). Vertical lines are avoided unless necessary for specific milestone marking, keeping the "path" of the data clear.
- **Interactions:** The chart cursor is a vertical dashed line in the primary plum color, providing a clear "needle" for data inspection.

## Shapes

The shape language is "Soft-Modern." Sharp corners are avoided to make the data feel more approachable and less "institutional."

- **Containers:** Main cards and content areas use `rounded-xl` (12px) to frame the data.
- **Badges/Inlays:** Smaller elements like the "Assumptions" box use `rounded-lg` (8px).
- **Interactive Elements:** Buttons and input fields follow the `rounded-lg` standard to maintain a consistent radius throughout the UI.

## Components

- **Main Data Card:** A `rounded-xl` container with `surface-base` background and `shadow-sm`. Includes a header section with a large `display-value` currency readout.
- **Assumptions Badge:** A secondary container with `surface-muted` background and a `gray-100` border. Used for technical metadata that shouldn't distract from the primary chart.
- **Area Chart:** 
  - **Line:** 3px weight, `#4B0082`, monotone interpolation for smooth curves.
  - **Dots:** Milestone points on the line are shown as 4px circles with a white fill and plum stroke.
  - **Legend:** Minimalist circles matching the line color followed by `label-caps` text.
- **Input Fields:** Flat design with `gray-100` borders. Focus state uses a 2px plum ring.
- **Data Labels (Floating):** When icons are used on charts (e.g., Retirement sun, Wedding cake), they are accompanied by a vertical connector line and `caption-muted` text to explain the milestone.