import type { Metrica, PontoSerie } from '../types/api';
import { valorDaMetrica } from './series';

/**
 * Funções puras do painel "Resumo do período" e do ranking dos meses.
 * Nada é arredondado aqui: percentuais e somas saem com precisão total e só são formatados na tela.
 * "Mês com dados" = mês em que a API devolveu registro (valor !== null).
 */

export interface MesesComDados {
  comDados: number;
  total: number;
  /** 0..100; 0 quando a série está vazia. */
  percentual: number;
}

export function mesesComDados(serie: readonly PontoSerie[]): MesesComDados {
  const total = serie.length;
  const comDados = serie.filter((p) => p.valor !== null).length;
  return { comDados, total, percentual: total === 0 ? 0 : (comDados / total) * 100 };
}

export interface FatiaAno {
  /** "AAAA" */
  ano: string;
  valor: number;
  /** Participação no valor total do período, 0..100. */
  percentual: number;
}

/** Soma do valor repassado por ano (só meses com dados), em ordem crescente de ano; [] se o total for 0. */
export function distribuicaoPorAno(serie: readonly PontoSerie[]): FatiaAno[] {
  const porAno = new Map<string, number>();
  for (const p of serie) {
    if (p.valor === null) continue;
    const ano = p.mesAno.slice(0, 4);
    porAno.set(ano, (porAno.get(ano) ?? 0) + p.valor);
  }
  const total = [...porAno.values()].reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  return [...porAno.keys()]
    .sort()
    .map((ano) => {
      const valor = porAno.get(ano) ?? 0;
      return { ano, valor, percentual: (valor / total) * 100 };
    });
}

/** Soma do valor repassado no período; null quando nenhum mês tem dados. */
export function totalValorPeriodo(serie: readonly PontoSerie[]): number | null {
  const valores = serie.map((p) => p.valor).filter((v): v is number => v !== null);
  return valores.length === 0 ? null : valores.reduce((s, v) => s + v, 0);
}

export interface ItemRanking {
  mesAno: string;
  valor: number;
  /** 1 = maior valor. */
  posicao: number;
  /** valor / maior valor do ranking, 0..100 (0 quando o maior é 0). */
  percentualDoMaior: number;
  /** Só para a métrica "valor": participação no total do período, 0..100. */
  percentualDoTotal: number | null;
}

/** Meses com valor da métrica, do maior para o menor; empate em ordem cronológica. */
export function rankingMeses(serie: readonly PontoSerie[], metrica: Metrica): ItemRanking[] {
  const itens = serie
    .map((p) => ({ mesAno: p.mesAno, valor: valorDaMetrica(p, metrica) }))
    .filter((i): i is { mesAno: string; valor: number } => i.valor !== null)
    .sort((a, b) => b.valor - a.valor || a.mesAno.localeCompare(b.mesAno));
  const maior = itens[0]?.valor ?? 0;
  const total = metrica === 'valor' ? itens.reduce((s, i) => s + i.valor, 0) : null;
  return itens.map((i, indice) => ({
    mesAno: i.mesAno,
    valor: i.valor,
    posicao: indice + 1,
    percentualDoMaior: maior === 0 ? 0 : (i.valor / maior) * 100,
    percentualDoTotal: total === null ? null : total === 0 ? 0 : (i.valor / total) * 100,
  }));
}
