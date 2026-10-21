import { useId } from 'react';
import { formatarMoeda, formatarPercentualDuasCasas } from '../utils/formatadores';
import type { FatiaAno } from '../utils/resumo';
import { Amostra, DefsPadroes, idSeguro, type ItemLegenda, type PadraoDef, type TipoPadrao } from './padroesSvg';

/** Até 4 anos cabem em 36 meses. Além da cor, cada segmento tem preenchimento próprio e a ordem da legenda. */
const ESTILOS: readonly { cor: string; tipo: TipoPadrao | null }[] = [
  { cor: '--cor-grafico-1', tipo: null },
  { cor: '--cor-grafico-2', tipo: 'listras' },
  { cor: '--cor-grafico-3', tipo: 'pontos' },
  { cor: '--cor-grafico-4', tipo: null },
];

/**
 * Barra empilhada da distribuição do valor por ano (como a barra "Votação" do TSE).
 * A barra é decorativa (aria-hidden); a legenda em lista traz ano, valor e percentual em texto.
 */
export function BarraEmpilhada({ fatias }: { fatias: readonly FatiaAno[] }) {
  const idBase = `dist-${idSeguro(useId())}`;
  const itens = fatias.map((f, i) => {
    const estilo = ESTILOS[i % ESTILOS.length] ?? { cor: '--cor-grafico-1', tipo: null };
    const padraoId = estilo.tipo ? `${idBase}-${f.ano}` : undefined;
    const legenda: ItemLegenda = { rotulo: f.ano, cor: estilo.cor, ...(padraoId ? { padraoId } : {}) };
    return { fatia: f, tipo: estilo.tipo, legenda };
  });
  const padroes: PadraoDef[] = itens.flatMap((i) =>
    i.tipo && i.legenda.padraoId ? [{ id: i.legenda.padraoId, cor: i.legenda.cor, tipo: i.tipo }] : [],
  );

  return (
    <>
      <DefsPadroes padroes={padroes} />
      <span className="barra-empilhada" aria-hidden="true">
        {itens.map(({ fatia, legenda }) => (
          <span key={fatia.ano} className="barra-empilhada__segmento" style={{ flexBasis: `${fatia.percentual}%` }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" focusable="false">
              <rect
                width="100%"
                height="100%"
                style={{ fill: legenda.padraoId ? `url(#${legenda.padraoId})` : `var(${legenda.cor})` }}
              />
            </svg>
          </span>
        ))}
      </span>
      <ul className="legenda legenda--distribuicao">
        {itens.map(({ fatia, legenda }) => (
          <li key={fatia.ano}>
            <Amostra item={legenda} />
            <span className="legenda__ano">{fatia.ano}</span>
            <span className="legenda__valor">{formatarMoeda(fatia.valor)}</span>
            <span className="legenda__percentual">({formatarPercentualDuasCasas(fatia.percentual)})</span>
          </li>
        ))}
      </ul>
    </>
  );
}
