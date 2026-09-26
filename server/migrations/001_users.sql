CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client'
    CHECK (role IN ('client', 'admin', 'analyst')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
