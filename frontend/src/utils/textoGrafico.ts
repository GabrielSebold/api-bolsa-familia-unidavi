import type { Metrica, PontoSerie } from '../types/api';
import { ROTULO_METRICA, formatarMesAno, formatarMetrica, formatarPercentual } from './formatadores';
import { valorDaMetrica, type ParAnoAAno } from './series';
import { calcularVariacao, variacaoMesAMes } from './variacao';

/**
 * Descrição textual da evolução, para leitores de tela e como alternativa ao gráfico:
 * primeiro → último mês com dados, maior, menor e tendência. Nunca interpola meses sem dados.
 */
export function descreverSerie(serie: readonly PontoSerie[], metrica: Metrica): string {
  const rotulo = ROTULO_METRICA[metrica];
  const comDados = serie
    .map((p) => ({ mesAno: p.mesAno, v: valorDaMetrica(p, metrica) }))
    .filter((p): p is { mesAno: string; v: number } => p.v !== null);

  const primeiro = comDados[0];
  const ultimo = comDados[comDados.length - 1];
  if (!primeiro || !ultimo) return `${rotulo}: sem dados no período.`;

  const fmt = (v: number) => formatarMetrica(v, metrica);
  const partes: string[] = [];

  if (comDados.length === 1) {
    partes.push(`${rotulo}: apenas ${formatarMesAno(primeiro.mesAno)} tem dados, com ${fmt(primeiro.v)}.`);
  } else {
    partes.push(
      `${rotulo}: de ${fmt(primeiro.v)} em ${formatarMesAno(primeiro.mesAno)} para ${fmt(ultimo.v)} em ${formatarMesAno(ultimo.mesAno)}.`,
    );
    const maior = comDados.reduce((a, b) => (b.v > a.v ? b : a));
    const menor = comDados.reduce((a, b) => (b.v < a.v ? b : a));
    partes.push(`Maior valor: ${fmt(maior.v)} em ${formatarMesAno(maior.mesAno)}.`);
    partes.push(`Menor valor: ${fmt(menor.v)} em ${formatarMesAno(menor.mesAno)}.`);

    const variacao = calcularVariacao(ultimo.v, primeiro.v);
    if (variacao) {
      const tendencia =
        variacao.direcao === 'alta' ? 'Tendência de alta' : variacao.direcao === 'queda' ? 'Tendência de queda' : 'Estável';
      partes.push(`${tendencia} no período (${formatarPercentual(variacao.percentual)}).`);
    }
  }

  const ausentes = serie.length - comDados.length;
  if (ausentes > 0) partes.push(`${ausentes} ${ausentes === 1 ? 'mês sem dados' : 'meses sem dados'}.`);
  return partes.join(' ');
}

/** Descrição textual do gráfico de variação mês a mês (variações em % do mês sobre o mês anterior). */
export function descreverMesAMes(serie: readonly PontoSerie[], metrica: Metrica): string {
  const rotulo = ROTULO_METRICA[metrica];
  const variacoes = variacaoMesAMes(serie.map((p) => valorDaMetrica(p, metrica)));
  const itens = variacoes
    .map((v, i) => ({ v, mesAno: serie[i]?.mesAno ?? '' }))
    .filter((x): x is { v: NonNullable<typeof x.v>; mesAno: string } => x.v !== null);
  if (itens.length === 0) return `${rotulo}: não há meses consecutivos com dados para calcular a variação mês a mês.`;
  const altas = itens.filter((x) => x.v.direcao === 'alta').length;
  const quedas = itens.filter((x) => x.v.direcao === 'queda').length;
  const maior = itens.reduce((a, b) => (b.v.percentual > a.v.percentual ? b : a));
  const menor = itens.reduce((a, b) => (b.v.percentual < a.v.percentual ? b : a));
  const partes = [
    `${rotulo}, variação mês a mês: ${altas} ${altas === 1 ? 'mês' : 'meses'} em alta e ${quedas} em queda.`,
    `Maior variação: ${formatarPercentual(maior.v.percentual)} em ${formatarMesAno(maior.mesAno)}.`,
    `Menor variação: ${formatarPercentual(menor.v.percentual)} em ${formatarMesAno(menor.mesAno)}.`,
  ];
  const semCalculo = serie.length - itens.length;
  if (semCalculo > 0) {
    partes.push(`${semCalculo} ${semCalculo === 1 ? 'mês' : 'meses'} sem variação calculável (primeiro mês ou sem dados).`);
  }
  return partes.join(' ');
}

/** Descrição textual do comparativo ano a ano (cada mês do período contra o mesmo mês um ano antes). */
export function descreverAnoAAno(pares: readonly ParAnoAAno[], metrica: Metrica): string {
  const rotulo = ROTULO_METRICA[metrica];
  const comPar = pares
    .map((p) => ({ mesAno: p.mesAno, v: calcularVariacao(p.atual, p.anterior) }))
    .filter((x): x is { mesAno: string; v: NonNullable<typeof x.v> } => x.v !== null);
  if (comPar.length === 0) return `${rotulo}: não há dados do ano anterior para comparar com o período.`;
  const altas = comPar.filter((x) => x.v.direcao === 'alta').length;
  const quedas = comPar.filter((x) => x.v.direcao === 'queda').length;
  const maior = comPar.reduce((a, b) => (b.v.percentual > a.v.percentual ? b : a));
  const menor = comPar.reduce((a, b) => (b.v.percentual < a.v.percentual ? b : a));
  const partes = [
    `${rotulo}, comparado ao mesmo mês do ano anterior: ${altas} ${altas === 1 ? 'mês' : 'meses'} em alta e ${quedas} em queda.`,
    `Maior variação: ${formatarPercentual(maior.v.percentual)} em ${formatarMesAno(maior.mesAno)}.`,
    `Menor variação: ${formatarPercentual(menor.v.percentual)} em ${formatarMesAno(menor.mesAno)}.`,
  ];
  const semPar = pares.length - comPar.length;
  if (semPar > 0) partes.push(`${semPar} ${semPar === 1 ? 'mês' : 'meses'} sem dados do ano anterior para comparar.`);
  return partes.join(' ');
}
