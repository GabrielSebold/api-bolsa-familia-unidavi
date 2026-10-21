import type { PreferenciaTema } from '../hooks/useTema';

interface Props {
  preferencia: PreferenciaTema;
  onChange: (p: PreferenciaTema) => void;
}

const OPCOES: { valor: PreferenciaTema; rotulo: string }[] = [
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
  { valor: 'contraste', rotulo: 'Alto contraste' },
  { valor: 'auto', rotulo: 'Automático' },
];

export function ThemeToggle({ preferencia, onChange }: Props) {
  return (
    <div className="grupo-botoes" role="group" aria-label="Tema de cores">
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          className="botao botao--grupo"
          aria-pressed={preferencia === o.valor}
          onClick={() => onChange(o.valor)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
