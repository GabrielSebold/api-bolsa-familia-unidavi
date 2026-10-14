import type { Metrica } from '../types/api';

/** Formatação só para exibição: os dados nunca são arredondados fora daqui. */
export const VAZIO = '—';

const LOCALE = 'pt-BR';
const FUSO = 'America/Sao_Paulo';

const brl = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const brlCompacto = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const inteiro = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const inteiroCompacto = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });
const percentual = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  signDisplay: 'exceptZero',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const percentualAbsoluto = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dataFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric' });
const horaFmt = new Intl.DateTimeFormat(LOCALE, { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hour12: false });

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;
const MESES_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const;

function ehNumero(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function formatarMoeda(v: number | null | undefined): string {
  return ehNumero(v) ? brl.format(v) : VAZIO;
}

export function formatarMoedaCompacta(v: number | null | undefined): string {
  return ehNumero(v) ? brlCompacto.format(v) : VAZIO;
}

export function formatarInteiro(v: number | null | undefined): string {
  return ehNumero(v) ? inteiro.format(v) : VAZIO;
}

export function formatarInteiroCompacto(v: number | null | undefined): string {
  return ehNumero(v) ? inteiroCompacto.format(v) : VAZIO;
}

/** Recebe o percentual em unidades de porcentagem (12,5 = 12,5%). Mostra sinal (+/−), exceto zero. */
export function formatarPercentual(v: number | null | undefined): string {
  return ehNumero(v) ? percentual.format(v / 100) : VAZIO;
}

/** Percentual sem sinal (o texto já diz "aumento"/"queda"). Recebe unidades de porcentagem. */
export function formatarPercentualSemSinal(v: number | null | undefined): string {
  return ehNumero(v) ? percentualAbsoluto.format(Math.abs(v) / 100) : VAZIO;
}

const NOMES_PROGRAMA: Record<string, string> = {
  BOLSA_FAMILIA: 'Bolsa Família',
  AUXILIO_BRASIL: 'Auxílio Brasil',
  NOVO_BOLSA_FAMILIA: 'Novo Bolsa Família',
};

/** "NOVO_BOLSA_FAMILIA" → "Novo Bolsa Família"; código desconhecido é mostrado como veio. */
export function nomePrograma(codigo: string): string {
  return NOMES_PROGRAMA[codigo] ?? codigo;
}

export const ROTULO_METRICA: Record<Metrica, string> = {
  valor: 'Valor repassado',
  familias: 'Famílias beneficiadas',
  valorMedio: 'Valor médio por família',
};

/** Formata conforme a métrica: moeda para valor/valor médio, inteiro para famílias. */
export function formatarMetrica(v: number | null | undefined, metrica: Metrica): string {
  return metrica === 'familias' ? formatarInteiro(v) : formatarMoeda(v);
}

/** Versão curta (eixos dos gráficos). */
export function formatarMetricaCompacta(v: number | null | undefined, metrica: Metrica): string {
  return metrica === 'familias' ? formatarInteiroCompacto(v) : formatarMoedaCompacta(v);
}

function partesMes(mesAno: string): { ano: string; mes: number } | null {
  if (!/^\d{6}$/.test(mesAno)) return null;
  const mes = Number(mesAno.slice(4));
  if (mes < 1 || mes > 12) return null;
  return { ano: mesAno.slice(0, 4), mes };
}

/** "202601" → "jan/2026" */
export function formatarMesAno(mesAno: string): string {
  const p = partesMes(mesAno);
  return p ? `${MESES_ABREV[p.mes - 1]}/${p.ano}` : VAZIO;
}

/** "202601" → "janeiro de 2026" */
export function formatarMesExtenso(mesAno: string): string {
  const p = partesMes(mesAno);
  return p ? `${MESES_EXTENSO[p.mes - 1]} de ${p.ano}` : VAZIO;
}

/** Nome do mês por extenso (1–12), para os selects. */
export function nomeMes(mes: number): string {
  return MESES_EXTENSO[mes - 1] ?? VAZIO;
}

/** ISO-8601 → "08/10/2026, 09:30" no fuso de São Paulo. */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return VAZIO;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return VAZIO;
  return `${dataFmt.format(d)}, ${horaFmt.format(d)}`;
}
