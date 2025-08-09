# EV kWh Reimbursement App

A web-based application designed to help Siemens employees calculate and manage their electric vehicle (EV) charging reimbursements. This application provides a user-friendly interface for tracking kWh usage, calculating costs, and generating reports for reimbursement purposes.

## 🌟 Features

### Profile Management
- Create and manage multiple profiles
- Switch between different profiles
- Each profile maintains separate data
- Default profile cannot be deleted

### Data Entry
- Manual entry of daily kWh usage
- CSV import functionality with validation
- Download CSV template for easy data entry
- Automatic field generation based on billing period

### Cost Calculation
- Set cost per kWh
- Automatic calculation of daily and total costs
- Real-time cost updates
- Support for different billing periods

### Data Visualization
- Interactive chart showing daily kWh usage
- Cost visualization
- Hover functionality for detailed information
- Automatic chart updates

### Export Options
- Excel export with detailed breakdown
- PDF export with professional formatting
- Comprehensive data reporting
- Customizable export formats

### Additional Features
- Dark mode support
- Local data storage
- Input validation
- Quick access to Siemens travel portal
- EV policy information
- Contact support
- Comprehensive help documentation
- Dashboard summary view (Total kWh, Total Cost, Avg Daily, Data Completeness)
- In-app Feedback & Support form with 1–5 star rating and mailto generation
- Contextual tooltips across key inputs and actions
- Polished loading states with Bootstrap spinners for async actions (CSV import, calculations, exports)

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial load
- JavaScript enabled

### Installation

#### Option 1: Using Git (Recommended)
1. Ensure Git is installed on your computer
   - Windows: Download from [git-scm.com](https://git-scm.com/download/win)
   - Mac: Install via Terminal using `git --version` (prompts installation if not present)
   - Linux: Install via package manager (e.g., `sudo apt-get install git` for Ubuntu)
2. Open your terminal/command prompt
3. Navigate to the directory where you want to install the application
4. Clone the repository:
```bash
git clone https://github.com/calebohara/EV-Reimbursement-App.git
```
5. Navigate into the project directory:
```bash
cd EV-Reimbursement-App
```
6. Open `index.html` in your web browser

#### Option 2: Direct Download (No Git Required)
1. Visit the repository at [https://github.com/calebohara/EV-Reimbursement-App](https://github.com/calebohara/EV-Reimbursement-App)
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the downloaded ZIP file to your desired location
5. Open the extracted folder
6. Open `index.html` in your web browser

The application will be installed in a new directory called `EV-Reimbursement-App` in your chosen location. For example:
- If you run the command in `C:\Users\YourName\Documents`, the application will be installed in `C:\Users\YourName\Documents\EV-Reimbursement-App`
- If you run the command in `/Users/YourName/Documents`, the application will be installed in `/Users/YourName/Documents/EV-Reimbursement-App`

No additional installation steps required as this is a client-side application.

## 💻 Usage

### Profile Setup
1. Select or create a profile using the profile selector
2. Use the "+" button to add new profiles
3. Use the "-" button to delete existing profiles

### Data Entry
1. Select billing period start and end dates
2. Choose data entry method:
   - Manual entry: Use generated fields
   - CSV import: Upload formatted CSV file
   - Template: Download and fill CSV template

### Cost Calculation
1. Enter cost per kWh
2. Input daily kWh usage
3. Click "Calculate Reimbursement"
4. View results in the dedicated result box

### Exporting Data
1. Click "Export to Excel" for detailed spreadsheet
2. Click "Export to PDF" for formatted report
3. Access Travel@Siemens portal for submission

## 📊 CSV Format

The application accepts CSV files with the following structure:
```
Date,kWh Usage
2024-01-01,10.5
2024-01-02,12.0
```

Requirements:
- First row must be header row
- Dates in YYYY-MM-DD format
- kWh values must be numeric
- No blank rows or columns

## 🔒 Data Privacy

- All data is stored locally in the browser
- No data is uploaded to any server
- Each profile's data is kept separate
- Regular exports recommended for backup

## 🛠️ Technical Details

### Built With
- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3.0
- Chart.js
- XLSX.js
- jsPDF

### Dependencies
```html
- Bootstrap 5.3.0
- Bootstrap Icons 1.10.5
- Chart.js
- XLSX.js 0.18.5
- jsPDF 2.5.1
- jsPDF-AutoTable 3.7.0
```

## 📝 Version History

### Version 1.10.0
- **Tiered Rates (Basic):** Optional tiered billing where the first N kWh of the billing period are charged at Tier 1 rate and remaining kWh at Tier 2 (or base rate). Includes validation, per-profile persistence, and integration into chart, summary, calculations, and exports.
- **Validation & Fallbacks:** Tier inputs validate on the fly; when tiers are enabled and valid, base cost may be blank. If tier inputs are invalid, calculations fall back to the base cost per kWh.
- **Dark Mode Polish:** Improved readability of modal text, placeholders, and disabled inputs (including tiered fields) in dark mode.

### Version 1.9.0
- **Dashboard Summary View**: Added summary card above the chart showing Total kWh, Total Cost, Average Daily Usage, and data completeness with a color-coded progress bar. Updates in real time.
- **Feedback & Support Form**: Replaced static email with an in-app feedback form, including a 1–5 star rating, feedback categories, and pre-filled mailto generation to `caleb.ohara@siemens.com`.
- **Loading Animations**: Introduced Bootstrap spinners for async actions (CSV import, calculations, Excel/PDF exports) with descriptive loading text and disabled states to prevent duplicate actions.
- **Contextual Tooltips**: Added helpful tooltips to date inputs, cost per kWh, CSV upload, chart legends, and primary actions.
- **Automatic Field Generation**: Auto-generates daily kWh fields when both dates are selected and valid.
- **Smooth UI Animations**: Fade-in transitions for the fields box and staggered animations for daily fields.
- **Date Parsing Fix**: Resolved timezone-related offset that caused dates to appear a day early.
- **Dark Mode Contrast**: Fixed text color in Feedback & Support modal and ensured good contrast across new components.
- **Accessibility**: ARIA-friendly controls, keyboard-accessible star rating, and improved screen reader support.

### Version 1.8.0
- **Icon Fix & Accessibility**: Fixed car icon typo and added proper ARIA attributes for screen reader support
- **Reset Function Enhancement**: Unified key lists and improved form reset functionality with complete data clearing
- **Local Date Formatting**: Replaced UTC-based date formatting with local timezone support to prevent date shifts
- **Anti-Debug Removal**: Removed unnecessary event listeners that blocked developer tools and context menus
- **Chart Theming**: Added dynamic dark mode support for charts with automatic color adaptation
- **Profile Management**: Enhanced multi-user support with improved data persistence and profile switching
- **Input Validation**: Added real-time validation for kWh inputs with warning messages
- **Progressive Saving**: Implemented automatic data saving on all input changes
- **Chart Visualization**: Added interactive Chart.js integration with dual-axis support for kWh and cost data
- **CSV Import/Export**: Enhanced CSV functionality with comprehensive validation and error handling
- **Export Features**: Added Excel and PDF export capabilities with professional formatting
- **Dark Mode**: Implemented complete dark mode theming throughout the application
- **Accessibility**: Improved ARIA labels, screen reader support, and keyboard navigation

### Version 1.7.0
- Enhanced Site Help content
- Improved CSV import functionality
- Styled result display
- Implemented scrollable input fields
- Redesigned action buttons layout

### Version 1.6.0
- Added CSV template download feature

### Version 1.5.0
- Enhanced CSV import functionality
- Improved error handling

### Version 1.4.0
- Added EV Policy information
- Implemented policy modal

### Version 1.3.0
- Improved Site Help modal
- Enhanced user experience

### Version 1.2.0
- Added Site Help feature
- Implemented help modal

### Version 1.1.0
- Added Travel@Siemens integration
- Implemented portal link

### Version 1.0.0
- Initial release
- Core functionality implementation

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

Caleb O'Hara - caleb.ohara@siemens.com

## ⚠️ Disclaimer

The accuracy of calculations and reimbursements depends on the data provided. Please ensure all input values, including kWh usage and cost per kWh, are accurate and verified. Siemens is not responsible for any discrepancies resulting from incorrect data entry.

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

*Last updated: December 21, 2024*
