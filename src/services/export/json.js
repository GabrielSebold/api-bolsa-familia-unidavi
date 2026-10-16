/** Mantém o contrato da consulta e identifica filtros e escopo do arquivo. */
export function montarJSON({ consulta, escopo, filtros, dados, meta, geradoEm }) {
  const registrosPermitidos = dados.map((r) => ({
    codigoIbge: r.codigoIbge,
    municipio: r.municipio,
    uf: r.uf,
    mesAno: r.mesAno,
    programa: r.programa,
    tipo: { id: r.tipo?.id, descricao: r.tipo?.descricao },
    valor: r.valor,
    quantidadeBeneficiados: r.quantidadeBeneficiados,
    valorMedio: r.valorMedio,
    ...(r.origemId !== undefined ? { origemId: r.origemId } : {}),
    ...(r.coletadoEm !== undefined ? { coletadoEm: r.coletadoEm } : {}),
  }));
  return { consulta, escopo, filtros, quantidadeRegistros: registrosPermitidos.length, dados: registrosPermitidos, meta, geradoEm };
}

export function serializarJSON(valor) {
  return `${JSON.stringify(valor, null, 2)}\n`;
}
