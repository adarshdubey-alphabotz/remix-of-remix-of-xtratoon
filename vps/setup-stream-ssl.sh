#!/bin/bash
# ═══════════════════════════════════════════════
# Xtratoon Stream Backend - Nginx + SSL Setup
# Run: sudo bash vps/setup-stream-ssl.sh
# ═══════════════════════════════════════════════

set -e

DOMAIN="xtratoon-stream.duckdns.org"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Setting up Nginx reverse proxy + SSL for $DOMAIN"

# 1. Install Nginx & Certbot if not present
echo "📦 Installing Nginx & Certbot..."
apt update -y
apt install -y nginx certbot python3-certbot-nginx

# 2. Find Nginx config directory
if [ -d "/etc/nginx/conf.d" ]; then
    NGINX_DIR="/etc/nginx/conf.d"
    CONF_FILE="$NGINX_DIR/stream.conf"
elif [ -d "/etc/nginx/sites-available" ]; then
    NGINX_DIR="/etc/nginx/sites-available"
    CONF_FILE="$NGINX_DIR/stream"
else
    # Create conf.d if nothing exists
    mkdir -p /etc/nginx/conf.d
    NGINX_DIR="/etc/nginx/conf.d"
    CONF_FILE="$NGINX_DIR/stream.conf"
    
    # Make sure nginx.conf includes conf.d
    if ! grep -q "include /etc/nginx/conf.d" /etc/nginx/nginx.conf 2>/dev/null; then
        # Add include directive before the last closing brace
        sed -i '/^}/i \    include /etc/nginx/conf.d/*.conf;' /etc/nginx/nginx.conf
    fi
fi

echo "📁 Using Nginx config directory: $NGINX_DIR"

# 3. Copy config
cp "$SCRIPT_DIR/nginx/stream.conf" "$CONF_FILE"
echo "✅ Config copied to $CONF_FILE"

# 4. Enable site (only for sites-available setup)
if [ "$NGINX_DIR" = "/etc/nginx/sites-available" ]; then
    ln -sf "$CONF_FILE" /etc/nginx/sites-enabled/stream
    echo "✅ Site enabled"
fi

# 5. Test & reload Nginx
echo "🔍 Testing Nginx config..."
nginx -t

echo "🔄 Reloading Nginx..."
systemctl reload nginx

# 6. Get SSL certificate
echo "🔒 Getting SSL certificate for $DOMAIN..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || {
    echo ""
    echo "⚠️  Auto SSL failed. Run manually:"
    echo "   sudo certbot --nginx -d $DOMAIN"
    echo ""
}

echo ""
echo "✅ Done! Your stream backend should be available at:"
echo "   https://$DOMAIN"
echo ""
echo "📝 Next steps:"
echo "   1. Set VITE_STREAM_BACKEND_URL=https://$DOMAIN in Vercel"
echo "   2. Update backend/.env CORS_ORIGINS to include your Vercel domain"
echo "   3. Redeploy on Vercel"
