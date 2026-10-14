import { useEscalaFonte } from '../hooks/useEscalaFonte';

const ATALHOS = [
  { tecla: '1', alvo: '#conteudo', rotulo: 'Conteúdo' },
  { tecla: '2', alvo: '#filtros', rotulo: 'Filtros' },
  { tecla: '3', alvo: '#graficos', rotulo: 'Gráficos' },
  { tecla: '4', alvo: '#tabela', rotulo: 'Tabela' },
] as const;

/** Move o foco para o alvo do atalho (âncoras internas não focam sozinhas em todos os navegadores). */
function irPara(e: React.MouseEvent<HTMLAnchorElement>, alvo: string) {
  const el = document.querySelector<HTMLElement>(alvo);
  if (!el) return;
  e.preventDefault();
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'start' });
}

export function BarraAcessibilidade() {
  const fonte = useEscalaFonte();
  return (
    <section className="barra-acessibilidade" aria-label="Barra de acessibilidade">
      <a className="skip-link" href="#conteudo" onClick={(e) => irPara(e, '#conteudo')}>
        Ir para o conteúdo
      </a>
      <div className="barra-acessibilidade__interno">
        <nav aria-label="Atalhos de acessibilidade">
          <ul className="lista-inline">
            {ATALHOS.map((a) => (
              <li key={a.alvo}>
                <a className="link-atalho" href={a.alvo} accessKey={a.tecla} onClick={(e) => irPara(e, a.alvo)}>
                  {a.rotulo} <span className="atalho-tecla">[{a.tecla}]</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grupo-botoes" role="group" aria-label="Tamanho do texto">
          <button type="button" className="botao botao--grupo" onClick={fonte.diminuir} disabled={!fonte.podeDiminuir}>
            <span aria-hidden="true">A-</span>
            <span className="somente-leitor">Diminuir texto</span>
          </button>
          <button type="button" className="botao botao--grupo" onClick={fonte.padrao} disabled={fonte.nivel === 0}>
            Padrão
          </button>
          <button type="button" className="botao botao--grupo" onClick={fonte.aumentar} disabled={!fonte.podeAumentar}>
            <span aria-hidden="true">A+</span>
            <span className="somente-leitor">Aumentar texto</span>
          </button>
        </div>
        <div className="somente-leitor" role="status" aria-live="polite" aria-atomic="true">
          {fonte.anuncio}
        </div>
      </div>
    </section>
  );
}
