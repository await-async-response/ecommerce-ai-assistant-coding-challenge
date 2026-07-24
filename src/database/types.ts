/**
 * TypeScript interfaces for the committed seed fixtures.
 *
 * These describe the shape of the JSON files in `data/seed/`, which are the
 * source of truth for the seeded database. Column semantics (integer cents,
 * ISO 8601 UTC timestamps, current vs. historical prices) are documented in
 * `CHALLENGE.md` and enforced by `src/database/schema.sql`.
 *
 * Keep this file minimal: it intentionally contains no query, repository, or
 * AI-agent types. Candidates are free to add their own types elsewhere.
 */

/** A row in `data/seed/users.json` (maps to the `users` table). */
export interface User {
  id: number;
  name: string;
  /** Reserved example domain address; never a real person's email. */
  email: string;
  /** ISO 8601 UTC timestamp, e.g. "2025-03-14T09:00:00.000Z". */
  created_at: string;
}

/** A row in `data/seed/products.json` (maps to the `products` table). */
export interface Product {
  id: number;
  name: string;
  sku: string;
  /** Current catalog price in integer cents (>= 0). */
  current_price_cents: number;
  /** ISO 8601 UTC timestamp. */
  created_at: string;
}

/** A row in `data/seed/orders.json` (maps to the `orders` table). */
export interface Order {
  id: number;
  /** References `users.id`. */
  user_id: number;
  /** ISO 8601 UTC timestamp the order was placed. */
  ordered_at: string;
}

/** A row in `data/seed/order-items.json` (maps to the `order_items` table). */
export interface OrderItem {
  id: number;
  /** References `orders.id`. */
  order_id: number;
  /** References `products.id`. */
  product_id: number;
  /** Number of units purchased (> 0). */
  quantity: number;
  /** Price charged per unit at purchase time, in integer cents (>= 0). */
  unit_price_cents: number;
}
