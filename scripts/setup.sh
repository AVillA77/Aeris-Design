#!/bin/sh
# Aeris Finance — first-time setup
set -e

echo "==> Aeris Finance Setup"

# Generate a random JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

# Create .env for backend
if [ ! -f apps/backend/.env ]; then
  cat > apps/backend/.env <<EOF
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://aeris:aeris_secret@localhost:5432/aeris_finance
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=15m
CORS_ORIGIN=http://localhost:5173
EOF
  echo "    Created apps/backend/.env"
else
  echo "    apps/backend/.env already exists, skipping"
fi

# Create .env for web
if [ ! -f apps/web/.env ]; then
  cat > apps/web/.env <<EOF
VITE_API_URL=http://localhost:3000/api
EOF
  echo "    Created apps/web/.env"
else
  echo "    apps/web/.env already exists, skipping"
fi

# Create .env.docker with the same secret
if [ ! -f .env.docker ] || ! grep -q "JWT_SECRET=." .env.docker; then
  cat > .env.docker <<EOF
JWT_SECRET=${JWT_SECRET}
EOF
  echo "    Created .env.docker"
fi

echo ""
echo "==> Setup complete. Next steps:"
echo ""
echo "  Option A — Docker (recommended, no local Postgres needed):"
echo "    docker-compose --env-file .env.docker up --build"
echo "    Open http://localhost:8080"
echo ""
echo "  Option B — Local development:"
echo "    1. Start Postgres and create DB: createdb aeris_finance"
echo "    2. Install deps: pnpm install"
echo "    3. Start backend: cd apps/backend && pnpm dev"
echo "    4. Start web:     cd apps/web     && pnpm dev"
echo "    Open http://localhost:5173"
echo ""
