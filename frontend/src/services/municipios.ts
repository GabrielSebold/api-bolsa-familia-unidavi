import type { Municipio } from '../types/api';
import { TIMEOUT_IBGE_MS } from './config';

export const URL_MUNICIPIOS_IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome';
export const CHAVE_CACHE_MUNICIPIOS = 'bf:municipios:v1';
const TTL_MS = 30 * 24 * 3600_000;

/** Lista embutida usada quando não há cache nem acesso ao IBGE (mesmos municípios do mock da API). */
export const MUNICIPIOS_FALLBACK: readonly Municipio[] = [
  { codigo: '4214805', nome: 'Rio do Sul', uf: 'SC' },
  { codigo: '3550308', nome: 'São Paulo', uf: 'SP' },
  { codigo: '3304557', nome: 'Rio de Janeiro', uf: 'RJ' },
  { codigo: '5300108', nome: 'Brasília', uf: 'DF' },
  { codigo: '4106902', nome: 'Curitiba', uf: 'PR' },
  { codigo: '2927408', nome: 'Salvador', uf: 'BA' },
];

export type FonteMunicipios = 'ibge' | 'cache' | 'cache-vencido' | 'embutida';

export interface ListaMunicipios {
  municipios: readonly Municipio[];
  fonte: FonteMunicipios;
}

function pegar(obj: unknown, ...caminho: string[]): unknown {
  let atual = obj;
  for (const chave of caminho) {
    if (typeof atual !== 'object' || atual === null) return undefined;
    atual = (atual as Record<string, unknown>)[chave];
  }
  return atual;
}

/** Extrai { codigo, nome, uf } do JSON de localidades do IBGE (tolerante a dois formatos). */
export function mapearMunicipiosIbge(json: unknown): Municipio[] {
  if (!Array.isArray(json)) throw new Error('Resposta do IBGE não é uma lista');
  const out: Municipio[] = [];
  for (const m of json as unknown[]) {
    const uf =
      pegar(m, 'microrregiao', 'mesorregiao', 'UF', 'sigla') ??
      pegar(m, 'regiao-imediata', 'regiao-intermediaria', 'UF', 'sigla');
    const id = pegar(m, 'id');
    const nome = pegar(m, 'nome');
    if (id && nome && typeof uf === 'string') out.push({ codigo: String(id), nome: String(nome), uf });
  }
  if (out.length === 0) throw new Error('Nenhum município reconhecido na resposta do IBGE');
  return out;
}

interface CacheSalvo {
  em: number;
  itens: [string, string, string][];
}

function lerCache(): CacheSalvo | null {
  try {
    const bruto = localStorage.getItem(CHAVE_CACHE_MUNICIPIOS);
    if (!bruto) return null;
    const c = JSON.parse(bruto) as Partial<CacheSalvo>;
    if (typeof c.em !== 'number' || !Array.isArray(c.itens) || c.itens.length === 0) return null;
    return { em: c.em, itens: c.itens };
  } catch {
    return null;
  }
}

function gravarCache(lista: readonly Municipio[]): void {
  try {
    const c: CacheSalvo = { em: Date.now(), itens: lista.map((m) => [m.codigo, m.nome, m.uf]) };
    localStorage.setItem(CHAVE_CACHE_MUNICIPIOS, JSON.stringify(c));
  } catch {
    // armazenamento indisponível ou cheio: segue sem cache
  }
}

function deCache(c: CacheSalvo): Municipio[] {
  return c.itens.map(([codigo, nome, uf]) => ({ codigo, nome, uf }));
}

/** Carrega a lista de municípios: cache válido → IBGE → cache vencido → lista embutida. */
export async function carregarMunicipios(signal?: AbortSignal): Promise<ListaMunicipios> {
  const cache = lerCache();
  if (cache && Date.now() - cache.em <= TTL_MS) {
    return { municipios: deCache(cache), fonte: 'cache' };
  }
  try {
    const timeout = AbortSignal.timeout(TIMEOUT_IBGE_MS);
    const res = await fetch(URL_MUNICIPIOS_IBGE, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`IBGE respondeu ${res.status}`);
    const lista = mapearMunicipiosIbge(await res.json());
    gravarCache(lista);
    return { municipios: lista, fonte: 'ibge' };
  } catch (err) {
    if (signal?.aborted) throw err;
    if (cache) return { municipios: deCache(cache), fonte: 'cache-vencido' };
    return { municipios: MUNICIPIOS_FALLBACK, fonte: 'embutida' };
  }
}
