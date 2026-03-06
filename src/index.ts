import { createBot } from "./bot/bot";
import { startRemindersWorker, checkPendingReminders } from "./bot/remindersWorker";
import { notifyChangelog } from "./bot/changelogNotifier";
import { startBackupWorker } from "./bot/backupWorker";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error("❌ BOT_TOKEN is not set. Please check your .env file.");
    process.exit(1);
}

// Ensure data directory exists
const DATA_DIR = join(process.cwd(), "data");
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

// PID file management to ensure only one instance runs
const PID_FILE = join(DATA_DIR, "bot.pid");

if (existsSync(PID_FILE)) {
    try {
        const oldPid = parseInt(readFileSync(PID_FILE, "utf-8"), 10);
        if (!isNaN(oldPid) && oldPid !== process.pid) {
            console.log(`⚠️ Previous instance found with PID ${oldPid}. Terminating...`);
            try {
                process.kill(oldPid, "SIGTERM");
                // Wait a bit for it to die
                let attempts = 0;
                while (attempts < 5) {
                    try {
                        process.kill(oldPid, 0); // Check if process exists
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        attempts++;
                    } catch (e) {
                        break; // Process is gone
                    }
                }
            } catch (e) {
                console.log("ℹ️ Could not terminate old process (might be already dead or lack permissions).");
            }
        }
    } catch (err) {
        console.error("❌ Error reading or processing PID file:", err);
    }
}

writeFileSync(PID_FILE, process.pid.toString());

function cleanupPid() {
    try {
        if (existsSync(PID_FILE)) {
            const currentPidInFile = parseInt(readFileSync(PID_FILE, "utf-8"), 10);
            if (currentPidInFile === process.pid) {
                unlinkSync(PID_FILE);
            }
        }
    } catch (e) {
        // Ignore cleanup errors
    }
}

console.log("🤖 Starting Money Bot...");

const bot = createBot(token);
startRemindersWorker(bot);
startBackupWorker(bot);

// On startup: notify changelog and check pending reminders immediately
(async () => {
    await notifyChangelog(bot);
    await checkPendingReminders(bot);
})();

// Graceful shutdown
process.once("SIGINT", () => {
    console.log("\n👋 Stopping bot (SIGINT)...");
    cleanupPid();
    bot.stop();
});
process.once("SIGTERM", () => {
    console.log("\n👋 Stopping bot (SIGTERM)...");
    cleanupPid();
    bot.stop();
});

bot.start({
    onStart: (info) => {
        console.log(`✅ Bot @${info.username} is running`);
    },
});
