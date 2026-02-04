---
name: linkedin-dashboard-api
description: Interact with the LinkedIn Engagement Dashboard API to add profiles, trigger scraping, retrieve engagers with lead scoring, and export data. Use when user asks to add a LinkedIn profile, trigger scraping, get engagers, or export CSV.
---

# LinkedIn Engagement Dashboard API Skill

Manage the local LinkedIn Engagement Dashboard via its REST API at `http://localhost:3001`.

## Auth

All endpoints (except health) require the `x-api-key` header. Read the key from `.env` (`API_KEYS` variable).

## Available Actions

### Add a profile to monitor
```bash
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"profile_url": "https://www.linkedin.com/in/username", "is_enabled": true}'
```

### List monitored profiles
```bash
curl http://localhost:3001/api/profiles -H "x-api-key: $API_KEY"
```

### Trigger post scraping (Part 1)
```bash
curl -X POST http://localhost:3001/api/scrape/posts -H "x-api-key: $API_KEY"
```

### Trigger engager scraping + enrichment (Part 2+3)
```bash
curl -X POST http://localhost:3001/api/scrape/engagers -H "x-api-key: $API_KEY"
```

### Get engagers with lead scoring
```bash
curl "http://localhost:3001/api/engagers?parent_profile=https://www.linkedin.com/in/username&webhook=https://your-webhook.com" \
  -H "x-api-key: $API_KEY"
```

### Search engagers by keyword
```bash
curl "http://localhost:3001/api/search?keyword=AI&grouped=true" -H "x-api-key: $API_KEY"
```

### Export engagers as CSV
```bash
curl "http://localhost:3001/api/export/engagers?parent_profile=https://www.linkedin.com/in/username" \
  -H "x-api-key: $API_KEY" -o engagers.csv
```

### Run scraping scripts directly
```bash
cd scripts && node run-all.js     # Full pipeline
cd scripts && node scrape-posts.js     # Posts only
cd scripts && node scrape-engagers.js  # Engagers only
```

## Workflow

1. Add profiles to monitor via `POST /api/profiles`
2. Trigger `POST /api/scrape/posts` to fetch recent posts
3. Trigger `POST /api/scrape/engagers` to extract and enrich engager profiles
4. View results in the dashboard at `http://localhost:5173`
5. Export data via `GET /api/export/engagers`
