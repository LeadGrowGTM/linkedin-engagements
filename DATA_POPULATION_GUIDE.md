# 📊 Data Population Guide for Keyword Search

**Quick Reference for n8n Workflow Updates**

---

## 🎯 Goal

Populate the `post_engagements` table so that keyword search works.

---

## 📋 Required Data Points

For each engagement (like/comment) on a post, you need:

| Data Point | Source | Example |
|------------|--------|---------|
| `engager_profile_url` | Person who liked/commented | `https://www.linkedin.com/in/john-smith` |
| `post_url` | The post they engaged with | `https://www.linkedin.com/posts/author_ai-sdr-12345` |
| `post_text` | **Full text of the post** | `"Just launched our AI SDR tool! 🚀..."` |
| `monitored_profile_url` | Profile you're monitoring | `https://www.linkedin.com/in/monitored-person` |
| `engagement_type` | Type of interaction | `"like"` or `"comment"` or `"share"` |
| `engaged_at` | When they engaged | `"2025-10-26T14:30:00Z"` |

---

## 🔄 n8n Workflow Update

### Current Workflow (Assumption)

```
1. Get posts from monitored profile → linkedin_posts table
2. Get engagers for each post → enriched_profiles table
```

### Updated Workflow (Add This)

```
3. For each engager on each post → post_engagements table
```

### n8n Node Configuration

**After you extract engagers**, add a **"Supabase: Insert Row"** node:

**Table**: `linkedinengagements.post_engagements`

**Fields**:
```javascript
{
  "engager_profile_url": "{{ $json.engager_profile_url }}",
  "post_url": "{{ $json.post_url }}",
  "post_text": "{{ $json.post_text }}",  // From post data
  "monitored_profile_url": "{{ $json.monitored_profile_url }}",
  "engagement_type": "like",  // or dynamically set
  "engaged_at": "{{ $json.engaged_at }}"
}
```

---

## 🔍 Where to Get `post_text`

### Option 1: From Apify API Response

When you fetch posts using Apify's `linkedin-profile-posts` actor, the response includes:

```json
{
  "url": "https://linkedin.com/posts/...",
  "text": "This is the full post text...",  ← USE THIS
  "posted_at": {...},
  "likes": 42,
  "comments": 10
}
```

**Store** the `text` field in both:
1. `linkedin_posts.post_text` (already implemented)
2. `post_engagements.post_text` (new)

### Option 2: Join from linkedin_posts Table

If `post_text` is already in `linkedin_posts`, you can join:

```javascript
// In n8n, after getting engager data:
const postText = await supabase
  .from('linkedin_posts')
  .select('post_text')
  .eq('post_url', engagerData.post_url)
  .single();

return {
  ...engagerData,
  post_text: postText.data.post_text
};
```

---

## 📝 Example n8n JavaScript Code

### Complete Node Code

```javascript
// Node: Process Engagements for Keyword Search
// Type: Function

const engagements = $input.all();
const results = [];

for (const engagement of engagements) {
  const item = engagement.json;
  
  // Prepare data for post_engagements table
  const record = {
    engager_profile_url: item.engager_profile_url,
    post_url: item.post_url,
    post_text: item.post_text, // CRITICAL: Must have this!
    monitored_profile_url: item.monitored_profile_url,
    engagement_type: item.engagement_type || 'like',
    engaged_at: item.engaged_at || new Date().toISOString()
  };
  
  // Only add if we have post_text
  if (record.post_text) {
    results.push({ json: record });
  }
}

return results;
```

### Then Use Supabase Insert Node

Connect this to **Supabase: Insert Row** node:
- Table: `linkedinengagements.post_engagements`
- Map fields from the JSON output above

---

## 🧪 Test Data Insert

### Manual Test (SQL)

```sql
-- Insert test engagement
INSERT INTO linkedinengagements.post_engagements (
    engager_profile_url,
    post_url,
    post_text,
    monitored_profile_url,
    engagement_type,
    engaged_at
) VALUES (
    'https://www.linkedin.com/in/test-user',
    'https://www.linkedin.com/posts/author_test-post-123',
    'Just launched our new AI SDR platform! Sales automation is the future. 🚀',
    'https://www.linkedin.com/in/monitored-profile',
    'like',
    NOW()
);

-- Verify insert
SELECT * FROM linkedinengagements.post_engagements 
WHERE post_text ILIKE '%AI SDR%';
```

### Test Keyword Search

1. Go to dashboard → Keyword Search
2. Search "AI SDR"
3. Should see the test user in results!

---

## ⚠️ Important Notes

### 1. Post Text is REQUIRED

❌ **Won't Work**:
```sql
INSERT INTO post_engagements (...) VALUES (
    'engager-url',
    'post-url',
    NULL,  -- ← No post text = no keyword search results!
    ...
);
```

✅ **Will Work**:
```sql
INSERT INTO post_engagements (...) VALUES (
    'engager-url',
    'post-url',
    'Full text of the LinkedIn post...',  -- ← This enables search!
    ...
);
```

### 2. Avoid Duplicates

The table has a unique constraint on `(engager_profile_url, post_url)`.

If you try to insert the same person + post twice, you'll get an error:

```
ERROR: duplicate key value violates unique constraint
```

**Solution**: Use `INSERT ... ON CONFLICT DO NOTHING`:

```sql
INSERT INTO linkedinengagements.post_engagements (...)
VALUES (...)
ON CONFLICT (engager_profile_url, post_url) 
DO NOTHING;
```

Or in n8n, use **"Upsert"** instead of "Insert".

### 3. Engager Must Exist

Foreign key constraint requires the engager to exist in `enriched_profiles`.

**Order of operations**:
1. Insert engager into `enriched_profiles` (if not exists)
2. Insert engagement into `post_engagements`

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    n8n Workflow Part 1                      │
│              (Monitor LinkedIn Profiles)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │  Fetch Posts from Profile     │
            │  (Apify: linkedin-profile-    │
            │         posts)                │
            └───────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │  Store Post Data              │
            │  → linkedin_posts table       │
            │     - post_url                │
            │     - post_text ← IMPORTANT!  │
            │     - posted_at               │
            │     - status                  │
            └───────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    n8n Workflow Part 2                      │
│              (Get Engagers from Posts)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │  Fetch Engagers for Post      │
            │  (Apify: linkedin-post-       │
            │         engagers)             │
            └───────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    ↓               ↓
    ┌───────────────────────┐   ┌───────────────────────┐
    │  Store Engager        │   │  Store Engagement     │
    │  → enriched_profiles  │   │  → post_engagements   │
    │     - profile_url     │   │     - engager_url     │
    │     - full_name       │   │     - post_url        │
    │     - headline        │   │     - post_text       │
    │     - company         │   │     - monitored_url   │
    │     - connections     │   │     - engagement_type │
    │     - followers       │   │     - engaged_at      │
    │     - skills          │   │                       │
    │     - ...             │   │  ← NEW TABLE!         │
    └───────────────────────┘   └───────────────────────┘
                                            ↓
                        ┌───────────────────────────────┐
                        │   Keyword Search Dashboard    │
                        │   (Searches post_text field)  │
                        └───────────────────────────────┘
```

---

## ✅ Verification Checklist

After updating your workflow:

- [ ] `post_engagements` table has data
- [ ] `post_text` field is populated (not NULL)
- [ ] Can search for keyword in dashboard
- [ ] Results show correct engagers
- [ ] Clicking engager shows full profile
- [ ] Engagement count badges show correctly ("3x engaged")
- [ ] Clicking post URL opens LinkedIn

---

## 📞 Quick Test Query

Check if your data is ready:

```sql
-- Count total engagements
SELECT COUNT(*) FROM linkedinengagements.post_engagements;

-- Count engagements with post text
SELECT COUNT(*) FROM linkedinengagements.post_engagements 
WHERE post_text IS NOT NULL;

-- Find posts mentioning "AI"
SELECT 
    COUNT(DISTINCT engager_profile_url) as unique_engagers,
    COUNT(*) as total_engagements
FROM linkedinengagements.post_engagements
WHERE post_text ILIKE '%AI%';

-- Get sample data
SELECT 
    engager_profile_url,
    LEFT(post_text, 50) as post_preview,
    engagement_type,
    engaged_at
FROM linkedinengagements.post_engagements
LIMIT 5;
```

---

## 🎯 Success Metrics

You'll know it's working when:

1. **Data in table**: 
   ```sql
   SELECT COUNT(*) FROM post_engagements;
   -- Should return > 0
   ```

2. **Search returns results**:
   - Search "AI" → see engagers
   - Search "SaaS" → see engagers
   - Search "sales" → see engagers

3. **Engagement counts correct**:
   - Person engaged with 3 posts → badge shows "3x engaged"

---

**Ready to implement?** Follow these steps and keyword search will work! 🚀

