import { describe, expect, it } from 'vitest';
import type { PontoSerie } from '../types/api';
import { compararAnoAAno } from './series';
import { descreverAnoAAno, descreverMesAMes } from './textoGrafico';

function ponto(mesAno: string, valor: number | null): PontoSerie {
  return { mesAno, valor, familias: valor, valorMedio: valor, programas: [] };
}

describe('descreverMesAMes', () => {
  it('conta altas e quedas e avisa sobre meses sem variação calculável', () => {
    const t = descreverMesAMes([ponto('202601', 100), ponto('202602', 200), ponto('202603', null), ponto('202604', 50)], 'valor');
    expect(t).toContain('1 mês em alta e 0 em queda');
    expect(t).toContain('3 meses sem variação calculável');
  });
  it('sem pares consecutivos', () => {
    expect(descreverMesAMes([ponto('202601', 100)], 'valor')).toContain('não há meses consecutivos');
  });
});

describe('descreverAnoAAno', () => {
  it('ignora meses sem par do ano anterior e informa quantos', () => {
    const serie = [ponto('202501', 100), ponto('202601', 150), ponto('202602', 10)];
    const t = descreverAnoAAno(compararAnoAAno(serie, 'valor', '202601', '202602'), 'valor');
    expect(t).toContain('1 mês em alta e 0 em queda');
    expect(t).toContain('1 mês sem dados do ano anterior');
  });
});
