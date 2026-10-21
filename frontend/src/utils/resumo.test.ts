import { describe, expect, it } from 'vitest';
import type { PontoSerie } from '../types/api';
import { distribuicaoPorAno, mesesComDados, rankingMeses, totalValorPeriodo } from './resumo';

function p(mesAno: string, valor: number | null, familias: number | null = valor === null ? null : 10): PontoSerie {
  return {
    mesAno,
    valor,
    familias,
    valorMedio: valor === null || !familias ? null : valor / familias,
    programas: valor === null ? [] : ['NOVO_BOLSA_FAMILIA'],
  };
}

const COM_BURACOS = [p('202401', 100), p('202402', null), p('202403', 300), p('202404', null)];
const TRES_ANOS = [p('202312', 100), p('202401', 200), p('202412', 300), p('202501', 400)];
const TODOS_NULOS = [p('202401', null), p('202402', null)];

describe('mesesComDados', () => {
  it('conta só meses com valor e calcula o percentual sem arredondar', () => {
    expect(mesesComDados(COM_BURACOS)).toEqual({ comDados: 2, total: 4, percentual: 50 });
    expect(mesesComDados([p('202401', 1), p('202402', null), p('202403', null)]).percentual).toBeCloseTo(100 / 3, 10);
  });

  it('série vazia → percentual 0; todos nulos → 0 de N', () => {
    expect(mesesComDados([])).toEqual({ comDados: 0, total: 0, percentual: 0 });
    expect(mesesComDados(TODOS_NULOS)).toEqual({ comDados: 0, total: 2, percentual: 0 });
  });
});

describe('distribuicaoPorAno', () => {
  it('um só ano → uma fatia de 100%', () => {
    expect(distribuicaoPorAno(COM_BURACOS)).toEqual([{ ano: '2024', valor: 400, percentual: 100 }]);
  });

  it('três anos em ordem crescente, somando só meses com dados', () => {
    const r = distribuicaoPorAno(TRES_ANOS);
    expect(r.map((f) => [f.ano, f.valor])).toEqual([['2023', 100], ['2024', 500], ['2025', 400]]);
    expect(r.map((f) => f.percentual)).toEqual([10, 50, 40]);
  });

  it('todos nulos → []', () => {
    expect(distribuicaoPorAno(TODOS_NULOS)).toEqual([]);
  });
});

describe('totalValorPeriodo', () => {
  it('soma os meses com dados; todos nulos → null', () => {
    expect(totalValorPeriodo(COM_BURACOS)).toBe(400);
    expect(totalValorPeriodo(TODOS_NULOS)).toBeNull();
  });
});

describe('rankingMeses', () => {
  it('ordena do maior para o menor, ignora buracos e dá o % do maior e do total (valor)', () => {
    const r = rankingMeses(COM_BURACOS, 'valor');
    expect(r).toEqual([
      { mesAno: '202403', valor: 300, posicao: 1, percentualDoMaior: 100, percentualDoTotal: 75 },
      { mesAno: '202401', valor: 100, posicao: 2, percentualDoMaior: (100 / 300) * 100, percentualDoTotal: 25 },
    ]);
  });

  it('empate em ordem cronológica', () => {
    const r = rankingMeses([p('202403', 50), p('202401', 50), p('202402', 80)], 'valor');
    expect(r.map((i) => [i.mesAno, i.posicao])).toEqual([['202402', 1], ['202401', 2], ['202403', 3]]);
  });

  it('percentualDoTotal só para a métrica valor', () => {
    const r = rankingMeses(TRES_ANOS, 'familias');
    expect(r.every((i) => i.percentualDoTotal === null)).toBe(true);
    expect(r.every((i) => i.percentualDoMaior === 100)).toBe(true);
  });

  it('todos nulos → []', () => {
    expect(rankingMeses(TODOS_NULOS, 'valorMedio')).toEqual([]);
  });
});
