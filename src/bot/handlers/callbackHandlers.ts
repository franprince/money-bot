import { type Context, InlineKeyboard } from "grammy";
import { insertExpense, insertReminder, updateExpenseCategory } from "../../db/database";
import { formatAmount } from "../../utils/formatters";
import { CATEGORY_EMOJI } from "../../parser/parseExpense";

export async function handleCallbackQuery(ctx: Context): Promise<void> {
    const data = ctx.callbackQuery?.data;
    const userId = ctx.from?.id;

    if (!data || !userId) return;

    // Category handling: cat:expenseId:categoryName
    if (data.startsWith("cat:")) {
        const [, idStr, category] = data.split(":");
        const expenseId = parseInt(idStr, 10);
        const finalCategory = category === "none" ? null : category;

        const success = updateExpenseCategory(userId, expenseId, finalCategory);

        if (success) {
            const catLabel = finalCategory ? `${CATEGORY_EMOJI[finalCategory] || ""} ${finalCategory}` : "ninguna";
            await ctx.editMessageText(`✅ Categoría asignada: *${catLabel}*`, {
                parse_mode: "Markdown",
            });

            // Prompt for reminder after category is set
            const reminderKeyboard = new InlineKeyboard()
                .text("🔔 En 1h", `remind:1h:gasto`)
                .text("⏰ Mañana", `remind:tomorrow:gasto`)
                .text("➕ Otros...", `remind_custom:gasto`)
                .row()
                .text("❌ No", "remind:cancel");

            await ctx.reply("¿Querés que te lo recuerde más tarde?", {
                reply_markup: reminderKeyboard,
            });
        } else {
            await ctx.answerCallbackQuery("⚠️ No se pudo asignar la categoría.");
        }
        await ctx.answerCallbackQuery();
        return;
    }

    // Split handling: split:type:amount:currency:category:description
    if (data.startsWith("split:")) {
        const [, type, amountStr, ...rest] = data.split(":");
        const amount = parseFloat(amountStr);
        const currency = rest[0];
        const category = rest[1] === "none" ? null : rest[1];
        const description = rest[2] === "none" ? null : rest[2];

        if (type === "all" || type === "me") {
            const expense = insertExpense({
                userId,
                amount,
                currency,
                category,
                description,
            });

            const label = type === "all" ? "el total" : "tu parte";
            await ctx.editMessageText(
                `✅ Guardado (${label}): *${formatAmount(amount, currency)}* — ID #${expense.id}`,
                { parse_mode: "Markdown" }
            );

            // After saving split, prompt for reminder
            const reminderKeyboard = new InlineKeyboard()
                .text("🔔 En 1h", `remind:1h:${description || "gasto"}`)
                .text("⏰ Mañana", `remind:tomorrow:${description || "gasto"}`)
                .text("➕ Otros...", `remind_custom:${description || "gasto"}`)
                .row()
                .text("❌ No", "remind:cancel");

            await ctx.reply("¿Querés que te lo recuerde más tarde?", {
                reply_markup: reminderKeyboard,
            });
        } else if (type === "custom") {
            // "Definir N partes" -> Ask the user for the number of parts
            // For simplicity, let's just show some common options
            const originalDivisor = parseInt(rest[0], 10);
            const originalAmount = amount;
            const currency = rest[1];
            const category = rest[2] === "none" ? null : rest[2];
            const description = rest[3] === "none" ? null : rest[3];

            const keyboard = new InlineKeyboard();
            for (let i = 2; i <= 5; i++) {
                const perPart = originalAmount / i;
                keyboard.text(`${i} partes (${formatAmount(perPart, currency)})`, `split:me:${perPart}:${currency}:${category || "none"}:${description || "none"}`).row();
            }
            keyboard.text("❌ Cancelar", "remind:cancel");

            await ctx.editMessageText("¿En cuántas partes querés dividir el total?", {
                reply_markup: keyboard,
            });
        }
    }

    // Reminder handling: remind:time:message
    if (data.startsWith("remind:")) {
        const [, time, ...rest] = data.split(":");
        const messageText = rest.join(":");

        if (time === "cancel") {
            try {
                await ctx.editMessageText("Ok, no habrá recordatorio.");
            } catch (e: any) {
                if (e.description?.includes("message is not modified")) return;
                throw e;
            }
            return;
        }

        let remindAt = new Date();
        let timeLabel = "";

        if (time === "1h") {
            remindAt.setHours(remindAt.getHours() + 1);
            timeLabel = "en 1 hora";
        } else if (time === "tomorrow") {
            remindAt.setDate(remindAt.getDate() + 1);
            remindAt.setHours(9, 0, 0, 0); // 9 AM tomorrow
            timeLabel = "mañana a las 9:00";
        } else if (time.endsWith("h")) {
            const hours = parseInt(time.replace("h", ""), 10);
            remindAt.setHours(remindAt.getHours() + hours);
            timeLabel = `en ${hours} hora${hours > 1 ? "s" : ""}`;
        }

        insertReminder({
            userId,
            message: `Recordatorio: ${messageText}`,
            remindAt: remindAt.toISOString(),
        });

        try {
            await ctx.editMessageText(`✅ Te recordaré "${messageText}" ${timeLabel}.`);
        } catch (e: any) {
            if (e.description?.includes("message is not modified")) return;
            throw e;
        }
        return;
    }

    // Custom reminder submenu: remind_custom:message
    if (data.startsWith("remind_custom:")) {
        const messageText = data.split(":")[1];
        const keyboard = new InlineKeyboard()
            .text("🔔 +3h", `remind:3h:${messageText}`)
            .text("🔔 +6h", `remind:6h:${messageText}`)
            .row()
            .text("🔔 +12h", `remind:12h:${messageText}`)
            .text("🔔 +24h", `remind:24h:${messageText}`)
            .row()
            .text("📅 Seleccionar fecha", `remind_date:${messageText}`)
            .row()
            .text("⬅️ Volver", `remind_back:${messageText}`);

        await ctx.editMessageText("¿Cuándo querés que te lo recuerde?", {
            reply_markup: keyboard,
        });
    }

    // Go back to main reminder options
    if (data.startsWith("remind_back:")) {
        const messageText = data.split(":")[1];
        const keyboard = new InlineKeyboard()
            .text("🔔 En 1h", `remind:1h:${messageText}`)
            .text("⏰ Mañana", `remind:tomorrow:${messageText}`)
            .text("➕ Otros...", `remind_custom:${messageText}`)
            .row()
            .text("❌ No", "remind:cancel");

        await ctx.editMessageText("¿Querés que te lo recuerde más tarde?", {
            reply_markup: keyboard,
        });
    }

    // Prompt for date input
    if (data.startsWith("remind_date:")) {
        const messageText = data.split(":")[1];
        await ctx.reply(`📅 Ingresá cuándo te recuerdo "${messageText}"\nEjemplos: "3h", "18:00", "mañana a las 10", "2026-12-31 15:00"`, {
            reply_markup: { force_reply: true },
        });
        await ctx.answerCallbackQuery();
        return;
    }
}
