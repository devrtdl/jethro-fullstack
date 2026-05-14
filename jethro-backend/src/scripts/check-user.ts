import pg from 'pg';

const DB_URL = 'postgresql://postgres.sglpwjmdrvapurllisdn:D4n13l%23lopes2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function main() {
  const pool = new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  const email = process.argv[2] ?? 'rogeriodariux@gmail.com';

  const users = await pool.query<{ id: string; email: string; auth_id: string; auth_provider: string; status: string; created_at: string }>(
    `SELECT id, email, auth_id, auth_provider, status, created_at FROM users WHERE lower(email) = lower($1) ORDER BY created_at`,
    [email]
  );

  console.log(`\n=== USERS (${users.rowCount}) ===`);
  users.rows.forEach(u => console.log(u));

  for (const u of users.rows) {
    const diag = await pool.query(
      `SELECT id, modelo_identificado, q11_faturamento, created_at FROM diagnostico_respostas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [u.id]
    );
    console.log(`\n--- Diagnóstico (user ${u.id.slice(0,8)}…) ---`);
    console.log(diag.rows[0] ?? 'NENHUM');

    const ass = await pool.query(
      `SELECT id, plano, status, store, validade_ate FROM assinaturas WHERE user_id = $1`,
      [u.id]
    );
    console.log(`--- Assinatura ---`);
    console.log(ass.rows[0] ?? 'NENHUMA');

    const onb = await pool.query(
      `SELECT id, modelo_confirmado, status, created_at FROM onboarding_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [u.id]
    );
    console.log(`--- Onboarding Session ---`);
    console.log(onb.rows[0] ?? 'NENHUMA');

    const plano = await pool.query(
      `SELECT id, status, created_at FROM plano_acao_semanas WHERE user_id = $1 LIMIT 1`,
      [u.id]
    );
    console.log(`--- Plano ---`);
    console.log(plano.rows[0] ?? 'NENHUM');
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
