# EV kWh Reimbursement App

A web-based application designed to help Siemens employees calculate and manage their electric vehicle (EV) charging reimbursements. Track kWh usage, calculate costs, and generate reports for reimbursement purposes.

## Features

### Profile Management
- Create and manage multiple profiles for separate vehicles or billing periods
- Switch between profiles with independent data storage
- Default profile cannot be deleted

### Data Entry
- Manual entry of daily kWh usage with per-day input fields
- CSV import with validation (date range, format, error highlighting)
- Download pre-formatted CSV template with billing period dates
- Automatic field generation when both dates are selected

### Cost Calculation
- Base cost per kWh input
- Optional tiered rate billing (Tier 1 limit, Tier 1 rate, Tier 2 rate)
- Cumulative tier calculation across the billing period
- Real-time cost updates as data changes

### Data Visualization
- Interactive dual-axis Chart.js chart (kWh usage + daily cost)
- Dashboard summary: Total kWh, Total Cost, Avg Daily, Data Completeness %
- Color-coded progress bar for data entry tracking
- Tooltips with date, kWh, cost, and effective rate on hover

### Export Options
- **Excel**: Daily breakdown with effective rate and currency formatting via SheetJS
- **PDF**: Professional report with billing period header and tiered rate notation via jsPDF
- **Receipt**: Siemens-formatted reimbursement receipt with receipt number, line items, signature line

### Billing History
- Archive billing periods for future reference
- Browse, restore, or delete past records
- Month-over-month trend chart comparing archived periods (kWh, cost, avg daily)
- Insight text showing usage changes and average monthly cost

### Saved Rate Presets
- Save utility rate configurations (flat or tiered) as named presets
- One-click preset selection from dropdown
- Global presets shared across profiles

### Progressive Web App
- Installable on desktop and mobile devices
- Offline-capable with service worker caching
- App manifest with standalone display mode

### Additional Features
- Dark mode with full component coverage (inputs, modals, chart)
- Feedback form with 1-5 star rating, categories, and mailto generation
- Contextual tooltips on all interactive elements
- Input validation (negative values, unusually high kWh warnings)
- Loading spinners on all async operations
- ARIA labels and keyboard navigation for accessibility
- Mobile responsive layout (< 600px)
- All data stored locally in the browser (no server)

## Architecture

Version 3.0 uses ES modules with no build tools required:

```
index.html                  Semantic HTML, <script type="module">
manifest.json               PWA manifest
sw.js                       Service worker for offline support
icons/icon.svg              PWA app icon
css/
  variables.css             CSS custom properties and theme tokens
  base.css                  Reset, typography, layout, modal theming
  components.css            Cards, buttons, profile box, summary stats
  animations.css            Keyframes and transitions
  responsive.css            Media queries (768px, 600px breakpoints)
js/
  app.js                    Entry point — imports, init, event delegation
  utils/dates.js            parseLocalDate, ymd, forEachDay, dayCount
  storage.js                Profile-scoped localStorage + history + presets
  profiles.js               Profile CRUD and dropdown UI
  billing.js                Tiered rate logic and cost calculations
  fields.js                 kWh field generation and validation
  csv.js                    CSV template download and import
  chart.js                  Chart.js dual-axis visualization
  summary.js                Dashboard summary card updates
  history.js                Billing period archive management
  presets.js                Rate preset CRUD and UI
  trend.js                  Month-over-month comparison chart
  exports/excel.js          SheetJS Excel export
  exports/pdf.js            jsPDF + autoTable PDF export
  exports/receipt.js        Siemens-formatted receipt PDF
  feedback.js               Star rating form and mailto generation
  ui.js                     Dark mode, button loading, tooltips
```

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for CDN libraries on first load

### Running Locally

ES modules require an HTTP server (they don't work with `file://` URLs).

```bash
# Clone the repository
git clone https://github.com/calebohara/EV-Reimbursement-App.git
cd EV-Reimbursement-App

# Serve with any local HTTP server:
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` in your browser.

### GitHub Pages

The app works directly on GitHub Pages with no build step — just push and it's live.

### Direct Download

1. Visit [github.com/calebohara/EV-Reimbursement-App](https://github.com/calebohara/EV-Reimbursement-App)
2. Click **Code** > **Download ZIP**
3. Extract and serve the folder with a local HTTP server (see above)

## Usage

### Profile Setup
1. Select or create a profile using the dropdown
2. Use **+** to add new profiles, **-** to delete (Default is protected)

### Data Entry
1. Select billing period start and end dates (fields auto-generate)
2. Enter kWh usage manually or import from CSV
3. Download the CSV template for bulk data entry

### Cost Calculation
1. Enter cost per kWh (or enable tiered rates for multi-tier billing)
2. Click **Calculate Reimbursement** to see the total
3. View the dashboard summary and chart for visual breakdown

### Exporting
1. **Export to Excel** for a detailed spreadsheet with daily data and totals
2. **Export to PDF** for a professional report suitable for expense submission
3. Use **Travel@Siemens** link to access the Siemens travel portal

## CSV Format

```
Date,kWh Usage
2024-01-01,10.5
2024-01-02,12.0
```

- First row must be the header: `Date,kWh Usage`
- Dates in `YYYY-MM-DD` format
- kWh values must be numeric
- Dates must fall within the selected billing period

## Data Privacy

- All data is stored locally in your browser via localStorage
- No data is uploaded to any server
- Each profile's data is stored with a scoped key prefix
- Regular exports recommended for backup

## Technical Details

### Built With
- HTML5 + CSS3 + JavaScript (ES Modules)
- Bootstrap 5.3.0 + Bootstrap Icons 1.10.5
- Chart.js (interactive charting)
- SheetJS / XLSX 0.18.5 (Excel export)
- jsPDF 2.5.1 + jsPDF-AutoTable 3.7.0 (PDF export)

### Key Design Decisions
- **ES Modules** (`<script type="module">`) for native browser module system with no build step
- **Event delegation** via `data-action` attributes replacing inline `onclick` handlers
- **Profile-scoped localStorage** with backward compatibility for pre-profile data
- **Centralized date parsing** eliminating timezone bugs from duplicated patterns
- **Callback pattern** for cross-module communication (chart/summary updates)

## Version History

### Version 3.0.0 (March 2026)
- **Complete UI Redesign**: Three-step wizard flow (Setup → Usage → Your Reimbursement)
- **Slim Fixed Header**: Branded SIEMENS header with quick-access help, dark mode, and feedback
- **Progressive Disclosure**: Empty states hidden until data exists, tiered rates revealed on toggle
- **Hero Result Display**: Large, prominent reimbursement amount with contextual export buttons
- **Collapsible Sections**: Chart, history, and trends collapse via `<details>` elements
- **Footer Navigation**: EV Policy, Contact, and Changelog moved to footer for cleaner layout
- **Design Token System**: CSS custom properties for consistent theming and spacing
- **Mobile-First Responsive**: Optimized layouts at 768px, 600px, and 360px breakpoints

### Version 2.1.0 (February 28, 2026)
- **Multi-Month History**: Archive billing periods, browse/restore/delete past records
- **Saved Rate Presets**: Save and reuse utility rate configurations with one-click selection
- **Reimbursement Receipt**: Siemens-formatted PDF receipt with receipt number, line items, signature line
- **Month-over-Month Trends**: Interactive comparison chart across archived periods
- **PWA**: Installable progressive web app with offline support via service worker
- **Data-driven billing**: New `computeCostsFromData()` API for history and receipt generation

### Version 2.0.0 (February 28, 2026)
- **Modular Architecture**: Complete refactor from monolithic single-file to 13 ES modules
- **Centralized Date Parsing**: Eliminated 12+ duplicate patterns with shared utilities
- **Clean Event Architecture**: Replaced monkey-patching and inline handlers with data-action delegation
- **CSS Organization**: Split into 5 files (variables, base, components, animations, responsive)
- **Profile Storage Refactor**: Clean scoped wrapper with backward compatibility
- **All existing features preserved**: Zero functionality removed

### Version 1.10.0 (December 21, 2024)
- Tiered rate billing with cumulative tier calculation
- Tier input validation with fallback to base rate
- Dark mode polish for modals and disabled inputs

### Version 1.9.0 (December 20, 2024)
- Dashboard summary view with real-time stats
- Feedback form with star rating and mailto generation
- Loading animations for async operations
- Contextual tooltips across the app
- Automatic field generation on date selection
- Date parsing timezone fix

### Version 1.8.0 (December 19, 2024)
- Chart.js dual-axis visualization
- Profile management with scoped persistence
- CSV import/export with validation
- Excel and PDF export
- Dark mode theming
- Input validation and progressive saving
- ARIA labels and accessibility improvements

### Version 1.7.0 (May 27, 2024)
- Enhanced Site Help, CSV import updates, scrollable fields, button layout redesign

### Version 1.6.0 (May 25, 2025)
- CSV template download feature

### Version 1.5.0 (May 25, 2025)
- Enhanced CSV import with error handling

### Version 1.4.0 (April 15, 2025)
- EV Policy modal

### Version 1.3.0 (March 10, 2025)
- Improved Site Help modal

### Version 1.2.0 (February 20, 2025)
- Site Help feature

### Version 1.1.0 (January 5, 2025)
- Travel@Siemens integration

### Version 1.0.0 (December 1, 2024)
- Initial release with core kWh reimbursement functionality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

Caleb O'Hara - caleb.ohara@siemens.com

## Disclaimer

The accuracy of calculations and reimbursements depends on the data provided. Please ensure all input values, including kWh usage and cost per kWh, are accurate and verified. Siemens is not responsible for any discrepancies resulting from incorrect data entry.

## License

This project is proprietary and confidential. All rights reserved.

---

*Last updated: March 2026*
