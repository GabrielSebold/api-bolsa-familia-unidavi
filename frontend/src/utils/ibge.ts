/** Espelha src/domain/codigoIbge.js da API. */
const UFS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '21', '22', '23', '24', '25', '26', '27', '28', '29',
  '31', '32', '33', '35', '41', '42', '43', '50', '51', '52', '53',
]);
const PESOS = [1, 2, 1, 2, 1, 2];

export function calcularDvIbge(seis: string): number {
  let soma = 0;
  for (let i = 0; i < 6; i++) {
    const p = Number(seis[i]) * (PESOS[i] ?? 0);
    soma += p > 9 ? p - 9 : p;
  }
  return (10 - (soma % 10)) % 10;
}

export type ResultadoIbge = { ok: true } | { ok: false; motivo: string };

export function validarCodigoIbge(codigo: string): ResultadoIbge {
  if (typeof codigo !== 'string' || !/^\d{7}$/.test(codigo)) {
    return { ok: false, motivo: 'O código deve ter exatamente 7 dígitos numéricos.' };
  }
  if (!UFS.has(codigo.slice(0, 2))) return { ok: false, motivo: 'Os 2 primeiros dígitos não correspondem a uma UF.' };
  if (calcularDvIbge(codigo.slice(0, 6)) !== Number(codigo[6])) {
    return { ok: false, motivo: 'O dígito verificador do código está incorreto.' };
  }
  return { ok: true };
}
