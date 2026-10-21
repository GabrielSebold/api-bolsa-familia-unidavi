import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FonteMunicipios } from '../services/municipios';
import type { Municipio } from '../types/api';
import { MIN_CARACTERES, buscarMunicipios, rotuloMunicipio } from '../utils/busca';
import { validarCodigoIbge } from '../utils/ibge';

interface MunicipioComboboxProps {
  municipios: readonly Municipio[];
  fonte: FonteMunicipios | null;
  /** Código IBGE selecionado; null quando o texto ainda não corresponde a um município. */
  valor: string | null;
  /** Erro vindo do formulário (ex.: nada selecionado ao aplicar). */
  erro?: string | undefined;
  onChange: (codigo: string | null) => void;
}

function avisoDaFonte(fonte: FonteMunicipios | null): string | null {
  if (fonte === 'embutida') {
    return 'Não foi possível carregar a lista de municípios do IBGE. Só alguns municípios aparecem na busca; digite o código IBGE de 7 dígitos para outro município.';
  }
  if (fonte === 'cache-vencido') {
    return 'Não foi possível atualizar a lista de municípios do IBGE. A busca usa a última lista salva neste navegador.';
  }
  return null;
}

/** Combobox de município (WAI-ARIA 1.2, autocomplete por lista). Aceita nome, UF ou código IBGE de 7 dígitos. */
export function MunicipioCombobox({ municipios, fonte, valor, erro, onChange }: MunicipioComboboxProps) {
  const id = useId();
  const idInput = `${id}-input`;
  const idLista = `${id}-lista`;
  const idErro = `${id}-erro`;
  const idDica = `${id}-dica`;

  const rotuloDe = (codigo: string | null): string => {
    if (!codigo) return '';
    const m = municipios.find((x) => x.codigo === codigo);
    return m ? rotuloMunicipio(m) : codigo;
  };

  const [texto, setTexto] = useState(() => rotuloDe(valor));
  const [foco, setFoco] = useState(false);
  // Começa fechada: a lista só abre quando o usuário digita ou usa as setas.
  const [fechado, setFechado] = useState(true);
  const [ativo, setAtivo] = useState(-1);
  const raiz = useRef<HTMLDivElement>(null);
  const emitido = useRef<string | null>(valor);

  // Sincroniza o texto quando o valor muda por fora (Limpar filtros, Voltar do navegador)
  // ou quando a lista de municípios chega e o código passa a ter um nome.
  useEffect(() => {
    if (valor !== emitido.current) {
      emitido.current = valor;
      setTexto(rotuloDe(valor));
      setFechado(true);
    } else if (valor && texto === valor) {
      setTexto(rotuloDe(valor));
    }
  }, [valor, municipios]);

  const termo = texto.trim();
  const resultados = useMemo(
    () => (termo.length >= MIN_CARACTERES ? buscarMunicipios(municipios, termo) : []),
    [municipios, termo],
  );
  const aberto = foco && !fechado && resultados.length > 0;

  const erroCodigo = /^\d{7,}$/.test(termo) ? validarCodigoIbge(termo) : null;
  const erroLocal = erroCodigo && !erroCodigo.ok ? erroCodigo.motivo : undefined;
  const mensagemErro = erroLocal ?? erro;

  useEffect(() => {
    if (!aberto || ativo < 0) return;
    document.getElementById(`${idLista}-${ativo}`)?.scrollIntoView({ block: 'nearest' });
  }, [aberto, ativo, idLista]);

  const emitir = (codigo: string | null) => {
    emitido.current = codigo;
    onChange(codigo);
  };

  const selecionar = (m: Municipio) => {
    setTexto(rotuloMunicipio(m));
    setFechado(true);
    setAtivo(-1);
    emitir(m.codigo);
  };

  const aoDigitar = (novo: string) => {
    setTexto(novo);
    setFechado(false);
    setAtivo(-1);
    const t = novo.trim();
    emitir(/^\d{7}$/.test(t) && validarCodigoIbge(t).ok ? t : null);
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = resultados.length;
    switch (e.key) {
      case 'ArrowDown':
        if (total === 0) return;
        e.preventDefault();
        if (!aberto) {
          setFechado(false);
          setAtivo(0);
        } else setAtivo((ativo + 1) % total);
        break;
      case 'ArrowUp':
        if (total === 0) return;
        e.preventDefault();
        if (!aberto) {
          setFechado(false);
          setAtivo(total - 1);
        } else setAtivo(ativo <= 0 ? total - 1 : ativo - 1);
        break;
      case 'Home':
        if (!aberto) return;
        e.preventDefault();
        setAtivo(0);
        break;
      case 'End':
        if (!aberto) return;
        e.preventDefault();
        setAtivo(total - 1);
        break;
      case 'Enter': {
        const m = aberto ? resultados[ativo] : undefined;
        if (m) {
          // Escolher a opção não deve enviar o formulário.
          e.preventDefault();
          selecionar(m);
        }
        break;
      }
      case 'Escape':
        if (aberto) {
          e.preventDefault();
          setFechado(true);
          setAtivo(-1);
        } else if (texto) {
          e.preventDefault();
          setTexto('');
          emitir(null);
        }
        break;
      case 'Tab': {
        const m = aberto ? resultados[ativo] : undefined;
        if (m) selecionar(m);
        else setFechado(true);
        break;
      }
      default:
    }
  };

  const aoPerderFoco = (e: React.FocusEvent<HTMLDivElement>) => {
    if (raiz.current?.contains(e.relatedTarget as Node | null)) return;
    setFoco(false);
    setAtivo(-1);
  };

  let anuncio = '';
  if (foco && termo.length >= MIN_CARACTERES && !fechado && !valor) {
    if (resultados.length === 0) anuncio = 'Nenhum município encontrado.';
    else {
      const n = resultados.length;
      anuncio = `${n} ${n === 1 ? 'resultado' : 'resultados'}${n >= 50 ? ' ou mais' : ''}. Use as setas para cima e para baixo para escolher.`;
    }
  }

  const aviso = avisoDaFonte(fonte);
  const semResultados = foco && !fechado && termo.length >= MIN_CARACTERES && resultados.length === 0 && !erroLocal && !valor;

  return (
    <div className="campo campo--municipio">
      <div className="campo__controle">
        <label htmlFor={idInput}>Município</label>
        <div className="combobox" ref={raiz} onBlur={aoPerderFoco}>
          <svg className="combobox__pin" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
            />
          </svg>
          <input
            id={idInput}
            type="text"
            role="combobox"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            value={texto}
            aria-expanded={aberto}
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={aberto && ativo >= 0 ? `${idLista}-${ativo}` : undefined}
            aria-invalid={mensagemErro ? true : undefined}
            aria-describedby={mensagemErro ? `${idDica} ${idErro}` : idDica}
            onChange={(e) => aoDigitar(e.target.value)}
            onKeyDown={aoTeclar}
            onFocus={() => setFoco(true)}
          />
          <ul id={idLista} role="listbox" aria-label="Municípios sugeridos" className="combobox__lista" hidden={!aberto}>
            {resultados.map((m, i) => (
              <li
                key={m.codigo}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={i === ativo}
                className="combobox__opcao"
                // Mantém o foco no campo ao clicar na opção.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selecionar(m)}
              >
                <span>{rotuloMunicipio(m)}</span>
                <span className="combobox__codigo">{m.codigo}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="campo__mensagens">
        <p id={idDica} className="campo__dica">
          Digite ao menos {MIN_CARACTERES} letras do nome ou o código IBGE de 7 dígitos.
        </p>
        {semResultados ? <p className="campo__dica">Nenhum município encontrado.</p> : null}
        {mensagemErro ? (
          <p id={idErro} className="campo__erro" role="alert">
            {mensagemErro}
          </p>
        ) : null}
        <div className="somente-leitor" role="status">
          {anuncio}
        </div>
        {aviso ? (
          <p className="campo__dica campo__dica--aviso" role="note">
            {aviso}
          </p>
        ) : null}
      </div>
    </div>
  );
}
