import type { Metrica, PontoSerie } from '../types/api';
import { ROTULO_METRICA, VAZIO, formatarInteiro, formatarMesAno, formatarMoeda, formatarPercentual, nomePrograma } from '../utils/formatadores';
import { compararAnoAAno, valorDaMetrica } from '../utils/series';
import { calcularVariacao, variacaoMesAMes, type Variacao } from '../utils/variacao';

interface TabelaDadosProps {
  /** Série do período escolhido. */
  serie: readonly PontoSerie[];
  /** Série com a janela estendida, para a variação ano a ano. */
  serieEstendida: readonly PontoSerie[];
  metrica: Metrica;
  de: string;
  ate: string;
}

function CelulaVariacao({ variacao }: { variacao: Variacao | null }) {
  if (!variacao) return <td>Indisponível</td>;
  const seta = variacao.direcao === 'alta' ? '▲' : variacao.direcao === 'queda' ? '▼' : '=';
  return (
    <td>
      <span aria-hidden="true">{seta} </span>
      {formatarPercentual(variacao.percentual)}
    </td>
  );
}

/** Resumo mês a mês de todo o período, com meses sem dados explícitos. */
export function TabelaDados({ serie, serieEstendida, metrica, de, ate }: TabelaDadosProps) {
  const mesAMes = variacaoMesAMes(serie.map((p) => valorDaMetrica(p, metrica)));
  const anoAAno = compararAnoAAno(serieEstendida, metrica, de, ate);
  return (
    <div className="tabela-rolagem" role="region" aria-label="Tabela de dados mês a mês (rolável)" tabIndex={0}>
      <table className="tabela tabela--resumo">
        <caption>
          Resumo mês a mês. As variações são calculadas para: {ROTULO_METRICA[metrica].toLowerCase()}.
        </caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Programa</th>
            <th scope="col">Valor repassado</th>
            <th scope="col">Famílias</th>
            <th scope="col">Valor médio</th>
            <th scope="col">Variação mês a mês</th>
            <th scope="col">Variação ano a ano</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((p, i) => {
            if (p.valor === null) {
              return (
                <tr key={p.mesAno}>
                  <th scope="row">{formatarMesAno(p.mesAno)}</th>
                  <td colSpan={6}>Sem dados</td>
                </tr>
              );
            }
            const par = anoAAno[i];
            return (
              <tr key={p.mesAno}>
                <th scope="row">{formatarMesAno(p.mesAno)}</th>
                <td>{p.programas.map(nomePrograma).join(', ') || VAZIO}</td>
                <td>{formatarMoeda(p.valor)}</td>
                <td>{formatarInteiro(p.familias)}</td>
                <td>{formatarMoeda(p.valorMedio)}</td>
                <CelulaVariacao variacao={mesAMes[i] ?? null} />
                <CelulaVariacao variacao={par ? calcularVariacao(par.atual, par.anterior) : null} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
