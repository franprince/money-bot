import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Expense, ExpenseSummary, SummaryResult } from "../types";

const DB_PATH = process.env.DB_PATH ?? "data/expenses.db";

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

export function closeDb(): void {
    if (db) {
        db.close();
    }
}

/** Exposed only for testing — creates an isolated in-memory DB */
export function createInMemoryDb(): Database {
    const memDb = new Database(":memory:");
    memDb.run("PRAGMA journal_mode = WAL");
    memDb.run("PRAGMA foreign_keys = ON");
    migrate(memDb);
    return memDb;
}
