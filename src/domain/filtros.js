import { filtroInvalido } from './errors.js';

export const PROGRAMAS = ['BOLSA_FAMILIA', 'AUXILIO_BRASIL', 'NOVO_BOLSA_FAMILIA'];

const lista = (v) =>
  v === undefined || v === '' ? [] : String(v).split(',').map((s) => s.trim()).filter(Boolean);

function numero(nome, v) {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw filtroInvalido(`"${nome}" deve ser um número maior ou igual a zero`);
  return n;
}

/** Converte a query string em um objeto de filtros validado (só inclui os filtros informados). */
export function parseFiltros(query = {}) {
  const programa = lista(query.programa).map((p) => p.toUpperCase());
  for (const p of programa) {
    if (!PROGRAMAS.includes(p)) throw filtroInvalido(`programa "${p}" desconhecido (use ${PROGRAMAS.join(', ')})`);
  }
  const tipoId = lista(query.tipoId).map((t) => {
    const n = Number(t);
    if (!Number.isInteger(n)) throw filtroInvalido(`tipoId "${t}" deve ser um número inteiro`);
    return n;
  });
  const valorMin = numero('valorMin', query.valorMin);
  const valorMax = numero('valorMax', query.valorMax);
  if (valorMin !== undefined && valorMax !== undefined && valorMin > valorMax) {
    throw filtroInvalido('"valorMin" não pode ser maior que "valorMax"');
  }
  const filtros = {};
  if (programa.length) filtros.programa = programa;
  if (tipoId.length) filtros.tipoId = tipoId;
  if (valorMin !== undefined) filtros.valorMin = valorMin;
  if (valorMax !== undefined) filtros.valorMax = valorMax;
  return filtros;
}

export const temFiltros = (filtros) => Object.keys(filtros).length > 0;

export function aplicarFiltros(dados, f) {
  return dados.filter(
    (r) =>
      (!f.programa || f.programa.includes(r.programa)) &&
      (!f.tipoId || f.tipoId.includes(r.tipo?.id)) &&
      (f.valorMin === undefined || r.valor >= f.valorMin) &&
      (f.valorMax === undefined || r.valor <= f.valorMax),
  );
}