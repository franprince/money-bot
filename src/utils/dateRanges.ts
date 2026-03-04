/**
 * Returns [from, to) ISO strings for a given period relative to now.
 * All times are in LOCAL calendar, stored as UTC ISO strings.
 */

export function todayRange(): [string, string] {
    const now = new Date();
    const from = startOfDay(now);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return [from.toISOString(), to.toISOString()];
}

export function weekRange(): [string, string] {
    const now = new Date();
    const from = startOfDay(now);
    // Go back to Monday
    const day = from.getDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day;
    from.setDate(from.getDate() + diff);

    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return [from.toISOString(), to.toISOString()];
}

export function monthRange(): [string, string] {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return [from.toISOString(), to.toISOString()];
}

export function yearRange(): [string, string] {
    const now = new Date();
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear() + 1, 0, 1);
    return [from.toISOString(), to.toISOString()];
}

/**
 * Custom range: inclusive of `fromDate`, exclusive of `toDate + 1 day`.
 * @param fromDate "YYYY-MM-DD"
 * @param toDate   "YYYY-MM-DD"
 */
export function customRange(
    fromDate: string,
    toDate: string
): [string, string] | null {
    const from = new Date(fromDate + "T00:00:00.000Z");
    const to = new Date(toDate + "T00:00:00.000Z");
    to.setUTCDate(to.getUTCDate() + 1); // make to exclusive

    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
    if (from > to) return null;

    return [from.toISOString(), to.toISOString()];
}

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
