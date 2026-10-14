import { useId, type ReactNode } from 'react';
import { Amostra, DefsPadroes, type ItemLegenda, type PadraoDef } from './padroesSvg';

export interface DadosTabelaGrafico {
  caption: string;
  colunas: string[];
  /** A primeira célula de cada linha é o cabeçalho da linha (th scope="row"). */
  linhas: string[][];
}

interface GraficoMolduraProps {
  titulo: string;
  /** Descrição textual completa (visível; ligada ao gráfico por aria-describedby). */
  descricao: string;
  /** Rótulo curto do role="img". */
  ariaLabel: string;
  legenda: readonly ItemLegenda[];
  padroes?: readonly PadraoDef[];
  tabela: DadosTabelaGrafico;
  children: ReactNode;
}

/** Estrutura comum dos gráficos: figura, título, descrição, legenda e tabela alternativa. */
export function GraficoMoldura({ titulo, descricao, ariaLabel, legenda, padroes = [], tabela, children }: GraficoMolduraProps) {
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const idDescricao = `${id}-descricao`;
  return (
    <figure className="grafico" aria-labelledby={idTitulo} aria-describedby={idDescricao}>
      <DefsPadroes padroes={padroes} />
      <figcaption>
        <h3 id={idTitulo}>{titulo}</h3>
      </figcaption>
      <p id={idDescricao} className="grafico__descricao">
        {descricao}
      </p>
      <ul className="legenda" aria-label="Legenda">
        {legenda.map((item) => (
          <li key={item.rotulo}>
            <Amostra item={item} />
            <span>{item.rotulo}</span>
          </li>
        ))}
      </ul>
      <div className="grafico__area" role="img" aria-label={ariaLabel} aria-describedby={idDescricao}>
        {children}
      </div>
      <details className="grafico__tabela">
        <summary>Ver tabela de dados</summary>
        <div className="tabela-rolagem" role="region" aria-label={`${tabela.caption} (rolável)`} tabIndex={0}>
          <table className="tabela">
            <caption>{tabela.caption}</caption>
            <thead>
              <tr>
                {tabela.colunas.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.linhas.map((linha) => (
                <tr key={linha[0]}>
                  {linha.map((celula, i) =>
                    i === 0 ? (
                      <th key={i} scope="row">
                        {celula}
                      </th>
                    ) : (
                      <td key={i}>{celula}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
