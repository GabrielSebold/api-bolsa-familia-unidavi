interface BarraPercentualProps {
  /** 0..100 (valores fora do intervalo são limitados só no desenho). */
  percentual: number;
  variante?: 'padrao' | 'destaque';
}

function limitar(v: number): number {
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
}

/**
 * Barra horizontal decorativa (aria-hidden): quem usa sempre escreve o percentual em texto ao lado,
 * por isso não há role="progressbar" (o leitor de tela anunciaria o valor duas vezes).
 */
export function BarraPercentual({ percentual, variante = 'padrao' }: BarraPercentualProps) {
  return (
    <span className={variante === 'destaque' ? 'barra barra--destaque' : 'barra'} aria-hidden="true">
      <span className="barra__preenchimento" style={{ inlineSize: `${limitar(percentual)}%` }} />
    </span>
  );
}
