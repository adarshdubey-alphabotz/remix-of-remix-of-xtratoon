# ─── Build args for proxied backend ───
# When deploying to VPS, the frontend calls /rest/, /auth/, /functions/
# through nginx reverse proxy instead of hitting Supabase directly.
#
# This keeps the real backend URL hidden from browser DevTools.

# For VPS deployment, set these in your .env.production:
# VITE_SUPABASE_URL=https://xtratoon.com
# (nginx proxies /rest/, /auth/, /functions/ to the real backend)

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install
COPY . .

# Override Supabase URL to use nginx proxy (hides real backend)
ENV VITE_SUPABASE_URL=https://xtratoon.com

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
