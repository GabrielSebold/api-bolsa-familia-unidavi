import { useId } from 'react';
import { nomeMes } from '../utils/formatadores';
import { ANO_MINIMO, mesAtual, type ErrosPeriodo, type Periodo } from '../utils/periodo';

interface PeriodoFiltroProps {
  de: string;
  ate: string;
  erros: ErrosPeriodo;
  onChange: (periodo: Periodo) => void;
}

interface MesAnoSelectsProps {
  legenda: string;
  valor: string;
  atual: string;
  erro: string | undefined;
  erroPeriodo: string | undefined;
  idErro: string;
  idErroPeriodo: string;
  idBase: string;
  onChange: (mesAno: string) => void;
}

function MesAnoSelects({
  legenda,
  valor,
  atual,
  erro,
  erroPeriodo,
  idErro,
  idErroPeriodo,
  idBase,
  onChange,
}: MesAnoSelectsProps) {
  const ano = Number(valor.slice(0, 4));
  const mes = Number(valor.slice(4));
  const anoAtual = Number(atual.slice(0, 4));
  const mesDoAnoAtual = Number(atual.slice(4));
  const anos: number[] = [];
  for (let a = anoAtual; a >= ANO_MINIMO; a--) anos.push(a);

  const invalido = Boolean(erro ?? erroPeriodo);
  const descricao = erro ? idErro : erroPeriodo ? idErroPeriodo : undefined;

  const mudar = (novoAno: number, novoMes: number) => {
    // Sem meses futuros: ao escolher o ano corrente, limita o mês ao mês atual.
    const mesFinal = novoAno === anoAtual ? Math.min(novoMes, mesDoAnoAtual) : novoMes;
    onChange(`${novoAno}${String(mesFinal).padStart(2, '0')}`);
  };

  return (
    <fieldset className="grupo-campos" aria-describedby={erro ? idErro : undefined}>
      <legend>{legenda}</legend>
      <div className="grupo-campos__selects">
        <div className="campo">
          <label htmlFor={`${idBase}-mes`}>Mês</label>
          <select
            id={`${idBase}-mes`}
            value={mes}
            aria-invalid={invalido || undefined}
            aria-describedby={descricao}
            onChange={(e) => mudar(ano, Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m} disabled={ano === anoAtual && m > mesDoAnoAtual}>
                {nomeMes(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${idBase}-ano`}>Ano</label>
          <select
            id={`${idBase}-ano`}
            value={ano}
            aria-invalid={invalido || undefined}
            aria-describedby={descricao}
            onChange={(e) => mudar(Number(e.target.value), mes)}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
      {erro ? (
        <p id={idErro} className="campo__erro" role="alert">
          {erro}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Período em dois grupos de selects (mês/ano de início e de fim), sem meses futuros. */
export function PeriodoFiltro({ de, ate, erros, onChange }: PeriodoFiltroProps) {
  const id = useId();
  const atual = mesAtual();
  const idErroPeriodo = `${id}-erro-periodo`;
  return (
    <fieldset className="grupo-campos grupo-campos--periodo" aria-describedby={erros.periodo ? idErroPeriodo : undefined}>
      <legend>Período</legend>
      <div className="periodo__grupos">
        <MesAnoSelects
          legenda="Início"
          valor={de}
          atual={atual}
          erro={erros.de}
          erroPeriodo={erros.periodo}
          idErro={`${id}-erro-de`}
          idErroPeriodo={idErroPeriodo}
          idBase={`${id}-de`}
          onChange={(v) => onChange({ de: v, ate })}
        />
        <MesAnoSelects
          legenda="Fim"
          valor={ate}
          atual={atual}
          erro={erros.ate}
          erroPeriodo={erros.periodo}
          idErro={`${id}-erro-ate`}
          idErroPeriodo={idErroPeriodo}
          idBase={`${id}-ate`}
          onChange={(v) => onChange({ de, ate: v })}
        />
      </div>
      {erros.periodo ? (
        <p id={idErroPeriodo} className="campo__erro" role="alert">
          {erros.periodo}
        </p>
      ) : null}
      <p className="campo__dica">Máximo de 36 meses, de {ANO_MINIMO} até o mês atual.</p>
    </fieldset>
  );
}
