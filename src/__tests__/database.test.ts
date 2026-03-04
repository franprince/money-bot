import { describe, expect, test, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { createInMemoryDb } from "../db/database";

// We'll test the DB operations by directly using the same SQL but on an in-memory database.
// This keeps our tests fast and isolated without touching the real file DB.

function makeHelpers(db: Database) {
    function insert(params: {
        userId: number;
        amount: number;
        currency?: string;
        category?: string | null;
        description?: string | null;
        created_at?: string;
    }) {
        const now = params.created_at ?? new Date().toISOString();
        const stmt = db.prepare(`
      INSERT INTO expenses (user_id, amount, currency, category, description, created_at)
      VALUES ($userId, $amount, $currency, $category, $description, $created_at)
      RETURNING *
    `);
        return stmt.get({
            $userId: params.userId,
            $amount: params.amount,
            $currency: params.currency ?? "ARS",
            $category: params.category ?? null,
            $description: params.description ?? null,
            $created_at: now,
        }) as { id: number; amount: number; currency: string };
    }

    function summary(userId: number, from: string, to: string) {
        const byCategory = db
            .prepare(
                `SELECT category, SUM(amount) AS total, COUNT(*) AS count
         FROM expenses
         WHERE user_id = $userId AND created_at >= $from AND created_at < $to
         GROUP BY category ORDER BY total DESC`
            )
            .all({ $userId: userId, $from: from, $to: to }) as {
                category: string | null;
                total: number;
                count: number;
            }[];
        const grand = db
            .prepare(
                `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
         FROM expenses
         WHERE user_id = $userId AND created_at >= $from AND created_at < $to`
            )
            .get({ $userId: userId, $from: from, $to: to }) as {
                total: number;
                count: number;
            };
        return { byCategory, grandTotal: grand.total, totalCount: grand.count };
    }

    function deleteById(userId: number, id: number) {
        return db
            .prepare(
                `DELETE FROM expenses WHERE id = $id AND user_id = $userId`
            )
            .run({ $id: id, $userId: userId });
    }

    return { insert, summary, deleteById };
}

describe("database operations", () => {
    let db: Database;
    let helpers: ReturnType<typeof makeHelpers>;

    beforeEach(() => {
        db = createInMemoryDb();
        helpers = makeHelpers(db);
    });

    test("inserts an expense and returns it with an id", () => {
        const expense = helpers.insert({ userId: 1, amount: 500, category: "food" });
        expect(expense.id).toBeGreaterThan(0);
        expect(expense.amount).toBe(500);
        expect(expense.currency).toBe("ARS");
    });

    test("inserts multiple expenses and retrieves correct count", () => {
        helpers.insert({ userId: 1, amount: 100 });
        helpers.insert({ userId: 1, amount: 200 });
        helpers.insert({ userId: 1, amount: 300 });

        const from = "2000-01-01T00:00:00.000Z";
        const to = "2100-01-01T00:00:00.000Z";
        const result = helpers.summary(1, from, to);
        expect(result.totalCount).toBe(3);
        expect(result.grandTotal).toBe(600);
    });

    test("summary only counts expenses for the given user", () => {
        helpers.insert({ userId: 1, amount: 1000 });
        helpers.insert({ userId: 2, amount: 500 });

        const from = "2000-01-01T00:00:00.000Z";
        const to = "2100-01-01T00:00:00.000Z";
        const result = helpers.summary(1, from, to);
        expect(result.totalCount).toBe(1);
        expect(result.grandTotal).toBe(1000);
    });

    test("summary groups by category correctly", () => {
        helpers.insert({ userId: 1, amount: 300, category: "food" });
        helpers.insert({ userId: 1, amount: 200, category: "food" });
        helpers.insert({ userId: 1, amount: 500, category: "transport" });

        const from = "2000-01-01T00:00:00.000Z";
        const to = "2100-01-01T00:00:00.000Z";
        const result = helpers.summary(1, from, to);

        expect(result.byCategory).toHaveLength(2);
        expect(result.byCategory[0].category).toBe("transport");
        expect(result.byCategory[0].total).toBe(500);
        expect(result.byCategory[1].category).toBe("food");
        expect(result.byCategory[1].total).toBe(500);
    });

    test("summary respects date range boundaries", () => {
        helpers.insert({
            userId: 1,
            amount: 100,
            created_at: "2026-01-15T12:00:00.000Z",
        });
        helpers.insert({
            userId: 1,
            amount: 200,
            created_at: "2026-02-15T12:00:00.000Z",
        });

        const januaryResult = helpers.summary(
            1,
            "2026-01-01T00:00:00.000Z",
            "2026-02-01T00:00:00.000Z"
        );
        expect(januaryResult.totalCount).toBe(1);
        expect(januaryResult.grandTotal).toBe(100);
    });

    test("deletes an expense by id", () => {
        const expense = helpers.insert({ userId: 1, amount: 500 });
        const result = helpers.deleteById(1, expense.id);
        expect(result.changes).toBe(1);

        const after = helpers.summary(1, "2000-01-01T00:00:00.000Z", "2100-01-01T00:00:00.000Z");
        expect(after.totalCount).toBe(0);
    });

    test("delete returns 0 changes for wrong user", () => {
        const expense = helpers.insert({ userId: 1, amount: 500 });
        const result = helpers.deleteById(2, expense.id); // wrong user
        expect(result.changes).toBe(0);
    });

    test("summary returns zero totals when no expenses exist", () => {
        const result = helpers.summary(
            1,
            "2000-01-01T00:00:00.000Z",
            "2100-01-01T00:00:00.000Z"
        );
        expect(result.grandTotal).toBe(0);
        expect(result.totalCount).toBe(0);
        expect(result.byCategory).toHaveLength(0);
    });
});
