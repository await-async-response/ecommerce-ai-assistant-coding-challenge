/**
 * Create (or reset) the SQLite database from the committed seed fixtures.
 *
 *   npm run db:create        # create; refuses to overwrite an existing database
 *   npm run db:reset         # delete and recreate (passes --reset)
 *
 * This script only sets up the starter database. It contains no application,
 * analytics, or AI-agent logic.
 */

import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { openDatabase, resolveDatabasePath, REPO_ROOT } from '../src/database/connection.ts';
import type { User, Product, Order, OrderItem } from '../src/database/types.ts';

const SEED_DIR = path.resolve(REPO_ROOT, 'data', 'seed');
const SCHEMA_PATH = path.resolve(REPO_ROOT, 'src', 'database', 'schema.sql');

function loadFixture<T>(file: string): T[] {
  const raw = readFileSync(path.resolve(SEED_DIR, file), 'utf8');
  return JSON.parse(raw) as T[];
}

function main(): void {
  const reset = process.argv.includes('--reset');
  const dbPath = resolveDatabasePath();

  // Ensure the parent directory exists.
  mkdirSync(path.dirname(dbPath), { recursive: true });

  if (existsSync(dbPath)) {
    if (!reset) {
      console.error(
        `Refusing to overwrite existing database at:\n  ${dbPath}\n\n` +
          'Run `npm run db:reset` (or pass --reset) to delete and recreate it.',
      );
      process.exit(1);
    }
    // Remove the database and any WAL/SHM sidecar files.
    for (const suffix of ['', '-wal', '-shm']) {
      const target = `${dbPath}${suffix}`;
      if (existsSync(target)) rmSync(target);
    }
  }

  const users = loadFixture<User>('users.json');
  const products = loadFixture<Product>('products.json');
  const orders = loadFixture<Order>('orders.json');
  const orderItems = loadFixture<OrderItem>('order-items.json');

  const schema = readFileSync(SCHEMA_PATH, 'utf8');

  const db = openDatabase({ path: dbPath });
  try {
    db.exec(schema);
    db.pragma('foreign_keys = ON');

    const insertUser = db.prepare(
      'INSERT INTO users (id, name, email, created_at) VALUES (@id, @name, @email, @created_at)',
    );
    const insertProduct = db.prepare(
      'INSERT INTO products (id, name, sku, current_price_cents, created_at) ' +
        'VALUES (@id, @name, @sku, @current_price_cents, @created_at)',
    );
    const insertOrder = db.prepare(
      'INSERT INTO orders (id, user_id, ordered_at) VALUES (@id, @user_id, @ordered_at)',
    );
    const insertOrderItem = db.prepare(
      'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents) ' +
        'VALUES (@id, @order_id, @product_id, @quantity, @unit_price_cents)',
    );

    // Insert everything atomically. better-sqlite3 rolls the transaction back
    // automatically if any statement throws (for example a FK violation).
    const seed = db.transaction(() => {
      for (const u of users) insertUser.run(u);
      for (const p of products) insertProduct.run(p);
      for (const o of orders) insertOrder.run(o);
      for (const oi of orderItems) insertOrderItem.run(oi);
    });
    seed();

    // Surface any foreign-key inconsistencies explicitly.
    const fkViolations = db.pragma('foreign_key_check') as unknown[];
    if (fkViolations.length > 0) {
      throw new Error(`foreign_key_check reported ${fkViolations.length} violation(s)`);
    }

    console.log('Database created successfully.');
    console.log(`  path:        ${dbPath}`);
    console.log(`  users:       ${users.length}`);
    console.log(`  products:    ${products.length}`);
    console.log(`  orders:      ${orders.length}`);
    console.log(`  order_items: ${orderItems.length}`);
  } finally {
    db.close();
  }
}

try {
  main();
} catch (err) {
  console.error('Failed to create database:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
