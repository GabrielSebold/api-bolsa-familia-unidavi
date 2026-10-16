import { useState } from 'react';
import { API_URL, TIMEOUT_API_MS } from '../services/config';
import type { Filtros } from '../hooks/useFiltrosUrl';
import type { Municipio, Registro } from '../types/api';
import { formatarMesAno, formatarMoeda, formatarInteiro, nomePrograma } from '../utils/formatadores';

interface Props { filtros: Filtros; municipio?: Municipio; registros: readonly Registro[]; consultaCompleta?: { de: string; ate: string }; disponivel: boolean; }
type Formato = 'csv' | 'json' | 'pdf';

export function RelatoriosExportacao({ filtros, municipio, registros, consultaCompleta, disponivel }: Props) {
  const [escopo, setEscopo] = useState<'bruto' | 'filtrado'>('filtrado');
  const [emAndamento, setEmAndamento] = useState<Formato | null>(null);
  const [mensagem, setMensagem] = useState('');

  async function baixar(formato: Formato) {
    if (emAndamento) return;
    if (!disponivel) { setMensagem('Aguarde a consulta carregar e retornar registros.'); return; }
    setEmAndamento(formato); setMensagem('');
    // Município e período são os filtros RF04 ativos no dashboard e definem o arquivo inteiro.
    const periodoCompleto = escopo === 'bruto' ? consultaCompleta : undefined;
    const q = new URLSearchParams({
      codigoIbge: filtros.ibge,
      de: periodoCompleto?.de ?? filtros.de,
      ate: periodoCompleto?.ate ?? filtros.ate,
      escopo,
    });
    if (formato === 'csv') q.set('excel', 'true');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_API_MS);
    try {
      const response = await fetch(`${API_URL}/api/v1/repasses/exportar/${formato}?${q}`, { signal: controller.signal });
      if (!response.ok) {
        let detalhe = 'Não foi possível gerar o arquivo.';
        try { detalhe = (await response.json())?.erro?.mensagem || detalhe; } catch { /* resposta não JSON */ }
        throw new Error(detalhe);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] || `repasses.${formato}`;
      document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      const qtd = response.headers.get('X-Total-Registros') ?? (escopo === 'filtrado' ? registrosFiltrados.length : registros.length);
      setMensagem(`${formato.toUpperCase()} gerado com sucesso (${qtd} registros).`);
    } catch (e) { setMensagem(e instanceof Error ? e.message : 'Falha ao gerar arquivo.'); }
    finally { window.clearTimeout(timeout); setEmAndamento(null); }
  }

  const registrosFiltrados = registros.filter((r) => r.mesAno >= filtros.de && r.mesAno <= filtros.ate);
  const registrosPrevios = escopo === 'bruto' ? registros : registrosFiltrados;

  return <section aria-labelledby="titulo-relatorios" className="relatorios">
    <h2 id="titulo-relatorios">Relatórios e Exportação</h2>
    <p className="relatorios__contexto"><strong>Município:</strong> {municipio ? `${municipio.nome} (${municipio.uf})` : `IBGE ${filtros.ibge}`} <span aria-hidden="true">·</span> <strong>Período:</strong> {formatarMesAno(filtros.de)} a {formatarMesAno(filtros.ate)}</p>
    <fieldset className="relatorios__escopo"><legend>Conjunto de dados dos arquivos</legend>
      <label className="opcao-radio"><input type="radio" name="escopo-exportacao" checked={escopo === 'bruto'} onChange={() => setEscopo('bruto')} /> Dados brutos da consulta</label>
      <label className="opcao-radio"><input type="radio" name="escopo-exportacao" checked={escopo === 'filtrado'} onChange={() => setEscopo('filtrado')} /> Dados filtrados pelo período selecionado</label>
    </fieldset>
    <p>{escopo === 'bruto' ? 'Brutos: todos os registros da série carregada para este município, incluindo meses auxiliares usados na comparação anual.' : 'Filtrados: somente os registros do município dentro do período escolhido no dashboard.'} A escolha se aplica ao CSV, JSON e PDF.</p>
    <details className="relatorios__previa">
      <summary>Visualizar prévia dos dados CSV ({registrosPrevios.length} registros)</summary>
      {registrosPrevios.length ? <div className="tabela-rolagem" role="region" aria-label="Prévia dos registros que serão exportados" tabIndex={0}>
        <table className="tabela tabela--exportacao">
          <caption>Prévia dos registros do município e período selecionados. O download contém todos os registros.</caption>
          <thead><tr><th scope="col">Mês/ano</th><th scope="col">Programa</th><th scope="col">Tipo de benefício</th><th scope="col">Valor repassado</th><th scope="col">Beneficiários no mês</th><th scope="col">Valor médio</th></tr></thead>
          <tbody>{registrosPrevios.slice(0, 8).map((r, i) => <tr key={`${r.mesAno}-${r.tipo.id}-${i}`}><td>{formatarMesAno(r.mesAno)}</td><td>{nomePrograma(r.programa)}</td><td>{r.tipo.descricao}</td><td>{formatarMoeda(r.valor)}</td><td>{formatarInteiro(r.quantidadeBeneficiados)}</td><td>{formatarMoeda(r.valorMedio)}</td></tr>)}</tbody>
        </table>
        {registrosPrevios.length > 8 ? <p className="relatorios__nota">Exibindo 8 de {registrosPrevios.length} registros; o arquivo CSV inclui o conjunto completo.</p> : null}
      </div> : <p>Nenhum registro disponível para prévia.</p>}
    </details>
    <div className="grupo-botoes relatorios__acoes">{(['csv','json','pdf'] as const).map((f) => <button key={f} type="button" className="botao" disabled={!!emAndamento || !disponivel} onClick={() => void baixar(f)}>{emAndamento === f ? 'Gerando…' : f === 'pdf' ? 'Gerar relatório PDF' : `Exportar ${f.toUpperCase()}`}</button>)}</div>
    <p role="status" aria-live="polite">{mensagem}</p>
  </section>;
}
