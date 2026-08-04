# Application shell architecture

This is the reusable shell boundary for future product modules. `AppShell` composes the top navigation, collapsible/persistent sidebar, notifications, search, command palette, quick actions, breadcrumbs, status bar, and responsive behavior. `layouts.tsx` exposes authenticated, guest, admin, instructor, student, enterprise, landing, and product-specific layout wrappers.

The shell is intentionally additive in this phase. Existing Academy, Dashboard, Reader, and Admin surfaces are not wrapped yet because the request explicitly prohibits redesigning them. Migration should be done one route group at a time after visual parity tests.

Keyboard contracts: `Ctrl/Cmd+K` command palette, `Ctrl/Cmd+/` global search, `Ctrl/Cmd+B` sidebar toggle, and `Escape` closes overlays. All state is local UI state; no backend or business logic is introduced.
