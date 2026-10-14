import { describe, expect, it } from 'vitest';
import {
  contarMeses,
  intervaloMeses,
  janelaConsulta,
  periodoPadrao,
  periodoTemErros,
  somarMeses,
  validarPeriodo,
} from './periodo';

const HOJE = new Date('2026-10-08T12:00:00Z');

describe('somarMeses / contarMeses / intervaloMeses', () => {
  it('cruza o ano nos dois sentidos', () => {
    expect(somarMeses('202511', 3)).toBe('202602');
    expect(somarMeses('202601', -1)).toBe('202512');
    expect(somarMeses('202601', -12)).toBe('202501');
  });

  it('conta meses inclusive', () => {
    expect(contarMeses('202509', '202608')).toBe(12);
    expect(contarMeses('202601', '202601')).toBe(1);
  });

  it('lista o intervalo', () => {
    expect(intervaloMeses('202511', '202602')).toEqual(['202511', '202512', '202601', '202602']);
    expect(intervaloMeses('202602', '202601')).toEqual([]);
  });
});

describe('periodoPadrao', () => {
  it('fim = mês atual − 2 e início = fim − 11', () => {
    expect(periodoPadrao(HOJE)).toEqual({ de: '202509', ate: '202608' });
  });
});

describe('validarPeriodo', () => {
  it('aceita o período padrão e 36 meses', () => {
    expect(periodoTemErros(validarPeriodo({ de: '202509', ate: '202608' }, HOJE))).toBe(false);
    expect(periodoTemErros(validarPeriodo({ de: '202309', ate: '202608' }, HOJE))).toBe(false);
  });

  it('rejeita 37 meses', () => {
    expect(validarPeriodo({ de: '202308', ate: '202608' }, HOJE).periodo).toMatch(/36/);
  });

  it('rejeita início maior que fim', () => {
    expect(validarPeriodo({ de: '202608', ate: '202509' }, HOJE).periodo).toBeDefined();
  });

  it('rejeita meses futuros', () => {
    expect(validarPeriodo({ de: '202601', ate: '202611' }, HOJE).ate).toBeDefined();
    expect(validarPeriodo({ de: '202611', ate: '202612' }, HOJE).de).toBeDefined();
  });

  it('aceita o mês corrente (a API aceita)', () => {
    expect(periodoTemErros(validarPeriodo({ de: '202610', ate: '202610' }, HOJE))).toBe(false);
  });

  it('rejeita formato inválido e ano antes de 2004', () => {
    expect(validarPeriodo({ de: '2026-1', ate: '202608' }, HOJE).de).toBeDefined();
    expect(validarPeriodo({ de: '202613', ate: '202608' }, HOJE).de).toBeDefined();
    expect(validarPeriodo({ de: '200312', ate: '200401' }, HOJE).de).toBeDefined();
  });
});

describe('janelaConsulta', () => {
  it('estende 12 meses para trás', () => {
    expect(janelaConsulta('202509', '202608')).toEqual({ de: '202409', ate: '202608' });
  });

  it('limita a 36 meses no total', () => {
    const j = janelaConsulta('202409', '202608'); // 24 meses → só dá para estender 12
    expect(j).toEqual({ de: '202309', ate: '202608' });
    const k = janelaConsulta('202309', '202608'); // 36 meses → não estende
    expect(k).toEqual({ de: '202309', ate: '202608' });
    const l = janelaConsulta('202403', '202608'); // 29 meses → estende 7
    expect(contarMeses(l.de, l.ate)).toBe(36);
    expect(l.de).toBe('202309');
  });
});
