import type { Context } from "grammy";
import { parseExpense } from "../../parser/parseExpense";
import { insertExpense } from "../../db/database";
import { formatAmount } from "../../utils/formatters";

export async function handleAddExpense(ctx: Context): Promise<void> {
    const text = ctx.message?.text;
    const userId = ctx.from?.id;

    if (!text || !userId) return;

    const result = parseExpense(text);

    if (!result.success) {
        // Silently ignore — the user may have sent a bot command or irrelevant text
        return;
    }

    const { amount, currency, category, description } = result.data;

    try {
        const expense = insertExpense({
            userId,
            amount,
            currency,
            category,
            description,
        });

        const categoryLabel = category ? ` · _${category}_` : "";
        const descLabel = description ? ` ${description}` : "";

        await ctx.reply(
            `✅ ¡Guardado!${descLabel}${categoryLabel}\n*${formatAmount(amount, currency)}* — ID #${expense.id}`,
            { parse_mode: "Markdown" }
        );
    } catch (error) {
        console.error("Error saving expense:", error);
        await ctx.reply("❌ No se pudo guardar el gasto. Por favor, intentá de nuevo.");
    }
}
