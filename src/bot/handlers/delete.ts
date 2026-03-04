import type { Context } from "grammy";
import { deleteExpense } from "../../db/database";

export async function handleDelete(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const args = ctx.match as string | undefined;

    if (!userId) return;

    if (!args || !args.trim()) {
        await ctx.reply(
            "🗑 Uso: `/borrar <id>`\nEjemplo: `/borrar 42`\n\nUsá /lista para ver los IDs de tus gastos.",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const id = parseInt(args.trim(), 10);
    if (isNaN(id) || id <= 0) {
        await ctx.reply("❌ ID inválido. Por favor ingresá un número positivo válido.");
        return;
    }

    try {
        const deleted = deleteExpense(userId, id);
        if (deleted) {
            await ctx.reply(`✅ Gasto #${id} eliminado.`);
        } else {
            await ctx.reply(`⚠️ No se encontró el gasto #${id} o no te pertenece.`);
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        await ctx.reply("❌ No se pudo eliminar el gasto. Intentá de nuevo.");
    }
}
