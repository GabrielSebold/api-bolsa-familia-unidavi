import { AppError, ExternalError, apiIndisponivel, chaveInvalida, codigoIbgeInvalido, mesAnoInvalido, municipioNaoEncontrado, rateLimitExterno, respostaInvalida } from '../domain/errors.js';
import { validarCodigoIbge } from '../domain/codigoIbge.js';
import { intervaloMeses, validarMesAno } from '../domain/mesAno.js';
import { normalizarRegistros } from '../domain/normalizer.js';
import { chaveRepasse } from '../cache/cacheManager.js';
import { withRetry } from '../resilience/retry.js';
import { CircuitOpenError } from '../resilience/circuitBreaker.js';

const MAX_RETRY_AFTER_ESPERA_MS = 30000;

export function mapearErro(err, breaker) {
  if (err instanceof AppError) return err;
  if (err instanceof CircuitOpenError) return apiIndisponivel(60);
  if (err instanceof ExternalError) {
    switch (err.tipo) {
      case 'CHAVE':
        return chaveInvalida();
      case 'INVALIDA':
        return respostaInvalida();
      case 'RATE_LIMIT':
        return rateLimitExterno(err.retryAfterMs ? Math.ceil(err.retryAfterMs / 1000) : 60);
      case 'INTERNO':
      case 'CLIENTE':
        return new AppError('API_INDISPONIVEL', 502, 'A API externa retornou um erro. Tente novamente mais tarde.', { tentarNovamenteEm: 60 });
      default:
        return apiIndisponivel(60);
    }
  }
  return apiIndisponivel(60);
}

export function createRepassesService({
  modo,
  apiKeyPresente = true,
  cache,
  municipios,
  client,
  breaker,
  limiter,
  coalescer,
  metrics,
  logger,
  now = () => new Date(),
  retry = {}, // { attempts, baseMs, sleep, random }
}) {
  let ultimaColeta = null;

  function validarEntrada(codigoIbge, mesAno) {
    const v = validarCodigoIbge(codigoIbge);
    if (!v.ok) throw codigoIbgeInvalido(v.motivo);
    if (mesAno !== undefined) {
      const m = validarMesAno(mesAno, now());
      if (!m.ok) throw mesAnoInvalido(m.motivo);
    }
    if (!municipios.existe(codigoIbge)) throw municipioNaoEncontrado(codigoIbge);
  }

  async function chamarApiComResiliencia({ codigoIbge, mesAno }, prioridade) {
    if (!apiKeyPresente) throw chaveInvalida();
    const contaComoFalha = (e) => e instanceof ExternalError && e.retryable && e.tipo !== 'RATE_LIMIT';
    return breaker.execute(
      () =>
        withRetry(
          () =>
            limiter.schedule(async () => {
              try {
                const r = await client.buscarMes({ codigoIbge, mesAno });
                metrics.record(true);
                return r;
              } catch (e) {
                metrics.record(false);
                if (e instanceof ExternalError && e.tipo === 'RATE_LIMIT') {
                  limiter.pauseUntil(now().getTime() + (e.retryAfterMs ?? 60000));
                }
                throw e;
              }
            }, { prioridade }),
          {
            ...retry,
            shouldRetry: (e) => e instanceof ExternalError && e.retryable && !(e.retryAfterMs > MAX_RETRY_AFTER_ESPERA_MS),
            onRetry: (e, n, espera) => logger?.warn?.({ tipo: e.tipo, tentativa: n, esperaMs: espera }, 'Retry na API externa'),
          },
        ),
      contaComoFalha,
    );
  }

  /** Busca na API, normaliza e grava no cache. Só grava em caso de sucesso (nunca sobrescreve com dado inválido). */
  function buscarEGravar({ codigoIbge, mesAno }, prioridade = 'normal') {
    const chave = chaveRepasse(codigoIbge, mesAno);
    return coalescer.coalesce(chave, async () => {
      const { programa, dtos } = await chamarApiComResiliencia({ codigoIbge, mesAno }, prioridade);
      const coletadoEm = now().toISOString();
      const registros = normalizarRegistros(dtos, { mesAno, programa, coletadoEm, logger });
      ultimaColeta = coletadoEm;
      return cache.set(chave, { registros, mesAno, coletadoEm });
    });
  }

  async function consultarMes({ codigoIbge, mesAno, prioridade = 'normal', forcar = false }) {
    validarEntrada(codigoIbge, mesAno);
    const consulta = { codigoIbge, mesAno };

    if (modo === 'mock') {
      const { programa, dtos } = await client.buscarMes({ codigoIbge, mesAno });
      const coletadoEm = now().toISOString();
      const dados = normalizarRegistros(dtos, { mesAno, programa, coletadoEm, logger });
      return { consulta, dados, meta: { origem: 'mock', atualizadoEm: coletadoEm } };
    }

    const chave = chaveRepasse(codigoIbge, mesAno);
    if (forcar) {
      try {
        const e = await buscarEGravar(consulta, prioridade);
        return { consulta, dados: e.registros, meta: { origem: 'api', atualizadoEm: e.coletadoEm } };
      } catch (err) {
        throw mapearErro(err, breaker);
      }
    }

    const r = cache.get(chave);
    if (r.estado === 'hit') {
      return { consulta, dados: r.entrada.registros, meta: { origem: 'cache', atualizadoEm: r.entrada.coletadoEm } };
    }
    if (r.estado === 'stale') {
      // stale-while-revalidate: responde já e atualiza em segundo plano se o circuito permitir
      if (!breaker.isOpen()) {
        buscarEGravar(consulta, prioridade).catch((err) =>
          logger?.warn?.({ codigoIbge, mesAno, erro: err?.message }, 'Revalidação em segundo plano falhou; cache mantido'),
        );
      }
      return {
        consulta,
        dados: r.entrada.registros,
        meta: { origem: 'cache-desatualizado', atualizadoEm: r.entrada.coletadoEm },
      };
    }
    try {
      const e = await buscarEGravar(consulta, prioridade);
      return { consulta, dados: e.registros, meta: { origem: 'api', atualizadoEm: e.coletadoEm } };
    } catch (err) {
      const mapeado = mapearErro(err, breaker);
      logger?.warn?.({ codigoIbge, mesAno, codigo: mapeado.codigo }, 'Falha ao obter dados e sem cache disponível');
      throw mapeado;
    }
  }

  const PRIORIDADE_ORIGEM = ['cache', 'api', 'cache-desatualizado'];

  async function consultarSerie({ codigoIbge, de, ate }) {
    const v = validarCodigoIbge(codigoIbge);
    if (!v.ok) throw codigoIbgeInvalido(v.motivo);
    for (const m of [de, ate]) {
      const r = validarMesAno(m, now());
      if (!r.ok) throw mesAnoInvalido(r.motivo);
    }
    let meses;
    try {
      meses = intervaloMeses(de, ate);
    } catch (e) {
      throw mesAnoInvalido(e.message);
    }
    if (!municipios.existe(codigoIbge)) throw municipioNaoEncontrado(codigoIbge);

    const dados = [];
    let origem = modo === 'mock' ? 'mock' : 'cache';
    let atualizadoEm = null;
    for (const mesAno of meses) {
      const r = await consultarMes({ codigoIbge, mesAno });
      dados.push(...r.dados);
      if (modo !== 'mock' && PRIORIDADE_ORIGEM.indexOf(r.meta.origem) > PRIORIDADE_ORIGEM.indexOf(origem)) origem = r.meta.origem;
      if (!atualizadoEm || r.meta.atualizadoEm < atualizadoEm) atualizadoEm = r.meta.atualizadoEm;
    }
    return { consulta: { codigoIbge, de, ate, meses: meses.length }, dados, meta: { origem, atualizadoEm } };
  }

  return {
    consultarMes,
    consultarSerie,
    invalidar({ codigoIbge, mesAno }) {
      if (codigoIbge && mesAno) return cache.delete(chaveRepasse(codigoIbge, mesAno)) ? 1 : 0;
      return cache.clear();
    },
    stats: () => ({ ultimaColeta }),
  };
}
