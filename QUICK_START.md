# 🚀 Quick Start Guide

## ✅ Project Status: READY

Your LinkedIn Engagement Dashboard is fully set up and running!

## 📍 Access the Dashboard

**Development Server:** http://localhost:5173

The server is currently running in the background.

## 🎨 What You Have

### Pages
1. **Dashboard** (`/dashboard`) - Default home page
   - Real-time metrics cards (Profiles, Posts, Engagers, Engagement Rate)
   - Time range filters (7, 14, 30 days)
   - Leads tracked table with smart tags
   - Enable/disable profile monitoring

2. **Profiles** (`/profiles`)
   - View all monitored LinkedIn profiles
   - Add new profiles with webhook URLs
   - See post counts and engager stats per profile
   - Enable/disable/delete profiles

3. **Settings** (`/settings`)
   - Dark mode toggle
   - Auto-enable new profiles
   - Refresh interval configuration
   - Default webhook URL
   - Smart tags settings
   - Data retention options

### Features
✅ Dark/Light mode with persistent preference  
✅ Real-time updates via Supabase Realtime  
✅ Responsive design (desktop & mobile)  
✅ Modern minimalist UI with dark blue/white theme  
✅ Smart tags auto-generated from engager data  
✅ Time-range filtering for metrics  
✅ Full CRUD for LinkedIn profiles  

## 🗄️ Database Connection

- **Supabase URL:** https://lgsupabase.up.railway.app
- **Schema:** linkedinengagements
- **Tables:** linkedin_profiles, linkedin_posts, enriched_profiles

All credentials are configured in `.env` file.

## 🛠️ Development Commands

```bash
# Start dev server (already running)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

## 📊 How It Works

1. **Add LinkedIn Profile**: Go to Profiles page → Click "Add Profile" → Enter URL
2. **Monitor Engagement**: Your n8n workflows populate the database with:
   - Posts from monitored profiles
   - Engagers (reactors/commenters) data
   - Enriched profile information
3. **View Insights**: Dashboard shows real-time metrics and lead tracking
4. **Manage**: Enable/disable monitoring, configure settings

## 🔗 Integration with n8n

The dashboard connects to your Supabase database where n8n workflows store:
- Monitored profile posts (linkedin_posts table)
- Engagement data (enriched_profiles table with parent_profile link)
- Profile configuration (linkedin_profiles table)

## 🎯 Next Steps

1. **Add your first LinkedIn profile** in the Profiles page
2. **Configure n8n workflows** to populate the database
3. **Watch real-time updates** as engagement data comes in
4. **Customize settings** to match your workflow

## 🐛 Troubleshooting

**Dashboard shows no data?**
- Ensure n8n workflows are running and writing to Supabase
- Check that profiles are enabled (toggle switch)
- Verify Supabase connection credentials

**Real-time updates not working?**
- Check browser console for Supabase connection errors
- Verify Supabase Realtime is enabled for your tables

**Dark mode not persisting?**
- Clear browser local storage and try again
- Check browser console for errors

## 📦 Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui + Headless UI
- Supabase (PostgreSQL + Realtime)
- TanStack Query (React Query)
- React Router v6

---

**Need help?** Check the README.md for detailed documentation.

