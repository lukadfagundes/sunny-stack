/**
 * PM2 Ecosystem Configuration
 *
 * For Raspberry Pi deployment of Discord Gateway bot
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: "discord-bot",
      script: "./bot/index.ts",
      interpreter: "node",
      interpreter_args: "--loader tsx",
      instances: 1,
      exec_mode: "fork", // Gateway bot must run as single instance
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        DEPLOYMENT_MODE: "pi",
        // Other env vars loaded from .env file
      },
      env_production: {
        NODE_ENV: "production",
        DEPLOYMENT_MODE: "pi",
      },
      error_file: "./logs/discord-bot-error.log",
      out_file: "./logs/discord-bot-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      // Graceful shutdown
      kill_signal: "SIGINT",
      wait_ready: true,
      // Auto-restart on crashes
      exp_backoff_restart_delay: 100,
      // Environment-specific settings
      node_args: "--max-old-space-size=256",
    },
  ],
};
