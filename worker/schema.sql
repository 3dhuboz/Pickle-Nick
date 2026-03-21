-- Pickle Nick D1 Schema

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price       REAL NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0,
  image       TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT '',
  featured    INTEGER NOT NULL DEFAULT 0,
  weight      INTEGER,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  image       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL DEFAULT 'guest',
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  subtotal         REAL NOT NULL,
  tax              REAL NOT NULL DEFAULT 0,
  shipping_cost    REAL NOT NULL DEFAULT 0,
  shipping_method  TEXT,
  total            REAL NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  payment_status   TEXT NOT NULL DEFAULT 'unpaid',
  payment_method   TEXT,
  transaction_id   TEXT,
  created_at       TEXT NOT NULL,
  tracking_number  TEXT,
  no_tracking      INTEGER NOT NULL DEFAULT 0,
  updated_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity   INTEGER NOT NULL,
  price      REAL NOT NULL,
  name       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'customer',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_orders (
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, order_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id               TEXT PRIMARY KEY,
  platform         TEXT NOT NULL,
  content          TEXT NOT NULL DEFAULT '',
  image_url        TEXT,
  scheduled_time   TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft',
  hashtags         TEXT NOT NULL DEFAULT '[]',
  image_prompt     TEXT,
  reasoning        TEXT,
  pillar           TEXT,
  topic            TEXT,
  publish_error    TEXT,
  publish_attempts INTEGER NOT NULL DEFAULT 0,
  updated_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY DEFAULT 'main',
  data       TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY DEFAULT 'main',
  data       TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status      ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled   ON posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
