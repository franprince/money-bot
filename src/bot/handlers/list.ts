import type { Context } from "grammy";
import { getRecentExpenses } from "../../db/database";
import { formatAmount } from "../../utils/formatters";

export async function handleList(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
        const expenses = getRecentExpenses(userId, 10);

        if (expenses.length === 0) {
            await ctx.reply("📭 No expenses recorded yet.");
            return;
        }

        const lines = expenses.map((e) => {
            const date = new Date(e.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
            const category = e.category ? ` · _${e.category}_` : "";
            const desc = e.description ? ` ${e.description}` : "";
            return `#${e.id} · ${date} · *${formatAmount(e.amount, e.currency)}*${desc}${category}`;
        });

        await ctx.reply(`📋 *Last ${expenses.length} expenses:*\n\n${lines.join("\n")}`, {
            parse_mode: "Markdown",
        });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        await ctx.reply("❌ Failed to fetch expenses. Please try again.");
    }
}
