# ─── Build args for proxied backend ───
# For VPS deployment: all Supabase traffic goes through nginx reverse proxy
# so the real backend URL is never exposed to the browser.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install
COPY . .

# Build-time env vars — nginx proxies these paths to the real backend
ENV VITE_SUPABASE_URL=http://69.197.168.220
ENV VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eW51aWdhYml3Zmd2d3ZqcnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTQ2MzcsImV4cCI6MjA4ODQ3MDYzN30.gEnvS07twhUS5i27SruCKy6G83GZrcbjENG2-ZBV_1g
ENV VITE_SUPABASE_PROJECT_ID=nyynuigabiwfgvwvjrvh

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
