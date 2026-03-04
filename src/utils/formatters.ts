import type { SummaryResult } from "../types";

const CATEGORY_EMOJI: Record<string, string> = {
    food: "🍔",
    transport: "🚕",
    market: "🛒",
    health: "💊",
    entertainment: "🎬",
    clothing: "👗",
    utilities: "💡",
};

export function formatAmount(amount: number, currency = "ARS"): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatSummary(
    result: SummaryResult,
    label: string,
    currency = "ARS"
): string {
    if (result.totalCount === 0) {
        return `📭 No expenses recorded for ${label}.`;
    }

    const lines: string[] = [
        `📊 *Summary: ${label}*`,
        `─────────────────────────────`,
    ];

    for (const row of result.byCategory) {
        const categoryName = row.category ?? "other";
        const emoji = CATEGORY_EMOJI[categoryName] ?? "📦";
        const label = capitalize(categoryName).padEnd(14);
        lines.push(
            `${emoji} ${label} ${formatAmount(row.total, currency)}  _(${row.count})_`
        );
    }

    lines.push(`─────────────────────────────`);
    lines.push(
        `💰 *Total*         ${formatAmount(result.grandTotal, currency)}  _(${result.totalCount} expenses)_`
    );

    return lines.join("\n");
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
