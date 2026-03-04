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

const CATEGORY_LABELS_ES: Record<string, string> = {
    food: "Comida",
    transport: "Transporte",
    market: "Mercado",
    health: "Salud",
    entertainment: "Entretenimiento",
    clothing: "Ropa",
    utilities: "Servicios",
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
        return `📭 Sin gastos registrados para ${label}.`;
    }

    const lines: string[] = [
        `📊 *Resumen: ${label}*`,
        `─────────────────────────────`,
    ];

    for (const row of result.byCategory) {
        const categoryKey = row.category ?? "other";
        const emoji = CATEGORY_EMOJI[categoryKey] ?? "📦";
        const categoryLabel = (CATEGORY_LABELS_ES[categoryKey] ?? capitalize(categoryKey)).padEnd(15);
        lines.push(
            `${emoji} ${categoryLabel} ${formatAmount(row.total, currency)}  _(${row.count})_`
        );
    }

    lines.push(`─────────────────────────────`);
    lines.push(
        `💰 *Total*          ${formatAmount(result.grandTotal, currency)}  _(${result.totalCount} gastos)_`
    );

    return lines.join("\n");
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
