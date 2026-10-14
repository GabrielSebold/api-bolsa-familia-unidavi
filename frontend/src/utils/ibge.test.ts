import { describe, expect, it } from 'vitest';
import { validarCodigoIbge } from './ibge';

describe('validarCodigoIbge', () => {
  it.each(['4214805', '3550308', '3304557', '5300108', '4106902', '2927408', '1100015'])('aceita %s', (c) => {
    expect(validarCodigoIbge(c).ok).toBe(true);
  });

  it('rejeita dígito verificador incorreto', () => {
    expect(validarCodigoIbge('1234567').ok).toBe(false);
    expect(validarCodigoIbge('4214806').ok).toBe(false);
  });

  it('rejeita tamanho/formato inválido', () => {
    expect(validarCodigoIbge('99').ok).toBe(false);
    expect(validarCodigoIbge('abc').ok).toBe(false);
    expect(validarCodigoIbge('42148050').ok).toBe(false);
  });

  it('rejeita UF inexistente', () => {
    const r = validarCodigoIbge('9912345');
    expect(r.ok).toBe(false);
  });
});
