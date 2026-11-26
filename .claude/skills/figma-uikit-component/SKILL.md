---
name: figma-uikit-component
description: Create a UI Kit component in apps/web/src/shared/ui from a Figma design node via the Figma MCP. Use when the user asks to build, add, or implement a UIkit / UI Kit component from Figma, or provides a figma.com URL or node ID for a shared/ui component.
argument-hint: '[node-id] [name]'
---

# Figma → UI Kit component

Builds a component in `apps/web/src/shared/ui` from a Figma node.

## Arguments

Usage: `/figma-uikit-component <node-id> <name>`, e.g. `/figma-uikit-component 1-2 button`.

- `node-id` — Figma node ID (`1-2` or `1:2`; convert `-` to `:` for the MCP). A full Figma URL is also accepted; then take `fileKey` and `nodeId` from it.
- **Several nodes, one component** — comma-separated IDs (`1-2,1-3,1-4 input`) are variants of the same component: fetch all of them and build one component (see "Multiple Figma variants").
- **Several components** — space-separated `node-id:name` pairs (`1-2:button 5-6:input 7-8:checkbox`). Run the steps below once per pair, creating one file each. Don't merge them.
- `name` — component name in kebab-case, without the `ui-` prefix. If omitted, derive it from the Figma node name and confirm with the user.
- `fileKey` — don't hardcode it. Read `FIGMA_FILE_KEY` from the repo-root `.env` (the project's design file) every time the skill runs, e.g. `grep '^FIGMA_FILE_KEY=' .env`. Read only that line; `.env` also holds secrets, so never print the rest. Only override it if the user passes a URL or key for a different file. If `.env` has no `FIGMA_FILE_KEY`, ask the user.

## Steps

1. **Get the node.** Resolve `fileKey` and `nodeId` from the arguments above (for `/branch/:branchKey/` URLs use `branchKey` as `fileKey`). If no node ID was given, ask for it.
2. **Fetch the design.** Load the `/figma-design-to-code` skill (required by the Figma MCP), call `create_session`, then `get_design_context` and `get_screenshot` for the node.
3. **Adapt, don't copy.** The MCP output is a reference. Rewrite it to fit the project:
   - Tailwind utility classes only. Use the theme tokens from `apps/web/src/app/globals.css` (Figma color palette, Space Grotesk typography). Don't hardcode hex values or arbitrary px values if a token exists; if one is missing, ask before adding it to the theme.
   - Use `clsx` (already installed in `apps/web`) to build `className` when it's conditional or merged: variant/size classes, state classes, or the `className` prop passed by the consumer. Don't use template strings or manual concatenation. A static class string with nothing to merge doesn't need it.
   - Prefer Server Components; add `'use client'` only when the component needs state, effects, or event handlers.
   - Typed props (`interface`/`type`), spread native element props where it makes sense, and expose Figma variants as props (e.g. `variant`, `size`).
   - Don't use image/asset URLs from the MCP output directly; download assets into the project if the component needs them.
   - **Multiple Figma variants → one component.** If the node is a component set (or the design has several nodes for the same component, e.g. input types, empty/filled/disabled), fetch all variants (use `get_metadata` on the set to list them, then `get_design_context` for each differing one) and build a single component. Map them like this:
     - Visual/semantic variants (type, size, style) → a union-typed prop (`variant`, `size`, `type`).
     - `disabled`, `error`, `required`, etc. → the native or boolean prop (`disabled`, `aria-invalid`).
     - Empty / filled → not a prop; it follows from the `value` / `placeholder` of the element.
     - Hover, focus, active, pressed → CSS states (`hover:`, `focus-visible:`, `disabled:`, `placeholder:`), not props.
     - Diff the variants and put only the differences into variant classes; keep shared styles in the base classes.
   - If the variants are really different components (different structure or purpose), ask the user whether to split them into separate files.
4. **Create the file** at `apps/web/src/shared/ui/ui-<name>.tsx`. The filename must start with `ui-`, in kebab-case (e.g. `ui-button.tsx`). Name the exported component in PascalCase (e.g. `UiButton`).
5. **No barrel file.** Consumers import directly from the file (`@/shared/ui/ui-button`). Don't create or update an `index.ts`.
6. **No tests or stories.** Don't add them.
7. **Verify.** Compare the result against the screenshot (layout, spacing, colors, typography, states). Run `npm run lint -w web` and fix any issues in the new file.

## Rules

- Respect FSD: `shared` may not import from any layer above it.
- If the change alters the project structure or conventions, update `apps/web/CLAUDE.md` in the same change.
