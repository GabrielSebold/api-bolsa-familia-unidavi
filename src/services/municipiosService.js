const TRINTA_DIAS = 30 * 24 * 3600_000;

// Fallback embutido (sem rede): usado quando não há tabela salva nem acesso ao IBGE.
export const MUNICIPIOS_FALLBACK = [
  { codigo: '4214805', nome: 'Rio do Sul', uf: 'SC' },
  { codigo: '3550308', nome: 'São Paulo', uf: 'SP' },
  { codigo: '3304557', nome: 'Rio de Janeiro', uf: 'RJ' },
  { codigo: '5300108', nome: 'Brasília', uf: 'DF' },
  { codigo: '4106902', nome: 'Curitiba', uf: 'PR' },
  { codigo: '2927408', nome: 'Salvador', uf: 'BA' },
];

/** Extrai { codigo, nome, uf } do JSON de localidades do IBGE (tolerante a dois formatos). */
export function mapearMunicipiosIbge(json) {
  if (!Array.isArray(json)) throw new Error('Resposta do IBGE não é uma lista');
  const out = [];
  for (const m of json) {
    const uf =
      m?.microrregiao?.mesorregiao?.UF?.sigla ?? m?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ?? null;
    if (m?.id && m?.nome && uf) out.push({ codigo: String(m.id), nome: String(m.nome), uf });
  }
  if (out.length === 0) throw new Error('Nenhum município reconhecido na resposta do IBGE');
  return out;
}

export function createMunicipiosService({ l2, url, fetchImpl = fetch, skipRemote = false, logger, now = () => Date.now() }) {
  const fallback = new Map(MUNICIPIOS_FALLBACK.map((m) => [m.codigo, m]));

  return {
    async init() {
      const total = l2.municipiosCount();
      const atualizadoEm = Number(l2.metaGet('municipios_atualizado_em') ?? 0);
      const velha = total === 0 || now() - atualizadoEm > TRINTA_DIAS;
      if (!velha || skipRemote) {
        if (total === 0) logger?.warn?.('Tabela de municípios vazia; usando lista embutida (poucos municípios)');
        return;
      }
      try {
        const res = await fetchImpl(url, { signal: AbortSignal.timeout(20000), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
        const lista = mapearMunicipiosIbge(await res.json());
        l2.municipiosReplace(lista);
        l2.metaSet('municipios_atualizado_em', now());
        logger?.info?.({ total: lista.length }, 'Tabela de municípios do IBGE atualizada');
      } catch (err) {
        if (total > 0) logger?.warn?.({ err: err.message }, 'Falha ao atualizar municípios do IBGE; usando última tabela salva');
        else logger?.warn?.({ err: err.message }, 'Falha ao carregar municípios do IBGE; usando lista embutida');
      }
    },
    buscar(codigo) {
      return l2.municipioGet(codigo) ?? fallback.get(codigo) ?? null;
    },
    existe(codigo) {
      return this.buscar(codigo) !== null;
    },
  };
}
