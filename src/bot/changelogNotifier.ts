import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Bot } from "grammy";
import { getMetadata, setMetadata } from "../db/database";

const CHANGELOG_PATH = join(process.cwd(), "CHANGELOG.md");

export async function notifyChangelog(bot: Bot): Promise<void> {
    if (!existsSync(CHANGELOG_PATH)) return;

    const content = readFileSync(CHANGELOG_PATH, "utf-8");
    const lastHash = getMetadata("changelog_hash");

    // Simple hash to detect changes
    const currentHash = Buffer.from(content).toString("base64").slice(0, 32);

    if (lastHash !== currentHash) {
        console.log("🆕 New changes detected in CHANGELOG.md");
        const allowedUsers = getAllowedUserIds();

        // Find the latest version section
        const latestChanges = extractLatestChanges(content);

        for (const userId of allowedUsers) {
            try {
                await bot.api.sendMessage(userId, `🚀 *Novedades en Money Bot:*\n\n${latestChanges}`, {
                    parse_mode: "Markdown",
                });
            } catch (err) {
                console.error(`Failed to notify user ${userId} about changelog:`, err);
            }
        }

        setMetadata("changelog_hash", currentHash);
    }
}

function extractLatestChanges(content: string): string {
    // Basic logic to get the first ## section
    const lines = content.split("\n");
    let result = "";
    let foundFirst = false;

    for (const line of lines) {
        if (line.startsWith("## ")) {
            if (foundFirst) break;
            foundFirst = true;
            result += line + "\n";
            continue;
        }
        if (foundFirst) {
            result += line + "\n";
        }
    }

    return result.trim() || "Se han realizado mejoras en el bot.";
}

function getAllowedUserIds(): number[] {
    const raw = process.env.ALLOWED_USER_IDS ?? "";
    return raw
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
}
