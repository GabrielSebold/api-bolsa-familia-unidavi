# Implementation Plan — api-bolsa-familia (Módulo de Integração, Entrega 1: RF01/RNF01/RNF02)

Raiz de trabalho: `/home/leonardo/myprojects/api-bolsa-familia` (sem worktree, NÃO fazer commits git, não usar `git`). Usar sempre caminhos absolutos.
Fontes autoritativas: `plan/2.6-Especificacao-da-API-Integracao-de-Dados.md` e `plan/1a-Termo de Abertura do Projeto.docx.md`. Nenhum diretório de código existe ainda (só `plan/`).

## Decisões já tomadas (não reabrir)

| Decisão | Escolha | Justificativa |
| :-- | :-- | :-- |
| Node | Instalado: **v22.17.0**, npm 9.2.0. `engines: ">=22.5.0"` (node:sqlite exige 22.5+) | Coincide com a spec (Node 22 LTS). |
| Módulos | **ESM** (`"type": "module"`, imports com extensão `.js`) | Fastify 5, lru-cache 11 e `node --test` funcionam bem com ESM; um estilo só. |
| SQLite | **`node:sqlite`** (`DatabaseSync`), verificado: `require('node:sqlite')` funciona nesta máquina (emite ExperimentalWarning) | Zero dependência nativa, sem compilação. Suprimir o aviso com `--disable-warning=ExperimentalWarning` nos scripts. Documentar no README como limitação (API experimental). NÃO usar better-sqlite3. |
| Env | `node --env-file-if-exists=.env` nos scripts (Node 22.9+; ok na 22.17). Sem dotenv. `.env` ausente não quebra. | Menos dependência. |
| Porta | `PORT=3333`, `HOST=0.0.0.0` | Evita 3000/4200/5173/8080. |
| Logs dev | `pino-pretty` como devDependency, usado só quando `NODE_ENV!=production` e `LOG_PRETTY=true` (padrão false → JSON) | Opcional, simples. |
| Reestruturação do workflow | **NÃO restruturar**: o trabalho é um único código coeso e fortemente acoplado (cache ↔ cliente ↔ resiliência ↔ rotas). Este plano é executado pelo loop existente de implementar-e-revisar. | Evita sobrecarga. |

### Versões EXATAS das dependências (verificadas no registry npm em consulta a `npm view`)

dependencies (gravar sem `^`/`~`; usar `npm install --save-exact`):
- fastify 5.12.5
- @fastify/swagger 9.9.1
- @fastify/swagger-ui 6.1.1
- @fastify/cors 11.3.1
- lru-cache 11.5.3
- zod 4.6.5 (API zod v4: `z.object`, `z.coerce`, `.safeParse`; `error.issues`)
- node-cron 4.6.0 (`import cron from 'node-cron'`; `cron.schedule(expr, fn, { timezone })`, retorna task com `.stop()`/`.destroy()` — conferir o export real após instalar)
- pino 10.4.0 (Fastify já usa pino internamente; instalar só se importar pino diretamente; para o logger do Fastify basta passar opções. Se o código não importar `pino` diretamente, NÃO instalar.)

devDependencies: pino-pretty 13.2.0.

Se algum pacote falhar a instalação/compatibilidade, o implementador troca para a versão estável anterior mais próxima, também exata, e registra no README.

### Dígito verificador IBGE (conferido por execução nesta máquina)

Algoritmo: pesos `[1,2,1,2,1,2]` sobre os 6 primeiros dígitos; cada produto >9 tem os dígitos somados (equivale a `p>9 ? p-9 : p`); `DV = (10 - soma % 10) % 10`; compara com o 7º dígito.
Resultados verificados: 4214805→5 ✔, 3550308→8 ✔, 3304557→7 ✔, 5300108→8 ✔, 4106902→2 ✔, 2927408→8 ✔. Todos batem, então o DV é **obrigatório** (400 CODIGO_IBGE_INVALIDO se falhar). Incluir esses 6 códigos como casos de teste.

UFs válidas (2 primeiros dígitos): 11,12,13,14,15,16,17,21,22,23,24,25,26,27,28,29,31,32,33,35,41,42,43,50,51,52,53.

### Mapeamento período→endpoint (`src/config/programas.js`, marcado "a validar")
- `mesAno <= 202110` → `bolsa-familia-por-municipio` (programa `BOLSA_FAMILIA`)
- `202111..202302` → `auxilio-brasil-por-municipio` (`AUXILIO_BRASIL`)
- `>= 202303` → `novo-bolsa-familia-por-municipio` (`NOVO_BOLSA_FAMILIA`)
Exportar `programaPorMesAno(mesAno)` e constantes `BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados'`, `HEADER_CHAVE = 'chave-api-dados'`, `MAX_PAGINAS = 20`.

### Variáveis de ambiente (`src/config/env.js`, validadas com zod, defaults)

| Var | Padrão |
| :-- | :-- |
| PORT | 3333 |
| HOST | 0.0.0.0 |
| NODE_ENV | development |
| LOG_LEVEL | info |
| LOG_PRETTY | false |
| CORS_ORIGIN | `*` (lista separada por vírgula aceita) |
| PORTAL_TRANSPARENCIA_API_KEY | (vazio) |
| USE_MOCK | (indefinido): `true` força mock; `false` força real; indefinido → mock automático com `log.warn` se a chave ausente |
| DB_PATH | ./data/cache.sqlite (`:memory:` aceito; criar diretório pai se não existir) |
| ADMIN_TOKEN | (vazio → rota DELETE /api/v1/cache responde 404) |
| RATE_LIMIT_PER_MIN | 60 |
| HTTP_TIMEOUT_MS | 10000 |
| RETRY_ATTEMPTS | 3 |
| RETRY_BASE_MS | 1000 (tests usam 1) |
| CB_FAILURE_THRESHOLD | 5 |
| CB_FAILURE_RATE | 0.5 |
| CB_WINDOW_MS | 60000 |
| CB_OPEN_MS | 60000 |
| PRELOAD_ENABLED | false |
| PRELOAD_CODIGO_IBGE | 4214805 |
| IBGE_MUNICIPIOS_URL | https://servicodados.ibge.gov.br/api/v1/localidades/municipios |

`env.js` exporta função `loadEnv(source = process.env)` (testável) retornando objeto tipado, incluindo `modo` ('real'|'mock') e `avisoMockAutomatico`.

## Estrutura de arquivos

```
package.json  .env.example  .gitignore  README.md
src/server.js                       # lê env, buildApp, listen, graceful shutdown
src/app.js                          # buildApp({env, deps}) para testes
src/config/{env,programas}.js
src/routes/{repasses,saude,cache}.js
src/services/{repassesService,municipiosService}.js
src/clients/{portalTransparenciaClient,mockClient}.js
src/cache/{cacheL1,cacheL2,cacheManager}.js
src/resilience/{retry,circuitBreaker,rateLimiter,coalescer,successMetrics}.js
src/domain/{codigoIbge,mesAno,normalizer,schemas,errors}.js
src/jobs/preload.js                 # node-cron
test/*.test.js
```
Convenção: injeção de dependências por parâmetros (ex.: `now`, `sleep`, `random`, `fetchImpl`) para testar sem rede nem espera real.

## Itens (ordem por dependência; cada item deixa o projeto executável)

- [ ] 1. Scaffolding do projeto.
      Criar `package.json` (`name: api-bolsa-familia`, `type: module`, `engines.node: ">=22.5.0"`, `private: true`; scripts: `start`: `node --disable-warning=ExperimentalWarning --env-file-if-exists=.env src/server.js`, `dev`: mesmo com `--watch`, `test`: `node --disable-warning=ExperimentalWarning --test test/`). Criar `.gitignore` (node_modules, .env, data/, *.sqlite*, .agents/ não precisa), `.env.example` com todas as vars da tabela acima (chave com placeholder `COLOQUE_SUA_CHAVE_AQUI`, ADMIN_TOKEN placeholder comentado). Rodar `npm install --save-exact fastify@5.12.5 @fastify/swagger@9.9.1 @fastify/swagger-ui@6.1.1 @fastify/cors@11.3.1 lru-cache@11.5.3 zod@4.6.5 node-cron@4.6.0` e `npm install --save-dev --save-exact pino-pretty@13.2.0`.
      Files: package.json, package-lock.json, .gitignore, .env.example
      Verify: `npm ls --depth=0` lista tudo; `grep -E '"\^|"~' package.json` não retorna nada (versões exatas); `node -e "import('node:sqlite')"` ok.

- [ ] 2. Domínio puro: `src/domain/codigoIbge.js` (`validarCodigoIbge(str)` → `{ok, motivo}`: regex `^\d{7}$`, UF válida, DV; `calcularDvIbge(seis)`), `mesAno.js` (`validarMesAno` AAAAMM com mês 01-12 e ano 2000..ano atual+1 sem futuro além do mês corrente → MES_ANO_INVALIDO; `mesAnoAtual(now)`, `somarMeses`, `intervaloMeses(de, ate)` com de<=ate e máx 36 meses; `idadeEmMeses(mesAno, now)`), `errors.js` (classe `AppError(codigo, status, mensagem, {tentarNovamenteEm})` + fábricas para os 7 códigos do contrato), `schemas.js` (zod do `BeneficioPorMunicipioDTO`: id number, dataReferencia string, municipio{codigoIBGE string, nomeIBGE string, uf{sigla,nome}, ...opcional}, tipo{id number, descricao string, descricaoDetalhada opcional}, valor number, quantidadeBeneficiados number; `.passthrough()`/tolerante a campos extras; array de DTO), `normalizer.js` (`normalizarRegistros(dtos, {mesAno, programa, coletadoEm})`: valor numérico SEM arredondar, `quantidadeBeneficiados` inteiro, `dataReferencia`→`AAAAMM` (aceitar `YYYY-MM-DD` e `DD/MM/YYYY`; se inválida, usar o mesAno consultado e logar), trim de strings, dedup por `codigoIBGE+mesAno+tipo.id` mantendo maior `id`, `valorMedio = qtd===0 ? null : valor/qtd` sem arredondar, saída conforme "Modelo interno normalizado" da spec com `tipo {id, descricao}` adicionado).
      Files: src/domain/*.js
      Verify: testes do item 10 (unitários) passam; por ora `node -e "import('./src/domain/codigoIbge.js').then(m=>console.log(m.validarCodigoIbge('4214805')))"` retorna ok.

- [ ] 3. Resiliência: `retry.js` (`withRetry(fn, {attempts, baseMs, maxMs:30000, jitterMs:500, sleep, random, shouldRetry})`: espera `min(30s, base*2^tentativa)+jitter`; usa `retryAfterMs` do erro quando presente; erros de classe `ExternalError` com `.retryable`), `circuitBreaker.js` (`CircuitBreaker({failureThreshold, failureRate, windowMs, openMs, now})` estados closed/open/half-open; abre com N falhas consecutivas OU taxa >50% em janela (exigir mínimo de 4 chamadas na janela para taxa); half-open libera exatamente 1 chamada; `canRequest()`, `onSuccess()`, `onFailure()`, `state()`, `execute(fn)`), `rateLimiter.js` (fila com espaçamento/token bucket de N req/min, `schedule(fn, {prioridade:'normal'|'preload'})`, `pauseUntil(ts)` para 429, `stats()` → {pendentes, limite, pausadoAte}; preload limitado a 50% da capacidade), `coalescer.js` (`coalesce(key, fn)` mapa de promises em voo), `successMetrics.js` (janela deslizante de 1h: `record(ok)`, `taxa()`, `snapshot()` → {total, sucessos, falhas, taxa}; `warn` via callback se <95% e total>=10).
      Files: src/resilience/*.js
      Verify: testes do item 10 (retry, breaker) passam.

- [ ] 4. Cliente externo e mock: `src/clients/portalTransparenciaClient.js` (`createPortalClient({apiKey, fetchImpl=fetch, timeoutMs, logger})` com `buscarMes({codigoIbge, mesAno})`: resolve endpoint via `programaPorMesAno`, header `chave-api-dados` + `Accept: application/json`, pagina 1.. até array vazio (máx 20), `AbortSignal.timeout`; mapeia: rede/timeout/429/500/502/503/504 → `ExternalError` retryable (429 lê `Retry-After` segundos ou data → `retryAfterMs`); 401/403 → erro `CHAVE_API_AUSENTE_OU_INVALIDA` (não retryable, log crítico sem a chave); 400/404 → não retryable; corpo de erro decodificado via `new TextDecoder('iso-8859-1').decode(await res.arrayBuffer())` só para log; corpo 200 não-JSON → indisponibilidade retryable; falha no zod → `RESPOSTA_INVALIDA` (não retryable). Devolve DTOs validados + programa). `mockClient.js` (`createMockClient()` com mesma interface; dados determinísticos derivados de hash de `codigoIbge+mesAno` no formato BeneficioPorMunicipioDTO real; meses futuros → `[]`; origem tratada no service). Se chave ausente e modo real → lançar `CHAVE_API_AUSENTE_OU_INVALIDA` sem detalhes.
      Files: src/clients/*.js
      Verify: testes do item 10 (cliente falso via `fetchImpl`) passam.

- [ ] 5. Cache: `cacheL1.js` (lru-cache, `max` 5000, TTL por entrada, `allowStale:false`), `cacheL2.js` (`node:sqlite` `DatabaseSync(dbPath)`; `PRAGMA journal_mode=WAL` (ignorar para `:memory:`); tabelas `cache_repasse(chave TEXT PK, payload TEXT, vazio INTEGER, coletado_em TEXT, expira_em INTEGER)` e `municipios(codigo TEXT PK, nome TEXT, uf TEXT)` + `meta(chave,valor)` para data de refresh; prepared statements; `get(chave)` devolvendo também expirados com flag, `set`, `delete`, `close`), `cacheManager.js` (`ttlPorIdade(mesAno, vazio, now)` conforme spec: >3 meses L1 24h/L2 30d; últimos 3 meses 6h/3d; mês corrente 1h/1d; vazio 15min/1h; chave `repasse:v1:{codigoIbge}:{mesAno}`; `get`: L1 válido→origem 'cache'; L2 válido→preenche L1; L2 expirado→retorna `{stale:true}`; contadores hits/misses L1/L2 expostos em `stats()`; `set` grava L1+L2; `delete`).
      Files: src/cache/*.js
      Verify: testes do item 10 (cache com SQLite `:memory:`/arquivo temporário) passam.

- [ ] 6. Serviços: `municipiosService.js` (`init()`: lê tabela SQLite; se vazia ou >30 dias, tenta fetch do IBGE (`fetchImpl` injetável; mapear `id`→codigo, `nome`, `microrregiao.mesorregiao.UF.sigla` ou `regiao-imediata.regiao-intermediaria.UF.sigla`, tolerante a ambos); se falhar e houver tabela salva usa-a; se não houver, fallback embutido `[{4214805,'Rio do Sul','SC'}]` + `log.warn`; `existe(codigo)`, `buscar(codigo)`; em mock/testes recebe `fetchImpl` falso ou `skipRemote:true` — modo mock NÃO faz rede; refresh mensal via cron mensal opcional ou checagem de idade na inicialização), `repassesService.js` (`consultarMes({codigoIbge,mesAno})`: valida entrada (400s), existência no município (404 MUNICIPIO_NAO_ENCONTRADO) → fluxo de leitura da spec 2.6.6: L1/L2 válido→origem 'cache'; expirado → responde stale imediatamente e revalida em background se breaker permite (origem 'cache-desatualizado'... na revalidação em segundo plano usar a mesma coalescência); sem dado → circuit breaker + rate limiter + retry + cliente, normaliza, grava cache (vazio = cache negativo, lista vazia 200), registra métricas; falha da API → stale de L2 com 'cache-desatualizado', senão erro padronizado (API_INDISPONIVEL 503 com `tentarNovamenteEm`, RATE_LIMIT_EXTERNO 503 com Retry-After, RESPOSTA_INVALIDA 502, CHAVE_API_AUSENTE_OU_INVALIDA 502); resposta inválida NUNCA sobrescreve cache válido; modo mock: usa mockClient, `meta.origem='mock'` sempre, sem breaker/rate limit/cache externo; `consultarSerie({codigoIbge,de,ate})`: valida de<=ate, máx 36 meses (400 MES_ANO_INVALIDO), itera mês a mês com `consultarMes`, agrega dados e `meta.origem` do pior caso (api<cache<cache-desatualizado → usar 'cache-desatualizado' se qualquer mês stale, 'api' se algum veio da API, senão 'cache'; mock→'mock'), `atualizadoEm` = mais antigo).
      Files: src/services/*.js
      Verify: testes do item 10 (fluxo de cache) passam.

- [ ] 7. Aplicação HTTP: `src/app.js` `buildApp({env, overrides})` → Fastify com `logger` pino (`redact: { paths: ['req.headers["chave-api-dados"]','req.headers.authorization','req.headers["x-admin-token"]','*.apiKey','headers["chave-api-dados"]'], censor: '[REDACTED]' }`, `pino-pretty` transport só se LOG_PRETTY); `@fastify/cors` (`origin` de CORS_ORIGIN); `@fastify/swagger` (openapi 3.0: info pt-BR, tags Repasses/Saúde/Administração, servers, schema de segurança `x-admin-token` apiKey header) e `@fastify/swagger-ui` com `routePrefix: '/docs'` (JSON em `/docs/json`); `setErrorHandler` convertendo `AppError` e erros de validação do Fastify em `{erro:{codigo,mensagem,tentarNovamenteEm?}}` (query inválida → 400 com codigo CODIGO_IBGE_INVALIDO/MES_ANO_INVALIDO conforme o campo; erros inesperados → 500 genérico `ERRO_INTERNO` sem stack); `Retry-After` header em RATE_LIMIT_EXTERNO. Rotas em `src/routes/`: `repasses.js` (GET /api/v1/repasses; schema querystring `codigoIbge`, `mesAno`, `de`, `ate` — exige mesAno OU (de e ate); respostas 200/400/404/502/503 com `examples`; usar schemas JSON do próprio Fastify, não ajv estrito demais: `additionalProperties:false` desnecessário), `saude.js` (GET /api/v1/saude: uptime, modo, circuitBreaker.state, taxaSucesso (snapshot), cache stats, ultimaColeta, filaRateLimit), `cache.js` (DELETE /api/v1/cache?codigoIbge=&mesAno=; registrar SOMENTE se `ADMIN_TOKEN` definido (senão 404 natural); 401 se `x-admin-token` ausente/incorreto, comparação com `crypto.timingSafeEqual`; documentado no Swagger com security). `GET /` → `reply.redirect('/docs', 302)` (ocultar do schema com `hide:true`). Hook `onClose` fecha banco e cron. `src/server.js`: carrega env, `buildApp`, `listen({port,host})`, loga URL do Swagger e aviso se modo mock automático, `SIGINT`/`SIGTERM` → `app.close()` (fecha servidor, SQLite, cron) com `process.exit(0)`.
      Files: src/app.js, src/server.js, src/routes/*.js
      Verify: `npm test` (testes de rotas via `app.inject`) passa; subir `PORT=3333 USE_MOCK=true npm start` em background e rodar: `curl -s localhost:3333/api/v1/saude`, `curl -s "localhost:3333/api/v1/repasses?codigoIbge=4214805&mesAno=202401"` (200, `meta.origem:"mock"`), `curl -s "localhost:3333/api/v1/repasses?codigoIbge=1234567&mesAno=202401"` (400), `curl -s -o /dev/null -w '%{http_code}' localhost:3333/docs/` (200), `curl -s localhost:3333/docs/json | head -c 200` (OpenAPI), `curl -sI localhost:3333/` (302). Encerrar o processo ao final (SIGTERM) e confirmar encerramento limpo.

- [ ] 8. Pré-carga: `src/jobs/preload.js` (`startPreload({env, service, rateLimiter, logger})`: só se `PRELOAD_ENABLED=true`; `node-cron` `'0 2 * * *'` com timezone `America/Sao_Paulo`; atualiza mês corrente e 2 anteriores de `PRELOAD_CODIGO_IBGE`; na 1ª execução (cache vazio para o município) carrega 24 meses; usa prioridade 'preload' no rate limiter (máx 50% da capacidade); em mock não executa; devolve `stop()` chamado no `onClose`).
      Files: src/jobs/preload.js, src/app.js (wire)
      Verify: `npm test` passa; subir com `PRELOAD_ENABLED=true USE_MOCK=true` não quebra e o log mostra que o job foi agendado (em mock: log informando que a pré-carga é ignorada).

- [ ] 9. README.md em pt-BR na raiz: o que é; como funciona (arquitetura em camadas, diagrama mermaid do fluxo cache/erros copiado/adaptado da spec, mapeamento de programas); pré-requisitos (Node >=22.5, nota de que `node:sqlite` é experimental e emite aviso suprimido pelos scripts); como obter a chave gratuita (http://www.portaldatransparencia.gov.br/api-de-dados/cadastrar-email); configuração `.env` (cp .env.example .env); instalação (`npm install`); como rodar (dev: `npm run dev`; prod: `NODE_ENV=production npm start`); Swagger UI `http://localhost:3333/docs` e OpenAPI JSON `/docs/json`; porta 3333 e por quê; exemplos curl (mês, série, saúde, DELETE cache com x-admin-token, erro 400); tabela de variáveis de ambiente (a tabela acima); estrutura de pastas; testes (`npm test`, o que cobrem e que não usam rede); MODO MOCK (USE_MOCK=true; automático sem chave com aviso; `meta.origem='mock'`; em modo real sem chave → 502 CHAVE_API_AUSENTE_OU_INVALIDA); justificativa curta da stack e ajustes (node:sqlite em vez de better-sqlite3, ESM, `--env-file` em vez de dotenv, sem pino direto); tabela de códigos de erro; segurança (chave segredo, redact, .env no .gitignore); limitações; seção "Itens a validar" (abaixo).
      Files: README.md
      Verify: ler o README e conferir que todos os comandos/rotas/vars citados existem (executar os `curl` do exemplo contra o servidor em mock); links Markdown corretos.

- [ ] 10. Testes enxutos com `node --test` em `test/` (sem framework extra, sem rede, sem chave; temporários em `os.tmpdir()` com `fs.mkdtempSync` removidos em `after`): 
      - `codigoIbge.test.js`: os 6 códigos reais válidos; DV errado, 6/8 dígitos, letras, UF inexistente → inválido.
      - `mesAno.test.js`: válidos/ inválidos (202413, 20241, futuro), `intervaloMeses` (de>ate erro, 37 meses erro, 36 ok), `ttlPorIdade`.
      - `normalizer.test.js`: normalização, dedup por maior id, `valorMedio` com `quantidade=0` → `null`, valor não arredondado (ex.: 1234.567 mantém), dataReferencia→AAAAMM, resposta vazia.
      - `retry.test.js`: retry com cliente falso (`fetchImpl`) — 503,503,200 sucede em 3 chamadas; 401 não repete; 429 respeita Retry-After; esgota → erro; backoff calculado com `sleep` e `random` injetados (valores 1000+jitter, 2000+jitter, teto 30000); timeout; corpo não-JSON → retry.
      - `circuitBreaker.test.js`: abre com 5 falhas consecutivas; abre por taxa >50% na janela; aberto bloqueia; após `openMs` (relógio injetado) half-open libera 1 chamada; sucesso fecha; falha reabre.
      - `cache-flow.test.js`: serviço com cliente externo falso + SQLite `:memory:`/arquivo tmp: miss→origem 'api'; segunda → 'cache'; expirar (relógio injetado) + API falhando → 'cache-desatualizado'; sem cache + API falhando → API_INDISPONIVEL 503; resposta inválida (zod) não sobrescreve cache válido; resposta `[]` → 200 lista vazia (cache negativo); coalescing (2 chamadas simultâneas → 1 chamada ao cliente); L2 persiste após recriar L1.
      - `routes.test.js`: `app.inject` em modo mock: 200 mes (`meta.origem==='mock'`), série, 400 IBGE inválido, 404 município inexistente (código válido por DV mas fora da tabela — escolher código com UF e DV válidos ausente no fallback, ex.: calcular DV de um código inexistente), 400 série >36 meses, `/api/v1/saude` 200, `/` 302 para `/docs`, `/docs/json` contém `/api/v1/repasses`, DELETE cache 404 sem ADMIN_TOKEN e 401/200 com; header `chave-api-dados` não aparece nos logs (capturar stream do logger).
      Files: test/*.test.js
      Verify: `npm test` → todos passam, saída sem falhas, sem acesso à rede (rodar também com `env -u PORTAL_TRANSPARENCIA_API_KEY npm test`); depois confirmar que não restaram arquivos temporários (`ls data/ /tmp | grep -i bolsa` vazio, `data/` não contém sqlite de teste).

- [ ] 11. Verificação final integrada e limpeza: `npm ci` limpo se possível, `npm test`, subir `USE_MOCK=true npm start` (porta 3333) e exercitar os curls do README, testar sem `USE_MOCK` e sem chave (deve cair em mock com aviso no log) e com `USE_MOCK=false` sem chave (502 CHAVE_API_AUSENTE_OU_INVALIDA sem vazamento), SIGTERM encerra sem erro. Confirmar que `.env` real não foi criado/versionado, `data/` ignorado, nenhum processo restante (`lsof -i :3333` vazio), remover `data/` de teste e quaisquer arquivos temporários. NÃO commitar.
      Files: —
      Verify: comandos acima com resultados esperados; `npm test` verde.

## Itens a validar (exigem chave real; documentar no README, não são testáveis aqui)

1. Limites de requisição reais (90 req/min diurno, 300 req/min madrugada) e faixas de horário; o padrão 60 req/min é conservador.
2. Se a API realmente devolve `429` e o header `Retry-After` (tratado de forma defensiva).
3. Formato real de `dataReferencia`, grafia de `nomeIBGE` e `tipo.descricao` (o normalizador aceita `YYYY-MM-DD` e `DD/MM/YYYY`).
4. Meses exatos de transição entre Bolsa Família, Auxílio Brasil e Novo Bolsa Família (`src/config/programas.js`).
5. Se os últimos meses recebem ajustes depois da publicação (define os TTLs de 6h/3d).
6. Se `pagina` é opcional no endpoint Novo Bolsa Família (o cliente sempre envia `pagina`).
7. Meta de ≥95% de sucesso medida contra a API real; o comportamento do ISO-8859-1 nos corpos de erro; resposta a `401`/`403` com chave inválida.
8. Estrutura real do JSON de municípios do IBGE para extrair a UF (mapeamento tolerante implementado, mas confirmar na 1ª execução com rede).

## Riscos/observações para o implementador
- `node:sqlite` é experimental: isolar todo acesso em `cacheL2.js` para facilitar troca futura.
- zod v4: `z.string().regex`, `z.number()`, `safeParse(...).error.issues`; não usar APIs removidas da v3.
- Fastify 5: schemas de querystring precisam ser JSON Schema completos (`type:'object', properties`), `reply.redirect(url, code)` na v5 usa a assinatura `(url, code)`—confirmar após instalar.
- Não logar corpo bruto das respostas externas em nível info; nunca logar header da chave.
- Valores monetários: nunca arredondar; `valorMedio` calculado em ponto flutuante direto.
