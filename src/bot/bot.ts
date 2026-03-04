import { Bot } from "grammy";
import { handleAddExpense } from "./handlers/addExpense";
import {
    handleToday,
    handleWeek,
    handleMonth,
    handleYear,
    handleCustomSummary,
} from "./handlers/summary";
import { handleList } from "./handlers/list";
import { handleDelete } from "./handlers/delete";
import { handleHelp } from "./handlers/help";

export function createBot(token: string): Bot {
    const bot = new Bot(token);

    const allowedUserIds = getAllowedUserIds();
    if (allowedUserIds.size > 0) {
        bot.use(async (ctx, next) => {
            const userId = ctx.from?.id;
            if (!userId || !allowedUserIds.has(userId)) {
                await ctx.reply("⛔ No tenés autorización para usar este bot.");
                return;
            }
            await next();
        });
    }

    // Commands — Spanish primary, English aliases for convenience
    bot.command(["start", "help", "ayuda"], handleHelp);
    bot.command(["hoy", "today"], handleToday);
    bot.command(["semana", "week"], handleWeek);
    bot.command(["mes", "month"], handleMonth);
    bot.command(["anio", "year"], handleYear);
    bot.command(["resumen", "summary"], handleCustomSummary);
    bot.command(["lista", "list"], handleList);
    bot.command(["borrar", "delete"], handleDelete);

    // Plain text messages → try to parse as expense
    bot.on("message:text", handleAddExpense);

    return bot;
}

function getAllowedUserIds(): Set<number> {
    const raw = process.env.ALLOWED_USER_IDS ?? "";
    if (!raw.trim()) return new Set();
    return new Set(
        raw
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n))
    );
}
