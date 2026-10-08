export const erroSchema = {
  type: 'object',
  properties: {
    erro: {
      type: 'object',
      properties: {
        codigo: { type: 'string' },
        mensagem: { type: 'string' },
        tentarNovamenteEm: { type: 'integer', description: 'Segundos até uma nova tentativa' },
      },
    },
  },
};

export const erroExemplo = (codigo, mensagem, extra = {}) => ({ erro: { codigo, mensagem, ...extra } });

export const metaSchema = {
  type: 'object',
  properties: {
    origem: { type: 'string', enum: ['api', 'cache', 'cache-desatualizado', 'mock'] },
    atualizadoEm: { type: 'string', format: 'date-time' },
  },
};

export const registroSchema = {
  type: 'object',
  properties: {
    codigoIbge: { type: 'string' },
    municipio: { type: 'string' },
    uf: { type: 'string' },
    mesAno: { type: 'string' },
    programa: { type: 'string', enum: ['BOLSA_FAMILIA', 'AUXILIO_BRASIL', 'NOVO_BOLSA_FAMILIA'] },
    tipo: { type: 'object', properties: { id: { type: 'integer' }, descricao: { type: 'string' } } },
    valor: { type: 'number', description: 'Valor repassado no mês (R$), sem arredondamento' },
    quantidadeBeneficiados: { type: 'integer' },
    valorMedio: { type: 'number', nullable: true, description: 'valor / quantidadeBeneficiados; null se quantidade = 0' },
    origemId: { type: 'integer' },
    coletadoEm: { type: 'string', format: 'date-time' },
  },
};
