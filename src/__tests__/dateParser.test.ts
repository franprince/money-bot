import { describe, expect, test } from "bun:test";
import { parseReminderDate } from "../utils/dateParser";

describe("parseReminderDate", () => {
    test("parses relative hours", () => {
        const now = new Date();
        const result = parseReminderDate("3h");
        expect(result).not.toBeNull();
        if (result) {
            const diff = result.getTime() - now.getTime();
            // Should be approx 3 hours
            expect(Math.abs(diff - 3 * 60 * 60 * 1000)).toBeLessThan(1000);
        }
    });

    test("parses relative hours with + sign", () => {
        const now = new Date();
        const result = parseReminderDate("+12h");
        expect(result).not.toBeNull();
        if (result) {
            const diff = result.getTime() - now.getTime();
            expect(Math.abs(diff - 12 * 60 * 60 * 1000)).toBeLessThan(1000);
        }
    });

    test("parses 'mañana a las HH:mm'", () => {
        const result = parseReminderDate("mañana a las 15:30");
        expect(result).not.toBeNull();
        if (result) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            expect(result.getDate()).toBe(tomorrow.getDate());
            expect(result.getHours()).toBe(15);
            expect(result.getMinutes()).toBe(30);
        }
    });

    test("parses 'HH:mm' for today (if future)", () => {
        const now = new Date();
        const future = new Date(now);
        future.setHours(now.getHours() + 1, 0, 0, 0);
        const timeStr = `${future.getHours().toString().padStart(2, "0")}:00`;

        const result = parseReminderDate(timeStr);
        expect(result).not.toBeNull();
        if (result) {
            expect(result.getHours()).toBe(future.getHours());
            expect(result.getDate()).toBe(now.getDate());
        }
    });

    test("parses 'HH:mm' for tomorrow (if past)", () => {
        const now = new Date();
        const past = new Date(now);
        past.setHours(now.getHours() - 1, 0, 0, 0);
        const timeStr = `${past.getHours().toString().padStart(2, "0")}:00`;

        const result = parseReminderDate(timeStr);
        expect(result).not.toBeNull();
        if (result) {
            expect(result.getHours()).toBe(past.getHours());
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            expect(result.getDate()).toBe(tomorrow.getDate());
        }
    });

    test("parses ISO format", () => {
        const result = parseReminderDate("2026-12-31T15:00:00.000Z");
        expect(result).not.toBeNull();
        if (result) {
            expect(result.getFullYear()).toBe(2026);
            expect(result.getMonth()).toBe(11); // December
            expect(result.getDate()).toBe(31);
        }
    });

    test("parses 'en X días a las HH:mm'", () => {
        const result = parseReminderDate("en 5 días a las 11:30");
        expect(result).not.toBeNull();
        if (result) {
            const now = new Date();
            const target = new Date(now);
            target.setDate(target.getDate() + 5);
            expect(result.getDate()).toBe(target.getDate());
            expect(result.getHours()).toBe(11);
            expect(result.getMinutes()).toBe(30);
        }
    });

    test("parses 'en X días a las HH' (without minutes)", () => {
        const result = parseReminderDate("en 2 días a las 20");
        expect(result).not.toBeNull();
        if (result) {
            const now = new Date();
            const target = new Date(now);
            target.setDate(target.getDate() + 2);
            expect(result.getDate()).toBe(target.getDate());
            expect(result.getHours()).toBe(20);
            expect(result.getMinutes()).toBe(0);
        }
    });

    test("returns null for invalid input", () => {
        expect(parseReminderDate("random stuff")).toBeNull();
    });
});
