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
        await ctx.reply("❌ No se pudo obtener el resumen. Intentá de nuevo.");
    }
}

export async function handleToday(ctx: Context): Promise<void> {
    const today = new Date();
    const label = today.toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    await sendSummary(ctx, todayRange(), label);
}

export async function handleWeek(ctx: Context): Promise<void> {
    await sendSummary(ctx, weekRange(), "Esta semana");
}

export async function handleMonth(ctx: Context): Promise<void> {
    const now = new Date();
    const label = now.toLocaleDateString("es-AR", {
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
 * /resumen YYYY-MM-DD YYYY-MM-DD
 */
export async function handleCustomSummary(ctx: Context): Promise<void> {
    const args = ctx.match as string | undefined;

    if (!args) {
        await ctx.reply(
            "📅 Uso: `/resumen YYYY-MM-DD YYYY-MM-DD`\nEjemplo: `/resumen 2026-01-01 2026-03-04`",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const parts = args.trim().split(/\s+/);
    if (parts.length !== 2) {
        await ctx.reply(
            "❌ Formato inválido. Uso: `/resumen YYYY-MM-DD YYYY-MM-DD`",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const range = customRange(parts[0], parts[1]);
    if (!range) {
        await ctx.reply(
            "❌ Fechas inválidas. Asegurate de que la fecha inicial sea menor o igual a la final y el formato sea YYYY-MM-DD."
        );
        return;
    }

    await sendSummary(ctx, range, `${parts[0]} → ${parts[1]}`);
}
