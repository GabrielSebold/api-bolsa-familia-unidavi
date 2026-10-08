import { CacheL1 } from '../src/cache/cacheL1.js';
import { CacheL2 } from '../src/cache/cacheL2.js';
import { CacheManager } from '../src/cache/cacheManager.js';
import { createRepassesService } from '../src/services/repassesService.js';
import { createMunicipiosService } from '../src/services/municipiosService.js';
import { CircuitBreaker } from '../src/resilience/circuitBreaker.js';
import { RateLimiter } from '../src/resilience/rateLimiter.js';
import { Coalescer } from '../src/resilience/coalescer.js';
import { SuccessMetrics } from '../src/resilience/successMetrics.js';

export const relogio = (inicio = '2024-06-15T12:00:00Z') => {
  const r = { t: new Date(inicio).getTime(), now: () => new Date(r.t), avancar: (ms) => (r.t += ms) };
  return r;
};

export const dto = (over = {}) => ({
  id: 1,
  dataReferencia: '2024-01-01',
  municipio: { codigoIBGE: '4214805', nomeIBGE: ' RIO DO SUL ', uf: { sigla: 'SC', nome: 'SANTA CATARINA' } },
  tipo: { id: 1, descricao: 'Novo Bolsa Família' },
  valor: 1234.567,
  quantidadeBeneficiados: 10,
  ...over,
});

export function criarServico({ client, clock = relogio(), l2 = new CacheL2(':memory:'), l1 = new CacheL1() } = {}) {
  const cache = new CacheManager({ l1, l2, now: clock.now });
  const municipios = createMunicipiosService({ l2, skipRemote: true });
  const service = createRepassesService({
    modo: 'real',
    cache,
    municipios,
    client,
    breaker: new CircuitBreaker({ now: () => clock.t }),
    limiter: new RateLimiter({ limitPerMin: 1000, now: () => clock.t }),
    coalescer: new Coalescer(),
    metrics: new SuccessMetrics({ now: () => clock.t }),
    now: clock.now,
    retry: { attempts: 3, baseMs: 1, sleep: async () => {}, random: () => 0 },
  });
  return { service, cache, l2, clock };
}
