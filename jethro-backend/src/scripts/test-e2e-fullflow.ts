/**
 * Simulação E2E Completa — Jethro
 * Testa o fluxo real via API: Auth → Diagnóstico → Onboarding → Plano → Home
 * Cobre todos os 9 modelos do Motor v2.7.
 * Uso: npx tsx src/scripts/test-e2e-fullflow.ts
 */

import pg from 'pg';

const DB_URL     = process.env.DATABASE_URL     ?? 'postgresql://postgres.sglpwjmdrvapurllisdn:D4n13l%23lopes2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres';
const SUPA_URL   = process.env.SUPABASE_URL     ?? 'https://sglpwjmdrvapurllisdn.supabase.co';
const SUPA_SRK   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbHB3am1kcnZhcHVybGxpc2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA0MzI0NSwiZXhwIjoyMDg5NjE5MjQ1fQ.GaXzG1hzoat1zHxGx2UOEU7CHcPBRhbX2OXcbJovtnU';
const API_URL    = process.env.BACKEND_URL      ?? 'https://jethro-fullstack.onrender.com';
const TEST_PASS  = 'TestJethro@2026!';
const STAMP      = Date.now();

// ─── Cores ───────────────────────────────────────────────────────────────────
const G = '\x1b[32m';  const R = '\x1b[31m'; const Y = '\x1b[33m';
const C = '\x1b[36m';  const D = '\x1b[0m';
const PASS = `${G}✅ PASS${D}`; const FAIL = `${R}❌ FAIL${D}`;
const INFO = `${C}ℹ${D} `;

function ok(label: string, v: boolean, det = '') {
  console.log(`  ${v ? PASS : FAIL} ${label}${det ? ' → ' + det : ''}`);
  return v;
}

// ─── Supabase Admin ───────────────────────────────────────────────────────────

async function supabaseAdminPost(path: string, body: unknown): Promise<unknown> {
  const r = await fetch(`${SUPA_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function supabaseAdminDelete(userId: string): Promise<void> {
  await fetch(`${SUPA_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { apikey: SUPA_SRK, Authorization: `Bearer ${SUPA_SRK}` },
  });
}

async function createTestUser(email: string): Promise<{ authId: string; jwt: string }> {
  // Cria usuário via Admin API
  const created = await supabaseAdminPost('/admin/users', {
    email,
    password: TEST_PASS,
    email_confirm: true,
  }) as { id?: string; error?: string };

  if (!created.id) throw new Error(`Falha ao criar user ${email}: ${JSON.stringify(created)}`);

  // Faz sign-in para obter JWT
  const signIn = await supabaseAdminPost('/token?grant_type=password', {
    email,
    password: TEST_PASS,
  }) as { access_token?: string; error?: string };

  if (!signIn.access_token) throw new Error(`Falha no sign-in ${email}: ${JSON.stringify(signIn)}`);

  return { authId: created.id, jwt: signIn.access_token };
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function apiGet(path: string, jwt: string) {
  const r = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const j = await r.json() as { data?: unknown; error?: string; message?: string };
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${j.error ?? j.message ?? JSON.stringify(j)}`);
  return j.data;
}

async function apiPost(path: string, jwt: string, body: unknown) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });
  const j = await r.json() as { data?: unknown; error?: string; message?: string };
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}: ${j.error ?? j.message ?? JSON.stringify(j)}`);
  return j.data;
}

// ─── Respostas de Onboarding base + por modelo ───────────────────────────────

const BASE_ANSWERS: Record<string, string> = {
  'onb_o1_nome_negocio': 'Negócio E2E',
  'onb_o2_equipa_total': '1',
  'onb_o2a_equipa_comercial': '0',
  'onb_o3_dedicacao': 'B',
  'onb_o4_faturamento_3m': 'B',
  'onb_o5_o_que_sobra': 'B',
  'onb_o6_custo_fixo': 'A',
  'onb_o7_ativo_fisico': 'A',
  'onb_o7a_clientes': 'B',
  'onb_o7a2_recorrentes': 'A',
  'onb_o7b_ticket_medio': 'B',
  'onb_o8_conversao': 'B',
  'onb_o9_objecao': 'A',
  'onb_o10_sazonalidade': 'A',
  'onb_o11_canal': 'A',
  'onb_ob1_equipe_desafio': 'A',
  'onb_ob2_concentracao': 'A',
  'onb_ob3_razao_subpreco': 'A',
  'onb_ob4_socio': 'A',
  'onb_ob5_inadimplencia': 'A',
  'onb_ob6_plataforma': 'A',
  'onb_o30_meta': 'Crescer e consolidar o negócio',
  'onb_o31_problema': 'Organização e clareza estratégica',
  'onb_o32_impacto': 'Independência financeira',
  'onb_o33_ja_tentou': 'A',
  'onb_o34_nota': '',
};

const FASE4_ANSWERS: Record<string, Record<string, string>> = {
  // C/D — Bloco Financeiro
  CD: {
    'onb_o12_precificacao': 'B',
    'onb_o13_dividas_forn': 'A',
    'onb_o15_clareza_custos': 'B',
  },
  // A/B — Bloco Clareza de Oferta
  AB: {
    'onb_o16_clareza_pos': 'B',
    'onb_o17_num_ofertas': 'B',
    'onb_o18_oferta_principal': 'Serviço principal de consultoria personalizada',
  },
  // G — Bloco Operação
  G: {
    'onb_o19_dependencia_dono': 'A',
    'onb_o20_processos': 'B',
    'onb_o21_ferias': 'C',
  },
  // H — Bloco Liderança
  H: {
    'onb_o22_metas_equipa': 'B',
    'onb_o22a_decisoes': 'C',
  },
  // E/F — Bloco Posicionamento
  EF: {
    'onb_o24_posicionamento': 'Ajudo empreendedores cristãos a crescer com propósito',
    'onb_o25_gap_ticket': 'B',
  },
  // X — Bloco Escalar
  X: {
    'onb_o26_capacidade_invest': 'A',
    'onb_o27_processos_x': 'B',
    'onb_o28_barreira_escala': 'B',
    'onb_o29_mentoria': 'A',
  },
};

const FASE4_BLOCK: Record<string, string> = {
  A: 'AB', B: 'AB', C: 'CD', D: 'CD',
  E: 'EF', F: 'EF', G: 'G', H: 'H', X: 'X',
};

function buildAnswers(model: string): Record<string, string> {
  const block = FASE4_BLOCK[model] ?? 'AB';
  return { ...BASE_ANSWERS, ...(FASE4_ANSWERS[block] ?? {}) };
}

// ─── Diagnóstico esperado por cenário (motor v2.7) ───────────────────────────

const CENARIOS = [
  { id: 'C1', nome: 'Carlos Mendes', model: 'D',
    diag: { fase_negocio: 'D', conexao_dons: 'B', proposito_negocio: 'B', estrutura_negocio: 'B', organizacao_financeira: 'B', faturamento_faixa: '5k_20k', lucro_crescimento: 'C', precificacao: 'B', canal_aquisicao: 'A', capacidade_operacional: 'B', horas_semana: 'C' } },
  { id: 'C2', nome: 'Ana Lima', model: 'C',
    diag: { fase_negocio: 'C', conexao_dons: 'A', proposito_negocio: 'A', estrutura_negocio: 'B', organizacao_financeira: 'C', faturamento_faixa: 'upto_5k', lucro_crescimento: 'A', precificacao: 'C', canal_aquisicao: 'A', capacidade_operacional: 'B', horas_semana: 'C' } },
  { id: 'C3', nome: 'Rodrigo Santos', model: 'A',
    diag: { fase_negocio: 'C', conexao_dons: 'C', proposito_negocio: 'B', estrutura_negocio: 'C', organizacao_financeira: 'C', faturamento_faixa: 'upto_5k', lucro_crescimento: 'A', precificacao: 'B', canal_aquisicao: 'A', capacidade_operacional: 'B', horas_semana: 'B' } },
  { id: 'C4', nome: 'Fernanda Costa', model: 'B',
    diag: { fase_negocio: 'C', conexao_dons: 'A', proposito_negocio: 'A', estrutura_negocio: 'A', organizacao_financeira: 'A', faturamento_faixa: 'upto_5k', lucro_crescimento: 'B', precificacao: 'A', canal_aquisicao: 'A', capacidade_operacional: 'B', horas_semana: 'C' } },
  { id: 'C5', nome: 'Marcos Oliveira', model: 'G',
    diag: { fase_negocio: 'C', conexao_dons: 'A', proposito_negocio: 'A', estrutura_negocio: 'B', organizacao_financeira: 'B', faturamento_faixa: '5k_20k', lucro_crescimento: 'A', precificacao: 'A', canal_aquisicao: 'A', capacidade_operacional: 'C', horas_semana: 'C' } },
  { id: 'C6', nome: 'Paulo Ramos', model: 'H',
    diag: { fase_negocio: 'D', conexao_dons: 'A', proposito_negocio: 'A', estrutura_negocio: 'A', organizacao_financeira: 'A', faturamento_faixa: '5k_20k', lucro_crescimento: 'B', precificacao: 'A', canal_aquisicao: 'A', capacidade_operacional: 'B', horas_semana: 'D' } },
  { id: 'C7', nome: 'Juliana Mendes', model: 'E',
    diag: { fase_negocio: 'A', conexao_dons: 'A', proposito_negocio: 'B', estrutura_negocio: 'C', organizacao_financeira: 'B', faturamento_faixa: 'not_revenue', lucro_crescimento: 'A', precificacao: 'B', canal_aquisicao: 'A', capacidade_operacional: 'B', horas_semana: 'B' } },
  { id: 'C8', nome: 'Ricardo Alves', model: 'F',
    diag: { fase_negocio: 'C', conexao_dons: 'A', proposito_negocio: 'A', estrutura_negocio: 'B', organizacao_financeira: 'A', faturamento_faixa: 'upto_5k', lucro_crescimento: 'B', precificacao: 'B', canal_aquisicao: 'A', capacidade_operacional: 'B', horas_semana: 'C' } },
  { id: 'C9', nome: 'Beatriz Nunes', model: 'X',
    diag: { fase_negocio: 'D', conexao_dons: 'A', proposito_negocio: 'A', estrutura_negocio: 'A', organizacao_financeira: 'A', faturamento_faixa: '20k_50k', lucro_crescimento: 'A', precificacao: 'A', canal_aquisicao: 'C', capacidade_operacional: 'A', horas_semana: 'C' } },
];

const FAIXA_TO_BAND: Record<string, string> = {
  not_revenue: 'A', upto_2k: 'B', upto_5k: 'B',
  '2k_10k': 'C', '5k_20k': 'C', '10k_25k': 'D', '20k_50k': 'D',
};

// ─── Polling plano ────────────────────────────────────────────────────────────

async function pollPlano(jwt: string, timeoutMs = 120000): Promise<'ready' | 'timeout' | 'error'> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4000));
    const s = await apiGet('/plano/status', jwt) as { status: string } | null;
    if (!s) continue;
    if (s.status === 'ready') return 'ready';
    if (s.status === 'error') return 'error';
  }
  return 'timeout';
}

// ─── Limpeza ──────────────────────────────────────────────────────────────────

async function cleanup(pool: pg.Pool, authId: string, email: string) {
  try {
    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);
    await supabaseAdminDelete(authId);
  } catch { /* ignore cleanup errors */ }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  console.log('\n' + '═'.repeat(70));
  console.log('  E2E SIMULAÇÃO COMPLETA — JETHRO MOTOR v2.7');
  console.log('  Auth → Diagnóstico → Onboarding → Plano → Home');
  console.log('═'.repeat(70));
  console.log(`${INFO}Backend: ${API_URL}`);
  console.log(`${INFO}9 cenários × 6 checks = 54 verificações`);

  const results: { id: string; passes: number; fails: number }[] = [];

  for (const c of CENARIOS) {
    const email = `e2e_${c.id.toLowerCase()}_${STAMP}@jethro-test.com`;
    console.log(`\n${Y}${c.id} — ${c.nome} (Modelo ${c.model})${D}`);
    console.log('─'.repeat(60));

    let authId = '';
    let passes = 0; let fails = 0;
    const track = (v: boolean) => { v ? passes++ : fails++; };

    try {
      // ── 1. Auth ─────────────────────────────────────────────────────────────
      process.stdout.write('  [1/6] Autenticação... ');
      const { authId: aid, jwt } = await createTestUser(email);
      authId = aid;
      console.log(`${G}OK${D} (${email})`);

      // Trigger user auto-create in users table
      await apiGet('/user/flow-status', jwt);

      // ── 2. Diagnóstico no banco ──────────────────────────────────────────────
      process.stdout.write('  [2/6] Inserindo diagnóstico... ');
      const { rows: userRows } = await pool.query<{ id: string }>(`SELECT id FROM users WHERE auth_id = $1`, [authId]);
      const userId = userRows[0]?.id;
      if (!userId) throw new Error('users.id não encontrado após auto-create');

      const diagAnswers = c.diag as Record<string, string>;
      const band = FAIXA_TO_BAND[diagAnswers.faturamento_faixa ?? ''] ?? 'A';
      await pool.query(`
        INSERT INTO diagnostico_respostas
          (user_id, modelo_identificado, q11_faturamento, score, answers_by_code, payload_raw)
        VALUES ($1, $2, $3, 75, $4, $5)`,
        [userId, c.model, band, diagAnswers, JSON.stringify(diagAnswers)]
      );
      console.log(`${G}OK${D} (modelo=${c.model}, faixa=${band})`);

      // ── 3. Assinatura trial ──────────────────────────────────────────────────
      process.stdout.write('  [3/6] Ativando trial... ');
      await pool.query(`
        INSERT INTO assinaturas (user_id, plano, status, store, validade_ate)
        VALUES ($1, 'pro', 'trial', 'mock', NOW() + interval '30 days')`,
        [userId]
      );

      // ── 4. Onboarding: questões Fase 4 ──────────────────────────────────────
      const qs = await apiGet('/onboarding/questions', jwt) as Array<{ code: string; metadata: { phase?: string } }>;
      const fase4 = qs.filter(q => String(q.metadata?.phase) === '4').map(q => q.code);
      console.log(`${G}OK${D}`);

      const block = FASE4_BLOCK[c.model] ?? '';
      const esperadas: string[] = Object.keys(FASE4_ANSWERS[block] ?? {}).filter(k => !k.includes('posicionamento') && !k.includes('principal'));
      const textCodes = ['onb_o18_oferta_principal', 'onb_o24_posicionamento'];
      const checkCodes = [...Object.keys(FASE4_ANSWERS[block] ?? {})];

      const gateOk = ok(`Fase 4 — ${checkCodes.length} perguntas do Modelo ${c.model}`,
        checkCodes.every(code => fase4.includes(code) || textCodes.includes(code)
          ? fase4.some(f => f === code || (f.includes('posicionamento') && code.includes('posicionamento')) || (f.includes('principal') && code.includes('principal')))
          : false
        ) || checkCodes.every(code => fase4.includes(code)),
        `DB: [${fase4.join(', ')}]`
      );
      track(gateOk);

      // ── 5. Submit onboarding + gerar plano ──────────────────────────────────
      process.stdout.write('  [5/6] Onboarding submit + plano... ');
      const answers = buildAnswers(c.model);
      await apiPost('/onboarding/submit', jwt, { answers });
      await apiPost('/plano/generate', jwt, {});
      console.log(`${G}iniciado${D}`);

      // Poll plano
      process.stdout.write(`  ⏳ Aguardando plano (até 2 min)...`);
      const planoStatus = await pollPlano(jwt);
      const planoOk = ok(
        `Plano gerado (POST /plano/generate)`,
        planoStatus === 'ready',
        planoStatus !== 'ready' ? planoStatus : ''
      );
      track(planoOk);

      // ── 6. Verificar /home ───────────────────────────────────────────────────
      const home = await apiGet('/home', jwt) as {
        modelo: string | null;
        devocional: { titulo: string; texto: string; versiculo: string } | null;
        plano: {
          semanaNumero: number;
          objetivo: string;
          tarefas: Array<{ texto: string }>;
          gateStatus: string;
        } | null;
        onboardingCompleto: boolean;
        tagline: string | null;
      };

      const modeloOk     = ok(`/home → modelo="${c.model}"`, home.modelo === c.model);
      const devOk        = ok(`/home → devocional presente`, !!home.devocional?.titulo, home.devocional?.titulo ?? '');
      const planoHomeOk  = ok(`/home → semana 1 com tarefas`, (home.plano?.semanaNumero ?? 0) >= 1 && (home.plano?.tarefas?.length ?? 0) > 0,
        `sem=${home.plano?.semanaNumero ?? '?'}, tarefas=${home.plano?.tarefas?.length ?? 0}`);
      const taglineOk    = ok(`/home → tagline presente`, !!home.tagline, home.tagline ?? 'null');

      track(modeloOk); track(devOk); track(planoHomeOk); track(taglineOk);

    } catch (e) {
      console.log(`\n  ${FAIL} Erro inesperado: ${e instanceof Error ? e.message : String(e)}`);
      fails += Math.max(0, 6 - passes - fails);
    } finally {
      await cleanup(pool, authId, email);
    }

    console.log(`  ${passes > 0 ? G : R}→ ${passes} pass, ${fails} fail${D}`);
    results.push({ id: c.id, passes, fails });
  }

  // ── Resumo final ─────────────────────────────────────────────────────────────
  const totalPass = results.reduce((s, r) => s + r.passes, 0);
  const totalFail = results.reduce((s, r) => s + r.fails, 0);
  const cFail = results.filter(r => r.fails > 0).map(r => r.id).join(', ');

  console.log('\n' + '═'.repeat(70));
  console.log(`  RESULTADO E2E: ${totalPass} pass, ${totalFail} fail de ${totalPass + totalFail} checks`);
  if (totalFail === 0) {
    console.log(`${G}  ✅ TODOS OS CHECKS PASSARAM${D}`);
  } else {
    console.log(`${R}  ❌ FALHAS: ${cFail}${D}`);
  }
  console.log('  Checks por cenário:');
  results.forEach(r => {
    const c = CENARIOS.find(x => x.id === r.id)!;
    console.log(`    ${r.id} Modelo ${c.model}: ${r.fails === 0 ? G + '✅' : R + '❌'} ${r.passes}✓ ${r.fails}✗${D}`);
  });
  console.log('═'.repeat(70) + '\n');

  await pool.end();
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
