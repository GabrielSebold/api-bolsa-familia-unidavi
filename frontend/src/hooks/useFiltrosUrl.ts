import { useCallback, useEffect, useState } from 'react';
import type { Metrica } from '../types/api';
import { validarCodigoIbge } from '../utils/ibge';
import { periodoPadrao, periodoTemErros, validarPeriodo } from '../utils/periodo';

export const METRICAS: readonly Metrica[] = ['valor', 'familias', 'valorMedio'];

/** Abas do painel: Visão geral, Gráficos e Tabela. */
export type Aba = 'visao' | 'graficos' | 'tabela';
export const ABAS: readonly Aba[] = ['visao', 'graficos', 'tabela'];

export interface Filtros {
  /** Código IBGE do município; null enquanto nenhum município foi escolhido. */
  ibge: string | null;
  de: string;
  ate: string;
  ind: Metrica;
  aba: Aba;
}

export interface FiltrosLidos {
  filtros: Filtros;
  /** Mensagens (pt-BR) sobre parâmetros inválidos que foram trocados pelo padrão. */
  avisos: string[];
}

export function filtrosPadrao(hoje: Date = new Date()): Filtros {
  return { ibge: null, ...periodoPadrao(hoje), ind: 'valor', aba: 'visao' };
}

/**
 * Lê ?ibge (alias ?codigoIbge) &de&ate&ind&aba. Parâmetro ausente → padrão silencioso; inválido → padrão + aviso.
 * Sem município na URL, nenhum município fica selecionado.
 */
export function lerFiltros(search: string, hoje: Date = new Date()): FiltrosLidos {
  const q = new URLSearchParams(search);
  const padrao = filtrosPadrao(hoje);
  const avisos: string[] = [];
  const filtros: Filtros = { ...padrao };

  const ibge = q.get('ibge') ?? q.get('codigoIbge');
  if (ibge !== null) {
    if (validarCodigoIbge(ibge).ok) filtros.ibge = ibge;
    else avisos.push('O código do município do link é inválido. Escolha um município nos filtros.');
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

  const aba = q.get('aba');
  if (aba !== null) {
    if ((ABAS as readonly string[]).includes(aba)) filtros.aba = aba as Aba;
    else avisos.push('A aba do link é inválida. Foi aberta a Visão geral.');
  }

  return { filtros, avisos };
}

/**
 * Query string dos filtros; vazia sem município (não há consulta a compartilhar).
 * A aba só entra quando não é a Visão geral, então os links antigos continuam iguais.
 */
export function filtrosParaQuery(f: Filtros): string {
  if (f.ibge === null) return '';
  const q = new URLSearchParams({ ibge: f.ibge, de: f.de, ate: f.ate, ind: f.ind });
  if (f.aba !== 'visao') q.set('aba', f.aba);
  return q.toString();
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
    const query = filtrosParaQuery(novos);
    const alvo = query ? `?${query}` : '';
    if (alvo !== window.location.search) window.history.pushState(null, '', query ? alvo : window.location.pathname);
    setLido({ filtros: novos, avisos: [] });
  }, []);

  const restaurarPadrao = useCallback(() => aplicar(filtrosPadrao()), [aplicar]);
  const dispensarAvisos = useCallback(() => setLido((l) => ({ ...l, avisos: [] })), []);

  return { filtros: lido.filtros, avisos: lido.avisos, aplicar, restaurarPadrao, dispensarAvisos };
}
