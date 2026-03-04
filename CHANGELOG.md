# Changelog

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
