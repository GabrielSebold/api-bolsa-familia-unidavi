import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker } from '../src/resilience/circuitBreaker.js';

const novo = () => {
  const c = { t: 1_000_000 };
  return { c, cb: new CircuitBreaker({ failureThreshold: 5, failureRate: 0.5, windowMs: 60000, openMs: 60000, now: () => c.t }) };
};

test('abre com 5 falhas consecutivas e bloqueia', () => {
  const { cb } = novo();
  for (let i = 0; i < 4; i++) cb.onFailure();
  assert.equal(cb.state(), 'closed');
  cb.onFailure();
  assert.equal(cb.state(), 'open');
  assert.equal(cb.canRequest(), false);
});

test('abre por taxa de falha > 50% na janela', () => {
  const { cb } = novo();
  cb.onSuccess(); cb.onSuccess(); cb.onFailure(); cb.onFailure();
  assert.equal(cb.state(), 'closed'); // 50% não é > 50%
  cb.onFailure();
  assert.equal(cb.state(), 'open');
});

test('semiaberto libera 1 chamada; sucesso fecha', () => {
  const { cb, c } = novo();
  for (let i = 0; i < 5; i++) cb.onFailure();
  c.t += 60000;
  assert.equal(cb.state(), 'half-open');
  assert.equal(cb.canRequest(), true);
  assert.equal(cb.canRequest(), false);
  cb.onSuccess();
  assert.equal(cb.state(), 'closed');
  assert.equal(cb.canRequest(), true);
});

test('falha no semiaberto reabre', () => {
  const { cb, c } = novo();
  for (let i = 0; i < 5; i++) cb.onFailure();
  c.t += 60000;
  assert.equal(cb.canRequest(), true);
  cb.onFailure();
  assert.equal(cb.state(), 'open');
  assert.equal(cb.canRequest(), false);
});
