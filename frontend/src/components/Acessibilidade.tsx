/** Seção visível com orientações de acessibilidade (atalhos, teclado, tamanho do texto, tema e contato). */
export function Acessibilidade() {
  return (
    <section id="acessibilidade" className="acessibilidade" aria-labelledby="titulo-acessibilidade" tabIndex={-1}>
      <h2 id="titulo-acessibilidade">Acessibilidade</h2>
      <p>
        Esta página segue as diretrizes do eMAG e do WCAG 2.1 nível AA. Veja abaixo como navegar e ajustar a leitura.
      </p>
      <div className="acessibilidade__grade">
        <div>
          <h3>Atalhos de teclado</h3>
          <p>
            Os atalhos usam o <code>accesskey</code> do navegador. No Chrome e no Edge (Windows e Linux), use{' '}
            <kbd>Alt</kbd> + tecla. No Firefox, use <kbd>Alt</kbd> + <kbd>Shift</kbd> + tecla. No Safari (macOS), use{' '}
            <kbd>Control</kbd> + <kbd>Option</kbd> + tecla.
          </p>
          <ul>
            <li>
              <kbd>1</kbd> Conteúdo principal
            </li>
            <li>
              <kbd>2</kbd> Filtros
            </li>
            <li>
              <kbd>3</kbd> Abre a aba Gráficos
            </li>
            <li>
              <kbd>4</kbd> Abre a aba Tabela
            </li>
          </ul>
        </div>
        <div>
          <h3>Navegação pelo teclado</h3>
          <ul>
            <li>
              <kbd>Tab</kbd> e <kbd>Shift</kbd> + <kbd>Tab</kbd> percorrem os controles. O primeiro <kbd>Tab</kbd>{' '}
              leva ao atalho &quot;Ir para o conteúdo [1]&quot;, no topo da página.
            </li>
            <li>
              Nas abas Visão geral, Gráficos e Tabela, use <kbd>←</kbd> e <kbd>→</kbd> (ou <kbd>Home</kbd> e{' '}
              <kbd>End</kbd>) para trocar de aba.
            </li>
            <li>
              No campo de município, digite ao menos 2 letras (ou o código de 7 dígitos), use <kbd>↑</kbd> e{' '}
              <kbd>↓</kbd> para escolher e <kbd>Enter</kbd> para confirmar. <kbd>Esc</kbd> fecha a lista.
            </li>
            <li>
              Os blocos &quot;Ver tabela de dados&quot; abrem com <kbd>Enter</kbd> ou <kbd>Espaço</kbd>.
            </li>
          </ul>
        </div>
        <div>
          <h3>Texto e cores</h3>
          <ul>
            <li>
              Os atalhos e os botões A-, Padrão e A+ ficam na barra do topo da página. A- e A+ mudam o tamanho do
              texto, e a escolha fica salva.
            </li>
            <li>
              O tema Claro, Escuro, Alto contraste ou Automático (segue o sistema) fica no cabeçalho. A escolha fica
              salva.
            </li>
            <li>
              As cores dos gráficos seguem a paleta do gov.br e vêm sempre acompanhadas de padrões, marcadores e
              textos. Cada gráfico tem descrição em texto e tabela com os mesmos dados.
            </li>
          </ul>
        </div>
        <div>
          <h3>Encontrou uma barreira?</h3>
          <p>
            Se algo não funcionar com o seu leitor de tela, teclado ou dispositivo, registre uma issue no repositório do
            projeto descrevendo a página, o navegador e a tecnologia assistiva usada.
          </p>
        </div>
      </div>
    </section>
  );
}
