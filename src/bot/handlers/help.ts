import type { Context } from "grammy";

const HELP_TEXT = `
💰 *Money Bot — Registro de Gastos*

*Registrar un gasto* — solo enviá un mensaje:
  \`500 almuerzo\`
  \`$1200 supermercado\`
  \`uber 850\`
  \`USD 50 café\`
  \`nafta 3000\`

*Ver resúmenes:*
  /hoy — gastos de hoy
  /semana — esta semana (Lun–Dom)
  /mes — este mes
  /anio — este año
  /resumen 2026-01-01 2026-03-04 — período personalizado

*Administrar gastos:*
  /lista — últimos 10 gastos con IDs
  /borrar 42 — eliminar gasto #42

*Categorías detectadas automáticamente:*
  comida · transporte · mercado · salud · entretenimiento · ropa · servicios
`.trim();

export async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
}
