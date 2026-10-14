import type { ErroConsulta } from '../hooks/useRepasses';
import { mensagemDeErro, textoTentarNovamente } from '../utils/erros';

interface CarregandoProps {
  mensagem?: string;
}

export function Carregando({ mensagem = 'Carregando dados…' }: CarregandoProps) {
  return (
    <div className="estado estado--carregando" role="status" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <p>{mensagem}</p>
    </div>
  );
}

interface ErroProps {
  erro: ErroConsulta;
  onTentarNovamente?: () => void;
}

export function Erro({ erro, onTentarNovamente }: ErroProps) {
  const msg = mensagemDeErro(erro.codigo);
  const quando = textoTentarNovamente(erro.tentarNovamenteEm);
  return (
    <div className="estado estado--erro" role="alert">
      <h3 className="estado__titulo">{msg.titulo}</h3>
      <p>{msg.mensagem}</p>
      <p>{msg.acao}</p>
      {quando ? <p>{quando}</p> : null}
      <p className="estado__codigo">Código do erro: {erro.codigo}</p>
      {onTentarNovamente ? (
        <button type="button" className="botao botao--primario" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function Vazio() {
  return (
    <div className="estado estado--vazio" role="status">
      <h3 className="estado__titulo">Sem dados para o período</h3>
      <p>Não há repasses registrados para este município no período escolhido. Tente outro período ou município.</p>
    </div>
  );
}
