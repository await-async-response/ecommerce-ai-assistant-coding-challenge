/**
 * Minimal SQLite connection helper.
 *
 * This file deliberately provides only what the starter infrastructure needs:
 * resolving the database path and opening a connection with foreign-key
 * enforcement enabled. It intentionally contains no analytics queries,
 * repositories, reporting helpers, natural-language handling, or AI-agent code.
 *
 * Candidates are free to build their data-access layer on top of this, or to
 * replace it entirely.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Database, { type Database as DatabaseType } from 'better-sqlite3';

/** Absolute path to the repository root (two levels up from `src/database`). */
export const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..');

/** Default database location relative to the repository root. */
export const DEFAULT_DATABASE_PATH = 'database/ecommerce.sqlite';

/**
 * Resolve the database path.
 *
 * Uses the `DATABASE_PATH` environment variable when set, otherwise the default
 * (`database/ecommerce.sqlite`). Relative paths are resolved from the repository
 * root so the location is stable regardless of the current working directory.
 */
export function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  const target = configured && configured.length > 0 ? configured : DEFAULT_DATABASE_PATH;
  return path.isAbsolute(target) ? target : path.resolve(REPO_ROOT, target);
}

export interface OpenDatabaseOptions {
  /** Explicit database path. Defaults to {@link resolveDatabasePath}. */
  path?: string;
  /** Open in read-only mode. Defaults to `false`. */
  readonly?: boolean;
}

/**
 * Open a SQLite connection with foreign-key enforcement enabled.
 *
 * The caller is responsible for closing the returned connection.
 */
export function openDatabase(options: OpenDatabaseOptions = {}): DatabaseType {
  const dbPath = options.path ?? resolveDatabasePath();
  const db = new Database(dbPath, { readonly: options.readonly ?? false });
  db.pragma('foreign_keys = ON');
  return db;
}
