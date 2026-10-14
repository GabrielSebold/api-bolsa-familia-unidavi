import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Metrica, PontoSerie } from '../types/api';
import {
  ROTULO_METRICA,
  formatarMesAno,
  formatarMesExtenso,
  formatarMetrica,
  formatarMetricaCompacta,
  formatarPercentual,
} from '../utils/formatadores';
import { compararAnoAAno } from '../utils/series';
import { descreverAnoAAno } from '../utils/textoGrafico';
import { calcularVariacao } from '../utils/variacao';
import {
  ALTURA_EIXO_X,
  ALTURA_GRAFICO,
  LARGURA_EIXO_Y,
  MARGEM,
  ROTULO_EIXO_Y,
  TICK,
  TRACO_EIXO,
  TRACO_GRADE,
  rotuloEixoX,
  rotuloEixoY,
  tooltipDe,
} from './graficoComum';
import { GraficoMoldura } from './GraficoMoldura';
import { idSeguro, type ItemLegenda, type PadraoDef } from './padroesSvg';

interface Props {
  /** Série contínua com a janela estendida (12 meses antes do período). */
  serie: readonly PontoSerie[];
  metrica: Metrica;
  de: string;
  ate: string;
}

interface Linha {
  mesAno: string;
  mesAnoAnterior: string;
  atual: number | null;
  anterior: number | null;
}

/** Ano a ano: cada mês do período ao lado do mesmo mês um ano antes (barras agrupadas). */
export default function GraficoAnoAAno({ serie, metrica, de, ate }: Props) {
  const idBase = `aaa-${idSeguro(useId())}`;
  const rotulo = ROTULO_METRICA[metrica];
  const pares = compararAnoAAno(serie, metrica, de, ate);
  const dados: Linha[] = pares.map((p) => ({ ...p }));
  const idAnterior = `${idBase}-anterior`;
  const padroes: PadraoDef[] = [{ id: idAnterior, cor: '--cor-grafico-2', tipo: 'listras' }];
  const legenda: ItemLegenda[] = [
    { rotulo: 'Mês do período (cheio)', cor: '--cor-grafico-1' },
    { rotulo: 'Mesmo mês do ano anterior (listras)', cor: '--cor-grafico-2', padraoId: idAnterior },
  ];
  const texto = (v: number | null, vazio: string) => (v === null ? vazio : formatarMetrica(v, metrica));
  const TooltipAno = tooltipDe<Linha>((l) => {
    const variacao = calcularVariacao(l.atual, l.anterior);
    return {
      titulo: formatarMesExtenso(l.mesAno),
      itens: [
        { rotulo: formatarMesAno(l.mesAno), texto: texto(l.atual, 'sem dados') },
        { rotulo: formatarMesAno(l.mesAnoAnterior), texto: texto(l.anterior, 'sem dados do ano anterior') },
        ...(variacao ? [{ rotulo: 'Variação anual', texto: formatarPercentual(variacao.percentual) }] : []),
      ],
    };
  });

  return (
    <GraficoMoldura
      titulo={`Comparativo ano a ano: ${rotulo.toLowerCase()}`}
      descricao={descreverAnoAAno(pares, metrica)}
      ariaLabel={`Gráfico de barras agrupadas comparando ${rotulo.toLowerCase()} de cada mês com o mesmo mês do ano anterior. A descrição e a tabela de dados estão abaixo.`}
      legenda={legenda}
      padroes={padroes}
      tabela={{
        caption: `${rotulo}: mês do período e mesmo mês do ano anterior`,
        colunas: ['Mês', rotulo, 'Mesmo mês do ano anterior', 'Variação anual'],
        linhas: dados.map((l) => {
          const v = calcularVariacao(l.atual, l.anterior);
          return [
            formatarMesAno(l.mesAno),
            texto(l.atual, 'Sem dados'),
            l.anterior === null ? `Sem dados de ${formatarMesAno(l.mesAnoAnterior)}` : `${formatarMetrica(l.anterior, metrica)} (${formatarMesAno(l.mesAnoAnterior)})`,
            v ? formatarPercentual(v.percentual) : 'Indisponível',
          ];
        }),
      }}
    >
      <ResponsiveContainer width="100%" height={ALTURA_GRAFICO}>
        <BarChart data={dados} margin={MARGEM} barGap={1} accessibilityLayer={false}>
          <CartesianGrid stroke={TRACO_GRADE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="mesAno"
            tickFormatter={formatarMesAno}
            tick={TICK}
            angle={-45}
            textAnchor="end"
            height={ALTURA_EIXO_X}
            interval="preserveStartEnd"
            minTickGap={4}
            stroke={TRACO_EIXO}
            label={rotuloEixoX('Mês')}
          />
          <YAxis
            domain={[0, 'auto']}
            tickFormatter={(v: number) => formatarMetricaCompacta(v, metrica)}
            tick={TICK}
            width={LARGURA_EIXO_Y}
            stroke={TRACO_EIXO}
            label={rotuloEixoY(ROTULO_EIXO_Y[metrica])}
          />
          <Tooltip content={TooltipAno} cursor={{ fill: 'var(--cor-superficie)', opacity: 0.7 }} />
          <Bar
            dataKey="anterior"
            name="Mesmo mês do ano anterior"
            fill={`url(#${idAnterior})`}
            stroke="var(--cor-grafico-2)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Bar
            dataKey="atual"
            name="Mês do período"
            fill="var(--cor-grafico-1)"
            stroke="var(--cor-grafico-1)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </GraficoMoldura>
  );
}
