import test from 'node:test';
import assert from 'node:assert/strict';
import { toCSV } from '../src/services/export/csv.js';
import { montarJSON, serializarJSON } from '../src/services/export/json.js';
import { gerarPDF } from '../src/services/export/pdf.js';

const registro = {
  codigoIbge: '4214805', municipio: 'RIO DO SUL', uf: 'SC', mesAno: '202401', programa: 'NOVO_BOLSA_FAMILIA',
  tipo: { id: 1, descricao: 'Benefício, "especial"' }, valor: 1000.25, quantidadeBeneficiados: 2,
  valorMedio: 500.125, origemId: 'ABC-1', coletadoEm: '2026-10-08T23:24:35.228Z',
};

test('CSV preserva BOM, números, campos vazios e escapa texto acentuado/quotes', () => {
  const csv = toCSV([{ ...registro, tipo: { id: 1, descricao: 'Ação, "especial"' }, valorMedio: null }]);
  assert.ok(csv.startsWith('\uFEFFCódigo IBGE,Município'));
  assert.match(csv, /Ação, ""especial""/);
  assert.match(csv, /,1000\.25,2,,ABC-1,/);
  const excel = toCSV([registro], { excel: true });
  assert.ok(excel.startsWith('\uFEFFCódigo IBGE;Município'));
  assert.match(excel, /1000,25/);
});

test('JSON mantém shape e valores numéricos', () => {
  const json = JSON.parse(serializarJSON(montarJSON({ consulta: { codigoIbge: '4214805' }, escopo: 'filtrado', filtros: { programa: ['NOVO_BOLSA_FAMILIA'] }, dados: [{ ...registro, email: 'nao-exportar@example.com', token: 'segredo' }], meta: { origem: 'mock', atualizadoEm: '2026-10-08' }, geradoEm: '2026-10-09' })));
  assert.equal(json.dados[0].valor, 1000.25);
  assert.equal(json.dados[0].tipo.descricao, 'Benefício, "especial"');
  assert.equal(json.quantidadeRegistros, 1);
  assert.equal(json.meta.origem, 'mock');
  assert.equal(json.dados[0].email, undefined);
  assert.equal(json.dados[0].token, undefined);
});

test('PDF contém estrutura válida, identificação mock e tabela dos registros', () => {
  const pdf = gerarPDF({ dados: [registro], consulta: { codigoIbge: '4214805', de: '202401', ate: '202401' }, meta: { origem: 'mock' }, geradoEm: '2026-10-09T12:00:00.000Z' });
  const text = pdf.toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.match(text, /xref\n/);
  assert.ok(text.includes(Buffer.from('DADOS SIMULADOS', 'latin1').toString('hex').toUpperCase()));
  assert.ok(!text.includes(Buffer.from('NOVO_BOLSA_FAMILIA', 'latin1').toString('hex').toUpperCase()));
  assert.ok(text.includes(Buffer.from('DADOS BRUTOS DA SÉRIE COMPLETA', 'latin1').toString('hex').toUpperCase()));
  const filtered = gerarPDF({ dados: [registro], consulta: { codigoIbge: '4214805', de: '202401', ate: '202401' }, meta: { origem: 'mock' }, escopo: 'filtrado', geradoEm: '2026-10-09T12:00:00.000Z' }).toString('latin1');
  assert.ok(filtered.includes(Buffer.from('DADOS FILTRADOS PELO PERÍODO SELECIONADO', 'latin1').toString('hex').toUpperCase()));
  assert.match(text, /startxref/);
});
