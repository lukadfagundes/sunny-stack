# Raspberry Pi Discord Bot Deployment Commands

## 1. Sync Code from Dev Machine to Pi

**Command:** (Run from Windows dev machine in project root)

```bash
tar -czvf - .dockerignore Dockerfile docker-compose.prod.yml bot/ lib/ prisma/ package.json package-lock.json tsconfig.json tsconfig.bot.json .env.production | ssh pi@sunny-pi "cd ~/sunny-stack && tar -xzvf -"
```

**What it does:**

- `tar -czvf -` - Create compressed archive, verbose output, to stdout
- Includes: Docker config, bot code, shared libs, Prisma schema, configs, production env
- `ssh pi@sunny-pi` - Connect to Pi
- `tar -xzvf -` - Extract archive on Pi, verbose output
- Shows each file as it syncs

**Excludes:** node_modules, .next, test files, documentation (per .dockerignore)

---

## 2. Build Fresh Docker Image on Pi

**Command:** (Run on Pi in ~/sunny-stack)

```bash
docker compose -f docker-compose.prod.yml down && docker rmi -f sunny-stack-bot:latest 2>/dev/null; docker build --no-cache --progress=plain -t sunny-stack-bot:latest -f Dockerfile . 2>&1 | tee build.log
```

**What it does:**

- `docker compose down` - Stop and remove existing container
- `docker rmi -f sunny-stack-bot:latest` - Force remove old image (suppress error if doesn't exist)
- `docker build` options:
  - `--no-cache` - Force rebuild all layers
  - `--progress=plain` - Verbose output showing every command
  - `-t sunny-stack-bot:latest` - Tag as latest
  - `-f Dockerfile` - Use this Dockerfile
- `2>&1 | tee build.log` - Show output AND save to build.log file

**Shows:**

- All Dockerfile steps
- npm install output
- Prisma generation
- TypeScript compilation
- Validation check results

---

## 3. Launch Bot and View Logs

**Command:** (Run on Pi in ~/sunny-stack)

```bash
docker compose -f docker-compose.prod.yml up -d discord-bot && sleep 2 && docker compose -f docker-compose.prod.yml logs -f discord-bot
```

**What it does:**

- `docker compose up -d discord-bot` - Start bot container in detached mode
- `sleep 2` - Wait 2 seconds for container to initialize
- `docker compose logs -f discord-bot` - Follow logs in real-time

**Shows:**

- dotenv loading messages
- Environment variables loaded
- Bot configuration validation
- Discord gateway connection
- Health server startup
- Any errors or warnings

**Exit logs:** Press `Ctrl+C` (bot keeps running in background)

---

## Quick Status Check

**Check if bot is running:**

```bash
docker compose -f docker-compose.prod.yml ps discord-bot
```

**View last 50 log lines:**

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 discord-bot
```

**Stop bot:**

```bash
docker compose -f docker-compose.prod.yml down
```

**Restart bot:**

```bash
docker compose -f docker-compose.prod.yml restart discord-bot
```

---

## Full Deploy Workflow (All 3 Steps)

**From Windows dev machine:**

```bash
# Step 1: Sync code
tar -czvf - .dockerignore Dockerfile docker-compose.prod.yml bot/ lib/ prisma/ package.json package-lock.json tsconfig.json tsconfig.bot.json .env.production | ssh pi@sunny-pi "cd ~/sunny-stack && tar -xzvf -"

# Step 2: Build on Pi (via SSH)
ssh pi@sunny-pi "cd ~/sunny-stack && docker compose -f docker-compose.prod.yml down && docker rmi -f sunny-stack-bot:latest 2>/dev/null; docker build --no-cache --progress=plain -t sunny-stack-bot:latest -f Dockerfile . 2>&1 | tee build.log"

# Step 3: Launch bot (via SSH)
ssh pi@sunny-pi "cd ~/sunny-stack && docker compose -f docker-compose.prod.yml up -d discord-bot && sleep 2 && docker compose -f docker-compose.prod.yml logs -f discord-bot"
```

**Note:** Step 3 will keep terminal attached to logs. Press `Ctrl+C` to exit (bot continues running).
