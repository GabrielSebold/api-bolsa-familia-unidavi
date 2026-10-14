export type Direcao = 'alta' | 'queda' | 'estavel';

export interface Variacao {
  absoluta: number;
  /** Em unidades de porcentagem (12,5 = 12,5%); sem arredondamento. */
  percentual: number;
  direcao: Direcao;
}

/**
 * Variação de `anterior` para `atual`. Retorna null quando não dá para comparar
 * (algum valor ausente ou anterior igual a 0, que tornaria o percentual indefinido).
 */
export function calcularVariacao(atual: number | null | undefined, anterior: number | null | undefined): Variacao | null {
  if (typeof atual !== 'number' || typeof anterior !== 'number') return null;
  if (!Number.isFinite(atual) || !Number.isFinite(anterior) || anterior === 0) return null;
  const absoluta = atual - anterior;
  const percentual = (absoluta / Math.abs(anterior)) * 100;
  const direcao: Direcao = absoluta > 0 ? 'alta' : absoluta < 0 ? 'queda' : 'estavel';
  return { absoluta, percentual, direcao };
}

/** Variação de cada elemento em relação ao anterior; o 1º e pares com buraco (null) resultam em null. */
export function variacaoMesAMes(valores: readonly (number | null)[]): (Variacao | null)[] {
  return valores.map((v, i) => (i === 0 ? null : calcularVariacao(v, valores[i - 1])));
}
