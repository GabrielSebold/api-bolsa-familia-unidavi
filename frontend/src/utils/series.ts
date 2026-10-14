import type { Metrica, PontoMensal, PontoSerie, Registro } from '../types/api';
import { intervaloMeses, somarMeses } from './periodo';

/**
 * Soma valor e quantidade dos registros de cada mês (a API pode devolver um registro por tipo).
 * valorMedio: com 1 registro usa o da API; com mais de um, recalcula valor/qtd (null se qtd 0).
 * Retorna ordenado por mês; meses sem registro não aparecem.
 */
export function agregarPorMes(registros: readonly Registro[]): PontoMensal[] {
  const grupos = new Map<string, Registro[]>();
  for (const r of registros) {
    const lista = grupos.get(r.mesAno);
    if (lista) lista.push(r);
    else grupos.set(r.mesAno, [r]);
  }
  return [...grupos.keys()]
    .sort()
    .map((mesAno) => {
      const lista = grupos.get(mesAno) ?? [];
      const valor = lista.reduce((s, r) => s + r.valor, 0);
      const familias = lista.reduce((s, r) => s + r.quantidadeBeneficiados, 0);
      const unico = lista.length === 1 ? lista[0] : undefined;
      const valorMedio = unico ? unico.valorMedio : familias > 0 ? valor / familias : null;
      const programas = [...new Set(lista.map((r) => r.programa))];
      return { mesAno, valor, familias, valorMedio, programas };
    });
}

/** Série contínua de `de` a `ate`: meses sem dados ficam com valores null (nunca interpolados). */
export function montarSerie(pontos: readonly PontoMensal[], de: string, ate: string): PontoSerie[] {
  const porMes = new Map(pontos.map((p) => [p.mesAno, p]));
  return intervaloMeses(de, ate).map((mesAno) => {
    const p = porMes.get(mesAno);
    return p
      ? { mesAno, valor: p.valor, familias: p.familias, valorMedio: p.valorMedio, programas: p.programas }
      : { mesAno, valor: null, familias: null, valorMedio: null, programas: [] };
  });
}

export function valorDaMetrica(p: PontoSerie, metrica: Metrica): number | null {
  return metrica === 'valor' ? p.valor : metrica === 'familias' ? p.familias : p.valorMedio;
}

export interface ParAnoAAno {
  mesAno: string;
  mesAnoAnterior: string;
  atual: number | null;
  anterior: number | null;
}

/**
 * Para cada mês de `de` a `ate`, pareia o valor da métrica com o do mesmo mês um ano antes (mês − 12).
 * A série precisa conter a janela estendida; par ausente fica null.
 */
export function compararAnoAAno(serie: readonly PontoSerie[], metrica: Metrica, de: string, ate: string): ParAnoAAno[] {
  const porMes = new Map(serie.map((p) => [p.mesAno, valorDaMetrica(p, metrica)]));
  return intervaloMeses(de, ate).map((mesAno) => {
    const mesAnoAnterior = somarMeses(mesAno, -12);
    return {
      mesAno,
      mesAnoAnterior,
      atual: porMes.get(mesAno) ?? null,
      anterior: porMes.get(mesAnoAnterior) ?? null,
    };
  });
}
