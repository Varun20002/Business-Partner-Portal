# Business Partner Portal

CoinDCX partner dashboard built with Next.js 14, Supabase (auth, database, storage), and optional Google Sheets metrics import.

## Prerequisites

- **Node.js** 18.17 or later (recommended: 20 LTS)
- **npm** (comes with Node.js)
- A [Supabase](https://supabase.com) project
- (Optional) Google account with access to the partner metrics spreadsheet

## Quick start

### 1. Clone and install

```bash
git clone <repository-url>
cd Business-Partner-Portal
npm install
```

### 2. Environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `anon` / public key from the same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | `service_role` key — **never expose to the browser**; used for signup, metrics import, and admin APIs |

Get all three values from **Supabase Dashboard → Project Settings → API**.

> `.env.local` is gitignored. Do not commit real keys.

### 3. Supabase database setup

Run migrations **in numeric order** in the Supabase SQL Editor (**SQL → New query**), or via the Supabase CLI if you use it locally.

Files live in `supabase/migrations/`:

```
001_initial_schema.sql
002_fix_rls_recursion.sql
003_seed_test_data.sql          # optional — test metrics only
004_add_total_volume.sql
005_partner_metrics_rich_fields.sql
006_partner_metrics_case_insensitive_rls.sql
007_seed_dnap_faqs.sql
008_reset_dnap_faqs.sql
009_add_name_and_rsr.sql
010_seed_partner_uids.sql       # seeds partner UIDs for signup
012_add_seen_dashboard.sql
013_partner_update_seen_dashboard.sql
014_add_signed_up_at.sql
```

**Production:** Run `001` through `014` except skip `003` (test seed data) unless you want sample metrics.

**Local development:** You can run all migrations including `003` for a test partner UID (`VA51243378` in that file — change it to match a UID in your `profiles` table).

The initial migration also creates:

- Tables: `profiles`, `partner_metrics`, `webinars`, `marketing_materials`, `faqs`
- Storage bucket: `portal-assets` (public read; admin upload/delete)
- Row Level Security policies for partners and admins

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page redirects to `/login`.

Other scripts:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server (after build) |
| `npm run lint` | ESLint |

---

## Authentication

### Partners (UID + PIN)

1. Partner UIDs must exist in `profiles` before signup (see migration `010_seed_partner_uids.sql` or insert your own).
2. Partner visits `/signup`, enters UID (format: 2 letters + numbers, e.g. `VA51243378`) and a **4-digit PIN**.
3. Signup creates a Supabase Auth user with email `{uid}@partner.coindcx.internal` and links it to the profile.
4. Login at `/login` uses the same UID and PIN.

### Admins (email + password)

1. Create an admin user in **Supabase → Authentication → Users** (email + password).
2. Insert or update a row in `profiles` with `role = 'admin'` and `id` matching that auth user's UUID.

Migration `002` seeds a placeholder admin profile (`AD00000001`). Replace the `id` with your real admin auth user UUID, or create a new profile row linked to your admin user.

3. Log in at `/login` using the admin tab → redirects to `/admin`.

---

## Google Sheets metrics import (optional)

Partner metrics can be pushed from Google Sheets into Supabase via the API.

### App configuration

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` (and in Vercel for production).

### Google Apps Script

1. Open your metrics Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Paste the code from [`scripts/google-sheets-integration.gs`](scripts/google-sheets-integration.gs).
4. Update configuration at the top of the script:
   - `API_URL` — e.g. `https://your-domain.com/api/data/import-metrics` (local: `http://localhost:3000/api/data/import-metrics`)
   - `SERVICE_ROLE_KEY` — same value as `SUPABASE_SERVICE_ROLE_KEY`
   - `SHEET_NAME` — tab name if not `Sheet1`
5. Save and run `importMetricsToSupabase`, or add a time-driven trigger (instructions in the script comments).

The script adds a **CoinDCX Portal** menu to the sheet for manual imports.

### API details

- **Endpoint:** `POST /api/data/import-metrics`
- **Auth:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- **Body:** `{ "metrics": [ { "partner_uid": "...", ... } ] }`

Column headers and field mapping are documented in the Apps Script file.

---

## Deployment (Vercel)

1. Import the repository in [Vercel](https://vercel.com).
2. Add environment variables (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy. Update the Google Apps Script `API_URL` to your production domain.

---

## Project structure

```
src/
  app/                    # Next.js App Router pages & API routes
    (partner)/dashboard/  # Partner dashboard & resources
    admin/                # Admin CMS (webinars, materials, FAQs)
    api/                  # Auth, metrics import, profile APIs
  components/             # UI and layout components
  hooks/                  # React Query data hooks
  lib/                    # Supabase clients, validators, utilities
supabase/migrations/      # SQL schema & seeds
scripts/                  # Google Sheets Apps Script
public/                   # Static assets
```

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| "Invalid UID" on signup | UID exists in `profiles` (run `010` or insert manually) |
| Metrics import 401 | `SUPABASE_SERVICE_ROLE_KEY` matches the Bearer token in the script |
| Admin access denied | `profiles.role` is `admin` and `profiles.id` matches the auth user |
| Upload fails in admin | `portal-assets` bucket exists (created in `001`) and user is admin |
| Build fails | Node 18+, env vars set in Vercel for production builds |

---

## Security notes

- Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.
- The service role key bypasses RLS — only use it server-side and in trusted automation (Google Apps Script).
- Partner PINs are stored as Supabase Auth passwords; use strong operational practices for UID distribution.
