# Changelog

## [1.2.2] - 2026-03-05

### Fixed
- **GrammyError in Callbacks**: Fixed a crash when a message was edited with identical content.
    - Consolidated duplicate reminder callback handlers.
    - Added safety check to ignore "message is not modified" errors from Telegram API.
- **Instance Management**: Improved PID check to prevent the bot from terminating itself if its PID matches the one in `bot.pid` (common in Docker/Coolify).
- **Graceful Shutdown**: Ensured PID file is cleaned up correctly on SIGINT/SIGTERM.

### Added
- **Callback Handler Tests**: Added unit tests for callback queries and error handling.

## [1.2.1] - 2026-03-04

### Fixed
- **Expense Parsing Bug**: Corrected an issue where expenses like "163k entre 4" were incorrectly parsed.
    - Improved split detection to support `entre` and `por` keywords.
    - Refined amount selection heuristic to prefer likely amounts (e.g., those with 'k' suffix or larger values) when multiple numbers are present.
    - Added comprehensive unit tests for various split and amount formats.

## [1.2.0] - 2026-03-04

### Added
- **Database Backup & Upload**: Automated database backups every 12 hours.
    - Uses SQLite's `VACUUM INTO` for safe, live backups.
    - Automatically uploads the `.db` file to a configured Telegram chat.
    - Smart change detection to avoid redundant backups.
    - Configurable `BACKUP_CHAT_ID` in `.env`.

## [1.1.0] - 2026-03-04

### Added
- **Customizable Reminders**: Users can now select from multiple duration options or set a specific date/time for reminders.
    - Added "Otros..." menu with +3h, +6h, +12h, +24h options.
    - Added "Seleccionar fecha" option with natural language parsing (e.g., "mañana a las 10:00", "en 5 días a las 11").
    - Added unit tests for date parsing logic.
- **AGENTS.md Guidelines**: Added automated test runs, atomic commits, and changelog updates to the development workflow.
