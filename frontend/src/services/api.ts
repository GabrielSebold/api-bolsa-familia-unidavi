import type { ErroApiCorpo, RespostaSerie } from '../types/api';
import { API_URL, TIMEOUT_API_MS } from './config';

export class ApiError extends Error {
  readonly codigo: string;
  readonly tentarNovamenteEm: string | undefined;
  readonly http: number | undefined;

  constructor(codigo: string, mensagem: string, opcoes: { tentarNovamenteEm?: string; http?: number } = {}) {
    super(mensagem);
    this.name = 'ApiError';
    this.codigo = codigo;
    this.tentarNovamenteEm = opcoes.tentarNovamenteEm;
    this.http = opcoes.http;
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function corpoErro(json: unknown): ErroApiCorpo['erro'] | null {
  if (!ehObjeto(json) || !ehObjeto(json.erro)) return null;
  const { codigo, mensagem, tentarNovamenteEm } = json.erro;
  if (typeof codigo !== 'string') return null;
  return {
    codigo,
    mensagem: typeof mensagem === 'string' ? mensagem : '',
    ...(typeof tentarNovamenteEm === 'string' ? { tentarNovamenteEm } : {}),
  };
}

function ehRespostaSerie(json: unknown): json is RespostaSerie {
  return (
    ehObjeto(json) &&
    ehObjeto(json.consulta) &&
    Array.isArray(json.dados) &&
    ehObjeto(json.meta) &&
    typeof json.meta.origem === 'string' &&
    typeof json.meta.atualizadoEm === 'string'
  );
}

export interface ParamsSerie {
  codigoIbge: string;
  de: string;
  ate: string;
  signal?: AbortSignal;
}

/**
 * Busca a série de repasses (uma única chamada).
 * Lança `ApiError` para falhas de API/rede/timeout; repassa o AbortError quando o próprio usuário cancela.
 */
export async function buscarSerie({ codigoIbge, de, ate, signal }: ParamsSerie): Promise<RespostaSerie> {
  const params = new URLSearchParams({ codigoIbge, de, ate });
  const url = `${API_URL}/api/v1/repasses?${params.toString()}`;
  const timeout = AbortSignal.timeout(TIMEOUT_API_MS);
  const combinado = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let res: Response;
  try {
    res = await fetch(url, { signal: combinado, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (timeout.aborted) throw new ApiError('TIMEOUT', 'A consulta demorou mais do que o esperado.');
    if (err instanceof TypeError) throw new ApiError('FALHA_REDE', 'Não foi possível conectar à API.');
    throw err;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    if (signal?.aborted) throw err;
    if (timeout.aborted) throw new ApiError('TIMEOUT', 'A consulta demorou mais do que o esperado.');
    throw new ApiError('RESPOSTA_INVALIDA', 'A API devolveu uma resposta que não é JSON.', { http: res.status });
  }

  if (!res.ok) {
    const erro = corpoErro(json);
    if (erro) {
      throw new ApiError(erro.codigo, erro.mensagem, {
        http: res.status,
        ...(erro.tentarNovamenteEm ? { tentarNovamenteEm: erro.tentarNovamenteEm } : {}),
      });
    }
    throw new ApiError('RESPOSTA_INVALIDA', `A API respondeu com status ${res.status} em formato inesperado.`, {
      http: res.status,
    });
  }

  if (!ehRespostaSerie(json)) {
    throw new ApiError('RESPOSTA_INVALIDA', 'A resposta da API não está no formato esperado.', { http: res.status });
  }
  return json;
}
