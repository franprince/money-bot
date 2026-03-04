import { describe, expect, test } from "bun:test";
import { parseExpense } from "../parser/parseExpense";

describe("parseExpense", () => {
    describe("valid formats", () => {
        test("amount first, then description", () => {
            const result = parseExpense("500 lunch");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(500);
            expect(result.data.description).toBe("lunch");
        });

        test("description first, then amount", () => {
            const result = parseExpense("uber 850");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(850);
            expect(result.data.description).toBe("uber");
        });

        test("dollar sign prefix sets currency ARS", () => {
            const result = parseExpense("$1200 supermercado");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(1200);
            expect(result.data.currency).toBe("ARS");
        });

        test("explicit currency code USD", () => {
            const result = parseExpense("USD 50 coffee");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(50);
            expect(result.data.currency).toBe("USD");
        });

        test("explicit currency code EUR lowercase", () => {
            const result = parseExpense("eur 30 Netflix");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(30);
            expect(result.data.currency).toBe("EUR");
        });

        test("thousand separator with comma", () => {
            const result = parseExpense("1,500 lunch");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(1500);
        });

        test("European format 1.500,50", () => {
            const result = parseExpense("comida 1.500,50");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(1500.5);
        });

        test("Dot as thousand separator without decimal (AR format)", () => {
            const result = parseExpense("comida 163.000");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(163000);
        });

        test("Multiple thousand separators", () => {
            const result = parseExpense("auto 1.250.000");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(1250000);
        });

        test("decimal amount", () => {
            const result = parseExpense("coffee 3.50");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(3.5);
        });

        test("amount only (no description)", () => {
            const result = parseExpense("500");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.amount).toBe(500);
            expect(result.data.description).toBeNull();
        });
    });

    describe("category auto-detection", () => {
        test("detects food from 'lunch'", () => {
            const result = parseExpense("500 lunch");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.category).toBe("food");
        });

        test("detects transport from 'uber'", () => {
            const result = parseExpense("uber 850");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.category).toBe("transport");
        });

        test("detects market from 'supermercado'", () => {
            const result = parseExpense("$1200 supermercado");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.category).toBe("market");
        });

        test("detects health from 'farmacia'", () => {
            const result = parseExpense("farmacia 350");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.category).toBe("health");
        });

        test("no known category returns null", () => {
            const result = parseExpense("500 random purchase xyz");
            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.data.category).toBeNull();
        });
    });

    describe("invalid inputs", () => {
        test("empty string fails", () => {
            const result = parseExpense("");
            expect(result.success).toBe(false);
        });

        test("text with no number fails", () => {
            const result = parseExpense("just some text");
            expect(result.success).toBe(false);
        });

        test("zero amount fails", () => {
            const result = parseExpense("0 lunch");
            expect(result.success).toBe(false);
        });

        test("negative amount fails", () => {
            const result = parseExpense("-100 lunch");
            expect(result.success).toBe(false);
        });
    });
});
