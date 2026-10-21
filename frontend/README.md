# Frontend – Painel Bolsa Família

Dashboard em React que consome a API Node deste repositório (`GET /api/v1/repasses`). Mostra valor total, famílias beneficiadas e valor médio por mês/ano (RF02), gráficos de evolução com comparativo mês a mês e ano a ano (RF03) e filtros por período e município (RF04). Responsivo (RNF03), com diretrizes eMAG/WCAG 2.1 AA (RNF04) e modo escuro.

## Stack
- React 19, Vite 8, TypeScript 5.9, Vitest 5.
- Recharts 3: gráficos em SVG, que herdam variáveis CSS (a troca de tema não recria nada), ficam nítidos em zoom 200% e aceitam padrões de preenchimento para quem não distingue cores.

## Pré-requisitos
Node 22.12 ou superior.

## Configuração
Copie `.env.example` para `.env` (opcional). Única variável:

```
VITE_API_URL=http://localhost:3333
```

Nenhum segredo vai no front.

## Como rodar
1. Na raiz do projeto, suba a API em modo mock (dados fictícios, sem chave):
   ```
   USE_MOCK=true npm start
   ```
   (porta 3333)
2. Em outro terminal:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Abra http://localhost:5173.

Build de produção: `npm run build`, depois `npm run preview` (http://localhost:4173). Testes: `npm test`.

## Estrutura
```
src/
  components/  cards, gráficos, filtros, tabela, barra de acessibilidade, tema
  hooks/       dados, filtros na URL, tema, escala de fonte, municípios
  services/    cliente da API, config, lista de municípios (IBGE)
  utils/       funções puras (períodos, séries, variação, formatação) + testes
  styles/      tokens (temas), base, layout, componentes
```

## Município e filtros
O painel abre sem município selecionado e não consulta a API até você escolher um: a área de gráficos mostra um aviso pedindo o município e o período. Depois de escolher e selecionar Aplicar, os filtros vão para a URL, então o link é compartilhável:

```
?ibge=3550308&de=202509&ate=202608&ind=valor
```

`?codigoIbge=3550308` também é aceito (alias de `ibge`). Código inválido no link mostra um aviso e deixa o município em branco. "Limpar filtros" volta ao estado inicial e remove a query da URL.

## Abas do painel
Abaixo dos filtros, o painel tem três abas no padrão WAI-ARIA Tabs:

- **Visão geral**: resumo do período, cartões dos indicadores e ranking dos meses.
- **Gráficos**: seletor de indicador e os gráficos de evolução, mês a mês e ano a ano.
- **Tabela**: tabela de dados do período.

A aba ativa entra na URL em `?aba=visao|graficos|tabela`, junto com os filtros. Com isso o link abre direto na aba, e Voltar/Avançar do navegador restaura a aba anterior. Exemplo de link que abre na Tabela:

```
?ibge=3550308&de=202401&ate=202412&ind=valor&aba=tabela
```

Sem `aba` (como nos links antigos), o painel abre na Visão geral, e a URL só grava a aba quando ela não é a Visão geral. Aba inválida (`?aba=xyz`) mostra um aviso e abre a Visão geral. Sem município, a troca de aba não muda a URL. "Aplicar" mantém a aba aberta e "Limpar filtros" volta para a Visão geral.

Pelo teclado, Tab chega na aba ativa, e ←/→ (com volta) e Home/End trocam de aba. Os atalhos [3] e [4] abrem as abas Gráficos e Tabela e levam o foco até elas. O Recharts só é baixado quando a aba Gráficos é aberta com dados.

## Visão geral
- **Resumo do período**: município, carimbo "Dados atualizados em … (horário de Brasília)" (de `meta.atualizadoEm`), pílula de origem dos dados ("Dados fictícios", "Cache", "Cache desatualizado" ou "Portal da Transparência") e o botão **Atualizar dados**, que refaz a mesma consulta à API. Logo abaixo ficam o código IBGE, o período, os meses no período e o valor total repassado. Há também duas barras: **Meses com dados** ("X de N meses (YY,YY%)") e **Distribuição do valor por ano**, uma barra empilhada com legenda (ano, valor e %), cor e padrão por ano.
- **Cartões dos indicadores**: número em destaque e variação em pílula com seta e texto.
- **Ranking dos meses**: meses ordenados do maior para o menor pelo indicador escolhido (`ind`), com valor, "% do maior mês" (e "% do total do período" para valor repassado) e uma barra horizontal. Mostra 5 meses, e o botão "Mostrar todos os N meses" abre o resto. Empate segue a ordem cronológica.

Toda barra tem o percentual também em texto, e nenhuma informação depende só da cor. O indicador (`ind`) é escolhido na aba Gráficos, num controle segmentado (Valor repassado | Famílias beneficiadas | Valor médio) feito sobre radios nativos, e vale também para o ranking e a tabela.

## Inspiração de layout
A organização em painéis (resumo à esquerda, barra de abrangência, abas, barras de progresso e lista ranqueada) se inspira no [painel de resultados do TSE](https://resultados.tse.jus.br/). Vêm de lá só os padrões de layout e visualização: não usamos logotipo, marca, cores institucionais nem textos do TSE. A identidade visual continua a do gov.br.

## Padrão visual gov.br
- Visual do [gov.br Design System](https://www.gov.br/ds/) reimplementado em CSS próprio, com os tokens de cor, tipografia e espaçamento do `@govbr-ds/core` 3.7.0 (licença MIT). Nenhuma dependência nova.
- Fonte Rawline carregada do CDN do Design System; sem rede, cai para Raleway/sans-serif sem quebrar o layout.
- Barra de atalhos no topo, cabeçalho, trilha de navegação, mensagens, cards, tabelas e rodapé no estilo do DS.
- É um projeto acadêmico: o cabeçalho tem a marca textual "gov.br" com a assinatura "Projeto acadêmico" e uma faixa avisando que não é serviço oficial. Não usa o logo oficial do gov.br nem o brasão.

## Tema
Botões Claro, Escuro, Alto contraste e Automático (segue `prefers-color-scheme`) no cabeçalho. A escolha fica em `localStorage` (`bf:tema`) e é aplicada por um script inline antes do primeiro render, sem flash. Os gráficos usam as mesmas variáveis de cor.

## Acessibilidade
- `lang="pt-BR"`, landmarks, um `h1` e barra de acessibilidade (o primeiro item, "Ir para o conteúdo [1]", faz o papel de skip link) com atalhos (`accesskey` 1 a 4) e A-/A+ persistidos.
- Foco visível, navegação completa por teclado, combobox de município (WAI-ARIA), `aria-live` para atualizações e `role="alert"` para erros.
- Cor nunca é o único canal (setas com texto, padrões e marcadores nos gráficos). Cada gráfico tem descrição textual e tabela alternativa.
- `prefers-reduced-motion` respeitado; alvos de toque de 44 px ou mais.

Como testar:
- Teclado: Tab desde o topo (o primeiro foco é o atalho "Ir para o conteúdo [1]"); setas e Enter no município.
- Leitor de tela: NVDA, VoiceOver ou Orca.
- Zoom: Ctrl + "+" até 200% e botão A+; não deve haver rolagem horizontal da página.

## Limitações
- Verificado apenas com dados mock. Dados reais do Portal da Transparência não foram validados (sem chave).
- Leitor de tela real e revisão especializada de acessibilidade não foram feitos; só testes automáticos (axe-core) e manuais por teclado.
- No mock, só alguns municípios têm dados.
- A lista de municípios vem da API pública do IBGE (com cache local e lista mínima de reserva).
- Séries com cache frio na API real podem demorar.
- O comparativo ano a ano usa uma janela estendida de 12 meses na mesma consulta (máximo de 36 meses).

## Melhorias futuras
- **Mapa por UF**: um mapa coroplético do Brasil (ou de uma UF) com os repasses por município. Hoje a API responde a um município por vez, então o mapa precisaria de uma rota agregada no backend (por exemplo `/api/v1/repasses/uf/:uf?mesAno=AAAAMM`) e da malha geográfica do IBGE (API de malhas). Sem isso, seriam milhares de requisições a partir do navegador.
