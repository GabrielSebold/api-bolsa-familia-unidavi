const UFS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '21', '22', '23', '24', '25', '26', '27', '28', '29',
  '31', '32', '33', '35', '41', '42', '43', '50', '51', '52', '53',
]);
const PESOS = [1, 2, 1, 2, 1, 2];

export function calcularDvIbge(seis) {
  let soma = 0;
  for (let i = 0; i < 6; i++) {
    const p = Number(seis[i]) * PESOS[i];
    soma += p > 9 ? p - 9 : p;
  }
  return (10 - (soma % 10)) % 10;
}

export function validarCodigoIbge(codigo) {
  if (typeof codigo !== 'string' || !/^\d{7}$/.test(codigo)) {
    return { ok: false, motivo: 'deve conter exatamente 7 dígitos numéricos' };
  }
  if (!UFS.has(codigo.slice(0, 2))) return { ok: false, motivo: 'UF inexistente nos 2 primeiros dígitos' };
  if (calcularDvIbge(codigo.slice(0, 6)) !== Number(codigo[6])) {
    return { ok: false, motivo: 'dígito verificador incorreto' };
  }
  return { ok: true };
}
