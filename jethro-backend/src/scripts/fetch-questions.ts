import pg from 'pg';
async function main() {
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres.sglpwjmdrvapurllisdn:D4n13l%23lopes2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });

  // verificar o que tem em diagnostic_questions
  const count = await pool.query(`SELECT count(*), metadata->>'form' as form FROM diagnostic_questions GROUP BY form`);
  process.stdout.write('Forms: ' + JSON.stringify(count.rows) + '\n');

  const r = await pool.query(`SELECT code, label, question_type, order_index, options, metadata FROM diagnostic_questions WHERE (metadata->>'form' IS NULL OR metadata->>'form' = 'diagnostico-inicial') ORDER BY order_index LIMIT 20`);
  process.stdout.write('Rows: ' + r.rowCount + '\n');
  r.rows.forEach(q => {
    process.stdout.write('\n[' + q.code + '] ' + q.label + '\n');
    if (Array.isArray(q.options)) q.options.forEach((o: any) => process.stdout.write('  [' + o.value + '] ' + o.label + '\n'));
  });
  await pool.end();
}
main().catch(e => { process.stderr.write(String(e) + '\n'); process.exit(1); });
