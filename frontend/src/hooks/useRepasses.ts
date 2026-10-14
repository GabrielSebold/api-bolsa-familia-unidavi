import { useCallback, useEffect, useState } from 'react';
import { ApiError, buscarSerie, isAbortError } from '../services/api';
import type { RespostaSerie } from '../types/api';

export interface ConsultaRepasses {
  codigoIbge: string;
  de: string;
  ate: string;
}

export interface ErroConsulta {
  codigo: string;
  mensagem: string;
  tentarNovamenteEm?: string;
}

export type EstadoRepasses =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; resposta: RespostaSerie }
  | { status: 'empty'; resposta: RespostaSerie }
  | { status: 'error'; erro: ErroConsulta };

export interface UseRepasses {
  estado: EstadoRepasses;
  /** Refaz a consulta atual (botão "Tentar novamente"). */
  retry: () => void;
}

function paraErro(err: unknown): ErroConsulta {
  if (err instanceof ApiError) {
    return {
      codigo: err.codigo,
      mensagem: err.message,
      ...(err.tentarNovamenteEm ? { tentarNovamenteEm: err.tentarNovamenteEm } : {}),
    };
  }
  return { codigo: 'ERRO_DESCONHECIDO', mensagem: err instanceof Error ? err.message : 'Erro inesperado.' };
}

/**
 * Faz uma única chamada de série por consulta. Ao mudar a consulta, cancela a anterior.
 * `consulta = null` → estado `idle` (nenhuma requisição).
 */
export function useRepasses(consulta: ConsultaRepasses | null): UseRepasses {
  const [estado, setEstado] = useState<EstadoRepasses>({ status: consulta ? 'loading' : 'idle' });
  const [tentativa, setTentativa] = useState(0);

  const codigoIbge = consulta?.codigoIbge;
  const de = consulta?.de;
  const ate = consulta?.ate;

  useEffect(() => {
    if (!codigoIbge || !de || !ate) {
      setEstado({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setEstado({ status: 'loading' });
    buscarSerie({ codigoIbge, de, ate, signal: controller.signal })
      .then((resposta) => {
        if (controller.signal.aborted) return;
        setEstado(resposta.dados.length === 0 ? { status: 'empty', resposta } : { status: 'success', resposta });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setEstado({ status: 'error', erro: paraErro(err) });
      });
    return () => controller.abort();
  }, [codigoIbge, de, ate, tentativa]);

  const retry = useCallback(() => setTentativa((n) => n + 1), []);
  return { estado, retry };
}
