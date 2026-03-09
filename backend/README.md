# Xtratoon Backend

This folder is reserved for custom backend integrations (e.g. Stremio, Node.js APIs, etc.).

## Current Architecture

The project uses **Supabase** as its primary backend. All existing backend logic lives in:

| Component | Location | Description |
|-----------|----------|-------------|
| Edge Functions | `supabase/functions/` | Serverless functions (Deno runtime) |
| Database Schema | `SETUP_SCHEMA.sql` | Full DB setup (tables, RLS, triggers, functions) |
| DB Migrations | `supabase/migrations/` | Incremental schema changes |
| Config | `supabase/config.toml` | Supabase project configuration |
| Types | `src/integrations/supabase/types.ts` | Auto-generated TypeScript types |
| Client | `src/integrations/supabase/client.ts` | Auto-generated Supabase client |

### Existing Edge Functions

| Function | Purpose |
|----------|---------|
| `delete-account` | Account deletion with cleanup |
| `send-email` | Gmail SMTP email sending (payout notifications) |
| `publish-scheduled` | Auto-publish scheduled chapters |
| `precache-images` | Image precaching via Telegram CDN |
| `sitemap` | Dynamic sitemap generation |
| `telegram-upload` | Upload chapter pages via Telegram Bot |
| `telegram-comment` | Sync comments to Telegram |
| `telegram-community` | Sync community posts to Telegram |
| `telegram-proxy` | Proxy Telegram file downloads |

### Database Tables (17+)

`manga`, `chapters`, `chapter_pages`, `profiles`, `user_roles`, `user_library`, `reading_history`, `comments`, `community_posts`, `community_replies`, `community_post_likes`, `community_post_bookmarks`, `follows`, `reports`, `admin_notifications`, `user_notifications`, `creator_earnings`, `ad_impressions`, `chapter_unlocks`, `payout_methods`, `payout_requests`, `blogs`

## Frontend

The React frontend lives at the **project root** (required by Lovable/Vite):

```
/                    ← Frontend root (DO NOT move)
├── src/             ← React components, pages, hooks
├── public/          ← Static assets
├── index.html       ← Entry point
├── vite.config.ts   ← Vite config
├── package.json     ← Frontend dependencies
└── tailwind.config.ts
```

## Adding Your Backend Here

Place your custom backend code in this `/backend` folder. Example structure:

```
backend/
├── package.json       ← Your backend dependencies
├── Dockerfile         ← Backend container config
├── src/
│   └── index.ts       ← Entry point
├── routes/            ← API routes
└── services/          ← Business logic
```

### Docker Compose (VPS)

Update the root `docker-compose.yml` to add your backend service:

```yaml
services:
  web:
    # ... existing frontend service
  
  backend:
    build:
      context: ./backend
    ports:
      - "3001:3001"
    env_file:
      - ./backend/.env
    restart: unless-stopped
```

### Environment Variables

Create `backend/.env` (gitignored) for secrets. The frontend connects to Supabase directly — your backend service can also connect using the Supabase client SDK or REST API.

### Connecting Frontend to Custom Backend

From the React app, call your backend API:

```typescript
// In frontend code
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const res = await fetch(`${BACKEND_URL}/api/your-endpoint`);
```

Add `VITE_BACKEND_URL` to your `.env` / Vercel env vars for production.
