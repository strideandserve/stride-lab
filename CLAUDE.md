# Stride Lab — Claude Code Context

## What This Is
Stride Lab is a running shoe tracking, training plan, and race analytics app built for Lucas Schodowski (Stride and Serve). It tracks shoe mileage, performance scoring, race history, training plans with shoe forecasting, and spending projections.

## Live URLs
- **Production:** https://stride-lab-7cpu.vercel.app
- **GitHub:** https://github.com/strideandserve/stride-lab
- **Supabase:** https://odjrsemqrkllxopczixn.supabase.co

## Stack
- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript (strict: false)
- **Auth + DB:** Supabase (`@supabase/auth-helpers-nextjs`)
- **Styling:** CSS Modules (no Tailwind)
- **Deployment:** Vercel (auto-deploys on push to `main`)
- **Fonts:** Bebas Neue (headings), DM Mono (labels/data), DM Sans (body)

## Project Structure
```
src/
  app/
    app/                    # Protected app routes (require auth)
      page.tsx              # Home page (server component)
      layout.tsx            # App shell layout (fetches session)
      locker/page.tsx       # Shoe locker
      rankings/page.tsx     # Rankings
      races/page.tsx        # Race log
      training/page.tsx     # Training plan
    auth/
      page.tsx              # Login / signup
      callback/route.ts     # Supabase OAuth callback
    layout.tsx              # Root layout (fonts, metadata)
    globals.css             # Global CSS variables + reset
  components/
    pages/
      HomeClient.tsx        # Home page client component
      HomeClient.module.css
      LockerClient.tsx      # Shoe locker client component
      LockerClient.module.css
      RankingsClient.tsx    # Rankings client component
      RankingsClient.module.css
      RacesClient.tsx       # Race log + podium client component
      RacesClient.module.css
      TrainingClient.tsx    # Training plan client component
      TrainingClient.module.css
    AppShell.tsx            # Nav + bottom tab bar + import/export
    AppShell.module.css
    BrandLogo.tsx           # Brand logo with inline SVG fallback
    Modal.tsx               # Bottom-sheet modal (mobile-first)
    Modal.module.css
    Form.tsx                # Shared form components (Input, Select, Btn, etc)
    Form.module.css
    Toast.tsx               # Toast notification system
    Toast.module.css
  lib/
    types.ts                # All TypeScript interfaces
    utils.ts                # Scoring, pace helpers, brand logos, run type labels
    supabase.ts             # Supabase client factory
public/
  manifest.json             # PWA manifest
  apple-touch-icon.png      # 180x180 home screen icon (SL logo, green/black)
  icon-512.png              # 512x512 version
supabase/
  migrations/               # All SQL migrations (run manually in Supabase SQL editor)
```

## Database Schema
```sql
profiles        (id, name, created_at)
shoes           (id, user_id, name, brand, category, max_miles, start_miles, size, wide, price, retired, added_date, created_at)
runs            (id, user_id, shoe_id, miles, date, pace, hr, comfort, elevation, temp, humidity, location, notes, finish_time, is_race, race_name, race_type, created_at)
upcoming_races  (id, user_id, name, date, type, location, goal_time, created_at)
training_plans  (id, user_id, name, goal, start_date, weeks, active, created_at)
planned_runs    (id, user_id, plan_id, week_number, day_of_week, date, run_type, planned_miles, target_pace, shoe_id, notes, logged_run_id, created_at)
```

## Design System
- **Background:** `#050a05` (deep black-green)
- **Surface:** `#0c120c` / `#141e14`
- **Border:** `#1e2e1e`
- **Accent:** `#39ff6a` (neon green — primary CTA, active states)
- **Daily shoe color:** `#39ff6a`
- **Speed shoe color:** `#ff6b35`
- **Race shoe color:** `#a8ff3e`
- **Red/danger:** `#ff4747`
- **Text:** `#e8f5e8` / muted: `#527a52` / dim: `#2e452e`

## Key Patterns
- All pages are **server components** that fetch data then pass to **client components**
- Client components are named `*Client.tsx` and live in `src/components/pages/`
- Modals use bottom-sheet style on mobile (slides up), centered dialog on desktop
- All font sizes on inputs are `16px` minimum to prevent iOS zoom
- `saveState()` in the old HTML file wrote to localStorage — **not relevant to the hosted app**
- New database columns require a SQL migration run manually in Supabase SQL Editor

## Shoe Categories
- `daily` — everyday trainers, max ~350 mi
- `speed` — carbon plate speed shoes, max ~175 mi
- `race` — race day shoes, max ~150 mi

## Run Types (Training Plan)
- `recovery`, `recovery_strides`, `gen_aerobic`, `med_long`, `lt_run`, `tempo`, `long_run`, `speed_intervals`

## Brand Logos
Stored in `src/lib/utils.ts` as `BRAND_LOGOS`. Nike, Adidas, ASICS, Brooks, Saucony, On Running, Mizuno, Hoka, Salomon use Wikimedia SVG URLs. **Puma and New Balance use inline base64 SVG data URIs** (Wikimedia URLs broken for these two).

## Composite Scoring Formula
- Pace efficiency: 40% (range: 5:00–12:00 min/mi)
- Heart rate: 35% (range: 120–200 bpm, lower = better)
- Comfort: 25% (0–10 scale)

## Shoe Replacement Forecast
Only applies to `daily` category shoes. Calculates daily average miles from first run date, projects when `max_miles` will be hit. Also uses `planned_runs` to project forward from training plan.

## Monthly Mileage Chart
Canvas-based line chart on home page. Current month stops at today with a vertical "TODAY" line. Past months show full month. Each shoe gets its own colored line with 👟 icon at endpoint.

## Deployment Workflow
```bash
cd ~/Downloads/stride-lab
git add -A
git commit -m "description"
git push
# Vercel auto-deploys in ~60 seconds
```

## Supabase Migrations
New columns/tables must be added manually:
1. Go to Supabase dashboard → SQL Editor → New Query
2. Paste the SQL and run it
3. Then push the code changes

## Key User
- **Name:** Lucas (displays as "HEY, LUCAS." on home page)
- **Email:** lucasdenali@gmail.com
- **Goal:** Sub-2:50 marathon at Chicago Marathon (October 11)
- **Training:** Boston Marathon qualifying journey ("Going to Boston" series)
- **Brand:** Stride and Serve

## Features Built (as of June 2026)
1. Shoe locker — add/edit/retire shoes with brand logos, size, price, mileage limits
2. Run logging — miles, pace, HR, elevation, temp, humidity, location, comfort, finish time
3. Race log — race entries with podium chart and % improvement vs previous PR
4. Rankings — composite score leaderboard by category
5. Home page — best shoes by category, monthly mileage chart, bar chart, replacement forecast, spending projection, race countdowns, training widget
6. Training plan — week-by-week plan with run types, target pace, shoe assignment, pace comparison after logging, shoe forecast from plan, link existing runs
7. Shoe retirement — retired shoes hidden from home page, preserved in history
8. Cost per mile — shown on shoe cards and rankings
9. Export/Import JSON backup
10. PWA — installable on iPhone with SL icon

## What's Next (potential features)
- Weather auto-fill (Open-Meteo API, free, no key needed)
- Weekly mileage totals chart (actual vs planned)
- Post-run feel rating beyond comfort score
- Push notifications for planned runs
- Multi-user launch (infrastructure already supports it)
