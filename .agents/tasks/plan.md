# Implementation Plan — Frontend (Dashboard + Filtros) do Bolsa Família

Raiz do projeto: `/home/leonardo/myprojects/api-bolsa-familia`. Front novo em `/home/leonardo/myprojects/api-bolsa-familia/frontend` (projeto independente). Sem worktree, **sem commits git**. Não ler/exibir `.env` da raiz. Interface em pt-BR. Substitui o plano anterior da API (já concluído e aprovado).
Artefatos FEAT: `/home/leonardo/myprojects/api-bolsa-familia/.agents/tasks/task-frontend-dashboard/` (`task.json`, `context.json`, `features/FEAT-00{1,2,3}.json`).

## 1. Contrato real da API (confirmado em `src/routes/*.js`, `src/app.js`, `src/services/*.js`, `src/domain/*.js`)

- Base `http://localhost:3333`; Swagger em `/docs`; CORS `origin: true` com `CORS_ORIGIN=*` (padrão). Sem autenticação nas rotas de consulta.
- **Não existe rota de municípios** (rotas: `GET /api/v1/repasses`, `GET /api/v1/saude`, `DELETE /api/v1/cache` só com ADMIN_TOKEN, `GET /` → 302 `/docs`). A API **não será alterada**.
- `GET /api/v1/repasses?codigoIbge=&mesAno=AAAAMM` (um mês) **ou** `?codigoIbge=&de=AAAAMM&ate=AAAAMM` (série; `de<=ate`, máx. 36 meses; mês futuro = 400; ano < 2000 = 400). `mesAno` + `de/ate` juntos = 400.
- Sucesso 200: `{ consulta: { codigoIbge, de, ate, meses }, dados: Registro[], meta: { origem, atualizadoEm } }`. `origem` ∈ `api | cache | cache-desatualizado | mock`. Na série, `meta.origem` = pior origem entre os meses e `atualizadoEm` = o **mais antigo**. Mês sem dados **não gera item** (sem placeholder): a série pode ter buracos; `dados: []` com 200 = sem dados.
- `Registro`: `{ codigoIbge: string, municipio: string (MAIÚSCULAS, ex. "RIO DO SUL"), uf, mesAno: "AAAAMM", programa: BOLSA_FAMILIA|AUXILIO_BRASIL|NOVO_BOLSA_FAMILIA, tipo: {id, descricao}, valor: number (sem arredondar), quantidadeBeneficiados: int, valorMedio: number|null (null se quantidade 0), origemId, coletadoEm }`. Pode haver **mais de um registro por mês** (um por `tipo.id`) e o programa muda ao longo do tempo.
- Erro: `{ erro: { codigo, mensagem, tentarNovamenteEm? } }`. Códigos/HTTP: `CODIGO_IBGE_INVALIDO` 400, `MES_ANO_INVALIDO` 400, `MUNICIPIO_NAO_ENCONTRADO` 404, `RESPOSTA_INVALIDA` 502, `CHAVE_API_AUSENTE_OU_INVALIDA` 502, `API_INDISPONIVEL` 503/502 (com `tentarNovamenteEm`), `RATE_LIMIT_EXTERNO` 503 (com `tentarNovamenteEm`), `NAO_AUTORIZADO` 401, `REQUISICAO_INVALIDA`, `ROTA_NAO_ENCONTRADA` 404, `ERRO_INTERNO` 500. Validação do código IBGE: 7 dígitos, UF válida (11–17,21–29,31–33,35,41–43,50–53), DV com pesos 1,2,1,2,1,2 (soma com `p>9 ? p-9 : p`, `DV=(10 - soma%10)%10`).
- **Modo mock** (`USE_MOCK=true`): dados fictícios determinísticos, `meta.origem='mock'`, 1 registro/mês, meses futuros vazios, **só aceita 6 municípios** (4214805 Rio do Sul/SC, 3550308 São Paulo, 3304557 Rio de Janeiro, 5300108 Brasília, 4106902 Curitiba, 2927408 Salvador); os demais → 404 `MUNICIPIO_NAO_ENCONTRADO` (ex.: `1100015` é válido e dá 404). Série real pode ser lenta (meses em sequência, cache frio, fila de 60 req/min) → timeout do front generoso.
- Comando exato para subir a API **em mock, sem usar a chave do `.env`** (variável de ambiente tem precedência sobre `--env-file`): na raiz, `USE_MOCK=true PORT=3333 npm start` (README: `npm start` = `node --disable-warning=ExperimentalWarning --env-file-if-exists=.env src/server.js`). Atenção: o README manda `cp .env.example .env`, mas `.env.example` **não existe** na raiz; no README do front usar `USE_MOCK=true npm start`.
- Hoje (relógio da máquina) = 2026-10-08. Portas: 3333 e 5173 livres; 8080 ocupada por processo alheio (não mexer).

## 2. Decisões (com justificativa)

| Decisão | Escolha | Por quê |
| :-- | :-- | :-- |
| Stack | **React 19 + Vite 8 + TypeScript 5.9**, npm | Pedido. TS 5.9.3 (estável); o `latest` 7.x é o port nativo, risco desnecessário com Vite/Vitest. |
| Gráficos | **Recharts 3.10.1** (SVG) | SVG herda CSS (`var(--cor)`) → troca de tema sem recriar canvas; escala nítida em zoom 200%; padrões (`<pattern>`) para daltonismo são simples; componentes React declarativos; Recharts 3 tem `accessibilityLayer`. Chart.js é canvas: cores via JS, padrões mais trabalhosos, acessibilidade só por fallback. Custo: bundle maior (aceito; usar import por componente e `lazy` nos gráficos). Peer `react-is` fixado em 19.3.0. |
| Tipos de gráfico (RF03) | (1) Evolução mensal: **área+linha com marcadores**; (2) Mês a mês: **barras divergentes de variação %** (positivo/negativo com padrões distintos + rótulo de sinal); (3) Ano a ano: **barras agrupadas** (mês do período × mesmo mês do ano anterior) | 3 tipos distintos, cada um com título, legenda, eixos, tooltip, descrição textual e tabela alternativa. |
| Indicador dos gráficos | Um seletor (grupo de radios) **valor repassado / famílias / valor médio** controla os 3 gráficos | Evita 9 gráficos; foco no cidadão. |
| Ano a ano com período padrão de 12 meses | Uma **única** chamada de série com janela **estendida 12 meses para trás** (`de-12 … ate`, limitada a 36 meses no total); cards/evolução/mês a mês/tabela usam só o período escolhido; o ano a ano usa a janela estendida | Atende "UMA chamada de série por consulta" e torna o comparativo anual útil já no padrão. Meses sem par anterior mostram "sem dados do ano anterior" (nunca interpolar). |
| Cards (RF02) | 3 cards (valor total, famílias, valor médio) do **mês de referência** = último mês com dados do período; `<select>` "Mês de referência" dentro do período; variação vs mês anterior (valor absoluto e %, com seta ▲▼= **e texto**, além da cor); primeiro mês do período: "sem mês anterior no período" | Sem 2ª chamada. Famílias não são somáveis entre meses, então não há "total do período" para famílias. |
| Agregação por mês | Soma `valor` e `quantidadeBeneficiados` dos registros do mês; `valorMedio` = valor/qtd (null se qtd 0); com 1 registro usa o `valorMedio` da API. **Sem arredondar** dados; arredondar só na exibição (Intl). | Fiel ao backend; sem inventar. |
| Lista de municípios | API não tem rota → **API pública do IBGE** `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome` direto do browser (CORS `*` confirmado), cache em `localStorage` (`bf:municipios:v1`, TTL 30 dias, só `[codigo,nome,uf]`), timeout 20 s, falha → usa cache vencido → senão lista embutida de 6 municípios; sempre aceita digitar 7 dígitos (validados com DV) + atalho "Rio do Sul/SC (4214805)". Mapeamento tolerante (`microrregiao.mesorregiao.UF.sigla` ou `regiao-imediata.regiao-intermediaria.UF.sigla`), igual a `src/services/municipiosService.js`. | Evita alterar a API. No mock, municípios fora dos 6 retornam 404 → mensagem amigável (limitação documentada). |
| Seleção de período | Dois grupos de `<select>` mês + ano (início, fim), não `<input type="month">` | Suporte uniforme (Safari desktop), alvos de toque ≥44px, rótulos claros. Ano mín. 2004 (constante), sem meses futuros. |
| Estilo | CSS próprio global com variáveis (`src/styles/tokens.css`, `base.css`, `layout.css`, `components.css`), sem framework de UI | Leve e testável (contraste verificado por teste lendo `tokens.css`). |
| Tema | Claro/Escuro/Automático (3 botões `aria-pressed`), `localStorage` `bf:tema`, script inline no `index.html` aplica `data-theme` e `color-scheme` antes do 1º render; `matchMedia` no modo automático | Sem flash; gráficos usam `var(--...)`. |
| Paleta | Okabe-Ito (azul `#0072B2`, laranja `#E69F00`, verde-azulado `#009E73`, vermelhão `#D55E00`, azul-céu `#56B4E9`); variantes mais claras no escuro; **sempre + padrões/marcadores/tracejado** | Segura para daltonismo; cor nunca é o único canal. |
| Filtros na URL | `?ibge=4214805&de=202509&ate=202608&ind=valor`; ler na carga (inválido → padrão + aviso), `pushState` ao Aplicar, `popstate` restaura | Link compartilhável. Padrão: Rio do Sul 4214805; fim = mês atual − 2; início = fim − 11. |
| Requisições | `AbortController` cancela a anterior ao mudar filtros; `AbortSignal.timeout(90000)` combinado; 1 chamada de série/consulta; sem retry automático (botão "Tentar novamente") | Respeita rate limit da API. Em dev o StrictMode duplica efeitos (a 1ª é abortada); a contagem de chamadas é verificada no build (`vite preview`). |
| Testes | **Vitest 5.0.3**, ambiente node, só funções puras e o teste de contraste; `npm test` = `vitest run` | Enxuto, rápido, sem rede. |
| Dependências (exatas, `npm install --save-exact`) | prod: react 19.3.0, react-dom 19.3.0, recharts 3.10.1, react-is 19.3.0. dev: vite 8.3.4, @vitejs/plugin-react 6.1.2, typescript 5.9.3, vitest 5.0.3, @types/react 19.3.0, @types/react-dom 19.3.0, @types/node 22.20.5 | Versões lidas com `npm view`. Se alguma falhar ao instalar, usar a última estável compatível, manter exata e registrar em `findings`. Verificar `grep -E '"[\^~]' package.json` vazio. |
| LGPD | Só dados agregados públicos; sem analytics/cookies/terceiros além do IBGE; **proibido** `dangerouslySetInnerHTML`/`innerHTML` | RNF05/escopo. |

## 3. Estrutura de arquivos (`/home/leonardo/myprojects/api-bolsa-familia/frontend`)

```
package.json  package-lock.json  tsconfig.json  vite.config.ts  index.html  .env.example  .gitignore  README.md  public/favicon.svg
src/main.tsx  src/App.tsx  src/vite-env.d.ts
src/types/api.ts                      # Registro, RespostaSerie, ErroApiCorpo, Origem, Metrica
src/services/config.ts                # API_URL (VITE_API_URL ?? http://localhost:3333, sem barra final)
src/services/api.ts                   # buscarSerie({codigoIbge,de,ate,signal}); classe ApiError {codigo,mensagem,tentarNovamenteEm,http}
src/services/municipios.ts            # IBGE + localStorage + fallback
src/hooks/useRepasses.ts  useMunicipios.ts  useFiltrosUrl.ts  useTema.ts  useEscalaFonte.ts
src/utils/formatadores.ts  periodo.ts  ibge.ts  series.ts  variacao.ts  erros.ts  busca.ts  textoGrafico.ts
src/components/Filtros.tsx  MunicipioCombobox.tsx  PeriodoFiltro.tsx  CardsIndicadores.tsx  SeletorIndicador.tsx
               GraficoEvolucao.tsx  GraficoMesAMes.tsx  GraficoAnoAAno.tsx  GraficoMoldura.tsx  TabelaDados.tsx
               ThemeToggle.tsx  BarraAcessibilidade.tsx  Estados.tsx  FonteDados.tsx  Acessibilidade.tsx
src/styles/tokens.css  base.css  layout.css  components.css
src/utils/*.test.ts  src/styles/contraste.test.ts
```
`GraficoMoldura` = wrapper comum (figure + figcaption/título, descrição textual `aria-describedby`, `<details>` com tabela alternativa, legenda). Gráficos carregados com `React.lazy` + `Suspense`.

## 4. Decomposição (3 FEATs sequenciais; cada um deixa `npm run build` e `npm test` verdes)

**FEAT-001 — Base, camada de dados, utilitários puros, estados, tema e shell acessível.**
1. Scaffold manual (sem `npm create`): `package.json` (scripts: `dev`=`vite --port 5173 --strictPort`, `build`=`tsc --noEmit && vite build`, `preview`=`vite preview --port 4173 --strictPort`, `test`=`vitest run`, `typecheck`), `tsconfig.json` (strict, `jsx: react-jsx`, `noUncheckedIndexedAccess`), `vite.config.ts` (plugin react + `test: { environment: 'node' }`), `index.html` (`lang="pt-BR"`, viewport, `<title>`, script inline do tema), `.env.example` (`VITE_API_URL=http://localhost:3333`), `.gitignore` (`node_modules`, `dist`, `.env`, `.env.local`), `favicon.svg`. `npm install --save-exact` das dependências da seção 2.
2. `types/api.ts`, `services/config.ts`, `services/api.ts` (fetch + mapeamento de erros: JSON `erro` → `ApiError`; rede → `FALHA_REDE`; timeout → `TIMEOUT`; JSON inesperado no 200 → `RESPOSTA_INVALIDA`; AbortError repassado), `services/municipios.ts`.
3. Utilitários puros: `utils/ibge.ts` (`validarCodigoIbge` espelhando `src/domain/codigoIbge.js`), `periodo.ts` (`somarMeses`, `intervaloMeses`, `contarMeses`, `periodoPadrao(hoje)`, `validarPeriodo({de,ate}, hoje)` → erros por campo, `janelaConsulta(de,ate)`), `formatadores.ts` (BRL, inteiro, compacto, `jan/2026`, mês por extenso, %, data/hora America/Sao_Paulo, `null → '—'`), `series.ts` (`agregarPorMes`, `montarSerie` preenchendo meses ausentes com `null`, `compararAnoAAno`), `variacao.ts` (`calcularVariacao`, `variacaoMesAMes`), `erros.ts` (código → título/mensagem/ação pt-BR), `busca.ts` (normaliza acentos, filtra municípios por nome/UF/código, máx. 50), `textoGrafico.ts` (descrição textual: maior, menor, primeiro→último, variação).
4. Hooks: `useRepasses` (estados `loading|success|empty|error`, AbortController, `retry()`), `useMunicipios`, `useFiltrosUrl`, `useTema`, `useEscalaFonte`.
5. Componentes base: `Estados.tsx` (Carregando `role="status" aria-busy`, Erro `role="alert"` + "Tentar novamente" + `tentarNovamenteEm`, Vazio "Sem dados para o período", Aviso de origem), `ThemeToggle`, `BarraAcessibilidade` (skip link "Ir para o conteúdo", links com `accesskey` 1 conteúdo/2 filtros/3 gráficos/4 tabela, A−/A+/Padrão com `aria-live`), `App.tsx` com landmarks (`header`, `nav`, `main`, `footer`), um `h1`, regiões `aria-live="polite"`. `styles/*.css` com tokens dos dois temas, foco visível, `prefers-reduced-motion`, alvos ≥44px, mobile-first (breakpoints 480/768/1024/1280).
6. Testes Vitest enxutos (plano na seção 6) + `styles/contraste.test.ts`.
Verificação: `cd frontend && npm test && npm run build`.

**FEAT-002 — Filtros (período+município+URL), cards, 3 gráficos, tabela, fonte dos dados.** Depende de FEAT-001.
`PeriodoFiltro` (selects mês/ano, validação inicio<=fim, ≤36 meses, sem futuro; erros ligados com `aria-describedby`/`aria-invalid` e `role="alert"`), `MunicipioCombobox` (WAI-ARIA 1.2: `role=combobox`, `aria-expanded/controls/autocomplete=list/activedescendant`, listbox/option, ↑↓ Home End Enter Esc, mín. 2 caracteres, aceita nome e/ou 7 dígitos, região `aria-live` "N resultados", atalho Rio do Sul/SC, aviso quando a lista do IBGE caiu para cache/fallback), `Filtros` (form com Aplicar e "Restaurar padrão", sincroniza a URL), `SeletorIndicador`, `CardsIndicadores`, `GraficoMoldura` + `GraficoEvolucao` + `GraficoMesAMes` + `GraficoAnoAAno` (padrões SVG, marcadores distintos, eixos rotulados, tooltip, legenda, tabela alternativa em `<details>`, descrição textual), `TabelaDados` (resumo mês a mês: mês, programa, valor, famílias, valor médio, Δ% mês a mês, Δ% ano a ano; `<caption>`, `<th scope>`), `FonteDados` ("Fonte: Portal da Transparência (CGU) — dados públicos", `atualizadoEm`, origem, aviso `mock` = "dados fictícios de demonstração", aviso `cache-desatualizado`). `App.tsx` compõe tudo.
Verificação: `npm test && npm run build`; com a API em mock, `npm run dev` abre e exibe dados (smoke via `curl -s localhost:5173` e `curl` da API).

**FEAT-003 — Acessibilidade/responsivo finos, README, verificação visual Playwright.** Depende de FEAT-002.
Ajustes de CSS/ARIA encontrados na verificação, seção "Acessibilidade" na página (atalhos, como navegar, contato), `frontend/README.md`, seção curta "Frontend" no `README.md` da raiz (mudança mínima), verificação visual (seção 5) com relatório `.agents/tasks/verificacao-frontend.md` e capturas em `.agents/tasks/screenshots/`.

Depois dos FEATs: loop de convergência (fixer+revisor, máx. 3 iterações, parada = `.agents/tasks/review.json` com `verdict: "APPROVED"`; foi resetado para `PENDING`) e finalização (parar processos iniciados, rodar `npm test` da raiz, conferir que `src/` e `test/` da API não mudaram).

## 5. Plano de verificação visual (Playwright; tools `playwright::*` do MCP, ou `npx playwright` se disponível)

Preparação: (a) API mock na raiz: `USE_MOCK=true PORT=3333 npm start` em background (anotar o PID; só encerrar o que foi iniciado aqui); (b) front: `npm run build && npm run preview` (4173) para a contagem de requisições e `npm run dev` (5173) para o resto; (c) **stub de API temporário** em `os.tmpdir()` (porta 3334, removido ao final) que devolve `API_INDISPONIVEL` com `tentarNovamenteEm`, `RATE_LIMIT_EXTERNO`, `CHAVE_API_AUSENTE_OU_INVALIDA`, `RESPOSTA_INVALIDA`, `dados: []`, `origem: 'cache-desatualizado'` e respostas com atraso; subir uma 2ª instância do Vite em 5174 com `VITE_API_URL=http://localhost:3334` para essas cenas. Capturas em `/home/leonardo/myprojects/api-bolsa-familia/.agents/tasks/screenshots/`.

Cenas obrigatórias (screenshot + checagem; registrar resultado em `verificacao-frontend.md`):
1. Desktop 1280×800 claro: cards, 3 gráficos, tabela, fonte "Rio do Sul/SC", aviso mock.
2. Desktop 1280×800 escuro (gráficos mudam de cor; recarregar mantém o tema; sem flash).
3. Tablet 768×1024 claro e escuro.
4. Smartphone 375×812 claro e escuro, página inteira; e 320×640: `document.documentElement.scrollWidth <= clientWidth` (sem rolagem horizontal).
5. Zoom 200% (viewport 640×400 CSS px) e A+ três vezes em 375: sem perda de conteúdo/rolagem horizontal.
6. Filtros: trocar município (combobox por teclado: digitar "curit", ↓, Enter) e período (24 meses); Aplicar → URL atualizada, recarregar mantém, botão Voltar restaura; Restaurar padrão.
7. Combobox aberto (screenshot) e digitação de código `3550308`; código inválido `1234567` → erro no campo.
8. Validação: início > fim e >36 meses → mensagem associada ao campo (`aria-invalid`, `aria-describedby`), nenhuma requisição disparada.
9. Estados: carregando (stub com atraso: `aria-busy`, `role=status`), erro `API_INDISPONIVEL` com tentarNovamenteEm + "Tentar novamente" (`role=alert`), `RATE_LIMIT_EXTERNO`, falha de rede (stub desligado), `MUNICIPIO_NAO_ENCONTRADO` (real: ibge `1100015` no mock), vazio "Sem dados para o período", `cache-desatualizado`.
10. Teclado: Tab inicial mostra o skip link; ordem de foco lógica; foco sempre visível; operar tema, A+/A−, filtros, indicador, `<details>` das tabelas só com teclado.
11. Rede: no build (`preview`), uma consulta = exatamente 1 request `/api/v1/repasses?...de=&ate=`; mudar filtros rapidamente cancela a anterior (status `canceled`/sem erro na UI).
12. Console sem erros/warnings (`playwright_console_logs`) nas cenas 1–9; `emulateMedia({reducedMotion:'reduce'})` sem animações.
Falhas encontradas são corrigidas e a cena repetida.

## 6. Plano de testes unitários (Vitest, sem rede, rápidos)

- `utils/variacao.test.ts`: aumento, queda, estável, anterior 0/null → indisponível, % sem arredondar internamente; `variacaoMesAMes` com buraco na série (par com `null` → `null`).
- `utils/series.test.ts`: `agregarPorMes` (2 tipos no mesmo mês somam; `valorMedio` recalculado; qtd 0 → null; 1 registro mantém o da API), `montarSerie` preenche meses ausentes, `compararAnoAAno` (pares mês/mês−12, ausência do par → null, janela estendida).
- `utils/formatadores.test.ts` (normalizando `\u00a0`): BRL, inteiro, `null → '—'`, `jan/2026`, percentual com sinal, data/hora.
- `utils/periodo.test.ts`: `somarMeses` cruzando ano, `validarPeriodo` (início>fim, 36 ok / 37 erro, futuro, formato), `periodoPadrao(new Date('2026-10-08'))` = `202509…202608`, `janelaConsulta` (estende 12, limita a 36).
- `utils/ibge.test.ts`: 4214805, 3550308, 3304557, 5300108, 4106902, 2927408 válidos; `1234567` (DV), `99`, `abc`, UF inexistente inválidos.
- `utils/busca.test.ts`: acento-insensível, por código, limite 50.
- `styles/contraste.test.ts`: lê `tokens.css` e verifica texto ≥4.5:1 e componentes/cores de gráfico ≥3:1 nos dois temas.
Comando: `cd frontend && npm test`.

## 7. Itens do README do front
O que é; stack e porquê (Recharts); pré-requisitos (Node ≥22.12 por causa do Vite 8, testado em 22.17); `.env` (`VITE_API_URL`); como rodar (1º API na raiz `USE_MOCK=true npm start`, depois `cd frontend && npm install && npm run dev` → http://localhost:5173); build de produção (`npm run build`, `npm run preview`); estrutura; acessibilidade e como testar; tema escuro; testes; limitações (mock só 6 municípios; IBGE externo; série lenta com cache frio; ano a ano depende da janela estendida; sem exportação — fora do escopo desta entrega).

## 8. Premissas / lacunas
- Entrega cobre apenas Dashboard (Entrega 2) e Filtros (Entrega 3); sem exportação (RF05/RF06).
- Eventual rota de municípios na API é melhoria futura; não faz parte desta entrega.
- Nada foi testado contra a API real do governo (sem chave); o front depende apenas do contrato acima.
