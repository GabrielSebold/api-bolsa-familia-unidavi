import { describe, expect, it } from 'vitest';
import { periodoPadrao } from '../utils/periodo';
import { filtrosPadrao, filtrosParaQuery, lerFiltros } from './useFiltrosUrl';

const HOJE = new Date('2026-10-08T12:00:00Z');

describe('lerFiltros', () => {
  it('sem município na URL não seleciona nenhum e não avisa', () => {
    const { filtros, avisos } = lerFiltros('', HOJE);
    expect(filtros.ibge).toBeNull();
    expect(avisos).toEqual([]);
    expect({ de: filtros.de, ate: filtros.ate }).toEqual(periodoPadrao(HOJE));
  });

  it('aceita ?ibge e o alias ?codigoIbge', () => {
    expect(lerFiltros('?ibge=3550308', HOJE).filtros.ibge).toBe('3550308');
    expect(lerFiltros('?codigoIbge=3550308', HOJE).filtros.ibge).toBe('3550308');
  });

  it('código inválido fica sem município e com aviso', () => {
    const { filtros, avisos } = lerFiltros('?ibge=1234567', HOJE);
    expect(filtros.ibge).toBeNull();
    expect(avisos).toHaveLength(1);
  });

  it('mantém o período do link mesmo sem município', () => {
    const { filtros, avisos } = lerFiltros('?de=202501&ate=202512', HOJE);
    expect(filtros.ibge).toBeNull();
    expect({ de: filtros.de, ate: filtros.ate }).toEqual({ de: '202501', ate: '202512' });
    expect(avisos).toEqual([]);
  });
});

describe('filtrosPadrao e filtrosParaQuery', () => {
  it('o padrão não tem município', () => {
    expect(filtrosPadrao(HOJE).ibge).toBeNull();
  });

  it('sem município a query é vazia; com município inclui ibge', () => {
    const base = { de: '202501', ate: '202512', ind: 'valor', aba: 'visao' } as const;
    expect(filtrosParaQuery({ ...base, ibge: null })).toBe('');
    expect(filtrosParaQuery({ ...base, ibge: '3550308' })).toContain('ibge=3550308');
  });

  it('o padrão abre a Visão geral', () => {
    expect(filtrosPadrao(HOJE).aba).toBe('visao');
  });

  it('grava a aba só quando não é a Visão geral; sem município continua vazia', () => {
    const base = { ibge: '3550308', de: '202501', ate: '202512', ind: 'valor' } as const;
    expect(filtrosParaQuery({ ...base, aba: 'visao' })).toBe('ibge=3550308&de=202501&ate=202512&ind=valor');
    expect(filtrosParaQuery({ ...base, aba: 'tabela' })).toBe('ibge=3550308&de=202501&ate=202512&ind=valor&aba=tabela');
    expect(filtrosParaQuery({ ...base, ibge: null, aba: 'graficos' })).toBe('');
  });
});

describe('lerFiltros: aba', () => {
  it('lê uma aba válida', () => {
    const { filtros, avisos } = lerFiltros('?ibge=3550308&aba=graficos', HOJE);
    expect(filtros.aba).toBe('graficos');
    expect(avisos).toEqual([]);
  });

  it('sem ?aba abre a Visão geral, sem aviso', () => {
    const { filtros, avisos } = lerFiltros('?ibge=3550308', HOJE);
    expect(filtros.aba).toBe('visao');
    expect(avisos).toEqual([]);
  });

  it('aba inválida abre a Visão geral e avisa', () => {
    const { filtros, avisos } = lerFiltros('?ibge=3550308&aba=xyz', HOJE);
    expect(filtros.aba).toBe('visao');
    expect(avisos).toEqual(['A aba do link é inválida. Foi aberta a Visão geral.']);
  });
});
