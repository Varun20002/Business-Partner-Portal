# AGENTS.md

## Cursor Cloud specific instructions

### Overview
CoinDCX Partner Portal — a Next.js 14 (App Router, TypeScript, Tailwind CSS) dashboard for partner/affiliate managers. Auth and data are powered by a **hosted Supabase** instance (no local DB required).

### Environment
- `.env.local` must exist with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Copy from `.env.local.txt` if missing.
- Optional: `SUPABASE_SERVICE_ROLE_KEY` for the `/api/data/import-metrics` admin endpoint.

### Common commands
See `package.json` scripts:
- `npm run dev` — starts dev server on port 3000
- `npm run build` — production build (also runs type-checking and linting)
- `npm run lint` — ESLint via `next lint`

### Auth flow
- Partner login: UID + 4-digit PIN (converted to `{uid}@partner.coindcx.internal` email internally).
- Admin login: email + password, requires `role = 'admin'` in Supabase `profiles` table.
- Middleware redirects unauthenticated users to `/login`.

### Gotchas
- There are no automated tests in this repo; validation is done via lint, build, and manual browser testing.
- The Supabase instance is remote/cloud — there is no local Supabase setup or `config.toml`.
- Hot reload works well with `npm run dev`; changes to `.env.local` require a server restart.
