# LinkedIn Engagement Dashboard

Track who engages with LinkedIn profiles. Monitor posts, extract reactors and commenters, enrich their profiles, score leads, and explore everything in a real-time dashboard.

![React](https://img.shields.io/badge/React-18-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) ![Apify](https://img.shields.io/badge/Apify-Scraping-orange)

## What It Does

1. **Monitors LinkedIn profiles** you choose
2. **Scrapes recent posts** from those profiles
3. **Extracts engagers** -- people who liked or commented
4. **Enriches profiles** -- job title, company, location, connections, skills
5. **Scores leads** -- Hot / Warm / Cold based on seniority, connections, company size
6. **Dashboard** -- filter, search, analyze, and export

## Prerequisites

- **Node.js 18+**
- **Supabase** account (free tier works) -- [supabase.com](https://supabase.com)
- **Apify** account ($5 free credit) -- [apify.com](https://apify.com)

## Quickstart

### 1. Clone & install

```bash
git clone https://github.com/your-username/linkedin-engagement-scraper.git
cd linkedin-engagement-scraper

npm install                    # Frontend dependencies
cd api-server && npm install   # API server dependencies
cd ../scripts && npm install   # Scraping script dependencies
cd ..
```

### 2. Set up Supabase

1. Create a new Supabase project
2. Go to **SQL Editor** and paste the contents of `supabase/setup.sql`
3. Click **Run** -- this creates the schema, tables, indexes, functions, and permissions
4. Go to **Database > Replication** and ensure the `linkedin` schema is enabled for Realtime

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in your keys:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_KEY` | Same page, under "service_role" (keep secret) |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Same page, under "anon" / "public" |
| `APIFY_TOKEN` | [Apify Console > Integrations](https://console.apify.com/account/integrations) |
| `API_KEYS` | Any string you want (used to protect the API) |

### 4. Start the dashboard

In two terminals:

```bash
# Terminal 1: Frontend
npm run dev
# -> http://localhost:5173

# Terminal 2: API Server
cd api-server && npm run dev
# -> http://localhost:3001
```

### 5. Add profiles and scrape

```bash
# Add a LinkedIn profile to monitor
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"profile_url": "https://www.linkedin.com/in/username", "is_enabled": true}'

# Run the full scraping pipeline
cd scripts && node run-all.js
```

Open `http://localhost:5173` -- your data should appear.

## Scheduling

Set up a cron job to scrape automatically:

```bash
# Every 6 hours
0 */6 * * * cd /path/to/linkedin-engagement-scraper && node scripts/run-all.js >> logs/scrape.log 2>&1

# Or run steps separately:
# Posts every 2 days
0 0 */2 * * cd /path/to/repo && node scripts/scrape-posts.js >> logs/posts.log 2>&1
# Engagers every hour
0 * * * * cd /path/to/repo && node scripts/scrape-engagers.js >> logs/engagers.log 2>&1
```

## Cost

Each full scrape uses ~$0.36 in Apify credits:
- Post scraping: ~$0.01 per profile
- Reactions + comments: ~$0.05 per post
- Profile enrichment: ~$0.10 per new engager

Apify gives $5 free monthly credit, enough for regular monitoring of several profiles.

## API Endpoints

All endpoints (except `/api/health`) require the `x-api-key` header.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/profiles` | Add a profile to monitor |
| `GET` | `/api/profiles` | List profiles |
| `PATCH` | `/api/profiles/:url` | Update a profile |
| `DELETE` | `/api/profiles/:url` | Delete a profile |
| `POST` | `/api/scrape/posts` | Trigger post scraping |
| `POST` | `/api/scrape/engagers` | Trigger engager scraping |
| `GET` | `/api/engagers` | Fetch engagers (+ webhook push) |
| `GET` | `/api/engagers/:url` | Single engager detail |
| `GET` | `/api/posts` | List posts |
| `GET` | `/api/search` | Keyword search |
| `GET` | `/api/export/engagers` | CSV export |

## Project Structure

```
src/                  React dashboard (Vite + Tailwind + shadcn/ui)
api-server/           Express REST API
scripts/              Automation scripts (replaces n8n workflows)
  scrape-posts.js     Part 1: Fetch posts via Apify
  scrape-engagers.js  Part 2+3: Extract engagers, enrich profiles
  run-all.js          Run both in sequence
  lib/                Shared Apify + Supabase clients
supabase/
  setup.sql           Complete database schema
skill/
  SKILL.md            Claude Code skill for API management
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, TanStack Query
- **API**: Express.js, Zod validation
- **Database**: Supabase (PostgreSQL + Realtime)
- **Scraping**: Apify actors for LinkedIn data extraction

## Customization

Personalize the dashboard for your own use:

| What | Where |
|------|-------|
| App name in sidebar | `src/components/layout/app-sidebar.tsx` -- change the `<h1>` text |
| Sidebar logo/icon | Replace `src/img/lgLM_icon.png` with your own image |
| Favicon | Update the `<link rel="icon">` path in `index.html` |
| Page title | Change the `<title>` in `index.html` |
| Footer user/email | `src/components/layout/app-sidebar.tsx` -- update the `SidebarFooter` section |

---

Built by [Leadgrow](https://leadgrow.co)
