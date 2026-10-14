import type { TooltipContentProps } from 'recharts';
import type { Metrica } from '../types/api';

export const ALTURA_GRAFICO = 320;
export const MARGEM = { top: 20, right: 16, bottom: 4, left: 4 } as const;
/** Tamanhos em rem para acompanhar a escala de fonte (A−/A+). */
export const TICK = { fill: 'var(--cor-texto-suave)', fontSize: '0.8rem' } as const;
export const TRACO_EIXO = 'var(--cor-grafico-eixo)';
export const TRACO_GRADE = 'var(--cor-borda-suave)';
export const LARGURA_EIXO_Y = 88;
export const ALTURA_EIXO_X = 82;

export const ROTULO_EIXO_Y: Record<Metrica, string> = {
  valor: 'Valor repassado (R$)',
  familias: 'Famílias',
  valorMedio: 'Valor médio (R$)',
};

export function rotuloEixoY(texto: string) {
  return {
    value: texto,
    angle: -90,
    position: 'insideLeft' as const,
    style: { textAnchor: 'middle' as const, fill: 'var(--cor-texto)', fontSize: '0.8rem' },
  };
}

export function rotuloEixoX(texto: string) {
  return {
    value: texto,
    position: 'insideBottom' as const,
    offset: 0,
    style: { fill: 'var(--cor-texto)', fontSize: '0.8rem' },
  };
}

export interface ConteudoTooltip {
  titulo: string;
  itens: { rotulo: string; texto: string }[];
}

/** Tooltip próprio (pt-BR, tokens do tema); recebe a linha de dados inteira, inclusive meses sem valor. */
export function tooltipDe<L>(montar: (linha: L) => ConteudoTooltip) {
  return function TooltipGrafico({ active, payload }: Pick<TooltipContentProps, 'active' | 'payload'>) {
    const linha = payload?.[0]?.payload as L | undefined;
    if (!active || !linha) return null;
    const { titulo, itens } = montar(linha);
    return (
      <div className="tooltip-grafico">
        <p className="tooltip-grafico__titulo">{titulo}</p>
        <ul>
          {itens.map((i) => (
            <li key={i.rotulo}>
              {i.rotulo}: <strong>{i.texto}</strong>
            </li>
          ))}
        </ul>
      </div>
    );
  };
}
