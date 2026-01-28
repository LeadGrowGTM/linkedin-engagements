# LinkedIn Engagement Monitor Dashboard - Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [n8n Workflow Pipeline](#n8n-workflow-pipeline)
4. [Application Architecture](#application-architecture)
5. [Routing & Navigation](#routing--navigation)
6. [Data Layer](#data-layer)
7. [Database Schema](#database-schema)
8. [Real-time System](#real-time-system)
9. [Component Architecture](#component-architecture)
10. [State Management](#state-management)
11. [Styling System](#styling-system)
12. [Lead Scoring Algorithm](#lead-scoring-algorithm)
13. [Keyword Search System](#keyword-search-system)
14. [Analytics Engine](#analytics-engine)
15. [Configuration](#configuration)
16. [Build & Deployment](#build--deployment)
17. [Security](#security)
18. [External Integrations](#external-integrations)
19. [File Reference](#file-reference)

---

## System Overview

This is a **frontend-only** single-page application (SPA) that monitors LinkedIn profile engagement. There is no backend server -- the React application communicates directly with Supabase (PostgreSQL + Realtime) for all data operations.

### High-Level Data Flow

```
LinkedIn
    |  (Apify scraping APIs)
    v
n8n Workflows (3-part pipeline, exported as JSON in project root)
    |  Part 1: Scrape posts every 2 days
    |  Part 2: Extract engagers every hour
    |  Part 3: Enrich profiles + save engagements
    v
Supabase PostgreSQL (linkedin schema)
    |
    +-- Realtime subscriptions (postgres_changes)
    |
    v
React App (Vite SPA)
    |
    +-- React Query (server state cache, 30s stale time)
    +-- React Context (theme/UI state)
    +-- React Router v6 (client-side routing)
    |
    v
Browser (served as static files via `serve`)
```

The n8n workflows are exported as JSON files in the project root. They handle all data ingestion -- the dashboard is read-only.

---

## Technology Stack

### Core

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI Framework | React | 18.3.1 | Component-based UI |
| Language | TypeScript | 5.7.2 | Type safety |
| Bundler | Vite | 6.0.3 | Dev server, HMR, production builds |
| Routing | React Router | 6.28.0 | Client-side SPA routing |
| Server State | TanStack React Query | 5.62.7 | Caching, synchronization, mutations |
| Database | Supabase (supabase-js) | 2.48.1 | PostgreSQL + Realtime client |
| Charts | Recharts | 2.15.4 | Data visualization |

### UI & Styling

| Library | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| shadcn/ui | N/A (copy-paste) | Radix-based component primitives |
| Headless UI | 2.2.0 | Unstyled accessible components |
| Radix UI (Dialog, Separator, Tooltip, Slot) | Various | Primitive UI building blocks |
| Lucide React | 0.468.0 | Icon library |
| class-variance-authority | 0.7.1 | Component variant composition |
| clsx + tailwind-merge | 2.1.1 / 2.6.0 | Conditional CSS class composition |

### Build & Deploy

| Tool | Purpose |
|------|---------|
| Vite | Development and production bundling |
| TypeScript Compiler (tsc) | Pre-build type checking |
| serve | Static file server for production (SPA mode) |
| Railway | Cloud deployment platform |
| Nixpacks | Build system for Railway (Node 20) |
| PostCSS + Autoprefixer | CSS post-processing |

---

## n8n Workflow Pipeline

Three n8n workflows handle all data ingestion. They are exported as JSON files in the project root and run on a self-hosted n8n instance. The dashboard only reads the data these workflows produce.

### Pipeline Overview

```
Part 1 (every 2 days)          Part 2 (every hour)               Part 3 (called by Part 2)
─────────────────────           ─────────────────────              ──────────────────────────
Fetch enabled profiles          Fetch PENDING posts                Receive engager items
        |                               |                                  |
Call Apify post scraper         Time filter (48h/500h)             Deduplicate by URN
        |                               |                                  |
Check if post exists            Set status -> PROCESSING           Call Apify profile detail
        |                               |                                  |
Skip reposts                    Scrape reactions (parallel)        Insert enriched_profiles
        |                       Scrape comments  (parallel)                |
Insert into linkedin_posts              |                          Loop through post URLs
  (status: PENDING)             Merge + deduplicate engagers               |
                                        |                          Insert post_engagements
                                Pass to Part 3                     Update status -> PROCESSED
```

### Part 1: Scrape Profiles

**File**: `Linkedin Monitoring Part 1 - Scrape Profile.json`
**Schedule**: Every 2 days
**Purpose**: Discover new posts from monitored LinkedIn profiles

**Flow**:

1. **Schedule Trigger** -- fires every 2 days
2. **Get many rows** -- fetches all rows from `linkedin_profiles` where `is_enabled = true`
3. **If** -- confirms profile is enabled
4. **HTTP Request** -- calls **Apify `supreme_coder~linkedin-post`** API
   - `deepScrape: true`, `limitPerSource: 3`, `rawData: false`
   - Input: `profile_url` from the profile row
   - Returns: array of post objects with `url`, `text`, `postedAtTimestamp`, `urn`, `inputUrl`, `post_type`
5. **Loop Over Items1** -- iterates over each scraped post
6. **Get a row** -- checks if `post_url` already exists in `linkedin_posts`
7. **If1** -- if `post_url` is empty or not exists (i.e., new post)
8. **If2** -- filters out `post_type === "repost"` (skips reposts)
9. **Create a row** -- inserts new post into `linkedin_posts`:
   - `post_url`: the post URL
   - `posted_at_timestamp`: parsed ISO timestamp
   - `profile_url`: the monitored profile URL
   - `status`: `"PENDING"`
   - `post_text`: the post content
   - `post_id`: extracted from URN (last segment)
10. **Update a row** -- if insert fails (duplicate key), updates the existing row with fresh data

### Part 2: Scrape Engagers

**File**: `Linkedin Monitoring Part 2(1).json`
**Schedule**: Every hour
**Purpose**: Extract reactions and comments from pending posts

**Flow**:

1. **Schedule Trigger** -- fires every hour
2. **Get many rows** -- fetches all `linkedin_posts` where `status = 'PENDING'`
3. **Loop Over Items1** -- iterates over each pending post
4. **If1** -- time-based filter (OR condition):
   - Post `created_at` is >= 48 hours ago, OR
   - Post `posted_at_timestamp` is <= 500 hours old
   - Posts not matching are skipped (Edit Fields -> loop continues)
5. **Update a row1** -- sets post `status` to `"PROCESSING"`
6. Two parallel HTTP requests:
   - **HTTP Request** -- calls **Apify `harvestapi~linkedin-post-reactions`** with `posts: [post_url]`
   - **HTTP Request1** -- calls **Apify `harvestapi~linkedin-post-comments`** with `posts: [post_url]`
7. **Merge** -- combines reaction and comment results
8. **Code in JavaScript** -- processes merged data:
   - Deduplicates profiles by LinkedIn URL using a Map
   - Extracts contact info: `name`, `headline`, `profileUrl`, `urn`
   - Processes three item types:
     - **Reactors**: items with `reactionType` + `actor.linkedinUrl`
     - **New comments**: items with `commentary` + `actor.linkedinUrl` (also processes nested `replies`)
     - **Old comments**: items with `comments[]` array (legacy format)
   - Adds `parent` (monitored profile URL) and `post_url` to each output item
   - Output: array of `{ parent, post_url, contact: {...}, engagements: [{type, value}] }`
9. Output loops back to **Loop Over Items1** for next post
10. When all posts processed (done branch): calls **Part 3** via `executeWorkflow`

### Part 3: Enrich Profiles & Save Engagements

**File**: `Linkedin Monitoring Part 3(1).json`
**Trigger**: Called by Part 2 (`executeWorkflow`)
**Purpose**: Enrich engager profiles and save engagement records

**Flow** (runs in parallel branches after initial check):

**Branch A: Profile Enrichment**

1. **When Executed by Another Workflow** -- receives engager data from Part 2
2. **Execution Data** -- logs execution metadata
3. **If1** -- checks if `engagements` array exists
4. **Loop Over Items2** -- deduplication loop:
   - **Get a row2** -- checks `enriched_profiles` by `urn` + `parent_profile`
   - **Is Duplicate?** -- if `profile_url` not exists, passes through
5. **Merge** -- combines deduplicated items with pass-through data (keyed on `urn` / `contact.urn`)
6. **If2** -- filter gate (skips specific test profiles)
7. **HTTP Request4** -- calls **Apify `apimaestro~linkedin-profile-detail`** with `username: <urn>`, `includeEmail: true`
   - Returns: `basic_info` (fullname, first_name, last_name, headline, current_company, location, connection_count, follower_count, top_skills, about, urn, public_identifier, profile_url), `experience`, `education`
8. **Output** -- passthrough node for data routing
9. **Get a row** -- checks if `full_name` already exists in `enriched_profiles`
10. **If** -- confirms `profile_url` is empty (new) AND profile URL != parent profile (not self)
11. **Create a row** -- inserts into `enriched_profiles`:
    - All fields from Apify response: `profile_url`, `first_name`, `last_name`, `full_name`, `headline`, `company_name`, `company_linkedin_url`, `location`, `connections`, `followers`, `skills`, `public_identifier`, `urn`, `experience`, `about`, `educations`, `parent_profile`
    - Engagement metadata: `engagement_type`, `engagement_value`

**Branch B: Engagement Records** (runs in parallel with Branch A)

1. **Edit Fields** -- extracts `post_url` from input
2. **Loop Over Items1** -- iterates over post URLs
3. **Get a row1** -- looks up post in `linkedin_posts` by `post_url`
4. **Update a row** -- sets post `status` to `"PROCESSED - 1"`
5. **Loop Over Items3** -- iterates for engagement saving:
   - **Get Engagers** -- looks up `enriched_profiles` by `full_name` + `parent_profile`
   - **Get Posts** -- looks up `linkedin_posts` by `post_url`
   - **Save Engagements** -- inserts into `post_engagements`:
     - `engager_profile_url`: from enriched profile
     - `post_url`: from the post
     - `post_text`: from the post record
     - `monitored_profile_url`: from enriched profile's `parent_profile`
     - `engagement_type`: from engagements array
     - `engaged_at`: from enriched profile's `created_at`
     - `engagement_value`: from engagements array

### Post Status Lifecycle

```
PENDING          ->  PROCESSING       ->  PROCESSED - 1
(Part 1 creates)    (Part 2 picks up)    (Part 3 completes)
```

### External APIs

| API | Used In | Purpose |
|-----|---------|---------|
| Apify `supreme_coder~linkedin-post` | Part 1 | Scrape posts from LinkedIn profiles (deep scrape, 3 per profile) |
| Apify `harvestapi~linkedin-post-reactions` | Part 2 | Extract reactions/likes from a post |
| Apify `harvestapi~linkedin-post-comments` | Part 2 | Extract comments and replies from a post |
| Apify `apimaestro~linkedin-profile-detail` | Part 3 | Full profile enrichment (name, company, skills, experience, education) |
| LeadMagic `profile-search` | Part 3 | Alternative profile enrichment (currently **disabled**) |

### Credentials Referenced

| Credential Name | Type | Used For |
|----------------|------|----------|
| `Apify - Automations@lg` | HTTP Query Auth | All Apify API calls (Parts 1, 2, 3) |
| `LeadGrow Supabase` | Supabase API | All database operations (Parts 1, 2, 3) |
| `Leads on Trees` | HTTP Header Auth | LeadMagic API (Part 3, disabled) |

### n8n Workflow Files

| File | Workflow Name | Schedule | Active |
|------|--------------|----------|--------|
| `Linkedin Monitoring Part 1 - Scrape Profile.json` | Linkedin Monitoring Part 1 - Scrape Profile | Every 2 days | Yes |
| `Linkedin Monitoring Part 2(1).json` | Linkedin Monitoring Part 2 | Every hour | Yes |
| `Linkedin Monitoring Part 3(1).json` | Linkedin Monitoring Part 3 | Called by Part 2 | Yes |

---

## Application Architecture

### Entry Point Chain

```
index.html
  -> src/main.tsx (ReactDOM.createRoot)
    -> src/App.tsx
      -> QueryClientProvider (React Query)
        -> ThemeProvider (dark/light mode context)
          -> BrowserRouter
            -> Routes
              -> Layout (sidebar + header + Outlet)
                -> Page components
```

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Don't refetch on tab focus
      retry: 1,                      // One retry on failure
      staleTime: 30000,              // Data considered fresh for 30 seconds
    },
  },
})
```

---

## Routing & Navigation

All routes are nested under the `Layout` component which provides the sidebar and header.

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to `/dashboard` |
| `/dashboard` | `Dashboard` | Main analytics overview with metrics, engager table, filters |
| `/profiles` | `Profiles` | Manage monitored LinkedIn profiles and categories |
| `/posts` | `Posts` | View all posts with sync status tracking |
| `/keyword-search` | `KeywordSearch` | Full-text search for engagers by post content |
| `/profiles/:profileUrl/posts` | `PostPerformance` | Per-profile engagement analysis |
| `/engagers/:profileUrl` | `EngagerDetail` | Full engager profile (experience, skills, education) |
| `/settings` | `Settings` | Application settings |

Note: `:profileUrl` is a URL-encoded LinkedIn profile URL used as a route parameter.

---

## Data Layer

### Hook-Per-Domain Pattern

Each domain concern has its own hook file. All hooks use React Query's `useQuery` for data fetching.

| Hook File | Exports | Domain |
|-----------|---------|--------|
| `useDashboard.ts` | `useDashboardMetrics`, `useEngagersTracked` | Dashboard metrics, engager list |
| `useAnalytics.ts` | `useIndustryDistribution`, `useCompanySizeDistribution`, `useLocationDistribution`, `useSkillsDistribution`, `useEngagementTrends`, `useEngagementPatterns`, `useTopTitles` | Analytics charts |
| `useProfiles.ts` | Profile CRUD operations | Profile management |
| `usePosts.ts` | Post listing and status updates | Post tracking |
| `useKeywordSearch.ts` | `useKeywordSearch`, `useKeywordSearchEngagers`, `useKeywordSearchPosts` | Keyword search |
| `usePostPerformance.ts` | Per-profile engagement metrics | Post performance |
| `useRealtime.ts` | `useRealtimeProfiles`, `useRealtimePosts`, `useRealtimeEngagers`, `useRealtimeAll` | Real-time subscriptions |
| `useFilterOptions.ts` | Dynamic filter option loading | Filter dropdowns |
| `useCategories.ts` | Category CRUD | Profile categories |

### Supabase Client Configuration

```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'linkedin' },
  realtime: { params: { eventsPerSecond: 10 } }
})
```

All table queries use the `linkedin` schema. Table names in code omit the schema prefix (e.g., `supabase.from('enriched_profiles')` resolves to `linkedin.enriched_profiles`).

### Query Key Conventions

React Query cache keys follow this pattern:
- `['dashboard-metrics', timeRange]`
- `['engagers-tracked', timeRange]`
- `['industry-distribution', timeRange]`
- `['profiles']`
- `['profile-stats']`
- `['keywordSearch', keyword]`
- `['keywordSearchEngagers', keyword]`

---

## Database Schema

Schema name: `linkedin` (accessed via `linkedinengagements` in some Supabase contexts).

### Entity Relationship Diagram

```
linkedin_profiles (monitored profiles)
    |
    +-- 1:N --> linkedin_posts (profile_url FK)
    |               |
    |               +-- 1:N --> post_engagements (post_url FK)
    |                               |
    +-- 1:N --> enriched_profiles (parent_profile FK)
    |               |
    |               +-- 1:N --> post_engagements (engager_profile_url FK)
    |
    +-- N:1 --> categories (category TEXT matches name)

```

### Table: `linkedin_profiles`

Monitored LinkedIn profiles that the system tracks for engagement.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment ID |
| `profile_url` | TEXT | UNIQUE | LinkedIn profile URL |
| `Webhook` | TEXT | nullable | Legacy single webhook URL (backward compat) |
| `webhooks` | JSONB | nullable | Array of webhook URLs for n8n |
| `is_enabled` | BOOLEAN | nullable | Whether monitoring is active |
| `description` | TEXT | nullable | Notes about profile content themes |
| `category` | TEXT | nullable | Category name (soft FK to categories.name) |
| `created_at` | TIMESTAMPTZ | default NOW() | Creation timestamp |

### Table: `linkedin_posts`

Posts from monitored profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment ID |
| `post_url` | TEXT | UNIQUE | LinkedIn post URL |
| `post_text` | TEXT | nullable | Post content text |
| `profile_url` | TEXT | nullable, FK | URL of the monitored profile |
| `posted_at_timestamp` | TIMESTAMPTZ | nullable | When the post was published |
| `status` | TEXT | nullable | Sync status: `PENDING`, `PROCESSING`, `COMPLETED` |
| `created_at` | TIMESTAMPTZ | default NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | nullable | Last update timestamp |

### Table: `enriched_profiles`

Engagers with enriched profile data from LinkedIn API.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `profile_url` | TEXT | PRIMARY KEY | Engager's LinkedIn URL |
| `parent_profile` | TEXT | nullable, FK | Which monitored profile they engaged with |
| `full_name` | TEXT | nullable | Full display name |
| `first_name` | TEXT | nullable | First name |
| `last_name` | TEXT | nullable | Last name |
| `headline` | TEXT | nullable | LinkedIn headline (job title) |
| `company_name` | TEXT | nullable | Current company |
| `company_linkedin_url` | TEXT | nullable | Company LinkedIn page |
| `company_website` | TEXT | nullable | Company website |
| `company_industry` | TEXT | nullable | Industry classification |
| `company_size` | TEXT | nullable | Company employee range |
| `location` | TEXT | nullable | Geographic location |
| `connections` | INTEGER | nullable | Connection count |
| `followers` | INTEGER | nullable | Follower count |
| `skills` | JSONB | nullable | Array of skills |
| `experiences` | JSONB | nullable | Work history array |
| `educations` | JSONB | nullable | Education history |
| `about` | TEXT | nullable | Bio/summary |
| `experience` | JSONB | nullable | Alternative experience field |
| `updates` | JSONB | nullable | LinkedIn activity updates |
| `languages` | JSONB | nullable | Languages spoken |
| `licenseAndCertificates` | JSONB | nullable | Certifications |
| `honorsAndAwards` | JSONB | nullable | Awards |
| `volunteerAndAwards` | JSONB | nullable | Volunteer experience |
| `organizations` | JSONB | nullable | Organization memberships |
| `urn` | TEXT | nullable | LinkedIn URN identifier |
| `public_identifier` | TEXT | nullable | Public profile slug |
| `totalTenureMonths` | TEXT | nullable | Total career tenure |
| `totalTenureDays` | TEXT | nullable | Total career tenure in days |
| `raw_data` | JSONB | nullable | Full API response |
| `created_at` | TIMESTAMPTZ | default NOW() | First seen |
| `last_enriched_at` | TIMESTAMPTZ | nullable | Last enrichment date |

### Table: `post_engagements`

Junction table linking engagers to specific posts. Denormalized `post_text` for fast keyword search.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment ID |
| `engager_profile_url` | TEXT | NOT NULL | Engager's LinkedIn URL |
| `post_url` | TEXT | NOT NULL | Post they engaged with |
| `post_text` | TEXT | nullable | Denormalized post content |
| `monitored_profile_url` | TEXT | NOT NULL | Which monitored profile owns the post |
| `engagement_type` | TEXT | default 'like' | Type: like, comment, share |
| `engaged_at` | TIMESTAMPTZ | nullable | When engagement occurred |
| `created_at` | TIMESTAMPTZ | default NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | default NOW() | Last update (auto-trigger) |

**Constraints**: UNIQUE on `(engager_profile_url, post_url)`

**Indexes**:
- `idx_post_engagements_engager` on `engager_profile_url`
- `idx_post_engagements_post` on `post_url`
- `idx_post_engagements_monitored` on `monitored_profile_url`
- `idx_post_engagements_engaged_at` on `engaged_at DESC`
- `idx_post_engagements_post_text_fts` GIN index on `to_tsvector('english', COALESCE(post_text, ''))` -- Full-text search

### Table: `categories`

Profile organization categories with custom colors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-increment ID |
| `name` | TEXT | NOT NULL, UNIQUE | Category name |
| `color` | TEXT | NOT NULL, default `#3b82f6` | Hex color code |
| `created_at` | TIMESTAMPTZ | default NOW() | Creation timestamp |

### Stored Functions (RPC)

#### `search_engagers_by_keyword(search_keyword TEXT)`

Returns individual engagement records matching the keyword via `ILIKE` on `post_text`, joined with `enriched_profiles` for engager details. Returns: `engager_profile_url`, `engager_name`, `engager_headline`, `engager_company`, `engager_location`, `engager_connections`, `engager_followers`, `post_url`, `post_text`, `monitored_profile_url`, `engaged_at`, `engagement_count` (window function).

#### `search_engagers_by_keyword_grouped(search_keyword TEXT)`

Same data but grouped by person. Returns: `engager_profile_url`, `engager_name`, `engager_headline`, `engager_company`, `engager_location`, `engager_connections`, `engager_followers`, `engagement_count` (distinct posts), `latest_engagement`, `post_urls` (aggregated array).

### Migrations

Located in `migrations/` directory. Run manually via Supabase SQL Editor.

| File | Description |
|------|-------------|
| `001_add_profile_fields.sql` | Adds `webhooks` JSONB, `description`, `category` to `linkedin_profiles`. Migrates legacy `Webhook` data. |
| `002_add_post_text.sql` | Adds `post_text` column to `linkedin_posts`. |
| `003_create_categories_table.sql` | Creates `categories` table. Seeds from existing profile categories. |
| `004_create_post_engagements.sql` | Creates `post_engagements` table with GIN FTS index. Creates both RPC search functions and the `updated_at` trigger. |

---

## Real-time System

Supabase Realtime listens for PostgreSQL changes and invalidates React Query caches.

### Channels

| Channel Name | Schema | Table | On Change |
|-------------|--------|-------|-----------|
| `linkedin_profiles_changes` | `linkedinengagements` | `linkedin_profiles` | Invalidates: `profiles`, `profile-stats`, `dashboard-metrics`, `engagers-tracked` |
| `linkedin_posts_changes` | `linkedinengagements` | `linkedin_posts` | Invalidates: `dashboard-metrics`, `profile-stats` |
| `enriched_profiles_changes` | `linkedinengagements` | `enriched_profiles` | Invalidates: `dashboard-metrics`, `engagers-tracked`, `profile-stats` |

All channels listen for `event: '*'` (INSERT, UPDATE, DELETE). Rate limited to 10 events/second via Supabase client config.

### Usage

The `useRealtimeAll()` hook activates all three subscriptions. Typically called from top-level page components.

---

## Component Architecture

### Layout Structure

```
Layout (src/components/layout/Layout.tsx)
  +-- SidebarProvider + AppSidebar (collapsible navigation)
  +-- SidebarInset
      +-- Header (theme toggle, page title)
      +-- Outlet (renders active page)
```

### Component Categories

**Pages** (`src/pages/`): Route-level components that compose hooks and sub-components. Default-exported.

**Dashboard Components** (`src/components/dashboard/`):
- `MetricsCard`: Displays a single metric with icon, value, and label
- `LeadsTable`: Sortable, filterable table of engagers with lead scores
- `EngagerFilters`: Advanced filter panel (industry, location, company size, headline, parent profile, lead score range)

**Profile Components** (`src/components/profiles/`):
- `ProfileCard`: Profile summary with stats, webhook management, enable/disable toggle
- `AddProfileModal`: Form for adding new profiles (URL, webhooks, description, category)
- `ManageCategoriesModal`: CRUD UI for categories with color pickers

**UI Primitives** (`src/components/ui/`):
- shadcn/ui components: `button`, `card`, `badge`, `dialog`, `input`, `label`, `switch`, `table`, `tabs`, `chart`, `sidebar`, `separator`, `tooltip`
- These are owned by the project (copy-paste pattern) and can be edited directly

---

## State Management

### Server State (React Query)

All Supabase data is managed via React Query. Each hook returns `{ data, isLoading, error, refetch }`.

Query keys are structured arrays for granular cache invalidation:
```typescript
['dashboard-metrics', timeRange]  // Invalidated when profiles/posts/engagers change
['engagers-tracked', timeRange]   // Invalidated when profiles/engagers change
['industry-distribution', timeRange]
```

### Client State

- **Theme**: React Context (`ThemeContext`) with `useTheme()` hook. Persisted via class-based Tailwind dark mode.
- **Filters**: Local `useState` within page components. Not persisted.
- **Modals**: Local `useState` (open/close state).
- **Time Range**: Local `useState` passed to hooks as parameter.

---

## Styling System

### Tailwind Configuration

- **Dark mode**: Class-based (`darkMode: ['class']`)
- **Content sources**: `index.html` + `src/**/*.{js,ts,jsx,tsx}`
- **Custom colors**:
  - `primary` (blue scale, 50-950): Main accent color
  - `navy` (slate scale, 50-950): Text, backgrounds
  - `sidebar`: CSS custom property-based colors for the sidebar component

### CSS Custom Properties

Defined in `src/index.css` for theming. Used by shadcn/ui sidebar component:
- `--sidebar-background`, `--sidebar-foreground`
- `--sidebar-primary`, `--sidebar-primary-foreground`
- `--sidebar-accent`, `--sidebar-accent-foreground`
- `--sidebar-border`, `--sidebar-ring`
- `--radius` for border radius

### Utility: `cn()`

```typescript
import { cn } from '@/lib/utils'
// Merges Tailwind classes with deduplication
cn('px-4 py-2', isActive && 'bg-blue-500', className)
```

---

## Lead Scoring Algorithm

Computed entirely on the client side within `useDashboard.ts`. Each engager gets a score from 0-100 based on four equally-weighted factors:

### Scoring Factors (25% each)

**Connections** (25%):
- 500+: 25 points
- 200-499: 20 points
- 100-199: 15 points
- 50-99: 10 points
- <50: 5 points

**Followers** (25%):
- 10,000+: 25 points
- 5,000-9,999: 20 points
- 1,000-4,999: 15 points
- 500-999: 10 points
- <500: 5 points

**Company Size** (25%):
- 10,001+: 25 points
- 5,001-10,000: 22 points
- 1,001-5,000: 20 points
- 501-1,000: 17 points
- 201-500: 15 points
- 51-200: 12 points
- 11-50: 8 points
- 1-10: 5 points

**Seniority** (25%):
- C-level / Founder / Owner: 25 points
- VP / Vice President: 22 points
- Director: 20 points
- Manager / Head of: 15 points
- Senior / Lead / Principal: 12 points
- Other: 5 points

### Lead Categories

| Category | Score Range | Priority |
|----------|-----------|----------|
| Hot Lead | 70-100 | High priority |
| Warm Lead | 40-69 | Good potential |
| Cold Lead | 0-39 | Lower priority |

---

## Keyword Search System

Allows users to find engagers who interacted with posts containing specific keywords.

### Architecture

1. **Data**: `post_engagements` table stores denormalized `post_text` alongside each engagement record
2. **Index**: GIN full-text search index on `to_tsvector('english', COALESCE(post_text, ''))` enables fast lookups
3. **Functions**: Two PostgreSQL RPC functions provide search (detailed and grouped)
4. **Client**: `useKeywordSearch` hooks call RPC functions via `supabase.rpc()`
5. **UI**: `KeywordSearch` page provides search input, results table, and grouped view

### Search Flow

```
User types keyword (min 2 chars)
  -> React Query fires on keyword change (debounced via staleTime)
    -> supabase.rpc('search_engagers_by_keyword', { search_keyword })
      -> PostgreSQL ILIKE search on post_engagements.post_text
        -> LEFT JOIN enriched_profiles for engager details
          -> Results returned with engagement_count (window function)
```

---

## Analytics Engine

All analytics are computed client-side by fetching raw data from Supabase and aggregating in JavaScript. Each analytics hook (`useAnalytics.ts`) follows the pattern:

1. Query `enriched_profiles` with time range filter
2. Aggregate data using `Map<string, number>` counters
3. Sort by count descending
4. Slice to top N results

### Available Analytics

| Analytics | Source Table | Grouping | Limit |
|-----------|-------------|----------|-------|
| Industry Distribution | `enriched_profiles.company_industry` | By industry name | All |
| Company Size Distribution | `enriched_profiles.company_size` | By size range | All |
| Location Distribution | `enriched_profiles.location` | By location string | Top 10 |
| Skills Distribution | `enriched_profiles.skills` (JSONB array) | By skill name | Top 50 |
| Engagement Trends | `enriched_profiles.created_at` | By date (YYYY-MM-DD) | All within range |
| Engagement Patterns | `enriched_profiles.created_at` | By day-of-week x hour (0-23) | All |
| Top Titles | `enriched_profiles.headline` via `post_engagements` | By headline text | Top 10 |

---

## Configuration

### Environment Variables (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Only the **anon key** is used. Never include the service role key in the client.

### Vite (`vite.config.ts`)

- React plugin enabled
- Path alias: `@` -> `./src`
- Dev server: `0.0.0.0:5173`
- Preview server: `0.0.0.0:4173`

### TypeScript (`tsconfig.json`)

- Target: ES2020
- Strict mode: enabled
- JSX: `react-jsx`
- Path mapping: `@/*` -> `./src/*`
- Unused vars/params: error

### Tailwind (`tailwind.config.js`)

- Dark mode: class-based
- Content: `index.html` + `src/**/*.{js,ts,jsx,tsx}`
- Custom colors: `primary` (blue), `navy` (slate), `sidebar` (CSS vars)
- Custom border radius via `--radius` CSS variable

### shadcn/ui (`components.json`)

Registry configuration for shadcn/ui component generation. Components placed in `src/components/ui/`.

---

## Build & Deployment

### Scripts

```bash
npm run dev       # vite -- HMR dev server at localhost:5173
npm run build     # tsc && vite build -- type-check then bundle to dist/
npm run preview   # vite preview -- serve dist at localhost:4173
npm run serve     # serve dist -s -l ${PORT:-4173} -- production SPA server
```

### Production Build

1. TypeScript compiler runs type checking (`tsc`)
2. Vite bundles the application with:
   - Code splitting
   - Tree shaking
   - CSS purging (Tailwind)
   - Minification
3. Output: `dist/` directory with static files

### Railway Deployment

**`railway.toml`**:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run serve"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**`nixpacks.toml`**:
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run serve"
```

### Deployment Flow

1. Push to GitHub
2. Railway detects changes and triggers build
3. Nixpacks installs Node 20, runs `npm ci`, runs `npm run build`
4. `serve` serves the `dist/` folder with SPA fallback (`-s` flag)
5. All routes serve `index.html` for client-side routing

---

## Security

### Current Implementation

- Environment variables for Supabase credentials (`.env` in `.gitignore`)
- Anon key only in client (no service role key)
- No hardcoded secrets in source code
- HTTPS enforced by Railway

### Recommended Improvements

- Enable Supabase Row Level Security (RLS) on all tables
- Add user authentication (currently open access with anon key)
- Implement rate limiting on Supabase queries
- Add CSP headers for production deployment

---

## External Integrations

### Supabase

- **PostgreSQL**: Primary data store with `linkedin` schema
- **Realtime**: WebSocket subscriptions for live data updates
- **RPC Functions**: Server-side keyword search functions

### n8n Workflows

Exported as JSON files in the project root. See [n8n Workflow Pipeline](#n8n-workflow-pipeline) for detailed documentation. The three workflows form a data ingestion pipeline:
1. **Part 1** (every 2 days): Scrapes posts from enabled profiles via Apify
2. **Part 2** (every hour): Extracts reactions and comments from pending posts via Apify
3. **Part 3** (called by Part 2): Enriches engager profiles via Apify and saves to Supabase

### Apify

LinkedIn data extraction platform. Four actors are used:
- `supreme_coder~linkedin-post`: Post scraping
- `harvestapi~linkedin-post-reactions`: Reaction extraction
- `harvestapi~linkedin-post-comments`: Comment extraction
- `apimaestro~linkedin-profile-detail`: Profile enrichment

### Railway

Cloud deployment platform. Auto-deploys from GitHub with Nixpacks build system.

---

## File Reference

### Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/App.tsx` | ~47 | Root component: providers, router, routes |
| `src/main.tsx` | ~8 | ReactDOM entry point |
| `src/index.css` | ~100+ | Global styles, CSS custom properties, Tailwind directives |
| `src/lib/supabase.ts` | ~19 | Supabase client initialization |
| `src/lib/utils.ts` | ~73 | cn(), formatNumber(), formatDate(), formatRelativeTime(), parseLinkedInUsername() |
| `src/types/database.ts` | ~238 | Supabase-generated TypeScript types for all tables |
| `src/contexts/ThemeContext.tsx` | ~50 | Light/dark mode React context |
| `src/hooks/useDashboard.ts` | ~131 | Dashboard metrics and engager list |
| `src/hooks/useAnalytics.ts` | ~336 | Seven analytics hooks |
| `src/hooks/useKeywordSearch.ts` | ~117 | Three keyword search hooks |
| `src/hooks/useRealtime.ts` | ~91 | Real-time subscription management |
| `src/hooks/useProfiles.ts` | ~100+ | Profile CRUD |
| `src/hooks/usePosts.ts` | ~80+ | Post listing |
| `src/hooks/usePostPerformance.ts` | ~150+ | Per-profile analytics |
| `src/hooks/useFilterOptions.ts` | ~60+ | Dynamic filter options |
| `src/hooks/useCategories.ts` | ~80+ | Category CRUD |

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `tsconfig.json` | TypeScript compiler options |
| `tsconfig.node.json` | TypeScript config for Node.js tooling |
| `vite.config.ts` | Vite bundler configuration |
| `tailwind.config.js` | Tailwind CSS theme and plugins |
| `postcss.config.js` | PostCSS plugins (Tailwind, Autoprefixer) |
| `components.json` | shadcn/ui component registry |
| `railway.toml` | Railway deployment config |
| `nixpacks.toml` | Nixpacks build config |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore rules |

### Migration Files

| File | Purpose |
|------|---------|
| `migrations/001_add_profile_fields.sql` | Webhooks, description, category columns |
| `migrations/002_add_post_text.sql` | Post text column |
| `migrations/003_create_categories_table.sql` | Categories table |
| `migrations/004_create_post_engagements.sql` | Post engagements table, FTS index, RPC functions |

### n8n Workflow Files

| File | Purpose |
|------|---------|
| `Linkedin Monitoring Part 1 - Scrape Profile.json` | Post scraping workflow (every 2 days) |
| `Linkedin Monitoring Part 2(1).json` | Engager extraction workflow (every hour) |
| `Linkedin Monitoring Part 3(1).json` | Profile enrichment + engagement saving (called by Part 2) |
