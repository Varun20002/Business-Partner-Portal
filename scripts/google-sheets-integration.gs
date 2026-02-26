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
    //
    // Canonical Google Sheets headers that directly back the dashboard tiles:
    // - Partner UID                      → partner_uid
    // - Total Users                      → total_users
    // - Traded Users                     → traded_users
    // - Eligible 500 Users               → eligible_500_users
    // - Crossed Threshold(1000000 INR)   → crossed_threshold_users
    // - New User incetive (500 X Crossed 1M INR ) → new_user_incentive_inr
    // - Current Baseline                 → current_baseline_volume_inr
    // - Incremental Volume               → incremental_volume_inr
    // - Volume Based incentive (Based on Incremental Volume) → volume_incentive_inr
    // - Volume Required for next Slab    → volume_to_next_slab_inr
    // - Volume Based Incentive if they reach that Slab → next_slab_incentive_inr
    //
    // We still support a few flexible aliases for backwards compatibility.
    const colMap = {
      partner_uid: findColumnIndex(headers, ['Partner UID', 'PartnerUID', 'UID']),
      total_users: findColumnIndex(headers, ['Total Users', 'TotalUsers', 'Total', 'Users since Feb 1st']),
      traded_users: findColumnIndex(headers, ['Traded Users', 'TradedUsers', 'Traded', 'Who traded', 'Who Traded', 'Users who traded']),
      eligible_500_users: findColumnIndex(headers, ['Eligible 500 Users', 'Eligible500', 'Eligible 500']),
      volume_eligible_users: findColumnIndex(headers, ['Volume Eligible Users', 'VolumeEligible', 'Volume Eligible']),
      total_volume_inr: findColumnIndex(headers, ['Total Volume (INR)', 'Total Volume', 'Volume INR']),
      new_users: findColumnIndex(headers, ['New User', 'New Users', 'NewUsers']),
      crossed_threshold_users: findColumnIndex(headers, ['Crossed Threshold(1000000 INR)', 'Crossed Threshold', 'Crossed 1M', 'Users crossed 1M volume']),
      new_user_incentive_inr: findColumnIndex(headers, ['New User incetive (500 X Crossed 1M INR )', 'New User incentive', 'New User Incentive', 'New users earnings (₹)']),
      current_baseline_volume_inr: findColumnIndex(headers, ['Current Baseline', 'Current Baseline Volume', 'Current baseline volume (₹)']),
      incremental_volume_inr: findColumnIndex(headers, ['Incremental Volume', 'Incremental volume (₹)']),
      volume_incentive_inr: findColumnIndex(headers, ['Volume Based incentive (Based on Incremental Volume)', 'Volume Based incentive', 'Volume Incentive', 'Volume incentive (₹)']),
      volume_to_next_slab_inr: findColumnIndex(headers, ['Volume Required for next Slab', 'Volume Required for next slab', 'Volume required for next slab (₹)']),
      next_slab_incentive_inr: findColumnIndex(headers, ['Volume Based Incentive if they reach that Slab', 'Next Slab Incentive'])
    };

    // Validate that all core columns needed for the dashboard are present.
    const missingCols = Object.entries(colMap)
      .filter(([name, idx]) => {
        // Only the identity + primary user counts are strictly required.
        // "Users crossed 1M volume" can now be provided via a single column,
        // and we derive older fields (Eligible 500 Users, Volume Eligible Users) from it when missing.
        const required = ['partner_uid', 'total_users', 'traded_users'];
        return required.indexOf(name) !== -1 && idx === -1;
      })
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
      const partnerUid = String(rowData[colMap.partner_uid]).trim().toUpperCase();
      const totalUsers = parseNumber(rowData[colMap.total_users], row, 'Total Users / Users since Feb 1st');
      const tradedUsers = parseNumber(rowData[colMap.traded_users], row, 'Traded Users / Users who traded');

      // Single source of truth for \"users crossed 1M volume\".
      const crossedThresholdUsers = colMap.crossed_threshold_users === -1
        ? 0
        : parseNumber(
            rowData[colMap.crossed_threshold_users],
            row,
            'Crossed Threshold(1000000 INR) / Users crossed 1M volume'
          );

      // For backwards compatibility, derive legacy fields when their columns are missing.
      const eligible500Users = colMap.eligible_500_users === -1
        ? crossedThresholdUsers
        : parseNumber(rowData[colMap.eligible_500_users], row, 'Eligible 500 Users');

      const volumeEligibleUsers = colMap.volume_eligible_users === -1
        ? crossedThresholdUsers
        : parseNumber(rowData[colMap.volume_eligible_users], row, 'Volume Eligible Users');

      const metric = {
        partner_uid: partnerUid,
        total_users: totalUsers,
        traded_users: tradedUsers,
        eligible_500_users: eligible500Users,
        volume_eligible_users: volumeEligibleUsers,
        total_volume_inr: colMap.total_volume_inr === -1
          ? 0
          : parseNumber(rowData[colMap.total_volume_inr], row, 'Total Volume (INR)'),
        new_users: colMap.new_users === -1
          ? 0
          : parseNumber(rowData[colMap.new_users], row, 'New User'),
        crossed_threshold_users: crossedThresholdUsers,
        new_user_incentive_inr: colMap.new_user_incentive_inr === -1
          ? 0
          : parseNumber(rowData[colMap.new_user_incentive_inr], row, 'New users earnings (₹) / New User incentive'),
        current_baseline_volume_inr: colMap.current_baseline_volume_inr === -1
          ? 0
          : parseNumber(rowData[colMap.current_baseline_volume_inr], row, 'Current baseline volume (₹) / Current Baseline'),
        incremental_volume_inr: colMap.incremental_volume_inr === -1
          ? 0
          : parseNumber(rowData[colMap.incremental_volume_inr], row, 'Incremental volume (₹) / Incremental Volume'),
        volume_incentive_inr: colMap.volume_incentive_inr === -1
          ? 0
          : parseNumber(rowData[colMap.volume_incentive_inr], row, 'Volume incentive (₹) / Volume Based incentive'),
        volume_to_next_slab_inr: colMap.volume_to_next_slab_inr === -1
          ? 0
          : parseNumber(rowData[colMap.volume_to_next_slab_inr], row, 'Volume required for next slab (₹) / Volume Required for next Slab'),
        next_slab_incentive_inr: colMap.next_slab_incentive_inr === -1
          ? 0
          : parseNumber(rowData[colMap.next_slab_incentive_inr], row, 'Next Slab Incentive')
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
  let errorData;
  try {
    errorData = JSON.parse(responseText);
  } catch (e) {
    errorData = null;
  }

  // Log full response for debugging
  Logger.log('API response code: ' + responseCode);
  Logger.log('API raw response: ' + responseText);
  if (errorData) {
    Logger.log('API error object: ' + JSON.stringify(errorData));
  }

  const msg = errorData && errorData.error
    ? `API Error (${responseCode}): ${errorData.error} (code=${errorData.code || 'n/a'}, details=${errorData.details || 'n/a'})`
    : `API Error (${responseCode}): ${responseText}`;

  throw new Error(msg);
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

