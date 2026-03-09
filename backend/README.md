# Xtratoon Stream Backend

Fast Telegram file streaming backend using MTProto via GramJS.

## Setup

### 1. Get Telegram API credentials
Go to [https://my.telegram.org/apps](https://my.telegram.org/apps) and create an app to get:
- `API_ID`
- `API_HASH`

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Install dependencies
```bash
cd backend
npm install
```

### 4. Generate session (one-time)
```bash
npm run auth
# Copy the TELEGRAM_SESSION value into .env
```

### 5. Run
```bash
# Development
npm run dev

# Production
npm run build && npm start

# Docker
docker compose up -d stream
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/stream?file_id=XXX` | Stream a file (supports Range headers) |
| `GET /api/stream?page_id=XXX` | Stream by chapter page ID |
| `GET /api/info?file_id=XXX` | Get file metadata |
| `GET /api/catalog` | List approved manga |
| `GET /api/chapters/:mangaId` | List chapters |
| `GET /api/pages/:chapterId` | List pages with stream URLs |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_API_ID` | ✅ | From my.telegram.org |
| `TELEGRAM_API_HASH` | ✅ | From my.telegram.org |
| `TELEGRAM_BOT_TOKEN` | ✅ | From @BotFather |
| `TELEGRAM_CHANNEL_ID` | ✅ | Channel where files are stored |
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |
| `PORT` | ❌ | Default: 3001 |
| `CORS_ORIGINS` | ❌ | Comma-separated allowed origins |
| `TELEGRAM_SESSION` | ❌ | Generated via `npm run auth` |

## Frontend Integration

Set in your root `.env`:
```
VITE_STREAM_BACKEND_URL=http://your-vps-ip:3001
```

The frontend `imageUrl.ts` will automatically use this backend for all image loading.
