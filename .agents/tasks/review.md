# Revisão do frontend (dashboard + filtros) — Bolsa Família

Frontend em React 19 + Vite + TypeScript com Recharts. A revisão foi feita por leitura do plano, da nota `verificacao.md`, de arquivos-chave (`index.html`, `package.json`, `.env.example`, `FonteDados`, gráficos, CSS) e por inspeção direta das evidências PNG. Nenhuma suíte foi re-executada. A nota registra build ok, 96 testes ok no front e 33/33 na raiz.

Watch for: (1) parte das cenas planejadas não tem evidência registrada: zoom 200%, A+ três vezes, contagem de requisições no preview, cancelamento de requisições e `reducedMotion` (confirmed, não bloqueante). (2) Nada foi validado contra a API real nem com leitor de tela (confirmed, declarado). (3) A lista de municípios depende da API do IBGE no browser (likely, mitigado por cache e fallback).

**Verdict**: APPROVED

## High-level view

Regra de tamanho de screenshot: respeitada. Conferi o cabeçalho de todos os 32 PNGs em `screenshots/`. A maior dimensão é 1280 px, e nenhum é fullPage. Os arquivos cobrem as cenas descritas: desktop, tablet e mobile em claro e escuro, tema automático, estados (carregando, vazio, cache-desatualizado e erros por código), validação, combobox, filtros e teclado. Abri duas imagens (desktop escuro e mobile claro). Elas mostram três cards com variação em seta e texto, seletor de indicador, gráfico com marcadores e descrição textual, contraste adequado no escuro e layout de 375 px sem corte.

Tema: um script inline no `index.html` aplica `data-theme` e `color-scheme` antes do primeiro render. Os gráficos usam `var(--cor-grafico-*)`, então trocam de cor com o tema. O estado persiste em `bf:tema`, com modo automático por `matchMedia`.

Requisitos: RF02 (3 cards), RF03 (3 gráficos), RF04 (município e período), RNF03 (sem rolagem horizontal em 320, 375, 768 e 1280) e RNF04 (axe-core com 0 violações após correção, skip link, foco visível, tabela alternativa) estão atendidos com evidência. Existe aviso de mock e de cache-desatualizado em `FonteDados`. Dependências em versões exatas, `.env.example` só com `VITE_API_URL`, sem `innerHTML`, e `README` do front e seção "Frontend" no README da raiz presentes.

<details>
<summary>Issues (4)</summary>

1. **Cenas sem evidência registrada** — zoom 200%, A+ x3, contagem de requisições (1 por consulta) e cancelamento, e `reducedMotion` não aparecem em `verificacao.md` nem em PNG. Registrar ou executar num spot-check futuro (confirmed, não bloqueante).
2. **Mismatch do mock com o plano** — `verificacao.md` diz que o mock agora devolve dados para 1100015 (o plano previa 404). Alinhar a documentação do README do front sobre "só 6 municípios" se isso mudou (possible; verificar).
3. **Dependência do IBGE no browser** — a lista de municípios vem de serviço externo, com fallback para 6 municípios. Aceitável, mas a futura rota na API é preferível (likely, melhoria).
4. **Sem validação com dados reais e leitor de tela** — limitação declarada. Fazer teste manual antes de produção (confirmed).

</details>

<details>
<summary>Detalhes</summary>

A verificação visual foi feita de fato: o Playwright MCP falhou, então o coder usou playwright-core com Chromium headless, e os PNGs existem em disco com dimensões compatíveis com as cenas. Os PNGs fullPage antigos (> 2000 px) foram removidos, como declarado, e não restam arquivos acima do limite.

A discrepância sobre o mock (issue 2) não altera `src/` de forma relevante para o front. Não foi investigada além de ler as linhas do serviço, e o `app.js` da API tem data de modificação anterior ao front.

</details>
