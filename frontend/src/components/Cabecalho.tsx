import type { PreferenciaTema } from '../hooks/useTema';
import { irPara } from './BarraAcessibilidade';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  preferencia: PreferenciaTema;
  onChange: (p: PreferenciaTema) => void;
}

/**
 * Cabeçalho no padrão br-header do gov.br DS. A marca é só texto: o painel é um projeto
 * acadêmico e não usa o logotipo oficial nem o brasão.
 */
export function Cabecalho({ preferencia, onChange }: Props) {
  return (
    <header className="cabecalho">
      <div className="container cabecalho__interno">
        <div className="cabecalho__linha">
          <div className="cabecalho__marca">
            <span className="cabecalho__assinatura">Projeto acadêmico</span>
          </div>
          <div className="cabecalho__acoes">
            <nav aria-label="Links do cabeçalho">
              <ul className="lista-inline cabecalho__links">
                <li>
                  <a href="#acessibilidade" onClick={(e) => irPara(e, '#acessibilidade')}>
                    Acessibilidade
                  </a>
                </li>
                <li>
                  <a href="https://portaldatransparencia.gov.br" rel="noopener noreferrer">
                    Portal da Transparência
                  </a>
                </li>
              </ul>
            </nav>
            <ThemeToggle preferencia={preferencia} onChange={onChange} />
          </div>
        </div>
        <div className="cabecalho__sistema">
          <p className="cabecalho__titulo">Painel Bolsa Família</p>
          <p className="cabecalho__subtitulo">Repasses por município, com dados do Portal da Transparência</p>
        </div>
      </div>
      <div className="cabecalho__faixa">
        <p className="container cabecalho__aviso" role="note">
          Projeto acadêmico: este painel não é um serviço oficial do Governo Federal nem do gov.br.
        </p>
      </div>
    </header>
  );
}
