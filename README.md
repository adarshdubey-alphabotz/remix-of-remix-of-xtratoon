<p align="center">
  <img src="src/assets/logo-komixora-1.png" alt="Komixora Logo" width="200" />
</p>

<h1 align="center">KOMIXORA</h1>

<p align="center">
  <strong>The Ultimate Manhwa Platform — Read, Create, Earn</strong>
</p>

<p align="center">
  <a href="https://komixora.fun">🌐 Live Site</a> •
  <a href="#features">✨ Features</a> •
  <a href="#architecture">🏗️ Architecture</a> •
  <a href="#self-hosting">🛠️ Self-Hosting</a> •
  <a href="#api">📡 API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Telegram-Storage-26A5E4?style=flat-square&logo=telegram" alt="Telegram" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
</p>

---

## 📖 Overview

Komixora is a full-stack manhwa/manga reading and publishing platform. Creators upload content via Telegram bots, readers discover and follow series, and the platform handles monetization, moderation, SEO, and community features — all powered by Supabase + Telegram as a CDN.

---

## ✨ Features

### 📚 Reader Experience
| Feature | Description |
|---------|-------------|
| **Browse & Discover** | Filter by genre, status, language with infinite scroll |
| **Manhwa Reader** | Full-screen vertical scroll reader with progress tracking |
| **Personal Library** | Track reading status: Reading, Completed, Plan to Read, Dropped, On Hold |
| **Reading History** | Auto-saved page progress, resume where you left off |
| **Bookmarks** | Save community posts and manhwa to your library |
| **Night Shift Mode** | Warm color filter for comfortable night reading |
| **Dark/Light Theme** | System-aware theme with manual toggle |
| **Swipe Discover** | Tinder-style swipe to discover new manhwa |
| **Top Charts** | Ranked manhwa by views, likes, bookmarks |

### 🎨 Creator/Publisher Tools
| Feature | Description |
|---------|-------------|
| **Publisher Dashboard** | Upload manhwa, manage chapters, view analytics |
| **Telegram Upload** | Upload chapters via Telegram bot — files stored on Telegram CDN |
| **Creator Analytics** | Views, likes, bookmarks, follower trends with charts |
| **Revenue System** | CPM-based earnings from ad impressions + chapter unlocks |
| **Payout System** | Request payouts via PayPal, Binance, USDT (TON), UPI, bKash |
| **Scheduled Publishing** | Schedule chapters for future release |
| **Verified Badge** | Admin-granted verification for trusted creators |

### 🛡️ Admin & Moderation
| Feature | Description |
|---------|-------------|
| **Content Approval** | Manhwa & chapters require admin approval before going live |
| **ID Matching** | Short IDs in admin panel match Telegram channel captions |
| **User Banning** | Ban/unban users with reason — triggers email + in-app notification |
| **Content Deletion** | Soft-delete community posts (7-day recovery window) |
| **Report System** | Users report manhwa → admin gets notification |
| **Announcement System** | Site-wide banners with scheduling and link support |
| **Admin Blog** | CMS for blog posts and FAQs with SEO fields |
| **Revenue Analytics** | Platform-wide earnings, creator breakdown, payout tracking |
| **Admin Settings** | Real-time site analytics, moderation controls, system logs |

### 📧 Notification System
| Channel | Events |
|---------|--------|
| **Email (SMTP)** | Banned, Unbanned, Manhwa Approved/Rejected, Chapter Approved/Rejected, Content Deleted, Welcome |
| **In-App Bell** | Manhwa/Chapter Approved/Rejected, New Follower, Unbanned, New Chapter (followers) |
| **Admin Panel** | New Submission, New Chapter Upload, New Report |

### 💬 Community
| Feature | Description |
|---------|-------------|
| **Community Posts** | Create text + image posts, synced to Telegram |
| **Post Reactions** | Like, bookmark, share posts |
| **Replies** | Threaded replies on posts, synced to Telegram |
| **Share Modal** | Share to Twitter, Facebook, Telegram, WhatsApp, copy link, QR code |
| **Profile Hover Card** | Quick-view user profile on hover |

### 🔍 SEO & Performance
| Feature | Description |
|---------|-------------|
| **Dynamic Meta Tags** | Per-page title, description, OG image via Cloudflare Worker |
| **JSON-LD** | Structured data for manhwa, chapters, blog posts, publishers |
| **Sitemap** | Dynamic sitemap generated via Edge Function |
| **Google Indexing API** | Auto-notifies Google when content is approved |
| **Bot Renderer** | Cloudflare Worker serves pre-rendered HTML to crawlers |
| **Lazy Loading** | Images load on scroll for performance |
| **Canonical Tags** | Proper canonical URLs to prevent duplicate content |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKER                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Bot Render  │  │  API Proxy   │  │  User Proxy   │  │
│  │  (SEO bots)  │  │ (CORS/Auth)  │  │  (→ Vercel)   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌──────────────────┐ ┌──────────┐ ┌──────────────┐
│   React SPA      │ │ Supabase │ │  Telegram    │
│   (Vercel)       │ │ Backend  │ │  CDN         │
│                  │ │          │ │              │
│ • React 18       │ │ • Auth   │ │ • Covers     │
│ • TypeScript     │ │ • DB     │ │ • Chapters   │
│ • Tailwind CSS   │ │ • RLS    │ │ • Comments   │
│ • Framer Motion  │ │ • Edge   │ │ • Community  │
│ • React Query    │ │   Funcs  │ │   Posts      │
│ • React Router   │ │ • Storage│ │              │
└──────────────────┘ └──────────┘ └──────────────┘
```

### Database Schema (24 Tables)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │     │    manga     │     │   chapters   │
│──────────────│     │──────────────│     │──────────────│
│ user_id      │◄────│ creator_id   │     │ manga_id(FK) │
│ username     │     │ title        │────►│ chapter_num  │
│ display_name │     │ slug         │     │ approval_st  │
│ avatar_url   │     │ genres[]     │     │ scheduled_at │
│ is_banned    │     │ approval_st  │     │ views        │
│ is_verified  │     │ cover_url    │     └──────┬───────┘
│ role_type    │     │ views/likes  │            │
└──────────────┘     └──────────────┘     ┌──────┴───────┐
       │                                  │ chapter_pages│
┌──────┴───────┐     ┌──────────────┐     │──────────────│
│  user_roles  │     │   follows    │     │ telegram_id  │
│──────────────│     │──────────────│     │ page_number  │
│ user_id      │     │ follower_id  │     └──────────────┘
│ role (enum)  │     │ creator_id   │
└──────────────┘     └──────────────┘     ┌──────────────┐
                                          │  comments    │
┌──────────────┐     ┌──────────────┐     │──────────────│
│ user_library │     │reading_hist  │     │ manga_id(FK) │
│──────────────│     │──────────────│     │ user_id      │
│ manga_id(FK) │     │ manga_id(FK) │     │ content      │
│ user_id      │     │ chapter_id   │     └──────────────┘
│ status       │     │ page_number  │
└──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ community_   │     │ community_   │     │ community_   │
│ posts        │     │ replies      │     │ post_likes   │
│──────────────│     │──────────────│     │──────────────│
│ creator_id   │     │ post_id(FK)  │     │ post_id(FK)  │
│ content      │     │ user_id      │     │ user_id      │
│ image_urls[] │     └──────────────┘     └──────────────┘
│ is_pinned    │
└──────────────┘     ┌──────────────┐     ┌──────────────┐
                     │ creator_     │     │ payout_      │
┌──────────────┐     │ earnings     │     │ requests     │
│ manga_likes  │     │──────────────│     │──────────────│
│──────────────│     │ creator_id   │     │ user_id      │
│ manga_id(FK) │     │ est_revenue  │     │ amount       │
│ user_id      │     │ creator_shr  │     │ status       │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   reports    │     │ admin_notifs │     │ user_notifs  │
│──────────────│     │──────────────│     │──────────────│
│ manga_id(FK) │     │ type/title   │     │ user_id      │
│ reason       │     │ reference_id │     │ type/title   │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ announcements│     │    blogs     │     │ad_impressions│
│──────────────│     │──────────────│     │──────────────│
│ title/message│     │ title/slug   │     │ chapter_id   │
│ is_active    │     │ is_published │     │ creator_id   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Edge Functions (12)

| Function | Purpose | Auth |
|----------|---------|------|
| `telegram-upload` | Upload chapters via Telegram bot | JWT |
| `telegram-proxy` | Proxy Telegram file downloads | Public |
| `telegram-community` | Sync community posts to Telegram | Public |
| `telegram-comment` | Sync comments to Telegram | JWT |
| `notify-user` | Send SMTP emails for moderation events | Public |
| `send-email` | Raw SMTP email sender (Gmail STARTTLS) | Public |
| `notify-google` | Google Indexing API notification | Public |
| `publish-scheduled` | Publish scheduled chapters (cron) | Public |
| `sitemap` | Dynamic XML sitemap generator | Public |
| `stremio-addon` | Stremio addon manifest | Public |
| `delete-account` | GDPR account deletion | JWT |
| `precache-images` | Warm image cache | JWT |

### Database Triggers (18)

| Trigger | Table | Action |
|---------|-------|--------|
| `on_auth_user_created` | `auth.users` | Create profile + reader role |
| `on_new_manga_submission` | `manga` | Admin notification |
| `on_manga_status_change` | `manga` | Publisher in-app notif |
| `on_manga_approved_google` | `manga` | Google Indexing API |
| `on_new_chapter_upload` | `chapters` | Admin notification |
| `on_chapter_status_change` | `chapters` | Publisher in-app notif |
| `on_chapter_approved_google` | `chapters` | Google Indexing API |
| `on_chapter_approved_notify_followers` | `chapters` | Follower notifications |
| `on_new_report` | `reports` | Admin notification |
| `on_user_unbanned` | `profiles` | User in-app notif |
| `on_new_follower` | `follows` | Creator in-app notif |
| `on_reply_insert/delete` | `community_replies` | Update reply count |
| `on_like_insert/delete` | `community_post_likes` | Update like count |
| `set_updated_at_*` | 4 tables | Auto-update timestamp |

### Database Functions (15)

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Create profile + role on signup |
| `has_role(user_id, role)` | Check user role (security definer) |
| `search_creators(term)` | Full-text search on publishers |
| `record_ad_impression(...)` | Track ad views (8h cooldown) |
| `record_chapter_unlock(...)` | Track unlocks (8h cooldown) |
| `notify_admin_new_submission()` | Alert admin on new manhwa |
| `notify_admin_new_chapter()` | Alert admin on new chapter |
| `notify_admin_new_report()` | Alert admin on report |
| `notify_publisher_manga_status()` | Notify on manga approval/rejection |
| `notify_publisher_chapter_status()` | Notify on chapter approval/rejection |
| `notify_google_on_manga_approved()` | Index manhwa on Google |
| `notify_google_on_chapter_approved()` | Index chapter on Google |
| `notify_followers_new_chapter()` | Notify followers of new release |
| `notify_user_unbanned()` | Notify user when unbanned |
| `notify_new_follower()` | Notify creator of new follower |

---

## 🔐 Security

### Row-Level Security (RLS)

All 24 tables have RLS enabled:

- **Profiles**: Public read, self-update, admin-update
- **Manga/Chapters**: Public read (approved only), creator CRUD, admin override
- **User Library/History**: Private to owner
- **Comments**: Public read, authenticated write, self/admin delete
- **Community**: Public read, creator CRUD, admin moderation
- **Admin tables**: Admin-only via `has_role()` security definer
- **Earnings/Payouts**: Creator self-view, admin full access

### Auth Flow

```
Signup → Email Verification → Profile Created (trigger)
       → Reader Role Assigned (trigger)
       → Welcome Email Sent (5s delay)
```

---

## 🛠️ Self-Hosting

### Prerequisites

- Supabase instance (self-hosted or cloud)
- Telegram Bot (@BotFather)
- Gmail with App Password
- Node.js 18+ / Bun

### 1. Database

```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/komixora-full-setup.sql
```

### 2. Secrets (Dashboard → Settings → Edge Functions)

| Secret | Source |
|--------|--------|
| `TELEGRAM_BOT_TOKEN` | @BotFather |
| `TELEGRAM_CHANNEL_ID` | Manga storage channel ID |
| `TELEGRAM_COMMUNITY_CHANNEL_ID` | Community posts channel ID |
| `TELEGRAM_COMMENT_CHANNEL_ID` | Comments channel ID |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail App Password |

### 3. Deploy Edge Functions

```bash
supabase functions deploy --all
```

### 4. Frontend

```bash
bun install
echo 'VITE_SUPABASE_URL=https://your-project.supabase.co' > .env
echo 'VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key' >> .env
bun run build
```

### 5. First Admin User

```sql
INSERT INTO public.user_roles (user_id, role) VALUES ('<your-uuid>', 'admin');
```

### 6. Cloudflare Worker (Optional — SEO)

Deploy `cloudflare-worker/worker.js` with routes for your domain.

---

## 📡 API Examples

```typescript
import { supabase } from "@/integrations/supabase/client";

// Browse approved manga
const { data } = await supabase
  .from('manga')
  .select('*')
  .eq('approval_status', 'APPROVED');

// Search creators
const { data } = await supabase
  .rpc('search_creators', { search_term: 'artist' });

// Send notification email
await supabase.functions.invoke('notify-user', {
  body: {
    event: 'manga_approved', // banned|unbanned|manga_approved|manga_rejected|chapter_approved|chapter_rejected|content_deleted|welcome
    user_id: 'uuid',
    details: { title: 'My Manhwa' }
  }
});
```

---

## 📊 Monetization

```
Chapter View → Ad Impression (8h cooldown) → CPM $0.01/1000
  ├── 90% → Creator Share
  └── 10% → Platform Share
Creator requests payout → Admin processes (PayPal/Binance/USDT/UPI/bKash)
```

---

## 🎨 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| State | TanStack React Query, React Context |
| Routing | React Router v6 |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions, Storage) |
| CDN | Telegram Bot API |
| Email | Gmail SMTP via Edge Function |
| SEO | Cloudflare Worker (bot renderer + API proxy) |
| Charts | Recharts |
| Hosting | Vercel (frontend) + Supabase (backend) |

---

## 📂 Project Structure

```
komixora/
├── cloudflare-worker/worker.js    # SEO bot renderer + API proxy
├── public/                        # Static assets
├── src/
│   ├── assets/                    # Images, logos
│   ├── components/                # 50+ React components
│   │   ├── ui/                    # shadcn/ui (40+)
│   │   ├── Admin*.tsx             # Admin tools
│   │   ├── NotificationCenter.tsx # In-app notifications
│   │   └── ...
│   ├── contexts/AuthContext.tsx   # Auth + welcome email
│   ├── hooks/                     # Custom hooks
│   ├── integrations/supabase/     # Auto-generated client
│   ├── pages/                     # 25+ route pages
│   └── lib/                       # Utilities
├── supabase/
│   ├── config.toml                # Edge function config
│   ├── komixora-full-setup.sql    # Complete DB schema
│   └── functions/                 # 12 Edge Functions
└── package.json
```

---

<p align="center">Built with ❤️ by the Komixora Team</p>
