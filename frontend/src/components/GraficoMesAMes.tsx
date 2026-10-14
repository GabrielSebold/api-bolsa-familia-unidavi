import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Metrica, PontoSerie } from '../types/api';
import {
  ROTULO_METRICA,
  formatarMesAno,
  formatarMesExtenso,
  formatarPercentual,
} from '../utils/formatadores';
import { valorDaMetrica } from '../utils/series';
import { descreverMesAMes } from '../utils/textoGrafico';
import { variacaoMesAMes } from '../utils/variacao';
import {
  ALTURA_EIXO_X,
  ALTURA_GRAFICO,
  LARGURA_EIXO_Y,
  MARGEM,
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
  /** Série contínua do período escolhido (a variação do 1º mês não é calculada). */
  serie: readonly PontoSerie[];
  metrica: Metrica;
}

interface Linha {
  mesAno: string;
  variacao: number | null;
  positivo: number | null;
  negativo: number | null;
  /** Motivo de não haver variação: primeiro mês, falta de dados ou base zero. */
  motivo: string | null;
}

function montarLinhas(serie: readonly PontoSerie[], metrica: Metrica): Linha[] {
  const valores = serie.map((p) => valorDaMetrica(p, metrica));
  const variacoes = variacaoMesAMes(valores);
  return serie.map((p, i) => {
    const v = variacoes[i] ?? null;
    let motivo: string | null = null;
    if (!v) {
      if (i === 0) motivo = 'sem mês anterior no período';
      else if (valores[i] === null || valores[i - 1] === null) motivo = 'sem dados';
      else motivo = 'indisponível (mês anterior igual a zero)';
    }
    return {
      mesAno: p.mesAno,
      variacao: v ? v.percentual : null,
      positivo: v && v.percentual >= 0 ? v.percentual : null,
      negativo: v && v.percentual < 0 ? v.percentual : null,
      motivo,
    };
  });
}

const sinal = (v: unknown) => (typeof v === 'number' ? (v >= 0 ? '+' : '−') : '');

/** Mês a mês: barras divergentes da variação percentual sobre o mês anterior. */
export default function GraficoMesAMes({ serie, metrica }: Props) {
  const idBase = `mam-${idSeguro(useId())}`;
  const rotulo = ROTULO_METRICA[metrica];
  const dados = montarLinhas(serie, metrica);
  const idAlta = `${idBase}-alta`;
  const idQueda = `${idBase}-queda`;
  const padroes: PadraoDef[] = [
    { id: idAlta, cor: '--cor-grafico-positivo', tipo: 'listras' },
    { id: idQueda, cor: '--cor-grafico-negativo', tipo: 'pontos' },
  ];
  const legenda: ItemLegenda[] = [
    { rotulo: 'Alta (barra para cima, listras, sinal +)', cor: '--cor-grafico-positivo', padraoId: idAlta },
    { rotulo: 'Queda (barra para baixo, pontos, sinal −)', cor: '--cor-grafico-negativo', padraoId: idQueda },
  ];
  const TooltipMes = tooltipDe<Linha>((l) => ({
    titulo: formatarMesExtenso(l.mesAno),
    itens: [
      {
        rotulo: 'Variação sobre o mês anterior',
        texto: l.variacao === null ? (l.motivo ?? 'sem dados') : formatarPercentual(l.variacao),
      },
    ],
  }));

  return (
    <GraficoMoldura
      titulo={`Variação mês a mês: ${rotulo.toLowerCase()}`}
      descricao={descreverMesAMes(serie, metrica)}
      ariaLabel={`Gráfico de barras com a variação percentual mês a mês de ${rotulo.toLowerCase()}. A descrição e a tabela de dados estão abaixo.`}
      legenda={legenda}
      padroes={padroes}
      tabela={{
        caption: `Variação mês a mês: ${rotulo.toLowerCase()}`,
        colunas: ['Mês', 'Variação sobre o mês anterior'],
        linhas: dados.map((l) => [
          formatarMesAno(l.mesAno),
          l.variacao === null ? `Sem variação: ${l.motivo ?? 'sem dados'}` : formatarPercentual(l.variacao),
        ]),
      }}
    >
      <ResponsiveContainer width="100%" height={ALTURA_GRAFICO}>
        <BarChart data={dados} margin={{ ...MARGEM, top: 28, bottom: 20 }} stackOffset="sign" accessibilityLayer={false}>
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
            tickFormatter={(v: number) => formatarPercentual(v)}
            tick={TICK}
            width={LARGURA_EIXO_Y}
            stroke={TRACO_EIXO}
            label={rotuloEixoY('Variação (%)')}
          />
          <ReferenceLine y={0} stroke={TRACO_EIXO} strokeWidth={2} />
          <Tooltip content={TooltipMes} cursor={{ fill: 'var(--cor-superficie)', opacity: 0.7 }} />
          <Bar
            dataKey="positivo"
            name="Alta"
            stackId="variacao"
            fill={`url(#${idAlta})`}
            stroke="var(--cor-grafico-positivo)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="positivo"
              position="top"
              formatter={sinal}
              style={{ fill: 'var(--cor-texto)', fontSize: '0.85rem', fontWeight: 700 }}
            />
          </Bar>
          <Bar
            dataKey="negativo"
            name="Queda"
            stackId="variacao"
            fill={`url(#${idQueda})`}
            stroke="var(--cor-grafico-negativo)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="negativo"
              position="bottom"
              formatter={sinal}
              style={{ fill: 'var(--cor-texto)', fontSize: '0.85rem', fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GraficoMoldura>
  );
}
