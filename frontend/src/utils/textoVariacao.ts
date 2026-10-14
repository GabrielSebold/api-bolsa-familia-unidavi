import type { Metrica } from '../types/api';
import { formatarMetrica, formatarPercentualSemSinal } from './formatadores';
import type { Variacao } from './variacao';

export interface TextoVariacao {
  /** ▲ ▼ ou = (decorativo; o texto já diz a direção). */
  seta: string;
  /** "aumento de 3,2% (+R$ 1.234,00)", "queda de 1,0% (−R$ 10,00)" ou "sem variação". */
  texto: string;
}

/** Descreve a variação sem depender de cor: seta + palavra (aumento/queda) + percentual + diferença absoluta. */
export function textoVariacao(variacao: Variacao, metrica: Metrica): TextoVariacao {
  if (variacao.direcao === 'estavel') return { seta: '=', texto: 'sem variação' };
  const alta = variacao.direcao === 'alta';
  const diferenca = formatarMetrica(Math.abs(variacao.absoluta), metrica);
  return {
    seta: alta ? '▲' : '▼',
    texto: `${alta ? 'aumento' : 'queda'} de ${formatarPercentualSemSinal(variacao.percentual)} (${alta ? '+' : '−'}${diferenca})`,
  };
}
