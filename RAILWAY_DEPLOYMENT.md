# 🚂 Railway Deployment Guide

## Quick Start

Your dashboard is now ready to deploy to Railway with proper configuration!

---

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Environment Variables** - Your Supabase credentials

---

## 🚀 Deployment Steps

### Step 1: Initialize Git Repository

```bash
cd /home/del13s_ubuntu/MACH4/LinkedinDashboard

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: LinkedIn Engagement Dashboard"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub

2. **Click "New Project"**

3. **Select "Deploy from GitHub repo"**

4. **Choose your repository**: `LinkedinMonitoringDashboard`

5. **Railway will automatically**:
   - Detect it's a Vite project
   - Use the `railway.toml` configuration
   - Build using Node.js 20
   - Run `npm run build`
   - Start with `npm run serve`

### Step 3: Configure Environment Variables

In your Railway project dashboard:

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these variables:

```
VITE_SUPABASE_URL=https://lgsupabase.up.railway.app
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: 
- Do NOT add `VITE_SUPABASE_SERVICE_KEY` (not needed in client)
- Copy exact values from your `.env` file
- Click "Add" after each variable

### Step 4: Redeploy

After adding environment variables:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for the build to complete (~2-3 minutes)

### Step 5: Get Your URL

Once deployed:
1. Railway will assign you a URL: `your-app.up.railway.app`
2. Click the URL to open your dashboard
3. (Optional) Add a custom domain in Settings → Domains

---

## 📁 Configuration Files Included

### `railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run serve"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run serve"
```

### Updated `package.json`
Added serve script:
```json
"serve": "vite preview --host 0.0.0.0 --port $PORT"
```

---

## 🔍 Troubleshooting

### Build Fails

**Check these:**
1. All dependencies in `package.json`? ✓
2. TypeScript compiling? Run `npm run build` locally
3. Environment variables added? Check Railway dashboard

### App Won't Start

**Common issues:**
1. PORT not set correctly - Railway provides `$PORT` automatically
2. Start command wrong - Should be `npm run serve`
3. Build output missing - Check `dist/` folder was created

### Blank Page

**Likely causes:**
1. Environment variables not set in Railway
2. Supabase URL/key incorrect
3. Check browser console for errors

### Can't Connect to Supabase

**Verify:**
1. `VITE_SUPABASE_URL` is correct
2. `VITE_SUPABASE_ANON_KEY` is correct
3. Supabase project is running
4. RLS policies allow reads

---

## 📊 Monitoring

### View Logs

In Railway dashboard:
1. Click your service
2. Go to **"Deployments"** tab
3. Click on a deployment
4. View **"Build Logs"** and **"Deploy Logs"**

### Check Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request counts

---

## 🔄 Updating Your Dashboard

Every time you push to GitHub:

```bash
git add .
git commit -m "Updated feature X"
git push
```

Railway will **automatically**:
1. Detect the push
2. Build the new version
3. Deploy with zero downtime
4. Rollback if build fails

---

## 💰 Pricing

**Hobby Plan (Free Tier)**:
- $5 free credit/month
- 500 hours execution time
- Perfect for this dashboard
- No credit card required initially

**Estimated Cost**: ~$2-5/month for this app

---

## 🔐 Security Checklist

Before deploying:

- [x] `.env` in `.gitignore` ✓
- [x] No hardcoded credentials ✓
- [ ] Removed `VITE_SUPABASE_SERVICE_KEY` from `.env`
- [ ] Environment variables added in Railway dashboard
- [ ] Supabase RLS policies enabled
- [x] HTTPS enabled (Railway default) ✓

---

## 🎯 Post-Deployment

### 1. Test Everything

- [ ] Dashboard loads
- [ ] Metrics display correctly
- [ ] Engagers table shows data
- [ ] Analytics page works
- [ ] Profile management functions
- [ ] Theme toggle works
- [ ] Mobile responsive

### 2. Share Your Dashboard

Get your URL from Railway and share it:
```
https://your-dashboard.up.railway.app
```

### 3. Monitor Performance

- Check Railway metrics daily
- Review Supabase usage
- Watch for errors in logs

---

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Your Dashboard**: Check `DEPLOYMENT_SECURITY.md` for security tips

---

## ✅ Deployment Checklist

Complete these steps:

1. [ ] Code pushed to GitHub
2. [ ] Railway project created
3. [ ] Repository connected to Railway
4. [ ] Environment variables configured
5. [ ] First deployment successful
6. [ ] Dashboard accessible via Railway URL
7. [ ] All features working
8. [ ] (Optional) Custom domain added

---

## 🎉 You're Live!

Once deployed, your LinkedIn Engagement Dashboard will be:
- ✅ Accessible 24/7
- ✅ Automatically backed up
- ✅ Auto-deployed on every push
- ✅ Secured with HTTPS
- ✅ Monitored by Railway

**Your n8n workflow** → **Supabase** → **Railway Dashboard** → **Real-time insights!** 🚀

---

## 📝 Example Git Commands

```bash
# In the project directory
cd /home/del13s_ubuntu/MACH4/LinkedinDashboard

# Check status
git status

# See all files ready to commit
git add .

# Commit with message
git commit -m "Add Railway configuration files"

# Push to GitHub
git push origin main
```

---

**Ready to deploy?** Follow the steps above and you'll be live in ~10 minutes! 🎊

