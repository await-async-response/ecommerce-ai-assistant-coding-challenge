-- E-Commerce AI Analytics Assistant: database schema
--
-- Conventions:
--   * All timestamps are ISO 8601 strings in UTC (e.g. "2026-07-20T12:00:00.000Z").
--   * All monetary values are stored as integer cents. There are no floating-point
--     money columns anywhere in this schema.
--   * `products.current_price_cents` is the current catalog price.
--   * `order_items.unit_price_cents` is the price actually charged at purchase time,
--     which may differ from the product's current catalog price. Historical order
--     values must be computed from `order_items.unit_price_cents`.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE products (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  sku                 TEXT NOT NULL UNIQUE,
  current_price_cents INTEGER NOT NULL CHECK (current_price_cents >= 0),
  created_at          TEXT NOT NULL
);

CREATE TABLE orders (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  ordered_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE order_items (
  id               INTEGER PRIMARY KEY,
  order_id         INTEGER NOT NULL,
  product_id       INTEGER NOT NULL,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  FOREIGN KEY (order_id) REFERENCES orders (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Indexes to support common analytical access patterns.
CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_ordered_at ON orders (ordered_at);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
