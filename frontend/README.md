# Frontend – Bolsa Família em números

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

Os filtros ficam na URL (`?ibge=4214805&de=202509&ate=202608&ind=valor`), então o link é compartilhável.

## Tema escuro
Botões Claro, Escuro e Automático (segue `prefers-color-scheme`). A escolha fica em `localStorage` (`bf:tema`) e é aplicada por um script inline antes do primeiro render, sem flash. Os gráficos usam as mesmas variáveis de cor.

## Acessibilidade
- `lang="pt-BR"`, landmarks, um `h1`, skip link e barra de acessibilidade com atalhos (`accesskey` 1 a 4) e A-/A+ persistidos.
- Foco visível, navegação completa por teclado, combobox de município (WAI-ARIA), `aria-live` para atualizações e `role="alert"` para erros.
- Cor nunca é o único canal (setas com texto, padrões e marcadores nos gráficos). Cada gráfico tem descrição textual e tabela alternativa.
- `prefers-reduced-motion` respeitado; alvos de toque de 44 px ou mais.

Como testar:
- Teclado: Tab desde o topo (o skip link aparece primeiro); setas e Enter no município.
- Leitor de tela: NVDA, VoiceOver ou Orca.
- Zoom: Ctrl + "+" até 200% e botão A+; não deve haver rolagem horizontal da página.

## Limitações
- Verificado apenas com dados mock. Dados reais do Portal da Transparência não foram validados (sem chave).
- Leitor de tela real e revisão especializada de acessibilidade não foram feitos; só testes automáticos (axe-core) e manuais por teclado.
- No mock, só alguns municípios têm dados.
- A lista de municípios vem da API pública do IBGE (com cache local e lista mínima de reserva).
- Séries com cache frio na API real podem demorar.
- O comparativo ano a ano usa uma janela estendida de 12 meses na mesma consulta (máximo de 36 meses).
- Sem exportação (CSV/JSON/PDF): fora do escopo.
