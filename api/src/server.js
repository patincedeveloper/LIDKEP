import { createServer } from 'node:http';
import app from './app.js';
import { disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

const server = createServer(app);

server.listen(env.PORT, env.HOST, () => {
  console.log(`LIDKEP API listening on http://${env.HOST}:${env.PORT}${env.API_PREFIX}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down LIDKEP API.`);
  const timeout = setTimeout(() => process.exit(1), env.SHUTDOWN_TIMEOUT_MS);
  timeout.unref();
  server.close(async (error) => {
    await disconnectDatabase();
    if (error) {
      console.error('HTTP server shutdown failed.', error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
