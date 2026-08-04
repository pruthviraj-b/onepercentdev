# One Percent Design System

The design system is a namespaced, additive layer for future product work. It centralizes semantic tokens, themes, accessibility primitives, icon contracts, responsive conventions, and reusable components without migrating existing pages in this phase.

Import `frontend/design-system/index.css` for styles and import from `frontend/design-system/index.ts` for components and tokens. Existing page styles remain the source of truth until each product surface is intentionally migrated.

Supported themes: `light`, `dark`, and `high-contrast`. Use `ThemeProvider` and `useTheme` for controlled theme selection. Components use `--ds-*` variables so future themes can be added without rewriting component code.
