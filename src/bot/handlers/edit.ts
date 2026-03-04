import type { Context } from "grammy";
import {
    updateExpenseAmount,
    updateExpenseDescription,
    updateExpenseCategory,
} from "../../db/database";
import { parseExpense } from "../../parser/parseExpense";
import { formatAmount } from "../../utils/formatters";

export async function handleEdit(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    const args = ctx.match as string | undefined;

    if (!userId) return;

    if (!args || !args.trim()) {
        await ctx.reply(
            "✏️ *Uso de /editar:*\n\n" +
            "• `/editar monto <id> <nuevo_monto>`\n" +
            "• `/editar descripcion <id> <nueva_descripcion>`\n" +
            "• `/editar categoria <id> <nueva_categoria>`\n\n" +
            "Ejemplo: `/editar monto 42 1500`",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const parts = args.trim().split(/\s+/);
    if (parts.length < 3) {
        await ctx.reply("❌ Faltan argumentos. Uso: `/editar <campo> <id> <valor>`");
        return;
    }

    const field = parts[0].toLowerCase();
    const idStr = parts[1];
    const value = parts.slice(2).join(" ");

    const id = parseInt(idStr, 10);
    if (isNaN(id) || id <= 0) {
        await ctx.reply("❌ ID inválido. Debe ser un número positivo.");
        return;
    }

    try {
        let success = false;
        let message = "";

        switch (field) {
            case "monto":
            case "amount": {
                // We can reuse parseExpense to handle currency and number formatting
                // but here we just need the amount part.
                // For simplicity, let's try to parse the value as a number directly
                // via a dummy parseExpense call if needed, or just a simple check.
                const parsed = parseExpense(`gasto ${value}`);
                if (parsed.success) {
                    success = updateExpenseAmount(userId, id, parsed.data.amount);
                    message = `✅ Monto del gasto #${id} actualizado a *${formatAmount(parsed.data.amount, parsed.data.currency)}*.`;
                } else {
                    message = "❌ Monto inválido. Asegurate de ingresar un número válido.";
                }
                break;
            }
            case "descripcion":
            case "description": {
                success = updateExpenseDescription(userId, id, value);
                message = `✅ Descripción del gasto #${id} actualizada a: _${value}_.`;
                break;
            }
            case "categoria":
            case "category": {
                // Try to normalize category using the parser's logic if possible
                // but let's just use the value provided for now.
                // We could also try to detect category from the value.
                const parsed = parseExpense(`1 ${value}`);
                const category = parsed.success ? parsed.data.category : value;
                success = updateExpenseCategory(userId, id, category);
                message = `✅ Categoría del gasto #${id} actualizada a: *${category || "ninguna"}*.`;
                break;
            }
            default:
                await ctx.reply("❌ Campo inválido. Usá: `monto`, `descripcion` o `categoria`.");
                return;
        }

        if (success) {
            await ctx.reply(message, { parse_mode: "Markdown" });
        } else {
            await ctx.reply(`⚠️ No se pudo editar el gasto #${id}. No existe o no te pertenece.`);
        }
    } catch (error) {
        console.error("Error editing expense:", error);
        await ctx.reply("❌ Error al editar el gasto. Intentá de nuevo.");
    }
}
