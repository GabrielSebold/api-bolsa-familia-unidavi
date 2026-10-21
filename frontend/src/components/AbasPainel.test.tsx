import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AbasPainel, idDaAba, type DefinicaoAba } from './AbasPainel';

const ABAS: DefinicaoAba[] = [
  { id: 'visao', rotulo: 'Visão geral', idPainel: 'visao-geral' },
  { id: 'graficos', rotulo: 'Gráficos', idPainel: 'graficos' },
  { id: 'tabela', rotulo: 'Tabela', idPainel: 'tabela' },
];

function renderizar(ativa: DefinicaoAba['id']) {
  return renderToStaticMarkup(
    <>
      <AbasPainel abas={ABAS} ativa={ativa} onChange={() => {}} />
      {ABAS.map((a) => (
        <section key={a.id} id={a.idPainel} role="tabpanel" aria-labelledby={idDaAba(a.id)} />
      ))}
    </>,
  );
}

describe('AbasPainel', () => {
  it('renderiza um tablist rotulado com 3 abas', () => {
    const html = renderizar('visao');
    expect(html).toContain('role="tablist" aria-label="Seções do painel"');
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    for (const rotulo of ['Visão geral', 'Gráficos', 'Tabela']) expect(html).toContain(`>${rotulo}</button>`);
  });

  it('marca só a aba ativa com aria-selected e tabindex 0 (tabindex móvel)', () => {
    const html = renderizar('tabela');
    expect(html).toContain('id="aba-tabela" class="abas__aba" aria-selected="true" aria-controls="tabela" tabindex="0"');
    expect(html).toContain('id="aba-visao" class="abas__aba" aria-selected="false" aria-controls="visao-geral" tabindex="-1"');
    expect(html).toContain('id="aba-graficos" class="abas__aba" aria-selected="false" aria-controls="graficos" tabindex="-1"');
  });

  it('aria-controls aponta para painéis existentes', () => {
    const html = renderizar('visao');
    const controlados = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
    expect(controlados).toEqual(['visao-geral', 'graficos', 'tabela']);
    for (const id of controlados) expect(html).toContain(`<section id="${id}" role="tabpanel"`);
  });
});
