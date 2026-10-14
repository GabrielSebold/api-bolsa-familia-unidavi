import type { Municipio } from '../types/api';

export const MAX_RESULTADOS = 50;
export const MIN_CARACTERES = 2;

/** Minúsculas e sem acentos, para comparação. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtra municípios por nome, UF ("curitiba pr", "pr") ou código IBGE (prefixo).
 * Todos os termos digitados precisam casar. Prioriza quem começa com o 1º termo. Máx. 50.
 */
export function buscarMunicipios(
  lista: readonly Municipio[],
  consulta: string,
  limite: number = MAX_RESULTADOS,
): Municipio[] {
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [];
  const [primeiro = ''] = termos;
  const comeca: Municipio[] = [];
  const contem: Municipio[] = [];
  for (const m of lista) {
    const nome = normalizar(m.nome);
    const uf = m.uf.toLowerCase();
    const casa = termos.every((t) => nome.includes(t) || uf === t || m.codigo.startsWith(t));
    if (!casa) continue;
    if (nome.startsWith(primeiro) || m.codigo.startsWith(primeiro)) comeca.push(m);
    else contem.push(m);
    if (comeca.length >= limite) break;
  }
  return [...comeca, ...contem].slice(0, limite);
}

/** "Rio do Sul/SC" */
export function rotuloMunicipio(m: Municipio): string {
  return `${m.nome}/${m.uf}`;
}
