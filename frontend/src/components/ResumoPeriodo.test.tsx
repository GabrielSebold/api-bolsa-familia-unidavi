import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MetaResposta, PontoSerie } from '../types/api';
import { ResumoPeriodo } from './ResumoPeriodo';

const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

function p(mesAno: string, valor: number | null): PontoSerie {
  return { mesAno, valor, familias: valor === null ? null : 10, valorMedio: valor === null ? null : valor / 10, programas: [] };
}

const SERIE = [p('202311', 100), p('202312', 100), p('202401', 200), p('202402', null)];

function render(meta: MetaResposta) {
  return norm(
    renderToStaticMarkup(
      <ResumoPeriodo
        nomeMunicipio="São Paulo/SP"
        codigoIbge="3550308"
        de="202311"
        ate="202402"
        serie={SERIE}
        meta={meta}
        onAtualizar={() => {}}
        atualizando={false}
      />,
    ),
  );
}

describe('ResumoPeriodo', () => {
  const html = render({ origem: 'mock', atualizadoEm: '2026-10-08T15:30:00Z' });

  it('mostra carimbo com a data formatada e a pílula de origem', () => {
    expect(html).toContain('Dados atualizados em 08/10/2026, 12:30');
    expect(html).toContain('Dados fictícios');
    expect(render({ origem: 'api', atualizadoEm: '2026-10-08T15:30:00Z' })).toContain('Portal da Transparência');
  });

  it('linhas do resumo: código IBGE, período, meses e total', () => {
    expect(html).toContain('3550308');
    expect(html).toContain('nov/2023 a fev/2024');
    expect(html).toContain('R$ 400,00');
  });

  it('meses com dados e distribuição por ano com o percentual em texto; barras aria-hidden', () => {
    expect(html).toContain('3 de 4 meses (75,00%)');
    expect(html).toContain('R$ 200,00');
    expect(html).toContain('(50,00%)');
    expect(html).toMatch(/<span class="barra barra--destaque" aria-hidden="true">/);
    expect(html).toMatch(/<span class="barra-empilhada" aria-hidden="true">/);
  });

  it('botão "Atualizar dados" com ícone decorativo', () => {
    expect(html).toMatch(/<button type="button" id="atualizar-dados" class="botao"><span aria-hidden="true">↻<\/span>Atualizar dados<\/button>/);
  });
});
