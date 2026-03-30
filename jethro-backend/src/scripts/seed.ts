import { closeDbPool } from '../lib/db.js';
import { createFormsService } from '../domain/forms/service.js';
import { seedProductDomain } from './domain-seed.js';

async function run() {
  await createFormsService();
  await seedProductDomain();
  await closeDbPool();
  process.stdout.write('Seed validado com sucesso.\n');
}

void run().catch(async (error) => {
  await closeDbPool();
  process.stderr.write(`${error instanceof Error ? error.message : 'Falha ao executar seed.'}\n`);
  process.exit(1);
});
