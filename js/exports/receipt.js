/**
 * Reimbursement receipt PDF generator — Siemens-formatted expense receipt.
 * Can generate from current DOM data or from a history snapshot.
 */

import { parseLocalDate, forEachDay, ymd } from '../utils/dates.js';
import { isUsingTieredRates, computeTieredDailyCostsMap, computeCostsFromData } from '../billing.js';
import { showButtonLoading, resetButtonLoading } from '../ui.js';
import * as storage from '../storage.js';

/**
 * Generate a receipt PDF from current form data.
 */
export function exportReceipt() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const costPerKwh = parseFloat(document.getElementById('costPerKwh').value);
  const exportBtn = document.querySelector('[data-action="export-receipt"]');

  if (!startDateStr || !endDateStr) {
    alert('Please select billing period dates first.');
    return;
  }

  const startDate = parseLocalDate(startDateStr);
  const endDate = parseLocalDate(endDateStr);
  if (!startDate || !endDate || startDate > endDate) {
    alert('Please enter valid billing period dates.');
    return;
  }

  if (isNaN(costPerKwh) && !isUsingTieredRates()) {
    alert('Please enter a valid cost per kWh.');
    return;
  }

  if (exportBtn) showButtonLoading(exportBtn, 'Generating Receipt...');

  setTimeout(() => {
    const tierResult = computeTieredDailyCostsMap(isNaN(costPerKwh) ? 0 : costPerKwh, startDate, endDate);
    const profileName = storage.getCurrentProfile();

    generateReceiptPDF({
      startDate: startDateStr,
      endDate: endDateStr,
      costPerKwh: isNaN(costPerKwh) ? 0 : costPerKwh,
      useTieredRates: isUsingTieredRates(),
      dailyCostMap: tierResult.dailyCostMap,
      kwhMap: tierResult.kwhMap,
      totalKwh: tierResult.totalKwh,
      profileName,
      start: startDate,
      end: endDate
    });

    if (exportBtn) resetButtonLoading(exportBtn, '<i class="bi bi-receipt"></i> Generate Receipt');
  }, 400);
}

/**
 * Generate a receipt PDF from a history snapshot.
 */
export function exportReceiptFromSnapshot(snapshot) {
  const start = parseLocalDate(snapshot.startDate);
  const end = parseLocalDate(snapshot.endDate);

  const tierSettings = {
    useTiers: snapshot.useTieredRates || false,
    tier1Limit: snapshot.tier1Limit || 0,
    tier1Rate: snapshot.tier1Rate || 0,
    tier2Rate: snapshot.tier2Rate || 0
  };

  const result = computeCostsFromData(
    snapshot.dailyKwhData,
    tierSettings,
    snapshot.costPerKwh || 0,
    start,
    end
  );

  generateReceiptPDF({
    startDate: snapshot.startDate,
    endDate: snapshot.endDate,
    costPerKwh: snapshot.costPerKwh || 0,
    useTieredRates: snapshot.useTieredRates || false,
    dailyCostMap: result.dailyCostMap,
    kwhMap: result.kwhMap,
    totalKwh: result.totalKwh,
    profileName: storage.getCurrentProfile(),
    start,
    end
  });
}

/**
 * Internal: build and save the receipt PDF.
 */
function generateReceiptPDF(data) {
  const { startDate, endDate, costPerKwh, useTieredRates, dailyCostMap, kwhMap, totalKwh, profileName, start, end } = data;

  let totalCost = 0;
  const rows = [];

  forEachDay(start, end, (d) => {
    const dateStr = ymd(d);
    const kwh = kwhMap[dateStr] || 0;
    const cost = dailyCostMap[dateStr] || 0;
    totalCost += cost;

    if (kwh > 0) {
      const displayDate = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      rows.push([displayDate, kwh.toFixed(2), `$${cost.toFixed(2)}`]);
    }
  });

  // Generate receipt number
  const today = new Date();
  const dateCode = today.toISOString().slice(0, 10).replace(/-/g, '');
  const random4 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const receiptNo = `EV-${dateCode}-${random4}`;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('SIEMENS', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.text('EV Charging Reimbursement Receipt', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Horizontal rule
  doc.setDrawColor(0, 153, 153);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  // Receipt details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  const leftCol = 14;
  const rightCol = pageWidth / 2 + 10;

  doc.text(`Receipt #: ${receiptNo}`, leftCol, y);
  const rateStr = useTieredRates ? 'Tiered Rates' : `$${costPerKwh.toFixed(2)}/kWh`;
  doc.text(`Rate: ${rateStr}`, rightCol, y);
  y += 7;

  doc.setFont(undefined, 'bold');
  doc.text(`Billing Period: ${startDate} to ${endDate}`, leftCol, y);
  doc.setFont(undefined, 'normal');
  y += 10;

  // Data table
  doc.autoTable({
    head: [['Date', 'kWh', 'Cost']],
    body: rows,
    foot: [['TOTAL', totalKwh.toFixed(2), `$${totalCost.toFixed(2)}`]],
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [0, 153, 153], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [0, 153, 153], textColor: 255, fontStyle: 'bold' },
    styles: { cellPadding: 3, fontSize: 9, halign: 'center' },
    columnStyles: {
      0: { halign: 'left' },
      2: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 12;

  // Submission info
  doc.setFontSize(9);
  doc.text('Submit via: E2E Travel@Siemens', leftCol, y);
  y += 6;
  doc.text('Expense Category: Fuel', leftCol, y);

  // Footer
  y = doc.internal.pageSize.height - 15;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by EV kWh Reimbursement App v2.1', pageWidth / 2, y, { align: 'center' });

  doc.save(`ev_receipt_${receiptNo}.pdf`);
}
