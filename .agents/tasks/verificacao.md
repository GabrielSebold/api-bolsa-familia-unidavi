# Nota de verificação (iteração 1)

Sem commits git (o diretório nem é repositório git). Node v22.17.0, npm 9.2.0.

## Comandos executados e resultados

1. `npm install --save-exact ...` e `npm install --save-dev --save-exact pino-pretty@13.2.0`: ok. `npm ls --depth=0` lista fastify 5.12.5, @fastify/swagger 9.9.1, @fastify/swagger-ui 6.1.1, @fastify/cors 11.3.1, lru-cache 11.5.3, zod 4.6.5, node-cron 4.6.0, pino-pretty 13.2.0. `grep -E '"\^|"~' package.json` não retorna nada (versões exatas).
2. `npm ci` (limpo): ok, 0 vulnerabilidades.
3. `env -u PORTAL_TRANSPARENCIA_API_KEY npm test`: **tests 33, pass 33, fail 0** (sem rede, sem chave). Ajuste: Node 22 não aceita diretório em `--test`, então o script usa o glob `test/*.test.js`.
4. `USE_MOCK=true PORT=3333 npm start` (background) + curl:
   - `GET /api/v1/saude` → 200 (modo mock, circuito closed).
   - `GET /api/v1/repasses?codigoIbge=4214805&mesAno=202401` → 200, `meta.origem:"mock"` (repetido: mesmo resultado; no mock não há cache por desenho. Hit/miss/stale do cache são cobertos em `test/cache-flow.test.js`).
   - `codigoIbge=1234567` → 400 `CODIGO_IBGE_INVALIDO`; `mesAno=202413` → 400 `MES_ANO_INVALIDO`.
   - `de=202401&ate=202403` → 200 (3 itens); `de=202001&ate=202312` (48 meses) → 400; `de>ate` → 400; sem `mesAno` e sem `de/ate` → 400.
   - `GET /docs/` → 200 `text/html`; `GET /docs/json` → OpenAPI 3.0.3 com `/api/v1/repasses` e `/api/v1/saude` (o `DELETE /api/v1/cache` só aparece com `ADMIN_TOKEN`); `GET /` → 302 `http://localhost:3333/docs`.
   - `ss -ltnp`: processo node escutando só em `0.0.0.0:3333`. A porta 8080 aparece em uso, por outro processo que não é desta API (não foi iniciado aqui).
   - SIGTERM: log "Encerrando...", processo finalizado, sem processos restantes (`pgrep` vazio).
5. `USE_MOCK=false PORT=3333 npm start` sem chave: `GET /api/v1/repasses?...` → **502 `CHAVE_API_AUSENTE_OU_INVALIDA`** (mensagem genérica); servidor não travou; log registra `error` na subida e `warn` na consulta.
6. `cp .env.example .env && npm start` (sem USE_MOCK, chave placeholder): sobe em mock automático com aviso `MODO MOCK` no log; consulta devolve `meta.origem:"mock"`. O `.env` foi removido depois.
7. `PRELOAD_ENABLED=true USE_MOCK=true`: log "Pré-carga ignorada em modo mock". `PRELOAD_ENABLED=true USE_MOCK=false` com chave falsa: log "Pré-carga agendada para 02:00 (America/Sao_Paulo)", sem executar chamadas.
8. Limpeza: `data/`, `.env`, logs em /tmp removidos; nenhum processo em background; testes usam `os.tmpdir()` e removem seus temporários.
9. Segredos: nenhuma chave real escrita (`.env.example` só tem `COLOQUE_SUA_CHAVE_AQUI`); `.gitignore` contém `.env` e `data/`. Teste `routes.test.js` confirma o mascaramento (`[REDACTED]`) do header/`apiKey` no log.

## Desvios/observações em relação ao plano

- Circuit breaker: mínimo de **5** chamadas na janela para o critério de taxa (o plano dizia 4). Com 4, quatro falhas já abririam por taxa e mascarariam o critério das "5 falhas consecutivas".
- Fallback de municípios embutido tem 6 códigos (os do teste de DV), não só Rio do Sul, para o mock ser utilizável.
- Dado expirado: responde na hora como `cache-desatualizado` e revalida em segundo plano (fluxo da spec 2.6.6); falha externa sem cache → 503/502 padronizado.
- Erro 500 externo esgotado vira `API_INDISPONIVEL` com HTTP 502 (spec: "Cache, senão 502").
- `DELETE /api/v1/cache` sem `codigoIbge`/`mesAno` limpa todo o cache de repasses; com só um dos dois → 400.

## Não verificável sem chave real

Nada foi testado contra a API real do Portal da Transparência. Itens pendentes: limites reais de req/min (90/300) e faixas de horário; se a API devolve 429 e `Retry-After`; formato real de `dataReferencia`, `nomeIBGE`, `tipo.descricao` e se o schema zod (que exige `municipio.uf.sigla` e `tipo.descricao`) aceita a resposta real; meses de transição entre os programas; ajustes tardios nos últimos meses (TTLs); `pagina` opcional no Novo Bolsa Família; taxa de sucesso ≥ 95% real; resposta a 401/403 e decodificação ISO-8859-1; estrutura real do JSON de municípios do IBGE (download da tabela completa não foi exercitado, pois exige rede).
