FROM oven/bun:latest as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Run the bot
CMD ["bun", "run", "src/index.ts"]
