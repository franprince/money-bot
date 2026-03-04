export interface ParsedExpense {
    amount: number;
    currency: string;
    category: string | null;
    description: string | null;
}

export interface ParseResult {
    success: true;
    data: ParsedExpense;
}

export interface ParseFailure {
    success: false;
    reason: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    $: "ARS",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
};

const CURRENCY_CODES = new Set(["usd", "eur", "ars", "gbp", "jpy", "brl"]);

const KNOWN_CATEGORIES: Record<string, string> = {
    food: "food",
    comida: "food",
    almuerzo: "food",
    cena: "food",
    desayuno: "food",
    lunch: "food",
    dinner: "food",
    breakfast: "food",
    cafe: "food",
    coffee: "food",

    transport: "transport",
    transporte: "transport",
    uber: "transport",
    taxi: "transport",
    bus: "transport",
    colectivo: "transport",
    subte: "transport",
    remis: "transport",
    nafta: "transport",
    fuel: "transport",
    gas: "transport",

    market: "market",
    supermercado: "market",
    super: "market",
    mercado: "market",
    carrefour: "market",
    disco: "market",

    health: "health",
    salud: "health",
    farmacia: "health",
    pharmacy: "health",
    medico: "health",
    doctor: "health",

    entertainment: "entertainment",
    netflix: "entertainment",
    spotify: "entertainment",
    cine: "entertainment",
    pelicula: "entertainment",
    juego: "entertainment",
    game: "entertainment",

    clothing: "clothing",
    ropa: "clothing",
    clothes: "clothing",
    zapatillas: "clothing",
    shoes: "clothing",

    utilities: "utilities",
    servicios: "utilities",
    luz: "utilities",
    agua: "utilities",
    internet: "utilities",
    telefono: "utilities",
    phone: "utilities",
};

/**
 * Parses free-text expense messages.
 *
 * Supported formats:
 *   - "500 lunch"
 *   - "$1200 supermercado"
 *   - "uber 850"
 *   - "USD 50 coffee"
 *   - "1.500,50 comida" (European comma format)
 */
export function parseExpense(text: string): ParseResult | ParseFailure {
    const raw = text.trim();

    // Detect currency symbol prefix
    let detectedCurrency = "ARS";
    let normalized = raw;

    for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
        if (normalized.startsWith(symbol)) {
            detectedCurrency = code;
            normalized = normalized.slice(symbol.length).trim();
            break;
        }
    }

    const tokens = normalized.split(/\s+/);
    if (tokens.length === 0) {
        return { success: false, reason: "Empty message" };
    }

    // Check if first token is a known currency code
    if (
        tokens.length > 1 &&
        CURRENCY_CODES.has(tokens[0].toLowerCase())
    ) {
        detectedCurrency = tokens[0].toUpperCase();
        tokens.shift();
    }

    // Try to parse amount — first or last token
    let amount: number | null = null;
    let amountIndex = -1;

    for (const index of [0, tokens.length - 1]) {
        const parsed = parseAmount(tokens[index]);
        if (parsed !== null) {
            amount = parsed;
            amountIndex = index;
            break;
        }
    }

    if (amount === null || amount <= 0) {
        return {
            success: false,
            reason: "Could not find a valid amount in the message",
        };
    }

    const descTokens = tokens.filter((_, i) => i !== amountIndex);
    const descText = descTokens.join(" ").toLowerCase();

    // Try to detect category from description tokens
    let category: string | null = null;
    for (const token of descTokens) {
        const lower = token.toLowerCase();
        if (KNOWN_CATEGORIES[lower]) {
            category = KNOWN_CATEGORIES[lower];
            break;
        }
    }

    return {
        success: true,
        data: {
            amount,
            currency: detectedCurrency,
            category,
            description: descText || null,
        },
    };
}

/**
 * Tries to parse a string token as a number.
 * Handles:
 *   - "1500"
 *   - "1,500" or "1.500" (thousand separator)
 *   - "1500.50" or "1500,50" (decimal)
 */
function parseAmount(token: string): number | null {
    // Reject negative values
    if (token.startsWith("-")) return null;

    // Remove non-numeric except . and ,
    const cleaned = token.replace(/[^\d.,]/g, "");
    if (!cleaned) return null;

    // European/AR format: "1.500,50" or plain "1500,50"
    if (/\d+\.\d{3},\d{1,2}$/.test(cleaned)) {
        const n = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
        return isFinite(n) ? n : null;
    }

    // Dot as thousand separator (no decimals): "163.000" or "1.250.000"
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        const n = parseFloat(cleaned.replace(/\./g, ""));
        return isFinite(n) ? n : null;
    }

    // Comma as decimal: "1500,50"
    if (/,\d{1,2}$/.test(cleaned)) {
        const n = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
        return isFinite(n) ? n : null;
    }

    // Comma as thousand separator: "1,500"
    if (/,\d{3}$/.test(cleaned)) {
        const n = parseFloat(cleaned.replace(/,/g, ""));
        return isFinite(n) ? n : null;
    }

    const n = parseFloat(cleaned.replace(/,/g, ""));
    return isFinite(n) ? n : null;
}
