export interface ParsedExpense {
    amount: number;
    currency: string;
    category: string | null;
    description: string | null;
    splitDivisor?: number;
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
    parrilla: "food",
    asado: "food",

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

export const CATEGORY_LIST = [
    "food",
    "transport",
    "market",
    "health",
    "entertainment",
    "clothing",
    "utilities",
];

export const CATEGORY_EMOJI: Record<string, string> = {
    food: "🍔",
    transport: "🚕",
    market: "🛒",
    health: "💊",
    entertainment: "🎬",
    clothing: "👗",
    utilities: "⚡",
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
    let normalized = text.trim();

    // 1. Detect currency symbol prefix
    let detectedCurrency = "ARS";
    for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
        if (normalized.startsWith(symbol)) {
            detectedCurrency = code;
            normalized = normalized.slice(symbol.length).trim();
            break;
        }
    }

    // 2. Split detection: "split X", "dividido X", "shared X", "compartido X"
    // We do this BEFORE tokenizing to protect the split number from being picked as the amount
    let splitDivisor: number | undefined;
    const splitRegex = /(split|dividido|shared|compartido)(\s+(entre|por))?\s+(\d+)/i;
    const splitMatch = normalized.match(splitRegex);

    if (splitMatch) {
        splitDivisor = parseInt(splitMatch[4], 10);
        // Remove the split part from the text
        normalized = normalized.replace(splitRegex, " ").replace(/\s+/g, " ").trim();
    }

    let tokens = normalized.split(/\s+/);
    if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === "")) {
        return { success: false, reason: "Empty message" };
    }

    // 3. Check if first token is a known currency code
    if (
        tokens.length > 1 &&
        CURRENCY_CODES.has(tokens[0].toLowerCase())
    ) {
        detectedCurrency = tokens[0].toUpperCase();
        tokens.shift();
    }

    // 4. Try to parse amount — search all tokens
    let amount: number | null = null;
    let amountIndex = -1;

    // Favor start or end of message for amount if multiple numbers are present
    const indicesToCheck = [0, tokens.length - 1, ...Array.from({ length: tokens.length }, (_, i) => i).filter(i => i !== 0 && i !== tokens.length - 1)];

    for (const index of indicesToCheck) {
        if (tokens[index] === undefined) continue;
        const parsed = parseAmount(tokens[index]);
        if (parsed !== null && parsed > 0) {
            amount = parsed;
            amountIndex = index;
            break;
        }
    }

    if (amount === null) {
        return {
            success: false,
            reason: "Could not find a valid amount in the message",
        };
    }

    // 5. Build description and detect category
    const descTokens = tokens.filter((_, i) => i !== amountIndex);
    const descText = descTokens.join(" ").toLowerCase().trim();

    const filteredDescTokens = descText.split(/\s+/).filter(Boolean);
    let category: string | null = null;
    for (const token of filteredDescTokens) {
        if (KNOWN_CATEGORIES[token]) {
            category = KNOWN_CATEGORIES[token];
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
            splitDivisor,
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

    let multiplier = 1;
    let amountToken = token;

    if (token.toLowerCase().endsWith("k")) {
        multiplier = 1000;
        amountToken = token.slice(0, -1);
    }

    // Remove non-numeric except . and ,
    const cleaned = amountToken.replace(/[^\d.,]/g, "");
    if (!cleaned) return null;

    let result: number | null = null;

    // European/AR format: "1.500,50" or plain "1500,50"
    if (/\d+\.\d{3},\d{1,2}$/.test(cleaned)) {
        result = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    }
    // Dot as thousand separator (no decimals): "163.000" or "1.250.000"
    else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
        result = parseFloat(cleaned.replace(/\./g, ""));
    }
    // Comma as decimal: "1500,50"
    else if (/,\d{1,2}$/.test(cleaned)) {
        result = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    }
    // Comma as thousand separator: "1,500"
    else if (/,\d{3}$/.test(cleaned)) {
        result = parseFloat(cleaned.replace(/,/g, ""));
    } else {
        result = parseFloat(cleaned.replace(/,/g, ""));
    }

    if (result === null || !isFinite(result)) return null;
    return result * multiplier;
}
