# CLAUDE.md — EV Reimbursement App

## Project Overview
Siemens EV kWh Reimbursement PWA built by Caleb O'Hara. ES modules with no build tools, served via GitHub Pages or local HTTP server. All data stored in localStorage (no backend).

## Architecture
- **Entry point**: `index.html` → `js/app.js` (ES module)
- **Event handling**: `data-action` attribute delegation in `app.js` switch statement
- **Storage**: Profile-scoped localStorage via `js/storage.js` (`getItem`/`setItem` auto-scope to current profile)
- **Global storage**: Tour flag, dark mode, rate presets use direct `localStorage` (not profile-scoped)
- **CSS**: 6 files — `variables.css`, `base.css`, `components.css`, `animations.css`, `responsive.css`, `tour.css`
- **Styling**: CSS custom properties in `variables.css`, Siemens teal `#009999` accent
- **Collapsibles**: Native `<details>/<summary>` with `.section-collapsible` class, shown via `.show` class added by JS

## Dev Server
```bash
npx serve -l 8080 .
```
Config in `.claude/launch.json` — use `preview_start` with name `"dev"`.

## Version Management (CRITICAL)
Every feature or fix requires version bumps in ALL of these locations:
1. `index.html` — footer `<span>v3.x.x</span>`
2. `index.html` — changelog modal (add new `<h6>Version X.X.X</h6>` + `<ul>` entry)
3. `js/feedback.js` — `const APP_VERSION = 'X.X.X'`
4. `js/stats.js` — `const APP_VERSION = 'X.X.X'`
5. `js/exports/receipt.js` — footer text `v3.x`
6. `sw.js` — comment header AND `CACHE_NAME = 'ev-reimburse-vX.X.X'`
7. `README.md` — Version History section

**Versioning scheme**: SemVer — Major.Minor.Patch
- Major: complete redesign or breaking changes
- Minor: new features (e.g., new section, new export type)
- Patch: bug fixes, security fixes, ADA improvements, small enhancements

**Service Worker**: Also add any new JS/CSS files to `APP_SHELL_RELATIVE` array in `sw.js`.

## README.md Updates
When adding features, update THREE places in README:
1. **Features list** (top section) — short bullet point
2. **Architecture listing** — add new files to the code tree
3. **Version History** — full changelog entry

## Security Standards
- **Never use innerHTML with user data** — use `createElement` + `.textContent` / `.value`
- innerHTML is acceptable ONLY for hardcoded HTML (icons, static markup)
- All `JSON.parse` calls wrapped in try-catch with safe defaults
- CSP meta tag in index.html — update if adding new CDN sources
- CDN scripts use SRI (subresource integrity) hashes

## ADA / WCAG Compliance
Every new interactive element needs:
- `aria-label` on buttons, inputs, and semantic containers
- `role` attributes where native semantics are insufficient (e.g., `role="figure"` on stat cards, `role="group"` on collections)
- `aria-live="polite"` on dynamically updated regions
- `aria-expanded` on toggle checkboxes that show/hide content
- `:focus-visible` outline support (already global in `base.css`)
- WCAG AA color contrast (4.5:1 minimum) — check `--text-muted` values in both themes
- Skip navigation link exists at top of body

## Guided Tour
When adding new visible sections, add a tour step in `js/tour.js` STEPS array:
```js
{ selector: '#newSectionId', title: 'Section Name', body: 'Description of what this section does.' }
```
The tour automatically skips hidden elements (sections without `.show` class).

## UI Patterns
- **Collapsible sections**: `<details class="section section-collapsible" id="xxxBox">` with `<summary class="collapsible-header">` — JS adds `.show` class when content is available
- **Buttons**: Use `data-action="action-name"` and handle in `app.js` click delegation switch
- **Modals**: Bootstrap 5 modals with `modal-dialog-centered modal-dialog-scrollable`
- **Mobile**: Modals constrained to `92vw` at `<600px` breakpoint
- **Dark mode**: `body.dark-mode` class, toggled via `data-action="toggle-dark-mode"`
- **Gradient background**: Subtle mesh radial gradients in `base.css` (teal glow dark mode, faint wash light mode)
- **Loading states**: `showButtonLoading()` / `resetButtonLoading()` from `ui.js`
- **Tooltips**: Bootstrap tooltips initialized by `initializeTooltips()` in `ui.js`

## Workflow Preferences
- Always verify changes with preview tools after editing (clear SW cache, reload, check console errors)
- Proactively check for security issues and ADA compliance when adding new features
- Use safe DOM APIs for all dynamic content rendering
- Keep the guided tour updated with new sections
- Update the disclaimer modal's "Last updated" date when making significant changes
- Test both dark mode and light mode
- Test mobile (375px) for responsive issues

## File Naming
- JS modules: lowercase, descriptive (e.g., `stats.js`, `tour.js`, `billing.js`)
- CSS: categorical (e.g., `components.css`, `responsive.css`)
- No build step — files served directly

## Key Dependencies (CDN)
- Bootstrap 5.3.0 (CSS + JS bundle)
- Bootstrap Icons 1.10.5
- Chart.js (latest)
- SheetJS / XLSX 0.18.5
- jsPDF 2.5.1 + jsPDF-AutoTable 3.7.0
