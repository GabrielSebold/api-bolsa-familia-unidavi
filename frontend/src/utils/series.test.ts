import { describe, expect, it } from 'vitest';
import type { PontoSerie, Registro } from '../types/api';
import { agregarPorMes, compararAnoAAno, montarSerie } from './series';

function reg(mesAno: string, valor: number, qtd: number, valorMedio: number | null, tipo = 1): Registro {
  return {
    codigoIbge: '4214805',
    municipio: 'RIO DO SUL',
    uf: 'SC',
    mesAno,
    programa: 'NOVO_BOLSA_FAMILIA',
    tipo: { id: tipo, descricao: `Tipo ${tipo}` },
    valor,
    quantidadeBeneficiados: qtd,
    valorMedio,
  };
}

describe('agregarPorMes', () => {
  it('soma registros de tipos diferentes no mesmo mês e recalcula o valor médio', () => {
    const [p] = agregarPorMes([reg('202601', 1000, 4, 250, 1), reg('202601', 500, 1, 500, 2)]);
    expect(p).toMatchObject({ mesAno: '202601', valor: 1500, familias: 5, valorMedio: 300 });
  });

  it('com um único registro mantém o valor médio da API', () => {
    const [p] = agregarPorMes([reg('202601', 1000, 3, 333.5)]);
    expect(p?.valorMedio).toBe(333.5);
  });

  it('quantidade 0 → valor médio null', () => {
    const [p] = agregarPorMes([reg('202601', 0, 0, null, 1), reg('202601', 0, 0, null, 2)]);
    expect(p?.valorMedio).toBeNull();
  });

  it('ordena por mês', () => {
    const r = agregarPorMes([reg('202603', 1, 1, 1), reg('202601', 1, 1, 1)]);
    expect(r.map((p) => p.mesAno)).toEqual(['202601', '202603']);
  });
});

describe('montarSerie', () => {
  it('preenche meses ausentes com null, sem interpolar', () => {
    const pontos = agregarPorMes([reg('202601', 100, 1, 100), reg('202603', 300, 3, 100)]);
    const serie = montarSerie(pontos, '202601', '202603');
    expect(serie.map((p) => p.mesAno)).toEqual(['202601', '202602', '202603']);
    expect(serie[1]).toMatchObject({ valor: null, familias: null, valorMedio: null });
  });
});

describe('compararAnoAAno', () => {
  const serie: PontoSerie[] = montarSerie(
    agregarPorMes([reg('202501', 100, 1, 100), reg('202601', 150, 1, 150), reg('202602', 200, 2, 100)]),
    '202501',
    '202602',
  );

  it('pareia cada mês com o mesmo mês do ano anterior', () => {
    const pares = compararAnoAAno(serie, 'valor', '202601', '202602');
    expect(pares[0]).toEqual({ mesAno: '202601', mesAnoAnterior: '202501', atual: 150, anterior: 100 });
  });

  it('par ausente fica null', () => {
    const pares = compararAnoAAno(serie, 'valor', '202601', '202602');
    expect(pares[1]).toEqual({ mesAno: '202602', mesAnoAnterior: '202502', atual: 200, anterior: null });
  });

  it('usa a métrica pedida', () => {
    const pares = compararAnoAAno(serie, 'familias', '202601', '202601');
    expect(pares[0]).toMatchObject({ atual: 1, anterior: 1 });
  });
});
