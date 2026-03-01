# EV Reimbursement App — Modular Redevelopment Plan

## Context

The EV kWh Reimbursement App is currently a single-page app with 3 files: `index.html` (606 lines), `script.js` (1448 lines), and `styles.css` (594 lines). While fully functional, the codebase has accumulated technical debt:

- **Monkey-patching**: `saveData`, `loadData`, and `generateKwhFields` are overwritten after definition to add profile scoping
- **Date parsing duplication**: The same YYYY-MM-DD split-and-construct pattern appears 12+ times
- **No modularity**: All 1448 lines of JS live in global scope in one file
- **Mixed initialization**: Both `window.onload` and multiple `DOMContentLoaded` listeners
- **Undefined reference**: `renderSummaryTable` called on line 729 but never defined

The goal is to redevelop with clean ES module architecture while preserving every existing feature and maintaining zero-build-tool simplicity.

## Architecture

```
index.html                 (semantic HTML, <script type="module">)
css/
  variables.css            (CSS custom properties, theme tokens)
  base.css                 (reset, typography, layout)
  components.css           (cards, modals, buttons, forms)
  animations.css           (keyframes, transitions)
  responsive.css           (media queries)
js/
  app.js                   (entry point — init, event wiring)
  utils/dates.js           (parseLocalDate, ymd, dateRange)
  storage.js               (profile-scoped localStorage wrapper)
  profiles.js              (profile CRUD, dropdown UI)
  billing.js               (tiered rate logic, cost calculations)
  fields.js                (kWh field generation, validation, loading states)
  csv.js                   (CSV template generation, import with validation)
  chart.js                 (Chart.js wrapper, dark mode theming)
  summary.js               (dashboard summary card updates)
  exports/excel.js         (SheetJS Excel export)
  exports/pdf.js           (jsPDF PDF export)
  feedback.js              (star rating, form, mailto generation)
  ui.js                    (tooltips, dark mode toggle, button loading helpers)
```

## Key Refactoring Decisions

### 1. ES Modules (`<script type="module">`)
- Each file exports specific functions
- `app.js` is the single entry point that imports and wires everything
- No build step required — browsers natively support ES modules
- **Note**: Must serve via HTTP (not `file://`) for modules. GitHub Pages works fine. For local dev, `npx serve .` or Python's `http.server`

### 2. Centralized Date Parsing
Extract `parseLocalDate(dateStr)` into `utils/dates.js` to eliminate the 12 duplicated `split('-')` → `new Date(...)` patterns. Also export `ymd(date)`, `dateRange(start, end)`, and `isValidDateRange(start, end)`.

### 3. Profile-Scoped Storage
Replace monkey-patching with a clean `Storage` module that natively supports profile scoping:
```js
// storage.js exports
getItem(key)         // auto-scoped to current profile
setItem(key, value)  // auto-scoped to current profile
getCurrentProfile()
setCurrentProfile(name)
getProfiles() / setProfiles(list)
saveAllFormData()    // reads DOM, writes to storage
loadAllFormData()    // reads storage, writes to DOM
```

### 4. Clean Event Architecture
- Single `DOMContentLoaded` listener in `app.js` that calls init functions from each module
- No monkey-patching — each module owns its logic from the start
- Event delegation where appropriate (kWh input changes)

### 5. CSS Organization
Split `styles.css` into logical files using `@import` in a main stylesheet. CSS custom properties already exist but will be expanded for better theming.

### 6. localStorage Backward Compatibility
The new storage module will read both old-format keys (`startDate`, `dailyKwhData`) and new profile-scoped keys (`Default__startDate`) to prevent data loss for existing users.

## Feature Preservation Checklist

Every feature below MUST work identically in the redeveloped version:

- [ ] Profile management (add, delete, switch, Default protected)
- [ ] Billing period date selection with auto field generation
- [ ] Manual kWh entry with per-day fields
- [ ] CSV template download with billing period dates
- [ ] CSV import with validation (date range, format, error highlighting)
- [ ] Cost per kWh input
- [ ] Tiered rate billing (tier 1 limit, tier 1 rate, tier 2 rate, cumulative calculation)
- [ ] Dual-axis Chart.js visualization (kWh + cost)
- [ ] Dashboard summary (total kWh, total cost, avg daily, completeness %)
- [ ] Calculate Reimbursement button with result display
- [ ] Excel export with daily breakdown and totals
- [ ] PDF export with professional formatting
- [ ] Dark mode toggle with full component coverage
- [ ] Feedback form (star rating, type, message, mailto generation)
- [ ] Site help modal with comprehensive instructions
- [ ] EV Policy modal with Siemens policy text
- [ ] Changelog modal with version history
- [ ] Travel@Siemens external link
- [ ] Input validation (negative/high kWh warnings)
- [ ] Loading spinners on all async operations
- [ ] Tooltips on all interactive elements
- [ ] ARIA labels and keyboard navigation
- [ ] Mobile responsive layout (< 600px)
- [ ] Smooth animations (field fade-in, result highlight, summary fade)
- [ ] Progressive auto-save on all input changes
- [ ] Reset function that clears all data

## Implementation Order

1. **Create directory structure** — `js/`, `css/`, `js/utils/`, `js/exports/`
2. **Extract `utils/dates.js`** — Central date utilities
3. **Extract `storage.js`** — Profile-scoped localStorage with backward compat
4. **Extract `ui.js`** — Button loading helpers, dark mode toggle, tooltips
5. **Extract `billing.js`** — Tiered rate logic, cost computation
6. **Extract `fields.js`** — kWh field generation, validation, loading states
7. **Extract `csv.js`** — Template generation, CSV import
8. **Extract `chart.js`** — Chart.js rendering with dark mode support
9. **Extract `summary.js`** — Dashboard summary updates
10. **Extract `exports/excel.js`** and **`exports/pdf.js`** — Export functions
11. **Extract `profiles.js`** — Profile UI management
12. **Extract `feedback.js`** — Feedback form and star rating
13. **Create `app.js`** — Single entry point that imports and initializes all modules
14. **Split CSS** — Break `styles.css` into organized partials
15. **Rewrite `index.html`** — Clean semantic HTML with module script tag
16. **Test all features** — Verify against feature checklist

## Critical Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `index.html` | Rewrite | Clean HTML, `<script type="module">` |
| `script.js` | Delete | Replaced by `js/` modules |
| `styles.css` | Delete | Replaced by `css/` partials |
| `js/app.js` | Create | Entry point |
| `js/utils/dates.js` | Create | Date utilities |
| `js/storage.js` | Create | localStorage wrapper |
| `js/profiles.js` | Create | Profile management |
| `js/billing.js` | Create | Tiered rates, calculations |
| `js/fields.js` | Create | kWh field generation |
| `js/csv.js` | Create | CSV import/export |
| `js/chart.js` | Create | Chart rendering |
| `js/summary.js` | Create | Dashboard summary |
| `js/exports/excel.js` | Create | Excel export |
| `js/exports/pdf.js` | Create | PDF export |
| `js/feedback.js` | Create | Feedback form |
| `js/ui.js` | Create | UI helpers |
| `css/variables.css` | Create | CSS custom properties |
| `css/base.css` | Create | Base styles |
| `css/components.css` | Create | Component styles |
| `css/animations.css` | Create | Keyframes |
| `css/responsive.css` | Create | Media queries |

## Verification

1. **Local server**: `npx serve .` or `python3 -m http.server` (ES modules need HTTP)
2. **Feature testing**: Walk through every item on the Feature Preservation Checklist
3. **Profile data migration**: Create data in old format, verify it loads in new version
4. **Dark mode**: Toggle and verify all modals, chart, inputs, summary
5. **Mobile**: Resize to < 600px, verify layout
6. **Exports**: Test CSV template, CSV import, Excel export, PDF export with sample data
7. **Browser console**: Verify no errors or warnings
