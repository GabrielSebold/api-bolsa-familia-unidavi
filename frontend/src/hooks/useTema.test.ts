import { describe, expect, it } from 'vitest';
import { normalizarPreferencia } from './useTema';

describe('normalizarPreferencia', () => {
  it.each(['claro', 'escuro', 'contraste', 'auto'] as const)('aceita %s', (v) => {
    expect(normalizarPreferencia(v)).toBe(v);
  });

  it.each([null, '', 'azul'])('devolve auto para %j', (v) => {
    expect(normalizarPreferencia(v)).toBe('auto');
  });
});
