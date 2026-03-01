# EV Reimbursement App v2.1 — Five New Features

## Context

The v2.0 modular redevelopment is complete with 13 ES modules. The user wants 5 new features that reduce monthly reimbursement friction:

1. **Multi-Month History** — Store past billing periods, browse and restore them
2. **Saved Rate Presets** — Save utility rate structures for one-click reuse
3. **Reimbursement Receipt Generator** — One-page PDF formatted for E2E Travel@Siemens
4. **Month-over-Month Comparison** — Trend chart across archived periods
5. **PWA** — Installable, offline-capable progressive web app

## Current Storage Model (must evolve)

Each profile stores a flat set of keys: `Default__startDate`, `Default__endDate`, `Default__costPerKwh`, `Default__dailyKwhData`, etc. There is exactly ONE billing period per profile — no history.

`computeTieredDailyCostsMap()` in `billing.js` is DOM-coupled (reads `.dailyKwh` inputs directly). For history records not in the DOM, we need a data-driven variant.

---

## Feature 1: Multi-Month History

### Storage Changes (`js/storage.js`)

Add new functions and a new per-profile key:

```
ProfileName__history = JSON array of period snapshots
```

Each snapshot:
```js
{
  id: crypto.randomUUID(),
  label: "Feb 2026",
  savedAt: new Date().toISOString(),
  startDate, endDate, costPerKwh,
  useTieredRates, tier1Limit, tier1Rate, tier2Rate,
  dailyKwhData: { "2026-02-01": 15.5, ... },
  totalKwh, totalCost
}
```

New API:
- `getHistory()` — returns parsed array for current profile
- `saveToHistory(snapshot)` — push to array
- `deleteFromHistory(id)` — filter by id
- `loadFromHistory(id)` — return single snapshot
- Update `deleteProfileData()` to also remove `__history`
- Update `FORM_KEYS`-adjacent constant to include `'history'`

### Billing Changes (`js/billing.js`)

Add data-driven variant:
```js
export function computeCostsFromData(kwhMap, tierSettings, startDate, endDate)
```
Same logic as `computeTieredDailyCostsMap` but takes a plain kwhMap object instead of reading the DOM. The existing function can call this internally.

### New Module (`js/history.js`)

- `archiveCurrentPeriod()` — snapshot current form + computed totals → `saveToHistory()`
- `renderHistoryList()` — show archived periods in a collapsible panel with date range, total cost, and actions (view, restore, delete)
- `restorePeriod(id)` — load snapshot into form fields, regenerate kWh fields
- `deletePeriod(id)` — confirm + remove from storage
- Callback: `setOnHistoryChange(fn)` for UI updates

### UI Changes (`index.html`)

Add a "History" section below the billing period box:
```html
<div class="billing-box mb-3" id="historyBox">
  <div class="d-flex justify-content-between align-items-center mb-2">
    <h6><i class="bi bi-clock-history"></i> Billing History</h6>
    <button data-action="archive-period" class="btn btn-sm btn-outline-success">
      <i class="bi bi-archive"></i> Archive Current Period
    </button>
  </div>
  <div id="historyList"><!-- rendered by history.js --></div>
</div>
```

### App Wiring (`js/app.js`)

- Import history module
- Wire `archive-period` data-action
- Call `renderHistoryList()` on init and profile change

---

## Feature 2: Saved Rate Presets

### Storage (`js/storage.js`)

Global (not profile-scoped) key:
```
ratePresets = JSON array of preset objects
```

Each preset:
```js
{
  id: crypto.randomUUID(),
  name: "PG&E E-TOU-D",
  costPerKwh: 0.17,
  useTieredRates: true,
  tier1Limit: 1000,
  tier1Rate: 0.12,
  tier2Rate: 0.25
}
```

New API:
- `getRatePresets()` / `setRatePresets(arr)`
- `saveRatePreset(preset)` / `deleteRatePreset(id)`

### UI Changes (`index.html`)

Add a preset selector inside the Cost per kWh billing box:
```html
<div class="d-flex gap-2 mb-2">
  <select id="ratePresetSelect" class="form-select form-select-sm">
    <option value="">Custom Rate</option>
    <!-- populated by js -->
  </select>
  <button data-action="save-rate-preset" class="btn btn-sm btn-outline-primary">
    <i class="bi bi-bookmark-plus"></i> Save
  </button>
  <button data-action="delete-rate-preset" class="btn btn-sm btn-outline-danger">
    <i class="bi bi-trash"></i>
  </button>
</div>
```

### New Module (`js/presets.js`)

- `initPresets()` — populate dropdown from storage
- `applyPreset(id)` — fill costPerKwh, tier fields, and checkbox from preset
- `saveCurrentAsPreset()` — prompt for name, snapshot current rate config
- `deleteSelectedPreset()` — remove from storage, refresh dropdown

---

## Feature 3: Reimbursement Receipt Generator

### New Module (`js/exports/receipt.js`)

A specialized PDF export formatted as an expense receipt:

```
┌─────────────────────────────────────────────┐
│  SIEMENS                                     │
│  EV Charging Reimbursement Receipt           │
│                                              │
│  Employee: [from userInfo or profile name]   │
│  Date Issued: [today]                        │
│  Receipt #: EV-[YYYYMMDD]-[random4]          │
│                                              │
│  Billing Period: Jan 01 - Jan 31, 2026       │
│  Rate: $0.17/kWh (or Tiered)                │
│                                              │
│  ┌──────────┬─────────┬──────────┐          │
│  │ Date     │ kWh     │ Cost     │          │
│  ├──────────┼─────────┼──────────┤          │
│  │ 01/01    │ 15.50   │ $2.64    │          │
│  │ 01/02    │ 12.30   │ $2.09    │          │
│  │ ...      │         │          │          │
│  ├──────────┼─────────┼──────────┤          │
│  │ TOTAL    │ 465.00  │ $79.05   │          │
│  └──────────┴─────────┴──────────┘          │
│                                              │
│  Submit via: E2E Travel@Siemens              │
│  Expense Category: Fuel                      │
│                                              │
│  Signature: _______________  Date: ________  │
│                                              │
│  Generated by EV kWh Reimbursement App v2.1  │
└─────────────────────────────────────────────┘
```

Uses jsPDF directly (already loaded via CDN). Can accept either DOM data (current period) or a history snapshot object via `computeCostsFromData()`.

### App Wiring

- Add `data-action="export-receipt"` button in the action buttons section
- Wire in `app.js` switch case

---

## Feature 4: Month-over-Month Comparison

### New Module (`js/trend.js`)

- `renderTrendChart()` — reads history array, plots bar/line chart showing:
  - X-axis: period labels ("Jan 2026", "Feb 2026", ...)
  - Y-axis left: total kWh per period
  - Y-axis right: total cost per period
  - Optional: average daily kWh line
- Uses Chart.js (already loaded)
- Only shows when 2+ history records exist

### UI Changes (`index.html`)

Add a trend section below the existing chart:
```html
<div class="billing-box mb-3" id="trendBox">
  <h6><i class="bi bi-graph-up-arrow"></i> Month-over-Month Trends</h6>
  <canvas id="trendChart" height="120"></canvas>
  <div id="trendInsight" class="text-muted small mt-2"></div>
</div>
```

The `trendInsight` div shows text like: "Feb usage was 12% higher than Jan. Average monthly cost: $67.42"

---

## Feature 5: PWA (Progressive Web App)

### Files to Create

**`manifest.json`** (project root):
```json
{
  "name": "EV kWh Reimbursement App",
  "short_name": "EV Reimburse",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#009999",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**`sw.js`** (service worker, project root):
- Cache-first strategy for app shell (HTML, CSS, JS files)
- Network-first for CDN libraries (Bootstrap, Chart.js, etc.)
- Versioned cache name for easy updates
- Activate event cleans up old caches

**`icons/`** directory:
- Generate from existing `ev_favicon.png` at 192x192 and 512x512

### HTML Changes (`index.html`)

Add to `<head>`:
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#009999">
<meta name="apple-mobile-web-app-capable" content="yes">
```

Add registration script at end of body (before module script):
```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
</script>
```

---

## Implementation Order

1. **Storage evolution** — Add history, presets, and data-driven billing APIs
2. **History module** — Archive, list, restore, delete periods
3. **Rate presets module** — Save/load/apply rate configurations
4. **Receipt generator** — Specialized PDF receipt export
5. **Trend chart** — Month-over-month comparison visualization
6. **PWA** — manifest.json, service worker, icons
7. **HTML updates** — All new UI sections and buttons
8. **App.js wiring** — Import new modules, wire data-actions
9. **CSS additions** — History list, trend box, preset selector styling
10. **Version bump** to 2.1.0, changelog entry

## Files Modified

| File | Changes |
|------|---------|
| `js/storage.js` | Add history + presets APIs |
| `js/billing.js` | Add `computeCostsFromData()` data-driven variant |
| `js/app.js` | Import new modules, wire actions, init calls |
| `index.html` | History section, preset selector, receipt button, trend section, PWA meta |
| `css/components.css` | History list, trend box, preset selector styles |
| `README.md` | Document new features |

## Files Created

| File | Purpose |
|------|---------|
| `js/history.js` | Billing period archive management |
| `js/presets.js` | Rate preset CRUD and UI |
| `js/exports/receipt.js` | Reimbursement receipt PDF |
| `js/trend.js` | Month-over-month comparison chart |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker for offline support |
| `icons/icon-192.png` | PWA icon 192x192 |
| `icons/icon-512.png` | PWA icon 512x512 |

## Verification

1. **History**: Archive a period → verify it appears in history list → restore it → verify form populated → delete it
2. **Presets**: Save a rate config → switch profiles → apply preset → verify fields filled
3. **Receipt**: Generate receipt PDF → verify it has Siemens header, line items, total, signature line
4. **Trends**: Archive 2+ periods → verify trend chart shows comparison → verify insight text
5. **PWA**: Load page → check "Install" prompt in browser → toggle airplane mode → verify app loads offline
6. **No regressions**: All existing features (calculate, export Excel/PDF, dark mode, CSV, profiles) still work
