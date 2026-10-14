import { useCallback, useEffect, useState } from 'react';

export const CHAVE_FONTE = 'bf:fonte';
/** Percentual do tamanho de fonte da raiz (html) para cada nível. O nível 0 é o padrão. */
export const NIVEIS_FONTE = [100, 115, 130, 150] as const;

function lerNivel(): number {
  try {
    const n = Number(localStorage.getItem(CHAVE_FONTE));
    if (Number.isInteger(n) && n >= 0 && n < NIVEIS_FONTE.length) return n;
  } catch {
    // localStorage indisponível
  }
  return 0;
}

export interface UseEscalaFonte {
  nivel: number;
  percentual: number;
  podeDiminuir: boolean;
  podeAumentar: boolean;
  aumentar: () => void;
  diminuir: () => void;
  padrao: () => void;
  /** Texto para a região aria-live, ex.: "Tamanho da fonte: 115%". */
  anuncio: string;
}

export function useEscalaFonte(): UseEscalaFonte {
  const [nivel, setNivel] = useState<number>(lerNivel);
  const [anuncio, setAnuncio] = useState('');
  const percentual = NIVEIS_FONTE[nivel] ?? 100;

  useEffect(() => {
    document.documentElement.style.fontSize = `${percentual}%`;
  }, [percentual]);

  const mudar = useCallback((novo: number) => {
    const n = Math.min(NIVEIS_FONTE.length - 1, Math.max(0, novo));
    try {
      localStorage.setItem(CHAVE_FONTE, String(n));
    } catch {
      // segue sem persistir
    }
    setNivel(n);
    setAnuncio(`Tamanho da fonte: ${NIVEIS_FONTE[n]}%${n === 0 ? ' (padrão)' : ''}`);
  }, []);

  return {
    nivel,
    percentual,
    podeDiminuir: nivel > 0,
    podeAumentar: nivel < NIVEIS_FONTE.length - 1,
    aumentar: () => mudar(nivel + 1),
    diminuir: () => mudar(nivel - 1),
    padrao: () => mudar(0),
    anuncio,
  };
}
