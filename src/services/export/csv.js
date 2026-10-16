// [cabeçalho, função que extrai o valor, tipo]. Números nunca recebem proteção de fórmula.
export const COLUNAS = [
  ['Código IBGE', (r) => r.codigoIbge, 'texto'],
  ['Município', (r) => r.municipio, 'texto'],
  ['UF', (r) => r.uf, 'texto'],
  ['Mês/Ano (AAAAMM)', (r) => r.mesAno, 'texto'],
  ['Programa', (r) => r.programa, 'texto'],
  ['Tipo (ID)', (r) => r.tipo?.id, 'numero'],
  ['Tipo de benefício', (r) => r.tipo?.descricao, 'texto'],
  ['Valor repassado (R$)', (r) => r.valor, 'numero'],
  ['Beneficiários no mês', (r) => r.quantidadeBeneficiados, 'numero'],
  ['Valor médio (R$)', (r) => r.valorMedio, 'numero'],
  ['Identificador de origem', (r) => r.origemId, 'numero'],
  ['Data da coleta (ISO 8601)', (r) => r.coletadoEm, 'texto'],
];

// Textos que planilhas interpretam como fórmula (CSV injection).
const PERIGOSO = /^[=+\-@\t\r]/;

function celula(valor, tipo, { sep, decimal }) {
  if (valor === null || valor === undefined) return '';
  let s;
  if (tipo === 'numero') {
    if (typeof valor === 'number' && !Number.isFinite(valor)) return '';
    s = String(valor);
    if (decimal !== '.') s = s.replace('.', decimal);
  } else {
    s = String(valor);
    if (PERIGOSO.test(s)) s = `'${s}`;
  }
  if (s.includes(sep) || /["\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Gera o CSV (UTF-8 com BOM, linhas CRLF). Valores numéricos não são arredondados.
 * excel=true: separador ";" e decimal "," (Excel em português do Brasil).
 */
export function toCSV(registros, { excel = false } = {}) {
  const opts = excel ? { sep: ';', decimal: ',' } : { sep: ',', decimal: '.' };
  const linhas = [COLUNAS.map(([nome]) => nome).join(opts.sep)];
  for (const r of registros) {
    linhas.push(COLUNAS.map(([, get, tipo]) => celula(get(r), tipo, opts)).join(opts.sep));
  }
  return `\uFEFF${linhas.join('\r\n')}\r\n`;
}
