import { erroExemplo, erroSchema, metaSchema, registroSchema } from './schemas.js';
import { mesAnoInvalido } from '../domain/errors.js';

const exemploRegistro = {
  codigoIbge: '4214805',
  municipio: 'RIO DO SUL',
  uf: 'SC',
  mesAno: '202401',
  programa: 'NOVO_BOLSA_FAMILIA',
  tipo: { id: 1, descricao: 'Novo Bolsa Família' },
  valor: 12345678.9,
  quantidadeBeneficiados: 20000,
  valorMedio: 617.28394,
  origemId: 1234567,
  coletadoEm: '2024-02-01T12:00:00.000Z',
};

export default async function repassesRoutes(app, { service }) {
  app.get(
    '/api/v1/repasses',
    {
      schema: {
        tags: ['Repasses'],
        summary: 'Repasses do Bolsa Família por município (um mês ou série)',
        description:
          'Informe `codigoIbge` e `mesAno` (um mês) **ou** `codigoIbge`, `de` e `ate` (série mês a mês, máx. 36 meses).',
        querystring: {
          type: 'object',
          required: ['codigoIbge'],
          properties: {
            codigoIbge: { type: 'string', description: 'Código IBGE do município (7 dígitos)', examples: ['4214805'] },
            mesAno: { type: 'string', description: 'Mês no formato AAAAMM', examples: ['202401'] },
            de: { type: 'string', description: 'Início da série (AAAAMM)', examples: ['202301'] },
            ate: { type: 'string', description: 'Fim da série (AAAAMM)', examples: ['202312'] },
          },
        },
        response: {
          200: {
            description: 'Sucesso (lista vazia = mês sem dados)',
            type: 'object',
            properties: {
              consulta: { type: 'object', additionalProperties: true },
              dados: { type: 'array', items: registroSchema },
              meta: metaSchema,
            },
            examples: [
              {
                consulta: { codigoIbge: '4214805', mesAno: '202401' },
                dados: [exemploRegistro],
                meta: { origem: 'api', atualizadoEm: '2024-02-01T12:00:00.000Z' },
              },
            ],
          },
          400: { description: 'Parâmetros inválidos', ...erroSchema, examples: [erroExemplo('CODIGO_IBGE_INVALIDO', 'Código IBGE inválido: dígito verificador incorreto')] },
          404: { description: 'Município não encontrado', ...erroSchema, examples: [erroExemplo('MUNICIPIO_NAO_ENCONTRADO', 'Município 1100015 não encontrado na tabela do IBGE.')] },
          502: { description: 'Falha de configuração ou resposta inválida da API externa', ...erroSchema, examples: [erroExemplo('CHAVE_API_AUSENTE_OU_INVALIDA', 'Falha de configuração na integração com a API externa.')] },
          503: { description: 'API externa indisponível e sem cache', ...erroSchema, examples: [erroExemplo('API_INDISPONIVEL', 'Não foi possível obter os dados no momento.', { tentarNovamenteEm: 60 })] },
        },
      },
    },
    async (req) => {
      const { codigoIbge, mesAno, de, ate } = req.query;
      if (mesAno !== undefined) {
        if (de !== undefined || ate !== undefined) throw mesAnoInvalido('use "mesAno" OU "de" e "ate", não ambos');
        return service.consultarMes({ codigoIbge, mesAno });
      }
      if (de !== undefined && ate !== undefined) return service.consultarSerie({ codigoIbge, de, ate });
      throw mesAnoInvalido('informe "mesAno" ou "de" e "ate"');
    },
  );
}
