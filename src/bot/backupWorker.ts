import { statSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Bot } from "grammy";
import { InputFile } from "grammy";
import { DB_PATH, backupDb, getMetadata, setMetadata } from "../db/database";

const BACKUP_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

export async function checkAndPerformBackup(bot: Bot): Promise<void> {
    try {
        if (!existsSync(DB_PATH)) {
            console.warn(`[Backup] Database file not found at ${DB_PATH}`);
            return;
        }

        const stats = statSync(DB_PATH);
        const currentMtime = stats.mtime.toISOString();
        const lastBackupMtime = getMetadata("last_backup_db_mtime");

        if (lastBackupMtime === currentMtime) {
            console.log("[Backup] No changes detected since last backup.");
            return;
        }

        console.log("[Backup] Changes detected, performing backup...");

        const backupFile = join(process.cwd(), "data", `backup_${Date.now()}.db`);
        backupDb(backupFile);

        const chatId = getBackupChatId();
        if (!chatId) {
            console.error("[Backup] No BACKUP_CHAT_ID or ALLOWED_USER_IDS found. Cannot upload.");
            if (existsSync(backupFile)) unlinkSync(backupFile);
            return;
        }

        await bot.api.sendDocument(chatId, new InputFile(backupFile), {
            caption: `📦 *Database Backup*\nGenerated at: ${new Date().toLocaleString()}`,
            parse_mode: "Markdown",
        });

        console.log(`[Backup] Database uploaded to chat ${chatId}`);

        // Update metadata after successful upload
        setMetadata("last_backup_db_mtime", currentMtime);

        // Cleanup
        if (existsSync(backupFile)) unlinkSync(backupFile);
    } catch (err) {
        console.error("[Backup] Error during backup process:", err);
    }
}

function getBackupChatId(): number | null {
    if (process.env.BACKUP_CHAT_ID) {
        return parseInt(process.env.BACKUP_CHAT_ID, 10);
    }
    const allowed = process.env.ALLOWED_USER_IDS ?? "";
    const firstId = allowed.split(",")[0].trim();
    return firstId ? parseInt(firstId, 10) : null;
}

export function startBackupWorker(bot: Bot): void {
    console.log("💾 Backup worker started.");

    // Initial check on startup
    checkAndPerformBackup(bot);

    // Schedule every 12 hours
    setInterval(() => checkAndPerformBackup(bot), BACKUP_INTERVAL);
}
