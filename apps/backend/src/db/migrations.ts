import { db } from './client.js';

const migrations = [
  `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#6366f1',
    icon        TEXT,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS transactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type           TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount         NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description    TEXT NOT NULL DEFAULT '',
    date           DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
    category_id    UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_type      ON transactions(type);
  `,
  `
  CREATE TABLE IF NOT EXISTS budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount > 0),
    period      TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'yearly')),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (category_id, user_id, period)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       TEXT NOT NULL UNIQUE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
  `,
];

export async function runMigrations() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      version    INT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const { rows } = await db.query('SELECT version FROM schema_migrations ORDER BY version');
  const applied = new Set(rows.map((r: { version: number }) => r.version));

  for (let i = 0; i < migrations.length; i++) {
    const version = i + 1;
    if (applied.has(version)) continue;

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(migrations[i]);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await client.query('COMMIT');
      console.log(`Migration ${version} applied`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('All migrations up to date');
}
