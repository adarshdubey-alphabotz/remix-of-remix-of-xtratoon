# ─── Komixora VPS Deployment ───
# On VPS: create .env.local with your own Supabase credentials
# Vite automatically picks up .env.local over .env

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install
COPY . .

# If .env.local exists it overrides .env automatically (Vite priority)
# No special COPY needed — "COPY . ." already includes it

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
