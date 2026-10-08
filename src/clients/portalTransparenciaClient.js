import { BASE_URL, HEADER_CHAVE, MAX_PAGINAS, programaPorMesAno } from '../config/programas.js';
import { BeneficiosArraySchema } from '../domain/schemas.js';
import { ExternalError, chaveInvalida } from '../domain/errors.js';

const STATUS_INDISPONIVEL = new Set([502, 503, 504]);

function parseRetryAfter(valor, now = Date.now()) {
  if (!valor) return undefined;
  const seg = Number(valor);
  if (Number.isFinite(seg)) return Math.max(0, seg * 1000);
  const data = Date.parse(valor);
  return Number.isNaN(data) ? undefined : Math.max(0, data - now);
}

async function corpoDeErro(res) {
  try {
    return new TextDecoder('iso-8859-1').decode(await res.arrayBuffer()).slice(0, 300);
  } catch {
    return '';
  }
}

export function createPortalClient({ apiKey, fetchImpl = fetch, timeoutMs = 10000, logger, baseUrl = BASE_URL } = {}) {
  async function buscarPagina(endpoint, { codigoIbge, mesAno, pagina }) {
    if (!apiKey) throw chaveInvalida();
    const url = `${baseUrl}/${endpoint}?mesAno=${encodeURIComponent(mesAno)}&codigoIbge=${encodeURIComponent(codigoIbge)}&pagina=${pagina}`;
    let res;
    try {
      res = await fetchImpl(url, {
        headers: { [HEADER_CHAVE]: apiKey, Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const timeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      throw new ExternalError(timeout ? 'TIMEOUT' : 'REDE', timeout ? 'Timeout na API externa' : 'Falha de conexão com a API externa', {
        retryable: true,
      });
    }

    const status = res.status;
    if (status === 401 || status === 403) {
      logger?.error?.({ status, endpoint }, 'CRÍTICO: chave da API do Portal da Transparência ausente ou inválida');
      throw new ExternalError('CHAVE', 'Chave de API ausente ou inválida', { status });
    }
    if (status === 429) {
      throw new ExternalError('RATE_LIMIT', 'Rate limit da API externa', {
        retryable: true,
        status,
        retryAfterMs: parseRetryAfter(res.headers?.get?.('retry-after')),
      });
    }
    if (status === 500 || STATUS_INDISPONIVEL.has(status)) {
      logger?.warn?.({ status, endpoint, corpo: await corpoDeErro(res) }, 'Erro da API externa');
      throw new ExternalError(status === 500 ? 'INTERNO' : 'INDISPONIVEL', `API externa respondeu ${status}`, {
        retryable: true,
        status,
      });
    }
    if (status >= 400) {
      logger?.warn?.({ status, endpoint, corpo: await corpoDeErro(res) }, 'Requisição rejeitada pela API externa');
      throw new ExternalError('CLIENTE', `API externa respondeu ${status}`, { status });
    }

    let json;
    try {
      json = JSON.parse(await res.text());
    } catch {
      throw new ExternalError('INDISPONIVEL', 'Corpo da resposta não é JSON (tratado como indisponibilidade)', {
        retryable: true,
        status,
      });
    }
    const parsed = BeneficiosArraySchema.safeParse(json);
    if (!parsed.success) {
      logger?.error?.(
        { endpoint, issues: parsed.error.issues.slice(0, 5).map((i) => ({ path: i.path.join('.'), message: i.message })) },
        'ALERTA: resposta fora do schema esperado (possível mudança na API)',
      );
      throw new ExternalError('INVALIDA', 'Resposta fora do schema', { status });
    }
    return parsed.data;
  }

  return {
    async buscarMes({ codigoIbge, mesAno }) {
      const { programa, endpoint } = programaPorMesAno(mesAno);
      const dtos = [];
      for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
        const itens = await buscarPagina(endpoint, { codigoIbge, mesAno, pagina });
        if (itens.length === 0) break;
        dtos.push(...itens);
        if (pagina === MAX_PAGINAS) logger?.warn?.({ codigoIbge, mesAno }, 'Limite de páginas atingido');
      }
      return { programa, dtos };
    },
  };
}
