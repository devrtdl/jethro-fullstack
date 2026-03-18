import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getDbPool } from '../lib/db.js';

async function run() {
  const migrationsDir = resolve(process.cwd(), 'supabase', 'migrations');
  const pool = getDbPool();
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const sqlPath = resolve(migrationsDir, file);
    const sql = await readFile(sqlPath, 'utf8');
    await pool.query(sql);
  }

  process.stdout.write(`Migracoes aplicadas com sucesso: ${files.join(', ')}\n`);
}

void run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Falha ao migrar banco.'}\n`);
  process.exit(1);
});
