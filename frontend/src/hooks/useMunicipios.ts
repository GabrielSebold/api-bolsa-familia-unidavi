import { useEffect, useState } from 'react';
import { MUNICIPIOS_FALLBACK, carregarMunicipios, type FonteMunicipios } from '../services/municipios';
import type { Municipio } from '../types/api';

export interface UseMunicipios {
  municipios: readonly Municipio[];
  carregando: boolean;
  /** null enquanto carrega. 'cache-vencido' e 'embutida' indicam lista possivelmente incompleta. */
  fonte: FonteMunicipios | null;
}

export function useMunicipios(): UseMunicipios {
  const [estado, setEstado] = useState<UseMunicipios>({
    municipios: MUNICIPIOS_FALLBACK,
    carregando: true,
    fonte: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    carregarMunicipios(controller.signal)
      .then(({ municipios, fonte }) => {
        if (!controller.signal.aborted) setEstado({ municipios, carregando: false, fonte });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setEstado({ municipios: MUNICIPIOS_FALLBACK, carregando: false, fonte: 'embutida' });
        }
      });
    return () => controller.abort();
  }, []);

  return estado;
}
