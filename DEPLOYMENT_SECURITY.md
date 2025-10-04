# 🔒 Security & Deployment Guide for Railway

## ✅ Current Security Status

### ✓ **SECURE** - What's Already Protected

1. **Environment Variables in .gitignore**
   - `.env` is properly ignored
   - Credentials won't be committed to git
   - ✅ **SAFE TO DEPLOY**

2. **No Hardcoded Credentials**
   - All Supabase keys use `import.meta.env.VITE_*`
   - Keys loaded from environment variables only
   - ✅ **SECURE**

3. **Client-Side Security**
   - Using ANON key (not service key) in client
   - Service key is declared but not used in code
   - ✅ **GOOD PRACTICE**

---

## 🚨 IMPORTANT: Remove Service Key from Client

### Issue
Your `.env` file includes `VITE_SUPABASE_SERVICE_KEY`, but it's **not used** in the client code. The `VITE_` prefix makes it available in the browser bundle.

### Recommendation
**Remove the service key from client entirely** since you're not using it:

```env
# .env - CLIENT SAFE VERSION
VITE_SUPABASE_URL=https://lgsupabase.up.railway.app
VITE_SUPABASE_ANON_KEY=your-anon-key-here
# DO NOT include service key here - it's not needed in client
```

### Why?
- Service keys have **full database access**
- Should only be used in backend/server code
- Your dashboard only needs the anon key
- Supabase Row Level Security (RLS) should handle permissions

---

## 🚀 Railway Deployment Steps

### 1. Prepare Your Repository

```bash
# Make sure .env is NOT committed
git status

# If .env shows up, add it to .gitignore (already done ✓)
echo ".env" >> .gitignore

# Commit and push
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy to Railway

1. **Go to [railway.app](https://railway.app)**
2. **New Project** → **Deploy from GitHub**
3. **Select your repository**
4. **Railway will auto-detect**: Vite + React app

### 3. Configure Environment Variables in Railway

⚠️ **CRITICAL**: Add these in Railway Dashboard (NOT in code):

```
Settings → Variables → Add Variables:

VITE_SUPABASE_URL=https://lgsupabase.up.railway.app
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...
```

**DO NOT add service key to Railway for client deployment!**

### 4. Configure Build Settings

Railway should auto-detect, but verify:

```
Build Command: npm run build
Start Command: npx serve dist -s -p $PORT
Install Command: npm install
```

### 5. Add Production Dependencies

Update your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "serve": "serve dist -s -p $PORT"
  },
  "devDependencies": {
    ...existing...
  },
  "dependencies": {
    ...existing...,
    "serve": "^14.2.1"
  }
}
```

---

## 🔐 Supabase Security Best Practices

### 1. Enable Row Level Security (RLS)

**CRITICAL**: Your Supabase tables should have RLS policies:

```sql
-- Example: Make tables read-only from client
ALTER TABLE linkedinengagements.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedinengagements.linkedin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedinengagements.enriched_profiles ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (or public if needed)
CREATE POLICY "Allow read access" ON linkedinengagements.linkedin_profiles
FOR SELECT USING (true);

CREATE POLICY "Allow read access" ON linkedinengagements.linkedin_posts
FOR SELECT USING (true);

CREATE POLICY "Allow read access" ON linkedinengagements.enriched_profiles
FOR SELECT USING (true);

-- Allow insert/update/delete only from service key (server-side)
-- Don't create these policies if you want server-only writes
```

### 2. API Key Rotation

- Regularly rotate your Supabase keys
- Update Railway environment variables when rotated
- Never share keys in chat/email/Slack

### 3. HTTPS Only

- Railway provides HTTPS by default ✓
- Never use HTTP in production
- Supabase also uses HTTPS ✓

---

## 🛡️ Additional Security Measures

### 1. Add Content Security Policy

Create `public/_headers` file:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 2. Rate Limiting (Optional)

Consider adding rate limiting in Supabase:
- Limit requests per IP
- Prevent abuse of your dashboard
- Available in Supabase Dashboard → Settings → API

### 3. Authentication (Future Enhancement)

For production, add user authentication:
```typescript
// Future: Add Supabase Auth
import { Auth } from '@supabase/auth-ui-react'

// Protect routes with auth
// Only show dashboard to authenticated users
```

---

## ✅ Pre-Deployment Checklist

Before deploying to Railway:

- [ ] `.env` is in `.gitignore` ✓
- [ ] No credentials hardcoded in source ✓
- [ ] Remove `VITE_SUPABASE_SERVICE_KEY` from `.env`
- [ ] Environment variables configured in Railway
- [ ] Supabase RLS policies enabled
- [ ] Build command tested locally (`npm run build`)
- [ ] Git repository pushed to GitHub/GitLab
- [ ] HTTPS enabled (Railway default) ✓
- [ ] Domain configured (optional)

---

## 🔍 What Gets Exposed in Browser?

### Safe to Expose:
- ✅ Supabase URL (public endpoint)
- ✅ Supabase Anon Key (public, protected by RLS)
- ✅ All your React code (it's client-side)

### Never Expose:
- ❌ Supabase Service Key
- ❌ Database passwords
- ❌ Private API keys
- ❌ JWT secrets

---

## 📊 Monitoring & Logs

After deployment:

1. **Railway Logs**: Monitor for errors
2. **Supabase Logs**: Check API usage
3. **Set up alerts**: For unusual activity
4. **Monitor costs**: Railway & Supabase usage

---

## 🆘 If Keys Are Exposed

If you accidentally commit keys:

1. **Rotate immediately** in Supabase Dashboard
2. **Update Railway** environment variables
3. **Force push** to remove from git history:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env" \
   --prune-empty --tag-name-filter cat -- --all
   ```
4. **Change all passwords**

---

## 🎯 Recommended Setup for Production

### Option 1: Client-Only (Current)
```
Browser → Supabase (with RLS)
✓ Simple
✓ Fast
⚠️ Limited control
```

### Option 2: With Backend (More Secure)
```
Browser → Your API Server → Supabase
✓ Full control
✓ Hide all keys
✓ Add custom logic
❌ More complex
```

For now, **Option 1 is fine** with proper RLS policies.

---

## 📝 Summary

**Your Current Status**: ✅ **SAFE TO DEPLOY**

**Action Items**:
1. Remove `VITE_SUPABASE_SERVICE_KEY` from `.env` (not needed)
2. Enable RLS on Supabase tables
3. Add environment variables in Railway dashboard
4. Deploy!

**After Deployment**:
- Your credentials stay in Railway (secure)
- Only anon key is in browser (safe with RLS)
- Dashboard works perfectly
- No security leaks ✓

---

**Need Help?** Check Railway docs: https://docs.railway.app/

