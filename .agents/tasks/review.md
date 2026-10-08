# Módulo de Integração com a API do Portal da Transparência (Node.js, Fastify)

Implementação do módulo de integração (RF01/RNF01/RNF02) em Fastify, com cliente real e cliente mock, cache L1 (LRU) + L2 (SQLite), retry com backoff e jitter, circuit breaker, fila de ~60 req/min com coalescing, Swagger em `/docs` e README em pt-BR. A revisão se baseou na leitura do código-fonte e da nota de verificação. Nenhuma suíte foi re-executada. A nota registra 33/33 testes passando sem rede e sem chave, além de smoke tests via curl na porta 3333.

Watch for: (1) o limitador de taxa conta um slot por `buscarMes`, mas o cliente pode fazer até 20 requisições HTTP (paginação) dentro dele, o que subconta o consumo real de req/min (likely, não bloqueante). (2) Nada foi testado contra a API real; formato de `dataReferencia`, 429/Retry-After e schema zod estão listados como "a validar" (confirmed, documentado). (3) Série de até 36 meses é consultada sequencialmente, então a latência pode ser alta com cache frio (possible).

**Verdict**: APPROVED

## High-level view

Escopo respeitado: só o módulo de integração, sem front, sem outros módulos do Termo de Abertura. Rotas, contrato (`consulta`/`dados`/`meta`), códigos de erro, 302 em `/`, série `de`/`ate` com limite de 36 meses e validação IBGE (7 dígitos, UF, dígito verificador, tabela de municípios) seguem a spec 2.6.4/2.6.3. O pipeline de tratamento deduplica por município+mês+tipo mantendo o maior id, não arredonda valores, calcula `valorMedio` com `null` na divisão por zero e devolve 200 com lista vazia.

A chave só entra por env/`.env`. O `.env.example` traz placeholder e o `.gitignore` cobre `.env` e `data/`. O pino mascara o header `chave-api-dados`, e o modo real sem chave devolve 502 `CHAVE_API_AUSENTE_OU_INVALIDA` com mensagem genérica.

A resiliência segue a spec. O retry só ocorre em erros transitórios (rede, timeout, 429, 500, 502, 503, 504, corpo não-JSON), nunca em 4xx não-429 nem em resposta fora do schema. O 429 respeita o Retry-After, o timeout é de 10s e o corpo de erro é decodificado em ISO-8859-1. O breaker abre com 5 falhas consecutivas ou taxa de falha acima de 50% na janela, libera uma chamada no semiaberto e fecha com sucesso. O cache segue o fluxo da spec 2.6.6, com TTLs por idade do mês, stale-while-revalidate, `cache-desatualizado` e gravação só após sucesso validado.

O modo mock é determinístico, funciona sem chave e sem rede, retorna `meta.origem='mock'` e está documentado no README. Swagger e README foram verificados pela nota (HTML em `/docs/`, OpenAPI 3.0.3 em `/docs/json`). A porta padrão é 3333 e é configurável via `PORT`. O código não usa 3000/4200/5173/8080, que só aparecem em texto do README.

<details>
<summary>Issues (4)</summary>

1. **Rate limit subcontado com paginação** (likely, não bloqueante) — `limiter.schedule` envolve `client.buscarMes`, que pode fazer até `MAX_PAGINAS=20` fetches. Mover o agendamento para dentro de `buscarPagina`, ou documentar a limitação.
2. **Fallback de 6 municípios no mock/offline** (confirmed, documentado) — Fora do mock, o download do IBGE precisa de rede na primeira subida. Municípios válidos fora da lista retornam 404 sem rede. Já consta na seção Limitações do README.
3. **Série sequencial de até 36 meses** (possible) — Com cache frio e a fila de 60/min, a resposta pode demorar. Considere paralelizar com limite de concorrência ou documentar.
4. **Sem validação contra API real** (confirmed) — Os itens estão listados na nota e no README como "a validar" (schema zod rígido para `uf.sigla`/`tipo.descricao`, 429/Retry-After, ISO-8859-1, `dataReferencia`). Validar assim que houver chave.

</details>

<details>
<summary>Details</summary>

## Subcontagem do rate limit com paginação

`repassesService.chamarApiComResiliencia` agenda `client.buscarMes` inteiro como um único item da fila. O cliente real itera páginas de 1 a 20, uma requisição HTTP por página. Para municípios que retornam uma única página (caso esperado) o efeito é nulo. Se a API real paginar, o consumo real pode exceder o teto de ~60/min (likely). O 429 é tratado depois, com `pauseUntil`, então o risco é de degradação, não de falha.

## Decisões do implementador que divergem do plano

O mínimo de 5 chamadas na janela para o critério de taxa (o plano dizia 4) evita que 4 falhas abram o circuito por taxa e escondam o critério das 5 consecutivas. O breaker envolve o retry, então uma consulta com 3 tentativas esgotadas conta como 1 falha. Isso é coerente com o fluxo da spec ("registra falha após esgotar retry"). O erro 500 esgotado vira 502 `API_INDISPONIVEL`, em linha com "Cache, senão 502" da spec 2.6.5.

## Segurança da chave

A chave é lida via `process.env` (`--env-file-if-exists`) e enviada só no header `chave-api-dados`; nunca aparece na URL. O redact do pino cobre `req.headers["chave-api-dados"]`, `authorization`, `x-admin-token` e `apiKey`, e há teste que confirma `[REDACTED]`. O log do corpo de erro externo é truncado em 300 caracteres. O `DELETE /api/v1/cache` só é registrado com `ADMIN_TOKEN`, o que evita endpoint administrativo sem autenticação. CORS está em `*` por padrão (adequado ao uso local com front em outra porta, mas deve ser restringido via `CORS_ORIGIN` fora de dev).

## Cobertura de testes

Os 33 testes cobrem IBGE/mesAno, normalizador (dedup, `null`, vazio), retry (503,503,200; 401/400 sem retry; 429 com Retry-After; backoff com teto), breaker (5 consecutivas, taxa, semiaberto, reabertura), fluxo de cache (miss/hit, stale com erro, não sobrescrever com inválido, vazio, coalescing, L2 persistente) e rotas (mock, erros, 302, OpenAPI, DELETE com token, modo real sem chave, redact). Não testados: o cliente real contra respostas HTTP reais (apenas por `fetchImpl` simulado), a decodificação ISO-8859-1 e o download do IBGE.

</details>

<details>
<summary>File map</summary>

- `src/app.js`, `src/server.js`, `src/config/*`: composição, env, mapeamento período→endpoint
- `src/clients/*`: cliente do Portal e mock determinístico
- `src/domain/*`: erros, IBGE, mesAno, schemas zod, normalizador
- `src/cache/*`, `src/resilience/*`: cache L1/L2, retry, breaker, fila, coalescer, métricas
- `src/services/*`, `src/routes/*`, `src/jobs/preload.js`: orquestração, rotas, pré-carga
- `test/*`, `README.md`, `.env.example`, `.gitignore`, `package.json`: testes e documentação

Não há repositório git, então não existe diff; a revisão foi feita sobre os arquivos.

</details>
