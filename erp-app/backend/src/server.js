const app = require('./app');
const config = require('../config/env');
const db = require('../db');

const server = app.listen(config.port, () => {
  console.log(`[ERP] Server running on http://localhost:${config.port}`);
  console.log(`[ERP] Environment: ${config.nodeEnv}`);
  console.log(`[ERP] Swagger: http://localhost:${config.port}/api-docs`);
  console.log(`[ERP] Health: http://localhost:${config.port}/api/health`);
});

const shutdown = async (sig) => {
  console.log(`[ERP] ${sig} received - shutting down gracefully`);
  server.close(async () => {
    try { await db.destroy(); } catch { /* ignore */ }
    process.exit(0);
  });
  setTimeout(() => { process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[ERP] Unhandled rejection:', reason);
});
