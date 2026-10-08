import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarRegistros, dataParaMesAno } from '../src/domain/normalizer.js';
import { ttlPorIdade } from '../src/cache/cacheManager.js';
import { dto } from './helpers.js';

const opts = { mesAno: '202401', programa: 'NOVO_BOLSA_FAMILIA', coletadoEm: '2024-02-01T00:00:00Z' };

test('normaliza sem arredondar e calcula valorMedio', () => {
  const [r] = normalizarRegistros([dto()], opts);
  assert.equal(r.valor, 1234.567);
  assert.equal(r.valorMedio, 123.4567);
  assert.equal(r.municipio, 'RIO DO SUL');
  assert.equal(r.mesAno, '202401');
});

test('valorMedio é null quando quantidade = 0 (sem divisão por zero)', () => {
  const [r] = normalizarRegistros([dto({ quantidadeBeneficiados: 0, valor: 0 })], opts);
  assert.equal(r.valorMedio, null);
  assert.equal(r.valor, 0);
});

test('deduplica mantendo o maior id', () => {
  const out = normalizarRegistros([dto({ id: 5, valor: 1 }), dto({ id: 9, valor: 2 }), dto({ id: 7, valor: 3 })], opts);
  assert.equal(out.length, 1);
  assert.equal(out[0].origemId, 9);
  assert.equal(out[0].valor, 2);
});

test('datas e lista vazia', () => {
  assert.equal(dataParaMesAno('2024-01-01'), '202401');
  assert.equal(dataParaMesAno('01/03/2024'), '202403');
  assert.equal(dataParaMesAno('lixo'), null);
  assert.deepEqual(normalizarRegistros([], opts), []);
});

test('TTL por idade', () => {
  const now = new Date('2024-06-15T00:00:00Z');
  const H = 3600_000;
  assert.deepEqual(ttlPorIdade('202301', false, now), { l1: 24 * H, l2: 30 * 24 * H });
  assert.deepEqual(ttlPorIdade('202405', false, now), { l1: 6 * H, l2: 3 * 24 * H });
  assert.deepEqual(ttlPorIdade('202406', false, now), { l1: H, l2: 24 * H });
  assert.deepEqual(ttlPorIdade('202301', true, now), { l1: 15 * 60_000, l2: H });
});
