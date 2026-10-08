import test from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../src/resilience/retry.js';
import { createPortalClient } from '../src/clients/portalTransparenciaClient.js';
import { ExternalError } from '../src/domain/errors.js';
import { dto } from './helpers.js';

const resp = (status, body, headers = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });

function clienteCom(respostas) {
  const chamadas = [];
  const fetchImpl = async (url, init) => {
    chamadas.push({ url, init });
    const r = respostas.shift();
    if (r instanceof Error) throw r;
    return r;
  };
  return { client: createPortalClient({ apiKey: 'k', fetchImpl, timeoutMs: 50 }), chamadas };
}
const opts = (extra = {}) => ({ attempts: 3, baseMs: 1000, jitterMs: 500, sleep: async () => {}, random: () => 0.5, ...extra });
const tentar = (client) => withRetry(() => client.buscarMes({ codigoIbge: '4214805', mesAno: '202401' }), opts());

test('503,503,200 sucede na 3ª tentativa', async () => {
  const { client, chamadas } = clienteCom([resp(503, 'x'), resp(503, 'x'), resp(200, [dto()]), resp(200, [])]);
  const r = await tentar(client);
  assert.equal(r.dtos.length, 1);
  assert.equal(chamadas.filter((c) => c.url.includes('pagina=1')).length, 3);
  assert.equal(chamadas[0].init.headers['chave-api-dados'], 'k');
});

test('401 não repete', async () => {
  const { client, chamadas } = clienteCom([resp(401, '{"Erro na API":"Chave"}')]);
  await assert.rejects(tentar(client), (e) => e.tipo === 'CHAVE');
  assert.equal(chamadas.length, 1);
});

test('400 não repete; esgotar retries propaga erro', async () => {
  const a = clienteCom([resp(400, 'x')]);
  await assert.rejects(tentar(a.client), (e) => e.tipo === 'CLIENTE');
  assert.equal(a.chamadas.length, 1);
  const b = clienteCom([resp(500, 'x'), resp(500, 'x'), resp(500, 'x')]);
  await assert.rejects(tentar(b.client), (e) => e.retryable === true);
  assert.equal(b.chamadas.length, 3);
});

test('429 respeita Retry-After', async () => {
  const esperas = [];
  const { client } = clienteCom([resp(429, 'x', { 'retry-after': '7' }), resp(200, []), resp(200, [])]);
  await withRetry(() => client.buscarMes({ codigoIbge: '4214805', mesAno: '202401' }), opts({ sleep: async (ms) => esperas.push(ms) }));
  assert.deepEqual(esperas, [7000]);
});

test('backoff exponencial com jitter e teto de 30s', async () => {
  const esperas = [];
  const falha = () => Promise.reject(new ExternalError('REDE', 'x', { retryable: true }));
  await assert.rejects(withRetry(falha, opts({ attempts: 7, sleep: async (ms) => esperas.push(ms), random: () => 0.5 })));
  assert.deepEqual(esperas, [1250, 2250, 4250, 8250, 16250, 30250]);
});

test('timeout e rede viram erro retryable', async () => {
  const t = Object.assign(new Error('t'), { name: 'TimeoutError' });
  const { client } = clienteCom([t, new TypeError('fetch failed')]);
  await assert.rejects(client.buscarMes({ codigoIbge: '4214805', mesAno: '202401' }), (e) => e.tipo === 'TIMEOUT' && e.retryable);
  await assert.rejects(client.buscarMes({ codigoIbge: '4214805', mesAno: '202401' }), (e) => e.tipo === 'REDE' && e.retryable);
});

test('corpo 200 não-JSON = indisponibilidade (retryable); fora do schema não repete', async () => {
  const a = clienteCom([resp(200, '<html>CDN</html>')]);
  await assert.rejects(a.client.buscarMes({ codigoIbge: '4214805', mesAno: '202401' }), (e) => e.tipo === 'INDISPONIVEL' && e.retryable);
  const b = clienteCom([resp(200, [{ id: 'x' }])]);
  await assert.rejects(b.client.buscarMes({ codigoIbge: '4214805', mesAno: '202401' }), (e) => e.tipo === 'INVALIDA' && !e.retryable);
});
