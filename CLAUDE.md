# LinkedIn Engagement Monitor Dashboard - Claude Code Instructions

## Project Overview

React dashboard + REST API for tracking LinkedIn profile engagement. Monitors posts, tracks engagers, scores leads, and provides analytics. The frontend reads data directly from Supabase via the TypeScript client. The API server (`api-server/`) provides programmatic access for automation and integrations.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite 6
- **Routing**: React Router v6 (SPA with client-side routing)
- **State**: TanStack React Query v5 (server state) + React Context (theme)
- **Database**: Supabase (PostgreSQL + Realtime subscriptions)
- **Styling**: Tailwind CSS 3 + shadcn/ui (Radix-based) + Headless UI
- **Charts**: Recharts
- **Icons**: Lucide React (24x24 default)
- **API Server**: Express.js 4 + Supabase service_role + zod validation
- **Deployment**: Railway via Nixpacks (Node 20, `serve` for static files)

## Commands

```bash
# Frontend
npm run dev       # Vite dev server at localhost:5173
npm run build     # tsc && vite build -> dist/
npm run preview   # Vite preview at localhost:4173
npm run serve     # serve dist -s -l ${PORT:-4173} (production/Railway)

# API Server
cd api-server && npm run dev   # Express server at localhost:3001
```

## Project Structure

```
src/
  App.tsx                    # Root: QueryClientProvider > ThemeProvider > BrowserRouter > Routes
  main.tsx                   # ReactDOM entry point
  index.css                  # Global styles + CSS custom properties for dark mode
  components/
    dashboard/               # MetricsCard, LeadsTable, EngagerFilters
    layout/                  # Layout (sidebar+header wrapper), Header, app-sidebar
    profiles/                # ProfileCard, AddProfileModal, ManageCategoriesModal
    ui/                      # shadcn/ui primitives (button, card, dialog, badge, table, etc.)
  contexts/
    ThemeContext.tsx          # Light/dark mode via class-based Tailwind toggle
  hooks/
    useDashboard.ts          # Dashboard metrics + engager list with lead scoring
    useAnalytics.ts          # Industry, company size, location, skills, trends, heatmap, top titles
    useProfiles.ts           # LinkedIn profile CRUD
    usePosts.ts              # Post listing and status management
    useKeywordSearch.ts      # Full-text search via Supabase RPC functions
    usePostPerformance.ts    # Per-profile engagement analysis
    useRealtime.ts           # Supabase Realtime subscriptions -> React Query cache invalidation
    useFilterOptions.ts      # Dynamic filter option loading
    useCategories.ts         # Category CRUD
  lib/
    supabase.ts              # Supabase client (schema: 'linkedin', realtime: 10 events/sec)
    utils.ts                 # cn(), formatNumber(), formatDate(), formatRelativeTime(), parseLinkedInUsername()
  pages/
    Dashboard.tsx            # Main overview: metrics cards, engager table, filters
    Analytics.tsx            # Charts: industry, company size, location, skills, trends, heatmap, top titles
    Profiles.tsx             # Profile management with categories
    Posts.tsx                # Post listing with sync status
    KeywordSearch.tsx        # Keyword-based engager discovery
    PostPerformance.tsx      # Individual profile post analysis (/profiles/:profileUrl/posts)
    EngagerDetail.tsx        # Full engager profile (/engagers/:profileUrl)
    Settings.tsx             # App settings
  types/
    database.ts              # Supabase generated types (Database interface)
migrations/                  # SQL migration files (001-004)
*.json (root)                # n8n workflow exports (Part 1, 2, 3) -- data ingestion pipeline
api-server/
  index.js                   # Express app entry point
  lib/
    supabase.js              # Supabase client (service_role key, schema: 'linkedin')
    lead-scoring.js          # Server-side lead scoring (0-100, Hot/Warm/Cold)
    webhook.js               # Webhook delivery with retries + formatLeadPayload()
  middleware/
    auth.js                  # x-api-key header validation
    validate.js              # Zod schema validation factory
    error-handler.js         # Global error handler
  routes/
    profiles.js              # POST/GET/PATCH/DELETE /api/profiles
    scrape.js                # POST /api/scrape/posts, POST /api/scrape/engagers
    engagers.js              # GET /api/engagers (webhook delivery), GET /api/engagers/:profileUrl
    posts.js                 # GET /api/posts
    search.js                # GET /api/search
    export.js                # GET /api/export/engagers (CSV download)
  schemas/
    profiles.js              # Zod schemas for profile validation
    engagers.js              # Zod schemas for engager query params
clay-proxy/                  # CORS proxy for Clay webhook (separate Railway service)
```

## Architecture Patterns

### Data Flow
Supabase PostgreSQL -> React Query hooks (30s stale time, 1 retry, no refetch on focus) -> React components. Real-time: Supabase Realtime channels listen for postgres_changes and invalidate React Query caches.

### Database Schema (`linkedin` schema)
- **linkedin_profiles**: Monitored profiles (profile_url PK, webhooks JSONB, is_enabled, description, category)
- **linkedin_posts**: Posts from profiles (post_url unique, profile_url FK, post_text, status: PENDING/PROCESSING/COMPLETED)
- **enriched_profiles**: Engager data (profile_url PK, parent_profile FK, full_name, headline, company_name, company_industry, company_size, location, connections, followers, skills JSONB, experiences JSONB, educations JSONB, raw_data JSONB)
- **post_engagements**: Engager-to-post links for keyword search (engager_profile_url + post_url unique, post_text denormalized, GIN full-text index)
- **categories**: Profile organization (name unique, color hex)

### Supabase RPC Functions
- `search_engagers_by_keyword(TEXT)` -- Returns engagers with matching post text (ILIKE), joined with enriched_profiles
- `search_engagers_by_keyword_grouped(TEXT)` -- Same but grouped by person with engagement counts and post URL arrays

### Lead Scoring (client-side and API server-side)
Weighted score (0-100): Connections (25%) + Followers (25%) + Company Size (25%) + Seniority (25%). Categories: Hot (70-100), Warm (40-69), Cold (0-39). Computed in `src/hooks/useDashboard.ts` (frontend) and `api-server/lib/lead-scoring.js` (API).

## Coding Conventions

- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- **Component pattern**: Functional components with hooks, no class components
- **Styling**: Tailwind utility classes. Use `cn()` from `@/lib/utils` for conditional classes
- **shadcn/ui**: Components in `src/components/ui/`. These are copy-pasted primitives built on Radix -- edit them directly when needed
- **Hooks**: One hook file per domain concern. All Supabase queries wrapped in `useQuery`/`useMutation` from React Query
- **Types**: Database types in `src/types/database.ts`. Domain types co-located with hooks
- **Dark mode**: Class-based via ThemeContext. Use `dark:` Tailwind prefix
- **Exports**: Default exports for pages and layout components. Named exports for hooks and utilities

## Environment Variables

### Frontend (must be prefixed with `VITE_`)
```
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anon/public key (NOT service key)
```

### API Server (`api-server/.env`)
```
SUPABASE_URL             # Supabase project URL
SUPABASE_SERVICE_KEY     # Supabase service_role key (full access)
API_KEYS                 # Comma-separated API keys for x-api-key auth
PORT                     # Optional, default 3001 (Railway sets automatically)
N8N_SCRAPE_POSTS_WEBHOOK    # Optional, default: https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-posts
N8N_SCRAPE_ENGAGERS_WEBHOOK # Optional, default: https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-engagers
ALLOWED_ORIGIN           # Optional, CORS origin (default: *)
```

## n8n Workflow Pipeline (Data Ingestion)

Three n8n workflows in the repo root handle all data collection. The dashboard only reads this data.

### Part 1: Scrape Profiles (every 2 days)
`Linkedin Monitoring Part 1 - Scrape Profile.json`
1. Fetches all enabled profiles from `linkedin_profiles`
2. Calls **Apify `supreme_coder~linkedin-post`** (deepScrape, limit 3 posts per profile)
3. For each scraped post: checks if it already exists in `linkedin_posts`
4. Skips reposts. Inserts new posts with `status: PENDING` and `post_text`. Updates existing posts if insert fails (duplicate).

### Part 2: Scrape Engagers (every hour)
`Linkedin Monitoring Part 2(1).json`
1. Fetches all `PENDING` posts from `linkedin_posts`
2. Time filter: post created >= 48h ago OR posted <= 500h ago
3. Sets post status to `PROCESSING`
4. Calls in parallel:
   - **Apify `harvestapi~linkedin-post-reactions`** (likes)
   - **Apify `harvestapi~linkedin-post-comments`** (comments + replies)
5. Merges results, then JavaScript code deduplicates profiles, extracts contact info (name, headline, profileUrl, urn), and attaches parent profile + post_url
6. Passes processed engager data to Part 3

### Part 3: Enrich & Save (called by Part 2)
`Linkedin Monitoring Part 3(1).json`
1. Receives engager items (parent, post_url, contact info, engagements)
2. Deduplication: checks `enriched_profiles` by URN + parent_profile
3. For new engagers: calls **Apify `apimaestro~linkedin-profile-detail`** for full enrichment (name, headline, company, location, connections, followers, experience, education, skills, etc.)
4. Inserts enriched data into `enriched_profiles` table
5. In parallel, loops through post URLs and saves records to `post_engagements` (engager_profile_url, post_url, post_text, monitored_profile_url, engagement_type)

### External APIs Used
- **Apify `supreme_coder~linkedin-post`**: Post scraping (Part 1)
- **Apify `harvestapi~linkedin-post-reactions`**: Reaction/like extraction (Part 2)
- **Apify `harvestapi~linkedin-post-comments`**: Comment extraction (Part 2)
- **Apify `apimaestro~linkedin-profile-detail`**: Profile enrichment (Part 3)
- **LeadMagic `profile-search`**: Alternative enrichment (Part 3, currently disabled)

### Post Status Lifecycle
`PENDING` (Part 1 creates) -> `PROCESSING` (Part 2 picks up) -> `PROCESSED - 1` (Part 3 completes)

## Key Implementation Details

- Supabase client uses `schema: 'linkedin'` -- all table references omit the schema prefix
- Legacy `Webhook` (capitalized) column coexists with `webhooks` (JSONB array) for backward compatibility
- Real-time subscriptions reference `schema: 'linkedinengagements'` (Supabase Realtime config)
- `post_engagements.post_text` is denormalized from `linkedin_posts` for faster full-text search without JOINs
- React Query default: `staleTime: 30000`, `retry: 1`, `refetchOnWindowFocus: false`
- All analytics hooks accept a `TimeRange` type (7 | 14 | 30 | 90 days)
- URL params use encoded LinkedIn profile URLs (`:profileUrl` in routes)

## Common Tasks

### Adding a new page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx` inside the `<Route path="/" element={<Layout />}>` wrapper
3. Add sidebar link in `src/components/layout/app-sidebar.tsx`

### Adding a new data hook
1. Create hook in `src/hooks/` using `useQuery` from React Query
2. Import `supabase` from `@/lib/supabase`
3. Use appropriate query key array for cache management
4. Add real-time invalidation in `src/hooks/useRealtime.ts` if needed

### Adding a shadcn/ui component
Run `npx shadcn@latest add <component>` or manually create in `src/components/ui/`

### Database migrations
SQL files in `migrations/` directory. Run manually against Supabase SQL editor. Numbered sequentially (001, 002, ...).

## REST API Server

Express.js API at `api-server/`, deployed as a separate Railway service at `https://lg-linkedinmonitor-api.up.railway.app`. Auth via `x-api-key` header.

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/profiles` | Add profile with optional webhooks |
| `GET` | `/api/profiles` | List profiles (`?enabled=`, `?category=`) |
| `GET` | `/api/profiles/:profileUrl` | Single profile with stats |
| `PATCH` | `/api/profiles/:profileUrl` | Update profile |
| `DELETE` | `/api/profiles/:profileUrl` | Delete profile |
| `POST` | `/api/scrape/posts` | Trigger n8n Part 1 |
| `POST` | `/api/scrape/engagers` | Trigger n8n Part 2 |
| `GET` | `/api/engagers` | Fetch + push to webhook (with lead scoring) |
| `GET` | `/api/engagers/:profileUrl` | Single engager detail |
| `GET` | `/api/posts` | List posts (`?profile_url=`, `?status=`) |
| `GET` | `/api/search` | Keyword search (`?keyword=`, `?grouped=`) |
| `GET` | `/api/export/engagers` | CSV download with filters |
| `GET` | `/api/health` | Health check (public) |

### GET /api/engagers Webhook Behavior
1. If `?webhook=<url>` provided -- push to that URL, overrides profile webhooks
2. If no `?webhook` but `?parent_profile` set -- uses profile's stored `webhooks` array
3. If no webhook anywhere -- returns 400 error
4. Add `?include_data=true` to include engager data in response (default: delivery results only)

### Adding an API endpoint
1. Create route handler in `api-server/routes/`
2. Add zod schema in `api-server/schemas/` if needed
3. Register route in `api-server/index.js`

## Deployment

### Frontend
Railway auto-deploys from GitHub. Build: `npm ci && npm run build`. Start: `serve dist -s -l $PORT`. The `-s` flag enables SPA mode (all routes serve index.html).

### API Server
Separate Railway service, root directory: `api-server`. Start: `node index.js`. URL: `https://lg-linkedinmonitor-api.up.railway.app`.

### Clay Proxy
Separate Railway service, root directory: `clay-proxy`. Start: `node index.js`. URL: `https://lg-clay-proxy.up.railway.app`.
