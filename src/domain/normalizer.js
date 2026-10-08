/** Converte dataReferencia (YYYY-MM-DD, DD/MM/YYYY ou AAAAMM) em AAAAMM; null se não reconhecida. */
export function dataParaMesAno(data) {
  if (typeof data !== 'string') return null;
  const s = data.trim();
  let m = /^(\d{4})-(\d{2})(?:-\d{2})?/.exec(s);
  if (m) return `${m[1]}${m[2]}`;
  m = /^\d{2}\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) return `${m[2]}${m[1]}`;
  m = /^(\d{4})(\d{2})$/.exec(s);
  if (m) return `${m[1]}${m[2]}`;
  return null;
}

/**
 * Normaliza DTOs validados. Valores NÃO são arredondados.
 * Dedup por codigoIBGE+mesAno+tipo.id mantendo maior id.
 */
export function normalizarRegistros(dtos, { mesAno, programa, coletadoEm, logger } = {}) {
  const porChave = new Map();
  for (const d of dtos) {
    let mes = dataParaMesAno(d.dataReferencia);
    if (!mes) {
      logger?.warn?.({ dataReferencia: d.dataReferencia, mesAno }, 'dataReferencia não reconhecida; usando mês consultado');
      mes = mesAno;
    }
    const codigoIbge = String(d.municipio.codigoIBGE).trim();
    const chave = `${codigoIbge}|${mes}|${d.tipo.id}`;
    const atual = porChave.get(chave);
    if (atual && atual.origemId >= d.id) {
      logger?.info?.({ chave, descartado: d.id, mantido: atual.origemId }, 'registro duplicado descartado');
      continue;
    }
    if (atual) logger?.info?.({ chave, descartado: atual.origemId, mantido: d.id }, 'registro duplicado substituído');
    const quantidade = Math.trunc(d.quantidadeBeneficiados);
    porChave.set(chave, {
      codigoIbge,
      municipio: d.municipio.nomeIBGE.trim(),
      uf: d.municipio.uf.sigla.trim(),
      mesAno: mes,
      programa,
      tipo: { id: d.tipo.id, descricao: d.tipo.descricao.trim() },
      valor: d.valor,
      quantidadeBeneficiados: quantidade,
      valorMedio: quantidade === 0 ? null : d.valor / quantidade,
      origemId: d.id,
      coletadoEm,
    });
  }
  return [...porChave.values()];
}
