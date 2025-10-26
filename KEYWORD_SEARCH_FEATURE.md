# 🔍 Keyword Search Feature - Implementation Guide

**Date**: October 26, 2025  
**Status**: ✅ Ready for Data Population

---

## 📋 Overview

The **Keyword Search** feature allows users to search for keywords (e.g., "AI SDR", "SaaS growth") and discover all the people who have engaged with posts containing those keywords. This is a unique feature that provides competitive advantage as mentioned: *"other tools with this feature cannot automate it."*

---

## 🗄️ Database Structure

### New Table: `post_engagements`

This table links **engagers** to **specific posts** they engaged with, enabling keyword-based discovery.

#### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `engager_profile_url` | TEXT | The person who engaged (FK to `enriched_profiles`) |
| `post_url` | TEXT | The post they engaged with (FK to `linkedin_posts`) |
| `post_text` | TEXT | Cached post text for fast keyword search |
| `monitored_profile_url` | TEXT | Profile who created the post (FK to `linkedin_profiles`) |
| `engagement_type` | TEXT | Type: 'like', 'comment', 'share' (default: 'like') |
| `engaged_at` | TIMESTAMP | When the engagement occurred |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### Indexes

- **Primary index**: On `engager_profile_url`, `post_url`, `monitored_profile_url`
- **Unique constraint**: `(engager_profile_url, post_url)` - prevents duplicates
- **Full-text search index**: PostgreSQL `gin` index on `post_text` for fast keyword searches
- **Foreign keys**: Links to `enriched_profiles`, `linkedin_posts`, `linkedin_profiles`

#### Migration File

📁 `migrations/004_create_post_engagements.sql`

---

## 🚀 Setup Instructions

### 1. Apply Database Migration

Run the migration in your Supabase SQL Editor or via psql:

```bash
psql $DATABASE_URL -f migrations/004_create_post_engagements.sql
```

Or in **Supabase Dashboard**:
1. Go to SQL Editor
2. Copy contents of `migrations/004_create_post_engagements.sql`
3. Click "Run"

### 2. Verify Table Creation

```sql
-- Check table exists
SELECT * FROM linkedinengagements.post_engagements LIMIT 1;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'post_engagements' 
  AND schemaname = 'linkedinengagements';
```

You should see:
- ✅ Table `post_engagements` exists
- ✅ Full-text search index `idx_post_engagements_post_text_fts`
- ✅ 4 additional indexes for fast queries

---

## 📊 Data Population

### What Data to Insert

For each **engagement** (like/comment) on a post, insert a row with:

```sql
INSERT INTO linkedinengagements.post_engagements (
    engager_profile_url,
    post_url,
    post_text,
    monitored_profile_url,
    engagement_type,
    engaged_at
) VALUES (
    'https://www.linkedin.com/in/engager-username',  -- Person who liked/commented
    'https://www.linkedin.com/posts/author_post-id', -- Post they engaged with
    'Full text content of the post...',               -- Post text (for keyword search)
    'https://www.linkedin.com/in/monitored-username', -- Monitored profile who created post
    'like',                                            -- or 'comment', 'share'
    '2025-10-26 14:30:00+00'                          -- When they engaged
);
```

### Data Source

The data comes from your **n8n workflow** that:
1. Monitors posts from LinkedIn profiles
2. Extracts engagers (likes, comments)
3. Gets post text content
4. Stores in `post_engagements` table

### Important Notes

⚠️ **Post Text is Critical**: The `post_text` field MUST be populated with the full post content for keyword search to work.

✅ **Avoid Duplicates**: The unique constraint on `(engager_profile_url, post_url)` ensures each person is only counted once per post.

✅ **Engager Must Exist**: The engager's profile should exist in `enriched_profiles` table (foreign key constraint).

### Example Data Flow

```
LinkedIn Post:
  Author: https://www.linkedin.com/in/john-doe
  Post URL: https://www.linkedin.com/posts/john-doe_ai-sdr-12345
  Post Text: "Just launched our new AI SDR tool! 🚀 Game-changing for sales teams..."
  
  Engagers:
    - Alice (liked)
    - Bob (commented)
    - Carol (liked)

Insert 3 rows into post_engagements:
  1. Alice + Post URL + Post Text + john-doe profile
  2. Bob + Post URL + Post Text + john-doe profile  
  3. Carol + Post URL + Post Text + john-doe profile

Now searching "AI SDR" will return Alice, Bob, and Carol!
```

---

## 🎨 User Interface

### Page: Keyword Search

**Location**: Navigation sidebar → "Keyword Search" or `/keyword-search`

### Features

#### 1. Search Bar
- Large, prominent search input
- Placeholder: "Search by keyword (e.g., 'AI SDR', 'Sales Automation', 'SaaS')"
- Minimum 2 characters to search
- Real-time validation

#### 2. Stats Overview (after search)
Three metric cards:
- **Matching Posts**: Number of posts containing the keyword
- **Unique Engagers**: Number of unique people who engaged
- **Total Engagements**: Sum of all engagements with matching posts

#### 3. Engagers List
Shows people who engaged with posts containing the keyword:

**For each engager**:
- Avatar with first initial
- Full name
- Headline (job title)
- Company name
- Location
- Connections count
- Followers count
- **Engagement badge**: "3x engaged" if they engaged with multiple matching posts
- Last engagement date
- Click to view full profile

**Sorting**: 
- By engagement count (highest first)
- Then by most recent engagement

#### 4. Matching Posts
Shows all posts containing the keyword:

**For each post**:
- Post text (truncated to 3 lines)
- Date posted
- "View on LinkedIn" link
- Who created the post (monitored profile)

#### 5. Empty State
When no search has been performed:
- Search icon illustration
- Example searches:
  - "AI SDR" - Find people interested in AI sales tools
  - "SaaS growth" - Discover growth-focused professionals
  - "Product-led" - Identify PLG advocates
  - "Fundraising" - Connect with startup founders

---

## 🔧 Technical Implementation

### SQL Functions

Two PostgreSQL functions power the search:

#### 1. `search_engagers_by_keyword(search_keyword TEXT)`
Returns all engagements with post details.

**Returns**:
- Engager profile data
- Post URL and text
- Engagement timestamp
- Count of total engagements by that person

**Use case**: Detailed view of all engagements

#### 2. `search_engagers_by_keyword_grouped(search_keyword TEXT)`
Returns unique engagers with aggregated data.

**Returns**:
- Engager profile data
- Total engagement count with matching posts
- Latest engagement date
- Array of all post URLs they engaged with

**Use case**: Main engagers list (shows each person once)

### React Hooks

📁 `src/hooks/useKeywordSearch.ts`

**Three hooks available**:

```typescript
// Get all engagements (with duplicates per post)
useKeywordSearch(keyword: string, enabled: boolean)

// Get unique engagers (grouped by person) - MAIN HOOK
useKeywordSearchEngagers(keyword: string)

// Get unique posts matching keyword
useKeywordSearchPosts(keyword: string)
```

### Performance Optimizations

✅ **Full-text search index**: PostgreSQL `gin` index for instant keyword matching  
✅ **Denormalized post_text**: No joins needed for search  
✅ **Indexed foreign keys**: Fast lookups for engager details  
✅ **React Query caching**: 30-second stale time reduces API calls  

---

## 🎯 Use Cases

### 1. Find Topic-Specific Prospects

**Example**: Sales team wants to find prospects interested in "AI automation"

1. Search "AI automation"
2. See 47 unique people who engaged with posts about AI automation
3. Filter by company size or seniority (future enhancement)
4. Export to CRM or outreach tool

### 2. Identify Content Themes

**Example**: Content creator wants to know what topics resonate

1. Search different keywords: "SaaS", "PLG", "Growth hacking"
2. Compare engagement counts
3. Focus content strategy on high-engagement topics

### 3. Competitive Intelligence

**Example**: See who engages with competitor content

1. Monitor competitor's profile
2. Search keywords related to their products
3. Identify prospects engaging with competitors
4. Reach out with better alternative

### 4. Event-Based Outreach

**Example**: Conference announcement posts

1. Search "SaaStr 2025" or "Web Summit"
2. Find people interested in attending
3. Schedule meetings at the event

---

## 🔄 Webhook Integration (Future Enhancement)

As mentioned by the client: *"If your system could 'webhook this search out,' it would be 'so beneficial.'"*

### Proposed Feature: Automated Keyword Alerts

**Concept**: User sets up a keyword with a webhook URL. Whenever someone NEW engages with a post containing that keyword, send their profile data to the webhook.

**Implementation** (for future):

1. Create `keyword_alerts` table:
```sql
CREATE TABLE keyword_alerts (
    id SERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP
);
```

2. PostgreSQL trigger on `post_engagements` INSERT:
```sql
CREATE TRIGGER new_engagement_alert
AFTER INSERT ON post_engagements
FOR EACH ROW
EXECUTE FUNCTION check_keyword_alerts();
```

3. Function checks if post_text matches any active keyword alerts
4. If match, send HTTP POST to webhook_url with engager data

**Benefits**:
- Real-time lead notifications
- Automated CRM updates
- Instant sales alerts
- No manual checking needed

---

## 📈 Future Enhancements

### Phase 1 (Current)
- ✅ Basic keyword search
- ✅ View engagers and posts
- ✅ Full-text search with PostgreSQL

### Phase 2 (Near-term)
- [ ] Save favorite searches
- [ ] Search history
- [ ] Export results to CSV
- [ ] Advanced filters (company size, location, etc.)
- [ ] Sort options (by connections, engagement count, etc.)

### Phase 3 (Long-term)
- [ ] Webhook automation for keyword alerts
- [ ] Boolean search operators (AND, OR, NOT)
- [ ] Regex pattern matching
- [ ] Multi-keyword search (combine multiple terms)
- [ ] Sentiment analysis on engagement type
- [ ] Trending keywords dashboard

---

## 🧪 Testing the Feature

### Test Data

Insert sample data to test:

```sql
-- Sample engagements
INSERT INTO linkedinengagements.post_engagements (
    engager_profile_url,
    post_url,
    post_text,
    monitored_profile_url,
    engagement_type,
    engaged_at
) VALUES 
(
    'https://www.linkedin.com/in/test-user-1',
    'https://www.linkedin.com/posts/author_post-1',
    'Excited to announce our new AI SDR platform! Sales teams love the automation features.',
    'https://www.linkedin.com/in/monitored-profile',
    'like',
    NOW()
),
(
    'https://www.linkedin.com/in/test-user-2',
    'https://www.linkedin.com/posts/author_post-1',
    'Excited to announce our new AI SDR platform! Sales teams love the automation features.',
    'https://www.linkedin.com/in/monitored-profile',
    'comment',
    NOW()
);
```

### Test Steps

1. ✅ Navigate to "Keyword Search" in sidebar
2. ✅ Enter "AI SDR" in search box
3. ✅ Click "Search" button
4. ✅ Verify 2 engagers appear (test-user-1 and test-user-2)
5. ✅ Verify 1 matching post appears
6. ✅ Click engager name → redirects to detail page
7. ✅ Click "View on LinkedIn" → opens LinkedIn post
8. ✅ Try different keyword → different results
9. ✅ Try keyword with no results → shows empty state

---

## 🐛 Troubleshooting

### No Results Found

**Problem**: Searching returns 0 results even though data exists

**Solutions**:
1. Check `post_text` field is populated (not NULL):
   ```sql
   SELECT COUNT(*) FROM linkedinengagements.post_engagements WHERE post_text IS NULL;
   ```
2. Verify full-text search index exists:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'post_engagements';
   ```
3. Try case-insensitive search:
   ```sql
   SELECT * FROM linkedinengagements.post_engagements 
   WHERE post_text ILIKE '%keyword%';
   ```

### Slow Search Performance

**Problem**: Search takes > 2 seconds

**Solutions**:
1. Analyze query performance:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM linkedinengagements.search_engagers_by_keyword_grouped('AI SDR');
   ```
2. Rebuild full-text index:
   ```sql
   REINDEX INDEX linkedinengagements.idx_post_engagements_post_text_fts;
   ```
3. Run VACUUM ANALYZE:
   ```sql
   VACUUM ANALYZE linkedinengagements.post_engagements;
   ```

### Duplicate Engagers

**Problem**: Same person appears multiple times for one post

**Solution**: The unique constraint should prevent this, but if it happens:
```sql
-- Find duplicates
SELECT engager_profile_url, post_url, COUNT(*) 
FROM linkedinengagements.post_engagements
GROUP BY engager_profile_url, post_url
HAVING COUNT(*) > 1;

-- Remove duplicates (keep most recent)
DELETE FROM linkedinengagements.post_engagements a
USING linkedinengagements.post_engagements b
WHERE a.id < b.id 
  AND a.engager_profile_url = b.engager_profile_url
  AND a.post_url = b.post_url;
```

---

## 📞 Summary

### ✅ What's Implemented

1. **Database Table**: `post_engagements` with full-text search index
2. **SQL Functions**: Two optimized functions for keyword queries
3. **React Hooks**: Three hooks for different data needs
4. **UI Page**: Full keyword search interface with results
5. **Navigation**: Added to sidebar menu
6. **TypeScript Types**: Full type safety for all data

### 🔄 Your Responsibility (Data Population)

You need to update your **n8n workflow** to populate `post_engagements`:

**When an engager is found**:
```javascript
// For each engager on a post
{
  "engager_profile_url": "{{ $json.engager_profile_url }}",
  "post_url": "{{ $json.post_url }}",
  "post_text": "{{ $json.post_text }}", // CRITICAL: Include full post text
  "monitored_profile_url": "{{ $json.monitored_profile_url }}",
  "engagement_type": "like", // or "comment"
  "engaged_at": "{{ $json.timestamp }}"
}
```

### 🎉 Next Steps

1. ✅ Run database migration
2. ✅ Update n8n workflow to populate `post_engagements`
3. ✅ Test with sample data
4. ✅ Train users on keyword search feature
5. 🚀 Start finding prospects by topic!

---

**Feature Status**: ✅ **READY FOR USE**

Once you populate the `post_engagements` table with data, the keyword search will be fully operational!

