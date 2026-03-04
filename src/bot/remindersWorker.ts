import type { Bot } from "grammy";
import { getPendingReminders, markReminderAsSent } from "../db/database";

export function startRemindersWorker(bot: Bot): void {
    console.log("🔔 Reminders worker started.");

    // Check for pending reminders every 30 seconds
    setInterval(async () => {
        try {
            const pending = getPendingReminders();
            for (const reminder of pending) {
                try {
                    await bot.api.sendMessage(reminder.user_id, `⏰ *Recordatorio:*\n${reminder.message}`, {
                        parse_mode: "Markdown",
                    });
                    markReminderAsSent(reminder.id);
                    console.log(`Reminder sent to ${reminder.user_id}: ${reminder.message}`);
                } catch (err) {
                    console.error(`Failed to send reminder ${reminder.id}:`, err);
                }
            }
        } catch (err) {
            console.error("Error in reminders worker:", err);
        }
    }, 30000); // 30 seconds
}
