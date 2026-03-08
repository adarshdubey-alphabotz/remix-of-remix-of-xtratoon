# ─── Xtratoon VPS Deployment ───
# Replace these with YOUR OWN Supabase project credentials from supabase.com

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install
COPY . .

# ⚠️ REPLACE THESE WITH YOUR OWN SUPABASE CREDENTIALS ⚠️
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
# Copy .env.local if it exists (overrides .env at build time)
COPY .env.local* ./

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
