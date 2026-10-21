import { useCallback, useEffect, useState } from 'react';

export type PreferenciaTema = 'claro' | 'escuro' | 'contraste' | 'auto';
export type TemaEfetivo = 'claro' | 'escuro' | 'contraste';

export const CHAVE_TEMA = 'bf:tema';
const CONSULTA_ESCURO = '(prefers-color-scheme: dark)';

/** Valida o valor salvo; qualquer valor desconhecido vira 'auto'. */
export function normalizarPreferencia(v: string | null): PreferenciaTema {
  return v === 'claro' || v === 'escuro' || v === 'contraste' || v === 'auto' ? v : 'auto';
}

function lerPreferencia(): PreferenciaTema {
  try {
    return normalizarPreferencia(localStorage.getItem(CHAVE_TEMA));
  } catch {
    // localStorage indisponível
  }
  return 'auto';
}

function sistemaEscuro(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(CONSULTA_ESCURO).matches;
}

function resolver(pref: PreferenciaTema): TemaEfetivo {
  if (pref === 'auto') return sistemaEscuro() ? 'escuro' : 'claro';
  return pref;
}

function aplicar(tema: TemaEfetivo): void {
  const raiz = document.documentElement;
  raiz.setAttribute('data-theme', tema);
  raiz.style.colorScheme = tema === 'claro' ? 'light' : 'dark';
}

export interface UseTema {
  preferencia: PreferenciaTema;
  tema: TemaEfetivo;
  definir: (p: PreferenciaTema) => void;
}

export function useTema(): UseTema {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(lerPreferencia);
  const [tema, setTema] = useState<TemaEfetivo>(() => resolver(lerPreferencia()));

  useEffect(() => {
    const efetivo = resolver(preferencia);
    setTema(efetivo);
    aplicar(efetivo);
    if (preferencia !== 'auto' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(CONSULTA_ESCURO);
    const aoMudar = () => {
      const novo = resolver('auto');
      setTema(novo);
      aplicar(novo);
    };
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, [preferencia]);

  const definir = useCallback((p: PreferenciaTema) => {
    try {
      localStorage.setItem(CHAVE_TEMA, p);
    } catch {
      // segue sem persistir
    }
    setPreferencia(p);
  }, []);

  return { preferencia, tema, definir };
}
