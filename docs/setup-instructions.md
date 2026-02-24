# Setup Instructions: Google Sheets Integration & Test Data

## Quick Start

### 1. Add Service Role Key to Environment

1. Get your Supabase Service Role Key:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to **Settings > API**
   - Copy the **service_role** key (⚠️ Keep this secret!)

2. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

### 2. Seed Test Data (Optional)

Run the SQL migration to add test data for your partner dashboard:

1. Go to Supabase Dashboard > **SQL Editor**
2. Open the file: `supabase/migrations/003_seed_test_data.sql`
3. **Important**: Update the `partner_uid` value (line 19) to match your actual partner UID
4. Copy and paste the SQL into the editor
5. Click **Run**

This will:
- Add a unique constraint on `partner_uid` (required for upsert)
- Insert test metrics for your partner
- Allow you to see data immediately in the dashboard

### 3. Test the API Endpoint

Test the API endpoint with a simple curl command:

```bash
curl -X POST http://localhost:3000/api/data/import-metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "metrics": [
      {
        "partner_uid": "VA51243378",
        "total_users": 1250,
        "traded_users": 450,
        "eligible_500_users": 120,
        "volume_eligible_users": 280
      }
    ]
  }'
```

Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key.

### 4. Set Up Google Sheets Integration

1. **Create your Google Sheet:**
   - See `docs/google-sheets-structure.md` for the required format
   - Add headers: Partner UID, Total Users, Traded Users, Eligible 500 Users, Volume Eligible Users
   - Add your data rows

2. **Install Google Apps Script:**
   - In your Google Sheet, go to **Extensions > Apps Script**
   - Delete any default code
   - Open `scripts/google-sheets-integration.gs`
   - Copy the entire file content
   - Paste into Apps Script editor

3. **Configure the Script:**
   Update these variables in the script:
   ```javascript
   const API_URL = 'https://your-domain.com/api/data/import-metrics';
   // For local testing: 'http://localhost:3000/api/data/import-metrics'
   
   const SERVICE_ROLE_KEY = 'your-service-role-key-here';
   ```

4. **Run the Script:**
   - In Apps Script editor, select function `importMetricsToSupabase`
   - Click **Run** (▶️)
   - Authorize the script (first time only)
   - Check execution log for results

5. **Optional - Set Up Automation:**
   - In Apps Script, click **Triggers** icon (⏰)
   - Click **Add Trigger**
   - Function: `importMetricsToSupabase`
   - Event source: **Time-driven**
   - Frequency: Choose your preference (e.g., Every hour)

## Verification

### Check Test Data in Dashboard

1. Log in to the partner portal with your UID and PIN
2. Navigate to `/dashboard`
3. You should see 4 metric cards:
   - Total Users
   - Traded Users
   - Eligible 500 Users
   - Volume Eligible Users

### Check API Endpoint

Visit: `http://localhost:3000/api/data/import-metrics` (GET request)

You should see:
```json
{
  "status": "ok",
  "endpoint": "/api/data/import-metrics",
  "method": "POST",
  "required_headers": ["Authorization: Bearer <SERVICE_ROLE_KEY>"]
}
```

## Troubleshooting

### Dashboard shows "Your dashboard is being prepared"

**Solution:** 
- Run the SQL migration (`003_seed_test_data.sql`)
- Verify the `partner_uid` in the migration matches your actual partner UID
- Check Supabase database to confirm data exists

### API returns 401 Unauthorized

**Solution:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Restart your Next.js server after adding the key
- Check that the Authorization header uses `Bearer <key>` format

### Google Sheets script fails

**Solution:**
- Verify `API_URL` is correct (use full URL, not localhost for production)
- Check `SERVICE_ROLE_KEY` is correct
- Review execution log in Apps Script for detailed errors
- Ensure Partner UIDs in sheet exist in Supabase `profiles` table

### "Invalid partner UIDs" error

**Solution:**
- All Partner UIDs in your Google Sheet must exist in the `profiles` table
- Create partner profiles first (via Supabase Auth + profiles table)
- UIDs are case-insensitive but must match exactly

## Next Steps

1. ✅ Add service role key to `.env.local`
2. ✅ Run SQL migration for test data
3. ✅ Verify dashboard shows metrics
4. ✅ Set up Google Sheets with proper structure
5. ✅ Configure and test Google Apps Script
6. ✅ Set up automated triggers (optional)

## Files Created

- `src/app/api/data/import-metrics/route.ts` - API endpoint
- `src/lib/validators/metrics.ts` - Data validation
- `supabase/migrations/003_seed_test_data.sql` - Test data migration
- `scripts/google-sheets-integration.gs` - Google Apps Script
- `docs/google-sheets-structure.md` - Sheet format documentation
- `docs/setup-instructions.md` - This file

## Security Notes

⚠️ **Important:**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Never commit `.env.local` to version control
- Service role key bypasses RLS - use only server-side
- Consider IP whitelisting for production API endpoint

