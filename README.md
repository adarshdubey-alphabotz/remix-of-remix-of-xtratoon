# Komixora — Manhwa Reading Platform

> A full-stack manhwa/webtoon reading platform built with React, Supabase, and Telegram CDN. Creators publish content, readers discover and read — all with a modern, Webtoon/Tapas-inspired UI.

🌐 **Live:** [komixora.fun](https://komixora.fun)

---

## 📖 How It Works

### For Readers
1. **Sign up** with email & password → verify email → set up profile (username, avatar, bio)
2. **Browse & Discover** manhwa via homepage hero carousel, explore page, top charts, genre filters, and spotlight search (⌘K)
3. **Read chapters** in a full-screen canvas reader with swipe navigation and page progress tracking
4. **Build a library** — add titles to "Reading", "Plan to Read", "Completed", or "On Hold"
5. **Engage** — like manhwa, comment on chapters (threaded replies, GIF support), follow creators, join community posts
6. **Get notified** — bell icon shows new chapters from followed creators, approval updates, and follower alerts
7. **Bookmarks** — save community posts and revisit them anytime
8. **Because You Read** — personalized recommendations based on reading history

### For Publishers (Creators)
1. **Apply as publisher** → admin grants publisher role
2. **Publisher Dashboard** — centralized control panel with 3-step onboarding guide
3. **Upload manhwa** — title, description, genres (up to 10 tags), cover image, banner image, language selection
4. **Upload chapters** — drag & drop pages, auto-numbered, bulk page ordering, scheduled publishing support
5. **Manga Scheduling** — schedule the initial launch of a title alongside its first chapter
6. **Chapter management** — reorder chapters, edit titles, delete chapters, schedule future releases
7. **Analytics dashboard** (`CreatorAnalytics`) — views, likes, bookmarks trends (line charts), chapter performance comparison (bar charts), follower growth over time
8. **Earnings & Payouts** (`CreatorEarnings`) — ad impression revenue tracking with 90/10 creator/platform split
9. **Multiple payout methods** — PayPal, Binance, USDT (TON), UPI, bKash — with withdrawal history
10. **Wallet section** — view balance, pending payouts, and total earned
11. **Community posts** — share updates with images (up to 4), engage with followers, pin posts
12. **Profile customization** — custom avatar (anime avatar picker), bio, display name, social links, profile theme
13. **Verified badge** — admin-granted verification for trusted creators

### For Admins
1. **Moderation** — approve/reject manhwa & chapters with email notifications, ban/unban users with reason, manage content reports
2. **User management** — search users by username/display name/IP/country, User Inspector tool (eye icon) for detailed account view
3. **Geolocation tracking** — IP, city, country captured during signup & login via ipapi.co for security auditing
4. **Content verification** — Telegram IDs (`TG ID` column) for cross-referencing uploaded files between admin panel and Telegram channel
5. **Revenue analytics** (`AdminRevenueAnalytics`) — daily/weekly/monthly ad impressions & revenue charts, top earning creators, platform vs creator earnings split (pie chart), unlock trends
6. **Payout management** (`AdminPayoutManager`) — process creator payout requests with status tracking (pending → processing → paid/rejected), response notes & screenshots
7. **Announcements** (`AdminAnnouncementManager`) — create site-wide banners (info, warning, success, urgent types) with scheduling, link support, and dismissible UI
8. **Blog & FAQ editor** (`AdminBlogEditor`) — publish SEO-optimized blog posts and FAQ articles with slug, thumbnail, SEO title/description/keywords
9. **User verification** — grant/revoke verified badges to trusted creators
10. **Admin mode toggle** — switch between Admin and Creator views without logging out
11. **Admin notifications** — real-time alerts for new submissions, reports, and payout requests
12. **Admin settings** — platform configuration and management tools
13. **Scheduled content publishing** — cron-based automatic chapter publishing via edge functions

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
- **20+ tables** — `manga`, `chapters`, `chapter_pages`, `profiles`, `user_roles`, `follows`, `comments`, `community_posts`, `community_replies`, `community_post_likes`, `community_post_bookmarks`, `user_library`, `reading_history`, `creator_earnings`, `payout_requests`, `payout_methods`, `ad_impressions`, `chapter_unlocks`, `announcements`, `blogs`, `reports`, `admin_notifications`, `user_notifications`, `schedule_upvotes`, etc.
- **Row-Level Security** on every table — role-based access (admin/publisher/reader)
- **16+ triggers** — auto-notifications, counter updates, Google indexing pings, timestamp management
- **Security Definer functions** — `has_role()` for recursive-safe RLS, `record_chapter_unlock()` and `record_ad_impression()` for revenue tracking, `increment_manga_views()`, `sync_community_post_counts()`, `search_creators()`

### Edge Functions
| Function | Purpose |
|----------|---------|
| `telegram-upload` | Upload covers & chapter pages to Telegram |
| `telegram-proxy` | Proxy file downloads from Telegram |
| `telegram-community` | Mirror community posts to Telegram channel |
| `telegram-comment` | Sync comments to Telegram threads |
| `send-email` | SMTP email for moderation actions, welcome emails, ban/unban notifications |
| `notify-google` | Ping Google Indexing API on content approval |
| `sitemap` | Dynamic XML sitemap generation |
| `publish-scheduled` | Cron job for scheduled chapter releases |
| `delete-account` | GDPR-compliant account deletion |
| `precache-images` | Warm image cache for popular content |
| `stremio-addon` | Stremio integration addon |

---

## 📊 Analytics & Charts

### Admin Dashboard
- **Dashboard Stats** — total manhwa, chapters, users, pending reviews, reports (card grid)
- **Revenue Analytics** — line/bar charts: daily/weekly/monthly ad impressions & revenue, top earning creators, platform vs creator split (pie chart), unlock trends
- **Payout Manager** — request table with status filters (pending/processing/paid/rejected), approval workflow with notes & screenshots

### Creator Dashboard
- **Views, likes, bookmarks trends** — line charts via Recharts
- **Chapter performance comparison** — bar charts
- **Follower growth** — over time tracking
- **Earnings breakdown** — revenue share, withdrawal history, balance tracking

**Charts library:** [Recharts](https://recharts.org)

---

## 🔔 Notification System

| Event | Recipient | Channel |
|-------|-----------|---------|
| Manhwa approved/rejected | Publisher | In-app + Email |
| Chapter approved/rejected | Publisher | In-app + Email |
| Account banned/unbanned | User | In-app + Email |
| New follower | Creator | In-app |
| New chapter (from followed) | Followers | In-app |
| New submission/report | Admin | Admin notifications |
| Welcome message | New user | Email (5s delay) |
| Payout status update | Creator | In-app |

All in-app notifications appear in the bell icon dropdown with real-time updates via Supabase Realtime.

---

## 🛡️ Security

- **RLS on all tables** — no data leaks even if frontend is compromised
- **Role-based access** — `admin`, `publisher`, `reader` via `user_roles` table + `has_role()` SECURITY DEFINER function
- **Content protection** — canvas rendering, watermarks, hidden file IDs, anti-piracy measures (disabled right-click, print screen, dev tools shortcuts)
- **CORS proxy** — Cloudflare Worker handles API proxying
- **Bot renderer** — SEO-optimized HTML served to crawlers (Google, Telegram, Twitter)
- **Geolocation tracking** — IP-based location capture for security auditing
- **Email verification** — required before account activation

---

## 🎨 UI/UX Features

- **Webtoon/Tapas-inspired design** — hero carousel, horizontal scroll rows, numbered rankings, genre filter chips
- **Three theme modes** — Light, Dark (navy-tinted), AMOLED (pure black)
- **Night Shift** — warm sepia filter for comfortable reading
- **Mobile-first** — bottom tab navigation, 3-dot menu with full access to all features including legal pages
- **Spotlight Search** — ⌘K / Ctrl+K instant search across all content
- **Profile hover cards** — quick preview of user profiles on hover
- **QR code sharing** — share manhwa links via QR codes
- **Social sharing** — share to Twitter, Facebook, Telegram, WhatsApp
- **Swipe discovery** — Tinder-style manhwa discovery on mobile
- **Community posts** — social feed with likes, replies, bookmarks, image uploads
- **Onboarding flow** — guided setup for new users and Google sign-in users

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

## 📄 Legal Pages

- [Terms of Service](/terms)
- [Privacy Policy](/privacy)
- [DMCA](/dmca)
- [Content Guidelines](/content-guidelines)
- [Cookie Policy](/cookie-policy)
- [Disclaimer](/disclaimer)

---

## 📧 Contact

**Support:** [support@komixora.fun](mailto:support@komixora.fun)
