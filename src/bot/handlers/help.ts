import type { Context } from "grammy";

const HELP_TEXT = `
💰 *Money Bot — Expense Tracker*

*Track an expense* — just send a message:
  \`500 lunch\`
  \`$1200 supermercado\`
  \`uber 850\`
  \`USD 50 coffee\`

*View summaries:*
  /today — today's expenses
  /week — this week (Mon–Sun)
  /month — this calendar month
  /year — this calendar year
  /summary 2026-01-01 2026-03-04 — custom range

*Manage expenses:*
  /list — last 10 expenses with IDs
  /delete 42 — delete expense #42

*Auto-detected categories:*
  food · transport · market · health · entertainment · clothing · utilities
`.trim();

export async function handleHelp(ctx: Context): Promise<void> {
    await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
}
