/**
 * Google Apps Script for CoinDCX Partner Portal
 * 
 * This script reads partner metrics from Google Sheets and sends them to
 * the Supabase API endpoint.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Update the configuration variables below (API_URL and SERVICE_ROLE_KEY)
 * 5. Save and run the function manually, or set up a time-driven trigger
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION - UPDATE THESE VALUES
// ═══════════════════════════════════════════════════════════════

// Your Next.js API endpoint URL (replace with your actual URL)
const API_URL = 'https://your-domain.com/api/data/import-metrics';
// For local testing: 'http://localhost:3000/api/data/import-metrics'

// Your Supabase Service Role Key (get from Supabase Dashboard > Settings > API)
const SERVICE_ROLE_KEY = 'your-service-role-key-here';

// Sheet configuration
const SHEET_NAME = 'Sheet1'; // Change if your data is in a different sheet
const HEADER_ROW = 1; // Row number containing headers

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION - Run this to import data
// ═══════════════════════════════════════════════════════════════

function importMetricsToSupabase() {
  try {
    // 1. Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }

    // 2. Read headers
    const headerRange = sheet.getRange(HEADER_ROW, 1, 1, sheet.getLastColumn());
    const headers = headerRange.getValues()[0].map(h => String(h).trim());
    
    // 3. Find column indices
    const colMap = {
      partner_uid: findColumnIndex(headers, ['Partner UID', 'PartnerUID', 'UID']),
      total_users: findColumnIndex(headers, ['Total Users', 'TotalUsers', 'Total']),
      traded_users: findColumnIndex(headers, ['Traded Users', 'TradedUsers', 'Traded']),
      eligible_500_users: findColumnIndex(headers, ['Eligible 500 Users', 'Eligible500', 'Eligible 500']),
      volume_eligible_users: findColumnIndex(headers, ['Volume Eligible Users', 'VolumeEligible', 'Volume Eligible']),
      total_volume_inr: findColumnIndex(headers, ['Total Volume (INR)', 'Total Volume', 'Volume INR'])
    };

    // Validate all columns found
    const missingCols = Object.entries(colMap)
      .filter(([name, idx]) => idx === -1 && name !== 'total_volume_inr')
      .map(([name]) => name);
    
    if (missingCols.length > 0) {
      throw new Error(`Missing required columns: ${missingCols.join(', ')}`);
    }

    // 4. Read data rows
    const dataStartRow = HEADER_ROW + 1;
    const lastRow = sheet.getLastRow();
    
    if (lastRow < dataStartRow) {
      throw new Error('No data rows found');
    }

    const metrics = [];
    for (let row = dataStartRow; row <= lastRow; row++) {
      const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Skip empty rows
      if (!rowData[colMap.partner_uid] || String(rowData[colMap.partner_uid]).trim() === '') {
        continue;
      }

      // Parse row data
      const metric = {
        partner_uid: String(rowData[colMap.partner_uid]).trim().toUpperCase(),
        total_users: parseNumber(rowData[colMap.total_users], row, 'Total Users'),
        traded_users: parseNumber(rowData[colMap.traded_users], row, 'Traded Users'),
        eligible_500_users: parseNumber(rowData[colMap.eligible_500_users], row, 'Eligible 500 Users'),
        volume_eligible_users: parseNumber(rowData[colMap.volume_eligible_users], row, 'Volume Eligible Users'),
        total_volume_inr: colMap.total_volume_inr === -1
          ? 0
          : parseNumber(rowData[colMap.total_volume_inr], row, 'Total Volume (INR)')
      };

      metrics.push(metric);
    }

    if (metrics.length === 0) {
      throw new Error('No valid metrics found in sheet');
    }

    // 5. Send to API
    const response = sendToAPI(metrics);

    // 6. Log results
    Logger.log(`Successfully imported ${response.imported_count} metrics`);
    Logger.log('Response:', JSON.stringify(response, null, 2));

    // Optional: Show success message
    SpreadsheetApp.getUi().alert(
      'Import Successful',
      `Imported ${response.imported_count} partner metrics to Supabase.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return response;
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    
    // Show error message
    SpreadsheetApp.getUi().alert(
      'Import Failed',
      error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function findColumnIndex(headers, possibleNames) {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    for (const name of possibleNames) {
      if (header === name.toLowerCase()) {
        return i;
      }
    }
  }
  return -1;
}

function parseNumber(value, row, fieldName) {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid number in row ${row}, column "${fieldName}": ${value}`);
  }
  return Math.floor(num); // Ensure integer
}

function sendToAPI(metrics) {
  const payload = {
    metrics: metrics
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(API_URL, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    const errorData = JSON.parse(responseText);
    throw new Error(`API Error (${responseCode}): ${errorData.error || responseText}`);
  }

  return JSON.parse(responseText);
}

// ═══════════════════════════════════════════════════════════════
// MENU SETUP (Optional - adds custom menu to Google Sheets)
// ═══════════════════════════════════════════════════════════════

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('CoinDCX Portal')
    .addItem('Import Metrics to Supabase', 'importMetricsToSupabase')
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════
// TIME-DRIVEN TRIGGER SETUP (Optional - for automation)
// ═══════════════════════════════════════════════════════════════

/**
 * To set up automatic imports:
 * 1. Go to Extensions > Apps Script
 * 2. Click the clock icon (Triggers) in the left sidebar
 * 3. Click "Add Trigger"
 * 4. Select function: importMetricsToSupabase
 * 5. Select event source: Time-driven
 * 6. Choose frequency (e.g., Hour timer > Every hour)
 * 7. Save
 */
function createTimeDrivenTrigger() {
  ScriptApp.newTrigger('importMetricsToSupabase')
    .timeBased()
    .everyHours(1) // Change to your desired frequency
    .create();
}

