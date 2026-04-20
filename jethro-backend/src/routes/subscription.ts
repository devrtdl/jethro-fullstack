import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';

import { successResponse } from '../lib/api-response.js';
import { getDbPool } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { env } from '../config/env.js';

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError('Stripe não configurado.', 503, 'STRIPE_UNCONFIGURED');
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

const SUCCESS_HTML = (sessionId: string) => `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Pagamento Concluído — Jethro</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0B1F3B;color:#F5F3EE;font-family:-apple-system,sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      min-height:100vh;padding:24px;text-align:center;gap:20px}
    .icon{font-size:56px}
    h1{font-size:26px;font-weight:700;color:#C8A951}
    p{font-size:16px;color:#8A9BB0;line-height:1.5;max-width:320px}
    .note{font-size:13px;color:#5a6a80;margin-top:8px}
    .sid{font-size:11px;color:#3a4a60;margin-top:16px;word-break:break-all}
  </style>
</head>
<body>
  <div class="icon">✦</div>
  <h1>Pagamento concluído!</h1>
  <p>A tua assinatura Jethro está ativa. Fecha esta janela e volta ao aplicativo para continuar.</p>
  <p class="note">O aplicativo será atualizado automaticamente.</p>
  <p class="sid">Ref: ${sessionId.slice(-12)}</p>
  <script>
    setTimeout(function(){window.location.href='jethro://payment-success';},600);
  </script>
</body>
</html>`;

const CANCEL_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Pagamento Cancelado — Jethro</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0B1F3B;color:#F5F3EE;font-family:-apple-system,sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      min-height:100vh;padding:24px;text-align:center;gap:20px}
    .icon{font-size:56px}
    h1{font-size:26px;font-weight:700;color:#E05C5C}
    p{font-size:16px;color:#8A9BB0;line-height:1.5;max-width:320px}
  </style>
</head>
<body>
  <div class="icon">✗</div>
  <h1>Pagamento cancelado</h1>
  <p>Nenhum valor foi cobrado. Fecha esta janela e volta ao aplicativo para tentar novamente.</p>
  <script>
    setTimeout(function(){window.location.href='jethro://payment-cancel';},600);
  </script>
</body>
</html>`;

async function activateSubscription(userId: string, sessionId: string) {
  const pool = getDbPool();
  await pool.query(
    `INSERT INTO assinaturas (user_id, plano, status, store, receipt_token, validade_ate)
     VALUES ($1, 'pro', 'active', 'stripe', $2, NOW() + INTERVAL '30 days')
     ON CONFLICT (user_id) DO UPDATE SET
       plano = 'pro', status = 'active', store = 'stripe',
       receipt_token = $2, validade_ate = NOW() + INTERVAL '30 days', updated_at = NOW()`,
    [userId, sessionId]
  );
}

export async function registerSubscriptionRoutes(app: FastifyInstance) {
  /**
   * POST /subscription/create-checkout
   * Cria sessão Stripe Checkout e retorna a URL.
   */
  app.post('/subscription/create-checkout', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const stripe = getStripe();

    const backendUrl = env.BACKEND_URL;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: userId,
      metadata: { userId },
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: { name: 'Jethro Mentor PBN — Plano Pro' },
            recurring: { interval: 'month' },
            unit_amount: 14700,
          },
          quantity: 1,
        },
      ],
      success_url: `${backendUrl}/subscription/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${backendUrl}/subscription/checkout-cancel`,
    });

    return successResponse({ url: session.url, sessionId: session.id });
  });

  /**
   * GET /subscription/checkout-success
   * Página servida após checkout bem-sucedido. Ativa a assinatura e mostra HTML.
   */
  app.get<{ Querystring: { session_id?: string } }>(
    '/subscription/checkout-success',
    async (request, reply) => {
      const sessionId = request.query.session_id;

      if (sessionId && env.STRIPE_SECRET_KEY) {
        try {
          const stripe = getStripe();
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          const userId = session.client_reference_id ?? (session.metadata?.userId as string | undefined);

          if (userId && (session.payment_status === 'paid' || session.status === 'complete')) {
            await activateSubscription(userId, sessionId);
          }
        } catch {
          // Falha silenciosa — o webhook activará como fallback
        }
      }

      return reply.type('text/html').send(SUCCESS_HTML(sessionId ?? 'unknown'));
    }
  );

  /**
   * GET /subscription/checkout-cancel
   * Página servida após checkout cancelado.
   */
  app.get('/subscription/checkout-cancel', async (_request, reply) => {
    return reply.type('text/html').send(CANCEL_HTML);
  });

  /**
   * GET /subscription/status
   * Retorna o estado atual da assinatura do utilizador.
   */
  app.get('/subscription/status', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const pool = getDbPool();

    const row = await pool
      .query<{ status: string; plano: string; validade_ate: string | null }>(
        `SELECT status, plano, validade_ate FROM assinaturas WHERE user_id = $1 LIMIT 1`,
        [userId]
      )
      .then((r) => r.rows[0] ?? null);

    return successResponse(row);
  });

  /**
   * POST /subscription/activate-sandbox
   * Ativa assinatura mock para testes sem pagamento real.
   */
  app.post('/subscription/activate-sandbox', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    await activateSubscription(userId, `sandbox_${Date.now()}`);
    return successResponse({ activated: true });
  });

  /**
   * POST /subscription/webhook
   * Webhook Stripe para eventos de pagamento.
   */
  app.post(
    '/subscription/webhook',
    { config: { rawBody: true } },
    async (request, reply) => {
      if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
        return reply.code(400).send({ error: 'Webhook não configurado.' });
      }

      const stripe = getStripe();
      const sig = request.headers['stripe-signature'] as string;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          (request as unknown as { rawBody: Buffer }).rawBody,
          sig,
          env.STRIPE_WEBHOOK_SECRET
        );
      } catch {
        return reply.code(400).send({ error: 'Webhook signature inválida.' });
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? (session.metadata?.userId as string | undefined);
        if (userId) {
          await activateSubscription(userId, session.id);
        }
      }

      return reply.code(200).send({ received: true });
    }
  );
}
