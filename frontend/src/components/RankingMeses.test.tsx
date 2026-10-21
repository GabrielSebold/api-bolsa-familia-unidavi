import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PontoSerie } from '../types/api';
import { RankingMeses } from './RankingMeses';

const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

function serie(n: number): PontoSerie[] {
  return Array.from({ length: n }, (_, i) => {
    const valor = (i + 1) * 100;
    return { mesAno: `2024${String(i + 1).padStart(2, '0')}`, valor, familias: 10, valorMedio: valor / 10, programas: [] };
  });
}

describe('RankingMeses', () => {
  it('mais de 5 meses: mostra 5 e o botão com aria-expanded="false" ligado à lista', () => {
    const html = norm(renderToStaticMarkup(<RankingMeses serie={serie(6)} metrica="valor" />));
    expect(html.match(/<li /g)).toHaveLength(5);
    expect(html).toContain('Mostrar todos os 6 meses');
    const id = /<ol class="ranking" id="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`aria-expanded="false" aria-controls="${id}"`);
    expect(html).toContain('role="status"');
  });

  it('percentuais em texto, barra aria-hidden e destaque nos 2 primeiros', () => {
    const html = norm(renderToStaticMarkup(<RankingMeses serie={serie(3)} metrica="valor" />));
    expect(html).toContain('Meses com maior valor repassado');
    expect(html).toContain('março de 2024');
    expect(html).toContain('R$ 300,00');
    expect(html).toContain('100,00% do maior mês · 50,00% do total do período');
    expect(html).toMatch(/<span class="barra" aria-hidden="true">/);
    expect(html.match(/ranking__item--destaque/g)).toHaveLength(2);
  });

  it('até 5 meses: sem botão; métrica famílias sem % do total', () => {
    const html = renderToStaticMarkup(<RankingMeses serie={serie(5)} metrica="familias" />);
    expect(html).not.toContain('aria-expanded');
    expect(html).not.toContain('do total do período');
    expect(html).toContain('Meses com maior número de famílias beneficiadas');
  });
});
