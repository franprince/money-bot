import type { Context } from "grammy";
import { getUserPendingReminders } from "../../db/database";

export async function handleListReminders(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
        const reminders = getUserPendingReminders(userId);

        if (reminders.length === 0) {
            await ctx.reply("⏰ No tenés recordatorios pendientes.");
            return;
        }

        let message = "⏰ *Tus recordatorios pendientes:*\n\n";
        for (const r of reminders) {
            const date = new Date(r.remind_at);
            // Format to a readable string (e.g. DD/MM HH:mm)
            const dateStr = date.toLocaleString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
            message += `• *${dateStr}*: ${r.message}\n`;
        }

        await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
        console.error("Error listing reminders:", error);
        await ctx.reply("❌ Error al obtener los recordatorios.");
    }
}
