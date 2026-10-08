export class AppError extends Error {
  constructor(codigo, status, mensagem, { tentarNovamenteEm, retryAfterSeconds } = {}) {
    super(mensagem);
    this.name = 'AppError';
    this.codigo = codigo;
    this.status = status;
    this.tentarNovamenteEm = tentarNovamenteEm;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const codigoIbgeInvalido = (motivo) =>
  new AppError('CODIGO_IBGE_INVALIDO', 400, `Código IBGE inválido: ${motivo}`);
export const mesAnoInvalido = (motivo) => new AppError('MES_ANO_INVALIDO', 400, `Período inválido: ${motivo}`);
export const municipioNaoEncontrado = (codigo) =>
  new AppError('MUNICIPIO_NAO_ENCONTRADO', 404, `Município ${codigo} não encontrado na tabela do IBGE.`);
export const apiIndisponivel = (tentarNovamenteEm = 60) =>
  new AppError('API_INDISPONIVEL', 503, 'Não foi possível obter os dados no momento.', { tentarNovamenteEm });
export const rateLimitExterno = (tentarNovamenteEm = 60) =>
  new AppError('RATE_LIMIT_EXTERNO', 503, 'Limite de requisições da API externa atingido. Tente novamente em instantes.', {
    tentarNovamenteEm,
    retryAfterSeconds: tentarNovamenteEm,
  });
export const respostaInvalida = () =>
  new AppError('RESPOSTA_INVALIDA', 502, 'A API externa retornou dados em formato inesperado.');
export const chaveInvalida = () =>
  new AppError('CHAVE_API_AUSENTE_OU_INVALIDA', 502, 'Falha de configuração na integração com a API externa.');

/** Erro da camada de cliente externo; `retryable` controla o retry. */
export class ExternalError extends Error {
  constructor(tipo, mensagem, { retryable = false, retryAfterMs, status } = {}) {
    super(mensagem);
    this.name = 'ExternalError';
    this.tipo = tipo; // 'REDE' | 'TIMEOUT' | 'RATE_LIMIT' | 'INDISPONIVEL' | 'CHAVE' | 'CLIENTE' | 'INVALIDA'
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
    this.status = status;
  }
}
