import { useId, useState } from 'react';
import type { Metrica, PontoSerie } from '../types/api';
import { ROTULO_METRICA, formatarMesExtenso, formatarMetrica, formatarPercentualDuasCasas } from '../utils/formatadores';
import { rankingMeses } from '../utils/resumo';
import { BarraPercentual } from './BarraPercentual';

const VISIVEIS = 5;

/** "Meses com maior …": ROTULO_METRICA em minúsculas, com "número de" para famílias (concordância). */
const TITULO: Record<Metrica, string> = {
  valor: ROTULO_METRICA.valor.toLowerCase(),
  familias: `número de ${ROTULO_METRICA.familias.toLowerCase()}`,
  valorMedio: ROTULO_METRICA.valorMedio.toLowerCase(),
};

interface RankingMesesProps {
  /** Série contínua do período escolhido (sem a janela estendida). */
  serie: readonly PontoSerie[];
  metrica: Metrica;
}

/** Meses ordenados pelo indicador (como a lista ranqueada do TSE); valor e percentuais sempre em texto. */
export function RankingMeses({ serie, metrica }: RankingMesesProps) {
  const idBase = useId();
  const idTitulo = `${idBase}-titulo`;
  const idLista = `${idBase}-lista`;
  const [expandido, setExpandido] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const itens = rankingMeses(serie, metrica);
  const total = itens.length;
  const visiveis = expandido ? itens : itens.slice(0, VISIVEIS);

  const alternar = () => {
    const proximo = !expandido;
    setExpandido(proximo);
    setAnuncio(`Mostrando ${proximo ? total : Math.min(VISIVEIS, total)} meses.`);
  };

  return (
    <section className="ranking-meses" aria-labelledby={idTitulo}>
      <h3 id={idTitulo}>Meses com maior {TITULO[metrica]}</h3>
      {total === 0 ? (
        <p>Nenhum mês do período tem dados para este indicador.</p>
      ) : (
        <ol className="ranking" id={idLista}>
          {visiveis.map((i) => (
            <li key={i.mesAno} className={i.posicao <= 2 ? 'ranking__item ranking__item--destaque' : 'ranking__item'}>
              <span className="ranking__posicao">{i.posicao}º</span>
              <div className="ranking__corpo">
                <p className="ranking__linha">
                  <span className="ranking__mes">{formatarMesExtenso(i.mesAno)}</span>
                  <span className="ranking__valor">{formatarMetrica(i.valor, metrica)}</span>
                </p>
                <BarraPercentual percentual={i.percentualDoMaior} />
                <p className="ranking__detalhe">
                  {formatarPercentualDuasCasas(i.percentualDoMaior)} do maior mês
                  {i.percentualDoTotal !== null
                    ? ` · ${formatarPercentualDuasCasas(i.percentualDoTotal)} do total do período`
                    : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {total > VISIVEIS ? (
        <>
          <button
            type="button"
            className="botao ranking__alternar"
            aria-expanded={expandido}
            aria-controls={idLista}
            onClick={alternar}
          >
            {expandido ? `Mostrar só os ${VISIVEIS} primeiros` : `Mostrar todos os ${total} meses`}
          </button>
          <div className="somente-leitor" role="status" aria-live="polite">
            {anuncio}
          </div>
        </>
      ) : null}
    </section>
  );
}
