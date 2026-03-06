import { describe, expect, test, mock, beforeEach } from "bun:test";
import { handleCallbackQuery } from "../bot/handlers/callbackHandlers";
import * as database from "../db/database";

// Mock database functions
mock.module("../db/database", () => ({
    insertReminder: mock(() => { }),
    updateExpenseCategory: mock(() => true),
    insertExpense: mock(() => ({ id: 1 })),
}));

describe("handleCallbackQuery", () => {
    let ctx: any;

    beforeEach(() => {
        ctx = {
            callbackQuery: { data: "" },
            from: { id: 123 },
            editMessageText: mock(async () => { }),
            answerCallbackQuery: mock(async () => { }),
            reply: mock(async () => { }),
        };
    });

    test("handles remind:tomorrow:text correctly and only once", async () => {
        ctx.callbackQuery.data = "remind:tomorrow:asado";

        await handleCallbackQuery(ctx);

        // Verify editMessageText was called with the correct label
        expect(ctx.editMessageText).toHaveBeenCalledTimes(1);
        expect(ctx.editMessageText).toHaveBeenCalledWith(
            expect.stringContaining('✅ Te recordaré "asado" mañana a las 9:00.')
        );

        // Verify insertReminder was called
        expect(database.insertReminder).toHaveBeenCalledTimes(1);
    });

    test("handles remind:1h:msg correctly", async () => {
        ctx.callbackQuery.data = "remind:1h:lunch";

        await handleCallbackQuery(ctx);

        expect(ctx.editMessageText).toHaveBeenCalledTimes(1);
        expect(ctx.editMessageText).toHaveBeenCalledWith(
            expect.stringContaining('✅ Te recordaré "lunch" en 1 hora.')
        );
    });

    test("handles 'message is not modified' error gracefully", async () => {
        ctx.callbackQuery.data = "remind:tomorrow:asado";
        ctx.editMessageText = mock(async () => {
            const err: any = new Error("Bad Request: message is not modified");
            err.description = "Bad Request: message is not modified";
            throw err;
        });

        // Should not throw
        await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();
        expect(ctx.editMessageText).toHaveBeenCalled();
    });

    test("swallows 'cancel' reminder correctly", async () => {
        ctx.callbackQuery.data = "remind:cancel";

        await handleCallbackQuery(ctx);

        expect(ctx.editMessageText).toHaveBeenCalledWith("Ok, no habrá recordatorio.");
    });
});
