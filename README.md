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

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial load
- JavaScript enabled

### Installation
1. Clone the repository:
```bash
git clone [repository-url]
```

2. Open `index.html` in your web browser

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

*Last updated: [Current Date]*
