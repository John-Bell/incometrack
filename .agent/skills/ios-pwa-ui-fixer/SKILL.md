---
name: ios-pwa-ui-fixer
description: Modifies React and Tailwind UI components, specifically date inputs or form fields, to ensure they do not overflow their containers and render correctly on iOS Safari and PWAs.
---

# iOS PWA UI Fixer Skill
This skill ensures that form inputs (especially date/month types) do not break out of their flex/grid constraints on iOS Safari.

## Instructions
1. **Analyze the Input**: Review the React component and its existing Tailwind classes.
2. **Apply Core iOS Resets (Always)**: 
   - Append `min-w-0` to allow flex children to shrink below their content size.
   - Append `max-w-full` and `block` to enforce strict boundary constraints.
   - Append `appearance-none` to strip erratic default native styling.
3. **Apply Conditional Resets**:
   - IF the original input contains any `dark:` utility classes (e.g., `dark:bg-primary`), you MUST also append `dark:[color-scheme:dark]` to ensure the native iOS date picker popover matches the app's dark mode state.
   - IF the original input does not have dark mode classes, DO NOT add `dark:[color-scheme:dark]`.
4. **Follow the Examples**: Review the `examples/` directory to see how this logic is applied to both light and dark components.

## Constraints
- Never remove the user's existing aesthetic utility classes (colors, padding, text size). 
- Only append the structural iOS fixes.