import { describe, expect, it } from 'vitest';
import { textoVariacao } from './textoVariacao';
import { calcularVariacao } from './variacao';

const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('textoVariacao', () => {
  it('aumento: seta, palavra, percentual sem sinal e diferença absoluta', () => {
    const v = calcularVariacao(150, 100);
    expect(v).not.toBeNull();
    const t = textoVariacao(v!, 'valor');
    expect(t.seta).toBe('▲');
    expect(norm(t.texto)).toBe('aumento de 50,0% (+R$ 50,00)');
  });
  it('queda usa ▼ e sinal de menos', () => {
    const t = textoVariacao(calcularVariacao(90, 100)!, 'familias');
    expect(t.seta).toBe('▼');
    expect(norm(t.texto)).toBe('queda de 10,0% (−10)');
  });
  it('estável', () => {
    expect(textoVariacao(calcularVariacao(5, 5)!, 'valor')).toEqual({ seta: '=', texto: 'sem variação' });
  });
});
