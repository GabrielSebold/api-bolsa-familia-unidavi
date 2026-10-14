import { describe, expect, it } from 'vitest';
import type { Municipio } from '../types/api';
import { buscarMunicipios } from './busca';

const LISTA: Municipio[] = [
  { codigo: '4106902', nome: 'Curitiba', uf: 'PR' },
  { codigo: '4214805', nome: 'Rio do Sul', uf: 'SC' },
  { codigo: '3304557', nome: 'Rio de Janeiro', uf: 'RJ' },
  { codigo: '5300108', nome: 'Brasília', uf: 'DF' },
  { codigo: '3550308', nome: 'São Paulo', uf: 'SP' },
];

describe('buscarMunicipios', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(buscarMunicipios(LISTA, 'brasilia').map((m) => m.codigo)).toEqual(['5300108']);
    expect(buscarMunicipios(LISTA, 'SAO pau').map((m) => m.codigo)).toEqual(['3550308']);
  });

  it('busca por nome parcial, UF e código', () => {
    expect(buscarMunicipios(LISTA, 'rio').map((m) => m.codigo).sort()).toEqual(['3304557', '4214805']);
    expect(buscarMunicipios(LISTA, 'rio sc').map((m) => m.codigo)).toEqual(['4214805']);
    expect(buscarMunicipios(LISTA, '3550').map((m) => m.codigo)).toEqual(['3550308']);
  });

  it('consulta vazia não retorna nada', () => {
    expect(buscarMunicipios(LISTA, '   ')).toEqual([]);
  });

  it('limita a 50 resultados', () => {
    const muitos: Municipio[] = Array.from({ length: 200 }, (_, i) => ({
      codigo: String(1000000 + i),
      nome: `Cidade ${i}`,
      uf: 'SC',
    }));
    expect(buscarMunicipios(muitos, 'cidade')).toHaveLength(50);
  });
});
