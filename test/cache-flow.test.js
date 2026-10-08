import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CacheL2 } from '../src/cache/cacheL2.js';
import { CacheL1 } from '../src/cache/cacheL1.js';
import { ExternalError } from '../src/domain/errors.js';
import { criarServico, dto, relogio } from './helpers.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bolsa-test-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function clienteFalso(...passos) {
  const f = { chamadas: 0 };
  f.buscarMes = async () => {
    f.chamadas++;
    const p = passos.length > 1 ? passos.shift() : passos[0];
    if (p instanceof Error) throw p;
    return { programa: 'NOVO_BOLSA_FAMILIA', dtos: p };
  };
  return f;
}
const q = { codigoIbge: '4214805', mesAno: '202401' };
const H = 3600_000;

test('miss -> api, depois hit -> cache', async () => {
  const client = clienteFalso([dto()]);
  const { service } = criarServico({ client });
  assert.equal((await service.consultarMes(q)).meta.origem, 'api');
  const r = await service.consultarMes(q);
  assert.equal(r.meta.origem, 'cache');
  assert.equal(r.dados[0].valor, 1234.567);
  assert.equal(client.chamadas, 1);
});

test('expirado + API falhando -> cache-desatualizado; sem cache -> 503', async () => {
  const falha = new ExternalError('INDISPONIVEL', 'x', { retryable: true });
  const client = clienteFalso([dto()], falha);
  const { service, clock } = criarServico({ client });
  await service.consultarMes(q);
  clock.avancar(31 * 24 * H);
  const r = await service.consultarMes(q);
  assert.equal(r.meta.origem, 'cache-desatualizado');
  assert.equal(r.dados.length, 1);

  const { service: s2 } = criarServico({ client: clienteFalso(falha) });
  await assert.rejects(s2.consultarMes(q), (e) => e.codigo === 'API_INDISPONIVEL' && e.status === 503 && e.tentarNovamenteEm === 60);
});

test('resposta inválida não sobrescreve cache válido', async () => {
  const invalida = new ExternalError('INVALIDA', 'schema');
  const client = clienteFalso([dto({ valor: 10 })], invalida);
  const { service, clock } = criarServico({ client });
  await service.consultarMes(q);
  clock.avancar(31 * 24 * H);
  await service.consultarMes(q); // stale + revalidação em segundo plano (falha)
  await new Promise((r) => setImmediate(r));
  const r = await service.consultarMes(q);
  assert.equal(r.dados[0].valor, 10);
  assert.equal(r.meta.origem, 'cache-desatualizado');
});

test('resposta [] = 200 lista vazia (cache negativo)', async () => {
  const client = clienteFalso([]);
  const { service } = criarServico({ client });
  const r1 = await service.consultarMes(q);
  assert.deepEqual(r1.dados, []);
  const r2 = await service.consultarMes(q);
  assert.equal(r2.meta.origem, 'cache');
  assert.equal(client.chamadas, 1);
});

test('coalescing: chamadas simultâneas = 1 chamada ao cliente', async () => {
  const client = clienteFalso([dto()]);
  const { service } = criarServico({ client });
  const [a, b] = await Promise.all([service.consultarMes(q), service.consultarMes(q)]);
  assert.equal(a.dados.length, 1);
  assert.equal(b.dados.length, 1);
  assert.equal(client.chamadas, 1);
});

test('L2 (arquivo) persiste após recriar L1', async () => {
  const file = path.join(tmp, 'c.sqlite');
  const clock = relogio();
  const c1 = clienteFalso([dto()]);
  const a = criarServico({ client: c1, clock, l2: new CacheL2(file) });
  await a.service.consultarMes(q);
  a.l2.close();
  const c2 = clienteFalso([dto({ valor: 999 })]);
  const b = criarServico({ client: c2, clock, l2: new CacheL2(file), l1: new CacheL1() });
  const r = await b.service.consultarMes(q);
  assert.equal(r.meta.origem, 'cache');
  assert.equal(r.dados[0].valor, 1234.567);
  assert.equal(c2.chamadas, 0);
  b.l2.close();
});

test('município inexistente -> 404 e IBGE inválido -> 400, sem chamar o cliente', async () => {
  const client = clienteFalso([dto()]);
  const { service } = criarServico({ client });
  await assert.rejects(service.consultarMes({ codigoIbge: '4214806', mesAno: '202401' }), (e) => e.status === 400);
  await assert.rejects(service.consultarMes({ codigoIbge: '1100015', mesAno: '202401' }), (e) => e.status === 404);
  assert.equal(client.chamadas, 0);
});
