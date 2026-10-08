// Mapeamento período -> endpoint/programa. ITEM A VALIDAR com chave real (spec 2.6.2).
export const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';
export const HEADER_CHAVE = 'chave-api-dados';
export const MAX_PAGINAS = 20;

export function programaPorMesAno(mesAno) {
  const n = Number(mesAno);
  if (n <= 202110) return { programa: 'BOLSA_FAMILIA', endpoint: 'bolsa-familia-por-municipio' };
  if (n <= 202302) return { programa: 'AUXILIO_BRASIL', endpoint: 'auxilio-brasil-por-municipio' };
  return { programa: 'NOVO_BOLSA_FAMILIA', endpoint: 'novo-bolsa-familia-por-municipio' };
}
