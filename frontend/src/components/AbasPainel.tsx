import type { Aba } from '../hooks/useFiltrosUrl';

export interface DefinicaoAba {
  id: Aba;
  rotulo: string;
  /** id da seção (role="tabpanel") controlada pela aba. */
  idPainel: string;
}

interface AbasPainelProps {
  abas: readonly DefinicaoAba[];
  ativa: Aba;
  onChange: (aba: Aba) => void;
}

/** id do botão da aba; os painéis usam em aria-labelledby. */
export function idDaAba(aba: Aba): string {
  return `aba-${aba}`;
}

/**
 * Abas no padrão WAI-ARIA Tabs com ativação automática: só a aba ativa entra no Tab (tabindex móvel);
 * ←/→ (com volta) e Home/End movem o foco e já ativam a aba.
 */
export function AbasPainel({ abas, ativa, onChange }: AbasPainelProps) {
  const aoTeclar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const atual = abas.findIndex((a) => a.id === ativa);
    let proxima: number;
    if (e.key === 'ArrowRight') proxima = (atual + 1) % abas.length;
    else if (e.key === 'ArrowLeft') proxima = (atual - 1 + abas.length) % abas.length;
    else if (e.key === 'Home') proxima = 0;
    else if (e.key === 'End') proxima = abas.length - 1;
    else return;
    const aba = abas[proxima];
    if (!aba) return;
    e.preventDefault();
    onChange(aba.id);
    document.getElementById(idDaAba(aba.id))?.focus();
  };

  return (
    <div className="abas" role="tablist" aria-label="Seções do painel" onKeyDown={aoTeclar}>
      {abas.map((a) => {
        const selecionada = a.id === ativa;
        return (
          <button
            key={a.id}
            type="button"
            role="tab"
            id={idDaAba(a.id)}
            className="abas__aba"
            aria-selected={selecionada}
            aria-controls={a.idPainel}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onChange(a.id)}
          >
            {a.rotulo}
          </button>
        );
      })}
    </div>
  );
}
