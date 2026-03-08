# Edge Function Secrets Setup

Go to your Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**

Add these secrets:

## Required Secrets

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `SUPABASE_URL` | Your Supabase project URL | Settings → API → "Project URL" |
| `SUPABASE_ANON_KEY` | Your anon/public key | Settings → API → "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret!) | Settings → API → "service_role" |

## Telegram Secrets

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `TELEGRAM_BOT_TOKEN` | Your bot token | [@BotFather](https://t.me/BotFather) → /newbot |
| `TELEGRAM_CHANNEL_ID` | Main channel for manga files | Right-click channel → Copy Link, or use [@userinfobot](https://t.me/userinfobot) |
| `TELEGRAM_COMMUNITY_CHANNEL_ID` | Channel for community posts | Same as above |
| `TELEGRAM_COMMENT_CHANNEL_ID` | Channel for comments | Same as above |

## How to Get Telegram Channel ID

1. Add your bot as admin to the channel
2. Send a message to the channel
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find `"chat":{"id":-100XXXXXXXXXX}` - that's your channel ID

## Example Values

```
SUPABASE_URL = https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN = 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID = -1001234567890
TELEGRAM_COMMUNITY_CHANNEL_ID = -1001234567891
TELEGRAM_COMMENT_CHANNEL_ID = -1001234567892
```

## Deploy Edge Functions

After setting secrets, deploy the edge functions using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy all functions
supabase functions deploy telegram-upload
supabase functions deploy telegram-proxy
supabase functions deploy telegram-community
supabase functions deploy telegram-comment
supabase functions deploy publish-scheduled
supabase functions deploy sitemap
supabase functions deploy delete-account
```
