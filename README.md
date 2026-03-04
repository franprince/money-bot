# 💰 Money Bot

A Telegram bot to track your personal expenses via natural language messages.

## Features

- 📝 **Track expenses** by simply sending a message like `500 lunch` or `uber 850`
- 📊 **Summaries** by day, week, month, year, or any custom date range
- 🏷️ **Auto-detects categories** (food, transport, market, health, entertainment, clothing, utilities)
- 💱 **Multi-currency** support (ARS, USD, EUR, and more)
- 🗑️ **Delete** individual expenses by ID
- 🔒 Optional **user allowlist** to keep the bot private

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd money-bot
bun install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

```env
BOT_TOKEN=your_bot_token_from_BotFather
# Optional: restrict to specific Telegram user IDs
ALLOWED_USER_IDS=123456789,987654321
```

### 3. Run

```bash
# Development (auto-restarts on changes)
bun run dev

# Production
bun run start
```

## Usage

### Adding expenses

Just send a plain text message:

| Message | Parsed |
|---|---|
| `500 lunch` | $500 ARS · food |
| `$1200 supermercado` | $1,200 ARS · market |
| `uber 850` | $850 ARS · transport |
| `USD 50 coffee` | $50 USD · food |
| `farmacia 350` | $350 ARS · health |

### Commands

| Command | Description |
|---|---|
| `/today` | Summary for today |
| `/week` | Summary for this week (Mon–Sun) |
| `/month` | Summary for this month |
| `/year` | Summary for this year |
| `/summary 2026-01-01 2026-03-04` | Custom date range |
| `/list` | Last 10 expenses with IDs |
| `/delete 42` | Delete expense #42 |
| `/help` | Show all commands |

### Auto-detected categories

| Keywords | Category |
|---|---|
| lunch, dinner, breakfast, comida, cena, café... | food |
| uber, taxi, bus, subte, nafta... | transport |
| supermercado, mercado, carrefour... | market |
| farmacia, medico, pharmacy... | health |
| netflix, spotify, cine... | entertainment |
| ropa, zapatillas, clothes... | clothing |
| luz, internet, telefono... | utilities |

## Testing

```bash
bun test
```

## Project Structure

```
src/
├── index.ts              # Entry point
├── types.ts              # Shared interfaces
├── bot/
│   ├── bot.ts            # Bot factory + middleware
│   └── handlers/
│       ├── addExpense.ts
│       ├── summary.ts
│       ├── list.ts
│       ├── delete.ts
│       └── help.ts
├── db/
│   └── database.ts       # SQLite via bun:sqlite
├── parser/
│   └── parseExpense.ts   # Natural language parser
├── utils/
│   ├── dateRanges.ts     # Date range helpers
│   └── formatters.ts     # Message formatters
└── __tests__/
    ├── parseExpense.test.ts
    └── database.test.ts
```

## Data

Expenses are stored in `data/expenses.db` (SQLite, auto-created on first run). This file is excluded from git.
