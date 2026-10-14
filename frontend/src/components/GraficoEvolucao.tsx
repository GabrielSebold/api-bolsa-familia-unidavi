import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Metrica, PontoSerie } from '../types/api';
import {
  ROTULO_METRICA,
  formatarMesAno,
  formatarMesExtenso,
  formatarMetrica,
  formatarMetricaCompacta,
} from '../utils/formatadores';
import { valorDaMetrica } from '../utils/series';
import { descreverSerie } from '../utils/textoGrafico';
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

interface Props {
  /** Série contínua do período escolhido; meses sem dados têm valores null (viram lacunas). */
  serie: readonly PontoSerie[];
  metrica: Metrica;
}

interface Linha {
  mesAno: string;
  v: number | null;
}

/** Evolução mensal: área + linha com marcadores. Meses sem dados são lacunas (nunca interpolados). */
export default function GraficoEvolucao({ serie, metrica }: Props) {
  const rotulo = ROTULO_METRICA[metrica];
  const dados: Linha[] = serie.map((p) => ({ mesAno: p.mesAno, v: valorDaMetrica(p, metrica) }));
  const TooltipEvolucao = tooltipDe<Linha>((l) => ({
    titulo: formatarMesExtenso(l.mesAno),
    itens: [{ rotulo, texto: l.v === null ? 'sem dados' : formatarMetrica(l.v, metrica) }],
  }));

  return (
    <GraficoMoldura
      titulo={`Evolução mensal: ${rotulo.toLowerCase()}`}
      descricao={descreverSerie(serie, metrica)}
      ariaLabel={`Gráfico de área com a evolução mensal de ${rotulo.toLowerCase()}. A descrição e a tabela de dados estão abaixo.`}
      legenda={[{ rotulo, cor: '--cor-grafico-1', forma: 'linha' }]}
      tabela={{
        caption: `${rotulo} por mês`,
        colunas: ['Mês', rotulo],
        linhas: dados.map((l) => [formatarMesAno(l.mesAno), l.v === null ? 'Sem dados' : formatarMetrica(l.v, metrica)]),
      }}
    >
      <ResponsiveContainer width="100%" height={ALTURA_GRAFICO}>
        <AreaChart data={dados} margin={MARGEM} accessibilityLayer={false}>
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
          <Tooltip content={TooltipEvolucao} cursor={{ stroke: TRACO_EIXO, strokeDasharray: '4 4' }} />
          <Area
            type="linear"
            dataKey="v"
            name={rotulo}
            stroke="var(--cor-grafico-1)"
            strokeWidth={3}
            fill="var(--cor-grafico-1)"
            fillOpacity={0.18}
            dot={{ r: 4, strokeWidth: 2, stroke: 'var(--cor-grafico-1)', fill: 'var(--cor-fundo)' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--cor-grafico-1)', fill: 'var(--cor-fundo)' }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GraficoMoldura>
  );
}
