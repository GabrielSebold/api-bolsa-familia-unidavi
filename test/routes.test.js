import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { loadEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { calcularDvIbge } from '../src/domain/codigoIbge.js';

const base = { USE_MOCK: 'true', DB_PATH: ':memory:', LOG_LEVEL: 'info' };
const apps = [];
async function criar(extra = {}, overrides = {}) {
  const app = await buildApp({ env: loadEnv({ ...base, ...extra }), overrides });
  apps.push(app);
  return app;
}
after(async () => {
  for (const a of apps) await a.close();
});

test('mês em mock, série e saúde', async () => {
  const app = await criar();
  const r = await app.inject('/api/v1/repasses?codigoIbge=4214805&mesAno=202401');
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().meta.origem, 'mock');
  assert.equal(r.json().dados.length, 1);
  const s = await app.inject('/api/v1/repasses?codigoIbge=4214805&de=202301&ate=202312');
  assert.equal(s.statusCode, 200);
  assert.equal(s.json().dados.length, 12);
  assert.equal((await app.inject('/api/v1/saude')).json().modo, 'mock');
});

test('erros 400 e 404', async () => {
  const app = await criar();
  const get = async (u) => app.inject(u);
  let r = await get('/api/v1/repasses?codigoIbge=1234567&mesAno=202401');
  assert.equal(r.statusCode, 400);
  assert.equal(r.json().erro.codigo, 'CODIGO_IBGE_INVALIDO');
  r = await get('/api/v1/repasses?codigoIbge=4214805&mesAno=202413');
  assert.equal(r.json().erro.codigo, 'MES_ANO_INVALIDO');
  r = await get('/api/v1/repasses?codigoIbge=4214805&de=202001&ate=202412');
  assert.equal(r.statusCode, 400);
  r = await get('/api/v1/repasses?mesAno=202401');
  assert.equal(r.statusCode, 400);
  const seis = '110001'; // UF 11 válida, município fora da tabela local
  r = await get(`/api/v1/repasses?codigoIbge=${seis}${calcularDvIbge(seis)}&mesAno=202401`);
  assert.equal(r.statusCode, 404);
  assert.equal(r.json().erro.codigo, 'MUNICIPIO_NAO_ENCONTRADO');
});

test('/ redireciona e OpenAPI lista as rotas', async () => {
  const app = await criar();
  const r = await app.inject('/');
  assert.equal(r.statusCode, 302);
  assert.equal(r.headers.location, '/docs');
  const j = (await app.inject('/docs/json')).json();
  assert.ok(j.paths['/api/v1/repasses'] && j.paths['/api/v1/saude']);
});

test('DELETE /api/v1/cache: 404 sem ADMIN_TOKEN; 401/200 com', async () => {
  const sem = await criar();
  assert.equal((await sem.inject({ method: 'DELETE', url: '/api/v1/cache' })).statusCode, 404);
  const com = await criar({ ADMIN_TOKEN: 'segredo' });
  assert.equal((await com.inject({ method: 'DELETE', url: '/api/v1/cache' })).statusCode, 401);
  assert.equal((await com.inject({ method: 'DELETE', url: '/api/v1/cache', headers: { 'x-admin-token': 'errado' } })).statusCode, 401);
  const ok = await com.inject({ method: 'DELETE', url: '/api/v1/cache', headers: { 'x-admin-token': 'segredo' } });
  assert.equal(ok.statusCode, 200);
});

test('modo real sem chave -> 502 CHAVE_API_AUSENTE_OU_INVALIDA', async () => {
  const app = await criar({ USE_MOCK: 'false' });
  const r = await app.inject('/api/v1/repasses?codigoIbge=4214805&mesAno=202401');
  assert.equal(r.statusCode, 502);
  assert.equal(r.json().erro.codigo, 'CHAVE_API_AUSENTE_OU_INVALIDA');
});

test('header chave-api-dados é mascarado nos logs', async () => {
  const linhas = [];
  const logStream = new Writable({ write(c, _e, cb) { linhas.push(c.toString()); cb(); } });
  const app = await criar({}, { logStream });
  app.log.info({ headers: { 'chave-api-dados': 'SEGREDO-123' }, apiKey: 'SEGREDO-123' }, 'teste');
  const saida = linhas.join('');
  assert.ok(saida.includes('[REDACTED]'));
  assert.ok(!saida.includes('SEGREDO-123'));
});
