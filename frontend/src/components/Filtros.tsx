import { useEffect, useRef, useState } from 'react';
import { filtrosPadrao, type Filtros as ValoresFiltros } from '../hooks/useFiltrosUrl';
import type { FonteMunicipios } from '../services/municipios';
import type { Municipio } from '../types/api';
import { periodoTemErros, validarPeriodo, type ErrosPeriodo } from '../utils/periodo';
import { MunicipioCombobox } from './MunicipioCombobox';
import { PeriodoFiltro } from './PeriodoFiltro';

interface FiltrosProps {
  /** Filtros aplicados (vêm da URL). */
  filtros: ValoresFiltros;
  avisos: string[];
  municipios: readonly Municipio[];
  fonteMunicipios: FonteMunicipios | null;
  onAplicar: (filtros: ValoresFiltros) => void;
  onRestaurar: () => void;
  onDispensarAvisos: () => void;
}

const ERRO_MUNICIPIO = 'Escolha um município da lista ou digite um código IBGE válido de 7 dígitos.';

/** Seção #filtros: município + período. Só "Aplicar" valida e atualiza a consulta e a URL. */
export function Filtros({
  filtros,
  avisos,
  municipios,
  fonteMunicipios,
  onAplicar,
  onRestaurar,
  onDispensarAvisos,
}: FiltrosProps) {
  const [ibge, setIbge] = useState<string | null>(filtros.ibge);
  const [periodo, setPeriodo] = useState({ de: filtros.de, ate: filtros.ate });
  const [erroPeriodo, setErroPeriodo] = useState<ErrosPeriodo>({});
  const [erroMunicipio, setErroMunicipio] = useState<string | undefined>();
  const formulario = useRef<HTMLFormElement>(null);

  // A URL mudou (Voltar/Avançar, Limpar filtros): o rascunho acompanha.
  useEffect(() => {
    setIbge(filtros.ibge);
    setPeriodo({ de: filtros.de, ate: filtros.ate });
    setErroPeriodo({});
    setErroMunicipio(undefined);
  }, [filtros.ibge, filtros.de, filtros.ate]);

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errosP = validarPeriodo(periodo);
    const errM = ibge === null ? ERRO_MUNICIPIO : undefined;
    setErroPeriodo(errosP);
    setErroMunicipio(errM);
    if (errM || periodoTemErros(errosP)) {
      // Leva o foco ao primeiro campo com erro.
      requestAnimationFrame(() => {
        formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    // Mantém o indicador e a aba abertos; "Limpar filtros" (restaurarPadrao) volta para a Visão geral.
    if (ibge !== null) onAplicar({ ibge, de: periodo.de, ate: periodo.ate, ind: filtros.ind, aba: filtros.aba });
  };

  const restaurar = () => {
    const p = filtrosPadrao();
    setIbge(null);
    setPeriodo({ de: p.de, ate: p.ate });
    setErroPeriodo({});
    setErroMunicipio(undefined);
    onRestaurar();
  };

  return (
    <section id="filtros" className="faixa-abrangencia" aria-labelledby="titulo-filtros" tabIndex={-1}>
      <h2 id="titulo-filtros">Filtros</h2>
      {avisos.length > 0 ? (
        <div className="aviso" role="status">
          {avisos.map((a) => (
            <p key={a}>{a}</p>
          ))}
          <button type="button" className="botao" onClick={onDispensarAvisos}>
            Fechar aviso
          </button>
        </div>
      ) : null}
      <form ref={formulario} className="filtros" onSubmit={enviar} noValidate>
        <MunicipioCombobox
          municipios={municipios}
          fonte={fonteMunicipios}
          valor={ibge}
          erro={erroMunicipio}
          onChange={(codigo) => {
            setIbge(codigo);
            setErroMunicipio(undefined);
          }}
        />
        <PeriodoFiltro
          de={periodo.de}
          ate={periodo.ate}
          erros={erroPeriodo}
          onChange={(p) => {
            setPeriodo(p);
            setErroPeriodo({});
          }}
        />
        <div className="filtros__acoes">
          <button type="submit" className="botao botao--primario">
            Aplicar
          </button>
          <button type="button" className="botao" onClick={restaurar}>
            Limpar filtros
          </button>
        </div>
      </form>
    </section>
  );
}
