import type { FastifyInstance, FastifyReply } from 'fastify';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderBridgePage(targetUrl: string) {
  const safeTarget = escapeHtml(targetUrl);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jethro | Retornando ao app</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #07111d;
        color: #f6f1e8;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 24px;
      }
      .card {
        width: min(100%, 420px);
        border-radius: 28px;
        border: 1px solid rgba(215, 184, 110, 0.18);
        background: #0d1b2a;
        padding: 28px 24px;
        box-sizing: border-box;
      }
      .eyebrow {
        margin: 0 0 12px;
        color: #e8d39a;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        line-height: 1.1;
        font-weight: 700;
      }
      p {
        margin: 0;
        color: #a5b1bf;
        font-size: 16px;
        line-height: 1.6;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin-top: 22px;
        min-height: 54px;
        border-radius: 999px;
        background: #d7b86e;
        color: #07111d;
        font-size: 16px;
        font-weight: 800;
        text-decoration: none;
      }
      .hint {
        margin-top: 14px;
        font-size: 13px;
        color: #8290a1;
      }
      code {
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <p class="eyebrow">Login social</p>
      <h1>Voltando para o app</h1>
      <p>Se o redirecionamento não acontecer automaticamente, toque no botão abaixo para concluir o login no Jethro.</p>
      <a id="open-app" class="button" href="${safeTarget}">Abrir o app</a>
      <p class="hint">Destino configurado: <code>${safeTarget}</code></p>
    </main>
    <script>
      (function () {
        var target = ${JSON.stringify(targetUrl)};
        var hash = window.location.hash || "";
        var separator = target.indexOf("#") === -1 ? "#" : "&";
        var nextUrl = hash ? target + separator + hash.slice(1) : target;
        var button = document.getElementById("open-app");

        if (button) {
          button.setAttribute("href", nextUrl);
        }

        window.setTimeout(function () {
          window.location.replace(nextUrl);
        }, 120);
      })();
    </script>
  </body>
</html>`;
}

function sendBridge(reply: FastifyReply, targetUrl: string) {
  return reply.type('text/html; charset=utf-8').send(renderBridgePage(targetUrl));
}

export async function registerAuthBridgeRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    return sendBridge(reply, 'jethro://auth/callback');
  });

  app.get('/auth/callback-bridge', async (request, reply) => {
    const query = request.query as { redirect_to?: string };
    const targetUrl = typeof query.redirect_to === 'string' && query.redirect_to.trim()
      ? query.redirect_to.trim()
      : 'jethro://auth/callback';

    return sendBridge(reply, targetUrl);
  });
}
