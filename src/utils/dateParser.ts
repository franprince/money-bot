/**
 * Simple date parser for reminders.
 * Supports:
 * - "+Nh" or "Nh" (e.g., "+3h", "12h")
 * - "Tomorrow at HH:mm" (e.g., "mañana a las 10:00")
 * - "HH:mm" (today if not passed, else tomorrow)
 * - "YYYY-MM-DD HH:mm"
 */
export function parseReminderDate(input: string): Date | null {
    const now = new Date();
    const cleanInput = input.trim().toLowerCase();

    // 1. Relative hours: +3h, 12h
    const hourMatch = cleanInput.match(/^(\+)?(\d+)h$/);
    if (hourMatch) {
        const hours = parseInt(hourMatch[2], 10);
        const result = new Date(now);
        result.setHours(result.getHours() + hours);
        return result;
    }

    // 2. "mañana a las HH:mm" or "mañana HH:mm"
    const tomorrowMatch = cleanInput.match(/mañana(?:\s+a\s+las)?\s+(\d{1,2})(?::(\d{2}))?/);
    if (tomorrowMatch) {
        const hours = parseInt(tomorrowMatch[1], 10);
        const minutes = parseInt(tomorrowMatch[2] || "0", 10);
        const result = new Date(now);
        result.setDate(result.getDate() + 1);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }

    // 3. "en X días a las HH" or "en X días HH"
    const daysMatch = cleanInput.match(/en\s+(\d+)\s+días(?:\s+a\s+las)?\s+(\d{1,2})(?::(\d{2}))?/);
    if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        const hours = parseInt(daysMatch[2], 10);
        const minutes = parseInt(daysMatch[3] || "0", 10);
        const result = new Date(now);
        result.setDate(result.getDate() + days);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }

    // 4. HH:mm
    const timeMatch = cleanInput.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const result = new Date(now);
        result.setHours(hours, minutes, 0, 0);
        // If it's already past that time today, assume tomorrow
        if (result <= now) {
            result.setDate(result.getDate() + 1);
        }
        return result;
    }

    // 5. Try native Date parsing for other formats
    const trial = new Date(input);
    if (!isNaN(trial.getTime())) {
        return trial;
    }

    return null;
}
