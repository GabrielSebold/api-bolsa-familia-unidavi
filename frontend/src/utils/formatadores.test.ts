import { describe, expect, it } from 'vitest';
import {
  formatarDataHora,
  formatarInteiro,
  formatarMesAno,
  formatarMesExtenso,
  formatarMoeda,
  formatarPercentual,
} from './formatadores';

const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('formatadores', () => {
  it('moeda em BRL', () => {
    expect(norm(formatarMoeda(1234567.891))).toBe('R$ 1.234.567,89');
  });

  it('inteiro com separador de milhar', () => {
    expect(formatarInteiro(1234567)).toBe('1.234.567');
  });

  it('null/undefined/NaN → travessão', () => {
    expect(formatarMoeda(null)).toBe('—');
    expect(formatarInteiro(undefined)).toBe('—');
    expect(formatarPercentual(Number.NaN)).toBe('—');
  });

  it('mês/ano abreviado e por extenso', () => {
    expect(formatarMesAno('202601')).toBe('jan/2026');
    expect(formatarMesAno('202612')).toBe('dez/2026');
    expect(formatarMesExtenso('202603')).toBe('março de 2026');
    expect(formatarMesAno('abc')).toBe('—');
  });

  it('percentual com sinal', () => {
    expect(norm(formatarPercentual(12.34))).toBe('+12,3%');
    expect(norm(formatarPercentual(-5))).toMatch(/^[-−]5,0%$/);
    expect(norm(formatarPercentual(0))).toBe('0,0%');
  });

  it('data/hora no fuso de São Paulo', () => {
    expect(formatarDataHora('2026-10-08T15:30:00Z')).toBe('08/10/2026, 12:30');
    expect(formatarDataHora('invalido')).toBe('—');
    expect(formatarDataHora(null)).toBe('—');
  });
});
