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
                await ctx.reply("⛔ You are not authorized to use this bot.");
                return;
            }
            await next();
        });
    }

    // Commands
    bot.command(["start", "help"], handleHelp);
    bot.command("today", handleToday);
    bot.command("week", handleWeek);
    bot.command("month", handleMonth);
    bot.command("year", handleYear);
    bot.command("summary", handleCustomSummary);
    bot.command("list", handleList);
    bot.command("delete", handleDelete);

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
