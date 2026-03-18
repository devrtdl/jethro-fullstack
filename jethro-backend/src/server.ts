import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

async function start() {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
