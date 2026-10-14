import { useCallback, useEffect, useState } from 'react';

export type PreferenciaTema = 'claro' | 'escuro' | 'auto';
export type TemaEfetivo = 'claro' | 'escuro';

export const CHAVE_TEMA = 'bf:tema';
const CONSULTA_ESCURO = '(prefers-color-scheme: dark)';

function lerPreferencia(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CHAVE_TEMA);
    if (v === 'claro' || v === 'escuro' || v === 'auto') return v;
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
  raiz.style.colorScheme = tema === 'escuro' ? 'dark' : 'light';
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
