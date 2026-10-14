/** Meses são strings AAAAMM (ex.: "202509"), como na API. */
export const ANO_MINIMO = 2004;
export const MAX_MESES = 36;
export const MESES_ANO_ANTERIOR = 12;

export interface Periodo {
  de: string;
  ate: string;
}

export interface ErrosPeriodo {
  de?: string;
  ate?: string;
  periodo?: string;
}

function indice(mesAno: string): number {
  return Number(mesAno.slice(0, 4)) * 12 + (Number(mesAno.slice(4)) - 1);
}

function deIndice(i: number): string {
  const ano = Math.floor(i / 12);
  return `${ano}${String((i % 12) + 1).padStart(2, '0')}`;
}

export function formatoValido(mesAno: string): boolean {
  if (!/^\d{6}$/.test(mesAno)) return false;
  const mes = Number(mesAno.slice(4));
  return mes >= 1 && mes <= 12;
}

/** Mês corrente (UTC, igual à API) em AAAAMM. */
export function mesAtual(hoje: Date = new Date()): string {
  return `${hoje.getUTCFullYear()}${String(hoje.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function somarMeses(mesAno: string, n: number): string {
  return deIndice(indice(mesAno) + n);
}

/** Quantidade de meses de `de` até `ate`, inclusive (negativa/zero se `de` > `ate`). */
export function contarMeses(de: string, ate: string): number {
  return indice(ate) - indice(de) + 1;
}

/** Lista AAAAMM de `de` até `ate`, inclusive. Vazia se de > ate. */
export function intervaloMeses(de: string, ate: string): string[] {
  const out: string[] = [];
  for (let i = indice(de); i <= indice(ate); i++) out.push(deIndice(i));
  return out;
}

/** Período padrão: fim = mês atual − 2 (dados costumam atrasar) e início = fim − 11 (12 meses). */
export function periodoPadrao(hoje: Date = new Date()): Periodo {
  const ate = somarMeses(mesAtual(hoje), -2);
  return { de: somarMeses(ate, -11), ate };
}

export function validarPeriodo({ de, ate }: Periodo, hoje: Date = new Date()): ErrosPeriodo {
  const erros: ErrosPeriodo = {};
  const atual = mesAtual(hoje);
  if (!formatoValido(de)) erros.de = 'Informe um mês e um ano de início válidos.';
  if (!formatoValido(ate)) erros.ate = 'Informe um mês e um ano de fim válidos.';
  if (erros.de || erros.ate) return erros;

  if (Number(de.slice(0, 4)) < ANO_MINIMO) erros.de = `O ano de início deve ser ${ANO_MINIMO} ou posterior.`;
  if (Number(ate.slice(0, 4)) < ANO_MINIMO) erros.ate = `O ano de fim deve ser ${ANO_MINIMO} ou posterior.`;
  if (de > atual) erros.de = 'O início não pode estar no futuro.';
  if (ate > atual) erros.ate = 'O fim não pode estar no futuro.';
  if (erros.de || erros.ate) return erros;

  const total = contarMeses(de, ate);
  if (total < 1) erros.periodo = 'O início deve ser anterior ou igual ao fim.';
  else if (total > MAX_MESES) erros.periodo = `O período pode ter no máximo ${MAX_MESES} meses (selecionados: ${total}).`;
  return erros;
}

export function periodoTemErros(erros: ErrosPeriodo): boolean {
  return Boolean(erros.de || erros.ate || erros.periodo);
}

/**
 * Janela da consulta única: estende 12 meses para trás (para o comparativo ano a ano),
 * limitada a 36 meses no total.
 */
export function janelaConsulta(de: string, ate: string): Periodo {
  let inicio = somarMeses(de, -MESES_ANO_ANTERIOR);
  if (contarMeses(inicio, ate) > MAX_MESES) inicio = somarMeses(ate, -(MAX_MESES - 1));
  return { de: inicio, ate };
}
