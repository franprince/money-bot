import { createBot } from "./bot/bot";
import { startRemindersWorker, checkPendingReminders } from "./bot/remindersWorker";
import { notifyChangelog } from "./bot/changelogNotifier";

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error("❌ BOT_TOKEN is not set. Please check your .env file.");
    process.exit(1);
}

console.log("🤖 Starting Money Bot...");

const bot = createBot(token);
startRemindersWorker(bot);

// On startup: notify changelog and check pending reminders immediately
(async () => {
    await notifyChangelog(bot);
    await checkPendingReminders(bot);
})();

// Graceful shutdown
process.once("SIGINT", () => {
    console.log("\n👋 Stopping bot (SIGINT)...");
    bot.stop();
});
process.once("SIGTERM", () => {
    console.log("\n👋 Stopping bot (SIGTERM)...");
    bot.stop();
});

bot.start({
    onStart: (info) => {
        console.log(`✅ Bot @${info.username} is running`);
    },
});
