import {
  type AcaoAlma,
  type CondicionalAlma,
  ACOES_ALMA,
  ACOES_POR_MODELO,
  METAFORAS_POR_MODELO,
} from './alma-actions-data.js';

export type { AcaoAlma };

function avaliarCondicional(cond: CondicionalAlma, json: Record<string, unknown>): boolean {
  const raw = json[cond.campo];

  switch (cond.operador) {
    case 'truthy':
      return raw !== null && raw !== undefined && raw !== false && raw !== '' && raw !== 0;
    case '=':
      return raw === cond.valor;
    case '>': {
      const n = Number(raw);
      return !isNaN(n) && n > (cond.valor as number);
    }
    case '>=': {
      const n = Number(raw);
      return !isNaN(n) && n >= (cond.valor as number);
    }
    default:
      return false;
  }
}

export function filterAlmaForModel(
  modelo: string,
  onboardingJson: Record<string, unknown>
): { acoes: AcaoAlma[]; metaforas: string[] } {
  const config = ACOES_POR_MODELO[modelo];

  if (!config) {
    return { acoes: [], metaforas: [] };
  }

  const codigos = new Set<string>(config.obrigatorias);

  for (const cond of config.condicionais) {
    if (avaliarCondicional(cond, onboardingJson)) {
      codigos.add(cond.codigo);
    }
  }

  const acoes: AcaoAlma[] = [];
  for (const codigo of codigos) {
    const acao = ACOES_ALMA[codigo];
    if (acao) acoes.push(acao);
  }

  const metaforas = METAFORAS_POR_MODELO[modelo] ?? [];

  return { acoes, metaforas };
}
