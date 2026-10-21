import { useId, useState } from 'react';
import type { Metrica, PontoSerie } from '../types/api';
import {
  ROTULO_METRICA,
  VAZIO,
  formatarMesAno,
  formatarMesExtenso,
  formatarMetrica,
} from '../utils/formatadores';
import { textoVariacao } from '../utils/textoVariacao';
import { calcularVariacao } from '../utils/variacao';
import { valorDaMetrica } from '../utils/series';

interface CardsIndicadoresProps {
  /** Série contínua do período escolhido (sem a janela estendida). */
  serie: readonly PontoSerie[];
}

const METRICAS: readonly Metrica[] = ['valor', 'familias', 'valorMedio'];
const TITULO_CARD: Record<Metrica, string> = {
  valor: 'Valor total repassado',
  familias: 'Famílias beneficiadas',
  valorMedio: 'Valor médio por família',
};

interface CardProps {
  metrica: Metrica;
  atual: PontoSerie;
  anterior: PontoSerie | null;
}

/** Classe da pílula: a direção vem da Variacao já calculada; sem comparação possível = neutra. */
type DirecaoPilula = 'alta' | 'queda' | 'neutra';

function textoComparacao(
  metrica: Metrica,
  atual: PontoSerie,
  anterior: PontoSerie | null,
): { seta: string; texto: string; direcao: DirecaoPilula } {
  if (!anterior) return { seta: '', texto: 'sem mês anterior no período', direcao: 'neutra' };
  const nomeAnterior = formatarMesAno(anterior.mesAno);
  const valorAnterior = valorDaMetrica(anterior, metrica);
  if (valorAnterior === null) return { seta: '', texto: `sem dados em ${nomeAnterior} para comparar`, direcao: 'neutra' };
  const variacao = calcularVariacao(valorDaMetrica(atual, metrica), valorAnterior);
  if (!variacao) return { seta: '', texto: `variação indisponível em relação a ${nomeAnterior}`, direcao: 'neutra' };
  const { seta, texto } = textoVariacao(variacao, metrica);
  const direcao = variacao.direcao === 'estavel' ? 'neutra' : variacao.direcao;
  return { seta, texto: `${texto} em relação a ${nomeAnterior}`, direcao };
}

function Card({ metrica, atual, anterior }: CardProps) {
  const valor = valorDaMetrica(atual, metrica);
  const { seta, texto, direcao } = textoComparacao(metrica, atual, anterior);
  return (
    <li className={metrica === 'valor' ? 'card-indicador card-indicador--destaque' : 'card-indicador'}>
      <h3 className="card-indicador__titulo">{TITULO_CARD[metrica]}</h3>
      <p className="card-indicador__valor">{valor === null ? VAZIO : formatarMetrica(valor, metrica)}</p>
      <p className={`card-indicador__variacao pilula pilula--${direcao}`}>
        {seta ? (
          <span className="card-indicador__seta" aria-hidden="true">
            {seta}{' '}
          </span>
        ) : null}
        {texto}
      </p>
    </li>
  );
}

/** Três cards (RF02) do mês de referência: por padrão o último mês com dados do período. */
export function CardsIndicadores({ serie }: CardsIndicadoresProps) {
  const idSelect = useId();
  const comDados = serie.filter((p) => p.valor !== null);
  const ultimo = comDados[comDados.length - 1]?.mesAno ?? null;
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');

  const referencia = escolhido && comDados.some((p) => p.mesAno === escolhido) ? escolhido : ultimo;
  const indice = serie.findIndex((p) => p.mesAno === referencia);
  const atual = indice >= 0 ? serie[indice] : undefined;
  if (!atual || referencia === null) return null;
  const anterior = indice > 0 ? (serie[indice - 1] ?? null) : null;

  const aoEscolher = (mesAno: string) => {
    setEscolhido(mesAno);
    const i = serie.findIndex((p) => p.mesAno === mesAno);
    const p = serie[i];
    if (!p) return;
    setAnuncio(
      `Mês de referência ${formatarMesExtenso(mesAno)}. ${METRICAS.map((m) => {
        const v = valorDaMetrica(p, m);
        return `${TITULO_CARD[m]}: ${v === null ? 'sem dados' : formatarMetrica(v, m)}.`;
      }).join(' ')}`,
    );
  };

  return (
    <div className="cards">
      <div className="campo campo--referencia">
        <label htmlFor={idSelect}>Mês de referência</label>
        <select id={idSelect} value={referencia} onChange={(e) => aoEscolher(e.target.value)}>
          {[...comDados].reverse().map((p) => (
            <option key={p.mesAno} value={p.mesAno}>
              {formatarMesExtenso(p.mesAno)}
            </option>
          ))}
        </select>
      </div>
      <ul className="cards__lista" aria-label={`Indicadores de ${formatarMesExtenso(referencia)}`}>
        {METRICAS.map((m) => (
          <Card key={m} metrica={m} atual={atual} anterior={anterior} />
        ))}
      </ul>
      <p className="cards__nota">
        Valores do mês de referência. {ROTULO_METRICA.familias} não são somadas entre meses, por isso não há total do período.
      </p>
      <div className="somente-leitor" role="status" aria-live="polite">
        {anuncio}
      </div>
    </div>
  );
}
