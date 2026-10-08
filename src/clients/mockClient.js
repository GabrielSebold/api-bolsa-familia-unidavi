import { createHash } from 'node:crypto';
import { programaPorMesAno } from '../config/programas.js';
import { mesAnoAtual } from '../domain/mesAno.js';

const NOMES_TIPO = { BOLSA_FAMILIA: 'Bolsa Família', AUXILIO_BRASIL: 'Auxílio Brasil', NOVO_BOLSA_FAMILIA: 'Novo Bolsa Família' };

function semente(texto) {
  return createHash('sha256').update(texto).digest().readUInt32BE(0);
}

/** Cliente fictício determinístico, mesma interface do cliente real. Dados NÃO são reais. */
export function createMockClient({ buscarMunicipio = () => null, now = () => new Date() } = {}) {
  return {
    async buscarMes({ codigoIbge, mesAno }) {
      const { programa } = programaPorMesAno(mesAno);
      if (mesAno > mesAnoAtual(now())) return { programa, dtos: [] };
      const s = semente(`${codigoIbge}${mesAno}`);
      const quantidade = 1000 + (s % 20000);
      const valor = Number((quantidade * (600 + (s % 150)) + (s % 100) / 100).toFixed(2));
      const mun = buscarMunicipio(codigoIbge) ?? { nome: `MUNICIPIO ${codigoIbge}`, uf: 'XX' };
      return {
        programa,
        dtos: [
          {
            id: 1_000_000 + (s % 900000),
            dataReferencia: `${mesAno.slice(0, 4)}-${mesAno.slice(4)}-01`,
            municipio: {
              codigoIBGE: codigoIbge,
              nomeIBGE: mun.nome.toUpperCase(),
              codigoRegiao: '0',
              nomeRegiao: 'MOCK',
              pais: 'BRASIL',
              uf: { sigla: mun.uf, nome: mun.uf },
            },
            tipo: { id: 1, descricao: NOMES_TIPO[programa], descricaoDetalhada: 'DADO FICTÍCIO (MOCK)' },
            valor,
            quantidadeBeneficiados: quantidade,
          },
        ],
      };
    },
  };
}
