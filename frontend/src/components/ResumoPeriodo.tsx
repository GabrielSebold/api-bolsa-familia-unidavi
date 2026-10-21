import { useId } from 'react';
import type { MetaResposta, Origem, PontoSerie } from '../types/api';
import { formatarDataHora, formatarMesAno, formatarMoeda, formatarPercentualDuasCasas } from '../utils/formatadores';
import { distribuicaoPorAno, mesesComDados, totalValorPeriodo } from '../utils/resumo';
import { BarraEmpilhada } from './BarraEmpilhada';
import { BarraPercentual } from './BarraPercentual';

/** Id fixo do botão "Atualizar dados": o App devolve o foco a ele quando a nova consulta termina. */
export const ID_BOTAO_ATUALIZAR = 'atualizar-dados';

const ROTULO_ORIGEM: Record<Origem, string> = {
  mock: 'Dados fictícios',
  cache: 'Cache',
  'cache-desatualizado': 'Cache desatualizado',
  api: 'Portal da Transparência',
};

interface ResumoPeriodoProps {
  nomeMunicipio: string;
  codigoIbge: string;
  /** AAAAMM */
  de: string;
  /** AAAAMM */
  ate: string;
  /** Série contínua do período escolhido (sem a janela estendida). */
  serie: readonly PontoSerie[];
  meta: MetaResposta;
  onAtualizar: () => void;
  atualizando: boolean;
}

/** Painel "Resumo do período" (no estilo do "Dados Gerais" do TSE): carimbo, origem, totais e barras com texto. */
export function ResumoPeriodo({
  nomeMunicipio,
  codigoIbge,
  de,
  ate,
  serie,
  meta,
  onAtualizar,
  atualizando,
}: ResumoPeriodoProps) {
  const idTitulo = useId();
  const meses = mesesComDados(serie);
  const fatias = distribuicaoPorAno(serie);
  const total = totalValorPeriodo(serie);
  const alerta = meta.origem === 'mock' || meta.origem === 'cache-desatualizado';

  return (
    <section className="resumo" aria-labelledby={idTitulo}>
      <h3 id={idTitulo} className="resumo__titulo">
        Resumo do período
      </h3>
      <p className="resumo__municipio">{nomeMunicipio}</p>
      <p className="resumo__carimbo">
        Dados atualizados em {formatarDataHora(meta.atualizadoEm)} (horário de Brasília)
      </p>
      <div className="resumo__acoes">
        <span className={`pilula ${alerta ? 'pilula--aviso' : 'pilula--info'}`}>
          <span className="somente-leitor">Origem dos dados: </span>
          {ROTULO_ORIGEM[meta.origem] ?? meta.origem}
        </span>
        <button type="button" id={ID_BOTAO_ATUALIZAR} className="botao" onClick={onAtualizar} disabled={atualizando}>
          <span aria-hidden="true">↻</span>
          Atualizar dados
        </button>
      </div>
      <dl className="resumo__dados">
        <div>
          <dt>Código IBGE</dt>
          <dd>{codigoIbge}</dd>
        </div>
        <div>
          <dt>Período</dt>
          <dd>
            {formatarMesAno(de)} a {formatarMesAno(ate)}
          </dd>
        </div>
        <div>
          <dt>Meses no período</dt>
          <dd>{meses.total}</dd>
        </div>
        <div>
          <dt>Valor total repassado no período</dt>
          <dd>{formatarMoeda(total)}</dd>
        </div>
      </dl>
      <div className="resumo__bloco">
        <h4 className="resumo__subtitulo">Meses com dados</h4>
        <p className="resumo__percentual">
          {meses.comDados} de {meses.total} meses ({formatarPercentualDuasCasas(meses.percentual)})
        </p>
        <BarraPercentual percentual={meses.percentual} variante="destaque" />
      </div>
      {fatias.length > 0 ? (
        <div className="resumo__bloco">
          <h4 className="resumo__subtitulo">Distribuição do valor por ano</h4>
          <BarraEmpilhada fatias={fatias} />
        </div>
      ) : null}
    </section>
  );
}
