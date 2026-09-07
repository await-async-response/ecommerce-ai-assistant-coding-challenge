import type { Database as DatabaseType } from 'better-sqlite3';
import type { QuestionIntent } from '../ai/intent-parser.ts';

export interface AnalyticsAnswer {
  title: string;
  rows: Array<Record<string, string | number>>;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatInt(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function normalizeQuestion(question: string): string {
  return question.trim().replace(/\s+/g, ' ');
}

function extractNamedValue(question: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/[?.,!]+$/g, '').trim();
    }
  }
  return null;
}

function extractDaysWindow(question: string): number | null {
  const match = question.match(/last\s+(\d+)\s+day(s)?/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function getLatestOrderTimestamp(db: DatabaseType): string {
  const row = db
    .prepare('SELECT MAX(ordered_at) AS latest_ordered_at FROM orders')
    .get() as { latest_ordered_at: string } | undefined;

  return row?.latest_ordered_at ?? '1970-01-01T00:00:00.000Z';
}

export function answerQuestion(question: string, db: DatabaseType, intent?: QuestionIntent): AnalyticsAnswer {
  const normalizedQuestion = normalizeQuestion(question);
  const lowerQuestion = normalizedQuestion.toLowerCase();
  const resolvedIntent = intent ?? { kind: 'unsupported', reason: 'No intent.' };

  if (resolvedIntent.kind === 'top_users') {
    const days = resolvedIntent.days ?? 7;
    const limit = resolvedIntent.limit ?? 5;
    const latestOrderTimestamp = getLatestOrderTimestamp(db);
    const rows = db
      .prepare(
        `
          SELECT u.name AS user_name, SUM(oi.quantity * oi.unit_price_cents) AS total_cents
          FROM orders o
          JOIN users u ON u.id = o.user_id
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.ordered_at >= datetime(@latest_ordered_at, '-' || @days || ' days')
          GROUP BY u.id, u.name
          ORDER BY total_cents DESC
          LIMIT @limit
        `,
      )
      .all({ latest_ordered_at: latestOrderTimestamp, days, limit }) as Array<{ user_name: string; total_cents: number }>;

    return {
      title: `Top users by total order value in the last ${days} days`,
      rows: rows.map((row, index) => ({
        rank: index + 1,
        user: row.user_name,
        total: formatCurrency(row.total_cents),
      })),
    };
  }

  if (resolvedIntent.kind === 'total_value') {
    const latestOrderTimestamp = getLatestOrderTimestamp(db);
    const row = db
      .prepare(
        `
          SELECT COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) AS total_cents
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.ordered_at >= datetime(@latest_ordered_at, '-1 day', 'start of day')
            AND o.ordered_at < datetime(@latest_ordered_at, 'start of day')
        `,
      )
      .get({ latest_ordered_at: latestOrderTimestamp }) as { total_cents: number } | undefined;

    return {
      title: 'Total order value yesterday',
      rows: [
        {
          period: 'Yesterday',
          total: formatCurrency(row?.total_cents ?? 0),
        },
      ],
    };
  }

  if (resolvedIntent.kind === 'products_by_quantity') {
    const limit = resolvedIntent.limit ?? 10;
    const rows = db
      .prepare(
        `
          SELECT p.name AS product_name, SUM(oi.quantity) AS total_quantity
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          GROUP BY p.id, p.name
          ORDER BY total_quantity DESC, p.name ASC
          LIMIT @limit
        `,
      )
      .all({ limit }) as Array<{ product_name: string; total_quantity: number }>;

    return {
      title: 'Products ordered in the greatest quantities',
      rows: rows.map((row, index) => ({
        rank: index + 1,
        product: row.product_name,
        quantity: formatInt(row.total_quantity),
      })),
    };
  }

  if (resolvedIntent.kind === 'orders_per_user') {
    const rows = db
      .prepare(
        `
          SELECT u.name AS user_name, COUNT(o.id) AS order_count
          FROM users u
          LEFT JOIN orders o ON o.user_id = u.id
          GROUP BY u.id, u.name
          ORDER BY order_count DESC, u.name ASC
        `,
      )
      .all() as Array<{ user_name: string; order_count: number }>;

    return {
      title: 'Orders placed per user',
      rows: rows.map((row, index) => ({
        rank: index + 1,
        user: row.user_name,
        orders: formatInt(row.order_count),
      })),
    };
  }

  if (resolvedIntent.kind === 'average_order_value') {
    const row = db
      .prepare(
        `
          SELECT AVG(order_total_cents) AS average_order_total_cents
          FROM (
            SELECT SUM(oi.quantity * oi.unit_price_cents) AS order_total_cents
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            GROUP BY o.id
          )
        `,
      )
      .get() as { average_order_total_cents: number } | undefined;

    return {
      title: 'Average order value',
      rows: [
        {
          metric: 'Average order value',
          value: formatCurrency(row?.average_order_total_cents ?? 0),
        },
      ],
    };
  }

  if (resolvedIntent.kind === 'products_by_order_value') {
    const limit = resolvedIntent.limit ?? 10;
    const rows = db
      .prepare(
        `
          SELECT p.name AS product_name, SUM(oi.quantity * oi.unit_price_cents) AS total_cents
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          GROUP BY p.id, p.name
          ORDER BY total_cents DESC, p.name ASC
          LIMIT @limit
        `,
      )
      .all({ limit }) as Array<{ product_name: string; total_cents: number }>;

    return {
      title: 'Products by total order value',
      rows: rows.map((row, index) => ({
        rank: index + 1,
        product: row.product_name,
        total: formatCurrency(row.total_cents),
      })),
    };
  }

  if (resolvedIntent.kind === 'users_for_product') {
    const rows = db
      .prepare(
        `
          SELECT DISTINCT u.name AS user_name
          FROM users u
          JOIN orders o ON o.user_id = u.id
          JOIN order_items oi ON oi.order_id = o.id
          JOIN products p ON p.id = oi.product_id
          WHERE p.name LIKE '%' || @product_name || '%'
          ORDER BY u.name ASC
        `,
      )
      .all({ product_name: resolvedIntent.product }) as Array<{ user_name: string }>;

    return {
      title: `Users who ordered ${resolvedIntent.product}`,
      rows: rows.map((row, index) => ({
        rank: index + 1,
        user: row.user_name,
      })),
    };
  }

  if (resolvedIntent.kind === 'orders_for_user') {
    const rows = db
      .prepare(
        `
          SELECT o.id AS order_id,
                 o.ordered_at AS ordered_at,
                 SUM(oi.quantity * oi.unit_price_cents) AS total_cents
          FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          JOIN users u ON u.id = o.user_id
          WHERE u.name LIKE '%' || @user_name || '%'
          GROUP BY o.id, o.ordered_at
          ORDER BY o.ordered_at DESC
        `,
      )
      .all({ user_name: resolvedIntent.user }) as Array<{ order_id: number; ordered_at: string; total_cents: number }>;

    return {
      title: `Orders placed by ${resolvedIntent.user}`,
      rows: rows.map((row) => ({
        order_id: row.order_id,
        ordered_at: row.ordered_at,
        total: formatCurrency(row.total_cents),
      })),
    };
  }

  return {
    title: 'Unsupported question',
    rows: [
      {
        status: resolvedIntent.kind === 'unsupported' ? resolvedIntent.reason : 'This question is not supported by the current analytics assistant.',
      },
    ],
  };
}
