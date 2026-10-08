# 75 Day Hard Challenge Tracker 🏏

A mobile-first, dark-theme personal challenge tracker built for a cricketer. Tracks 16 daily tasks including batting balls, water, sleep, gym sessions, and more over a 75-day challenge.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth + Postgres + Storage) · Vercel

---

## 📋 Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Authentication → Settings**:
   - Disable "Enable email confirmations" (for instant login)
   - Disable "Enable new user signups" (personal app only)
4. Go to **Authentication → Users** → Click "Add User" → Create your account
5. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/75-day-challenge
cd cricket-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Supabase URL and anon key

# Run the development server
npm run dev
# Open http://localhost:3000
```

### 3. Deploy on Vercel

#### Via GitHub (Recommended)

1. Push this code to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit: 75 Day Hard Challenge Tracker"
git remote add origin https://github.com/YOUR_USERNAME/75-day-challenge.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**
3. Import your GitHub repository
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**

#### Via Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

---

## 📁 Project Structure

```
cricket-tracker/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with PWA metadata
│   ├── page.tsx            # Main protected page
│   ├── globals.css         # Global styles (Tailwind v4)
│   └── login/page.tsx      # Login page
├── components/
│   ├── AppProvider.tsx     # Global context: data, offline queue, fail detection
│   ├── AppShell.tsx        # Bottom tab navigation shell
│   ├── ServiceWorkerRegistrar.tsx
│   ├── screens/            # Full-page screen components
│   │   ├── TodayScreen.tsx     # Main daily tracking screen
│   │   ├── CalendarScreen.tsx  # 75-day grid calendar
│   │   ├── StatsScreen.tsx     # Streak & performance stats
│   │   ├── ProgressScreen.tsx  # Weight chart + photo gallery
│   │   └── SettingsScreen.tsx  # Task config, export, logout
│   └── ui/                 # Reusable UI components
│       ├── ProgressRing.tsx
│       ├── SaveIndicator.tsx
│       ├── FailureSheet.tsx
│       ├── OfflineBadge.tsx
│       ├── WeeklyCheckinCard.tsx
│       ├── BattingBarChart.tsx
│       ├── WeightChart.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── challenge.ts        # Pure challenge logic (testable)
│   ├── utils.ts            # Helpers (cn, debounce, haptic, etc.)
│   ├── offline-queue.ts    # IndexedDB offline save queue
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       └── server.ts       # Server Supabase client
├── types/index.ts          # TypeScript type definitions
├── supabase/schema.sql     # Database schema (run in SQL Editor)
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # App icons (replace with proper PNGs)
├── middleware.ts            # Auth protection for all routes
├── .env.example            # Environment variable template
└── next.config.ts
```

---

## 🏏 Challenge Rules

- **75 days** starting **9 October 2026** (configurable in Settings)
- **Normal Day**: Complete all 16 tasks including 1000 batting balls, 200 keeping, 100 catching, 4L water, 7h sleep, 5 meals, no junk, journal (3 lines), meditation, naam jap, shadow, stretching, running, video review, visualization
- **Match Day**: Only required tasks (meditation, naam jap, food, water, sleep, journal, no junk + match played checkbox). Batting/keeping/gym not required
- **Gym Rule**: Minimum 3 gym sessions per 7-day week. Missing this fails the challenge
- **Fail condition**: Any past day incomplete, or any week with <3 gym days
- **Sundays**: Weekly check-in with body weight + progress photo required

---

## 📱 PWA Icons

Replace the placeholder icons in `public/icons/` with proper 192×192 and 512×512 PNG icons. Use a tool like [Real Favicon Generator](https://realfavicongenerator.net/) or create your own with a cricket ball / "75" design.

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key |

Never commit `.env.local` — it's in `.gitignore`.
