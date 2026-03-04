import { expect, test, describe, spyOn, beforeEach, afterEach } from "bun:test";
import { checkAndPerformBackup } from "./backupWorker";
import { Bot } from "grammy";
import * as db from "../db/database";
import * as fs from "node:fs";

describe("Backup Worker", () => {
    let bot: Bot;

    beforeEach(() => {
        bot = {
            api: {
                sendDocument: async () => ({})
            }
        } as any;
    });

    test("should not perform backup if no changes detected", async () => {
        const getMetadataSpy = spyOn(db, "getMetadata").mockReturnValue("fixed-mtime");
        const statSyncSpy = spyOn(fs, "statSync").mockReturnValue({
            mtime: { toISOString: () => "fixed-mtime" }
        } as any);
        const backupDbSpy = spyOn(db, "backupDb");
        const sendDocumentSpy = spyOn(bot.api, "sendDocument");

        await checkAndPerformBackup(bot);

        expect(backupDbSpy).not.toHaveBeenCalled();
        expect(sendDocumentSpy).not.toHaveBeenCalled();
    });

    test("should perform backup and upload if changes detected", async () => {
        spyOn(fs, "existsSync").mockReturnValue(true);
        spyOn(db, "getMetadata").mockReturnValue("old-mtime");
        spyOn(fs, "statSync").mockReturnValue({
            mtime: { toISOString: () => "new-mtime" }
        } as any);
        const backupDbSpy = spyOn(db, "backupDb").mockImplementation(() => { });
        const sendDocumentSpy = spyOn(bot.api, "sendDocument").mockResolvedValue({} as any);
        const setMetadataSpy = spyOn(db, "setMetadata");
        spyOn(fs, "unlinkSync").mockImplementation(() => { });

        process.env.ALLOWED_USER_IDS = "12345";

        await checkAndPerformBackup(bot);

        expect(backupDbSpy).toHaveBeenCalled();
        expect(sendDocumentSpy).toHaveBeenCalled();
        expect(setMetadataSpy).toHaveBeenCalledWith("last_backup_db_mtime", "new-mtime");
    });
});
