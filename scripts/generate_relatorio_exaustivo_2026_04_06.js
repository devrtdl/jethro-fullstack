const fs = require('fs');
const path = require('path');

const outDir = '/Users/daniellopes/Documents/jethro';
const csvPath = path.join(outDir, 'RELATORIO_EXAUSTIVO_MOTOR_DIAGNOSTICO_2026-04-06.csv');
const mdPath = path.join(outDir, 'RELATORIO_EXAUSTIVO_MOTOR_DIAGNOSTICO_2026-04-06_RESUMO.md');
const htmlPath = path.join(outDir, 'RELATORIO_EXAUSTIVO_MOTOR_DIAGNOSTICO_2026-04-06_PRETO_BRANCO_PRINT.html');

const domains = {
  q5: ['A', 'B', 'C', 'D'],
  q6: ['A', 'B', 'C'],
  q7: ['A', 'B', 'C'],
  q8: ['A', 'B', 'C'],
  q9: ['A', 'B', 'C'],
  q10: ['nao_comecou', 'informal', 'formalizada', 'medio_grande_porte', 'outro'],
  q11: ['A', 'B', 'C', 'D'],
  q12: ['A', 'B', 'C'],
  q15: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  q16: ['A', 'B', 'C'],
  q17: ['A', 'B', 'C', 'D', 'E'],
};

const modelInfo = {
  A: {
    title: 'Negocio travado e baguncado',
    consequence: 'Operacao desorganizada e sem clareza; priorizar estrutura, financeiro e direcionamento.',
  },
  B: {
    title: 'Negocio saudavel no plato',
    consequence: 'Base boa com estagnacao; foco em alavancas de crescimento e escala sustentavel.',
  },
  C: {
    title: 'Boa base, caixa apertado',
    consequence: 'Existe fundamento, mas caixa e previsibilidade limitam; foco em margem e recorrencia.',
  },
  D: {
    title: 'Fatura, mas sangra',
    consequence: 'Ha faturamento com regressao; ajuste urgente de lucratividade e custos para evitar deterioracao.',
  },
  E: {
    title: 'Ja comecou, mas nao validou',
    consequence: 'Validacao comercial insuficiente; foco em proposta, oferta e tracao inicial.',
  },
  F: {
    title: 'Vende sem motor comercial',
    consequence: 'Dependencia de canal fragil; construir aquisicao previsivel e processo comercial.',
  },
  G: {
    title: 'Operacao no limite',
    consequence: 'Crescimento gera colapso operacional; padronizar processos e capacidade antes de escalar.',
  },
  H: {
    title: 'Gargalo do dono',
    consequence: 'Sobrecarga cronica do fundador; redistribuir execucao e governanca pessoal.',
  },
  I: {
    title: 'Pre-receita / ainda nao comecou',
    consequence: 'Sem tracao de receita; foco em validacao rapida e primeiras vendas.',
  },
};

function deriveQ18(q5, q10) {
  if (q10 === 'nao_comecou') return 'A';
  if (q5 === 'A') return 'C';
  return 'B';
}

function classify(a) {
  const q18 = deriveQ18(a.q5, a.q10);

  if (a.q11 === 'A' && ['A', 'C', 'D'].includes(q18)) {
    return { model: 'I', reasonCode: 'I1', reason: "Q11='A' e Q18 em [A,C,D]", q18 };
  }
  if (a.q11 === 'A' && q18 === 'B') {
    return { model: 'E', reasonCode: 'E1', reason: "Q11='A' e Q18='B'", q18 };
  }
  if (a.q5 <= 'B' && a.q11 === 'B') {
    return { model: 'E', reasonCode: 'E2', reason: "Q5<='B' e Q11='B'", q18 };
  }
  if (a.q11 === 'A') {
    return { model: 'I', reasonCode: 'I2', reason: "Fallback de Q11='A'", q18 };
  }
  if (a.q11 >= 'C' && a.q16 === 'C') {
    return { model: 'G', reasonCode: 'G1', reason: "Q11>='C' e Q16='C'", q18 };
  }
  if (a.q11 >= 'B' && a.q12 === 'C') {
    return { model: 'D', reasonCode: 'D1', reason: "Q11>='B' e Q12='C'", q18 };
  }
  if (a.q11 >= 'B' && ['D', 'E'].includes(a.q17)) {
    return { model: 'H', reasonCode: 'H1', reason: "Q11>='B' e Q17 em [D,E]", q18 };
  }
  if (
    a.q9 === 'C' &&
    ['B', 'C'].includes(a.q8) &&
    ['B', 'C'].includes(a.q12) &&
    (a.q6 === 'C' || a.q7 === 'C')
  ) {
    return {
      model: 'A',
      reasonCode: 'A1',
      reason: "Q9='C' e Q8 em [B,C] e Q12 em [B,C] e (Q6='C' ou Q7='C')",
      q18,
    };
  }
  if (a.q11 >= 'B' && a.q15 === 'A' && a.q12 === 'B' && ['A', 'B'].includes(a.q9)) {
    return { model: 'F', reasonCode: 'F1', reason: "Q11>='B' e Q15='A' e Q12='B' e Q9 em [A,B]", q18 };
  }
  if (
    ['A', 'B'].includes(a.q6) &&
    ['A', 'B'].includes(a.q7) &&
    ['B', 'C'].includes(a.q9) &&
    ['B', 'C'].includes(a.q12)
  ) {
    return {
      model: 'C',
      reasonCode: 'C1',
      reason: 'Q6 em [A,B] e Q7 em [A,B] e Q9 em [B,C] e Q12 em [B,C]',
      q18,
    };
  }
  if (
    ['A', 'B'].includes(a.q9) &&
    ['A', 'B'].includes(a.q8) &&
    a.q11 >= 'B' &&
    a.q12 === 'B' &&
    a.q15 !== 'A'
  ) {
    return {
      model: 'B',
      reasonCode: 'B1',
      reason: "Q9 em [A,B] e Q8 em [A,B] e Q11>='B' e Q12='B' e Q15!='A'",
      q18,
    };
  }
  return { model: 'A', reasonCode: 'A2', reason: 'Fallback final do motor', q18 };
}

function makeHomogeneous(letter) {
  const pick = (arr) => {
    if (arr.includes(letter)) return letter;
    return arr[arr.length - 1];
  };
  return {
    q5: pick(domains.q5),
    q6: pick(domains.q6),
    q7: pick(domains.q7),
    q8: pick(domains.q8),
    q9: pick(domains.q9),
    q10: letter === 'A' ? 'nao_comecou' : (letter === 'B' ? 'informal' : 'formalizada'),
    q11: pick(domains.q11),
    q12: pick(domains.q12),
    q15: pick(domains.q15),
    q16: pick(domains.q16),
    q17: pick(domains.q17),
  };
}

function toCsvCell(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

let total = 0;
const modelCount = Object.fromEntries(Object.keys(modelInfo).map((k) => [k, 0]));

const ws = fs.createWriteStream(csvPath, { encoding: 'utf8' });
ws.write([
  'cenario_id', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q15', 'q16', 'q17',
  'q18_derivada', 'modelo', 'modelo_titulo', 'motivo_regra', 'consequencia_pratica'
].join(',') + '\n');

for (const q5 of domains.q5)
for (const q6 of domains.q6)
for (const q7 of domains.q7)
for (const q8 of domains.q8)
for (const q9 of domains.q9)
for (const q10 of domains.q10)
for (const q11 of domains.q11)
for (const q12 of domains.q12)
for (const q15 of domains.q15)
for (const q16 of domains.q16)
for (const q17 of domains.q17) {
  total += 1;
  const a = { q5, q6, q7, q8, q9, q10, q11, q12, q15, q16, q17 };
  const c = classify(a);
  modelCount[c.model] += 1;

  const row = [
    total, q5, q6, q7, q8, q9, q10, q11, q12, q15, q16, q17,
    c.q18, c.model, modelInfo[c.model].title, c.reason, modelInfo[c.model].consequence,
  ].map(toCsvCell).join(',') + '\n';

  ws.write(row);
}

ws.end();

ws.on('finish', () => {
  const lines = [];
  lines.push('# Relatorio Exaustivo do Motor de Diagnostico (06/04/2026)');
  lines.push('');
  lines.push(`- Total de cenarios avaliados: **${total.toLocaleString('pt-BR')}**`);
  lines.push('- Motor aplicado: regras atuais de `jethro-backend/src/domain/forms/service.ts` (E sem Q15 na fase inicial e F com Q9 em [A,B]).');
  lines.push('');
  lines.push('## Distribuicao por modelo');
  lines.push('');
  lines.push('| Modelo | Titulo | Cenarios |');
  lines.push('|---|---|---:|');
  for (const code of Object.keys(modelInfo).sort()) {
    lines.push(`| ${code} | ${modelInfo[code].title} | ${modelCount[code].toLocaleString('pt-BR')} |`);
  }
  lines.push('');
  lines.push('## Cenarios homogeneos (tudo A / B / C / D / E)');
  lines.push('');
  lines.push('| Padrao | q5 | q6 | q7 | q8 | q9 | q10 | q11 | q12 | q15 | q16 | q17 | Modelo | Motivo | Consequencia pratica |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const letter of ['A', 'B', 'C', 'D', 'E']) {
    const s = makeHomogeneous(letter);
    const c = classify(s);
    lines.push(`| Tudo ${letter} | ${s.q5} | ${s.q6} | ${s.q7} | ${s.q8} | ${s.q9} | ${s.q10} | ${s.q11} | ${s.q12} | ${s.q15} | ${s.q16} | ${s.q17} | ${c.model} | ${c.reason} | ${modelInfo[c.model].consequence} |`);
  }
  lines.push('');
  lines.push('## Arquivos gerados');
  lines.push('');
  lines.push(`- ${path.basename(csvPath)}`);
  lines.push(`- ${path.basename(mdPath)}`);
  lines.push(`- ${path.basename(htmlPath)}`);

  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');

  const css = `
@page { size: A4 portrait; margin: 10mm; }
body { font-family: "Times New Roman", serif; color:#000; background:#fff; margin:0; padding:0; }
.wrap { padding: 10mm; }
h1, h2 { margin: 0 0 8px 0; }
p, li { font-size: 12px; line-height: 1.4; }
table { width:100%; border-collapse: collapse; margin: 10px 0 18px 0; font-size: 11px; }
th, td { border:1px solid #000; padding:4px 6px; vertical-align: top; }
th { background:#fff; font-weight:700; }
.small { font-size: 10px; }
.page-break { page-break-before: always; }
`;

  const modelRows = Object.keys(modelInfo).sort().map((code) =>
    `<tr><td>${code}</td><td>${modelInfo[code].title}</td><td>${modelCount[code].toLocaleString('pt-BR')}</td><td>${modelInfo[code].consequence}</td></tr>`
  ).join('');

  const homoRows = ['A', 'B', 'C', 'D', 'E'].map((letter) => {
    const s = makeHomogeneous(letter);
    const c = classify(s);
    return `<tr>
<td>Tudo ${letter}</td>
<td>${s.q5}</td><td>${s.q6}</td><td>${s.q7}</td><td>${s.q8}</td><td>${s.q9}</td>
<td>${s.q10}</td><td>${s.q11}</td><td>${s.q12}</td><td>${s.q15}</td><td>${s.q16}</td><td>${s.q17}</td>
<td>${c.model}</td><td>${c.reason}</td><td>${modelInfo[c.model].consequence}</td>
</tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Relatorio Exaustivo do Motor - Preto e Branco</title>
<style>${css}</style>
</head>
<body>
<div class="wrap">
<h1>Relatorio Exaustivo do Motor de Diagnostico</h1>
<p><strong>Data:</strong> 06/04/2026</p>
<p><strong>Total de cenarios processados:</strong> ${total.toLocaleString('pt-BR')}</p>
<p class="small">Relatorio em preto e branco para impressao. O detalhamento completo de cada combinacao esta no CSV exaustivo.</p>

<h2>Distribuicao por Modelo</h2>
<table>
<tr><th>Modelo</th><th>Titulo</th><th>Cenarios</th><th>Consequencia pratica</th></tr>
${modelRows}
</table>

<div class="page-break"></div>
<h2>Cenarios Homogeneos (Tudo A/B/C/D/E)</h2>
<table>
<tr>
<th>Padrao</th><th>Q5</th><th>Q6</th><th>Q7</th><th>Q8</th><th>Q9</th>
<th>Q10</th><th>Q11</th><th>Q12</th><th>Q15</th><th>Q16</th><th>Q17</th>
<th>Modelo</th><th>Motivo</th><th>Consequencia pratica</th>
</tr>
${homoRows}
</table>

<p class="small">CSV completo: ${path.basename(csvPath)}</p>
</div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf8');

  console.log('Geracao concluida.');
  console.log(`CSV: ${csvPath}`);
  console.log(`MD: ${mdPath}`);
  console.log(`HTML: ${htmlPath}`);
  console.log(`Total de cenarios: ${total}`);
});
