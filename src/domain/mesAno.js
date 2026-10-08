export const MAX_MESES_SERIE = 36;

export function mesAnoAtual(now = new Date()) {
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function validarMesAno(valor, now = new Date()) {
  if (typeof valor !== 'string' || !/^\d{6}$/.test(valor)) {
    return { ok: false, motivo: 'use o formato AAAAMM (ex.: 202401)' };
  }
  const ano = Number(valor.slice(0, 4));
  const mes = Number(valor.slice(4));
  if (mes < 1 || mes > 12) return { ok: false, motivo: 'mês deve estar entre 01 e 12' };
  if (ano < 2000) return { ok: false, motivo: 'ano anterior a 2000' };
  if (valor > mesAnoAtual(now)) return { ok: false, motivo: 'período no futuro' };
  return { ok: true };
}

function indice(mesAno) {
  return Number(mesAno.slice(0, 4)) * 12 + (Number(mesAno.slice(4)) - 1);
}
function deIndice(i) {
  const ano = Math.floor(i / 12);
  return `${ano}${String((i % 12) + 1).padStart(2, '0')}`;
}

export function somarMeses(mesAno, n) {
  return deIndice(indice(mesAno) + n);
}

/** Lista de AAAAMM de `de` até `ate` (inclusive). Lança Error se de>ate ou >36 meses. */
export function intervaloMeses(de, ate) {
  const a = indice(de);
  const b = indice(ate);
  if (a > b) throw new RangeError('"de" deve ser menor ou igual a "ate"');
  if (b - a + 1 > MAX_MESES_SERIE) throw new RangeError(`intervalo máximo de ${MAX_MESES_SERIE} meses`);
  const out = [];
  for (let i = a; i <= b; i++) out.push(deIndice(i));
  return out;
}

/** Idade em meses do mês consultado em relação a `now` (mês corrente = 0). */
export function idadeEmMeses(mesAno, now = new Date()) {
  return indice(mesAnoAtual(now)) - indice(mesAno);
}
