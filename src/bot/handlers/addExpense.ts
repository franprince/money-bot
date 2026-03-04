import { InlineKeyboard, type Context } from "grammy";
import { parseExpense, CATEGORY_LIST, CATEGORY_EMOJI } from "../../parser/parseExpense";
import { insertExpense } from "../../db/database";
import { formatAmount } from "../../utils/formatters";

export async function handleAddExpense(ctx: Context): Promise<void> {
    const text = ctx.message?.text;
    const userId = ctx.from?.id;

    if (!text || !userId) return;

    const result = parseExpense(text);

    if (!result.success) {
        return;
    }

    const { amount, currency, category, description, splitDivisor } = result.data;

    if (splitDivisor && splitDivisor > 1) {
        const perPerson = amount / splitDivisor;
        const message =
            `💸 *Gasto compartido detectado*\n\n` +
            `Total: *${formatAmount(amount, currency)}*\n` +
            `${splitDivisor} personas: *${formatAmount(perPerson, currency)}* cada una.\n\n` +
            `¿Qué parte querés guardar?`;

        const keyboard = new InlineKeyboard()
            .text(
                "Todo el gasto",
                `split:all:${amount}:${currency}:${category || "none"}:${description || "none"}`
            )
            .row()
            .text(
                "Solo mi parte",
                `split:me:${perPerson}:${currency}:${category || "none"}:${description || "none"}`
            )
            .row()
            .text(
                "Definir N partes",
                `split:custom:${amount}:${splitDivisor}:${currency}:${category || "none"}:${description || "none"}`
            );

        await ctx.reply(message, {
            parse_mode: "Markdown",
            reply_markup: keyboard,
        });
        return;
    }

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

        if (!category) {
            // Ask for category
            const catKeyboard = new InlineKeyboard();
            // Group in rows of 2
            for (let i = 0; i < CATEGORY_LIST.length; i += 2) {
                const cat1 = CATEGORY_LIST[i];
                const cat2 = CATEGORY_LIST[i + 1];
                catKeyboard.text(`${CATEGORY_EMOJI[cat1]} ${cat1}`, `cat:${expense.id}:${cat1}`);
                if (cat2) {
                    catKeyboard.text(`${CATEGORY_EMOJI[cat2]} ${cat2}`, `cat:${expense.id}:${cat2}`);
                }
                catKeyboard.row();
            }
            catKeyboard.text("❌ Ninguna", `cat:${expense.id}:none`);

            await ctx.reply("📂 No pude detectar la categoría. ¿Querés asignarle una?", {
                reply_markup: catKeyboard,
            });
        } else {
            // Prompt for reminder
            const reminderKeyboard = new InlineKeyboard()
                .text("🔔 En 1h", `remind:1h:${description || "gasto"}`)
                .text("⏰ Mañana", `remind:tomorrow:${description || "gasto"}`)
                .text("❌ No", "remind:cancel");

            await ctx.reply("¿Querés que te lo recuerde más tarde?", {
                reply_markup: reminderKeyboard,
            });
        }
    } catch (error) {
        console.error("Error saving expense:", error);
        await ctx.reply("❌ No se pudo guardar el gasto. Por favor, intentá de nuevo.");
    }
}
