#!/bin/zsh
# ============================================
# SI-KEBOCORAN Setup & Deploy Script
# Jalankan di terminal terpisah: ./setup-and-deploy.sh
# ============================================

set -e  # Stop on any error

echo "🚀 SI-KEBOCORAN Setup & Deploy"
echo "================================"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"
echo ""

# Step 1: Check wrangler is installed
echo "1️⃣  Checking wrangler..."
if ! command -v wrangler &> /dev/null; then
    echo "   ❌ Wrangler not found. Installing..."
    npm install -g wrangler
else
    echo "   ✅ Wrangler found: $(wrangler --version)"
fi
echo ""

# Step 2: Login to Cloudflare (if needed)
echo "2️⃣  Checking Cloudflare login..."
if ! wrangler whoami &> /dev/null; then
    echo "   🔐 Please login to Cloudflare..."
    wrangler login
else
    echo "   ✅ Already logged in"
fi
echo ""

# Step 3: Create D1 Database
echo "3️⃣  Creating D1 database..."
echo "   Running: wrangler d1 create si-kebocoran-db"
echo ""

# Capture the output to extract database_id
DB_OUTPUT=$(wrangler d1 create si-kebocoran-db 2>&1 || true)
echo "$DB_OUTPUT"

# Extract database_id from output
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)

if [ -n "$DB_ID" ]; then
    echo ""
    echo "   ✅ Database created! ID: $DB_ID"
    
    # Update wrangler.toml with database_id
    echo "   📝 Updating wrangler.toml..."
    sed -i '' "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml
    echo "   ✅ wrangler.toml updated"
else
    echo ""
    echo "   ⚠️  Could not extract database_id automatically."
    echo "   Please update wrangler.toml manually with the database_id shown above."
    read -p "   Press Enter after updating wrangler.toml..."
fi
echo ""

# Step 4: Run database migration
echo "4️⃣  Running database migration..."
echo "   Running: wrangler d1 execute si-kebocoran-db --file=database/schema.sql"
wrangler d1 execute si-kebocoran-db --file=database/schema.sql
echo "   ✅ Schema created"
echo ""

# Step 5: Local test option
echo "5️⃣  Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 SI-KEBOCORAN siap untuk ditest!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opsi selanjutnya:"
echo ""
echo "  📍 Test lokal:"
echo "     wrangler pages dev src"
echo ""
echo "  🚀 Deploy ke production:"
echo "     wrangler pages deploy src"
echo ""
echo "  📦 Atau push ke GitHub & connect ke Cloudflare Pages Dashboard"
echo ""

read -p "Mau langsung test lokal sekarang? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌐 Starting local dev server..."
    echo "   Buka: http://localhost:8788"
    echo "   Ctrl+C untuk stop"
    echo ""
    wrangler pages dev src
fi
