/** Rodapé no padrão br-footer do gov.br DS, com fonte dos dados e aviso de projeto acadêmico. */
export function Rodape() {
  return (
    <footer className="rodape">
      <div className="container">
        <div className="rodape__marca">
          <span className="marca-govbr">gov.br</span>
          <span className="cabecalho__separador" aria-hidden="true" />
          <span className="rodape__assinatura">Projeto acadêmico</span>
        </div>
        <div className="rodape__grupos">
          <div className="rodape__grupo">
            <h2 className="rodape__titulo">Sobre</h2>
            <p>
              Projeto acadêmico sem vínculo com o Governo Federal. Esta página não usa rastreadores nem análise de uso.
            </p>
          </div>
          <div className="rodape__grupo">
            <h2 className="rodape__titulo">Dados</h2>
            <ul>
              <li>
                <a href="https://portaldatransparencia.gov.br" rel="noopener noreferrer">
                  Portal da Transparência (CGU)
                </a>
              </li>
              <li>
                <a href="https://servicodados.ibge.gov.br/api/docs/localidades" rel="noopener noreferrer">
                  API de localidades do IBGE
                </a>
              </li>
            </ul>
          </div>
          <div className="rodape__grupo">
            <h2 className="rodape__titulo">Acessibilidade</h2>
            <ul>
              <li>
                <a href="#acessibilidade">Recursos de acessibilidade desta página</a>
              </li>
            </ul>
          </div>
        </div>
        <p className="rodape__creditos">
          Interface baseada no Padrão Digital de Governo (gov.br Design System, licença MIT). Fonte Rawline carregada do
          CDN do Design System.
        </p>
      </div>
    </footer>
  );
}
