import { closeDbPool } from '../lib/db.js';
import { createFormsService } from '../domain/forms/service.js';

async function run() {
  await createFormsService();
  await closeDbPool();
  process.stdout.write('Seed validado com sucesso.\n');
}

void run().catch(async (error) => {
  await closeDbPool();
  process.stderr.write(`${error instanceof Error ? error.message : 'Falha ao executar seed.'}\n`);
  process.exit(1);
});
