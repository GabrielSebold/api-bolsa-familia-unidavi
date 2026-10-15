import test from 'node:test';
import assert from 'node:assert/strict';
import { validarCodigoIbge } from '../src/domain/codigoIbge.js';
import { validarMesAno, intervaloMeses } from '../src/domain/mesAno.js';

test('códigos IBGE reais são válidos', () => {
  for (const c of ['4214805', '4202404', '3550308', '3304557', '5300108', '4106902', '2927408']) {
    assert.equal(validarCodigoIbge(c).ok, true, c);
  }
});

test('códigos IBGE inválidos', () => {
  for (const c of ['4214806', '421480', '42148055', 'abcdefg', '9914805', '', '42 4805']) {
    assert.equal(validarCodigoIbge(c).ok, false, c);
  }
});

test('mesAno', () => {
  const now = new Date('2024-06-15T00:00:00Z');
  assert.equal(validarMesAno('202401', now).ok, true);
  assert.equal(validarMesAno('202406', now).ok, true);
  for (const v of ['202413', '202400', '20241', '2024-01', '202407', '199912']) {
    assert.equal(validarMesAno(v, now).ok, false, v);
  }
});

test('intervaloMeses: limites', () => {
  assert.equal(intervaloMeses('202301', '202312').length, 12);
  assert.equal(intervaloMeses('202101', '202312').length, 36);
  assert.throws(() => intervaloMeses('202101', '202401'), RangeError);
  assert.throws(() => intervaloMeses('202402', '202401'), RangeError);
});
