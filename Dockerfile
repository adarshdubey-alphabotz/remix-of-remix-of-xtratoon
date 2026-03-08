# ─── Build args for proxied backend ───
# For VPS deployment: all Supabase traffic goes through nginx reverse proxy
# so the real backend URL is never exposed to the browser.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install
COPY . .

# Build-time env vars — nginx proxies these paths to the real backend
ENV VITE_SUPABASE_URL=https://jgrwrgdhagbmihmqhbvc.supabase.co
ENV VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_UwWHYKPJYwt03UHcIc1DNw_o-05mvN8
ENV VITE_SUPABASE_PROJECT_ID=jgrwrgdhagbmihmqhbvc

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
