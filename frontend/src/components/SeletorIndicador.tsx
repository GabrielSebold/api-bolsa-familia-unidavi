import { useId } from 'react';
import type { Metrica } from '../types/api';
import { ROTULO_METRICA } from '../utils/formatadores';

const OPCOES: readonly { metrica: Metrica; rotulo: string }[] = [
  { metrica: 'valor', rotulo: 'Valor repassado' },
  { metrica: 'familias', rotulo: 'Famílias beneficiadas' },
  { metrica: 'valorMedio', rotulo: 'Valor médio' },
];

interface SeletorIndicadorProps {
  valor: Metrica;
  onChange: (metrica: Metrica) => void;
}

/** Escolhe o indicador mostrado nos três gráficos (refletido em ?ind= na URL). */
export function SeletorIndicador({ valor, onChange }: SeletorIndicadorProps) {
  const nome = useId();
  return (
    <fieldset className="seletor-indicador">
      <legend>Indicador dos gráficos</legend>
      <div className="seletor-indicador__opcoes">
        {OPCOES.map((o) => (
          <label key={o.metrica} className="opcao-radio" title={ROTULO_METRICA[o.metrica]}>
            <input
              type="radio"
              name={nome}
              value={o.metrica}
              checked={valor === o.metrica}
              onChange={() => onChange(o.metrica)}
            />
            <span>{o.rotulo}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
