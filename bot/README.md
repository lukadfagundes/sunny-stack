# Bot Directory

Discord.js 14.14 bot application for sunny-stack.

## Overview

Discord bot implementation with slash commands and API integration.

## Structure

```
bot/
├── commands/         # Slash command implementations
├── events/          # Discord event handlers
├── utils/           # Bot-specific utilities
└── index.ts         # Bot entry point
```

## Key Components

- **Slash Commands**: Discord bot commands using command pattern
- **Event Handlers**: Discord.js event processing
- **API Integration**: Communication with Next.js API
- **Error Resilience**: Circuit breaker and retry logic

## Running the Bot

```bash
# Development
npm run bot:dev

# Deploy commands
npm run bot:deploy

# Test commands
npm run bot:test
```

## Documentation

See [bot/CLAUDE.md](CLAUDE.md) for Discord.js patterns and bot architecture.
