/**
 * PM2 : chaque (re)start exécute un build puis le serveur Next.
 * Usage : pm2 start ecosystem.config.cjs
 *         pm2 restart portfolio
 */
module.exports = {
  apps: [
    {
      name: "portfolio",
      cwd: __dirname,
      script: "npm",
      args: "run build:start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
