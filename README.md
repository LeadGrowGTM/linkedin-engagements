# 🎯 LinkedIn Engagement Monitor Dashboard

A modern, real-time dashboard for tracking and analyzing LinkedIn profile engagement. Monitor posts, track engagers, and gain actionable insights from your LinkedIn network.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

### 📊 Dashboard
- **Real-time Metrics**: Track profiles, posts, and unique engagers
- **Lead Scoring**: Automatic scoring system (Hot/Warm/Cold leads)
- **Advanced Filtering**: Filter by industry, location, company size, and more
- **Time Range Selection**: View data for 7, 14, 30, or 90 days

### 📈 Analytics
- Lead Quality Distribution
- Engagement Trends Over Time
- Industry & Company Size Breakdown
- Geographic Distribution
- Top Skills Analysis
- Engagement Patterns Heatmap (Day × Hour)

### 👥 Profile Management
- Add/Remove LinkedIn profiles to monitor
- Enable/Disable tracking per profile
- Webhook configuration for n8n integration
- Post performance tracking per profile

### 🔍 Detailed Views
- **Engager Detail Page**: Full profile information, work history, education, skills
- **Post Performance**: Analyze individual posts and their engagement
- **Repeat Engagers**: Identify and prioritize frequent engagers

### 🎨 UI/UX
- Modern, minimalist design
- Light/Dark mode support
- Fully responsive (mobile, tablet, desktop)
- Real-time updates via Supabase

---

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Headless UI
- **State Management**: TanStack Query (React Query)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Charts**: Recharts
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Deployment**: Railway

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- n8n workflow (for data collection)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/charlesdr13/LinkedinMonitoringDashboard.git
cd LinkedinMonitoringDashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

⚠️ **Note**: Do NOT add `VITE_SUPABASE_SERVICE_KEY` - it's not needed in the client.

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

---

## 🚂 Deploy to Railway

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

**Quick Steps:**
1. Push code to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically!

---

## 📊 Database Schema

### Tables (schema: `linkedinengagements`)

**`linkedin_profiles`**
- Stores monitored LinkedIn profiles
- Fields: `id`, `profile_url`, `Webhook`, `is_enabled`, `created_at`

**`linkedin_posts`**
- Tracks posts from monitored profiles
- Fields: `id`, `post_url`, `profile_url`, `posted_at_timestamp`, `status`, `created_at`

**`enriched_profiles`**
- Stores engager data with enriched information
- Fields: `profile_url`, `parent_profile`, `full_name`, `headline`, `company_name`, `company_industry`, `company_size`, `location`, `connections`, `followers`, `skills`, `experience`, `education`, and more

---

## 🔐 Security

- ✅ Environment variables for credentials
- ✅ `.env` in `.gitignore`
- ✅ No hardcoded secrets
- ✅ HTTPS only (Railway default)
- ⚠️ **Recommended**: Enable Supabase Row Level Security (RLS)

See [DEPLOYMENT_SECURITY.md](./DEPLOYMENT_SECURITY.md) for security best practices.

---

## 🎯 Lead Scoring Algorithm

Engagers are automatically scored based on:

- **Connections** (25%): More connections = higher score
- **Followers** (25%): More followers = higher influence
- **Company Size** (25%): Larger companies = higher priority
- **Seniority** (25%): C-level, VP, Director = higher score

**Categories:**
- 🔥 **Hot Lead**: Score 70-100 (High priority)
- ⭐ **Warm Lead**: Score 40-69 (Good potential)
- 🧊 **Cold Lead**: Score 0-39 (Lower priority)

---

## 📱 Screenshots

### Dashboard
<img src="./docs/dashboard.png" alt="Dashboard" width="600">

### Analytics
<img src="./docs/analytics.png" alt="Analytics" width="600">

### Engager Detail
<img src="./docs/engager-detail.png" alt="Engager Detail" width="600">

---

## 🔄 Workflow Integration

This dashboard works with an n8n workflow that:

1. Monitors LinkedIn profiles for new posts
2. Extracts engagers (likes, comments)
3. Enriches engager data via LinkedIn API
4. Stores data in Supabase
5. Dashboard displays real-time updates

**n8n Workflow Required**: Not included in this repo.

---

## 🛠️ Development

### Project Structure

```
LinkedinDashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── layout/          # Layout components (Sidebar, Header)
│   │   ├── profiles/        # Profile management components
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React contexts (Theme)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities (Supabase, leadScoring)
│   ├── pages/               # Page components
│   ├── types/               # TypeScript type definitions
│   └── App.tsx              # Main app component
├── public/                  # Static assets
├── .env                     # Environment variables (not committed)
├── railway.toml             # Railway configuration
├── nixpacks.toml            # Nixpacks build configuration
└── package.json             # Dependencies and scripts
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run serve    # Serve production build (Railway)
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Railway](https://railway.app/)
- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [Your Email]

---

## 🎉 What's Next?

**Planned Features:**
- [ ] CSV Export functionality
- [ ] Email notifications for hot leads
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Saved filter presets
- [ ] User authentication
- [ ] Team collaboration features
- [ ] AI-powered lead recommendations
- [ ] Bulk actions on engagers

---

**Made with ❤️ for LinkedIn networking**
