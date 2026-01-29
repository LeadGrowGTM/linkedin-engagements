# LinkedIn Engagement Monitor - User Guide

A comprehensive guide to tracking LinkedIn engagement and managing leads.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Profiles](#managing-profiles)
4. [Viewing Engagers](#viewing-engagers)
5. [Analytics](#analytics)
6. [Posts Management](#posts-management)
7. [Keyword Search](#keyword-search)
8. [Pushing Leads to Clay](#pushing-leads-to-clay)
9. [Settings](#settings)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

The LinkedIn Engagement Monitor helps you track who engages with your (or your clients') LinkedIn posts. It automatically collects data about people who like, comment on, or react to posts, enriches their profiles, and lets you export qualified leads.

### How It Works

1. **You add LinkedIn profiles** to monitor (your profile, your client's profile, competitor profiles, etc.)
2. **The system automatically scrapes posts** from those profiles every 2 days
3. **Engagers are collected and enriched** with company info, job title, location, skills, and more
4. **You browse, filter, and export leads** to tools like Clay for outreach

### Navigation

The sidebar on the left gives you access to all pages:

| Icon | Page | Purpose |
|------|------|---------|
| Grid | Dashboard | Overview metrics and quick insights |
| People | Engagers | Browse and filter all people who engaged |
| Chart | Analytics | Charts and trends about your audience |
| Document | Posts | View all scraped posts and trigger scrapes |
| Search | Keyword Search | Find engagers by post topics |
| Gear | Settings | Configure webhooks and preferences |

---

## Dashboard Overview

The Dashboard is your home base. It shows you key metrics at a glance.

### Metrics Cards

- **Active Profiles** - Number of LinkedIn profiles you're currently monitoring
- **Posts Tracked** - Total posts collected in the selected time period
- **Unique Engagers** - Number of unique people who engaged with posts
- **Avg Engagement** - Average number of engagers per post

### Time Range Filter

Use the buttons in the top-right (7 days, 14 days, 30 days, 90 days) to change the time period for all metrics.

### Quick Action Cards

- **View All Engagers** - Jump to the full engagers list
- **Deep Analytics** - Go to charts and insights
- **Post Sync Status** - Check the status of post scraping

### Engagement Trends

A line chart showing daily engagement over time. Helps you spot patterns and see which days get more engagement.

### Industry & Company Size Distribution

See what industries and company sizes your engagers come from. Great for understanding your audience.

### Top Skills & Top Titles

Discover the most common skills and job titles among your engagers. Useful for targeting your content.

---

## Managing Profiles

The Profiles page is where you add and manage LinkedIn profiles to monitor.

### Adding a New Profile

1. Click the **"Add Profile"** button in the top-right
2. Fill in the form:
   - **Profile URL** (required) - The full LinkedIn profile URL, e.g., `https://www.linkedin.com/in/username`
   - **Profile Description** (optional) - Notes about this profile (who they are, what content they post)
   - **Category** (optional) - Organize profiles into folders/categories
   - **Webhook URL** (optional) - Custom webhook for this specific profile
3. Click **"Add Profile"**

The profile will be enabled automatically and included in the next scraping run.

### Enabling/Disabling Profiles

Each profile card has a toggle switch. Turn it **ON** to include the profile in scraping, or **OFF** to pause monitoring.

**Note:** Disabled profiles won't have new posts scraped, so you won't get new engagers from them.

### Categories

Categories help you organize profiles (e.g., "Clients", "Competitors", "Team Members").

1. Click **"Manage Categories"** on the Profiles page
2. Add new categories with custom colors
3. Assign categories when adding or editing profiles

### Deleting a Profile

Click the trash icon on a profile card to remove it. This stops monitoring but doesn't delete historical engager data.

---

## Viewing Engagers

The Engagers page shows everyone who has engaged with posts from your monitored profiles.

### Engager List

Each row shows:
- **Name** - Full name with link to their LinkedIn profile
- **Headline** - Their current job title/description
- **Company** - Where they work
- **Industry** - Their company's industry
- **Location** - Where they're based
- **Connections/Followers** - Their network size
- **Actions** - View details, open LinkedIn, push to Clay

### Filtering Engagers

Click the **"Filters"** button to narrow down your list:

- **Industry** - Filter by specific industries
- **Location** - Filter by geographic location
- **Company Size** - Filter by company employee count
- **Title/Headline Keyword** - Search within job titles
- **Engaged With** - Show only engagers from a specific monitored profile

### Searching

Use the search box to find engagers by name, headline, or company name.

### Selecting & Bulk Actions

1. Click the checkbox next to engagers to select them
2. Use **"Select All"** to select all visible engagers
3. Click **"Push to Clay"** to export selected leads

### Viewing Full Details

Click on any engager's name to see their full profile:
- Complete work experience
- Education history
- Skills
- About section
- Engagement history

---

## Analytics

The Analytics page provides deeper insights through charts and visualizations.

### Engagement Trends

A detailed line chart showing engagement over time. Hover over points to see exact numbers for each day.

### Industry Distribution

Bar chart showing which industries your engagers come from. Helps you understand your audience composition.

### Company Size Distribution

Pie chart breaking down engagers by company size (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+).

### Location Insights

See where your engagers are located geographically.

### Top Titles

Discover the most common job titles among your engagers. Useful for understanding who your content resonates with.

---

## Posts Management

The Posts page shows all scraped posts and their processing status.

### Post Status

Each post has a status badge:
- **Pending** - Post is queued for engager extraction
- **Processing** - Currently extracting engagers
- **Completed** - Engagers have been collected

### Manual Scraping

Two buttons let you manually trigger scraping:

1. **Scrape Posts** - Fetches new posts from all enabled profiles
   - Use this when you want to immediately capture a new post
   - Runs the same process that normally runs every 2 days

2. **Scrape Engagers** - Processes pending posts to extract engagers
   - Use this to immediately collect engagers from new posts
   - Runs the same process that normally runs every hour

3. **Refresh** - Reloads the post list from the database

### Posts by Profile

Posts are grouped by the profile they came from. Each post shows:
- Status badge
- Post date
- Post text preview
- Link to view on LinkedIn

---

## Keyword Search

Find engagers based on the topics they engaged with.

### How to Search

1. Enter a keyword in the search box (e.g., "AI SDR", "SaaS growth", "fundraising")
2. Click **Search**
3. Results show engagers who liked/commented on posts containing that keyword

### Example Searches

- **"AI SDR"** - Find people interested in AI sales tools
- **"SaaS growth"** - Discover growth-focused professionals
- **"Product-led"** - Identify PLG advocates
- **"Fundraising"** - Connect with startup founders

### Why This Is Powerful

Unlike just looking at who engaged, keyword search helps you find people interested in specific topics. If someone engaged with a post about "AI automation", they're likely interested in that topic.

---

## Pushing Leads to Clay

Export your qualified leads to Clay for enrichment and outreach.

### First-Time Setup

1. Go to **Settings**
2. In the **Clay Integration** section:
   - **Clay Proxy URL** - Usually set via environment variable (shows green checkmark if configured)
   - **Clay Webhook URL** - Get this from your Clay table:
     1. Open Clay and go to your table
     2. Click "Add Data" → "Webhook"
     3. Copy the webhook URL
     4. Paste it in Settings

### Pushing Individual Leads

1. Go to **Engagers** or open an engager's detail page
2. Click the **"Push to Clay"** button
3. The lead data is sent to your Clay table

### Pushing Multiple Leads

1. Go to **Engagers**
2. Select multiple engagers using checkboxes
3. Click **"Push to Clay"** in the header
4. All selected leads are sent in batch

### What Data Is Sent

Clay receives comprehensive profile data:
- Name, headline, location
- Company name, industry, size, website
- LinkedIn URL
- Connections & followers count
- Skills, experience, education
- Engagement type (like, comment, etc.)
- And more...

---

## Settings

Configure your dashboard preferences and integrations.

### Appearance

- **Dark Mode** - Toggle between light and dark themes

### Monitoring

- **Auto-enable new profiles** - When ON, new profiles start monitoring immediately
- **Refresh Interval** - How often the dashboard checks for new data
- **Default Webhook URL** - Webhook applied to new profiles by default

### n8n Workflow Triggers

These webhook URLs trigger your n8n workflows manually:

- **Scrape Posts Webhook (Part 1)** - Triggers post scraping
- **Scrape Engagers Webhook (Part 2)** - Triggers engager extraction

**Setup:** In your n8n workflow, add a Webhook trigger node and copy its URL here.

### Clay Integration

- **Clay Proxy URL** - Your deployed clay-proxy service (usually set via environment variable)
- **Clay Webhook URL** - Your Clay table's webhook URL

### Smart Tags

- **Enable Smart Tags** - Auto-generates tags from industry, location, and job titles

### Data Management

- **Data Retention** - How long to keep historical data (for reference; actual retention is set in n8n)

---

## Troubleshooting

### No engagers showing up

1. **Check the time range** - Try selecting "90 days" to see older data
2. **Check if profiles are enabled** - Disabled profiles don't get scraped
3. **Check post status** - Go to Posts page and see if posts are "Completed"
4. **Manually trigger scraping** - Click "Scrape Posts" then "Scrape Engagers"

### Engagers from a specific profile not showing

1. Go to **Profiles** and check if that profile is enabled (toggle ON)
2. The profile might have been disabled, so no recent data exists
3. Try selecting a longer time range (90 days)

### Push to Clay not working

1. **"No Clay Proxy URL"** - Set the VITE_CLAY_PROXY_URL environment variable in Railway
2. **"No Clay Webhook URL"** - Go to Settings and enter your Clay table's webhook URL
3. **Connection error** - Check that the clay-proxy service is running

### Scrape buttons not working

1. Go to **Settings** and verify the webhook URLs are correct
2. Make sure your n8n instance is running
3. Check that the n8n workflows have Webhook trigger nodes enabled

### Data seems outdated

1. Click **"Refresh"** on the current page
2. Manually trigger **"Scrape Posts"** then **"Scrape Engagers"**
3. Check your n8n workflows are running on schedule

---

## Tips for Best Results

1. **Monitor profiles that post regularly** - More posts = more engagers
2. **Check the Posts page** - Make sure posts are being collected and processed
3. **Use keyword search** - Find highly relevant leads based on topics
4. **Filter by company size** - Focus on your ideal customer profile
5. **Push to Clay regularly** - Don't let leads go cold
6. **Review Analytics weekly** - Understand what content attracts your target audience

---

## Quick Reference

| Task | Where to Go |
|------|-------------|
| See overview metrics | Dashboard |
| Add a profile to monitor | Profiles → Add Profile |
| Enable/disable monitoring | Profiles → Toggle switch |
| Browse all engagers | Engagers |
| Filter by industry/location | Engagers → Filters |
| Search for specific people | Engagers → Search box |
| View engagement charts | Analytics |
| Check post scraping status | Posts |
| Manually trigger scraping | Posts → Scrape Posts / Scrape Engagers |
| Find people by topic | Keyword Search |
| Export leads to Clay | Engagers → Select → Push to Clay |
| Configure webhooks | Settings |
| Set Clay integration | Settings → Clay Integration |
| Toggle dark mode | Settings → Appearance |

---

*Need help? Contact your administrator or check the technical documentation.*
