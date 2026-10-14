import { describe, expect, it } from 'vitest';
import { calcularVariacao, variacaoMesAMes } from './variacao';

describe('calcularVariacao', () => {
  it('detecta aumento', () => {
    expect(calcularVariacao(150, 100)).toEqual({ absoluta: 50, percentual: 50, direcao: 'alta' });
  });

  it('detecta queda', () => {
    expect(calcularVariacao(75, 100)).toEqual({ absoluta: -25, percentual: -25, direcao: 'queda' });
  });

  it('detecta estabilidade', () => {
    expect(calcularVariacao(100, 100)).toEqual({ absoluta: 0, percentual: 0, direcao: 'estavel' });
  });

  it('retorna null quando o anterior é 0 ou ausente', () => {
    expect(calcularVariacao(10, 0)).toBeNull();
    expect(calcularVariacao(10, null)).toBeNull();
    expect(calcularVariacao(null, 10)).toBeNull();
  });

  it('não arredonda o percentual internamente', () => {
    expect(calcularVariacao(1, 3)?.percentual).toBeCloseTo(-66.666666666, 6);
    expect(calcularVariacao(4, 3)?.percentual).toBeCloseTo(33.3333333333, 6);
  });
});

describe('variacaoMesAMes', () => {
  it('primeiro elemento é null e pares com buraco também', () => {
    const r = variacaoMesAMes([100, 110, null, 120]);
    expect(r[0]).toBeNull();
    expect(r[1]?.percentual).toBeCloseTo(10);
    expect(r[2]).toBeNull();
    expect(r[3]).toBeNull();
  });
});
