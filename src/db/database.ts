import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Expense, ExpenseSummary, SummaryResult } from "../types";

export const DB_PATH = process.env.DB_PATH ?? "data/expenses.db";

let db: Database;

function getDb(): Database {
    if (!db) {
        mkdirSync(dirname(DB_PATH), { recursive: true });
        db = new Database(DB_PATH, { create: true });
        db.run("PRAGMA journal_mode = WAL");
        db.run("PRAGMA foreign_keys = ON");
        migrate(db);
    }
    return db;
}

function migrate(database: Database): void {
    database.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      amount      REAL    NOT NULL,
      currency    TEXT    NOT NULL DEFAULT 'ARS',
      category    TEXT,
      description TEXT,
      created_at  TEXT    NOT NULL
    )
  `);

    database.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      message     TEXT    NOT NULL,
      remind_at   TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'pending'
    )
  `);

    database.run(`
    CREATE TABLE IF NOT EXISTS metadata (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

export interface InsertExpenseParams {
    userId: number;
    amount: number;
    currency?: string;
    category?: string | null;
    description?: string | null;
}

export function insertExpense(params: InsertExpenseParams): Expense {
    const database = getDb();
    const now = new Date().toISOString();
    const stmt = database.prepare(`
    INSERT INTO expenses (user_id, amount, currency, category, description, created_at)
    VALUES ($userId, $amount, $currency, $category, $description, $created_at)
    RETURNING *
  `);
    const row = stmt.get({
        $userId: params.userId,
        $amount: params.amount,
        $currency: params.currency ?? "ARS",
        $category: params.category ?? null,
        $description: params.description ?? null,
        $created_at: now,
    }) as Expense;
    return row;
}

export function getExpenses(
    userId: number,
    from: string,
    to: string
): Expense[] {
    const database = getDb();
    const stmt = database.prepare(`
    SELECT * FROM expenses
    WHERE user_id = $userId
      AND created_at >= $from
      AND created_at <  $to
    ORDER BY created_at DESC
  `);
    return stmt.all({ $userId: userId, $from: from, $to: to }) as Expense[];
}

export function getSummary(
    userId: number,
    from: string,
    to: string
): SummaryResult {
    const database = getDb();

    const byCategory = database
        .prepare(
            `
    SELECT
      category,
      SUM(amount) AS total,
      COUNT(*)    AS count
    FROM expenses
    WHERE user_id = $userId
      AND created_at >= $from
      AND created_at <  $to
    GROUP BY category
    ORDER BY total DESC
  `
        )
        .all({ $userId: userId, $from: from, $to: to }) as ExpenseSummary[];

    const grandRow = database
        .prepare(
            `
    SELECT
      COALESCE(SUM(amount), 0) AS total,
      COUNT(*)                 AS count
    FROM expenses
    WHERE user_id = $userId
      AND created_at >= $from
      AND created_at <  $to
  `
        )
        .get({ $userId: userId, $from: from, $to: to }) as {
            total: number;
            count: number;
        };

    return {
        byCategory,
        grandTotal: grandRow.total,
        totalCount: grandRow.count,
    };
}

export function getRecentExpenses(userId: number, limit = 10): Expense[] {
    const database = getDb();
    const stmt = database.prepare(`
    SELECT * FROM expenses
    WHERE user_id = $userId
    ORDER BY created_at DESC
    LIMIT $limit
  `);
    return stmt.all({ $userId: userId, $limit: limit }) as Expense[];
}

export function deleteExpense(
    userId: number,
    expenseId: number
): boolean {
    const database = getDb();
    const result = database
        .prepare(
            `DELETE FROM expenses WHERE id = $id AND user_id = $userId`
        )
        .run({ $id: expenseId, $userId: userId });
    return result.changes > 0;
}

export function updateExpenseAmount(
    userId: number,
    expenseId: number,
    amount: number
): boolean {
    const database = getDb();
    const result = database
        .prepare(
            `UPDATE expenses SET amount = $amount WHERE id = $id AND user_id = $userId`
        )
        .run({ $amount: amount, $id: expenseId, $userId: userId });
    return result.changes > 0;
}

export function updateExpenseDescription(
    userId: number,
    expenseId: number,
    description: string | null
): boolean {
    const database = getDb();
    const result = database
        .prepare(
            `UPDATE expenses SET description = $description WHERE id = $id AND user_id = $userId`
        )
        .run({ $description: description, $id: expenseId, $userId: userId });
    return result.changes > 0;
}

export function updateExpenseCategory(
    userId: number,
    expenseId: number,
    category: string | null
): boolean {
    const database = getDb();
    const result = database
        .prepare(
            `UPDATE expenses SET category = $category WHERE id = $id AND user_id = $userId`
        )
        .run({ $category: category, $id: expenseId, $userId: userId });
    return result.changes > 0;
}

export interface InsertReminderParams {
    userId: number;
    message: string;
    remindAt: string;
}

export function insertReminder(params: InsertReminderParams): void {
    const database = getDb();
    const stmt = database.prepare(`
    INSERT INTO reminders (user_id, message, remind_at)
    VALUES ($userId, $message, $remindAt)
  `);
    stmt.run({
        $userId: params.userId,
        $message: params.message,
        $remindAt: params.remindAt,
    });
}

export function getPendingReminders(): {
    id: number;
    user_id: number;
    message: string;
    remind_at: string;
}[] {
    const database = getDb();
    const now = new Date().toISOString();
    return database
        .prepare(
            `SELECT id, user_id, message, remind_at FROM reminders WHERE status = 'pending' AND remind_at <= $now`
        )
        .all({ $now: now }) as any;
}

export function getUserPendingReminders(userId: number): {
    id: number;
    message: string;
    remind_at: string;
}[] {
    const database = getDb();
    return database
        .prepare(
            `SELECT id, message, remind_at FROM reminders WHERE user_id = $userId AND status = 'pending' ORDER BY remind_at ASC`
        )
        .all({ $userId: userId }) as any;
}

export function markReminderAsSent(id: number): void {
    const database = getDb();
    database
        .prepare(`UPDATE reminders SET status = 'sent' WHERE id = ?`)
        .run(id);
}

export function getMetadata(key: string): string | null {
    const database = getDb();
    const row = database
        .prepare(`SELECT value FROM metadata WHERE key = ?`)
        .get(key) as { value: string } | undefined;
    return row ? row.value : null;
}

export function setMetadata(key: string, value: string): void {
    const database = getDb();
    database
        .prepare(
            `INSERT INTO metadata (key, value) VALUES ($key, $value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        )
        .run({ $key: key, $value: value });
}

export function closeDb(): void {
    if (db) {
        db.close();
    }
}

export function backupDb(targetPath: string): void {
    const database = getDb();
    // VACUUM INTO fails if the file already exists
    try {
        if (require("node:fs").existsSync(targetPath)) {
            require("node:fs").unlinkSync(targetPath);
        }
    } catch (e) {
        // ignore errors on delete
    }
    database.run(`VACUUM INTO '${targetPath}'`);
}

/** Exposed only for testing — creates an isolated in-memory DB */
export function createInMemoryDb(): Database {
    const memDb = new Database(":memory:");
    memDb.run("PRAGMA journal_mode = WAL");
    memDb.run("PRAGMA foreign_keys = ON");
    migrate(memDb);
    return memDb;
}
