# Google Sheets Structure for Partner Metrics Import

## Overview

This document describes the required format for Google Sheets data that will be imported into the CoinDCX Partner Portal via the Google Apps Script integration.

## Sheet Format

### Required Columns

Your Google Sheet must have the following columns (in any order):

| Column Name | Description | Example | Required |
|------------|-------------|---------|----------|
| **Partner UID** | Partner unique identifier (2 letters + numbers) | `VA51243378` | ✅ Yes |
| **Total Users** | Total number of users | `1250` | ✅ Yes |
| **Traded Users** | Number of users who have traded | `450` | ✅ Yes |
| **Eligible 500 Users** | Number of users eligible for ₹500 bonus | `120` | ✅ Yes |
| **Volume Eligible Users** | Number of users eligible for volume-based rewards | `280` | ✅ Yes |
| **Total Volume (INR)** | Aggregate trading volume in INR for all referred users | `50000000` | ⚪ Optional (recommended) |

### Accepted Column Name Variations

The script is flexible and accepts these variations:

- **Partner UID**: `Partner UID`, `PartnerUID`, `UID`
- **Total Users**: `Total Users`, `TotalUsers`, `Total`
- **Traded Users**: `Traded Users`, `TradedUsers`, `Traded`
- **Eligible 500 Users**: `Eligible 500 Users`, `Eligible500`, `Eligible 500`
- **Volume Eligible Users**: `Volume Eligible Users`, `VolumeEligible`, `Volume Eligible`
- **Total Volume (INR)**: `Total Volume (INR)`, `Total Volume`, `Volume INR`

## Example Sheet

```
| Partner UID | Total Users | Traded Users | Eligible 500 Users | Volume Eligible Users | Total Volume (INR) |
|-------------|-------------|-------------|-------------------|----------------------|--------------------|
| VA51243378  | 1250        | 450         | 120               | 280                  | 50000000           |
| VB12345678  | 890         | 320         | 85                | 195                  | 30000000           |
| VC98765432  | 2100        | 750         | 180               | 420                  | 75000000           |
| VD55555555  | 450         | 150         | 35                | 90                   | 15000000           |
```

## Data Requirements

### Partner UID Format
- Must be **2 letters followed by numbers** (e.g., `VA51243378`, `AD00000001`)
- Case-insensitive (will be converted to uppercase)
- **Must exist in the `profiles` table** in Supabase before import
- If a UID doesn't exist, the import will fail for that row

### Numeric Values
- All metrics must be **non-negative integers** (0 or greater)
- Decimals will be rounded down to integers
- Empty cells or invalid numbers will cause the row to be skipped

### Empty Rows
- Empty rows are automatically skipped
- A row is considered empty if the Partner UID column is empty

## Setup Instructions

### 1. Create Your Google Sheet

1. Open Google Sheets
2. Create a new sheet or use an existing one
3. Add headers in the first row (see "Required Columns" above)
4. Add your data rows below the headers

### 2. Install Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any default code
3. Copy the contents of `scripts/google-sheets-integration.gs`
4. Paste into the Apps Script editor

### 3. Configure the Script

Update these variables in the script:

```javascript
const API_URL = 'https://your-domain.com/api/data/import-metrics';
const SERVICE_ROLE_KEY = 'your-service-role-key-here';
const SHEET_NAME = 'Sheet1'; // Change if your data is in a different sheet
```

**Where to find your Service Role Key:**
1. Go to Supabase Dashboard
2. Navigate to **Settings > API**
3. Copy the **service_role** key (⚠️ Keep this secret!)

### 4. Run the Script

**Manual Run:**
1. In Apps Script editor, select the function `importMetricsToSupabase`
2. Click the **Run** button (▶️)
3. Authorize the script (first time only)
4. Check the execution log for results

**Automatic Run (Optional):**
1. In Apps Script editor, click the **Triggers** icon (⏰)
2. Click **Add Trigger**
3. Configure:
   - Function: `importMetricsToSupabase`
   - Event source: **Time-driven**
   - Frequency: Choose your preference (e.g., Every hour)
4. Save

**Custom Menu (Optional):**
The script includes a custom menu that appears in your Google Sheet:
- Go to **CoinDCX Portal > Import Metrics to Supabase**
- This runs the import function

## Troubleshooting

### Error: "Missing required columns"
- **Solution**: Check that your header row contains at least one of the accepted column name variations (case-insensitive)

### Error: "Invalid partner UIDs (not found in profiles)"
- **Solution**: Ensure all Partner UIDs in your sheet exist in the Supabase `profiles` table. Create partner profiles first if needed.

### Error: "Invalid number in row X"
- **Solution**: Check that all numeric columns contain valid numbers (no text, no negative values)

### Error: "API Error (401): Unauthorized"
- **Solution**: Verify your `SERVICE_ROLE_KEY` is correct and matches the one in Supabase Dashboard

### Error: "API Error (500): Internal server error"
- **Solution**: Check your Next.js server logs. Ensure the API endpoint is deployed and accessible.

### No data imported
- **Solution**: 
  - Check that your data rows are below the header row
  - Verify Partner UID cells are not empty
  - Check the execution log in Apps Script for detailed error messages

## Best Practices

1. **Keep a backup** of your Google Sheet before running imports
2. **Test with a small dataset** first (1-2 rows) before importing all data
3. **Use consistent UID format** (uppercase recommended)
4. **Validate data** in the sheet before importing (use data validation rules)
5. **Monitor the execution log** in Apps Script for any warnings or errors
6. **Set up error notifications** if using automated triggers

## API Endpoint Details

**Endpoint:** `POST /api/data/import-metrics`

**Headers:**
```
Authorization: Bearer <SERVICE_ROLE_KEY>
Content-Type: application/json
```

**Request Body:**
```json
{
  "metrics": [
    {
      "partner_uid": "VA51243378",
      "total_users": 1250,
      "traded_users": 450,
      "eligible_500_users": 120,
      "volume_eligible_users": 280,
      "total_volume_inr": 50000000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 1 metrics",
  "imported_count": 1,
  "metrics": [...]
}
```

## Support

For issues or questions:
1. Check the execution log in Google Apps Script
2. Review server logs in your Next.js application
3. Verify Supabase database connection and RLS policies

