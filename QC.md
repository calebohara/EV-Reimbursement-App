# QC.md — Quality Control Checklist

EV kWh Reimbursement App quality control procedures for verifying features, ADA compliance, PWA behavior, and export correctness.

---

## General QC Process

### Pre-Check
- [ ] App loads in browser without console errors (`npx serve -l 8080 .`)
- [ ] No broken imports (check Network tab for 404s on JS/CSS files)
- [ ] Service worker registers successfully (Application > Service Workers in DevTools)
- [ ] PWA installable (install prompt appears or is dismissable)
- [ ] localStorage readable and profile-scoped data persists on reload
- [ ] Both light and dark themes render without broken colors or invisible text

### Version Sync Check (CRITICAL — 7 locations must match)
- [ ] `index.html` footer `<span>vX.X.X</span>` matches target version
- [ ] `index.html` changelog modal has entry for target version
- [ ] `js/feedback.js` — `const APP_VERSION` matches
- [ ] `js/stats.js` — `const APP_VERSION` matches
- [ ] `js/exports/receipt.js` — footer text `vX.X` matches
- [ ] `sw.js` — comment header AND `CACHE_NAME` matches
- [ ] `README.md` — Version History section has entry

### Cross-Theme Testing
Every significant feature must be verified in:
1. **Light mode** (`data-theme="light"`)
2. **Dark mode** (`data-theme="dark"`)
3. **System mode** (`data-theme="system"`) — respects `prefers-color-scheme`

---

## Feature: Profiles

### Overview
Users can create multiple profiles to track different vehicles or billing periods. Each profile stores its own setup, kWh fields, history, and rate data independently in localStorage.

### Storage Checks
- [ ] New profile creates scoped localStorage keys (not polluting default namespace)
- [ ] Switching profiles loads correct data without cross-contamination
- [ ] Deleting a profile removes all scoped keys from localStorage
- [ ] Profile select dropdown updates immediately after add/delete

### UI Checks
- [ ] Profile select (`#profileSelect`) shows all profiles in order
- [ ] "Add Profile" button (`#addProfileBtn`) prompts for name and creates it
- [ ] "Delete Profile" button (`#deleteProfileBtn`) prompts confirmation before deleting
- [ ] Cannot delete the last remaining profile
- [ ] Profile help tooltip (`#profileHelpBtn`) displays correctly
- [ ] Switching profiles clears and reloads kWh fields and results

### Edge Cases
- [ ] Profile name with special characters doesn't break localStorage keys
- [ ] Very long profile name truncates gracefully in dropdown
- [ ] Rapid add/delete doesn't corrupt profile list

---

## Feature: Setup — Dates, Rate, Tiered Rates, Additional Charges

### Overview
The Setup section captures billing period dates, per-kWh rate, optional tiered rates, and optional additional flat/percentage charges.

### Date Fields
- [ ] Start date (`#startDate`) saves and restores correctly
- [ ] End date (`#endDate`) saves and restores correctly
- [ ] kWh fields generate when valid dates are entered
- [ ] Invalid date range (end before start) shows appropriate error or prevents field generation

### Rate Fields
- [ ] Cost per kWh (`#costPerKwh`) saves and restores
- [ ] Rate preset select (`#ratePresetSelect`) populates from saved presets
- [ ] Applying a preset fills the rate field correctly

### Tiered Rates
- [ ] "Use Tiered Rates" toggle (`#useTieredRates`) shows/hides `#tierFields`
- [ ] Tier 1 limit (`#tier1Limit`) and rate (`#tier1Rate`) enable when tiered is on
- [ ] Tier 2 rate (`#tier2Rate`) enables when tiered is on
- [ ] Tiered calculation produces correct split amounts (verified against manual math)
- [ ] Disabling tiered rates reverts to flat rate calculation

### Additional Charges
- [ ] "Additional Charges" toggle (`#useAdditionalCharges`) shows/hides `#additionalChargesFields`
- [ ] "Add Charge" button creates new charge row with name + amount/percent fields
- [ ] "Remove Charge" button removes the correct row
- [ ] Charges apply correctly to the final total
- [ ] Charges persist across page reload

---

## Feature: kWh Usage Entry

### Overview
Users enter daily kWh values for each day in the billing period. Supports manual entry and CSV bulk import.

### Manual Entry
- [ ] kWh fields (`#kwhFields`) generate one input per day in the date range
- [ ] Fields are labeled correctly with dates
- [ ] Entering values updates the summary inline (total kWh, avg daily, completeness)
- [ ] `#progressBar` updates to reflect days with data vs total days
- [ ] Empty fields are treated as 0 in calculation (not NaN)
- [ ] Values persist in localStorage on input/blur

### CSV Import
- [ ] "Download CSV Template" generates a valid CSV with correct date column
- [ ] Uploading a valid CSV fills all matching kWh fields
- [ ] CSV with extra columns doesn't break import
- [ ] CSV with wrong dates shows error or skips non-matching rows
- [ ] CSV modal (`#helpModal`) opens and renders correctly
- [ ] Invalid file type (non-CSV) shows appropriate error

### Summary Bar
- [ ] `#totalKwh` shows correct summed value
- [ ] `#avgDaily` shows correct per-day average (sum / total days)
- [ ] `#completeness` shows correct percentage (days with data / total days)
- [ ] `#daysWithData` and `#totalDays` match the date range

---

## Feature: Calculate & Results

### Overview
The Calculate button computes the reimbursement total from kWh entries and rate settings, displaying the hero result and enabling exports.

### Calculation
- [ ] Flat rate: total = sum(kWh) × rate per kWh
- [ ] Tiered rate: correct split between tier 1 and tier 2
- [ ] Additional charges: added correctly on top of base
- [ ] `#result` hero amount displays formatted currency
- [ ] `#totalCost` visually-hidden span updates (used by screen readers)
- [ ] `#resultSection` becomes visible after calculation

### Export Buttons
- [ ] Export row (`#exportRow`) appears after successful calculation
- [ ] "Export Excel" button triggers download
- [ ] "Export PDF" button triggers download
- [ ] "Export Receipt" button triggers download
- [ ] All three exports contain correct period, rate, and total values
- [ ] Export filenames are sanitized (no path traversal characters)

### Reset
- [ ] "Reset" button (`data-action="reset"`) clears fields and results
- [ ] Reset does NOT delete profile data from localStorage (only clears form state)

---

## Feature: Charts

### Overview
Two collapsible chart sections: usage/cost bar chart and a trend chart across history periods.

### Usage Chart (`#chartBox`)
- [ ] `<details id="chartBox">` opens to reveal chart canvas
- [ ] Chart renders after calculate with correct kWh per day bars
- [ ] Chart updates on recalculate
- [ ] Chart is accessible (`aria-label` on canvas)
- [ ] Chart renders correctly in both light and dark themes (axis labels readable)

### Trend Chart (`#trendBox`)
- [ ] `<details id="trendBox">` opens to reveal trend canvas
- [ ] Trend chart renders using archived history data
- [ ] Trend insight (`#trendInsight`) displays meaningful text
- [ ] Empty state shown when no history exists
- [ ] Chart is accessible (`aria-label` on canvas)

---

## Feature: History & Archive

### Overview
Users can archive the current billing period to history, view past periods, restore them, export them as PDF, or delete them.

### Archiving
- [ ] "Archive Period" button saves current period data to history
- [ ] Archived period appears in `#historyList` immediately
- [ ] Archive includes: dates, rate, kWh values, total, tiered info, additional charges

### History List
- [ ] `<details id="historyBox">` opens to show list
- [ ] Each history entry shows period dates and reimbursement total
- [ ] "Restore" button loads that period's data into the main form
- [ ] "Delete" button removes the entry with confirmation
- [ ] "Export PDF" button per entry generates a correct single-period PDF
- [ ] Empty state shown when no history exists

### Edge Cases
- [ ] Archiving with no kWh data warns or prevents archive
- [ ] Restoring overwrites current unsaved data (with warning or silently per design)
- [ ] Multiple archives don't exceed localStorage limits gracefully

---

## Feature: Stats & Environmental Impact

### Overview
Two collapsible stat sections: environmental impact stats and "nerd stats" with detailed usage metrics.

### Environmental Stats (`#statsBox`)
- [ ] `<details id="statsBox">` opens to reveal stats grid
- [ ] Stats only render after a calculation has been performed
- [ ] CO₂ avoided, trees equivalent, and other metrics display
- [ ] `role="group"` and `aria-label` present on stats container
- [ ] Values update on recalculate

### Nerd Stats (`#nerdsBox`)
- [ ] `<details id="nerdsBox">` opens to reveal detailed stats
- [ ] Shows app version, build info, detailed usage breakdown
- [ ] `APP_VERSION` in `stats.js` matches version in `feedback.js` and `sw.js`

---

## Feature: Exports (Excel, PDF, Receipt)

### Overview
Three export formats: Excel spreadsheet (SheetJS), multi-page PDF (jsPDF + AutoTable), and a receipt PDF (jsPDF).

### Excel Export (`js/exports/excel.js`)
- [ ] File downloads as `.xlsx`
- [ ] Contains billing period header info (dates, rate, total)
- [ ] Contains daily kWh table
- [ ] Opens correctly in Excel/Google Sheets
- [ ] Filename is descriptive and sanitized

### PDF Export (`js/exports/pdf.js`)
- [ ] File downloads as `.pdf`
- [ ] Contains header: profile name, period, rate
- [ ] Contains kWh table with all days
- [ ] Contains totals summary and additional charges breakdown
- [ ] Renders in both single and multi-page layouts
- [ ] Tiered rate breakdown shown when applicable

### Receipt Export (`js/exports/receipt.js`)
- [ ] File downloads as `.pdf`
- [ ] Single-page receipt format
- [ ] Shows Siemens branding/context
- [ ] Footer contains app version (`vX.X`)
- [ ] Total amount prominently displayed

### Cross-Export Checks
- [ ] All exports use `createElement`/`textContent` or safe methods — no user data in `innerHTML`
- [ ] `URL.revokeObjectURL()` called after each download trigger

---

## Feature: Rate Presets

### Overview
Users can save the current rate configuration as a named preset and apply saved presets to quickly fill rate fields.

### Checks
- [ ] "Save as Preset" saves current rate (and tiered config) under a name
- [ ] Preset appears in `#ratePresetSelect` dropdown immediately
- [ ] Applying a preset fills `#costPerKwh` and tiered fields correctly
- [ ] "Delete Preset" removes selected preset from dropdown and localStorage
- [ ] Presets persist across page reload
- [ ] Preset with duplicate name handled gracefully

---

## Feature: Guided Tour

### Overview
First-run guided tour walks users through each major section using `js/tour.js`.

### Checks
- [ ] Tour launches automatically for new users (flag stored in global localStorage)
- [ ] Tour re-launchable via `data-action="start-tour"` button
- [ ] Each step targets the correct element selector
- [ ] Steps skip hidden/collapsed sections gracefully
- [ ] Tour completes and sets the `tour_seen` flag
- [ ] Tour overlay does not break layout or leave behind orphaned elements
- [ ] Tour works in both light and dark themes

---

## Feature: Themes

### Overview
Theme switcher supports light, dark, and system modes. System mode respects `prefers-color-scheme`.

### Checks
- [ ] Light theme applies correctly (teal accent, white background)
- [ ] Dark theme applies `body.dark-mode` and dark backgrounds
- [ ] System theme follows OS preference
- [ ] Selected theme persists in global localStorage across reload
- [ ] `data-theme` buttons set the active state visually
- [ ] No invisible text or zero-contrast elements in either theme
- [ ] Charts re-render with theme-appropriate colors on switch

---

## Feature: Feedback / Contact Modal

### Overview
Feedback form in a Bootstrap modal allows users to submit star ratings, category, message, and name via `mailto:` or fetch.

### Checks
- [ ] Modal (`#contactModal`) opens and closes correctly
- [ ] Star rating (`#starRating`) is keyboard accessible and ARIA-labeled
- [ ] Rating text (`#ratingText`) updates on star hover/click
- [ ] Category select (`#feedbackType`) shows all options
- [ ] Message textarea (`#feedbackMessage`) validates (required)
- [ ] Submit button shows loading state via `showButtonLoading()`
- [ ] Success toast shown after submission
- [ ] Form resets after successful submission
- [ ] App version included in submitted payload

---

## Feature: PWA & Service Worker

### Overview
App is installable as a PWA. Service worker caches app shell for offline use.

### Checks
- [ ] `manifest.json` has correct icons, name, and theme color
- [ ] Service worker registers without errors
- [ ] App shell loads offline after first visit (all critical JS/CSS cached)
- [ ] New deployments bust the cache (new `CACHE_NAME` version)
- [ ] Old caches are deleted on SW activation
- [ ] PWA install banner (`#pwaInstallBanner`) appears on eligible browsers
- [ ] iOS install overlay (`#iosInstallOverlay`) appears on iOS Safari
- [ ] Install banner can be dismissed and stays dismissed (localStorage flag)
- [ ] `APP_SHELL_RELATIVE` in `sw.js` includes all current JS/CSS files

---

## ADA / WCAG Compliance Checks

### Every New Interactive Element
- [ ] All `<input>`, `<select>`, `<textarea>` have `aria-label` or associated `<label>`
- [ ] Icon-only buttons have `aria-label`
- [ ] Dynamically updated regions have `aria-live="polite"`
- [ ] Toggle checkboxes that show/hide content have `aria-expanded`
- [ ] Custom widgets have appropriate `role` attributes
- [ ] `role="group"` on stat card containers
- [ ] `:focus-visible` outlines work on all interactive elements
- [ ] WCAG AA contrast (4.5:1 minimum) in both light and dark themes
- [ ] Skip navigation link at top of `<body>` is present and functional
- [ ] Modal focus is trapped while open; returns to trigger on close
- [ ] Touch targets minimum 44×44px on mobile

---

## Security Checks

- [ ] No `innerHTML` used with user-supplied data (only hardcoded markup)
- [ ] All `JSON.parse` calls are wrapped in `try/catch` with safe defaults
- [ ] Export filenames are sanitized (no `../` or shell-special characters)
- [ ] No API keys, secrets, or credentials in any JS file
- [ ] CSP meta tag in `index.html` covers all CDN sources
- [ ] CDN `<script>` and `<link>` tags use SRI (`integrity=` + `crossorigin=`) hashes
- [ ] `URL.revokeObjectURL()` called after every blob download

---

## Adding New Features to QC

When adding a new feature, create a new section following this template:

### Template
```
## Feature: [Feature Name]

### Overview
[1-2 sentence description]

### Storage Checks (if applicable)
- [ ] Data saves to localStorage under correct scoped key
- [ ] Data restores correctly on reload

### UI Checks
- [ ] Component renders correctly
- [ ] Form validation works
- [ ] Error/empty states handled
- [ ] Loading states shown

### ADA Checks
- [ ] aria-label on interactive elements
- [ ] aria-live on dynamic regions
- [ ] Keyboard accessible

### Edge Cases
- [ ] [Feature-specific edge cases]
```

---
---

# EV Reimbursement App — QA Testing Playbook

> Comprehensive QA prompts for the EV kWh Reimbursement App. Contains two tools:
> 1. **5-Agent QA Sweep** — full-app code review across UI, storage, exports, ADA, and security
> 2. **Edge-Case Test Scenario Generator** — generates manual test cases for critical paths

---

## Part 1: 5-Agent QA Sweep

> Paste this section into Claude Code to run a full code-review sweep.
> Do NOT commit or push — report findings only.

### System Role

You are a senior QA engineer reviewing the **EV kWh Reimbursement App**, a vanilla JavaScript PWA built by Caleb O'Hara for Siemens employees to track EV charging reimbursements. The app has **no build step** — ES modules are served directly. All persistence uses **localStorage** (no backend, no IndexedDB, no sync). It is deployed via GitHub Pages.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Vanilla JavaScript (ES modules, no TypeScript) |
| UI Framework | None — plain HTML5 + CSS custom properties |
| CSS | 6 files: `variables.css`, `base.css`, `components.css`, `animations.css`, `responsive.css`, `tour.css` |
| Component Library | Bootstrap 5.3.0 (CDN) |
| Icons | Bootstrap Icons 1.10.5 (CDN) |
| Charts | Chart.js (CDN) |
| Excel Export | SheetJS / XLSX 0.18.5 (CDN) |
| PDF Export | jsPDF 2.5.1 + jsPDF-AutoTable 3.7.0 (CDN) |
| Storage | `localStorage` via `js/storage.js` (profile-scoped `getItem`/`setItem`) |
| PWA | Service worker (`sw.js`) with app-shell caching |
| Event Handling | `data-action` attribute delegation in `js/app.js` switch statement |
| Routing | Single-page app — `index.html` only |

### Pre-Sweep: BUGS.md Review (MANDATORY)

Before launching any agents, **every sweep must**:

1. **Read `BUGS.md`** in full — load all previous sweeps, issues, and fixes into context
2. **Check regression targets** — any issue previously marked `FIXED` must be re-verified. If regressed, flag `[REGRESSION]` with Critical severity
3. **Re-evaluate skipped items** — carry forward or escalate as appropriate
4. **Deduplicate** — do NOT re-report issues already in BUGS.md unless changed or regressed
5. **Learn from history** — use past fix patterns to inform current scan

> **Why**: Without BUGS.md context, sweeps repeat known issues and lose institutional knowledge.

### Instructions

Run **5 parallel review agents**, each covering a distinct area. Do NOT commit or push — report findings only.

---

### Agent 1: UI & Interaction Testing

Test every section and modal for rendering, state, and interaction bugs.

**Sections to test** (from `index.html`):

| Section | ID | Features |
|---------|----|----------|
| Setup | `#setupSection` | Dates, cost/kWh, tiered rates, additional charges, rate presets |
| Usage Entry | `#usageSection` | kWh daily inputs, CSV import, inline summary |
| Results | `#resultSection` | Hero result, export row, summary chips |
| Usage Chart | `#chartBox` | Daily bar chart (collapsible) |
| History | `#historyBox` | Archive, restore, delete, PDF export (collapsible) |
| Trend Chart | `#trendBox` | Multi-period trend (collapsible) |
| Stats | `#statsBox` | Environmental impact stats (collapsible) |
| Nerd Stats | `#nerdsBox` | Detailed metrics, app version (collapsible) |
| Footer | — | Storage indicator, version, links |

**Modals to test**:
- `#helpModal` — CSV import help
- `#contactModal` — Feedback form
- `#siteHelpModal` — How to use
- `#evPolicyModal` — EV policy
- `#changelogModal` — Version changelog
- `#disclaimerModal` — Disclaimer

**Check for**:

- [ ] Sections that render blank or throw console errors on mount
- [ ] Collapsible `<details>` sections that don't open/close or lose JS state
- [ ] Buttons whose `data-action` is not handled in `app.js` switch (silent no-ops)
- [ ] Forms that don't validate, save, or restore on reload
- [ ] Loading states missing: `showButtonLoading()` not called on async actions
- [ ] Empty states missing when lists have zero items (history, presets)
- [ ] Toast/feedback missing for success and error actions
- [ ] Dark mode rendering: invisible text, zero-contrast borders, wrong backgrounds
- [ ] Theme switch doesn't update Chart.js axis labels/tick colors
- [ ] `data-tour` attributes missing on new sections (breaks guided tour steps)
- [ ] Profile switching leaves stale data in form fields

**Dialog & Popup Quality**:

- [ ] Modals scrollable when content exceeds viewport height
- [ ] Consistent padding and field spacing inside modals
- [ ] Clicking outside or pressing Escape closes modals
- [ ] Bootstrap tooltip initialization covers all `data-bs-toggle="tooltip"` elements

---

### Agent 2: localStorage & Data Layer Testing

Test all localStorage operations, profile scoping, and data integrity.

**Key file**: `js/storage.js` — `getItem`/`setItem` with profile-scoped keys

**Check for**:

- [ ] All profile-scoped keys properly prefixed (pattern: `profile_{name}_*`)
- [ ] Global keys (tour flag, theme, presets) NOT accidentally profile-scoped
- [ ] No data leaks between profiles on switch
- [ ] `clearAllData()` removes all app keys without touching unrelated localStorage keys
- [ ] `getStorageUsage()` reports correct byte count
- [ ] Every write operation uses safe JSON with `try/catch` on `JSON.parse`
- [ ] `JSON.stringify` used on objects before storage (not `[object Object]`)
- [ ] History array serialized/deserialized correctly (array of objects, not stringified array of strings)
- [ ] Additional charges array persists as structured data
- [ ] Rate preset array persists and restores correctly
- [ ] No mutation of retrieved objects before intentional save (clone before modify pattern)

---

### Agent 3: Export & Calculation Testing

Test correctness of all calculations and all three export formats.

**Key files**: `js/billing.js`, `js/summary.js`, `js/exports/excel.js`, `js/exports/pdf.js`, `js/exports/receipt.js`

**Calculation Checks**:

- [ ] Flat rate: `total = sum(kWh) × costPerKwh` — verify with known inputs
- [ ] Tiered rate: kWh ≤ tier1Limit at tier1Rate, remainder at tier2Rate
- [ ] Tiered edge cases: exactly at limit, zero kWh, only tier 2
- [ ] Additional charges: flat amounts added correctly, percentage applied to base total
- [ ] `#totalKwh`, `#avgDaily`, `#completeness` chips match hand-computed values
- [ ] Empty kWh fields treated as 0 (not NaN causing `$NaN` result)

**Export Checks**:

- [ ] Excel: downloads as `.xlsx`, opens in Excel/Sheets, contains all days and totals
- [ ] PDF: downloads as `.pdf`, renders header, daily table, and summary
- [ ] Receipt: downloads as `.pdf`, single-page, shows total, version footer
- [ ] All three: export data matches what's displayed in the UI
- [ ] Filenames do not contain user input verbatim (sanitized)
- [ ] `URL.revokeObjectURL()` called after each blob URL used for download

---

### Agent 4: ADA / WCAG & Security Testing

**Accessibility (WCAG 2.1 AA)**:

- [ ] All form inputs have `aria-label` or associated `<label>` element
- [ ] Icon-only buttons (`#addProfileBtn`, `#deleteProfileBtn`, etc.) have `aria-label`
- [ ] `aria-live="polite"` on `#summaryBox` and `#resultBox` for dynamic updates
- [ ] `aria-expanded` on toggle checkboxes that show/hide content
- [ ] `role="group"` + `aria-label` on stat card containers (`#statsContent`, `#nerdsContent`)
- [ ] `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on `#progressBar`
- [ ] Star rating (`#starRating`) keyboard navigable with `role="group"` and individual labels
- [ ] Modal focus trapped while open; returns to trigger element on close
- [ ] Skip navigation link at `<body>` start present and functional
- [ ] `:focus-visible` outlines visible on all interactive elements (not hidden by CSS)
- [ ] WCAG AA color contrast in both light and dark themes (especially muted text)
- [ ] Touch targets minimum 44×44px at 375px viewport

**Security**:

- [ ] No `innerHTML` used with profile names, kWh values, preset names, or any user-supplied text
- [ ] All `JSON.parse` calls wrapped in `try/catch` with safe fallback values
- [ ] CDN resources use SRI (`integrity` + `crossorigin`) attributes
- [ ] CSP meta tag covers all CDN domains (Bootstrap, Chart.js, SheetJS, jsPDF)
- [ ] No API keys, email credentials, or tokens in any JS file
- [ ] Export filenames sanitized (no `../`, `;`, `&`, shell metacharacters)
- [ ] `URL.revokeObjectURL()` called after every object URL download

---

### Agent 5: PWA, Service Worker & Version Consistency

**PWA Checks**:

- [ ] `manifest.json` valid: `name`, `short_name`, `start_url`, `display`, `theme_color`, `icons`
- [ ] All icon sizes referenced in manifest exist as actual files
- [ ] Service worker registers without console errors
- [ ] App shell loads offline (disconnect network after first load, reload)
- [ ] `APP_SHELL_RELATIVE` in `sw.js` lists all current JS files under `js/` and `js/exports/` and `js/utils/`
- [ ] `APP_SHELL_RELATIVE` includes all 6 CSS files
- [ ] New `CACHE_NAME` version causes old caches to be deleted on SW activation
- [ ] PWA install banner (`#pwaInstallBanner`) appears and can be dismissed
- [ ] iOS overlay (`#iosInstallOverlay`) appears on iOS Safari user agent
- [ ] `pwaInstallDismissed` localStorage flag persists after banner dismissal

**Version Consistency (CRITICAL)**:

- [ ] `index.html` footer version matches `sw.js` `CACHE_NAME` version
- [ ] `js/feedback.js` `APP_VERSION` matches `js/stats.js` `APP_VERSION`
- [ ] Both of the above match the `index.html` footer version
- [ ] `js/exports/receipt.js` footer text version matches
- [ ] `README.md` version history has entry for current version
- [ ] `index.html` changelog modal has entry for current version

> ⚠️ **Known version drift pattern**: `feedback.js` and `stats.js` have historically lagged behind `sw.js` version. Always verify all 7 locations.

---

### Reporting Format

Each agent returns findings as:

```
### Agent N: [Area Name]
**Issues Found: X**

1. **[Severity: Critical/High/Medium/Low]** — `file:line` — Description
   - **Expected**: What should happen
   - **Actual**: What happens instead
   - **Fix**: Suggested code change
```

| Level | Definition |
|-------|------------|
| **Critical** | Data loss, app crash, security vulnerability, broken calculation producing wrong dollar amount |
| **High** | Feature doesn't work, export produces corrupt/wrong file, broken UI blocking main flow |
| **Medium** | Missing validation, ADA gaps, inconsistent behavior, wrong version in one location |
| **Low** | Code quality, minor UI polish, missing edge case handling, non-blocking |

---

### Post-Sweep: BUGS.md Update (MANDATORY)

After all agents report:

1. Append a new sweep section to `BUGS.md` — never overwrite previous sweeps
2. Assign sequential issue IDs — format `S{sweep}-{number}`
3. Timestamp every issue
4. Update totals at the top
5. Cross-reference regressions with `[REGRESSION: S{n}-{m}]`

---

### QC Expert Rules

1. **Severity Calibration** — Critical = wrong dollar amount or data loss. Don't inflate cosmetic issues.
2. **Evidence-Based** — Every finding needs file path, line number, Expected vs Actual.
3. **Minimal Fixes** — Don't propose refactors as bug fixes.
4. **No Build Gate** — This app has no build step. Verify by reading code and checking console in browser.
5. **Scope Discipline** — Each agent stays in its lane.
6. **False Positive Prevention** — Verify issues are real before reporting.
7. **Version Parity** — All 7 version locations must match. Any mismatch = Medium severity minimum.
8. **localStorage Safety** — Verify every `JSON.parse` has a `try/catch`. Missing = High severity.
9. **innerHTML Rule** — Any `innerHTML` with user-supplied data = Critical security finding.
10. **Calculation Accuracy** — Wrong math in `billing.js` = Critical. Always verify with known inputs.

---
---

## Part 2: Edge-Case Test Scenario Generator

> Generic prompt for generating manual test scenarios for critical paths. No test framework required — these are human-executable steps.

### System Role

You are a Staff-level QA Architect. You write test scenarios that catch real bugs, not scenarios that pass for show. Focus on boundary conditions, error paths, and state corruption.

### Objective

Generate step-by-step manual test scenarios for the edge case categories below. Each scenario should be executable in a browser with DevTools open.

### Edge Case Categories

| Category | Examples for This App |
|----------|----------------------|
| Boundary values | 0 kWh days, single-day period, 31-day period exactly, max localStorage |
| Null / undefined | Empty rate field, no dates set, no kWh entered before calculate |
| Malformed input | Letters in kWh field, negative kWh, rate of 0, date in wrong format |
| State transitions | Archive with no data, restore then immediately archive again, delete last profile |
| Concurrency / rapid clicks | Rapid calculate presses, rapid archive, rapid preset save |
| localStorage limits | Fill to near-5MB limit, then add more data |
| Profile edge cases | Single profile (no delete), switch profiles mid-entry, duplicate profile names |
| Export edge cases | Export with all kWh = 0, export with 1 day only, export with very long profile name |
| PWA edge cases | Install then update SW, open two tabs, offline then online mid-session |
| Tier calculation edges | Exactly at tier boundary, tier 2 rate = 0, tier 1 limit > total kWh |

### Process

1. **Phase 0** — Read `BUGS.md` for regression targets to include as explicit test scenarios
2. **Phase 1** — Identify the 5 highest-risk paths (most likely to produce wrong dollar amounts or data loss)
3. **Phase 2** — Write 3–5 step-by-step scenarios per risk path
4. **Phase 3** — For each scenario, state: Setup → Steps → Expected Result → Pass/Fail signal

---

## BUGS.md Template

```markdown
# EV Reimbursement App — QA Bug Report

**Date**: YYYY-MM-DD
**Version**: X.X.X
**Total Issues**: N | **Fixed**: N | **Skipped**: N

---

## CRITICAL

| # | File | Issue | Status |
|---|------|-------|--------|
| S1-1 | `js/path/file.js:line` | Description | |

## HIGH

| # | File | Issue | Status |
|---|------|-------|--------|

## MEDIUM

| # | File | Issue | Status |
|---|------|-------|--------|

## LOW

| # | File | Issue | Status |
|---|------|-------|--------|
```

**Status values**: `FIXED`, `SKIPPED — reason`, `N/A — reason`, `[REGRESSION: S{n}-{m}]`
