/** Padrões SVG: a cor nunca é o único canal que distingue as séries dos gráficos. */
export type TipoPadrao = 'listras' | 'pontos';

export interface PadraoDef {
  id: string;
  /** Nome da variável CSS de cor, ex.: "--cor-grafico-2". */
  cor: string;
  tipo: TipoPadrao;
}

/** useId pode devolver caracteres inválidos em url(#id); mantém só [a-zA-Z0-9_-]. */
export function idSeguro(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * SVG oculto com os <pattern> usados pelas barras e pelas amostras da legenda.
 * Fica fora do SVG do Recharts para não depender de como a biblioteca trata filhos desconhecidos.
 */
export function DefsPadroes({ padroes }: { padroes: readonly PadraoDef[] }) {
  if (padroes.length === 0) return null;
  return (
    <svg className="svg-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {padroes.map((p) => (
          <pattern
            key={p.id}
            id={p.id}
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
            patternTransform={p.tipo === 'listras' ? 'rotate(45)' : undefined}
          >
            <rect width="8" height="8" style={{ fill: `var(${p.cor})` }} />
            {p.tipo === 'listras' ? (
              <rect width="3" height="8" style={{ fill: 'var(--cor-fundo)' }} />
            ) : (
              <circle cx="4" cy="4" r="1.6" style={{ fill: 'var(--cor-fundo)' }} />
            )}
          </pattern>
        ))}
      </defs>
    </svg>
  );
}

export interface ItemLegenda {
  rotulo: string;
  cor: string;
  /** Id de um <pattern>; sem ele a amostra é cheia. */
  padraoId?: string;
  forma?: 'quadrado' | 'linha';
}

export function Amostra({ item }: { item: ItemLegenda }) {
  const cor = `var(${item.cor})`;
  return (
    <svg className="amostra" width="24" height="20" viewBox="0 0 24 20" aria-hidden="true" focusable="false">
      {item.forma === 'linha' ? (
        <>
          <line x1="1" y1="10" x2="23" y2="10" style={{ stroke: cor, strokeWidth: 3 }} />
          <circle cx="12" cy="10" r="4" style={{ stroke: cor, strokeWidth: 2, fill: 'var(--cor-fundo)' }} />
        </>
      ) : (
        <rect
          x="2"
          y="2"
          width="20"
          height="16"
          rx="2"
          style={{ fill: item.padraoId ? `url(#${item.padraoId})` : cor, stroke: cor, strokeWidth: 2 }}
        />
      )}
    </svg>
  );
}
