export interface MensagemErro {
  titulo: string;
  mensagem: string;
  acao: string;
}

const MENSAGENS: Record<string, MensagemErro> = {
  CODIGO_IBGE_INVALIDO: {
    titulo: 'Código do município inválido',
    mensagem: 'O código IBGE informado não é válido.',
    acao: 'Escolha um município na lista ou digite um código de 7 dígitos correto.',
  },
  MES_ANO_INVALIDO: {
    titulo: 'Período inválido',
    mensagem: 'O mês/ano informado não é aceito pela consulta.',
    acao: 'Revise o período: sem meses futuros e com no máximo 36 meses.',
  },
  MUNICIPIO_NAO_ENCONTRADO: {
    titulo: 'Município não encontrado',
    mensagem: 'A API não tem dados cadastrados para este município.',
    acao: 'Escolha outro município. No modo de demonstração nem todos os municípios estão disponíveis.',
  },
  API_INDISPONIVEL: {
    titulo: 'Fonte de dados indisponível',
    mensagem: 'O Portal da Transparência não respondeu no momento.',
    acao: 'Aguarde um pouco e tente novamente.',
  },
  RATE_LIMIT_EXTERNO: {
    titulo: 'Muitas consultas em pouco tempo',
    mensagem: 'O limite de consultas ao Portal da Transparência foi atingido.',
    acao: 'Aguarde alguns instantes e tente novamente.',
  },
  RESPOSTA_INVALIDA: {
    titulo: 'Resposta inesperada',
    mensagem: 'Os dados recebidos não estão no formato esperado.',
    acao: 'Tente novamente. Se o problema persistir, avise a equipe responsável.',
  },
  CHAVE_API_AUSENTE_OU_INVALIDA: {
    titulo: 'Acesso à fonte de dados não configurado',
    mensagem: 'A chave de acesso da API ao Portal da Transparência está ausente ou é inválida.',
    acao: 'Avise a equipe responsável pela API.',
  },
  FALHA_REDE: {
    titulo: 'Sem conexão com a API',
    mensagem: 'Não foi possível conectar ao servidor de dados.',
    acao: 'Verifique sua conexão e se a API está em execução e tente novamente.',
  },
  TIMEOUT: {
    titulo: 'A consulta demorou demais',
    mensagem: 'O servidor não respondeu a tempo.',
    acao: 'Tente novamente ou reduza o período consultado.',
  },
};

const GENERICO: MensagemErro = {
  titulo: 'Não foi possível carregar os dados',
  mensagem: 'Ocorreu um erro inesperado.',
  acao: 'Tente novamente em instantes.',
};

export function mensagemDeErro(codigo: string | null | undefined): MensagemErro {
  return (codigo ? MENSAGENS[codigo] : undefined) ?? GENERICO;
}

/** Texto "tente novamente às HH:MM" a partir do ISO devolvido pela API; null se ausente/inválido. */
export function textoTentarNovamente(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `Tente novamente a partir das ${hora}.`;
}
