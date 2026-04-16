// ================================================================
// JETHRO MENTOR PBN
// Motor de Classificação v2.7 — Implementação para Produção
//
// Arquitetura: Duas Passagens
//   P1 = Motor estrito (regras AND) — resolve 90% dos perfis
//   P2 = Âncoras + Reforços + Contradições — resolve perfis moderados
//
// Autor: Equipa Jethro (Rogério, Pollianna, Daniel)
// Data: Abril 2026
// Baseado em: Tabela Completa de Classificação v2.1
// ================================================================

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------
const gte = (valor, threshold) => valor.charCodeAt(0) >= threshold.charCodeAt(0);
const inSet = (valor, set) => set.includes(valor);

// ----------------------------------------------------------------
// PASSAGEM 1 — Motor Estrito (regras AND)
//
// Cadeia de prioridade: E → G → D → H → A → F → C → B → X → Fallback
// O primeiro modelo cujas condições são TODAS verdadeiras é retornado.
// Se nenhum bate, retorna null e vai para Passagem 2.
// ----------------------------------------------------------------
function passagem1(q) {

  // ---- MODELO E — Pré-Receita ----
  // E1: não fatura
  if (q.q11 === 'A') return 'E';
  // E2: pré-validação (início + pouco faturamento + rede pessoal)
  if (inSet(q.q5, ['A','B']) && q.q11 === 'B' && inSet(q.q16, ['A','B'])) return 'E';

  // ---- MODELO G — Operação no Limite ----
  // Fatura acima de R$5k + operação colapsa ao crescer
  // v2.6.2: (1) Q13!==C → se sangra, D captura; (2) mínimo 2 reforços
  if (gte(q.q11, 'C') && q.q17 === 'C' && q.q13 !== 'C') {
    let rg = 0;
    if (inSet(q.q18, ['D','E'])) rg++;        // dono esticado (40h+)
    if (inSet(q.q8, ['B','C']))  rg++;         // estrutura fraca
    if (inSet(q.q9, ['B','C']))  rg++;         // finanças sem controle
    if (inSet(q.q5, ['C','D']))  rg++;         // não é início
    if (rg >= 2) return 'G';
  }

  // ---- MODELO D — Fatura Mas Sangra ----
  // Fatura + está regredindo
  if (gte(q.q11, 'B') && q.q13 === 'C') return 'D';

  // ---- MODELO H — Gargalo do Dono ----
  // Trabalha 40h+ + fatura
  if (inSet(q.q18, ['D','E']) && gte(q.q11, 'B')) return 'H';

  // ---- MODELO A — Caos Total ----
  // Finanças confusas + sem plano + margem ruim + propósito NÃO resolvido
  if (q.q9 === 'C'
      && inSet(q.q8, ['B','C'])
      && inSet(q.q12, ['B','C'])
      && (q.q6 === 'C' || q.q7 === 'C'))
    return 'A';

  // ---- MODELO F — Sem Motor Comercial ----
  // Canal único + fatura + margem pressionada
  // EXCEÇÃO 1: Q12=C + propósito forte → C é raiz, não F
  // EXCEÇÃO 2: crescendo sem problema dominante → X captura abaixo
  if (gte(q.q11, 'B') && inSet(q.q16, ['A','B']) && inSet(q.q12, ['B','C'])) {
    const crescendoSemProblema = (
      q.q13 === 'A'
      && inSet(q.q12, ['A','B'])
      && inSet(q.q9, ['A','B'])
      && inSet(q.q8, ['A','B'])
      && inSet(q.q6, ['A','B'])
      && inSet(q.q7, ['A','B'])
    );
    if (crescendoSemProblema) {
      // Não retorna F — C ou X capturam abaixo
    } else if (q.q12 === 'C' && inSet(q.q6, ['A','B']) && inSet(q.q7, ['A','B'])) {
      // Não retorna F — C captura abaixo (precificação severa é a raiz)
    } else {
      return 'F';
    }
  }

  // ---- MODELO C — Propósito Claro, Caixa Apertado ----
  // Propósito resolvido + cobra abaixo + finanças fracas
  if (inSet(q.q6, ['A','B'])
      && inSet(q.q7, ['A','B'])
      && inSet(q.q9, ['B','C'])
      && inSet(q.q12, ['B','C']))
    return 'C';

  // ---- MODELO B — Platô ----
  // Estrutura ok + finanças ok + fatura + canais diversificados + estável
  if (inSet(q.q9, ['A','B'])
      && inSet(q.q8, ['A','B'])
      && gte(q.q11, 'B')
      && inSet(q.q12, ['A','B'])
      && q.q16 === 'C'
      && q.q13 === 'B')
    return 'B';

  // ---- MODELO X — Pronto para Escalar (v2.7) ----
  // Negócio funcional + crescendo + sem problema dominante
  if (gte(q.q11, 'B')
      && inSet(q.q12, ['A','B'])
      && q.q13 === 'A'
      && inSet(q.q9, ['A','B'])
      && inSet(q.q8, ['A','B']))
    return 'X';

  return null; // Fallback A genuíno
}


// ----------------------------------------------------------------
// PASSAGEM 2 — Avaliação por Modelo (Âncoras + Reforços + Contradições)
//
// Cada função retorna { modelo, score } ou null.
// Score = número de reforços presentes (mais alto = mais confiança).
// Variações moderadas (G2, H2) exigem mínimo de reforços para ativar.
// ----------------------------------------------------------------

function avaliarE(q) {
  // Âncoras
  let anchors = false;
  if (q.q11 === 'A') anchors = true;
  if (inSet(q.q5, ['A','B']) && q.q11 === 'B' && inSet(q.q16, ['A','B'])) anchors = true;
  if (!anchors) return null;

  // Contradições
  if (gte(q.q11, 'C')) return null;
  if (q.q5 === 'D' && gte(q.q11, 'B')) return null;
  if (q.q16 === 'C' && q.q11 === 'B') return null;

  // Reforços
  let score = 0;
  if (inSet(q.q5, ['A','B'])) score++;
  if (inSet(q.q8, ['B','C'])) score++;
  if (inSet(q.q9, ['B','C'])) score++;
  if (inSet(q.q18, ['A','B'])) score++;

  return { modelo: 'E', score };
}

function avaliarG(q) {
  // v2.6.2: mesma lógica da P1 — Q13=C bloqueia G, reforços obrigatórios
  if (q.q13 === 'C') return null; // sangra → D, não G

  // Variação G1: âncora forte (Q17=C)
  if (gte(q.q11, 'C') && q.q17 === 'C') {
    if (q.q17 === 'A') return null;
    if (inSet(q.q11, ['A','B'])) return null;

    // Contar reforços estruturais (evidência de colapso real)
    let reforcos = 0;
    if (inSet(q.q18, ['D','E']))  reforcos++;  // dono esticado (40h+)
    if (inSet(q.q8, ['B','C']))   reforcos++;  // estrutura fraca
    if (inSet(q.q9, ['B','C']))   reforcos++;  // finanças sem controle
    if (inSet(q.q5, ['C','D']))   reforcos++;  // não é início

    if (reforcos < 2) return null; // autodeclaração sem evidência

    return { modelo: 'G', score: reforcos + 2 }; // +2 base âncora forte
  }

  // Variação G2: moderada (Q17=B + múltiplos reforços)
  if (gte(q.q11, 'C') && q.q17 === 'B') {
    let score = 0;
    if (inSet(q.q18, ['D','E'])) score++;      // dono esticado (40h+)
    if (inSet(q.q8, ['B','C'])) score++;
    if (inSet(q.q5, ['C','D'])) score++;
    if (inSet(q.q13, ['A','B'])) score++;
    if (score >= 3) return { modelo: 'G', score };
  }

  return null;
}

function avaliarD(q) {
  // Âncoras: Q11>=B + (Q13=C OU Q12=C)
  if (!gte(q.q11, 'B')) return null;
  if (q.q13 !== 'C' && q.q12 !== 'C') return null;

  // Contradições
  if (q.q11 === 'A') return null;
  if (q.q12 === 'A' && q.q13 === 'A') return null;
  if (q.q17 === 'C' && gte(q.q11, 'C')) return null; // → G

  // Reforços
  let score = 0;
  if (q.q13 === 'C' && inSet(q.q12, ['B','C'])) score++;
  if (q.q12 === 'C' && inSet(q.q13, ['B','C'])) score++;
  if (inSet(q.q9, ['B','C'])) score++;
  if (inSet(q.q8, ['B','C'])) score++;
  if (inSet(q.q5, ['C','D'])) score++;

  return { modelo: 'D', score };
}

function avaliarH(q) {
  // Variação H1: âncora forte (Q18=D/E)
  if (inSet(q.q18, ['D','E']) && gte(q.q11, 'B')) {
    if (inSet(q.q18, ['A','B'])) return null;
    if (q.q11 === 'A') return null;
    if (q.q17 === 'C' && gte(q.q11, 'C')) return null; // → G

    let score = 2; // base forte
    if (q.q17 === 'B') score++;
    if (q.q8 === 'B') score++;
    if (inSet(q.q5, ['C','D'])) score++;
    if (q.q13 !== 'C') score++;
    return { modelo: 'H', score };
  }

  // Variação H2: moderada (Q18=C + faturamento alto + reforços)
  if (q.q18 === 'C' && gte(q.q11, 'D')) {
    let score = 0;
    if (q.q17 === 'B') score++;
    if (q.q8 === 'B') score++;
    if (inSet(q.q5, ['C','D'])) score++;
    if (score >= 3) return { modelo: 'H', score };
  }

  return null;
}

function avaliarA(q) {
  // Âncoras: Q9=C + Q8 in [B,C] + Q12 in [B,C] + (Q6=C OU Q7=C)
  if (q.q9 !== 'C') return null;
  if (!inSet(q.q8, ['B','C'])) return null;
  if (!inSet(q.q12, ['B','C'])) return null;
  if (q.q6 !== 'C' && q.q7 !== 'C') return null;

  // Contradições
  if (inSet(q.q6, ['A','B']) && inSet(q.q7, ['A','B'])) return null; // → C
  if (q.q11 === 'A') return null; // → E
  if (q.q17 === 'C' && gte(q.q11, 'C')) return null; // → G
  if (inSet(q.q18, ['D','E']) && gte(q.q11, 'B')) return null; // → H

  // Reforços
  let score = 0;
  if (inSet(q.q13, ['B','C'])) score++;
  if (inSet(q.q5, ['B','C'])) score++;
  if (inSet(q.q18, ['B','C'])) score++;
  if (q.q6 === 'C' && q.q7 === 'C') score++;

  return { modelo: 'A', score };
}

function avaliarF(q) {
  // Âncoras: Q16 in [A,B] + Q11>=B + Q12 in [B,C]
  if (!inSet(q.q16, ['A','B'])) return null;
  if (!gte(q.q11, 'B')) return null;
  if (!inSet(q.q12, ['B','C'])) return null;

  // Contradições
  if (q.q16 === 'C') return null; // canais diversificados → B
  if (q.q11 === 'A') return null; // → E
  if (inSet(q.q5, ['A','B']) && q.q11 === 'B' && inSet(q.q16, ['A','B'])) return null; // → E2
  if (q.q17 === 'C' && gte(q.q11, 'C')) return null; // → G
  if (inSet(q.q18, ['D','E'])) return null; // → H
  if (q.q13 === 'C' && q.q12 === 'C') return null; // → D
  if (q.q13 === 'A' && inSet(q.q12, ['A','B']) && inSet(q.q9, ['A','B']) && inSet(q.q8, ['A','B'])) return null; // → X

  // Reforços
  let score = 0;
  if (inSet(q.q6, ['A','B']) && inSet(q.q7, ['A','B'])) score++;
  if (inSet(q.q8, ['A','B'])) score++;
  if (inSet(q.q9, ['A','B'])) score++;
  if (inSet(q.q5, ['C','D'])) score++;
  if (inSet(q.q18, ['B','C'])) score++;
  if (q.q13 === 'B') score++;

  return { modelo: 'F', score };
}

function avaliarC(q) {
  // Âncoras: Q6 in [A,B] + Q7 in [A,B] + Q12 in [B,C]
  if (!inSet(q.q6, ['A','B'])) return null;
  if (!inSet(q.q7, ['A','B'])) return null;
  if (!inSet(q.q12, ['B','C'])) return null;

  // Contradições
  if (q.q6 === 'C' || q.q7 === 'C') return null; // → A
  if (q.q11 === 'A') return null; // → E
  if (q.q12 === 'A' && q.q13 === 'A') return null; // saudável
  if (q.q17 === 'C' && gte(q.q11, 'C')) return null; // → G
  if (inSet(q.q18, ['D','E']) && gte(q.q11, 'B')) return null; // → H

  // Reforços
  let score = 0;
  if (inSet(q.q9, ['B','C'])) score++;
  if (inSet(q.q8, ['B','C'])) score++;
  if (inSet(q.q5, ['C','D'])) score++;
  if (inSet(q.q13, ['B','C'])) score++;
  if (inSet(q.q18, ['A','B','C'])) score++;
  if (q.q6 === 'A' && q.q7 === 'A') score++;

  return { modelo: 'C', score };
}

function avaliarB(q) {
  // Âncoras: Q9 in [A,B] + Q8 in [A,B] + Q11>=B + Q16=C + Q13=B
  if (!inSet(q.q9, ['A','B'])) return null;
  if (!inSet(q.q8, ['A','B'])) return null;
  if (!gte(q.q11, 'B')) return null;
  if (q.q16 !== 'C') return null;
  if (q.q13 !== 'B') return null;

  // Contradições
  if (inSet(q.q16, ['A','B'])) return null; // → F
  if (q.q13 === 'C') return null; // → D
  if (q.q9 === 'C') return null; // → A
  if (q.q17 === 'C' && gte(q.q11, 'C')) return null; // → G
  if (inSet(q.q18, ['D','E'])) return null; // → H

  // Reforços
  let score = 0;
  if (inSet(q.q12, ['A','B'])) score++;
  if (inSet(q.q5, ['C','D'])) score++;
  if (inSet(q.q6, ['A','B'])) score++;
  if (inSet(q.q7, ['A','B'])) score++;
  if (inSet(q.q18, ['B','C'])) score++;
  if (inSet(q.q17, ['A','B'])) score++;

  return { modelo: 'B', score };
}


function avaliarX(q) {
  // ÂNCORAS: fatura + cobra justo/razoável + crescendo + finanças ok + estrutura ok
  if (!gte(q.q11, 'B')) return null;
  if (!inSet(q.q12, ['A','B'])) return null;
  if (q.q13 !== 'A') return null;
  if (!inSet(q.q9, ['A','B'])) return null;
  if (!inSet(q.q8, ['A','B'])) return null;

  // CONTRADIÇÕES
  if (q.q11 === 'A') return null;
  if (q.q13 === 'C') return null;
  if (q.q13 === 'B') return null; // é B, não X
  if (q.q12 === 'C') return null;
  if (q.q9 === 'C') return null;

  // REFORÇOS
  let score = 0;
  if (inSet(q.q6, ['A','B']) && inSet(q.q7, ['A','B'])) score++;
  if (q.q16 === 'C') score++;
  if (inSet(q.q5, ['C','D'])) score++;
  if (inSet(q.q18, ['A','B','C'])) score++;
  if (inSet(q.q17, ['A','B'])) score++;
  if (gte(q.q11, 'D')) score++;

  return { modelo: 'X', score };
}


// ----------------------------------------------------------------
// FUNÇÃO PRINCIPAL — Classificação Completa
//
// Input:  objeto com q5, q6, q7, q8, q9, q11, q12, q13, q16, q17, q18
// Output: objeto com:
//   - modelo:            string (A-H ou FALLBACK_A)
//   - fonte:             'P1' | 'P2' | 'FALLBACK'
//   - confianca:         'alta' | 'media' | 'baixa' | null
//   - sinal_secundario:  string | null
//   - score_principal:   number | null
//   - score_secundario:  number | null
//   - candidatos:        array de { modelo, score }
//   - divergencia_p1_p2: boolean
// ----------------------------------------------------------------
function classificarLead(q) {

  // === PASSAGEM 1 ===
  const p1 = passagem1(q);

  // === PASSAGEM 2 (roda SEMPRE — captura sinais secundários) ===
  const avaliacoes = [
    avaliarE(q), avaliarG(q), avaliarD(q), avaliarH(q),
    avaliarA(q), avaliarF(q), avaliarC(q), avaliarB(q), avaliarX(q)
  ].filter(r => r !== null);

  // Ordenar por score decrescente
  avaliacoes.sort((a, b) => b.score - a.score);

  const p2_principal  = avaliacoes[0] || null;
  const p2_secundario = avaliacoes[1] || null;

  // === DECISÃO FINAL ===
  let modelo, fonte, confianca;

  if (p1) {
    modelo = p1;
    fonte = 'P1';
    // Confiança da P1 = verificar P2 score
    const p2match = avaliacoes.find(c => c.modelo === p1);
    if (p2match) {
      confianca = p2match.score >= 4 ? 'alta' : p2match.score >= 2 ? 'media' : 'baixa';
    } else {
      confianca = 'media'; // P1 resolveu mas P2 não confirma
    }
  } else if (p2_principal) {
    modelo = p2_principal.modelo;
    fonte = 'P2';
    confianca = p2_principal.score >= 4 ? 'alta' : p2_principal.score >= 2 ? 'media' : 'baixa';
  } else {
    modelo = 'FALLBACK_A';
    fonte = 'FALLBACK';
    confianca = null;
  }

  // Sinal secundário (excluir se for igual ao principal)
  let sinal_sec = null;
  let score_sec = null;
  for (const c of avaliacoes) {
    if (c.modelo !== modelo) {
      sinal_sec = c.modelo;
      score_sec = c.score;
      break;
    }
  }

  return {
    modelo,
    fonte,
    confianca,
    sinal_secundario: sinal_sec,
    score_principal: p2_principal ? p2_principal.score : null,
    score_secundario: score_sec,
    candidatos: avaliacoes,
    divergencia_p1_p2: p1 !== null && p2_principal !== null && p1 !== p2_principal.modelo
  };
}


// ----------------------------------------------------------------
// EXPORTAÇÃO
// ----------------------------------------------------------------
module.exports = { classificarLead, passagem1 };


// ----------------------------------------------------------------
// TESTE RÁPIDO (remover em produção)
// ----------------------------------------------------------------
if (require.main === module) {
  // Caso CT-001
  const ct001 = {
    q5:'C', q6:'A', q7:'A', q8:'B', q9:'B',
    q11:'E', q12:'B', q13:'A', q16:'A', q17:'B', q18:'C'
  };
  const r = classificarLead(ct001);
  console.log('CT-001:', JSON.stringify(r, null, 2));

  // Gabarito v2.7
  const gabarito = [
    { nome: "E", q: { q5:'B', q6:'B', q7:'B', q8:'B', q9:'B', q11:'A', q12:'B', q13:'B', q16:'A', q17:'B', q18:'B' }},
    { nome: "G", q: { q5:'C', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'B', q13:'B', q16:'B', q17:'C', q18:'C' }},
    { nome: "D", q: { q5:'C', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'B', q13:'C', q16:'B', q17:'B', q18:'B' }},
    { nome: "H", q: { q5:'D', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'B', q13:'B', q16:'B', q17:'B', q18:'D' }},
    { nome: "A", q: { q5:'C', q6:'C', q7:'B', q8:'B', q9:'C', q11:'C', q12:'B', q13:'B', q16:'B', q17:'B', q18:'B' }},
    { nome: "F", q: { q5:'C', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'B', q13:'B', q16:'A', q17:'B', q18:'B' }},
    { nome: "C", q: { q5:'C', q6:'A', q7:'A', q8:'B', q9:'B', q11:'C', q12:'C', q13:'B', q16:'B', q17:'B', q18:'B' }},
    { nome: "B", q: { q5:'D', q6:'A', q7:'A', q8:'A', q9:'A', q11:'C', q12:'B', q13:'B', q16:'C', q17:'B', q18:'C' }},
    { nome: "X", q: { q5:'D', q6:'A', q7:'A', q8:'A', q9:'A', q11:'D', q12:'A', q13:'A', q16:'C', q17:'A', q18:'C' }},
  ];

  console.log('\nGabarito v2.7:');
  gabarito.forEach(t => {
    const r = classificarLead(t.q);
    const ok = r.modelo === t.nome;
    console.log(`  ${ok ? '✅' : '❌'} ${t.nome}: ${r.modelo} (${r.fonte}, ${r.confianca})${r.sinal_secundario ? ' | sec=' + r.sinal_secundario : ''}`);
  });

  // Cenários de colisão e edge cases
  console.log('\nCenários de colisão + Modelo X:');
  const colisoes = [
    { nome: "C9  Lucas D∩G → D",     esp: "D", q: { q5:'C', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'B', q13:'C', q16:'B', q17:'C', q18:'C' }},
    { nome: "C10 Priscila D∩H → D",  esp: "D", q: { q5:'D', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'C', q13:'C', q16:'B', q17:'B', q18:'D' }},
    { nome: "C11 Renata G∩H → G",    esp: "G", q: { q5:'C', q6:'A', q7:'A', q8:'B', q9:'B', q11:'C', q12:'B', q13:'B', q16:'B', q17:'C', q18:'D' }},
    { nome: "C12 Fantasma → X",       esp: "X", q: { q5:'C', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'A', q13:'A', q16:'C', q17:'A', q18:'B' }},
    { nome: "C16 Diego Falso G → X",  esp: "X", q: { q5:'D', q6:'A', q7:'A', q8:'A', q9:'A', q11:'C', q12:'A', q13:'A', q16:'C', q17:'C', q18:'B' }},
    { nome: "C17 X completo",          esp: "X", q: { q5:'D', q6:'A', q7:'A', q8:'A', q9:'A', q11:'D', q12:'A', q13:'A', q16:'C', q17:'A', q18:'C' }},
    { nome: "C18 X base parcial",      esp: "X", q: { q5:'C', q6:'B', q7:'B', q8:'B', q9:'B', q11:'C', q12:'A', q13:'A', q16:'C', q17:'B', q18:'B' }},
    { nome: "B  não vira X (Q13=B)",   esp: "B", q: { q5:'D', q6:'A', q7:'A', q8:'A', q9:'A', q11:'C', q12:'B', q13:'B', q16:'C', q17:'B', q18:'C' }},
  ];
  colisoes.forEach(t => {
    const r = classificarLead(t.q);
    const ok = r.modelo === t.esp;
    console.log(`  ${ok ? '✅' : '❌'} ${t.nome}: ${r.modelo} (${r.fonte}, ${r.confianca})${r.sinal_secundario ? ' | sec=' + r.sinal_secundario : ''} [esperado: ${t.esp}]`);
  });
}
