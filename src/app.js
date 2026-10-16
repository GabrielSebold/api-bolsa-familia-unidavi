import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AppError } from './domain/errors.js';
import { CacheL1 } from './cache/cacheL1.js';
import { CacheL2 } from './cache/cacheL2.js';
import { CacheManager } from './cache/cacheManager.js';
import { createPortalClient } from './clients/portalTransparenciaClient.js';
import { createMockClient } from './clients/mockClient.js';
import { CircuitBreaker } from './resilience/circuitBreaker.js';
import { RateLimiter } from './resilience/rateLimiter.js';
import { Coalescer } from './resilience/coalescer.js';
import { SuccessMetrics } from './resilience/successMetrics.js';
import { createMunicipiosService } from './services/municipiosService.js';
import { createRepassesService } from './services/repassesService.js';
import { startPreload } from './jobs/preload.js';
import repassesRoutes from './routes/repasses.js';
import saudeRoutes from './routes/saude.js';
import cacheRoutes from './routes/cache.js';
import exportacaoRoutes from './routes/exportacao.js';

const REDACT = {
  paths: [
    'req.headers["chave-api-dados"]',
    'req.headers.authorization',
    'req.headers["x-admin-token"]',
    'headers["chave-api-dados"]',
    'headers["x-admin-token"]',
    '*.apiKey',
    'apiKey',
  ],
  censor: '[REDACTED]',
};

/**
 * overrides (para testes): { client, now, fetchImpl, logStream, sleep, random, skipMunicipiosRemote }
 */
export async function buildApp({ env, overrides = {} }) {
  const logger = { level: env.LOG_LEVEL, redact: REDACT };
  if (overrides.logStream) logger.stream = overrides.logStream;
  else if (env.LOG_PRETTY && env.NODE_ENV !== 'production') logger.transport = { target: 'pino-pretty' };

  const app = Fastify({ logger });
  const iniciadoEm = Date.now();
  const now = overrides.now ?? (() => new Date());
  const log = app.log;
  const mock = env.modo === 'mock';

  const l2 = new CacheL2(env.DB_PATH);
  const cache = new CacheManager({ l1: new CacheL1(), l2, now });
  const municipios = createMunicipiosService({
    l2,
    url: env.IBGE_MUNICIPIOS_URL,
    fetchImpl: overrides.fetchImpl,
    skipRemote: mock || overrides.skipMunicipiosRemote === true,
    logger: log,
  });
  await municipios.init();

  const client =
    overrides.client ??
    (mock
      ? createMockClient({ buscarMunicipio: (c) => municipios.buscar(c), now })
      : createPortalClient({ apiKey: env.PORTAL_TRANSPARENCIA_API_KEY, timeoutMs: env.HTTP_TIMEOUT_MS, logger: log }));

  const breaker = new CircuitBreaker({
    failureThreshold: env.CB_FAILURE_THRESHOLD,
    failureRate: env.CB_FAILURE_RATE,
    windowMs: env.CB_WINDOW_MS,
    openMs: env.CB_OPEN_MS,
    now: () => now().getTime(),
  });
  const limiter = new RateLimiter({ limitPerMin: env.RATE_LIMIT_PER_MIN, now: () => now().getTime() });
  let ultimoAviso = 0;
  const metrics = new SuccessMetrics({
    now: () => now().getTime(),
    onLowRate: (s) => {
      if (Date.now() - ultimoAviso > 60_000) {
        ultimoAviso = Date.now();
        log.warn({ taxa: s.taxa, total: s.total }, 'ALERTA: taxa de sucesso da API externa abaixo de 95% na última hora');
      }
    },
  });

  const service = createRepassesService({
    modo: env.modo,
    apiKeyPresente: Boolean(env.PORTAL_TRANSPARENCIA_API_KEY) || Boolean(overrides.client),
    cache,
    municipios,
    client,
    breaker,
    limiter,
    coalescer: new Coalescer(),
    metrics,
    logger: log,
    now,
    retry: {
      attempts: env.RETRY_ATTEMPTS,
      baseMs: env.RETRY_BASE_MS,
      sleep: overrides.sleep,
      random: overrides.random,
    },
  });

  const preload = startPreload({ env, service, cache, logger: log, now });

  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    exposedHeaders: ['Content-Disposition', 'X-Total-Registros'],
  });
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'API Bolsa Família – Módulo de Integração',
        description:
          'Integração com a API do Portal da Transparência (repasses do Bolsa Família por município) com cache, retry, circuit breaker e modo mock.',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
      tags: [
        { name: 'Repasses', description: 'Consulta de repasses por município' },
        { name: 'Relatórios', description: 'Exportação de dados em CSV, JSON e PDF' },
        { name: 'Saúde', description: 'Estado do módulo' },
        { name: 'Administração', description: 'Operações protegidas por token' },
      ],
      components: { securitySchemes: { adminToken: { type: 'apiKey', in: 'header', name: 'x-admin-token' } } },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      if (err.retryAfterSeconds) reply.header('Retry-After', String(err.retryAfterSeconds));
      return reply.status(err.status).send({
        erro: { codigo: err.codigo, mensagem: err.message, ...(err.tentarNovamenteEm ? { tentarNovamenteEm: err.tentarNovamenteEm } : {}) },
      });
    }
    if (err.validation) {
      const campo = err.validation[0]?.params?.missingProperty ?? err.validation[0]?.instancePath ?? '';
      const codigo = String(campo).includes('codigoIbge') ? 'CODIGO_IBGE_INVALIDO' : 'MES_ANO_INVALIDO';
      return reply.status(400).send({ erro: { codigo, mensagem: `Parâmetros inválidos: ${err.message}` } });
    }
    if (err.statusCode && err.statusCode < 500) {
      return reply.status(err.statusCode).send({ erro: { codigo: 'REQUISICAO_INVALIDA', mensagem: err.message } });
    }
    req.log.error({ err: { message: err.message } }, 'Erro inesperado');
    return reply.status(500).send({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor.' } });
  });
  app.setNotFoundHandler((req, reply) =>
    reply.status(404).send({ erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota não encontrada.' } }),
  );

  app.get('/', { schema: { hide: true } }, (req, reply) => reply.redirect('/docs', 302));

  const getSaude = () => ({
    status: 'ok',
    uptimeSegundos: Math.round((Date.now() - iniciadoEm) / 1000),
    modo: env.modo,
    circuitBreaker: { estado: breaker.state() },
    taxaSucessoExterna: metrics.snapshot(),
    cache: cache.stats(),
    ultimaColeta: service.stats().ultimaColeta,
    filaRateLimit: limiter.stats(),
  });

  await app.register(repassesRoutes, { service });
  await app.register(exportacaoRoutes, { service, now });
  await app.register(saudeRoutes, { getSaude });
  if (env.ADMIN_TOKEN) await app.register(cacheRoutes, { service, adminToken: env.ADMIN_TOKEN });

  app.addHook('onClose', async () => {
    preload.stop();
    limiter.close();
    l2.close();
  });

  return app;
}
