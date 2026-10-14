import { useCallback, useEffect, useState } from 'react';
import type { Metrica } from '../types/api';
import { validarCodigoIbge } from '../utils/ibge';
import { periodoPadrao, periodoTemErros, validarPeriodo } from '../utils/periodo';

export const IBGE_PADRAO = '4214805';
export const METRICAS: readonly Metrica[] = ['valor', 'familias', 'valorMedio'];

export interface Filtros {
  ibge: string;
  de: string;
  ate: string;
  ind: Metrica;
}

export interface FiltrosLidos {
  filtros: Filtros;
  /** Mensagens (pt-BR) sobre parâmetros inválidos que foram trocados pelo padrão. */
  avisos: string[];
}

export function filtrosPadrao(hoje: Date = new Date()): Filtros {
  return { ibge: IBGE_PADRAO, ...periodoPadrao(hoje), ind: 'valor' };
}

/** Lê ?ibge&de&ate&ind. Parâmetro ausente → padrão silencioso; inválido → padrão + aviso. */
export function lerFiltros(search: string, hoje: Date = new Date()): FiltrosLidos {
  const q = new URLSearchParams(search);
  const padrao = filtrosPadrao(hoje);
  const avisos: string[] = [];
  const filtros: Filtros = { ...padrao };

  const ibge = q.get('ibge');
  if (ibge !== null) {
    if (validarCodigoIbge(ibge).ok) filtros.ibge = ibge;
    else avisos.push('O código do município do link é inválido. Foi usado o município padrão.');
  }

  const de = q.get('de');
  const ate = q.get('ate');
  if (de !== null || ate !== null) {
    const candidato = { de: de ?? padrao.de, ate: ate ?? padrao.ate };
    if (!periodoTemErros(validarPeriodo(candidato, hoje))) {
      filtros.de = candidato.de;
      filtros.ate = candidato.ate;
    } else {
      avisos.push('O período do link é inválido. Foi usado o período padrão.');
    }
  }

  const ind = q.get('ind');
  if (ind !== null) {
    if ((METRICAS as readonly string[]).includes(ind)) filtros.ind = ind as Metrica;
    else avisos.push('O indicador do link é inválido. Foi usado o valor repassado.');
  }

  return { filtros, avisos };
}

export function filtrosParaQuery(f: Filtros): string {
  return new URLSearchParams({ ibge: f.ibge, de: f.de, ate: f.ate, ind: f.ind }).toString();
}

export interface UseFiltrosUrl {
  filtros: Filtros;
  avisos: string[];
  /** Atualiza o estado e grava na URL (pushState). */
  aplicar: (novos: Filtros) => void;
  restaurarPadrao: () => void;
  dispensarAvisos: () => void;
}

export function useFiltrosUrl(): UseFiltrosUrl {
  const [lido, setLido] = useState<FiltrosLidos>(() => lerFiltros(window.location.search));

  useEffect(() => {
    const aoNavegar = () => setLido(lerFiltros(window.location.search));
    window.addEventListener('popstate', aoNavegar);
    return () => window.removeEventListener('popstate', aoNavegar);
  }, []);

  const aplicar = useCallback((novos: Filtros) => {
    const query = `?${filtrosParaQuery(novos)}`;
    if (query !== window.location.search) window.history.pushState(null, '', query);
    setLido({ filtros: novos, avisos: [] });
  }, []);

  const restaurarPadrao = useCallback(() => aplicar(filtrosPadrao()), [aplicar]);
  const dispensarAvisos = useCallback(() => setLido((l) => ({ ...l, avisos: [] })), []);

  return { filtros: lido.filtros, avisos: lido.avisos, aplicar, restaurarPadrao, dispensarAvisos };
}
