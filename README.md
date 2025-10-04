# LinkedIn Engagement Dashboard

A modern, minimalist dashboard for monitoring LinkedIn profile engagement. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Real-time Dashboard**: Monitor key metrics including profiles tracked, posts, unique engagers, and engagement rates
- **Profile Management**: Add, edit, and manage LinkedIn profiles to monitor
- **Smart Tags**: Automatically generated tags based on engager data (industry, location, etc.)
- **Time Range Filters**: View metrics for 7, 14, or 30-day periods
- **Dark Mode**: Toggle between light and dark themes
- **Real-time Updates**: Automatic data refresh using Supabase Realtime subscriptions

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS with shadcn/ui and Headless UI components
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account with configured database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LinkedinDashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Database Schema

The application requires three tables in the `linkedinengagements` schema:

### linkedin_profiles
- Stores monitored LinkedIn profiles
- Fields: id, profile_url, is_enabled, created_at, Webhook

### linkedin_posts
- Tracks posts from monitored profiles
- Fields: id, post_url, profile_url, posted_at_timestamp, status, created_at, updated_at

### enriched_profiles
- Stores enriched data about engagers (reactors/commenters)
- Fields: profile_url, first_name, last_name, full_name, headline, company_name, location, etc.
- Links to monitored profiles via parent_profile field

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── layout/          # Layout components (Sidebar, Header)
│   ├── dashboard/       # Dashboard-specific components
│   └── profiles/        # Profile management components
├── pages/               # Main page components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and Supabase client
├── types/               # TypeScript type definitions
├── contexts/            # React contexts (Theme)
├── App.tsx             # Main app component
└── main.tsx            # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features in Detail

### Dashboard
- Overview metrics cards showing key statistics
- Time range filters (7, 14, 30 days)
- Leads tracked table with profile information and smart tags
- Real-time data updates

### Profile Management
- Add new LinkedIn profiles with optional webhook URLs
- Enable/disable profile monitoring
- View detailed stats per profile (posts tracked, engagers)
- Delete profiles

### Settings
- Dark mode toggle
- Monitoring configuration (auto-enable, refresh interval)
- Default webhook URL setup
- Smart tags configuration
- Data retention settings

## Integration with n8n

This dashboard is designed to work with n8n workflows that:
1. Monitor LinkedIn profiles for new posts
2. Extract engagement data (reactions, comments)
3. Enrich engager profiles with additional data
4. Store everything in Supabase

The dashboard provides a user-friendly interface to manage profiles and view aggregated metrics.

## License

MIT

