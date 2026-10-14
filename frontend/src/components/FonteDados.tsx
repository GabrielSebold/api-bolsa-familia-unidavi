import type { MetaResposta, Origem } from '../types/api';
import { formatarDataHora } from '../utils/formatadores';

const TEXTO_ORIGEM: Record<Origem, string> = {
  api: 'consulta direta ao Portal da Transparência',
  cache: 'cache da API (consulta recente)',
  'cache-desatualizado': 'cache da API, possivelmente desatualizado',
  mock: 'dados fictícios de demonstração',
};

/** Fonte, data de atualização e origem dos dados; avisa quando são fictícios ou desatualizados. */
export function FonteDados({ meta }: { meta: MetaResposta }) {
  return (
    <section id="fonte" aria-labelledby="titulo-fonte" className="fonte">
      <h2 id="titulo-fonte">Fonte dos dados</h2>
      <p>Fonte: Portal da Transparência (CGU) — dados públicos.</p>
      <dl className="fonte__detalhes">
        <div>
          <dt>Atualizado em</dt>
          <dd>{formatarDataHora(meta.atualizadoEm)}</dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{TEXTO_ORIGEM[meta.origem] ?? meta.origem}</dd>
        </div>
      </dl>
      {meta.origem === 'mock' ? (
        <p className="aviso aviso--info" role="note">
          Dados fictícios de demonstração: não representam repasses reais.
        </p>
      ) : null}
      {meta.origem === 'cache-desatualizado' ? (
        <p className="aviso" role="note">
          Dados do cache, podem estar desatualizados: o Portal da Transparência não respondeu e foi usada a última cópia guardada.
        </p>
      ) : null}
    </section>
  );
}
