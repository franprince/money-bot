import type { Context } from "grammy";
import { getSummary } from "../../db/database";
import { formatSummary } from "../../utils/formatters";
import {
    todayRange,
    weekRange,
    monthRange,
    yearRange,
    customRange,
} from "../../utils/dateRanges";

async function sendSummary(
    ctx: Context,
    range: [string, string],
    label: string
): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
        const result = getSummary(userId, range[0], range[1]);
        await ctx.reply(formatSummary(result, label), { parse_mode: "Markdown" });
    } catch (error) {
        console.error("Error fetching summary:", error);
        await ctx.reply("❌ Failed to fetch summary. Please try again.");
    }
}

export async function handleToday(ctx: Context): Promise<void> {
    const today = new Date();
    const label = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    await sendSummary(ctx, todayRange(), label);
}

export async function handleWeek(ctx: Context): Promise<void> {
    await sendSummary(ctx, weekRange(), "This week");
}

export async function handleMonth(ctx: Context): Promise<void> {
    const now = new Date();
    const label = now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
    await sendSummary(ctx, monthRange(), label);
}

export async function handleYear(ctx: Context): Promise<void> {
    const now = new Date();
    await sendSummary(ctx, yearRange(), String(now.getFullYear()));
}

/**
 * /summary YYYY-MM-DD YYYY-MM-DD
 */
export async function handleCustomSummary(ctx: Context): Promise<void> {
    const args = ctx.match as string | undefined;

    if (!args) {
        await ctx.reply(
            "📅 Usage: `/summary YYYY-MM-DD YYYY-MM-DD`\nExample: `/summary 2026-01-01 2026-03-04`",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const parts = args.trim().split(/\s+/);
    if (parts.length !== 2) {
        await ctx.reply(
            "❌ Invalid format. Usage: `/summary YYYY-MM-DD YYYY-MM-DD`",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const range = customRange(parts[0], parts[1]);
    if (!range) {
        await ctx.reply(
            "❌ Invalid dates. Make sure start date ≤ end date and format is YYYY-MM-DD."
        );
        return;
    }

    await sendSummary(ctx, range, `${parts[0]} → ${parts[1]}`);
}
