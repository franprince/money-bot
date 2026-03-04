import type { Context } from "grammy";
import { deleteExpense } from "../../db/database";

export async function handleDelete(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const args = ctx.match as string | undefined;

    if (!userId) return;

    if (!args || !args.trim()) {
        await ctx.reply(
            "🗑 Usage: `/delete <id>`\nExample: `/delete 42`\n\nUse /list to see expense IDs.",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const id = parseInt(args.trim(), 10);
    if (isNaN(id) || id <= 0) {
        await ctx.reply("❌ Invalid ID. Please provide a valid positive number.");
        return;
    }

    try {
        const deleted = deleteExpense(userId, id);
        if (deleted) {
            await ctx.reply(`✅ Expense #${id} deleted.`);
        } else {
            await ctx.reply(`⚠️ Expense #${id} not found or doesn't belong to you.`);
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        await ctx.reply("❌ Failed to delete expense. Please try again.");
    }
}
