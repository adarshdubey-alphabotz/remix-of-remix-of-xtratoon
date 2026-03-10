# Komixora — Manhwa Reading Platform

> A full-stack manhwa/webtoon reading platform built with React, Supabase, and Telegram CDN. Creators publish content, readers discover and read — all with a modern, brutalist-inspired UI.

🌐 **Live:** [komixora.fun](https://komixora.fun)

---

## 📖 How It Works

### For Readers
1. **Sign up** with email & password → verify email → set up profile (username, avatar, bio)
2. **Browse & Discover** manhwa via homepage, explore page, top charts, genre filters, and spotlight search
3. **Read chapters** in a full-screen canvas reader with swipe navigation
4. **Build a library** — add titles to "Reading", "Plan to Read", "Completed", or "On Hold"
5. **Engage** — like manhwa, comment on chapters (threaded), follow creators, join community posts
6. **Get notified** — bell icon shows new chapters from followed creators, approval updates, and follower alerts

### For Publishers (Creators)
1. **Apply as publisher** → admin grants publisher role
2. **Upload manhwa** — title, description, genres, cover image, language
3. **Upload chapters** — drag & drop pages, auto-numbered, scheduled publishing support
4. **Analytics dashboard** — views, likes, bookmarks, follower count, revenue tracking
5. **Earnings & Payouts** — ad impression revenue (90/10 split), request payouts via PayPal/Binance/USDT/UPI/bKash
6. **Community posts** — share updates, images (up to 4), engage with followers

### For Admins
1. **Moderation** — approve/reject manhwa & chapters, ban/unban users, manage reports
2. **Content verification** — Telegram IDs (`TG ID` column) match between admin panel and Telegram channel captions for cross-referencing uploaded files
3. **Revenue analytics** — charts showing platform earnings, top creators, unlock trends
4. **Payout management** — process creator payout requests with status tracking
5. **Announcements** — create site-wide banners (info, warning, maintenance types) with scheduling
6. **Blog & FAQ** — publish SEO-optimized blog posts and FAQ articles
7. **User verification** — grant verified badges to trusted creators

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │───▶│  Supabase        │───▶│  Telegram CDN   │
│   (Vite + TS)   │    │  (Auth, DB, RLS) │    │  (File Storage) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ Cloudflare      │    │  Edge Functions  │
│ Worker (Proxy   │    │  (Telegram ops,  │
│ + SEO Bot       │    │   Email, Google  │
│   Renderer)     │    │   Indexing, etc) │
└─────────────────┘    └──────────────────┘
```

### Storage Strategy
- **Manga covers & chapter pages** → uploaded to Telegram channel via bot, `telegram_file_id` stored in Supabase
- **Content protection** — pages rendered on `<canvas>` with dynamic watermarks; `telegram_file_id` column hidden from public API via column-level permissions
- **Image serving** — Edge Function proxies Telegram file downloads, frontend uses `page_id` abstraction

### Database (Supabase/PostgreSQL)
- **18 tables** — `manga`, `chapters`, `chapter_pages`, `profiles`, `user_roles`, `follows`, `comments`, `community_posts`, `user_library`, `reading_history`, `creator_earnings`, `payout_requests`, etc.
- **Row-Level Security** on every table — role-based access (admin/publisher/reader)
- **16 triggers** — auto-notifications, counter updates, Google indexing pings, timestamp management
- **Security Definer functions** — `has_role()` for recursive-safe RLS, `record_chapter_unlock()` and `record_ad_impression()` for revenue tracking

### Edge Functions
| Function | Purpose |
|----------|---------|
| `telegram-upload` | Upload covers & chapter pages to Telegram |
| `telegram-proxy` | Proxy file downloads from Telegram |
| `telegram-community` | Mirror community posts to Telegram channel |
| `telegram-comment` | Sync comments to Telegram threads |
| `send-email` | SMTP email for moderation actions & welcome |
| `notify-google` | Ping Google Indexing API on content approval |
| `sitemap` | Dynamic XML sitemap generation |
| `publish-scheduled` | Cron job for scheduled chapter releases |
| `delete-account` | GDPR-compliant account deletion |
| `precache-images` | Warm image cache for popular content |

---

## 📊 Admin Dashboard Analytics & Charts

The admin panel includes:

- **Dashboard Stats** — total manhwa, chapters, users, pending reviews, reports (card grid)
- **Revenue Analytics** (`AdminRevenueAnalytics`) — line/bar charts showing:
  - Daily/weekly/monthly ad impressions & revenue
  - Top earning creators ranked by revenue share
  - Platform vs creator earnings split (pie chart)
  - Unlock trends over time
- **Creator Analytics** (`CreatorAnalytics`) — per-creator view with:
  - Views, likes, bookmarks trends (line charts via Recharts)
  - Chapter performance comparison (bar charts)
  - Follower growth over time
- **Payout Manager** (`AdminPayoutManager`) — request table with status filters, approval workflow
- **Earnings Dashboard** (`CreatorEarnings`) — creator-facing revenue breakdown with withdrawal history

**Charts library:** [Recharts](https://recharts.org) — used for `LineChart`, `BarChart`, `PieChart`, `AreaChart` across analytics components.

---

## 🔔 Notification System

| Event | Recipient | Channel |
|-------|-----------|---------|
| Manhwa approved/rejected | Publisher | In-app + Email |
| Chapter approved/rejected | Publisher | In-app + Email |
| Account unbanned | User | In-app + Email |
| New follower | Creator | In-app |
| New chapter (from followed) | Followers | In-app |
| New submission/report | Admin | Admin notifications |
| Welcome message | New user | Email (5s delay) |

All in-app notifications appear in the bell icon dropdown with real-time updates via Supabase Realtime.

---

## 🛡️ Security

- **RLS on all tables** — no data leaks even if frontend is compromised
- **Role-based access** — `admin`, `publisher`, `reader` via `user_roles` table + `has_role()` SECURITY DEFINER function
- **Content protection** — canvas rendering, watermarks, hidden file IDs
- **CORS proxy** — Cloudflare Worker handles API proxying
- **Bot renderer** — SEO-optimized HTML served to crawlers (Google, Telegram, Twitter)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| State | TanStack React Query |
| Auth & DB | Supabase (PostgreSQL, Auth, RLS, Realtime) |
| File Storage | Telegram Bot API (CDN) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Proxy & SEO | Cloudflare Workers |
| Charts | Recharts |
| Deployment | Vercel (frontend), Supabase (backend) |

---

## 📧 Contact

**Support:** [support@komixora.fun](mailto:support@komixora.fun)
