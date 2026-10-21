import { useEscalaFonte } from '../hooks/useEscalaFonte';
import type { Aba } from '../hooks/useFiltrosUrl';

const ATALHOS: readonly { tecla: string; alvo: string; rotulo: string; aba?: Aba }[] = [
  { tecla: '1', alvo: '#conteudo', rotulo: 'Ir para o conteúdo' },
  { tecla: '2', alvo: '#filtros', rotulo: 'Ir para os filtros' },
  { tecla: '3', alvo: '#graficos', rotulo: 'Ir para os gráficos', aba: 'graficos' },
  { tecla: '4', alvo: '#tabela', rotulo: 'Ir para a tabela', aba: 'tabela' },
];

function focar(el: HTMLElement) {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'start' });
}

/** Move o foco para o alvo do atalho (âncoras internas não focam sozinhas em todos os navegadores). */
export function irPara(e: React.MouseEvent<HTMLAnchorElement>, alvo: string) {
  const el = document.querySelector<HTMLElement>(alvo);
  if (!el) return;
  e.preventDefault();
  focar(el);
}

interface BarraAcessibilidadeProps {
  /** Ativa a aba do painel antes de focar o alvo dos atalhos [3] e [4]. */
  onAtivarAba?: (aba: Aba) => void;
}

export function BarraAcessibilidade({ onAtivarAba }: BarraAcessibilidadeProps) {
  const fonte = useEscalaFonte();

  const aoClicar = (e: React.MouseEvent<HTMLAnchorElement>, atalho: (typeof ATALHOS)[number]) => {
    if (!atalho.aba || !onAtivarAba) {
      irPara(e, atalho.alvo);
      return;
    }
    e.preventDefault();
    onAtivarAba(atalho.aba);
    // O painel estava com hidden: foca no próximo frame, quando ele já está visível.
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(atalho.alvo);
      if (el) focar(el);
    });
  };

  return (
    <section className="barra-acessibilidade" aria-label="Barra de acessibilidade">
      <div className="barra-acessibilidade__interno">
        <nav aria-label="Atalhos de acessibilidade">
          <ul className="lista-inline">
            {ATALHOS.map((a) => (
              <li key={a.alvo}>
                <a className="link-atalho" href={a.alvo} accessKey={a.tecla} onClick={(e) => aoClicar(e, a)}>
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
